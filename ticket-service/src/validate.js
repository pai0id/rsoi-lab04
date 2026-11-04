function validateTicketCreate(body) {
  const errors = [];
  if (!body || typeof body.username !== "string" || body.username.trim() === "") {
    errors.push({ field: "username", error: "must not be empty" });
  }
  if (!body || typeof body.flightNumber !== "string" || body.flightNumber.trim() === "") {
    errors.push({ field: "flightNumber", error: "must not be empty" });
  }
  if (!body || typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
    errors.push({ field: "price", error: "must be a non-negative number" });
  }
  return errors;
}

module.exports = { validateTicketCreate };
