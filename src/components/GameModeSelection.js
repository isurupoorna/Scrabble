import React, { useState } from 'react';
import classNames from 'classnames';
import '../styles/GameModeSelection.scss';

const GameModeSelection = ({ onModeSelect }) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('advanced');

  const gameModes = [
    {
      id: 'multiplayer',
      title: 'Multiplayer',
      description: 'Play against another human player online',
      icon: '👥',
      features: [
        'Real-time multiplayer',
        'Challenge friends',
        'Chat support',
        'Competitive scoring'
      ]
    },
    {
      id: 'singleplayer',
      title: 'Single Player',
      description: 'Play against an intelligent AI opponent',
      icon: '🤖',
      features: [
        'AI opponent',
        'Multiple difficulty levels',
        'Practice mode',
        'Immediate gameplay'
      ]
    }
  ];

  const difficulties = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Good for beginners, focuses on simple word formation',
      icon: '🟢',
      level: 'Easy'
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Strategic gameplay with complex move evaluation',
      icon: '🔴',
      level: 'Hard'
    }
  ];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const handleStartGame = () => {
    if (selectedMode) {
      onModeSelect({
        mode: selectedMode,
        difficulty: selectedMode === 'singleplayer' ? selectedDifficulty : null
      });
    }
  };

  return (
    <div className="game-mode-selection">
      <div className="mode-selection-container">
        <div className="mode-header">
          <h1 className="mode-title">
            <span className="title-icon">🎯</span>
            Choose Game Mode
          </h1>
          <p className="mode-subtitle">
            Select how you want to play Scrabble
          </p>
        </div>

        <div className="game-modes">
          {gameModes.map((mode) => (
            <div
              key={mode.id}
              className={classNames('game-mode-card', {
                'selected': selectedMode === mode.id
              })}
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className="mode-icon">{mode.icon}</div>
              <div className="mode-content">
                <h3 className="mode-name">{mode.title}</h3>
                <p className="mode-description">{mode.description}</p>
                <ul className="mode-features">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-bullet">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mode-selector">
                <div className="selector-radio">
                  <input
                    type="radio"
                    id={mode.id}
                    name="gameMode"
                    checked={selectedMode === mode.id}
                    onChange={() => handleModeSelect(mode.id)}
                  />
                  <label htmlFor={mode.id}></label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedMode === 'singleplayer' && (
          <div className="difficulty-selection">
            <div className="difficulty-header">
              <h3>Choose AI Difficulty</h3>
              <p>Select the challenge level for your AI opponent</p>
            </div>
            
            <div className="difficulty-options">
              {difficulties.map((diff) => (
                <div
                  key={diff.id}
                  className={classNames('difficulty-card', {
                    'selected': selectedDifficulty === diff.id
                  })}
                  onClick={() => setSelectedDifficulty(diff.id)}
                >
                  <div className="difficulty-icon">{diff.icon}</div>
                  <div className="difficulty-info">
                    <div className="difficulty-name">
                      {diff.name}
                      <span className="difficulty-level">({diff.level})</span>
                    </div>
                    <p className="difficulty-description">{diff.description}</p>
                  </div>
                  <div className="difficulty-selector">
                    <input
                      type="radio"
                      id={diff.id}
                      name="difficulty"
                      checked={selectedDifficulty === diff.id}
                      onChange={() => setSelectedDifficulty(diff.id)}
                    />
                    <label htmlFor={diff.id}></label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mode-actions">
          <button
            className={classNames('btn btn-primary btn-large', {
              'disabled': !selectedMode
            })}
            onClick={handleStartGame}
            disabled={!selectedMode}
          >
            {selectedMode === 'singleplayer' ? (
              <>
                <span className="btn-icon">🎮</span>
                Start Single Player Game
              </>
            ) : selectedMode === 'multiplayer' ? (
              <>
                <span className="btn-icon">🌐</span>
                Join Multiplayer Game
              </>
            ) : (
              <>
                <span className="btn-icon">▶️</span>
                Select a Game Mode
              </>
            )}
          </button>
          
          {selectedMode && (
            <p className="start-hint">
              {selectedMode === 'singleplayer' 
                ? `Ready to challenge the ${selectedDifficulty} AI opponent!`
                : 'You will be matched with another player online'
              }
            </p>
          )}
        </div>

        <div className="mode-tips">
          <div className="tips-header">
            <h4>💡 Tips</h4>
          </div>
          <div className="tips-content">
            <div className="tip-item">
              <strong>Single Player:</strong> Great for practice and learning new strategies without time pressure
            </div>
            <div className="tip-item">
              <strong>Multiplayer:</strong> Test your skills against real opponents and climb the leaderboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelection;