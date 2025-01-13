// db.js
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
  user: 'sa',       // SQL Server username
  password: 'Etp@1986$#',   // SQL Server password
  server: '192.168.1.152',  // Server address or IP
  database: 'EasyTimePay_Jupitar',
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: true, // For self-signed certificates
  },
};

// Generate dynamic file name
const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
const fileName = `node_${today}.log`; 
const errorFileName = `nodeError_${today}.log`;
const logDir = path.join(__dirname, 'Log'); // Subdirectory for error logs
const logFilePath = path.join(logDir, fileName); // Main log file path
const errorFilePath = path.join(logDir, errorFileName); // Error log file path
// Ensure the directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir); // Create the directory if it doesn't exist
}


  
  const poolPromise = new sql.ConnectionPool(config).connect();


  async function fetchBatch(query) {
    const pool = await poolPromise;
    try {
      const result = await pool.request().query(query);
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      // logs Messages
      const logMessage = JSON.stringify(result.recordset) ;
      fs.appendFileSync(logFilePath, `${timestamp} - ${logMessage}\n`);
      return result.recordset;
    } catch (error) {
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      //Writing log File
      const errorMessage = (`Error for AttendanceRegisterID: ${query}`);
      fs.appendFileSync(errorFilePath, `${timestamp} - ${errorMessage}\n`);
      // console.error(`Error in - ${column} for AttendanceRegisterID: ${query}`);
      console.log('Error details:', error.message);
    }
  }
  
  async function executeSqlQuery(query) {
    const pool = await poolPromise;
    try {
      const result = await pool.request().query(query);
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      // logs Messages
      const logMessage = result.recordset;
      fs.appendFileSync(logFilePath, `${timestamp} - ${logMessage}\n`);
    } catch (error) {
      // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      //Writing log File
      const errorMessage = `Error for AttendanceRegisterID: ${query}`;
      fs.appendFileSync(errorFilePath, `${timestamp} - ${errorMessage}\n`);
      // console.error(`Error in - ${column} for AttendanceRegisterID: ${query}`);
      console.log('Error details:', error.message);
    }
  }


  
  module.exports = { 
    sql,  
    config,
    fetchBatch, 
    executeSqlQuery
   };