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
  const [needsSecretCode, setNeedsSecretCode] = useState(false);
  const [loginSecretCode, setLoginSecretCode] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

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
      const response = await apiClient.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
        secretCode: needsSecretCode ? loginSecretCode : undefined,
      });

      if (response.status === 202 && response.data.needsSecretCode) {
        setNeedsSecretCode(true);
        setLoginMessage(response.data.message);
        // Clear the message after 2 seconds so it disappears
        setTimeout(() => setLoginMessage(""), 2000);
        return;
      }

      await login(response.data);
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
              {loginMessage && (
                <div style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#ffd43b',
                  color: '#136b56',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                  zIndex: 10000,
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'center',
                  width: 'min(90%, 350px)',
                  border: '3px solid #136b56',
                  animation: 'popInCentered 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                  <span 
                    onClick={() => setLoginMessage("")}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '10px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </span>
                  {loginMessage}
                </div>
              )}
              {loginError && (
                <p className="error-text" style={{ marginBottom: "10px" }}>
                  {loginError}
                </p>
              )}
              <div className="input-box">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={needsSecretCode}
                  placeholder=" "
                />
                <label>Email</label>
              </div>
              <div className="input-box">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={needsSecretCode}
                  placeholder=" "
                />
                <label>Password</label>
              </div>

              {needsSecretCode && (
                <div className="input-box" style={{ marginTop: "35px" }}>
                  <input
                    type="text"
                    value={loginSecretCode}
                    onChange={(e) => setLoginSecretCode(e.target.value)}
                    required
                    autoFocus
                    placeholder=" "
                  />
                  <label>Admin Secret Code</label>
                </div>
              )}

              <div className="input-box" style={{ marginTop: "30px" }}>
                <button 
                  type="button" 
                  onClick={handleLogin} 
                  className="btn" 
                  disabled={isLoginSubmitting}
                >
                  {isLoginSubmitting ? "Processing..." : needsSecretCode ? "Verify & Login" : "Login"}
                </button>
              </div>
              <div className="forgot-pass" style={{ textAlign: "right", marginTop: "15px", marginBottom: "15px" }}>
                <Link to="/forgot-password" style={{ color: "white", fontSize: "14px", textDecoration: "none" }}>Forgot Password?</Link>
              </div>

              {isLoginSubmitting && !needsSecretCode && (
                <div className="flex items-center justify-center gap-2 mt-4 text-white">
                  <div className="spinner"></div>
                  <span className="text-sm font-medium">Verifying...</span>
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
                  placeholder=" "
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
                      placeholder=" "
                    />
                    <label>Full Name</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Phone</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Password</label>
                  </div>
                  <div className="input-box">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>OTP</label>
                  </div>
                </>
              )}
              <div className="input-box" style={{ marginTop: "30px" }}>
                <button type="submit" className="btn" disabled={isSignupSubmitting}>
                  {isOtpSent ? "Verify & Register" : "Request OTP"}
                </button>
              </div>

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