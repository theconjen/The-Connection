import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../../storage';

const router = Router();

// Regular login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Simple password check (for development only)
    const passwordMatches = password === user.password;
    
    // For production, use bcrypt compare:
    // const passwordMatches = await bcrypt.compare(password, user.password);
    
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Set user in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin || false;
    
    // Save session explicitly to ensure it's stored before responding
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: "Error saving session" });
      }
      
      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.json(userData);
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Admin quick login (for testing only)
router.post('/admin-login', async (req, res) => {
  try {
    // Find an admin user
    const adminUser = await storage.getUserByUsername('admin123');
    
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    
    // Set admin user in session
    req.session.userId = adminUser.id;
    req.session.username = adminUser.username;
    req.session.isAdmin = true;
    
    // Save session explicitly to ensure it's stored before responding
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: "Error saving session" });
      }
      
      // Return admin user data (excluding password)
      const { password: _, ...userData } = adminUser;
      res.json(userData);
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: "Server error during admin login" });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user endpoint
router.get('/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
  // Get full user details from database. Coerce session userId to number.
  const userIdNum = typeof req.session.userId === 'string' ? parseInt(req.session.userId, 10) : req.session.userId;
  const user = await storage.getUser(userIdNum as number);
    
    if (!user) {
      // Session contains a userId but user doesn't exist
      req.session.destroy(() => {
        res.status(401).json({ message: "User not found" });
      });
      return;
    }
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: "Error fetching user details" });
  }
});

export default router;