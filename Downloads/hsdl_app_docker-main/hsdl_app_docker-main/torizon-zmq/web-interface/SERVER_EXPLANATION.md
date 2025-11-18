# server.js - Complete Line-by-Line Explanation

## Overview
This is a Node.js server that acts as a bridge between:
1. **MQTT broker** (receives sensor data from datalogger)
2. **WebSocket clients** (sends real-time data to web browsers)
3. **InfluxDB** (stores time-series data)
4. **HTTP server** (serves web interface and API endpoints)

---

## Lines 1-7: Import Required Modules

```javascript
const mqtt = require('mqtt');
```
- **Line 1**: Import MQTT library for connecting to MQTT broker
- **Purpose**: Receive sensor data published by the datalogger

```javascript
const WebSocket = require('ws');
```
- **Line 2**: Import WebSocket library for real-time bidirectional communication
- **Purpose**: Send live data to web browsers

```javascript
const http = require('http');
```
- **Line 3**: Import Node.js built-in HTTP module
- **Purpose**: Create HTTP server to serve web pages and handle API requests

```javascript
const fs = require('fs');
```
- **Line 4**: Import File System module
- **Purpose**: Read files (HTML, images, CSV) from disk

```javascript
const path = require('path');
```
- **Line 5**: Import Path module
- **Purpose**: Handle file and directory paths correctly across operating systems

```javascript
const readline = require('readline');
```
- **Line 6**: Import Readline module
- **Purpose**: Read CSV files line-by-line for mock data

```javascript
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
```
- **Line 7**: Import InfluxDB client library
- **Purpose**: Connect to InfluxDB and write time-series data
- **InfluxDB**: Time-series database for storing sensor data
- **Point**: Object representing a single data point with timestamp

---

## Lines 9-14: Configuration Constants

```javascript
// =============================
// CONFIGURACIÓN
// =============================
```
- **Lines 9-11**: Section comment (in Spanish: "CONFIGURATION")

```javascript
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
```
- **Line 12**: MQTT broker address
- **`process.env.MQTT_BROKER`**: Read from environment variable (if set)
- **`|| 'mqtt://localhost:1883'`**: Default value if not set
- **Port 1883**: Standard MQTT port
- **Purpose**: Configure where to connect for receiving sensor data

```javascript
const WS_PORT = parseInt(process.env.WS_PORT) || 8080;
```
- **Line 13**: WebSocket/HTTP server port
- **`parseInt()`**: Convert string to number
- **Default**: Port 8080
- **Purpose**: Port where web interface will be accessible

```javascript
const SEND_INTERVAL_MS = 100; // 10 Hz (envío cada 100 ms)
```
- **Line 14**: Data sending interval in milliseconds
- **100ms** = 10 times per second = **10 Hz**
- **Purpose**: Control how often data is sent to web browsers
- **Why**: Prevents overwhelming browser with too much data

---

## Lines 16-30: InfluxDB Configuration

```javascript
// InfluxDB Configuration
```
- **Line 16**: Section comment

```javascript
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
```
- **Line 17**: InfluxDB server URL
- **Port 8086**: Standard InfluxDB port
- **Purpose**: Where InfluxDB is running

```javascript
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'your-token-here';
```
- **Line 18**: Authentication token for InfluxDB
- **Security**: Token-based authentication (like a password)
- **Purpose**: Authorize writes and queries

```javascript
const INFLUX_ORG = process.env.INFLUX_ORG || 'encardio';
```
- **Line 19**: InfluxDB organization name
- **Organization**: Highest-level container in InfluxDB
- **Default**: 'encardio' (company name)

```javascript
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'nexus';
```
- **Line 20**: InfluxDB bucket name
- **Bucket**: Where data is stored (like a database table)
- **Default**: 'nexus' (datalogger model name)

```javascript
// Initialize InfluxDB client
const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
```
- **Lines 22-23**: Create InfluxDB client connection object
- **Purpose**: Establish connection to database

```javascript
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms', {
    batchSize: 100,
    flushInterval: 5000,
    maxRetries: 3,
    maxBufferLines: 10000
});
```
- **Lines 24-29**: Create write API for inserting data
- **Parameters**:
  - `INFLUX_ORG`: Organization to write to
  - `INFLUX_BUCKET`: Bucket to write to
  - `'ms'`: Timestamp precision (milliseconds)
  - **Options object**:
    - `batchSize: 100`: Group 100 points before sending (efficiency)
    - `flushInterval: 5000`: Send data every 5 seconds even if batch not full
    - `maxRetries: 3`: Retry failed writes up to 3 times
    - `maxBufferLines: 10000`: Maximum points to buffer in memory

```javascript
writeApi.useDefaultTags({ source: 'datalogger' });
```
- **Line 30**: Add default tag to all data points
- **Tag**: Metadata for filtering/grouping data
- **`source: 'datalogger'`**: Identifies where data came from
- **Purpose**: Distinguish from data from other sources

---

## Lines 32-53: InfluxDB Connection Test

```javascript
console.log('✓ InfluxDB write API initialized');
console.log(`  URL: ${INFLUX_URL}`);
console.log(`  Org: ${INFLUX_ORG}`);
console.log(`  Bucket: ${INFLUX_BUCKET}`);
```
- **Lines 32-35**: Print configuration to console
- **`console.log()`**: Output to terminal
- **Checkmark (✓)**: Indicates success
- **Purpose**: Confirm settings are correct

```javascript
// Test InfluxDB connection
(async () => {
```
- **Lines 37-38**: Start immediately-invoked async function
- **`async`**: Function can use `await` for asynchronous operations
- **`()`**: Immediately execute this function
- **Purpose**: Test connection without blocking server startup

```javascript
    try {
        const testQueryApi = influxDB.getQueryApi(INFLUX_ORG);
```
- **Lines 39-40**: Begin error handling and create query API
- **`try`**: Attempt code that might fail
- **`getQueryApi()`**: Create API for reading data
- **Purpose**: Test if we can query database

```javascript
        const testQuery = `buckets() |> filter(fn: (r) => r.name == "${INFLUX_BUCKET}")`;
```
- **Line 41**: Flux query to check if bucket exists
- **Flux**: InfluxDB's query language (like SQL)
- **`buckets()`**: Get all buckets
- **`|>`**: Pipe operator (pass results to next function)
- **`filter()`**: Keep only matching results
- **Purpose**: Verify bucket exists

```javascript
        let bucketFound = false;
        await testQueryApi.collectRows(testQuery, () => { bucketFound = true; });
```
- **Lines 42-43**: Execute query
- **`await`**: Wait for query to complete
- **`collectRows()`**: Run query and collect results
- **Callback function**: If any rows returned, set flag to true
- **Purpose**: Check if bucket was found

```javascript
        if (bucketFound) {
            console.log('✓ InfluxDB connection successful - bucket found');
        } else {
            console.log('⚠ InfluxDB connected but bucket not found');
        }
```
- **Lines 44-48**: Report test results
- **✓**: Success (green checkmark)
- **⚠**: Warning (yellow triangle)
- **Purpose**: Inform user if setup is correct

```javascript
    } catch (err) {
        console.error('✗ InfluxDB connection test failed:', err.message);
        console.error('  Data will NOT be written to InfluxDB!');
    }
})();
```
- **Lines 49-53**: Handle connection errors
- **`catch`**: Execute if error occurs in `try` block
- **`console.error()`**: Print error message in red
- **✗**: Failed (red X)
- **Purpose**: Alert user that database won't work

---

## Lines 55-61: InfluxDB Statistics Tracking

```javascript
// InfluxDB Write Statistics
let influxWriteStats = {
    totalPoints: 0,
    successCount: 0,
    errorCount: 0,
    lastError: null
};
```
- **Lines 55-61**: Object to track write operations
- **`let`**: Variable that can be changed
- **Fields**:
  - `totalPoints`: How many data points attempted to write
  - `successCount`: How many succeeded
  - `errorCount`: How many failed
  - `lastError`: Most recent error message
- **Purpose**: Monitor database health and show user statistics

---

## Lines 63-72: Mock Data Configuration

```javascript
// =============================
// MOCK DATA CONFIGURATION
// =============================
```
- **Lines 63-65**: Section comment

```javascript
let mockData = [];
```
- **Line 66**: Array to store CSV data for testing
- **Empty array `[]`**: Initially no data
- **Purpose**: Hold simulated sensor data from CSV file

```javascript
let mockPlaybackState = {
    isPlaying: false,
    currentIndex: 0,
    speed: 1.0,
    intervalId: null
};
```
- **Lines 67-72**: Object tracking mock data playback state
- **Fields**:
  - `isPlaying`: Boolean - is playback active?
  - `currentIndex`: Which row of CSV we're currently on
  - `speed`: Playback speed multiplier (1.0 = normal, 2.0 = double speed)
  - `intervalId`: Reference to timer (for stopping playback)
- **Purpose**: Control CSV playback like a media player

---

## Lines 74-79: Server Startup Messages

```javascript
console.log('=================================');
console.log('High Speed Datalogger Server');
console.log('=================================');
console.log('MQTT Broker:', MQTT_BROKER);
console.log('WebSocket Port:', WS_PORT);
console.log('Send Rate:', 1000/SEND_INTERVAL_MS, 'Hz');
```
- **Lines 74-79**: Print startup banner
- **`1000/SEND_INTERVAL_MS`**: Convert milliseconds to frequency (Hz)
  - Example: 1000ms / 100ms = 10 Hz
- **Purpose**: Show user that server is starting and display configuration

---

## Lines 81-293: HTTP Server (Main Request Handler)

```javascript
// =============================
// SERVIDOR HTTP
// =============================
const server = http.createServer(async (req, res) => {
```
- **Lines 81-84**: Create HTTP server
- **`http.createServer()`**: Create server that listens for HTTP requests
- **`async (req, res)`**: Callback function for each request
  - `req`: Request object (what client wants)
  - `res`: Response object (what we send back)
- **`async`**: Can use `await` for async operations

```javascript
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```
- **Lines 85-87**: CORS headers
- **CORS**: Cross-Origin Resource Sharing (security feature)
- **`*`**: Allow requests from any website
- **Purpose**: Allow browser JavaScript to call our API

### Lines 89-98: Serve Home Page

```javascript
    if (req.url === '/' || req.url === '/index.html') {
```
- **Line 89**: Check if user requested home page
- **`req.url`**: The path requested (e.g., "/", "/index.html")

```javascript
        try {
            const html = fs.readFileSync(path.join(__dirname, 'index.html'));
```
- **Lines 90-91**: Try to read HTML file
- **`fs.readFileSync()`**: Read file synchronously (wait until done)
- **`__dirname`**: Current directory where server.js is located
- **`path.join()`**: Combine directory + filename correctly

```javascript
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
```
- **Lines 92-93**: Send HTML to browser
- **`200`**: HTTP status code (OK/Success)
- **`Content-Type`**: Tell browser this is HTML
- **`charset=utf-8`**: Support international characters
- **`res.end()`**: Finish response and send it

```javascript
        } catch (err) {
            console.error('Error loading index.html:', err.message);
            res.writeHead(500);
            res.end('Error loading page');
        }
```
- **Lines 94-98**: Handle file read errors
- **`500`**: Server error status code
- **Purpose**: Gracefully handle missing file

### Lines 99-110: Serve Logo Image

```javascript
    } else if (req.url === '/logo.png') {
        try {
            const logo = fs.readFileSync(path.join(__dirname, 'logo.png'));
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=86400'
            });
            res.end(logo);
```
- **Lines 99-106**: Serve logo image
- **`Content-Type: 'image/png'`**: Tell browser this is PNG image
- **`Cache-Control`**: Browser can cache for 86400 seconds (24 hours)
- **Why cache**: Images don't change often, saves bandwidth

```javascript
        } catch (err) {
            res.writeHead(404);
            res.end('Logo not found');
        }
```
- **Lines 107-110**: Handle missing logo
- **`404`**: Not found status code

### Lines 111-113: Handle Favicon

```javascript
    } else if (req.url === '/favicon.ico') {
        res.writeHead(204);
        res.end();
```
- **Lines 111-113**: Respond to favicon request
- **`204`**: No content status code
- **Purpose**: Prevent error when browser requests favicon

### Lines 114-210: Historical Data Query API

```javascript
    } else if (req.url.startsWith('/api/query')) {
```
- **Line 114**: Check if this is a historical data query request
- **`/api/query`**: API endpoint for querying InfluxDB

```javascript
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const startTime = url.searchParams.get('start');
            const endTime = url.searchParams.get('end');
```
- **Lines 116-119**: Parse URL parameters
- **Example URL**: `/api/query?start=2025-11-14T10:00:00Z&end=2025-11-14T11:00:00Z`
- **`searchParams.get()`**: Extract query parameters
- **Purpose**: Get time range for query

```javascript
            if (!startTime || !endTime) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing start or end time' }));
                return;
            }
```
- **Lines 121-125**: Validate parameters
- **`400`**: Bad request status code
- **`JSON.stringify()`**: Convert JavaScript object to JSON string
- **Purpose**: Return error if parameters missing

```javascript
            const queryApi = influxDB.getQueryApi(INFLUX_ORG);
```
- **Line 127**: Create query API for reading data

```javascript
            const fluxQuery = `
                from(bucket: "${INFLUX_BUCKET}")
                    |> range(start: ${startTime}, stop: ${endTime})
                    |> filter(fn: (r) => r["_measurement"] == "sensor_data")
                    |> filter(fn: (r) => r["_field"] == "ch1" or r["_field"] == "ch2" or r["_field"] == "ch3" or r["_field"] == "ch4")
                    |> sort(columns: ["_time"])
            `;
```
- **Lines 130-136**: Flux query to get sensor data
- **Breakdown**:
  - `from(bucket: "nexus")`: Read from nexus bucket
  - `range(start: X, stop: Y)`: Filter by time range
  - `filter(... "sensor_data")`: Only get sensor_data measurement
  - `filter(... ch1 or ch2 ...)`: Only get these 4 channels
  - `sort(columns: ["_time"])`: Sort by timestamp
- **Purpose**: Get all sensor data for specified time period

```javascript
            const rawData = [];
```
- **Line 138**: Array to collect query results

```javascript
            try {
                await queryApi.collectRows(fluxQuery, (row, tableMeta) => {
```
- **Lines 140-141**: Execute query
- **`await`**: Wait for query to complete
- **`collectRows()`**: Process each row as it arrives
- **Callback function**: Called for each row
  - `row`: Array of values
  - `tableMeta`: Column information

```javascript
                    const timeIndex = tableMeta.columns.findIndex(col => col.label === '_time');
                    const fieldIndex = tableMeta.columns.findIndex(col => col.label === '_field');
                    const valueIndex = tableMeta.columns.findIndex(col => col.label === '_value');
```
- **Lines 143-145**: Find column positions
- **Why**: InfluxDB returns rows as arrays, not objects
- **`findIndex()`**: Find which position has the column we need
- **Example**: If `_time` is at position 2, `timeIndex = 2`

```javascript
                    if (rawData.length === 0) {
                        console.log('📊 Column indices - time:', timeIndex, 'field:', fieldIndex, 'value:', valueIndex);
                    }
```
- **Lines 147-149**: Debug: Log column positions for first row
- **Purpose**: Verify we're reading columns correctly

```javascript
                    const time = row[timeIndex];
                    const field = row[fieldIndex];
                    const value = row[valueIndex];
```
- **Lines 151-153**: Extract values from row array
- **Example**: If row = [..., '2025-11-14T10:00:00Z', ..., 'ch1', ..., 2.5, ...]
  - `time = '2025-11-14T10:00:00Z'`
  - `field = 'ch1'`
  - `value = 2.5`

```javascript
                    if (rawData.length < 3) {
                        console.log(`📊 Row ${rawData.length + 1}:`, {
                            time: time,
                            field: field,
                            value: value
                        });
                    }
```
- **Lines 155-161**: Debug: Log first 3 rows
- **Purpose**: Verify data is being read correctly

```javascript
                    if (time && field !== undefined && value !== undefined) {
                        rawData.push({
                            time: new Date(time).getTime(),
                            field: field,
                            value: parseFloat(value)
                        });
                    }
```
- **Lines 163-169**: Add row to results if valid
- **`new Date(time).getTime()`**: Convert timestamp to milliseconds since 1970
- **`parseFloat(value)`**: Convert string to number
- **Purpose**: Collect all data points

```javascript
                });
                
                console.log(`✓ Retrieved ${rawData.length} raw data points from InfluxDB`);
```
- **Lines 170-172**: End of callback, log total rows retrieved

```javascript
            } catch (queryError) {
                console.error('Query error:', queryError.message);
                console.error('Query:', fluxQuery);
                // Return empty array if query fails
            }
```
- **Lines 173-177**: Handle query errors
- **Purpose**: Don't crash if query fails

```javascript
            // Group data by timestamp
            const dataMap = new Map();
```
- **Lines 179-180**: Create map for grouping data
- **Map**: Key-value storage (faster than object for this)
- **Why**: Each timestamp has 4 separate rows (ch1, ch2, ch3, ch4)
  - We need to combine them into single row

```javascript
            rawData.forEach(item => {
                if (!dataMap.has(item.time)) {
                    dataMap.set(item.time, {
                        timestamp: item.time,
                        ch1: null,
                        ch2: null,
                        ch3: null,
                        ch4: null
                    });
                }
                const entry = dataMap.get(item.time);
                entry[item.field] = item.value;
            });
```
- **Lines 181-193**: Group data by timestamp
- **Logic**:
  1. For each raw data point
  2. If timestamp not in map, create new entry with all channels = null
  3. Get entry for this timestamp
  4. Set the appropriate channel (ch1/ch2/ch3/ch4) to the value
- **Example**:
  - Row 1: time=1000, field='ch1', value=2.5 → Map[1000] = {ch1: 2.5, ch2: null, ...}
  - Row 2: time=1000, field='ch2', value=3.0 → Map[1000] = {ch1: 2.5, ch2: 3.0, ...}
  - Result: Single row with all 4 channels

```javascript
            // Convert map to array
            const data = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
            console.log(`✓ Grouped into ${data.length} unique timestamps`);
```
- **Lines 195-197**: Convert map to sorted array
- **`Array.from()`**: Convert map values to array
- **`sort()`**: Sort by timestamp (oldest first)
- **Purpose**: Create clean array of data points

```javascript
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: data }));
```
- **Lines 199-200**: Send results to client
- **Response format**:
  ```json
  {
    "success": true,
    "data": [
      { "timestamp": 1731584400000, "ch1": 2.5, "ch2": 3.0, "ch3": 1.2, "ch4": 4.1 },
      ...
    ]
  }
  ```

```javascript
            console.log(`✓ Queried ${data.length} records from ${startTime} to ${endTime}`);
            if (data.length > 0) {
                console.log('  Sample data:', data[0]);
            }
```
- **Lines 202-205**: Log query summary
- **Purpose**: Debugging and monitoring

```javascript
        } catch (err) {
            console.error('InfluxDB query error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
```
- **Lines 206-210**: Handle any errors
- **`500`**: Server error
- **Purpose**: Return error message to client

### Lines 211-225: Load Mock Data API

```javascript
    } else if (req.url === '/api/mock/load') {
        // Load mock data from CSV
        try {
            await loadMockData();
```
- **Lines 211-214**: API endpoint to load CSV file
- **`await loadMockData()`**: Wait for CSV to be read
- **Purpose**: Load mock data for testing

```javascript
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                totalRows: mockData.length,
                message: 'Mock data loaded successfully'
            }));
```
- **Lines 215-220**: Return success response
- **Response includes**: Number of rows loaded

```javascript
        } catch (err) {
            console.error('Error loading mock data:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
```
- **Lines 221-225**: Handle errors
- **Purpose**: Report if CSV file missing or invalid

### Lines 226-235: Start Mock Playback API

```javascript
    } else if (req.url === '/api/mock/start') {
        // Start mock data playback
        startMockPlayback();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            isPlaying: true,
            currentIndex: mockPlaybackState.currentIndex,
            speed: mockPlaybackState.speed
        }));
```
- **Lines 226-235**: API endpoint to start playback
- **Calls**: `startMockPlayback()` function
- **Returns**: Current playback state
- **Purpose**: Begin streaming CSV data to clients

### Lines 236-244: Pause Mock Playback API

```javascript
    } else if (req.url === '/api/mock/pause') {
        // Pause mock data playback
        pauseMockPlayback();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            isPlaying: false,
            currentIndex: mockPlaybackState.currentIndex
        }));
```
- **Lines 236-244**: API endpoint to pause playback
- **Preserves**: Current position in CSV
- **Purpose**: Stop streaming temporarily

### Lines 245-252: Reset Mock Playback API

```javascript
    } else if (req.url === '/api/mock/reset') {
        // Reset mock data playback
        resetMockPlayback();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            currentIndex: 0
        }));
```
- **Lines 245-252**: API endpoint to reset playback
- **Effect**: Stops playback and returns to beginning
- **Purpose**: Start over from first row

### Lines 253-267: Set Playback Speed API

```javascript
    } else if (req.url.startsWith('/api/mock/speed')) {
        // Set playback speed
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const speed = parseFloat(url.searchParams.get('speed')) || 1.0;
            setMockSpeed(speed);
```
- **Lines 253-258**: API endpoint to change playback speed
- **URL example**: `/api/mock/speed?speed=2.0`
- **`parseFloat()`**: Convert string to number
- **Default**: 1.0 (normal speed)

```javascript
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                speed: mockPlaybackState.speed
            }));
```
- **Lines 259-263**: Return current speed

```javascript
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid speed parameter' }));
        }
```
- **Lines 264-267**: Handle invalid speed values
- **`400`**: Bad request

### Lines 268-278: Get Mock Status API

```javascript
    } else if (req.url === '/api/mock/status') {
        // Get mock playback status
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true,
            isPlaying: mockPlaybackState.isPlaying,
            currentIndex: mockPlaybackState.currentIndex,
            totalRows: mockData.length,
            speed: mockPlaybackState.speed,
            progress: mockData.length > 0 ? (mockPlaybackState.currentIndex / mockData.length * 100).toFixed(1) : 0
        }));
```
- **Lines 268-278**: API endpoint to get current status
- **Returns**:
  - Is it playing?
  - Current position
  - Total rows
  - Speed
  - Progress percentage
- **Purpose**: Update UI progress bar

### Lines 279-288: Get InfluxDB Stats API

```javascript
    } else if (req.url === '/api/influxdb/stats') {
        // Get InfluxDB write statistics
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true,
            totalPoints: influxWriteStats.totalPoints,
            successCount: influxWriteStats.successCount,
            errorCount: influxWriteStats.errorCount,
            lastError: influxWriteStats.lastError
        }));
```
- **Lines 279-288**: API endpoint for InfluxDB statistics
- **Returns**: Number of points written, errors, etc.
- **Purpose**: Show user if database writes are working

### Lines 289-292: 404 Handler

```javascript
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});
```
- **Lines 289-293**: Handle unknown URLs
- **`404`**: Not found error
- **Purpose**: Return error for invalid requests

---

## Lines 295-330: WebSocket Server

```javascript
// =============================
// SERVIDOR WEBSOCKET
// =============================
const wss = new WebSocket.Server({ server });
```
- **Lines 295-298**: Create WebSocket server
- **`{ server }`**: Attach to existing HTTP server
- **Why WebSocket**: Real-time bidirectional communication
  - HTTP: Client asks, server responds (one-way)
  - WebSocket: Both can send anytime (two-way)

```javascript
let connectedClients = 0;
```
- **Line 300**: Counter for active connections
- **Purpose**: Track how many browsers are connected

```javascript
wss.on('connection', (ws, req) => {
    connectedClients++;
    const clientIp = req.socket.remoteAddress;
    console.log(`✓ WebSocket connected from ${clientIp} (Total: ${connectedClients})`);
```
- **Lines 302-305**: Handle new client connection
- **`ws`**: WebSocket connection object
- **`req`**: HTTP request (has client IP)
- **`clientIp`**: IP address of connected browser
- **Increment counter**: Track total connections

```javascript
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to High Speed Datalogger',
        timestamp: Date.now(),
        sendRate: 1000/SEND_INTERVAL_MS
    }));
```
- **Lines 307-312**: Send welcome message to new client
- **`ws.send()`**: Send data through WebSocket
- **`JSON.stringify()`**: Convert object to JSON string
- **Message contains**:
  - Type of message
  - Welcome text
  - Current timestamp
  - How often data will be sent
- **Purpose**: Confirm connection and send config

```javascript
    ws.on('message', (message) => {
        console.log('Received from client:', message.toString());
    });
```
- **Lines 314-316**: Handle messages from client
- **Currently**: Just logs them
- **Purpose**: Could handle commands from browser

```javascript
    ws.on('close', () => {
        connectedClients--;
        console.log(`✗ Client disconnected (Total: ${connectedClients})`);
    });
```
- **Lines 318-321**: Handle client disconnect
- **Decrement counter**: Reduce connection count
- **Purpose**: Track when users leave

```javascript
    ws.on('error', (err) => {
        console.error('WebSocket client error:', err.message);
    });
});
```
- **Lines 323-325**: Handle WebSocket errors
- **Purpose**: Log errors without crashing server

```javascript
wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
});
```
- **Lines 328-330**: Handle WebSocket server errors
- **Purpose**: Log server-level errors

---

## Lines 332-381: Mock Data Functions

### Lines 337-381: Load Mock Data Function

```javascript
async function loadMockData() {
    return new Promise((resolve, reject) => {
```
- **Lines 337-338**: Function that loads CSV file
- **`async`**: Can use `await`
- **`Promise`**: Asynchronous operation that will complete later
  - `resolve`: Call when successful
  - `reject`: Call when error

```javascript
        mockData = [];
        const csvPath = path.join(__dirname, 'mock_data.csv');
```
- **Lines 339-340**: Prepare to read CSV
- **Clear array**: Empty any old data
- **`csvPath`**: Full path to CSV file

```javascript
        if (!fs.existsSync(csvPath)) {
            return reject(new Error('mock_data.csv not found'));
        }
```
- **Lines 342-344**: Check if file exists
- **`fs.existsSync()`**: Returns true if file exists
- **Purpose**: Fail early with clear error

```javascript
        const fileStream = fs.createReadStream(csvPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
```
- **Lines 346-350**: Create stream to read file line-by-line
- **`createReadStream()`**: Read file without loading all into memory
- **`readline.createInterface()`**: Read line-by-line
- **`crlfDelay: Infinity`**: Handle different line endings (Windows/Linux/Mac)

```javascript
        let isFirstLine = true;
        
        rl.on('line', (line) => {
            if (isFirstLine) {
                isFirstLine = false;
                return; // Skip header
            }
```
- **Lines 352-358**: Process each line
- **`isFirstLine`**: Flag to skip header row
- **`rl.on('line')`**: Called for each line in file
- **Purpose**: Skip CSV header (column names)

```javascript
            const values = line.split(',');
            if (values.length === 5) {
                mockData.push({
                    timestamp: parseInt(values[0]),
                    ch1: parseFloat(values[1]),
                    ch2: parseFloat(values[2]),
                    ch3: parseFloat(values[3]),
                    ch4: parseFloat(values[4])
                });
            }
```
- **Lines 360-369**: Parse CSV line
- **`split(',')`**: Split line into array at commas
- **CSV format**: `timestamp,ch1,ch2,ch3,ch4`
- **`parseInt()`**: Convert string to integer (timestamp)
- **`parseFloat()`**: Convert string to decimal number (sensor values)
- **`mockData.push()`**: Add to array

```javascript
        });

        rl.on('close', () => {
            console.log(`✓ Loaded ${mockData.length} mock data samples`);
            resolve();
        });
```
- **Lines 371-375**: When file reading is complete
- **`resolve()`**: Signal success
- **Purpose**: Log how many rows loaded

```javascript
        rl.on('error', (err) => {
            reject(err);
        });
    });
}
```
- **Lines 377-380**: Handle file reading errors
- **`reject(err)`**: Signal failure
- **Purpose**: Pass error to caller

---

### Lines 384-436: Start Mock Playback Function

```javascript
function startMockPlayback() {
    if (mockData.length === 0) {
        console.log('✗ Cannot start playback: No mock data loaded');
        return;
    }
```
- **Lines 384-388**: Validate can start
- **Check**: Is data loaded?
- **Purpose**: Prevent errors if no data

```javascript
    if (mockPlaybackState.isPlaying) {
        return; // Already playing
    }
```
- **Lines 390-392**: Check if already playing
- **Purpose**: Prevent multiple timers

```javascript
    mockPlaybackState.isPlaying = true;
    
    const baseInterval = SEND_INTERVAL_MS;
    const interval = baseInterval / mockPlaybackState.speed;
```
- **Lines 394-397**: Calculate playback interval
- **Example**: 
  - Base = 100ms (10 Hz)
  - Speed = 2.0 (double speed)
  - Interval = 100ms / 2.0 = 50ms (20 Hz)
- **Purpose**: Adjust speed by changing how often we send data

```javascript
    mockPlaybackState.intervalId = setInterval(() => {
```
- **Line 399**: Create timer that runs repeatedly
- **`setInterval()`**: Call function every X milliseconds
- **Store ID**: So we can stop timer later

```javascript
        if (mockPlaybackState.currentIndex >= mockData.length) {
            // Loop back to start
            mockPlaybackState.currentIndex = 0;
        }
```
- **Lines 400-403**: Loop playback
- **When**: Reached end of CSV
- **Action**: Start over from beginning

```javascript
        const data = mockData[mockPlaybackState.currentIndex];
```
- **Line 405**: Get current row of data
- **Example**: `{ timestamp: 1000, ch1: 2.5, ch2: 3.0, ch3: 1.2, ch4: 4.1 }`

```javascript
        // Send to all connected WebSocket clients
        const payload = JSON.stringify({
            type: 'update',
            ch1: data.ch1,
            ch2: data.ch2,
            ch3: data.ch3,
            ch4: data.ch4,
            timestamp: Date.now(),
            mockIndex: mockPlaybackState.currentIndex,
            mockTotal: mockData.length
        });
```
- **Lines 407-417**: Create message to send
- **`JSON.stringify()`**: Convert to JSON
- **Fields**:
  - Type: 'update' (tells client this is data)
  - ch1-ch4: Sensor values
  - timestamp: Current time (not CSV time)
  - mockIndex: Which row we're on
  - mockTotal: Total rows (for progress bar)

```javascript
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(payload);
                } catch (err) {
                    console.error('Error sending mock data to client:', err.message);
                }
            }
        });
```
- **Lines 419-427**: Send to all connected browsers
- **`wss.clients`**: Array of all connections
- **`forEach`**: Loop through each
- **`readyState === OPEN`**: Check connection is still active
- **`try/catch`**: Handle errors gracefully
- **Purpose**: Broadcast data to all viewers

```javascript
        // Write mock data to InfluxDB
        writeToInfluxDB(data.ch1, data.ch2, data.ch3, data.ch4, Date.now());
```
- **Line 430**: Save mock data to database
- **Purpose**: Can view mock data in historical chart later

```javascript
        mockPlaybackState.currentIndex++;
    }, interval);
```
- **Lines 432-433**: Move to next row and end timer callback
- **`currentIndex++`**: Advance to next row
- **`, interval`**: How often to repeat (in milliseconds)

```javascript
    console.log(`✓ Mock playback started at ${mockPlaybackState.speed}x speed`);
}
```
- **Lines 435-436**: Log that playback started

---

### Lines 439-446: Pause Mock Playback Function

```javascript
function pauseMockPlayback() {
    if (mockPlaybackState.intervalId) {
        clearInterval(mockPlaybackState.intervalId);
        mockPlaybackState.intervalId = null;
    }
    mockPlaybackState.isPlaying = false;
    console.log('⏸ Mock playback paused');
}
```
- **Lines 439-446**: Stop playback timer
- **`clearInterval()`**: Stop the repeating timer
- **Set to null**: Clear the ID
- **`isPlaying = false`**: Update state
- **Purpose**: Temporarily stop playback (preserves position)

---

### Lines 449-453: Reset Mock Playback Function

```javascript
function resetMockPlayback() {
    pauseMockPlayback();
    mockPlaybackState.currentIndex = 0;
    console.log('↺ Mock playback reset');
}
```
- **Lines 449-453**: Reset to beginning
- **First**: Stop playback
- **Then**: Reset position to 0
- **Purpose**: Start over from first row

---

### Lines 456-470: Set Mock Speed Function

```javascript
function setMockSpeed(speed) {
    const wasPlaying = mockPlaybackState.isPlaying;
    
    if (wasPlaying) {
        pauseMockPlayback();
    }
```
- **Lines 456-461**: Remember if was playing and stop
- **Why**: Need to restart timer with new interval

```javascript
    mockPlaybackState.speed = Math.max(0.1, Math.min(10, speed)); // Clamp between 0.1x and 10x
```
- **Line 463**: Set new speed with limits
- **`Math.max(0.1, ...)`**: Minimum 0.1x (10% speed)
- **`Math.min(10, speed)`**: Maximum 10x (1000% speed)
- **Purpose**: Prevent invalid speeds (0 or negative)

```javascript
    if (wasPlaying) {
        startMockPlayback();
    }
    
    console.log(`✓ Mock playback speed set to ${mockPlaybackState.speed}x`);
}
```
- **Lines 465-469**: Restart if was playing
- **Effect**: Timer restarts with new interval
- **Purpose**: Apply speed change immediately

---

## Lines 472-518: InfluxDB Write Functions

### Lines 476-504: Write to InfluxDB Function

```javascript
function writeToInfluxDB(ch1, ch2, ch3, ch4, timestamp = Date.now()) {
    try {
```
- **Lines 476-477**: Function to write sensor data
- **Parameters**:
  - ch1-ch4: Four channel values
  - timestamp: Optional (defaults to current time)

```javascript
        // Debug: Log first few writes
        if (influxWriteStats.totalPoints < 5) {
            console.log(`📝 Writing to InfluxDB: CH1=${ch1}, CH2=${ch2}, CH3=${ch3}, CH4=${ch4}`);
        }
```
- **Lines 478-481**: Debug logging for first 5 writes
- **Purpose**: Verify function is being called correctly

```javascript
        const point = new Point('sensor_data')
            .floatField('ch1', ch1)
            .floatField('ch2', ch2)
            .floatField('ch3', ch3)
            .floatField('ch4', ch4)
            .timestamp(new Date(timestamp));
```
- **Lines 483-488**: Create InfluxDB data point
- **`new Point('sensor_data')`**: Create point with measurement name
- **`.floatField()`**: Add each channel as a field
  - Field: A measured value (like temperature, voltage, etc.)
- **`.timestamp()`**: When this measurement was taken
- **Purpose**: Structure data for InfluxDB

```javascript
        writeApi.writePoint(point);
        influxWriteStats.totalPoints++;
        influxWriteStats.successCount++;
```
- **Lines 490-492**: Write point and update stats
- **`writePoint()`**: Add to write buffer (not sent yet)
- **Update counters**: Track statistics
- **Note**: Data is batched (sent in groups)

```javascript
        // Log every 50 points
        if (influxWriteStats.totalPoints % 50 === 0) {
            console.log(`✓ Written ${influxWriteStats.totalPoints} points to InfluxDB (${influxWriteStats.errorCount} errors)`);
        }
```
- **Lines 494-497**: Log progress periodically
- **`% 50`**: Modulo operator (remainder after dividing by 50)
  - Example: 50 % 50 = 0, 100 % 50 = 0, 150 % 50 = 0
- **Purpose**: Log every 50 points to avoid spam

```javascript
    } catch (error) {
        influxWriteStats.errorCount++;
        influxWriteStats.lastError = error.message;
        console.error('✗ Error writing to InfluxDB:', error.message);
        console.error('  Data:', { ch1, ch2, ch3, ch4, timestamp });
    }
}
```
- **Lines 498-503**: Handle write errors
- **Update stats**: Track errors
- **Log error**: Show what failed and what data
- **Purpose**: Continue running even if some writes fail

---

### Lines 507-518: Periodic Flush Timer

```javascript
setInterval(async () => {
    try {
        await writeApi.flush();
```
- **Lines 507-509**: Timer to flush buffered data
- **`setInterval()`**: Run every 5 seconds (5000ms)
- **`async`**: Can use `await`
- **`flush()`**: Send all buffered data to InfluxDB now
- **Why**: Data is batched for efficiency, but we want to ensure it's saved regularly

```javascript
        if (influxWriteStats.totalPoints > 0) {
            console.log(`✓ Flushed InfluxDB data (${influxWriteStats.totalPoints} total points)`);
        }
```
- **Lines 510-512**: Log flush if there's data
- **Purpose**: Confirm data is being saved

```javascript
    } catch (error) {
        console.error('✗ Error flushing InfluxDB writes:', error.message);
        influxWriteStats.errorCount++;
        influxWriteStats.lastError = error.message;
    }
}, 5000);
```
- **Lines 513-518**: Handle flush errors
- **5000**: Flush every 5000 milliseconds (5 seconds)
- **Purpose**: Ensure data isn't lost if server crashes

---

## Lines 520-606: MQTT Client

```javascript
// =============================
// CLIENTE MQTT
// =============================
const mqttClient = mqtt.connect(MQTT_BROKER, {
    reconnectPeriod: 5000,
    connectTimeout: 30000
});
```
- **Lines 520-526**: Connect to MQTT broker
- **`mqtt.connect()`**: Create MQTT client and connect
- **Options**:
  - `reconnectPeriod: 5000`: Try to reconnect every 5 seconds if disconnected
  - `connectTimeout: 30000`: Wait 30 seconds before giving up
- **Purpose**: Receive sensor data from datalogger

```javascript
// Buffer con SOLO el último valor recibido de cada canal
const latestValues = {
    ch1: null,
    ch2: null,
    ch3: null,
    ch4: null,
    timestamp: null
};
```
- **Lines 528-535**: Storage for latest sensor values
- **Comment**: "Buffer with ONLY the latest value received from each channel"
- **Why**: MQTT might receive data faster than we send to browsers
  - Store only latest value (not a queue)
  - Prevents memory overflow
- **`null`**: Initially no data

```javascript
let mqttConnected = false;
```
- **Line 537**: Track connection status
- **Purpose**: Show user if MQTT is working

```javascript
mqttClient.on('connect', () => {
    mqttConnected = true;
    console.log('✓ Connected to MQTT broker');
```
- **Lines 539-541**: Called when connected to MQTT broker
- **`on('connect')`**: Event listener
- **Set flag**: Mark as connected

```javascript
    const topics = [
        'data/nexus/ch1',
        'data/nexus/ch2',
        'data/nexus/ch3',
        'data/nexus/ch4'
    ];
```
- **Lines 543-548**: Define MQTT topics to subscribe to
- **Topic**: Like a channel or category in MQTT
- **Format**: `data/nexus/ch1` (data/device/channel)
- **Purpose**: Listen for data on these topics

```javascript
    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (!err) {
                console.log('✓ Subscribed to', topic);
            } else {
                console.error('✗ Failed to subscribe to', topic, err.message);
            }
        });
    });
});
```
- **Lines 550-559**: Subscribe to each topic
- **`subscribe()`**: Tell broker we want messages from this topic
- **Callback**: Called when subscription completes
- **Purpose**: Register to receive sensor data

```javascript
mqttClient.on('error', (err) => {
    mqttConnected = false;
    console.error('MQTT error:', err.message);
});
```
- **Lines 561-564**: Handle MQTT errors
- **Set flag**: Mark as disconnected
- **Purpose**: Log errors and update status

```javascript
mqttClient.on('reconnect', () => {
    console.log('Reconnecting to MQTT broker...');
});
```
- **Lines 566-568**: Log reconnection attempts
- **Purpose**: Show user we're trying to reconnect

```javascript
// Actualiza SOLO el último valor por canal (último valor gana)
let mqttMessageCount = 0;
let lastMqttStatsTime = Date.now();
```
- **Lines 570-572**: Variables for statistics
- **Comment**: "Updates ONLY the latest value per channel (last value wins)"
- **`mqttMessageCount`**: How many messages received
- **`lastMqttStatsTime`**: When we last printed stats
- **Purpose**: Track message rate

```javascript
mqttClient.on('message', (topic, message) => {
    const value = parseFloat(message.toString());
```
- **Lines 574-575**: Called when MQTT message arrives
- **`topic`**: Which topic (e.g., 'data/nexus/ch1')
- **`message`**: The data (as Buffer)
- **`parseFloat()`**: Convert to number

```javascript
    // Actualizar solo el último valor
    if (topic.endsWith('ch1')) latestValues.ch1 = value;
    else if (topic.endsWith('ch2')) latestValues.ch2 = value;
    else if (topic.endsWith('ch3')) latestValues.ch3 = value;
    else if (topic.endsWith('ch4')) latestValues.ch4 = value;
    
    latestValues.timestamp = Date.now();
```
- **Lines 577-583**: Update appropriate channel
- **`endsWith()`**: Check if topic ends with channel name
- **Logic**: 
  - If topic is 'data/nexus/ch1' → update ch1
  - If topic is 'data/nexus/ch2' → update ch2
  - etc.
- **Store timestamp**: When this update happened
- **Effect**: Latest value overwrites previous (not queued)

```javascript
    // Write to InfluxDB if all channels have data
    if (latestValues.ch1 !== null && latestValues.ch2 !== null && 
        latestValues.ch3 !== null && latestValues.ch4 !== null) {
        writeToInfluxDB(
            latestValues.ch1,
            latestValues.ch2,
            latestValues.ch3,
            latestValues.ch4,
            latestValues.timestamp
        );
    }
```
- **Lines 585-595**: Write complete set to InfluxDB
- **Check**: Do we have all 4 channels?
- **Why**: Only write when we have complete data point
- **Purpose**: Ensure all channels are synchronized

```javascript
    // Stats cada 5 segundos
    mqttMessageCount++;
    const now = Date.now();
    if (now - lastMqttStatsTime >= 5000) {
        const rate = (mqttMessageCount / 5).toFixed(1);
        console.log(`MQTT Rate: ${rate} msg/s | Latest values: CH1=${latestValues.ch1?.toFixed(6)} CH2=${latestValues.ch2?.toFixed(6)} CH3=${latestValues.ch3?.toFixed(6)} CH4=${latestValues.ch4?.toFixed(6)} | InfluxDB: ${influxWriteStats.totalPoints} points written`);
        mqttMessageCount = 0;
        lastMqttStatsTime = now;
    }
});
```
- **Lines 597-606**: Print statistics every 5 seconds
- **`mqttMessageCount++`**: Count this message
- **`now - lastMqttStatsTime >= 5000`**: Has 5 seconds passed?
- **`mqttMessageCount / 5`**: Messages per second (divided by 5 seconds)
- **`.toFixed(6)`**: Format to 6 decimal places
- **`?.`**: Optional chaining (only call if not null)
- **Reset counters**: Start counting next 5-second period
- **Purpose**: Monitor data flow rate

---

## Lines 608-645: Periodic WebSocket Sending

```javascript
// =============================
// ENVÍO PERIÓDICO A WEBSOCKETS
// Envía SOLO el último valor cada SEND_INTERVAL_MS
// =============================
let sendCount = 0;
```
- **Lines 608-612**: Section comment and counter
- **Comment**: "PERIODIC SENDING TO WEBSOCKETS - Sends ONLY latest value every SEND_INTERVAL_MS"

```javascript
setInterval(() => {
    if (connectedClients === 0) return;
```
- **Lines 614-615**: Timer for sending data
- **Check**: Any clients connected?
- **`return`**: Skip if no one to send to
- **Purpose**: Don't waste CPU if no viewers

```javascript
    // Crear payload con solo los últimos valores
    const payload = JSON.stringify({
        type: 'update',
        ch1: latestValues.ch1,
        ch2: latestValues.ch2,
        ch3: latestValues.ch3,
        ch4: latestValues.ch4,
        timestamp: latestValues.timestamp
    });
```
- **Lines 617-625**: Create message with latest values
- **Comment**: "Create payload with only the latest values"
- **`JSON.stringify()`**: Convert to JSON string
- **Purpose**: Package data for sending

```javascript
    let sentCount = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(payload);
                sentCount++;
            } catch (err) {
                console.error('Error sending to client:', err.message);
            }
        }
    });
```
- **Lines 627-637**: Send to all connected clients
- **`wss.clients`**: Array of all connections
- **`forEach`**: Loop through each
- **`readyState === OPEN`**: Check connection is active
- **`try/catch`**: Handle errors (client might disconnect)
- **Count**: How many successfully sent to
- **Purpose**: Broadcast latest data to all viewers

```javascript
    sendCount++;
    
    // Stats cada 100 envíos (cada 10 segundos a 10 Hz)
    if (sendCount % 100 === 0) {
        console.log(`Sent ${sendCount} updates to ${sentCount} client(s) | MQTT: ${mqttConnected ? 'Connected' : 'Disconnected'}`);
    }
}, SEND_INTERVAL_MS);
```
- **Lines 639-645**: Log statistics periodically
- **`sendCount++`**: Count this send
- **Comment**: "Stats every 100 sends (every 10 seconds at 10 Hz)"
- **Log every 100**: Avoid console spam
- **`, SEND_INTERVAL_MS`**: Run every 100ms (10 Hz)
- **Purpose**: Monitor sending rate and connection status

---

## Lines 647-657: Server Startup

```javascript
// =============================
// INICIO DEL SERVIDOR
// =============================
server.listen(WS_PORT, '0.0.0.0', () => {
```
- **Lines 647-650**: Start HTTP/WebSocket server
- **Comment**: "SERVER STARTUP"
- **`listen()`**: Start listening for connections
- **`WS_PORT`**: Port number (8080)
- **`'0.0.0.0'`**: Listen on all network interfaces (local + network)
- **Callback**: Called when server is ready

```javascript
    console.log('=================================');
    console.log(`✓ HTTP Server: http://0.0.0.0:${WS_PORT}`);
    console.log(`✓ WebSocket Server ready`);
    console.log(`✓ Send rate: ${1000/SEND_INTERVAL_MS} Hz (every ${SEND_INTERVAL_MS}ms)`);
    console.log('=================================');
    console.log('Waiting for connections...');
});
```
- **Lines 651-657**: Print startup banner
- **Purpose**: Inform user server is ready
- **Shows**:
  - Server URL
  - WebSocket ready
  - Data sending rate
  - Status

---

## Lines 659-704: Error Handling and Shutdown

```javascript
// =============================
// MANEJO DE ERRORES Y CIERRE LIMPIO
// =============================
server.on('error', (err) => {
```
- **Lines 659-662**: Handle server errors
- **Comment**: "ERROR HANDLING AND CLEAN SHUTDOWN"

```javascript
    if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${WS_PORT} is already in use. Try a different port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
```
- **Lines 663-669**: Handle specific errors
- **`EADDRINUSE`**: Port already in use
  - Example: Another program using port 8080
- **`process.exit(1)`**: Exit with error code 1
- **Purpose**: Give helpful error message

```javascript
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```
- **Lines 671-672**: Register shutdown handlers
- **`SIGTERM`**: Termination signal (docker stop)
- **`SIGINT`**: Interrupt signal (Ctrl+C)
- **Purpose**: Clean shutdown when asked to stop

```javascript
async function shutdown() {
    console.log('\n=================================');
    console.log('Shutting down gracefully...');
```
- **Lines 674-676**: Shutdown function
- **`async`**: Can use `await`
- **Purpose**: Clean up resources before exiting

```javascript
    // Flush InfluxDB writes
    try {
        await writeApi.flush();
        await writeApi.close();
        console.log(`✓ InfluxDB closed (${influxWriteStats.totalPoints} points written)`);
    } catch (err) {
        console.error('Error closing InfluxDB:', err.message);
    }
```
- **Lines 678-685**: Close InfluxDB connection
- **`flush()`**: Send any remaining buffered data
- **`close()`**: Close connection
- **Purpose**: Don't lose data

```javascript
    wss.clients.forEach((client) => {
        client.close();
    });
    
    wss.close(() => {
        console.log('✓ WebSocket server closed');
    });
```
- **Lines 687-693**: Close WebSocket connections
- **Close all clients**: Disconnect all browsers
- **Close server**: Stop accepting new connections
- **Purpose**: Clean shutdown

```javascript
    mqttClient.end(() => {
        console.log('✓ MQTT client closed');
    });
```
- **Lines 695-697**: Close MQTT connection
- **`end()`**: Disconnect from broker
- **Purpose**: Clean disconnect

```javascript
    server.close(() => {
        console.log('✓ HTTP server closed');
        console.log('=================================');
        process.exit(0);
    });
}
```
- **Lines 699-704**: Close HTTP server
- **`close()`**: Stop accepting new connections
- **`process.exit(0)`**: Exit with success code (0)
- **Purpose**: Complete shutdown

---

## Lines 706-711: Status Logging Timer

```javascript
// Log info periódico
setInterval(() => {
    if (connectedClients > 0) {
        console.log(`Status: ${connectedClients} client(s) connected | MQTT: ${mqttConnected ? 'OK' : 'ERROR'}`);
    }
}, 30000); // Cada 30 segundos
```
- **Lines 706-711**: Periodic status logging
- **Comment**: "Periodic info logging"
- **Every 30 seconds**: Print status
- **Only if clients**: Don't spam if no one connected
- **Shows**:
  - Number of connected browsers
  - MQTT connection status
- **Purpose**: Monitor server health

---

## Summary

This server is a **multi-protocol bridge** that:

1. **Receives** sensor data from MQTT broker (published by datalogger)
2. **Stores** data in InfluxDB time-series database (for historical queries)
3. **Broadcasts** real-time data to web browsers via WebSocket
4. **Serves** web interface and API endpoints via HTTP
5. **Supports** mock data playback from CSV for testing
6. **Handles** errors gracefully and shuts down cleanly

### Data Flow:

```
Datalogger → MQTT Broker → This Server → InfluxDB (storage)
                                ↓
                           WebSocket → Browser (real-time display)
```

### Key Features:

- **Real-time**: 10 Hz data streaming
- **Efficient**: Batching, buffering, only latest values
- **Robust**: Error handling, reconnection, graceful shutdown
- **Flexible**: Live MQTT or mock CSV playback
- **Monitored**: Statistics tracking and logging

---

**Total Lines**: 711  
**Language**: JavaScript (Node.js)  
**Purpose**: High-speed data acquisition system bridge

