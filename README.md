# RetailFlow AI — Inventory Forecasting Dashboard

A full-stack inventory management and AI demand forecasting dashboard built with React, Node.js, MongoDB, and a Python ML service.

**Stack:** React + Vite + Tailwind CSS | Node.js + Express | MongoDB | JWT Auth | Python Flask + scikit-learn

---

## Project Structure

```
retailflow-ai/
├── frontend/          # React app (Vite + Tailwind)
│   └── src/
│       ├── pages/     # Login, Signup, Dashboard, Inventory, Forecasting
│       ├── components/# Layout (sidebar)
│       └── context/   # AuthContext (JWT)
├── backend/           # Node.js + Express REST API
│   ├── models/        # User.js, Inventory.js (Mongoose)
│   ├── routes/        # auth, inventory, dashboard, forecast
│   ├── controllers/   # Business logic per route
│   ├── middleware/    # JWT auth middleware
│   ├── server.js      # Entry point
│   └── seed.js        # Database seeder
└── ml-service/        # Python Flask ML forecasting
    ├── app.py         # RandomForestRegressor forecast endpoint
    └── requirements.txt
```

---

## Prerequisites

- Node.js v18+
- Python 3.9+
- MongoDB Atlas account (free tier) or local MongoDB

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
# backend/.env  (copy from .env.example)
MONGO_URI=your_mongodb_connection_string   # paste your Atlas URI here
JWT_SECRET=your_jwt_secret                 # any random string, e.g. "mysecret123"
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

> Get a free MongoDB URI from [https://mongodb.com/atlas](https://mongodb.com/atlas)

### 3. Seed the database

```bash
cd backend
node seed.js
```

This creates:
- Demo user: `admin@retailflow.com` / `password123`
- 14 sample inventory items across 8 categories with 12 months of sales history

---

## Running the App

Open **3 terminal windows**:

**Terminal 1 — Backend (Express)**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend (React)**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 — ML Service (Python)**
```bash
cd ml-service
python app.py
# Runs on http://localhost:8000
```

Then open: **http://localhost:3000**

---

## Features

### Authentication
- JWT-based login/signup
- Tokens stored in localStorage
- Protected routes via React Router

### Dashboard
- KPI cards: Total Products, Low Stock Items, Monthly Sales, Predicted Demand
- 12-month sales trend (area chart)
- Inventory distribution by category (pie chart)
- Low stock alerts table

### Inventory Management
- Add / Edit / Delete products
- Fields: Name, SKU, Category, Quantity, Price, Low Stock Threshold, Description
- Search by name or SKU
- Filter by category
- Stock status badges (In Stock / Low Stock / Out of Stock)

### AI Forecasting
- Select any product and click "Run Forecast"
- Returns: predicted demand, restock quantity, confidence score
- Charts: 6-month history + forecast line, feature importance bar chart
- Plain-English recommendation text

---

## How the ML Model Works

The forecasting service (`ml-service/app.py`) uses **RandomForestRegressor** from scikit-learn.

**Input features per training row:**
| Feature | Description |
|---|---|
| Month number | Seasonal signal (1–12) |
| Price | Product price point |
| Category | Label-encoded category |
| Stock level | Current stock quantity |
| Lag 1 | Sales from previous month |
| Lag 2 | Sales from 2 months ago |
| Rolling Avg | 3-month rolling average |

**Training:** The model trains on the product's 12-month sales history every time a forecast is requested. This keeps it simple and explainable.

**Output:** Predicted units for next month + feature importance scores showing which variables influenced the prediction most.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | No | Register a new user |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/inventory | Yes | List all products |
| POST | /api/inventory | Yes | Add product |
| PUT | /api/inventory/:id | Yes | Update product |
| DELETE | /api/inventory/:id | Yes | Delete product |
| GET | /api/dashboard/stats | Yes | KPIs + sales trend |
| POST | /api/forecast | Yes | Run ML forecast |

---

## Demo Credentials

```
Email:    admin@retailflow.com
Password: password123
```

---

## Interview Talking Points

- **Why Random Forest?** Handles small datasets well, doesn't overfit easily, and provides feature importances for explainability — ideal for this use case.
- **Why separate ML service?** Decouples Python ML dependencies from the Node.js backend. Easy to swap in a different model later.
- **Why JWT?** Stateless auth that works well with REST APIs. No session storage needed.
- **Why MongoDB?** Flexible schema lets us store `salesHistory` as an array without complex joins.
- **Tradeoffs:** The ML model retrains on every request (fast enough for small datasets). In production, you'd pre-train and cache models.

---

## Built With

- React 18, React Router 6, Recharts, Lucide React
- Express.js, Mongoose, bcryptjs, jsonwebtoken
- scikit-learn, NumPy, Flask
- Tailwind CSS, Vite
