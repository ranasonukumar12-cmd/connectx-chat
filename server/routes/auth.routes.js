const router = require("express").Router();
const { register, login, verifyOTP, refreshToken, logout } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);

module.exports = router;
