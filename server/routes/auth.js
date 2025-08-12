import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../services/dbService.js';

const router = express.Router();

// Default users for demo purposes
const DEFAULT_USERS = [
  {
    id: 'admin-001',
    name: 'Admin User',
    role: 'admin',
    pin: '1234',
    isActive: true
  },
  {
    id: 'waiter-001',
    name: 'Waiter 1',
    role: 'waiter',
    pin: '2222',
    isActive: true
  },
  {
    id: 'chef-001',
    name: 'Chef 1',
    role: 'chef',
    pin: '3333',
    isActive: true
  },
  {
    id: 'cashier-001',
    name: 'Cashier 1',
    role: 'cashier',
    pin: '4444',
    isActive: true
  }
];

// Initialize default users
async function initializeUsers() {
  const db = await getDb();
  if (!db.users || db.users.length === 0) {
    db.users = await Promise.all(DEFAULT_USERS.map(async (user) => ({
      ...user,
      pin: await bcrypt.hash(user.pin, 10),
      createdAt: new Date().toISOString()
    })));
    await saveDb(db);
  }
}

// Register admin (one-time setup)
router.post('/register', async (req, res) => {
  const { pin, name, role } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  
  const db = await getDb();
  
  // Initialize users if needed
  if (!db.users) {
    await initializeUsers();
  }
  
  // Check if this is the first admin
  const adminExists = db.users.some(user => user.role === 'admin');
  
  if (adminExists && role === 'admin') {
    return res.status(403).json({ error: 'Admin already exists' });
  }
  
  const hash = await bcrypt.hash(pin, 10);
  const newUser = {
    id: uuidv4(),
    name: name || 'New User',
    role: role || 'waiter',
    pin: hash,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  await saveDb(db);
  
  res.json({ success: true, user: { ...newUser, pin: undefined } });
});

// Login with enhanced device tracking
router.post('/login', async (req, res) => {
  const { pin, deviceId, deviceType, role } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  
  const db = await getDb();
  
  // Initialize users if needed
  if (!db.users || db.users.length === 0) {
    await initializeUsers();
  }
  
  // Find user by PIN
  let authenticatedUser = null;
  for (const user of db.users) {
    if (user.isActive && await bcrypt.compare(pin, user.pin)) {
      authenticatedUser = user;
      break;
    }
  }
  
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  
  // Update user's last login and device info
  authenticatedUser.lastLogin = new Date().toISOString();
  authenticatedUser.deviceId = deviceId;
  authenticatedUser.deviceType = deviceType;
  
  await saveDb(db);
  
  // Create session
  req.session.user = {
    id: authenticatedUser.id,
    name: authenticatedUser.name,
    role: authenticatedUser.role,
    deviceId,
    deviceType,
    loginTime: new Date().toISOString()
  };
  
  res.json({ 
    success: true, 
    user: {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      lastLogin: authenticatedUser.lastLogin
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Session check
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const db = await getDb();
  if (!db.users) {
    await initializeUsers();
  }
  
  const users = db.users.map(user => ({
    id: user.id,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    deviceId: user.deviceId,
    deviceType: user.deviceType,
    createdAt: user.createdAt
  }));
  
  res.json({ users });
});

// Create new user (admin only)
router.post('/users', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { name, role, pin } = req.body;
  if (!name || !role || !pin) {
    return res.status(400).json({ error: 'Name, role, and PIN required' });
  }
  
  const db = await getDb();
  if (!db.users) db.users = [];
  
  const hash = await bcrypt.hash(pin, 10);
  const newUser = {
    id: uuidv4(),
    name,
    role,
    pin: hash,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  await saveDb(db);
  
  res.json({ 
    success: true, 
    user: { ...newUser, pin: undefined } 
  });
});

// Update user (admin only)
router.put('/users/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  const { name, role, pin, isActive } = req.body;
  
  const db = await getDb();
  const userIndex = db.users.findIndex(user => user.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const user = db.users[userIndex];
  
  if (name) user.name = name;
  if (role) user.role = role;
  if (pin) user.pin = await bcrypt.hash(pin, 10);
  if (typeof isActive === 'boolean') user.isActive = isActive;
  
  user.updatedAt = new Date().toISOString();
  
  await saveDb(db);
  
  res.json({ 
    success: true, 
    user: { ...user, pin: undefined } 
  });
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  const db = await getDb();
  
  const userIndex = db.users.findIndex(user => user.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Don't allow deleting the last admin
  const user = db.users[userIndex];
  if (user.role === 'admin') {
    const adminCount = db.users.filter(u => u.role === 'admin' && u.isActive).length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
  }
  
  db.users.splice(userIndex, 1);
  await saveDb(db);
  
  res.json({ success: true });
});

// Change PIN
router.post('/change-pin', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Current PIN and new PIN required' });
  }
  
  const db = await getDb();
  const user = db.users.find(u => u.id === req.session.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const validPin = await bcrypt.compare(currentPin, user.pin);
  if (!validPin) {
    return res.status(401).json({ error: 'Invalid current PIN' });
  }
  
  user.pin = await bcrypt.hash(newPin, 10);
  user.updatedAt = new Date().toISOString();
  
  await saveDb(db);
  
  res.json({ success: true });
});

export default router;
