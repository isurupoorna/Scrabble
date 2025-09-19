import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './GameBoard';
import PlayerRack from './PlayerRack';
import GameInfo from './GameInfo';
import TimerDisplay from './TimerDisplay';
import ExchangeDialog from './ExchangeDialog';
import GameEndDialog from './GameEndDialog';
import LoadingScreen from './LoadingScreen';
import WelcomeScreen from './WelcomeScreen';
import useSocket from '../hooks/useSocket';
import { 
  generateId, 
  promptName, 
  DIRECTIONS, 
  isValidPosition,
  getNextPosition,
  validateMove
} from '../utils/gameConstants';
import '../styles/ScrabbleGame.scss';

function ScrabbleGame() {
  // Core game state
  const [gameState, setGameState] = useState(null);
  const [playerRack, setPlayerRack] = useState([]);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [direction, setDirection] = useState(DIRECTIONS.HORIZONTAL);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [timers, setTimers] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [playerId] = useState(generateId());
  const [playerName, setPlayerName] = useState(null); // Will be set by welcome screen
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [isExchangeDialogOpen, setIsExchangeDialogOpen] = useState(false);
  const [gameEndData, setGameEndData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const gameContainerRef = useRef(null);

  // Socket connection
  const { socket, isConnected } = useSocket();
  
  // Handle player name submission from welcome screen
  const handlePlayerNameSubmit = (name) => {
    setPlayerName(name);
    setShowWelcomeScreen(false);
    setIsLoading(true);
  };

  // Socket event handlers
  const handleLobbyStatus = useCallback((data) => {
    console.log('Lobby status:', data);
    if (data.waiting) {
      setIsLoading(true);
      setConnectionStatus('connected');
    } else {
      setIsLoading(false);
      setConnectionStatus('connected');
    }
  }, []);

  const handleGameStarted = useCallback((data) => {
    console.log('Game started:', data);
    setGameState(data);
    setCurrentPlayer(data.currentPlayer);
    setIsLoading(false);
  }, []);

  const handleGameState = useCallback((data) => {
    console.log('Game state update:', data);
    setGameState(data);
    setCurrentPlayer(data.currentPlayer);
    
    // Update player rack if this player's tiles changed
    const player = data.players?.find(p => p.playerId === playerId);
    if (player && player.tiles) {
      setPlayerRack(player.tiles);
    }
  }, [playerId]);

  const handleTimerUpdate = useCallback((data) => {
    setTimers(data);
  }, []);

  const handleMoveResult = useCallback((data) => {
    if (data.success) {
      setPlacedTiles([]);
      setSelectedSquare(null);
      setErrorMessage('');
    } else {
      setErrorMessage(data.error || 'Invalid move');
      // Return tiles to rack
      setPlacedTiles([]);
    }
  }, []);

  const handleBotMove = useCallback((data) => {
    console.log('Bot move:', data);
    // The game state will be updated via handleGameState
  }, []);

  const handleGameEnd = useCallback((data) => {
    setGameEndData(data);
  }, []);

  // Initialize socket listeners
  useEffect(() => {
    if (!socket || !playerName) return;

    socket.on('message', (event) => {
      switch(event.type) {
        case 'lobby_status': 
          handleLobbyStatus(event.data); 
          break;
        case 'game_started': 
          handleGameStarted(event.data); 
          break;
        case 'game_state': 
          handleGameState(event.data); 
          break;
        case 'timer_update': 
          handleTimerUpdate(event.data); 
          break;
        case 'move_result': 
          handleMoveResult(event.data); 
          break;
        case 'bot_move_made': 
          handleBotMove(event.data); 
          break;
        case 'game_ended':
          handleGameEnd(event.data);
          break;
        default:
          console.log('Unknown event:', event);
      }
    });

    // Join lobby on connection
    socket.emit('message', {
      type: 'join_lobby',
      data: { playerId, playerName }
    });

    return () => {
      socket.off('message');
    };
  }, [socket, playerId, playerName, handleLobbyStatus, handleGameStarted, 
      handleGameState, handleTimerUpdate, handleMoveResult, handleBotMove, handleGameEnd]);

  // Connection status monitoring
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!gameState || currentPlayer !== playerId) return;

      const key = event.key.toUpperCase();
      
      // Handle Escape - cancel current move
      if (event.key === 'Escape') {
        handleCancelMove();
        return;
      }

      // Handle Enter - submit move
      if (event.key === 'Enter') {
        handleSubmitMove();
        return;
      }

      // Handle letter typing
      if (key.match(/[A-Z]/) && selectedSquare) {
        const isBlank = event.shiftKey;
        handleTypeLetter(key, isBlank);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [gameState, currentPlayer, playerId, selectedSquare, placedTiles]);

  // Game interaction handlers
  const handleSquareClick = (row, col) => {
    if (!gameState || currentPlayer !== playerId) {
      setErrorMessage('Not your turn');
      return;
    }

    // If clicking the same square, toggle direction
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      setDirection(prev => prev === DIRECTIONS.HORIZONTAL ? DIRECTIONS.VERTICAL : DIRECTIONS.HORIZONTAL);
      return;
    }

    // Select new square
    setSelectedSquare({ row, col });
    setErrorMessage('');
  };

  const handleTypeLetter = (letter, isBlank = false) => {
    if (!selectedSquare) {
      setErrorMessage('Select starting position first');
      return;
    }

    // Check if player has this tile
    const availableTile = playerRack.find(tile => 
      !placedTiles.some(pt => pt.rackIndex === playerRack.indexOf(tile)) &&
      (isBlank ? tile.letter === '_' : tile.letter === letter)
    );

    if (!availableTile) {
      setErrorMessage('Invalid tile');
      return;
    }

    // Find next available position
    let currentRow = selectedSquare.row;
    let currentCol = selectedSquare.col;
    let positionFound = false;

    // Skip occupied squares
    while (isValidPosition(currentRow, currentCol)) {
      const isOccupied = gameState.board[currentRow][currentCol] !== null ||
                        placedTiles.some(pt => pt.row === currentRow && pt.col === currentCol);
      
      if (!isOccupied) {
        positionFound = true;
        break;
      }

      [currentRow, currentCol] = getNextPosition(currentRow, currentCol, direction);
    }

    if (!positionFound || !isValidPosition(currentRow, currentCol)) {
      setErrorMessage('Word extends off board');
      return;
    }

    // Place the tile
    const newTile = {
      letter: isBlank ? letter : availableTile.letter,
      row: currentRow,
      col: currentCol,
      isBlank: isBlank,
      blankLetter: isBlank ? letter : null,
      rackIndex: playerRack.indexOf(availableTile),
      id: `placed-${Date.now()}-${Math.random()}`
    };

    const updatedPlacedTiles = [...placedTiles, newTile];
    setPlacedTiles(updatedPlacedTiles);
    
    // Provide real-time validation feedback
    if (updatedPlacedTiles.length > 1) {
      const validation = validateMove(gameState.board, updatedPlacedTiles);
      if (!validation.isValid) {
        // Show warning but don't block placement (just inform user)
        setErrorMessage(`Warning: ${validation.errors[0]}`);
      } else {
        setErrorMessage('');
      }
    } else {
      setErrorMessage('');
    }
  };

  const handleSubmitMove = () => {
    if (!gameState || currentPlayer !== playerId || placedTiles.length === 0) {
      return;
    }

    // Validate move before submitting
    const validation = validateMove(gameState.board, placedTiles);
    
    if (!validation.isValid) {
      // Show all validation errors
      setErrorMessage(validation.errors.join('. '));
      return;
    }
    
    // Clear any previous errors
    setErrorMessage('');
    
    socket.emit('message', {
      type: 'make_move',
      data: { 
        gameId: gameState.gameId,
        moves: placedTiles.map(t => ({
          letter: t.letter,
          row: t.row,
          col: t.col,
          isBlank: t.isBlank,
          blankLetter: t.blankLetter
        })),
        playerId: playerId
      }
    });
  };

  const handleCancelMove = () => {
    setPlacedTiles([]);
    setSelectedSquare(null);
    setErrorMessage('');
  };

  const handlePassTurn = () => {
    if (!gameState || currentPlayer !== playerId) return;

    socket.emit('message', {
      type: 'pass_turn',
      data: { gameId: gameState.gameId, playerId: playerId }
    });
  };

  const handleExchangeTiles = (selectedTiles) => {
    if (!gameState || currentPlayer !== playerId) return;

    socket.emit('message', {
      type: 'exchange_tiles',
      data: { gameId: gameState.gameId, tiles: selectedTiles, playerId: playerId }
    });

    setIsExchangeDialogOpen(false);
  };

  const handleRackReorder = (newRack) => {
    setPlayerRack(newRack);
  };

  const handleShuffle = () => {
    const shuffled = [...playerRack].sort(() => Math.random() - 0.5);
    setPlayerRack(shuffled);
  };

  // Show welcome screen first
  if (showWelcomeScreen) {
    return <WelcomeScreen onPlayerNameSubmit={handlePlayerNameSubmit} />;
  }

  // Loading screen
  if (isLoading) {
    return <LoadingScreen connectionStatus={connectionStatus} />;
  }

  return (
    <div className="scrabble-game" ref={gameContainerRef}>
      {/* Connection status indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        <span className="status-icon"></span>
        <span className="status-text">
          {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className={`message-display ${errorMessage.startsWith('Warning') ? 'warning' : 'error'}`}>
          <span className="message-icon">
            {errorMessage.startsWith('Warning') ? '⚠️' : '❌'}
          </span>
          <span className="message-text">{errorMessage}</span>
          <button 
            className="message-close" 
            onClick={() => setErrorMessage('')}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {/* Main game content */}
      {gameState ? (
        <div className="game-content">
          <div className="game-left">
            <GameBoard
              board={gameState.board}
              onSquareClick={handleSquareClick}
              placedTiles={placedTiles}
              selectedSquare={selectedSquare}
              direction={direction}
              lastMove={gameState.lastMove || []}
            />
            
            <div className="game-controls">
              <button 
                className={`btn ${placedTiles.length > 0 && gameState ? 
                  (validateMove(gameState.board, placedTiles).isValid ? 'btn-primary' : 'btn-warning') 
                  : 'btn-primary'}`}
                onClick={handleSubmitMove}
                disabled={placedTiles.length === 0 || currentPlayer !== playerId}
                title={placedTiles.length > 0 && gameState && !validateMove(gameState.board, placedTiles).isValid ? 
                  'Move has validation issues - click to see details' : 'Submit your move'}
              >
                Submit Move {placedTiles.length > 0 && gameState && !validateMove(gameState.board, placedTiles).isValid ? '⚠️' : ''}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleCancelMove}
                disabled={placedTiles.length === 0}
              >
                Cancel
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handlePassTurn}
                disabled={currentPlayer !== playerId}
              >
                Pass Turn
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setIsExchangeDialogOpen(true)}
                disabled={currentPlayer !== playerId}
              >
                Exchange Tiles
              </button>
            </div>
          </div>

          <div className="game-right">
            <TimerDisplay 
              timers={timers} 
              currentPlayer={currentPlayer}
              players={gameState.players}
            />
            
            <GameInfo 
              players={gameState.players}
              scores={gameState.scores}
              tilesRemaining={gameState.tilesRemaining}
              lastMove={gameState.lastMove}
              currentPlayer={currentPlayer}
              playerId={playerId}
            />
          </div>

          <div className="game-bottom">
            <PlayerRack 
              tiles={playerRack}
              onTileSelect={() => {}} // TODO: Implement tile selection
              onRackReorder={handleRackReorder}
              onShuffle={handleShuffle}
              placedTileIndices={placedTiles.map(pt => pt.rackIndex)}
            />
          </div>
        </div>
      ) : (
        <div className="waiting-for-game">
          <h2>Waiting for game to start...</h2>
          <div className="spinner"></div>
        </div>
      )}

      {/* Modal dialogs */}
      <ExchangeDialog
        isOpen={isExchangeDialogOpen}
        rack={playerRack}
        onExchange={handleExchangeTiles}
        onCancel={() => setIsExchangeDialogOpen(false)}
      />

      {gameEndData && (
        <GameEndDialog
          winner={gameEndData.winner}
          finalScores={gameEndData.finalScores}
          onNewGame={() => setGameEndData(null)}
        />
      )}
    </div>
  );
}

export default ScrabbleGame;