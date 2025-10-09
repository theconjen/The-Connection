import express from "express";
import { storage } from "../storage-optimized.js";
import { isAuthenticated } from "../auth.js";
const router = express.Router();
router.post("/register", isAuthenticated, async (req, res) => {
  try {
    const rawUserId = req.session.userId;
    const userId = typeof rawUserId === "number" ? rawUserId : parseInt(String(rawUserId || ""), 10);
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });
    const pushToken = await storage.savePushToken({
      userId,
      token,
      platform: platform || "unknown",
      lastUsed: /* @__PURE__ */ new Date()
    });
    res.json(pushToken);
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json({ message: "Error registering push token" });
  }
});
let metrics = {
  unregisterAttempts: 0,
  unregisterSuccess: 0,
  unregisterForbidden: 0
};
async function handleUnregister(req, res) {
  try {
    const token = req.body?.token || req.query?.token;
    const rawUserId = req.session.userId;
    const userId = typeof rawUserId === "number" ? rawUserId : parseInt(String(rawUserId || ""), 10);
    metrics.unregisterAttempts++;
    if (!token) return res.status(400).json({ message: "Token required" });
    const result = await storage.deletePushToken(String(token), userId);
    if (result === "forbidden") {
      metrics.unregisterForbidden++;
      console.warn(`User ${userId} attempted to delete token ${String(token)} which is owned by another user`);
      return res.status(403).json({ message: "Token does not belong to user" });
    }
    metrics.unregisterSuccess++;
    console.log(`Push token unregister: user=${userId} token=${String(token)} result=${result}`);
    return res.status(204).end();
  } catch (error) {
    console.error("Error unregistering push token:", error);
    res.status(500).json({ message: "Error unregistering push token" });
  }
}
router.delete("/unregister", isAuthenticated, handleUnregister);
router.post("/unregister", isAuthenticated, handleUnregister);
var pushTokens_default = router;
export {
  pushTokens_default as default
};
