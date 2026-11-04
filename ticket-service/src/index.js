const crypto = require("crypto");
const express = require("express");
const { pool, migrate } = require("./db");
const { validateTicketCreate } = require("./validate");

const app = express();
app.use(express.json());

const TICKET_SELECT = `
  SELECT ticket_uid AS "ticketUid",
         username AS "username",
         flight_number AS "flightNumber",
         price AS "price",
         status AS "status"
  FROM ticket
`;

app.get("/manage/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/api/v1/tickets", async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }
    const { rows } = await pool.query(
      `${TICKET_SELECT} WHERE username = $1 ORDER BY id`,
      [username]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/v1/tickets/:ticketUid", async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }
    const { rows } = await pool.query(
      `${TICKET_SELECT} WHERE ticket_uid = $1 AND username = $2`,
      [req.params.ticketUid, username]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/tickets", async (req, res, next) => {
  try {
    const errors = validateTicketCreate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation error", errors });
    }

    const { username, flightNumber, price } = req.body;
    const ticketUid = crypto.randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO ticket (ticket_uid, username, flight_number, price, status)
       VALUES ($1, $2, $3, $4, 'PAID')
       RETURNING ticket_uid AS "ticketUid", username, flight_number AS "flightNumber", price, status`,
      [ticketUid, username, flightNumber, price]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/v1/tickets/:ticketUid", async (req, res, next) => {
  try {
    const username = req.query.username || req.body.username;
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }

    const { rows } = await pool.query(
      `UPDATE ticket SET status = 'CANCELED'
       WHERE ticket_uid = $1 AND username = $2
       RETURNING ticket_uid AS "ticketUid", username, flight_number AS "flightNumber", price, status`,
      [req.params.ticketUid, username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
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

const PORT = process.env.PORT || 8070;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`ticket-service listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });

module.exports = app;
