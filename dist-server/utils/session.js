function normalizeId(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) {
    throw new Error("Invalid ID");
  }
  return n;
}
function getUserId(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Invalid or missing user ID in session");
  }
  return n;
}
export {
  getUserId,
  normalizeId
};
