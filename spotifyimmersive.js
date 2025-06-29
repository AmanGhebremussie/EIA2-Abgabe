// Immersiver Musikplayer JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Loading-Screen ausblenden
  document.getElementById('loading').style.display = 'none';

  // Playlist & Player Data
  const playlist = [
    {
      title: "Cosmic Dust",
      artist: "Unknown Artist",
      src: "music/cosmic-dust-152840.mp3",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=400&h=400"
    },
    {
      title: "Eona",
      artist: "Emotional Ambient Pop",
      src: "music/eona-emotional-ambient-pop-351436.mp3",
      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=facearea&w=400&h=400"
    },
    {
      title: "Nightfall",
      artist: "Future Bass Music",
      src: "music/nightfall-future-bass-music-228100.mp3",
      cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=facearea&w=400&h=400"
    }
    // Hier können weitere Songs hinzugefügt werden
  ];

  // Player-Zustand
  let isPlaying = false;
  let currentSongIndex = 0;

  // Player-Elemente
  const audioEntity = document.querySelector('#audio-player');
  const btnPlay = document.querySelector('#icon-play');
  const iconPlay = document.querySelector('#icon-play');
  const songTitle = document.querySelector('#song-title');
  const artistName = document.querySelector('#artist-name');
  const cover = document.querySelector('#cover');
  const realAudio = document.querySelector('#real-audio');

  // Kuppel-Visualizer Setup
  const domeVisualizer = document.querySelector('#dome-visualizer');
  const NUM_BARS = 64; // Anzahl Balken für Kuppel-Form
  let bars = [];
  let audioCtx, analyser, dataArray, srcNode, analyserStarted = false;

  // Kuppel-Atmung Setup
  let baseRadius = 20; // Basis-Radius der Kuppel
  let breathingIntensity = 0; // Atmungs-Intensität

  // Gaze-Tracking für Balken
  let gazeTimers = new Map(); // Speichert Timer für jeden Balken
  let gazedBars = new Set(); // Speichert Balken, deren Farbe geändert wurde

  // Kuppel-Balken erstellen
  function createDomeBars() {
    // Vorherige Balken entfernen
    domeVisualizer.innerHTML = "";
    bars = [];
    
    // Kuppel-Parameter - vollständiger 360-Grad-Kreis
    const domeRadius = baseRadius; // Dynamischer Radius für Atmung
    const domeHeight = 25; // Höhere Kuppel
    const startAngle = 0; // Startwinkel (Grad) - vollständiger Kreis
    const endAngle = 360; // Endwinkel (Grad) - vollständiger Kreis
    
    for (let i = 0; i < NUM_BARS; i++) {
      // Winkel für jeden Balken berechnen
      const angle = (startAngle + (endAngle - startAngle) * (i / (NUM_BARS - 1))) * (Math.PI / 180);
      
      // Position auf der Kuppel berechnen - WEITER NACH HINTEN und UNTEN
      const x = Math.cos(angle) * domeRadius;
      const z = Math.sin(angle) * domeRadius - 5; // 5 Einheiten nach hinten
      const y = -2; // Startposition tiefer (vorher 0)
      
      // Balken erstellen - größer
      let bar = document.createElement('a-box');
      bar.setAttribute('color', '#1db954');
      bar.setAttribute('width', '1.5'); // Breiter
      bar.setAttribute('depth', '1.5'); // Tiefer
      bar.setAttribute('height', '5.0'); // Höhere Basis
      bar.setAttribute('position', `${x} ${y} ${z}`);
      
      // Material mit Glow-Effekt - verstärkt
      bar.setAttribute('material', 'emissive: #1db954; emissiveIntensity: 0.8; transparent: true; opacity: 0.95');
      
      // Rotation so dass Balken zur Mitte zeigen
      const rotationY = (angle * 180 / Math.PI) + 90;
      bar.setAttribute('rotation', `0 ${rotationY} 0`);
      
      domeVisualizer.appendChild(bar);
      bars.push({
        element: bar,
        baseHeight: 5.0, // Höhere Basis
        maxHeight: domeHeight,
        angle: angle,
        x: x,
        z: z,
        baseX: x, // Speichere Basis-Position für Atmung
        baseZ: z  // Speichere Basis-Position für Atmung
      });
      
      // Gaze-Event-Listener für Farbänderung
      bar.addEventListener('mouseenter', () => {
        // Timer starten für 5 Sekunden
        const timer = setTimeout(() => {
          gazedBars.add(bar);
          console.log(`Balken ${i} Farbe geändert nach 5 Sekunden Gaze!`);
        }, 5000);
        gazeTimers.set(bar, timer);
      });
      
      bar.addEventListener('mouseleave', () => {
        // Timer stoppen wenn Gaze endet
        const timer = gazeTimers.get(bar);
        if (timer) {
          clearTimeout(timer);
          gazeTimers.delete(bar);
        }
      });
    }
  }

  // Cover-Kreis erstellen
  function createCoverCircle() {
    const coverRing = document.querySelector('#cover-ring');
    const spacing = 1.2; // Abstand zwischen den Covern
    
    playlist.forEach((song, index) => {
      // Horizontale Anordnung nebeneinander
      const x = (index - 1) * spacing; // Zentriert um 0
      const z = 0;
      
      // Kleineres Cover für die Reihe
      let coverBox = document.createElement('a-box');
      coverBox.setAttribute('src', song.cover);
      coverBox.setAttribute('position', `${x} 0 ${z}`);
      coverBox.setAttribute('width', '0.6'); // Kleiner
      coverBox.setAttribute('height', '0.6'); // Kleiner
      coverBox.setAttribute('depth', '0.05');
      coverBox.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.7');
      coverBox.setAttribute('shadow', 'cast: true; receive: true');
      
      // Keine Rotation nötig für horizontale Anordnung
      coverBox.setAttribute('rotation', '0 0 0');
      
      // Klick-Event für Song-Wechsel
      coverBox.addEventListener('click', () => {
        currentSongIndex = index;
        loadSong(currentSongIndex);
      });
      
      coverRing.appendChild(coverBox);
    });
  }

  // Play/Pause Funktionalität
  btnPlay.addEventListener('click', () => {
    if (!isPlaying) {
      audioEntity.components.sound.playSound();
      realAudio.play();
      iconPlay.setAttribute('src', 'icons/pause.png'); // Pause-Icon
      startVisualizer();
    } else {
      audioEntity.components.sound.pauseSound();
      realAudio.pause();
      iconPlay.setAttribute('src', 'icons/play-button-arrowhead.png'); // Play-Icon
      // Nicht analyserStarted zurücksetzen - nur Animation stoppen
    }
    isPlaying = !isPlaying;
  });

  // Vor/Zurück Funktionalität
  document.querySelector('#icon-prev').addEventListener('click', () => {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
  });

  document.querySelector('#icon-next').addEventListener('click', () => {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
  });

  // Song laden
  function loadSong(index) {
    const song = playlist[index];
    audioEntity.setAttribute('sound', `src: url(${song.src}); autoplay: false; volume: 1`);
    realAudio.src = song.src;
    songTitle.setAttribute('value', song.title);
    artistName.setAttribute('value', song.artist);
    cover.setAttribute('src', song.cover);
    iconPlay.setAttribute('src', 'icons/play-button-arrowhead.png'); // Play-Icon
    isPlaying = false;
    audioEntity.components.sound.stopSound();
    realAudio.pause();
    realAudio.currentTime = 0;
    
    // Aktuellen Song im Cover-Kreis hervorheben
    highlightCurrentSong(index);
  }
  
  // Aktuellen Song im Cover-Kreis hervorheben
  function highlightCurrentSong(currentIndex) {
    const coverRing = document.querySelector('#cover-ring');
    const covers = coverRing.children;
    
    for (let i = 0; i < covers.length; i++) {
      if (i === currentIndex) {
        // Aktueller Song - größer und heller
        covers[i].setAttribute('width', '0.8');
        covers[i].setAttribute('height', '0.8');
        covers[i].setAttribute('material', 'shader: flat; transparent: true; opacity: 1.0');
      } else {
        // Andere Songs - kleiner und transparenter
        covers[i].setAttribute('width', '0.6');
        covers[i].setAttribute('height', '0.6');
        covers[i].setAttribute('material', 'shader: flat; transparent: true; opacity: 0.7');
      }
    }
  }

  // Visualizer starten
  function startVisualizer() {
    if (analyserStarted && audioCtx && analyser) {
      // Wenn bereits gestartet, nur Animation fortsetzen
      animateDomeBars();
      return;
    }
    
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      srcNode = audioCtx.createMediaElementSource(realAudio);
      analyser = audioCtx.createAnalyser();
      srcNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = NUM_BARS * 2;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyserStarted = true;
      animateDomeBars();
    } catch (error) {
      console.error('Audio Context Fehler:', error);
    }
  }

  // Kuppel-Balken animieren
  function animateDomeBars() {
    if (!analyser || realAudio.paused) {
      // Wenn pausiert, Balken auf Basis-Höhe zurücksetzen
      resetBarsToBase();
      return;
    }
    
    analyser.getByteFrequencyData(dataArray);
    
    // Bass-Intensität für Atmung berechnen (niedrige Frequenzen)
    const bassFrequencies = dataArray.slice(0, 8); // Erste 8 Frequenzen (Bass)
    const bassIntensity = bassFrequencies.reduce((sum, value) => sum + value, 0) / (bassFrequencies.length * 256);
    
    // Atmungs-Intensität aktualisieren (sanfte Übergänge)
    breathingIntensity = breathingIntensity * 0.8 + bassIntensity * 0.2;
    
    // Dynamischer Radius basierend auf Atmung
    const currentRadius = baseRadius + (breathingIntensity * 8); // Radius variiert um ±8 Einheiten
    
    // Kuppel-Balken animieren
    for (let i = 0; i < NUM_BARS; i++) {
      let value = dataArray[i] / 256;
      let bar = bars[i];
      
      // Dynamische Höhe basierend auf Audio-Frequenz
      let height = bar.baseHeight + (value * bar.maxHeight);
      
      // Position anpassen (Balken wachsen nach oben) - mit neuer Startposition
      let y = -2 + (height / 2); // Startposition -2 + halbe Höhe
      
      // Atmungs-Position berechnen (Radius-Änderung)
      const angle = bar.angle;
      const breathingX = Math.cos(angle) * currentRadius;
      const breathingZ = Math.sin(angle) * currentRadius - 5;
      
      bar.element.setAttribute('height', height.toFixed(2));
      bar.element.setAttribute('position', `${breathingX} ${y} ${breathingZ}`);
      
      // Dynamische Farbe basierend auf Intensität
      let hue = 120 + (value * 60); // Grün zu Gelb
      let saturation = 65 + (value * 35); // 65% zu 100%
      let lightness = 46 + (value * 20); // 46% zu 66%
      let color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // Farbe ändern wenn Balken angegazt wurde
      if (gazedBars.has(bar.element)) {
        hue = 300 + (value * 60); // Lila zu Pink
        saturation = 80 + (value * 20);
        lightness = 50 + (value * 30);
        color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }
      
      bar.element.setAttribute('color', color);
      bar.element.setAttribute('material', `emissive: ${color}; emissiveIntensity: ${0.3 + value * 0.7}; transparent: true; opacity: ${0.6 + value * 0.4}`);
    }
    
    // Weiter animieren wenn Audio läuft
    if (!realAudio.paused) {
      requestAnimationFrame(animateDomeBars);
    }
  }

  // Balken auf Basis-Höhe zurücksetzen
  function resetBarsToBase() {
    // Atmung zurücksetzen
    breathingIntensity = 0;
    
    for (let i = 0; i < NUM_BARS; i++) {
      let bar = bars[i];
      let y = -2 + (bar.baseHeight / 2); // Neue Startposition -2 + halbe Basis-Höhe
      
      bar.element.setAttribute('height', bar.baseHeight.toFixed(2));
      bar.element.setAttribute('position', `${bar.baseX} ${y} ${bar.baseZ}`);
      
      // Farbe basierend auf Gaze-Status setzen
      if (gazedBars.has(bar.element)) {
        bar.element.setAttribute('color', '#ff69b4'); // Pink für angegazte Balken
        bar.element.setAttribute('material', 'emissive: #ff69b4; emissiveIntensity: 0.6; transparent: true; opacity: 0.95');
      } else {
        bar.element.setAttribute('color', '#1db954'); // Grün für normale Balken
        bar.element.setAttribute('material', 'emissive: #1db954; emissiveIntensity: 0.6; transparent: true; opacity: 0.95');
      }
    }
  }

  // Keyboard Controls
  document.addEventListener('keydown', (event) => {
    switch(event.code) {
      case 'Space':
        event.preventDefault();
        btnPlay.click();
        break;
      case 'ArrowLeft':
        document.querySelector('#btn-prev').click();
        break;
      case 'ArrowRight':
        document.querySelector('#btn-next').click();
        break;
    }
  });

  // Ersten Song laden
  loadSong(currentSongIndex);

  // Debug-Informationen
  console.log('Immersiver Musikplayer erfolgreich initialisiert!');
  console.log('Verfügbare Steuerung:');
  console.log('- Klick auf Play-Button oder Leertaste: Play/Pause');

  // Kuppel initialisieren
  createDomeBars();
  
  // Cover-Kreis erstellen
  createCoverCircle();
});
