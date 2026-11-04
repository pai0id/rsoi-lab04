const express = require("express");
const { pool, migrate } = require("./db");
const { parsePageParams } = require("./pagination");

const app = express();
app.use(express.json());

const FLIGHT_SELECT = `
  SELECT f.flight_number AS "flightNumber",
         fa.city || ' ' || fa.name AS "fromAirport",
         ta.city || ' ' || ta.name AS "toAirport",
         to_char(f.datetime, 'YYYY-MM-DD HH24:MI') AS "date",
         f.price AS "price"
  FROM flight f
  JOIN airport fa ON fa.id = f.from_airport_id
  JOIN airport ta ON ta.id = f.to_airport_id
`;

app.get("/manage/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/api/v1/flights", async (req, res, next) => {
  try {
    const { page, size, limit, offset } = parsePageParams(req.query.page, req.query.size);

    const { rows: items } = await pool.query(
      `${FLIGHT_SELECT} ORDER BY f.id LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS count FROM flight");

    res.json({
      page,
      pageSize: items.length,
      totalElements: countRows[0].count,
      items,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/v1/flights/:flightNumber", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${FLIGHT_SELECT} WHERE f.flight_number = $1 ORDER BY f.id LIMIT 1`,
      [req.params.flightNumber]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal error" });
});

const PORT = process.env.PORT || 8060;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`flight-service listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });

module.exports = app;
