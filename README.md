# 🌾 Farm Wizard Backend API

> A gamified digital agriculture platform backend — plant crops, watch them grow, and harvest rewards.


---

## 🚀 Live API

```
https://farm-wizard-backend.onrender.com
```

## 📖 Tech Stack

| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT auth |
| `node-cron` | Background crop growth jobs |
| `express-rate-limit` | Rate limiting |
| `helmet` | Security headers |
| `morgan` | HTTP logging |
| `express-mongo-sanitize` | NoSQL injection protection |
| `zod` | Input validation |

---

## 📁 Project Structure

```
farm-wizard-backend/
├── server.js                    # Entry point
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── seedCrops.js         # Seeds default crop types
│   ├── models/
│   │   ├── user.model.js        # User schema
│   │   ├── farm.model.js        # FarmPlot schema
│   │   ├── cropType.model.js    # CropType schema
│   │   └── transaction.model.js # Transaction schema
│   ├── controllers/
│   │   ├── auth.controller.js   # Register, login, refresh
│   │   ├── farm.controller.js   # Plant, harvest, status
│   │   └── rewards.controller.js# Rewards, crops, leaderboard
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── farm.route.js
│   │   └── rewards.route.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT protect
│   │   └── errorHandler.js      # Global error handler
│   ├── jobs/
│   │   └── cropGrowth.job.js    # Background cron job
│   └── utils/
│       ├── jwt.js               # Token generation
│       └── response.js          # Response helpers
└── logs/
    └── access.log
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/farm-wizard-backend.git
cd farm-wizard-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/farmwizard
JWT_SECRET=your-strong-jwt-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-strong-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

### 4. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

The server will:
- Connect to MongoDB
- Seed 6 default crop types
- Start the crop growth background job
- Listen on `http://localhost:8000`

---

## 🌐 API Endpoints

### Health
```
GET /health
```

### Auth
```
POST /api/v1/auth/register    — Register new farmer
POST /api/v1/auth/login       — Login
POST /api/v1/auth/refresh-token — Refresh JWT
GET  /api/v1/auth/me          — Get current user (protected)
```

### Farm
```
GET  /api/v1/farm/status      — Get farm state + active crops
POST /api/v1/farm/plant       — Plant a seed
POST /api/v1/farm/harvest     — Harvest a mature crop
GET  /api/v1/farm/history     — Harvest history
```

### Crops & Rewards
```
GET /api/v1/crops             — List all available crops
GET /api/v1/rewards           — Wallet + transaction history
GET /api/v1/leaderboard       — Top farmers by coins
```

---

## 🌱 Available Crops

| Crop | Emoji | Growth Time | Cost | Reward | XP |
|---|---|---|---|---|---|
| Carrot | 🥕 | 1 min | 5 | 12 | 8 |
| Tomato | 🍅 | 2 min | 10 | 25 | 15 |
| Strawberry | 🍓 | 3 min | 15 | 35 | 20 |
| Corn | 🌽 | 5 min | 20 | 55 | 25 |
| Watermelon | 🍉 | 10 min | 40 | 120 | 50 |
| Pumpkin | 🎃 | 15 min | 60 | 200 | 80 |

---

## 🎮 Game Mechanics

- Each farmer starts with **100 coins** and **6 plot slots**
- Plant seeds by spending coins
- Crops grow in real-time — server validates maturity (anti-cheat)
- Harvest mature crops to earn coins and XP
- Every **100 XP = 1 level up**
- Crops left unharvested past **2x their growth time** die
- Background job runs **every minute** to update growth stages

---

## 🔐 Security

- JWT access tokens (15min) + refresh tokens (7d)
- bcrypt password hashing (12 rounds)
- Rate limiting: 100 req/15min global, 10 req/15min on auth
- Helmet security headers
- MongoDB sanitization (NoSQL injection protection)
- Server-side harvest validation — prevents time manipulation cheating
- 10KB payload size limit

---

## 🗄️ Database Models

### User
```
username, email, password (hashed), coins, level, experience, totalHarvests
```

### FarmPlot
```
farmer, cropType, cropName, stage, plantedAt, matureAt, isHarvested, plotNumber
Virtuals: growthPercentage, timeRemainingSeconds, isReady
```

### CropType
```
name, emoji, growthDurationMinutes, plantCost, harvestReward, experienceReward
```

### Transaction
```
user, type, amount, description, balanceBefore, balanceAfter
```

---

## 🐳 Deployment

Deployed on **Render** — connects to MongoDB Atlas.

Environment variables set via Render dashboard.

---

## 📝 License

Proprietary — DSHub Ltd. All rights reserved.
Built as part of DSHub Internship Program, Cohort A 2026.

---

*"A strong backend is invisible — but everything depends on it."*