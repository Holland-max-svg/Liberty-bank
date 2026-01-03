// ================= LOAD ENV =================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");

// ✅ ROUTES
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin"); // Option 1: admin.js exports router directly
const transferRoutes = require("./routes/transfer");
const chatRoutes = require("./routes/chat");

// ✅ SOCKET
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// ================= MIDDLEWARE =================

app.use(cors({
  origin: [
    "https://holland-max-svg.github.io"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);   // Option 1
app.use("/api/transfer", transferRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend running" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // 1️⃣ Connect to MongoDB
    await connectDB();

    // 2️⃣ Initialize Socket.IO (no await!)
    initSocket(server);

    // 3️⃣ Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
