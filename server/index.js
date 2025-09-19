const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- Scrabble Game Logic ---
const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10, _: 0
};

// Server-side validation functions
function isFirstMove(board) {
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (board[row][col] !== null) {
        return false;
      }
    }
  }
  return true;
}

function coversCenter(moves) {
  return moves.some(move => move.row === 7 && move.col === 7);
}

function areMovesConnected(moves) {
  if (moves.length <= 1) return true;
  
  const sorted = [...moves].sort((a, b) => {
    if (a.row === b.row) return a.col - b.col;
    return a.row - b.row;
  });
  
  const firstMove = sorted[0];
  const isHorizontal = sorted.every(move => move.row === firstMove.row);
  const isVertical = sorted.every(move => move.col === firstMove.col);
  
  if (!isHorizontal && !isVertical) return false;
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    if (isHorizontal && curr.col !== prev.col + 1) return false;
    if (isVertical && curr.row !== prev.row + 1) return false;
  }
  
  return true;
}

function movesConnectToBoard(board, moves) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const move of moves) {
    for (const [dRow, dCol] of directions) {
      const adjRow = move.row + dRow;
      const adjCol = move.col + dCol;
      
      if (adjRow >= 0 && adjRow < 15 && adjCol >= 0 && adjCol < 15) {
        if (board[adjRow][adjCol] !== null) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function validateMove(board, moves) {
  const errors = [];
  
  if (moves.length === 0) {
    errors.push('No tiles placed');
    return { isValid: false, errors };
  }
  
  // Check if tiles are connected
  if (!areMovesConnected(moves)) {
    errors.push('Tiles must form a continuous word');
  }
  
  // Check for tile overlaps
  for (const move of moves) {
    if (board[move.row][move.col] !== null) {
      errors.push('Cannot place tile on occupied square');
    }
  }
  
  // First move validation
  if (isFirstMove(board)) {
    if (!coversCenter(moves)) {
      errors.push('First word must cover the center star');
    }
  } else {
    if (!movesConnectToBoard(board, moves)) {
      errors.push('New tiles must connect to existing tiles');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function generateRandomTiles(count) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const tiles = [];
  for (let i = 0; i < count; i++) {
    tiles.push({
      letter: letters[Math.floor(Math.random() * letters.length)],
      id: `tile-${Date.now()}-${i}`
    });
  }
  return tiles;
}

function createEmptyBoard() {
  const board = Array(15).fill(null).map(() => Array(15).fill(null));
  return board;
}

function createInitialGameState(playerId, playerName) {
  return {
    gameId: 'game-' + Date.now(),
    players: [
      {
        playerId,
        playerName,
        tileCount: 7,
        isBot: false,
        tiles: generateRandomTiles(7)
      }
    ],
    currentPlayer: playerId,
    board: createEmptyBoard(),
    scores: {
      [playerId]: 0
    },
    tilesRemaining: 86,
    lastMove: null,
    gameStatus: 'waiting'
  };
}

// --- Game Sessions ---
const games = {};
const timers = {};

// --- Socket.io Handlers ---
io.on('connection', (socket) => {
  let playerId = null;
  let gameId = null;

  socket.on('message', (msg) => {
    switch (msg.type) {
      case 'join_lobby': {
        playerId = msg.data.playerId;
        const playerName = msg.data.playerName;
        // If client provides a sessionId, use it; else create a new one
        gameId = msg.data.sessionId || findOrCreateAvailableGame();
        if (!games[gameId]) {
          // Create new game session with first player
          const gameState = createInitialGameState(playerId, playerName);
          games[gameId] = gameState;
          timers[gameId] = { [playerId]: 300 };
        } else {
          // Add second player to existing session
          const gameState = games[gameId];
          if (gameState.players.length < 2) {
            gameState.players.push({
              playerId,
              playerName,
              tileCount: 7,
              isBot: false,
              tiles: generateRandomTiles(7)
            });
            gameState.scores[playerId] = 0;
            gameState.gameStatus = 'playing';
            timers[gameId][playerId] = 300;
          }
        }
        socket.join(gameId);
        // Check if we have two players to start the game
        if (games[gameId].players.length < 2) {
          io.to(gameId).emit('message', { type: 'lobby_status', data: { waiting: true, playersCount: games[gameId].players.length } });
        } else {
          // Two players present, start game
          io.to(gameId).emit('message', { type: 'lobby_status', data: { waiting: false, playersCount: 2 } });
          setTimeout(() => {
            io.to(gameId).emit('message', { type: 'game_started', data: games[gameId] });
            io.to(gameId).emit('message', { type: 'game_state', data: games[gameId] });
          }, 1000);
        }
        break;
      }
// Find or create an available game session for a new player
function findOrCreateAvailableGame() {
  // Find a game with only one player (waiting for second)
  for (const gid in games) {
    if (games[gid].players.length === 1 && games[gid].gameStatus === 'waiting') {
      return gid;
    }
  }
  // Create new sessionId
  return 'game-' + Date.now();
}
      case 'make_move': {
        const { moves, playerId: pid } = msg.data;
        const game = games[msg.data.gameId];
        if (!game) return;
        
        // Validate the move server-side
        const validation = validateMove(game.board, moves);
        if (!validation.isValid) {
          // Send error back to client
          io.to(msg.data.gameId).emit('message', {
            type: 'move_result',
            data: {
              success: false,
              error: validation.errors.join('. '),
              errors: validation.errors
            }
          });
          return;
        }
        
        // Move is valid, process it
        let totalScore = 0;
        moves.forEach(move => {
          game.board[move.row][move.col] = {
            letter: move.letter,
            isBlank: move.isBlank,
            blankLetter: move.blankLetter,
            playerId: pid
          };
          totalScore += LETTER_SCORES[move.letter] || 1;
        });
        
        game.scores[pid] += totalScore;
        game.lastMove = {
          player: pid,
          moves,
          words: [{ word: 'SCRABBLE', score: totalScore }],
          score: totalScore,
          type: 'play'
        };
        
        // Update player tiles
        const player = game.players.find(p => p.playerId === pid);
        if (player && player.tiles) {
          moves.forEach(() => {
            if (player.tiles.length > 0) player.tiles.pop();
          });
          const newTiles = generateRandomTiles(moves.length);
          player.tiles.push(...newTiles);
        }
        
        // Send success response
        io.to(msg.data.gameId).emit('message', {
          type: 'move_result',
          data: {
            success: true,
            score: totalScore,
            words: [{ word: 'SCRABBLE', score: totalScore }]
          }
        });
        
        // Switch turn after a delay
        setTimeout(() => switchTurn(msg.data.gameId), 1000);
        break;
      }
      case 'exchange_tiles': {
        const { tiles, playerId: pid, gameId: gid } = msg.data;
        const game = games[gid];
        const player = game.players.find(p => p.playerId === pid);
        if (player && player.tiles) {
          tiles.forEach(({ index }) => {
            if (player.tiles[index]) {
              player.tiles[index] = generateRandomTiles(1)[0];
            }
          });
        }
        io.to(gid).emit('message', { type: 'move_result', data: { success: true, action: 'exchange', tilesExchanged: tiles.length } });
        setTimeout(() => switchTurn(gid), 1000);
        break;
      }
      case 'pass_turn': {
        const { playerId: pid, gameId: gid } = msg.data;
        const game = games[gid];
        if (!game) return;
        game.lastMove = { player: pid, type: 'pass', score: 0 };
        io.to(gid).emit('message', { type: 'move_result', data: { success: true, action: 'pass' } });
        setTimeout(() => switchTurn(gid), 1000);
        break;
      }
    }
  });
});

function switchTurn(gameId) {
  const game = games[gameId];
  if (!game || game.players.length < 2) return;
  const currentIndex = game.players.findIndex(p => p.playerId === game.currentPlayer);
  const nextIndex = (currentIndex + 1) % game.players.length;
  game.currentPlayer = game.players[nextIndex].playerId;
  timers[gameId][game.currentPlayer] = 300;
  io.to(gameId).emit('message', { type: 'game_state', data: game });
}

// --- Express REST endpoint (optional) ---
app.get('/', (req, res) => {
  res.send('Scrabble Game Server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Scrabble Game Server listening on port ${PORT}`);
});
