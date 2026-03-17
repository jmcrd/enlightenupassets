/**
 * game.js - JSON Optimized (Using DB Moves)
 * Core puzzle logic for Mate in 1 puzzles
 */

// Global state variables attached to window for cross-file access
window.board = null; 
window.selectedSquare = null;

let game = new Chess();
let solutionHistory = []; // Now stores the moves from the JSON
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
    // Lichess moves are usually space-separated strings (e.g., "e2e4 d7d5")
    if (puzzleData.moves) {
        // We split the moves into an array
        const movesArray = puzzleData.moves.split(' ');
        
        // Convert UCI moves (e2e4) to SAN (e4) for internal validation/display
        solutionHistory = [];
        const tempGame = new Chess(puzzleData.fen);
        
        for (const uci of movesArray) {
            const move = tempGame.move({
                from: uci.substring(0, 2),
                to: uci.substring(2, 4),
                promotion: uci.length === 5 ? uci[4] : 'q'
            });
            if (move) solutionHistory.push(move.san);
        }
    } else {
        // Fallback: If no moves provided, try to find checkmate automatically
        const mateMove = game.moves().find(m => m.includes('#'));
        solutionHistory = mateMove ? [mateMove] : [];
    }

    // 3. Determine Orientation
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
    // Check if user is trying to make a move while board is locked
    if (lockBoard) return { success: false };

    const move = game.move({ from: source, to: target, promotion: promoPiece });

    // Validate against the specific move in solutionHistory
    if (!move || move.san !== solutionHistory[currentMoveIndex]) {
        if (move) game.undo(); 
        return { success: false };
    }

    currentMoveIndex++;
    
    // Since it's Mate in 1, it's complete after the first move
    const isComplete = currentMoveIndex >= solutionHistory.length;
    
    if (isComplete && !wasSkipped) {
        window.stats.correct++;
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
        window.stats.skipped++;
    }

    // Start from wherever the user left off
    for (let i = currentMoveIndex; i < solutionHistory.length; i++) {
        const moveSAN = solutionHistory[i];
        const moveObj = game.move(moveSAN);
        
        if (moveObj) {
            game.undo(); // Undo to show the animation
            if (typeof window.highlightMove === "function") {
                window.highlightMove(moveObj.from, moveObj.to);
            }
            
            await new Promise(resolve => setTimeout(resolve, 600)); 
            game.move(moveSAN);
            updateUIBoard(game.fen());
            
            await new Promise(resolve => setTimeout(resolve, 400)); 
            if (typeof window.clearHighlights === "function") window.clearHighlights();
        }
    }

    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerHTML = "<span class='highlight'>Solution Revealed</span>";

    if (window.currentPuzzleIndex < window.puzzlePool.length) {
        $('#next-puzzle-btn').fadeIn(300);
    } else {
        setTimeout(() => {
            if (typeof showFinalStats === "function") showFinalStats();
        }, 1000);
    }
}

/**
 * Empty check for auto-moves (Handled by user in Mate in 1)
 */
function checkAutoMove() {
    // Current setup assumes the FEN starts on the user's turn to mate.
    // If the computer needs to play the first move, it would go here.
}

function handlePuzzleComplete() {
    if (window.currentPuzzleIndex < window.puzzlePool.length) {
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
