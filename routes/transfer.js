const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const transporter = require("../config/mailer");

/* ================= OTP GENERATOR ================= */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ================= REQUEST OTP ================= */
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    if (!user.requiresOTP) {
      return res.json({ success: false, message: "OTP not required for this user" });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    await user.save();

    await transporter.sendMail({
      from: '"Liberty Trust Capital" <no-reply@ltc.com>',
      to: email,
      subject: "Transfer OTP",
      html: `<h2>Your OTP: ${otp}</h2><p>Expires in 5 minutes</p>`
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ================= TRANSFER MONEY ================= */
router.post("/send", async (req, res) => {
  try {
    const {
      userId,
      pin,
      amount,
      receiverName,
      receiverAccount,
      description,
      otp
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Account status
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    // PIN check
    if (!user.txPin) {
      return res.status(400).json({ message: "Transaction PIN not set" });
    }

    const pinMatch = await bcrypt.compare(pin, user.txPin);
    if (!pinMatch) {
      return res.status(400).json({ message: "Invalid transaction PIN" });
    }

    // VIP OTP check
    if (user.requiresOTP) {
      if (!otp) {
        return res.status(400).json({ message: "OTP required for VIP transfer" });
      }

      if (user.otpCode !== otp || user.otpExpires < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Clear OTP after use
      user.otpCode = null;
      user.otpExpires = null;

      // Check balance for VIP
      if (user.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct balance immediately for VIP
      user.balance -= amount;
    }

    // Create transaction object
    const transaction = {
      id: Date.now().toString(),
      date: new Date(),
      type: "debit",
      amount,
      currency: "USD",
      status: user.requiresOTP ? "completed" : "pending", // VIP completed, regular pending
      description: description || "Transfer",
      sender: user.fullName,
      receiver: receiverName + " (" + receiverAccount + ")"
    };

    // For regular users, balance is NOT deducted yet
    user.transactions.unshift(transaction);
    await user.save();

    res.json({
      success: true,
      message: user.requiresOTP
        ? "VIP transfer successful with OTP"
        : "Transfer submitted, pending approval",
      balance: user.balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Transfer failed" });
  }
});

module.exports = router;
