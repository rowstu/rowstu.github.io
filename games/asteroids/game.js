const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesContainer = document.getElementById('lives');
const livesDisplay = livesContainer ? livesContainer.querySelector('span') : null;
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let keys = {};
let level = 1;

// Touch controls
let touchThrust = false;
let touchFire = false;
let joystickAngle = null;
let joystickActive = false;

// Player ship
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    size: 15,
    thrust: 0.15,
    friction: 0.98,
    maxSpeed: 8,
    invulnerable: false,
    invulnerableTime: 0,
    visible: true
};

// Particles for explosions
const particles = [];

// Bullets array
const bullets = [];
const bulletSpeed = 7;
const bulletLifetime = 60;

// Asteroids array
const asteroids = [];
const baseAsteroids = 4;

// Asteroid shape cache for consistent shapes
const asteroidShapes = new Map();

function getAsteroidShape(id) {
    if (!asteroidShapes.has(id)) {
        const points = [];
        const numPoints = 10;
        for (let i = 0; i < numPoints; i++) {
            points.push(0.7 + Math.random() * 0.5);
        }
        asteroidShapes.set(id, points);
    }
    return asteroidShapes.get(id);
}

let asteroidIdCounter = 0;

// Key handlers
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Touch controls setup
const joystickZone = document.getElementById('joystickZone');
const joystickKnob = document.getElementById('joystickKnob');
const thrustZone = document.getElementById('thrustZone');
const fireZone = document.getElementById('fireZone');

// Joystick handling
let joystickTouchId = null;
const joystickCenter = { x: 60, y: 60 };
const joystickMaxDist = 40;

function handleJoystickMove(touch) {
    const rect = joystickZone.getBoundingClientRect();
    let x = touch.clientX - rect.left - joystickCenter.x;
    let y = touch.clientY - rect.top - joystickCenter.y;

    const dist = Math.sqrt(x * x + y * y);
    if (dist > joystickMaxDist) {
        x = (x / dist) * joystickMaxDist;
        y = (y / dist) * joystickMaxDist;
    }

    joystickKnob.style.left = (joystickCenter.x + x) + 'px';
    joystickKnob.style.top = (joystickCenter.y + y) + 'px';

    if (dist > 10) {
        joystickAngle = Math.atan2(y, x);
    } else {
        joystickAngle = null;
    }
}

// Only add touch listeners if elements exist
if (joystickZone) {
    joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickTouchId === null) {
            joystickTouchId = e.changedTouches[0].identifier;
            joystickActive = true;
            joystickZone.classList.add('active');
            handleJoystickMove(e.changedTouches[0]);
        }
    });

    joystickZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                handleJoystickMove(touch);
            }
        }
    });

    joystickZone.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                joystickTouchId = null;
                joystickActive = false;
                joystickAngle = null;
                joystickZone.classList.remove('active');
                joystickKnob.style.transform = 'translate(-50%, -50%)';
                joystickKnob.style.left = '50%';
                joystickKnob.style.top = '50%';
            }
        }
    });
}

// Thrust button
if (thrustZone) {
    thrustZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchThrust = true;
        thrustZone.classList.add('active');
    });

    thrustZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchThrust = false;
        thrustZone.classList.remove('active');
    });
}

// Fire button
if (fireZone) {
    fireZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchFire = true;
        fireZone.classList.add('active');
    });

    fireZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchFire = false;
        fireZone.classList.remove('active');
    });
}

// Create asteroid
function createAsteroid(x, y, size) {
    const id = asteroidIdCounter++;
    return {
        id: id,
        x: x !== undefined ? x : Math.random() * canvas.width,
        y: y !== undefined ? y : Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (3 + level * 0.3),
        vy: (Math.random() - 0.5) * (3 + level * 0.3),
        size: size || 40,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03
    };
}

// Create explosion particles
function createExplosion(x, y, color = '#fff', count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 20,
            color: color,
            size: 1 + Math.random() * 2
        });
    }
}

// Initialize asteroids
function initAsteroids() {
    asteroids.length = 0;
    asteroidShapes.clear();
    const numAsteroids = baseAsteroids + Math.floor(level / 2);

    for (let i = 0; i < numAsteroids; i++) {
        let asteroid = createAsteroid();
        while (distance(asteroid, player) < 150) {
            asteroid.x = Math.random() * canvas.width;
            asteroid.y = Math.random() * canvas.height;
        }
        asteroids.push(asteroid);
    }
}

// Reset player
function resetPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.angle = -Math.PI / 2;
    player.invulnerable = true;
    player.invulnerableTime = 180; // 3 seconds at 60fps
}

// Draw ship
function drawPlayer() {
    if (!player.visible) return;

    // Blinking effect when invulnerable
    if (player.invulnerable && Math.floor(player.invulnerableTime / 5) % 2 === 0) {
        return;
    }

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Ship color based on invulnerability
    ctx.strokeStyle = player.invulnerable ? '#3b82f6' : '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size, -player.size / 2);
    ctx.lineTo(-player.size / 2, 0);
    ctx.lineTo(-player.size, player.size / 2);
    ctx.closePath();
    ctx.stroke();

    // Draw thrust flame when thrusting
    if (keys['w'] || touchThrust) {
        ctx.strokeStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-player.size / 2, -player.size / 4);
        ctx.lineTo(-player.size - 5 - Math.random() * 5, 0);
        ctx.lineTo(-player.size / 2, player.size / 4);
        ctx.stroke();
    }

    ctx.restore();
}

// Draw asteroid with consistent shape
function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const shape = getAsteroidShape(asteroid.id);
    const points = shape.length;

    for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 / points) * i;
        const radius = asteroid.size * shape[i];
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

// Draw bullet
function drawBullet(bullet) {
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Draw particles
function drawParticles() {
    for (const particle of particles) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 50;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Update player
function updatePlayer() {
    // Handle invulnerability timer
    if (player.invulnerable) {
        player.invulnerableTime--;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }

    // Rotation from keyboard
    if (keys['a'] || keys['arrowleft']) {
        player.angle -= 0.1;
    }
    if (keys['d'] || keys['arrowright']) {
        player.angle += 0.1;
    }

    // Rotation from joystick - smoothly rotate towards target angle
    if (joystickAngle !== null) {
        let diff = joystickAngle - player.angle;
        // Normalize to -PI to PI
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.angle += diff * 0.1;
    }

    // Thrust from keyboard or touch
    if (keys['w'] || keys['arrowup'] || touchThrust) {
        player.vx += Math.cos(player.angle) * player.thrust;
        player.vy += Math.sin(player.angle) * player.thrust;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.vx -= Math.cos(player.angle) * player.thrust * 0.5;
        player.vy -= Math.sin(player.angle) * player.thrust * 0.5;
    }

    // Apply friction
    player.vx *= player.friction;
    player.vy *= player.friction;

    // Limit max speed
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > player.maxSpeed) {
        player.vx = (player.vx / speed) * player.maxSpeed;
        player.vy = (player.vy / speed) * player.maxSpeed;
    }

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Wrap around screen
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;
    if (player.y < 0) player.y = canvas.height;
    if (player.y > canvas.height) player.y = 0;
}

// Shooting
let canShoot = true;
function shoot() {
    if ((keys[' '] || touchFire) && canShoot) {
        bullets.push({
            x: player.x + Math.cos(player.angle) * player.size,
            y: player.y + Math.sin(player.angle) * player.size,
            vx: Math.cos(player.angle) * bulletSpeed + player.vx * 0.5,
            vy: Math.sin(player.angle) * bulletSpeed + player.vy * 0.5,
            life: bulletLifetime
        });
        canShoot = false;
        setTimeout(() => canShoot = true, 150);
    }
}

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;
        bullets[i].y += bullets[i].vy;
        bullets[i].life--;

        // Wrap around screen
        if (bullets[i].x < 0) bullets[i].x = canvas.width;
        if (bullets[i].x > canvas.width) bullets[i].x = 0;
        if (bullets[i].y < 0) bullets[i].y = canvas.height;
        if (bullets[i].y > canvas.height) bullets[i].y = 0;

        // Remove old bullets
        if (bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

// Update asteroids
function updateAsteroids() {
    for (let asteroid of asteroids) {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.angle += asteroid.rotSpeed;

        // Wrap around screen
        if (asteroid.x < -asteroid.size) asteroid.x = canvas.width + asteroid.size;
        if (asteroid.x > canvas.width + asteroid.size) asteroid.x = -asteroid.size;
        if (asteroid.y < -asteroid.size) asteroid.y = canvas.height + asteroid.size;
        if (asteroid.y > canvas.height + asteroid.size) asteroid.y = -asteroid.size;
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].vx *= 0.98;
        particles[i].vy *= 0.98;
        particles[i].life--;

        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Distance between two objects
function distance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Collision detection
function checkCollisions() {
    // Bullet vs Asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (distance(asteroids[i], bullets[j]) < asteroids[i].size) {
                const asteroid = asteroids[i];

                // Create explosion
                createExplosion(asteroid.x, asteroid.y, '#fff', 8);

                // Add score based on size
                if (asteroid.size > 30) score += 20;
                else if (asteroid.size > 15) score += 50;
                else score += 100;

                scoreDisplay.textContent = `Score: ${score}`;

                // Remove bullet
                bullets.splice(j, 1);

                // Split asteroid or remove it
                if (asteroid.size > 15) {
                    const newSize = asteroid.size / 2;
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, newSize));
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, newSize));
                }
                asteroids.splice(i, 1);

                break;
            }
        }
    }

    // Player vs Asteroid (only if not invulnerable)
    if (!player.invulnerable) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            // Use a slightly smaller hitbox for better feel
            if (distance(asteroids[i], player) < asteroids[i].size * 0.7 + player.size * 0.5) {
                // Player hit!
                lives--;
                updateLivesDisplay();

                // Create big explosion
                createExplosion(player.x, player.y, '#ef4444', 20);
                createExplosion(player.x, player.y, '#f97316', 15);

                if (lives <= 0) {
                    gameOver();
                    return;
                }

                // Reset player position and make invulnerable
                resetPlayer();
                break;
            }
        }
    }

    // Level complete - spawn new asteroids
    if (asteroids.length === 0) {
        level++;
        initAsteroids();
    }
}

// Update lives display
function updateLivesDisplay() {
    if (livesDisplay) {
        livesDisplay.textContent = '♥'.repeat(Math.max(0, lives));
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    player.visible = false;

    setTimeout(() => {
        overlay.classList.remove('hidden');
        overlay.querySelector('h1').textContent = 'GAME OVER';
        overlay.querySelector('p').textContent = `You reached level ${level}`;

        // Add final score display
        let finalScore = overlay.querySelector('.final-score');
        if (!finalScore) {
            finalScore = document.createElement('div');
            finalScore.className = 'final-score';
            overlay.querySelector('p').after(finalScore);
        }
        finalScore.textContent = `Final Score: ${score}`;

        startBtn.textContent = 'PLAY AGAIN';
    }, 1000);
}

// Start game - attached to window for onclick access
window.startGame = function() {
    gameRunning = true;
    score = 0;
    lives = 3;
    level = 1;
    bullets.length = 0;
    particles.length = 0;

    scoreDisplay.textContent = 'Score: 0';
    updateLivesDisplay();

    player.visible = true;
    resetPlayer();
    initAsteroids();

    overlay.classList.add('hidden');
};

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 137) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }

    if (gameRunning) {
        // Update
        updatePlayer();
        shoot();
        updateBullets();
        updateAsteroids();
        updateParticles();
        checkCollisions();
    } else {
        // Still update particles when not running
        updateParticles();
        updateAsteroids();
    }

    // Draw
    asteroids.forEach(drawAsteroid);
    bullets.forEach(drawBullet);
    drawParticles();
    if (player.visible) drawPlayer();

    requestAnimationFrame(gameLoop);
}

// Event listeners - use DOMContentLoaded to ensure button exists
function setupStartButton() {
    const btn = document.getElementById('startBtn');
    console.log('Setting up start button:', btn);
    if (btn) {
        btn.addEventListener('click', function(e) {
            console.log('Click detected');
            e.preventDefault();
            window.startGame();
        });
        btn.addEventListener('mousedown', function(e) {
            console.log('Mousedown detected');
            e.preventDefault();
            window.startGame();
        });
        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            window.startGame();
        });
    }
}

// Run setup now and also on DOMContentLoaded just in case
setupStartButton();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupStartButton);
}

// Prevent scrolling on touch
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#gameContainer')) {
        e.preventDefault();
    }
}, { passive: false });

// Start the loop (but not the game)
gameLoop();
