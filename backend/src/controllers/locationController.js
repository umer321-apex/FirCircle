const axios = require('axios');

const PHOTON_URL = 'https://photon.komoot.io/api';

const searchAddress = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 3) {
      return res.status(200).json({ results: [] });
    }

    const response = await axios.get(PHOTON_URL, {
      params: {
        q: q.trim(),
        limit: 8,
      },
      timeout: 10000,
    });

    // Photon returns GeoJSON — features[].geometry.coordinates is [lng, lat]
    const results = response.data.features.map((feature, index) => {
      const props = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;

      const nameParts = [
        props.name,
        props.street,
        props.city,
        props.state,
        props.country,
      ].filter(Boolean);

      return {
        id: props.osm_id || index,
        displayName: nameParts.join(', '),
        lat,
        lng,
      };
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error(`[locationController.searchAddress] Error: ${error.message}`);
    return res.status(500).json({ message: 'Address search failed' });
  }
};

module.exports = { searchAddress };