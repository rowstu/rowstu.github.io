/**
 * Computer Battlegames - Interactive Demos
 * Based on Usborne Computer Battlegames (1982)
 */

// ==========================================
// ROBOT MISSILE GAME
// ==========================================
class RobotMissileGame {
    constructor() {
        this.secretCode = '';
        this.guessesLeft = 4;
        this.gameActive = false;

        this.input = document.getElementById('missile-input');
        this.guessBtn = document.getElementById('missile-guess-btn');
        this.startBtn = document.getElementById('missile-start-btn');
        this.status = document.getElementById('missile-status');
        this.guessesDisplay = document.getElementById('missile-guesses');
        this.hint = document.getElementById('missile-hint');
        this.result = document.getElementById('missile-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.guessBtn.addEventListener('click', () => this.makeGuess());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
    }

    startGame() {
        this.secretCode = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        this.guessesLeft = 4;
        this.gameActive = true;

        this.status.textContent = 'ARMED';
        this.status.style.color = '#ff3333';
        this.guessesDisplay.textContent = this.guessesLeft;
        this.hint.textContent = '';
        this.result.textContent = '';
        this.result.className = '';
        this.input.value = '';
        this.input.focus();
    }

    makeGuess() {
        if (!this.gameActive) return;

        const guess = this.input.value.toUpperCase();
        if (!/^[A-Z]$/.test(guess)) {
            this.hint.textContent = 'Enter a single letter A-Z';
            return;
        }

        this.guessesLeft--;
        this.guessesDisplay.textContent = this.guessesLeft;
        this.input.value = '';

        if (guess === this.secretCode) {
            this.gameActive = false;
            this.status.textContent = 'DISARMED';
            this.status.style.color = '#00ff00';
            this.result.textContent = 'MISSILE DISARMED! You saved the city!';
            this.result.className = 'success';
            return;
        }

        if (this.guessesLeft === 0) {
            this.gameActive = false;
            this.status.textContent = 'LAUNCHED!';
            this.result.textContent = `MISSILE LAUNCHED! The code was: ${this.secretCode}`;
            this.result.className = 'failure';
            return;
        }

        this.hint.textContent = guess < this.secretCode
            ? 'The code is LATER in the alphabet'
            : 'The code is EARLIER in the alphabet';
    }
}

// ==========================================
// VITAL MESSAGE GAME
// ==========================================
class VitalMessageGame {
    constructor() {
        this.message = '';
        this.gamePhase = 'idle';

        this.messageText = document.getElementById('vital-message-text');
        this.difficulty = document.getElementById('vital-difficulty');
        this.startBtn = document.getElementById('vital-start-btn');
        this.inputArea = document.getElementById('vital-input-area');
        this.answerInput = document.getElementById('vital-answer');
        this.submitBtn = document.getElementById('vital-submit-btn');
        this.result = document.getElementById('vital-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
    }

    startGame() {
        const length = parseInt(this.difficulty.value) || 4;
        this.message = '';
        for (let i = 0; i < length; i++) {
            this.message += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        }

        this.result.textContent = '';
        this.result.className = '';
        this.inputArea.style.display = 'none';
        this.answerInput.value = '';
        this.startBtn.disabled = true;

        // Show message
        this.messageText.textContent = this.message;
        this.messageText.style.color = '#00ff00';

        // Hide after delay based on difficulty
        const displayTime = Math.max(1000, 3000 - (length * 200));
        setTimeout(() => {
            this.messageText.textContent = '???';
            this.messageText.style.color = '#ff3333';
            this.inputArea.style.display = 'block';
            this.answerInput.focus();
        }, displayTime);

        setTimeout(() => {
            this.startBtn.disabled = false;
        }, displayTime + 500);
    }

    checkAnswer() {
        const answer = this.answerInput.value.toUpperCase();

        if (answer === this.message) {
            this.result.textContent = 'CORRECT! Message received!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `WRONG! The message was: ${this.message}`;
            this.result.className = 'failure';
        }

        this.inputArea.style.display = 'none';
    }
}

// ==========================================
// SHOOTOUT GAME
// ==========================================
class ShootoutGame {
    constructor() {
        this.phase = 'idle';
        this.canShoot = false;

        this.countDisplay = document.getElementById('shootout-count');
        this.statusDisplay = document.getElementById('shootout-status');
        this.startBtn = document.getElementById('shootout-start-btn');
        this.result = document.getElementById('shootout-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.phase !== 'idle') {
                e.preventDefault();
                this.shoot();
            }
        });
    }

    async startGame() {
        this.phase = 'countdown';
        this.canShoot = false;
        this.startBtn.disabled = true;
        this.result.textContent = '';
        this.result.className = '';
        this.statusDisplay.textContent = 'Ten paces...';

        // Countdown
        for (let i = 10; i >= 1; i--) {
            if (this.phase === 'ended') return;
            this.countDisplay.textContent = i;
            await this.delay(400);
        }

        if (this.phase === 'ended') return;

        // Random delay before draw
        this.phase = 'delay';
        this.countDisplay.textContent = '...';
        this.statusDisplay.textContent = 'Turn around...';

        const delayTime = Math.random() * 2000 + 1000;
        await this.delay(delayTime);

        if (this.phase === 'ended') return;

        // DRAW!
        this.phase = 'draw';
        this.canShoot = true;
        this.countDisplay.textContent = 'DRAW!';
        this.countDisplay.style.color = '#ff3333';
        this.statusDisplay.textContent = 'SHOOT NOW!';

        // Timeout for shooting
        await this.delay(600);

        if (this.phase === 'draw') {
            this.phase = 'ended';
            this.result.textContent = 'TOO SLOW - YOU LOSE!';
            this.result.className = 'failure';
            this.endGame();
        }
    }

    shoot() {
        if (this.phase === 'draw' && this.canShoot) {
            this.phase = 'ended';
            this.result.textContent = 'BANG! YOU WIN!';
            this.result.className = 'success';
            this.endGame();
        } else if (this.phase !== 'ended' && this.phase !== 'idle') {
            this.phase = 'ended';
            this.result.textContent = 'TOO EARLY! Disqualified!';
            this.result.className = 'failure';
            this.endGame();
        }
    }

    endGame() {
        this.startBtn.disabled = false;
        this.countDisplay.style.color = '#ffcc00';
    }

    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

// ==========================================
// DESERT TANK BATTLE
// ==========================================
class DesertTankGame {
    constructor() {
        this.canvas = document.getElementById('tank-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.targetX = 0;
        this.targetY = 0;
        this.missiles = 5;
        this.shots = [];
        this.gameActive = false;

        this.dirInput = document.getElementById('tank-direction');
        this.elvInput = document.getElementById('tank-elevation');
        this.fireBtn = document.getElementById('tank-fire-btn');
        this.newBtn = document.getElementById('tank-new-btn');
        this.missilesDisplay = document.getElementById('tank-missiles');
        this.hint = document.getElementById('tank-hint');
        this.result = document.getElementById('tank-result');

        this.init();
    }

    init() {
        this.fireBtn.addEventListener('click', () => this.fire());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.startGame();
    }

    startGame() {
        this.targetX = Math.floor(Math.random() * 80) - 40;
        this.targetY = Math.floor(Math.random() * 80) + 20;
        this.missiles = 5;
        this.shots = [];
        this.gameActive = true;

        this.missilesDisplay.textContent = this.missiles;
        this.hint.textContent = 'Fire at the hidden enemy base!';
        this.result.textContent = '';
        this.result.className = '';

        this.draw();
    }

    fire() {
        if (!this.gameActive || this.missiles <= 0) return;

        const direction = parseFloat(this.dirInput.value) || 0;
        const elevation = parseFloat(this.elvInput.value) || 45;

        // Convert to radians
        const dirRad = direction * Math.PI / 180;
        const elvRad = elevation * Math.PI / 180;

        // Calculate landing
        const dist = 100 * Math.tan(elvRad);
        const landX = Math.round(dist * Math.sin(dirRad));
        const landY = Math.round(dist * Math.cos(dirRad));

        this.shots.push({ x: landX, y: landY });
        this.missiles--;
        this.missilesDisplay.textContent = this.missiles;

        // Check hit
        const hitX = Math.abs(landX - this.targetX) < 8;
        const hitY = Math.abs(landY - this.targetY) < 8;

        if (hitX && hitY) {
            this.gameActive = false;
            this.result.textContent = 'DIRECT HIT! Enemy destroyed!';
            this.result.className = 'success';
            this.draw(true);
            return;
        }

        // Hints
        const hints = [];
        if (landX < this.targetX - 5) hints.push('Aim more RIGHT');
        else if (landX > this.targetX + 5) hints.push('Aim more LEFT');
        if (landY < this.targetY - 5) hints.push('Shot SHORT');
        else if (landY > this.targetY + 5) hints.push('Shot LONG');

        this.hint.textContent = hints.join(' | ') || 'Getting close!';

        if (this.missiles <= 0) {
            this.gameActive = false;
            this.result.textContent = `Out of missiles! Target was at (${this.targetX}, ${this.targetY})`;
            this.result.className = 'failure';
            this.draw(true);
        } else {
            this.draw();
        }
    }

    draw(showTarget = false) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background - desert
        ctx.fillStyle = '#2a2000';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w / 10, 0);
            ctx.lineTo(i * w / 10, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h / 10);
            ctx.lineTo(w, i * h / 10);
            ctx.stroke();
        }

        // Convert coordinates to canvas
        const toCanvasX = (x) => (x + 50) * w / 100;
        const toCanvasY = (y) => h - (y * h / 100);

        // Draw shots
        ctx.fillStyle = '#ff6600';
        this.shots.forEach(shot => {
            ctx.beginPath();
            ctx.arc(toCanvasX(shot.x), toCanvasY(shot.y), 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw target if revealed
        if (showTarget) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(toCanvasX(this.targetX), toCanvasY(this.targetY), 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.font = '12px monospace';
            ctx.fillText('TARGET', toCanvasX(this.targetX) - 20, toCanvasY(this.targetY) - 15);
        }

        // Draw tank (at bottom center)
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(w/2 - 15, h - 30, 30, 20);
        ctx.fillRect(w/2 - 5, h - 40, 10, 15);

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('N', w/2, 15);
        ctx.fillText('W', 5, h/2);
        ctx.fillText('E', w - 15, h/2);
    }
}

// ==========================================
// TRAITOR'S CASTLE
// ==========================================
class CastleGame {
    constructor() {
        this.score = 0;
        this.round = 0;
        this.maxRounds = 10;
        this.currentPosition = 0;
        this.waitingForInput = false;
        this.timeoutId = null;

        this.positions = document.querySelectorAll('#castle-positions .position');
        this.startBtn = document.getElementById('castle-start-btn');
        this.scoreDisplay = document.getElementById('castle-score');
        this.roundDisplay = document.getElementById('castle-round');
        this.result = document.getElementById('castle-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 8 && this.waitingForInput) {
                this.shoot(num);
            }
        });

        this.positions.forEach(pos => {
            pos.addEventListener('click', () => {
                const num = parseInt(pos.dataset.pos);
                if (this.waitingForInput) this.shoot(num);
            });
        });
    }

    startGame() {
        this.score = 0;
        this.round = 0;
        this.scoreDisplay.textContent = this.score;
        this.roundDisplay.textContent = this.round;
        this.result.textContent = '';
        this.result.className = '';
        this.startBtn.disabled = true;

        this.nextRound();
    }

    nextRound() {
        if (this.round >= this.maxRounds) {
            this.endGame();
            return;
        }

        this.round++;
        this.roundDisplay.textContent = this.round;

        // Clear all positions
        this.positions.forEach(p => p.classList.remove('active'));

        // Short delay before showing soldier
        setTimeout(() => {
            this.currentPosition = Math.floor(Math.random() * 8) + 1;
            this.positions[this.currentPosition - 1].classList.add('active');
            this.waitingForInput = true;

            // Timeout - soldier disappears
            this.timeoutId = setTimeout(() => {
                if (this.waitingForInput) {
                    this.waitingForInput = false;
                    this.result.textContent = 'MISSED!';
                    this.result.className = 'failure';
                    this.positions[this.currentPosition - 1].classList.remove('active');
                    setTimeout(() => this.nextRound(), 500);
                }
            }, 1200);
        }, 500);
    }

    shoot(position) {
        if (!this.waitingForInput) return;

        clearTimeout(this.timeoutId);
        this.waitingForInput = false;
        this.positions[this.currentPosition - 1].classList.remove('active');

        if (position === this.currentPosition) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.result.textContent = 'HIT!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `MISS! It was position ${this.currentPosition}`;
            this.result.className = 'failure';
        }

        setTimeout(() => this.nextRound(), 500);
    }

    endGame() {
        this.startBtn.disabled = false;
        this.result.textContent = `Battle over! Final score: ${this.score}/${this.maxRounds}`;
        this.result.className = this.score >= 7 ? 'success' : '';
    }
}

// ==========================================
// ROBOT INVADERS
// ==========================================
class InvadersGame {
    constructor() {
        this.score = 0;
        this.invader = 0;
        this.totalInvaders = 25;
        this.currentSymbol = '';
        this.waitingForInput = false;
        this.timeoutId = null;
        this.timerWidth = 100;
        this.timerInterval = null;

        this.symbolDisplay = document.getElementById('invader-symbol');
        this.timerBar = document.getElementById('invader-timer');
        this.startBtn = document.getElementById('invaders-start-btn');
        this.scoreDisplay = document.getElementById('invaders-score');
        this.countDisplay = document.getElementById('invaders-count');
        this.result = document.getElementById('invaders-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => {
            if (this.waitingForInput && /^[a-zA-Z]$/.test(e.key)) {
                this.shoot(e.key);
            }
        });
    }

    startGame() {
        this.score = 0;
        this.invader = 0;
        this.scoreDisplay.textContent = this.score;
        this.countDisplay.textContent = this.invader;
        this.result.textContent = '';
        this.result.className = '';
        this.startBtn.disabled = true;
        this.symbolDisplay.textContent = '!';

        setTimeout(() => this.nextInvader(), 500);
    }

    nextInvader() {
        if (this.invader >= this.totalInvaders) {
            this.endGame();
            return;
        }

        this.invader++;
        this.countDisplay.textContent = this.invader;

        this.currentSymbol = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        this.symbolDisplay.textContent = this.currentSymbol;
        this.waitingForInput = true;

        // Timer bar animation
        this.timerWidth = 100;
        this.timerBar.style.width = '100%';
        this.timerInterval = setInterval(() => {
            this.timerWidth -= 5;
            this.timerBar.style.width = this.timerWidth + '%';
        }, 50);

        // Timeout
        this.timeoutId = setTimeout(() => {
            if (this.waitingForInput) {
                this.waitingForInput = false;
                clearInterval(this.timerInterval);
                this.result.textContent = 'ESCAPED!';
                setTimeout(() => this.nextInvader(), 300);
            }
        }, 1000);
    }

    shoot(key) {
        if (!this.waitingForInput) return;

        clearTimeout(this.timeoutId);
        clearInterval(this.timerInterval);
        this.waitingForInput = false;

        if (key.toUpperCase() === this.currentSymbol) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.result.textContent = 'HIT!';
            this.result.className = 'success';
        } else {
            this.result.textContent = 'MISS!';
            this.result.className = 'failure';
        }

        setTimeout(() => this.nextInvader(), 300);
    }

    endGame() {
        this.startBtn.disabled = false;
        this.symbolDisplay.textContent = '?';
        const percentage = Math.round(this.score / this.totalInvaders * 100);
        this.result.textContent = `Invasion complete! Score: ${this.score}/${this.totalInvaders} (${percentage}%)`;
        this.result.className = percentage >= 70 ? 'success' : '';
    }
}

// ==========================================
// SECRET WEAPON
// ==========================================
class SecretWeaponGame {
    constructor() {
        this.canvas = document.getElementById('weapon-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.targetX = 0;
        this.targetY = 0;
        this.attempts = 5;
        this.shots = [];
        this.gameActive = false;

        this.xInput = document.getElementById('weapon-x');
        this.yInput = document.getElementById('weapon-y');
        this.fireBtn = document.getElementById('weapon-fire-btn');
        this.newBtn = document.getElementById('weapon-new-btn');
        this.attemptsDisplay = document.getElementById('weapon-attempts');
        this.distanceDisplay = document.getElementById('weapon-distance');
        this.result = document.getElementById('weapon-result');

        this.init();
    }

    init() {
        this.fireBtn.addEventListener('click', () => this.fire());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.startGame();
    }

    startGame() {
        this.targetX = Math.floor(Math.random() * 100);
        this.targetY = Math.floor(Math.random() * 100);
        this.attempts = 5;
        this.shots = [];
        this.gameActive = true;

        this.attemptsDisplay.textContent = this.attempts;
        this.distanceDisplay.textContent = '';
        this.result.textContent = '';
        this.result.className = '';

        this.draw();
    }

    fire() {
        if (!this.gameActive) return;

        const x = parseInt(this.xInput.value) || 50;
        const y = parseInt(this.yInput.value) || 50;

        // Calculate distance (Pythagorean theorem)
        const distance = Math.sqrt(
            Math.pow(x - this.targetX, 2) +
            Math.pow(y - this.targetY, 2)
        );

        this.shots.push({ x, y });
        this.attempts--;
        this.attemptsDisplay.textContent = this.attempts;

        if (distance < 5) {
            this.gameActive = false;
            this.result.textContent = 'TARGET DESTROYED!';
            this.result.className = 'success';
            this.distanceDisplay.textContent = '';
            this.draw(true);
            return;
        }

        this.distanceDisplay.textContent = `Distance to target: ${Math.round(distance)} units`;

        if (this.attempts <= 0) {
            this.gameActive = false;
            this.result.textContent = `Out of attempts! Target was at (${this.targetX}, ${this.targetY})`;
            this.result.className = 'failure';
            this.draw(true);
        } else {
            this.draw();
        }
    }

    draw(showTarget = false) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w / 10, 0);
            ctx.lineTo(i * w / 10, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h / 10);
            ctx.lineTo(w, i * h / 10);
            ctx.stroke();
        }

        // Convert coordinates
        const toCanvasX = (x) => x * w / 100;
        const toCanvasY = (y) => h - (y * h / 100);

        // Draw shots
        this.shots.forEach((shot, i) => {
            const intensity = (i + 1) / this.shots.length;
            ctx.fillStyle = `rgba(255, 102, 0, ${intensity})`;
            ctx.beginPath();
            ctx.arc(toCanvasX(shot.x), toCanvasY(shot.y), 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw target if revealed
        if (showTarget) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(toCanvasX(this.targetX), toCanvasY(this.targetY), 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(toCanvasX(this.targetX), toCanvasY(this.targetY), 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('0', 5, h - 5);
        ctx.fillText('100', w - 20, h - 5);
        ctx.fillText('100', 5, 15);
    }
}

// ==========================================
// ESCAPE GAME
// ==========================================
class EscapeGame {
    constructor() {
        this.frequency = 0;
        this.attempts = 5;
        this.gameActive = false;

        this.freqDisplay = document.getElementById('escape-freq-display');
        this.freqInput = document.getElementById('escape-freq');
        this.guessBtn = document.getElementById('escape-guess-btn');
        this.newBtn = document.getElementById('escape-new-btn');
        this.attemptsDisplay = document.getElementById('escape-attempts');
        this.hint = document.getElementById('escape-hint');
        this.result = document.getElementById('escape-result');

        this.init();
    }

    init() {
        this.guessBtn.addEventListener('click', () => this.guess());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.freqInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.guess();
        });
        this.startGame();
    }

    startGame() {
        this.frequency = Math.floor(Math.random() * 100) + 1;
        this.attempts = 5;
        this.gameActive = true;

        this.freqDisplay.textContent = '???';
        this.attemptsDisplay.textContent = this.attempts;
        this.hint.textContent = '';
        this.result.textContent = '';
        this.result.className = '';
        this.freqInput.value = '';
        this.freqInput.focus();
    }

    guess() {
        if (!this.gameActive) return;

        const freq = parseInt(this.freqInput.value);
        if (isNaN(freq) || freq < 1 || freq > 100) {
            this.hint.textContent = 'Enter a frequency between 1 and 100';
            return;
        }

        this.attempts--;
        this.attemptsDisplay.textContent = this.attempts;
        this.freqInput.value = '';

        const diff = Math.abs(freq - this.frequency);

        if (diff === 0) {
            this.gameActive = false;
            this.freqDisplay.textContent = this.frequency;
            this.result.textContent = 'GUARDS DISABLED! You escaped!';
            this.result.className = 'success';
            return;
        }

        if (diff < 5) {
            this.hint.textContent = 'VERY CLOSE! The guards are wobbling!';
        } else if (diff < 15) {
            this.hint.textContent = 'Getting warmer...';
        } else if (freq < this.frequency) {
            this.hint.textContent = 'TOO LOW - Building is shaking!';
        } else {
            this.hint.textContent = 'TOO HIGH - Headache from the frequency!';
        }

        if (this.attempts <= 0) {
            this.gameActive = false;
            this.freqDisplay.textContent = this.frequency;
            this.result.textContent = `CAPTURED! The frequency was ${this.frequency}`;
            this.result.className = 'failure';
        }
    }
}

// ==========================================
// PIRATE DOGFIGHT
// ==========================================
class DogfightGame {
    constructor() {
        this.canvas = document.getElementById('dogfight-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.pirate = { height: 50, speed: 5 };
        this.player = { height: 30, speed: 3 };
        this.gameActive = false;
        this.intervalId = null;

        this.pirateH = document.getElementById('pirate-h');
        this.pirateS = document.getElementById('pirate-s');
        this.playerH = document.getElementById('player-h');
        this.playerS = document.getElementById('player-s');
        this.startBtn = document.getElementById('dogfight-start-btn');
        this.upBtn = document.getElementById('df-up');
        this.downBtn = document.getElementById('df-down');
        this.accelBtn = document.getElementById('df-accel');
        this.decelBtn = document.getElementById('df-decel');
        this.fireBtn = document.getElementById('df-fire');
        this.result = document.getElementById('dogfight-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.upBtn.addEventListener('click', () => this.climb());
        this.downBtn.addEventListener('click', () => this.dive());
        this.accelBtn.addEventListener('click', () => this.accelerate());
        this.decelBtn.addEventListener('click', () => this.decelerate());
        this.fireBtn.addEventListener('click', () => this.fire());

        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            switch(e.key.toLowerCase()) {
                case 'u': case 'arrowup': this.climb(); break;
                case 'n': case 'arrowdown': this.dive(); break;
                case 'a': this.accelerate(); break;
                case 'd': this.decelerate(); break;
                case 'f': case ' ': this.fire(); break;
            }
        });

        this.draw();
    }

    startGame() {
        this.pirate = { height: 50, speed: 5 };
        this.player = { height: 30, speed: 3 };
        this.gameActive = true;
        this.result.textContent = '';
        this.result.className = '';
        this.startBtn.disabled = true;

        // Pirate moves periodically
        this.intervalId = setInterval(() => {
            if (this.gameActive) {
                this.updatePirate();
                this.updateDisplay();
                this.draw();
            }
        }, 500);

        this.updateDisplay();
        this.draw();
    }

    climb() {
        if (!this.gameActive) return;
        this.player.height = Math.min(100, this.player.height + this.player.speed);
        this.updateDisplay();
        this.draw();
    }

    dive() {
        if (!this.gameActive) return;
        this.player.height = Math.max(0, this.player.height - this.player.speed);
        this.updateDisplay();
        this.draw();
    }

    accelerate() {
        if (!this.gameActive) return;
        this.player.speed = Math.min(10, this.player.speed + 1);
        this.updateDisplay();
    }

    decelerate() {
        if (!this.gameActive) return;
        this.player.speed = Math.max(1, this.player.speed - 1);
        this.updateDisplay();
    }

    fire() {
        if (!this.gameActive) return;

        const hDiff = Math.abs(this.player.height - this.pirate.height);
        const sDiff = Math.abs(this.player.speed - this.pirate.speed);

        if (hDiff < 10 && sDiff < 2) {
            this.gameActive = false;
            clearInterval(this.intervalId);
            this.result.textContent = 'DIRECT HIT! Pirate down!';
            this.result.className = 'success';
            this.startBtn.disabled = false;
        } else {
            this.result.textContent = 'MISSED! Not aligned properly!';
            this.result.className = 'failure';
        }
    }

    updatePirate() {
        this.pirate.height += Math.floor(Math.random() * 11) - 5;
        this.pirate.height = Math.max(10, Math.min(90, this.pirate.height));
        this.pirate.speed += Math.floor(Math.random() * 3) - 1;
        this.pirate.speed = Math.max(2, Math.min(8, this.pirate.speed));
    }

    updateDisplay() {
        this.pirateH.textContent = Math.round(this.pirate.height);
        this.pirateS.textContent = this.pirate.speed;
        this.playerH.textContent = Math.round(this.player.height);
        this.playerS.textContent = this.player.speed;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#003366');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.arc(100, 50, 30, 0, Math.PI * 2);
        ctx.arc(130, 45, 25, 0, Math.PI * 2);
        ctx.fill();

        const toY = (height) => h - (height * h / 100);

        // Draw pirate
        ctx.fillStyle = '#ff3333';
        const pirateY = toY(this.pirate.height);
        ctx.beginPath();
        ctx.moveTo(300, pirateY);
        ctx.lineTo(340, pirateY - 5);
        ctx.lineTo(340, pirateY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(305, pirateY - 3, 20, 6);

        // Draw player
        ctx.fillStyle = '#00ff00';
        const playerY = toY(this.player.height);
        ctx.beginPath();
        ctx.moveTo(100, playerY);
        ctx.lineTo(60, playerY - 5);
        ctx.lineTo(60, playerY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(75, playerY - 3, 20, 6);

        // Labels
        ctx.fillStyle = '#ff3333';
        ctx.font = '10px monospace';
        ctx.fillText('PIRATE', 305, pirateY - 15);
        ctx.fillStyle = '#00ff00';
        ctx.fillText('YOU', 75, playerY - 15);
    }
}

// ==========================================
// Initialize all games
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    new RobotMissileGame();
    new VitalMessageGame();
    new ShootoutGame();
    new DesertTankGame();
    new CastleGame();
    new InvadersGame();
    new SecretWeaponGame();
    new EscapeGame();
    new DogfightGame();

    // Smooth scrolling
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    console.log('⚔️ Computer Battlegames loaded! Ready for combat!');
});
