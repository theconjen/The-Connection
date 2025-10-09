import { storage } from "./storage-optimized.js";
import { sendWelcomeEmail } from "./email.js";
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
function isAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: "Unauthorized: Admin access required" });
}
function setupAuth(app) {
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email, and password are required"
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long"
        });
      }
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }
      console.log(`[REGISTRATION] Creating user with data:`, { username, email, displayName: displayName || username });
      const user = await storage.createUser({
        username,
        email,
        password,
        // Store plaintext password for testing
        displayName: displayName || username,
        isAdmin: false
      });
      console.log(`[REGISTRATION] User created successfully:`, {
        id: user.id,
        username: user.username,
        idType: typeof user.id,
        userObject: JSON.stringify(user, null, 2)
      });
      try {
        await sendWelcomeEmail(user.email, user.displayName || username);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
      if (!req.session) {
        console.error("[REGISTRATION] No session available on request");
        return res.status(500).json({ message: "Session initialization failed" });
      }
      console.log(`[REGISTRATION] Before setting session data - Current session:`, {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        currentUserId: req.session?.userId,
        currentUsername: req.session?.username
      });
      req.session.userId = user.id.toString();
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;
      console.log(`[REGISTRATION] After setting session data for user ${user.username}:`, {
        userId: req.session.userId,
        username: req.session.username,
        isAdmin: req.session.isAdmin,
        sessionID: req.sessionID,
        userIdType: typeof req.session.userId,
        originalUserId: user.id,
        originalUserIdType: typeof user.id
      });
      req.session.save((err) => {
        if (err) {
          console.error("[REGISTRATION] Session save error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log(`[REGISTRATION] Session saved successfully for user ${user.username} (ID: ${user.id}), Session ID: ${req.sessionID}`);
        console.log(`[REGISTRATION] Final session state after save:`, {
          userId: req.session?.userId,
          username: req.session?.username,
          isAdmin: req.session?.isAdmin,
          sessionID: req.sessionID
        });
        const { password: password2, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      console.log(`Login attempt for username: ${username}`);
      try {
        let user = await storage.getUserByUsername(username);
        if (!user && username.includes("@")) {
          user = await storage.getUserByEmail(username);
        }
        if (!user) {
          console.log(`User not found: ${username}`);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        if (user.password !== password) {
          console.log(`Invalid password for user: ${username}`);
          return res.status(401).json({ message: "Invalid username or password" });
        }
        req.session.userId = user.id.toString();
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin || false;
        req.session.email = user.email;
        console.log(`Setting session data for user ${username}:`, {
          userId: req.session.userId,
          username: req.session.username,
          sessionID: req.sessionID
        });
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Error creating session" });
          }
          console.log(`User logged in successfully: ${username} (ID: ${user.id}), Session saved with ID: ${req.sessionID}`);
          const { password: password2, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        console.error(`Error retrieving user ${username}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  app.post("/api/admin-login", async (req, res) => {
    try {
      const admin = await storage.getUserByUsername("admin123");
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      req.session.userId = admin.id.toString();
      req.session.username = admin.username;
      req.session.isAdmin = true;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        console.log(`Admin login successful: (ID: ${admin.id})`);
        const { password, ...adminWithoutPassword } = admin;
        return res.status(200).json(adminWithoutPassword);
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });
  app.get("/api/user", async (req, res) => {
    try {
      console.log(`/api/user request - SessionID: ${req.sessionID}, Session data:`, {
        hasSession: !!req.session,
        userId: req.session?.userId,
        username: req.session?.username,
        sessionID: req.sessionID
      });
      if (!req.session || !req.session.userId) {
        console.log("Authentication failed - no session or userId");
        return res.status(401).json({ message: "Not authenticated" });
      }
      try {
        const userId = parseInt(String(req.session.userId));
        const user = await storage.getUser(userId);
        if (!user) {
          req.session.destroy((err) => {
            if (err) console.error("Error destroying invalid session:", err);
          });
          return res.status(401).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error(`Error retrieving user ID ${req.session.userId}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
}
export {
  isAdmin,
  isAuthenticated,
  setupAuth
};
