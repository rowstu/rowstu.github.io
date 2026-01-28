/**
 * Computer Spacegames - Interactive Demos
 * Based on Usborne Computer Spacegames (1982)
 */

// Starship Takeoff
class StarshipGame {
    constructor() {
        this.requiredForce = 0;
        this.attempts = 10;
        this.gameActive = false;

        this.visual = document.getElementById('starship-visual');
        this.status = document.getElementById('starship-status');
        this.forceInput = document.getElementById('starship-force');
        this.launchBtn = document.getElementById('starship-launch-btn');
        this.newBtn = document.getElementById('starship-new-btn');
        this.attemptsDisplay = document.getElementById('starship-attempts');
        this.hint = document.getElementById('starship-hint');
        this.result = document.getElementById('starship-result');

        this.init();
    }

    init() {
        this.launchBtn.addEventListener('click', () => this.tryLaunch());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.forceInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.tryLaunch(); });
        this.startGame();
    }

    startGame() {
        this.requiredForce = Math.floor(Math.random() * 40) + 1;
        this.attempts = 10;
        this.gameActive = true;
        this.visual.textContent = '🚀';
        this.status.textContent = 'Stranded on alien world...';
        this.attemptsDisplay.textContent = this.attempts;
        this.hint.textContent = '';
        this.result.textContent = '';
        this.forceInput.value = '';
    }

    tryLaunch() {
        if (!this.gameActive) return;
        const force = parseInt(this.forceInput.value);
        if (isNaN(force) || force < 1 || force > 40) {
            this.hint.textContent = 'Enter force 1-40';
            return;
        }

        this.attempts--;
        this.attemptsDisplay.textContent = this.attempts;
        this.forceInput.value = '';

        if (force === this.requiredForce) {
            this.gameActive = false;
            this.visual.textContent = '🚀✨';
            this.result.textContent = 'TAKEOFF! You escaped!';
            this.result.className = 'success';
            return;
        }

        if (this.attempts <= 0) {
            this.gameActive = false;
            this.result.textContent = `Stranded forever! Required force was ${this.requiredForce}`;
            this.result.className = 'failure';
            return;
        }

        this.hint.textContent = force < this.requiredForce ? 'Not enough thrust!' : 'Fail-safe triggered! Too much!';
    }
}

// Moonlander
class MoonlanderGame {
    constructor() {
        this.canvas = document.getElementById('moonlander-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.height = 500;
        this.velocity = 0;
        this.fuel = 150;
        this.landed = false;

        this.heightDisplay = document.getElementById('moon-height');
        this.velocityDisplay = document.getElementById('moon-velocity');
        this.fuelDisplay = document.getElementById('moon-fuel');
        this.burnSlider = document.getElementById('moon-burn');
        this.burnVal = document.getElementById('moon-burn-val');
        this.applyBtn = document.getElementById('moon-apply-btn');
        this.newBtn = document.getElementById('moon-new-btn');
        this.result = document.getElementById('moon-result');

        this.init();
    }

    init() {
        this.applyBtn.addEventListener('click', () => this.applyThrust());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.burnSlider.addEventListener('input', () => {
            this.burnVal.textContent = this.burnSlider.value;
        });
        this.startGame();
    }

    startGame() {
        this.height = 500;
        this.velocity = 0;
        this.fuel = 150;
        this.landed = false;
        this.updateDisplay();
        this.result.textContent = '';
        this.draw();
    }

    applyThrust() {
        if (this.landed) return;

        let burn = parseInt(this.burnSlider.value);
        burn = Math.min(burn, this.fuel);
        this.fuel -= burn;
        this.velocity += 1.6 - burn / 5;
        this.height -= this.velocity;

        if (this.height <= 0) {
            this.height = 0;
            this.landed = true;
            if (this.velocity > 5) {
                this.result.textContent = 'CRASHED! Too fast!';
                this.result.className = 'failure';
            } else if (this.velocity > 2) {
                this.result.textContent = 'OK Landing - a bit rough';
                this.result.className = 'success';
            } else {
                this.result.textContent = 'PERFECT LANDING!';
                this.result.className = 'success';
            }
        }

        this.updateDisplay();
        this.draw();
    }

    updateDisplay() {
        this.heightDisplay.textContent = Math.max(0, Math.round(this.height));
        this.velocityDisplay.textContent = this.velocity.toFixed(1);
        this.fuelDisplay.textContent = this.fuel;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(Math.random() * w, Math.random() * h * 0.7, 1, 1);
        }

        // Moon surface
        ctx.fillStyle = '#554';
        ctx.fillRect(0, h - 30, w, 30);

        // Lander
        const landerY = h - 40 - (this.height / 500) * (h - 80);
        ctx.fillStyle = '#33ccff';
        ctx.beginPath();
        ctx.moveTo(w/2, landerY);
        ctx.lineTo(w/2 - 15, landerY + 20);
        ctx.lineTo(w/2 + 15, landerY + 20);
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#33ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2 - 10, landerY + 20);
        ctx.lineTo(w/2 - 15, landerY + 30);
        ctx.moveTo(w/2 + 10, landerY + 20);
        ctx.lineTo(w/2 + 15, landerY + 30);
        ctx.stroke();

        // Height indicator
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.fillText(`H: ${Math.round(this.height)}`, 10, 20);
        ctx.fillText(`V: ${this.velocity.toFixed(1)}`, 10, 35);
    }
}

// Evil Alien
class EvilAlienGame {
    constructor() {
        this.canvas = document.getElementById('alien-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.alienX = 0;
        this.alienY = 0;
        this.alienZ = 0;
        this.bombs = 4;
        this.shots = [];

        this.xInput = document.getElementById('alien-x');
        this.yInput = document.getElementById('alien-y');
        this.zInput = document.getElementById('alien-z');
        this.bombBtn = document.getElementById('alien-bomb-btn');
        this.newBtn = document.getElementById('alien-new-btn');
        this.bombsDisplay = document.getElementById('alien-bombs');
        this.hints = document.getElementById('alien-hints');
        this.result = document.getElementById('alien-result');

        this.init();
    }

    init() {
        this.bombBtn.addEventListener('click', () => this.dropBomb());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.startGame();
    }

    startGame() {
        this.alienX = Math.floor(Math.random() * 10);
        this.alienY = Math.floor(Math.random() * 10);
        this.alienZ = Math.floor(Math.random() * 10);
        this.bombs = 4;
        this.shots = [];
        this.bombsDisplay.textContent = this.bombs;
        this.hints.textContent = '';
        this.result.textContent = '';
        this.draw();
    }

    dropBomb() {
        if (this.bombs <= 0) return;

        const x = parseInt(this.xInput.value);
        const y = parseInt(this.yInput.value);
        const z = parseInt(this.zInput.value);

        this.shots.push({ x, y, z });
        this.bombs--;
        this.bombsDisplay.textContent = this.bombs;

        if (x === this.alienX && y === this.alienY && z === this.alienZ) {
            this.result.textContent = 'ALIEN DESTROYED!';
            this.result.className = 'success';
            this.draw(true);
            return;
        }

        const hintList = [];
        if (x < this.alienX) hintList.push('EAST');
        if (x > this.alienX) hintList.push('WEST');
        if (y < this.alienY) hintList.push('NORTH');
        if (y > this.alienY) hintList.push('SOUTH');
        if (z < this.alienZ) hintList.push('NOT FAR ENOUGH');
        if (z > this.alienZ) hintList.push('TOO FAR');

        this.hints.textContent = hintList.join(' | ');

        if (this.bombs <= 0) {
            this.result.textContent = `Alien escaped! Was at (${this.alienX}, ${this.alienY}, ${this.alienZ})`;
            this.result.className = 'failure';
            this.draw(true);
        } else {
            this.draw();
        }
    }

    draw(showAlien = false) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#223';
        const cellW = w / 10;
        const cellH = h / 10;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellW, 0);
            ctx.lineTo(i * cellW, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellH);
            ctx.lineTo(w, i * cellH);
            ctx.stroke();
        }

        // Shots
        ctx.fillStyle = '#ff6600';
        this.shots.forEach(shot => {
            ctx.beginPath();
            ctx.arc(shot.x * cellW + cellW/2, shot.y * cellH + cellH/2, 8, 0, Math.PI * 2);
            ctx.fill();
        });

        // Alien
        if (showAlien) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '20px sans-serif';
            ctx.fillText('👽', this.alienX * cellW + 5, this.alienY * cellH + 25);
        }

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('X (E-W) →', w - 60, h - 5);
        ctx.save();
        ctx.translate(10, h - 50);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Y (N-S) →', 0, 0);
        ctx.restore();
    }
}

// Asteroid Belt
class AsteroidGame {
    constructor() {
        this.score = 0;
        this.asteroid = 0;
        this.currentCount = 0;
        this.waiting = false;
        this.timeoutId = null;

        this.starsDisplay = document.getElementById('asteroid-stars');
        this.startBtn = document.getElementById('asteroid-start-btn');
        this.scoreDisplay = document.getElementById('asteroid-score');
        this.countDisplay = document.getElementById('asteroid-count');
        this.result = document.getElementById('asteroid-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', e => {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9 && this.waiting) {
                this.shoot(num);
            }
        });
    }

    startGame() {
        this.score = 0;
        this.asteroid = 0;
        this.scoreDisplay.textContent = 0;
        this.countDisplay.textContent = 0;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        setTimeout(() => this.nextAsteroid(), 500);
    }

    nextAsteroid() {
        if (this.asteroid >= 10) {
            this.endGame();
            return;
        }

        this.asteroid++;
        this.countDisplay.textContent = this.asteroid;
        this.currentCount = Math.floor(Math.random() * 9) + 1;
        this.starsDisplay.textContent = '*'.repeat(this.currentCount);
        this.waiting = true;

        this.timeoutId = setTimeout(() => {
            if (this.waiting) {
                this.waiting = false;
                this.result.textContent = 'MISSED!';
                this.result.className = 'failure';
                setTimeout(() => this.nextAsteroid(), 500);
            }
        }, 1500);
    }

    shoot(num) {
        if (!this.waiting) return;
        clearTimeout(this.timeoutId);
        this.waiting = false;

        if (num === this.currentCount) {
            this.score++;
            this.scoreDisplay.textContent = this.score;
            this.result.textContent = 'HIT!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `MISS! It was ${this.currentCount}`;
            this.result.className = 'failure';
        }

        setTimeout(() => this.nextAsteroid(), 500);
    }

    endGame() {
        this.startBtn.disabled = false;
        this.starsDisplay.textContent = 'DONE';
        this.result.textContent = `Final score: ${this.score}/10`;
        this.result.className = this.score >= 7 ? 'success' : '';
    }
}

// Space Mines
class SpaceMinesGame {
    constructor() {
        this.money = 1000;
        this.people = 100;
        this.mines = 5;
        this.satisfaction = 50;
        this.year = 0;
        this.ore = 0;
        this.orePrice = 0;

        this.yearDisplay = document.getElementById('mines-year');
        this.moneyDisplay = document.getElementById('mines-money');
        this.peopleDisplay = document.getElementById('mines-people');
        this.minesDisplay = document.getElementById('mines-mines');
        this.satisfactionDisplay = document.getElementById('mines-satisfaction');
        this.oreDisplay = document.getElementById('mines-ore');
        this.priceDisplay = document.getElementById('mines-price');
        this.sellInput = document.getElementById('mines-sell');
        this.foodInput = document.getElementById('mines-food');
        this.endYearBtn = document.getElementById('mines-endyear-btn');
        this.newBtn = document.getElementById('mines-new-btn');
        this.result = document.getElementById('mines-result');

        this.init();
    }

    init() {
        this.endYearBtn.addEventListener('click', () => this.endYear());
        this.newBtn.addEventListener('click', () => this.startGame());
        this.startGame();
    }

    startGame() {
        this.money = 1000;
        this.people = 100;
        this.mines = 5;
        this.satisfaction = 50;
        this.year = 0;
        this.result.textContent = '';
        this.startYear();
    }

    startYear() {
        this.year++;
        this.ore = this.mines * 10;
        this.orePrice = Math.floor(Math.random() * 20) + 10;
        this.updateDisplay();
    }

    endYear() {
        const sellAmount = Math.min(parseInt(this.sellInput.value) || 0, this.ore);
        const foodAmount = parseInt(this.foodInput.value) || 0;
        const foodCost = foodAmount * 5;

        // Sell ore
        this.money += sellAmount * this.orePrice;

        // Buy food
        if (foodCost > this.money) {
            this.result.textContent = "Can't afford that much food!";
            return;
        }
        this.money -= foodCost;

        // Check food vs people
        if (foodAmount < this.people) {
            this.satisfaction -= 10;
            this.people -= 5;
        } else {
            this.satisfaction += 5;
        }

        this.satisfaction = Math.min(100, this.satisfaction);

        // Check revolt
        if (this.satisfaction < 20) {
            this.result.textContent = 'REVOLT! Colony overthrown!';
            this.result.className = 'failure';
            return;
        }

        // Check win
        if (this.year >= 10) {
            this.result.textContent = 'COLONY SURVIVED 10 YEARS! Victory!';
            this.result.className = 'success';
            return;
        }

        this.startYear();
    }

    updateDisplay() {
        this.yearDisplay.textContent = this.year;
        this.moneyDisplay.textContent = this.money;
        this.peopleDisplay.textContent = this.people;
        this.minesDisplay.textContent = this.mines;
        this.satisfactionDisplay.textContent = this.satisfaction;
        this.oreDisplay.textContent = this.ore;
        this.priceDisplay.textContent = this.orePrice;
        this.sellInput.value = this.ore;
        this.foodInput.value = this.people;
    }
}

// Space Rescue
class SpaceRescueGame {
    constructor() {
        this.totalEnergy = 100;

        this.remainingDisplay = document.getElementById('rescue-remaining');
        this.enginesSlider = document.getElementById('rescue-engines');
        this.lifeSlider = document.getElementById('rescue-life');
        this.shieldsSlider = document.getElementById('rescue-shields');
        this.eVal = document.getElementById('rescue-e-val');
        this.lVal = document.getElementById('rescue-l-val');
        this.sVal = document.getElementById('rescue-s-val');
        this.launchBtn = document.getElementById('rescue-launch-btn');
        this.newBtn = document.getElementById('rescue-new-btn');
        this.eventDisplay = document.getElementById('rescue-event');
        this.result = document.getElementById('rescue-result');

        this.init();
    }

    init() {
        const updateSliders = () => {
            this.eVal.textContent = this.enginesSlider.value;
            this.lVal.textContent = this.lifeSlider.value;
            this.sVal.textContent = this.shieldsSlider.value;
            const total = parseInt(this.enginesSlider.value) + parseInt(this.lifeSlider.value) + parseInt(this.shieldsSlider.value);
            this.remainingDisplay.textContent = this.totalEnergy - total;
            this.remainingDisplay.style.color = total > 100 ? '#ff3333' : '#33ccff';
        };

        this.enginesSlider.addEventListener('input', updateSliders);
        this.lifeSlider.addEventListener('input', updateSliders);
        this.shieldsSlider.addEventListener('input', updateSliders);
        this.launchBtn.addEventListener('click', () => this.launch());
        this.newBtn.addEventListener('click', () => this.reset());

        updateSliders();
    }

    reset() {
        this.enginesSlider.value = 33;
        this.lifeSlider.value = 33;
        this.shieldsSlider.value = 34;
        this.eVal.textContent = 33;
        this.lVal.textContent = 33;
        this.sVal.textContent = 34;
        this.remainingDisplay.textContent = 0;
        this.eventDisplay.textContent = '';
        this.result.textContent = '';
    }

    launch() {
        const engines = parseInt(this.enginesSlider.value);
        const life = parseInt(this.lifeSlider.value);
        const shields = parseInt(this.shieldsSlider.value);

        if (engines + life + shields > 100) {
            this.result.textContent = 'Over 100 energy units! Redistribute!';
            this.result.className = 'failure';
            return;
        }

        const events = [
            { name: 'ASTEROID STORM!', test: shields > 30, fail: 'Shields failed!' },
            { name: 'ENGINE TROUBLE!', test: engines > 40, fail: 'Too slow to reach them!' },
            { name: 'LIFE SUPPORT FAILURE!', test: life > 25, fail: 'Crew perished!' }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        this.eventDisplay.textContent = `Event: ${event.name}`;

        if (event.test) {
            this.result.textContent = 'MISSION SUCCESS! Crew rescued!';
            this.result.className = 'success';
        } else {
            this.result.textContent = `MISSION FAILED! ${event.fail}`;
            this.result.className = 'failure';
        }
    }
}

// Initialize all games
document.addEventListener('DOMContentLoaded', () => {
    new StarshipGame();
    new MoonlanderGame();
    new EvilAlienGame();
    new AsteroidGame();
    new SpaceMinesGame();
    new SpaceRescueGame();

    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    });

    console.log('🚀 Computer Spacegames loaded! Ready for launch!');
});
