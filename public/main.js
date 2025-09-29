const $ = (s) => document.querySelector(s);
const authStatus = $("#authStatus");
const jobResultEl = $("#jobResult");
const output = $("#output");

let token = localStorage.getItem("jwt") || null;

function renderAuth() {
  authStatus.textContent = token ? "Logged in ✅" : "Not logged in";
}

// ===== Sign Up =====
$("#signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    username: $("#suUsername").value.trim(),
    password: $("#suPassword").value,
    email: $("#suEmail").value.trim()
  };
  const res = await fetch("/v1/auth/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  if (res.ok) {
    alert("Signup successful! Check your email for a confirmation code.");
  } else {
    const err = await res.json().catch(() => ({}));
    alert("Signup failed: " + (err.message || res.statusText));
  }
});

// ===== Confirm =====
$("#confirmForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    username: $("#cUsername").value.trim(),
    code: $("#cCode").value.trim()
  };
  const res = await fetch("/v1/auth/confirm", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  if (res.ok) {
    alert("Account confirmed! You can now log in.");
  } else {
    const err = await res.json().catch(() => ({}));
    alert("Confirmation failed: " + (err.message || res.statusText));
  }
});

// ===== Login =====
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    username: $("#username").value.trim(),
    password: $("#password").value
  };
  const res = await fetch("/v1/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    token = data.token; // Cognito IdToken
    localStorage.setItem("jwt", token);
    renderAuth();
  } else {
    alert("Login failed: " + (data.message || res.statusText));
  }
});

// ===== Create Job =====
$("#jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!token) { alert("Login first"); return; }

  const ops = [
    { op: "resize", width: parseInt($("#w").value, 10), height: parseInt($("#h").value, 10) },
    { op: "blur", sigma: parseInt($("#blur").value, 10) },
    { op: "sharpen", sigma: parseInt($("#sharpen").value, 10) }
  ];

  const body = { sourceId: $("#sourceId").value, ops };
  const res = await fetch("/v1/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  jobResultEl.textContent = JSON.stringify(data, null, 2);

  if (res.ok) {
    const url = data?.output?.url ?? (data?.output?.imageId ? `/v1/images/${data.output.imageId}` : null);
    output.innerHTML = url ? `<img src="${url}" alt="result" />` : "Job created, but no output URL yet.";
  } else {
    output.textContent = "Job failed.";
  }
});

renderAuth();