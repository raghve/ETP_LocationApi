const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Generate dynamic file name
const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
const fileName = `API_${today}.log`; 
const errorFileName = `apiError_${today}.log`;
const logDir = path.join(__dirname, 'Log'); // Subdirectory for error logs
const logFilePath = path.join(logDir, fileName); // Main log file path
const errorFilePath = path.join(logDir, errorFileName); // Error log file path
// Ensure the directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir); // Create the directory if it doesn't exist
}


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
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      // logs Messages
      const logMessage =  JSON.stringify(response.data);
      fs.appendFileSync(logFilePath, `${timestamp} - ${logMessage}\n`);
      return response.data.address;
    } else {
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      // logs error Messages
      const errorMessage = `Error: ${response.status} ${response.statusText}`;
      fs.appendFileSync(errorFilePath, `${timestamp} + 'Address not found in API + - ${errorMessage}\n`);
      throw new Error('Address not found in API response');
    }
  } catch (error) {
    // Generate a fresh timestamp for each log entry
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    // Enhanced error logging
    const errorMessage = `Error: ${error.message} - ${error.stack}`;
    fs.appendFileSync(errorFilePath, `${timestamp} + 'Location API Error' + - ${errorMessage}\n`)
    console.error('Error fetching address:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { getAddress };
