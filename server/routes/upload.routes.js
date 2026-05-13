const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const cloudinary = require("../config/cloudinary");

// @route POST /api/upload/file
router.post("/file", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataUri = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: "auto",
      folder: "connectx",
    });
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      type: req.file.mimetype,
      size: req.file.size,
      name: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
