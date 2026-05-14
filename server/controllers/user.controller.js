const User = require('../models/User.model');

// @route GET /api/users/search
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
      isActive: true,
    }).select('name username avatar isOnline lastSeen bio').limit(20);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'name avatar username isOnline lastSeen bio');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, username, language, theme, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio) updates.bio = bio;
    if (username) updates.username = username;
    if (language) updates.language = language;
    if (theme) updates.theme = theme;
    if (avatar) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route GET /api/users/:userId
// Auto saves both users as contacts when chat is opened
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name username avatar bio isOnline lastSeen');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Save both users as contacts automatically
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: req.params.userId }
    });
    await User.findByIdAndUpdate(req.params.userId, {
      $addToSet: { contacts: req.user._id }
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route POST /api/users/block/:userId
exports.blockUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const isBlocked = currentUser.blockedUsers.includes(req.params.userId);
    if (isBlocked) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { blockedUsers: req.params.userId }
      });
      res.json({ success: true, message: 'User unblocked' });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { blockedUsers: req.params.userId }
      });
      res.json({ success: true, message: 'User blocked' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};