const express = require('express');
const cors = require('cors');  // To handle cross-origin requests
const app = express();
const port = 3003;  // Choose an appropriate port
const fs = require('fs');
const path = require('path');

// Enable CORS for all requests
app.use(cors());

const clientDeviceDb = "SmartOfficedb";

const { fetchBatch, executeSqlQuery } = require('./db');
const { getAddress } = require('./api');


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



// Function to get coordinates from the database based on CardNumber, DataTable, and Time
async function getCoordinates(cardNumber, dataTable, time) {
    
  let  dbQuery=`SELECT TOP(1) ROUND(Lattitude, 6), ROUND(Longitude, 6)
                    FROM ${clientDeviceDb}.dbo.${dataTable}
                    WHERE UserId = '${cardNumber}'
                        AND dbo.fn_ConvertDateTime(LogDate, 3) = '${time}'
                        AND LEN(ISNULL(Lattitude, '')) > 5
                        AND LEN(ISNULL(Longitude, '')) > 5;
                    `;    
      const result = await fetchBatch(dbQuery);
      return result.length > 0 ? result[0] : null;  // Return coordinates if found
  }  
  // Function to process a single batch of 500 records
  async function processBatch() {
    let query=`
      SELECT TOP(500) E.CardNumber, E.EmployeeID, AR.AttendanceRegisterID,
             dbo.fn_ConvertDateTime(AR.AttendanceDate, 1) AS AttendanceDate,
             'DeviceLogs_' + CAST(MONTH(AR.AttendanceDate) AS VARCHAR(2)) + '_' + CAST(YEAR(AR.AttendanceDate) AS VARCHAR(4)) AS DataTable,
             dbo.fn_ConvertDateTime(AR.InTime, 3) AS InTime,
             dbo.fn_ConvertDateTime(AR.OutTime, 3) AS OutTime,
             ISNULL(AP.InTimeSource, 0) AS InTimeSource,
             ISNULL(AP.OutTimeSource, 0) AS OutTimeSource
      FROM Time.AttendanceRegister AR
      INNER JOIN Time.AttendancePunchDetails AP ON AR.AttendanceRegisterID = AP.AttendanceRegisterID
      INNER JOIN Emp.Employee E ON AR.EmployeeID = E.EmployeeID
      WHERE AR.InterfaceProcess = 0
        AND (AR.InTime IS NOT NULL OR AR.OutTime IS NOT NULL)
        AND (ISNULL(AP.InTimeSource, 0) = 1 OR ISNULL(AP.OutTimeSource, 0) = 1)
    `;
    const records = await fetchBatch(query);
  
    if (records.length === 0) {
      console.log('No more records to process.');
      return false;  // Stop processing if no records are found
    }
  
    console.log(`Processing batch starting  with ${records.length} records...`);
  
    for (const record of records) {
        const {
            CardNumber,
            AttendanceRegisterID,
            DataTable,
            InTime,
            OutTime,
            InTimeSource,
            OutTimeSource,
        } = record;
        let dbQuery="";
        let updateQery=false; 
      try {
        // Process InTime
        if (InTime && InTimeSource === 1) {
            
          const coordinates = await getCoordinates(CardNumber, DataTable, InTime);
          if (coordinates) {
            const location = await getAddress(coordinates.Lattitude, coordinates.Longitude);
            if(location!=null){
                dbQuery = `UPDATE Time.AttendancePunchDetails
                                SET InLocation = '${location}',
                                    InRemark = '${coordinates.Lattitude }' + ',' + '${coordinates.Longitude }'
                                WHERE AttendanceRegisterID = ${record.AttendanceRegisterID}`;                            
                await executeSqlQuery(dbQuery);
                updateQery=true;
            }
          }else{
            updateQery=true;
          } 
        }  
        // Process OutTime
        if (OutTime && OutTimeSource === 1) {
          const coordinates = await getCoordinates(CardNumber, DataTable, OutTime);
          if (coordinates) {
            const location = await getAddress(coordinates.Lattitude, coordinates.Longitude);
            if(location!=null){
                dbQuery= `UPDATE Time.AttendancePunchDetails
                          SET OutLocation = '${location}',
                              OutRemark = '${coordinates.Lattitude }' + ',' + '${coordinates.Longitude }'
                          WHERE AttendanceRegisterID = ${record.AttendanceRegisterID}`;                            
                await executeSqlQuery(dbQuery);
                updateQery=true;
            }
          }else{
            updateQery=true;
          } 
        }  
        // Mark as processed
       if(updateQery){
            dbQuery= `UPDATE Time.AttendanceRegister
                        SET InterfaceProcess = 1,
                        InterfaceProcessDate = GETDATE()
                        WHERE AttendanceRegisterID = ${record.AttendanceRegisterID}`;                            
            await executeSqlQuery(dbQuery);
       }
      } catch (error) {
        // Generate a fresh timestamp for each log entry
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const errorMessage = (`Error processing record ${record.AttendanceRegisterID}:`, error.message);
        fs.appendFileSync(errorFilePath, `${timestamp} - ${errorMessage}\n`)
        console.error(errorMessage);
      }
    }
  
    return true;  // Return true to indicate the batch was processed
  }

// Starts upon Starting a server
processBatch();
  

// Start processing immediately when the server starts
async function startProcessing() {
    try {
        const records = await processBatch();
        console.log('Batch processed:', records.length);
    } catch (error) {
        console.error('Error processing batch:', error);
    }
}

const schedule = require('node-schedule');

const job = schedule.scheduleJob('* * * * *', function() {
  startProcessing();
});


// Endpoint to fetch batch from UI
app.get('/api/fetchBatch', async (req, res) => {
    try {
        const records = processBatch();
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching batch' });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`${timestamp}` + `Server running at http://localhost:${port}`);
});
