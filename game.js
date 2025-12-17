const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State ---
let score = 0;
let lives = 3; // Initial lives
let gameOver = false;
let keys = {};
let gameMode = 'normal'; // 'normal', 'boss_intro', 'boss_battle', 'boss_outro'
let scoreSinceLastBoss = 0;
let boss = null;
let outroHue = 0;
let outroTimer = 0;
let bossLevel = 1; // Tracks boss difficulty

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
            this.shootCooldown = 10;
        }
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        this.hue = (this.hue + 1) % 360;
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

// --- Bullets ---
class Bullet {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 5;
        this.speed = 10;
        this.color = color;
    }

    update() { this.x += this.speed; }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
    }
}

class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.speed = -5 - (bossLevel * 0.5); // Boss bullets get faster
    }

    update() { this.x += this.speed; }

    draw() {
        ctx.fillStyle = 'magenta';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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

    update() { this.x -= this.speedX; }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class EnemyType1 extends Enemy {
    constructor() { super(); this.color = '#ff4d4d'; }
}

class EnemyType2 extends Enemy {
    constructor() {
        super();
        this.color = '#4da6ff';
        this.angle = 0;
        this.amplitude = Math.random() * 3 + 1;
    }
    update() {
        super.update();
        this.angle += 0.05;
        this.y += Math.sin(this.angle) * this.amplitude;
    }
}

class EnemyType3 extends Enemy {
    constructor() {
        super();
        this.color = '#66ff66';
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

// --- Boss ---
class Boss {
    constructor() {
        this.x = canvas.width;
        this.y = canvas.height / 2 - 50;
        this.width = 100;
        this.height = 100;
        this.speedX = 2 + (bossLevel * 0.5); // Boss gets faster
        this.speedY = 2 + (bossLevel * 0.5); // Boss gets faster
        this.hp = 100 + (bossLevel * 20); // Boss HP increases
        this.maxHp = this.hp;
        this.introState = 'entering'; // 'entering', 'active'
        this.shootCooldown = 0;
        this.shootInterval = 90 - (bossLevel * 5); // Boss shoots faster
        if (this.shootInterval < 30) this.shootInterval = 30; // Min shoot interval
    }

    update() {
        if (this.introState === 'entering') {
            this.x -= this.speedX;
            if (this.x <= canvas.width - this.width - 50) {
                this.x = canvas.width - this.width - 50;
                this.introState = 'active';
            }
        } else if (this.introState === 'active') {
            this.y += this.speedY;
            if (this.y <= 0 || this.y >= canvas.height - this.height) {
                this.speedY *= -1;
            }
            if (this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = this.shootInterval;
            } else {
                this.shootCooldown--;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        const hpBarWidth = (this.hp / this.maxHp) * this.width;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 15, this.width, 10);
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x, this.y - 15, hpBarWidth, 10);
    }
    
    shoot() {
        const bulletY = this.y + this.height / 2;
        enemyBullets.push(new EnemyBullet(this.x, bulletY));
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
    }
}

// --- Background Stars ---
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
const enemyBullets = [];
const enemies = [];
const stars = [];

function init() {
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

// Resets game state for a new round (after losing a life or defeating boss)
function resetGameRound() {
    player.x = 50;
    player.y = canvas.height / 2;
    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    boss = null;
    gameMode = 'normal';
    scoreSinceLastBoss = 0;
    outroTimer = 0;
    enemyTimer = 0;
}

// --- Enemy Spawning ---
let enemyTimer = 0;
const enemyInterval = 70;

function handleEnemies() {
    if (gameMode !== 'normal') return;

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
    // Player bullets vs Enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const b = bullets[i];
            const e = enemies[j];
            if (b && e && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                scoreSinceLastBoss += 10;
                break;
            }
        }
    }

    // Player bullets vs Boss
    if (gameMode === 'boss_battle' && boss) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (b && b.x < boss.x + boss.width && b.x + b.width > boss.x && b.y < boss.y + boss.height && b.y + b.height > boss.y) {
                bullets.splice(i, 1);
                const isDefeated = boss.takeDamage(5);
                 if (isDefeated) {
                    score += 500;
                    scoreSinceLastBoss = 0;
                    bossLevel++; // Increase boss difficulty
                    startBossCelebration();
                }
            }
        }
    }

    // Player vs Dangers
    // Check if player collides with anything
    let playerHit = false;
    // Player vs Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (player.x < enemies[i].x + enemies[i].width && player.x + player.width > enemies[i].x && player.y < enemies[i].y + enemies[i].height && player.y + player.height > enemies[i].y) {
            playerHit = true;
            enemies.splice(i, 1); // Remove enemy on collision
            break;
        }
    }
    // Player vs Boss
    if (!playerHit && boss && gameMode === 'boss_battle' && player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) {
         playerHit = true;
    }
    // Player vs Enemy Bullets
    if (!playerHit) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            if (player.x < eb.x + eb.width && player.x + player.width > eb.x && player.y < eb.y + eb.height && player.y + player.height > eb.y) {
                playerHit = true;
                enemyBullets.splice(i, 1); // Remove bullet on collision
                break;
            }
        }
    }

    if (playerHit) {
        lives--;
        if (lives <= 0) {
            gameOver = true;
        } else {
            resetGameRound();
        }
    }
}

function startBossBattle() {
    gameMode = 'boss_intro';
    enemies.length = 0;
    boss = new Boss();
    setTimeout(() => {
        gameMode = 'boss_battle';
    }, 2000);
}

function startBossCelebration() {
    gameMode = 'boss_outro';
    outroTimer = 0;
    boss = null;
    enemyBullets.length = 0;
    enemies.length = 0; // Clear any remaining normal enemies
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

    stars.forEach(s => { s.update(); s.draw(); });

    switch (gameMode) {
        case 'normal':
        case 'boss_battle':
        case 'boss_intro':
            player.update();
            player.draw();

            bullets.forEach((b, index) => {
                b.update(); b.draw();
                if (b.x > canvas.width) bullets.splice(index, 1);
            });
            
            enemyBullets.forEach((eb, index) => {
                eb.update(); eb.draw();
                if (eb.x < 0) enemyBullets.splice(index, 1);
            });

            if (gameMode === 'normal') handleEnemies();
             
            enemies.forEach((e, index) => {
                e.update(); e.draw();
                if (e.x < -e.width) enemies.splice(index, 1);
            });

            if (boss) {
                boss.update();
                boss.draw();
            }

            handleCollisions();
            
            if (scoreSinceLastBoss >= 100 && gameMode === 'normal') {
                startBossBattle();
            }
            break;

        case 'boss_outro':
            player.draw(); // Keep player on screen
            
            outroHue = (outroHue + 2) % 360;
            ctx.font = "60px sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = `hsl(${outroHue}, 100%, 60%)`;
            ctx.fillText("ボスクリア！", canvas.width / 2, canvas.height / 2);

            outroTimer++;
            if (outroTimer > 180) { // 3 seconds
                gameMode = 'normal';
                resetGameRound(); // Reset the round state, but not lives or score
            }
            break;
    }

    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 25);
    ctx.fillText(`Lives: ${lives}`, 10, 50); // Display lives
    
    if (gameMode === 'boss_intro' || gameMode === 'boss_battle') {
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "red";
        ctx.fillText("!! WARNING !!", canvas.width / 2, 50);
    }

    requestAnimationFrame(animate);
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

init();
animate();
