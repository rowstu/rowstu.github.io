/**
 * Computer Spy Games - Interactive Demos
 * Based on Usborne Computer Spy Games (1984)
 */

// ==========================================
// SPY EYES GAME
// ==========================================
class SpyEyesGame {
    constructor() {
        this.display = document.getElementById('spy-eyes-display');
        this.startBtn = document.getElementById('spy-eyes-start');
        this.guessInput = document.getElementById('spy-eyes-guess');
        this.checkBtn = document.getElementById('spy-eyes-check');
        this.result = document.getElementById('spy-eyes-result');

        this.positions = [];
        this.movedNumber = 0;
        this.gameActive = false;

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.checkBtn.addEventListener('click', () => this.checkGuess());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkGuess();
        });
    }

    startGame() {
        this.result.textContent = '';
        this.result.className = '';
        this.guessInput.value = '';
        this.display.innerHTML = '';
        this.positions = [];

        // Generate random positions for numbers 1-9
        for (let i = 1; i <= 9; i++) {
            const pos = {
                x: Math.floor(Math.random() * 320) + 40,
                y: Math.floor(Math.random() * 180) + 30
            };
            this.positions[i] = pos;

            const numEl = document.createElement('div');
            numEl.className = 'spy-number';
            numEl.textContent = i;
            numEl.style.left = pos.x + 'px';
            numEl.style.top = pos.y + 'px';
            numEl.id = `spy-num-${i}`;
            this.display.appendChild(numEl);
        }

        this.result.textContent = 'Watch carefully...';

        // After delay, move one number
        setTimeout(() => {
            this.movedNumber = Math.floor(Math.random() * 9) + 1;
            const el = document.getElementById(`spy-num-${this.movedNumber}`);
            const shift = Math.floor(Math.random() * 60) - 30;
            const newX = Math.max(20, Math.min(360, this.positions[this.movedNumber].x + shift));
            el.style.left = newX + 'px';

            this.gameActive = true;
            this.result.textContent = 'Which number moved?';
            this.guessInput.focus();
        }, 2500);
    }

    checkGuess() {
        if (!this.gameActive) return;

        const guess = parseInt(this.guessInput.value);
        if (isNaN(guess) || guess < 1 || guess > 9) {
            this.result.textContent = 'Enter a number between 1 and 9';
            return;
        }

        if (guess === this.movedNumber) {
            this.result.textContent = 'CORRECT! Your spy eyes are sharp!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `WRONG! It was ${this.movedNumber}. Try again!`;
            this.result.className = 'failure';
        }

        this.gameActive = false;
    }
}

// ==========================================
// SEARCHLIGHT GAME
// ==========================================
class SearchlightGame {
    constructor() {
        this.canvas = document.getElementById('searchlight-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('searchlight-start');
        this.result = document.getElementById('searchlight-result');

        this.playerX = 30;
        this.searchlightX = 200;
        this.searchlightDir = 1;
        this.gameActive = false;
        this.won = false;
        this.animationId = null;

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKey(e));
        this.draw();
    }

    startGame() {
        this.playerX = 30;
        this.searchlightX = 200;
        this.searchlightDir = 1;
        this.gameActive = true;
        this.won = false;
        this.result.textContent = '';
        this.result.className = '';
        this.startBtn.disabled = true;
        this.gameLoop();
    }

    handleKey(e) {
        if (!this.gameActive) return;

        if (e.key === 'ArrowRight' || e.key === 'm' || e.key === 'M') {
            this.playerX += 8;
        } else if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') {
            this.playerX = Math.max(10, this.playerX - 8);
        }
    }

    gameLoop() {
        this.update();
        this.draw();

        if (this.gameActive) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Move searchlight
        this.searchlightX += this.searchlightDir * 2;
        if (this.searchlightX > 350) this.searchlightDir = -1;
        if (this.searchlightX < 50) this.searchlightDir = 1;

        // Check if caught (in beam)
        const beamLeft = this.searchlightX - 25;
        const beamRight = this.searchlightX + 25;
        if (this.playerX > beamLeft && this.playerX < beamRight) {
            this.gameOver(false);
        }

        // Check if won
        if (this.playerX > 390) {
            this.gameOver(true);
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 400, 200);

        // Draw ground
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 170, 400, 30);

        // Draw finish line
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(385, 0);
        this.ctx.lineTo(385, 200);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw searchlight tower
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(195, 5, 10, 20);

        // Draw searchlight beam
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(200, 15);
        this.ctx.lineTo(this.searchlightX - 35, 200);
        this.ctx.lineTo(this.searchlightX + 35, 200);
        this.ctx.closePath();
        this.ctx.fill();

        // Beam center (brighter)
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(200, 15);
        this.ctx.lineTo(this.searchlightX - 15, 200);
        this.ctx.lineTo(this.searchlightX + 15, 200);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw player
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(this.playerX, 160, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillRect(this.playerX - 3, 160, 6, 15);
    }

    gameOver(won) {
        this.gameActive = false;
        this.won = won;
        cancelAnimationFrame(this.animationId);
        this.startBtn.disabled = false;

        if (won) {
            this.result.textContent = 'ESCAPED! Mission accomplished!';
            this.result.className = 'success';
        } else {
            this.result.textContent = 'CAUGHT! The searchlight spotted you!';
            this.result.className = 'failure';
        }
    }
}

// ==========================================
// ROBOSPY GAME
// ==========================================
class RobospyGame {
    constructor() {
        this.track = document.getElementById('robospy-track');
        this.startBtn = document.getElementById('robospy-start');
        this.leftBtn = document.getElementById('robospy-left');
        this.rightBtn = document.getElementById('robospy-right');
        this.result = document.getElementById('robospy-result');
        this.progress = document.getElementById('robospy-progress');

        this.pattern = [];
        this.currentStep = 0;
        this.position = 50;
        this.gamePhase = 'idle'; // idle, showing, playing

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.leftBtn.addEventListener('click', () => this.makeMove('L'));
        this.rightBtn.addEventListener('click', () => this.makeMove('R'));

        document.addEventListener('keydown', (e) => {
            if (this.gamePhase !== 'playing') return;
            if (e.key === 'l' || e.key === 'L') this.makeMove('L');
            if (e.key === 'r' || e.key === 'R') this.makeMove('R');
        });
    }

    startGame() {
        const length = Math.floor(Math.random() * 4) + 4; // 4-7 moves
        this.pattern = [];
        this.currentStep = 0;
        this.position = 50;

        // Generate pattern
        for (let i = 0; i < length; i++) {
            this.pattern.push(Math.random() > 0.5 ? 'L' : 'R');
        }

        this.result.textContent = '';
        this.progress.textContent = `Pattern length: ${length}`;
        this.startBtn.disabled = true;
        this.leftBtn.disabled = true;
        this.rightBtn.disabled = true;

        this.gamePhase = 'showing';
        this.showPattern();
    }

    async showPattern() {
        this.result.textContent = 'Watch the agent...';
        this.position = 50;
        this.track.style.left = '50%';

        await this.delay(1000);

        for (const move of this.pattern) {
            if (move === 'L') {
                this.position -= 8;
            } else {
                this.position += 8;
            }
            this.track.style.left = this.position + '%';
            await this.delay(600);
        }

        // Reset position
        await this.delay(500);
        this.position = 50;
        this.track.style.left = '50%';
        this.track.style.backgroundColor = '#33ccff';

        this.gamePhase = 'playing';
        this.result.textContent = 'Your turn! Remember: L=right, R=left';
        this.progress.textContent = `Move ${this.currentStep + 1} of ${this.pattern.length}`;
        this.leftBtn.disabled = false;
        this.rightBtn.disabled = false;
    }

    makeMove(key) {
        if (this.gamePhase !== 'playing') return;

        const expected = this.pattern[this.currentStep];
        // Controls are REVERSED!
        // L key should match R movement (right), R key should match L movement (left)
        const correct = (key === 'L' && expected === 'R') ||
                       (key === 'R' && expected === 'L');

        if (correct) {
            // Move robot in the VISUAL direction (same as the pattern)
            if (expected === 'L') {
                this.position -= 8;
            } else {
                this.position += 8;
            }
            this.track.style.left = this.position + '%';

            this.currentStep++;
            this.progress.textContent = `Move ${Math.min(this.currentStep + 1, this.pattern.length)} of ${this.pattern.length}`;

            if (this.currentStep >= this.pattern.length) {
                this.gameOver(true);
            }
        } else {
            this.gameOver(false);
        }
    }

    gameOver(won) {
        this.gamePhase = 'idle';
        this.leftBtn.disabled = true;
        this.rightBtn.disabled = true;
        this.startBtn.disabled = false;
        this.track.style.backgroundColor = won ? '#00ff00' : '#ff3333';

        if (won) {
            this.result.textContent = 'PERFECT TRACKING! Agent followed successfully!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `LOST THE AGENT! Pattern was: ${this.pattern.join(' ')}`;
            this.result.className = 'failure';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==========================================
// SPY Q TEST GAME
// ==========================================
class SpyQTestGame {
    constructor() {
        this.numberDisplay = document.getElementById('spyq-number');
        this.slotsContainer = document.getElementById('spyq-slots');
        this.startBtn = document.getElementById('spyq-start');
        this.discardBtn = document.getElementById('spyq-discard');
        this.discardsDisplay = document.getElementById('spyq-discards');
        this.roundDisplay = document.getElementById('spyq-round');
        this.result = document.getElementById('spyq-result');

        this.slots = new Array(10).fill(null);
        this.discards = 5;
        this.currentNumber = 0;
        this.round = 0;
        this.maxRounds = 15;
        this.gameActive = false;

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.discardBtn.addEventListener('click', () => this.discard());

        // Add click handlers to slots
        const slotElements = this.slotsContainer.querySelectorAll('.slot');
        slotElements.forEach((slot, index) => {
            slot.addEventListener('click', () => this.placeNumber(index));
        });
    }

    startGame() {
        this.slots = new Array(10).fill(null);
        this.discards = 5;
        this.round = 0;
        this.gameActive = true;

        this.updateDisplay();
        this.result.textContent = '';
        this.result.className = '';
        this.startBtn.disabled = true;
        this.discardBtn.disabled = false;

        this.nextNumber();
    }

    nextNumber() {
        if (this.round >= this.maxRounds) {
            this.gameOver();
            return;
        }

        this.currentNumber = Math.floor(Math.random() * 100) + 1;
        this.round++;
        this.numberDisplay.textContent = this.currentNumber;
        this.roundDisplay.textContent = this.round;
    }

    placeNumber(slotIndex) {
        if (!this.gameActive) return;
        if (this.slots[slotIndex] !== null) {
            this.result.textContent = 'Slot taken! Choose another.';
            return;
        }

        this.slots[slotIndex] = this.currentNumber;
        this.updateDisplay();
        this.result.textContent = '';
        this.nextNumber();
    }

    discard() {
        if (!this.gameActive) return;
        if (this.discards <= 0) {
            this.result.textContent = 'No discards left!';
            return;
        }

        this.discards--;
        this.discardsDisplay.textContent = this.discards;
        this.result.textContent = '';
        this.nextNumber();
    }

    updateDisplay() {
        const slotElements = this.slotsContainer.querySelectorAll('.slot');
        slotElements.forEach((slot, index) => {
            const valSpan = slot.querySelector('.slot-val');
            if (this.slots[index] !== null) {
                valSpan.textContent = this.slots[index];
                slot.classList.add('filled');
            } else {
                valSpan.textContent = '-';
                slot.classList.remove('filled');
            }
        });

        this.discardsDisplay.textContent = this.discards;
    }

    checkOrder() {
        let lastNum = 0;
        for (let i = 0; i < 10; i++) {
            if (this.slots[i] !== null) {
                if (this.slots[i] < lastNum) {
                    return false;
                }
                lastNum = this.slots[i];
            }
        }
        return true;
    }

    gameOver() {
        this.gameActive = false;
        this.startBtn.disabled = false;
        this.discardBtn.disabled = true;
        this.numberDisplay.textContent = '--';

        const ordered = this.checkOrder();
        const filled = this.slots.filter(s => s !== null).length;

        let rank;
        if (filled >= 9 && ordered) rank = 'MASTER SPY';
        else if (filled >= 7 && ordered) rank = 'SECRET AGENT';
        else if (filled >= 5 && ordered) rank = 'FIELD OPERATIVE';
        else if (ordered) rank = 'TRAINEE';
        else rank = 'FAILED';

        if (ordered) {
            this.result.textContent = `TEST PASSED! ${filled}/10 slots filled. Rank: ${rank}`;
            this.result.className = 'success';
        } else {
            this.result.textContent = `TEST FAILED! Numbers are out of order!`;
            this.result.className = 'failure';
        }
    }
}

// ==========================================
// CIPHER GAME (Secret Message Maker)
// ==========================================
class CipherGame {
    constructor() {
        this.input = document.getElementById('cipher-input');
        this.output = document.getElementById('cipher-output');
        this.shiftInput = document.getElementById('cipher-shift');
        this.goBtn = document.getElementById('cipher-go');
        this.plainAlphabet = document.getElementById('plain-alphabet');
        this.cipherAlphabet = document.getElementById('cipher-alphabet');

        this.init();
    }

    init() {
        this.goBtn.addEventListener('click', () => this.transform());
        this.shiftInput.addEventListener('change', () => this.updateAlphabetDisplay());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.transform();
            }
        });

        this.updateAlphabetDisplay();
    }

    transform() {
        const text = this.input.value.toUpperCase();
        const shift = parseInt(this.shiftInput.value) || 3;
        const mode = document.querySelector('input[name="cipher-mode"]:checked').value;
        const decode = mode === 'decode';

        const result = this.caesarCipher(text, shift, decode);
        this.output.textContent = result;
    }

    caesarCipher(text, shift, decode = false) {
        if (decode) shift = -shift;

        return text.split('').map(char => {
            const code = char.charCodeAt(0);

            // Uppercase A-Z
            if (code >= 65 && code <= 90) {
                return String.fromCharCode(
                    ((code - 65 + shift + 26) % 26) + 65
                );
            }
            // Keep other characters unchanged
            return char;
        }).join('');
    }

    updateAlphabetDisplay() {
        const shift = parseInt(this.shiftInput.value) || 3;

        // Clear
        this.plainAlphabet.innerHTML = '<span style="width:50px;background:transparent;border:none;color:#666;">Plain:</span>';
        this.cipherAlphabet.innerHTML = '<span style="width:50px;background:transparent;border:none;color:#666;">Cipher:</span>';

        for (let i = 0; i < 26; i++) {
            const plainChar = String.fromCharCode(65 + i);
            const cipherChar = String.fromCharCode(((i + shift) % 26) + 65);

            const plainSpan = document.createElement('span');
            plainSpan.textContent = plainChar;
            this.plainAlphabet.appendChild(plainSpan);

            const cipherSpan = document.createElement('span');
            cipherSpan.textContent = cipherChar;
            this.cipherAlphabet.appendChild(cipherSpan);
        }
    }
}

// ==========================================
// MORSE CODE GAME
// ==========================================
class MorseGame {
    constructor() {
        this.input = document.getElementById('morse-input');
        this.output = document.getElementById('morse-output');
        this.lamp = document.getElementById('morse-lamp');
        this.convertBtn = document.getElementById('morse-convert');
        this.playBtn = document.getElementById('morse-play');
        this.chart = document.getElementById('morse-chart');

        this.MORSE_CODE = {
            'A': '.-',    'B': '-...',  'C': '-.-.',
            'D': '-..',   'E': '.',     'F': '..-.',
            'G': '--.',   'H': '....',  'I': '..',
            'J': '.---',  'K': '-.-',   'L': '.-..',
            'M': '--',    'N': '-.',    'O': '---',
            'P': '.--.',  'Q': '--.-',  'R': '.-.',
            'S': '...',   'T': '-',     'U': '..-',
            'V': '...-',  'W': '.--',   'X': '-..-',
            'Y': '-.--',  'Z': '--..',
            '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....',
            '6': '-....', '7': '--...', '8': '---..',
            '9': '----.'
        };

        this.REVERSE_MORSE = Object.fromEntries(
            Object.entries(this.MORSE_CODE).map(([k, v]) => [v, k])
        );

        this.playing = false;
        this.audioCtx = null;

        this.init();
    }

    init() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.playBtn.addEventListener('click', () => this.play());
        this.buildChart();
    }

    buildChart() {
        for (const [letter, code] of Object.entries(this.MORSE_CODE)) {
            const item = document.createElement('div');
            item.className = 'morse-item';
            item.innerHTML = `
                <div class="morse-letter">${letter}</div>
                <div class="morse-code">${code}</div>
            `;
            this.chart.appendChild(item);
        }
    }

    convert() {
        const mode = document.querySelector('input[name="morse-mode"]:checked').value;
        const input = this.input.value;

        if (mode === 'text') {
            this.output.textContent = this.textToMorse(input);
        } else {
            this.output.textContent = this.morseToText(input);
        }
    }

    textToMorse(text) {
        return text.toUpperCase().split('').map(char => {
            if (char === ' ') return '/';
            return this.MORSE_CODE[char] || '';
        }).filter(c => c).join(' ');
    }

    morseToText(morse) {
        return morse.split(' ').map(code => {
            if (code === '/' || code === '') return ' ';
            return this.REVERSE_MORSE[code] || '?';
        }).join('').replace(/\s+/g, ' ').trim();
    }

    async play() {
        if (this.playing) return;
        this.playing = true;
        this.playBtn.disabled = true;

        // Initialize audio context on user interaction
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const mode = document.querySelector('input[name="morse-mode"]:checked').value;
        let morse;

        if (mode === 'text') {
            morse = this.textToMorse(this.input.value);
        } else {
            morse = this.input.value;
        }

        // Play the morse code
        for (const char of morse) {
            if (char === '.') {
                await this.beep(100);
                await this.delay(100);
            } else if (char === '-') {
                await this.beep(300);
                await this.delay(100);
            } else if (char === ' ') {
                await this.delay(200);
            } else if (char === '/') {
                await this.delay(400);
            }
        }

        this.playing = false;
        this.playBtn.disabled = false;
    }

    async beep(duration) {
        // Visual
        this.lamp.classList.add('on');

        // Audio
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();

        await this.delay(duration);

        oscillator.stop();
        this.lamp.classList.remove('on');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==========================================
// Initialize all games when DOM is ready
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize games
    new SpyEyesGame();
    new SearchlightGame();
    new RobospyGame();
    new SpyQTestGame();
    new CipherGame();
    new MorseGame();

    // Smooth scrolling for navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    console.log('🕵️ Computer Spy Games loaded! Good luck, Agent!');
});
