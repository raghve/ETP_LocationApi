const express = require('express');
const axios = require('axios'); // To make API calls
const sql = require('mssql');

const cors = require('cors');

const app = express();
const port = 3002;

app.use(cors());


const config = {
  user: 'sa',       // SQL Server username
  password: 'Etp@1986$#',   // SQL Server password
  server: '192.168.1.152',  // Server address or IP
  database: 'ETP_Location',
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true, // For self-signed certificates
  },
};

// Function to get SQL Server connection
async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (error) {
    console.error('SQL connection error:', error);
    throw error;
  }
}

// Function to get lat, lng from the address table where UpdateFlag is false
async function getLatLng() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT Latitude, Longitude 
      FROM address 
      WHERE UpdateFlag = 0
    `);
    return result.recordset; // Returns an array of rows with Latitude and Longitude
  } catch (error) {
    console.error('Error fetching lat/lng:', error);
    throw error;
  }
}

// Function to update FullAddress, UpdateFlag, and UpdatedDate in the address table
async function updateAddress(lat, lng, fullAddress) {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('lat', sql.Float, lat)
      .input('lng', sql.Float, lng)
      .input('fullAddress', sql.NVarChar, fullAddress)
      .input('updatedDate', sql.DateTime, new Date())
      .query(`
        UPDATE address 
        SET FullAddress = @fullAddress, 
            UpdateFlag = 1, 
            UpdatedDate = @updatedDate
        WHERE Latitude = @lat AND Longitude = @lng
      `);
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
}
// Function to get the address from the external API
async function getAddress(lat, lng) {
  try {
    const response = await axios.get('http://localhost:3000/api/getAddress', {
      params: { lat, lng },
      auth, // Adding Basic Auth credentials from db.js
    });
    return response.data.address; // Assuming the API response contains an 'address' field
  } catch (error) {
    console.error('Error fetching address:', error);
    throw error;
  }
}

// Route to fetch lat, lng, get the address, and update the database
app.get('/api/updateAddresses', async (req, res) => {
  try {
    // Step 1: Fetch lat/lng from the address table where UpdateFlag is 0
    const latLngRecords = await getLatLng();

    // Step 2: For each record, get the address and update the table
    for (const record of latLngRecords) {
      const { Latitude: lat, Longitude: lng } = record;

      // Step 3: Get address from external API
      const fullAddress = await getAddress(lat, lng);

      // Step 4: Update the table with the fetched address
      await updateAddress(lat, lng, fullAddress);
    }

    // Fetch updated rows to send back
    const pool = await getConnection();
    const updatedRows = await pool.request()
      .query('SELECT * FROM address WHERE UpdateFlag = 1');

    res.json({ message: 'Addresses updated successfully', data: updatedRows.recordset });

  } catch (error) {
    console.error('Error in updateAddresses route:', error);
    res.status(500).json({ error: 'Failed to update addresses' });
  }
});



// Default route to display message in the browser
app.get('/', (req, res) => {
    res.send(`SQL Server Backend running on port ${port}`);
});

app.listen(port, () => {
  console.log(`SQL Server Backend running on http://localhost:${port}`);
});
