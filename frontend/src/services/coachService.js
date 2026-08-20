import api from './api';

const listPlans = async (type) => {
  const res = await api.get('/coach/plans', { params: type ? { type } : {} });
  return res.data;
};

const getPlanById = async (id) => {
  const res = await api.get(`/coach/plans/${id}`);
  return res.data;
};

const purchasePlan = async (id) => {
  const res = await api.post(`/coach/plans/${id}/purchase`);
  return res.data;
};

const getMyPurchasedPlans = async () => {
  const res = await api.get('/coach/purchased');
  return res.data;
};

export default { listPlans, getPlanById, purchasePlan, getMyPurchasedPlans };