const router = require("express").Router();
const { getMessages, sendMessage, deleteMessage, reactToMessage } = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);
router.get("/:userId", getMessages);
router.post("/send", sendMessage);
router.delete("/:messageId", deleteMessage);
router.put("/:messageId/react", reactToMessage);

module.exports = router;
