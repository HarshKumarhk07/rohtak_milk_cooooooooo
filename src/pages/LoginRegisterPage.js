import apiClient from '../services/apiClient';
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
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
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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
      const data = err.response?.data || {};
      let msg = data.message || "Login failed";
      // Admin progressive-lockout responses include extra context.
      if (data.locked) {
        // `message` already states the remaining lock time; reset the passkey step.
        setNeedsSecretCode(false);
        setLoginSecretCode("");
      } else if (typeof data.attemptsRemaining === "number") {
        msg += ` (${data.attemptsRemaining} attempt${data.attemptsRemaining === 1 ? "" : "s"} left before lock)`;
      }
      setLoginError(msg);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // 🔹 Handle Google Login
  const handleGoogleLogin = async () => {
    if (isGoogleSubmitting || isLoginSubmitting) return;
    setIsGoogleSubmitting(true);
    setLoginError("");
    try {
      // 1. Sign in with Google via Firebase popup.
      const result = await signInWithPopup(auth, googleProvider);
      // 2. Get the Firebase ID token to send to our backend.
      const idToken = await result.user.getIdToken();
      // 3. We only need the token once — our own JWT is the real session, so
      //    sign out of Firebase to avoid keeping a separate lingering session.
      await signOut(auth);
      // 4. Exchange the Firebase token for our app's JWT (existing Axios setup).
      const response = await apiClient.post("/auth/google", { idToken });
      // 5. Store JWT/user exactly like the email/password flow.
      await login(response.data);
      navigate("/");
    } catch (err) {
      // Silently ignore the user simply closing/cancelling the popup.
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      setLoginError(
        err.response?.data?.message || err.message || "Google sign-in failed"
      );
    } finally {
      setIsGoogleSubmitting(false);
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
        <img src="/final_logo_image.png" alt="Logo" className="h-10 md:h-16 w-auto object-contain mix-blend-multiply" />
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

              {/* 🔹 Divider + Continue with Google */}
              {!needsSecretCode && (
                <>
                  <div className="auth-divider"><span>or</span></div>
                  <button
                    type="button"
                    className="google-btn"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleSubmitting || isLoginSubmitting}
                  >
                    {isGoogleSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {isLoginSubmitting && !needsSecretCode && (
                <div className="flex items-center justify-center gap-2 mt-4 text-white">
                  <div className="spinner"></div>
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}
              <div className="regi-link">
                <p>
                  Don’t have an account?{" "}
                  <button type="button" className="link-btn" onClick={() => setIsRegister(true)}>Sign Up</button>
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
                  <button type="button" className="link-btn" onClick={() => setIsRegister(false)}>Sign In</button>
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