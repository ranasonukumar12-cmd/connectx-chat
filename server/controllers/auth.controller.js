const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { logger } = require('../utils/logger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const username = email.split('@')[0] + Math.floor(Math.random() * 999);
    const user = await User.create({
      name, email, password, username,
      isVerified: true,
    });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });
    logger.info('New user registered: ' + email);
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to ConnectX!',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isVerified: true,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Register error: ' + error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      isOnline: true,
      lastSeen: new Date(),
    });
    logger.info('User logged in: ' + email);
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error: ' + error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  res.json({ success: true, message: 'Verified successfully!' });
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const newToken = generateToken(user._id);
    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: null,
      isOnline: false,
      lastSeen: new Date(),
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};