require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// ================= CONFIG =================
const DEFAULT_CURRENCY = "USD";
const DEFAULT_ADMIN = {
  email: "admin@libertytrustcapital.com",
  password: "admin123",
  username: "admin",
};

// ================= DB CONNECTION =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      // bufferCommands is true by default
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// ================= CREATE ADMIN =================
const createAdmin = async () => {
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
        transactions: [],
      }).save();
      console.log("✅ Default admin created");
    } else {
      console.log("ℹ️ Admin already exists");
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Create admin error:", err);
    process.exit(1);
  }
};

// ================= RUN =================
(async () => {
  await connectDB();
  await createAdmin();
})();
