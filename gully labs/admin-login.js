const loginBtn = document.getElementById("adminLoginBtn");
const passwordInput = document.getElementById("adminPassword");
const loginMsg = document.getElementById("adminLoginMsg");

async function login() {
  const password = passwordInput.value.trim();

  if (!password) {
    loginMsg.textContent = "Enter admin password.";
    loginMsg.style.color = "red";
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    loginMsg.textContent = "";

    const response = await fetch("http://localhost:5000/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("Backend did not return valid JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("adminLoggedIn", "true");

    window.location.href = "admin.html";
  } catch (err) {
    console.error("Admin login error:", err);
    loginMsg.textContent = err.message || "Cannot connect to backend.";
    loginMsg.style.color = "red";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

if (passwordInput) {
  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      login();
    }
  });
}