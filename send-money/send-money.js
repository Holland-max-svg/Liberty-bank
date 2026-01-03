document.addEventListener("DOMContentLoaded", () => {
  enforceAuth(); // make sure user is logged in

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const requiresOTP = userData.requiresOTP || false;
  let otpRequested = false;

  // ================= REQUEST OTP =================
  async function requestOTP() {
    try {
      const res = await fetch("/api/request-otp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: userData.email })
      });
      const data = await res.json();
      if (data.success) {
        otpRequested = true;
        alert("OTP sent to your email. Please enter it in the OTP field.");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error requesting OTP");
    }
  }

  // Show OTP input fields for VIP
  if (requiresOTP) {
    document.querySelectorAll(".otp-group").forEach(div => div.style.display = "block");
  }

  // ================= TRANSFER HANDLER =================
  async function handleTransfer(formId, msgId, transferType) {
    const form = document.getElementById(formId);
    const msgDiv = document.getElementById(msgId);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = {};
      const inputs = form.querySelectorAll("input, select, textarea");
      inputs.forEach(inp => formData[inp.id] = inp.value.trim());

      // VIP: request OTP if not done
      if (requiresOTP && !otpRequested) {
        await requestOTP();
        return;
      }

      const body = {
        userId: userData.id,
        pin: formData["txPin"] || formData["domTxPin"] || formData["intlTxPin"],
        amount: Number(formData["amount"] || formData["domAmount"] || formData["intlAmount"]),
        receiverName: formData["toName"] || formData["domName"] || formData["intlName"],
        receiverAccount: formData["account"] || formData["domAccount"] || formData["intlAccount"],
        description: formData["note"] || formData["domMemo"] || formData["intlPurpose"],
        otp: requiresOTP ? (formData["otp"] || formData["domOTP"] || formData["intlOTP"]) : undefined
      };

      try {
        const res = await fetch("/api/transfer/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
          msgDiv.style.color = "green";
          msgDiv.textContent = data.message + ` Balance: ${data.balance} ${userData.currency || "USD"}`;
          form.reset();
        } else {
          msgDiv.style.color = "red";
          msgDiv.textContent = data.message;
        }
      } catch (err) {
        console.error(err);
        msgDiv.style.color = "red";
        msgDiv.textContent = "Transfer failed. Try again.";
      }
    });
  }

  // ================= APPLY HANDLER TO FORMS =================
  handleTransfer("domesticForm", "domMsg", "Domestic Transfer");
  handleTransfer("intlForm", "intlMsg", "International Transfer");
});
