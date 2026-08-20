import api from './api';

const getExercisesBySplit = async (split) => {
  const response = await api.get('/exercises', { params: { split } });
  return response.data; // { exercises, isPremium }
};

export default { getExercisesBySplit };