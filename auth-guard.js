// Simple auth guard with token expiry check
function enforceAuth() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    // Not logged in, redirect
    window.location.href = "login.html";
    return;
  }

  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check expiry
    if (payload.exp * 1000 < Date.now()) {
      // Token expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Session expired. Please log in again.");
      window.location.href = "login.html";
    }

  } catch (err) {
    // Invalid token
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}

