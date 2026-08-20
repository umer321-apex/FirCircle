import api from './api';

const getMySubscription = async () => {
  const res = await api.get('/subscription/me');
  return res.data;
};

const devTogglePremium = async () => {
  const res = await api.patch('/subscription/dev-toggle');
  return res.data;
};

export default { getMySubscription, devTogglePremium };