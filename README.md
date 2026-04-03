# Edgewise - Sports Betting Odds Aggregator

> Find the best odds and highest-edge props across sportsbooks using real-time data and AI insights.

## 🎯 Overview

Edgewise helps sports bettors make smarter decisions by:
- **Aggregating odds** from multiple sportsbooks (DraftKings, FanDuel, BetMGM, Caesars)
- **Identifying value** by calculating edge vs. market consensus
- **AI-powered insights** through a natural language betting assistant
- **Real-time updates** with snapshot-based odds consistency

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for backend)
- PostgreSQL 14+

### Frontend Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

### Backend Setup (FastAPI)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload
```

## 📁 Project Structure

```
edgewise/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EdgewiseApp.jsx       # Main odds display
│   │   │   ├── BettingAssistant.jsx  # AI chat interface
│   │   │   └── ...
│   │   ├── api/
│   │   │   └── client.js             # API integration
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── props.py          # Props endpoints
│   │   │   │   ├── odds.py           # Odds endpoints
│   │   │   │   └── chat.py           # AI assistant
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── props.py
│   │   │   └── odds.py
│   │   ├── services/
│   │   │   ├── odds_aggregator.py    # Sportsbook integration
│   │   │   └── ai_assistant.py       # Claude integration
│   │   └── main.py
│   └── requirements.txt
│
└── README.md
```

## 🎨 Features

### ✅ MVP (Implemented)

- **Real-time Odds Aggregation**: Live odds from 4+ sportsbooks
- **Best Price Display**: Automatic ranking of best available odds
- **Prop Filtering**: Search by player, market, sport
- **Edge Calculation**: Value metrics vs. market average
- **Snapshot Consistency**: Historical reproducibility
- **Responsive Design**: Mobile-first interface

### 🔄 Phase 2 (In Progress)

- **AI Betting Assistant**: Natural language queries via Claude
- **Line Movement Alerts**: Push notifications on significant changes
- **Advanced Analytics**: Historical trends, player matchups
- **Multi-sport Support**: NFL, MLB expansion

### 📋 Roadmap

- [ ] User accounts & preferences
- [ ] Bankroll management tools
- [ ] Custom alerts & notifications
- [ ] Social features (bet sharing)
- [ ] Premium analytics
- [ ] Mobile apps (iOS/Android)

## 🔌 API Integration

### Backend Endpoints

```javascript
// Get all props with filters
GET /api/v1/props?player=LeBron&market=points&sport=NBA

// Get specific prop details
GET /api/v1/props/:id

// Get best odds for prop
GET /api/v1/props/:id/best-odds

// AI Assistant query
POST /api/v1/chat
{
  "message": "What's the best LeBron prop tonight?",
  "context": []
}
```

### Frontend API Client

```javascript
import { apiClient } from './api/client';

// Fetch props
const props = await apiClient.getProps({
  player: 'LeBron James',
  market: 'player_points'
});

// Get best odds
const bestOdds = await apiClient.getBestOdds(propId);

// Query AI assistant
const response = await apiClient.queryAssistant(message);
```

## 🤖 AI Assistant Integration

The betting assistant uses Claude's API for natural language understanding:

```python
# backend/app/services/ai_assistant.py
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def query_assistant(message: str, context: list):
    """
    Process natural language betting queries
    Returns: AI response with prop recommendations
    """
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[
            {"role": "user", "content": message}
        ],
        system="You are an expert sports betting analyst..."
    )
    return response.content
```

## 🎨 Design System

### Color Palette
```css
--bg-primary: #0a0e1a;      /* Deep space blue */
--bg-secondary: #111827;     /* Dark slate */
--accent-primary: #00ff88;   /* Electric green */
--accent-secondary: #0066ff; /* Tech blue */
--edge-high: #00ff88;        /* High value */
--edge-medium: #ffaa00;      /* Medium value */
```

### Typography
- **Display**: Space Mono (terminal aesthetic)
- **Body**: JetBrains Mono (code clarity)
- **Emphasis**: Bold weights, accent colors

### Key Components
- Terminal-inspired grid background
- Real-time pulsing indicators
- Smooth expand/collapse animations
- Gradient accents on high-value props

## 📊 Data Models

### Prop Schema
```typescript
interface Prop {
  id: number;
  player: string;
  market: 'player_points' | 'player_rebounds' | 'player_assists';
  line: number;
  bestOdds: {
    sportsbook: string;
    price: number;
    implied: number;
  };
  allOdds: Array<{
    sportsbook: string;
    over: number;
    under: number;
  }>;
  edge: number;
  timestamp: string;
}
```

## 🔐 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost/edgewise
ANTHROPIC_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key
```

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
pytest

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
docker build -t edgewise-api .
docker run -p 8000:8000 edgewise-api
```

## 📜 Legal & Compliance

⚠️ **Important Disclaimers:**
- Edgewise is for informational purposes only
- We do not place bets or guarantee winnings
- Age restrictions apply (18+/21+ by jurisdiction)
- No sportsbook affiliations or inducements

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file

## 📞 Support

- Documentation: [docs.edgewise.app](https://docs.edgewise.app)
- Discord: [discord.gg/edgewise](https://discord.gg/edgewise)
- Email: support@edgewise.app

---

Built with ⚡ by sports betting enthusiasts, for sports betting enthusiasts.
