# Salt Crystal Purity Detection System

Real-time salt crystal purity detection using YOLOv8 and ONNX Runtime.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Next.js       │◄──────────────────►│   NestJS        │
│   Frontend      │     REST API       │   Backend       │
│   (Port 3000)   │◄──────────────────►│   (Port 3001)   │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │   PostgreSQL    │
                                       │   (Port 5432)   │
                                       └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │   ONNX Model    │
                                       │   (best.onnx)   │
                                       └─────────────────┘
```

---

## Prerequisites

- **Node.js** 18+
- **Docker** (for PostgreSQL)
- **Git**

---

## Quick Start

### 1. Start PostgreSQL Database

If you don't have PostgreSQL running:

```bash
docker run -d \
  --name salt-detection-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=fd1234 \
  -e POSTGRES_DB=salt_vision \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Start Backend

```bash
cd salt-detection-backend

# Install dependencies (first time only)
npm install

# Run database migrations (first time only)
npx prisma migrate dev --name init

# Start development server
npm run start:dev
```

Backend runs on: **http://localhost:3001**

### 3. Start Frontend

```bash
cd salt-detection-frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

## API Documentation (Swagger)

Open in browser: **http://localhost:3001/api/docs**

---

## API Endpoints

### Health Check

```bash
# Check system health
curl http://localhost:3001/api/health
```

Response:
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

### Detections

```bash
# Get all detections (paginated)
curl "http://localhost:3001/api/detections?page=1&limit=10"

# Get recent detections
curl "http://localhost:3001/api/detections/recent?limit=5"

# Get single detection by ID
curl http://localhost:3001/api/detections/{id}

# Delete detection
curl -X DELETE http://localhost:3001/api/detections/{id}
```

### Statistics

```bash
# Get summary statistics
curl http://localhost:3001/api/statistics/summary

# Get summary for date range
curl "http://localhost:3001/api/statistics/summary?startDate=2025-12-01&endDate=2025-12-31"

# Get hourly statistics (today)
curl http://localhost:3001/api/statistics/hourly

# Get hourly statistics for specific date
curl "http://localhost:3001/api/statistics/hourly?date=2025-12-27"

# Get daily statistics (last 30 days)
curl http://localhost:3001/api/statistics/daily

# Get daily statistics with custom range
curl "http://localhost:3001/api/statistics/daily?startDate=2025-12-01&endDate=2025-12-31"

# Get purity trends
curl "http://localhost:3001/api/statistics/trends?period=daily&limit=30"
```

---

## WebSocket API

Connect to: `ws://localhost:3001/detection`

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `start_stream` | `{}` | Start detection session |
| `stop_stream` | `{}` | Stop detection session |
| `frame` | `{ data: "base64...", timestamp: 123456 }` | Send camera frame |
| `update_settings` | `{ saveDetections: true }` | Update settings |

### Server → Client Events

| Event | Description |
|-------|-------------|
| `connection_status` | Connection and model status |
| `stream_started` | Session started confirmation |
| `stream_stopped` | Session ended with summary |
| `detection_result` | Real-time detection results |
| `error` | Error notification |

### Example WebSocket Client (JavaScript)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001/detection");

socket.on("connect", () => {
  console.log("Connected!");
  socket.emit("start_stream", {});
});

socket.on("detection_result", (result) => {
  console.log("Pure:", result.pureCount);
  console.log("Impure:", result.impureCount);
  console.log("Purity:", result.purityPercentage + "%");
});

// Send frame (base64 encoded image)
socket.emit("frame", {
  data: "base64_image_data_here",
  timestamp: Date.now()
});
```

---

## Project Structure

```
yolo/
├── inference/
│   ├── best.pt              # Original PyTorch model
│   ├── best.onnx            # Converted ONNX model
│   └── main.py              # Python inference script
├── salt-detection-backend/  # NestJS Backend
│   ├── src/
│   │   ├── detection/       # Detection API & WebSocket
│   │   ├── inference/       # ONNX model inference
│   │   ├── statistics/      # Statistics API
│   │   ├── prisma/          # Database service
│   │   └── health/          # Health check
│   ├── models/
│   │   └── best.onnx        # ONNX model copy
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── .env                 # Environment config
├── salt-detection-frontend/ # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Pages
│   │   ├── components/      # UI components
│   │   ├── hooks/           # React hooks
│   │   ├── stores/          # Zustand stores
│   │   └── lib/             # Utilities
│   └── .env.local           # Environment config
├── scripts/
│   └── convert-to-onnx.py   # Model conversion script
└── docker-compose.yml       # Docker deployment
```

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://admin:fd1234@localhost:5432/salt_vision"

# Server
PORT=3001
NODE_ENV=development

# Model Configuration
MODEL_PATH=./models/best.onnx
CONFIDENCE_THRESHOLD=0.5
IOU_THRESHOLD=0.45
INPUT_SIZE=320

# WebSocket
WS_CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## Database Schema

```sql
-- Detection records
Detection {
  id                String (UUID)
  timestamp         DateTime
  frameWidth        Int
  frameHeight       Int
  processingTimeMs  Float
  pureCount         Int
  impureCount       Int
  totalCount        Int
  purityPercentage  Float
  sessionId         String?
}

-- Bounding boxes for each detection
BoundingBox {
  id          String (UUID)
  detectionId String
  x           Float (0-1)
  y           Float (0-1)
  width       Float (0-1)
  height      Float (0-1)
  classId     Int (0=pure, 1=impure)
  className   String
  confidence  Float (0-1)
}

-- Detection sessions
DetectionSession {
  id               String (UUID)
  startTime        DateTime
  endTime          DateTime?
  totalFrames      Int
  totalPureCount   Int
  totalImpureCount Int
  avgPurityPercent Float?
}
```

---

## Useful Commands

### Backend

```bash
# Development mode (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test

# Prisma commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Run migrations
npx prisma generate        # Regenerate client
npx prisma db push         # Push schema changes
```

### Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Lint code
npm run lint
```

### Docker

```bash
# Start all services
docker-compose up -d

# Start only database
docker-compose up db -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## Troubleshooting

### Backend won't start

1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Verify database connection:
   ```bash
   npx prisma db pull
   ```

3. Check ONNX model exists:
   ```bash
   ls salt-detection-backend/models/best.onnx
   ```

### Frontend camera not working

1. Ensure HTTPS or localhost (camera requires secure context)
2. Check browser permissions for camera access
3. Try different browser (Chrome recommended)

### WebSocket connection fails

1. Verify backend is running on port 3001
2. Check CORS settings in backend `.env`
3. Ensure `WS_CORS_ORIGIN` matches frontend URL

---

## Detection Classes

| Class ID | Name | Color | Description |
|----------|------|-------|-------------|
| 0 | pure | Green (#22c55e) | Pure salt crystals |
| 1 | impure | Red (#ef4444) | Impure/contaminated crystals |

---

## Performance Tips

1. **Reduce frame rate** - Default is ~10 FPS, reduce if CPU is high
2. **Lower resolution** - Input is resized to 320x320 for inference
3. **Disable save** - Turn off `saveDetections` for faster processing
4. **Use GPU** - Edit `inference.service.ts` to use `cuda` provider

---

## License

MIT
