import { eq, and } from "drizzle-orm";
function whereNotDeleted(table) {
  return eq(table.deletedAt, null);
}
function andNotDeleted(existingCond, table) {
  return and(existingCond, whereNotDeleted(table));
}
var helpers_default = whereNotDeleted;
export {
  andNotDeleted,
  helpers_default as default,
  whereNotDeleted
};
