const API_URL = "http://localhost:3000";

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } else {
      showError(data.message || "Login failed");
    }
  } catch (error) {
    showError("An error occurred during login");
  }
});

document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (formData.get("password") !== formData.get("confirmPassword")) {
      showError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/login?message=Registration successful";
      } else {
        showError(data.message || "Registration failed");
      }
    } catch (error) {
      showError("An error occurred during registration");
    }
  });

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  const form = document.querySelector("form");
  const existingError = document.querySelector(".error-message");

  if (existingError) {
    existingError.remove();
  }

  form.insertBefore(errorDiv, form.firstChild);
}
