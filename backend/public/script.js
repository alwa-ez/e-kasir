const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const statusText = document.getElementById("statusText");
const logoutBtn = document.getElementById("logoutBtn");

async function updateSessionInfo() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();

    if (!response.ok || !data.loggedIn) {
      statusText.textContent = "Belum login";
      logoutBtn.disabled = true;
      return;
    }

    statusText.textContent = `Login sebagai: ${data.user.username}`;
    logoutBtn.disabled = false;
    window.location.href = "/dashboard.html";
  } catch (error) {
    statusText.textContent = "Tidak dapat terhubung ke server";
    logoutBtn.disabled = true;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);

  const payload = {
    username: formData.get("username"),
    password: formData.get("password")
  };

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  alert(data.message);

  if (response.ok) {
    loginForm.reset();
    window.location.href = "/dashboard.html";
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);

  const payload = {
    username: formData.get("username"),
    password: formData.get("password")
  };

  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  alert(data.message);

  if (response.ok) {
    registerForm.reset();
  }
});

logoutBtn.addEventListener("click", async () => {
  const response = await fetch("/api/logout", { method: "POST" });
  const data = await response.json();
  alert(data.message);
  updateSessionInfo();
});

updateSessionInfo();
