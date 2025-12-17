const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State ---
let score = 0;
let gameOver = false;
let keys = {};

// --- Player ---
class Player {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 40;
        this.height = 20;
        this.speed = 7;
        this.shootCooldown = 0;
        this.hue = 0; // For rainbow bullets
    }

    update() {
        if (keys['ArrowUp'] && this.y > 0) {
            this.y -= this.speed;
        }
        if (keys['ArrowDown'] && this.y < canvas.height - this.height) {
            this.y += this.speed;
        }
        if (keys[' '] && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 10; // 10 frames cooldown
        }
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        this.hue = (this.hue + 1) % 360; // Cycle hue for rainbow effect
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    shoot() {
        const bulletColor = `hsl(${this.hue}, 100%, 50%)`;
        bullets.push(new Bullet(this.x + this.width, this.y + this.height / 2, bulletColor));
    }
}

// --- Bullet ---
class Bullet {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 5;
        this.speed = 10;
        this.color = color;
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
    }
}

// --- Enemies ---
class Enemy {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 40) + 20;
        this.width = 30;
        this.height = 30;
        this.speedX = Math.random() * 2 + 1;
    }

    update() {
        this.x -= this.speedX;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class EnemyType1 extends Enemy { // Simple straight mover
    constructor() {
        super();
        this.color = '#ff4d4d'; // Red
    }
}

class EnemyType2 extends Enemy { // Sine wave mover
    constructor() {
        super();
        this.color = '#4da6ff'; // Blue
        this.angle = 0;
        this.amplitude = Math.random() * 3 + 1;
    }
    update() {
        super.update();
        this.angle += 0.05;
        this.y += Math.sin(this.angle) * this.amplitude;
    }
}

class EnemyType3 extends Enemy { // Fast zig-zag mover
    constructor() {
        super();
        this.color = '#66ff66'; // Green
        this.speedX = Math.random() * 3 + 3;
        this.speedY = Math.random() * 5 + 3;
        if (Math.random() < 0.5) this.speedY = -this.speedY;
    }
    update() {
        super.update();
        this.y += this.speedY;
        if (this.y <= 0 || this.y >= canvas.height - this.height) {
            this.speedY = -this.speedY;
        }
    }
}

// --- Background Stars (for scrolling effect) ---
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 1.5 + 0.5;
    }
    update() {
        this.x -= this.speed;
        if (this.x < 0) {
            this.x = canvas.width;
            this.y = Math.random() * canvas.height;
        }
    }
    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}


// --- Game Objects Arrays ---
const player = new Player();
const bullets = [];
const enemies = [];
const stars = [];

function init() {
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

// --- Enemy Spawning ---
let enemyTimer = 0;
const enemyInterval = 70; // Spawn every 70 frames

function handleEnemies(frame) {
    if (enemyTimer > enemyInterval) {
        const enemyType = Math.floor(Math.random() * 3);
        if (enemyType === 0) enemies.push(new EnemyType1());
        else if (enemyType === 1) enemies.push(new EnemyType2());
        else enemies.push(new EnemyType3());
        enemyTimer = 0;
    } else {
        enemyTimer++;
    }
}


// --- Collision Detection ---
function handleCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const b = bullets[i];
            const e = enemies[j];

            if (b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y) {
                
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                break; 
            }
        }
    }
     // Player-Enemy collision
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
         if (player.x < e.x + e.width &&
             player.x + player.width > e.x &&
             player.y < e.y + e.height &&
             player.y + player.height > e.y) {
            gameOver = true;
         }
    }
}

// --- Game Loop ---
function animate() {
    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "50px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "30px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 40);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & Draw Background
    stars.forEach(s => { s.update(); s.draw(); });

    // Update & Draw Game Objects
    player.update();
    player.draw();

    bullets.forEach((b, index) => {
        b.update();
        b.draw();
        if (b.x > canvas.width) bullets.splice(index, 1);
    });
    
    handleEnemies();
    enemies.forEach((e, index) => {
        e.update();
        e.draw();
        if (e.x < -e.width) enemies.splice(index, 1);
    });

    handleCollisions();

    // Draw Score
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 25);


    requestAnimationFrame(animate);
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});


init();
animate();
