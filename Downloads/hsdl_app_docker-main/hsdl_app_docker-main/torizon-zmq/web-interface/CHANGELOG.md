# High Speed Datalogger Web Interface - Change Log

## Overview
This document details all changes made to the web interface to add InfluxDB integration, historical data visualization, data table display, and mock data playback features.

---

## Summary of New Features

### 1. InfluxDB Integration
- Real-time data writing to InfluxDB time-series database
- Historical data querying with flexible time ranges
- Connection testing and error handling

### 2. Historical Data Visualization
- Time-based chart showing historical sensor data
- Flexible time range selection (5min, 15min, 30min, 1h, 3h, 6h, 12h, 24h, custom)
- Custom date/time range picker

### 3. Data Table
- Tabular display of historical data with timestamps
- Sortable columns with proper formatting
- Adjustable rows per page (50, 100, 200, 500, All)
- CSV export functionality
- Alternating row colors and hover effects

### 4. Mock Data Playback
- CSV-based mock data loading
- Playback controls (Play, Pause, Reset)
- Variable speed control (0.5x to 10x)
- Toggle between Live MQTT and Mock CSV modes
- Mock data written to InfluxDB for testing

---

## Detailed Changes

## File: `server.js`

### A. Dependencies Added
```javascript
const readline = require('readline');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
```

### B. InfluxDB Configuration
```javascript
// InfluxDB Configuration
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'your-token-here';
const INFLUX_ORG = process.env.INFLUX_ORG || 'encardio';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'nexus';

// Initialize InfluxDB client
const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms', {
    batchSize: 100,
    flushInterval: 5000,
    maxRetries: 3,
    maxBufferLines: 10000
});
writeApi.useDefaultTags({ source: 'datalogger' });

// InfluxDB Write Statistics
let influxWriteStats = {
    totalPoints: 0,
    successCount: 0,
    errorCount: 0,
    lastError: null
};
```

**Purpose**: Configure InfluxDB client with batching, auto-flush, and retry logic for reliable data ingestion.

### C. InfluxDB Connection Test
```javascript
// Test InfluxDB connection on startup
(async () => {
    try {
        const testQueryApi = influxDB.getQueryApi(INFLUX_ORG);
        const testQuery = `buckets() |> filter(fn: (r) => r.name == "${INFLUX_BUCKET}")`;
        let bucketFound = false;
        await testQueryApi.collectRows(testQuery, () => { bucketFound = true; });
        if (bucketFound) {
            console.log('✓ InfluxDB connection successful - bucket found');
        } else {
            console.log('⚠ InfluxDB connected but bucket not found');
        }
    } catch (err) {
        console.error('✗ InfluxDB connection test failed:', err.message);
    }
})();
```

**Purpose**: Verify InfluxDB connectivity and bucket existence at server startup.

### D. Mock Data Configuration
```javascript
// Mock Data Configuration
let mockData = [];
let mockPlaybackState = {
    isPlaying: false,
    currentIndex: 0,
    speed: 1.0,
    intervalId: null
};
```

**Purpose**: Track mock data state for CSV playback feature.

### E. New HTTP API Endpoints

#### 1. Historical Data Query Endpoint
```javascript
} else if (req.url.startsWith('/api/query')) {
    // Handle InfluxDB query requests
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const startTime = url.searchParams.get('start');
        const endTime = url.searchParams.get('end');
        
        if (!startTime || !endTime) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing start or end time' }));
            return;
        }

        const queryApi = influxDB.getQueryApi(INFLUX_ORG);
        
        // Query for all 4 channels (without pivot - manual grouping)
        const fluxQuery = `
            from(bucket: "${INFLUX_BUCKET}")
                |> range(start: ${startTime}, stop: ${endTime})
                |> filter(fn: (r) => r["_measurement"] == "sensor_data")
                |> filter(fn: (r) => r["_field"] == "ch1" or r["_field"] == "ch2" or r["_field"] == "ch3" or r["_field"] == "ch4")
                |> sort(columns: ["_time"])
        `;

        const rawData = [];
        
        try {
            await queryApi.collectRows(fluxQuery, (row, tableMeta) => {
                // Use tableMeta to get correct column indices
                const timeIndex = tableMeta.columns.findIndex(col => col.label === '_time');
                const fieldIndex = tableMeta.columns.findIndex(col => col.label === '_field');
                const valueIndex = tableMeta.columns.findIndex(col => col.label === '_value');
                
                const time = row[timeIndex];
                const field = row[fieldIndex];
                const value = row[valueIndex];
                
                if (time && field !== undefined && value !== undefined) {
                    rawData.push({
                        time: new Date(time).getTime(),
                        field: field,
                        value: parseFloat(value)
                    });
                }
            });
        } catch (queryError) {
            console.error('Query error:', queryError.message);
        }

        // Group data by timestamp
        const dataMap = new Map();
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

        // Convert map to array
        const data = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: data }));
        
        console.log(`✓ Queried ${data.length} records from ${startTime} to ${endTime}`);
    } catch (err) {
        console.error('InfluxDB query error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}
```

**Key Points**:
- Accepts `start` and `end` query parameters
- Uses Flux query language to retrieve data
- Manually groups data by timestamp (more reliable than pivot)
- Returns JSON with success status and data array

#### 2. Mock Data Endpoints
```javascript
} else if (req.url === '/api/mock/load') {
    // Load mock data from CSV
} else if (req.url === '/api/mock/start') {
    // Start mock data playback
} else if (req.url === '/api/mock/pause') {
    // Pause mock data playback
} else if (req.url === '/api/mock/reset') {
    // Reset mock data playback
} else if (req.url.startsWith('/api/mock/speed')) {
    // Set playback speed
} else if (req.url === '/api/mock/status') {
    // Get mock playback status
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
}
```

### F. Mock Data Functions

#### 1. Load Mock Data
```javascript
async function loadMockData() {
    return new Promise((resolve, reject) => {
        const csvPath = path.join(__dirname, 'mock_data.csv');
        const fileStream = fs.createReadStream(csvPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        mockData = [];
        let isFirstLine = true;

        rl.on('line', (line) => {
            if (isFirstLine) {
                isFirstLine = false;
                return; // Skip header
            }

            const [timestamp, ch1, ch2, ch3, ch4] = line.split(',');
            mockData.push({
                timestamp: new Date(timestamp).getTime(),
                ch1: parseFloat(ch1),
                ch2: parseFloat(ch2),
                ch3: parseFloat(ch3),
                ch4: parseFloat(ch4)
            });
        });

        rl.on('close', () => {
            console.log(`✓ Loaded ${mockData.length} rows from mock_data.csv`);
            resolve();
        });

        rl.on('error', reject);
    });
}
```

#### 2. Mock Playback Control
```javascript
function startMockPlayback() {
    if (mockPlaybackState.isPlaying) return;
    
    mockPlaybackState.isPlaying = true;
    const interval = 100 / mockPlaybackState.speed; // Base 100ms interval

    mockPlaybackState.intervalId = setInterval(() => {
        if (mockPlaybackState.currentIndex >= mockData.length) {
            mockPlaybackState.currentIndex = 0; // Loop
        }

        const data = mockData[mockPlaybackState.currentIndex];
        
        // Send to WebSocket clients
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

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });

        // Write mock data to InfluxDB
        writeToInfluxDB(data.ch1, data.ch2, data.ch3, data.ch4, Date.now());

        mockPlaybackState.currentIndex++;
    }, interval);
}
```

### G. InfluxDB Write Function
```javascript
function writeToInfluxDB(ch1, ch2, ch3, ch4, timestamp = Date.now()) {
    try {
        const point = new Point('sensor_data')
            .floatField('ch1', ch1)
            .floatField('ch2', ch2)
            .floatField('ch3', ch3)
            .floatField('ch4', ch4)
            .timestamp(new Date(timestamp));
        
        writeApi.writePoint(point);
        influxWriteStats.totalPoints++;
        influxWriteStats.successCount++;
        
        // Log every 50 points
        if (influxWriteStats.totalPoints % 50 === 0) {
            console.log(`✓ Written ${influxWriteStats.totalPoints} points to InfluxDB`);
        }
    } catch (error) {
        influxWriteStats.errorCount++;
        influxWriteStats.lastError = error.message;
        console.error('✗ Error writing to InfluxDB:', error.message);
    }
}

// Periodic flush (every 5 seconds)
setInterval(async () => {
    try {
        await writeApi.flush();
        if (influxWriteStats.totalPoints > 0) {
            console.log(`✓ Flushed InfluxDB data (${influxWriteStats.totalPoints} total points)`);
        }
    } catch (error) {
        console.error('✗ Error flushing InfluxDB writes:', error.message);
        influxWriteStats.errorCount++;
        influxWriteStats.lastError = error.message;
    }
}, 5000);
```

**Key Points**:
- Creates InfluxDB Point with all 4 channels
- Batches writes automatically
- Flushes every 5 seconds
- Tracks statistics (success/error counts)

### H. MQTT Integration
```javascript
mqttClient.on('message', (topic, message) => {
    // ... existing MQTT parsing logic ...
    
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
});
```

### I. Shutdown Handler
```javascript
async function shutdown() {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Close MQTT
    if (mqttClient) {
        mqttClient.end();
        console.log('✓ MQTT client closed');
    }
    
    // Close WebSocket
    wss.clients.forEach(client => client.close());
    wss.close(() => {
        console.log('✓ WebSocket server closed');
    });
    
    // Flush InfluxDB writes
    try {
        await writeApi.flush();
        await writeApi.close();
        console.log(`✓ InfluxDB closed (${influxWriteStats.totalPoints} points written)`);
    } catch (err) {
        console.error('Error closing InfluxDB:', err.message);
    }
    
    server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

---

## File: `index.html`

### A. New Dependencies
```html
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
```

**Purpose**: Add Chart.js time adapter for proper timestamp handling in charts.

### B. New CSS Styles

#### 1. Mode Selector
```css
.mode-selector {
    display: flex;
    gap: 15px;
    align-items: center;
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    flex-wrap: wrap;
}
```

#### 2. Playback Controls
```css
.playback-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 15px;
    background: rgba(75, 192, 192, 0.1);
    border-radius: 8px;
    flex-wrap: wrap;
}

.speed-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.progress-info {
    font-size: 0.9em;
    color: #666;
    font-weight: normal;
}
```

#### 3. InfluxDB Status Indicator
```css
.influx-status {
    font-size: 0.85em;
    color: #4BC0C0;
    padding: 5px 10px;
    background: rgba(75, 192, 192, 0.1);
    border-radius: 5px;
    display: inline-block;
}
```

#### 4. Data Table Styles
```css
/* Data Table Styles */
#dataTable tbody tr {
    transition: background-color 0.2s ease;
}

#dataTable tbody tr:hover {
    background-color: #e3f2fd !important;
    cursor: default;
}

#exportCsvBtn:hover {
    background: #3da8a8;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

#tableContainer::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

#tableContainer::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

#tableContainer::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}
```

### C. New HTML Elements

#### 1. Mode Selector
```html
<div class="controls">
    <div class="mode-selector">
        <label><strong>Mode:</strong></label>
        <label><input type="radio" name="dataMode" value="live" checked> Live MQTT</label>
        <label><input type="radio" name="dataMode" value="mock"> Mock CSV</label>
    </div>
</div>
```

#### 2. Live MQTT Controls (Enhanced)
```html
<div class="controls" id="liveControls">
    <button id="connectBtn">Connect</button>
    <button id="disconnectBtn" disabled>Disconnect</button>
    <button id="clearBtn">Clear Data</button>
    <div class="influx-status" id="influxStatus">InfluxDB: 0 points</div>
</div>
```

#### 3. Mock CSV Controls
```html
<div class="controls playback-controls hidden" id="mockControls">
    <button id="loadMockBtn">Load CSV Data</button>
    <button id="playBtn" disabled>Play</button>
    <button id="pauseBtn" disabled style="display: none;">Pause</button>
    <button id="resetBtn" disabled>Reset</button>
    <div class="speed-control">
        <label>Speed:</label>
        <input type="range" id="speedSlider" min="0" max="4" step="1" value="2" disabled>
        <span id="speedDisplay">1x</span>
    </div>
    <span class="progress-info" id="progressInfo">Not loaded</span>
    <div class="influx-status" id="influxStatusMock">InfluxDB: 0 points</div>
</div>
```

#### 4. Historical Data Section
```html
<div class="chart-container">
    <h2 style="margin-bottom: 15px; color: #333;">Historical Data from InfluxDB</h2>
    <div class="controls" style="margin-bottom: 20px;">
        <div class="control-group">
            <label>Time Range:</label>
            <select id="timeRange">
                <option value="5m">Last 5 minutes</option>
                <option value="15m">Last 15 minutes</option>
                <option value="30m">Last 30 minutes</option>
                <option value="1h">Last 1 hour</option>
                <option value="3h">Last 3 hours</option>
                <option value="6h">Last 6 hours</option>
                <option value="12h">Last 12 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="custom">Custom Range</option>
            </select>
        </div>
        <div class="control-group" id="customRangeInputs" style="display: none;">
            <label>From:</label>
            <input type="datetime-local" id="startTime">
            <label>To:</label>
            <input type="datetime-local" id="endTime">
        </div>
        <button id="loadHistoricalBtn">Load Data</button>
        <span id="historicalStatus" class="info-text" style="margin: 0;"></span>
    </div>
    <div class="chart-wrapper">
        <canvas id="historicalChart"></canvas>
    </div>
    <p class="info-text">Records Loaded: <span id="recordCount">0</span></p>
    
    <!-- Data Table -->
    <div style="margin-top: 20px; overflow-x: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #333;">Data Table</h3>
            <button id="exportCsvBtn">📥 Export CSV</button>
        </div>
        <div id="tableContainer" style="max-height: 400px; overflow-y: auto;">
            <table id="dataTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Timestamp</th>
                        <th>Channel 1 (V)</th>
                        <th>Channel 2 (V)</th>
                        <th>Channel 3 (V)</th>
                        <th>Channel 4 (V)</th>
                    </tr>
                </thead>
                <tbody id="dataTableBody">
                    <tr>
                        <td colspan="6">No data loaded. Click "Load Data" to view records.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div style="margin-top: 10px;">
            <p class="info-text">Showing <span id="tableRowCount">0</span> rows</p>
            <label>
                Rows per page:
                <select id="rowsPerPage">
                    <option value="50">50</option>
                    <option value="100" selected>100</option>
                    <option value="200">200</option>
                    <option value="500">500</option>
                    <option value="-1">All</option>
                </select>
            </label>
        </div>
    </div>
</div>
```

### D. New JavaScript Variables
```javascript
let currentMode = 'live'; // 'live' or 'mock'
let mockDataLoaded = false;
let mockStatusInterval = null;
let historicalChart = null;
let currentTableData = [];
const speedValues = [0.5, 1, 2, 5, 10];
```

### E. Historical Chart Initialization
```javascript
function initHistoricalChart() {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    historicalChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Channel 1',
                    data: [],
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    pointRadius: 1,
                    tension: 0.1
                },
                {
                    label: 'Channel 2',
                    data: [],
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    pointRadius: 1,
                    tension: 0.1
                },
                {
                    label: 'Channel 3',
                    data: [],
                    borderColor: '#FFCE56',
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    borderWidth: 2,
                    pointRadius: 1,
                    tension: 0.1
                },
                {
                    label: 'Channel 4',
                    data: [],
                    borderColor: '#4BC0C0',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    pointRadius: 1,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            millisecond: 'HH:mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'HH:mm',
                            hour: 'MMM dd HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Voltage (V)'
                    }
                }
            }
        }
    });
}
```

### F. Data Table Functions

#### 1. Populate Table
```javascript
function populateDataTable(data) {
    currentTableData = data;
    const rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    const tableBody = document.getElementById('dataTableBody');
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        document.getElementById('tableRowCount').textContent = '0';
        return;
    }
    
    const displayData = rowsPerPage === -1 ? data : data.slice(0, rowsPerPage);
    
    displayData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #eee';
        
        if (index % 2 === 0) {
            tr.style.background = '#f9f9f9';
        }
        
        const timestamp = new Date(row.timestamp);
        const formattedTime = timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
        
        const formatValue = (val) => {
            return (val !== null && val !== undefined) ? Number(val).toFixed(6) : 'N/A';
        };
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${formattedTime}</td>
            <td>${formatValue(row.ch1)}</td>
            <td>${formatValue(row.ch2)}</td>
            <td>${formatValue(row.ch3)}</td>
            <td>${formatValue(row.ch4)}</td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    document.getElementById('tableRowCount').textContent = displayData.length;
}
```

#### 2. CSV Export
```javascript
function exportToCSV() {
    if (currentTableData.length === 0) {
        alert('No data to export. Please load data first.');
        return;
    }
    
    let csvContent = 'Timestamp,Channel 1 (V),Channel 2 (V),Channel 3 (V),Channel 4 (V)\n';
    
    currentTableData.forEach(row => {
        const timestamp = new Date(row.timestamp).toISOString();
        const ch1 = (row.ch1 !== null && row.ch1 !== undefined) ? row.ch1 : '';
        const ch2 = (row.ch2 !== null && row.ch2 !== undefined) ? row.ch2 : '';
        const ch3 = (row.ch3 !== null && row.ch3 !== undefined) ? row.ch3 : '';
        const ch4 = (row.ch4 !== null && row.ch4 !== undefined) ? row.ch4 : '';
        csvContent += `${timestamp},${ch1},${ch2},${ch3},${ch4}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `datalogger_export_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
```

### G. Load Historical Data
```javascript
async function loadHistoricalData() {
    const timeRange = document.getElementById('timeRange').value;
    const statusEl = document.getElementById('historicalStatus');
    const loadBtn = document.getElementById('loadHistoricalBtn');
    
    loadBtn.disabled = true;
    statusEl.textContent = 'Loading...';
    statusEl.style.color = '#667eea';

    try {
        let start, end;

        if (timeRange === 'custom') {
            const startInput = document.getElementById('startTime').value;
            const endInput = document.getElementById('endTime').value;
            
            if (!startInput || !endInput) {
                throw new Error('Please select both start and end times');
            }
            
            start = new Date(startInput).toISOString();
            end = new Date(endInput).toISOString();
        } else {
            const range = parseTimeRange(timeRange);
            start = range.start;
            end = range.end;
        }

        const response = await fetch(`/api/query?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Unknown error');
        }

        const data = result.data || [];
        
        console.log('📊 Received data from InfluxDB:', data.length, 'records');
        if (data.length > 0) {
            console.log('First record:', data[0]);
            console.log('Last record:', data[data.length - 1]);
        }
        
        if (data.length === 0) {
            statusEl.textContent = 'No data found for this time range. Play mock data first!';
            statusEl.style.color = '#FFCE56';
            document.getElementById('recordCount').textContent = '0';
            return;
        }
        
        historicalChart.data.datasets[0].data = data.map(d => ({ x: d.timestamp, y: d.ch1 }));
        historicalChart.data.datasets[1].data = data.map(d => ({ x: d.timestamp, y: d.ch2 }));
        historicalChart.data.datasets[2].data = data.map(d => ({ x: d.timestamp, y: d.ch3 }));
        historicalChart.data.datasets[3].data = data.map(d => ({ x: d.timestamp, y: d.ch4 }));
        
        historicalChart.update();

        document.getElementById('recordCount').textContent = data.length;
        statusEl.textContent = `Loaded ${data.length} records`;
        statusEl.style.color = '#4BC0C0';

        // Populate data table
        populateDataTable(data);

        console.log(`Loaded ${data.length} historical records from ${start} to ${end}`);
    } catch (error) {
        console.error('Error loading historical data:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = '#FF6384';
    } finally {
        loadBtn.disabled = false;
    }
}
```

### H. Mock Data Functions
```javascript
async function loadMockData() {
    try {
        const response = await fetch('/api/mock/load');
        const result = await response.json();
        
        if (result.success) {
            mockDataLoaded = true;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('resetBtn').disabled = false;
            document.getElementById('speedSlider').disabled = false;
            document.getElementById('progressInfo').textContent = `Loaded ${result.totalRows} rows`;
            console.log(`Mock data loaded: ${result.totalRows} rows`);
        }
    } catch (error) {
        console.error('Error loading mock data:', error);
        alert('Failed to load mock data: ' + error.message);
    }
}

async function startMockPlayback() { /* ... */ }
async function pauseMockPlayback() { /* ... */ }
async function resetMockPlayback() { /* ... */ }
async function setMockSpeed(speed) { /* ... */ }
```

### I. Mode Switching
```javascript
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'live') {
        document.getElementById('liveControls').classList.remove('hidden');
        document.getElementById('mockControls').classList.add('hidden');
        
        if (mockStatusInterval) {
            clearInterval(mockStatusInterval);
            mockStatusInterval = null;
        }
    } else {
        document.getElementById('liveControls').classList.add('hidden');
        document.getElementById('mockControls').classList.remove('hidden');
    }
    
    console.log(`Switched to ${mode} mode`);
}
```

### J. InfluxDB Status Update
```javascript
async function updateInfluxStatus() {
    try {
        const response = await fetch('/api/influxdb/stats');
        const result = await response.json();

        if (result.success) {
            const statusText = `InfluxDB: ${result.totalPoints} points`;
            const statusEl = document.getElementById('influxStatus');
            const statusElMock = document.getElementById('influxStatusMock');

            if (statusEl) statusEl.textContent = statusText;
            if (statusElMock) statusElMock.textContent = statusText;

            if (result.errorCount > 0) {
                if (statusEl) {
                    statusEl.style.color = '#FF6384';
                    statusEl.title = `Errors: ${result.errorCount} - ${result.lastError}`;
                }
                if (statusElMock) {
                    statusElMock.style.color = '#FF6384';
                    statusElMock.title = `Errors: ${result.errorCount} - ${result.lastError}`;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching InfluxDB stats:', error);
    }
}

// Update every 5 seconds
setInterval(updateInfluxStatus, 5000);
```

### K. Event Listeners
```javascript
// Mode switching
document.querySelectorAll('input[name="dataMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        switchMode(e.target.value);
    });
});

// Mock controls
document.getElementById('loadMockBtn').addEventListener('click', () => {
    loadMockData();
    connectWebSocket();
});
document.getElementById('playBtn').addEventListener('click', startMockPlayback);
document.getElementById('pauseBtn').addEventListener('click', pauseMockPlayback);
document.getElementById('resetBtn').addEventListener('click', resetMockPlayback);
document.getElementById('speedSlider').addEventListener('input', (e) => {
    const speed = speedValues[parseInt(e.target.value)];
    document.getElementById('speedDisplay').textContent = speed + 'x';
    setMockSpeed(speed);
});

// Historical data
document.getElementById('timeRange').addEventListener('change', (e) => {
    const customInputs = document.getElementById('customRangeInputs');
    if (e.target.value === 'custom') {
        customInputs.style.display = 'flex';
        const now = new Date();
        const oneHourAgo = new Date(now - 60 * 60 * 1000);
        document.getElementById('endTime').value = now.toISOString().slice(0, 16);
        document.getElementById('startTime').value = oneHourAgo.toISOString().slice(0, 16);
    } else {
        customInputs.style.display = 'none';
    }
});
document.getElementById('loadHistoricalBtn').addEventListener('click', loadHistoricalData);

// Data table
document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
document.getElementById('rowsPerPage').addEventListener('change', () => {
    populateDataTable(currentTableData);
});
```

---

## File: `package.json`

### Dependencies Added
```json
{
  "dependencies": {
    "mqtt": "^5.3.0",
    "ws": "^8.16.0",
    "@influxdata/influxdb-client": "^1.33.2"
  }
}
```

**Purpose**: Add InfluxDB client library for JavaScript.

---

## Environment Variables

### Required Environment Variables
```bash
MQTT_BROKER=mqtt://localhost:1883
WS_PORT=8080
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=<your-influxdb-token>
INFLUX_ORG=encardio
INFLUX_BUCKET=nexus
```

---

## Key Technical Decisions

### 1. Manual Data Grouping vs. Pivot
**Problem**: The Flux `pivot()` function wasn't working correctly with the JavaScript client.

**Solution**: Query raw data and manually group by timestamp in JavaScript:
```javascript
// Group data by timestamp
const dataMap = new Map();
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

### 2. InfluxDB Row Access Pattern
**Problem**: InfluxDB returns rows as arrays, not objects.

**Solution**: Use `tableMeta.columns` to find column indices:
```javascript
const timeIndex = tableMeta.columns.findIndex(col => col.label === '_time');
const fieldIndex = tableMeta.columns.findIndex(col => col.label === '_field');
const valueIndex = tableMeta.columns.findIndex(col => col.label === '_value');

const time = row[timeIndex];
const field = row[fieldIndex];
const value = row[valueIndex];
```

### 3. Batching and Flushing
**Problem**: Writing every data point individually is inefficient.

**Solution**: Use InfluxDB client's built-in batching:
```javascript
const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms', {
    batchSize: 100,
    flushInterval: 5000,
    maxRetries: 3,
    maxBufferLines: 10000
});
```

### 4. Null-Safe Table Rendering
**Problem**: Null values caused errors when calling `.toFixed()`.

**Solution**: Add null checks before formatting:
```javascript
const formatValue = (val) => {
    return (val !== null && val !== undefined) ? Number(val).toFixed(6) : 'N/A';
};
```

---

## Testing Checklist

### ✅ Live MQTT Mode
- [ ] Connect to MQTT broker
- [ ] Receive real-time sensor data
- [ ] Data writes to InfluxDB
- [ ] InfluxDB counter increases
- [ ] Real-time chart updates

### ✅ Mock CSV Mode
- [ ] Load CSV data
- [ ] Play/pause/reset controls work
- [ ] Speed control works (0.5x to 10x)
- [ ] Data streams via WebSocket
- [ ] Mock data writes to InfluxDB
- [ ] InfluxDB counter increases

### ✅ Historical Data
- [ ] Select time range (5m, 1h, 24h, custom)
- [ ] Load historical data
- [ ] Chart displays correctly
- [ ] Timestamps are accurate
- [ ] All 4 channels display

### ✅ Data Table
- [ ] Table populates with data
- [ ] Timestamps format correctly
- [ ] Channel values display with 6 decimals
- [ ] Rows per page selector works
- [ ] Hover effect works
- [ ] Scrolling works
- [ ] CSV export works
- [ ] Downloaded CSV opens correctly

---

## Future Enhancements

### Potential Improvements
1. **Pagination**: Add previous/next buttons for large datasets
2. **Column Sorting**: Click column headers to sort
3. **Search/Filter**: Search timestamps or filter by value ranges
4. **Data Aggregation**: Show min/max/avg in table footer
5. **Live Data Table**: Real-time table updates (not just chart)
6. **Multiple CSV Files**: Upload custom CSV files
7. **Data Visualization**: Add FFT, histogram, statistics panels
8. **Export Formats**: PDF, Excel, JSON export options
9. **Time Zone Support**: Display timestamps in user's local time zone
10. **Dark Mode**: Theme switcher

---

## Troubleshooting

### Common Issues

#### 1. InfluxDB Connection Failed
**Symptom**: "✗ InfluxDB connection test failed"
**Solution**: 
- Check InfluxDB is running: `docker ps`
- Verify token is correct
- Verify org and bucket names

#### 2. No Data in Historical Chart
**Symptom**: "No data found for this time range"
**Solution**:
- Increase time range (try "Last 1 hour" or "Last 24 hours")
- Generate fresh data using Mock CSV mode
- Check if data is being written: watch InfluxDB counter

#### 3. Table Shows "N/A"
**Symptom**: All channel values show "N/A"
**Solution**:
- Check server logs for "Retrieved X raw data points"
- Verify data grouping: "Grouped into X unique timestamps"
- Ensure tableMeta column indices are found correctly

#### 4. MQTT Disconnecting
**Symptom**: "MQTT error" messages
**Solution**:
- Check MQTT broker is running
- Verify network connectivity
- Check broker allows connections

---

## Performance Considerations

### Data Volume
- **Real-time**: ~10 Hz (10 samples/second) = 36,000 points/hour
- **InfluxDB batching**: Groups 100 points before writing
- **Flush interval**: Every 5 seconds
- **Query optimization**: Manual grouping faster than pivot for large datasets

### Memory Usage
- **Mock data**: ~2000 rows = ~200 KB in memory
- **Chart data**: Limited by browser (typically 10,000-50,000 points)
- **Table rendering**: Pagination prevents rendering all rows at once

### Network Optimization
- **WebSocket**: Single persistent connection for real-time data
- **HTTP/2**: Multiple requests multiplexed over one connection
- **Compression**: InfluxDB uses Snappy compression

---

## File Structure Summary

```
hsdl_app_docker-main/
└── torizon-zmq/
    └── web-interface/
        ├── server.js                 # Node.js server (MQTT, WebSocket, InfluxDB, HTTP API)
        ├── index.html                # Frontend UI (charts, table, controls)
        ├── package.json              # Dependencies (mqtt, ws, @influxdata/influxdb-client)
        ├── mock_data.csv             # Sample CSV data for testing
        ├── logo.png                  # Encardio Rite logo
        └── CHANGELOG.md              # This file
```

---

## Version History

### Version 2.0 (Current)
- ✅ InfluxDB integration
- ✅ Historical data visualization
- ✅ Data table with CSV export
- ✅ Mock CSV playback mode
- ✅ Mode switching (Live/Mock)
- ✅ InfluxDB write statistics
- ✅ Enhanced error handling

### Version 1.0 (Initial)
- Basic MQTT to WebSocket bridge
- Real-time chart (4 channels)
- Channel value cards
- Connect/disconnect controls

---

## Credits

**Developed for**: Encardio Rite Electronics Pvt. Ltd.  
**Application**: High Speed Datalogger Monitoring System  
**Technologies**: Node.js, Chart.js, InfluxDB, MQTT, WebSocket  
**Date**: November 2025

---

## Contact & Support

For issues or questions:
1. Check this CHANGELOG.md for troubleshooting
2. Review server logs in PowerShell/Terminal
3. Check browser console (F12) for client-side errors
4. Verify InfluxDB, MQTT broker, and Docker containers are running

---

**End of Change Log**

