# Professional Scrabble Game Client

A production-ready, real-time multiplayer Scrabble game built with React 18+ and Socket.io. Features professional styling, responsive design, and complete game functionality including drag-and-drop tile placement, timer synchronization, and bot gameplay.

## Features

### Core Game Features
- **Real-time Multiplayer**: Seamless Socket.io-powered multiplayer experience
- **Professional UI**: Authentic Scrabble board with premium square colors
- **Drag & Drop**: Intuitive tile rack management with reordering
- **Click & Type**: Alternative tile placement system
- **Timer System**: Synchronized countdown timers with visual warnings
- **Bot Players**: AI opponents for solo practice
- **Move Validation**: Client-side warnings with server-side validation

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Professional Styling**: Wood-grain textures and authentic Scrabble aesthetics
- **Smooth Animations**: Tile placement, timer countdowns, and transitions
- **Loading States**: Professional loading screen with floating tile animations
- **Error Handling**: Graceful error boundaries and user-friendly messages
- **Accessibility**: Keyboard navigation and screen reader support

### Technical Features
- **React 18+**: Modern hooks and concurrent features
- **TypeScript Ready**: Full type definitions available
- **Production Optimized**: Code splitting and performance optimizations
- **PWA Support**: Service worker registration for offline capability
- **Real-time Sync**: Automatic reconnection and state synchronization

## Quick Start

### Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher (or yarn 1.22+)
- **Scrabble Game Server**: Running on `http://localhost:3001`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/scrabble-game-client.git
   cd scrabble-game-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy .env file and edit with your server settings
   cp .env .env.local
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The app will automatically reload on code changes

## How to Play

### Getting Started
1. **Enter your name** when prompted
2. **Wait for opponent** or play against bot
3. **Game starts** automatically when players are ready

### Tile Placement
- **Click Method**: Click empty square → type letters → Enter to submit
- **Drag Method**: Drag tiles from rack to board positions
- **Direction Toggle**: Click same square to change horizontal ↔ vertical
- **Blank Tiles**: Shift + letter to place blank with assigned letter

### Controls
- **Enter**: Submit current move
- **Escape**: Cancel move and return tiles to rack
- **Shuffle Button**: Randomize tile rack order
- **Pass Turn**: Skip your turn
- **Exchange Tiles**: Replace selected tiles (costs turn)

### Game Rules
- First word must cross the center star (★)
- All new words must connect to existing tiles
- Premium squares apply only when first covered
- 7-letter bonus: +50 points
- Game ends when tile bag is empty or all players pass twice

## Project Structure

```
scrabble-game-client/
├── public/
│   ├── index.html          # Main HTML template
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # React components
│   │   ├── ScrabbleGame.js    # Main game container
│   │   ├── GameBoard.js       # 15x15 game board
│   │   ├── PlayerRack.js      # Tile rack component
│   │   ├── TimerDisplay.js    # Real-time timers
│   │   ├── GameInfo.js        # Score & player info
│   │   ├── ExchangeDialog.js  # Tile exchange modal
│   │   ├── GameEndDialog.js   # Game completion modal
│   │   ├── LoadingScreen.js   # Professional loading
│   │   └── ErrorBoundary.js   # Error handling
│   ├── hooks/
│   │   └── useSocket.js       # Socket.io connection
│   ├── utils/
│   │   └── gameConstants.js   # Game rules & utilities
│   ├── styles/
│   │   ├── index.scss         # Design system & variables
│   │   ├── ScrabbleGame.scss  # Main game layout
│   │   ├── GameBoard.scss     # Board & tile styling
│   │   └── *.scss            # Component styles
│   ├── App.js              # App root component
│   └── index.js            # React entry point
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables
└── README.md              # This file
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_SERVER_URL` | Game server HTTP URL | `http://localhost:3001` |
| `REACT_APP_DEBUG_MODE` | Enable debug logging | `false` |
| `REACT_APP_LOG_LEVEL` | Console log level | `warn` |

## Building for Production

### Development Build
```bash
npm run build
```

### Deployment
```bash
# Build production bundle
npm run build

# Deploy build folder to your hosting service
# The build/ folder contains all static assets
```

## API Reference

### Socket.io Events

#### Client → Server
```javascript
// Join game lobby
socket.emit('message', {
  type: 'join_lobby',
  data: { playerId, playerName }
});

// Make move
socket.emit('message', {
  type: 'make_move',
  data: { gameId, moves, playerId }
});
```

#### Server → Client
```javascript
socket.on('message', (event) => {
  switch(event.type) {
    case 'lobby_status':    // Lobby state updates
    case 'game_started':    // Game initialization
    case 'game_state':      // Game state updates
    case 'timer_update':    // Timer synchronization
    case 'move_result':     // Move validation results
    case 'bot_move_made':   // Bot player moves
    case 'game_ended':      // Game completion
  }
});
```

## License

This project is licensed under the MIT License.

---

**Built with ❤️ by the Scrabble Game Team**

*Ready to play? Start your engines and let the words flow!*
