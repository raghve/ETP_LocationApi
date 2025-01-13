// db.js
const sql = require('mssql');

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

// Basic Auth credentials for external API
const auth = {
    username: 'etp',
    password: 'core@1986',
  };
  
  const poolPromise = new sql.ConnectionPool(config).connect();


  async function fetchBatch(query) {
    // console.log(query);
    const pool = await poolPromise;
    try {
      const result = await pool.request().query(query);
      console.log('Query executed successfully');
      return result.recordset;
    } catch (error) {
      console.error(`Error in - ${column} for AttendanceRegisterID: ${query}`);
      console.log('Error details:', error.message);
    }
  }
  
  async function executeSqlQuery(query) {
    // console.log(query);
    const pool = await poolPromise;
    try {
      await pool.request().query(query);
      console.log('Query executed successfully');
      // console.log(query);
    } catch (error) {
      console.error(`Error in - ${column} for AttendanceRegisterID: ${query}`);
      console.log('Error details:', error.message);
      // throw error; 
    }
  }
  
  module.exports = { 
    sql,  
    auth, 
    config,
    fetchBatch, 
    executeSqlQuery
   };