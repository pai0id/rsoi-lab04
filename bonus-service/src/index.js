const express = require("express");
const { pool, migrate } = require("./db");
const { computeStatus } = require("./privilege-rules");

const app = express();
app.use(express.json());

async function getOrCreatePrivilege(username) {
  await pool.query(
    `INSERT INTO privilege (username, status, balance)
     VALUES ($1, 'BRONZE', 0)
     ON CONFLICT (username) DO NOTHING`,
    [username]
  );
  const { rows } = await pool.query("SELECT * FROM privilege WHERE username = $1", [username]);
  return rows[0];
}

async function getHistory(privilegeId) {
  const { rows } = await pool.query(
    `SELECT ticket_uid AS "ticketUid",
            to_char(datetime, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "date",
            balance_diff AS "balanceDiff",
            operation_type AS "operationType"
     FROM privilege_history
     WHERE privilege_id = $1
     ORDER BY datetime DESC, id DESC`,
    [privilegeId]
  );
  return rows;
}

function requireUsername(req, res) {
  const username = req.query.username || req.body.username;
  if (!username) {
    res.status(400).json({ message: "username is required" });
    return null;
  }
  return username;
}

app.get("/manage/health", (req, res) => {
  res.sendStatus(200);
});

app.get("/api/v1/privilege", async (req, res, next) => {
  try {
    const username = requireUsername(req, res);
    if (!username) return;

    const privilege = await getOrCreatePrivilege(username);
    const history = await getHistory(privilege.id);

    res.json({ balance: privilege.balance, status: privilege.status, history });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/privilege/fill", async (req, res, next) => {
  try {
    const { username, ticketUid, amount } = req.body;
    if (!username || !ticketUid || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "username, ticketUid and non-negative amount are required" });
    }

    const privilege = await getOrCreatePrivilege(username);
    const newBalance = privilege.balance + amount;
    const newStatus = computeStatus(newBalance);

    await pool.query("UPDATE privilege SET balance = $1, status = $2 WHERE id = $3", [
      newBalance,
      newStatus,
      privilege.id,
    ]);
    await pool.query(
      `INSERT INTO privilege_history (privilege_id, ticket_uid, datetime, balance_diff, operation_type)
       VALUES ($1, $2, now(), $3, 'FILL_IN_BALANCE')`,
      [privilege.id, ticketUid, amount]
    );

    res.json({ balance: newBalance, status: newStatus });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/privilege/debit", async (req, res, next) => {
  try {
    const { username, ticketUid, amount } = req.body;
    if (!username || !ticketUid || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "username, ticketUid and non-negative amount are required" });
    }

    const privilege = await getOrCreatePrivilege(username);
    const debited = Math.max(0, Math.min(privilege.balance, amount));
    const newBalance = privilege.balance - debited;
    const newStatus = computeStatus(newBalance);

    await pool.query("UPDATE privilege SET balance = $1, status = $2 WHERE id = $3", [
      newBalance,
      newStatus,
      privilege.id,
    ]);
    await pool.query(
      `INSERT INTO privilege_history (privilege_id, ticket_uid, datetime, balance_diff, operation_type)
       VALUES ($1, $2, now(), $3, 'DEBIT_THE_ACCOUNT')`,
      [privilege.id, ticketUid, -debited]
    );

    res.json({ balance: newBalance, status: newStatus, debited });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/privilege/tickets/:ticketUid/cancel", async (req, res, next) => {
  try {
    const username = requireUsername(req, res);
    if (!username) return;
    const { ticketUid } = req.params;

    const privilege = await getOrCreatePrivilege(username);
    const { rows: historyRows } = await pool.query(
      "SELECT * FROM privilege_history WHERE privilege_id = $1 AND ticket_uid = $2 ORDER BY id",
      [privilege.id, ticketUid]
    );

    // Only the original purchase entry (one row) is reversible; a second row
    // means this ticket's bonus operation was already reversed - keep it idempotent.
    if (historyRows.length !== 1) {
      return res.json({ balance: privilege.balance, status: privilege.status });
    }

    const original = historyRows[0];
    let balance = privilege.balance;
    let reversalType;
    let reversalDiff;
    if (original.operation_type === "FILL_IN_BALANCE") {
      const amount = Math.min(balance, original.balance_diff);
      balance = Math.max(0, balance - amount);
      reversalType = "DEBIT_THE_ACCOUNT";
      reversalDiff = -amount;
    } else {
      const amount = Math.abs(original.balance_diff);
      balance = balance + amount;
      reversalType = "FILL_IN_BALANCE";
      reversalDiff = amount;
    }
    const status = computeStatus(balance);

    await pool.query("UPDATE privilege SET balance = $1, status = $2 WHERE id = $3", [
      balance,
      status,
      privilege.id,
    ]);
    await pool.query(
      `INSERT INTO privilege_history (privilege_id, ticket_uid, datetime, balance_diff, operation_type)
       VALUES ($1, $2, now(), $3, $4)`,
      [privilege.id, ticketUid, reversalDiff, reversalType]
    );

    res.json({ balance, status });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal error" });
});

const PORT = process.env.PORT || 8050;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`bonus-service listening on ${PORT}`));
  })
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });

module.exports = app;
