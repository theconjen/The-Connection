import { Router } from "express";
import { isAdmin } from "../../auth.js";
import { storage } from "../../storage-optimized.js";
const router = Router();
router.use(isAdmin);
router.get("/users", async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});
router.get("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});
router.get("/applications/livestreamer", async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});
router.get("/apologist-scholar-applications", async (req, res, next) => {
  try {
    const applications = await storage.getAllApologistScholarApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});
router.get("/livestreamer-applications/stats", async (req, res, next) => {
  try {
    const stats = await storage.getLivestreamerApplicationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});
router.patch("/applications/livestreamer/:id", async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const applicationId = parseInt(req.params.id);
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }
    const updatedApplication = await storage.updateLivestreamerApplicationStatus(
      applicationId,
      status,
      reviewNotes
    );
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
});
router.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const currentUserId = typeof req.session?.userId === "string" ? parseInt(req.session.userId) : req.session?.userId;
    if (userId === currentUserId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    await storage.deleteUser(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});
var admin_default = router;
export {
  admin_default as default
};
