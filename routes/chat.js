const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// ================= MULTER (IMAGE UPLOAD) =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/libertychat";
    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ================= GET USER CHAT =================
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, chat: user.chat });
  } catch (err) {
    console.error("GET CHAT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SEND TEXT =================
router.post("/:userId/text", async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!sender || !text) return res.status(400).json({ message: "Missing sender or text" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.chat.push({ sender, text, type: "text", date: new Date() });
    await user.save();

    res.json({ success: true, message: "Message sent", chat: user.chat });
  } catch (err) {
    console.error("SEND TEXT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SEND IMAGE =================
router.post("/:userId/image", upload.single("image"), async (req, res) => {
  try {
    const { sender } = req.body;
    if (!sender) return res.status(400).json({ message: "Missing sender" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const fileUrl = `/uploads/libertychat/${req.file.filename}`;
    user.chat.push({ sender, type: "image", fileUrl, date: new Date() });
    await user.save();

    res.json({ success: true, message: "Image sent", fileUrl, chat: user.chat });
  } catch (err) {
    console.error("SEND IMAGE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
