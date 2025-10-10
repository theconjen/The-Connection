import { eq } from "drizzle-orm";
async function softDelete(db, table, idCol, id) {
  return db.update(table).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(idCol, id));
}
var softDelete_default = softDelete;
export {
  softDelete_default as default,
  softDelete
};
