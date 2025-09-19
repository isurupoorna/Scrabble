import { v4 as uuidv4 } from 'uuid';

// Board size
export const BOARD_SIZE = 15;

// Premium squares layout
export const PREMIUM_SQUARES = {
  // Triple Word Score
  TW: [
    [0,0], [0,7], [0,14], [7,0], [7,14], [14,0], [14,7], [14,14]
  ],
  // Double Word Score  
  DW: [
    [1,1], [2,2], [3,3], [4,4], [1,13], [2,12], [3,11], [4,10], 
    [13,1], [12,2], [11,3], [10,4], [13,13], [12,12], [11,11], [10,10]
  ],
  // Triple Letter Score
  TL: [
    [1,5], [1,9], [5,1], [5,5], [5,9], [5,13], [9,1], [9,5], 
    [9,9], [9,13], [13,5], [13,9]
  ],
  // Double Letter Score
  DL: [
    [0,3], [0,11], [2,6], [2,8], [3,0], [3,7], [3,14], [6,2], 
    [6,6], [6,8], [6,12], [7,3], [7,11], [8,2], [8,6], [8,8], 
    [8,12], [11,0], [11,7], [11,14], [12,6], [12,8], [14,3], [14,11]
  ]
};

// Center star position
export const CENTER_STAR = [7, 7];

// Letter scores
export const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Tile distribution
export const TILE_DISTRIBUTION = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
  K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
  U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, '_': 2 // blank tiles
};

// Game directions
export const DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

// Utility functions
export const generateId = () => uuidv4();

export const promptName = () => {
  // For testing - use a default name instead of popup prompt
  return 'Test Player';
};

// Alternative function for when you want to implement proper name input
export const getDefaultPlayerName = () => {
  return `Player_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

export const getPremiumSquareType = (row, col) => {
  // Check if position is center star
  if (row === CENTER_STAR[0] && col === CENTER_STAR[1]) {
    return 'STAR';
  }
  
  // Check premium squares
  for (const [type, positions] of Object.entries(PREMIUM_SQUARES)) {
    if (positions.some(([r, c]) => r === row && c === col)) {
      return type;
    }
  }
  
  return 'NORMAL';
};

export const isValidPosition = (row, col) => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

export const getNextPosition = (row, col, direction) => {
  if (direction === DIRECTIONS.HORIZONTAL) {
    return [row, col + 1];
  } else {
    return [row + 1, col];
  }
};

export const getPreviousPosition = (row, col, direction) => {
  if (direction === DIRECTIONS.HORIZONTAL) {
    return [row, col - 1];
  } else {
    return [row - 1, col];
  }
};

export const calculateTileScore = (letter, premiumType, isBlankTile = false) => {
  if (isBlankTile) return 0;
  
  let score = LETTER_SCORES[letter] || 0;
  
  if (premiumType === 'DL') {
    score *= 2;
  } else if (premiumType === 'TL') {
    score *= 3;
  }
  
  return score;
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};