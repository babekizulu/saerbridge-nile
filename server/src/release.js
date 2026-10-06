"use strict";
require("dotenv").config();
const { migrateUp } = require("./db/migrate");
const { seed } = require("./db/seed");
const { createPool, closePool } = require("./db/pool");
const { seedDemo } = require("./modules/nile/seed");
async function release() {
  await migrateUp();
  await seed(process.env.DATABASE_URL, { missingOnly: true });
  if (process.env.NILE_DEMO_SEED === "true") {
    const pool = createPool(process.env.DATABASE_URL);
    try { await seedDemo(pool); } finally { await closePool(pool); }
  }
  console.log("Release migrations and requested seed completed");
}
release().catch((error) => { console.error("Release failed:", error.code || error.name); process.exitCode = 1; });
