import { and, sql } from "drizzle-orm";
function whereNotDeleted(table) {
  return sql`${table.deletedAt} IS NULL`;
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
