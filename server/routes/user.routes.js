const router = require("express").Router();
const { searchUsers, getMe, updateProfile, getUserProfile, blockUser } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);
router.get("/search", searchUsers);
router.get("/me", getMe);
router.put("/profile", updateProfile);
router.get("/:userId", getUserProfile);
router.post("/block/:userId", blockUser);

module.exports = router;
