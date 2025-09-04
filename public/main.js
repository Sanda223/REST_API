const $ = (s) => document.querySelector(s);
const authStatus = $("#authStatus");
const jobResultEl = $("#jobResult");
const output = $("#output");

let token = localStorage.getItem("jwt") || null;

// Update auth label
function renderAuth() {
  authStatus.textContent = token ? "Logged in ✅" : "Not logged in";
}

// Login flow
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
  if (!res.ok) {
    alert("Login failed");
    return;
  }
  const data = await res.json();
  token = data.token;
  localStorage.setItem("jwt", token);
  renderAuth();
});

// Create job
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

  const data = await res.json();
  jobResultEl.textContent = JSON.stringify(data, null, 2);

  if (res.ok && data.output?.imageId) {
    const url = `/v1/images/${data.output.imageId}`;
    output.innerHTML = `<p><a href="${url}" target="_blank">${url}</a></p><img src="${url}" alt="result" />`;
  } else {
    output.textContent = "Job failed.";
  }
});

renderAuth();
