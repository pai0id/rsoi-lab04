function computePurchaseSplit(balance, price, paidFromBalance) {
  const paidByBonuses = paidFromBalance ? Math.max(0, Math.min(balance, price)) : 0;
  const paidByMoney = price - paidByBonuses;
  return { paidByBonuses, paidByMoney };
}

module.exports = { computePurchaseSplit };
