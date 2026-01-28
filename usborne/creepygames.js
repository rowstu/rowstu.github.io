/**
 * Creepy Computer Games - Interactive Demos
 * Based on Usborne Creepy Computer Games (1983)
 */

// Computer Nightmare
class NightmareGame {
    constructor() {
        this.score = 0;
        this.missed = 0;
        this.round = 0;
        this.currentNumber = 0;
        this.waiting = false;
        this.timeoutId = null;

        this.numberDisplay = document.getElementById('nightmare-number');
        this.timerBar = document.getElementById('nightmare-timer');
        this.startBtn = document.getElementById('nightmare-start-btn');
        this.scoreDisplay = document.getElementById('nightmare-score');
        this.missedDisplay = document.getElementById('nightmare-missed');
        this.roundDisplay = document.getElementById('nightmare-round');
        this.result = document.getElementById('nightmare-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', e => {
            if (this.waiting && /^[1-9]$/.test(e.key)) {
                this.pressKey(e.key);
            }
        });
    }

    startGame() {
        this.score = 0;
        this.missed = 0;
        this.round = 0;
        this.scoreDisplay.textContent = 0;
        this.missedDisplay.textContent = 0;
        this.roundDisplay.textContent = 0;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        setTimeout(() => this.nextNumber(), 500);
    }

    nextNumber() {
        if (this.round >= 20) {
            this.endGame();
            return;
        }

        this.round++;
        this.roundDisplay.textContent = this.round;
        this.currentNumber = Math.floor(Math.random() * 9) + 1;
        this.numberDisplay.textContent = this.currentNumber;
        this.waiting = true;
        this.timerBar.style.width = '100%';

        let width = 100;
        const interval = setInterval(() => {
            width -= 5;
            this.timerBar.style.width = width + '%';
            if (width <= 0) clearInterval(interval);
        }, 50);

        this.timeoutId = setTimeout(() => {
            if (this.waiting) {
                this.waiting = false;
                this.missed++;
                this.missedDisplay.textContent = this.missed;
                this.result.textContent = 'MISSED!';
                this.result.className = 'failure';
                setTimeout(() => this.nextNumber(), 400);
            }
        }, 1000);
    }

    pressKey(key) {
        if (!this.waiting) return;
        clearTimeout(this.timeoutId);
        this.waiting = false;

        if (parseInt(key) === this.currentNumber) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.result.textContent = 'HIT!';
            this.result.className = 'success';
        } else {
            this.missed++;
            this.missedDisplay.textContent = this.missed;
            this.result.textContent = 'WRONG!';
            this.result.className = 'failure';
        }

        setTimeout(() => this.nextNumber(), 400);
    }

    endGame() {
        this.startBtn.disabled = false;
        this.numberDisplay.textContent = '💀';
        this.result.textContent = `Nightmare over! Score: ${this.score}/20, Missed: ${this.missed}`;
        this.result.className = this.score >= 15 ? 'success' : '';
    }
}

// Number Wizard
class WizardGame {
    constructor() {
        this.die1 = 0;
        this.die2 = 0;
        this.target = 0;

        this.die1Display = document.getElementById('wizard-die1');
        this.die2Display = document.getElementById('wizard-die2');
        this.targetDisplay = document.getElementById('wizard-target');
        this.num1Input = document.getElementById('wizard-num1');
        this.num2Input = document.getElementById('wizard-num2');
        this.checkBtn = document.getElementById('wizard-check-btn');
        this.rollBtn = document.getElementById('wizard-roll-btn');
        this.result = document.getElementById('wizard-result');

        this.init();
    }

    init() {
        this.checkBtn.addEventListener('click', () => this.check());
        this.rollBtn.addEventListener('click', () => this.roll());
        this.roll();
    }

    roll() {
        this.die1 = Math.floor(Math.random() * 6) + 1;
        this.die2 = Math.floor(Math.random() * 6) + 1;
        this.target = this.die1 + this.die2;

        this.die1Display.textContent = this.die1;
        this.die2Display.textContent = this.die2;
        this.targetDisplay.textContent = this.target;
        this.result.textContent = '';
        this.num1Input.value = '';
        this.num2Input.value = '';
    }

    check() {
        const n1 = parseInt(this.num1Input.value);
        const n2 = parseInt(this.num2Input.value);

        if (isNaN(n1) || isNaN(n2) || n1 < 1 || n1 > 9 || n2 < 1 || n2 > 9) {
            this.result.textContent = 'Enter numbers 1-9!';
            this.result.className = 'failure';
            return;
        }

        if (n1 + n2 === this.target) {
            this.result.textContent = '✨ The wizard is impressed! ✨';
            this.result.className = 'success';
        } else {
            this.result.textContent = `🔮 Wrong! ${n1}+${n2}=${n1+n2}, not ${this.target}!`;
            this.result.className = 'failure';
        }
    }
}

// Ghost Guzzler
class GuzzlerGame {
    constructor() {
        this.guzzlerNumber = 1;
        this.score = 0;
        this.lives = 3;
        this.currentGhost = 0;
        this.round = 0;
        this.waiting = false;
        this.timeoutId = null;

        this.ghostNumber = document.getElementById('ghost-number');
        this.guzzlerNum = document.getElementById('guzzler-number');
        this.ghostSprite = document.getElementById('ghost-sprite');
        this.startBtn = document.getElementById('guzzler-start-btn');
        this.scoreDisplay = document.getElementById('guzzler-score');
        this.livesDisplay = document.getElementById('guzzler-lives');
        this.result = document.getElementById('guzzler-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', e => {
            if (!this.waiting) return;
            if (/^[1-9]$/.test(e.key)) {
                this.setNumber(parseInt(e.key));
            } else if (e.key.toLowerCase() === 'x') {
                this.guzzle();
            }
        });
    }

    startGame() {
        this.guzzlerNumber = 1;
        this.score = 0;
        this.lives = 3;
        this.round = 0;
        this.scoreDisplay.textContent = 0;
        this.livesDisplay.textContent = 3;
        this.guzzlerNum.textContent = 1;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        setTimeout(() => this.spawnGhost(), 500);
    }

    spawnGhost() {
        if (this.lives <= 0 || this.round >= 15) {
            this.endGame();
            return;
        }

        this.round++;
        this.currentGhost = Math.floor(Math.random() * 9) + 1;
        this.ghostNumber.textContent = this.currentGhost;
        this.ghostSprite.style.opacity = 1;
        this.waiting = true;

        this.timeoutId = setTimeout(() => {
            if (this.waiting) {
                this.waiting = false;
                this.lives--;
                this.livesDisplay.textContent = this.lives;
                this.result.textContent = 'Ghost escaped!';
                this.result.className = 'failure';
                this.ghostSprite.style.opacity = 0.3;
                setTimeout(() => this.spawnGhost(), 500);
            }
        }, 2000);
    }

    setNumber(num) {
        this.guzzlerNumber = num;
        this.guzzlerNum.textContent = num;
    }

    guzzle() {
        if (!this.waiting) return;
        clearTimeout(this.timeoutId);
        this.waiting = false;

        if (this.guzzlerNumber === this.currentGhost) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.result.textContent = 'GUZZLED! 👻';
            this.result.className = 'success';
        } else {
            this.lives--;
            this.livesDisplay.textContent = this.lives;
            this.result.textContent = `Wrong number! Ghost was ${this.currentGhost}`;
            this.result.className = 'failure';
        }

        this.ghostSprite.style.opacity = 0.3;
        setTimeout(() => this.spawnGhost(), 500);
    }

    endGame() {
        this.startBtn.disabled = false;
        this.ghostNumber.textContent = '?';
        this.result.textContent = `Game over! Guzzled ${this.score} ghosts!`;
        this.result.className = this.score >= 10 ? 'success' : '';
    }
}

// Spiderwoman
class SpiderGame {
    constructor() {
        this.secretLetter = '';
        this.guesses = 10;

        this.speech = document.getElementById('spider-speech');
        this.wordInput = document.getElementById('spider-word');
        this.checkWordBtn = document.getElementById('spider-check-btn');
        this.guessInput = document.getElementById('spider-guess');
        this.guessBtn = document.getElementById('spider-guess-btn');
        this.newBtn = document.getElementById('spider-new-btn');
        this.guessesDisplay = document.getElementById('spider-guesses');
        this.result = document.getElementById('spider-result');

        this.init();
    }

    init() {
        this.checkWordBtn.addEventListener('click', () => this.checkWord());
        this.guessBtn.addEventListener('click', () => this.guessLetter());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.wordInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.checkWord(); });
        this.guessInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.guessLetter(); });
        this.startGame();
    }

    startGame() {
        this.secretLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        this.guesses = 10;
        this.guessesDisplay.textContent = 10;
        this.speech.textContent = '"I\'m thinking of a letter..."';
        this.result.textContent = '';
        this.wordInput.value = '';
        this.guessInput.value = '';
    }

    checkWord() {
        const word = this.wordInput.value.toUpperCase();
        if (!word) return;

        if (word.includes(this.secretLetter)) {
            this.speech.textContent = '"Yesss... that word contains my letter..."';
        } else {
            this.speech.textContent = '"No... my letter is not in that word..."';
        }
        this.wordInput.value = '';
    }

    guessLetter() {
        const letter = this.guessInput.value.toUpperCase();
        if (!/^[A-Z]$/.test(letter)) {
            this.result.textContent = 'Enter a single letter!';
            return;
        }

        this.guesses--;
        this.guessesDisplay.textContent = this.guesses;
        this.guessInput.value = '';

        if (letter === this.secretLetter) {
            this.speech.textContent = '"NOOOO! You guessed it!"';
            this.result.textContent = 'You escape the web!';
            this.result.className = 'success';
            return;
        }

        if (this.guesses <= 0) {
            this.speech.textContent = `"Hahahaha! It was ${this.secretLetter}!"`;
            this.result.textContent = 'You\'re turned into a fly! 🪰';
            this.result.className = 'failure';
            return;
        }

        this.speech.textContent = '"Wrong! Keep trying, little prey..."';
    }
}

// Grave Digger
class GraveGame {
    constructor() {
        this.size = 8;
        this.player = { x: 0, y: 0 };
        this.skeleton = { x: 7, y: 7 };
        this.exit = { x: 7, y: 0 };
        this.holes = new Set();
        this.gameActive = false;

        this.grid = document.getElementById('grave-grid');
        this.startBtn = document.getElementById('grave-start-btn');
        this.digBtn = document.getElementById('grave-dig-btn');
        this.result = document.getElementById('grave-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.digBtn.addEventListener('click', () => this.dig());
        document.addEventListener('keydown', e => {
            if (!this.gameActive) return;
            if (['w','a','s','d'].includes(e.key.toLowerCase())) {
                this.move(e.key);
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.dig();
            }
        });
        this.render();
    }

    startGame() {
        this.player = { x: 0, y: 0 };
        this.skeleton = { x: 7, y: 7 };
        this.holes = new Set();
        this.gameActive = true;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.digBtn.disabled = false;
        this.render();
    }

    move(direction) {
        const moves = { 'w': {x:0,y:-1}, 'a': {x:-1,y:0}, 's': {x:0,y:1}, 'd': {x:1,y:0} };
        const m = moves[direction.toLowerCase()];
        if (!m) return;

        const newX = this.player.x + m.x;
        const newY = this.player.y + m.y;

        if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size) {
            this.player.x = newX;
            this.player.y = newY;
        }

        this.moveSkeleton();
        this.checkState();
        this.render();
    }

    dig() {
        if (!this.gameActive) return;
        this.holes.add(`${this.player.x},${this.player.y}`);
        this.moveSkeleton();
        this.checkState();
        this.render();
    }

    moveSkeleton() {
        if (this.skeleton.x < 0) return; // Already trapped

        let dx = 0, dy = 0;
        if (this.skeleton.x < this.player.x) dx = 1;
        else if (this.skeleton.x > this.player.x) dx = -1;
        if (this.skeleton.y < this.player.y) dy = 1;
        else if (this.skeleton.y > this.player.y) dy = -1;

        // Move in one direction only (simpler AI)
        if (Math.random() > 0.5 && dx !== 0) {
            this.skeleton.x += dx;
        } else if (dy !== 0) {
            this.skeleton.y += dy;
        } else if (dx !== 0) {
            this.skeleton.x += dx;
        }
    }

    checkState() {
        // Check if skeleton in hole
        if (this.holes.has(`${this.skeleton.x},${this.skeleton.y}`)) {
            this.skeleton = { x: -10, y: -10 };
            this.result.textContent = 'Skeleton trapped!';
        }

        // Check win
        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            this.gameActive = false;
            this.result.textContent = 'ESCAPED! You survived!';
            this.result.className = 'success';
            this.startBtn.disabled = false;
            this.digBtn.disabled = true;
            return;
        }

        // Check lose
        if (this.player.x === this.skeleton.x && this.player.y === this.skeleton.y) {
            this.gameActive = false;
            this.result.textContent = 'CAUGHT! The skeleton got you!';
            this.result.className = 'failure';
            this.startBtn.disabled = false;
            this.digBtn.disabled = true;
        }
    }

    render() {
        this.grid.innerHTML = '';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'grave-cell';

                if (x === this.player.x && y === this.player.y) {
                    cell.textContent = '😱';
                    cell.classList.add('player');
                } else if (x === this.skeleton.x && y === this.skeleton.y) {
                    cell.textContent = '💀';
                    cell.classList.add('skeleton');
                } else if (x === this.exit.x && y === this.exit.y) {
                    cell.textContent = '🚪';
                    cell.classList.add('exit');
                } else if (this.holes.has(`${x},${y}`)) {
                    cell.textContent = '⚫';
                    cell.classList.add('hole');
                } else {
                    cell.textContent = '·';
                }

                this.grid.appendChild(cell);
            }
        }
    }
}

// Ghost Maze (simplified)
class MazeGame {
    constructor() {
        this.size = 8;
        this.player = { x: 0, y: 0, dir: 0 }; // dir: 0=N, 1=E, 2=S, 3=W
        this.exit = { x: 7, y: 7 };
        this.maze = [];
        this.gameActive = false;

        this.view = document.getElementById('maze-perspective');
        this.minimap = document.getElementById('maze-minimap');
        this.startBtn = document.getElementById('maze-start-btn');
        this.forwardBtn = document.getElementById('maze-forward');
        this.leftBtn = document.getElementById('maze-left');
        this.rightBtn = document.getElementById('maze-right');
        this.result = document.getElementById('maze-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.forwardBtn.addEventListener('click', () => this.moveForward());
        this.leftBtn.addEventListener('click', () => this.turnLeft());
        this.rightBtn.addEventListener('click', () => this.turnRight());

        document.addEventListener('keydown', e => {
            if (!this.gameActive) return;
            if (e.key === 'ArrowUp' || e.key === 'w') this.moveForward();
            if (e.key === 'ArrowLeft' || e.key === 'a') this.turnLeft();
            if (e.key === 'ArrowRight' || e.key === 'd') this.turnRight();
        });

        this.generateMaze();
        this.render();
    }

    generateMaze() {
        // Simple maze generation
        this.maze = [];
        for (let y = 0; y < this.size; y++) {
            this.maze[y] = [];
            for (let x = 0; x < this.size; x++) {
                // Random walls, but ensure path exists
                this.maze[y][x] = Math.random() < 0.25 ? 1 : 0;
            }
        }
        // Clear start and end
        this.maze[0][0] = 0;
        this.maze[7][7] = 0;
        this.maze[0][1] = 0;
        this.maze[1][0] = 0;
        this.maze[7][6] = 0;
        this.maze[6][7] = 0;
    }

    startGame() {
        this.generateMaze();
        this.player = { x: 0, y: 0, dir: 1 }; // Face East
        this.gameActive = true;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.forwardBtn.disabled = false;
        this.leftBtn.disabled = false;
        this.rightBtn.disabled = false;
        this.render();
    }

    moveForward() {
        const dirs = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];
        const d = dirs[this.player.dir];
        const newX = this.player.x + d.x;
        const newY = this.player.y + d.y;

        if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size && this.maze[newY][newX] === 0) {
            this.player.x = newX;
            this.player.y = newY;
        } else {
            this.result.textContent = 'Blocked!';
        }

        this.checkWin();
        this.render();
    }

    turnLeft() {
        this.player.dir = (this.player.dir + 3) % 4;
        this.render();
    }

    turnRight() {
        this.player.dir = (this.player.dir + 1) % 4;
        this.render();
    }

    checkWin() {
        if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
            this.gameActive = false;
            this.result.textContent = 'ESCAPED! You found the exit!';
            this.result.className = 'success';
            this.startBtn.disabled = false;
            this.forwardBtn.disabled = true;
            this.leftBtn.disabled = true;
            this.rightBtn.disabled = true;
        }
    }

    render() {
        // First-person view
        const dirs = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];
        const d = dirs[this.player.dir];
        const fx = this.player.x + d.x;
        const fy = this.player.y + d.y;

        let viewText = '';
        if (fx < 0 || fx >= this.size || fy < 0 || fy >= this.size || this.maze[fy][fx] === 1) {
            viewText = '🧱 WALL';
        } else if (fx === this.exit.x && fy === this.exit.y) {
            viewText = '🚪 EXIT!';
        } else {
            viewText = '➡️ PATH';
        }
        this.view.textContent = viewText;

        // Minimap
        this.minimap.innerHTML = '';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'minimap-cell';
                if (x === this.player.x && y === this.player.y) {
                    cell.classList.add('player');
                } else if (x === this.exit.x && y === this.exit.y) {
                    cell.classList.add('exit');
                } else if (this.maze[y][x] === 1) {
                    cell.classList.add('wall');
                }
                this.minimap.appendChild(cell);
            }
        }
    }
}

// Séance
class SeanceGame {
    constructor() {
        this.sequence = [];
        this.level = 4;
        this.currentIndex = 0;
        this.phase = 'idle';

        this.board = document.getElementById('seance-board');
        this.startBtn = document.getElementById('seance-start-btn');
        this.input = document.getElementById('seance-input');
        this.levelDisplay = document.getElementById('seance-level');
        this.result = document.getElementById('seance-result');

        this.init();
    }

    init() {
        // Create ouija board
        for (let i = 0; i < 26; i++) {
            const letter = document.createElement('div');
            letter.className = 'ouija-letter';
            letter.textContent = String.fromCharCode(65 + i);
            letter.dataset.letter = String.fromCharCode(65 + i);
            this.board.appendChild(letter);
        }

        this.startBtn.addEventListener('click', () => this.startRound());
        this.input.addEventListener('input', () => this.checkInput());
    }

    startRound() {
        this.sequence = [];
        this.currentIndex = 0;
        this.result.textContent = '';
        this.input.value = '';
        this.input.disabled = true;
        this.startBtn.disabled = true;

        // Generate sequence
        for (let i = 0; i < this.level; i++) {
            this.sequence.push(String.fromCharCode(Math.floor(Math.random() * 26) + 65));
        }

        this.phase = 'showing';
        this.showSequence();
    }

    async showSequence() {
        for (const letter of this.sequence) {
            const el = this.board.querySelector(`[data-letter="${letter}"]`);
            el.classList.add('active');
            await this.delay(600);
            el.classList.remove('active');
            await this.delay(200);
        }

        this.phase = 'input';
        this.input.disabled = false;
        this.input.focus();
        this.result.textContent = 'Type the sequence...';
    }

    checkInput() {
        const typed = this.input.value.toUpperCase();
        const expected = this.sequence.slice(0, typed.length).join('');

        if (typed !== expected) {
            this.phase = 'idle';
            this.input.disabled = true;
            this.startBtn.disabled = false;
            this.result.textContent = `Spirit angered! Sequence was: ${this.sequence.join(' ')}`;
            this.result.className = 'failure';
            this.level = 4;
            this.levelDisplay.textContent = this.level;
            return;
        }

        if (typed.length === this.sequence.length) {
            this.phase = 'idle';
            this.input.disabled = true;
            this.startBtn.disabled = false;
            this.level++;
            this.levelDisplay.textContent = this.level;
            this.result.textContent = 'The spirit is pleased! Level up!';
            this.result.className = 'success';
        }
    }

    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new NightmareGame();
    new WizardGame();
    new GuzzlerGame();
    new SpiderGame();
    new GraveGame();
    new MazeGame();
    new SeanceGame();

    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    });

    console.log('👻 Creepy Computer Games loaded! Enter if you dare...');
});
