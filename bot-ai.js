/**
 * Advanced Scrabble Bot AI Implementation
 * Supports both Stage 3 (Basic) and Stage 4 (Advanced) difficulty levels
 */

const { DictionaryManager } = require('./dictionary-trie');

// Letter values in Scrabble
const LETTER_VALUES = {
    'A': 1, 'E': 1, 'I': 1, 'O': 1, 'U': 1, 'L': 1, 'N': 1, 'S': 1, 'T': 1, 'R': 1,
    'D': 2, 'G': 2,
    'B': 3, 'C': 3, 'M': 3, 'P': 3,
    'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
    'K': 5,
    'J': 8, 'X': 8,
    'Q': 10, 'Z': 10,
    '*': 0  // Blank tile
};

// Premium square multipliers
const PREMIUM_SQUARES = {
    TW: 'TRIPLE_WORD',    // Triple Word Score
    DW: 'DOUBLE_WORD',    // Double Word Score
    TL: 'TRIPLE_LETTER',  // Triple Letter Score
    DL: 'DOUBLE_LETTER'   // Double Letter Score
};

// Board layout with premium squares (15x15)
const BOARD_LAYOUT = [
    ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
    ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
    ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
    ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
    ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
    ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
    ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
    ['TW', '', '', 'DL', '', '', '', '*', '', '', '', 'DL', '', '', 'TW'],
    ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
    ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
    ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
    ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
    ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
    ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
    ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW']
];

/**
 * Base Scrabble Bot Class
 */
class ScrabbleBot {
    constructor(gameId, playerId, difficulty = 'advanced') {
        this.gameId = gameId;
        this.playerId = playerId;
        this.difficulty = difficulty;
        this.dictionary = null;
        this.moveCalculator = new MoveCalculator();
        this.evaluator = new PositionEvaluator();
        this.initialized = false;
        
        this.initializeDictionary();
    }

    /**
     * Initialize the dictionary for the bot
     */
    async initializeDictionary() {
        try {
            const dictionaryManager = new DictionaryManager();
            await dictionaryManager.loadDictionary('./CSW24.txt');
            this.dictionary = dictionaryManager.getDictionary();
            this.initialized = true;
            console.log(`Bot ${this.playerId} initialized with ${this.difficulty} difficulty`);
        } catch (error) {
            console.error('Failed to initialize bot dictionary:', error);
            // Fallback to default words
            const dictionaryManager = new DictionaryManager();
            await dictionaryManager.loadDictionary([]);
            this.dictionary = dictionaryManager.getDictionary();
            this.initialized = true;
        }
    }

    /**
     * Generate a move for the bot
     * @param {Object} gameState - Current game state
     * @param {string[]} rack - Bot's current tiles
     * @returns {Object} - Move decision
     */
    async generateMove(gameState, rack) {
        if (!this.initialized) {
            await this.initializeDictionary();
        }

        const startTime = Date.now();
        let decision;

        try {
            if (this.difficulty === 'basic') {
                decision = await this.generateBasicMove(gameState, rack);
            } else {
                decision = await this.generateAdvancedMove(gameState, rack);
            }

            const moveTime = Date.now() - startTime;
            console.log(`Bot ${this.playerId} generated move in ${moveTime}ms`);
            
            return decision;
        } catch (error) {
            console.error('Error generating bot move:', error);
            return { type: 'pass' };
        }
    }

    /**
     * Generate basic move (Stage 3)
     * @param {Object} gameState - Current game state
     * @param {string[]} rack - Bot's tiles
     * @returns {Object} - Move decision
     */
    async generateBasicMove(gameState, rack) {
        const timeLimit = 30000; // 30 seconds
        const startTime = Date.now();
        
        // Find all possible moves
        const possibleMoves = this.moveCalculator.findAllValidMoves(
            gameState.board, 
            rack, 
            this.dictionary
        );

        if (possibleMoves.length === 0) {
            // Consider exchange if no moves available
            if (rack.length >= 2) {
                const tilesToExchange = this.selectTilesToExchange(rack);
                return {
                    type: 'exchange',
                    tiles: tilesToExchange
                };
            }
            return { type: 'pass' };
        }

        // Select best scoring move
        possibleMoves.sort((a, b) => b.score - a.score);
        const bestMove = possibleMoves[0];

        return {
            type: 'move',
            moves: bestMove.placements,
            expectedScore: bestMove.score,
            word: bestMove.word
        };
    }

    /**
     * Generate advanced move (Stage 4)
     * @param {Object} gameState - Current game state
     * @param {string[]} rack - Bot's tiles
     * @returns {Object} - Move decision
     */
    async generateAdvancedMove(gameState, rack) {
        const possibleMoves = this.moveCalculator.findAllValidMoves(
            gameState.board, 
            rack, 
            this.dictionary
        );

        if (possibleMoves.length === 0) {
            return this.considerExchange(rack, gameState);
        }

        // Evaluate each move strategically
        const evaluatedMoves = possibleMoves.map(move => ({
            ...move,
            strategicScore: this.evaluateMove(move, gameState, rack)
        }));

        // Sort by strategic score
        evaluatedMoves.sort((a, b) => b.strategicScore - a.strategicScore);
        
        const bestMove = evaluatedMoves[0];

        // Consider exchange if best move score is too low
        if (bestMove.strategicScore < this.getExchangeThreshold(gameState)) {
            return this.considerExchange(rack, gameState);
        }

        return {
            type: 'move',
            moves: bestMove.placements,
            expectedScore: bestMove.score,
            strategicScore: bestMove.strategicScore,
            word: bestMove.word
        };
    }

    /**
     * Evaluate a move strategically
     * @param {Object} move - Move to evaluate
     * @param {Object} gameState - Current game state
     * @param {string[]} rack - Current rack
     * @returns {number} - Strategic score
     */
    evaluateMove(move, gameState, rack) {
        let score = move.score;

        // Strategic adjustments
        score += this.evaluateRackLeave(rack, move.tilesUsed);
        score += this.evaluateBoardControl(move, gameState.board);
        score += this.evaluateDefensiveValue(move, gameState);
        score += this.evaluateEndgamePosition(move, gameState);
        score += this.evaluateWordLength(move);
        
        return score;
    }

    /**
     * Evaluate rack leave (remaining tiles after move)
     * @param {string[]} rack - Current rack
     * @param {string[]} tilesUsed - Tiles used in move
     * @returns {number} - Leave evaluation score
     */
    evaluateRackLeave(rack, tilesUsed) {
        const remainingTiles = [...rack];
        
        // Remove used tiles
        for (const tile of tilesUsed) {
            const index = remainingTiles.indexOf(tile);
            if (index > -1) {
                remainingTiles.splice(index, 1);
            }
        }

        let leaveScore = 0;
        
        // Prefer keeping vowels and common consonants
        const vowels = remainingTiles.filter(tile => 'AEIOU'.includes(tile)).length;
        const consonants = remainingTiles.filter(tile => !'AEIOU'.includes(tile) && tile !== '*').length;
        
        // Optimal vowel/consonant ratio
        if (remainingTiles.length > 0) {
            const vowelRatio = vowels / remainingTiles.length;
            if (vowelRatio >= 0.3 && vowelRatio <= 0.5) {
                leaveScore += 5;
            }
        }

        // Penalty for keeping high-value tiles
        for (const tile of remainingTiles) {
            if (LETTER_VALUES[tile] > 4) {
                leaveScore -= 2;
            }
        }

        // Bonus for keeping 'S' or blank tiles
        leaveScore += remainingTiles.filter(tile => tile === 'S' || tile === '*').length * 3;

        return leaveScore;
    }

    /**
     * Evaluate board control aspects
     * @param {Object} move - Move to evaluate
     * @param {Array} board - Current board state
     * @returns {number} - Board control score
     */
    evaluateBoardControl(move, board) {
        let controlScore = 0;

        // Bonus for playing near center
        const centerDistance = this.getDistanceFromCenter(move.placements[0]);
        controlScore += Math.max(0, 7 - centerDistance);

        // Bonus for creating multiple scoring opportunities
        const hookOpportunities = this.countHookOpportunities(move, board);
        controlScore += hookOpportunities * 2;

        return controlScore;
    }

    /**
     * Evaluate defensive value of move
     * @param {Object} move - Move to evaluate
     * @param {Object} gameState - Current game state
     * @returns {number} - Defensive score
     */
    evaluateDefensiveValue(move, gameState) {
        let defensiveScore = 0;

        // Bonus for blocking premium squares
        for (const placement of move.placements) {
            const { row, col } = placement;
            const premium = BOARD_LAYOUT[row][col];
            if (premium === 'TW' || premium === 'DW') {
                defensiveScore += 5;
            }
        }

        return defensiveScore;
    }

    /**
     * Evaluate endgame positioning
     * @param {Object} move - Move to evaluate
     * @param {Object} gameState - Current game state
     * @returns {number} - Endgame score
     */
    evaluateEndgamePosition(move, gameState) {
        const tilesRemaining = gameState.tilesRemaining || 50;
        
        if (tilesRemaining < 20) {
            // Endgame: prioritize using high-value tiles
            let endgameScore = 0;
            for (const tile of move.tilesUsed) {
                endgameScore += LETTER_VALUES[tile];
            }
            return endgameScore * 0.5;
        }
        
        return 0;
    }

    /**
     * Evaluate word length bonus
     * @param {Object} move - Move to evaluate
     * @returns {number} - Length bonus
     */
    evaluateWordLength(move) {
        const length = move.word.length;
        if (length >= 7) return 15; // Bingo bonus consideration
        if (length >= 5) return 3;
        return 0;
    }

    /**
     * Consider tile exchange
     * @param {string[]} rack - Current rack
     * @param {Object} gameState - Current game state
     * @returns {Object} - Exchange decision
     */
    considerExchange(rack, gameState) {
        const tilesRemaining = gameState.tilesRemaining || 50;
        
        // Don't exchange if few tiles left
        if (tilesRemaining < 7) {
            return { type: 'pass' };
        }

        const tilesToExchange = this.selectTilesToExchange(rack);
        
        if (tilesToExchange.length === 0) {
            return { type: 'pass' };
        }

        return {
            type: 'exchange',
            tiles: tilesToExchange
        };
    }

    /**
     * Select tiles to exchange
     * @param {string[]} rack - Current rack
     * @returns {string[]} - Tiles to exchange
     */
    selectTilesToExchange(rack) {
        const tilesToExchange = [];
        
        // Exchange high-value tiles that are hard to use
        const problemTiles = rack.filter(tile => 
            LETTER_VALUES[tile] >= 8 || 
            (tile === 'Q' && !rack.includes('U'))
        );
        
        tilesToExchange.push(...problemTiles);

        // Exchange duplicates of uncommon letters
        const letterCounts = {};
        rack.forEach(tile => {
            letterCounts[tile] = (letterCounts[tile] || 0) + 1;
        });

        for (const [letter, count] of Object.entries(letterCounts)) {
            if (count > 2 && !'AEIOU'.includes(letter)) {
                tilesToExchange.push(letter);
            }
        }

        return tilesToExchange.slice(0, Math.min(7, rack.length));
    }

    /**
     * Get exchange threshold based on game state
     * @param {Object} gameState - Current game state
     * @returns {number} - Minimum score to avoid exchange
     */
    getExchangeThreshold(gameState) {
        const tilesRemaining = gameState.tilesRemaining || 50;
        
        if (tilesRemaining > 40) return 15;
        if (tilesRemaining > 20) return 10;
        return 5;
    }

    /**
     * Get distance from center of board
     * @param {Object} placement - Tile placement
     * @returns {number} - Distance from center
     */
    getDistanceFromCenter(placement) {
        const centerRow = 7, centerCol = 7;
        return Math.abs(placement.row - centerRow) + Math.abs(placement.col - centerCol);
    }

    /**
     * Count hook opportunities created by move
     * @param {Object} move - Move to evaluate
     * @param {Array} board - Current board
     * @returns {number} - Number of hook opportunities
     */
    countHookOpportunities(move, board) {
        // Implementation would count adjacent empty spaces that could form words
        // Simplified version returns 0-3 based on move position
        return Math.min(3, move.placements.length);
    }
}

/**
 * Move Calculator - Generates all possible moves
 */
class MoveCalculator {
    /**
     * Find all valid moves on the board
     * @param {Array} board - Current board state
     * @param {string[]} rack - Available tiles
     * @param {Object} dictionary - Dictionary instance
     * @returns {Array} - Array of possible moves
     */
    findAllValidMoves(board, rack, dictionary) {
        const moves = [];
        
        if (!dictionary || !dictionary.loaded) {
            return moves;
        }

        // Find anchor points (empty squares adjacent to existing tiles)
        const anchors = this.findAnchorPoints(board);
        
        if (anchors.length === 0) {
            // First move must go through center
            anchors.push({ row: 7, col: 7, isCenter: true });
        }

        // Generate moves for each anchor point
        for (const anchor of anchors) {
            // Horizontal moves
            moves.push(...this.generateMovesFromAnchor(board, rack, dictionary, anchor, 'horizontal'));
            // Vertical moves
            moves.push(...this.generateMovesFromAnchor(board, rack, dictionary, anchor, 'vertical'));
        }

        return moves;
    }

    /**
     * Find anchor points on the board
     * @param {Array} board - Current board state
     * @returns {Array} - Array of anchor points
     */
    findAnchorPoints(board) {
        const anchors = [];
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] === '' || board[row][col] === null) {
                    // Check if adjacent to existing tile
                    if (this.hasAdjacentTile(board, row, col)) {
                        anchors.push({ row, col });
                    }
                }
            }
        }
        
        return anchors;
    }

    /**
     * Check if position has adjacent tiles
     * @param {Array} board - Board state
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @returns {boolean} - True if has adjacent tile
     */
    hasAdjacentTile(board, row, col) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
                if (board[newRow][newCol] && board[newRow][newCol] !== '') {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Generate moves from an anchor point
     * @param {Array} board - Current board
     * @param {string[]} rack - Available tiles
     * @param {Object} dictionary - Dictionary instance
     * @param {Object} anchor - Anchor point
     * @param {string} direction - 'horizontal' or 'vertical'
     * @returns {Array} - Generated moves
     */
    generateMovesFromAnchor(board, rack, dictionary, anchor, direction) {
        const moves = [];
        
        // Generate words using available rack tiles
        const words = dictionary.findWords(rack.join(''), 2, 7);
        
        for (const word of words.slice(0, 50)) { // Limit to top 50 words for performance
            const move = this.tryPlaceWord(board, word, anchor, direction, rack);
            if (move && this.isValidMove(board, move, dictionary)) {
                moves.push(move);
            }
        }
        
        return moves;
    }

    /**
     * Try to place a word at anchor point
     * @param {Array} board - Current board
     * @param {string} word - Word to place
     * @param {Object} anchor - Anchor point
     * @param {string} direction - Direction to place
     * @param {string[]} rack - Available tiles
     * @returns {Object|null} - Move object or null
     */
    tryPlaceWord(board, word, anchor, direction, rack) {
        const isHorizontal = direction === 'horizontal';
        const placements = [];
        const tilesUsed = [];
        let score = 0;
        let wordMultiplier = 1;
        
        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const row = isHorizontal ? anchor.row : anchor.row + i;
            const col = isHorizontal ? anchor.col + i : anchor.col;
            
            // Check bounds
            if (row < 0 || row >= 15 || col < 0 || col >= 15) {
                return null;
            }
            
            const existingTile = board[row][col];
            
            if (existingTile && existingTile !== '') {
                // Tile already exists, must match
                if (existingTile !== letter) {
                    return null;
                }
            } else {
                // Need to place new tile
                if (!rack.includes(letter)) {
                    return null;
                }
                
                placements.push({ row, col, letter });
                tilesUsed.push(letter);
                
                // Calculate score for this tile
                let tileScore = LETTER_VALUES[letter] || 1;
                const premium = BOARD_LAYOUT[row][col];
                
                if (premium === 'DL') tileScore *= 2;
                else if (premium === 'TL') tileScore *= 3;
                else if (premium === 'DW') wordMultiplier *= 2;
                else if (premium === 'TW') wordMultiplier *= 3;
                
                score += tileScore;
            }
        }
        
        if (placements.length === 0) {
            return null; // No new tiles placed
        }
        
        score *= wordMultiplier;
        
        // Add bingo bonus if using all 7 tiles
        if (tilesUsed.length === 7) {
            score += 50;
        }
        
        return {
            placements,
            tilesUsed,
            score,
            word,
            direction,
            anchor
        };
    }

    /**
     * Validate if move is legal
     * @param {Array} board - Current board
     * @param {Object} move - Move to validate
     * @param {Object} dictionary - Dictionary instance
     * @returns {boolean} - True if valid
     */
    isValidMove(board, move, dictionary) {
        // Check if main word is valid
        if (!dictionary.isValidWord(move.word)) {
            return false;
        }
        
        // Check cross words (simplified validation)
        for (const placement of move.placements) {
            const crossWords = this.getCrossWords(board, placement, move.direction);
            for (const crossWord of crossWords) {
                if (crossWord.length > 1 && !dictionary.isValidWord(crossWord)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Get cross words formed by placement
     * @param {Array} board - Current board
     * @param {Object} placement - Tile placement
     * @param {string} mainDirection - Main word direction
     * @returns {Array} - Cross words
     */
    getCrossWords(board, placement, mainDirection) {
        const crossWords = [];
        const { row, col } = placement;
        
        // Check perpendicular direction
        const isMainHorizontal = mainDirection === 'horizontal';
        
        if (isMainHorizontal) {
            // Check vertical cross word
            const word = this.getVerticalWord(board, row, col);
            if (word.length > 1) {
                crossWords.push(word);
            }
        } else {
            // Check horizontal cross word
            const word = this.getHorizontalWord(board, row, col);
            if (word.length > 1) {
                crossWords.push(word);
            }
        }
        
        return crossWords;
    }

    /**
     * Get vertical word at position
     * @param {Array} board - Board state
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @returns {string} - Vertical word
     */
    getVerticalWord(board, row, col) {
        let word = '';
        let startRow = row;
        
        // Find start of word
        while (startRow > 0 && board[startRow - 1][col]) {
            startRow--;
        }
        
        // Build word
        let currentRow = startRow;
        while (currentRow < 15 && board[currentRow][col]) {
            word += board[currentRow][col];
            currentRow++;
        }
        
        return word;
    }

    /**
     * Get horizontal word at position
     * @param {Array} board - Board state
     * @param {number} row - Row position
     * @param {number} col - Column position
     * @returns {string} - Horizontal word
     */
    getHorizontalWord(board, row, col) {
        let word = '';
        let startCol = col;
        
        // Find start of word
        while (startCol > 0 && board[row][startCol - 1]) {
            startCol--;
        }
        
        // Build word
        let currentCol = startCol;
        while (currentCol < 15 && board[row][currentCol]) {
            word += board[row][currentCol];
            currentCol++;
        }
        
        return word;
    }
}

/**
 * Position Evaluator - Advanced position evaluation
 */
class PositionEvaluator {
    /**
     * Evaluate board position
     * @param {Array} board - Current board
     * @param {Object} gameState - Game state
     * @returns {number} - Position score
     */
    evaluatePosition(board, gameState) {
        let score = 0;
        
        // Evaluate board control
        score += this.evaluateBoardControl(board);
        
        // Evaluate premium square usage
        score += this.evaluatePremiumUsage(board);
        
        return score;
    }

    /**
     * Evaluate board control
     * @param {Array} board - Board state
     * @returns {number} - Control score
     */
    evaluateBoardControl(board) {
        let controlScore = 0;
        
        // Count tiles near center
        const centerRegion = this.getCenterRegion(board);
        controlScore += centerRegion * 2;
        
        return controlScore;
    }

    /**
     * Get tiles in center region
     * @param {Array} board - Board state
     * @returns {number} - Tile count in center
     */
    getCenterRegion(board) {
        let count = 0;
        
        for (let row = 5; row <= 9; row++) {
            for (let col = 5; col <= 9; col++) {
                if (board[row][col] && board[row][col] !== '') {
                    count++;
                }
            }
        }
        
        return count;
    }

    /**
     * Evaluate premium square usage
     * @param {Array} board - Board state
     * @returns {number} - Premium usage score
     */
    evaluatePremiumUsage(board) {
        let usageScore = 0;
        
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] && board[row][col] !== '') {
                    const premium = BOARD_LAYOUT[row][col];
                    if (premium === 'TW') usageScore += 5;
                    else if (premium === 'DW') usageScore += 3;
                    else if (premium === 'TL') usageScore += 2;
                    else if (premium === 'DL') usageScore += 1;
                }
            }
        }
        
        return usageScore;
    }
}

// Factory function to create bots
function createBot(gameId, playerId, difficulty = 'advanced') {
    return new ScrabbleBot(gameId, playerId, difficulty);
}

// Bot management
const activeBots = new Map();

function getBotInstance(botId) {
    return activeBots.get(botId);
}

function registerBot(botId, bot) {
    activeBots.set(botId, bot);
}

function removeBotInstance(botId) {
    activeBots.delete(botId);
}

module.exports = {
    ScrabbleBot,
    MoveCalculator,
    PositionEvaluator,
    createBot,
    getBotInstance,
    registerBot,
    removeBotInstance,
    LETTER_VALUES,
    PREMIUM_SQUARES,
    BOARD_LAYOUT
};