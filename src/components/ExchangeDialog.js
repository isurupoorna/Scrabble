import React, { useState } from 'react';
import classNames from 'classnames';
import { LETTER_SCORES } from '../utils/gameConstants';
import '../styles/ExchangeDialog.scss';

const ExchangeDialog = ({ isOpen, rack = [], onExchange, onCancel }) => {
  const [selectedTiles, setSelectedTiles] = useState([]);

  const handleTileToggle = (index, tile) => {
    const tileData = { index, tile };
    
    setSelectedTiles(prev => {
      const isSelected = prev.some(selected => selected.index === index);
      
      if (isSelected) {
        return prev.filter(selected => selected.index !== index);
      } else {
        return [...prev, tileData];
      }
    });
  };

  const handleExchange = () => {
    if (selectedTiles.length === 0) return;
    
    onExchange(selectedTiles);
    setSelectedTiles([]);
  };

  const handleCancel = () => {
    setSelectedTiles([]);
    onCancel();
  };

  const renderTile = (tile, index) => {
    const isSelected = selectedTiles.some(selected => selected.index === index);
    
    const tileClasses = classNames('exchange-tile', {
      'selected': isSelected,
      'blank-tile': tile.letter === '_'
    });

    return (
      <button
        key={`${index}-${tile.letter}`}
        className={tileClasses}
        onClick={() => handleTileToggle(index, tile)}
      >
        <span className="tile-letter">
          {tile.letter === '_' ? '?' : tile.letter}
        </span>
        <span className="tile-score">
          {tile.letter === '_' ? 0 : LETTER_SCORES[tile.letter] || 0}
        </span>
        {isSelected && (
          <div className="selection-indicator">
            <span className="check-mark">✓</span>
          </div>
        )}
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="exchange-dialog">
        <div className="dialog-header">
          <h2>Exchange Tiles</h2>
          <button 
            className="close-button"
            onClick={handleCancel}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="dialog-content">
          <div className="exchange-instructions">
            <p>Select tiles to exchange from the bag. You will lose your turn.</p>
            <p>Selected: <strong>{selectedTiles.length}</strong> tile{selectedTiles.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="tiles-container">
            <h3>Your Tiles</h3>
            <div className="exchange-tiles">
              {rack.map((tile, index) => renderTile(tile, index))}
            </div>
          </div>

          {selectedTiles.length > 0 && (
            <div className="selected-tiles-info">
              <h4>Tiles to Exchange:</h4>
              <div className="selected-list">
                {selectedTiles.map(({ tile, index }) => (
                  <span key={index} className="selected-tile-info">
                    {tile.letter === '_' ? '?' : tile.letter}
                    ({tile.letter === '_' ? 0 : LETTER_SCORES[tile.letter] || 0} pts)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="exchange-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <p><strong>Warning:</strong> Exchanging tiles will end your turn.</p>
              <p>You will not score any points this turn.</p>
              <p>Consider this carefully before proceeding.</p>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExchange}
            disabled={selectedTiles.length === 0}
          >
            Exchange {selectedTiles.length} Tile{selectedTiles.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Exchange rules */}
        <div className="dialog-footer">
          <details className="exchange-rules">
            <summary>Exchange Rules</summary>
            <div className="rules-content">
              <ul>
                <li>You can exchange 1-7 tiles in a single turn</li>
                <li>Exchanged tiles are returned to the bag and shuffled</li>
                <li>You draw the same number of new tiles</li>
                <li>This counts as your turn - you score 0 points</li>
                <li>Exchange is not allowed when fewer than 7 tiles remain in the bag</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ExchangeDialog;