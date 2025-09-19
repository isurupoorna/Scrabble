import React from 'react';
import classNames from 'classnames';
import { 
  BOARD_SIZE, 
  getPremiumSquareType, 
  DIRECTIONS,
  LETTER_SCORES 
} from '../utils/gameConstants';
import '../styles/GameBoard.scss';

const GameBoard = ({ 
  board, 
  onSquareClick, 
  placedTiles, 
  selectedSquare, 
  direction,
  lastMove = [] 
}) => {
  
  const renderSquareContent = (row, col, tile, premiumType) => {
    // If there's a placed tile at this position
    const placedTile = (placedTiles || []).find(pt => pt.row === row && pt.col === col);
    if (placedTile) {
      return (
        <div className="tile placed-tile">
          <span className="tile-letter">
            {placedTile.isBlank ? placedTile.blankLetter : placedTile.letter}
          </span>
          <span className="tile-score">
            {placedTile.isBlank ? 0 : LETTER_SCORES[placedTile.letter] || 0}
          </span>
        </div>
      );
    }

    // If there's a tile from the board state
    if (tile) {
      // Handle lastMove properly - it could be an object with moves array or null
      const lastMoveArray = lastMove?.moves || [];
      const isLastMove = lastMoveArray.some && lastMoveArray.some(move => move.row === row && move.col === col);
      return (
        <div className={classNames('tile', 'board-tile', { 'last-move': isLastMove })}>
          <span className="tile-letter">
            {tile.isBlank ? tile.blankLetter : tile.letter}
          </span>
          <span className="tile-score">
            {tile.isBlank ? 0 : LETTER_SCORES[tile.letter] || 0}
          </span>
        </div>
      );
    }

    // Empty square - show premium square labels
    switch (premiumType) {
      case 'TW':
        return (
          <div className="premium-label">
            <span className="premium-text">TRIPLE</span>
            <span className="premium-text">WORD</span>
            <span className="premium-text">SCORE</span>
          </div>
        );
      case 'DW':
        return (
          <div className="premium-label">
            <span className="premium-text">DOUBLE</span>
            <span className="premium-text">WORD</span>
            <span className="premium-text">SCORE</span>
          </div>
        );
      case 'TL':
        return (
          <div className="premium-label">
            <span className="premium-text">TRIPLE</span>
            <span className="premium-text">LETTER</span>
            <span className="premium-text">SCORE</span>
          </div>
        );
      case 'DL':
        return (
          <div className="premium-label">
            <span className="premium-text">DOUBLE</span>
            <span className="premium-text">LETTER</span>
            <span className="premium-text">SCORE</span>
          </div>
        );
      case 'STAR':
        return (
          <div className="star-center">
            <span className="star-icon">★</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDirectionIndicator = (row, col) => {
    if (!selectedSquare || selectedSquare.row !== row || selectedSquare.col !== col) {
      return null;
    }

    return (
      <div className={classNames('direction-indicator', direction)}>
        {direction === DIRECTIONS.HORIZONTAL ? '→' : '↓'}
      </div>
    );
  };

  const renderSquare = (row, col) => {
    const tile = board?.[row]?.[col];
    const premiumType = getPremiumSquareType(row, col);
    const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
    const hasPlacedTile = (placedTiles || []).some(pt => pt.row === row && pt.col === col);
    
    const squareClasses = classNames(
      'board-square',
      `premium-${premiumType.toLowerCase()}`,
      {
        'selected': isSelected,
        'has-tile': tile || hasPlacedTile,
        'empty': !tile && !hasPlacedTile
      }
    );

    return (
      <button
        key={`${row}-${col}`}
        className={squareClasses}
        onClick={() => onSquareClick(row, col)}
        disabled={tile !== null}
        data-row={row}
        data-col={col}
        data-premium={premiumType}
      >
        {renderSquareContent(row, col, tile, premiumType)}
        {renderDirectionIndicator(row, col)}
      </button>
    );
  };

  const renderRow = (rowIndex) => {
    const squares = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      squares.push(renderSquare(rowIndex, col));
    }
    
    return (
      <div key={rowIndex} className="board-row">
        <div className="row-label">{rowIndex + 1}</div>
        {squares}
      </div>
    );
  };

  const renderColumnHeaders = () => {
    const headers = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      headers.push(
        <div key={col} className="col-header">
          {String.fromCharCode(65 + col)}
        </div>
      );
    }
    return (
      <div className="board-headers">
        <div className="corner-spacer"></div>
        {headers}
      </div>
    );
  };

  const renderBoard = () => {
    const rows = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      rows.push(renderRow(row));
    }
    return rows;
  };

  return (
    <div className="game-board-container">
      {renderColumnHeaders()}
      <div className="game-board">
        {renderBoard()}
      </div>
      
      {/* Legend for premium squares */}
      <div className="board-legend">
        <div className="legend-item">
          <div className="legend-square premium-tw"></div>
          <span>Triple Word</span>
        </div>
        <div className="legend-item">
          <div className="legend-square premium-dw"></div>
          <span>Double Word</span>
        </div>
        <div className="legend-item">
          <div className="legend-square premium-tl"></div>
          <span>Triple Letter</span>
        </div>
        <div className="legend-item">
          <div className="legend-square premium-dl"></div>
          <span>Double Letter</span>
        </div>
        <div className="legend-item">
          <div className="legend-square premium-star"></div>
          <span>Center Star</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="board-instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Click empty square to select starting position</li>
          <li>Click same square again to toggle direction (→ ↕)</li>
          <li>Type letters to place tiles</li>
          <li>Shift + letter for blank tiles</li>
          <li>Enter to submit move, Escape to cancel</li>
        </ul>
      </div>
    </div>
  );
};

export default GameBoard;