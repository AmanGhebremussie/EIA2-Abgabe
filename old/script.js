// Audio-Funktion für Hip-Hop Beat (Loop)
function playHipHopBeat() {
    const audio = document.getElementById('hip-hop-beat');
    if (audio) {
        // Loop aktivieren
        audio.loop = true;
        
        // Wenn Audio bereits läuft, stoppen, sonst starten
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
            console.log('Hip-Hop Beat gestoppt!');
            stopVisualization();
        } else {
            audio.play().then(() => {
                console.log('Hip-Hop Beat Loop gestartet!');
                startVisualization();
            }).catch(error => {
                console.error('Fehler beim Abspielen der Audio:', error);
            });
        }
    } else {
        console.error('Audio-Element nicht gefunden!');
    }
}

// Audio-Funktion für Marimba Sound
function playMarimbaSound() {
    const audio = document.getElementById('marimba-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => {
            console.log('Marimba Sound wird abgespielt!');
        }).catch(error => {
            console.error('Fehler beim Abspielen der Marimba Audio:', error);
        });
    } else {
        console.error('Marimba Audio-Element nicht gefunden!');
    }
}

// Audio Visualisierung Variablen
let visualizationBars = [];
let animationId = null;
let beatInterval = null;

// Audio Visualisierung starten
function startVisualization() {
    createVisualizationBars();
    animateVisualization();
    
    // Beat-Timing für 166 BPM (166 Beats pro Minute = 1 Beat alle 0.361 Sekunden)
    const beatTime = 60000 / 166; // Millisekunden pro Beat
    beatInterval = setInterval(() => {
        triggerBeatAnimation();
    }, beatTime);
}

// Audio Visualisierung stoppen
function stopVisualization() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
    clearVisualizationBars();
}

// Visualisierungsbalken erstellen
function createVisualizationBars() {
    const container = document.getElementById('visualization-container');
    if (!container) return;
    
    // Bestehende Balken entfernen
    clearVisualizationBars();
    
    // 16 Balken in einer Reihe erstellen
    const barWidth = 0.25; // Schmaler gemacht
    const barHeight = 0.1;
    const spacing = 0.35; // Weniger Abstand für schmalere Balken
    
    // Farbverlauf von hellblau über blau zu lila
    const startColor = { r: 135, g: 206, b: 250 }; // Hellblau
    const middleColor = { r: 0, g: 0, b: 255 };    // Blau
    const endColor = { r: 128, g: 0, b: 128 };     // Lila
    
    for (let i = 0; i < 16; i++) {
        // Farbverlauf berechnen
        let color;
        if (i < 8) {
            // Erste Hälfte: hellblau zu blau
            const ratio = i / 7;
            color = {
                r: Math.round(startColor.r + (middleColor.r - startColor.r) * ratio),
                g: Math.round(startColor.g + (middleColor.g - startColor.g) * ratio),
                b: Math.round(startColor.b + (middleColor.b - startColor.b) * ratio)
            };
        } else {
            // Zweite Hälfte: blau zu lila
            const ratio = (i - 8) / 7;
            color = {
                r: Math.round(middleColor.r + (endColor.r - middleColor.r) * ratio),
                g: Math.round(middleColor.g + (endColor.g - middleColor.g) * ratio),
                b: Math.round(middleColor.b + (endColor.b - middleColor.b) * ratio)
            };
        }
        
        const colorHex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
        
        // Position berechnen (16 Balken in einer Reihe)
        const x = (i - 7.5) * spacing; // Zentriert, 7.5 Balken links und rechts
        
        // Erstelle einen Container für jeden Balken
        const barContainer = document.createElement('a-entity');
        barContainer.setAttribute('position', `${x} 0 0`);
        barContainer.setAttribute('data-bar', i);
        barContainer.setAttribute('data-color', colorHex);
        
        container.appendChild(barContainer);
        visualizationBars.push(barContainer);
    }
    
    console.log('Visualisierungsbalken-Container erstellt');
}

// Visualisierungsbalken entfernen
function clearVisualizationBars() {
    const container = document.getElementById('visualization-container');
    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
    visualizationBars = [];
}

// Balken mit Quadraten basierend auf Höhe erstellen
function updateBarWithSquares(barContainer, height) {
    // Bestehende Quadrate entfernen
    while (barContainer.firstChild) {
        barContainer.removeChild(barContainer.firstChild);
    }
    
    const barWidth = 0.25;
    const squareSize = 0.08; // Größe jedes Quadrats
    const spacing = 0.02; // Abstand zwischen Quadraten
    const color = barContainer.getAttribute('data-color');
    
    // Anzahl der Quadrate basierend auf Höhe berechnen
    const maxSquares = Math.floor(height / (squareSize + spacing));
    const actualSquares = Math.max(1, Math.min(maxSquares, 12)); // Mindestens 1, maximal 12 Quadrate
    
    // Quadrate erstellen
    for (let j = 0; j < actualSquares; j++) {
        const square = document.createElement('a-box');
        
        // Position des Quadrats (von unten nach oben gestapelt)
        const squareY = (j - actualSquares/2 + 0.5) * (squareSize + spacing);
        
        square.setAttribute('position', `0 ${squareY} 0`);
        square.setAttribute('width', squareSize);
        square.setAttribute('height', squareSize);
        square.setAttribute('depth', 0.05);
        square.setAttribute('color', color);
        square.setAttribute('material', 'shader: flat');
        square.setAttribute('data-square', j);
        
        barContainer.appendChild(square);
    }
}

// Beat-Animation auslösen
function triggerBeatAnimation() {
    visualizationBars.forEach((barContainer, index) => {
        // Zufällige Höhe für jeden Balken
        const randomHeight = Math.random() * 0.8 + 0.1;
        
        // Balken mit Quadraten basierend auf Höhe aktualisieren
        updateBarWithSquares(barContainer, randomHeight);
    });
}

// Visualisierung animieren
function animateVisualization() {
    if (!animationId) return;
    
    // Kontinuierliche Animation für sanfte Höhenbewegungen
    visualizationBars.forEach((barContainer, index) => {
        const time = Date.now() * 0.001;
        const wave = Math.sin(time * 1.5 + index * 0.3) * 0.2 + 0.3;
        
        // Balken mit Quadraten basierend auf Höhe aktualisieren
        updateBarWithSquares(barContainer, wave);
    });
    
    animationId = requestAnimationFrame(animateVisualization);
}

// Warten bis das DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log('A-Frame Scene wird geladen...');
    
    // Warten bis A-Frame vollständig geladen ist
    setTimeout(() => {
        // Rote Kugel finden und Gaze-Event hinzufügen
        const sphere = document.querySelector('a-sphere[color="#FF4136"]');
        if (sphere) {
            sphere.addEventListener('mouseenter', function() {
                console.log('Rote Kugel wird angestarrt! Hip-Hop Beat Loop wird gesteuert!');
                playHipHopBeat();
            });
            console.log('Gaze-Event zur roten Kugel hinzugefügt');
        } else {
            console.error('Rote Kugel nicht gefunden!');
        }
        
        // Blauen Würfel finden und Gaze-Event hinzufügen
        const cube = document.querySelector('a-box[color="#4CC3D9"]');
        if (cube) {
            cube.addEventListener('mouseenter', function() {
                console.log('Blauer Würfel wird angestarrt! Marimba Sound wird abgespielt!');
                playMarimbaSound();
            });
            console.log('Gaze-Event zum blauen Würfel hinzugefügt');
        } else {
            console.error('Blauer Würfel nicht gefunden!');
        }
    }, 1000);
});
