import api from './api';

const getSchedule = async () => {
  const response = await api.get('/users/me/schedule');
  return response.data; // { gymSchedule }
};

const updateSchedule = async (gymSchedule) => {
  const response = await api.put('/users/me/schedule', { gymSchedule });
  return response.data; // { gymSchedule }
};

export default { getSchedule, updateSchedule };