import React, { useState } from 'react';
import apiClient from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/login', { email, password });

            // Use the AuthContext login function
            await login(data);

            console.log('Login successful:', data.user);
            navigate('/'); // Redirect to the home page
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            console.error('Login error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-900">Login to Rohtak Milk Company</h2>
                <form className="space-y-6" onSubmit={handleLogin}>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Login
                        </button>

                        {isSubmitting && (
                            <div className="flex items-center justify-center gap-2 mt-4 text-gray-700">
                                <div className="spinner border-gray-300 border-t-blue-600"></div>
                                <span className="text-sm font-medium">Logging in...</span>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage