import { Router } from "express";
import crypto from "crypto";
const router = Router();
const feed = [];
const magicStore = {};
router.post("/auth/magic", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const code = Math.floor(1e5 + Math.random() * 9e5).toString();
  const token = crypto.randomBytes(16).toString("hex");
  magicStore[token] = { email, code, expiresAt: Date.now() + 1e3 * 60 * 15 };
  console.log(`[MVP MAGIC] token=${token} code=${code} email=${email}`);
  return res.json({ token, message: "Mock magic link sent (check server console for code)" });
});
router.post("/auth/verify", async (req, res) => {
  const { token, code } = req.body || {};
  const entry = magicStore[token];
  if (!entry) return res.status(400).json({ message: "invalid token" });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ message: "expired" });
  if (entry.code !== String(code)) return res.status(400).json({ message: "invalid code" });
  const user = { id: Math.floor(Math.random() * 1e6), email: entry.email };
  delete magicStore[token];
  return res.json({ user });
});
router.get("/feed", (req, res) => {
  const items = feed.slice().reverse();
  res.json(items);
});
router.post("/posts", (req, res) => {
  const { text, author } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ message: "text required" });
  const id = crypto.randomBytes(8).toString("hex");
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const post = { id, text, createdAt, author };
  feed.push(post);
  console.log("[MVP] New post created:", { id, author });
  console.log("[METRIC] post_created");
  res.status(201).json(post);
});
router.post("/metrics", (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: "name required" });
  console.log("[METRIC]", name);
  res.json({ ok: true });
});
var mvp_default = router;
export {
  mvp_default as default
};
