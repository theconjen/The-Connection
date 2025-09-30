import { Router } from "express";
import mvpRoutes from "./mvp.js";
const router = Router();
router.use("/", mvpRoutes);
var feed_default = router;
export {
  feed_default as default
};
