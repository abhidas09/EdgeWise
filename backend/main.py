"""
Edgewise Backend API - With Real Odds Integration
FastAPI application for sports betting odds aggregation
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import List
import asyncio
import sys
import os

# Add the services directory to path
sys.path.append(os.path.dirname(__file__))

# Import odds fetcher
try:
    from services.odds_fetcher import get_nba_props
    REAL_ODDS_AVAILABLE = True
except ImportError:
    REAL_ODDS_AVAILABLE = False
    logging.warning("Odds fetcher not available, using mock data")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store cached props
cached_props = []
last_update_time = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

# Background task for odds updates
async def odds_update_task():
    """Background task to fetch and broadcast odds updates"""
    global cached_props, last_update_time
    
    while True:
        try:
            if REAL_ODDS_AVAILABLE:
                logger.info("Fetching real odds from The Odds API...")
                props = get_nba_props()
                cached_props = props
                
                logger.info(f"Fetched {len(props)} props")
                
                # Broadcast update to all connected clients
                if props:
                    update = {
                        "event": "odds_update",
                        "payload": {
                            "total_props": len(props),
                            "timestamp": "2024-02-10T20:30:00Z"
                        }
                    }
                    await manager.broadcast(update)
            else:
                logger.info("Using mock data (odds fetcher not available)")
            
            # Update every 5 minutes to conserve API quota
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in odds update task: {e}")
            await asyncio.sleep(60)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Edgewise API...")
    logger.info("Initializing odds fetcher...")
    
    # Start background task for odds updates
    asyncio.create_task(odds_update_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down Edgewise API...")

# Initialize FastAPI app
app = FastAPI(
    title="Edgewise API",
    description="Sports betting odds aggregation and analysis API with real-time data",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Health Check & Status
# ============================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Edgewise API",
        "version": "2.0.0",
        "status": "operational",
        "real_odds": REAL_ODDS_AVAILABLE,
        "cached_props": len(cached_props)
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "real_odds_enabled": REAL_ODDS_AVAILABLE,
        "cached_props_count": len(cached_props)
    }

# ============================================
# Props Endpoints - Now with Real Data!
# ============================================

@app.get("/api/v1/props")
async def get_props(
    player: str | None = None,
    market: str | None = None,
    sport: str = "NBA",
    limit: int = 50
):
    """
    Get all available props with optional filters
    NOW USES REAL DATA FROM THE ODDS API!
    """
    global cached_props
    
    # Use real data if available, otherwise fall back to mock
    if REAL_ODDS_AVAILABLE and cached_props:
        props = cached_props
    else:
        # Mock data fallback
        props = [
            {
                "id": 1,
                "player": "LeBron James",
                "market": "player_points",
                "line": 25.5,
                "best_odds": {"sportsbook": "DraftKings", "price": -110, "implied": 52.4},
                "all_odds": [
                    {"sportsbook": "DraftKings", "over": -110, "under": -110},
                    {"sportsbook": "FanDuel", "over": -115, "under": -105},
                ],
                "edge": 2.3,
            }
        ]
    
    # Apply filters
    if player:
        props = [p for p in props if player.lower() in p["player"].lower()]
    if market:
        props = [p for p in props if p["market"] == market]
    
    # Add IDs and timestamps if missing
    for idx, prop in enumerate(props):
        if 'id' not in prop:
            prop['id'] = idx + 1
        if 'timestamp' not in prop:
            prop['timestamp'] = "2024-02-10T20:30:00Z"
    
    return {
        "props": props[:limit],
        "total": len(props),
        "filters": {
            "player": player,
            "market": market,
            "sport": sport
        },
        "data_source": "real" if (REAL_ODDS_AVAILABLE and cached_props) else "mock"
    }

@app.get("/api/v1/props/{prop_id}")
async def get_prop(prop_id: int):
    """Get detailed information for a specific prop"""
    global cached_props
    
    if cached_props and prop_id <= len(cached_props):
        return cached_props[prop_id - 1]
    
    # Mock fallback
    return {
        "id": prop_id,
        "player": "LeBron James",
        "market": "player_points",
        "line": 25.5,
        "best_odds": {"sportsbook": "DraftKings", "price": -110, "implied": 52.4},
        "all_odds": [
            {"sportsbook": "DraftKings", "over": -110, "under": -110},
        ],
        "edge": 2.3,
    }

@app.get("/api/v1/props/search")
async def search_props(q: str):
    """Search props by player name"""
    global cached_props
    
    if not cached_props:
        return {"results": [], "query": q}
    
    results = [
        {
            "id": idx + 1,
            "player": prop["player"],
            "markets": [prop["market"]]
        }
        for idx, prop in enumerate(cached_props)
        if q.lower() in prop["player"].lower()
    ]
    
    return {"results": results, "query": q}

# ============================================
# Markets Endpoints
# ============================================

@app.get("/api/v1/markets")
async def get_markets():
    """Get all available markets"""
    return {
        "markets": [
            {"id": "player_points", "name": "Player Points", "description": "Total points scored by player"},
            {"id": "player_rebounds", "name": "Player Rebounds", "description": "Total rebounds by player"},
            {"id": "player_assists", "name": "Player Assists", "description": "Total assists by player"}
        ]
    }

# ============================================
# AI Assistant Endpoints
# ============================================

@app.post("/api/v1/chat")
async def chat_query(request: dict):
    """Query the AI betting assistant"""
    message = request.get("message", "")
    
    # Mock AI response
    response = {
        "message": f"Based on current odds, here are recommendations for: {message}",
        "props": cached_props[:3] if cached_props else [],
        "confidence": 0.85,
        "timestamp": "2024-02-10T20:30:00Z"
    }
    
    return response

# ============================================
# Analytics Endpoints
# ============================================

@app.get("/api/v1/analytics/edge")
async def get_edge_stats():
    """Get overall edge statistics"""
    if not cached_props:
        return {
            "average_edge": 0,
            "high_edge_props": 0,
            "total_props": 0,
            "best_sportsbook": "Unknown"
        }
    
    edges = [p.get('edge', 0) for p in cached_props]
    avg_edge = sum(edges) / len(edges) if edges else 0
    high_edge = len([e for e in edges if e >= 3])
    
    return {
        "average_edge": round(avg_edge, 1),
        "high_edge_props": high_edge,
        "total_props": len(cached_props),
        "best_sportsbook": "DraftKings",
        "timestamp": "2024-02-10T20:30:00Z"
    }

# ============================================
# WebSocket Endpoint
# ============================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time odds updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from client: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")