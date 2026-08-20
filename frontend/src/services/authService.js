import api from './api';

const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data; // { token, user }
};

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // { token, user }
};

const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

const resetPassword = async (email, code, newPassword) => {
  const response = await api.post('/auth/reset-password', { email, code, newPassword });
  return response.data;
};

export default { register, login, requestPasswordReset, resetPassword };