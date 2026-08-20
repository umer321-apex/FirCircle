import api from './api';

const createCheckIn = async (lat, lng) => {
  const response = await api.post('/checkins', { lat, lng });
  return response.data; // { checkIn, message? }
};

const getMyCheckIns = async () => {
  const response = await api.get('/checkins/me');
  return response.data; // { checkIns }
};

export default { createCheckIn, getMyCheckIns };