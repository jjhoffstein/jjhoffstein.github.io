const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let tileSize = 20;
let rows, cols;
let snake;
let food;
let score = 0;
let lives = 3;
let highScore = 0;
let dx = 0;
let dy = 0;
let gameState = 'ready';
let speed = 150;
let loopId;

function initGame() {
    highScore = parseInt(localStorage.getItem('basketballSnakeHighScore')) || 0;
    lives = 3;
    score = 0;
    updateUI();
    document.getElementById('gameOverMessage').classList.add('hidden');
    document.getElementById('startRestartButton').classList.add('hidden');
    resetRound();
}

function resetRound() {
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

function gameLoop() {
    loopId = setTimeout(() => {
        requestAnimationFrame(gameLoop);
    }, speed);
    update();
    draw();
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        handleLifeLoss();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('basketballSnakeHighScore', highScore);
        }
        updateUI();
        placeFood();
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw snake
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = 'black';
    snake.forEach((seg, index) => {
        ctx.beginPath();
        ctx.arc(seg.x * tileSize + tileSize / 2, seg.y * tileSize + tileSize / 2, tileSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    // food
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
    // ensure not on snake
    if (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
        placeFood();
    }
}

function updateUI() {
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    document.getElementById('highScore').textContent = 'High Score: ' + highScore;
}

function changeDirection(newDx, newDy) {
    if (-newDx === dx && -newDy === dy) return; // prevent reverse
    dx = newDx;
    dy = newDy;
}

function handleLifeLoss() {
    lives--;
    if (lives > 0) {
        updateUI();
        resetRound();
    } else {
        endGame();
    }
}

function endGame() {
    clearTimeout(loopId);
    document.getElementById('gameOverMessage').classList.remove('hidden');
    document.getElementById('startRestartButton').textContent = 'Restart Game';
    document.getElementById('startRestartButton').classList.remove('hidden');
    updateUI();
    gameState = 'gameOver';
}

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') changeDirection(0, -1);
    if (e.key === 'ArrowDown') changeDirection(0, 1);
    if (e.key === 'ArrowLeft') changeDirection(-1, 0);
    if (e.key === 'ArrowRight') changeDirection(1, 0);
});

document.getElementById('touchControls').addEventListener('click', e => {
    if (e.target.dataset.dir) {
        if (e.target.dataset.dir === 'up') changeDirection(0, -1);
        if (e.target.dataset.dir === 'down') changeDirection(0, 1);
        if (e.target.dataset.dir === 'left') changeDirection(-1, 0);
        if (e.target.dataset.dir === 'right') changeDirection(1, 0);
    }
});

document.getElementById('startRestartButton').addEventListener('click', () => {
    if (gameState === 'ready' || gameState === 'gameOver') {
        initGame();
        gameState = 'playing';
        gameLoop();
    }
});

window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        resetRound();
    }
});

initGame();
