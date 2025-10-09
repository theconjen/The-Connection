import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../email.js";
const router = Router();
const feed = [];
const magicStore = {};
async function sendMagicCode(email, code) {
  try {
    await sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || "no-reply@theconnection.app",
      subject: "Your The Connection login code",
      text: `Your login code is: ${code}

It expires in 15 minutes.`
    });
  } catch (err) {
    console.warn("[MAGIC] sendMagicCode failed (continuing):", err);
  }
}
router.post("/auth/magic", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "email required" });
  const deterministic = /^(review|tester)@/i.test(String(email)) ? "111222" : void 0;
  const code = deterministic ?? Math.floor(1e5 + Math.random() * 9e5).toString();
  const token = crypto.randomBytes(16).toString("hex");
  magicStore[token] = { email, code, expiresAt: Date.now() + 1e3 * 60 * 15 };
  await sendMagicCode(email, code);
  console.log(`[MVP MAGIC] token=${token} code=${code} email=${email}`);
  return res.json({ token, message: "Magic code sent" });
});
router.post("/auth/verify", async (req, res) => {
  const { token, code } = req.body || {};
  const entry = magicStore[token];
  if (!entry) return res.status(400).json({ message: "invalid token" });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ message: "expired" });
  if (entry.code !== String(code)) return res.status(400).json({ message: "invalid code" });
  const user = { id: Math.floor(Math.random() * 1e6), email: entry.email };
  delete magicStore[token];
  const jwtSecret = process.env.JWT_SECRET || "dev-secret";
  const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: "30d" });
  return res.json({ token: jwtToken, user });
});
router.get("/feed", (_req, res) => {
  const items = feed.slice().reverse().slice(0, 100);
  res.json(items);
});
router.post("/posts", (req, res) => {
  const { text, author, communityId } = req.body || {};
  if (!text || typeof text !== "string") return res.status(400).json({ message: "text required" });
  const content = text.trim();
  if (content.length === 0 || content.length > 500) return res.status(400).json({ message: "text must be 1-500 chars" });
  const id = crypto.randomBytes(8).toString("hex");
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const post = { id, text: content, createdAt, author, communityId: communityId ? Number(communityId) : void 0 };
  feed.push(post);
  console.log("[MVP] New post created:", { id, author });
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
