/**
 * Dino Dash - Endless Runner Game
 * A colorful, feature-rich dinosaur runner game
 */

// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    // Physics
    gravity: 0.8,
    jumpForce: -15,
    doubleJumpForce: -12,
    slideTime: 500,

    // Speeds (will increase with level)
    baseSpeed: 6,
    speedIncrement: 0.5,
    maxSpeed: 18,

    // Spawn rates (ms)
    obstacleSpawnMin: 1200,
    obstacleSpawnMax: 2500,
    coinSpawnChance: 0.4,
    powerupSpawnChance: 0.1,

    // Scoring
    distanceScoreMultiplier: 0.1,
    coinValue: 10,
    levelUpScore: 1000,

    // Ground
    groundHeight: 60,

    // Player dimensions
    playerWidth: 50,
    playerHeight: 60,
    playerSlideHeight: 30,
};

// ==================== CHARACTERS ====================
const CHARACTERS = [
    {
        id: 'trex',
        name: 'T-Rex',
        description: 'The classic dinosaur runner',
        icon: '🦖',
        speed: 3,
        jump: 3,
        color: '#2ECC71',
        unlocked: true,
        unlockScore: 0
    },
    {
        id: 'raptor',
        name: 'Velociraptor',
        description: 'Fast and agile hunter',
        icon: '🦕',
        speed: 5,
        jump: 3,
        color: '#3498DB',
        unlocked: true,
        unlockScore: 0
    },
    {
        id: 'pterodactyl',
        name: 'Pterodactyl',
        description: 'Master of the skies',
        icon: '🐉',
        speed: 3,
        jump: 5,
        color: '#9B59B6',
        unlocked: false,
        unlockScore: 2500
    },
    {
        id: 'stego',
        name: 'Stegosaurus',
        description: 'Armored and tough',
        icon: '🐊',
        speed: 2,
        jump: 2,
        color: '#E67E22',
        unlocked: false,
        unlockScore: 5000
    },
    {
        id: 'triceratops',
        name: 'Triceratops',
        description: 'Three-horned champion',
        icon: '🦏',
        speed: 2,
        jump: 4,
        color: '#E74C3C',
        unlocked: false,
        unlockScore: 10000
    },
    {
        id: 'brachiosaurus',
        name: 'Brachiosaurus',
        description: 'The gentle giant',
        icon: '🦒',
        speed: 4,
        jump: 4,
        color: '#1ABC9C',
        unlocked: false,
        unlockScore: 20000
    }
];

// ==================== LEVELS ====================
const LEVELS = [
    {
        name: 'Desert Dawn',
        skyTop: '#87CEEB',
        skyBottom: '#F4D03F',
        groundColor: '#D4A574',
        groundAccent: '#C19A6B',
        cloudColor: 'rgba(255, 255, 255, 0.8)',
        obstacles: ['cactus', 'rock'],
        decorations: ['bush', 'tumbleweed']
    },
    {
        name: 'Jungle Run',
        skyTop: '#228B22',
        skyBottom: '#90EE90',
        groundColor: '#8B4513',
        groundAccent: '#654321',
        cloudColor: 'rgba(144, 238, 144, 0.5)',
        obstacles: ['tree', 'vine', 'log'],
        decorations: ['fern', 'flower']
    },
    {
        name: 'Arctic Escape',
        skyTop: '#E0FFFF',
        skyBottom: '#87CEEB',
        groundColor: '#FFFFFF',
        groundAccent: '#E8E8E8',
        cloudColor: 'rgba(255, 255, 255, 0.9)',
        obstacles: ['iceberg', 'snowman', 'penguin'],
        decorations: ['snowflake', 'igloo']
    },
    {
        name: 'Volcanic Valley',
        skyTop: '#2C1810',
        skyBottom: '#8B0000',
        groundColor: '#3D3D3D',
        groundAccent: '#2D2D2D',
        cloudColor: 'rgba(100, 100, 100, 0.6)',
        obstacles: ['lava_rock', 'fire_pit', 'ash_cloud'],
        decorations: ['ember', 'smoke']
    },
    {
        name: 'Neon City',
        skyTop: '#1A1A2E',
        skyBottom: '#16213E',
        groundColor: '#2D2D44',
        groundAccent: '#3D3D5C',
        cloudColor: 'rgba(165, 94, 234, 0.4)',
        obstacles: ['barrier', 'drone', 'laser'],
        decorations: ['neon_sign', 'hologram']
    }
];

// ==================== POWER-UPS ====================
const POWERUPS = {
    shield: {
        icon: '🛡️',
        duration: 5000,
        color: '#3498DB'
    },
    magnet: {
        icon: '🧲',
        duration: 6000,
        color: '#E74C3C'
    },
    slowmo: {
        icon: '⏱️',
        duration: 4000,
        color: '#9B59B6'
    },
    double: {
        icon: '✨',
        duration: 8000,
        color: '#F39C12'
    }
};

// ==================== GAME STATE ====================
let canvas, ctx;
let gameState = 'menu'; // menu, playing, paused, gameover
let animationId = null;
let lastTime = 0;
let deltaTime = 0;
let fps = 0;
let fpsFrames = 0;
let fpsTime = 0;

// Player
let player = {
    x: 80,
    y: 0,
    vy: 0,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    isJumping: false,
    isSliding: false,
    canDoubleJump: true,
    slideTimer: 0,
    character: CHARACTERS[0]
};

// Game objects
let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let clouds = [];
let decorations = [];

// Timers and spawning
let obstacleTimer = 0;
let obstacleSpawnTime = CONFIG.obstacleSpawnMax;
let distance = 0;

// Score and level
let score = 0;
let coinCount = 0;
let level = 0;
let gameSpeed = CONFIG.baseSpeed;
let combo = 1;
let comboTimer = 0;

// Active power-up
let activePowerup = null;
let powerupTimer = 0;

// Settings
let settings = {
    sfx: true,
    music: true,
    vibration: true,
    showFps: false
};

// High score
let highScore = 0;

// Audio context and sounds
let audioContext = null;
let sounds = {};

// ==================== INITIALIZATION ====================
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    loadSettings();
    loadHighScore();
    loadUnlockedCharacters();

    initAudio();
    setupEventListeners();
    populateCharacterGrid();
    updateHighScoreDisplay();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate initial clouds
    for (let i = 0; i < 5; i++) {
        clouds.push(createCloud(Math.random() * canvas.width));
    }
}

function resizeCanvas() {
    const wrapper = document.querySelector('.game-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;

    // Reset player ground position
    player.y = canvas.height - CONFIG.groundHeight - player.height;
}

// ==================== AUDIO SYSTEM ====================
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create simple sound effects using oscillators
        sounds.jump = () => playTone(400, 0.1, 'square');
        sounds.doubleJump = () => playTone(600, 0.1, 'square');
        sounds.coin = () => {
            playTone(880, 0.05, 'sine');
            setTimeout(() => playTone(1100, 0.08, 'sine'), 50);
        };
        sounds.hit = () => playTone(150, 0.2, 'sawtooth');
        sounds.levelUp = () => {
            playTone(523, 0.1, 'sine');
            setTimeout(() => playTone(659, 0.1, 'sine'), 100);
            setTimeout(() => playTone(784, 0.15, 'sine'), 200);
        };
        sounds.powerup = () => {
            playTone(440, 0.1, 'sine');
            setTimeout(() => playTone(550, 0.1, 'sine'), 80);
            setTimeout(() => playTone(660, 0.1, 'sine'), 160);
        };
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playTone(freq, duration, type = 'sine') {
    if (!audioContext || !settings.sfx) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playSound(soundName) {
    if (sounds[soundName] && settings.sfx) {
        sounds[soundName]();
    }
}

function vibrate(duration) {
    if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Touch controls for mobile
    const controlLeft = document.getElementById('controlLeft');
    const controlRight = document.getElementById('controlRight');

    if (controlLeft && controlRight) {
        controlLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            slide();
        });

        controlRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jump();
        });

        controlLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            endSlide();
        });
    }

    // Canvas touch for quick play
    canvas.addEventListener('touchstart', (e) => {
        if (gameState !== 'playing') return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;

        // Right side = jump, left side = slide
        if (x > canvas.width / 2) {
            jump();
        }
    });
}

function handleKeyDown(e) {
    if (gameState === 'playing') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            jump();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault();
            slide();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
            togglePause();
        }
    } else if (gameState === 'menu') {
        if (e.code === 'Space' || e.code === 'Enter') {
            startGame();
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        endSlide();
    }
}

// ==================== PLAYER ACTIONS ====================
function jump() {
    if (player.isSliding) return;

    if (!player.isJumping) {
        player.vy = CONFIG.jumpForce + (player.character.jump - 3) * -1;
        player.isJumping = true;
        player.canDoubleJump = true;
        playSound('jump');
    } else if (player.canDoubleJump) {
        player.vy = CONFIG.doubleJumpForce + (player.character.jump - 3) * -0.8;
        player.canDoubleJump = false;
        playSound('doubleJump');
    }
}

function slide() {
    if (player.isJumping) return;

    player.isSliding = true;
    player.height = CONFIG.playerSlideHeight;
    player.y = canvas.height - CONFIG.groundHeight - player.height;
}

function endSlide() {
    if (player.isSliding) {
        player.isSliding = false;
        player.height = CONFIG.playerHeight;
        player.y = canvas.height - CONFIG.groundHeight - player.height;
    }
}

// ==================== GAME LOOP ====================
function gameLoop(currentTime) {
    if (gameState !== 'playing') return;

    deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Cap delta time to prevent huge jumps
    if (deltaTime > 0.1) deltaTime = 0.1;

    // FPS calculation
    fpsFrames++;
    fpsTime += deltaTime;
    if (fpsTime >= 1) {
        fps = fpsFrames;
        fpsFrames = 0;
        fpsTime = 0;
        if (settings.showFps) {
            document.getElementById('fpsCounter').textContent = fps + ' FPS';
        }
    }

    update(deltaTime);
    render();

    animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    const dtMs = dt * 1000;

    // Update game speed based on level
    gameSpeed = Math.min(
        CONFIG.baseSpeed + level * CONFIG.speedIncrement + (player.character.speed - 3) * 0.3,
        CONFIG.maxSpeed
    );

    // Apply slowmo powerup
    let effectiveSpeed = gameSpeed;
    if (activePowerup === 'slowmo') {
        effectiveSpeed *= 0.5;
    }

    // Update distance and score
    distance += effectiveSpeed * dt * 10;
    score = Math.floor(distance * CONFIG.distanceScoreMultiplier);

    // Double score powerup
    if (activePowerup === 'double') {
        score += Math.floor(effectiveSpeed * dt * 10 * CONFIG.distanceScoreMultiplier);
    }

    // Check for level up
    const newLevel = Math.floor(score / CONFIG.levelUpScore);
    if (newLevel > level) {
        levelUp(newLevel);
    }

    // Update player
    updatePlayer(dt);

    // Update obstacles
    updateObstacles(dt, effectiveSpeed);

    // Update coins
    updateCoins(dt, effectiveSpeed);

    // Update powerups
    updatePowerups(dt, effectiveSpeed);

    // Update particles
    updateParticles(dt);

    // Update clouds and decorations
    updateBackground(dt, effectiveSpeed);

    // Spawn obstacles
    obstacleTimer += dtMs;
    if (obstacleTimer >= obstacleSpawnTime) {
        spawnObstacle();
        obstacleTimer = 0;
        obstacleSpawnTime = CONFIG.obstacleSpawnMin +
            Math.random() * (CONFIG.obstacleSpawnMax - CONFIG.obstacleSpawnMin) * (1 - level * 0.05);
        obstacleSpawnTime = Math.max(obstacleSpawnTime, 600);
    }

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer -= dtMs;
        if (comboTimer <= 0) {
            combo = 1;
            document.getElementById('comboDisplay').classList.add('hidden');
        }
    }

    // Update powerup timer
    if (activePowerup) {
        powerupTimer -= dtMs;
        updatePowerupIndicator();
        if (powerupTimer <= 0) {
            deactivatePowerup();
        }
    }

    // Update HUD
    document.getElementById('currentScore').textContent = Math.floor(score);
}

function updatePlayer(dt) {
    // Apply gravity
    player.vy += CONFIG.gravity;
    player.y += player.vy;

    // Ground collision
    const groundY = canvas.height - CONFIG.groundHeight - player.height;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isJumping = false;
        player.canDoubleJump = true;
    }

    // Auto end slide after time
    if (player.isSliding) {
        player.slideTimer += dt * 1000;
        if (player.slideTimer >= CONFIG.slideTime) {
            endSlide();
            player.slideTimer = 0;
        }
    }
}

function updateObstacles(dt, speed) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        // Remove off-screen obstacles
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            // Increase combo for successfully passing
            combo = Math.min(combo + 0.5, 5);
            comboTimer = 3000;
            updateComboDisplay();
            continue;
        }

        // Check collision
        if (checkCollision(player, obs)) {
            if (activePowerup === 'shield') {
                // Shield blocks hit
                deactivatePowerup();
                obstacles.splice(i, 1);
                createExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, '#3498DB');
                playSound('powerup');
            } else {
                gameOver();
                return;
            }
        }
    }
}

function updateCoins(dt, speed) {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= speed;
        coin.rotation += dt * 5;

        // Magnet effect
        if (activePowerup === 'magnet') {
            const dx = player.x + player.width / 2 - coin.x;
            const dy = player.y + player.height / 2 - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                coin.x += dx * 0.1;
                coin.y += dy * 0.1;
            }
        }

        // Remove off-screen
        if (coin.x + coin.size < 0) {
            coins.splice(i, 1);
            continue;
        }

        // Check collection
        if (checkCollision(player, { x: coin.x - coin.size / 2, y: coin.y - coin.size / 2,
                                      width: coin.size, height: coin.size })) {
            collectCoin(coin, i);
        }
    }
}

function collectCoin(coin, index) {
    coins.splice(index, 1);
    let value = CONFIG.coinValue * combo;
    if (activePowerup === 'double') value *= 2;
    score += value;
    coinCount++;
    playSound('coin');
    createExplosion(coin.x, coin.y, '#FFD700');
}

function updatePowerups(dt, speed) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.x -= speed;
        pu.floatOffset = Math.sin(Date.now() * 0.005) * 10;

        if (pu.x + pu.size < 0) {
            powerups.splice(i, 1);
            continue;
        }

        if (checkCollision(player, { x: pu.x - pu.size / 2, y: pu.y + pu.floatOffset - pu.size / 2,
                                      width: pu.size, height: pu.size })) {
            collectPowerup(pu, i);
        }
    }
}

function collectPowerup(pu, index) {
    powerups.splice(index, 1);
    activatePowerup(pu.type);
    playSound('powerup');
    createExplosion(pu.x, pu.y, POWERUPS[pu.type].color);
}

function activatePowerup(type) {
    activePowerup = type;
    powerupTimer = POWERUPS[type].duration;

    const indicator = document.getElementById('powerupIndicator');
    const icon = document.getElementById('powerupIcon');
    indicator.classList.remove('hidden');
    icon.textContent = POWERUPS[type].icon;
}

function deactivatePowerup() {
    activePowerup = null;
    powerupTimer = 0;
    document.getElementById('powerupIndicator').classList.add('hidden');
}

function updatePowerupIndicator() {
    if (!activePowerup) return;
    const fill = document.getElementById('powerupTimerFill');
    const percent = (powerupTimer / POWERUPS[activePowerup].duration) * 100;
    fill.style.width = percent + '%';
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= dt;
        p.alpha = p.life / p.maxLife;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateBackground(dt, speed) {
    // Update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= speed * 0.3;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
            clouds.push(createCloud(canvas.width + 100));
        }
    }

    // Update decorations
    for (let i = decorations.length - 1; i >= 0; i--) {
        decorations[i].x -= speed;
        if (decorations[i].x + 50 < 0) {
            decorations.splice(i, 1);
        }
    }

    // Spawn new decorations
    if (Math.random() < 0.02) {
        decorations.push({
            x: canvas.width + 50,
            y: canvas.height - CONFIG.groundHeight - Math.random() * 20,
            type: LEVELS[level % LEVELS.length].decorations[
                Math.floor(Math.random() * LEVELS[level % LEVELS.length].decorations.length)
            ]
        });
    }
}

function updateComboDisplay() {
    const display = document.getElementById('comboDisplay');
    const value = display.querySelector('.combo-value');
    if (combo > 1) {
        display.classList.remove('hidden');
        value.textContent = 'x' + combo.toFixed(1);
    }
}

// ==================== SPAWNING ====================
function spawnObstacle() {
    const currentLevel = LEVELS[level % LEVELS.length];
    const type = currentLevel.obstacles[Math.floor(Math.random() * currentLevel.obstacles.length)];

    let width, height, y;
    const isFlying = Math.random() < 0.2 && level > 0;

    // Obstacle sizing
    if (type === 'cactus' || type === 'tree' || type === 'iceberg' || type === 'lava_rock' || type === 'barrier') {
        width = 30 + Math.random() * 20;
        height = 50 + Math.random() * 30;
        y = canvas.height - CONFIG.groundHeight - height;
    } else if (type === 'rock' || type === 'log' || type === 'snowman') {
        width = 40 + Math.random() * 20;
        height = 30 + Math.random() * 20;
        y = canvas.height - CONFIG.groundHeight - height;
    } else {
        // Flying obstacles
        width = 40;
        height = 30;
        y = canvas.height - CONFIG.groundHeight - 80 - Math.random() * 60;
    }

    if (isFlying) {
        y = canvas.height - CONFIG.groundHeight - 100 - Math.random() * 40;
        height = 30;
    }

    obstacles.push({
        x: canvas.width + 50,
        y: y,
        width: width,
        height: height,
        type: type,
        isFlying: isFlying
    });

    // Spawn coins near obstacle
    if (Math.random() < CONFIG.coinSpawnChance) {
        spawnCoins(canvas.width + 50 + width + 50);
    }

    // Spawn powerup
    if (Math.random() < CONFIG.powerupSpawnChance && !activePowerup) {
        spawnPowerup(canvas.width + 200);
    }
}

function spawnCoins(startX) {
    const count = 3 + Math.floor(Math.random() * 4);
    const pattern = Math.random();

    for (let i = 0; i < count; i++) {
        let x = startX + i * 35;
        let y;

        if (pattern < 0.33) {
            // Straight line
            y = canvas.height - CONFIG.groundHeight - 80;
        } else if (pattern < 0.66) {
            // Arc
            y = canvas.height - CONFIG.groundHeight - 60 - Math.sin(i / count * Math.PI) * 60;
        } else {
            // High line (requires jump)
            y = canvas.height - CONFIG.groundHeight - 130;
        }

        coins.push({
            x: x,
            y: y,
            size: 20,
            rotation: Math.random() * Math.PI * 2
        });
    }
}

function spawnPowerup(x) {
    const types = Object.keys(POWERUPS);
    const type = types[Math.floor(Math.random() * types.length)];

    powerups.push({
        x: x,
        y: canvas.height - CONFIG.groundHeight - 100,
        size: 30,
        type: type,
        floatOffset: 0
    });
}

function createCloud(x) {
    return {
        x: x,
        y: 50 + Math.random() * 100,
        width: 80 + Math.random() * 80,
        height: 30 + Math.random() * 30
    };
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            size: 3 + Math.random() * 5,
            color: color,
            life: 0.5,
            maxLife: 0.5,
            alpha: 1
        });
    }
}

// ==================== COLLISION ====================
function checkCollision(a, b) {
    const padding = 5; // Small padding for more forgiving collisions
    return a.x + padding < b.x + b.width - padding &&
           a.x + a.width - padding > b.x + padding &&
           a.y + padding < b.y + b.height - padding &&
           a.y + a.height - padding > b.y + padding;
}

// ==================== RENDERING ====================
function render() {
    const currentLevel = LEVELS[level % LEVELS.length];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, currentLevel.skyTop);
    skyGradient.addColorStop(1, currentLevel.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = currentLevel.cloudColor;
    clouds.forEach(cloud => {
        drawCloud(cloud);
    });

    // Draw decorations
    decorations.forEach(dec => {
        drawDecoration(dec);
    });

    // Draw ground
    ctx.fillStyle = currentLevel.groundColor;
    ctx.fillRect(0, canvas.height - CONFIG.groundHeight, canvas.width, CONFIG.groundHeight);

    // Ground accent line
    ctx.fillStyle = currentLevel.groundAccent;
    ctx.fillRect(0, canvas.height - CONFIG.groundHeight, canvas.width, 4);

    // Draw powerups
    powerups.forEach(pu => drawPowerup(pu));

    // Draw coins
    coins.forEach(coin => drawCoin(coin));

    // Draw obstacles
    obstacles.forEach(obs => drawObstacle(obs));

    // Draw player
    drawPlayer();

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    ctx.save();

    // Shield effect
    if (activePowerup === 'shield') {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2,
                player.width * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    const char = player.character;

    // Body
    ctx.fillStyle = char.color;

    if (player.isSliding) {
        // Sliding pose - flattened
        ctx.fillRect(player.x, player.y, player.width * 1.2, player.height);
    } else {
        // Normal or jumping pose
        // Body
        ctx.beginPath();
        ctx.roundRect(player.x + 5, player.y + 10, player.width - 10, player.height - 15, 8);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.roundRect(player.x + player.width - 25, player.y, 30, 25, 5);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(player.x + player.width - 8, player.y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(player.x + player.width - 6, player.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Legs (animated when running)
        ctx.fillStyle = char.color;
        const legOffset = player.isJumping ? 0 : Math.sin(Date.now() * 0.02) * 5;
        ctx.fillRect(player.x + 10, player.y + player.height - 15, 10, 15 + legOffset);
        ctx.fillRect(player.x + 25, player.y + player.height - 15, 10, 15 - legOffset);

        // Tail
        ctx.beginPath();
        ctx.moveTo(player.x, player.y + 20);
        ctx.lineTo(player.x - 15, player.y + 25);
        ctx.lineTo(player.x, player.y + 35);
        ctx.fill();
    }

    ctx.restore();
}

function drawObstacle(obs) {
    ctx.save();

    const currentLevel = LEVELS[level % LEVELS.length];

    // Different colors/styles based on level
    if (obs.type === 'cactus') {
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(obs.x + obs.width / 2 - 5, obs.y, 10, obs.height);
        ctx.fillRect(obs.x, obs.y + 15, obs.width, 8);
        ctx.fillRect(obs.x, obs.y + 10, 8, 20);
        ctx.fillRect(obs.x + obs.width - 8, obs.y + 10, 8, 20);
    } else if (obs.type === 'rock' || obs.type === 'lava_rock') {
        ctx.fillStyle = obs.type === 'lava_rock' ? '#4A4A4A' : '#7B7B7B';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
    } else if (obs.type === 'tree' || obs.type === 'vine') {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(obs.x + obs.width / 2 - 8, obs.y + 20, 16, obs.height - 20);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + 20, 25, 0, Math.PI * 2);
        ctx.fill();
    } else if (obs.type === 'iceberg') {
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width * 0.3, obs.y);
        ctx.lineTo(obs.x + obs.width * 0.7, obs.y + 10);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#E1F5FE';
        ctx.fill();
    } else if (obs.type === 'barrier' || obs.type === 'drone') {
        ctx.fillStyle = obs.type === 'drone' ? '#E91E63' : '#FF5722';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Neon glow
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 15;
        ctx.fillRect(obs.x, obs.y, obs.width, 3);
    } else {
        // Default obstacle
        ctx.fillStyle = '#795548';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    ctx.restore();
}

function drawCoin(coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate(coin.rotation);

    // Outer ring
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, coin.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(-3, -3, coin.size / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPowerup(pu) {
    ctx.save();

    const config = POWERUPS[pu.type];
    const y = pu.y + pu.floatOffset;

    // Glow
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 20;

    // Background circle
    ctx.fillStyle = config.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(pu.x, y, pu.size / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(pu.x, y, pu.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.shadowBlur = 0;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, pu.x, y);

    ctx.restore();
}

function drawCloud(cloud) {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.height / 2, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.height / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawDecoration(dec) {
    ctx.save();
    ctx.fillStyle = LEVELS[level % LEVELS.length].groundAccent;

    if (dec.type === 'bush' || dec.type === 'fern') {
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y, 15, Math.PI, 0);
        ctx.fill();
    } else if (dec.type === 'snowflake') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - 50 + Math.sin(Date.now() * 0.002) * 20, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ==================== LEVEL SYSTEM ====================
function levelUp(newLevel) {
    level = newLevel;
    playSound('levelUp');
    vibrate(100);

    // Update HUD
    const levelDisplay = document.getElementById('levelDisplay');
    levelDisplay.querySelector('.level-badge').textContent = 'Level ' + (level + 1);
    levelDisplay.querySelector('.level-name').textContent = LEVELS[level % LEVELS.length].name;

    // Show level up notification
    const notification = document.getElementById('levelUpNotification');
    const levelName = document.getElementById('levelUpName');
    levelName.textContent = LEVELS[level % LEVELS.length].name;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

// ==================== GAME STATE ====================
function startGame() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Reset game state
    gameState = 'playing';
    score = 0;
    coinCount = 0;
    distance = 0;
    level = 0;
    gameSpeed = CONFIG.baseSpeed;
    combo = 1;
    comboTimer = 0;

    // Reset player
    player.y = canvas.height - CONFIG.groundHeight - player.height;
    player.vy = 0;
    player.isJumping = false;
    player.isSliding = false;
    player.height = CONFIG.playerHeight;

    // Clear game objects
    obstacles = [];
    coins = [];
    powerups = [];
    particles = [];
    decorations = [];
    activePowerup = null;

    // Reset timers
    obstacleTimer = 0;
    obstacleSpawnTime = CONFIG.obstacleSpawnMax;

    // Update HUD
    document.getElementById('currentScore').textContent = '0';
    document.getElementById('comboDisplay').classList.add('hidden');
    document.getElementById('powerupIndicator').classList.add('hidden');

    const levelDisplay = document.getElementById('levelDisplay');
    levelDisplay.querySelector('.level-badge').textContent = 'Level 1';
    levelDisplay.querySelector('.level-name').textContent = LEVELS[0].name;

    // Show game screen
    showScreen('gameScreen');

    // Show FPS if enabled
    document.getElementById('fpsCounter').classList.toggle('hidden', !settings.showFps);

    // Start game loop
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        cancelAnimationFrame(animationId);
        document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseOverlay').classList.add('hidden');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameState = 'gameover';
    cancelAnimationFrame(animationId);

    playSound('hit');
    vibrate(200);

    // Check high score
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
        highScore = Math.floor(score);
        saveHighScore();
        checkCharacterUnlocks();
    }

    // Update game over screen
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('finalDistance').textContent = Math.floor(distance) + 'm';
    document.getElementById('finalCoins').textContent = coinCount;
    document.getElementById('finalLevel').textContent = level + 1;

    const newHSElement = document.getElementById('newHighScore');
    newHSElement.classList.toggle('hidden', !isNewHighScore);

    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function restartGame() {
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    startGame();
}

function quitToMenu() {
    gameState = 'menu';
    cancelAnimationFrame(animationId);
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    updateHighScoreDisplay();
    showScreen('menuScreen');
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ==================== CHARACTER SELECT ====================
function populateCharacterGrid() {
    const grid = document.getElementById('characterGrid');
    grid.innerHTML = '';

    CHARACTERS.forEach((char, index) => {
        const card = document.createElement('div');
        card.className = 'character-card' +
            (char.id === player.character.id ? ' selected' : '') +
            (!char.unlocked ? ' locked' : '');
        card.innerHTML = `
            <span class="char-icon">${char.icon}</span>
            <span class="char-label">${char.name}</span>
        `;

        card.addEventListener('click', () => selectCharacter(char, card));
        grid.appendChild(card);
    });

    updateCharacterInfo(player.character);
}

function selectCharacter(char, card) {
    if (!char.unlocked) {
        // Show unlock requirement
        document.getElementById('charName').textContent = char.name;
        document.getElementById('charDesc').textContent = `Unlock at ${char.unlockScore.toLocaleString()} points`;
        return;
    }

    player.character = char;
    saveSelectedCharacter();

    document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    updateCharacterInfo(char);
}

function updateCharacterInfo(char) {
    document.getElementById('charName').textContent = char.name;
    document.getElementById('charDesc').textContent = char.unlocked ? char.description :
        `Unlock at ${char.unlockScore.toLocaleString()} points`;
    document.getElementById('statSpeed').style.width = (char.speed / 5 * 100) + '%';
    document.getElementById('statJump').style.width = (char.jump / 5 * 100) + '%';
}

function checkCharacterUnlocks() {
    let newUnlock = false;

    CHARACTERS.forEach(char => {
        if (!char.unlocked && highScore >= char.unlockScore) {
            char.unlocked = true;
            newUnlock = true;
        }
    });

    if (newUnlock) {
        saveUnlockedCharacters();
        populateCharacterGrid();
    }
}

// ==================== OPTIONS ====================
function toggleSFX() {
    settings.sfx = !settings.sfx;
    updateToggle('sfxToggle', settings.sfx);
    saveSettings();
}

function toggleMusic() {
    settings.music = !settings.music;
    updateToggle('musicToggle', settings.music);
    saveSettings();
}

function toggleVibration() {
    settings.vibration = !settings.vibration;
    updateToggle('vibrationToggle', settings.vibration);
    saveSettings();
}

function toggleFPS() {
    settings.showFps = !settings.showFps;
    updateToggle('fpsToggle', settings.showFps);
    saveSettings();
}

function updateToggle(id, active) {
    const toggle = document.getElementById(id);
    toggle.classList.toggle('active', active);
}

function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem('dinoDash_highScore');
        localStorage.removeItem('dinoDash_unlockedChars');
        localStorage.removeItem('dinoDash_selectedChar');
        highScore = 0;

        CHARACTERS.forEach((char, i) => {
            char.unlocked = i < 2; // First two are unlocked by default
        });

        player.character = CHARACTERS[0];

        populateCharacterGrid();
        updateHighScoreDisplay();
    }
}

// ==================== STORAGE ====================
function saveSettings() {
    localStorage.setItem('dinoDash_settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('dinoDash_settings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        updateToggle('sfxToggle', settings.sfx);
        updateToggle('musicToggle', settings.music);
        updateToggle('vibrationToggle', settings.vibration);
        updateToggle('fpsToggle', settings.showFps);
    }
}

function saveHighScore() {
    localStorage.setItem('dinoDash_highScore', highScore.toString());
}

function loadHighScore() {
    const saved = localStorage.getItem('dinoDash_highScore');
    if (saved) {
        highScore = parseInt(saved, 10);
    }
}

function updateHighScoreDisplay() {
    document.getElementById('menuHighScore').textContent = highScore;
}

function saveUnlockedCharacters() {
    const unlocked = CHARACTERS.filter(c => c.unlocked).map(c => c.id);
    localStorage.setItem('dinoDash_unlockedChars', JSON.stringify(unlocked));
}

function loadUnlockedCharacters() {
    const saved = localStorage.getItem('dinoDash_unlockedChars');
    if (saved) {
        const unlocked = JSON.parse(saved);
        CHARACTERS.forEach(char => {
            char.unlocked = unlocked.includes(char.id);
        });
    }

    // Load selected character
    const selectedId = localStorage.getItem('dinoDash_selectedChar');
    if (selectedId) {
        const char = CHARACTERS.find(c => c.id === selectedId && c.unlocked);
        if (char) {
            player.character = char;
        }
    }
}

function saveSelectedCharacter() {
    localStorage.setItem('dinoDash_selectedChar', player.character.id);
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', init);
