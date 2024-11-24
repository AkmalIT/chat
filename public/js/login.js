let isLogin = true; 

document.getElementById("toggleForm").addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;

  document.getElementById("name").style.display = isLogin ? "none" : "block";

  document.getElementById("formTitle").textContent = isLogin
    ? "Login"
    : "Register";
  document.getElementById("submitButton").textContent = isLogin
    ? "Login"
    : "Register";

  document.getElementById("toggleText").innerHTML = isLogin
    ? `Don't have an account? <a href="#" id="toggleForm">Register here</a>`
    : `Already have an account? <a href="#" id="toggleForm">Login here</a>`;
});

document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const name = isLogin ? null : document.getElementById("name").value;

  const endpoint = isLogin ? "/auth/login" : "/auth/register"; // Выбираем конечную точку
  const body = isLogin ? { email, password } : { email, password, name };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const { accessToken } = await response.json();
    localStorage.setItem("accessToken", accessToken);
    window.location.href = "/";
  } else {
    const { message } = await response.json();
    alert(message || "An error occurred");
  }
});

document.getElementById("googleOAuth").addEventListener("click", () => {
  window.location.href = "/auth/google";
});
