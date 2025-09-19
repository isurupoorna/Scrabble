/**
 * Dictionary and Trie Implementation for Scrabble Bot
 * Optimized for fast word validation and move generation
 */

class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.wordCount = 0;
    }
}

class TrieDict {
    constructor() {
        this.root = new TrieNode();
        this.wordCount = 0;
        this.loaded = false;
    }

    /**
     * Load dictionary words into the Trie structure
     * @param {string[]} wordsArray - Array of valid words
     */
    loadDictionary(wordsArray) {
        console.log(`Loading ${wordsArray.length} words into dictionary...`);
        const startTime = Date.now();

        for (const word of wordsArray) {
            this.insert(word.toUpperCase());
        }

        this.loaded = true;
        const loadTime = Date.now() - startTime;
        console.log(`Dictionary loaded in ${loadTime}ms with ${this.wordCount} words`);
    }

    /**
     * Insert a word into the Trie
     * @param {string} word - Word to insert
     */
    insert(word) {
        let current = this.root;
        
        for (const char of word) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char);
        }
        
        if (!current.isEndOfWord) {
            current.isEndOfWord = true;
            this.wordCount++;
        }
    }

    /**
     * Check if a word is valid in the dictionary
     * @param {string} word - Word to validate
     * @returns {boolean} - True if word exists
     */
    isValidWord(word) {
        if (!this.loaded || !word) return false;
        
        let current = this.root;
        const upperWord = word.toUpperCase();
        
        for (const char of upperWord) {
            if (!current.children.has(char)) {
                return false;
            }
            current = current.children.get(char);
        }
        
        return current.isEndOfWord;
    }

    /**
     * Check if a prefix exists in the dictionary
     * @param {string} prefix - Prefix to check
     * @returns {boolean} - True if prefix exists
     */
    hasPrefix(prefix) {
        if (!this.loaded || !prefix) return false;
        
        let current = this.root;
        const upperPrefix = prefix.toUpperCase();
        
        for (const char of upperPrefix) {
            if (!current.children.has(char)) {
                return false;
            }
            current = current.children.get(char);
        }
        
        return true;
    }

    /**
     * Find all valid words that can be formed from given letters
     * @param {string} letters - Available letters
     * @param {number} minLength - Minimum word length
     * @param {number} maxLength - Maximum word length
     * @returns {string[]} - Array of valid words
     */
    findWords(letters, minLength = 2, maxLength = 15) {
        if (!this.loaded) return [];
        
        const words = [];
        const letterCount = this.countLetters(letters.toUpperCase());
        
        this.searchWords(this.root, '', letterCount, words, minLength, maxLength);
        
        return words.sort((a, b) => b.length - a.length || a.localeCompare(b));
    }

    /**
     * Find words that can be formed with specific board constraints
     * @param {string} letters - Available letters
     * @param {string} prefix - Required prefix
     * @param {string} suffix - Required suffix
     * @param {number} maxLength - Maximum word length
     * @returns {string[]} - Array of valid words
     */
    findWordsWithConstraints(letters, prefix = '', suffix = '', maxLength = 15) {
        if (!this.loaded) return [];
        
        const words = [];
        const letterCount = this.countLetters(letters.toUpperCase());
        
        // Account for prefix and suffix letters
        const prefixCount = this.countLetters(prefix.toUpperCase());
        const suffixCount = this.countLetters(suffix.toUpperCase());
        
        // Subtract used letters from available letters
        for (const [letter, count] of prefixCount) {
            if (letterCount.has(letter)) {
                letterCount.set(letter, letterCount.get(letter) - count);
                if (letterCount.get(letter) <= 0) {
                    letterCount.delete(letter);
                }
            }
        }
        
        for (const [letter, count] of suffixCount) {
            if (letterCount.has(letter)) {
                letterCount.set(letter, letterCount.get(letter) - count);
                if (letterCount.get(letter) <= 0) {
                    letterCount.delete(letter);
                }
            }
        }
        
        // Find node for prefix
        let prefixNode = this.root;
        for (const char of prefix.toUpperCase()) {
            if (!prefixNode.children.has(char)) {
                return words; // No words with this prefix
            }
            prefixNode = prefixNode.children.get(char);
        }
        
        // Search from prefix node
        this.searchWordsWithSuffix(
            prefixNode, 
            prefix.toUpperCase(), 
            letterCount, 
            words, 
            suffix.toUpperCase(),
            maxLength
        );
        
        return words.sort((a, b) => b.length - a.length || a.localeCompare(b));
    }

    /**
     * Count occurrences of each letter
     * @param {string} letters - Letters to count
     * @returns {Map} - Map of letter counts
     */
    countLetters(letters) {
        const count = new Map();
        for (const letter of letters) {
            count.set(letter, (count.get(letter) || 0) + 1);
        }
        return count;
    }

    /**
     * Recursive search for words in Trie
     * @param {TrieNode} node - Current node
     * @param {string} currentWord - Word being formed
     * @param {Map} availableLetters - Available letters with counts
     * @param {string[]} words - Result array
     * @param {number} minLength - Minimum word length
     * @param {number} maxLength - Maximum word length
     */
    searchWords(node, currentWord, availableLetters, words, minLength, maxLength) {
        if (currentWord.length > maxLength) return;
        
        if (node.isEndOfWord && currentWord.length >= minLength) {
            words.push(currentWord);
        }
        
        for (const [letter, childNode] of node.children) {
            if (availableLetters.has(letter) && availableLetters.get(letter) > 0) {
                // Use this letter
                availableLetters.set(letter, availableLetters.get(letter) - 1);
                if (availableLetters.get(letter) === 0) {
                    availableLetters.delete(letter);
                }
                
                this.searchWords(childNode, currentWord + letter, availableLetters, words, minLength, maxLength);
                
                // Backtrack
                availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
            }
        }
    }

    /**
     * Search for words with required suffix
     * @param {TrieNode} node - Current node
     * @param {string} currentWord - Word being formed
     * @param {Map} availableLetters - Available letters
     * @param {string[]} words - Result array
     * @param {string} requiredSuffix - Required suffix
     * @param {number} maxLength - Maximum word length
     */
    searchWordsWithSuffix(node, currentWord, availableLetters, words, requiredSuffix, maxLength) {
        if (currentWord.length > maxLength) return;
        
        if (node.isEndOfWord && currentWord.endsWith(requiredSuffix)) {
            words.push(currentWord);
        }
        
        for (const [letter, childNode] of node.children) {
            if (availableLetters.has(letter) && availableLetters.get(letter) > 0) {
                // Use this letter
                availableLetters.set(letter, availableLetters.get(letter) - 1);
                if (availableLetters.get(letter) === 0) {
                    availableLetters.delete(letter);
                }
                
                this.searchWordsWithSuffix(
                    childNode, 
                    currentWord + letter, 
                    availableLetters, 
                    words, 
                    requiredSuffix,
                    maxLength
                );
                
                // Backtrack
                availableLetters.set(letter, (availableLetters.get(letter) || 0) + 1);
            }
        }
    }

    /**
     * Get statistics about the loaded dictionary
     * @returns {Object} - Dictionary statistics
     */
    getStats() {
        return {
            wordCount: this.wordCount,
            loaded: this.loaded,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage of the Trie
     * @returns {number} - Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let nodeCount = 0;
        
        const countNodes = (node) => {
            nodeCount++;
            for (const child of node.children.values()) {
                countNodes(child);
            }
        };
        
        countNodes(this.root);
        
        // Rough estimate: each node uses approximately 100 bytes
        return nodeCount * 100;
    }
}

/**
 * Dictionary Manager - Singleton for managing dictionary loading
 */
class DictionaryManager {
    constructor() {
        if (DictionaryManager.instance) {
            return DictionaryManager.instance;
        }
        
        this.dictionary = new TrieDict();
        this.loading = false;
        DictionaryManager.instance = this;
    }

    /**
     * Load dictionary from file or array
     * @param {string|string[]} source - File path or word array
     * @returns {Promise<void>}
     */
    async loadDictionary(source) {
        if (this.dictionary.loaded || this.loading) {
            return;
        }
        
        this.loading = true;
        
        try {
            let words = [];
            
            if (typeof source === 'string') {
                // Load from file
                const fs = require('fs').promises;
                const content = await fs.readFile(source, 'utf8');
                words = content.split('\n')
                    .map(word => word.trim().toUpperCase())
                    .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));
            } else if (Array.isArray(source)) {
                words = source;
            } else {
                throw new Error('Invalid dictionary source');
            }
            
            this.dictionary.loadDictionary(words);
            console.log('Dictionary loaded successfully');
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            // Load default word list for testing
            this.dictionary.loadDictionary(this.getDefaultWords());
        } finally {
            this.loading = false;
        }
    }

    /**
     * Get default word list for testing
     * @returns {string[]} - Default words
     */
    getDefaultWords() {
        return [
            'HELLO', 'WORLD', 'SCRABBLE', 'WORD', 'GAME', 'PLAY', 'WIN', 'LOSE',
            'BOARD', 'TILE', 'SCORE', 'POINT', 'LETTER', 'VOWEL', 'CONSONANT',
            'TRIPLE', 'DOUBLE', 'BONUS', 'RACK', 'DRAW', 'EXCHANGE', 'PASS',
            'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
            'WAS', 'ONE', 'OUR', 'HAD', 'BY', 'HOT', 'WORD', 'BUT', 'WHAT', 'SOME'
        ];
    }

    /**
     * Get the dictionary instance
     * @returns {TrieDict} - Dictionary instance
     */
    getDictionary() {
        return this.dictionary;
    }
}

module.exports = {
    TrieNode,
    TrieDict,
    DictionaryManager
};