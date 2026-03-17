/**
 * board_ui.js
 * Handles the Chessboard.js instance and SVG move highlighting.
 */

// Note: 'board' and 'selectedSquare' are declared globally in game.js. 
// We do not use 'let' or 'const' here to avoid Redeclaration Errors.

$(document).ready(function() {
    // Only initialize if not already initialized by another script
    if (typeof board !== 'undefined' && board === null) {
        board = Chessboard('myBoard', { 
            draggable: false,
            position: 'start',
            // Using your custom SVG set on GitHub
            pieceTheme: 'https://raw.githubusercontent.com/jmcrd/enlightenupassets/main/img/pieces/icpieces/{piece}.svg'
        });
    }
});

/**
 * Updates the board UI with a new FEN and optional orientation
 */
function updateUIBoard(fen, orientation = null) {
    if (!board) return;

    if (orientation) {
        board.orientation(orientation);
    }

    board.position(fen);
    clearHighlights();
    
    // Reset selection state for the next puzzle
    if (typeof selectedSquare !== 'undefined') {
        selectedSquare = null;
    }
}

/**
 * Returns current board orientation
 */
function getBoardOrientation() {
    return board ? board.orientation() : 'white';
}

/**
 * Draws a real SVG arrow with Knight L-shapes and precise head alignment.
 * Optimized to prevent the "huge head" glitch by using a line-offset.
 */
function highlightMove(from, to) {
    clearHighlights();
    const svg = document.getElementById('arrow-svg');
    if (!svg) return;

    // Chessboard.js specific square class
    const $fromSq = $(`#myBoard .square-${from}`);
    const $toSq = $(`#myBoard .square-${to}`);
    if (!$fromSq.length || !$toSq.length) return;

    const boardRect = svg.getBoundingClientRect();
    const fromRect = $fromSq[0].getBoundingClientRect();
    const toRect = $toSq[0].getBoundingClientRect();

    // Center coordinates relative to the SVG container
    const x1 = fromRect.left + fromRect.width / 2 - boardRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - boardRect.top;
    const x2 = toRect.left + toRect.width / 2 - boardRect.left;
    const y2 = toRect.top + toRect.height / 2 - boardRect.top;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const sqSize = fromRect.width; 

    // Knight move detection logic
    const isKnightPattern = (Math.abs(absDx - sqSize * 2) < sqSize / 2 && Math.abs(absDy - sqSize) < sqSize / 2) ||
                            (Math.abs(absDy - sqSize * 2) < sqSize / 2 && Math.abs(absDx - sqSize) < sqSize / 2);

    let pathD = "";
    const offset = 13; // Shortens line so it doesn't poke through the arrowhead

    if (isKnightPattern) {
        let elbowX, elbowY;
        if (absDx > absDy) {
            elbowX = x2; elbowY = y1;
        } else {
            elbowX = x1; elbowY = y2;
        }

        const segDx = x2 - elbowX;
        const segDy = y2 - elbowY;
        const dist = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
        
        const shortX = x2 - (segDx / dist) * offset;
        const shortY = y2 - (segDy / dist) * offset;

        pathD = `M ${x1} ${y1} L ${elbowX} ${elbowY} L ${shortX} ${shortY}`;
    } else {
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const shortX = x2 - (dx / dist) * offset;
        const shortY = y2 - (dy / dist) * offset;

        pathD = `M ${x1} ${y1} L ${shortX} ${shortY}`;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("stroke", "rgba(255, 215, 0, 0.75)"); 
    path.setAttribute("stroke-width", "9");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("marker-end", "url(#arrowhead)");
    path.setAttribute("class", "chess-arrow");

    svg.appendChild(path);
}

/**
 * Clears all SVG arrows and standard square highlights
 */
function clearHighlights() {
    const svg = document.getElementById('arrow-svg');
    if (svg) {
        $(svg).find('path').remove();
    }
    // Remove both standard chessboard.js and your custom highlight classes
    $('#myBoard .square-55d63').removeClass('highlight-sq highlight-from highlight-to');
}

/**
 * Alias for clearHighlights to maintain compatibility
 */
function removeHighlights() {
    clearHighlights();
}

/**
 * Keep board and SVG aligned during window changes
 */
$(window).resize(() => {
    if (board) {
        board.resize();
        clearHighlights();
    }
});
