const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const Story = require("../models/Story.model");

// Get all active stories
router.get("/", protect, async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      isActive: true,
    })
      .populate("user", "name avatar username")
      .sort({ createdAt: -1 });
    res.json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create story
router.post("/", protect, async (req, res) => {
  try {
    const { content, mediaType, backgroundColor, textColor } = req.body;
    // Delete old story first
    await Story.deleteMany({ user: req.user._id });
    const story = await Story.create({
      user: req.user._id,
      content, mediaType, backgroundColor, textColor,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await story.populate("user", "name avatar username");
    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View story
router.post("/:storyId/view", protect, async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.storyId, {
      $addToSet: { viewers: { user: req.user._id, viewedAt: new Date() } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete my story
router.delete("/", protect, async (req, res) => {
  try {
    await Story.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "Story deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;