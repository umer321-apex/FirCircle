import api from './api';

const addProgressEntry = async ({ weightKg, measurements, photoUri }) => {
  const formData = new FormData();

  if (weightKg !== undefined && weightKg !== null) {
    formData.append('weightKg', String(weightKg));
  }

  if (measurements) {
    formData.append('measurements', JSON.stringify(measurements));
  }

  if (photoUri) {
    const filename = photoUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const fileType = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: photoUri,
      name: filename || 'progress-photo.jpg',
      type: fileType,
    });
  }

  const response = await api.post('/progress', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

const getMyProgress = async () => {
  const response = await api.get('/progress/me');
  return response.data;
};

export default { addProgressEntry, getMyProgress };