/**
 * app.js
 * Manages puzzle fetching, state, and UI overlays
 */

// Configuration & State
const JSON_URL = "https://raw.githubusercontent.com/jmcrd/enlightenupassets/main/json/puzzles_0_400_mateIn1.json";
window.puzzlePool = [];
window.currentPuzzleIndex = 0;

// Global stats tracker
window.stats = {
    correct: 0,
    skipped: 0
};

$(document).ready(function() {
    initTrainer();
});

/**
 * Fetches the JSON puzzle pack and prepares the trainer
 */
async function initTrainer() {
    const startOverlay = document.getElementById('start-overlay');
    const status = document.getElementById('status');
    const progressText = document.getElementById('progress');

    try {
        if (progressText) progressText.innerText = "Loading Puzzle Pack...";

        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error('Failed to fetch JSON from GitHub');
        
        const jsonData = await response.json();

        // Store the full array of puzzle objects {id, fen, moves, rating, themes}
        window.puzzlePool = jsonData;
        
        // Shuffle the deck for variety
        window.puzzlePool.sort(() => Math.random() - 0.5);
        
        if (window.puzzlePool.length > 0) {
            window.currentPuzzleIndex = 0;
            window.stats.correct = 0;
            window.stats.skipped = 0;
            
            loadNextPuzzle();
            
            // Smooth transition into the game
            setTimeout(() => {
                $(startOverlay).fadeOut(800);
            }, 2000); 

        } else {
            if (status) status.innerText = "Error: JSON file contains no puzzles.";
            $(startOverlay).fadeOut(300);
        }
    } catch (err) {
        if (status) status.innerText = "Connection Error. Please refresh.";
        $(startOverlay).fadeOut(300);
        console.error("Initialization Error:", err);
    }
}

/**
 * Grabs the next puzzle from the pool and sends it to the engine
 */
function loadNextPuzzle() {
    const progress = document.getElementById('game-progress') || document.getElementById('progress');

    // Check if we've reached the end of the set
    if (window.currentPuzzleIndex >= window.puzzlePool.length) {
        showFinalStats(); 
        return;
    }

    const puzzleData = window.puzzlePool[window.currentPuzzleIndex];
    window.currentPuzzleIndex++;

    // Calls setupGame in game.js
    if (typeof setupGame === "function") {
        setupGame(puzzleData);
    }
    
    // Update the "Puzzle X / Y" text
    if (progress) {
        progress.innerText = `Puzzle ${window.currentPuzzleIndex} / ${window.puzzlePool.length}`;
    }
}

/**
 * Populates the final success overlay with the user's performance
 */
function showFinalStats() {
    const total = window.puzzlePool.length;
    const correct = window.stats.correct;
    const skipped = window.stats.skipped;

    // 1. Update the specific ID elements found in your HTML for cleaner UI
    if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = total;
    if (document.getElementById('stat-correct')) document.getElementById('stat-correct').innerText = correct;
    if (document.getElementById('stat-skipped')) document.getElementById('stat-skipped').innerText = skipped;

    // 2. Backup: Dynamically inject the full content box in case the HTML structure changes
    const finalContent = document.querySelector('#final-success-overlay .success-content');
    
    if (finalContent) {
        // We only rewrite the innerHTML if the IDs above aren't used or to refresh the link/button
        finalContent.innerHTML = `
            <a href="YOUR_CHANNEL_URL" target="_blank" class="youtube-link">
                <img src="https://raw.githubusercontent.com/jmcrd/enlightenupassets/main/githubassets/youtube.png" alt="Youtube">
                <h2>SUBSCRIBE FOR MORE</h2>
            </a>

            <div class="stats-box" style="margin: 20px 0; font-size: 1.2em; line-height: 1.8; background: rgba(0,0,0,0.05); padding: 15px; border-radius: 8px;">
                <p style="margin: 5px 0;">Total Puzzles: <b>${total}</b></p>
                <p style="margin: 5px 0;">✅ Solved Correctly: <span style="color: #27ae60;"><b>${correct}</b></span></p>
                <p style="margin: 5px 0;">❌ Solutions Revealed: <span style="color: #e74c3c;"><b>${skipped}</b></span></p>
            </div>
            
            <button onclick="location.reload()" class="restart-btn" style="cursor: pointer;">Play Again</button>
        `;
    }

    $('#final-success-overlay').fadeIn(400);
    
    // Stop any further interaction with the board
    if (typeof lockBoard !== 'undefined') lockBoard = true; 
}
