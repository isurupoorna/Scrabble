import React from 'react';
import '../styles/LoadingScreen.scss';

const LoadingScreen = ({ connectionStatus = 'connecting' }) => {
  
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <div className="connection-info connecting">
            <div className="status-icon spinner"></div>
            <h3>Connecting to Game Server...</h3>
            <p>Please wait while we establish your connection.</p>
          </div>
        );
      case 'connected':
        return (
          <div className="connection-info connected">
            <div className="status-icon check"></div>
            <h3>Connected Successfully!</h3>
            <p>Loading game lobby...</p>
          </div>
        );
      case 'disconnected':
        return (
          <div className="connection-info disconnected">
            <div className="status-icon error"></div>
            <h3>Connection Lost</h3>
            <p>Attempting to reconnect...</p>
          </div>
        );
      default:
        return (
          <div className="connection-info">
            <div className="status-icon spinner"></div>
            <h3>Loading...</h3>
          </div>
        );
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="game-logo">
          <h1>SCRABBLE</h1>
          <div className="logo-subtitle">Online Multiplayer</div>
        </div>

        <div className="loading-section">
          {renderConnectionStatus()}
        </div>

        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-steps">
            <div className="step completed">Connect</div>
            <div className="step">Join Lobby</div>
            <div className="step">Start Game</div>
          </div>
        </div>

        <div className="loading-tips">
          <h4>While you wait...</h4>
          <div className="tips-carousel">
            <div className="tip">
              💡 <strong>Tip:</strong> Use the center star square for your first word to get a double word score!
            </div>
            <div className="tip">
              🎯 <strong>Strategy:</strong> Save your high-value letters (Q, X, Z) for premium squares.
            </div>
            <div className="tip">
              🔤 <strong>Blanks:</strong> Blank tiles can be any letter but are worth 0 points.
            </div>
            <div className="tip">
              ⚡ <strong>Bonus:</strong> Use all 7 tiles in one turn for a 50-point bonus!
            </div>
          </div>
        </div>

        <div className="loading-footer">
          <div className="version-info">
            Version 1.0.0
          </div>
          <div className="copyright">
            © 2025 Scrabble Game Client
          </div>
        </div>
      </div>

      {/* Background animation */}
      <div className="background-tiles">
        {Array.from({ length: 20 }, (_, i) => (
          <div 
            key={i} 
            className={`floating-tile tile-${i % 5}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          >
            {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;