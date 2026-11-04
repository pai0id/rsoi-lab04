const { parsePageParams } = require("../src/pagination");

test("defaults to page 1, size 10 when missing", () => {
  expect(parsePageParams(undefined, undefined)).toEqual({
    page: 1,
    size: 10,
    limit: 10,
    offset: 0,
  });
});

test("page is 1-indexed", () => {
  expect(parsePageParams("2", "10")).toEqual({
    page: 2,
    size: 10,
    limit: 10,
    offset: 10,
  });
});

test("clamps size to 100", () => {
  expect(parsePageParams("1", "500")).toEqual({
    page: 1,
    size: 100,
    limit: 100,
    offset: 0,
  });
});

test("falls back on invalid input", () => {
  expect(parsePageParams("abc", "-5")).toEqual({
    page: 1,
    size: 10,
    limit: 10,
    offset: 0,
  });
});
