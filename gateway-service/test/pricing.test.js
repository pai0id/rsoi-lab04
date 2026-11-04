const { computePurchaseSplit } = require("../src/pricing");

test("pays fully with money when not using balance", () => {
  expect(computePurchaseSplit(500, 1500, false)).toEqual({ paidByBonuses: 0, paidByMoney: 1500 });
});

test("uses full balance when it covers less than the price", () => {
  expect(computePurchaseSplit(500, 1500, true)).toEqual({ paidByBonuses: 500, paidByMoney: 1000 });
});

test("caps bonus usage at the ticket price", () => {
  expect(computePurchaseSplit(5000, 1500, true)).toEqual({ paidByBonuses: 1500, paidByMoney: 0 });
});

test("never goes negative with a zero balance", () => {
  expect(computePurchaseSplit(0, 1500, true)).toEqual({ paidByBonuses: 0, paidByMoney: 1500 });
});
