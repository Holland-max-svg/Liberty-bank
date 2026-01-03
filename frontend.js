const chatUserSelect = document.getElementById("chatUserSelect");
const chatSection = document.getElementById("chatSection");
const chatBox = document.getElementById("chatBox");
const chatMessage = document.getElementById("chatMessage");
const closeChatBtn = document.getElementById("closeChat");
const chatUserName = document.getElementById("chatUserName");
const usersListDiv = document.getElementById("usersList");

const backendUrl = "http://localhost:5000";
const socket = io(backendUrl);

// ================= LOAD USERS =================
async function loadUsers() {
  const res = await fetch(`${backendUrl}/api/admin/all-users`);
  const users = await res.json();

  usersListDiv.innerHTML = "";
  chatUserSelect.innerHTML = `<option value="">-- Select a User --</option>`;

  users.forEach(user => {
    chatUserSelect.innerHTML += `
      <option value="${user._id}">${user.fullName}</option>
    `;

    const userDiv = document.createElement("div");
    userDiv.className = "user-entry";
    userDiv.dataset.userid = user._id;
    userDiv.innerHTML = `
      <p>Name: ${user.fullName}</p>
      <p>Email: ${user.email}</p>
      <p>Status: ${user.status}</p>
      <button class="blockUserBtn">Block</button>
      <button class="unblockUserBtn">Unblock</button>
      <button class="freezeUserBtn">Freeze</button>
      <button class="unfreezeUserBtn">Unfreeze</button>
    `;
    usersListDiv.appendChild(userDiv);

    userDiv.querySelector(".blockUserBtn").onclick = () =>
      fetch(`${backendUrl}/api/admin/block/${user._id}`, { method: "PUT" }).then(loadUsers);

    userDiv.querySelector(".unblockUserBtn").onclick = () =>
      fetch(`${backendUrl}/api/admin/unblock/${user._id}`, { method: "PUT" }).then(loadUsers);

    userDiv.querySelector(".freezeUserBtn").onclick = () =>
      fetch(`${backendUrl}/api/admin/freeze/${user._id}`, { method: "PUT" }).then(loadUsers);

    userDiv.querySelector(".unfreezeUserBtn").onclick = () =>
      fetch(`${backendUrl}/api/admin/unfreeze/${user._id}`, { method: "PUT" }).then(loadUsers);
  });
}

// ================= SELECT USER =================
chatUserSelect.addEventListener("change", () => {
  const userId = chatUserSelect.value;
  if (!userId) return;

  const selectedName = chatUserSelect.options[chatUserSelect.selectedIndex].text;
  chatUserName.textContent = `Chat with ${selectedName}`;
  chatSection.style.display = "flex";

  loadChat(userId);
  socket.emit("joinRoom", userId);
});

// ================= CLOSE CHAT =================
closeChatBtn.addEventListener("click", () => {
  chatSection.style.display = "none";
});

// ================= SEND TEXT =================
document.getElementById("sendMessage").addEventListener("click", () => {
  const userId = chatUserSelect.value;
  const text = chatMessage.value.trim();
  if (!userId || !text) return alert("Select user and type a message");

  socket.emit("sendMessage", {
    userId,
    sender: "admin",
    type: "text",
    text
  });

  chatMessage.value = "";
});

// ================= SEND IMAGE =================
const chatImageInput = document.createElement("input");
chatImageInput.type = "file";
chatImageInput.accept = "image/*";
document.querySelector(".chat-input").appendChild(chatImageInput);

chatImageInput.addEventListener("change", async () => {
  const userId = chatUserSelect.value;
  const file = chatImageInput.files[0];
  if (!userId || !file) return alert("Select user and choose an image");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(
      `${backendUrl}/api/admin/chat-upload/${userId}`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    if (!data.fileUrl) return alert("Image upload failed");

    socket.emit("sendMessage", {
      userId,
      sender: "admin",
      type: "image",
      fileUrl: data.fileUrl
    });
  } catch (err) {
    console.error(err);
    alert("Image upload error");
  }

  chatImageInput.value = "";
});

// ================= LOAD CHAT =================
async function loadChat(userId) {
  const res = await fetch(`${backendUrl}/api/admin/chat/${userId}`);
  const data = await res.json();

  chatBox.innerHTML = data.messages.map(msg => {
    if (msg.type === "text") {
      return `
        <p class="${msg.sender === "admin" ? "admin" : "user"}">
          <b>${msg.sender}:</b> ${msg.text}
        </p>
      `;
    }

    if (msg.type === "image") {
      return `
        <p class="${msg.sender === "admin" ? "admin" : "user"}">
          <b>${msg.sender}:</b><br>
          <img src="${backendUrl}${msg.fileUrl}" style="max-width:150px;">
        </p>
      `;
    }
  }).join("");

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= SOCKET EVENTS =================
socket.on("newMessage", msg => {
  const userId = chatUserSelect.value;
  if (msg.userId === userId) loadChat(userId);
});

// ================= TYPING =================
chatMessage.addEventListener("input", () => {
  const userId = chatUserSelect.value;
  if (!userId) return;
  socket.emit("typing", { userId, sender: "admin" });
});

socket.on("typing", ({ sender }) => {
  const name = chatUserSelect.options[chatUserSelect.selectedIndex]?.text;
  chatUserName.textContent = `${name} (${sender} is typing...)`;
  setTimeout(() => {
    chatUserName.textContent = `Chat with ${name}`;
  }, 1000);
});

// ================= INITIAL LOAD =================
loadUsers();
