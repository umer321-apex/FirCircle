import api from './api';

const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

const updateProfile = async ({ name, visibility }) => {
  const response = await api.patch('/users/me', { name, visibility });
  return response.data;
};

export default { getMe, updateProfile };