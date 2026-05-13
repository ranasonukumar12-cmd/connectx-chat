/**
 * Group Model - Group chat rooms
 */
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  avatar: { type: String, default: '' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    mutedUntil: { type: Date },
  }],
  isPublic: { type: Boolean, default: false },
  inviteLink: { type: String, unique: true },
  maxMembers: { type: Number, default: 256 },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
