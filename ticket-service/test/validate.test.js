const { validateTicketCreate } = require("../src/validate");

test("accepts a valid ticket payload", () => {
  expect(
    validateTicketCreate({ username: "Alex", flightNumber: "AFL031", price: 1500 })
  ).toEqual([]);
});

test("flags missing fields", () => {
  const errors = validateTicketCreate({});
  const fields = errors.map((e) => e.field);
  expect(fields).toEqual(expect.arrayContaining(["username", "flightNumber", "price"]));
});

test("flags negative price", () => {
  const errors = validateTicketCreate({ username: "Alex", flightNumber: "AFL031", price: -1 });
  expect(errors).toEqual([{ field: "price", error: "must be a non-negative number" }]);
});
