import apiClient from '../services/apiClient';
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const LoginRegisterPage = () => {
  const [isRegister, setIsRegister] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const [signupError, setSignupError] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [secretCode, setSecretCode] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔹 Handle Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isLoginSubmitting) return;
    setIsLoginSubmitting(true);
    setLoginError("");
    try {
      const { data } = await apiClient.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      await login(data);
      navigate("/");
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // 🔹 Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSignupMessage("");
    setSignupError(false);
    setIsSignupSubmitting(true);
    try {
      await apiClient.post("/auth/request-otp", {
        email: signupEmail,
      });
      setSignupMessage("OTP sent to your email.");
      setIsOtpSent(true);
      setSignupError(false);
    } catch (err) {
      setSignupMessage(err.response?.data?.message || "Failed to send OTP.");
      setSignupError(true);
      setTimeout(() => {
        setSignupMessage("");
        setSignupError(false);
      }, 3000);
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  // 🔹 Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupMessage("");
    setSignupError(false);
    setIsSignupSubmitting(true);
    try {
      await apiClient.post("/auth/verify-otp", {
        email: signupEmail,
        otp,
      });
      const { data } = await apiClient.post("/auth/signup", {
        name,
        email: signupEmail,
        password: signupPassword,
        phone,
      });
      await login(data);
      navigate("/");
    } catch (err) {
      setSignupMessage(err.response?.data?.message || "Signup failed.");
      setSignupError(true);
      setTimeout(() => {
        setSignupMessage("");
        setSignupError(false);
      }, 3000);
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  return (
    <div className="auth-page relative">
      <div className="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-sm">
        <img src="/logo-2.jpeg" alt="Logo" className="h-10 md:h-16 w-auto object-contain mix-blend-multiply" />
      </div>
      <div className={`container ${isRegister ? "active" : ""}`}>
        {/* 🔹 Login Form */}
        <div className="form-box Login">

          {/* ✨ FIX: Added the .animation wrapper div */}
          <div className="animation">
            <h2>Login</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              {loginError && <p className="error-text">{loginError}</p>}
              <div className="input-box">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <label>Email</label>
              </div>
              <div className="input-box">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <label>Password</label>
              </div>
              <div className="input-box">
                <button type="button" onClick={handleLogin} className="btn" disabled={isLoginSubmitting}>
                  Login
                </button>
              </div>
              <div className="forgot-pass" style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
                <Link to="/forgot-password" style={{ color: "white", fontSize: "14px", textDecoration: "none" }}>Forgot Password?</Link>
              </div>

              {isLoginSubmitting && (
                <div className="flex items-center justify-center gap-2 mt-4 text-white">
                  <div className="spinner"></div>
                  <span className="text-sm font-medium">Logging in...</span>
                </div>
              )}
              <div className="regi-link">
                <p>
                  Don’t have an account?{" "}
                  <a href="#" onClick={() => setIsRegister(true)}>Sign Up</a>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="info-content Login">
          {/* ✨ FIX: Added the .animation wrapper div */}
          <div className="animation">
            <h2>WELCOME BACK!</h2>
            <p>We are happy to have you with us again.</p>
          </div>
        </div>

        {/* 🔹 Register Form */}
        <div className="form-box Register">

          {/* ✨ FIX: Added the .animation wrapper div */}
          <div className="animation">
            <h2>Register</h2>
            <form onSubmit={isOtpSent ? handleSignup : handleRequestOtp}>
              {signupMessage && (
                <p className={signupError ? "error-text" : "success-text"}>
                  {signupMessage}
                </p>
              )}
              <div className="input-box">
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  disabled={isOtpSent}
                />
                <label>Email</label>
              </div>
              {isOtpSent && (
                <>
                  <div className="input-box">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <label>Full Name</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <label>Phone</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                    <label>Password</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <label>OTP</label>
                  </div>
                </>
              )}
              <button type="submit" className="btn" disabled={isSignupSubmitting}>
                {isOtpSent ? "Verify & Register" : "Request OTP"}
              </button>

              {isSignupSubmitting && (
                <div className="flex items-center justify-center gap-2 mt-4 text-white">
                  <div className="spinner"></div>
                  <span className="text-sm font-medium">{isOtpSent ? "Registering..." : "Sending..."}</span>
                </div>
              )}
              <div className="regi-link">
                <p>
                  Already have an account?{" "}
                  <a href="#" onClick={() => setIsRegister(false)}>Sign In</a>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="info-content Register">
          {/* ✨ FIX: Added the .animation wrapper div */}
          <div className="animation">
            <h2>WELCOME!</h2>
            <p>We’re delighted to have you here.</p>
          </div>
        </div>

        {/* 🔹 Curved Shapes */}
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>
      </div>
    </div>
  );
};

export default LoginRegisterPage;