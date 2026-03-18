/**
 * game.js - JSON Optimized (Using DB Moves)
 * Core puzzle logic for Mate in 1 puzzles
 */

// Global state variables attached to window for cross-file access
window.board = null; 
window.selectedSquare = null;

let game = new Chess();
let solutionHistory = []; // Stores move objects {from, to, promotion}
let currentMoveIndex = 0;
let lockBoard = false;
let pendingMove = null;

// Track if the current puzzle was "skipped" by showing the solution
let wasSkipped = false;

/**
 * Initializes the chess engine with JSON puzzle data
 * @param {Object} puzzleData - The object from your JSON {id, fen, moves, ...}
 */
function setupGame(puzzleData) {
    game = new Chess();
    lockBoard = false;
    pendingMove = null;
    currentMoveIndex = 0;
    wasSkipped = false; 

    if (!puzzleData || !puzzleData.fen) return;

    // 1. Load the FEN into the engine
    const loaded = game.load(puzzleData.fen);
    if (!loaded) {
        console.error("Invalid FEN. Skipping puzzle.");
        setTimeout(() => {
            if (typeof loadNextPuzzle === "function") loadNextPuzzle();
        }, 1000);
        return;
    }

    // 2. Parse solution from the "moves" field
    // Converts Lichess UCI (e2e4) into internal move objects
    if (puzzleData.moves) {
        const movesArray = puzzleData.moves.split(' ');
        solutionHistory = [];
        const tempGame = new Chess(puzzleData.fen);
        
        for (const uci of movesArray) {
            const moveObj = {
                from: uci.substring(0, 2),
                to: uci.substring(2, 4),
                promotion: uci.length === 5 ? uci[4] : 'q'
            };
            
            // Validate move and store it
            const validMove = tempGame.move(moveObj);
            if (validMove) {
                solutionHistory.push(validMove); // Stores the full move object (san, from, to)
            }
        }
    } else {
        // Fallback: If no moves provided, try to find checkmate automatically
        const mateMoveSAN = game.moves().find(m => m.includes('#'));
        if (mateMoveSAN) {
            const tempMove = game.move(mateMoveSAN);
            solutionHistory = [tempMove];
            game.undo();
        } else {
            solutionHistory = [];
        }
    }

    // 3. Determine Orientation (Who is moving?)
    const orientation = game.turn() === 'w' ? 'white' : 'black';
    
    // 4. Update UI
    if (typeof updateUIBoard === "function") {
        updateUIBoard(game.fen(), orientation);
    }
    
    updateStatusText();
    $('#next-puzzle-btn').hide(); 

    // Kick off logic
    setTimeout(() => { checkAutoMove(); }, 500);
}

/**
 * Validates if a user move matches the puzzle solution
 */
function validateMove(source, target, promoPiece = 'q') {
    if (lockBoard) return { success: false };

    // Create the move attempt
    const moveAttempt = { from: source, to: target, promotion: promoPiece };
    const correctMove = solutionHistory[currentMoveIndex];

    // Check if the source and target match the solution
    if (!correctMove || source !== correctMove.from || target !== correctMove.to) {
        return { success: false };
    }

    // Execute the move in the engine
    const result = game.move(moveAttempt);
    if (!result) return { success: false };

    currentMoveIndex++;
    
    // Since it's Mate in 1, it's complete after the first move
    const isComplete = currentMoveIndex >= solutionHistory.length;
    
    if (isComplete && !wasSkipped) {
        if (window.stats) window.stats.correct++;
    }

    return { 
        success: true, 
        fen: game.fen(), 
        isComplete: isComplete 
    };
}

/**
 * Automatically plays the full solution for the user
 */
async function playSolution() {
    if (lockBoard) return;
    lockBoard = true;
    
    if (!wasSkipped) {
        wasSkipped = true;
        if (window.stats) window.stats.skipped++;
    }

    // Start from wherever the user left off
    for (let i = currentMoveIndex; i < solutionHistory.length; i++) {
        const moveObj = solutionHistory[i];
        
        // Visual feedback
        if (typeof window.highlightMove === "function") {
            window.highlightMove(moveObj.from, moveObj.to);
        }
        
        await new Promise(resolve => setTimeout(resolve, 600)); 
        
        // Execute move
        game.move(moveObj);
        if (typeof updateUIBoard === "function") {
            updateUIBoard(game.fen());
        }
        
        await new Promise(resolve => setTimeout(resolve, 400)); 
        if (typeof window.clearHighlights === "function") window.clearHighlights();
    }

    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerHTML = "<span style='color: #ff5252;'>Solution Revealed</span>";

    if (window.puzzlePool && window.currentPuzzleIndex < window.puzzlePool.length) {
        $('#next-puzzle-btn').fadeIn(300);
    } else {
        setTimeout(() => {
            if (typeof showFinalStats === "function") showFinalStats();
        }, 1000);
    }
}

/**
 * Handles logic after a successful move
 */
function handlePuzzleComplete() {
    if (window.puzzlePool && window.currentPuzzleIndex < window.puzzlePool.length) {
        $('#success-overlay').fadeIn(300).delay(1000).fadeOut(300, function() {
            $('#next-puzzle-btn').fadeIn(300);
        });
    } else {
        $('#success-overlay').fadeIn(300).delay(1000).fadeOut(300, function() {
            if (typeof showFinalStats === "function") showFinalStats();
        });
    }
}

function updateStatusText() {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;
    const turn = game.turn() === 'w' ? "White" : "Black";
    statusEl.innerHTML = `Solve: <span class='highlight'>${turn} to move (Mate in 1)</span>`;
}

function checkAutoMove() {
    // If the computer needs to play the first move (puzzles where you respond),
    // logic would be added here.
}
