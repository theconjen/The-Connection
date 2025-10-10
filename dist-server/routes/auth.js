import { Router } from "express";
import authRoutes from "./api/auth.js";
import accountRoutes from "./account.js";
import userRoutes from "./api/user.js";
import userSettingsRoutes from "./userSettingsRoutes.js";
const router = Router();
router.use("/api", authRoutes);
router.use("/api", accountRoutes);
router.use("/api/user", userRoutes);
router.use("/api/user", userSettingsRoutes);
var auth_default = router;
export {
  auth_default as default
};
