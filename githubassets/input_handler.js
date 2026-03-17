/**
 * Handles clicks on the chessboard squares
 */
function onSquareClick() {
    if (lockBoard) return;

    const square = $(this).attr('data-square');

    // Toggle off if clicking the same square twice
    if (selectedSquare === square) {
        if (typeof removeHighlights === "function") removeHighlights();
        selectedSquare = null;
        return;
    }

    // If a square was already selected, this second click is a move attempt
    if (selectedSquare) {
        processMoveAttempt(selectedSquare, square);
        return;
    }

    const piece = game.get(square);

    // Initial selection of a piece
    if (piece) {
        // Only allow selecting pieces of the side whose turn it is
        if (piece.color === game.turn()) {
            selectedSquare = square;
            $(this).addClass('highlight-sq');
        } else {
            // Visual feedback for clicking the wrong color
            const $status = $('#status');
            $status.removeClass('blink-status');
            void $status[0].offsetWidth; // Trigger reflow for animation
            $status.addClass('blink-status');

            $('#myBoard').addClass('shake-board');
            setTimeout(() => {
                $('#myBoard').removeClass('shake-board');
            }, 300);
        }
    }
}

/**
 * Determines if a move is a promotion or a standard move
 */
function processMoveAttempt(source, target) {
    const piece = game.get(source);

    // Promotion check: Pawn reaching the 8th (white) or 1st (black) rank
    const isPromotion =
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && target[1] === '8') ||
         (piece.color === 'b' && target[1] === '1'));

    if (isPromotion) {
        // Store move and wait for user to pick a piece in the dialog
        pendingMove = { from: source, to: target };
        if (typeof showPromotionDialog === "function") {
            showPromotionDialog(piece.color);
        }
    } else {
        // Standard move
        finalizeUIMove(source, target, 'q');
    }
}

/**
 * Finalizes the move, validates against the puzzle solution, and updates UI
 */
function finalizeUIMove(source, target, promo) {
    const result = validateMove(source, target, promo);

    if (result.success) {
        // Move was correct!
        if (typeof updateUIBoard === "function") {
            updateUIBoard(result.fen);
        }

        // --- NEW: Draw arrow for your own correct move ---
        if (typeof highlightMove === "function") {
            highlightMove(source, target);
        }

        // Cleanup
        $('#promotion-dialog').fadeOut(200);
        selectedSquare = null;

        // Check if this was the last move of the puzzle
        if (result.isComplete) {
            if (typeof handlePuzzleComplete === "function") {
                handlePuzzleComplete();
            }
        } else {
            // Give a tiny delay so you can see your arrow before the computer moves
            setTimeout(() => {
                if (typeof checkAutoMove === "function") {
                    checkAutoMove();
                }
            }, 600);
        }
    } else {
        // Move was incorrect
        if (typeof triggerErrorEffects === "function") {
            triggerErrorEffects();
        }
        
        if (typeof removeHighlights === "function") removeHighlights();
        selectedSquare = null;
    }
}

/**
 * We need to listen for when the computer makes a move to draw its arrow
 * Add this to ensure the opponent's move is visible
 */
function onComputerMove(from, to) {
    if (typeof highlightMove === "function") {
        highlightMove(from, to);
    }
}

/**
 * Event Listener for chessboard squares
 * Uses delegated events to ensure it works with chessboard.js rendered elements
 */
$(document).on('click', '#myBoard .square-55d63', onSquareClick);