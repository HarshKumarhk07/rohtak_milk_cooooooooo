// src/services/authService.js

import apiClient from './apiClient';





// baseURL in apiClient already includes "/api", so paths here start at "/auth".
const API_URL = '/auth';

const login = async (email, password) => {
  const response = await apiClient.post(`${API_URL}/login`, { email, password });
  return response.data;
};

const signup = async (email, password, otp) => {
  const response = await apiClient.post(`${API_URL}/verify-otp`, { email, otp });
  if (response.status === 200) {
    const signupResponse = await apiClient.post(`${API_URL}/signup`, { email, password });
    return signupResponse.data;
  }
};

const requestOtp = async (email) => {
  const response = await apiClient.post(`${API_URL}/request-otp`, { email });
  return response.data;
};



// const login = async (email, password) => {
//   const response = await apiClient.post(`/auth/login`, { email, password });
//   return response.data;
// };
// const signup = async (email, password, otp) => {
//   const response = await apiClient.post(`${API_URL}/verify-otp`, { email, otp });
//   if (response.status === 200) {
//     const signupResponse = await apiClient.post(`${API_URL}/signup`, { email, password });
//     return signupResponse.data;
//   }
// };

// const requestOtp = async (email) => {
//   const response = await apiClient.post(`${API_URL}/request-otp`, { email });
//   return response.data;
// };

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export default {
  login,
  signup,
  requestOtp,
  logout,
};