import api from './api';

const searchAddress = async (query) => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await api.get('/location/search', {
      params: { q: query.trim() },
    });
    return response.data.results;
  } catch (error) {
    console.error(`[locationService.searchAddress] Error: ${error.message}`);
    return [];
  }
};

export default { searchAddress };