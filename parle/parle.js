const express = require('express');
const cors = require('cors');  // To handle cross-origin requests
const app = express();
const port = 3003;  // Choose an appropriate port

// Enable CORS for all requests
app.use(cors());

const { fetchBatch, updateLocation, markAsProcessed, executeSqlQuery } = require('./db');
const { getAddress } = require('./api');

// Function to get coordinates from the database based on CardNumber, DataTable, and Time
async function getCoordinates(cardNumber, dataTable, time) {
    
  let  dbQuery=`SELECT TOP(1) Lattitude, Longitude
                    FROM SmartOfficedb.dbo.${dataTable}
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
          //console.log("Cordinates :", coordinates);
          if (coordinates) {
            const location = await getAddress(coordinates.Lattitude, coordinates.Longitude);
            if(location!=null){
                //console.log("Location :", location);
                dbQuery = `UPDATE Time.AttendancePunchDetails
                                SET InRemark = '${location}'
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
                SET OutRemark = '${location}'
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
        console.error(`Error processing record ${record.AttendanceRegisterID}:`, error.message);
      }
    }
  
    return true;  // Return true to indicate the batch was processed
  }
  
  // Start processing


// Start processing immediately when the server starts
async function startProcessing() {
    try {
        const records = await processBatch();
        console.log('Batch processed:', records);
    } catch (error) {
        console.error('Error processing batch:', error);
    }
}

const schedule = require('node-schedule');

const job = schedule.scheduleJob('*/5 * * * *', function() {
  startProcessing();
});

// Call startProcessing() when the server starts


// Endpoint to fetch batch
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
    console.log(`Server running at http://localhost:${port}`);
});
