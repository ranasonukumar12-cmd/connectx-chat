const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const Group = require("../models/Group.model");
const Message = require("../models/Message.model");
const { v4: uuidv4 } = require("uuid");

// Get all groups for current user
router.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find({
      "members.user": req.user._id,
      isActive: true,
    })
      .populate("members.user", "name avatar username isOnline")
      .populate("lastMessage")
      .sort({ lastActivity: -1 });
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new group
router.post("/create", protect, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });
    const group = await Group.create({
      name, description,
      creator: req.user._id,
      admins: [req.user._id],
      members: [
        { user: req.user._id, role: "owner" },
        ...(members || []).map(id => ({ user: id, role: "member" })),
      ],
      inviteLink: uuidv4(),
    });
    await group.populate("members.user", "name avatar username");
    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group messages
router.get("/:groupId/messages", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      group: req.params.groupId,
      isDeleted: false,
    })
      .populate("sender", "name avatar username")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send group message
router.post("/:groupId/messages", protect, async (req, res) => {
  try {
    const { content, type } = req.body;
    const message = await Message.create({
      sender: req.user._id,
      group: req.params.groupId,
      content, type: type || "text",
    });
    await message.populate("sender", "name avatar username");
    await Group.findByIdAndUpdate(req.params.groupId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });
    if (req.io) {
      req.io.to("group_" + req.params.groupId).emit("receive_message", message);
    }
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member to group
router.post("/:groupId/add-member", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    const isMember = group.members.some(m => m.user.toString() === userId);
    if (isMember) return res.status(400).json({ error: "User already in group" });
    group.members.push({ user: userId, role: "member" });
    await group.save();
    res.json({ success: true, message: "Member added!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave group
router.post("/:groupId/leave", protect, async (req, res) => {
  try {
    await Group.findByIdAndUpdate(req.params.groupId, {
      $pull: { members: { user: req.user._id } },
    });
    res.json({ success: true, message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single group
router.get("/:groupId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members.user", "name avatar username isOnline")
      .populate("creator", "name avatar");
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;