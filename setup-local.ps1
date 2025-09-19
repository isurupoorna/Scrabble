# Scrabble Bot Local Setup Script for Windows
# This script sets up and runs the Scrabble bot system locally

Write-Host "🎯 Scrabble Bot Local Setup" -ForegroundColor Green
Write-Host "Setting up the advanced Scrabble bot system locally..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please ensure npm is installed with Node.js" -ForegroundColor Red
    exit 1
}

# Create package.json if it doesn't exist
if (!(Test-Path "package.json")) {
    Write-Host "📦 Creating package.json..." -ForegroundColor Yellow
    
    $packageJson = @{
        name = "scrabble-bot-system"
        version = "1.0.0"
        description = "Advanced Scrabble Bot AI System with Strategic Gameplay"
        main = "bot-ai.js"
        scripts = @{
            start = "node demo.js"
            test = "node integration-tests.js"
            "test-bot" = "node test-bot-demo.js"
            "performance-test" = "node performance-test.js"
        }
        keywords = @("scrabble", "bot", "ai", "game", "word-game")
        author = "Scrabble Bot Team"
        license = "MIT"
        dependencies = @{
            events = "^3.3.0"
        }
        devDependencies = @{}
        engines = @{
            node = ">=14.0.0"
        }
    } | ConvertTo-Json -Depth 10
    
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    Write-Host "✅ package.json created" -ForegroundColor Green
}

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

# Verify CSW24.txt dictionary exists
if (!(Test-Path "CSW24.txt")) {
    Write-Host "⚠️  CSW24.txt dictionary not found. Using default word list." -ForegroundColor Yellow
    Write-Host "   For full functionality, place CSW24.txt in the current directory." -ForegroundColor Yellow
} else {
    $dictSize = (Get-Item "CSW24.txt").Length
    Write-Host "✅ Dictionary file found: CSW24.txt ($([math]::Round($dictSize/1024, 2)) KB)" -ForegroundColor Green
}

# Create a simple demo file
Write-Host "🎮 Creating demo file..." -ForegroundColor Yellow

$demoContent = @'
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
'@

$demoContent | Out-File -FilePath "demo.js" -Encoding UTF8
Write-Host "✅ Demo file created: demo.js" -ForegroundColor Green

# Create a performance test file
$perfTestContent = @'
/**
 * Performance Test for Scrabble Bot System
 */

const { createBot } = require('./bot-ai');
const { PerformanceMonitor } = require('./performance-monitor');

async function performanceTest() {
    console.log('🚀 Scrabble Bot Performance Test');
    console.log('================================\n');
    
    const monitor = new PerformanceMonitor();
    const testDuration = 30000; // 30 seconds
    const startTime = Date.now();
    let moveCount = 0;
    
    console.log('Creating bots and running performance test for 30 seconds...');
    
    const bots = [
        createBot('perf-test', 'bot-1', 'basic'),
        createBot('perf-test', 'bot-2', 'advanced'),
        createBot('perf-test', 'bot-3', 'basic'),
        createBot('perf-test', 'bot-4', 'advanced')
    ];
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const gameState = {
        board: Array(15).fill(null).map(() => Array(15).fill('')),
        tilesRemaining: 50,
        scores: {}
    };
    
    const testRacks = [
        ['A', 'E', 'I', 'O', 'U', 'R', 'S'],
        ['T', 'N', 'L', 'D', 'H', 'C', 'Y'],
        ['B', 'G', 'M', 'P', 'F', 'W', 'K'],
        ['Q', 'X', 'Z', 'J', 'V', 'Q', 'U']
    ];
    
    while (Date.now() - startTime < testDuration) {
        const promises = bots.map(async (bot, i) => {
            const moveStart = Date.now();
            const decision = await bot.generateMove(gameState, testRacks[i % testRacks.length]);
            const moveEnd = Date.now();
            
            monitor.trackBotMove(bot.playerId, moveStart, moveEnd, decision);
            return decision;
        });
        
        await Promise.all(promises);
        moveCount += bots.length;
        
        if (moveCount % 20 === 0) {
            process.stdout.write('.');
        }
    }
    
    console.log('\n\n📊 Performance Results:');
    console.log('======================');
    
    const stats = monitor.getMetricsSummary();
    const health = monitor.getHealthStatus();
    
    console.log(`Total moves generated: ${moveCount}`);
    console.log(`Average move time: ${stats.bot.averageMoveTime.toFixed(0)}ms`);
    console.log(`Success rate: ${(stats.bot.successRate * 100).toFixed(1)}%`);
    console.log(`Moves per second: ${(moveCount / 30).toFixed(1)}`);
    console.log(`Memory usage: ${(health.memory.heapUsed / 1024 / 1024).toFixed(1)} MB`);
    console.log(`System status: ${health.status}`);
    
    monitor.stop();
    
    console.log('\n✅ Performance test completed!');
}

if (require.main === module) {
    performanceTest().catch(console.error);
}
'@

$perfTestContent | Out-File -FilePath "performance-test.js" -Encoding UTF8
Write-Host "✅ Performance test created: performance-test.js" -ForegroundColor Green

Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Available Commands:" -ForegroundColor Cyan
Write-Host "  npm start          - Run the main demo" -ForegroundColor White
Write-Host "  npm test           - Run integration tests" -ForegroundColor White
Write-Host "  npm run performance-test - Run performance tests" -ForegroundColor White

Write-Host "`n🚀 To get started:" -ForegroundColor Yellow
Write-Host "  1. Run: npm start" -ForegroundColor White
Write-Host "  2. Check the demo output" -ForegroundColor White
Write-Host "  3. Run tests with: npm test" -ForegroundColor White

Write-Host "`n✨ Your Scrabble bot system is ready!" -ForegroundColor Green