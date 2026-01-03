document.addEventListener("DOMContentLoaded", () => {
  enforceAuth();

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  const tbody = document.getElementById("txBody");
  const txStr = localStorage.getItem("recentTransactions");

  if (!txStr) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No transactions yet.</td></tr>`;
    return;
  }

  const arr = JSON.parse(txStr);
  tbody.innerHTML = "";

  arr.forEach((tx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tx.type}</td>
      <td>${tx.toName || tx.account || "-"}</td>
      <td>${Number(tx.amount).toLocaleString('en-US', { style: 'currency', currency: tx.currency || 'USD' })}</td>
      <td>${tx.status}</td>
      <td>${new Date(tx.date).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
});
