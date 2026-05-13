/**
 * Socket.IO Event Handler
 * Manages all real-time events: messaging, typing, online status, calls
 */
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Message = require("../models/Message.model");
const { logger } = require("../utils/logger");

// Track online users: userId -> socketId
const onlineUsers = new Map();

const initSocket = (io) => {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name avatar username");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    logger.info("User connected: " + socket.user.name + " (" + userId + ")");

    // ── ONLINE STATUS ──
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit("user_online", { userId, timestamp: new Date() });

    // Join personal room for direct messages
    socket.join(userId);

    // ── JOIN GROUP ROOMS ──
    socket.on("join_group", (groupId) => {
      socket.join("group_" + groupId);
      logger.info(socket.user.name + " joined group: " + groupId);
    });

    socket.on("leave_group", (groupId) => {
      socket.leave("group_" + groupId);
    });

    // ── SEND MESSAGE ──
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, groupId, content, type, replyTo, tempId } = data;
        const message = await Message.create({
          sender: userId,
          content, type: type || "text",
          receiver: receiverId || null,
          group: groupId || null,
          replyTo: replyTo || null,
        });
        await message.populate("sender", "name avatar username");
        await message.populate("replyTo", "content type sender");

        // Send to receiver or group
        if (receiverId) {
          io.to(receiverId).emit("receive_message", { ...message.toObject(), tempId });
          socket.emit("message_sent", { ...message.toObject(), tempId });
        } else if (groupId) {
          io.to("group_" + groupId).emit("receive_message", { ...message.toObject(), tempId });
        }
      } catch (err) {
        socket.emit("message_error", { error: err.message });
      }
    });

    // ── TYPING INDICATORS ──
    socket.on("typing", ({ receiverId, groupId }) => {
      const data = { userId, name: socket.user.name };
      if (receiverId) io.to(receiverId).emit("typing", data);
      if (groupId) socket.to("group_" + groupId).emit("typing", data);
    });

    socket.on("stop_typing", ({ receiverId, groupId }) => {
      const data = { userId };
      if (receiverId) io.to(receiverId).emit("stop_typing", data);
      if (groupId) socket.to("group_" + groupId).emit("stop_typing", data);
    });

    // ── MESSAGE SEEN ──
    socket.on("seen", async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { $addToSet: { seenBy: userId } });
        io.to(senderId).emit("message_seen", { messageId, seenBy: userId });
      } catch (err) {
        logger.error("Seen error: " + err.message);
      }
    });

    // ── VOICE/VIDEO CALLS (WebRTC Signaling) ──
    socket.on("call_user", ({ receiverId, callType, signalData }) => {
      io.to(receiverId).emit("incoming_call", {
        callerId: userId,
        callerName: socket.user.name,
        callerAvatar: socket.user.avatar,
        callType, // 'voice' or 'video'
        signalData,
      });
    });

    socket.on("call_accepted", ({ callerId, signalData }) => {
      io.to(callerId).emit("call_accepted", { signalData });
    });

    socket.on("call_rejected", ({ callerId }) => {
      io.to(callerId).emit("call_rejected", { rejectedBy: userId });
    });

    socket.on("call_ended", ({ receiverId }) => {
      io.to(receiverId).emit("call_ended", { endedBy: userId });
    });

    // ── ICE CANDIDATES (WebRTC) ──
    socket.on("ice_candidate", ({ receiverId, candidate }) => {
      io.to(receiverId).emit("ice_candidate", { candidate });
    });

    // ── DISCONNECT ──
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit("user_offline", { userId, lastSeen: new Date() });
      logger.info("User disconnected: " + socket.user.name);
    });
  });

  return io;
};

module.exports = { initSocket, onlineUsers };
