const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, (req, res) => res.json({ success: true, notifications: [] }));
router.put("/:id/read", protect, (req, res) => res.json({ success: true }));

module.exports = router;
