/**
 * interaction.js
 * Handles clicks on the chessboard squares, promotions, and move finalization.
 */

/**
 * Handles clicks on the chessboard squares
 */
function onSquareClick() {
    if (lockBoard) return;

    // Use the attribute provided by Chessboard.js
    const square = $(this).attr('data-square');

    // 1. Toggle off if clicking the same square twice
    if (selectedSquare === square) {
        if (typeof removeHighlights === "function") removeHighlights();
        selectedSquare = null;
        return;
    }

    // 2. If a square was already selected, this second click is a move attempt
    if (selectedSquare) {
        processMoveAttempt(selectedSquare, square);
        return;
    }

    // 3. Initial selection of a piece
    const piece = game.get(square);

    if (piece) {
        // Only allow selecting pieces of the side whose turn it is
        if (piece.color === game.turn()) {
            selectedSquare = square;
            // Clear existing and add new highlight
            if (typeof removeHighlights === "function") removeHighlights();
            $(this).addClass('highlight-sq');
        } else {
            // Visual feedback for clicking the wrong color
            triggerErrorEffects();
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
        } else {
            // Fallback to Queen if no dialog function exists
            finalizeUIMove(source, target, 'q');
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
        // 1. Update the visual board
        if (typeof updateUIBoard === "function") {
            updateUIBoard(result.fen);
        }

        // 2. Draw the Gold Arrow for your own correct move
        if (typeof highlightMove === "function") {
            highlightMove(source, target);
        }

        // 3. Cleanup UI states
        $('#promotion-dialog').fadeOut(200);
        selectedSquare = null;

        // 4. Check if puzzle is done
        if (result.isComplete) {
            if (typeof handlePuzzleComplete === "function") {
                handlePuzzleComplete();
            }
        } else {
            // Delay for computer response (if applicable)
            setTimeout(() => {
                if (typeof checkAutoMove === "function") {
                    checkAutoMove();
                }
            }, 600);
        }
    } else {
        // Move was incorrect
        triggerErrorEffects();
        if (typeof removeHighlights === "function") removeHighlights();
        selectedSquare = null;
    }
}

/**
 * Centralized error feedback (Shake and Blink)
 */
function triggerErrorEffects() {
    const $status = $('#status');
    const $board = $('#myBoard');

    // Reset and trigger status blink
    $status.removeClass('blink-status');
    void $status[0].offsetWidth; // Trigger reflow
    $status.addClass('blink-status');

    // Trigger board shake
    $board.addClass('shake-board');
    setTimeout(() => {
        $board.removeClass('shake-board');
    }, 300);
}

/**
 * Computer move callback to ensure arrows are drawn
 */
function onComputerMove(from, to) {
    if (typeof highlightMove === "function") {
        highlightMove(from, to);
    }
}

/**
 * Event Listener setup
 */
$(document).off('click', '#myBoard .square-55d63').on('click', '#myBoard .square-55d63', onSquareClick);
