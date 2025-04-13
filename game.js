// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -15;
const MOVEMENT_SPEED = 5;
const PLATFORM_HEIGHT = 20;
const MEI_WIDTH = 50;
const MEI_HEIGHT = 60;
const ACORN_SIZE = 30;
const PAVESA_SIZE = 30;
const TOTORO_SIZE = 80;
const DOOR_SIZE = 60;

// Game state
let gameLoop;
let score = 0;
let currentLevel = 1;
let platforms = [];
let acorns = [];
let pavesas = [];
let time = 0;
let assetsLoaded = false;
let door = {
    x: 0,
    y: 0,
    visible: false
};

// Level configurations
const levels = [
    {
        platforms: [
            { x: 0, y: 500, width: 800, height: PLATFORM_HEIGHT, type: 'ground' },
            { x: 300, y: 400, width: 200, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 100, y: 300, width: 200, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 500, y: 200, width: 200, height: PLATFORM_HEIGHT, type: 'platform' }
        ],
        acorns: [
            { x: 350, y: 350, collected: false, rotation: 0 },
            { x: 150, y: 250, collected: false, rotation: 0 },
            { x: 550, y: 150, collected: false, rotation: 0 }
        ]
    },
    {
        platforms: [
            { x: 0, y: 500, width: 800, height: PLATFORM_HEIGHT, type: 'ground' },
            { x: 200, y: 400, width: 150, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 450, y: 400, width: 150, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 100, y: 300, width: 150, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 550, y: 300, width: 150, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 325, y: 200, width: 150, height: PLATFORM_HEIGHT, type: 'platform' }
        ],
        acorns: [
            { x: 275, y: 350, collected: false, rotation: 0 },
            { x: 525, y: 350, collected: false, rotation: 0 },
            { x: 175, y: 250, collected: false, rotation: 0 },
            { x: 625, y: 250, collected: false, rotation: 0 },
            { x: 400, y: 150, collected: false, rotation: 0 }
        ]
    },
    {
        platforms: [
            { x: 0, y: 500, width: 800, height: PLATFORM_HEIGHT, type: 'ground' },
            { x: 150, y: 400, width: 100, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 350, y: 400, width: 100, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 550, y: 400, width: 100, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 250, y: 300, width: 100, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 450, y: 300, width: 100, height: PLATFORM_HEIGHT, type: 'platform' },
            { x: 350, y: 200, width: 100, height: PLATFORM_HEIGHT, type: 'platform' }
        ],
        acorns: [
            { x: 200, y: 350, collected: false, rotation: 0 },
            { x: 400, y: 350, collected: false, rotation: 0 },
            { x: 600, y: 350, collected: false, rotation: 0 },
            { x: 300, y: 250, collected: false, rotation: 0 },
            { x: 500, y: 250, collected: false, rotation: 0 },
            { x: 400, y: 150, collected: false, rotation: 0 }
        ]
    }
];

// Player state
const player = {
    x: 100,
    y: 300,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    direction: 1 // 1 for right, -1 for left
};

// Totoro state
const totoro = {
    x: 700,
    y: 300,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    direction: -1,
    speed: 2
};

// Load game assets
const meiSprite = new Image();
const acornSprite = new Image();
const pavesaSprite = new Image();
const backgroundImage = new Image();
const backgroundImage2 = new Image();
const totoroSprite = new Image();

// Function to load all assets
function loadAssets() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalAssets = 6;
        let loadErrors = [];

        function assetLoaded() {
            loadedCount++;
            if (loadedCount === totalAssets) {
                if (loadErrors.length > 0) {
                    reject(new Error('Failed to load: ' + loadErrors.join(', ')));
                } else {
                    assetsLoaded = true;
                    resolve();
                }
            }
        }

        function handleError(assetName) {
            loadErrors.push(assetName);
            console.error(`Error loading ${assetName}`);
            assetLoaded(); // Still count as loaded to prevent hanging
        }

        meiSprite.onload = assetLoaded;
        meiSprite.onerror = () => handleError('mei.png');
        meiSprite.src = 'mei.png';

        acornSprite.onload = assetLoaded;
        acornSprite.onerror = () => handleError('acorn.svg');
        acornSprite.src = 'assets/acorn.svg';

        pavesaSprite.onload = assetLoaded;
        pavesaSprite.onerror = () => handleError('Pavesa.png');
        pavesaSprite.src = 'Pavesa.png';

        backgroundImage.onload = assetLoaded;
        backgroundImage.onerror = () => handleError('Fondo.jpeg');
        backgroundImage.src = 'Fondo.jpeg';

        backgroundImage2.onload = assetLoaded;
        backgroundImage2.onerror = () => handleError('Fondo1.jpeg');
        backgroundImage2.src = 'Fondo1.jpeg';

        totoroSprite.onload = assetLoaded;
        totoroSprite.onerror = () => handleError('totorito.png');
        totoroSprite.src = 'totorito.png';
    });
}

// Get canvas context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize game
async function initGame() {
    try {
        await loadAssets();
        
        // Load first level
        const levelConfig = levels[0];
        platforms = levelConfig.platforms;
        acorns = levelConfig.acorns;
        
        // Initialize door position
        const bottomPlatform = platforms.find(p => p.type === 'ground');
        door.x = canvas.width - DOOR_SIZE - 20;
        door.y = bottomPlatform.y - DOOR_SIZE;
        door.visible = false;

        // Create pavesas
        for (let i = 0; i < 15; i++) {
            pavesas.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7,
                size: PAVESA_SIZE + Math.random() * 10,
                speed: 0.2 + Math.random() * 0.3,
                angle: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                opacity: 0.6 + Math.random() * 0.4
            });
        }

        // Start game loop
        if (!gameLoop) {
            gameLoop = setInterval(update, 1000 / 60);
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Error loading game assets. Please check console for details.', 50, 50);
    }
}

// Handle keyboard input
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update game state
function update() {
    time += 0.1;
    
    // Update acorn rotations
    acorns.forEach(acorn => {
        if (!acorn.collected) {
            acorn.rotation += 0.05;
        }
    });

    // Check if all acorns are collected
    const allAcornsCollected = acorns.every(acorn => acorn.collected);
    if (allAcornsCollected) {
        door.visible = true;
    }

    // Check collision with door
    if (door.visible && 
        Math.abs(player.x - door.x) < MEI_WIDTH &&
        Math.abs(player.y - door.y) < MEI_HEIGHT) {
        // Transition to next level
        nextLevel();
    }

    // Update pavesas
    pavesas.forEach(pavesa => {
        // Gentle floating movement
        pavesa.angle += (Math.random() - 0.5) * 0.1;
        pavesa.x += Math.cos(pavesa.angle) * pavesa.speed;
        pavesa.y += Math.sin(pavesa.angle) * pavesa.speed;
        pavesa.rotation += pavesa.rotationSpeed;
        
        // Wrap around screen
        if (pavesa.x < -PAVESA_SIZE) pavesa.x = canvas.width;
        if (pavesa.x > canvas.width) pavesa.x = -PAVESA_SIZE;
        if (pavesa.y < -PAVESA_SIZE) pavesa.y = canvas.height;
        if (pavesa.y > canvas.height) pavesa.y = -PAVESA_SIZE;
    });

    // Update Totoro's movement
    // Make Totoro follow Mei with smoother movement
    const distanceToPlayer = player.x - totoro.x;
    if (Math.abs(distanceToPlayer) > 50) { // Only move if far enough
        if (distanceToPlayer > 0) {
            totoro.velocityX = totoro.speed;
            totoro.direction = -1; // Left
        } else {
            totoro.velocityX = -totoro.speed;
            totoro.direction = 1; // Right
        }
    } else {
        totoro.velocityX = 0; // Stop when close to player
    }

    // Apply gravity to Totoro
    totoro.velocityY += GRAVITY;
    totoro.y += totoro.velocityY;

    // Check Totoro's platform collisions
    let onPlatform = false;
    platforms.forEach(platform => {
        if (totoro.y + TOTORO_SIZE > platform.y &&
            totoro.y < platform.y + platform.height &&
            totoro.x + TOTORO_SIZE > platform.x &&
            totoro.x < platform.x + platform.width) {
            if (totoro.velocityY > 0) {
                totoro.y = platform.y - TOTORO_SIZE;
                totoro.velocityY = 0;
                totoro.isJumping = false;
                onPlatform = true;
            }
        }
    });

    // Update Totoro's position
    totoro.x += totoro.velocityX;

    // Keep Totoro in bounds
    if (totoro.x < 0) totoro.x = 0;
    if (totoro.x + TOTORO_SIZE > canvas.width) totoro.x = canvas.width - TOTORO_SIZE;

    // Check collision between Mei and Totoro
    if (Math.abs(player.x - totoro.x) < MEI_WIDTH &&
        Math.abs(player.y - totoro.y) < MEI_HEIGHT) {
        // Reset all acorns
        acorns.forEach(acorn => {
            acorn.collected = false;
        });
        score = 0;
        document.getElementById('score').textContent = `Acorns: ${score} | Level: ${currentLevel}`;
    }

    // Handle player movement
    if (keys['ArrowLeft']) {
        player.velocityX = -MOVEMENT_SPEED;
        player.direction = -1;
    } else if (keys['ArrowRight']) {
        player.velocityX = MOVEMENT_SPEED;
        player.direction = 1;
    } else {
        player.velocityX = 0;
    }

    // Handle jumping
    if (keys[' '] && !player.isJumping) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
    }

    // Apply gravity
    player.velocityY += GRAVITY;

    // Update player position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Check platform collisions
    platforms.forEach(platform => {
        if (player.y + MEI_HEIGHT > platform.y &&
            player.y < platform.y + platform.height &&
            player.x + MEI_WIDTH > platform.x &&
            player.x < platform.x + platform.width) {
            if (player.velocityY > 0) {
                player.y = platform.y - MEI_HEIGHT;
                player.velocityY = 0;
                player.isJumping = false;
            }
        }
    });

    // Check acorn collisions
    acorns.forEach(acorn => {
        if (!acorn.collected &&
            player.x < acorn.x + ACORN_SIZE &&
            player.x + MEI_WIDTH > acorn.x &&
            player.y < acorn.y + ACORN_SIZE &&
            player.y + MEI_HEIGHT > acorn.y) {
            acorn.collected = true;
            score++;
            document.getElementById('score').textContent = `Acorns: ${score} | Level: ${currentLevel}`;
        }
    });

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + MEI_WIDTH > canvas.width) player.x = canvas.width - MEI_WIDTH;
    if (player.y < 0) player.y = 0;
    if (player.y + MEI_HEIGHT > canvas.height) {
        player.y = canvas.height - MEI_HEIGHT;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Draw game state
    draw();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image based on current level
    const currentBackground = currentLevel === 1 ? backgroundImage : backgroundImage2;
    if (currentBackground.complete) {
        // Reset any previous transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Calculate scale to cover the canvas while maintaining aspect ratio
        const scale = Math.max(
            canvas.width / currentBackground.width,
            canvas.height / currentBackground.height
        );
        const x = (canvas.width - currentBackground.width * scale) / 2;
        const y = (canvas.height - currentBackground.height * scale) / 2;
        
        // Save context state
        ctx.save();
        
        // Reset any previous global alpha or composite operations
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw the background image
        ctx.drawImage(
            currentBackground,
            x, y,
            currentBackground.width * scale,
            currentBackground.height * scale
        );
        
        // Restore context state
        ctx.restore();
    }

    // Draw pavesas
    pavesas.forEach(pavesa => {
        ctx.save();
        ctx.translate(pavesa.x, pavesa.y);
        ctx.rotate(pavesa.rotation);
        ctx.globalAlpha = pavesa.opacity;
        ctx.drawImage(pavesaSprite, -pavesa.size/2, -pavesa.size/2, pavesa.size, pavesa.size);
        ctx.restore();
    });

    // Draw platforms with blueish texture
    platforms.forEach(platform => {
        // Base platform with gradient
        const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        gradient.addColorStop(0, 'rgba(100, 150, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(70, 120, 180, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Add texture details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for(let i = 0; i < platform.width; i += 10) {
            for(let j = 0; j < platform.height; j += 10) {
                if(Math.random() > 0.7) {
                    ctx.fillRect(platform.x + i, platform.y + j, 2, 2);
                }
            }
        }

        // Add subtle border
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw acorns with enhanced glow and effects
    acorns.forEach(acorn => {
        if (!acorn.collected) {
            // Enhanced glow effect
            const glow = ctx.createRadialGradient(
                acorn.x + ACORN_SIZE/2, acorn.y + ACORN_SIZE/2, 0,
                acorn.x + ACORN_SIZE/2, acorn.y + ACORN_SIZE/2, ACORN_SIZE * 1.5
            );
            glow.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
            glow.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
            glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(acorn.x + ACORN_SIZE/2, acorn.y + ACORN_SIZE/2, ACORN_SIZE * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Pulsating effect
            const pulseSize = ACORN_SIZE * (1 + Math.sin(time * 2) * 0.1);
            
            // Draw acorn with enhanced effects
            ctx.save();
            ctx.translate(acorn.x + ACORN_SIZE/2, acorn.y + ACORN_SIZE/2);
            ctx.rotate(acorn.rotation);
            
            // Add a subtle shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-pulseSize/4, -pulseSize/4, pulseSize/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the acorn slightly larger
            ctx.drawImage(acornSprite, -pulseSize/2, -pulseSize/2, pulseSize, pulseSize);
            ctx.restore();
        }
    });

    // Draw Totoro
    ctx.save();
    if (totoro.direction === -1) { // Left
        ctx.drawImage(totoroSprite, totoro.x, totoro.y, TOTORO_SIZE, TOTORO_SIZE);
    } else { // Right
        ctx.translate(totoro.x + TOTORO_SIZE, totoro.y);
        ctx.scale(-1, 1);
        ctx.drawImage(totoroSprite, 0, 0, TOTORO_SIZE, TOTORO_SIZE);
    }
    ctx.restore();

    // Draw Mei with proper direction and shadow
    ctx.save();
    // Draw shadow with blur effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(player.x + MEI_WIDTH/2, player.y + MEI_HEIGHT + 5, 
                MEI_WIDTH/2, MEI_WIDTH/4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    if (player.direction === -1) {
        ctx.translate(player.x + MEI_WIDTH, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(meiSprite, 0, 0, MEI_WIDTH, MEI_HEIGHT);
    } else {
        ctx.drawImage(meiSprite, player.x, player.y, MEI_WIDTH, MEI_HEIGHT);
    }
    ctx.restore();

    // Draw door if visible
    if (door.visible) {
        // Door glow effect
        const glow = ctx.createRadialGradient(
            door.x + DOOR_SIZE/2, door.y + DOOR_SIZE/2, 0,
            door.x + DOOR_SIZE/2, door.y + DOOR_SIZE/2, DOOR_SIZE
        );
        glow.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
        glow.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
        glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(door.x + DOOR_SIZE/2, door.y + DOOR_SIZE/2, DOOR_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Draw door
        ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.fillRect(door.x, door.y, DOOR_SIZE, DOOR_SIZE);
        
        // Door frame
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeRect(door.x, door.y, DOOR_SIZE, DOOR_SIZE);
    }
}

// Helper function to draw mountains with more detail
function drawMountains() {
    // Base mountains
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.6);
    ctx.lineTo(200, canvas.height * 0.4);
    ctx.lineTo(400, canvas.height * 0.5);
    ctx.lineTo(600, canvas.height * 0.3);
    ctx.lineTo(800, canvas.height * 0.6);
    ctx.lineTo(800, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Mountain details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(200, canvas.height * 0.4);
    ctx.lineTo(250, canvas.height * 0.35);
    ctx.lineTo(300, canvas.height * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(500, canvas.height * 0.35);
    ctx.lineTo(550, canvas.height * 0.3);
    ctx.lineTo(600, canvas.height * 0.35);
    ctx.closePath();
    ctx.fill();
}

// Helper function to draw detailed flowers
function drawDetailedFlower(x, y) {
    // Stem with gradient
    const stemGradient = ctx.createLinearGradient(x, y, x, y - 20);
    stemGradient.addColorStop(0, '#228B22');
    stemGradient.addColorStop(1, '#32CD32');
    ctx.strokeStyle = stemGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 20);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#32CD32';
    // Left leaf
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.quadraticCurveTo(x - 8, y - 8, x - 5, y - 15);
    ctx.quadraticCurveTo(x - 2, y - 10, x, y - 10);
    ctx.fill();
    // Right leaf
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.quadraticCurveTo(x + 8, y - 8, x + 5, y - 15);
    ctx.quadraticCurveTo(x + 2, y - 10, x, y - 10);
    ctx.fill();

    // Petals with gradient
    const petalGradient = ctx.createRadialGradient(x, y - 20, 0, x, y - 20, 8);
    petalGradient.addColorStop(0, '#FFB6C1');
    petalGradient.addColorStop(1, '#FF69B4');
    
    // Draw petals in a circle
    for(let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const petalX = x + Math.cos(angle) * 8;
        const petalY = y - 20 + Math.sin(angle) * 8;
        
        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle);
        
        ctx.fillStyle = petalGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    // Center with gradient
    const centerGradient = ctx.createRadialGradient(x, y - 20, 0, x, y - 20, 4);
    centerGradient.addColorStop(0, '#FFD700');
    centerGradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(x, y - 20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Center details
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(x, y - 20, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Helper function to draw Ghibli-style clouds
function drawGhibliCloud(x, y, size) {
    // Main cloud body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.arc(x + size/3, y - size/3, size/3, 0, Math.PI * 2);
    ctx.arc(x + size/2, y, size/3, 0, Math.PI * 2);
    ctx.arc(x - size/3, y - size/4, size/3, 0, Math.PI * 2);
    ctx.arc(x + size/4, y + size/4, size/4, 0, Math.PI * 2);
    ctx.fill();
    
    // Cloud shading
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x - size/6, y - size/6, size/3, 0, Math.PI * 2);
    ctx.arc(x + size/6, y - size/6, size/3, 0, Math.PI * 2);
    ctx.fill();
}

// Function to transition to next level
function nextLevel() {
    currentLevel++;
    
    // Check if we've completed all levels
    if (currentLevel > levels.length) {
        // Game completed!
        currentLevel = 1; // Reset to first level
        alert('¡Felicidades! Has completado todos los niveles. Comenzando de nuevo...');
    }
    
    // Reset game state for new level
    score = 0;
    document.getElementById('score').textContent = `Acorns: ${score} | Level: ${currentLevel}`;
    
    // Load level configuration
    const levelConfig = levels[currentLevel - 1];
    platforms = levelConfig.platforms;
    acorns = levelConfig.acorns;
    
    // Reposition player
    player.x = 100;
    player.y = 300;
    
    // Reposition Totoro
    totoro.x = 700;
    totoro.y = 300;
    
    // Hide door
    door.visible = false;
    
    // Initialize door position for new level
    const bottomPlatform = platforms.find(p => p.type === 'ground');
    door.x = canvas.width - DOOR_SIZE - 20;
    door.y = bottomPlatform.y - DOOR_SIZE;
}

// Start the game when the window loads
window.onload = initGame; 