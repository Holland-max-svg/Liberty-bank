const { Server } = require("socket.io");
const User = require("./models/User");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    // ================= JOIN ROOM =================
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    // ================= SEND MESSAGE =================
    socket.on("sendMessage", async (data) => {
      const { room, sender, message, type } = data;

      // Save message in user's chat
      try {
        const user = await User.findById(room);
        if (user) {
          user.chat.push({
            sender,
            type: type || "text",
            text: message,
            date: new Date()
          });
          await user.save();
        }
      } catch (err) {
        console.error("Socket chat save error:", err);
      }

      // Emit to everyone in the room
      io.to(room).emit("receiveMessage", data);
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

module.exports = initSocket;
