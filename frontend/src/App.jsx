import React, { useState } from 'react';
import EdgewiseApp from './components/EdgewiseApp';
import BettingAssistant from './components/BettingAssistant';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'assistant'

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Navigation Toggle */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '2rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setView('dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            background: view === 'dashboard' ? '#00ff88' : '#1a2332',
            border: `2px solid ${view === 'dashboard' ? '#00ff88' : '#2d3748'}`,
            borderRadius: '8px',
            color: view === 'dashboard' ? '#0a0e1a' : '#e5e7eb',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView('assistant')}
          style={{
            padding: '0.75rem 1.5rem',
            background: view === 'assistant' ? '#00ff88' : '#1a2332',
            border: `2px solid ${view === 'assistant' ? '#00ff88' : '#2d3748'}`,
            borderRadius: '8px',
            color: view === 'assistant' ? '#0a0e1a' : '#e5e7eb',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease'
          }}
        >
          AI Assistant
        </button>
      </div>

      {/* Main Content */}
      {view === 'dashboard' ? <EdgewiseApp /> : <BettingAssistant />}
    </div>
  );
}

export default App;
