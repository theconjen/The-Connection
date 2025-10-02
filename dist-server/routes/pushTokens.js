import express from "express";
const router = express.Router();
router.post("/register", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const userId = parseInt(String(req.session.userId));
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Push token is required" });
  }
  try {
    console.log(`Registering push token for user ${userId}: ${token}`);
    res.json({ success: true, message: "Push token registered successfully" });
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json({ message: "Error registering push token" });
  }
});
router.post("/unregister", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const userId = parseInt(String(req.session.userId));
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Push token is required" });
  }
  try {
    console.log(`Unregistering push token for user ${userId}: ${token}`);
    res.json({ success: true, message: "Push token unregistered successfully" });
  } catch (error) {
    console.error("Error unregistering push token:", error);
    res.status(500).json({ message: "Error unregistering push token" });
  }
});
var pushTokens_default = router;
export {
  pushTokens_default as default
};
