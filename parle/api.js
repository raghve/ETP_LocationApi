const axios = require('axios');

const auth = require('./locationApiConfig');

const { PORT, GOOGLE_MAPS_API_KEY, MONGODB_URI, AUTH_CREDENTIALS } = auth;

// Get address from API
async function getAddress(latitude, longitude) {
  const url = 'http://122.160.136.241:3001/api/getAddress';
  const auth = {
    username: 'etp',
    password: 'core@1986',
  };

  try {
    // Send lat and lng as query parameters
    const response = await axios.get(
      url, {
        params: {
          lat: latitude,
          lng: longitude,
        },
        auth, // Basic auth configuration
      }
    );

    if (response.data && response.data.address) {
      return response.data.address;
    } else {
      throw new Error('Address not found in API response');
    }
  } catch (error) {
    // Enhanced error logging
    console.error('Error fetching address:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getAddress };
