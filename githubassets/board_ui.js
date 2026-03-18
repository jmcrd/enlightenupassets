/**
 * board_ui.js - PRO VERSION
 * Handles the Chessboard.js instance and SVG move highlighting.
 */

$(document).ready(function() {
    // Only initialize if not already initialized
    if (typeof board !== 'undefined' && board === null) {
        board = Chessboard('myBoard', { 
            draggable: false,
            position: 'start',
            showNotation: true, // Ensures coordinates 1-8 are visible
            pieceTheme: 'https://raw.githubusercontent.com/jmcrd/enlightenupassets/main/img/pieces/icpieces/{piece}.svg'
        });
    }
});

/**
 * Updates the board UI with a new FEN and optional orientation.
 * Uses a small delay to ensure the board flip finishes before drawing arrows.
 */
function updateUIBoard(fen, orientation = null) {
    if (!board) return;

    // 1. Clear everything first
    clearHighlights();

    // 2. Set Orientation if provided
    if (orientation && board.orientation() !== orientation) {
        board.orientation(orientation);
    }

    // 3. Set Position
    // We use 'false' for animation here to make it instant for the logic
    board.position(fen, false); 

    // 4. Reset selection state
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
 * Draws an SVG arrow. 
 * Updated to wait for DOM stability to prevent "Misplaced Arrows"
 */
function highlightMove(from, to) {
    // We use a tiny timeout (50ms) to ensure Chessboard.js has finished 
    // rendering the squares in their new positions after a flip.
    setTimeout(() => {
        const svg = document.getElementById('arrow-svg');
        if (!svg) return;

        // Clear existing arrows so they don't stack
        $(svg).find('path').remove();

        const $fromSq = $(`#myBoard .square-${from}`);
        const $toSq = $(`#myBoard .square-${to}`);
        
        if (!$fromSq.length || !$toSq.length) return;

        const boardRect = svg.getBoundingClientRect();
        const fromRect = $fromSq[0].getBoundingClientRect();
        const toRect = $toSq[0].getBoundingClientRect();

        // Calculate centers
        const x1 = fromRect.left + fromRect.width / 2 - boardRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - boardRect.top;
        const x2 = toRect.left + toRect.width / 2 - boardRect.left;
        const y2 = toRect.top + toRect.height / 2 - boardRect.top;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const sqSize = fromRect.width; 

        // Knight detection
        const isKnightPattern = (Math.abs(absDx - sqSize * 2) < sqSize / 2 && Math.abs(absDy - sqSize) < sqSize / 2) ||
                                (Math.abs(absDy - sqSize * 2) < sqSize / 2 && Math.abs(absDx - sqSize) < sqSize / 2);

        let pathD = "";
        const offset = 13; 

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
        path.setAttribute("stroke", "rgba(255, 215, 0, 0.8)"); 
        path.setAttribute("stroke-width", "8");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("marker-end", "url(#arrowhead)");
        path.setAttribute("class", "chess-arrow");

        svg.appendChild(path);
    }, 60); // 60ms is the "sweet spot" for DOM updates
}

/**
 * Clears all SVG arrows and standard square highlights
 */
function clearHighlights() {
    const svg = document.getElementById('arrow-svg');
    if (svg) {
        $(svg).find('path').remove();
    }
    // Clean up all possible highlight classes
    $('#myBoard [class*="square-"]').removeClass('highlight-sq highlight-from highlight-to');
}

function removeHighlights() {
    clearHighlights();
}

/**
 * Handle window resizing
 */
$(window).resize(() => {
    if (board) {
        board.resize();
        clearHighlights();
    }
});