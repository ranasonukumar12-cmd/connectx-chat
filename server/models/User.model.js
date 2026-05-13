/**
 * User Model - Stores all user data
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  username: { type: String, unique: true, trim: true, lowercase: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, minlength: 6, select: false },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 150, default: 'Hey there! I am using ConnectX 👋' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpire: { type: Date, select: false },
  refreshToken: { type: String, select: false },
  pushToken: { type: String },
  language: { type: String, default: 'en', enum: ['en', 'hi', 'te'] },
  theme: { type: String, default: 'dark', enum: ['dark', 'light'] },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pinnedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpire;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
