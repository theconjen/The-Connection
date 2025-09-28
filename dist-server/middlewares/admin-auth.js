function ensureAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }
  if (!req.session.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
}
export {
  ensureAdmin
};
