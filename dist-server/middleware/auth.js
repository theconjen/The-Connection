function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.currentUser = {
    id: parseInt(String(req.session.userId)),
    username: req.session.username || "",
    email: req.session.email || "",
    password: "",
    // Not stored in session for security
    displayName: req.session.username || "",
    bio: null,
    avatarUrl: null,
    city: null,
    state: null,
    zipCode: null,
    latitude: null,
    longitude: null,
    onboardingCompleted: false,
    isVerifiedApologeticsAnswerer: false,
    isAdmin: req.session.isAdmin || false,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  };
  next();
}
const isAuthenticated = requireAuth;
export {
  isAuthenticated,
  requireAuth
};
