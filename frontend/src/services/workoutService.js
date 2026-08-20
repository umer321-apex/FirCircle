import api from './api';

const logWorkout = async (splitCategory, entries) => {
  const response = await api.post('/workouts', { splitCategory, entries });
  return response.data;
};

const getMyWorkouts = async () => {
  const response = await api.get('/workouts/me');
  return response.data;
};

export default { logWorkout, getMyWorkouts };