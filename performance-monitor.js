/**
 * Performance Monitoring System for Scrabble Game
 * Tracks game metrics, bot performance, and system health
 */

const EventEmitter = require('events');
const os = require('os');

/**
 * Performance Monitor Class
 * Comprehensive monitoring and metrics collection
 */
class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        
        // Core metrics
        this.metrics = {
            // Game metrics
            activeGames: 0,
            totalGames: 0,
            completedGames: 0,
            
            // Player metrics
            activePlayers: 0,
            totalPlayers: 0,
            humanPlayers: 0,
            botPlayers: 0,
            
            // Move metrics
            totalMoves: 0,
            humanMoves: 0,
            botMoves: 0,
            averageMoveTime: 0,
            averageHumanMoveTime: 0,
            averageBotMoveTime: 0,
            
            // Bot specific metrics
            botMoveTime: 0,
            botDecisionTime: 0,
            botErrors: 0,
            botSuccessRate: 0,
            
            // System metrics
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            uptime: 0,
            requestCount: 0,
            errorCount: 0,
            
            // Game quality metrics
            averageGameDuration: 0,
            averageScore: 0,
            averageWordsPerGame: 0
        };
        
        // Detailed tracking arrays
        this.gameHistory = [];
        this.moveHistory = [];
        this.botPerformance = [];
        this.systemSamples = [];
        this.errorLog = [];
        
        // Performance thresholds
        this.thresholds = {
            maxBotMoveTime: 30000,    // 30 seconds
            maxResponseTime: 5000,    // 5 seconds
            maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
            minBotSuccessRate: 0.95,  // 95%
            maxErrorRate: 0.05        // 5%
        };
        
        // Monitoring intervals
        this.systemMonitorInterval = null;
        this.metricsCleanupInterval = null;
        
        // Configuration
        this.config = {
            sampleInterval: 30000,        // 30 seconds
            historyLimit: 1000,           // Keep last 1000 entries
            cleanupInterval: 300000,      // 5 minutes
            alertThreshold: 0.8           // Alert at 80% of threshold
        };
        
        this.startSystemMonitoring();
        console.log('Performance Monitor initialized');
    }

    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        // System metrics sampling
        this.systemMonitorInterval = setInterval(() => {
            this.sampleSystemMetrics();
        }, this.config.sampleInterval);
        
        // Cleanup old data
        this.metricsCleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, this.config.cleanupInterval);
    }

    /**
     * Sample system metrics
     */
    sampleSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const systemLoad = os.loadavg();
        
        const sample = {
            timestamp: Date.now(),
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external
            },
            cpu: cpuUsage,
            system: {
                loadAverage: systemLoad,
                freeMemory: os.freemem(),
                totalMemory: os.totalmem(),
                uptime: os.uptime()
            }
        };
        
        this.systemSamples.push(sample);
        
        // Update metrics
        this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memUsage.heapUsed);
        this.metrics.uptime = process.uptime();
        
        // Check thresholds
        this.checkSystemThresholds(sample);
    }

    /**
     * Track game start
     * @param {string} gameId - Game identifier
     * @param {Object} gameInfo - Game information
     */
    trackGameStart(gameId, gameInfo) {
        this.metrics.activeGames++;
        this.metrics.totalGames++;
        
        const gameData = {
            gameId,
            startTime: Date.now(),
            ...gameInfo,
            moves: 0,
            players: gameInfo.players || []
        };
        
        this.gameHistory.push(gameData);
        
        // Update player counts
        if (gameInfo.players) {
            for (const player of gameInfo.players) {
                if (player.isBot) {
                    this.metrics.botPlayers++;
                } else {
                    this.metrics.humanPlayers++;
                }
            }
            this.metrics.activePlayers += gameInfo.players.length;
        }
        
        console.log(`Game ${gameId} started - Active games: ${this.metrics.activeGames}`);
        
        this.emit('game_started', {
            gameId,
            activeGames: this.metrics.activeGames,
            totalGames: this.metrics.totalGames
        });
    }

    /**
     * Track game end
     * @param {string} gameId - Game identifier
     * @param {Object} gameResult - Game result data
     */
    trackGameEnd(gameId, gameResult) {
        this.metrics.activeGames = Math.max(0, this.metrics.activeGames - 1);
        this.metrics.completedGames++;
        
        // Find and update game in history
        const gameIndex = this.gameHistory.findIndex(g => g.gameId === gameId);
        if (gameIndex > -1) {
            const game = this.gameHistory[gameIndex];
            game.endTime = Date.now();
            game.duration = game.endTime - game.startTime;
            game.result = gameResult;
            
            // Update averages
            this.updateGameAverages(game);
        }
        
        console.log(`Game ${gameId} ended - Active games: ${this.metrics.activeGames}`);
        
        this.emit('game_ended', {
            gameId,
            activeGames: this.metrics.activeGames,
            duration: gameResult.duration,
            completedGames: this.metrics.completedGames
        });
    }

    /**
     * Track player move
     * @param {string} gameId - Game identifier
     * @param {string} playerId - Player identifier
     * @param {Object} moveData - Move information
     */
    trackMove(gameId, playerId, moveData) {
        const startTime = Date.now();
        const moveTime = moveData.moveTime || 0;
        const isBot = moveData.isBot || false;
        
        this.metrics.totalMoves++;
        
        const moveRecord = {
            gameId,
            playerId,
            timestamp: startTime,
            moveTime,
            isBot,
            moveType: moveData.type,
            score: moveData.score || 0,
            word: moveData.word,
            success: moveData.success !== false
        };
        
        this.moveHistory.push(moveRecord);
        
        // Update move time averages
        if (isBot) {
            this.metrics.botMoves++;
            this.metrics.averageBotMoveTime = this.updateAverage(
                this.metrics.averageBotMoveTime,
                moveTime,
                this.metrics.botMoves
            );
        } else {
            this.metrics.humanMoves++;
            this.metrics.averageHumanMoveTime = this.updateAverage(
                this.metrics.averageHumanMoveTime,
                moveTime,
                this.metrics.humanMoves
            );
        }
        
        this.metrics.averageMoveTime = this.updateAverage(
            this.metrics.averageMoveTime,
            moveTime,
            this.metrics.totalMoves
        );
        
        // Update game move count
        const gameIndex = this.gameHistory.findIndex(g => g.gameId === gameId);
        if (gameIndex > -1) {
            this.gameHistory[gameIndex].moves++;
        }
        
        this.emit('move_tracked', moveRecord);
    }

    /**
     * Track bot move performance
     * @param {string} botId - Bot identifier
     * @param {number} startTime - Move generation start time
     * @param {number} endTime - Move generation end time
     * @param {Object} moveData - Move data
     */
    trackBotMove(botId, startTime, endTime, moveData) {
        const duration = endTime - startTime;
        
        const botData = {
            botId,
            timestamp: endTime,
            duration,
            success: moveData.success !== false,
            moveType: moveData.type,
            difficulty: moveData.difficulty,
            error: moveData.error
        };
        
        this.botPerformance.push(botData);
        
        // Update bot metrics
        this.metrics.botMoveTime = this.updateAverage(
            this.metrics.botMoveTime,
            duration,
            this.botPerformance.length
        );
        
        // Calculate success rate
        const recentBotMoves = this.botPerformance.slice(-100); // Last 100 moves
        const successfulMoves = recentBotMoves.filter(m => m.success).length;
        this.metrics.botSuccessRate = successfulMoves / recentBotMoves.length;
        
        // Track errors
        if (moveData.error) {
            this.metrics.botErrors++;
            this.trackError('bot_move_error', moveData.error, { botId, duration });
        }
        
        // Check performance thresholds
        if (duration > this.thresholds.maxBotMoveTime) {
            console.warn(`Bot ${botId} move took ${duration}ms - exceeds ${this.thresholds.maxBotMoveTime}ms limit`);
            
            this.emit('performance_warning', {
                type: 'slow_bot_move',
                botId,
                duration,
                threshold: this.thresholds.maxBotMoveTime
            });
        }
        
        console.log(`Bot ${botId} move completed in ${duration}ms`);
    }

    /**
     * Track API response time
     * @param {string} endpoint - API endpoint
     * @param {number} responseTime - Response time in milliseconds
     * @param {boolean} success - Whether request was successful
     */
    trackResponseTime(endpoint, responseTime, success = true) {
        this.metrics.requestCount++;
        
        this.metrics.averageResponseTime = this.updateAverage(
            this.metrics.averageResponseTime,
            responseTime,
            this.metrics.requestCount
        );
        
        if (!success) {
            this.metrics.errorCount++;
        }
        
        // Check response time threshold
        if (responseTime > this.thresholds.maxResponseTime) {
            this.emit('performance_warning', {
                type: 'slow_response',
                endpoint,
                responseTime,
                threshold: this.thresholds.maxResponseTime
            });
        }
    }

    /**
     * Track error occurrence
     * @param {string} type - Error type
     * @param {Error|string} error - Error object or message
     * @param {Object} context - Additional context
     */
    trackError(type, error, context = {}) {
        const errorRecord = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: Date.now(),
            context
        };
        
        this.errorLog.push(errorRecord);
        this.metrics.errorCount++;
        
        console.error(`Error tracked: ${type}`, errorRecord);
        
        this.emit('error_tracked', errorRecord);
    }

    /**
     * Get current health status
     * @returns {Object} - Health status
     */
    getHealthStatus() {
        const errorRate = this.metrics.requestCount > 0 
            ? this.metrics.errorCount / this.metrics.requestCount 
            : 0;
        
        const memoryUsage = process.memoryUsage();
        const memoryPercentage = memoryUsage.heapUsed / this.thresholds.maxMemoryUsage;
        
        const issues = [];
        
        // Check thresholds
        if (this.metrics.botSuccessRate < this.thresholds.minBotSuccessRate) {
            issues.push(`Bot success rate: ${(this.metrics.botSuccessRate * 100).toFixed(1)}%`);
        }
        
        if (errorRate > this.thresholds.maxErrorRate) {
            issues.push(`Error rate: ${(errorRate * 100).toFixed(1)}%`);
        }
        
        if (memoryPercentage > 0.8) {
            issues.push(`Memory usage: ${(memoryPercentage * 100).toFixed(1)}%`);
        }
        
        return {
            status: issues.length === 0 ? 'healthy' : 'warning',
            uptime: process.uptime(),
            memory: memoryUsage,
            issues,
            metrics: this.getMetricsSummary()
        };
    }

    /**
     * Get metrics summary
     * @returns {Object} - Metrics summary
     */
    getMetricsSummary() {
        return {
            games: {
                active: this.metrics.activeGames,
                total: this.metrics.totalGames,
                completed: this.metrics.completedGames,
                averageDuration: this.metrics.averageGameDuration
            },
            players: {
                active: this.metrics.activePlayers,
                total: this.metrics.totalPlayers,
                human: this.metrics.humanPlayers,
                bot: this.metrics.botPlayers
            },
            moves: {
                total: this.metrics.totalMoves,
                human: this.metrics.humanMoves,
                bot: this.metrics.botMoves,
                averageTime: this.metrics.averageMoveTime,
                averageHumanTime: this.metrics.averageHumanMoveTime,
                averageBotTime: this.metrics.averageBotMoveTime
            },
            bot: {
                averageMoveTime: this.metrics.botMoveTime,
                successRate: this.metrics.botSuccessRate,
                errors: this.metrics.botErrors
            },
            system: {
                averageResponseTime: this.metrics.averageResponseTime,
                peakMemoryUsage: this.metrics.peakMemoryUsage,
                uptime: this.metrics.uptime,
                requestCount: this.metrics.requestCount,
                errorCount: this.metrics.errorCount
            }
        };
    }

    /**
     * Get detailed performance report
     * @returns {Object} - Performance report
     */
    getPerformanceReport() {
        const recentGames = this.gameHistory.slice(-50);
        const recentMoves = this.moveHistory.slice(-200);
        const recentBotMoves = this.botPerformance.slice(-100);
        const recentErrors = this.errorLog.slice(-20);
        
        return {
            summary: this.getMetricsSummary(),
            health: this.getHealthStatus(),
            recentActivity: {
                games: recentGames.length,
                moves: recentMoves.length,
                botMoves: recentBotMoves.length,
                errors: recentErrors.length
            },
            trends: this.calculateTrends(),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Calculate performance trends
     * @returns {Object} - Performance trends
     */
    calculateTrends() {
        const recentSamples = this.systemSamples.slice(-10);
        if (recentSamples.length < 2) {
            return { message: 'Insufficient data for trend analysis' };
        }
        
        const memoryTrend = this.calculateTrend(
            recentSamples.map(s => s.memory.heapUsed)
        );
        
        const recentMoves = this.moveHistory.slice(-100);
        const moveTimes = recentMoves.map(m => m.moveTime).filter(t => t > 0);
        const moveTimeTrend = this.calculateTrend(moveTimes);
        
        return {
            memory: memoryTrend,
            moveTime: moveTimeTrend,
            interpretation: {
                memory: memoryTrend > 0.1 ? 'increasing' : memoryTrend < -0.1 ? 'decreasing' : 'stable',
                moveTime: moveTimeTrend > 0.1 ? 'slowing' : moveTimeTrend < -0.1 ? 'improving' : 'stable'
            }
        };
    }

    /**
     * Generate performance recommendations
     * @returns {string[]} - Array of recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const health = this.getHealthStatus();
        
        if (this.metrics.botSuccessRate < this.thresholds.minBotSuccessRate) {
            recommendations.push('Bot success rate is low. Consider reviewing bot algorithms or dictionary loading.');
        }
        
        if (this.metrics.averageBotMoveTime > this.thresholds.maxBotMoveTime * 0.7) {
            recommendations.push('Bot move times are approaching the limit. Consider optimizing move generation algorithms.');
        }
        
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > this.thresholds.maxMemoryUsage * 0.7) {
            recommendations.push('Memory usage is high. Consider implementing data cleanup or reducing cache sizes.');
        }
        
        const errorRate = this.metrics.requestCount > 0 
            ? this.metrics.errorCount / this.metrics.requestCount 
            : 0;
        
        if (errorRate > this.thresholds.maxErrorRate * 0.7) {
            recommendations.push('Error rate is elevated. Review recent error logs and implement fixes.');
        }
        
        if (this.metrics.activeGames > 50) {
            recommendations.push('High number of active games. Monitor system resources and consider load balancing.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is performing well. Continue monitoring.');
        }
        
        return recommendations;
    }

    /**
     * Update running average
     * @param {number} currentAverage - Current average
     * @param {number} newValue - New value
     * @param {number} count - Total count
     * @returns {number} - Updated average
     */
    updateAverage(currentAverage, newValue, count) {
        if (count <= 1) return newValue;
        return (currentAverage * (count - 1) + newValue) / count;
    }

    /**
     * Calculate trend (simple linear regression slope)
     * @param {number[]} values - Array of values
     * @returns {number} - Trend slope
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = n * (n - 1) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
        const sumXX = n * (n - 1) * (2 * n - 1) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    /**
     * Update game averages
     * @param {Object} game - Game data
     */
    updateGameAverages(game) {
        const completedCount = this.metrics.completedGames;
        
        this.metrics.averageGameDuration = this.updateAverage(
            this.metrics.averageGameDuration,
            game.duration,
            completedCount
        );
        
        if (game.result && game.result.averageScore) {
            this.metrics.averageScore = this.updateAverage(
                this.metrics.averageScore,
                game.result.averageScore,
                completedCount
            );
        }
        
        if (game.moves) {
            this.metrics.averageWordsPerGame = this.updateAverage(
                this.metrics.averageWordsPerGame,
                game.moves,
                completedCount
            );
        }
    }

    /**
     * Check system thresholds and emit warnings
     * @param {Object} sample - System sample
     */
    checkSystemThresholds(sample) {
        const memoryPercentage = sample.memory.heapUsed / this.thresholds.maxMemoryUsage;
        const alertThreshold = this.config.alertThreshold;
        
        if (memoryPercentage > alertThreshold) {
            this.emit('system_warning', {
                type: 'high_memory_usage',
                percentage: memoryPercentage,
                current: sample.memory.heapUsed,
                threshold: this.thresholds.maxMemoryUsage
            });
        }
    }

    /**
     * Clean up old data
     */
    cleanupOldData() {
        const limit = this.config.historyLimit;
        
        if (this.gameHistory.length > limit) {
            this.gameHistory = this.gameHistory.slice(-limit);
        }
        
        if (this.moveHistory.length > limit) {
            this.moveHistory = this.moveHistory.slice(-limit);
        }
        
        if (this.botPerformance.length > limit) {
            this.botPerformance = this.botPerformance.slice(-limit);
        }
        
        if (this.systemSamples.length > limit) {
            this.systemSamples = this.systemSamples.slice(-limit);
        }
        
        if (this.errorLog.length > limit) {
            this.errorLog = this.errorLog.slice(-limit);
        }
        
        console.log('Performance data cleanup completed');
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.systemMonitorInterval) {
            clearInterval(this.systemMonitorInterval);
            this.systemMonitorInterval = null;
        }
        
        if (this.metricsCleanupInterval) {
            clearInterval(this.metricsCleanupInterval);
            this.metricsCleanupInterval = null;
        }
        
        console.log('Performance Monitor stopped');
    }

    /**
     * Reset all metrics
     */
    reset() {
        for (const key in this.metrics) {
            if (typeof this.metrics[key] === 'number') {
                this.metrics[key] = 0;
            }
        }
        
        this.gameHistory = [];
        this.moveHistory = [];
        this.botPerformance = [];
        this.systemSamples = [];
        this.errorLog = [];
        
        console.log('Performance metrics reset');
        this.emit('metrics_reset');
    }
}

/**
 * Global Performance Monitor Instance
 */
let globalMonitor = null;

/**
 * Get or create global performance monitor
 * @returns {PerformanceMonitor} - Monitor instance
 */
function getPerformanceMonitor() {
    if (!globalMonitor) {
        globalMonitor = new PerformanceMonitor();
    }
    return globalMonitor;
}

/**
 * Performance middleware for Express
 * @param {PerformanceMonitor} monitor - Monitor instance
 * @returns {Function} - Express middleware
 */
function createPerformanceMiddleware(monitor) {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const success = res.statusCode < 400;
            
            monitor.trackResponseTime(req.path, responseTime, success);
        });
        
        next();
    };
}

module.exports = {
    PerformanceMonitor,
    getPerformanceMonitor,
    createPerformanceMiddleware
};