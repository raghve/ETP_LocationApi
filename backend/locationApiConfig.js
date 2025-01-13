// locationApiConfig.js

// API Server Configuration
const API = 'DefaultAPI';
const PORT = 3001;

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyCNmLQrYCrHf8Ju2cc7UciWtSoRwvMmOwo';

// MongoDB Connection URI
const MONGODB_URI = 'mongodb://localhost:27017/geocache';

// Basic Authentication Credentials
const AUTH_CREDENTIALS = {
    username: 'etp',
    password: 'core@1986',
};

module.exports = {
    API,
    PORT,
    GOOGLE_MAPS_API_KEY,
    MONGODB_URI,
    AUTH_CREDENTIALS,
};
 