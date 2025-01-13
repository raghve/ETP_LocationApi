const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');

const config = require('./locationApiConfig'); // Import the configuration file


const app = express();

// Enable CORS for all routes
app.use(cors());


// Use the configuration from locationApiConfig.js
const { PORT, GOOGLE_MAPS_API_KEY, MONGODB_URI, AUTH_CREDENTIALS } = config;



// MongoDB connection APIConfig:3
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a schema for caching geocoding results
const cacheSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, 
});
const Geocache = mongoose.model('Geocache', cacheSchema);

// Helper function to fetch address from Google Maps API
async function fetchAddressFromGoogle(lat, lng) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(url);

    if (response.data.status !== 'OK') {
        throw new Error('Failed to fetch address from Google Maps API');
    }

    return response.data.results[0]?.formatted_address || 'Address not found';
}

// Helper Function to Fine the distance between two Geolocation
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const toRadians = (deg) => (deg * Math.PI) / 180;
    const R = 6371e3; // Radius of the Earth in meters
    
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lng2 - lng1);
    
    const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
};

// Middleware for Basic Authorization
const basicAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).send('Authorization header missing or invalid');
    }

    // Decode Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    

    if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        return next(); // Authorized, proceed to the next middleware
    } else {
        return res.status(401).send('Invalid credentials');
    }
};


// Endpoint for reverse geocoding
app.get('/api/getAddress', basicAuth, async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and Longitude are required.' });
    }

    try {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        // Step 1: Check for exact lat/lng match in the DB
        const exactMatch = await Geocache.findOne({ lat: latitude, lng: longitude });
        if (exactMatch) {
            return res.json({ address: exactMatch.address, source: 'Cache', distance: 0 });
        }

        // Step 2: Check for the closest match within 10 meters
        const cachedResults = await Geocache.find();
        let closestCache = null;
        let minDistance = Infinity;

        for (const cache of cachedResults) {
            const distance = haversineDistance(latitude, longitude, cache.lat, cache.lng);
            if (distance < minDistance) {
                minDistance = distance;
                closestCache = cache;
            }
        }

        if (closestCache && minDistance <= 10) {
            return res.json({
                address: closestCache.address,
                source: 'cache',
                distance: minDistance,
            });
        }

        // Step 3: Fetch address from Google Maps API
        const address = await fetchAddressFromGoogle(latitude, longitude);

        // Save the new address in the cache
        const newCache = new Geocache({ lat: latitude, lng: longitude, address });
        await newCache.save();

        res.json({ address, source: 'API', distance: null });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        res.status(500).json({ error: 'Failed to fetch address' });
    }
});

// Default route to display message in the browser
app.get('/', (req, res) => {
    res.send(`Location API Server running on port ${PORT}`);
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));