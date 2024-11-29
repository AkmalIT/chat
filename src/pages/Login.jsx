import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContent";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleGoogleAuth = useCallback(
    async (code) => {
      try {
        const user = await googleLogin(code);
        console.log(user);
        navigate("/"); 
      } catch (error) {
        console.error("Google login error:", error);
      }
    },
    [googleLogin, navigate]
  );

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleGoogleAuth(code); 
    }
  }, [searchParams, handleGoogleAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/"); 
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = `http://localhost:3000/auth/google`;
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-submit-btn">
            Login
          </button>
        </form>
        <button onClick={handleGoogleLogin} className="google-login-btn">
          <img src="/icons8-google.svg" alt="Google" className="google-icon" />
          Login with Google
        </button>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
