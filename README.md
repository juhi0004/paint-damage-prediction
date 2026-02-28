# 🚛🎨 Paint Damage Prediction

A damage prediction system for automotive paint shipments. Uses an XGBoost machine learning model to predict damage rates, estimate financial losses, and provide actionable recommendations.

---

## ✨ Features

### Frontend (React + TypeScript)
- 🔄 **Dark/Light Mode** — Full theme support with toggle
- 🎯 **Real-time Predictions** — Single shipment analysis
- 📊 **Batch Upload** — CSV upload for bulk predictions (100+ shipments)
- 🚨 **Risk Alerts Dashboard** — Real-time monitoring with severity levels
- ⚖️ **Dealer Comparison Tool** — Side-by-side performance analysis
- 📈 **Advanced Analytics** — Charts, tables, and metrics
- 🔍 **Smart Filtering** — Date ranges, search, warehouse/vehicle filters
- 📱 **Fully Responsive** — Mobile, tablet, and desktop optimized
- 💾 **CSV Export** — Download filtered data and predictions
- 🛡️ **Error Boundaries** — Graceful error handling

### Backend (FastAPI + MongoDB)
- 🤖 **XGBoost ML Model** — Production-ready damage prediction
- ⚡ **High Performance** — Async API with Pydantic validation
- 🗄️ **MongoDB** — Persistent storage for shipments & predictions
- 🔐 **JWT Authentication** — Secure user sessions
- 📊 **Analytics API** — Dealer performance, warehouse metrics
- 🧪 **Auto-generated Docs** — Swagger UI at `/docs`

### Key Capabilities
- ✅ Predict damage rate with 94%+ accuracy
- ✅ Real-time risk assessment (Low / Medium / High / Critical)
- ✅ Estimated financial loss calculation
- ✅ Loading optimization recommendations
- ✅ Historical dealer/warehouse performance tracking
- ✅ Batch processing for 1000+ shipments
- ✅ Professional enterprise-grade UI

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5.0, Vite, TanStack Query, React Router 6, Recharts, TailwindCSS, react-hot-toast |
| **Backend** | FastAPI 0.104, XGBoost 2.0, Motor, Pydantic 2.0, JWT, Uvicorn |
| **Database** | MongoDB 7.0, PyMongo |

---

## 🚀 Quick Start

### Prerequisites

```
Node.js 18+  |  Python 3.11+  |  MongoDB 7.0+  |  Docker (optional)
```

### 1. Clone the Repository

```bash
git clone https://github.com/juhi0004/paint-damage-prediction
cd paint-damage-predictor
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Start MongoDB (or use Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

> **Default Login:** `admin@example.com` / `password`

---

## 📁 Project Structure

```
paint-damage-predictor/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entrypoint
│   │   ├── models/          # Pydantic schemas
│   │   ├── api/             # API endpoints
│   │   ├── ml/              # XGBoost model
│   │   └── database.py      # MongoDB connection
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Dashboard, Predictions, etc.)
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── api/             # API clients
│   │   ├── contexts/        # Theme & Auth contexts
│   │   └── utils/           # Export, date utilities
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 🔧 API Endpoints

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/auth/login` | POST | User authentication | No |
| `/predictions` | POST | Single shipment prediction | Yes |
| `/shipments` | GET / POST | Shipment CRUD | Yes |
| `/analytics/summary` | GET | Dashboard metrics | Yes |
| `/analytics/dealers` | GET | Top risk dealers | Yes |
| `/analytics/warehouses` | GET | Warehouse performance | Yes |

Full interactive documentation available at: `http://localhost:8000/docs`

---

## 🛠️ Environment Configuration

### Backend `.env`

```env
MONGODB_URL=mongodb://localhost:27017/paint_predictor
SECRET_KEY=your-super-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
VITE_APP_VERSION=1.0.0
```

---

## 📊 Sample Data Format

### Prediction Request (JSON)

```json
{
  "date": "2026-03-01T10:00:00Z",
  "dealer_code": 17,
  "warehouse": "NAG",
  "product_code": "321123678",
  "vehicle": "Minitruck",
  "shipped": 25,
  "model": "xgboost"
}
```

### Batch Upload CSV Template

```csv
date,dealer_code,warehouse,product_code,vehicle,shipped
2026-03-01T10:00:00Z,17,NAG,321123678,Minitruck,25
2026-03-01T11:00:00Z,23,MUM,456789123,Autorickshaw,30
```

---

## 🔍 Development Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Backend

```bash
uvicorn app.main:app --reload   # Start dev server with hot reload
pytest tests/                   # Run test suite
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) — Lightning-fast Python API framework
- [TanStack Query](https://tanstack.com/query) — Powerful data synchronization
- [Recharts](https://recharts.org/) — Beautiful responsive charts
- [MongoDB](https://www.mongodb.com/) — Robust NoSQL database
- [XGBoost](https://xgboost.readthedocs.io/) — State-of-the-art ML predictions