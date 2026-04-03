import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertCircle, Zap, DollarSign, BarChart3, Filter, ChevronDown } from 'lucide-react';

// Real API connection
const api = {
  async getProps(filters) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/props');
      const data = await response.json();
      
      // Transform API data to match frontend expectations
      const transformedProps = data.props.map(prop => ({
        ...prop,
        bestOdds: prop.best_odds,  // Convert snake_case to camelCase
        allOdds: prop.all_odds      // Convert snake_case to camelCase
      }));
      
      return { props: transformedProps };
    } catch (error) {
      console.error('Error fetching props:', error);
      // Fallback to mock data
      return {
        props: [{
          id: 1,
          player: "LeBron James",
          market: "player_points",
          line: 25.5,
          bestOdds: { sportsbook: "DraftKings", price: -110, implied: 52.4 },
          allOdds: [
            { sportsbook: "DraftKings", over: -110, under: -110 },
            { sportsbook: "FanDuel", over: -115, under: -105 },
            { sportsbook: "BetMGM", over: -108, under: -112 }
          ],
          edge: 2.3,
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          player: "Stephen Curry",
          market: "player_points",
          line: 27.5,
          bestOdds: { sportsbook: "FanDuel", price: +105, implied: 48.8 },
          allOdds: [
            { sportsbook: "DraftKings", over: +100, under: -120 },
            { sportsbook: "FanDuel", over: +105, under: -125 },
            { sportsbook: "Caesars", over: -105, under: -115 }
          ],
          edge: 3.7,
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          player: "Nikola Jokic",
          market: "player_rebounds",
          line: 11.5,
          bestOdds: { sportsbook: "BetMGM", price: -105, implied: 51.2 },
          allOdds: [
            { sportsbook: "DraftKings", over: -110, under: -110 },
            { sportsbook: "BetMGM", over: -105, under: -115 },
            { sportsbook: "Caesars", over: -112, under: -108 }
          ],
          edge: 1.8,
          timestamp: new Date().toISOString()
        },
        {
          id: 4,
          player: "Luka Doncic",
          market: "player_assists",
          line: 8.5,
          bestOdds: { sportsbook: "Caesars", price: +110, implied: 47.6 },
          allOdds: [
            { sportsbook: "DraftKings", over: +105, under: -125 },
            { sportsbook: "FanDuel", over: +100, under: -120 },
            { sportsbook: "Caesars", over: +110, under: -130 }
          ],
          edge: 4.1,
          timestamp: new Date().toISOString()
        },
        {
          id: 5,
          player: "Joel Embiid",
          market: "player_points",
          line: 31.5,
          bestOdds: { sportsbook: "DraftKings", price: -108, implied: 51.9 },
          allOdds: [
            { sportsbook: "DraftKings", over: -108, under: -112 },
            { sportsbook: "FanDuel", over: -110, under: -110 },
            { sportsbook: "BetMGM", over: -115, under: -105 }
          ],
          edge: 1.5,
          timestamp: new Date().toISOString()
        }]
      };
    }
  }
};

const EdgewiseApp = () => {
  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [sortBy, setSortBy] = useState('edge');
  const [expandedProp, setExpandedProp] = useState(null);

  useEffect(() => {
    loadProps();
    const interval = setInterval(loadProps, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadProps = async () => {
    try {
      const data = await api.getProps({});
      setProps(data.props);
      setLoading(false);
    } catch (error) {
      console.error('Error loading props:', error);
      setLoading(false);
    }
  };

  const filteredProps = props
    .filter(p => 
      (searchTerm === '' || p.player.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedMarket === 'all' || p.market === selectedMarket)
    )
    .sort((a, b) => {
      if (sortBy === 'edge') return b.edge - a.edge;
      if (sortBy === 'player') return a.player.localeCompare(b.player);
      return 0;
    });

  const capitalizeSportsbook = (name) => {
    const mapping = {
      'draftkings': 'DraftKings',
      'fanduel': 'FanDuel',
      'betmgm': 'BetMGM',
      'caesars': 'Caesars',
      'bovada': 'Bovada',
      'pointsbetus': 'PointsBet'
    };
    return mapping[name.toLowerCase()] || name;
  };

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : odds;
  };

  const getEdgeColor = (edge) => {
    if (edge >= 3) return 'var(--edge-high)';
    if (edge >= 2) return 'var(--edge-medium)';
    return 'var(--edge-low)';
  };

  const markets = [
    { value: 'all', label: 'All Markets' },
    { value: 'player_points', label: 'Points' },
    { value: 'player_rebounds', label: 'Rebounds' },
    { value: 'player_assists', label: 'Assists' }
  ];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

        :root {
          --bg-primary: #0a0e1a;
          --bg-secondary: #111827;
          --bg-tertiary: #1a2332;
          --accent-primary: #00ff88;
          --accent-secondary: #0066ff;
          --edge-high: #00ff88;
          --edge-medium: #ffaa00;
          --edge-low: #666;
          --text-primary: #e5e7eb;
          --text-secondary: #9ca3af;
          --border: #2d3748;
          --positive: #00ff88;
          --negative: #ff4466;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'JetBrains Mono', monospace;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        .app {
          min-height: 100vh;
          position: relative;
        }

        /* Animated background grid */
        .app::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridScroll 20s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes gridScroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .header {
          position: relative;
          z-index: 10;
          padding: 2rem 2rem 1rem;
          border-bottom: 2px solid var(--border);
          background: rgba(10, 14, 26, 0.95);
          backdrop-filter: blur(10px);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .logo {
          font-family: 'Space Mono', monospace;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: logoGlow 3s ease-in-out infinite;
        }

        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(0, 255, 136, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.5)); }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid var(--accent-primary);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .tagline {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          font-weight: 400;
        }

        .controls {
          position: relative;
          z-index: 10;
          padding: 1.5rem 2rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .search-container {
          flex: 1;
          min-width: 300px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .filter-group {
          display: flex;
          gap: 0.5rem;
        }

        .filter-btn {
          padding: 0.875rem 1.5rem;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-btn:hover {
          border-color: var(--accent-primary);
          background: rgba(0, 255, 136, 0.05);
        }

        .filter-btn.active {
          background: var(--accent-primary);
          color: var(--bg-primary);
          border-color: var(--accent-primary);
        }

        .main-content {
          position: relative;
          z-index: 10;
          padding: 2rem;
          max-width: 1800px;
          margin: 0 auto;
          overflow-y: auto;
          height: calc(100vh - 180px);
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 255, 136, 0.1);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .props-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prop-card {
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: slideIn 0.5s ease-out backwards;
        }

        .prop-card:nth-child(1) { animation-delay: 0.05s; }
        .prop-card:nth-child(2) { animation-delay: 0.1s; }
        .prop-card:nth-child(3) { animation-delay: 0.15s; }
        .prop-card:nth-child(4) { animation-delay: 0.2s; }
        .prop-card:nth-child(5) { animation-delay: 0.25s; }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .prop-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .prop-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 1.5rem;
          padding: 1.5rem;
          align-items: center;
          cursor: pointer;
        }

        .player-info h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .market-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(0, 102, 255, 0.1);
          border: 1px solid var(--accent-secondary);
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-secondary);
        }

        .prop-stat {
          text-align: center;
        }

        .prop-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .prop-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .best-odds {
          text-align: center;
        }

        .odds-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .sportsbook-name {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .edge-indicator {
          text-align: center;
        }

        .edge-value {
          font-size: 1.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .expand-arrow {
          margin-left: auto;
          transition: transform 0.3s ease;
        }

        .expand-arrow.expanded {
          transform: rotate(180deg);
        }

        .prop-details {
          padding: 1.5rem;
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border);
          animation: expandDown 0.3s ease-out;
        }

        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }

        .odds-comparison {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .odds-item {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .odds-item.best {
          border-color: var(--accent-primary);
          background: rgba(0, 255, 136, 0.05);
        }

        .odds-sportsbook {
          font-weight: 700;
          margin-bottom: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .best-label {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          background: var(--accent-primary);
          color: var(--bg-primary);
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .odds-values {
          display: flex;
          gap: 1rem;
        }

        .odds-side {
          flex: 1;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        
        .odds-side.recommended {
          background: rgba(0, 255, 136, 0.15);
          border: 2px solid var(--accent-primary);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        
        .odds-side.not-recommended {
          opacity: 0.5;
        }

        .odds-side-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .odds-side-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
          font-size: 1.5rem;
          color: var(--text-secondary);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        @media (max-width: 1024px) {
          .prop-header {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .prop-stat, .best-odds, .edge-indicator {
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .prop-label {
            margin-bottom: 0;
          }
        }
      `}</style>

      <div className="header">
        <div className="logo-container">
          <h1 className="logo">EDGEWISE</h1>
          <div className="status-badge">
            <div className="live-dot" />
            LIVE ODDS
          </div>
        </div>
        <p className="tagline">Real-time sports betting edge analyzer • Find value across all books</p>
      </div>

      <div className="controls">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          {markets.map(market => (
            <button
              key={market.value}
              className={`filter-btn ${selectedMarket === market.value ? 'active' : ''}`}
              onClick={() => setSelectedMarket(market.value)}
            >
              {market.label}
            </button>
          ))}
        </div>

        <select 
          className="filter-btn"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="edge">Sort: Edge</option>
          <option value="player">Sort: Player</option>
        </select>
      </div>

      <div className="main-content">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Active Props</div>
            <div className="stat-value">{filteredProps.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Edge</div>
            <div className="stat-value">
              {filteredProps.length > 0 
                ? `${(filteredProps.reduce((acc, p) => acc + p.edge, 0) / filteredProps.length).toFixed(1)}%`
                : '0%'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best Book</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>
              {filteredProps.length > 0 ? capitalizeSportsbook(filteredProps[0].bestOdds.sportsbook) : 'N/A'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Edge Props</div>
            <div className="stat-value">
              {filteredProps.filter(p => p.edge >= 3).length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <Zap size={48} className="animate-pulse" />
          </div>
        ) : filteredProps.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={64} />
            <h3>No props found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="props-grid">
            {filteredProps.map((prop) => (
              <div key={prop.id} className="prop-card">
                <div 
                  className="prop-header"
                  onClick={() => setExpandedProp(expandedProp === prop.id ? null : prop.id)}
                >
                  <div className="player-info">
                    <h3>{prop.player}</h3>
                    <span className="market-badge">
                      {prop.market.replace('player_', '')}
                    </span>
                  </div>

                  <div className="prop-stat">
                    <div className="prop-label">Line</div>
                    <div className="prop-value">{prop.line}</div>
                  </div>

                  <div className="best-odds">
                    <div className="prop-label">Best Odds</div>
                    <div className="odds-value">{formatOdds(prop.bestOdds.price)}</div>
                    <div className="sportsbook-name">{capitalizeSportsbook(prop.bestOdds.sportsbook)}</div>
                  </div>

                  <div className="prop-stat">
                    <div className="prop-label">Implied</div>
                    <div className="prop-value">{prop.bestOdds.implied}%</div>
                  </div>

                  <div className="edge-indicator">
                    <div className="prop-label">Edge</div>
                    <div className="edge-value" style={{ color: getEdgeColor(prop.edge) }}>
                      <TrendingUp size={20} />
                      {prop.edge}%
                    </div>
                  </div>

                  <ChevronDown 
                    className={`expand-arrow ${expandedProp === prop.id ? 'expanded' : ''}`}
                    size={24}
                  />
                </div>

                {expandedProp === prop.id && (
                  <div className="prop-details">
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                      All Sportsbooks
                    </h4>
                    <div className="odds-comparison">
                      {prop.allOdds && prop.allOdds.length > 0 ? prop.allOdds.map((odds, idx) => (
                        <div 
                          key={idx}
                          className={`odds-item ${odds.sportsbook === prop.bestOdds.sportsbook ? 'best' : ''}`}
                        >
                          <div className="odds-sportsbook">
                            <span>{capitalizeSportsbook(odds.sportsbook)}</span>
                            {odds.sportsbook === prop.bestOdds.sportsbook && (
                              <span className="best-label">Best</span>
                            )}
                          </div>
                          <div className="odds-values">
                            <div className={`odds-side ${prop.best_side === 'over' ? 'recommended' : 'not-recommended'}`}>
                              <div className="odds-side-label">
                                Over {prop.best_side === 'over' && odds.sportsbook === prop.bestOdds.sportsbook && '⭐'}
                              </div>
                              <div className="odds-side-value" style={{ color: 'var(--positive)' }}>
                                {formatOdds(odds.over)}
                              </div>
                            </div>
                            <div className={`odds-side ${prop.best_side === 'under' ? 'recommended' : 'not-recommended'}`}>
                              <div className="odds-side-label">
                                Under {prop.best_side === 'under' && odds.sportsbook === prop.bestOdds.sportsbook && '⭐'}
                              </div>
                              <div className="odds-side-value" style={{ color: 'var(--negative)' }}>
                                {formatOdds(odds.under)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                          No additional sportsbook data available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EdgewiseApp;
