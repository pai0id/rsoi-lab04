function parsePageParams(rawPage, rawSize) {
  let page = Number.parseInt(rawPage, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let size = Number.parseInt(rawSize, 10);
  if (!Number.isFinite(size) || size < 1) size = 10;
  if (size > 100) size = 100;

  const limit = size;
  const offset = (page - 1) * size;

  return { page, size, limit, offset };
}

module.exports = { parsePageParams };
