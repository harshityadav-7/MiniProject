// Snake Mania Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('game-over');
const restartBtn = document.getElementById('restartBtn');

// Level settings
const levels = {
	easy: { speed: 120, grid: 20 },
	medium: { speed: 80, grid: 20 },
	hard: { speed: 50, grid: 20 }
};
let currentLevel = 'easy';

// Responsive canvas size (central area)
function resizeCanvas() {
    const grid = levels[currentLevel].grid;
    // Use a larger portion of the screen for the game
    const minDim = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.85);
    canvas.width = Math.floor(minDim / grid) * grid;
    canvas.height = Math.floor(minDim / grid) * grid;
}
resizeCanvas();
window.addEventListener('resize', () => {
	resizeCanvas();
	if (!gameOver) draw();
});

// Level selector UI
const instructions = document.getElementById('instructions');
const levelSelector = document.createElement('select');
levelSelector.id = 'levelSelector';
['easy', 'medium', 'hard'].forEach(lvl => {
	const opt = document.createElement('option');
	opt.value = lvl;
	opt.textContent = lvl.charAt(0).toUpperCase() + lvl.slice(1);
	levelSelector.appendChild(opt);
});
instructions.appendChild(document.createElement('br'));
instructions.appendChild(document.createTextNode('Select Level: '));
instructions.appendChild(levelSelector);

levelSelector.addEventListener('change', e => {
	currentLevel = e.target.value;
	restartGame();
});

// Game variables
let snake, direction, food, score, gameOver, moveQueue, intervalId, paused = false;

function initGame() {
	resizeCanvas();
	const grid = levels[currentLevel].grid;
	const startX = Math.floor(canvas.width / (2 * grid));
	const startY = Math.floor(canvas.height / (2 * grid));
	snake = [ { x: startX, y: startY } ];
	direction = 'right';
	moveQueue = [];
	score = 0;
	gameOver = false;
	food = spawnFood();
	scoreDisplay.textContent = 'Score: ' + score;
	gameOverDisplay.style.display = 'none';
	restartBtn.style.display = 'none';
	clearInterval(intervalId);
	intervalId = setInterval(gameLoop, levels[currentLevel].speed);
	draw();
}

function spawnFood() {
	const grid = levels[currentLevel].grid;
	const maxX = canvas.width / grid;
	const maxY = canvas.height / grid;
	let newFood;
	do {
		newFood = {
			x: Math.floor(Math.random() * maxX),
			y: Math.floor(Math.random() * maxY)
		};
	} while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
	return newFood;
}

function gameLoop() {
	if (gameOver || paused) return;
	move();
	draw();
}

function move() {
    const grid = levels[currentLevel].grid;
    let dir = direction;
    if (moveQueue.length) dir = moveQueue.shift();
    direction = dir;
    let head = { ...snake[0] };
    if (dir === 'up') head.y--;
    if (dir === 'down') head.y++;
    if (dir === 'left') head.x--;
    if (dir === 'right') head.x++;

    // Wall collision
    if (head.x < 0 || head.x >= canvas.width / grid || head.y < 0 || head.y >= canvas.height / grid) {
        endGame();
        return;
    }
    // Brick wall collision
    if (isWallCollision(head.x, head.y)) {
        endGame();
        return;
    }
    // Self collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        endGame();
        return;
    }
    snake.unshift(head);
    // Food collision
    if (head.x === food.x && head.y === food.y) {
        let scoreInc = 1;
        if (currentLevel === 'medium') scoreInc = 2;
        if (currentLevel === 'hard') scoreInc = 3;
        score += scoreInc;
        scoreDisplay.textContent = 'Score: ' + score;
        food = spawnFood();
    } else {
        snake.pop();
    }
}

function draw() {
    const grid = levels[currentLevel].grid;
    // Set background color that works well with bricks
    ctx.fillStyle = '#f5deb3'; // wheat/tan
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWalls();
    // Draw snake
    snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#0f0' : '#fff';
        ctx.fillRect(seg.x * grid, seg.y * grid, grid, grid);
        ctx.strokeStyle = '#222';
        ctx.strokeRect(seg.x * grid, seg.y * grid, grid, grid);
    });
    // Draw food
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(
        food.x * grid + grid / 2,
        food.y * grid + grid / 2,
        grid / 2.2,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

function drawWalls() {
    const grid = levels[currentLevel].grid;
    ctx.save();
    ctx.fillStyle = '#8B4513'; // brown
    // I-shape wall (vertical center)
    for (let y = 5; y < canvas.height / grid - 5; y++) {
        ctx.fillRect(Math.floor(canvas.width / (2 * grid)) * grid, y * grid, grid, grid);
        ctx.strokeStyle = '#a0522d';
        ctx.strokeRect(Math.floor(canvas.width / (2 * grid)) * grid, y * grid, grid, grid);
    }
    // L-shape wall (top left corner)
    for (let x = 2; x < 8; x++) {
        ctx.fillRect(x * grid, 2 * grid, grid, grid);
        ctx.strokeStyle = '#a0522d';
        ctx.strokeRect(x * grid, 2 * grid, grid, grid);
    }
    for (let y = 2; y < 8; y++) {
        ctx.fillRect(2 * grid, y * grid, grid, grid);
        ctx.strokeStyle = '#a0522d';
        ctx.strokeRect(2 * grid, y * grid, grid, grid);
    }
    ctx.restore();
}

function isWallCollision(x, y) {
    const grid = levels[currentLevel].grid;
    // I-shape wall
    if (x === Math.floor(canvas.width / (2 * grid)) && y >= 5 && y < canvas.height / grid - 5) return true;
    // L-shape wall
    if (y === 2 && x >= 2 && x < 8) return true;
    if (x === 2 && y >= 2 && y < 8) return true;
    return false;
}

function endGame() {
	gameOver = true;
	clearInterval(intervalId);
	gameOverDisplay.style.display = 'block';
	restartBtn.style.display = 'inline-block';
}

function restartGame() {
	initGame();
}

restartBtn.addEventListener('click', restartGame);

// Pause/Resume functionality
function togglePause() {
    paused = !paused;
    if (paused) {
        clearInterval(intervalId);
        document.getElementById('pauseBtn').textContent = 'Resume';
    } else {
        intervalId = setInterval(gameLoop, levels[currentLevel].speed);
        document.getElementById('pauseBtn').textContent = 'Pause';
    }
}

document.getElementById('pauseBtn').addEventListener('click', togglePause);

// Keyboard controls
document.addEventListener('keydown', e => {
    if (gameOver) {
        if (e.key === 'Enter') {
            restartGame();
        }
        return;
    }
    if (e.code === 'Space') {
        togglePause();
        return;
    }
    const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    };
    const newDir = keyMap[e.key];
    if (!newDir) return;
    // Prevent reverse direction
    const opposite = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
    };
    if (snake.length > 1 && newDir === opposite[direction]) return;
    if (!moveQueue.length || moveQueue[moveQueue.length - 1] !== newDir) {
        moveQueue.push(newDir);
    }
});

// Start game
initGame();
