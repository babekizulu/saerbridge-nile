"use strict";

require("dotenv").config();

const { createApp } = require("./app");
const { closePool } = require("./db/pool");
const { startBackground } = require("./modules/nile/background");

function listen() {
  const { app, pool, config, logger } = createApp();
  const stopBackground = startBackground(pool, logger);
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, "saerbridge.api.listening");
  });

  async function shutdown(signal) {
    logger.info({ signal }, "saerbridge.api.shutdown");
    await stopBackground();
    server.close(async () => {
      try {
        await closePool(pool);
      } catch (error) {
        logger.error({ errName: error.name }, "saerbridge.api.pool_close_failed");
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

listen();
