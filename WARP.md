# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a production-ready, real-time multiplayer Scrabble game built with React 18+ client and Node.js Socket.io server. It features professional UI, drag-and-drop tile placement, bot AI players, and comprehensive monitoring systems.

## Architecture

### Client-Server Structure
- **Frontend**: React 18+ application (`src/` directory)
- **Backend**: Node.js Socket.io server (`server/` directory)
- **Monorepo**: Both client and server in same repository with separate package.json files

### Key Components
- **ScrabbleGame.js**: Main game container handling all game state and socket communication
- **GameBoard.js**: 15x15 Scrabble board with premium squares and tile placement
- **PlayerRack.js**: Draggable tile rack with reordering support
- **useSocket.js**: Custom hook managing Socket.io connection with reconnection logic
- **gameConstants.js**: Core game rules, premium squares layout, and utility functions

### Socket.io Event System
The game uses a message-based Socket.io protocol:
- Client → Server: `socket.emit('message', { type: 'event_type', data: {...} })`
- Server → Client: Events include `lobby_status`, `game_started`, `game_state`, `move_result`

### Bot AI System
Advanced bot system with two difficulty levels:
- **Basic Bot**: Simple scoring-based decisions
- **Advanced Bot**: Strategic evaluation with move quality assessment
- **Performance Monitoring**: Comprehensive metrics tracking for bot performance

## Common Development Commands

### Client Development
```powershell
# Install dependencies (if not installed)
npm install

# Start development server (default port 3000)
npm start
# Alternative: npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Server Development
```powershell
# Navigate to server directory
cd server

# Install server dependencies
npm install

# Start server (default port 3001)
node index.js
# Alternative: npm start
```

### Full Stack Development
```powershell
# Start both client and server (if using concurrent setup)
# From root directory after installing concurrently
npm run dev:all
```

### Testing Bot System
```powershell
# Run bot demo (standalone testing)
node demo.js

# Test bot AI functionality
node bot-ai.js

# Performance monitoring test
node performance-monitor.js
```

## Key Development Patterns

### State Management
- Main game state in `ScrabbleGame.js` using React hooks
- Socket events update state via useCallback handlers
- Local state for UI interactions (selected squares, placed tiles)

### Socket Event Handling
Always use the message wrapper pattern:
```javascript
socket.emit('message', {
  type: 'event_name',
  data: { /* event data */ }
});

socket.on('message', (event) => {
  switch(event.type) {
    case 'event_name':
      // Handle event
      break;
  }
});
```

### Tile Placement System
Two methods supported:
1. **Click & Type**: Click square → type letters → Enter to submit
2. **Drag & Drop**: Drag tiles from rack to board positions

### Error Handling
- Client-side move validation with server-side confirmation
- Graceful error boundaries in React components
- Socket reconnection with exponential backoff

## Environment Configuration

### Required Environment Variables
- `REACT_APP_SERVER_URL`: Backend server URL (default: `http://localhost:3001`)
- `REACT_APP_DEBUG_MODE`: Enable debug logging (default: `false`)

### Dependencies Status
- **Client**: All dependencies installed and working
- **Server**: Missing express and socket.io dependencies - run `cd server && npm install`

## Deployment Options

### Docker (Full Stack)
```powershell
# Build and run full stack with Docker Compose
docker-compose up --build

# Includes: Client, Server, Redis, PostgreSQL, Nginx, Monitoring
```

### Cloud Deployment
- **Vercel**: Frontend deployment configured (`vercel.json`)
- **Railway**: Backend deployment configured (`railway.json`)
- **Supports**: Environment-based configuration for production

## File Structure Patterns

### React Components
- Each component has corresponding SCSS file
- Use functional components with hooks
- Error boundaries wrap main components
- Loading states for async operations

### Game Logic
- `gameConstants.js` contains all game rules and board layout
- Premium squares defined as coordinate arrays
- Utility functions for position validation and scoring

### Bot System
- `bot-ai.js`: Main bot intelligence
- `dictionary-trie.js`: Word validation system
- `performance-monitor.js`: Comprehensive metrics tracking
- `timer-manager.js`: Game timer synchronization

## Performance Considerations

### Client Optimizations
- React.StrictMode enabled
- Code splitting ready (via create-react-app)
- Memoized callbacks for socket handlers
- Efficient board re-rendering

### Server Optimizations  
- Bot move generation with time limits (30s basic, advanced strategy)
- Memory monitoring and cleanup
- Connection pooling and health checks

### Monitoring
- Performance monitoring system tracks game metrics
- Bot decision times and success rates
- System health and memory usage
- Configurable thresholds and alerts

## Testing Strategy

### Manual Testing
- Use `demo.js` for bot system testing
- Start client and server separately for development
- Test socket reconnection by stopping/starting server

### Integration Testing
- `integration-tests.js` available for comprehensive testing
- Covers bot AI, socket communication, and game logic

## Common Issues and Solutions

### Server Dependencies
If server won't start, install dependencies:
```powershell
cd server
npm install
```

### Socket Connection Issues
- Check server is running on port 3001
- Verify `REACT_APP_SERVER_URL` environment variable
- Check Windows firewall settings for ports 3000/3001

### Bot Performance
- CSW24.txt dictionary file improves bot vocabulary
- Monitor bot response times with performance-monitor.js
- Adjust bot difficulty based on game requirements

## Development Workflow

1. **Start Server**: `cd server && node index.js`
2. **Start Client**: `npm start` (from root)
3. **Test Bots**: `node demo.js` for standalone testing
4. **Monitor Performance**: Check console for metrics and timing
5. **Deploy**: Use Docker Compose for full stack or separate cloud deployments