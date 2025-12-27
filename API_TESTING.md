# API Testing Guide

Base URL: `http://localhost:3001/api`

Swagger UI: `http://localhost:3001/api/docs`

---

## Health Check

### Check System Status
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-27T13:50:26.000Z",
  "model": {
    "loaded": true,
    "path": "./models/best.onnx"
  },
  "database": {
    "status": "healthy"
  }
}
```

---

## Detections API

### List All Detections (Paginated)
```bash
curl "http://localhost:3001/api/detections?page=1&limit=10"
```

### Filter by Date Range
```bash
curl "http://localhost:3001/api/detections?startDate=2025-12-01&endDate=2025-12-31"
```

### Filter by Purity
```bash
curl "http://localhost:3001/api/detections?minPurity=80&maxPurity=100"
```

### Get Recent Detections
```bash
curl "http://localhost:3001/api/detections/recent?limit=5"
```

### Get Single Detection by ID
```bash
curl http://localhost:3001/api/detections/YOUR_DETECTION_ID
```

### Create Detection (Manual)
```bash
curl -X POST http://localhost:3001/api/detections \
  -H "Content-Type: application/json" \
  -d '{
    "frameWidth": 640,
    "frameHeight": 480,
    "processingTimeMs": 45.5,
    "boundingBoxes": [
      {
        "x": 0.1,
        "y": 0.2,
        "width": 0.15,
        "height": 0.15,
        "classId": 0,
        "className": "pure",
        "confidence": 0.95
      },
      {
        "x": 0.5,
        "y": 0.3,
        "width": 0.12,
        "height": 0.12,
        "classId": 1,
        "className": "impure",
        "confidence": 0.87
      }
    ]
  }'
```

### Delete Detection
```bash
curl -X DELETE http://localhost:3001/api/detections/YOUR_DETECTION_ID
```

---

## Statistics API

### Get Summary Statistics
```bash
curl http://localhost:3001/api/statistics/summary
```

**Expected Response:**
```json
{
  "totalDetections": 150,
  "totalPure": 120,
  "totalImpure": 45,
  "averagePurity": 72.73,
  "averageProcessingTime": 42.5,
  "detectionsPerHour": 15.2,
  "periodStart": "2025-12-27T00:00:00.000Z",
  "periodEnd": "2025-12-27T13:50:00.000Z"
}
```

### Get Summary for Date Range
```bash
curl "http://localhost:3001/api/statistics/summary?startDate=2025-12-01&endDate=2025-12-31"
```

### Get Hourly Statistics (Today)
```bash
curl http://localhost:3001/api/statistics/hourly
```

**Expected Response:**
```json
[
  { "hour": 0, "detections": 0, "pureCount": 0, "impureCount": 0, "avgPurity": 100 },
  { "hour": 1, "detections": 0, "pureCount": 0, "impureCount": 0, "avgPurity": 100 },
  { "hour": 13, "detections": 25, "pureCount": 18, "impureCount": 7, "avgPurity": 72 },
  ...
]
```

### Get Hourly Statistics for Specific Date
```bash
curl "http://localhost:3001/api/statistics/hourly?date=2025-12-27"
```

### Get Daily Statistics (Last 30 Days)
```bash
curl http://localhost:3001/api/statistics/daily
```

**Expected Response:**
```json
[
  { "date": "2025-12-20", "detections": 100, "pureCount": 80, "impureCount": 20, "avgPurity": 80 },
  { "date": "2025-12-21", "detections": 150, "pureCount": 110, "impureCount": 40, "avgPurity": 73.33 },
  ...
]
```

### Get Daily Statistics with Custom Range
```bash
curl "http://localhost:3001/api/statistics/daily?startDate=2025-12-01&endDate=2025-12-31&limit=30"
```

### Get Purity Trends
```bash
# Daily trends (last 30 days)
curl "http://localhost:3001/api/statistics/trends?period=daily&limit=30"

# Hourly trends (last 24 hours)
curl "http://localhost:3001/api/statistics/trends?period=hourly&limit=24"

# Weekly trends
curl "http://localhost:3001/api/statistics/trends?period=weekly&limit=12"
```

---

## PowerShell Commands (Windows)

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health" | ConvertTo-Json
```

### Get Detections
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/detections?page=1&limit=10" | ConvertTo-Json -Depth 5
```

### Get Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/statistics/summary" | ConvertTo-Json
```

### Create Detection
```powershell
$body = @{
    frameWidth = 640
    frameHeight = 480
    processingTimeMs = 45.5
    boundingBoxes = @(
        @{
            x = 0.1
            y = 0.2
            width = 0.15
            height = 0.15
            classId = 0
            className = "pure"
            confidence = 0.95
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3001/api/detections" -Method Post -Body $body -ContentType "application/json"
```

---

## Response Formats

### Paginated Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Detection Object
```json
{
  "id": "uuid-here",
  "timestamp": "2025-12-27T13:50:00.000Z",
  "frameWidth": 640,
  "frameHeight": 480,
  "processingTimeMs": 45.5,
  "pureCount": 3,
  "impureCount": 1,
  "totalCount": 4,
  "purityPercentage": 75.0,
  "sessionId": "session-uuid",
  "boundingBoxes": [
    {
      "id": "box-uuid",
      "x": 0.1,
      "y": 0.2,
      "width": 0.15,
      "height": 0.15,
      "classId": 0,
      "className": "pure",
      "confidence": 0.95
    }
  ]
}
```

### Error Response
```json
{
  "statusCode": 404,
  "message": "Detection with ID xxx not found",
  "error": "Not Found"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## WebSocket Testing

### Using websocat (CLI tool)
```bash
# Install websocat
# Windows: scoop install websocat
# Mac: brew install websocat

# Connect
websocat ws://localhost:3001/detection

# Send start_stream event
{"event":"start_stream","data":{}}
```

### Using Browser Console
```javascript
const socket = io("http://localhost:3001/detection");

socket.on("connect", () => console.log("Connected"));
socket.on("connection_status", (data) => console.log("Status:", data));
socket.on("detection_result", (data) => console.log("Detection:", data));

// Start stream
socket.emit("start_stream", {});

// Stop stream
socket.emit("stop_stream", {});
```
