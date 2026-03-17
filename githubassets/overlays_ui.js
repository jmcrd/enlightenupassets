/**
 * Handles the UI when a puzzle is successfully completed by the user
 */
function handlePuzzleComplete() {
    $('#success-overlay').fadeIn(200);
    const statusEl = document.getElementById('status');

    if (statusEl) {
        statusEl.innerHTML = "<span class='win'>Excellent!</span>";
    }

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
 * Now keeps the overlay visible so the user can choose to Retry or see Solution.
 */
function triggerErrorEffects() {
    $('#myBoard').addClass('shake-board');
    
    // Show the overlay (it now contains our two buttons)
    $('#error-overlay').fadeIn(100);
    $('#promotion-dialog').fadeOut(200);
    
    // Clear board states
    if (typeof removeHighlights === "function") removeHighlights();
    selectedSquare = null;

    // Remove the shake animation class after it finishes
    setTimeout(() => {
        $('#myBoard').removeClass('shake-board');
    }, 500);
    
    // Note: We removed the auto-fadeOut so the user can interact with the buttons.
}

/**
 * Promotion Logic
 */
function showPromotionDialog(color) {
    lockBoard = true;
    const piecePrefix = color === 'w' ? 'w' : 'b';

    $('#promotion-dialog button').each(function () {
        const p = $(this).attr('data-piece').toUpperCase();
        $(this)
            .find('img')
            .attr(
                'src',
                `https://chessboardjs.com/img/chesspieces/wikipedia/${piecePrefix}${p}.png`
            );
    });

    $('#promotion-dialog').fadeIn(200);
}

/**
 * EVENT LISTENERS
 */

// 1. Promotion piece selection
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

// 2. Retry Button: Simply hide the error overlay
$(document).on('click', '#retry-btn', function() {
    $('#error-overlay').fadeOut(200);
});

// 3. Show Solution Button: Hide overlay and trigger the auto-play sequence
$(document).on('click', '#show-solution-btn', function() {
    $('#error-overlay').fadeOut(200);
    if (typeof playSolution === "function") {
        playSolution();
    }
});

// 4. Next Puzzle Button (in the status bar): Hide self and load new puzzle
$(document).on('click', '#next-puzzle-btn', function() {
    $(this).hide();
    if (typeof loadNextPuzzle === "function") {
        loadNextPuzzle();
    }
});