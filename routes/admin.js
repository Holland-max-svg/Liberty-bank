const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const User = require("../models/user");
const transporter = require("../config/mailer");

const DEFAULT_CURRENCY = "USD";
const JWT_SECRET = process.env.JWT_SECRET;


// ================= UPLOAD SETUP =================
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/chat/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, unique + "_" + file.originalname);
  }
});
const chatUpload = multer({ storage: chatStorage });

// ================= HELPERS =================
function generateRoutingNumber() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

async function generateAccountNumber() {
  let num, exists = true;
  while (exists) {
    num = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    exists = await User.exists({ accountNumber: num });
  }
  return num;
}

// ================= DEFAULT ADMIN =================
const DEFAULT_ADMIN = {
  email: "admin@libertytrustcapital.com",
  password: "admin123",
  username: "admin"
};

// ================= ENSURE DEFAULT ADMIN =================
async function ensureAdmin() {
  try {
    const admin = await User.findOne({ email: DEFAULT_ADMIN.email });
    if (!admin) {
      const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
      await new User({
        fullName: "Liberty Trust Capital Admin",
        email: DEFAULT_ADMIN.email,
        username: DEFAULT_ADMIN.username,
        password: hashed,
        isAdmin: true,
        accountNumber: "000000000000",
        balance: 0,
        currency: DEFAULT_CURRENCY,
        status: "active",
        chat: [],
        transactions: []
      }).save();
      console.log("✅ Default admin created");
    }
  } catch (err) {
    console.error("❌ Ensure admin error:", err);
  }
}

// 🔥 RUN ENSURE ADMIN HERE (OPTION ONE)
ensureAdmin();

// ================= ROUTES =================

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, isAdmin: true });
    if (!admin) return res.status(400).json({ success: false, message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      admin: { email: admin.email, fullName: admin.fullName }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// CREATE USER
router.post("/create", chatUpload.single("selfie"), async (req, res) => {
  try {
    const accountNumber = await generateAccountNumber();
    const routingNumber = generateRoutingNumber();
    const activationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      username: req.body.username,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      zipcode: req.body.zipcode,
      dateOfBirth: req.body.dob,
      employmentType: req.body.employment,
      accountType: req.body.accountType,
      selfieUrl: req.file ? `/uploads/chat/${req.file.filename}` : null,
      status: "pending",
      balance: 0,
      currency: DEFAULT_CURRENCY,
      accountNumber,
      routingNumber,
      activationToken,
      chat: [],
      transactions: []
    });

    await user.save();

    await transporter.sendMail({
      from: `"Liberty Trust Capital" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Activate Your Liberty Trust Capital Account",
      html: `
        <h3>Hello ${user.fullName}</h3>
        <p>Your account has been created.</p>
        <a href="https://yourfrontend.com/set-password.html?token=${activationToken}">
          Activate Account
        </a>
      `
    });

    res.json({
      success: true,
      message: "User created and activation email sent",
      accountNumber,
      routingNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "User creation failed" });
  }
});

// GET ALL USERS
router.get("/all-users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// USER STATUS
["freeze", "unfreeze", "block", "unblock"].forEach(action => {
  router.put(`/${action}/:id`, async (req, res) => {
    const map = {
      freeze: "frozen",
      unfreeze: "active",
      block: "blocked",
      unblock: "active"
    };
    await User.findByIdAndUpdate(req.params.id, { status: map[action] });
    res.json({ message: `User ${action}d` });
  });
});

// SEND MONEY
router.put("/send-money/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.status !== "active") {
    return res.status(403).json({ message: "User not active" });
  }

  const amount = Number(req.body.amount);
  if (amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  user.balance += amount;
  user.transactions.unshift({
    id: "tx_" + Date.now(),
    date: new Date(),
    type: "credit",
    amount,
    currency: DEFAULT_CURRENCY,
    status: "successful",
    description: "Admin credit",
    sender: "admin",
    receiver: user.email
  });

  await user.save();
  res.json({ message: "Money sent", balance: user.balance });
});

// CHAT TEXT
router.post("/chat/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  user.chat.push({
    sender: "admin",
    type: "text",
    text: req.body.message,
    date: new Date()
  });
  await user.save();
  res.json({ message: "Message sent" });
});

// CHAT IMAGE
router.post("/chat-upload/:id", chatUpload.single("file"), async (req, res) => {
  const user = await User.findById(req.params.id);
  const compressed = "compressed_" + req.file.filename;
  const output = path.join("uploads/chat", compressed);

  await sharp(req.file.path)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toFile(output);

  fs.unlinkSync(req.file.path);

  user.chat.push({
    sender: "admin",
    type: "image",
    fileUrl: `/uploads/chat/${compressed}`,
    date: new Date()
  });

  await user.save();
  res.json({
    message: "Image sent",
    fileUrl: `/uploads/chat/${compressed}`
  });
});

// GET CHAT
router.get("/chat/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ messages: user ? user.chat : [] });
});

// ✅ OPTION ONE EXPORT (THIS FIXES YOUR ERROR)
module.exports = router;
 


