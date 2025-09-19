import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { LETTER_SCORES } from '../utils/gameConstants';
import '../styles/PlayerRack.scss';

const PlayerRack = ({ 
  tiles = [], 
  onTileSelect, 
  onRackReorder, 
  onShuffle, 
  placedTileIndices = [] 
}) => {
  // Ensure arrays are never null
  const safeTiles = tiles || [];
  const safePlacedIndices = placedTileIndices || [];
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e, index) => {
    if (safePlacedIndices.includes(index)) {
      e.preventDefault();
      return;
    }
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newTiles = [...safeTiles];
      const draggedTile = newTiles[draggedIndex];
      
      // Remove dragged tile
      newTiles.splice(draggedIndex, 1);
      
      // Insert at new position
      const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newTiles.splice(insertIndex, 0, draggedTile);
      
      onRackReorder(newTiles);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleTileClick = (index, tile) => {
    if (!safePlacedIndices.includes(index)) {
      onTileSelect(index, tile);
    }
  };

  const renderTile = (tile, index) => {
    const isPlaced = safePlacedIndices.includes(index);
    const isDragged = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    
    const tileClasses = classNames(
      'rack-tile',
      {
        'placed': isPlaced,
        'dragging': isDragged,
        'drag-over': isDragOver,
        'blank-tile': tile.letter === '_'
      }
    );

    return (
      <div
        key={`${tile.id || index}-${tile.letter}`}
        className={tileClasses}
        draggable={!isPlaced}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => handleTileClick(index, tile)}
        data-index={index}
      >
        <span className="tile-letter">
          {tile.letter === '_' ? '?' : tile.letter}
        </span>
        <span className="tile-score">
          {tile.letter === '_' ? 0 : LETTER_SCORES[tile.letter] || 0}
        </span>
        {isPlaced && (
          <div className="placed-overlay">
            <span>PLACED</span>
          </div>
        )}
      </div>
    );
  };

  const renderEmptySlot = (index) => {
    const isDragOver = dragOverIndex === index;
    
    return (
      <div
        key={`empty-${index}`}
        className={classNames('rack-tile', 'empty-slot', { 'drag-over': isDragOver })}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
      >
        <span className="empty-text">Empty</span>
      </div>
    );
  };

  const totalTileScore = safeTiles.reduce((sum, tile) => {
    return sum + (tile.letter === '_' ? 0 : LETTER_SCORES[tile.letter] || 0);
  }, 0);

  const availableTiles = safeTiles.filter((_, index) => !safePlacedIndices.includes(index));

  return (
    <div className="player-rack-container">
      <div className="rack-header">
        <h3>Your Tiles</h3>
        <div className="rack-stats">
          <span className="tile-count">{availableTiles.length}/7 tiles</span>
          <span className="total-score">Total: {totalTileScore} pts</span>
        </div>
      </div>
      
      <div className="rack-tiles">
        {Array.from({ length: 7 }, (_, index) => {
          const tile = tiles[index];
          return tile ? renderTile(tile, index) : renderEmptySlot(index);
        })}
      </div>
      
      <div className="rack-controls">
        <button 
          className="btn btn-secondary shuffle-btn"
          onClick={onShuffle}
          disabled={tiles.length === 0}
          title="Shuffle tiles"
        >
          🔀 Shuffle
        </button>
        
        <div className="rack-help">
          <span>Drag tiles to reorder • Click tile then board position to place</span>
        </div>
      </div>

      {/* Tile distribution info */}
      <div className="tile-info">
        <details className="tile-distribution">
          <summary>Tile Distribution & Scores</summary>
          <div className="distribution-grid">
            {Object.entries(LETTER_SCORES).map(([letter, score]) => (
              <div key={letter} className="distribution-item">
                <span className="dist-letter">{letter}</span>
                <span className="dist-score">{score}</span>
              </div>
            ))}
            <div className="distribution-item">
              <span className="dist-letter">?</span>
              <span className="dist-score">0</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PlayerRack;