/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { logger } = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error: ' + error.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

module.exports = { protect, adminOnly };
