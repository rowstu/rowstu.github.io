/**
 * Weird Computer Games - Interactive Demos
 * Based on Usborne Weird Computer Games (1984)
 */

// Tower of Terror
class TowerGame {
    constructor() {
        this.pulse = 70;
        this.floor = 1;
        this.time = 9;
        this.monsters = ['💀', '👻', '🪓'];
        this.monsterNames = ['SKELETON', 'GHOST', 'HEADLESS AXEMAN'];
        this.gameActive = false;

        this.floorDisplay = document.getElementById('tower-floor');
        this.pulseDisplay = document.getElementById('tower-pulse');
        this.timeDisplay = document.getElementById('tower-time');
        this.monsterDisplay = document.getElementById('tower-monster');
        this.messageDisplay = document.getElementById('tower-message');
        this.pulseFill = document.getElementById('tower-pulse-fill');
        this.startBtn = document.getElementById('tower-start-btn');
        this.upBtn = document.getElementById('tower-up-btn');
        this.retreatBtn = document.getElementById('tower-retreat-btn');
        this.result = document.getElementById('tower-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.upBtn.addEventListener('click', () => this.goUp());
        this.retreatBtn.addEventListener('click', () => this.retreat());
    }

    startGame() {
        this.pulse = 70;
        this.floor = 1;
        this.time = 9;
        this.gameActive = true;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.upBtn.disabled = false;
        this.retreatBtn.disabled = false;
        this.encounter();
    }

    encounter() {
        this.updateDisplay();
        const monster = this.monsters[this.floor - 1];
        const name = this.monsterNames[this.floor - 1];
        this.monsterDisplay.textContent = monster;

        const scare = this.floor * 10 + Math.floor(Math.random() * 20);
        this.pulse += scare;
        this.messageDisplay.textContent = `A ${name} appears! (+${scare} pulse)`;
        this.updateDisplay();
        this.checkState();
    }

    goUp() {
        if (!this.gameActive) return;
        this.floor++;
        this.time++;

        if (this.floor > 3) {
            this.gameActive = false;
            this.result.textContent = '🏆 TREASURE FOUND! You survived!';
            this.result.className = 'success';
            this.endGame();
            return;
        }

        this.encounter();
    }

    retreat() {
        if (!this.gameActive) return;
        this.pulse = Math.max(60, this.pulse - 15);
        this.time++;
        this.messageDisplay.textContent = 'You retreat and calm down... (-15 pulse)';
        this.updateDisplay();
        this.checkState();
    }

    checkState() {
        if (this.pulse > 150) {
            this.gameActive = false;
            this.result.textContent = '💔 HEART ATTACK! Your pulse was too high!';
            this.result.className = 'failure';
            this.endGame();
        } else if (this.time >= 12) {
            this.gameActive = false;
            this.result.textContent = '🕛 MIDNIGHT! Trapped in the tower forever!';
            this.result.className = 'failure';
            this.endGame();
        }
    }

    updateDisplay() {
        this.floorDisplay.textContent = this.floor;
        this.pulseDisplay.textContent = this.pulse;
        this.timeDisplay.textContent = this.time;
        this.pulseFill.style.width = Math.min(100, (this.pulse / 150) * 100) + '%';
    }

    endGame() {
        this.startBtn.disabled = false;
        this.upBtn.disabled = true;
        this.retreatBtn.disabled = true;
    }
}

// Skulls of the Pyramid
class SkullsGame {
    constructor() {
        this.target = 0;
        this.skulls = 5;
        this.total = 0;
        this.gameActive = false;

        this.targetDisplay = document.querySelector('#skulls-target span');
        this.remainingDisplay = document.getElementById('skulls-remaining');
        this.totalDisplay = document.querySelector('#skulls-total span');
        this.columns = document.querySelectorAll('.column');
        this.startBtn = document.getElementById('skulls-start-btn');
        this.result = document.getElementById('skulls-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.columns.forEach(col => {
            col.addEventListener('click', () => this.dropSkull(parseInt(col.dataset.val)));
        });
    }

    startGame() {
        this.target = Math.floor(Math.random() * 25) + 15; // 15-40
        this.skulls = 5;
        this.total = 0;
        this.gameActive = true;

        this.targetDisplay.textContent = this.target;
        this.remainingDisplay.textContent = '💀'.repeat(5);
        this.totalDisplay.textContent = 0;
        this.result.textContent = '';
        this.columns.forEach(c => c.classList.remove('dropped'));
        this.startBtn.disabled = true;
    }

    dropSkull(value) {
        if (!this.gameActive || this.skulls <= 0) return;

        this.skulls--;
        this.total += value;
        this.remainingDisplay.textContent = '💀'.repeat(this.skulls) || '(none)';
        this.totalDisplay.textContent = this.total;

        // Visual feedback
        const col = document.querySelector(`.column[data-val="${value}"]`);
        col.classList.add('dropped');
        setTimeout(() => col.classList.remove('dropped'), 300);

        if (this.skulls === 0) {
            this.checkResult();
        }
    }

    checkResult() {
        this.gameActive = false;
        this.startBtn.disabled = false;

        if (this.total === this.target) {
            this.result.textContent = '✨ CURSE BROKEN! The spirits are pleased!';
            this.result.className = 'success';
        } else {
            const diff = this.total - this.target;
            this.result.textContent = `💀 Failed! Got ${this.total}, needed ${this.target} (${diff > 0 ? '+' : ''}${diff})`;
            this.result.className = 'failure';
        }
    }
}

// Monster Wrestling
class WrestlingGame {
    constructor() {
        this.oxygen = 100;
        this.adrenalin = 50;
        this.round = 0;
        this.currentPower = 0;
        this.size = 0;
        this.distance = 0;
        this.gameActive = false;

        this.roundDisplay = document.getElementById('wrestling-round');
        this.oxygenDisplay = document.getElementById('wrestling-oxygen');
        this.adrenalinDisplay = document.getElementById('wrestling-adrenalin');
        this.sizeDisplay = document.getElementById('wrestling-size');
        this.distanceDisplay = document.getElementById('wrestling-distance');
        this.effortInput = document.getElementById('wrestling-effort');
        this.fightBtn = document.getElementById('wrestling-fight-btn');
        this.startBtn = document.getElementById('wrestling-start-btn');
        this.result = document.getElementById('wrestling-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.fightBtn.addEventListener('click', () => this.fight());
        this.effortInput.addEventListener('keypress', e => { if (e.key === 'Enter') this.fight(); });
    }

    startGame() {
        this.oxygen = 100;
        this.adrenalin = 50;
        this.round = 0;
        this.gameActive = true;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.fightBtn.disabled = false;
        this.nextRound();
    }

    nextRound() {
        if (this.round >= 12) {
            this.win();
            return;
        }

        this.round++;
        this.size = Math.floor(Math.random() * 8) + this.round;
        this.distance = Math.floor(Math.random() * 5) + 1;
        this.currentPower = this.size * this.distance;

        this.roundDisplay.textContent = this.round;
        this.sizeDisplay.textContent = this.size;
        this.distanceDisplay.textContent = this.distance;
        this.effortInput.value = '';
        this.effortInput.focus();
        this.updateDisplay();
    }

    fight() {
        if (!this.gameActive) return;

        const effort = parseInt(this.effortInput.value);
        if (isNaN(effort)) {
            this.result.textContent = 'Enter a number!';
            return;
        }

        if (effort >= this.currentPower) {
            this.adrenalin += 5;
            this.result.textContent = `✓ You push back! (${this.size}×${this.distance}=${this.currentPower})`;
            this.result.className = 'success';
        } else {
            this.oxygen -= 15;
            this.result.textContent = `✗ Overwhelmed! Needed ${this.currentPower} (${this.size}×${this.distance})`;
            this.result.className = 'failure';
        }

        this.updateDisplay();

        if (this.oxygen <= 0) {
            this.lose();
            return;
        }

        setTimeout(() => this.nextRound(), 1000);
    }

    updateDisplay() {
        this.oxygenDisplay.textContent = this.oxygen;
        this.adrenalinDisplay.textContent = this.adrenalin;
    }

    win() {
        this.gameActive = false;
        this.result.textContent = '🏆 YOU SURVIVED THE ARENA! Champion!';
        this.result.className = 'success';
        this.endGame();
    }

    lose() {
        this.gameActive = false;
        this.result.textContent = '💀 You collapsed from exhaustion!';
        this.result.className = 'failure';
        this.endGame();
    }

    endGame() {
        this.startBtn.disabled = false;
        this.fightBtn.disabled = true;
    }
}

// Jaws
class JawsGame {
    constructor() {
        this.size = 10;
        this.jaws = { x: 5, y: 5 };
        this.hunter = { x: 0, y: 0 };
        this.people = [];
        this.score = 0;
        this.gameActive = false;

        this.grid = document.getElementById('jaws-grid');
        this.scoreDisplay = document.getElementById('jaws-score');
        this.startBtn = document.getElementById('jaws-start-btn');
        this.result = document.getElementById('jaws-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', e => {
            if (!this.gameActive) return;
            const moves = {
                'w': {x: 0, y: -1}, 'arrowup': {x: 0, y: -1},
                's': {x: 0, y: 1}, 'arrowdown': {x: 0, y: 1},
                'a': {x: -1, y: 0}, 'arrowleft': {x: -1, y: 0},
                'd': {x: 1, y: 0}, 'arrowright': {x: 1, y: 0}
            };
            const move = moves[e.key.toLowerCase()];
            if (move) {
                e.preventDefault();
                this.moveJaws(move.x, move.y);
            }
        });
        this.render();
    }

    startGame() {
        this.jaws = { x: 5, y: 5 };
        this.hunter = { x: 0, y: 0 };
        this.people = [];
        this.score = 0;
        this.gameActive = true;

        // Spawn people
        for (let i = 0; i < 8; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * this.size);
                y = Math.floor(Math.random() * this.size);
            } while ((x === 5 && y === 5) || (x === 0 && y === 0));
            this.people.push({ x, y });
        }

        this.scoreDisplay.textContent = 0;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.render();
    }

    moveJaws(dx, dy) {
        const newX = Math.max(0, Math.min(this.size - 1, this.jaws.x + dx));
        const newY = Math.max(0, Math.min(this.size - 1, this.jaws.y + dy));
        this.jaws.x = newX;
        this.jaws.y = newY;

        this.checkEat();
        this.moveHunter();

        if (this.checkCaught()) {
            this.gameActive = false;
            this.result.textContent = `🔫 CAUGHT! Final score: ${this.score}`;
            this.result.className = 'failure';
            this.startBtn.disabled = false;
        }

        if (this.people.length === 0) {
            this.gameActive = false;
            this.result.textContent = `🏆 All eaten! Score: ${this.score}`;
            this.result.className = 'success';
            this.startBtn.disabled = false;
        }

        this.render();
    }

    checkEat() {
        const before = this.people.length;
        this.people = this.people.filter(p => !(p.x === this.jaws.x && p.y === this.jaws.y));
        const eaten = before - this.people.length;
        this.score += eaten;
        this.scoreDisplay.textContent = this.score;
    }

    moveHunter() {
        if (this.hunter.x < this.jaws.x) this.hunter.x++;
        else if (this.hunter.x > this.jaws.x) this.hunter.x--;
        if (this.hunter.y < this.jaws.y) this.hunter.y++;
        else if (this.hunter.y > this.jaws.y) this.hunter.y--;
    }

    checkCaught() {
        return this.hunter.x === this.jaws.x && this.hunter.y === this.jaws.y;
    }

    render() {
        this.grid.innerHTML = '';
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'jaws-cell';

                if (x === this.jaws.x && y === this.jaws.y) {
                    cell.textContent = '🦈';
                    cell.classList.add('jaws');
                } else if (x === this.hunter.x && y === this.hunter.y) {
                    cell.textContent = '🔫';
                    cell.classList.add('hunter');
                } else if (this.people.some(p => p.x === x && p.y === y)) {
                    cell.textContent = '🏃';
                    cell.classList.add('person');
                }

                this.grid.appendChild(cell);
            }
        }
    }
}

// Flying Witches
class WitchGame {
    constructor() {
        this.canvas = document.getElementById('witch-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.brooms = 3;
        this.collected = 0;
        this.needed = 5;
        this.witchY = 50;
        this.swooping = false;
        this.items = [];
        this.snatcher = { x: -50, y: 150 };
        this.gameActive = false;
        this.scrollX = 0;

        this.broomsDisplay = document.getElementById('witch-brooms');
        this.collectedDisplay = document.getElementById('witch-collected');
        this.startBtn = document.getElementById('witch-start-btn');
        this.result = document.getElementById('witch-result');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', e => {
            if (this.gameActive && e.code === 'Space') {
                e.preventDefault();
                this.swoop();
            }
        });
    }

    startGame() {
        this.brooms = 3;
        this.collected = 0;
        this.witchY = 50;
        this.swooping = false;
        this.scrollX = 0;
        this.gameActive = true;
        this.items = [];
        this.snatcher = { x: Math.random() * 200 + 300, y: 150 };

        // Generate items
        for (let i = 0; i < 8; i++) {
            this.items.push({
                x: 100 + i * 80 + Math.random() * 40,
                y: 150,
                type: ['🦎', '🧠', '👁️', '🕷️', '🍄'][Math.floor(Math.random() * 5)],
                collected: false
            });
        }

        this.broomsDisplay.textContent = this.brooms;
        this.collectedDisplay.textContent = this.collected;
        this.result.textContent = '';
        this.startBtn.disabled = true;
        this.gameLoop();
    }

    swoop() {
        if (!this.swooping && this.witchY < 100) {
            this.swooping = true;
        }
    }

    gameLoop() {
        if (!this.gameActive) return;

        // Scroll
        this.scrollX += 2;

        // Witch movement
        if (this.swooping) {
            this.witchY += 5;
            if (this.witchY >= 150) {
                this.witchY = 150;
                this.checkCollection();
                this.swooping = false;
            }
        } else if (this.witchY > 50) {
            this.witchY -= 3;
        }

        // Check snatcher collision
        const witchX = 80;
        if (this.witchY >= 140 &&
            this.snatcher.x - this.scrollX > witchX - 30 &&
            this.snatcher.x - this.scrollX < witchX + 30) {
            this.brooms--;
            this.broomsDisplay.textContent = this.brooms;
            this.snatcher.x += 500; // Move snatcher away
            if (this.brooms <= 0) {
                this.lose();
                return;
            }
        }

        // Check win
        if (this.collected >= this.needed) {
            this.win();
            return;
        }

        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    checkCollection() {
        const witchX = 80 + this.scrollX;
        this.items.forEach(item => {
            if (!item.collected && Math.abs(item.x - witchX) < 30) {
                item.collected = true;
                this.collected++;
                this.collectedDisplay.textContent = this.collected;
            }
        });
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Sky
        ctx.fillStyle = '#113';
        ctx.fillRect(0, 0, w, h);

        // Stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect((i * 47 - this.scrollX * 0.1) % w, (i * 23) % (h - 50), 2, 2);
        }

        // Ground
        ctx.fillStyle = '#220';
        ctx.fillRect(0, 170, w, 30);

        // Items
        ctx.font = '20px sans-serif';
        this.items.forEach(item => {
            if (!item.collected) {
                const screenX = item.x - this.scrollX;
                if (screenX > -30 && screenX < w + 30) {
                    ctx.fillText(item.type, screenX, item.y);
                }
            }
        });

        // Snatcher
        const sX = this.snatcher.x - this.scrollX;
        if (sX > -30 && sX < w + 30) {
            ctx.fillText('👹', sX, this.snatcher.y);
        }

        // Witch
        ctx.fillText('🧹', 80, this.witchY);
        ctx.fillText('🧙‍♀️', 70, this.witchY - 15);
    }

    win() {
        this.gameActive = false;
        this.result.textContent = '🎉 All ingredients collected!';
        this.result.className = 'success';
        this.startBtn.disabled = false;
    }

    lose() {
        this.gameActive = false;
        this.result.textContent = '💥 Out of broomsticks!';
        this.result.className = 'failure';
        this.startBtn.disabled = false;
    }
}

// Micropuzzle Text Adventure
class MicropuzzleGame {
    constructor() {
        this.currentRoom = 0;
        this.inventory = [];
        this.flags = {};
        this.rooms = [
            {
                name: "Dark Cell",
                desc: "You wake up in a cold, dark cell. Stone walls surround you. There's a rusty DOOR to the NORTH. A small KEY glints on the floor.",
                exits: { north: 1 },
                items: ['key'],
                locked: false
            },
            {
                name: "Corridor",
                desc: "A damp corridor stretches before you. Torches flicker on the walls. Exits lead SOUTH to the cell, EAST to a strange light, and WEST to darkness.",
                exits: { south: 0, east: 2, west: 3 },
                items: [],
                locked: false
            },
            {
                name: "Exit Chamber",
                desc: "Bright light floods through an open archway! Freedom awaits! This is the EXIT.",
                exits: { west: 1 },
                items: [],
                locked: false
            },
            {
                name: "Dark Room",
                desc: "Complete darkness. You hear dripping water. Something SHINY is on the ground. Exit is EAST.",
                exits: { east: 1 },
                items: ['gem'],
                locked: false
            }
        ];

        this.output = document.getElementById('micro-output');
        this.input = document.getElementById('micro-input');
        this.submitBtn = document.getElementById('micro-submit-btn');
        this.restartBtn = document.getElementById('micro-restart-btn');

        this.init();
    }

    init() {
        this.submitBtn.addEventListener('click', () => this.processCommand());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.input.addEventListener('keypress', e => { if (e.key === 'Enter') this.processCommand(); });
        this.restart();
    }

    restart() {
        this.currentRoom = 0;
        this.inventory = [];
        this.flags = {};
        this.rooms[0].items = ['key'];
        this.rooms[3].items = ['gem'];
        this.output.innerHTML = '';
        this.print("=== MICROPUZZLE ===");
        this.print("Type commands like: GO NORTH, LOOK, TAKE KEY, INVENTORY");
        this.print("");
        this.look();
    }

    print(text) {
        this.output.innerHTML += text + '\n';
        this.output.scrollTop = this.output.scrollHeight;
    }

    processCommand() {
        const cmd = this.input.value.trim().toUpperCase();
        this.input.value = '';
        if (!cmd) return;

        this.print(`> ${cmd}`);

        const parts = cmd.split(' ');
        const verb = parts[0];
        const noun = parts.slice(1).join(' ');

        switch (verb) {
            case 'GO':
            case 'MOVE':
            case 'WALK':
                this.go(noun.toLowerCase());
                break;
            case 'LOOK':
            case 'L':
                this.look();
                break;
            case 'TAKE':
            case 'GET':
            case 'GRAB':
                this.take(noun.toLowerCase());
                break;
            case 'DROP':
                this.drop(noun.toLowerCase());
                break;
            case 'INVENTORY':
            case 'INV':
            case 'I':
                this.showInventory();
                break;
            case 'EXAMINE':
            case 'LOOK AT':
            case 'X':
                this.examine(noun.toLowerCase());
                break;
            case 'HELP':
                this.print("Commands: GO [direction], LOOK, TAKE [item], DROP [item], INVENTORY, EXAMINE [thing]");
                break;
            default:
                this.print("I don't understand that command. Type HELP for help.");
        }

        this.print("");
    }

    look() {
        const room = this.rooms[this.currentRoom];
        this.print(`[${room.name}]`);
        this.print(room.desc);
        if (room.items.length > 0) {
            this.print(`You can see: ${room.items.join(', ')}`);
        }

        // Check for win
        if (this.currentRoom === 2) {
            this.print("");
            this.print("*** CONGRATULATIONS! You escaped! ***");
        }
    }

    go(direction) {
        const room = this.rooms[this.currentRoom];
        const validDirs = ['north', 'south', 'east', 'west', 'n', 's', 'e', 'w'];

        // Handle shorthand
        const dirMap = { 'n': 'north', 's': 'south', 'e': 'east', 'w': 'west' };
        direction = dirMap[direction] || direction;

        if (!validDirs.includes(direction)) {
            this.print("Go where? Try: NORTH, SOUTH, EAST, or WEST");
            return;
        }

        if (room.exits[direction] !== undefined) {
            this.currentRoom = room.exits[direction];
            this.look();
        } else {
            this.print("You can't go that way.");
        }
    }

    take(item) {
        const room = this.rooms[this.currentRoom];
        const idx = room.items.indexOf(item);
        if (idx !== -1) {
            room.items.splice(idx, 1);
            this.inventory.push(item);
            this.print(`You take the ${item}.`);
        } else {
            this.print(`You don't see a ${item} here.`);
        }
    }

    drop(item) {
        const idx = this.inventory.indexOf(item);
        if (idx !== -1) {
            this.inventory.splice(idx, 1);
            this.rooms[this.currentRoom].items.push(item);
            this.print(`You drop the ${item}.`);
        } else {
            this.print(`You don't have a ${item}.`);
        }
    }

    showInventory() {
        if (this.inventory.length === 0) {
            this.print("You are carrying nothing.");
        } else {
            this.print(`You are carrying: ${this.inventory.join(', ')}`);
        }
    }

    examine(thing) {
        const descriptions = {
            'key': 'A rusty iron key. It might unlock something.',
            'gem': 'A beautiful glowing gem. It pulses with inner light.',
            'door': 'A heavy wooden door with iron bands.',
            'walls': 'Cold stone walls, damp with moisture.',
            'torch': 'A flickering torch providing dim light.',
            'torches': 'Flickering torches line the walls.'
        };

        if (descriptions[thing]) {
            this.print(descriptions[thing]);
        } else {
            this.print(`You don't see anything special about the ${thing}.`);
        }
    }
}

// Initialize all games
document.addEventListener('DOMContentLoaded', () => {
    new TowerGame();
    new SkullsGame();
    new WrestlingGame();
    new JawsGame();
    new WitchGame();
    new MicropuzzleGame();

    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    });

    console.log('🔮 Weird Computer Games loaded! Prepare for the bizarre...');
});
