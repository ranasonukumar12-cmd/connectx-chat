/**
 * Story/Status Model - 24hr disappearing stories
 */
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  backgroundColor: { type: String, default: '#1a1a2e' },
  textColor: { type: String, default: '#ffffff' },
  viewers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: Date }],
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24*60*60*1000) },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-delete after 24 hours
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
