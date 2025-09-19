import React from 'react';
import classNames from 'classnames';
import '../styles/GameInfo.scss';

const GameInfo = ({ 
  players = [], 
  scores = {}, 
  tilesRemaining = 0, 
  lastMove = null, 
  currentPlayer,
  playerId
}) => {
  
  const renderPlayerInfo = (player) => {
    const isCurrentPlayer = player.playerId === currentPlayer;
    const isThisPlayer = player.playerId === playerId;
    const playerScore = scores[player.playerId] || 0;
    
    return (
      <div 
        key={player.playerId}
        className={classNames('player-info', {
          'current-turn': isCurrentPlayer,
          'this-player': isThisPlayer
        })}
      >
        <div className="player-header">
          <span className="player-name">
            {player.playerName || `Player ${player.playerId.slice(-4)}`}
            {isThisPlayer && <span className="you-indicator">(You)</span>}
          </span>
          {isCurrentPlayer && (
            <span className="turn-indicator">
              <span className="turn-icon">▶</span>
              Current Turn
            </span>
          )}
        </div>
        
        <div className="player-stats">
          <div className="stat-item">
            <span className="stat-label">Score:</span>
            <span className="stat-value score">{playerScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tiles:</span>
            <span className="stat-value">{player.tileCount || 7}</span>
          </div>
        </div>
        
        {player.isBot && (
          <div className="bot-indicator">
            <span className="bot-icon">🤖</span>
            <span>Bot Player</span>
          </div>
        )}
      </div>
    );
  };

  const renderLastMove = () => {
    if (!lastMove || !lastMove.player) return null;

    const movePlayer = players.find(p => p.playerId === lastMove.player);
    const playerName = movePlayer?.playerName || 'Unknown Player';

    return (
      <div className="last-move-info">
        <h4>Last Move</h4>
        <div className="move-details">
          <div className="move-player">
            <strong>{playerName}</strong>
            {lastMove.player === playerId && <span className="you-indicator">(You)</span>}
          </div>
          
          {lastMove.words && lastMove.words.length > 0 && (
            <div className="move-words">
              <span className="words-label">Words:</span>
              <div className="words-list">
                {lastMove.words.map((word, index) => (
                  <span key={index} className="word-item">
                    {word.word} ({word.score} pts)
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="move-score">
            <span className="score-label">Score:</span>
            <span className="score-value">{lastMove.score || 0} points</span>
          </div>

          {lastMove.type && lastMove.type !== 'play' && (
            <div className="move-type">
              <span className="type-indicator">
                {lastMove.type === 'pass' && '⏭️ Passed turn'}
                {lastMove.type === 'exchange' && '🔄 Exchanged tiles'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGameStats = () => {
    return (
      <div className="game-stats">
        <h4>Game Status</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Tiles Remaining:</span>
            <span className="stat-value">{tilesRemaining}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Players:</span>
            <span className="stat-value">{players.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Turn:</span>
            <span className="stat-value">
              {players.find(p => p.playerId === currentPlayer)?.playerName || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderScoreboard = () => {
    // Sort players by score (descending)
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = scores[a.playerId] || 0;
      const scoreB = scores[b.playerId] || 0;
      return scoreB - scoreA;
    });

    return (
      <div className="scoreboard">
        <h4>Scoreboard</h4>
        <div className="score-list">
          {sortedPlayers.map((player, index) => {
            const playerScore = scores[player.playerId] || 0;
            const isThisPlayer = player.playerId === playerId;
            const isLeading = index === 0 && playerScore > 0;
            
            return (
              <div 
                key={player.playerId}
                className={classNames('score-item', {
                  'this-player': isThisPlayer,
                  'leading': isLeading
                })}
              >
                <div className="score-rank">
                  {index + 1}
                  {isLeading && <span className="crown">👑</span>}
                </div>
                <div className="score-player">
                  {player.playerName || `Player ${player.playerId.slice(-4)}`}
                  {isThisPlayer && <span className="you-indicator">(You)</span>}
                </div>
                <div className="score-points">{playerScore}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="game-info">
      <div className="info-section players-section">
        <h3>Players</h3>
        <div className="players-list">
          {players.map(renderPlayerInfo)}
        </div>
      </div>

      <div className="info-section">
        {renderScoreboard()}
      </div>

      <div className="info-section">
        {renderGameStats()}
      </div>

      {lastMove && (
        <div className="info-section">
          {renderLastMove()}
        </div>
      )}

      {/* Game rules quick reference */}
      <div className="info-section rules-section">
        <details className="rules-details">
          <summary>Quick Rules</summary>
          <div className="rules-content">
            <ul>
              <li>Form words horizontally or vertically</li>
              <li>All new words must connect to existing tiles</li>
              <li>First word must cross the center star</li>
              <li>Blank tiles can be any letter (0 points)</li>
              <li>Premium squares apply only when first covered</li>
              <li>7-letter bonus: +50 points</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default GameInfo;