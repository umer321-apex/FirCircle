import api from './api';

const createPost = async ({ type, contentRefId, caption }) => {
  const response = await api.post('/posts', { type, contentRefId, caption });
  return response.data;
};

const getFeed = async () => {
  const response = await api.get('/feed');
  return response.data;
};

const toggleLike = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

const addComment = async (postId, text) => {
  const response = await api.post(`/posts/${postId}/comment`, { text });
  return response.data;
};

const getComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

const savePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/save`);
  return response.data;
};

export default { createPost, getFeed, toggleLike, addComment, getComments, savePost };