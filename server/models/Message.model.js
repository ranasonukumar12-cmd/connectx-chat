/**
 * Message Model - Individual messages in conversations
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'voice', 'emoji', 'system'],
    default: 'text',
  },
  mediaUrl: { type: String },
  mediaName: { type: String },
  mediaSize: { type: Number },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
  }],
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  isEncrypted: { type: Boolean, default: false },
  scheduledAt: { type: Date },
  isSent: { type: Boolean, default: true },
}, { timestamps: true });

// Index for fast queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
