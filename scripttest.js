// --- Simon Says - 4 Runden ---

const notes = [
  { color: "#FF4136", audio: "sound0", name: "Rot" },
  { color: "#FFD700", audio: "sound1", name: "Gelb" },
  { color: "#2ECC40", audio: "sound2", name: "Grün" },
  { color: "#0074D9", audio: "sound3", name: "Blau" }
];

let sequence = [];
let userInput = [];
let currentRound = 0;
let acceptingInput = false;
let gameStarted = false;
let isFirstGame = true;

let noteContainer, btnStart, endScreen, btnRestart, scoreboard, infoText, scoreText, roundText, menu;

window.addEventListener("DOMContentLoaded", () => {
  initializeElements();
  setupEventListeners();
});

function initializeElements() {
  noteContainer = document.getElementById("noteContainer");
  btnStart = document.getElementById("btn-start");
  endScreen = document.getElementById("endScreen");
  btnRestart = document.getElementById("btn-restart");
  scoreboard = document.getElementById("scoreboard");
  infoText = document.getElementById("infoText");
  scoreText = document.getElementById("scoreText");
  roundText = document.getElementById("roundText");
  menu = document.getElementById("menu");
}

function setupEventListeners() {
  btnStart.addEventListener("click", startGame);
  btnRestart.addEventListener("click", restartGame);
}

function startGame() {
  // Spiel zurücksetzen
  userInput = [];
  currentRound = 0;
  acceptingInput = false;
  gameStarted = true;

  // Sequenz nur beim ersten Spiel erstellen
  if (isFirstGame) {
    sequence = [];
    isFirstGame = false;
  }

  // UI anzeigen/verstecken
  hideElement("#menu");
  hideElement("#endScreen");
  showElement("#scoreboard");

  // Scoreboard aktualisieren
  updateInfo("Höre zu...");
  updateScore(0);
  updateRound(0);
  
  // Noten rendern
  renderNotes();

  // Erste Runde starten
  setTimeout(() => {
    nextRound();
  }, 1000);
}

function nextRound() {
  if (!gameStarted) return;
  
  currentRound++;
  acceptingInput = false;
  userInput = [];
  
  updateInfo("Höre zu...");
  updateRound(currentRound);

  // Nur einen neuen Ton zur bestehenden Sequenz hinzufügen
  const newNote = Math.floor(Math.random() * notes.length);
  sequence.push(newNote);
  
  console.log("Runde", currentRound, "Sequenz:", sequence);

  // Sequenz abspielen
  setTimeout(() => {
    playSequence(0);
  }, 1000);
}

function renderNotes() {
  noteContainer.innerHTML = '';
  
  // 4 Cubes in einer Reihe anordnen
  const positions = [
    { x: -1.5, y: 1.5, z: -2.5 },  // Links
    { x: -0.5, y: 1.5, z: -2.5 },  // Links-Mitte
    { x: 0.5, y: 1.5, z: -2.5 },   // Rechts-Mitte
    { x: 1.5, y: 1.5, z: -2.5 }    // Rechts
  ];
  
  for (let i = 0; i < notes.length; i++) {
    const pos = positions[i];
    const note = document.createElement('a-box');
    
    note.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    note.setAttribute('width', '0.5');
    note.setAttribute('height', '0.5');
    note.setAttribute('depth', '0.3');
    note.setAttribute('color', notes[i].color);
    note.setAttribute('class', 'note');
    note.setAttribute('id', `note-${i}`);
    
    // Basis-Animationen
    note.setAttribute('animation__pulse', 'property: scale; to: 1.1 1.1 1.1; dur: 2000; easing: easeInOutQuad; loop: true; dir: alternate');
    note.setAttribute('animation__float', `property: position; to: ${pos.x} ${pos.y + 0.1} ${pos.z}; dur: 3000; easing: easeInOutQuad; loop: true; dir: alternate`);
    
    // Material mit Leuchteffekt
    note.setAttribute('material', `color: ${notes[i].color}; emissive: ${notes[i].color}; emissiveIntensity: 0.1; transparent: true; opacity: 0.9`);
    
    // Klick-Event
    note.addEventListener('click', () => handleUserInput(i));
    
    noteContainer.appendChild(note);
  }
}

function playSequence(idx) {
  if (!gameStarted) return;
  
  if (idx >= sequence.length) {
    acceptingInput = true;
    updateInfo("Jetzt du! Klicke die Cubes.");
    return;
  }
  
  const n = sequence[idx];
  const note = document.getElementById(`note-${n}`);
  const audio = document.getElementById(notes[n].audio);
  
  if (!audio || !note) {
    setTimeout(() => { if (gameStarted) playSequence(idx + 1); }, 500);
    return;
  }
  
  // Stoppe alle anderen Töne
  stopAllNoteSounds();
  
  // Animation aktivieren
  note.setAttribute('scale', '1.5 1.5 1.5');
  note.setAttribute('material', `color: ${notes[n].color}; emissive: ${notes[n].color}; emissiveIntensity: 1.0; transparent: true; opacity: 1`);
  
  // Ton abspielen
  audio.currentTime = 0;
  audio.play();
  
  // Nach 1 Sekunde Animation zurücksetzen und nächsten Ton
  setTimeout(() => {
    note.setAttribute('scale', '1 1 1');
    note.setAttribute('material', `color: ${notes[n].color}; emissive: ${notes[n].color}; emissiveIntensity: 0.1; transparent: true; opacity: 0.9`);
    
    // Pause zwischen den Tönen
    setTimeout(() => {
      if (gameStarted) playSequence(idx + 1);
    }, 500);
  }, 1000);
}

function handleUserInput(i) {
  if (!acceptingInput || !gameStarted) return;
  
  userInput.push(i);
  console.log("User Input:", userInput, "Expected:", sequence);
  
  const note = document.getElementById(`note-${i}`);
  const audio = document.getElementById(notes[i].audio);
  
  // Stoppe alle anderen Töne
  stopAllNoteSounds();
  
  // Klick-Animation
  note.setAttribute('scale', '1.3 1.3 1.3');
  note.setAttribute('material', `color: ${notes[i].color}; emissive: ${notes[i].color}; emissiveIntensity: 0.8; transparent: true; opacity: 1`);
  
  // Ton abspielen
  audio.currentTime = 0;
  audio.play();
  
  // Animation zurücksetzen
  setTimeout(() => {
    note.setAttribute('scale', '1 1 1');
    note.setAttribute('material', `color: ${notes[i].color}; emissive: ${notes[i].color}; emissiveIntensity: 0.1; transparent: true; opacity: 0.9`);
  }, 300);
  
  // Überprüfung
  const currentInputIndex = userInput.length - 1;
  const expectedNote = sequence[currentInputIndex];
  
  if (expectedNote !== i) {
    // Falsch - aber nochmal versuchen lassen
    console.log(`Falsch! Erwartet: ${expectedNote}, Bekommen: ${i}`);
    document.getElementById("fail-sound").play();
    
    updateInfo("Falsch! Höre nochmal zu...");
    acceptingInput = false;
    userInput = []; // User-Input zurücksetzen
    
    // Sequenz nochmal abspielen
    setTimeout(() => {
      if (gameStarted) {
        playSequence(0);
      }
    }, 1000);
    return;
  }
  
  // Komplette Sequenz korrekt?
  if (userInput.length === sequence.length) {
    acceptingInput = false;
    
    // Alle 4 Runden geschafft?
    if (currentRound >= 4) {
      updateInfo("🎉 Glückwunsch! Du hast alle 4 Runden geschafft!");
      document.getElementById("click-sound").play();
      gameStarted = false;
      
      // Cubes entfernen nach Gewinn
      if (noteContainer) {
        noteContainer.innerHTML = '';
      }
      
      setTimeout(() => {
        gameOver(true);
      }, 2000);
      return;
    }
    
    // Nächste Runde
    updateInfo("Richtig! Nächste Runde...");
    updateScore(currentRound);
    setTimeout(() => {
      if (gameStarted) nextRound();
    }, 1500);
  }
}

function stopAllNoteSounds() {
  for (let i = 0; i < notes.length; i++) {
    const audio = document.getElementById(notes[i].audio);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}

function gameOver(won = false) {
  gameStarted = false;
  hideElement("#scoreboard");
  showElement("#endScreen");
  
  if (won) {
    document.getElementById("endText").setAttribute("value", "🎉 Glückwunsch! Du hast alle 4 Runden geschafft!");
  } else {
    document.getElementById("endText").setAttribute("value", `Game Over! Du hast ${currentRound} Runden geschafft.`);
  }
}

function updateScore(val) {
  if (scoreText) scoreText.setAttribute('value', `Score: ${val}`);
}

function updateRound(val) {
  if (roundText) roundText.setAttribute('value', `Runde: ${val}/4`);
}

function updateInfo(text) {
  if (infoText) infoText.setAttribute('value', text);
}

function showElement(sel) {
  const el = document.querySelector(sel);
  if (el) el.setAttribute("visible", "true");
}

function hideElement(sel) {
  const el = document.querySelector(sel);
  if (el) el.setAttribute("visible", "false");
}

// Neue Funktion für "Nochmal spielen"
function restartGame() {
  // Zurück zur Startseite
  sequence = [];
  userInput = [];
  currentRound = 0;
  acceptingInput = false;
  gameStarted = false;
  isFirstGame = true;

  // UI zurücksetzen
  hideElement("#endScreen");
  hideElement("#scoreboard");
  showElement("#menu");
  
  // Cubes entfernen
  if (noteContainer) {
    noteContainer.innerHTML = '';
  }
}
