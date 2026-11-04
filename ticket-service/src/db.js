const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "program",
  password: process.env.POSTGRES_PASSWORD || "test",
  database: process.env.POSTGRES_DB || "tickets",
});

async function waitForDb(retries = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function migrate() {
  await waitForDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket
    (
        id            SERIAL PRIMARY KEY,
        ticket_uid    uuid UNIQUE NOT NULL,
        username      VARCHAR(80) NOT NULL,
        flight_number VARCHAR(20) NOT NULL,
        price         INT         NOT NULL,
        status        VARCHAR(20) NOT NULL
            CHECK (status IN ('PAID', 'CANCELED'))
    )
  `);
}

module.exports = { pool, migrate };
