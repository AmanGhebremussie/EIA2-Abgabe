// Würfel-Bewegung mit Blick - Vereinfacht
let cube = null;
let isGazingAtCube = false;
let gazeTimeout = null;
let isMovingMode = false;
let particleInterval = null;
let currentColorIndex = 0; // Aktueller Farbindex
let musicAudio = null; // Audio-Element für Musik
let isMusicPlaying = false; // Musik-Status

// 7 verschiedene Farben für den Würfel
const cubeColors = [
    '#4CC3D9', // Hellblau (Standard)
    '#FF4136', // Rot
    '#FFD700', // Gold
    '#2ECC40', // Grün
    '#9B59B6', // Lila
    '#FF6B35', // Orange
    '#FF69B4'  // Pink
];

// Warten bis das DOM und A-Frame geladen sind
document.addEventListener('DOMContentLoaded', function() {
    console.log('Würfel-Bewegung wird initialisiert...');
    
    // Warten bis A-Frame vollständig geladen ist
    setTimeout(() => {
        initializeCubeMovement();
    }, 1000);
});

// Würfel-Bewegung initialisieren
function initializeCubeMovement() {
    console.log('Würfel-Bewegung ist bereit!');
    
    // Würfel finden
    cube = document.querySelector('a-box[color="#4CC3D9"]');
    if (!cube) {
        console.error('Würfel nicht gefunden!');
        return;
    }
    
    // Audio-Element finden
    musicAudio = document.getElementById('background-music');
    if (musicAudio) {
        musicAudio.loop = true; // Musik loopen
        musicAudio.volume = 0.7; // Lautstärke auf 70%
        console.log('Musik-Audio gefunden und konfiguriert');
    } else {
        console.error('Musik-Audio nicht gefunden!');
    }
    
    // Klick-Event für Würfel-Farbänderung und Musik hinzufügen
    cube.addEventListener('click', handleCubeClick);
    
    // Event-Listener für Gaze-Events hinzufügen
    const cursor = document.querySelector('a-cursor');
    if (cursor) {
        cursor.addEventListener('mouseenter', handleGazeStart);
        cursor.addEventListener('mouseleave', handleGazeEnd);
    }
    
    // Klick-Event für das Beenden des Bewegungsmodus
    document.addEventListener('click', handleClick);
    
    console.log('Würfel-Bewegung initialisiert!');
}

// Musik abspielen/pausieren
function toggleMusic() {
    if (musicAudio) {
        if (isMusicPlaying) {
            // Musik pausieren
            musicAudio.pause();
            isMusicPlaying = false;
            console.log('⏸️ Musik pausiert');
        } else {
            // Musik abspielen
            musicAudio.play().then(() => {
                isMusicPlaying = true;
                console.log('🎵 Musik wird abgespielt');
            }).catch(error => {
                console.error('❌ Fehler beim Abspielen der Musik:', error);
            });
        }
    }
}

// Würfel-Klick-Handler
function handleCubeClick(event) {
    console.log('Würfel wurde geklickt! Farbe wird geändert und Musik getoggelt...');
    
    // Musik abspielen/pausieren
    toggleMusic();
    
    // Zur nächsten Farbe wechseln
    currentColorIndex = (currentColorIndex + 1) % cubeColors.length;
    const newColor = cubeColors[currentColorIndex];
    
    // Neue Farbe setzen
    cube.setAttribute('color', newColor);
    
    // Visuelles Feedback - kurz pulsieren
    cube.setAttribute('animation__pulse', 'property: scale; to: 0.8 0.8 0.8; dur: 200; easing: easeOutQuad');
    setTimeout(() => {
        cube.setAttribute('animation__pulseback', 'property: scale; to: 0.5 0.5 0.5; dur: 200; easing: easeInQuad');
    }, 200);
    
    console.log(`Würfel-Farbe geändert zu: ${newColor} (Index: ${currentColorIndex})`);
}

// Gaze-Start-Handler
function handleGazeStart(event) {
    if (isMovingMode) return; // Bereits im Bewegungsmodus
    
    isGazingAtCube = true;
    console.log('Würfel wird angestarrt - 2 Sekunden bis zum Bewegungsmodus...');
    
    // 2 Sekunden warten, dann Bewegungsmodus aktivieren
    gazeTimeout = setTimeout(() => {
        if (isGazingAtCube) {
            activateMovingMode();
        }
    }, 2000);
}

// Gaze-End-Handler
function handleGazeEnd(event) {
    if (isMovingMode) return; // Im Bewegungsmodus nicht beenden
    
    isGazingAtCube = false;
    if (gazeTimeout) {
        clearTimeout(gazeTimeout);
        gazeTimeout = null;
    }
    
    console.log('Würfel-Anstarren beendet');
}

// Klick-Handler
function handleClick(event) {
    if (isMovingMode) {
        // Im Bewegungsmodus: Klick beendet den Modus
        deactivateMovingMode();
    }
}

// Bewegungsmodus aktivieren
function activateMovingMode() {
    isMovingMode = true;
    isGazingAtCube = false;
    
    console.log('BEWEGUNGSMODUS AKTIVIERT! Schauen Sie irgendwohin, der Würfel folgt Ihrem Blick.');
    
    // Visuelles Feedback - Pulsieren im Bewegungsmodus
    cube.setAttribute('animation__pulse', 'property: scale; to: 0.7 0.7 0.7; dur: 500; easing: easeInOutQuad; loop: true; dir: alternate');
    
    // Partikel-Intervall starten
    startParticleTrail();
    
    // Bewegungsschleife starten
    startMovementLoop();
}

// Bewegungsmodus deaktivieren
function deactivateMovingMode() {
    isMovingMode = false;
    isGazingAtCube = false;
    
    console.log('Bewegungsmodus beendet');
    
    // Visuelles Feedback zurücksetzen
    cube.removeAttribute('animation__pulse');
    cube.setAttribute('scale', '0.5 0.5 0.5');
    
    // Partikel-Intervall stoppen
    stopParticleTrail();
}

// Partikel-Spur starten
function startParticleTrail() {
    // Alle 100ms Partikel erstellen
    particleInterval = setInterval(() => {
        if (isMovingMode && cube) {
            const currentPosition = cube.getAttribute('position');
            createTrailParticles(currentPosition.x, currentPosition.y, currentPosition.z);
        }
    }, 100);
}

// Partikel-Spur stoppen
function stopParticleTrail() {
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
}

// Spur-Partikel erstellen
function createTrailParticles(x, y, z) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    // 3-5 Partikel pro Spur-Punkt
    const particleCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('a-box');
        
        // Zufällige Position um den Würfel
        const offsetX = (Math.random() - 0.5) * 0.3;
        const offsetY = (Math.random() - 0.5) * 0.3;
        const offsetZ = (Math.random() - 0.5) * 0.3;
        
        particle.setAttribute('position', `${x + offsetX} ${y + offsetY} ${z + offsetZ}`);
        particle.setAttribute('width', '0.08'); // Würfel-Größe
        particle.setAttribute('height', '0.08');
        particle.setAttribute('depth', '0.08');
        
        // Gleiche Farbe wie der Würfel
        const cubeColor = cube.getAttribute('color');
        particle.setAttribute('color', cubeColor);
        particle.setAttribute('material', 'shader: flat; emissive: ' + cubeColor + '; emissiveIntensity: 0.8');
        
        // Zufällige Bewegung
        const moveX = (Math.random() - 0.5) * 2;
        const moveY = (Math.random() - 0.5) * 2;
        const moveZ = (Math.random() - 0.5) * 2;
        
        // Animation
        particle.setAttribute('animation__move', `property: position; to: ${x + moveX} ${y + moveY} ${z + moveZ}; dur: 1000; easing: easeOutQuad`);
        particle.setAttribute('animation__fade', 'property: material.opacity; to: 0; dur: 1000; easing: easeOutQuad');
        particle.setAttribute('animation__scale', 'property: scale; to: 0.1 0.1 0.1; dur: 1000; easing: easeOutQuad');
        
        scene.appendChild(particle);
        
        // Partikel nach Animation entfernen
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

// Bewegungsschleife - Würfel folgt dem Blick
function startMovementLoop() {
    if (!isMovingMode) return;
    
    const camera = document.querySelector('[camera]');
    if (!camera || !cube) return;
    
    const cameraPosition = camera.getAttribute('position');
    const cameraRotation = camera.getAttribute('rotation');
    
    // Blickrichtung berechnen
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
            THREE.MathUtils.degToRad(cameraRotation.x),
            THREE.MathUtils.degToRad(cameraRotation.y),
            THREE.MathUtils.degToRad(cameraRotation.z)
        )
    ));
    
    // Position 5 Einheiten in Blickrichtung
    const distance = 5;
    const targetX = cameraPosition.x + direction.x * distance;
    const targetY = cameraPosition.y + direction.y * distance;
    const targetZ = cameraPosition.z + direction.z * distance;
    
    // Würfel zur Zielposition bewegen
    cube.setAttribute('position', `${targetX} ${targetY} ${targetZ}`);
    
    // Schleife fortsetzen
    requestAnimationFrame(startMovementLoop);
}

// Globale Funktionen für Konsole
window.activateMovingMode = activateMovingMode;
window.deactivateMovingMode = deactivateMovingMode;
window.toggleMusic = toggleMusic;
