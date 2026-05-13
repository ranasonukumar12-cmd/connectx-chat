/**
 * Message Controller - Send, get, delete, react to messages
 */
const Message = require('../models/Message.model');
const User = require('../models/User.model');
const cloudinary = require('../config/cloudinary');
const { logger } = require('../utils/logger');

// @route GET /api/messages/:userId
// @desc  Get conversation between current user and another user
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser },
      ],
      isDeleted: false,
    })
      .populate('sender', 'name avatar username')
      .populate('replyTo', 'content type sender mediaUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as seen
    await Message.updateMany(
      { sender: userId, receiver: currentUser, seenBy: { $ne: currentUser } },
      { $addToSet: { seenBy: currentUser } }
    );

    res.json({ success: true, messages: messages.reverse(), page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route POST /api/messages/send
// @desc  Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, groupId, content, type, replyTo } = req.body;
    const sender = req.user._id;

    const message = await Message.create({
      sender, content, type: type || 'text',
      receiver: receiverId || null,
      group: groupId || null,
      replyTo: replyTo || null,
    });

    await message.populate('sender', 'name avatar username');
    await message.populate('replyTo', 'content type sender');

    // Emit via socket (handled in socket handler too, but API response first)
    if (req.io) {
      if (receiverId) req.io.to(receiverId.toString()).emit('receive_message', message);
      if (groupId) req.io.to('group_' + groupId).emit('receive_message', message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route DELETE /api/messages/:messageId
// @desc  Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }
    await Message.findByIdAndUpdate(req.params.messageId, {
      isDeleted: true, deletedAt: new Date(), content: 'This message was deleted',
    });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route PUT /api/messages/:messageId/react
// @desc  Add/Remove emoji reaction to a message
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user._id;
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const existingReaction = message.reactions.find(r => r.user.toString() === userId.toString());
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Remove reaction (toggle off)
        message.reactions = message.reactions.filter(r => r.user.toString() !== userId.toString());
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      message.reactions.push({ user: userId, emoji });
    }
    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
