const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startRestartButton = document.getElementById('startRestartButton');
const gameOverMessage = document.getElementById('gameOverMessage');
const loadingMessage = document.getElementById('loadingMessage');
const countdown = document.getElementById('countdown');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseButton = document.getElementById('pauseButton');
const howToPlayButton = document.getElementById('howToPlayButton');
const howToPlayModal = document.getElementById('howToPlayModal');
const closeHowToPlay = document.getElementById('closeHowToPlay');

const INITIAL_STEP_DELAY_MS = 150;
const MIN_STEP_DELAY_MS = 60;

let tileSize = 20;
let rows, cols;
let snake;
let food;
let score = 0;
let highScore = parseInt(localStorage.getItem('basketballSnakeHighScore')) || 0;
let lives = 3;
let dx = 0;
let dy = 0;
let gameState = 'ready';
let stepDelayMs = INITIAL_STEP_DELAY_MS;
let loopId = null;
let lastRenderTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let isTouchActive = false;
let isPaused = false;
let countdownValue = 3;

// Show loading state
loadingMessage.classList.remove('hidden');

function setStartRestartButtonLabel(label) {
    startRestartButton.textContent = label;
    startRestartButton.setAttribute('aria-label', label);
}

function setup() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.width;
    rows = canvas.height / tileSize;
    cols = canvas.width / tileSize;
    document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    document.getElementById('score').textContent = 'Score: 0';
    startRestartButton.classList.remove('hidden');
    setStartRestartButtonLabel('Start Game');
    gameOverMessage.classList.add('hidden');
    loadingMessage.classList.add('hidden');
    pauseButton.classList.add('hidden');
}

function init() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.width;
    rows = canvas.height / tileSize;
    cols = canvas.width / tileSize;
    snake = [
        { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
        { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) },
        { x: Math.floor(cols / 2) - 2, y: Math.floor(rows / 2) }
    ];
    placeFood();
    score = 0;
    stepDelayMs = INITIAL_STEP_DELAY_MS;
    dx = 1;
    dy = 0;
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    gameOverMessage.classList.add('hidden');
    pauseButton.classList.remove('hidden');
}

function requestGameStart() {
    if (gameState !== 'ready' && gameState !== 'gameOver') return;

    if (gameState === 'gameOver') {
        lives = 3;
        score = 0;
        document.getElementById('lives').textContent = 'Lives: ' + lives;
        document.getElementById('score').textContent = 'Score: ' + score;
        gameOverMessage.classList.add('hidden');
    }

    gameState = 'countdown';
    startRestartButton.classList.add('hidden');
    startCountdown();
}

function startCountdown() {
    countdownValue = 3;
    countdown.textContent = countdownValue;
    countdown.classList.remove('hidden');
    
    const countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            countdown.textContent = countdownValue;
        } else {
            clearInterval(countdownInterval);
            countdown.classList.add('hidden');
            startGame();
        }
    }, 1000);
}

function scheduleGameLoop() {
    if (loopId !== null) return;
    loopId = requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    loopId = null;
    if (gameState !== 'playing' || isPaused) return;
    
    scheduleGameLoop();
    
    const millisecondsSinceLastRender = currentTime - lastRenderTime;
    if (millisecondsSinceLastRender < stepDelayMs) return;
    
    lastRenderTime = currentTime;
    
    update();
    draw();
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    // wall collision
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        endGame();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = 'Score: ' + score;
        placeFood();
        // Increase speed slightly with each food collected
        stepDelayMs = Math.max(MIN_STEP_DELAY_MS, stepDelayMs - 2);
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    snake.forEach((seg, index) => {
        const gradient = ctx.createRadialGradient(
            seg.x * tileSize + tileSize / 2,
            seg.y * tileSize + tileSize / 2,
            0,
            seg.x * tileSize + tileSize / 2,
            seg.y * tileSize + tileSize / 2,
            tileSize / 2
        );
        gradient.addColorStop(0, '#f97316'); // Orange-500
        gradient.addColorStop(1, '#ea580c'); // Orange-600
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#1a202c';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(seg.x * tileSize + tileSize / 2, seg.y * tileSize + tileSize / 2, tileSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    
    // Draw food with glow effect
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
    };
    // ensure not on snake
    if (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
        placeFood();
    }
}

function changeDirection(newDx, newDy) {
    if (-newDx === dx && -newDy === dy) return; // prevent reverse
    dx = newDx;
    dy = newDy;
}

function endGame() {
    lives--;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('basketballSnakeHighScore', highScore);
        document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    }
    if (lives > 0) {
        setStartRestartButtonLabel('Continue');
        startRestartButton.classList.remove('hidden');
        gameState = 'ready';
    } else {
        gameOverMessage.classList.remove('hidden');
        setStartRestartButtonLabel('Restart Game');
        startRestartButton.classList.remove('hidden');
        gameState = 'gameOver';
    }
    pauseButton.classList.add('hidden');
}

function startGame() {
    init();
    gameState = 'playing';
    isPaused = false;
    startRestartButton.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    pauseButton.querySelector('.pause-icon').classList.remove('hidden');
    pauseButton.querySelector('.resume-icon').classList.add('hidden');
    pauseButton.setAttribute('aria-label', 'Pause Game');
    lastRenderTime = performance.now();
    scheduleGameLoop();
}

function togglePause() {
    if (gameState !== 'playing') return;
    isPaused = !isPaused;
    pauseOverlay.classList.toggle('hidden');
    pauseButton.querySelector('.pause-icon').classList.toggle('hidden');
    pauseButton.querySelector('.resume-icon').classList.toggle('hidden');
    pauseButton.setAttribute('aria-label', isPaused ? 'Resume Game' : 'Pause Game');
    if (!isPaused) {
        lastRenderTime = performance.now();
        scheduleGameLoop();
    }
}

// Keyboard controls
window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (e.key === ' ' && (gameState === 'ready' || gameState === 'gameOver' || gameState === 'countdown')) {
        e.preventDefault();
        requestGameStart();
        return;
    }

    if (gameState !== 'playing' || isPaused) return;

    if (e.key.startsWith('Arrow')) {
        e.preventDefault();
    }

    if (e.key === 'ArrowUp') changeDirection(0, -1);
    if (e.key === 'ArrowDown') changeDirection(0, 1);
    if (e.key === 'ArrowLeft') changeDirection(-1, 0);
    if (e.key === 'ArrowRight') changeDirection(1, 0);
});

// Touch controls
const touchControls = document.getElementById('touchControls');
touchControls.addEventListener('touchstart', handleTouchStart, { passive: true });
touchControls.addEventListener('touchmove', handleTouchMove, { passive: true });
touchControls.addEventListener('touchend', handleTouchEnd, { passive: true });

function handleTouchStart(e) {
    if (gameState !== 'playing' || isPaused) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isTouchActive = true;
}

function handleTouchMove(e) {
    if (!isTouchActive || gameState !== 'playing' || isPaused) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 1 : -1, 0);
    } else {
        changeDirection(0, dy > 0 ? 1 : -1);
    }
}

function handleTouchEnd() {
    isTouchActive = false;
}

// Button controls
document.getElementById('touchControls').addEventListener('click', e => {
    if (gameState !== 'playing' || isPaused) return;
    if (e.target.dataset.dir) {
        if (e.target.dataset.dir === 'up') changeDirection(0, -1);
        if (e.target.dataset.dir === 'down') changeDirection(0, 1);
        if (e.target.dataset.dir === 'left') changeDirection(-1, 0);
        if (e.target.dataset.dir === 'right') changeDirection(1, 0);
    }
});

startRestartButton.addEventListener('click', requestGameStart);

pauseButton.addEventListener('click', togglePause);

// How to Play Modal
howToPlayButton.addEventListener('click', () => {
    howToPlayModal.style.display = 'flex';
    howToPlayModal.classList.remove('hidden');
});

closeHowToPlay.addEventListener('click', () => {
    howToPlayModal.style.display = 'none';
    howToPlayModal.classList.add('hidden');
});

// Close modal when clicking outside
howToPlayModal.addEventListener('click', (e) => {
    if (e.target === howToPlayModal) {
        howToPlayModal.style.display = 'none';
        howToPlayModal.classList.add('hidden');
    }
});

// Close modal with Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && howToPlayModal.style.display !== 'none') {
        howToPlayModal.style.display = 'none';
        howToPlayModal.classList.add('hidden');
    }
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (gameState === 'playing') {
            init();
        } else {
            setup();
        }
    }, 250);
});

// Initial setup
window.addEventListener('load', () => {
    setup();
});
