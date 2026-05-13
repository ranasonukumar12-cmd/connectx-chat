const router = require("express").Router();
const { aiChat, smartReply, translate } = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);
router.post("/chat", aiChat);
router.post("/smart-reply", smartReply);
router.post("/translate", translate);

module.exports = router;
