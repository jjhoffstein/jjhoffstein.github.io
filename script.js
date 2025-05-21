// Basketball Snake Game Logic
// Uses requestAnimationFrame for smooth gameplay and stores high scores in localStorage.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 20; // size of each grid cell
let rows, cols;
let snake = [];
let food = {x: 0, y: 0};
let score = 0;
let highScore = 0;
let dx = 1; // initial direction (right)
let dy = 0;
let gameState = 'ready';
let lastRenderTime = 0;
let speed = 150; // milliseconds between moves

// adjust canvas to parent size
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.width;
    rows = Math.floor(canvas.height / tileSize);
    cols = Math.floor(canvas.width / tileSize);
}

// place snake, food, and reset score
function resetGame() {
    resizeCanvas();
    snake = [
        { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
        { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) },
        { x: Math.floor(cols / 2) - 2, y: Math.floor(rows / 2) }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    document.getElementById('gameOverMessage').classList.add('hidden');
    placeFood();
    updateScore();
    lastRenderTime = 0;
}

function loadHighScore() {
    const stored = localStorage.getItem('basketballSnakeHighScore');
    if (stored) {
        highScore = parseInt(stored, 10);
        document.getElementById('highScore').classList.remove('hidden');
    }
    updateScore();
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
}

function startGame() {
    if (gameState === 'playing') return;
    gameState = 'playing';
    document.getElementById('startRestartButton').classList.add('hidden');
    resetGame();
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (gameState !== 'playing') return;
    if (currentTime - lastRenderTime > speed) {
        update();
        draw();
        lastRenderTime = currentTime;
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    // check collisions with walls or self
    if (
        head.x < 0 || head.y < 0 ||
        head.x >= cols || head.y >= rows ||
        snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
        endGame();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        if (score % 5 === 0 && speed > 60) speed -= 10; // speed up slowly
        updateScore();
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
    do {
        food.x = Math.floor(Math.random() * cols);
        food.y = Math.floor(Math.random() * rows);
    } while (snake.some(seg => seg.x === food.x && seg.y === food.y));
}

function changeDirection(newDx, newDy) {
    if (-newDx === dx && -newDy === dy) return; // prevent reversing
    dx = newDx;
    dy = newDy;
}

function endGame() {
    gameState = 'gameOver';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('basketballSnakeHighScore', highScore);
    }
    updateScore();
    document.getElementById('gameOverMessage').classList.remove('hidden');
    const btn = document.getElementById('startRestartButton');
    btn.textContent = 'Restart Game';
    btn.classList.remove('hidden');
}

// input handlers
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') changeDirection(0, -1);
    else if (e.key === 'ArrowDown') changeDirection(0, 1);
    else if (e.key === 'ArrowLeft') changeDirection(-1, 0);
    else if (e.key === 'ArrowRight') changeDirection(1, 0);
});

document.getElementById('touchControls').addEventListener('click', e => {
    const dir = e.target.dataset.dir;
    if (!dir) return;
    if (dir === 'up') changeDirection(0, -1);
    if (dir === 'down') changeDirection(0, 1);
    if (dir === 'left') changeDirection(-1, 0);
    if (dir === 'right') changeDirection(1, 0);
});

// button event
document.getElementById('startRestartButton').addEventListener('click', startGame);

// resize handler
window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        resetGame();
    } else {
        resizeCanvas();
    }
});

// initial setup
resizeCanvas();
loadHighScore();

