// Configuration & State
const PGN_URL = "https://raw.githubusercontent.com/jmcrd/chess/refs/heads/main/puzzles/MateInOne/01/Mate%20In%20One_1_to_5.pgn";
window.puzzlePool = [];
window.currentPuzzleIndex = 0;

// NEW: Global stats tracker
window.stats = {
    correct: 0,
    skipped: 0
};

$(document).ready(function() {
    initTrainer();
});

async function initTrainer() {
    const startOverlay = document.getElementById('start-overlay');
    const status = document.getElementById('status');

    try {
        let pgnText = "";
        try {
            const response = await fetch(PGN_URL);
            if (!response.ok) throw new Error('Direct fetch failed');
            pgnText = await response.text();
        } catch (directError) {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(PGN_URL)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            pgnText = data.contents;
        }

        window.puzzlePool = pgnText.split(/\[Event /g)
                        .filter(p => p.trim().length > 10)
                        .map(p => "[Event " + p);
        
        window.puzzlePool.sort(() => Math.random() - 0.5);
        
        if (window.puzzlePool.length > 0) {
            window.currentPuzzleIndex = 0;
            // Reset stats on init
            window.stats.correct = 0;
            window.stats.skipped = 0;
            
            loadNextPuzzle();
            
            setTimeout(() => {
                $(startOverlay).fadeOut(800);
            }, 2000); 

        } else {
            if (status) status.innerText = "Empty PGN file.";
            $(startOverlay).fadeOut(300);
        }
    } catch (err) {
        $(startOverlay).fadeOut(300);
        console.error("Initialization Error:", err);
    }
}

function loadNextPuzzle() {
    const progress = document.getElementById('game-progress') || document.getElementById('progress');

    if (window.currentPuzzleIndex >= window.puzzlePool.length) {
        showFinalStats(); // Call helper to show stats
        return;
    }

    const pgnData = window.puzzlePool[window.currentPuzzleIndex];
    window.currentPuzzleIndex++;

    if (typeof setupGame === "function") {
        setupGame(pgnData);
    }
    
    if (progress) {
        progress.innerText = `Puzzle ${window.currentPuzzleIndex} / ${window.puzzlePool.length}`;
    }
}

/**
 * NEW: Helper to populate the final overlay with stats
 */
function showFinalStats() {
    const total = window.puzzlePool.length;
    const correct = window.stats.correct;
    const skipped = window.stats.skipped;

    // Update the HTML content inside the final overlay
    const finalContent = document.querySelector('#final-success-overlay .success-content');
    if (finalContent) {
        finalContent.innerHTML = `
            <a href="YOUR_CHANNEL_URL" target="_blank" class="youtube-link">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png" alt="YoutubeLogo">
                    <h2>SUBSCRIBE FOR MORE</h2>
            </a>

            <div class="stats-box" style="margin: 20px 0; font-size: 1.1em; line-height: 1.6;">
                <p>Total Puzzles: <b>${total}</b></p>
                <p>✅ Solved Correctly: <span style="color: #4CAF50;"><b>${correct}</b></span></p>
                <p>❌ Solutions Revealed: <span style="color: #ff5252;"><b>${skipped}</b></span></p>
            </div>
            <button onclick="location.reload()" class="restart-btn">Play Again</button>
        `;
    }
    $('#final-success-overlay').fadeIn(400);
    if (typeof lockBoard !== 'undefined') lockBoard = true; 
}