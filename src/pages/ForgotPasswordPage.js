import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import "../styles/auth.css";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [role, setRole] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP/Secret, 3: Success
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);
        try {
            const { data } = await apiClient.post('/auth/forgot-password', { email });
            setMessage(data.message);
            setRole(data.role);
            setStep(2);
            setIsError(false);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Something went wrong');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                email,
                otp,
                secretCode: role === 'admin' ? secretCode : undefined,
                newPassword
            });
            setMessage('Password reset successful! Redirecting to login...');
            setStep(3);
            setIsError(false);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to reset password');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page relative">
            {/* Logo Overlay */}
            <div className="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-sm">
                <img src="/final_logo_image.png" alt="Logo" className="h-10 md:h-16 w-auto object-contain mix-blend-multiply" />
            </div>

            <div className="container">
                {/* 🔹 Form Box */}
                <div className="form-box Login">
                    <div className="animation">
                        <h2>Forgot Password</h2>
                        {message && (
                            <p className={isError ? "error-text" : "success-text"}>
                                {message}
                            </p>
                        )}
                        
                        {step === 1 && (
                            <form onSubmit={handleForgotPassword}>
                                <div className="input-box">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <label>Email</label>
                                </div>
                                <button type="submit" className="btn" disabled={isLoading} style={{ marginTop: '20px' }}>
                                    {isLoading ? "Sending..." : "Continue"}
                                </button>
                                <div className="regi-link">
                                    <p>
                                        Remember password?{" "}
                                        <Link to="/login">Sign In</Link>
                                    </p>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleResetPassword}>
                                <div className="input-box">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                    <label>{role === 'admin' ? 'Email OTP' : 'OTP Code'}</label>
                                </div>
                                {role === 'admin' && (
                                    <div className="input-box">
                                        <input
                                            type="text"
                                            value={secretCode}
                                            onChange={(e) => setSecretCode(e.target.value)}
                                            required
                                        />
                                        <label>Secret Code</label>
                                    </div>
                                )}
                                <div className="input-box">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <label>New Password</label>
                                </div>
                                <button type="submit" className="btn" disabled={isLoading} style={{ marginTop: '30px' }}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center" style={{ marginTop: "20px" }}>
                                <div className="flex items-center justify-center mb-4">
                                    <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                                </div>
                                <p style={{ color: "white" }}>Redirecting to login...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🔹 Info Content */}
                <div className="info-content Login">
                    <div className="animation">
                        <h2>RECOVER ACCESS</h2>
                        <p>Follow the steps to reset your password and secure your account.</p>
                    </div>
                </div>

                {/* 🔹 Curved Shapes */}
                <div className="curved-shape"></div>
                <div className="curved-shape2"></div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
