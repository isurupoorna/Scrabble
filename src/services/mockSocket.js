// Mock Socket.io Service for Testing
// Simulates backend responses without requiring a real server

class MockSocket {
  constructor() {
    this.connected = false;
    this.listeners = new Map();
    this.gameState = this.createInitialGameState();
    this.timers = { player1: 300, player2: 280 }; // 5 minutes each
    this.timerInterval = null;
    
    // Simulate connection after a delay
    setTimeout(() => {
      this.connected = true;
      this.emit('connect');
      console.log('🔧 Mock Socket: Connected to simulated server');
    }, 1000);
    
    // Start timer countdown
    this.startTimerSimulation();
  }
  
  createInitialGameState() {
    return {
      gameId: 'mock-game-123',
      players: [
        {
          playerId: 'player1',
          playerName: 'You',
          tileCount: 7,
          isBot: false,
          tiles: [
            { letter: 'S', id: 't1' },
            { letter: 'C', id: 't2' },
            { letter: 'R', id: 't3' },
            { letter: 'A', id: 't4' },
            { letter: 'B', id: 't5' },
            { letter: 'L', id: 't6' },
            { letter: 'E', id: 't7' }
          ]
        },
        {
          playerId: 'bot1',
          playerName: 'Bot Player',
          tileCount: 7,
          isBot: true,
          tiles: [] // Hidden from player
        }
      ],
      currentPlayer: 'player1',
      board: this.createEmptyBoard(),
      scores: {
        player1: 0,
        bot1: 0
      },
      tilesRemaining: 86,
      lastMove: null,
      gameStatus: 'playing'
    };
  }
  
  createEmptyBoard() {
    const board = Array(15).fill(null).map(() => Array(15).fill(null));
    
    // Add some example tiles for testing
    board[7][7] = { letter: 'H', isBlank: false, playerId: 'bot1' }; // Center
    board[7][8] = { letter: 'E', isBlank: false, playerId: 'bot1' };
    board[7][9] = { letter: 'L', isBlank: false, playerId: 'bot1' };
    board[7][10] = { letter: 'L', isBlank: false, playerId: 'bot1' };
    board[7][11] = { letter: 'O', isBlank: false, playerId: 'bot1' };
    
    return board;
  }
  
  startTimerSimulation() {
    this.timerInterval = setInterval(() => {
      if (this.gameState.currentPlayer && this.timers[this.gameState.currentPlayer] > 0) {
        this.timers[this.gameState.currentPlayer]--;
        this.emit('message', {
          type: 'timer_update',
          data: { ...this.timers }
        });
        
        // Switch turns when timer runs out
        if (this.timers[this.gameState.currentPlayer] <= 0) {
          this.switchTurn();
        }
      }
    }, 1000);
  }
  
  switchTurn() {
    const currentIndex = this.gameState.players.findIndex(p => p.playerId === this.gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.gameState.players.length;
    this.gameState.currentPlayer = this.gameState.players[nextIndex].playerId;
    
    // Reset timer for new player
    this.timers[this.gameState.currentPlayer] = 300;
    
    this.emit('message', {
      type: 'game_state',
      data: this.gameState
    });
    
    // Simulate bot move after a delay
    if (this.gameState.players[nextIndex].isBot) {
      setTimeout(() => this.simulateBotMove(), 3000);
    }
  }
  
  simulateBotMove() {
    // Simulate bot making a move
    const botMoves = [
      { letter: 'C', row: 6, col: 7, isBlank: false },
      { letter: 'A', row: 5, col: 7, isBlank: false },
      { letter: 'T', row: 4, col: 7, isBlank: false }
    ];
    
    // Add moves to board
    botMoves.forEach(move => {
      this.gameState.board[move.row][move.col] = {
        letter: move.letter,
        isBlank: move.isBlank,
        playerId: 'bot1'
      };
    });
    
    // Update score
    this.gameState.scores.bot1 += 24; // Mock score
    
    // Set last move
    this.gameState.lastMove = {
      player: 'bot1',
      moves: botMoves,
      words: [{ word: 'CAT', score: 24 }],
      score: 24
    };
    
    this.emit('message', {
      type: 'bot_move_made',
      data: {
        playerId: 'bot1',
        moves: botMoves,
        score: 24
      }
    });
    
    // Switch back to player
    setTimeout(() => {
      this.gameState.currentPlayer = 'player1';
      this.timers.player1 = 300;
      this.emit('message', {
        type: 'game_state',
        data: this.gameState
      });
    }, 2000);
  }
  
  // Socket.io interface methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      if (callback) {
        // Remove specific callback
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      } else {
        // Remove all listeners for this event
        this.listeners.set(event, []);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        setTimeout(() => callback(data), 0);
      });
    }
  }
  
  disconnect() {
    this.connected = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.emit('disconnect', 'client disconnect');
  }
  
  removeAllListeners() {
    this.listeners.clear();
  }
  
  // Handle client messages
  handleMessage(message) {
    console.log('🔧 Mock Socket: Received message:', message);
    
    switch (message.type) {
      case 'join_lobby':
        this.handleJoinLobby(message.data);
        break;
      case 'make_move':
        this.handleMakeMove(message.data);
        break;
      case 'exchange_tiles':
        this.handleExchangeTiles(message.data);
        break;
      case 'pass_turn':
        this.handlePassTurn(message.data);
        break;
      default:
        console.log('🔧 Mock Socket: Unknown message type:', message.type);
    }
  }
  
  handleJoinLobby(data) {
    console.log('🔧 Mock Socket: Player joined lobby:', data);
    
    // Update player info
    if (this.gameState.players[0]) {
      this.gameState.players[0].playerId = data.playerId;
      this.gameState.players[0].playerName = data.playerName;
    }
    
    // Send lobby status
    setTimeout(() => {
      this.emit('message', {
        type: 'lobby_status',
        data: { waiting: false, playersCount: 2 }
      });
    }, 500);
    
    // Start game
    setTimeout(() => {
      this.emit('message', {
        type: 'game_started',
        data: this.gameState
      });
      
      // Send initial game state
      setTimeout(() => {
        this.emit('message', {
          type: 'game_state',
          data: this.gameState
        });
      }, 500);
    }, 1500);
  }
  
  handleMakeMove(data) {
    console.log('🔧 Mock Socket: Player made move:', data);
    
    const { moves, playerId } = data;
    let totalScore = 0;
    
    // Add moves to board
    moves.forEach(move => {
      this.gameState.board[move.row][move.col] = {
        letter: move.letter,
        isBlank: move.isBlank,
        blankLetter: move.blankLetter,
        playerId: playerId
      };
      totalScore += this.calculateTileScore(move.letter, move.row, move.col);
    });
    
    // Update score
    this.gameState.scores[playerId] += totalScore;
    
    // Update last move
    this.gameState.lastMove = {
      player: playerId,
      moves: moves,
      words: [{ word: 'SCRABBLE', score: totalScore }],
      score: totalScore,
      type: 'play'
    };
    
    // Update player tiles (remove used tiles)
    const player = this.gameState.players.find(p => p.playerId === playerId);
    if (player && player.tiles) {
      // Remove tiles that were used
      moves.forEach(() => {
        if (player.tiles.length > 0) {
          player.tiles.pop(); // Simple removal for demo
        }
      });
      
      // Add new tiles
      const newTiles = this.generateRandomTiles(moves.length);
      player.tiles.push(...newTiles);
    }
    
    // Send move result
    this.emit('message', {
      type: 'move_result',
      data: {
        success: true,
        score: totalScore,
        words: [{ word: 'SCRABBLE', score: totalScore }]
      }
    });
    
    // Update game state
    setTimeout(() => {
      this.switchTurn();
    }, 1000);
  }
  
  handleExchangeTiles(data) {
    console.log('🔧 Mock Socket: Player exchanged tiles:', data);
    
    const { tiles, playerId } = data;
    const player = this.gameState.players.find(p => p.playerId === playerId);
    
    if (player && player.tiles) {
      // Replace selected tiles with new ones
      tiles.forEach(({ index }) => {
        if (player.tiles[index]) {
          player.tiles[index] = this.generateRandomTile();
        }
      });
    }
    
    this.emit('message', {
      type: 'move_result',
      data: {
        success: true,
        action: 'exchange',
        tilesExchanged: tiles.length
      }
    });
    
    // Switch turn
    setTimeout(() => {
      this.switchTurn();
    }, 1000);
  }
  
  handlePassTurn(data) {
    console.log('🔧 Mock Socket: Player passed turn:', data);
    
    this.gameState.lastMove = {
      player: data.playerId,
      type: 'pass',
      score: 0
    };
    
    this.emit('message', {
      type: 'move_result',
      data: {
        success: true,
        action: 'pass'
      }
    });
    
    // Switch turn
    setTimeout(() => {
      this.switchTurn();
    }, 1000);
  }
  
  calculateTileScore(letter, row, col) {
    // Simple scoring for demo
    const letterScores = {
      A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
      K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
      U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10, '_': 0
    };
    
    return letterScores[letter] || 1;
  }
  
  generateRandomTiles(count) {
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
  
  generateRandomTile() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return {
      letter: letters[Math.floor(Math.random() * letters.length)],
      id: `tile-${Date.now()}-${Math.random()}`
    };
  }
}

// Mock io function
export const io = (url, options) => {
  console.log('🔧 Mock Socket: Creating mock connection to', url);
  return new MockSocket();
};

export default MockSocket;