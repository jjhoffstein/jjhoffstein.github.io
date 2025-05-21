const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let tileSize = 20;
let rows, cols;
let snake;
let food;
let score = 0;
let highScore = parseInt(localStorage.getItem('hoopsHighScore') || '0');
let dx = 0;
let dy = 0;
let gameState = 'ready';
let speed = 150;
let loopId;

document.getElementById('highScore').textContent = 'High Score: ' + highScore;

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
    dx = 1;
    dy = 0;
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    document.getElementById('highScore').classList.remove('hidden');
    document.getElementById('gameOverMessage').classList.add('hidden');
    document.getElementById('startRestartButton').classList.add('hidden');
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
    } else {
        snake.pop();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw snake
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = 'black';
    snake.forEach(seg => {
        const centerX = seg.x * tileSize + tileSize / 2;
        const centerY = seg.y * tileSize + tileSize / 2;
        const r = tileSize / 2 - 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - r, centerY);
        ctx.lineTo(centerX + r, centerY);
        ctx.moveTo(centerX, centerY - r);
        ctx.lineTo(centerX, centerY + r);
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

function changeDirection(newDx, newDy) {
    if (-newDx === dx && -newDy === dy) return; // prevent reverse
    dx = newDx;
    dy = newDy;
}

function endGame() {
    clearTimeout(loopId);
    document.getElementById('gameOverMessage').classList.remove('hidden');
    document.getElementById('startRestartButton').textContent = 'Restart Game';
    document.getElementById('startRestartButton').classList.remove('hidden');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hoopsHighScore', highScore);
        document.getElementById('highScore').textContent = 'High Score: ' + highScore;
    }
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
        init();
        gameState = 'playing';
        gameLoop();
    }
});

window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        init();
    }
});

init();
