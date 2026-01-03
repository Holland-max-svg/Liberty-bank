const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ================= TRANSACTIONS ================= */
const TransactionSchema = new mongoose.Schema({
  id: String,
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ["credit", "debit"] },
  amount: Number,
  currency: { type: String, default: "USD" },
  status: String,
  description: String,
  sender: String,
  receiver: String
});

/* ================= CHAT ================= */
const ChatSchema = new mongoose.Schema({
  sender: { type: String, enum: ["admin", "user"] },
  type: { type: String, enum: ["text", "image"], default: "text" },
  text: String,
  fileUrl: String,
  date: { type: Date, default: Date.now }
});

/* ================= USER ================= */
const UserSchema = new mongoose.Schema({
  /* ===== PERSONAL ===== */
  fullName: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  country: String,
  state: String,
  city: String,
  zipcode: String,
  residentialAddress: String,
  dateOfBirth: Date,

  /* ===== SECURITY ===== */
  password: { type: String }, // ❗ NOT required until activation
  txPin: { type: String },
  isAdmin: { type: Boolean, default: false },

  /* ===== ACTIVATION ===== */
  activationToken: { type: String }, // ✅ IMPORTANT
  resetToken: String,

  /* ===== BANK ===== */
  customerId: String,
  accountNumber: { type: String, unique: true },
  routingNumber: String,
  accountType: { type: String, enum: ["VIP", "Regular"], default: "Regular" },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  status: {
    type: String,
    enum: ["pending", "active", "frozen", "blocked"],
    default: "pending"
  },

  /* ===== MEDIA ===== */
  selfieUrl: String,

  /* ===== DATA ===== */
  transactions: { type: [TransactionSchema], default: [] },
  chat: { type: [ChatSchema], default: [] },

  /* ===== OTP ===== */
  requiresOTP: { type: Boolean, default: false },
  otpCode: String,
  otpExpires: Date,

  createdAt: { type: Date, default: Date.now }
});

/* ================= HASHING ================= */
UserSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("txPin") && this.txPin) {
    const salt = await bcrypt.genSalt(10);
    this.txPin = await bcrypt.hash(this.txPin, salt);
  }

  next();
});

/* ================= METHODS ================= */
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.comparePin = function (pin) {
  return bcrypt.compare(pin, this.txPin);
};

module.exports = mongoose.model("User", UserSchema);
