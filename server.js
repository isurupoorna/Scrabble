/**
 * Simple Express Server for Scrabble Bot System
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Import bot system
const { createBot, getBotInstance, registerBot } = require('./bot-ai');
const { TimerManager, TimerIntegration } = require('./timer-manager');
const { PerformanceMonitor } = require('./performance-monitor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Initialize systems
const timerManager = new TimerManager();
const performanceMonitor = new PerformanceMonitor();

// Setup timer integration with Socket.IO
TimerIntegration.setupSocketHandlers(io, timerManager);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
    const health = performanceMonitor.getHealthStatus();
    res.json(health);
});

// API endpoints
app.get('/api/bot/create/:difficulty', async (req, res) => {
    try {
        const { difficulty } = req.params;
        const gameId = req.query.gameId || 'default-game';
        const botId = `bot-${Date.now()}`;
        
        const bot = createBot(gameId, botId, difficulty);
        registerBot(botId, bot);
        
        // Wait for bot initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        res.json({
            success: true,
            botId,
            gameId,
            difficulty,
            initialized: bot.initialized
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/bot/move', async (req, res) => {
    try {
        const { botId, gameState, rack } = req.body;
        const bot = getBotInstance(botId);
        
        if (!bot) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }
        
        const startTime = Date.now();
        const decision = await bot.generateMove(gameState, rack);
        const endTime = Date.now();
        
        // Track performance
        performanceMonitor.trackBotMove(botId, startTime, endTime, decision);
        
        res.json({
            success: true,
            decision,
            moveTime: endTime - startTime
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/performance', (req, res) => {
    const report = performanceMonitor.getPerformanceReport();
    res.json(report);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join_game', (data) => {
        const { gameId, playerId } = data;
        socket.join(gameId);
        
        // Initialize timer for player
        timerManager.initializeGame(gameId);
        timerManager.initializePlayer(gameId, playerId);
        
        // Track game start
        performanceMonitor.trackGameStart(gameId, { players: [{ isBot: false }] });
        
        console.log(`Player ${playerId} joined game ${gameId}`);
    });
    
    socket.on('bot_move_request', async (data) => {
        const { botId, gameState, rack } = data;
        
        try {
            const bot = getBotInstance(botId);
            if (bot) {
                const startTime = Date.now();
                const decision = await bot.generateMove(gameState, rack);
                const endTime = Date.now();
                
                // Track performance
                performanceMonitor.trackBotMove(botId, startTime, endTime, decision);
                
                socket.emit('bot_move_response', {
                    success: true,
                    decision,
                    moveTime: endTime - startTime
                });
            } else {
                socket.emit('bot_move_response', {
                    success: false,
                    error: 'Bot not found'
                });
            }
        } catch (error) {
            socket.emit('bot_move_response', {
                success: false,
                error: error.message
            });
        }
    });
    
    socket.on('start_timer', (data) => {
        const { gameId, playerId } = data;
        timerManager.startPlayerTimer(gameId, playerId);
    });
    
    socket.on('pause_timer', (data) => {
        const { gameId, playerId } = data;
        timerManager.pausePlayerTimer(gameId, playerId);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log('🎯 Scrabble Bot System Server Started!');
    console.log('=====================================');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Bot API: http://localhost:${PORT}/api/bot/create/advanced`);
    console.log(`📈 Performance: http://localhost:${PORT}/api/performance`);
    console.log('✅ Bot system ready for integration!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    performanceMonitor.stop();
    timerManager.emergencyStop();
    server.close(() => {
        console.log('Server shutdown complete.');
        process.exit(0);
    });
});