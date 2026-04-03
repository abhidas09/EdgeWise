import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Info } from 'lucide-react';

// Mock AI responses - Replace with actual Claude API integration
const mockAI = {
  async query(message, context) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('lebron') && lowerMsg.includes('points')) {
      return {
        text: "Based on current odds, LeBron James points props:\n\n• **Best Over 25.5**: DraftKings at -110 (52.4% implied)\n• **Edge**: 2.3% compared to market average\n• **Recommendation**: Slight value on the over at DraftKings\n\nLeBron is averaging 27.2 PPG this season and has hit the over in 4 of his last 6 games. The Lakers face a below-average defense tonight.",
        props: [
          { player: "LeBron James", line: 25.5, market: "points", bestBook: "DraftKings", odds: -110 }
        ]
      };
    }
    
    if (lowerMsg.includes('best') && lowerMsg.includes('nba')) {
      return {
        text: "Here are tonight's **highest edge NBA props**:\n\n1. **Luka Doncic Over 8.5 Assists** (+110 at Caesars)\n   • 4.1% edge vs market\n   • Doncic averaging 9.8 APG vs this opponent\n\n2. **Stephen Curry Over 27.5 Points** (+105 at FanDuel)\n   • 3.7% edge\n   • Curry hot streak: 30+ in 3 straight\n\n3. **LeBron James Over 25.5 Points** (-110 at DraftKings)\n   • 2.3% edge\n   • Matchup advantage vs opponent's defense",
        props: [
          { player: "Luka Doncic", line: 8.5, market: "assists", bestBook: "Caesars", odds: 110 },
          { player: "Stephen Curry", line: 27.5, market: "points", bestBook: "FanDuel", odds: 105 },
          { player: "LeBron James", line: 25.5, market: "points", bestBook: "DraftKings", odds: -110 }
        ]
      };
    }
    
    if (lowerMsg.includes('plus money') || lowerMsg.includes('+')) {
      return {
        text: "**Best plus-money props** with positive odds:\n\n• **Luka Doncic O 8.5 Assists** at +110 (Caesars)\n• **Stephen Curry O 27.5 Points** at +105 (FanDuel)\n\nBoth offer excellent value and have strong statistical backing. Doncic has the higher edge at 4.1%.",
        props: []
      };
    }
    
    if (lowerMsg.includes('sportsbook') || lowerMsg.includes('best book')) {
      return {
        text: "**Current best sportsbooks by edge**:\n\n1. **Caesars**: Leading on 40% of high-edge props\n2. **FanDuel**: Best for player points props\n3. **DraftKings**: Most competitive on rebounds/assists\n\nRecommendation: Have accounts at all three to always catch the best line.",
        props: []
      };
    }
    
    return {
      text: "I can help you find the best odds and highest-edge props! Try asking:\n\n• 'What's the best LeBron points prop tonight?'\n• 'Show me high-edge NBA props'\n• 'Any good plus-money props?'\n• 'Which sportsbook has the best odds?'",
      props: []
    };
  }
};

const BettingAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your Edgewise AI assistant. I can help you find the best odds, analyze props, and identify value bets. What are you looking for today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await mockAI.query(input, messages);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.text,
        props: response.props,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Best NBA props tonight",
    "LeBron James props",
    "Plus money opportunities",
    "High edge plays"
  ];

  return (
    <div className="assistant-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

        .assistant-container {
          font-family: 'JetBrains Mono', monospace;
          background: #0a0e1a;
          color: #e5e7eb;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .assistant-header {
          padding: 1.5rem 2rem;
          background: rgba(17, 24, 39, 0.95);
          border-bottom: 2px solid #2d3748;
          backdrop-filter: blur(10px);
        }

        .assistant-title {
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #00ff88;
        }

        .assistant-subtitle {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-top: 0.5rem;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #111827;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #2d3748;
          border-radius: 4px;
        }

        .message {
          display: flex;
          gap: 1rem;
          animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.assistant .message-avatar {
          background: linear-gradient(135deg, #00ff88, #0066ff);
        }

        .message.user .message-avatar {
          background: #1a2332;
          border: 2px solid #2d3748;
        }

        .message-content {
          flex: 1;
          max-width: 70%;
        }

        .message-bubble {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .message.assistant .message-bubble {
          background: #111827;
          border: 1px solid #2d3748;
        }

        .message.user .message-bubble {
          background: #1a2332;
          border: 1px solid #2d3748;
        }

        .message-bubble strong {
          color: #00ff88;
        }

        .message-timestamp {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 0.5rem;
          padding: 0 0.25rem;
        }

        .prop-cards {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .prop-card-mini {
          padding: 1rem;
          background: #1a2332;
          border: 1px solid #2d3748;
          border-radius: 8px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 1rem;
          align-items: center;
          transition: all 0.2s ease;
        }

        .prop-card-mini:hover {
          border-color: #00ff88;
          transform: translateX(4px);
        }

        .prop-player {
          font-weight: 600;
        }

        .prop-detail {
          color: #9ca3af;
          font-size: 0.8rem;
        }

        .prop-odds {
          text-align: right;
          font-weight: 700;
          color: #00ff88;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #9ca3af;
          font-size: 0.85rem;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dot {
          width: 6px;
          height: 6px;
          background: #00ff88;
          border-radius: 50%;
          animation: loadingBounce 1.4s infinite ease-in-out both;
        }

        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes loadingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .quick-actions {
          padding: 1rem 2rem 0;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .quick-action-btn {
          padding: 0.5rem 1rem;
          background: #111827;
          border: 1px solid #2d3748;
          border-radius: 20px;
          color: #9ca3af;
          font-size: 0.8rem;
          font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: #1a2332;
          border-color: #00ff88;
          color: #00ff88;
        }

        .input-container {
          padding: 1.5rem 2rem;
          background: #111827;
          border-top: 2px solid #2d3748;
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .input-field {
          flex: 1;
          padding: 1rem 1.25rem;
          background: #1a2332;
          border: 2px solid #2d3748;
          border-radius: 12px;
          color: #e5e7eb;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          resize: none;
          transition: all 0.3s ease;
          max-height: 120px;
        }

        .input-field:focus {
          outline: none;
          border-color: #00ff88;
          box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
        }

        .send-button {
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #00ff88, #0066ff);
          border: none;
          border-radius: 12px;
          color: #0a0e1a;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .send-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .info-banner {
          margin: 0 2rem 1rem;
          padding: 1rem;
          background: rgba(0, 102, 255, 0.1);
          border: 1px solid #0066ff;
          border-radius: 8px;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .info-banner svg {
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      <div className="assistant-header">
        <div className="assistant-title">
          <Bot size={28} />
          AI Betting Assistant
        </div>
        <div className="assistant-subtitle">
          Ask me about odds, props, and betting opportunities
        </div>
      </div>

      <div className="info-banner">
        <Info size={18} color="#0066ff" />
        <div>
          This is a demo using mock data. In production, this would connect to your FastAPI backend and use Claude's API for natural language queries.
        </div>
      </div>

      {messages.length === 1 && (
        <div className="quick-actions">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className="quick-action-btn"
              onClick={() => setInput(action)}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div className="messages-container">
        {messages.map((message, idx) => (
          <div key={idx} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {message.content.split('\n').map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ 
                    __html: line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>') 
                  }} />
                ))}
                {message.props && message.props.length > 0 && (
                  <div className="prop-cards">
                    {message.props.map((prop, i) => (
                      <div key={i} className="prop-card-mini">
                        <div>
                          <div className="prop-player">{prop.player}</div>
                          <div className="prop-detail">
                            {prop.market} O {prop.line}
                          </div>
                        </div>
                        <div className="prop-detail">{prop.bestBook}</div>
                        <div className="prop-odds">
                          {prop.odds > 0 ? `+${prop.odds}` : prop.odds}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-bubble">
                <div className="loading-indicator">
                  <span>Analyzing</span>
                  <div className="loading-dots">
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            className="input-field"
            placeholder="Ask about odds, props, or betting opportunities..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default BettingAssistant;
