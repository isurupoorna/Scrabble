/**
 * Timer Management System for Scrabble Game
 * Handles player timers, turn timeouts, and game timing
 */

const EventEmitter = require('events');

/**
 * Timer Manager Class
 * Manages all timing aspects of the Scrabble game
 */
class TimerManager extends EventEmitter {
    constructor() {
        super();
        this.playerTimers = new Map(); // playerId -> remaining time
        this.gameTimers = new Map(); // gameId-playerId -> interval
        this.gameTimeouts = new Map(); // gameId -> timeout settings
        this.activeTimers = new Map(); // track active timer intervals
        
        // Default timer settings
        this.defaultSettings = {
            playerTimeLimit: 10 * 60 * 1000, // 10 minutes per player
            turnTimeLimit: 2 * 60 * 1000,    // 2 minutes per turn
            overtimeLimit: 30 * 1000,        // 30 seconds overtime
            warningTime: 30 * 1000           // Warning at 30 seconds
        };
        
        console.log('Timer Manager initialized');
    }

    /**
     * Initialize game timer settings
     * @param {string} gameId - Game identifier
     * @param {Object} settings - Timer settings
     */
    initializeGame(gameId, settings = {}) {
        const gameSettings = {
            ...this.defaultSettings,
            ...settings
        };
        
        this.gameTimeouts.set(gameId, gameSettings);
        
        console.log(`Game ${gameId} timer initialized with settings:`, gameSettings);
        
        this.emit('game_timer_initialized', {
            gameId,
            settings: gameSettings
        });
    }

    /**
     * Initialize player timer
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     * @param {number} initialTime - Initial time allocation
     */
    initializePlayer(gameId, playerId, initialTime = null) {
        const gameSettings = this.gameTimeouts.get(gameId) || this.defaultSettings;
        const timeLimit = initialTime || gameSettings.playerTimeLimit;
        
        this.playerTimers.set(playerId, timeLimit);
        
        console.log(`Player ${playerId} timer initialized with ${timeLimit}ms`);
        
        this.emit('player_timer_initialized', {
            gameId,
            playerId,
            timeRemaining: timeLimit
        });
    }

    /**
     * Start player timer for their turn
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    startPlayerTimer(gameId, playerId) {
        // Stop any existing timer for this player
        this.pausePlayerTimer(gameId, playerId);
        
        const remaining = this.playerTimers.get(playerId) || this.defaultSettings.playerTimeLimit;
        const gameSettings = this.gameTimeouts.get(gameId) || this.defaultSettings;
        
        let warningTriggered = false;
        let overtimeTriggered = false;
        
        console.log(`Starting timer for player ${playerId} with ${remaining}ms remaining`);
        
        const timer = setInterval(() => {
            const currentRemaining = this.playerTimers.get(playerId) || 0;
            const newRemaining = Math.max(0, currentRemaining - 1000);
            
            this.playerTimers.set(playerId, newRemaining);
            
            // Broadcast timer update
            this.emit('timer_update', {
                gameId,
                playerId,
                timeRemaining: newRemaining,
                isOvertime: newRemaining <= 0
            });
            
            // Warning threshold
            if (!warningTriggered && newRemaining <= gameSettings.warningTime && newRemaining > 0) {
                warningTriggered = true;
                this.emit('timer_warning', {
                    gameId,
                    playerId,
                    timeRemaining: newRemaining
                });
                console.log(`Timer warning for player ${playerId}: ${newRemaining}ms remaining`);
            }
            
            // Overtime threshold
            if (newRemaining <= 0 && !overtimeTriggered) {
                overtimeTriggered = true;
                this.emit('timer_overtime', {
                    gameId,
                    playerId
                });
                console.log(`Player ${playerId} entered overtime`);
            }
            
            // Overtime limit exceeded
            if (newRemaining <= -gameSettings.overtimeLimit) {
                this.handleTimeout(gameId, playerId);
            }
            
        }, 1000);
        
        this.gameTimers.set(`${gameId}-${playerId}`, timer);
        this.activeTimers.set(`${gameId}-${playerId}`, {
            timer,
            startTime: Date.now(),
            playerId,
            gameId
        });
        
        this.emit('timer_started', {
            gameId,
            playerId,
            timeRemaining: remaining
        });
    }

    /**
     * Pause player timer
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    pausePlayerTimer(gameId, playerId) {
        const timerId = `${gameId}-${playerId}`;
        const timer = this.gameTimers.get(timerId);
        
        if (timer) {
            clearInterval(timer);
            this.gameTimers.delete(timerId);
            this.activeTimers.delete(timerId);
            
            console.log(`Timer paused for player ${playerId}`);
            
            this.emit('timer_paused', {
                gameId,
                playerId,
                timeRemaining: this.playerTimers.get(playerId) || 0
            });
        }
    }

    /**
     * Handle player timeout
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    handleTimeout(gameId, playerId) {
        console.log(`Player ${playerId} timed out in game ${gameId}`);
        
        // Stop the timer
        this.pausePlayerTimer(gameId, playerId);
        
        // Set remaining time to 0
        this.playerTimers.set(playerId, 0);
        
        this.emit('player_timeout', {
            gameId,
            playerId,
            timestamp: Date.now()
        });
    }

    /**
     * Add time to player's clock (bonus time)
     * @param {string} playerId - Player identifier
     * @param {number} additionalTime - Time to add in milliseconds
     */
    addTime(playerId, additionalTime) {
        const currentTime = this.playerTimers.get(playerId) || 0;
        const newTime = currentTime + additionalTime;
        
        this.playerTimers.set(playerId, newTime);
        
        console.log(`Added ${additionalTime}ms to player ${playerId}. New total: ${newTime}ms`);
        
        this.emit('time_added', {
            playerId,
            additionalTime,
            newTotal: newTime
        });
    }

    /**
     * Get remaining time for a player
     * @param {string} playerId - Player identifier
     * @returns {number} - Remaining time in milliseconds
     */
    getRemainingTime(playerId) {
        return this.playerTimers.get(playerId) || 0;
    }

    /**
     * Get all player times for a game
     * @param {string} gameId - Game identifier
     * @param {string[]} playerIds - Array of player IDs
     * @returns {Object} - Object with player times
     */
    getAllPlayerTimes(gameId, playerIds) {
        const times = {};
        
        for (const playerId of playerIds) {
            times[playerId] = this.getRemainingTime(playerId);
        }
        
        return times;
    }

    /**
     * Reset player timer to initial value
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    resetPlayerTimer(gameId, playerId) {
        const gameSettings = this.gameTimeouts.get(gameId) || this.defaultSettings;
        this.playerTimers.set(playerId, gameSettings.playerTimeLimit);
        
        console.log(`Reset timer for player ${playerId} to ${gameSettings.playerTimeLimit}ms`);
        
        this.emit('timer_reset', {
            gameId,
            playerId,
            timeRemaining: gameSettings.playerTimeLimit
        });
    }

    /**
     * Start turn timer (separate from player time)
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    startTurnTimer(gameId, playerId) {
        const gameSettings = this.gameTimeouts.get(gameId) || this.defaultSettings;
        const turnTimerId = `turn-${gameId}-${playerId}`;
        
        // Clear existing turn timer
        const existingTimer = this.activeTimers.get(turnTimerId);
        if (existingTimer) {
            clearInterval(existingTimer.timer);
        }
        
        let turnTimeRemaining = gameSettings.turnTimeLimit;
        
        const turnTimer = setInterval(() => {
            turnTimeRemaining -= 1000;
            
            this.emit('turn_timer_update', {
                gameId,
                playerId,
                turnTimeRemaining: Math.max(0, turnTimeRemaining)
            });
            
            if (turnTimeRemaining <= 0) {
                this.handleTurnTimeout(gameId, playerId);
            }
            
        }, 1000);
        
        this.activeTimers.set(turnTimerId, {
            timer: turnTimer,
            startTime: Date.now(),
            playerId,
            gameId,
            type: 'turn'
        });
        
        console.log(`Turn timer started for player ${playerId}: ${gameSettings.turnTimeLimit}ms`);
    }

    /**
     * Handle turn timeout
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    handleTurnTimeout(gameId, playerId) {
        const turnTimerId = `turn-${gameId}-${playerId}`;
        
        // Clear turn timer
        const timer = this.activeTimers.get(turnTimerId);
        if (timer) {
            clearInterval(timer.timer);
            this.activeTimers.delete(turnTimerId);
        }
        
        console.log(`Turn timeout for player ${playerId} in game ${gameId}`);
        
        this.emit('turn_timeout', {
            gameId,
            playerId,
            timestamp: Date.now()
        });
    }

    /**
     * Stop turn timer
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     */
    stopTurnTimer(gameId, playerId) {
        const turnTimerId = `turn-${gameId}-${playerId}`;
        const timer = this.activeTimers.get(turnTimerId);
        
        if (timer) {
            clearInterval(timer.timer);
            this.activeTimers.delete(turnTimerId);
            
            console.log(`Turn timer stopped for player ${playerId}`);
            
            this.emit('turn_timer_stopped', {
                gameId,
                playerId
            });
        }
    }

    /**
     * Get game statistics
     * @param {string} gameId - Game identifier
     * @returns {Object} - Game timing statistics
     */
    getGameStats(gameId) {
        const gameSettings = this.gameTimeouts.get(gameId) || this.defaultSettings;
        const activeGameTimers = [];
        
        for (const [timerId, timerInfo] of this.activeTimers) {
            if (timerInfo.gameId === gameId) {
                activeGameTimers.push({
                    timerId,
                    playerId: timerInfo.playerId,
                    type: timerInfo.type || 'player',
                    duration: Date.now() - timerInfo.startTime
                });
            }
        }
        
        return {
            gameId,
            settings: gameSettings,
            activeTimers: activeGameTimers,
            totalActiveTimers: activeGameTimers.length
        };
    }

    /**
     * Clean up all timers for a game
     * @param {string} gameId - Game identifier
     */
    cleanupGame(gameId) {
        const timersToClean = [];
        
        // Find all timers for this game
        for (const [timerId, timerInfo] of this.activeTimers) {
            if (timerInfo.gameId === gameId) {
                timersToClean.push(timerId);
                clearInterval(timerInfo.timer);
            }
        }
        
        // Remove from tracking maps
        for (const timerId of timersToClean) {
            this.activeTimers.delete(timerId);
            this.gameTimers.delete(timerId);
        }
        
        // Remove game settings
        this.gameTimeouts.delete(gameId);
        
        console.log(`Cleaned up ${timersToClean.length} timers for game ${gameId}`);
        
        this.emit('game_timers_cleaned', {
            gameId,
            cleanedTimers: timersToClean.length
        });
    }

    /**
     * Clean up player timer
     * @param {string} playerId - Player identifier
     */
    cleanupPlayer(playerId) {
        this.playerTimers.delete(playerId);
        
        // Clean up any active timers for this player
        const timersToClean = [];
        for (const [timerId, timerInfo] of this.activeTimers) {
            if (timerInfo.playerId === playerId) {
                timersToClean.push(timerId);
                clearInterval(timerInfo.timer);
                this.activeTimers.delete(timerId);
                this.gameTimers.delete(timerId);
            }
        }
        
        console.log(`Cleaned up player ${playerId} timers: ${timersToClean.length} timers removed`);
        
        this.emit('player_timers_cleaned', {
            playerId,
            cleanedTimers: timersToClean.length
        });
    }

    /**
     * Get system statistics
     * @returns {Object} - System timer statistics
     */
    getSystemStats() {
        const activePlayerTimers = this.playerTimers.size;
        const activeGameTimers = this.activeTimers.size;
        const totalGames = this.gameTimeouts.size;
        
        return {
            activePlayerTimers,
            activeGameTimers,
            totalGames,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    /**
     * Emergency stop all timers
     */
    emergencyStop() {
        console.log('Emergency stop: Clearing all timers');
        
        let clearedCount = 0;
        
        // Clear all active timers
        for (const [timerId, timerInfo] of this.activeTimers) {
            clearInterval(timerInfo.timer);
            clearedCount++;
        }
        
        // Clear all maps
        this.activeTimers.clear();
        this.gameTimers.clear();
        this.gameTimeouts.clear();
        this.playerTimers.clear();
        
        console.log(`Emergency stop completed: ${clearedCount} timers cleared`);
        
        this.emit('emergency_stop', {
            clearedTimers: clearedCount,
            timestamp: Date.now()
        });
    }

    /**
     * Format time for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} - Formatted time string
     */
    static formatTime(milliseconds) {
        if (milliseconds <= 0) {
            return '00:00';
        }
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Parse time string to milliseconds
     * @param {string} timeString - Time string (e.g., "10:00")
     * @returns {number} - Time in milliseconds
     */
    static parseTime(timeString) {
        const parts = timeString.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid time format. Use MM:SS');
        }
        
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        
        return (minutes * 60 + seconds) * 1000;
    }
}

/**
 * Global Timer Manager Instance
 */
let globalTimerManager = null;

/**
 * Get or create global timer manager instance
 * @returns {TimerManager} - Timer manager instance
 */
function getTimerManager() {
    if (!globalTimerManager) {
        globalTimerManager = new TimerManager();
    }
    return globalTimerManager;
}

/**
 * Timer Integration Helpers
 */
class TimerIntegration {
    /**
     * Setup timer event handlers for socket.io
     * @param {Object} io - Socket.io instance
     * @param {TimerManager} timerManager - Timer manager instance
     */
    static setupSocketHandlers(io, timerManager) {
        timerManager.on('timer_update', (data) => {
            io.to(data.gameId).emit('message', {
                type: 'timer_update',
                data: {
                    [data.playerId]: data.timeRemaining,
                    isOvertime: data.isOvertime
                }
            });
        });
        
        timerManager.on('timer_warning', (data) => {
            io.to(data.gameId).emit('message', {
                type: 'timer_warning',
                data: {
                    playerId: data.playerId,
                    timeRemaining: data.timeRemaining
                }
            });
        });
        
        timerManager.on('timer_overtime', (data) => {
            io.to(data.gameId).emit('message', {
                type: 'timer_overtime',
                data: {
                    playerId: data.playerId
                }
            });
        });
        
        timerManager.on('player_timeout', (data) => {
            io.to(data.gameId).emit('message', {
                type: 'player_timeout',
                data: {
                    playerId: data.playerId,
                    timestamp: data.timestamp
                }
            });
        });
        
        timerManager.on('turn_timeout', (data) => {
            io.to(data.gameId).emit('message', {
                type: 'turn_timeout',
                data: {
                    playerId: data.playerId,
                    timestamp: data.timestamp
                }
            });
        });
        
        console.log('Timer socket handlers configured');
    }

    /**
     * Handle game end cleanup
     * @param {string} gameId - Game identifier
     * @param {TimerManager} timerManager - Timer manager instance
     */
    static handleGameEnd(gameId, timerManager) {
        timerManager.cleanupGame(gameId);
    }

    /**
     * Handle player disconnect cleanup
     * @param {string} playerId - Player identifier
     * @param {TimerManager} timerManager - Timer manager instance
     */
    static handlePlayerDisconnect(playerId, timerManager) {
        timerManager.cleanupPlayer(playerId);
    }
}

module.exports = {
    TimerManager,
    TimerIntegration,
    getTimerManager
};