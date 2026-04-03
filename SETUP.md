# 🚀 Edgewise Setup Guide

Follow these steps to get Edgewise running locally.

## 📋 Prerequisites

Install these first:
- Node.js 18+ ([Download](https://nodejs.org))
- Python 3.11+ ([Download](https://python.org))
- Docker Desktop ([Download](https://docker.com/products/docker-desktop))
- Git

## 📁 Project Structure

Place files in this structure:

```
edgewise-v2/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EdgewiseApp.jsx
│   │   │   └── BettingAssistant.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── infra/
│   └── db/
│       └── schema.sql
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── DEPLOYMENT.md
└── SETUP.md (this file)
```

## 🎯 Quick Start (Docker - Recommended)

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or open in VS Code
```

### 2. Start Everything
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

### 4. Initialize Database
```bash
# Run migrations
docker-compose exec backend python -c "
from sqlalchemy import create_engine
engine = create_engine('postgresql://edgewise_user:edgewise_pass@postgres:5432/edgewise')
with open('/app/infra/db/schema.sql') as f:
    engine.execute(f.read())
"
```

## 🛠️ Manual Setup (Without Docker)

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

Access at: http://localhost:8000

### 3. Database Setup
```bash
# Install PostgreSQL
# Create database
createdb edgewise

# Run schema
psql -d edgewise -f infra/db/schema.sql
```

## 🔑 Environment Variables

Edit `.env` file:

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/edgewise
ANTHROPIC_API_KEY=your_key_here

# Optional
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
DEBUG=true
```

## ✅ Verify Installation

### Check Frontend
```bash
curl http://localhost:5173
```

### Check Backend
```bash
curl http://localhost:8000/health
```

### Check Database
```bash
docker-compose exec postgres psql -U edgewise_user -d edgewise -c "SELECT COUNT(*) FROM sports;"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
# In vite.config.js, change port: 5173 to port: 3000
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Module Not Found Errors
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
pip install -r requirements.txt --force-reinstall
```

## 📚 Next Steps

1. ✅ **Customize**: Update colors, branding in components
2. ✅ **Connect APIs**: Add real sportsbook integrations
3. ✅ **Deploy**: Follow DEPLOYMENT.md for production setup
4. ✅ **Test**: Run `npm test` and `pytest`

## 🆘 Getting Help

- 📖 Read: README.md for architecture
- 🚀 Deploy: DEPLOYMENT.md for production
- 💬 Issues: Create GitHub issue
- 📧 Email: support@edgewise.app

---

**You're ready to build!** 🎯
