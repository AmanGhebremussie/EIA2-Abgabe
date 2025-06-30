// Immersiver Musikplayer

document.addEventListener('DOMContentLoaded', function() {
  // Loading-Screen ausblenden
  document.getElementById('loading').style.display = 'none';

  // Playlist & Player Data
  const playlist = [
    {
      title: "Cosmic Dust",
      artist: "Unknown Artist",
      src: "music/cosmic-dust-152840.mp3",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=400&h=400",
      genre: "Ambient"
    },
    {
      title: "Eona",
      artist: "Emotional Ambient Pop",
      src: "music/eona-emotional-ambient-pop-351436.mp3",
      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=facearea&w=400&h=400",
      genre: "EDM"
    },
    {
      title: "Nightfall",
      artist: "Future Bass Music",
      src: "music/nightfall-future-bass-music-228100.mp3",
      cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=facearea&w=400&h=400",
      genre: "Chill"
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

  // Effekt-Typen für Balken (z.B. Echo, Hall, Filter, Bass-Boost, Verzerrer)
  const EFFECT_TYPES = ['echo', 'reverb', 'lowpass', 'bassboost', 'distortion'];

  // Aktiver Effekt-Balken (Index)
  let activeEffectBarIndex = null;

  // Hilfsfunktion: Effekt-Node erzeugen
  function createEffectNode(type, ctx) {
    switch(type) {
      case 'echo': {
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.25;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.3;
        delay.connect(feedback);
        feedback.connect(delay);
        return { input: delay, output: delay };
      }
      case 'reverb': {
        // Einfaches Reverb mit ConvolverNode (leeres Impuls-Response für Demo)
        const convolver = ctx.createConvolver();
        // Hier könnte ein echtes Impuls-Response geladen werden
        return { input: convolver, output: convolver };
      }
      case 'lowpass': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        return { input: filter, output: filter };
      }
      case 'bassboost': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 350;
        filter.gain.value = 0;
        return { input: filter, output: filter };
      }
      case 'distortion': {
        const distortion = ctx.createWaveShaper();
        function makeDistortionCurve(amount) {
          const n_samples = 44100, curve = new Float32Array(n_samples);
          for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            curve[i] = ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x));
          }
          return curve;
        }
        distortion.curve = makeDistortionCurve(400);
        distortion.oversample = '4x';
        return { input: distortion, output: distortion };
      }
      default:
        return null;
    }
  }

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
      // Effekt-Typ zuweisen (zyklisch)
      const effectType = EFFECT_TYPES[i % EFFECT_TYPES.length];
      bars.push({
        element: bar,
        baseHeight: 5.0,
        maxHeight: domeHeight,
        angle: angle,
        x: x,
        z: z,
        baseX: x,
        baseZ: z,
        effectType: effectType,
        effectActive: false,
        effectNode: null
      });
      
      // Gaze-Event-Listener für Effekt-Aktivierung
      bar.addEventListener('mouseenter', () => {
        // Timer starten für 2.5 Sekunden
        const timer = setTimeout(() => {
          gazedBars.add(bar);
          // Toggle-Verhalten: Wenn dieser Balken bereits aktiv ist, deaktiviere ihn
          if (activeEffectBarIndex === i) {
            deactivateBarEffect(i);
            // Visualisierung zurücksetzen
            bar.setAttribute('color', '#1db954');
            bar.setAttribute('material', 'emissive: #1db954; emissiveIntensity: 0.8; transparent: true; opacity: 0.95');
            gazedBars.delete(bar);
            activeEffectBarIndex = null;
            return;
          }
          // Vorherigen Effekt deaktivieren, falls vorhanden
          if (activeEffectBarIndex !== null && activeEffectBarIndex !== i) {
            deactivateBarEffect(activeEffectBarIndex);
            // Visualisierung zurücksetzen
            const prevBar = bars[activeEffectBarIndex].element;
            prevBar.setAttribute('color', '#1db954');
            prevBar.setAttribute('material', 'emissive: #1db954; emissiveIntensity: 0.8; transparent: true; opacity: 0.95');
            gazedBars.delete(prevBar);
          }
          // Effekt aktivieren
          activateBarEffect(i);
          // Visuelle Anzeige: Glow und andere Farbe
          bar.setAttribute('color', '#ffd700');
          bar.setAttribute('material', 'emissive: #ffd700; emissiveIntensity: 1.0; transparent: true; opacity: 1.0');
          activeEffectBarIndex = i;
        }, 2500);
        gazeTimers.set(bar, timer);
      });
      
      bar.addEventListener('mouseleave', () => {
        // Timer stoppen wenn Gaze endet
        const timer = gazeTimers.get(bar);
        if (timer) {
          clearTimeout(timer);
          gazeTimers.delete(bar);
        }
        // Kein sofortiges Deaktivieren mehr!
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
      if (environmentAnimationId) {
        cancelAnimationFrame(environmentAnimationId);
        environmentAnimationId = null;
      }
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

    // Effekt zurücksetzen
    if (activeEffectBarIndex !== null) {
      deactivateBarEffect(activeEffectBarIndex);
      activeEffectBarIndex = null;
    }

    currentGenre = song.genre || 'Ambient';
    applyGenrePreset(currentGenre);
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

  // --- Genre-Preset-Logik ---
  let currentGenre = playlist[0].genre;
  const STAR_CONTAINER_ID = 'ambient-star-container';
  const NUM_STARS = 60;
  let starAnimationFrame = null;

  const EDM_PARTICLE_CONTAINER_ID = 'edm-particle-container';
  const NUM_PARTICLES = 50;
  let edmParticleAnimationFrame = null;

  function applyGenrePreset(genre) {
    // Beispielhafte Preset-Logik (Farben, Licht, Objekte)
    switch (genre) {
      case 'Ambient':
        // Ruhiger Farbverlauf, langsame Sterne, zarte Glows
        document.body.style.background = 'linear-gradient(120deg, #232526, #414345)';
        showAmbientStars();
        removeEdmParticles();
        break;
      case 'EDM':
        // Pulsierender Neon-Himmel, schnelle Lichtblitze, partikelreiche Stürme
        document.body.style.background = 'linear-gradient(120deg, #0f2027, #2c5364)';
        removeAmbientStars();
        removeEdmParticles();
        break;
      case 'Chill':
        // Warme Orange/Rot-Töne, kleine Meteoriten
        document.body.style.background = 'linear-gradient(120deg,rgb(14, 14, 14),rgb(45, 45, 45))';
        removeAmbientStars();
        removeEdmParticles();
        break;
      default:
        document.body.style.background = '#222';
        removeAmbientStars();
        removeEdmParticles();
    }
  }

  // Sterne für Ambient anzeigen
  function showAmbientStars() {
    if (document.getElementById(STAR_CONTAINER_ID)) return; // Schon vorhanden
    const container = document.createElement('div');
    container.id = STAR_CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
    // Sterne erzeugen
    for (let i = 0; i < NUM_STARS; i++) {
      const star = document.createElement('div');
      star.className = 'ambient-star';
      const size = Math.random() * 2 + 1;
      star.style.position = 'absolute';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.top = Math.random() * 100 + 'vh';
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.borderRadius = '50%';
      star.style.background = 'white';
      star.style.opacity = (Math.random() * 0.5 + 0.5).toFixed(2);
      star.style.boxShadow = `0 0 ${4 + Math.random()*8}px 1px #fff`;
      container.appendChild(star);
    }
    animateStars();
  }

  // Sterne entfernen
  function removeAmbientStars() {
    const container = document.getElementById(STAR_CONTAINER_ID);
    if (container) container.remove();
    if (starAnimationFrame) {
      cancelAnimationFrame(starAnimationFrame);
      starAnimationFrame = null;
    }
  }

  // Sterne animieren (leichtes Funkeln)
  function animateStars() {
    const container = document.getElementById(STAR_CONTAINER_ID);
    if (!container) return;
    const stars = container.children;
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      // Funkeln: Opazität leicht variieren
      let base = parseFloat(star.style.opacity) || 0.7;
      let flicker = base + Math.sin(Date.now()/700 + i) * 0.15;
      star.style.opacity = Math.max(0.3, Math.min(1, flicker)).toFixed(2);
    }
    starAnimationFrame = requestAnimationFrame(animateStars);
  }

  // --- Environment-Animation ---
  let environmentAnimationId = null;
  let lastDropTime = 0;
  const DROP_THRESHOLD = 0.55; // Lautstärke-Schwelle für Drop
  const DROP_COOLDOWN = 2000; // Mind. 2 Sekunden zwischen Drops

  function animateEnvironment() {
    if (!analyser || realAudio.paused) return;
    analyser.getByteFrequencyData(dataArray);
    // Durchschnittspegel berechnen
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 256;

    // Drop-Erkennung
    const now = Date.now();
    if (avg > DROP_THRESHOLD && (now - lastDropTime) > DROP_COOLDOWN) {
      triggerDropEffect(currentGenre);
      lastDropTime = now;
    }

    // Genre-abhängige Animationen
    switch (currentGenre) {
      case 'Ambient':
        // Beispiel: sanftes Pulsieren der Hintergrundfarbe
        document.body.style.background = `linear-gradient(120deg, #232526, #414345 ${50 + Math.sin(Date.now()/4000)*10}%)`;
        break;
      case 'EDM':
        // Beispiel: schneller Farbwechsel
        const hue = (Date.now()/10) % 360;
        document.body.style.background = `hsl(${hue}, 80%, 20%)`;
        break;
      case 'Chill':
        // Beispiel: leichtes Flackern
        const flicker = 20 + Math.random()*10;
        document.body.style.background = `linear-gradient(120deg,rgb(14, 14, 14),rgb(45, 45, 45) ${flicker}%)`;
        break;
    }

    environmentAnimationId = requestAnimationFrame(animateEnvironment);
  }

  function triggerDropEffect(genre) {
    // Beispielhafte Drop-Effekte je Genre
    switch (genre) {
      case 'Ambient':
        // Sanfter Glow-Boost
        document.body.style.boxShadow = '0 0 80px 20px #b2fefa';
        setTimeout(() => document.body.style.boxShadow = '', 800);
        break;
      case 'EDM':
        // Heller Lichtblitz
        document.body.style.filter = 'brightness(2)';
        setTimeout(() => document.body.style.filter = '', 200);
        // Partikel-Sturm nur beim Drop anzeigen
        showEdmParticles();
        setTimeout(removeEdmParticles, 3000);
        break;
      case 'Chill':
        // Kurzes rotes Flackern
        document.body.style.background = '#ff0000';
        setTimeout(() => applyGenrePreset('Chill'), 150);
        break;
    }
  }

  // Visualizer starten
  function startVisualizer() {
    if (analyserStarted && audioCtx && analyser) {
      // Wenn bereits gestartet, nur Animation fortsetzen
      animateDomeBars();
      animateEnvironment();
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
      animateEnvironment();
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

  // Effekt aktivieren
  function activateBarEffect(index) {
    if (!audioCtx || !srcNode || !analyser) return;
    const bar = bars[index];
    if (bar.effectActive) return;
    // Effekt-Node erzeugen
    const effect = createEffectNode(bar.effectType, audioCtx);
    if (!effect) return;
    // Audio-Kette: srcNode -> effect -> analyser -> destination
    try {
      // Vorherige Verbindungen trennen
      try { srcNode.disconnect(); } catch(e) {}
      try { analyser.disconnect(); } catch(e) {}
      if (bar.effectNode && bar.effectNode.output) {
        try { bar.effectNode.output.disconnect(); } catch(e) {}
      }
      srcNode.connect(effect.input);
      effect.output.connect(analyser);
      analyser.connect(audioCtx.destination);
      bar.effectNode = effect;
      bar.effectActive = true;
    } catch (e) {
      console.error('Fehler beim Aktivieren des Effekts:', e);
    }
  }

  // Effekt deaktivieren
  function deactivateBarEffect(index) {
    if (!audioCtx || !srcNode || !analyser) return;
    const bar = bars[index];
    if (!bar.effectActive || !bar.effectNode) return;
    try {
      // Effekt-Node aus der Kette entfernen
      srcNode.disconnect();
      if (bar.effectNode.output) bar.effectNode.output.disconnect();
      srcNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      bar.effectNode = null;
      bar.effectActive = false;
      // Visualisierung zurücksetzen
      bar.element.setAttribute('color', '#1db954');
      bar.element.setAttribute('material', 'emissive: #1db954; emissiveIntensity: 0.8; transparent: true; opacity: 0.95');
      gazedBars.delete(bar.element);
      // Aktiven Index zurücksetzen, falls dieser Balken
      if (activeEffectBarIndex === index) activeEffectBarIndex = null;
    } catch (e) {
      console.error('Fehler beim Deaktivieren des Effekts:', e);
    }
  }

  // Initial Preset setzen
  applyGenrePreset(currentGenre);

  // EDM-Partikel anzeigen
  function showEdmParticles() {
    if (document.getElementById(EDM_PARTICLE_CONTAINER_ID)) return; // Schon vorhanden
    const container = document.createElement('div');
    container.id = EDM_PARTICLE_CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1001';
    document.body.appendChild(container);
    // Partikel erzeugen
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const p = document.createElement('div');
      p.className = 'edm-particle';
      const size = Math.random() * 8 + 4;
      p.style.position = 'absolute';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = Math.random() * 100 + 'vh';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.borderRadius = '50%';
      p.style.background = `hsl(${Math.floor(Math.random()*360)}, 90%, 60%)`;
      p.style.opacity = (Math.random() * 0.5 + 0.5).toFixed(2);
      p.dataset.speed = (2 + Math.random() * 4).toFixed(2); // Geschwindigkeit
      p.dataset.angle = (Math.random() * 60 - 30).toFixed(2); // -30° bis +30°
      container.appendChild(p);
    }
    animateEdmParticles();
  }

  // EDM-Partikel entfernen
  function removeEdmParticles() {
    const container = document.getElementById(EDM_PARTICLE_CONTAINER_ID);
    if (container) container.remove();
    if (edmParticleAnimationFrame) {
      cancelAnimationFrame(edmParticleAnimationFrame);
      edmParticleAnimationFrame = null;
    }
  }

  // EDM-Partikel animieren
  function animateEdmParticles() {
    const container = document.getElementById(EDM_PARTICLE_CONTAINER_ID);
    if (!container) return;
    const particles = container.children;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let left = parseFloat(p.style.left);
      let top = parseFloat(p.style.top);
      const speed = parseFloat(p.dataset.speed);
      const angle = parseFloat(p.dataset.angle) * Math.PI / 180;
      // Bewegung: nach rechts, leicht diagonal
      left += Math.cos(angle) * speed;
      top += Math.sin(angle) * speed;
      // Wrap-around, wenn außerhalb des Bildschirms
      if (left > 100) left = -5;
      if (top < -5) top = 105;
      if (top > 105) top = -5;
      p.style.left = left + 'vw';
      p.style.top = top + 'vh';
    }
    edmParticleAnimationFrame = requestAnimationFrame(animateEdmParticles);
  }
});
