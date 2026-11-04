const STATUS = { BRONZE: "BRONZE", SILVER: "SILVER", GOLD: "GOLD" };

function computeStatus(balance) {
  if (balance >= 5000) return STATUS.GOLD;
  if (balance >= 1000) return STATUS.SILVER;
  return STATUS.BRONZE;
}

function computeFillAmount(price) {
  return Math.round(price * 0.1);
}

function computeDebitAmount(balance, price) {
  return Math.max(0, Math.min(balance, price));
}

module.exports = { STATUS, computeStatus, computeFillAmount, computeDebitAmount };
