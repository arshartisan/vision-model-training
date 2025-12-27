# Quick Start Guide

## Running the Application

### Step 1: Ensure PostgreSQL is Running

Your existing PostgreSQL container `fd-postgres` should be running with database `salt_vision`.

```bash
# Check if container is running
docker ps | grep postgres
```

### Step 2: Start Backend Server

Open **Terminal 1**:

```bash
cd C:\Development\python\yolo\salt-detection-backend
npm run start:dev
```

Wait for:
```
Application is running on: http://localhost:3001
Swagger docs available at: http://localhost:3001/api/docs
```

### Step 3: Start Frontend Server

Open **Terminal 2**:

```bash
cd C:\Development\python\yolo\salt-detection-frontend
npm run dev
```

Wait for:
```
✓ Ready in 11.1s
- Local: http://localhost:3000
```

### Step 4: Open the Dashboard

Open browser: **http://localhost:3000**

---

## Testing the API with Swagger

Open: **http://localhost:3001/api/docs**

### Available Endpoints:

#### Health
- `GET /api/health` - Check system status

#### Detections
- `GET /api/detections` - List all detections
- `GET /api/detections/recent` - Get recent detections
- `GET /api/detections/{id}` - Get single detection
- `POST /api/detections` - Create detection
- `DELETE /api/detections/{id}` - Delete detection

#### Statistics
- `GET /api/statistics/summary` - Overall statistics
- `GET /api/statistics/hourly` - Hourly breakdown
- `GET /api/statistics/daily` - Daily breakdown
- `GET /api/statistics/trends` - Purity trends

---

## Quick API Tests with cURL

### Check Health
```bash
curl http://localhost:3001/api/health
```

### Get Statistics Summary
```bash
curl http://localhost:3001/api/statistics/summary
```

### Get Recent Detections
```bash
curl http://localhost:3001/api/detections/recent?limit=5
```

### Get Hourly Stats
```bash
curl http://localhost:3001/api/statistics/hourly
```

---

## Using the Dashboard

1. **Open** http://localhost:3000
2. **Click** "Start Detection" button
3. **Allow** camera access when prompted
4. **Point** camera at salt crystals
5. **Watch** real-time detection with:
   - Green boxes = Pure crystals
   - Red boxes = Impure crystals
   - Purity percentage gauge
   - Live counts

### Dashboard Pages:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Live camera + real-time stats |
| History | `/history` | Detection records table |
| Statistics | `/statistics` | Charts and analytics |

---

## Stop the Servers

- **Backend**: Press `Ctrl+C` in Terminal 1
- **Frontend**: Press `Ctrl+C` in Terminal 2

---

## Common Issues

### "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps

# Restart container if needed
docker start fd-postgres
```

### "ONNX model not found"
```bash
# Verify model exists
ls salt-detection-backend/models/best.onnx
```

### "Port already in use"
```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 3000 (frontend)
npx kill-port 3000
```
