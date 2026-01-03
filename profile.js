document.addEventListener("DOMContentLoaded", () => {
  enforceAuth();

  // -------------------------
  // Logout
  // -------------------------
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  // -------------------------
  // Get Elements
  // -------------------------
  const personalForm = document.getElementById("personalForm");
  const accountForm = document.getElementById("accountForm");
  const securityForm = document.getElementById("securityForm");

  const personalMsg = document.getElementById("personalMsg");
  const securityMsg = document.getElementById("securityMsg");

  // -------------------------
  // Load User Data
  // -------------------------
  let user = JSON.parse(localStorage.getItem("user"));

  // If no user exists, create USA demo user
  if (!user) {
    user = {
      // Personal info
      fullName: "John Doe",
      username: "johndoe123",
      email: "johndoe@example.com",
      phone: "+44 7700 900123",
      address: "123 Main Street, London",
      dob: "1995-06-15",

      // Account details
      customerId: "CUST-" + Math.floor(100000 + Math.random() * 900000),
      accountNumber: "10" + Math.floor(10000000 + Math.random() * 90000000),
      accountType: "Checking",
      accountStatus: "Active",
      currency: "USD",

      // Security
      twoFactor: "enabled"
    };

    localStorage.setItem("user", JSON.stringify(user));
  }

  // -------------------------
  // Populate Personal Info
  // -------------------------
  document.getElementById("fullName").value = user.fullName || "";
  document.getElementById("username").value = user.username || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("address").value = user.address || "";
  document.getElementById("dob").value = user.dob || "";

  // -------------------------
  // Populate Account Details
  // -------------------------
  document.getElementById("customerId").value = user.customerId || "";
  document.getElementById("accountNumber").value = user.accountNumber || "";
  document.getElementById("accountType").value = user.accountType || "";
  document.getElementById("accountStatus").value = user.accountStatus || "Active";
  document.getElementById("currency").value = user.currency || "USD";

  // -------------------------
  // Populate Security
  // -------------------------
  document.getElementById("twoFactor").value = user.twoFactor || "enabled";

  // -------------------------
  // Save Personal Info (Demo)
  // -------------------------
  personalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    user.fullName = document.getElementById("fullName").value;
    user.username = document.getElementById("username").value;
    user.phone = document.getElementById("phone").value;
    user.address = document.getElementById("address").value;

    localStorage.setItem("user", JSON.stringify(user));

    personalMsg.textContent = "Personal information updated successfully (DEMO).";
    personalMsg.style.color = "green";
  });

  // -------------------------
  // Save Security Settings (Demo)
  // -------------------------
  securityForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("password").value;
    const newPin = document.getElementById("pin").value;
    const twoFactor = document.getElementById("twoFactor").value;

    // Demo only – no real auth logic
    user.twoFactor = twoFactor;

    localStorage.setItem("user", JSON.stringify(user));

    document.getElementById("password").value = "";
    document.getElementById("pin").value = "";

    securityMsg.textContent =
      "Security settings updated (DEMO). Password & PIN are not real.";
    securityMsg.style.color = "green";
  });
});
