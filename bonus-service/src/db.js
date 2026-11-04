const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "program",
  password: process.env.POSTGRES_PASSWORD || "test",
  database: process.env.POSTGRES_DB || "privileges",
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
    CREATE TABLE IF NOT EXISTS privilege
    (
        id       SERIAL PRIMARY KEY,
        username VARCHAR(80) NOT NULL UNIQUE,
        status   VARCHAR(80) NOT NULL DEFAULT 'BRONZE'
            CHECK (status IN ('BRONZE', 'SILVER', 'GOLD')),
        balance  INT NOT NULL DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS privilege_history
    (
        id             SERIAL PRIMARY KEY,
        privilege_id   INT REFERENCES privilege (id),
        ticket_uid     uuid        NOT NULL,
        datetime       TIMESTAMP   NOT NULL,
        balance_diff   INT         NOT NULL,
        operation_type VARCHAR(20) NOT NULL
            CHECK (operation_type IN ('FILL_IN_BALANCE', 'DEBIT_THE_ACCOUNT'))
    )
  `);
}

module.exports = { pool, migrate };
