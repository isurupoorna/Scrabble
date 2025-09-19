import React, { useState } from 'react';
import '../styles/WelcomeScreen.scss';

const WelcomeScreen = ({ onPlayerNameSubmit }) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    setIsSubmitting(true);
    
    // Small delay for better UX
    setTimeout(() => {
      onPlayerNameSubmit(playerName.trim());
    }, 500);
  };

  const handleQuickPlay = () => {
    const randomNames = [
      'Scrabble Master',
      'Word Wizard',
      'Lexicon Legend',
      'Vocabulary Victor',
      'Grammar Guru',
      'Dictionary Dynamo'
    ];
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
    onPlayerNameSubmit(randomName);
  };

  if (isSubmitting) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="loading-spinner"></div>
          <h2>Joining Game...</h2>
          <p>Welcome, <strong>{playerName}</strong>!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="game-logo">
          <h1>SCRABBLE</h1>
          <div className="logo-subtitle">Professional Multiplayer</div>
        </div>

        <div className="welcome-section">
          <h2>Welcome to Scrabble!</h2>
          <p>Enter your name to start playing against our intelligent bot opponent.</p>
          
          <form onSubmit={handleSubmit} className="name-form">
            <div className="input-group">
              <label htmlFor="playerName">Your Name:</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                autoFocus
                className="name-input"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!playerName.trim()}
              >
                Start Game
              </button>
              <button 
                type="button" 
                onClick={handleQuickPlay}
                className="btn btn-secondary"
              >
                Quick Play (Random Name)
              </button>
            </div>
          </form>
        </div>

        <div className="game-features">
          <h3>Game Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <strong>Real-time Gameplay</strong>
                <span>Live timer and instant moves</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-text">
                <strong>Smart Bot Opponent</strong>
                <span>Challenging AI player</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div className="feature-text">
                <strong>Responsive Design</strong>
                <span>Works on all devices</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <div className="feature-text">
                <strong>Professional UI</strong>
                <span>Authentic Scrabble experience</span>
              </div>
            </div>
          </div>
        </div>

        <div className="game-tips">
          <h4>Quick Tips</h4>
          <ul>
            <li>Click board squares and type letters to place tiles</li>
            <li>Press Enter to submit your move, Escape to cancel</li>
            <li>Use Shift + letter to place blank tiles</li>
            <li>Click the same square twice to change direction</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;