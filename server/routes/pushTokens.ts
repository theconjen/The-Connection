import express from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { buildErrorResponse } from "../utils/errors";
import { requireSessionUserId, getSessionUserId } from "../utils/session";

const router = express.Router();

router.use(requireAuth);

// Register push token
router.post("/", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { token, platform } = req.body;

    if (!token) return res.status(400).json({ message: "Token required" });

    const pushToken = await storage.savePushToken({
      userId,
      token,
      platform: platform || "unknown",
      lastUsed: new Date(),
    } as any);

    res.json(pushToken);
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json(buildErrorResponse("Error registering push token", error));
  }
});

// Keep legacy endpoint for backwards compatibility
router.post("/register", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { token, platform } = req.body;

    if (!token) return res.status(400).json({ message: "Token required" });

    const pushToken = await storage.savePushToken({
      userId,
      token,
      platform: platform || "unknown",
      lastUsed: new Date(),
    } as any);

    res.json(pushToken);
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json(buildErrorResponse("Error registering push token", error));
  }
});

// Delete push token (logout/uninstall)
let metrics = {
  unregisterAttempts: 0,
  unregisterSuccess: 0,
  unregisterForbidden: 0,
};

async function handleUnregister(req: express.Request, res: express.Response) {
  try {
    const token = req.body?.token || req.query?.token;
    const userId = requireSessionUserId(req);
    metrics.unregisterAttempts++;

    if (!token) return res.status(400).json({ message: "Token required" });

    const result = await storage.deletePushToken(String(token), userId);
    if (result === "forbidden") {
      metrics.unregisterForbidden++;
      console.warn(`User ${userId} attempted to delete token ${String(token)} which is owned by another user`);
      return res.status(403).json({ message: "Token does not belong to user" });
    }

    metrics.unregisterSuccess++;
    console.info(`Token unregistered successfully, result=${result}`);
    return res.status(204).end();
  } catch (error) {
    console.error("Error unregistering push token:", error);
    res.status(500).json(buildErrorResponse("Error unregistering push token", error));
  }
}

// RESTful endpoint: DELETE /:token
router.delete("/:token", async (req, res) => {
  try {
    const token = decodeURIComponent(req.params.token);
    const userId = getSessionUserId(req);
    metrics.unregisterAttempts++;

    if (!token) return res.status(400).json({ message: "Token required" });

    // If no userId (logged out), still try to delete the token
    if (!userId) {
      // For logged-out users, just return success
      // The token will be cleaned up by expiration
      metrics.unregisterSuccess++;
      console.info(`Token unregister attempted without auth - returning success`);
      return res.status(204).end();
    }

    const result = await storage.deletePushToken(String(token), userId);
    if (result === "forbidden") {
      metrics.unregisterForbidden++;
      console.warn(`User ${userId} attempted to delete token ${String(token)} which is owned by another user`);
      return res.status(403).json({ message: "Token does not belong to user" });
    }

    metrics.unregisterSuccess++;
    console.info(`Token unregistered successfully, result=${result}`);
    return res.status(204).end();
  } catch (error) {
    console.error("Error unregistering push token:", error);
    res.status(500).json(buildErrorResponse("Error unregistering push token", error));
  }
});

// Legacy endpoints for backwards compatibility
router.delete("/unregister", handleUnregister);
router.post("/unregister", handleUnregister);

export default router;
