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

function createBotGameState(playerId, playerName, botDifficulty = 'advanced') {
  const botId = 'bot-' + Date.now();
  const botName = `Smart Bot (${botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)})`;
  
  return {
    gameId: 'game-' + Date.now(),
    players: [
      {
        playerId,
        playerName,
        tileCount: 7,
        isBot: false,
        tiles: generateRandomTiles(7)
      },
      {
        playerId: botId,
        playerName: botName,
        tileCount: 7,
        isBot: true,
        botDifficulty,
        tiles: generateRandomTiles(7)
      }
    ],
    currentPlayer: playerId, // Human starts first
    board: createEmptyBoard(),
    scores: {
      [playerId]: 0,
      [botId]: 0
    },
    tilesRemaining: 72, // 86 - (7*2)
    lastMove: null,
    gameStatus: 'playing',
    gameMode: 'bot',
    botId
  };
}

// --- Game Sessions ---
const games = {};
const timers = {};
const timerIntervals = {}; // Track active timer intervals

// Timer constants
const GAME_TIME_LIMIT = 600; // 10 minutes = 600 seconds

// --- Socket.io Handlers ---
io.on('connection', (socket) => {
  let playerId = null;
  let gameId = null;

  socket.on('message', (msg) => {
    switch (msg.type) {
      case 'join_lobby': {
        playerId = msg.data.playerId;
        const playerName = msg.data.playerName;
        const gameMode = msg.data.gameMode || 'multiplayer';
        const botDifficulty = msg.data.botDifficulty;
        
        if (gameMode === 'bot') {
          // Create a new bot game
          const gameState = createBotGameState(playerId, playerName, botDifficulty);
          gameId = gameState.gameId;
          games[gameId] = gameState;
          // 10 minutes = 600 seconds per player
          timers[gameId] = { 
            [playerId]: 600,
            [gameState.botId]: 600
          };
          
          // Start timer system for this game
          startGameTimers(gameId);
          
          socket.join(gameId);
          
          // Send immediate game start since bot is ready
          io.to(gameId).emit('message', { type: 'lobby_status', data: { waiting: false, playersCount: 2, isBot: true } });
          setTimeout(() => {
            io.to(gameId).emit('message', { type: 'game_started', data: games[gameId] });
            io.to(gameId).emit('message', { type: 'game_state', data: games[gameId] });
          }, 1000);
        } else {
          // Original multiplayer logic
          gameId = msg.data.sessionId || findOrCreateAvailableGame();
          if (!games[gameId]) {
            // Create new game session with first player
            const gameState = createInitialGameState(playerId, playerName);
            games[gameId] = gameState;
            // 10 minutes = 600 seconds per player
            timers[gameId] = { [playerId]: 600 };
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
              // 10 minutes = 600 seconds per player
              timers[gameId][playerId] = 600;
              
              // Start timer system when second player joins
              startGameTimers(gameId);
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
        setTimeout(() => {
          switchTurn(msg.data.gameId);
          // Check if it's bot's turn and generate move
          const updatedGame = games[msg.data.gameId];
          console.log(`After make_move: gameMode=${updatedGame?.gameMode}, currentPlayer=${updatedGame?.currentPlayer}, botId=${updatedGame?.botId}`);
          if (updatedGame && updatedGame.gameMode === 'bot' && updatedGame.currentPlayer === updatedGame.botId) {
            console.log(`Scheduling bot move for game ${msg.data.gameId} after make_move`);
            setTimeout(() => generateBotMove(msg.data.gameId), 2000); // Give some thinking time
          }
        }, 1000);
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
        
        // Switch turn after a delay and check for bot move
        setTimeout(() => {
          switchTurn(gid);
          // Check if it's bot's turn and generate move
          const updatedGame = games[gid];
          if (updatedGame && updatedGame.gameMode === 'bot' && updatedGame.currentPlayer === updatedGame.botId) {
            setTimeout(() => generateBotMove(gid), 2000); // Give some thinking time
          }
        }, 1000);
        break;
      }
      case 'pass_turn': {
        const { playerId: pid, gameId: gid } = msg.data;
        const game = games[gid];
        if (!game) return;
        game.lastMove = { player: pid, type: 'pass', score: 0 };
        io.to(gid).emit('message', { type: 'move_result', data: { success: true, action: 'pass' } });
        
        // Switch turn after a delay and check for bot move
        setTimeout(() => {
          switchTurn(gid);
          // Check if it's bot's turn and generate move
          const updatedGame = games[gid];
          console.log(`After pass turn: gameMode=${updatedGame?.gameMode}, currentPlayer=${updatedGame?.currentPlayer}, botId=${updatedGame?.botId}`);
          if (updatedGame && updatedGame.gameMode === 'bot' && updatedGame.currentPlayer === updatedGame.botId) {
            console.log(`Scheduling bot move for game ${gid} after pass turn`);
            setTimeout(() => generateBotMove(gid), 2000); // Give some thinking time
          }
        }, 1000);
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
  // Don't reset timer - keep existing time
  io.to(gameId).emit('message', { type: 'game_state', data: game });
  
  // Emit timer update
  io.to(gameId).emit('message', { 
    type: 'timer_update', 
    data: timers[gameId] 
  });
}

// Simple bot move generation (simplified version)
async function generateBotMove(gameId) {
  const game = games[gameId];
  if (!game || !game.botId) {
    console.log(`Bot move generation failed: Game not found or no botId for game ${gameId}`);
    return;
  }
  
  if (game.currentPlayer !== game.botId) {
    console.log(`Bot move generation skipped: Current player ${game.currentPlayer} is not bot ${game.botId}`);
    return;
  }

  const bot = game.players.find(p => p.playerId === game.botId);
  if (!bot || !bot.tiles) {
    console.log(`Bot move generation failed: Bot player not found or no tiles`);
    return;
  }

  console.log(`Generating bot move for game ${gameId}... Bot has ${bot.tiles.length} tiles`);

  // Simple bot logic: try to make a basic move
  const botMove = generateSimpleBotMove(game, bot);
  
  if (botMove && botMove.type === 'move') {
    // Apply bot move to game
    let totalScore = 0;
    botMove.moves.forEach(move => {
      game.board[move.row][move.col] = {
        letter: move.letter,
        isBlank: move.isBlank,
        blankLetter: move.blankLetter,
        playerId: bot.playerId
      };
      totalScore += LETTER_SCORES[move.letter] || 1;
    });

    game.scores[bot.playerId] += totalScore;
    game.lastMove = {
      player: bot.playerId,
      moves: botMove.moves,
      words: [{ word: botMove.word || 'BOT_WORD', score: totalScore }],
      score: totalScore,
      type: 'play'
    };

    // Update bot tiles - remove used tiles and add new ones
    botMove.moves.forEach(() => {
      if (bot.tiles.length > 0) bot.tiles.pop();
    });
    const newTiles = generateRandomTiles(botMove.moves.length);
    bot.tiles.push(...newTiles);

    // Send bot move result
    io.to(gameId).emit('message', {
      type: 'move_result',
      data: {
        success: true,
        score: totalScore,
        words: [{ word: botMove.word || 'BOT_WORD', score: totalScore }],
        isBot: true
      }
    });

    console.log(`Bot made move with score: ${totalScore}`);

    // Send updated game state
    setTimeout(() => {
      io.to(gameId).emit('message', { type: 'game_state', data: game });
    }, 500);

    // Switch turn back to human
    setTimeout(() => switchTurn(gameId), 1500);
  } else {
    // Bot passes or exchanges
    game.lastMove = { player: bot.playerId, type: 'pass', score: 0 };
    io.to(gameId).emit('message', { 
      type: 'move_result', 
      data: { success: true, action: 'pass', isBot: true } 
    });

    console.log('Bot passed turn');
    
    // Send updated game state
    setTimeout(() => {
      io.to(gameId).emit('message', { type: 'game_state', data: game });
    }, 500);
    
    setTimeout(() => switchTurn(gameId), 1500);
  }
}

// Simplified bot move generation
function generateSimpleBotMove(game, bot) {
  const board = game.board;
  const tiles = bot.tiles;
  
  // Find first empty spot that connects to existing tiles or center
  const isFirstMove = board.every(row => row.every(cell => cell === null));
  
  if (isFirstMove) {
    // First move - place a simple 3-letter word across center
    if (tiles.length >= 3) {
      const word = tiles.slice(0, 3).map(t => t.letter).join('');
      return {
        type: 'move',
        moves: [
          { row: 7, col: 6, letter: tiles[0].letter, isBlank: false },
          { row: 7, col: 7, letter: tiles[1].letter, isBlank: false },
          { row: 7, col: 8, letter: tiles[2].letter, isBlank: false }
        ],
        word: word
      };
    }
  } else {
    // Find existing tiles and try to connect
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 14; col++) {
        if (board[row][col] !== null && board[row][col + 1] === null) {
          // Try to place tile to the right of existing tile
          if (tiles.length > 0) {
            return {
              type: 'move',
              moves: [
                { row: row, col: col + 1, letter: tiles[0].letter, isBlank: false }
              ],
              word: board[row][col].letter + tiles[0].letter
            };
          }
        }
      }
    }
  }
  
  // No valid move found, pass
  return { type: 'pass' };
}

// Timer Management System
function startGameTimers(gameId) {
  console.log(`Starting timers for game: ${gameId}`);
  
  // Clear existing interval if any
  if (timerIntervals[gameId]) {
    clearInterval(timerIntervals[gameId]);
  }
  
  // Start new timer interval
  timerIntervals[gameId] = setInterval(() => {
    updateGameTimers(gameId);
  }, 1000); // Update every second
}

function updateGameTimers(gameId) {
  const game = games[gameId];
  const gameTimers = timers[gameId];
  
  if (!game || !gameTimers || game.gameStatus !== 'playing') {
    return;
  }
  
  const currentPlayer = game.currentPlayer;
  
  if (currentPlayer && gameTimers[currentPlayer] !== undefined) {
    // Decrease current player's time
    gameTimers[currentPlayer] = Math.max(0, gameTimers[currentPlayer] - 1);
    
    // Check if time is up
    if (gameTimers[currentPlayer] <= 0) {
      handleTimeExpired(gameId, currentPlayer);
      return;
    }
    
    // Send timer update to clients
    io.to(gameId).emit('message', {
      type: 'timer_update',
      data: gameTimers
    });
    
    // Send warning at 2 minutes (120 seconds)
    if (gameTimers[currentPlayer] === 120) {
      io.to(gameId).emit('message', {
        type: 'timer_warning',
        data: { 
          playerId: currentPlayer, 
          timeLeft: 120, 
          level: 'warning',
          message: '2 minutes remaining!' 
        }
      });
    }
    
    // Send critical warning at 30 seconds
    if (gameTimers[currentPlayer] === 30) {
      io.to(gameId).emit('message', {
        type: 'timer_warning',
        data: { 
          playerId: currentPlayer, 
          timeLeft: 30, 
          level: 'critical',
          message: '30 seconds left!' 
        }
      });
    }
    
    // Send final warning at 10 seconds
    if (gameTimers[currentPlayer] === 10) {
      io.to(gameId).emit('message', {
        type: 'timer_warning',
        data: { 
          playerId: currentPlayer, 
          timeLeft: 10, 
          level: 'final',
          message: '10 seconds remaining!' 
        }
      });
    }
  }
}

function handleTimeExpired(gameId, playerId) {
  const game = games[gameId];
  if (!game) return;
  
  console.log(`Time expired for player ${playerId} in game ${gameId}`);
  
  // Auto-pass the turn
  game.lastMove = { player: playerId, type: 'timeout_pass', score: 0 };
  
  // Emit timeout event
  io.to(gameId).emit('message', {
    type: 'player_timeout',
    data: {
      playerId: playerId,
      playerName: game.players.find(p => p.playerId === playerId)?.playerName,
      action: 'auto_pass'
    }
  });
  
  io.to(gameId).emit('message', { 
    type: 'move_result', 
    data: { 
      success: true, 
      action: 'timeout_pass',
      message: 'Time expired - turn passed automatically'
    } 
  });
  
  // Switch to next player
  setTimeout(() => {
    switchTurn(gameId);
    
    // If it's a bot game and now it's bot's turn, generate bot move
    const updatedGame = games[gameId];
    if (updatedGame && updatedGame.gameMode === 'bot' && updatedGame.currentPlayer === updatedGame.botId) {
      setTimeout(() => generateBotMove(gameId), 2000);
    }
  }, 2000);
}

function stopGameTimers(gameId) {
  if (timerIntervals[gameId]) {
    clearInterval(timerIntervals[gameId]);
    delete timerIntervals[gameId];
    console.log(`Stopped timers for game: ${gameId}`);
  }
}

function pausePlayerTimer(gameId, playerId) {
  // For future implementation - pause specific player timer
  console.log(`Pausing timer for player ${playerId} in game ${gameId}`);
}

function resumePlayerTimer(gameId, playerId) {
  // For future implementation - resume specific player timer
  console.log(`Resuming timer for player ${playerId} in game ${gameId}`);
}

// --- Express REST endpoint (optional) ---
app.get('/', (req, res) => {
  res.send('Scrabble Game Server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Scrabble Game Server listening on port ${PORT}`);
});
