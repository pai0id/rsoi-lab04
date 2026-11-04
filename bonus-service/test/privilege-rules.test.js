const {
  computeStatus,
  computeFillAmount,
  computeDebitAmount,
} = require("../src/privilege-rules");

test("status tiers by balance", () => {
  expect(computeStatus(0)).toBe("BRONZE");
  expect(computeStatus(999)).toBe("BRONZE");
  expect(computeStatus(1000)).toBe("SILVER");
  expect(computeStatus(4999)).toBe("SILVER");
  expect(computeStatus(5000)).toBe("GOLD");
});

test("fill amount is 10% of price, rounded", () => {
  expect(computeFillAmount(1500)).toBe(150);
  expect(computeFillAmount(999)).toBe(100);
});

test("debit amount is capped by balance and never negative", () => {
  expect(computeDebitAmount(500, 1500)).toBe(500);
  expect(computeDebitAmount(2000, 1500)).toBe(1500);
  expect(computeDebitAmount(0, 1500)).toBe(0);
});
