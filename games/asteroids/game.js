const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

let score = 0;
let keys = {};

// Player ship
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    speed: 0,
    vx: 0,
    vy: 0,
    size: 15,
    rotation: 0,
    thrust: 0.15,
    friction: 0.98,
    maxSpeed: 8
};

// Bullets array
const bullets = [];
const bulletSpeed = 7;
const bulletLifetime = 60;

// Asteroids array
const asteroids = [];
const numAsteroids = 5;

// Key handlers
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Create asteroid
function createAsteroid(x, y, size) {
    return {
        x: x || Math.random() * canvas.width,
        y: y || Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: size || 40,
        angle: Math.random() * Math.PI * 2
    };
}

// Initialize asteroids
function initAsteroids() {
    asteroids.length = 0;
    for (let i = 0; i < numAsteroids; i++) {
        let asteroid = createAsteroid();
        // Make sure asteroids don't spawn too close to player
        while (distance(asteroid, player) < 150) {
            asteroid = createAsteroid();
        }
        asteroids.push(asteroid);
    }
}

// Draw ship
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.size, 0);
    ctx.lineTo(-player.size, -player.size / 2);
    ctx.lineTo(-player.size / 2, 0);
    ctx.lineTo(-player.size, player.size / 2);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

// Draw asteroid
function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
        const angle = (Math.PI * 2 / points) * i;
        const radius = asteroid.size * (0.8 + Math.random() * 0.4);
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
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Update player
function updatePlayer() {
    // Rotation
    if (keys['a']) {
        player.angle -= 0.1;
    }
    if (keys['d']) {
        player.angle += 0.1;
    }

    // Thrust
    if (keys['w']) {
        player.vx += Math.cos(player.angle) * player.thrust;
        player.vy += Math.sin(player.angle) * player.thrust;
    }
    if (keys['s']) {
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
    if (keys[' '] && canShoot) {
        bullets.push({
            x: player.x + Math.cos(player.angle) * player.size,
            y: player.y + Math.sin(player.angle) * player.size,
            vx: Math.cos(player.angle) * bulletSpeed + player.vx,
            vy: Math.sin(player.angle) * bulletSpeed + player.vy,
            life: bulletLifetime
        });
        canShoot = false;
        setTimeout(() => canShoot = true, 200);
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
        asteroid.angle += 0.01;

        // Wrap around screen
        if (asteroid.x < 0) asteroid.x = canvas.width;
        if (asteroid.x > canvas.width) asteroid.x = 0;
        if (asteroid.y < 0) asteroid.y = canvas.height;
        if (asteroid.y > canvas.height) asteroid.y = 0;
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
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (distance(asteroids[i], bullets[j]) < asteroids[i].size) {
                // Hit!
                const asteroid = asteroids[i];

                // Add score
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;

                // Remove bullet
                bullets.splice(j, 1);

                // Split asteroid or remove it
                if (asteroid.size > 20) {
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, asteroid.size / 2));
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, asteroid.size / 2));
                }
                asteroids.splice(i, 1);

                break;
            }
        }
    }

    // Respawn asteroids if all destroyed
    if (asteroids.length === 0) {
        initAsteroids();
    }
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update
    updatePlayer();
    shoot();
    updateBullets();
    updateAsteroids();
    checkCollisions();

    // Draw
    drawPlayer();
    bullets.forEach(drawBullet);
    asteroids.forEach(drawAsteroid);

    requestAnimationFrame(gameLoop);
}

// Start game
initAsteroids();
gameLoop();
