/**
 * game.js - JSON Optimized (Opponent Move Support)
 * Core puzzle logic for Mate in 1 puzzles
 */

// Global state variables
window.board = null; 
window.selectedSquare = null;

let game = new Chess();
let solutionHistory = []; 
let currentMoveIndex = 0;
let lockBoard = false;
let pendingMove = null;
let wasSkipped = false;

/**
 * Initializes the chess engine with JSON puzzle data
 */
async function setupGame(puzzleData) {
    game = new Chess();
    lockBoard = false;
    pendingMove = null;
    currentMoveIndex = 0;
    wasSkipped = false; 

    if (!puzzleData || !puzzleData.fen) return;

    // 1. Load the initial FEN (Position before opponent's move)
    const loaded = game.load(puzzleData.fen);
    if (!loaded) {
        console.error("Invalid FEN.");
        if (typeof loadNextPuzzle === "function") loadNextPuzzle();
        return;
    }

    // 2. Process Moves List
    if (puzzleData.moves) {
        const movesArray = puzzleData.moves.split(' ');
        
        // The first move in the array is the opponent's move. 
        // We play it automatically so the user is "responding" to it.
        const opponentUCI = movesArray[0];
        const opponentMove = game.move({
            from: opponentUCI.substring(0, 2),
            to: opponentUCI.substring(2, 4),
            promotion: opponentUCI.length === 5 ? opponentUCI[4] : 'q'
        });

        // The remaining moves are the solution the user must find
        solutionHistory = [];
        const tempGame = new Chess(game.fen());
        for (let i = 1; i < movesArray.length; i++) {
            const uci = movesArray[i];
            const move = tempGame.move({
                from: uci.substring(0, 2),
                to: uci.substring(2, 4),
                promotion: uci.length === 5 ? uci[4] : 'q'
            });
            if (move) solutionHistory.push(move);
        }
    }

    // 3. Determine Orientation based on whose turn it is AFTER the opponent moved
    const orientation = game.turn() === 'w' ? 'white' : 'black';
    
    // 4. Update UI Board
    if (typeof updateUIBoard === "function") {
        updateUIBoard(game.fen(), orientation);
    }
    
    // 5. Visual feedback: Highlight the opponent's move so the user knows what happened
    if (puzzleData.moves) {
        const lastUCI = puzzleData.moves.split(' ')[0];
        if (typeof window.highlightMove === "function") {
            window.highlightMove(lastUCI.substring(0, 2), lastUCI.substring(2, 4));
        }
    }

    updateStatusText();
    $('#next-puzzle-btn').hide(); 
}

/**
 * Validates if a user move matches the puzzle solution
 */
function validateMove(source, target, promoPiece = 'q') {
    if (lockBoard) return { success: false };

    const correctMove = solutionHistory[currentMoveIndex];

    // Source/Target check
    if (!correctMove || source !== correctMove.from || target !== correctMove.to) {
        return { success: false };
    }

    const result = game.move({ from: source, to: target, promotion: promoPiece });
    if (!result) return { success: false };

    currentMoveIndex++;
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

    for (let i = currentMoveIndex; i < solutionHistory.length; i++) {
        const moveObj = solutionHistory[i];
        
        if (typeof window.highlightMove === "function") {
            window.highlightMove(moveObj.from, moveObj.to);
        }
        
        await new Promise(resolve => setTimeout(resolve, 600)); 
        
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
    // Logic for multi-step puzzles would go here
}
