// Würfel-Bewegung mit Blick - Vereinfacht
let cube = null;
let sphere = null;
let isGazingAtCube = false;
let isGazingAtSphere = false;
let cubeGazeTimeout = null;
let sphereGazeTimeout = null;
let isMovingMode = false;
let particleInterval = null;
let currentColorIndex = 0; // Aktueller Farbindex
let currentSphereColorIndex = 0; // Aktueller Kugel-Farbindex
let musicAudio = null; // Audio-Element für Musik
let sphereMusicAudio = null; // Audio-Element für Kugel-Musik
let isMusicPlaying = false; // Musik-Status
let isSphereMusicPlaying = false; // Kugel-Musik-Status

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

const sphereColors = [
    '#ff4136',
    '#FFD700', // Gold
    '#2ECC40', // Grün
    '#9B59B6', // Lila
    '#FF6B35', // Orange
    '#FF69B4',  // Pink
    '#4CC3D9', // Hellblau
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
    
    // Kugel finden
    sphere = document.querySelector('a-sphere[color="red"]');
    if (!sphere) {
        console.error('Kugel nicht gefunden!'); // Abfrage ob Kugel gefunden wurde
        return;
    }
    
    // Audio-Elemente finden
    musicAudio = document.getElementById('background-music');
    sphereMusicAudio = document.getElementById('sphere-music');
    
    if (musicAudio) {
        musicAudio.loop = true; // Musik loopen
        musicAudio.volume = 0.7; // Lautstärke auf 70%
        console.log('Würfel-Musik-Audio gefunden und konfiguriert');
    } else {
        console.error('Würfel-Musik-Audio nicht gefunden!');
    }
    
    if (sphereMusicAudio) {
        sphereMusicAudio.loop = true; // Musik loopen
        sphereMusicAudio.volume = 0.7; // Lautstärke auf 70%
        console.log('Kugel-Musik-Audio gefunden und konfiguriert');
    } else {
        console.error('Kugel-Musik-Audio nicht gefunden!');
    }
    
    // Klick-Events hinzufügen
    cube.addEventListener('click', handleCubeClick);
    sphere.addEventListener('click', handleSphereClick);
    
    // Separate Gaze-Events für Würfel und Kugel
    setupGazeEvents();
    
    // Klick-Event für das Beenden des Bewegungsmodus
    document.addEventListener('click', handleClick);
    
    console.log('Würfel- und Kugel-Bewegung initialisiert!');
}

// Gaze-Events für Würfel und Kugel einrichten
function setupGazeEvents() {
    // Würfel-Gaze-Events
    cube.addEventListener('mouseenter', handleCubeGazeStart);
    cube.addEventListener('mouseleave', handleCubeGazeEnd);
    
    // Kugel-Gaze-Events
    sphere.addEventListener('mouseenter', handleSphereGazeStart);
    sphere.addEventListener('mouseleave', handleSphereGazeEnd);
}

// Würfel-Gaze-Start-Handler
function handleCubeGazeStart(event) {
    if (isMovingMode) return; // Bereits im Bewegungsmodus
    
    isGazingAtCube = true;
    console.log('Würfel wird angestarrt - 2 Sekunden bis zum Bewegungsmodus...');
    
    // 2 Sekunden warten, dann Bewegungsmodus aktivieren
    cubeGazeTimeout = setTimeout(() => {
        if (isGazingAtCube) {
            activateMovingMode();
        }
    }, 2000);
}

// Würfel-Gaze-End-Handler
function handleCubeGazeEnd(event) {
    if (isMovingMode) return; // Im Bewegungsmodus nicht beenden
    
    isGazingAtCube = false;
    if (cubeGazeTimeout) {
        clearTimeout(cubeGazeTimeout);
        cubeGazeTimeout = null;
    }
    
    console.log('Würfel-Anstarren beendet');
}

// Kugel-Gaze-Start-Handler
function handleSphereGazeStart(event) {
    if (isMovingMode) return; // Bereits im Bewegungsmodus
    
    isGazingAtSphere = true;
    console.log('Kugel wird angestarrt - 2 Sekunden bis zum Kugel-Bewegungsmodus...');
    
    // 2 Sekunden warten, dann Kugel-Bewegungsmodus aktivieren
    sphereGazeTimeout = setTimeout(() => {
        if (isGazingAtSphere) {
            activateSphereMovingMode();
        }
    }, 2000);
}

// Kugel-Gaze-End-Handler
function handleSphereGazeEnd(event) {
    if (isMovingMode) return; // Im Bewegungsmodus nicht beenden
    
    isGazingAtSphere = false;
    if (sphereGazeTimeout) {
        clearTimeout(sphereGazeTimeout);
        sphereGazeTimeout = null;
    }
    
    console.log('Kugel-Anstarren beendet');
}

// Kugel-Bewegungsmodus aktivieren
function activateSphereMovingMode() {
    isMovingMode = true;
    isGazingAtSphere = false;
    
    console.log('KUGEL-BEWEGUNGSMODUS AKTIVIERT! Schauen Sie irgendwohin, die Kugel folgt Ihrem Blick.');
    
    // Visuelles Feedback - Pulsieren im Bewegungsmodus
    sphere.setAttribute('animation__pulse', 'property: scale; to: 0.5 0.5 0.5; dur: 500; easing: easeInOutQuad; loop: true; dir: alternate');
    
    // Partikel-Intervall starten (für Kugel)
    startSphereParticleTrail();
    
    // Kugel-Bewegungsschleife starten
    startSphereMovementLoop();
}

// Würfel-Musik abspielen/pausieren
function toggleMusic() {
    if (musicAudio) {
        if (isMusicPlaying) {
            // Musik pausieren
            musicAudio.pause();
            isMusicPlaying = false;
            console.log('Würfel-Musik pausiert');
        } else {
            // Kugel-Musik stoppen falls sie läuft
            if (isSphereMusicPlaying && sphereMusicAudio) {
                sphereMusicAudio.pause();
                isSphereMusicPlaying = false;
                console.log('Kugel-Musik gestoppt');
            }
            
            // Würfel-Musik abspielen
            musicAudio.play().then(() => {
                isMusicPlaying = true;
                console.log('Würfel-Musik wird abgespielt');
            }).catch(error => {
                console.error('Fehler beim Abspielen der Würfel-Musik:', error);
            });
        }
    }
}

// Kugel-Musik abspielen/pausieren
function toggleSphereMusic() {
    if (sphereMusicAudio) {
        if (isSphereMusicPlaying) {
            // Musik pausieren
            sphereMusicAudio.pause();
            isSphereMusicPlaying = false;
            console.log('Kugel-Musik pausiert');
        } else {
            // Würfel-Musik stoppen falls sie läuft
            if (isMusicPlaying && musicAudio) {
                musicAudio.pause();
                isMusicPlaying = false;
                console.log('Würfel-Musik gestoppt');
            }
            
            // Kugel-Musik abspielen
            sphereMusicAudio.play().then(() => {
                isSphereMusicPlaying = true;
                console.log('Kugel-Musik wird abgespielt');
            }).catch(error => {
                console.error('Fehler beim Abspielen der Kugel-Musik:', error);
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
    cube.setAttribute('animation__pulse', 'property: scale; to: 1.0 1.0 1.0; dur: 200; easing: easeOutQuad');
    setTimeout(() => {
        cube.setAttribute('animation__pulseback', 'property: scale; to: 0.8 0.8 0.8; dur: 200; easing: easeInQuad');
    }, 200);
    
    console.log(`Würfel-Farbe geändert zu: ${newColor} (Index: ${currentColorIndex})`);
}

// Kugel-Klick-Handler
function handleSphereClick(event) {
    console.log('Kugel wurde geklickt! Farbe wird geändert und Musik getoggelt...');
    
    // Kugel-Musik abspielen/pausieren
    toggleSphereMusic();
    
    // Zur nächsten Kugel-Farbe wechseln
    currentSphereColorIndex = (currentSphereColorIndex + 1) % sphereColors.length;
    const newSphereColor = sphereColors[currentSphereColorIndex];
    
    // Neue Farbe setzen
    sphere.setAttribute('color', newSphereColor);
    
    // Visuelles Feedback - kurz pulsieren
    sphere.setAttribute('animation__pulse', 'property: scale; to: 0.8 0.8 0.8; dur: 200; easing: easeOutQuad');
    setTimeout(() => {
        sphere.setAttribute('animation__pulseback', 'property: scale; to: 0.6 0.6 0.6; dur: 200; easing: easeInQuad');
    }, 200);
    
    console.log(`Kugel-Farbe geändert zu: ${newSphereColor} (Index: ${currentSphereColorIndex})`);
}

// Klick-Handler
function handleClick(event) {
    if (isMovingMode) {
        // Im Bewegungsmodus: Klick beendet den Modus
        deactivateMovingMode();
    }
}

// Bewegungsmodus aktivieren (für Würfel)
function activateMovingMode() {
    isMovingMode = true;
    isGazingAtCube = false;
    
    console.log('WÜRFEL-BEWEGUNGSMODUS AKTIVIERT! Schauen Sie irgendwohin, der Würfel folgt Ihrem Blick.');
    
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
    isGazingAtSphere = false;
    
    console.log('Bewegungsmodus beendet');
    
    // Visuelles Feedback zurücksetzen
    cube.removeAttribute('animation__pulse');
    cube.setAttribute('scale', '0.8 0.8 0.8');
    sphere.removeAttribute('animation__pulse');
    sphere.setAttribute('scale', '0.6 0.6 0.6');
    
    // Partikel-Intervall stoppen
    stopParticleTrail();
    stopSphereParticleTrail();
}

// Partikel-Spur starten (für Würfel)
function startParticleTrail() {
    // Alle 100ms Partikel erstellen
    particleInterval = setInterval(() => {
        if (isMovingMode && cube) {
            const currentPosition = cube.getAttribute('position');
            createTrailParticles(currentPosition.x, currentPosition.y, currentPosition.z);
        }
    }, 100);
}

// Kugel-Partikel-Spur starten
function startSphereParticleTrail() {
    // Alle 100ms Partikel erstellen
    particleInterval = setInterval(() => {
        if (isMovingMode && sphere) {
            const currentPosition = sphere.getAttribute('position');
            createSphereTrailParticles(currentPosition.x, currentPosition.y, currentPosition.z);
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

// Kugel-Partikel-Spur stoppen
function stopSphereParticleTrail() {
    if (particleInterval) {
        clearInterval(particleInterval);
        particleInterval = null;
    }
}

// Spur-Partikel erstellen (für Würfel)
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

// Kugel-Spur-Partikel erstellen
function createSphereTrailParticles(x, y, z) {
    const scene = document.querySelector('a-scene');
    if (!scene) return;
    
    // 3-5 Partikel pro Spur-Punkt
    const particleCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('a-sphere');
        
        // Zufällige Position um die Kugel
        const offsetX = (Math.random() - 0.5) * 0.3;
        const offsetY = (Math.random() - 0.5) * 0.3;
        const offsetZ = (Math.random() - 0.5) * 0.3;
        
        particle.setAttribute('position', `${x + offsetX} ${y + offsetY} ${z + offsetZ}`);
        particle.setAttribute('radius', '0.06'); // Kugel-Größe
        
        // Aktuelle Kugel-Farbe für Partikel verwenden
        const currentSphereColor = sphere.getAttribute('color');
        particle.setAttribute('color', currentSphereColor);
        particle.setAttribute('material', 'shader: flat; emissive: ' + currentSphereColor + '; emissiveIntensity: 0.8');
        
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

// Kugel-Bewegungsschleife - Kugel folgt dem Blick
function startSphereMovementLoop() {
    if (!isMovingMode) return;
    
    const camera = document.querySelector('[camera]');
    if (!camera || !sphere) return;
    
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
    
    // Kugel zur Zielposition bewegen
    sphere.setAttribute('position', `${targetX} ${targetY} ${targetZ}`);
    
    // Schleife fortsetzen
    requestAnimationFrame(startSphereMovementLoop);
}

// Globale Funktionen für Konsole
window.activateMovingMode = activateMovingMode;
window.activateSphereMovingMode = activateSphereMovingMode;
window.deactivateMovingMode = deactivateMovingMode;
window.toggleMusic = toggleMusic;
window.toggleSphereMusic = toggleSphereMusic;
