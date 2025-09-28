import { Router } from "express";
import { storage } from "../../storage.js";
const router = Router();
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const passwordMatches = password === user.password;
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin || false;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error saving session" });
      }
      const { password: _, ...userData } = user;
      res.json(userData);
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});
router.post("/admin-login", async (req, res) => {
  try {
    const adminUser = await storage.getUserByUsername("admin123");
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    req.session.userId = adminUser.id;
    req.session.username = adminUser.username;
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Error saving session" });
      }
      const { password: _, ...userData } = adminUser;
      res.json(userData);
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login" });
  }
});
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});
router.get("/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const userIdNum = typeof req.session.userId === "string" ? parseInt(req.session.userId, 10) : req.session.userId;
    const user = await storage.getUser(userIdNum);
    if (!user) {
      req.session.destroy(() => {
        res.status(401).json({ message: "User not found" });
      });
      return;
    }
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }
});
var auth_default = router;
export {
  auth_default as default
};
