import React from 'react';
import classNames from 'classnames';
import '../styles/GameEndDialog.scss';

const GameEndDialog = ({ winner, finalScores = {}, onNewGame, gameStats = {} }) => {
  
  const renderWinnerAnnouncement = () => {
    if (!winner) {
      return (
        <div className="winner-announcement tie">
          <div className="winner-icon">🤝</div>
          <h2>It's a Tie!</h2>
          <p>What an incredible game! Multiple players finished with the same score.</p>
        </div>
      );
    }

    const isPlayerWinner = winner.isCurrentPlayer;
    
    return (
      <div className={classNames('winner-announcement', { 'player-won': isPlayerWinner })}>
        <div className="winner-icon">
          {isPlayerWinner ? '🎉' : '👑'}
        </div>
        <h2>
          {isPlayerWinner ? 'Congratulations!' : 'Game Over'}
        </h2>
        <p className="winner-text">
          <strong>{winner.playerName || `Player ${winner.playerId?.slice(-4)}`}</strong> wins!
        </p>
        <div className="winner-score">
          Final Score: <span className="score-value">{winner.finalScore}</span> points
        </div>
      </div>
    );
  };

  const renderFinalScoreboard = () => {
    // Convert scores object to array and sort by score
    const sortedPlayers = Object.entries(finalScores)
      .map(([playerId, scoreData]) => ({
        playerId,
        playerName: scoreData.playerName || `Player ${playerId.slice(-4)}`,
        finalScore: scoreData.finalScore || 0,
        gameScore: scoreData.gameScore || 0,
        tilesPenalty: scoreData.tilesPenalty || 0,
        isBot: scoreData.isBot || false,
        isCurrentPlayer: scoreData.isCurrentPlayer || false
      }))
      .sort((a, b) => b.finalScore - a.finalScore);

    return (
      <div className="final-scoreboard">
        <h3>Final Scores</h3>
        <div className="scoreboard-table">
          <div className="score-header">
            <div className="rank-header">Rank</div>
            <div className="player-header">Player</div>
            <div className="game-score-header">Game Score</div>
            <div className="penalty-header">Tile Penalty</div>
            <div className="final-score-header">Final Score</div>
          </div>
          
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.playerId}
              className={classNames('score-row', {
                'winner-row': index === 0,
                'current-player': player.isCurrentPlayer
              })}
            >
              <div className="rank-cell">
                <span className="rank-number">{index + 1}</span>
                {index === 0 && <span className="winner-crown">👑</span>}
              </div>
              
              <div className="player-cell">
                <span className="player-name">{player.playerName}</span>
                {player.isCurrentPlayer && <span className="you-badge">(You)</span>}
                {player.isBot && <span className="bot-badge">Bot</span>}
              </div>
              
              <div className="game-score-cell">
                {player.gameScore}
              </div>
              
              <div className="penalty-cell">
                {player.tilesPenalty > 0 ? `-${player.tilesPenalty}` : '0'}
              </div>
              
              <div className="final-score-cell">
                <strong>{player.finalScore}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGameStatistics = () => {
    return (
      <div className="game-statistics">
        <h3>Game Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Turns:</span>
            <span className="stat-value">{gameStats.totalTurns || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Game Duration:</span>
            <span className="stat-value">{gameStats.gameDuration || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Highest Single Move:</span>
            <span className="stat-value">{gameStats.highestMove || 'N/A'} pts</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Words Played:</span>
            <span className="stat-value">{gameStats.totalWords || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Word Score:</span>
            <span className="stat-value">{gameStats.averageWordScore || 'N/A'} pts</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tiles Remaining:</span>
            <span className="stat-value">{gameStats.tilesRemaining || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dialog-overlay game-end-overlay">
      <div className="game-end-dialog">
        <div className="dialog-header">
          <h1>Game Complete!</h1>
        </div>

        <div className="dialog-content">
          {renderWinnerAnnouncement()}
          {renderFinalScoreboard()}
          {renderGameStatistics()}

          <div className="game-end-message">
            <div className="message-content">
              <h4>Thank you for playing!</h4>
              <p>
                Great game! {Object.keys(finalScores).length > 1 ? 
                  'It was a competitive match with some excellent word plays.' : 
                  'Hope you enjoyed this Scrabble experience!'}
              </p>
              
              <div className="fun-facts">
                <h5>Did you know?</h5>
                <ul>
                  <li>The word "SCRABBLE" itself would score 14 points</li>
                  <li>The highest possible single move is 1,778 points</li>
                  <li>There are over 267,000 words in tournament Scrabble</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Return to Lobby
          </button>
          <button
            className="btn btn-primary"
            onClick={onNewGame}
          >
            Play Again
          </button>
        </div>

        <div className="dialog-footer">
          <div className="game-id">
            Game completed at {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameEndDialog;