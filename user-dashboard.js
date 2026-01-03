// ================= BASIC ELEMENTS =================
const chatBox = document.getElementById("userChatMessages");
const openChatBtn = document.getElementById("openChatBtn");
const closeChat = document.getElementById("closeChat");
const chatContainer = document.getElementById("userChatContainer");
const form = document.getElementById("userChatForm");
const userChatInput = document.getElementById("userChatInput");
const userChatFile = document.getElementById("userChatFile");

// ================= USER INFO =================
const user = JSON.parse(localStorage.getItem("user"));
const userId = user._id;

// ================= SOCKET =================
const socket = io("http://localhost:5000");

// ================= OPEN / CLOSE CHAT =================
openChatBtn.onclick = () => {
  chatContainer.classList.remove("hidden");
  socket.emit("joinRoom", userId);
  socket.emit("messageSeen", { userId });
};

closeChat.onclick = () => chatContainer.classList.add("hidden");

// ================= LOAD CHAT =================
async function loadChat() {
  const res = await fetch(`http://localhost:5000/api/chat/${userId}`);
  const data = await res.json();
  if (!data.success) return;

  chatBox.innerHTML = "";
  data.chat.forEach(renderMessage);
  scrollBottom();
}

// ================= RENDER MESSAGE =================
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = msg.sender === "user" ? "msg user" : "msg admin";

  let status = "";
  if (msg.sender === "user") {
    status = msg.seen ? "✔✔" : msg.delivered ? "✔" : "";
  }

  if (msg.type === "image") {
    div.innerHTML = `<img src="${msg.fileUrl}" style="max-width:150px; max-height:150px;"> ${status}`;
  } else {
    div.innerHTML = `<span>${msg.text} ${status}</span>`;
  }

  chatBox.appendChild(div);
}

// ================= SCROLL =================
function scrollBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= SEND MESSAGE =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userChatInput.value.trim();
  const file = userChatFile.files[0];

  if (!text && !file) return;

  // -------- IMAGE MESSAGE --------
  if (file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`http://localhost:5000/api/chat/${userId}/image`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!data.success) return alert("Image upload failed");

      socket.emit("sendMessage", {
        sender: "user",
        userId,
        type: "image",
        fileUrl: data.fileUrl
      });

    } catch (err) {
      console.error(err);
      alert("Image upload error");
    }
  }

  // -------- TEXT MESSAGE --------
  if (text) {
    const res = await fetch(`http://localhost:5000/api/chat/${userId}/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "user", text })
    });

    const data = await res.json();
    if (!data.success) return alert("Message failed");

    socket.emit("sendMessage", { sender: "user", userId, type: "text", text });
  }

  userChatInput.value = "";
  userChatFile.value = "";
});

// ================= SOCKET EVENTS =================
socket.on("newMessage", (msg) => {
  renderMessage(msg);
  scrollBottom();

  if (msg.sender === "admin") {
    socket.emit("messageSeen", { userId });
  }
});

// ================= TYPING =================
userChatInput.addEventListener("input", () => {
  socket.emit("typing", { userId, sender: "user" });
});

socket.on("typing", ({ sender }) => {
  showTyping(sender === "admin" ? "Customer Service" : sender);
});

// ================= TYPING DISPLAY =================
function showTyping(sender) {
  let typing = document.getElementById("typing");
  if (!typing) {
    typing = document.createElement("div");
    typing.id = "typing";
    typing.textContent = `${sender} is typing...`;
    chatBox.appendChild(typing);
    scrollBottom();
  }
  setTimeout(() => typing?.remove(), 1500);
}

// ================= INITIAL LOAD =================
loadChat();

// ================= AUTO REFRESH (fallback) =================
setInterval(loadChat, 5000);
