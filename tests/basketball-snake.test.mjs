import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const scriptSource = readFileSync(new URL('../basketball_snake.js', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../basketball_snake.html', import.meta.url), 'utf8');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add(...names) {
      names.forEach((name) => classes.add(name));
    },
    contains(name) {
      return classes.has(name);
    },
    remove(...names) {
      names.forEach((name) => classes.delete(name));
    },
    toggle(name, force) {
      const shouldAdd = force ?? !classes.has(name);
      if (shouldAdd) classes.add(name);
      else classes.delete(name);
      return shouldAdd;
    },
  };
}

function createElement({ classes = [], textContent = '' } = {}) {
  const attributes = new Map();
  const listeners = new Map();

  return {
    classList: createClassList(classes),
    dataset: {},
    parentElement: { clientWidth: 600 },
    style: {},
    textContent,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    querySelector() {
      return null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function createGameHarness() {
  const pauseIcon = createElement();
  const resumeIcon = createElement({ classes: ['hidden'] });

  const elements = {
    closeHowToPlay: createElement(),
    countdown: createElement({ classes: ['hidden'], textContent: '3' }),
    gameCanvas: createElement(),
    gameOverMessage: createElement({ classes: ['hidden'] }),
    highScore: createElement({ textContent: 'High Score: 0' }),
    howToPlayButton: createElement(),
    howToPlayModal: createElement({ classes: ['hidden'] }),
    lives: createElement({ textContent: 'Lives: 3' }),
    loadingMessage: createElement({ classes: ['hidden'] }),
    pauseButton: createElement({ classes: ['hidden'] }),
    pauseOverlay: createElement({ classes: ['hidden'] }),
    score: createElement({ textContent: 'Score: 0' }),
    startRestartButton: createElement({ textContent: 'Start Game' }),
    touchControls: createElement(),
  };

  elements.pauseButton.setAttribute('aria-label', 'Pause Game');
  elements.pauseButton.querySelector = (selector) => ({
    '.pause-icon': pauseIcon,
    '.resume-icon': resumeIcon,
  })[selector] ?? null;
  elements.startRestartButton.setAttribute('aria-label', 'Start Game');

  const canvasContext = {
    arc() {},
    beginPath() {},
    clearRect() {},
    createRadialGradient() {
      return { addColorStop() {} };
    },
    fill() {},
    fillRect() {},
    stroke() {},
  };
  elements.gameCanvas.getContext = () => canvasContext;

  const intervalRecords = [];
  const animationFrameCallbacks = [];
  const windowListeners = new Map();
  const requestAnimationFrame = (callback) => {
    animationFrameCallbacks.push(callback);
    return animationFrameCallbacks.length;
  };

  const fakeWindow = {
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(listener);
    },
    requestAnimationFrame,
  };

  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;

  const context = vm.createContext({
    Math: deterministicMath,
    clearInterval(id) {
      const record = intervalRecords[id - 1];
      if (record) record.active = false;
    },
    clearTimeout() {},
    console,
    document: {
      getElementById(id) {
        return elements[id];
      },
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    performance: { now: () => 0 },
    requestAnimationFrame,
    setInterval(callback, delay) {
      intervalRecords.push({ active: true, callback, delay });
      return intervalRecords.length;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
    window: fakeWindow,
  });

  vm.runInContext(scriptSource, context, { filename: 'basketball_snake.js' });

  return {
    animationFrameCallbacks,
    finishCountdown() {
      const countdownInterval = intervalRecords.find((record) => record.active);
      assert.ok(countdownInterval, 'expected an active countdown interval');
      countdownInterval.callback();
      countdownInterval.callback();
      countdownInterval.callback();
    },
    elements,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    },
    intervalRecords,
    keydown(key, code = '') {
      const event = {
        code,
        defaultPrevented: false,
        key,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      for (const listener of windowListeners.get('keydown') ?? []) listener(event);
      return event;
    },
    load() {
      for (const listener of windowListeners.get('load') ?? []) listener({});
    },
  };
}

test('Space starts one countdown from the ready state', () => {
  const game = createGameHarness();
  game.load();

  const firstSpace = game.keydown(' ', 'Space');
  const secondSpace = game.keydown(' ', 'Space');

  assert.equal(firstSpace.defaultPrevented, true);
  assert.equal(secondSpace.defaultPrevented, true);
  assert.equal(game.evaluate('gameState'), 'countdown');
  assert.equal(game.elements.countdown.classList.contains('hidden'), false);
  assert.equal(game.elements.startRestartButton.classList.contains('hidden'), true);
  assert.equal(game.intervalRecords.length, 1);

  game.finishCountdown();
  assert.equal(game.evaluate('gameState'), 'playing');
  assert.equal(game.elements.countdown.classList.contains('hidden'), true);
  assert.equal(game.animationFrameCallbacks.length, 1);
});

test('Space restarts from game over and restores three lives', () => {
  const game = createGameHarness();
  game.evaluate("gameState = 'gameOver'; lives = 0; score = 8;");
  game.elements.lives.textContent = 'Lives: 0';
  game.elements.score.textContent = 'Score: 8';
  game.elements.gameOverMessage.classList.remove('hidden');

  const event = game.keydown(' ', 'Space');

  assert.equal(event.defaultPrevented, true);
  assert.equal(game.evaluate('gameState'), 'countdown');
  assert.equal(game.evaluate('lives'), 3);
  assert.equal(game.evaluate('score'), 0);
  assert.equal(game.elements.lives.textContent, 'Lives: 3');
  assert.equal(game.elements.score.textContent, 'Score: 0');
  assert.equal(game.elements.gameOverMessage.classList.contains('hidden'), true);
  assert.equal(game.intervalRecords.length, 1);
});

test('P pauses and resumes an active game from the keyboard', () => {
  const game = createGameHarness();
  game.load();
  game.keydown(' ', 'Space');
  game.finishCountdown();
  assert.equal(game.animationFrameCallbacks.length, 1);

  game.keydown('p', 'KeyP');
  assert.equal(game.evaluate('isPaused'), true);
  assert.equal(game.elements.pauseOverlay.classList.contains('hidden'), false);
  assert.equal(game.elements.pauseButton.getAttribute('aria-label'), 'Resume Game');

  game.keydown('p', 'KeyP');
  assert.equal(game.evaluate('isPaused'), false);
  assert.equal(game.elements.pauseOverlay.classList.contains('hidden'), true);
  assert.equal(game.elements.pauseButton.getAttribute('aria-label'), 'Pause Game');
  assert.equal(game.animationFrameCallbacks.length, 1);
});

test('eating food shortens the movement interval and a new run resets it', () => {
  const game = createGameHarness();
  game.evaluate(`
    snake = [{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    food = { x: 2, y: 1 };
    dx = 1;
    dy = 0;
    rows = 30;
    cols = 30;
    gameState = 'playing';
    isPaused = false;
    lastRenderTime = 0;
  `);

  game.evaluate('gameLoop(150)');
  assert.equal(game.evaluate('score'), 1);
  assert.equal(game.evaluate('snake[0].x'), 2);

  game.evaluate('gameLoop(299)');
  assert.equal(game.evaluate('snake[0].x'), 3);

  game.evaluate("init(); gameState = 'playing'; lastRenderTime = 0;");
  const startingX = game.evaluate('snake[0].x');
  game.evaluate('gameLoop(149)');
  assert.equal(game.evaluate('snake[0].x'), startingX);
  game.evaluate('gameLoop(150)');
  assert.equal(game.evaluate('snake[0].x'), startingX + 1);
});

test('handled movement keys prevent page scrolling', () => {
  const game = createGameHarness();
  game.evaluate("gameState = 'playing'; isPaused = false;");

  const arrowEvent = game.keydown('ArrowUp', 'ArrowUp');

  assert.equal(arrowEvent.defaultPrevented, true);
  assert.equal(game.evaluate('dx'), 0);
  assert.equal(game.evaluate('dy'), -1);
});

test('visible game controls keep their accessible names in sync', () => {
  const continueGame = createGameHarness();
  continueGame.evaluate('lives = 2; endGame();');
  assert.equal(continueGame.elements.startRestartButton.textContent, 'Continue');
  assert.equal(continueGame.elements.startRestartButton.getAttribute('aria-label'), 'Continue');

  const restartGame = createGameHarness();
  restartGame.evaluate('lives = 1; endGame();');
  assert.equal(restartGame.elements.startRestartButton.textContent, 'Restart Game');
  assert.equal(restartGame.elements.startRestartButton.getAttribute('aria-label'), 'Restart Game');
});

test('the page does not expose controls for unavailable sounds', () => {
  assert.doesNotMatch(pageSource, /id="soundToggle"|M - Toggle Sound/);
  assert.doesNotMatch(scriptSource, /data:audio\/wav|new Audio\(|toggleSound|soundToggle/);
});
