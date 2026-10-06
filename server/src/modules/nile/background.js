"use strict";
const OpenAI = require("openai");
const { runOne } = require("./worker");
const { runMaintenance } = require("../../maintenance");

// A small pilot can share one Railway container. Larger installations can run
// npm run worker separately; database locks prevent duplicate claims.
function startBackground(pool, logger) {
  let stopped = false;
  let timer;
  let active = Promise.resolve();
  let lastMaintenance = 0;
  const enabled = process.env.NILE_RUN_WORKER === "true";
  const provider = enabled && process.env.OPENAI_ENABLED === "true" && process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: 60000 })
    : null;
  async function cycle() {
    try {
      if (provider) await runOne(pool, provider);
      if (Date.now() - lastMaintenance > 3600000) {
        await runMaintenance();
        lastMaintenance = Date.now();
      }
    } catch (error) {
      logger.error({ errName: error.name }, "nile.background.failed");
    }
    if (!stopped) timer = setTimeout(() => { active = cycle(); }, 3000);
  }
  if (process.env.NILE_BACKGROUND_ENABLED === "true") active = cycle();
  return async () => { stopped = true; clearTimeout(timer); await active; };
}
module.exports = { startBackground };
