/**
 * game.js
 * Core puzzle logic and global state management
 */

// Global state variables attached to window for cross-file access
window.board = null; 
window.selectedSquare = null;

let game = new Chess();
let solutionHistory = [];
let currentMoveIndex = 0;
let lockBoard = false;
let pendingMove = null;

// Track if the current puzzle was "skipped" by showing the solution
let wasSkipped = false;

/**
 * Initializes the chess engine with PGN data
 */
function setupGame(pgnData) {
    game = new Chess();
    lockBoard = false;
    pendingMove = null;
    currentMoveIndex = 0;
    wasSkipped = false; // Reset skip flag for new puzzle

    if (!pgnData) return;

    let cleanPgn = pgnData.replace(/\r/g, "").trim();
    
    const lastHeaderIndex = cleanPgn.lastIndexOf(']');
    if (lastHeaderIndex !== -1) {
        const headers = cleanPgn.substring(0, lastHeaderIndex + 1);
        const moves = cleanPgn.substring(lastHeaderIndex + 1).trim();
        cleanPgn = headers + "\n\n" + moves;
    }

    try {
        if (!game.load_pgn(cleanPgn)) {
            throw new Error("chess.js rejected the PGN string.");
        }
    } catch (e) {
        console.warn("Parsing failed, trying move-only fallback...");
        const movePart = cleanPgn.split(/\n\n/)[1] || "";
        if (!game.load_pgn(movePart)) {
            console.error("Critical PGN Failure. Skipping puzzle.");
            setTimeout(() => {
                if (typeof loadNextPuzzle === "function") loadNextPuzzle();
            }, 1000);
            return;
        }
    }

    solutionHistory = game.history();
    const orientMatch = cleanPgn.match(/\[Orientation "(white|black)"\]/i);
    const orientation = orientMatch ? orientMatch[1].toLowerCase() : 'white';
    
    const startMatch = cleanPgn.match(/\[PuzzleStart "(\d+)"\]/);
    const startIdx = startMatch ? parseInt(startMatch[1]) : 0;
    
    game.reset();
    for(let i = 0; i < startIdx; i++) { 
        if (solutionHistory[i]) game.move(solutionHistory[i]); 
    }
    
    currentMoveIndex = startIdx;
    
    if (typeof updateUIBoard === "function") {
        updateUIBoard(game.fen(), orientation);
    }
    
    updateStatusText();
    $('#next-puzzle-btn').hide(); 

    // Kick off the puzzle logic
    setTimeout(() => { checkAutoMove(); }, 500);
}

/**
 * Validates if a user move matches the puzzle solution
 */
function validateMove(source, target, promoPiece = 'q') {
    const move = game.move({ from: source, to: target, promotion: promoPiece });

    if (!move || move.san !== solutionHistory[currentMoveIndex]) {
        if (move) game.undo(); 
        return { success: false };
    }

    currentMoveIndex++;
    const isComplete = currentMoveIndex >= solutionHistory.length;
    
    // If user completes the puzzle and didn't use "Show Solution"
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
    lockBoard = true;
    
    // If the solution is revealed, it counts as a 'skipped' puzzle
    if (!wasSkipped) {
        wasSkipped = true;
        window.stats.skipped++;
    }

    const startIdx = currentMoveIndex; 

    for (let i = startIdx; i < solutionHistory.length; i++) {
        const moveSAN = solutionHistory[i];
        const moveObj = game.move(moveSAN);
        if (moveObj) {
            game.undo(); 
            if (typeof window.highlightMove === "function") {
                window.highlightMove(moveObj.from, moveObj.to);
            }
            await new Promise(resolve => setTimeout(resolve, 800)); 
            game.move(moveSAN);
            currentMoveIndex++;
            updateUIBoard(game.fen());
            await new Promise(resolve => setTimeout(resolve, 500)); 
            if (typeof window.clearHighlights === "function") window.clearHighlights();
        }
    }

    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerHTML = "<span class='highlight'>Solution Revealed</span>";

    if (window.currentPuzzleIndex < window.puzzlePool.length) {
        $('#next-puzzle-btn').fadeIn(300);
    } else {
        setTimeout(() => {
            if (typeof window.clearHighlights === "function") window.clearHighlights();
            if (typeof showFinalStats === "function") showFinalStats();
        }, 1000);
    }
}

/**
 * Handles computer moves with a delay
 */
function checkAutoMove() {
    if (currentMoveIndex < solutionHistory.length) {
        const boardOrientation = typeof getBoardOrientation === "function" ? getBoardOrientation() : 'white';
        
        if (boardOrientation.charAt(0) !== game.turn()) {
            lockBoard = true;
            
            setTimeout(() => {
                const moveSAN = solutionHistory[currentMoveIndex];
                const moveObj = game.move(moveSAN);
                
                if (moveObj) {
                    game.undo(); 
                    if (typeof window.highlightMove === "function") {
                        window.highlightMove(moveObj.from, moveObj.to);
                    }

                    setTimeout(() => {
                        game.move(moveSAN);
                        currentMoveIndex++;
                        updateUIBoard(game.fen());
                        updateStatusText();
                        if (typeof window.clearHighlights === "function") window.clearHighlights();
                        
                        lockBoard = false;
                        
                        if (currentMoveIndex >= solutionHistory.length) {
                            handlePuzzleComplete();
                        }
                    }, 800); 
                }
            }, 1000); 
        }
    }
}

/**
 * Logic called when a puzzle is finished
 */
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
    statusEl.innerHTML = `Solve: <span class='highlight'>${turn} to move</span>`;
}