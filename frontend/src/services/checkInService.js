import api from './api';

const createCheckIn = async (lat, lng, manual = false) => {
  const response = await api.post('/checkins', { lat, lng, manual });
  return response.data; // { checkIn, withinRadius, distanceMeters, message? } — checkIn may be null if too far and not manual
};

const getMyCheckIns = async () => {
  const response = await api.get('/checkins/me');
  return response.data; // { checkIns }
};

export default { createCheckIn, getMyCheckIns };