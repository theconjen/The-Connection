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
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
    
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
    
    // Return admin user data (excluding password)
    const { password: _, ...userData } = adminUser;
    res.json(userData);
    
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
router.get('/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // Return basic session information
  res.json({
    id: req.session.userId,
    username: req.session.username,
    isAdmin: req.session.isAdmin
  });
});

export default router;