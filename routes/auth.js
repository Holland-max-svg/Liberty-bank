const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "libertytrustcapital_secret";

/* =====================================================
   ACTIVATE ACCOUNT (SET PASSWORD + PIN)
===================================================== */
router.post("/activate", async (req, res) => {
  try {
    const { token, password, pin } = req.body;

    if (!token || !password || !pin) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "PIN must be exactly 4 digits"
      });
    }

    const user = await User.findOne({ activationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired activation token"
      });
    }

    user.password = password;      // hashed by pre-save hook
    user.txPin = pin;              // hashed by pre-save hook
    user.status = "active";        // ✅ ACTIVATE
    user.activationToken = null;   // ✅ REMOVE TOKEN

    await user.save();

    res.json({
      success: true,
      message: "Account activated successfully. You can now login."
    });
  } catch (err) {
    console.error("ACTIVATION ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================================================
   LOGIN (USER)
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account not activated"
      });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: "user" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        accountNumber: user.accountNumber,
        accountType: user.accountType,
        balance: user.balance,
        currency: user.currency,
        status: user.status
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

