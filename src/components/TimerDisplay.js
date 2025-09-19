import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { formatTime } from '../utils/gameConstants';
import '../styles/TimerDisplay.scss';

const TimerDisplay = ({ timers = {}, currentPlayer, players = [] }) => {
  const [localTimers, setLocalTimers] = useState({});

  // Update local timers when server timers change
  useEffect(() => {
    setLocalTimers(timers);
  }, [timers]);

  // Local countdown effect for current player
  useEffect(() => {
    if (!currentPlayer || !localTimers[currentPlayer]) return;

    const interval = setInterval(() => {
      setLocalTimers(prev => {
        const currentPlayerTime = prev[currentPlayer];
        if (currentPlayerTime && currentPlayerTime > 0) {
          return {
            ...prev,
            [currentPlayer]: currentPlayerTime - 1
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer, localTimers]);

  const renderPlayerTimer = (player) => {
    const playerId = player.playerId;
    const playerTime = localTimers[playerId] || 0;
    const isCurrentPlayer = playerId === currentPlayer;
    const isWarningTime = playerTime <= 120 && playerTime > 30; // 2 minutes
    const isLowTime = playerTime <= 30 && playerTime > 10;
    const isCriticalTime = playerTime <= 10 && playerTime > 0;
    const isTimeUp = playerTime <= 0;

    const timerClasses = classNames('player-timer', {
      'current-turn': isCurrentPlayer,
      'warning-time': isWarningTime,
      'low-time': isLowTime,
      'critical-time': isCriticalTime,
      'time-up': isTimeUp
    });

    return (
      <div key={playerId} className={timerClasses}>
        <div className="timer-header">
          <span className="timer-player-name">
            {player.playerName || `Player ${playerId.slice(-4)}`}
          </span>
          {isCurrentPlayer && (
            <span className="current-turn-badge">
              <span className="turn-pulse"></span>
              Active
            </span>
          )}
        </div>
        
        <div className="timer-display">
          <div className="time-value">
            {formatTime(playerTime)}
          </div>
          
          {isCurrentPlayer && (
            <div className="timer-progress">
              <div 
                className="progress-bar"
                style={{
                  width: `${Math.max(0, Math.min(100, (playerTime / 600) * 100))}%`
                }}
              ></div>
            </div>
          )}
        </div>

        <div className="timer-status">
          {isTimeUp && <span className="status-text time-up">Time's Up!</span>}
          {isCriticalTime && !isTimeUp && <span className="status-text critical">Hurry!</span>}
          {isLowTime && !isCriticalTime && <span className="status-text warning">30 seconds!</span>}
          {isWarningTime && !isLowTime && !isCriticalTime && <span className="status-text alert">2 minutes left</span>}
          {!isCurrentPlayer && playerTime > 0 && <span className="status-text waiting">Waiting</span>}
        </div>
      </div>
    );
  };

  const getTotalGameTime = () => {
    return Object.values(localTimers).reduce((total, time) => total + time, 0);
  };

  const renderGameTimer = () => {
    const totalTime = getTotalGameTime();
    const averageTime = players.length > 0 ? totalTime / players.length : 0;

    return (
      <div className="game-timer-stats">
        <h4>Game Time</h4>
        <div className="time-stats">
          <div className="stat-item">
            <span className="stat-label">Total Remaining:</span>
            <span className="stat-value">{formatTime(totalTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average per Player:</span>
            <span className="stat-value">{formatTime(Math.floor(averageTime))}</span>
          </div>
        </div>
      </div>
    );
  };

  // Sound effects for timer warnings (if browser supports it)
  useEffect(() => {
    if (!currentPlayer) return;
    
    const currentPlayerTime = localTimers[currentPlayer];
    
    // Warning at 2 minutes
    if (currentPlayerTime === 120) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        // Audio not supported, ignore silently
      }
    }
    
    // Critical time warning at 10 seconds
    if (currentPlayerTime === 10) {
      try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        // Audio not supported, ignore silently
      }
    }
  }, [localTimers, currentPlayer]);

  if (players.length === 0) {
    return (
      <div className="timer-display">
        <div className="no-timers">
          <span>Waiting for players...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-display">
      <div className="timers-header">
        <h3>Player Timers</h3>
        <div className="timer-legend">
          <div className="legend-item">
            <div className="legend-color current"></div>
            <span>Current Turn</span>
          </div>
          <div className="legend-item">
            <div className="legend-color alert"></div>
            <span>Warning (≤2min)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color warning"></div>
            <span>Low Time (≤30s)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color critical"></div>
            <span>Critical (≤10s)</span>
          </div>
        </div>
      </div>
      
      <div className="player-timers">
        {players.map(renderPlayerTimer)}
      </div>

      {renderGameTimer()}

      {/* Timer controls/info */}
      <div className="timer-info">
        <div className="timer-settings">
          <span className="settings-label">Time Limit per Player:</span>
          <span className="settings-value">10:00 minutes</span>
        </div>
        
        {currentPlayer && (
          <div className="current-turn-info">
            <span className="turn-label">Current Turn:</span>
            <span className="turn-player">
              {players.find(p => p.playerId === currentPlayer)?.playerName || 'Unknown'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;