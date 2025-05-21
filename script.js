const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const tileSize = 20;
let rows, cols;
let speed = 150;

// Game state
let snake = [];
let food = { x: 0, y: 0 };
let score = 0;
let lives = 3;
let dx = 1;
let dy = 0;
let highScore = 0;
let loopId;
let gameState = 'ready';

function updateScoreboard() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
}

function resetBoard() {
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
    dx = 1;
    dy = 0;
}

function startGame() {
    score = 0;
    lives = 3;
    highScore = parseInt(localStorage.getItem('hoopsHighScore') || '0', 10);
    updateScoreboard();
    document.getElementById('gameOverMessage').classList.add('hidden');
    document.getElementById('lifeLostMessage').classList.add('hidden');
    document.getElementById('startRestartButton').classList.add('hidden');
    gameState = 'playing';
    resetBoard();
    gameLoop();
}

function gameLoop() {
    loopId = setTimeout(() => requestAnimationFrame(gameLoop), speed);
    update();
    draw();
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        loseLife();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScoreboard();
        placeFood();
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = 'black';
    snake.forEach(seg => {
        ctx.beginPath();
        ctx.arc(seg.x * tileSize + tileSize / 2, seg.y * tileSize + tileSize / 2, tileSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(food.x * tileSize + tileSize / 2, food.y * tileSize + tileSize / 2, tileSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
    };
    if (snake.some(seg => seg.x === food.x && seg.y === food.y)) placeFood();
}

function changeDirection(newDx, newDy) {
    if (-newDx === dx && -newDy === dy) return;
    dx = newDx;
    dy = newDy;
}

function loseLife() {
    clearTimeout(loopId);
    lives--;
    if (lives > 0) {
        document.getElementById('lifeLostMessage').classList.remove('hidden');
        updateScoreboard();
        setTimeout(() => {
            document.getElementById('lifeLostMessage').classList.add('hidden');
            resetBoard();
            gameLoop();
        }, 1000);
    } else {
        endGame();
    }
}

function endGame() {
    clearTimeout(loopId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hoopsHighScore', highScore);
    }
    updateScoreboard();
    document.getElementById('gameOverMessage').classList.remove('hidden');
    document.getElementById('startRestartButton').textContent = 'Restart Game';
    document.getElementById('startRestartButton').classList.remove('hidden');
    gameState = 'gameOver';
}

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') changeDirection(0, -1);
    if (e.key === 'ArrowDown') changeDirection(0, 1);
    if (e.key === 'ArrowLeft') changeDirection(-1, 0);
    if (e.key === 'ArrowRight') changeDirection(1, 0);
});

document.getElementById('touchControls').addEventListener('click', e => {
    const dir = e.target.dataset.dir;
    if (!dir) return;
    if (dir === 'up') changeDirection(0, -1);
    if (dir === 'down') changeDirection(0, 1);
    if (dir === 'left') changeDirection(-1, 0);
    if (dir === 'right') changeDirection(1, 0);
});

document.getElementById('startRestartButton').addEventListener('click', () => {
    if (gameState === 'ready' || gameState === 'gameOver') {
        startGame();
    }
});

window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        resetBoard();
    }
});

// Initialize scoreboard and wait for user interaction
highScore = parseInt(localStorage.getItem('hoopsHighScore') || '0', 10);
updateScoreboard();
