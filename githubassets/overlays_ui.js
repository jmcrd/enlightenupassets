/**
 * ui_handlers.js
 * Manages overlays, promotion dialogs, and button interactions.
 */

/**
 * Handles the UI when a puzzle is successfully completed by the user
 */
function handlePuzzleComplete() {
    $('#success-overlay').fadeIn(200);
    const statusEl = document.getElementById('status');

    if (statusEl) {
        statusEl.innerHTML = "<span class='win' style='color: #27ae60; font-weight: bold;'>Excellent!</span>";
    }

    // Brief pause to celebrate before loading the next challenge
    setTimeout(() => {
        $('#success-overlay').fadeOut(300, function () {
            if (typeof loadNextPuzzle === "function") {
                loadNextPuzzle();
            }
        });
    }, 1500);
}

/**
 * Handles the UI when a user makes an incorrect move.
 * Keeps the error overlay visible so the user can interact with the buttons.
 */
function triggerErrorEffects() {
    $('#myBoard').addClass('shake-board');
    
    // Show the overlay containing "Retry" and "Show Solution"
    $('#error-overlay').fadeIn(100);
    $('#promotion-dialog').fadeOut(200);
    
    // Clear selection states to allow a fresh retry
    if (typeof removeHighlights === "function") removeHighlights();
    selectedSquare = null;

    // Cleanup the animation class
    setTimeout(() => {
        $('#myBoard').removeClass('shake-board');
    }, 500);
}

/**
 * Promotion Logic
 * Dynamically updates piece images based on the current player's color
 */
function showPromotionDialog(color) {
    lockBoard = true;
    const piecePrefix = (color === 'w') ? 'w' : 'b';

    $('#promotion-dialog button').each(function () {
        const pieceType = $(this).attr('data-piece').toUpperCase();
        $(this)
            .find('img')
            .attr(
                'src',
                `https://raw.githubusercontent.com/jmcrd/enlightenupassets/main/img/pieces/icpieces/${piecePrefix}${pieceType}.svg`
            );
    });

    $('#promotion-dialog').fadeIn(200);
}

/**
 * EVENT LISTENERS (Delegated)
 */

// 1. Handle Promotion selection
$(document).on('click', '#promotion-dialog button', function () {
    const piece = $(this).attr('data-piece');
    if (pendingMove) {
        lockBoard = false;
        $('#promotion-dialog').fadeOut(200);
        if (typeof finalizeUIMove === "function") {
            finalizeUIMove(pendingMove.from, pendingMove.to, piece);
        }
    }
});

// 2. Retry Button: Hide error overlay and let the user try again
$(document).on('click', '#retry-btn', function() {
    $('#error-overlay').fadeOut(200);
    // Board is already reset to position before the error in game.js logic
});

// 3. Show Solution Button: Hide overlay and let the computer play the mate
$(document).on('click', '#show-solution-btn', function() {
    $('#error-overlay').fadeOut(200);
    if (typeof playSolution === "function") {
        playSolution();
    }
});

// 4. Next Puzzle Button: Manual skip or proceed after solution reveal
$(document).on('click', '#next-puzzle-btn', function() {
    $(this).hide();
    if (typeof loadNextPuzzle === "function") {
        loadNextPuzzle();
    }
});