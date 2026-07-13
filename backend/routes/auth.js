const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { valid, strength, message } — used both server-side (register)
// and mirrored on the frontend for live feedback.
function checkPasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, strength: 'weak', message: 'Password must be at least 8 characters' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, strength: 'weak', message: 'Password needs at least one letter and one number' };
  }
  if (hasUpper && hasSpecial && password.length >= 10) {
    return { valid: true, strength: 'strong', message: 'Strong password' };
  }
  if ((hasUpper || hasSpecial) && password.length >= 8) {
    return { valid: true, strength: 'medium', message: 'Good — could be stronger with a symbol or capital letter' };
  }
  return { valid: true, strength: 'medium', message: 'Acceptable password' };
}

// GET /api/auth/check-email?email=... — real-time availability check
router.get('/check-email', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.json({ available: false, valid: false, message: 'Enter a valid email address' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ available: false, valid: true, message: 'This email is already registered' });
    }
    res.json({ available: true, valid: true, message: 'Email is available' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address' });

    const strength = checkPasswordStrength(password);
    if (!strength.valid)
      return res.status(400).json({ error: strength.message });

    // Case-insensitive duplicate check — "Test@x.com" and "test@x.com" are the same account
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: 'No account found with this email' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user (protected)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;