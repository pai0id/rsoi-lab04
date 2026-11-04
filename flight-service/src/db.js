const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "program",
  password: process.env.POSTGRES_PASSWORD || "test",
  database: process.env.POSTGRES_DB || "flights",
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
    CREATE TABLE IF NOT EXISTS airport
    (
        id      SERIAL PRIMARY KEY,
        name    VARCHAR(255),
        city    VARCHAR(255),
        country VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flight
    (
        id              SERIAL PRIMARY KEY,
        flight_number   VARCHAR(20)              NOT NULL,
        datetime        TIMESTAMP WITH TIME ZONE NOT NULL,
        from_airport_id INT REFERENCES airport (id),
        to_airport_id   INT REFERENCES airport (id),
        price           INT                      NOT NULL
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM airport");
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO airport (id, name, city, country) VALUES
        (1, 'Шереметьево', 'Москва', 'Россия'),
        (2, 'Пулково', 'Санкт-Петербург', 'Россия')
    `);
    await pool.query("SELECT setval('airport_id_seq', (SELECT MAX(id) FROM airport))");

    await pool.query(`
      INSERT INTO flight (flight_number, datetime, from_airport_id, to_airport_id, price) VALUES
        ('AFL031', '2021-10-08 20:00:00+00', 2, 1, 1500)
    `);
  }
}

module.exports = { pool, migrate };
