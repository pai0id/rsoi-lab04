const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || "http://flight-service:8060";
const TICKET_SERVICE_URL = process.env.TICKET_SERVICE_URL || "http://ticket-service:8070";
const BONUS_SERVICE_URL = process.env.BONUS_SERVICE_URL || "http://bonus-service:8050";

class BonusUnavailableError extends Error {}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  if (res.status === 404) return { status: 404, body: null };
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function requestBonusJson(url, options) {
  let result;
  try {
    result = await requestJson(url, options);
  } catch (err) {
    throw new BonusUnavailableError();
  }
  if (result.status >= 500) throw new BonusUnavailableError();
  return result;
}

function jsonPost(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function listFlights(page, size) {
  const params = new URLSearchParams();
  if (page !== undefined) params.set("page", page);
  if (size !== undefined) params.set("size", size);
  const { body } = await requestJson(`${FLIGHT_SERVICE_URL}/api/v1/flights?${params}`);
  return body;
}

async function getFlight(flightNumber) {
  const { status, body } = await requestJson(
    `${FLIGHT_SERVICE_URL}/api/v1/flights/${encodeURIComponent(flightNumber)}`
  );
  return status === 404 ? null : body;
}

async function listTickets(username) {
  const { body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets?username=${encodeURIComponent(username)}`
  );
  return body || [];
}

async function getTicket(username, ticketUid) {
  const { status, body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets/${encodeURIComponent(ticketUid)}?username=${encodeURIComponent(username)}`
  );
  return status === 404 ? null : body;
}

async function createTicket(payload) {
  const { body } = await requestJson(`${TICKET_SERVICE_URL}/api/v1/tickets`, jsonPost(payload));
  return body;
}

async function cancelTicket(username, ticketUid) {
  const { status, body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets/${encodeURIComponent(ticketUid)}?username=${encodeURIComponent(username)}`,
    { method: "DELETE" }
  );
  return status === 404 ? null : body;
}

async function getPrivilege(username) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege?username=${encodeURIComponent(username)}`
  );
  return body;
}

async function fillPrivilege(username, ticketUid, amount) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/fill`,
    jsonPost({ username, ticketUid, amount })
  );
  return body;
}

async function debitPrivilege(username, ticketUid, amount) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/debit`,
    jsonPost({ username, ticketUid, amount })
  );
  return body;
}

async function cancelPrivilege(username, ticketUid) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/tickets/${encodeURIComponent(ticketUid)}/cancel`,
    jsonPost({ username })
  );
  return body;
}

module.exports = {
  listFlights,
  getFlight,
  listTickets,
  getTicket,
  createTicket,
  cancelTicket,
  getPrivilege,
  fillPrivilege,
  debitPrivilege,
  cancelPrivilege,
  BonusUnavailableError,
};
