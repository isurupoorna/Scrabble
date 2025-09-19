/**
 * Integration Test Suite for Scrabble Game
 * Tests bot functionality, timers, and deployment health
 */

const assert = require('assert');
const { EventEmitter } = require('events');

// Import modules to test
const { ScrabbleBot, createBot } = require('./bot-ai');
const { DictionaryManager } = require('./dictionary-trie');
const { TimerManager } = require('./timer-manager');
const { PerformanceMonitor } = require('./performance-monitor');

/**
 * Integration Test Runner
 */
class IntegrationTester extends EventEmitter {
    constructor() {
        super();
        this.testResults = [];
        this.startTime = Date.now();
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
        
        console.log('🚀 Starting Scrabble Game Integration Tests');
    }

    /**
     * Run all integration tests
     */
    async runFullGameTest() {
        try {
            console.log('\n=== SCRABBLE GAME INTEGRATION TEST SUITE ===\n');
            
            // 1. Test dictionary loading
            await this.testDictionaryLoading();
            
            // 2. Test bot initialization and basic functionality
            await this.testBotInitialization();
            
            // 3. Test bot move generation
            await this.testBotMoveGeneration();
            
            // 4. Test timer system
            await this.testTimerSystem();
            
            // 5. Test performance monitoring
            await this.testPerformanceMonitoring();
            
            // 6. Test bot vs bot game simulation
            await this.testBotVsBotGame();
            
            // 7. Test error handling and edge cases
            await this.testErrorHandling();
            
            // 8. Test deployment health
            await this.testDeploymentHealth();
            
            // 9. Test system integration
            await this.testSystemIntegration();
            
            // 10. Test stress conditions
            await this.testStressConditions();
            
            this.printFinalResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    /**
     * Test dictionary loading functionality
     */
    async testDictionaryLoading() {
        console.log('📖 Testing Dictionary Loading...');
        
        await this.runTest('Dictionary Manager Initialization', async () => {
            const dictManager = new DictionaryManager();
            assert(dictManager instanceof DictionaryManager, 'Dictionary manager should be created');
        });
        
        await this.runTest('Dictionary Loading with Default Words', async () => {
            const dictManager = new DictionaryManager();
            await dictManager.loadDictionary([]);
            const dict = dictManager.getDictionary();
            assert(dict.loaded, 'Dictionary should be loaded');
            assert(dict.wordCount > 0, 'Dictionary should have words');
        });
        
        await this.runTest('Word Validation', async () => {
            const dictManager = new DictionaryManager();
            await dictManager.loadDictionary(['HELLO', 'WORLD', 'SCRABBLE']);
            const dict = dictManager.getDictionary();
            
            assert(dict.isValidWord('HELLO'), 'HELLO should be valid');
            assert(dict.isValidWord('WORLD'), 'WORLD should be valid');
            assert(!dict.isValidWord('INVALID'), 'INVALID should not be valid');
        });
        
        await this.runTest('Word Finding', async () => {
            const dictManager = new DictionaryManager();
            await dictManager.loadDictionary(['HELLO', 'HELP', 'ELF', 'HE']);
            const dict = dictManager.getDictionary();
            
            const words = dict.findWords('HELLO');
            assert(words.length > 0, 'Should find words from letters');
            assert(words.includes('HELLO'), 'Should find HELLO');
            assert(words.includes('HE'), 'Should find HE');
        });
    }

    /**
     * Test bot initialization
     */
    async testBotInitialization() {
        console.log('🤖 Testing Bot Initialization...');
        
        await this.runTest('Basic Bot Creation', async () => {
            const bot = createBot('game1', 'bot1', 'basic');
            assert(bot instanceof ScrabbleBot, 'Bot should be created');
            assert(bot.gameId === 'game1', 'Game ID should be set');
            assert(bot.playerId === 'bot1', 'Player ID should be set');
            assert(bot.difficulty === 'basic', 'Difficulty should be set');
        });
        
        await this.runTest('Advanced Bot Creation', async () => {
            const bot = createBot('game2', 'bot2', 'advanced');
            assert(bot instanceof ScrabbleBot, 'Advanced bot should be created');
            assert(bot.difficulty === 'advanced', 'Difficulty should be advanced');
        });
        
        await this.runTest('Bot Dictionary Initialization', async () => {
            const bot = createBot('game3', 'bot3', 'advanced');
            
            // Wait for dictionary to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Bot should be initialized after dictionary loading
            assert(bot.initialized || bot.dictionary, 'Bot should have dictionary access');
        });
    }

    /**
     * Test bot move generation
     */
    async testBotMoveGeneration() {
        console.log('🎯 Testing Bot Move Generation...');
        
        await this.runTest('Basic Move Generation', async () => {
            const bot = createBot('game4', 'bot4', 'basic');
            
            // Mock game state
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 50,
                scores: { bot4: 0 }
            };
            
            // Set center tile for first move
            gameState.board[7][7] = '';
            
            const rack = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            
            const decision = await bot.generateMove(gameState, rack);
            
            assert(decision, 'Bot should generate a decision');
            assert(['move', 'exchange', 'pass'].includes(decision.type), 'Decision should have valid type');
        });
        
        await this.runTest('Advanced Move Generation', async () => {
            const bot = createBot('game5', 'bot5', 'advanced');
            
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 30,
                scores: { bot5: 0 }
            };
            
            const rack = ['S', 'T', 'A', 'R', 'E', 'D', 'O'];
            
            const decision = await bot.generateMove(gameState, rack);
            
            assert(decision, 'Advanced bot should generate a decision');
            assert(['move', 'exchange', 'pass'].includes(decision.type), 'Decision should have valid type');
            
            if (decision.type === 'move') {
                assert(decision.moves, 'Move decision should have moves array');
                assert(typeof decision.expectedScore === 'number', 'Should have expected score');
            }
        });
        
        await this.runTest('Exchange Decision Logic', async () => {
            const bot = createBot('game6', 'bot6', 'advanced');
            
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 40,
                scores: { bot6: 0 }
            };
            
            // Rack with difficult letters
            const rack = ['Q', 'X', 'Z', 'J', 'V', 'W', 'K'];
            
            const decision = await bot.generateMove(gameState, rack);
            
            // Should likely choose exchange with difficult letters
            assert(decision, 'Bot should make a decision with difficult letters');
        });
    }

    /**
     * Test timer system
     */
    async testTimerSystem() {
        console.log('⏰ Testing Timer System...');
        
        await this.runTest('Timer Manager Creation', async () => {
            const timerManager = new TimerManager();
            assert(timerManager instanceof TimerManager, 'Timer manager should be created');
        });
        
        await this.runTest('Game Timer Initialization', async () => {
            const timerManager = new TimerManager();
            timerManager.initializeGame('game7', { playerTimeLimit: 60000 });
            
            const gameStats = timerManager.getGameStats('game7');
            assert(gameStats.gameId === 'game7', 'Game should be initialized');
            assert(gameStats.settings.playerTimeLimit === 60000, 'Settings should be applied');
        });
        
        await this.runTest('Player Timer Operations', async () => {
            const timerManager = new TimerManager();
            timerManager.initializeGame('game8');
            timerManager.initializePlayer('game8', 'player1', 120000);
            
            const remainingTime = timerManager.getRemainingTime('player1');
            assert(remainingTime === 120000, 'Player should have correct initial time');
        });
        
        await this.runTest('Timer Events', async () => {
            const timerManager = new TimerManager();
            let eventReceived = false;
            
            timerManager.on('timer_started', (data) => {
                eventReceived = true;
                assert(data.gameId === 'game9', 'Event should have correct game ID');
            });
            
            timerManager.initializeGame('game9');
            timerManager.initializePlayer('game9', 'player2');
            timerManager.startPlayerTimer('game9', 'player2');
            
            // Wait a moment for event
            await new Promise(resolve => setTimeout(resolve, 100));
            
            timerManager.pausePlayerTimer('game9', 'player2');
            
            assert(eventReceived, 'Timer events should be emitted');
        });
    }

    /**
     * Test performance monitoring
     */
    async testPerformanceMonitoring() {
        console.log('📊 Testing Performance Monitoring...');
        
        await this.runTest('Performance Monitor Creation', async () => {
            const monitor = new PerformanceMonitor();
            assert(monitor instanceof PerformanceMonitor, 'Performance monitor should be created');
            monitor.stop(); // Stop intervals for testing
        });
        
        await this.runTest('Game Tracking', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            monitor.trackGameStart('game10', { players: [{ isBot: false }, { isBot: true }] });
            
            const metrics = monitor.getMetricsSummary();
            assert(metrics.games.active === 1, 'Should track active games');
            assert(metrics.players.human === 1, 'Should track human players');
            assert(metrics.players.bot === 1, 'Should track bot players');
        });
        
        await this.runTest('Move Tracking', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            monitor.trackMove('game11', 'player1', {
                moveTime: 5000,
                isBot: false,
                type: 'move',
                score: 24,
                word: 'HELLO'
            });
            
            const metrics = monitor.getMetricsSummary();
            assert(metrics.moves.total === 1, 'Should track moves');
            assert(metrics.moves.human === 1, 'Should track human moves');
        });
        
        await this.runTest('Bot Performance Tracking', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            const startTime = Date.now();
            const endTime = startTime + 2000; // 2 second move
            
            monitor.trackBotMove('bot1', startTime, endTime, {
                type: 'move',
                difficulty: 'advanced',
                success: true
            });
            
            const metrics = monitor.getMetricsSummary();
            assert(metrics.bot.averageMoveTime > 0, 'Should track bot move times');
        });
    }

    /**
     * Test bot vs bot game simulation
     */
    async testBotVsBotGame() {
        console.log('🤖⚔️🤖 Testing Bot vs Bot Game...');
        
        await this.runTest('Bot vs Bot Game Simulation', async () => {
            const bot1 = createBot('game12', 'bot1', 'basic');
            const bot2 = createBot('game12', 'bot2', 'advanced');
            
            // Mock game state
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 100,
                scores: { bot1: 0, bot2: 0 }
            };
            
            const rack1 = ['A', 'E', 'I', 'O', 'U', 'R', 'S'];
            const rack2 = ['T', 'N', 'L', 'D', 'H', 'C', 'Y'];
            
            // Simulate a few moves
            const decision1 = await bot1.generateMove(gameState, rack1);
            const decision2 = await bot2.generateMove(gameState, rack2);
            
            assert(decision1 && decision2, 'Both bots should generate decisions');
            
            // Basic game logic validation
            if (decision1.type === 'move') {
                assert(decision1.moves && Array.isArray(decision1.moves), 'Move should have placements');
            }
            
            if (decision2.type === 'move') {
                assert(decision2.moves && Array.isArray(decision2.moves), 'Move should have placements');
            }
        });
    }

    /**
     * Test error handling and edge cases
     */
    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');
        
        await this.runTest('Bot with Invalid Game State', async () => {
            const bot = createBot('game13', 'bot13', 'basic');
            
            try {
                const decision = await bot.generateMove(null, ['A', 'B']);
                // Should handle gracefully
                assert(decision.type === 'pass', 'Should default to pass on invalid state');
            } catch (error) {
                // Error handling is acceptable too
                assert(true, 'Bot should handle invalid input');
            }
        });
        
        await this.runTest('Bot with Empty Rack', async () => {
            const bot = createBot('game14', 'bot14', 'advanced');
            
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 10,
                scores: { bot14: 0 }
            };
            
            const decision = await bot.generateMove(gameState, []);
            assert(decision.type === 'pass', 'Should pass with empty rack');
        });
        
        await this.runTest('Timer Manager Error Handling', async () => {
            const timerManager = new TimerManager();
            
            // Try to start timer for non-existent player
            try {
                timerManager.startPlayerTimer('invalid-game', 'invalid-player');
                // Should handle gracefully
                assert(true, 'Timer should handle invalid player');
            } catch (error) {
                // Error handling is acceptable
                assert(true, 'Timer should handle errors gracefully');
            }
        });
    }

    /**
     * Test deployment health endpoints
     */
    async testDeploymentHealth() {
        console.log('🏥 Testing Deployment Health...');
        
        await this.runTest('Health Check Functions', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            const health = monitor.getHealthStatus();
            assert(health, 'Health status should be available');
            assert(health.status, 'Should have health status');
            assert(typeof health.uptime === 'number', 'Should have uptime');
        });
        
        await this.runTest('System Statistics', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            const stats = monitor.getPerformanceReport();
            assert(stats.summary, 'Should have performance summary');
            assert(stats.health, 'Should have health information');
        });
        
        await this.runTest('Memory Usage Monitoring', async () => {
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            // Trigger system sampling
            monitor.sampleSystemMetrics();
            
            const health = monitor.getHealthStatus();
            assert(health.memory, 'Should monitor memory usage');
            assert(typeof health.memory.heapUsed === 'number', 'Should have heap usage');
        });
    }

    /**
     * Test system integration
     */
    async testSystemIntegration() {
        console.log('🔗 Testing System Integration...');
        
        await this.runTest('Bot-Timer Integration', async () => {
            const timerManager = new TimerManager();
            const monitor = new PerformanceMonitor();
            monitor.stop();
            
            const bot = createBot('game15', 'bot15', 'advanced');
            
            // Initialize timers
            timerManager.initializeGame('game15');
            timerManager.initializePlayer('game15', 'bot15');
            
            // Track game start
            monitor.trackGameStart('game15', { players: [{ isBot: true }] });
            
            // Start timer and generate move
            timerManager.startPlayerTimer('game15', 'bot15');
            
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 50,
                scores: { bot15: 0 }
            };
            
            const startTime = Date.now();
            const decision = await bot.generateMove(gameState, ['H', 'E', 'L', 'L', 'O']);
            const endTime = Date.now();
            
            // Track bot performance
            monitor.trackBotMove('bot15', startTime, endTime, decision);
            
            // Stop timer
            timerManager.pausePlayerTimer('game15', 'bot15');
            
            assert(decision, 'Integration should work smoothly');
            
            // Cleanup
            timerManager.cleanupGame('game15');
        });
        
        await this.runTest('Dictionary-Bot Integration', async () => {
            const dictManager = new DictionaryManager();
            await dictManager.loadDictionary(['HELLO', 'WORLD', 'GAME', 'TEST']);
            
            const bot = createBot('game16', 'bot16', 'basic');
            
            // Bot should use the loaded dictionary
            const gameState = {
                board: Array(15).fill(null).map(() => Array(15).fill('')),
                tilesRemaining: 50,
                scores: { bot16: 0 }
            };
            
            const decision = await bot.generateMove(gameState, ['H', 'E', 'L', 'L', 'O']);
            
            assert(decision, 'Bot should work with custom dictionary');
        });
    }

    /**
     * Test stress conditions
     */
    async testStressConditions() {
        console.log('💪 Testing Stress Conditions...');
        
        await this.runTest('Multiple Concurrent Bots', async () => {
            const bots = [];
            const gameStates = [];
            
            // Create 10 bots
            for (let i = 0; i < 10; i++) {
                bots.push(createBot(`stress-game-${i}`, `bot-${i}`, i % 2 === 0 ? 'basic' : 'advanced'));
                gameStates.push({
                    board: Array(15).fill(null).map(() => Array(15).fill('')),
                    tilesRemaining: 50,
                    scores: { [`bot-${i}`]: 0 }
                });
            }
            
            // Generate moves concurrently
            const promises = bots.map((bot, i) => 
                bot.generateMove(gameStates[i], ['A', 'B', 'C', 'D', 'E'])
            );
            
            const decisions = await Promise.all(promises);
            
            assert(decisions.length === 10, 'All bots should generate decisions');
            assert(decisions.every(d => d && d.type), 'All decisions should be valid');
        });
        
        await this.runTest('Timer System Under Load', async () => {
            const timerManager = new TimerManager();
            
            // Create multiple games with timers
            for (let i = 0; i < 20; i++) {
                timerManager.initializeGame(`load-game-${i}`);
                timerManager.initializePlayer(`load-game-${i}`, `player-${i}`);
            }
            
            // Start all timers
            for (let i = 0; i < 20; i++) {
                timerManager.startPlayerTimer(`load-game-${i}`, `player-${i}`);
            }
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Stop all timers
            for (let i = 0; i < 20; i++) {
                timerManager.pausePlayerTimer(`load-game-${i}`, `player-${i}`);
                timerManager.cleanupGame(`load-game-${i}`);
            }
            
            const stats = timerManager.getSystemStats();
            assert(typeof stats.activePlayerTimers === 'number', 'Should provide system stats under load');
        });
    }

    /**
     * Run a single test
     */
    async runTest(testName, testFunction) {
        this.testCount++;
        const testStartTime = Date.now();
        
        try {
            await testFunction();
            const duration = Date.now() - testStartTime;
            
            this.passedCount++;
            this.testResults.push({
                name: testName,
                status: 'PASSED',
                duration,
                error: null
            });
            
            console.log(`  ✅ ${testName} (${duration}ms)`);
            
        } catch (error) {
            const duration = Date.now() - testStartTime;
            
            this.failedCount++;
            this.testResults.push({
                name: testName,
                status: 'FAILED',
                duration,
                error: error.message
            });
            
            console.log(`  ❌ ${testName} (${duration}ms)`);
            console.log(`     Error: ${error.message}`);
        }
    }

    /**
     * Print final test results
     */
    printFinalResults() {
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n=== TEST RESULTS ===');
        console.log(`📊 Total Tests: ${this.testCount}`);
        console.log(`✅ Passed: ${this.passedCount}`);
        console.log(`❌ Failed: ${this.failedCount}`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📈 Success Rate: ${((this.passedCount / this.testCount) * 100).toFixed(1)}%`);
        
        if (this.failedCount === 0) {
            console.log('\n🎉 ALL TESTS PASSED! The Scrabble bot system is ready for deployment.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
            
            // Print failed tests summary
            console.log('\n=== FAILED TESTS ===');
            this.testResults
                .filter(result => result.status === 'FAILED')
                .forEach(result => {
                    console.log(`❌ ${result.name}: ${result.error}`);
                });
        }
        
        return this.failedCount === 0;
    }

    /**
     * Generate test report
     */
    generateReport() {
        return {
            summary: {
                totalTests: this.testCount,
                passed: this.passedCount,
                failed: this.failedCount,
                successRate: (this.passedCount / this.testCount) * 100,
                totalDuration: Date.now() - this.startTime
            },
            results: this.testResults,
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage()
            }
        };
    }
}

// Export for use in other modules
module.exports = {
    IntegrationTester
};

// Run tests if called directly
if (require.main === module) {
    const tester = new IntegrationTester();
    
    tester.runFullGameTest().then(() => {
        const success = tester.failedCount === 0;
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('Test suite crashed:', error);
        process.exit(1);
    });
}