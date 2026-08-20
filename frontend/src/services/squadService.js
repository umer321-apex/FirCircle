import api from './api';

export async function fetchMySquad() {
  const res = await api.get('/squad/me');
  return res.data;
}