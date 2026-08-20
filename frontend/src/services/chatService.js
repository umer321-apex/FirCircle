import api from './api';

export const createPod = async (name, goal, memberIds = []) => {
  const res = await api.post('/chat/pods', { name, goal, memberIds });
  return res.data;
};

export const getMyPods = async () => {
  const res = await api.get('/chat/pods');
  return res.data;
};

export const getPodMessages = async (podId) => {
  const res = await api.get(`/chat/pods/${podId}/messages`);
  return res.data;
};

export const sendPodMessage = async (podId, text) => {
  const res = await api.post(`/chat/pods/${podId}/messages`, { text });
  return res.data;
};

export const getConversations = async () => {
  const res = await api.get('/chat/conversations');
  return res.data;
};

export const getDirectMessages = async (otherUserId) => {
  const res = await api.get(`/chat/direct/${otherUserId}`);
  return res.data;
};

export const sendDirectMessage = async (recipientId, text) => {
  const res = await api.post(`/chat/direct/${recipientId}`, { text });
  return res.data;
};