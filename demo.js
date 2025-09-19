/**
 * Scrabble Bot Demo - Local Testing
 * This demonstrates the bot system functionality
 */

const { ScrabbleBot, createBot } = require('./bot-ai');
const { DictionaryManager } = require('./dictionary-trie');
const { TimerManager } = require('./timer-manager');
const { PerformanceMonitor } = require('./performance-monitor');

async function runDemo() {
    console.log('🎯 Scrabble Bot System Demo');
    console.log('================================\n');
    
    try {
        // Initialize dictionary
        console.log('📖 Loading dictionary...');
        const dictManager = new DictionaryManager();
        await dictManager.loadDictionary('./CSW24.txt').catch(() => {
            console.log('Using default dictionary (CSW24.txt not found)');
            return dictManager.loadDictionary([]);
        });
        
        // Create performance monitor
        console.log('📊 Starting performance monitor...');
        const monitor = new PerformanceMonitor();
        
        // Create timer manager
        console.log('⏰ Initializing timer system...');
        const timerManager = new TimerManager();
        
        // Create bots
        console.log('🤖 Creating bots...');
        const basicBot = createBot('demo-game', 'basic-bot', 'basic');
        const advancedBot = createBot('demo-game', 'advanced-bot', 'advanced');
        
        // Wait for bot initialization
        console.log('⏳ Waiting for bot initialization...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Setup game state
        const gameState = {
            board: Array(15).fill(null).map(() => Array(15).fill('')),
            tilesRemaining: 50,
            scores: { 'basic-bot': 0, 'advanced-bot': 0 }
        };
        
        // Setup timer for demo
        timerManager.initializeGame('demo-game');
        timerManager.initializePlayer('demo-game', 'basic-bot');
        timerManager.initializePlayer('demo-game', 'advanced-bot');
        
        console.log('\n🎮 Running Bot Demonstrations:');
        console.log('=====================================\n');
        
        // Test basic bot
        console.log('🔹 Testing Basic Bot (Stage 3):');
        const rack1 = ['S', 'C', 'R', 'A', 'B', 'B', 'L'];
        
        timerManager.startPlayerTimer('demo-game', 'basic-bot');
        const startTime1 = Date.now();
        
        const decision1 = await basicBot.generateMove(gameState, rack1);
        
        const endTime1 = Date.now();
        timerManager.pausePlayerTimer('demo-game', 'basic-bot');
        
        console.log(`   Decision: ${decision1.type}`);
        if (decision1.type === 'move') {
            console.log(`   Word: ${decision1.word || 'N/A'}`);
            console.log(`   Expected Score: ${decision1.expectedScore || 'N/A'}`);
        }
        console.log(`   Time taken: ${endTime1 - startTime1}ms`);
        
        // Track performance
        monitor.trackBotMove('basic-bot', startTime1, endTime1, decision1);
        
        console.log('\n🔸 Testing Advanced Bot (Stage 4):');
        const rack2 = ['Q', 'U', 'I', 'C', 'K', 'L', 'Y'];
        
        timerManager.startPlayerTimer('demo-game', 'advanced-bot');
        const startTime2 = Date.now();
        
        const decision2 = await advancedBot.generateMove(gameState, rack2);
        
        const endTime2 = Date.now();
        timerManager.pausePlayerTimer('demo-game', 'advanced-bot');
        
        console.log(`   Decision: ${decision2.type}`);
        if (decision2.type === 'move') {
            console.log(`   Word: ${decision2.word || 'N/A'}`);
            console.log(`   Expected Score: ${decision2.expectedScore || 'N/A'}`);
            if (decision2.strategicScore !== undefined) {
                console.log(`   Strategic Score: ${decision2.strategicScore}`);
            }
        }
        console.log(`   Time taken: ${endTime2 - startTime2}ms`);
        
        // Track performance
        monitor.trackBotMove('advanced-bot', startTime2, endTime2, decision2);
        
        // Show performance stats
        console.log('\n📊 Performance Summary:');
        console.log('========================');
        const stats = monitor.getMetricsSummary();
        console.log(`Bot moves: ${stats.bot.averageMoveTime.toFixed(0)}ms average`);
        console.log(`Success rate: ${(stats.bot.successRate * 100).toFixed(1)}%`);
        
        // Show system health
        console.log('\n🏥 System Health:');
        console.log('==================');
        const health = monitor.getHealthStatus();
        console.log(`Status: ${health.status}`);
        console.log(`Memory usage: ${(health.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`);
        console.log(`Uptime: ${health.uptime.toFixed(1)} seconds`);
        
        console.log('\n✅ Demo completed successfully!');
        console.log('🎯 The Scrabble bot system is working correctly.');
        
        // Cleanup
        monitor.stop();
        timerManager.emergencyStop();
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run demo if called directly
if (require.main === module) {
    runDemo().then(() => {
        console.log('\n👋 Demo finished. You can now integrate the bot system into your Scrabble game!');
        process.exit(0);
    }).catch(error => {
        console.error('Demo crashed:', error);
        process.exit(1);
    });
}

module.exports = { runDemo };