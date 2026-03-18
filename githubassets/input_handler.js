/**
 * interaction.js
 * Handles clicks, promotions, and move validation.
 */

function onSquareClick() {
    if (window.lockBoard) return;

    // Use 'this' to get the square coordinate (e.g., "e4")
    const square = $(this).attr('data-square');
    if (!square) return;

    // 1. Deselect if clicking the same square
    if (window.selectedSquare === square) {
        clearHighlights();
        window.selectedSquare = null;
        return;
    }

    // 2. If we already have a selection, this is a Move Attempt
    if (window.selectedSquare) {
        processMoveAttempt(window.selectedSquare, square);
        return;
    }

    // 3. Initial selection
    const piece = game.get(square);

    // Only allow selecting a piece if it belongs to the player whose turn it is
    if (piece && piece.color === game.turn()) {
        window.selectedSquare = square;
        
        clearHighlights();
        $(this).addClass('highlight-sq'); // Defined in your components.css
    } else if (piece) {
        // User clicked opponent's piece first
        triggerErrorEffects();
    }
}

function processMoveAttempt(source, target) {
    const piece = game.get(source);

    // Promotion check
    const isPromotion =
        piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && target[1] === '8') ||
         (piece.color === 'b' && target[1] === '1'));

    if (isPromotion) {
        window.pendingMove = { from: source, to: target };
        if (typeof showPromotionDialog === "function") {
            showPromotionDialog(piece.color);
        } else {
            finalizeUIMove(source, target, 'q');
        }
    } else {
        finalizeUIMove(source, target, 'q');
    }
}

function finalizeUIMove(source, target, promo) {
    // validateMove is in game.js
    const result = validateMove(source, target, promo);

    if (result.success) {
        // Update Board
        if (typeof updateUIBoard === "function") {
            updateUIBoard(result.fen);
        }

        // Draw Arrow
        if (typeof highlightMove === "function") {
            highlightMove(source, target);
        }

        window.selectedSquare = null;
        $('#promotion-dialog').fadeOut(200);

        // Completion Logic
        if (result.isComplete) {
            setTimeout(() => {
                if (typeof handlePuzzleComplete === "function") {
                    handlePuzzleComplete();
                }
            }, 300);
        }
    } else {
        // Move was wrong or illegal
        triggerErrorEffects();
        clearHighlights();
        window.selectedSquare = null;
    }
}

function triggerErrorEffects() {
    const $status = $('#status');
    const $board = $('#myBoard');

    $status.removeClass('blink-status');
    void $status[0].offsetWidth; 
    $status.addClass('blink-status');

    $board.addClass('shake-board');
    setTimeout(() => { $board.removeClass('shake-board'); }, 300);
}

/**
 * Event Listener setup
 * Using a robust selector that doesn't rely on random IDs
 */
$(document).ready(function() {
    // Target any DIV inside myBoard that has a 'data-square' attribute
    $(document).off('click', '#myBoard [data-square]')
               .on('click', '#myBoard [data-square]', onSquareClick);
});
