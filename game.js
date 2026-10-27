/* ==========================================================================
   1. MÓDULO DE ÁUDIO SINTETIZADO (Web Audio API - Sem Arquivos Externos)
   ========================================================================== */
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 1.0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  laser(freq = 880, endFreq = 220) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  explosion(type = 'small') {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * (type === 'boss' ? 0.7 : 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'boss' ? 450 : 800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + (type === 'boss' ? 0.7 : 0.3));

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === 'boss' ? 0.4 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'boss' ? 0.7 : 0.3));

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    whiteNoise.start(now);
  }

  powerUp() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.1);
    });
  }

  bossAlert() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.setValueAtTime(190, now + 0.15);
    osc.frequency.setValueAtTime(120, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  bombSound() {
    if (!this.enabled || !this.ctx) return;
    this.explosion('boss');
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

const sound = new RetroAudio();

/* ==========================================================================
   2. GERENCIAMENTO DE ESTADO, CANVAS & INPUTS
   ========================================================================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseScreen = document.getElementById('pauseScreen');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const damageVignette = document.getElementById('damageVignette');
const btnStart = document.getElementById('btnStart');
const btnRestart = document.getElementById('btnRestart');
const btnBackToMenu = document.getElementById('btnBackToMenu');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const settingsModal = document.getElementById('settingsModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnModalClose = document.getElementById('btnModalClose');
const modalAudioToggle = document.getElementById('modalAudioToggle');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const btnTestSound = document.getElementById('btnTestSound');
const menuHighScoreEl = document.getElementById('menuHighScore');
const finalScoreEl = document.getElementById('finalScore');
const finalHighScoreEl = document.getElementById('finalHighScore');
const newRecordAlert = document.getElementById('newRecordAlert');

// Elementos de Controle Mobile
const mobileControls = document.getElementById('mobileControls');
const btnMobilePause = document.getElementById('btnMobilePause');
const btnMobileBomb = document.getElementById('btnMobileBomb');
const mobileBombCount = document.getElementById('mobileBombCount');

let width = 0;
let height = 0;
let isSettingsOpen = false;

function resize() {
  width = canvas.width = canvas.clientWidth;
  height = canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Persistência robusta de Recorde no LocalStorage
function loadHighScore() {
  try {
    const saved = localStorage.getItem('cyber_neon_highscore');
    return saved ? parseInt(saved, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore(newScore) {
  if (newScore > highScore) {
    highScore = newScore;
    try {
      localStorage.setItem('cyber_neon_highscore', highScore.toString());
    } catch (e) {
      console.warn('LocalStorage inacessível');
    }
    menuHighScoreEl.textContent = highScore.toLocaleString();
    return true;
  }
  return false;
}

function syncAudioUI() {
  if (sound.enabled) {
    modalAudioToggle.textContent = '🔊 LIGADO';
    modalAudioToggle.classList.remove('muted');
    btnOpenSettings.textContent = '⚙️ CONFIGURAÇÕES [ M ]';
    btnOpenSettings.style.borderColor = 'rgba(0, 255, 255, 0.5)';
    btnOpenSettings.style.color = '#00ffff';
  } else {
    modalAudioToggle.textContent = '🔇 MUDO';
    modalAudioToggle.classList.add('muted');
    btnOpenSettings.textContent = '🔇 CONFIGURAÇÕES [ M ]';
    btnOpenSettings.style.borderColor = '#ff007f';
    btnOpenSettings.style.color = '#ff007f';
  }
}

function toggleAudio() {
  sound.init();
  sound.enabled = !sound.enabled;
  syncAudioUI();
}

function openSettingsModal() {
  sound.init();
  isSettingsOpen = true;
  settingsModal.style.display = 'flex';
  syncAudioUI();
}

function closeSettingsModal() {
  isSettingsOpen = false;
  settingsModal.style.display = 'none';
}

btnOpenSettings.addEventListener('click', openSettingsModal);
btnCloseModal.addEventListener('click', closeSettingsModal);
btnModalClose.addEventListener('click', closeSettingsModal);
modalAudioToggle.addEventListener('click', toggleAudio);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

volumeSlider.addEventListener('input', (e) => {
  sound.init();
  const val = parseInt(e.target.value, 10);
  volumeValue.textContent = `${val}%`;
  sound.setVolume(val / 100);
  if (val === 0 && sound.enabled) {
    sound.enabled = false;
    syncAudioUI();
  } else if (val > 0 && !sound.enabled) {
    sound.enabled = true;
    syncAudioUI();
  }
});

btnTestSound.addEventListener('click', () => {
  sound.init();
  sound.laser(1100, 260);
});

const GameState = {
  MENU: 0,
  PLAYING: 1,
  GAMEOVER: 2
};

let currentState = GameState.MENU;
let score = 0;
let highScore = loadHighScore();
let wave = 1;
const stages = [
  { name: 'ÓRBITA NEON', boss: 'SENTINELA', color: '#00ffff', background: '#071d30' },
  { name: 'NEBULOSA VIOLETA', boss: 'HIDRA', color: '#ff00ff', background: '#240b36' },
  { name: 'NÚCLEO SOLAR', boss: 'ÔMEGA', color: '#ff8800', background: '#321207' }
];
let stage = 0;
let spawnedThisWave = 0;
let transitionTimer = 0;
let announcementTimer = 0;
function stageData() { return stages[stage % stages.length]; }
function waveTarget() { return 6 + wave * 2 + Math.min(stage, 8) * 2; }
function beginWave() {
  spawnedThisWave = 0;
  spawnTimer = 0;
  transitionTimer = 1800;
  announcementTimer = 2400;
  canvas.style.background = `radial-gradient(circle at center, ${stageData().background}, #030008)`;
}
function advanceWave() {
  lasers = lasers.filter(l => !l.isEnemy);
  if (wave % 6 === 0) {
    stage++;
    player.shield = Math.min(player.maxShield, player.shield + 35);
    player.bombs = Math.min(3, player.bombs + 1);
  }
  wave++;
  beginWave();
}
let combo = 1;
let comboTimer = 0;
let screenShake = 0;
let isPaused = false;
let damageFlashTimer = 0;
menuHighScoreEl.textContent = highScore.toLocaleString();

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
  KeyB: false,
  ShiftLeft: false,
  ShiftRight: false,
  KeyP: false,
  KeyR: false,
  KeyM: false,
  Escape: false
};

window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = true;

  // Tecla M - Abrir/Fechar Configurações (apenas no Menu Inicial)
  if (e.code === 'KeyM') {
    if (isSettingsOpen) {
      closeSettingsModal();
    } else if (currentState === GameState.MENU) {
      openSettingsModal();
    }
    return;
  }

  // Tecla Escape - Fechar modal se aberto, ou retornar ao menu se em jogo
  if (e.code === 'Escape') {
    if (isSettingsOpen) {
      closeSettingsModal();
    } else if (currentState === GameState.PLAYING || currentState === GameState.GAMEOVER) {
      goToMenu();
    }
    return;
  }

  if (isSettingsOpen) return;

  if (e.code === 'Enter' || e.code === 'Space') {
    if (currentState === GameState.MENU || currentState === GameState.GAMEOVER) {
      startGame();
    }
  }

  // Tecla P - Pausa
  if (e.code === 'KeyP' && currentState === GameState.PLAYING) {
    setPaused(!isPaused);
  }

  // Tecla R - Reinício Rápido
  if (e.code === 'KeyR' && (currentState === GameState.PLAYING || currentState === GameState.GAMEOVER)) {
    startGame();
  }

  // Tecla B ou Shift - Disparo Manual da Bomba Coletada
  if ((e.code === 'KeyB' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && currentState === GameState.PLAYING && !isPaused) {
    if (player.bombs > 0) {
      player.bombs--;
      triggerScreenBomb();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// Touch e Mouse
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;
let lastTouchX = null;
let lastTouchY = null;

function updatePointer(e) {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  pointerX = clientX;
  pointerY = clientY;
}

// Arrasto Relativo no Touch (evita que o dedo tampe a nave)
window.addEventListener('touchstart', (e) => {
  if (currentState === GameState.PLAYING && !isSettingsOpen) {
    if (isPaused || e.target.closest('button, .ui-layer, .modal-backdrop')) return; // Não interfere nos botões
    isPointerDown = true;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (isPointerDown && currentState === GameState.PLAYING && !isPaused && !isSettingsOpen) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    if (lastTouchX !== null && lastTouchY !== null) {
      const deltaX = touchX - lastTouchX;
      const deltaY = touchY - lastTouchY;
      player.x += deltaX * 1.15;
      player.y += deltaY * 1.15;
    }

    lastTouchX = touchX;
    lastTouchY = touchY;
  }
}, { passive: false });

window.addEventListener('touchend', () => {
  isPointerDown = false;
  lastTouchX = null;
  lastTouchY = null;
});

window.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && currentState === GameState.PLAYING && !isPaused && !isSettingsOpen && e.target === canvas) {
    isPointerDown = true;
    updatePointer(e);
  }
});

window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' && isPointerDown && !isSettingsOpen) {
    updatePointer(e);
  }
});

window.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse') isPointerDown = false;
});

// Ações dos Botões Mobile
btnMobilePause.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentState === GameState.PLAYING) {
    setPaused(!isPaused);
  }
});

btnMobileBomb.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentState === GameState.PLAYING && !isPaused && player.bombs > 0) {
    player.bombs--;
    if (navigator.vibrate) navigator.vibrate(80);
    triggerScreenBomb();
  }
});

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);
btnBackToMenu.addEventListener('click', goToMenu);

function setPaused(paused) {
  isPaused = paused;
  pauseScreen.style.display = paused ? 'flex' : 'none';
  isPointerDown = false;
  lastTouchX = lastTouchY = null;
  updateMobileHUD();
}
document.getElementById('btnResume').addEventListener('click', () => setPaused(false));
document.getElementById('btnPauseRestart').addEventListener('click', startGame);
document.getElementById('btnPauseMenu').addEventListener('click', goToMenu);
window.addEventListener('touchcancel', () => {
  isPointerDown = false;
  lastTouchX = lastTouchY = null;
});
function updateMobileHUD() {
  if (mobileControls) {
    if (currentState === GameState.PLAYING && !isPaused && window.matchMedia('(pointer: coarse), (max-width: 768px)').matches) {
      mobileControls.style.display = 'block';
      if (mobileBombCount) mobileBombCount.textContent = player.bombs;
    } else {
      mobileControls.style.display = 'none';
    }
  }
}

function goToMenu() {
  currentState = GameState.MENU;
  setPaused(false);
  startScreen.style.display = 'flex';
  gameOverScreen.style.display = 'none';
  menuHighScoreEl.textContent = highScore.toLocaleString();
  updateMobileHUD();
}

/* ==========================================================================
   3. ENTIDADES DO JOGO
   ========================================================================== */

// Fundo Estelar Dinâmico em Camadas Neon
class Starfield {
  constructor() {
    this.stars = [];
    this.numStars = 80;
    this.gridOffset = 0;
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 2.5 + 0.5,
        color: ['#00ffff', '#ff00ff', '#ffffff'][Math.floor(Math.random() * 3)]
      });
    }
  }

  update() {
    for (let star of this.stars) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.18)';
    ctx.lineWidth = 1;
    const horizon = height * 0.75;
    this.gridOffset = (this.gridOffset + 1) % 25;

    for (let x = -width; x < width * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(width / 2, horizon);
      ctx.stroke();
    }
    for (let y = horizon + this.gridOffset; y <= height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    for (let star of this.stars) {
      ctx.fillStyle = star.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = star.color;
      ctx.fillRect(star.x, star.y, star.size, star.size * 2);
    }
    ctx.shadowBlur = 0;
  }
}

// Partículas de Impacto e Chamas
class Particle {
  constructor(x, y, color, size = 3, maxSpeed = 4, life = 30) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * size + 1.5;
    this.life = life;
    this.maxLife = life;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * maxSpeed + 0.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Números Flutuantes de Dano / Pontos
class DamageNumber {
  constructor(x, y, text, color = '#ff2b55', isCrit = false) {
    this.x = x + (Math.random() * 20 - 10);
    this.y = y;
    this.text = text;
    this.color = color;
    this.isCrit = isCrit;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -3 - Math.random() * 2;
    this.life = 40;
    this.maxLife = 40;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy *= 0.94;
    this.life--;
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${this.isCrit ? '18px' : '14px'} "Courier New", Courier, monospace`;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Projéteis
class Laser {
  constructor(x, y, vx, vy, isEnemy = false, color = '#00ffff') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isEnemy = isEnemy;
    this.color = color;
    this.radius = isEnemy ? 4 : 3;
    this.length = isEnemy ? 10 : 16;
    this.markedForDeletion = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -30 || this.y > height + 30 || this.x < -30 || this.x > width + 30) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.lineWidth = this.radius * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.4, this.y - this.vy * 0.4);
    ctx.stroke();
    ctx.restore();
  }
}

// Power-ups
const PowerUpType = {
  TRIPLE: { label: '3X TIRO', color: '#00ffff', icon: '⚡' },
  SHIELD: { label: 'ESCUDO', color: '#ff00ff', icon: '🛡️' },
  SPEED:  { label: 'VELOCIDADE', color: '#ffe600', icon: '🚀' },
  BOMB:   { label: 'EMP BOMBA', color: '#ff3333', icon: '💥' }
};

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 1.1;
    this.radius = 16;
    this.markedForDeletion = false;
    const types = Object.keys(PowerUpType);
    this.typeKey = types[Math.floor(Math.random() * types.length)];
    this.data = PowerUpType[this.typeKey];
    this.angle = 0;
  }

  update() {
    this.y += this.vy;
    this.angle += 0.03;
    if (this.y > height + 40) this.markedForDeletion = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.strokeStyle = this.data.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.data.color;
    ctx.lineWidth = 2.5;

    ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

    ctx.rotate(-this.angle);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.data.icon, 0, 0);

    ctx.restore();
  }
}

// Jogador
class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = width / 2;
    this.y = height - 90;
    this.radius = 18;
    this.baseSpeed = 5.2;
    this.speed = this.baseSpeed;
    this.lives = 3;
    this.maxShield = 100;
    this.shield = 100;
    this.ghostShield = 100;
    this.bombs = 1;
    this.tilt = 0;
    this.hasShieldPowerup = false;
    this.shieldTimer = 0;
    this.tripleShotTimer = 0;
    this.speedTimer = 0;
    this.rapidFireTimer = 0;
    this.lastShotTime = 0;
    this.shootInterval = 175;
    this.bulletDamage = 1.3;
    this.invulnerableTimer = 0;
  }

  update(deltaTime) {
    if (this.ghostShield > this.shield) {
      this.ghostShield -= (this.ghostShield - this.shield) * 0.08;
      if (Math.abs(this.ghostShield - this.shield) < 0.2) this.ghostShield = this.shield;
    } else {
      this.ghostShield = this.shield;
    }

    if (this.tripleShotTimer > 0) this.tripleShotTimer -= deltaTime;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= deltaTime;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= deltaTime;
      if (this.shieldTimer <= 0) this.hasShieldPowerup = false;
    }
    if (this.speedTimer > 0) {
      this.speedTimer -= deltaTime;
      this.speed = this.baseSpeed * 1.45;
    } else {
      this.speed = this.baseSpeed;
    }
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= deltaTime;

    let moveX = 0;
    let moveY = 0;
    if (keys.ArrowLeft || keys.KeyA) moveX -= 1;
    if (keys.ArrowRight || keys.KeyD) moveX += 1;
    if (keys.ArrowUp || keys.KeyW) moveY -= 1;
    if (keys.ArrowDown || keys.KeyS) moveY += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    this.x += moveX * this.speed;
    this.y += moveY * this.speed;

    // Movimentação suave com mouse em desktops
    if (isPointerDown && lastTouchX === null) {
      const dx = pointerX - this.x;
      const dy = (pointerY - 40) - this.y;
      this.x += dx * 0.18;
      this.y += dy * 0.18;
      moveX = Math.sign(dx) * Math.min(1, Math.abs(dx) / 30);
    }

    const targetTilt = moveX * 0.28;
    this.tilt += (targetTilt - this.tilt) * 0.2;

    this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
    this.y = Math.max(this.radius + 20, Math.min(height - this.radius - 20, this.y));

    this.tryShoot();

    [-9, 9].forEach(offsetX => {
      particles.push(new Particle(
        this.x + offsetX + (Math.random() * 4 - 2),
        this.y + 16,
        Math.random() > 0.4 ? '#00ffff' : '#ff00ff',
        2.2,
        1.8,
        18
      ));
    });
  }

  tryShoot() {
    const now = performance.now();
    const currentInterval = this.rapidFireTimer > 0 ? 100 : this.shootInterval;
    if (now - this.lastShotTime >= currentInterval) {
      this.lastShotTime = now;
      sound.laser(this.rapidFireTimer > 0 ? 1150 : 920, 260);

      if (this.tripleShotTimer > 0) {
        lasers.push(new Laser(this.x, this.y - 22, 0, -10));
        lasers.push(new Laser(this.x - 18, this.y - 12, -1.5, -9.6));
        lasers.push(new Laser(this.x + 18, this.y - 12, 1.5, -9.6));
      } else {
        lasers.push(new Laser(this.x - 14, this.y - 12, 0, -10));
        lasers.push(new Laser(this.x + 14, this.y - 12, 0, -10));
      }
    }
  }

  takeDamage(damage = 6) {
    if (this.invulnerableTimer > 0) return;

    if (this.hasShieldPowerup) {
      this.hasShieldPowerup = false;
      this.invulnerableTimer = 1300;
      sound.explosion('small');
      damageNumbers.push(new DamageNumber(this.x, this.y - 25, 'BLOQUEADO', '#00ffff', true));
      createExplosion(this.x, this.y, '#ff00ff', 25);
      return;
    }

    this.shield = Math.max(0, this.shield - damage);
    screenShake = 8;
    damageFlashTimer = 10;
    sound.explosion('small');

    damageNumbers.push(new DamageNumber(this.x, this.y - 22, `-${damage}`, '#ff2255', true));
    createExplosion(this.x, this.y, '#ff3344', 12);

    if (this.shield <= 0) {
      this.lives--;
      this.shield = this.maxShield;
      this.ghostShield = this.maxShield;
      this.invulnerableTimer = 2400;
      damageNumbers.push(new DamageNumber(this.x, this.y - 35, 'VIDA PERDIDA!', '#ff0055', true));
      createExplosion(this.x, this.y, '#00ffff', 45);

      if (this.lives <= 0) {
        triggerGameOver();
      }
    } else {
      this.invulnerableTimer = 1200;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 65) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = '#00ffff';

    const hullGrad = ctx.createLinearGradient(0, -25, 0, 20);
    hullGrad.addColorStop(0, '#00e5ff');
    hullGrad.addColorStop(0.5, '#0b1638');
    hullGrad.addColorStop(1, '#050a1a');

    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(8, -12);
    ctx.lineTo(16, -6);
    ctx.lineTo(24, 8);
    ctx.lineTo(24, 15);
    ctx.lineTo(12, 12);
    ctx.lineTo(9, 17);
    ctx.lineTo(3, 13);
    ctx.lineTo(0, 15);
    ctx.lineTo(-3, 13);
    ctx.lineTo(-9, 17);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-24, 15);
    ctx.lineTo(-24, 8);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(-22, -2, 3, 12);
    ctx.fillRect(19, -2, 3, 12);

    const cockpitGrad = ctx.createLinearGradient(0, -18, 0, 4);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.5, '#00ffff');
    cockpitGrad.addColorStop(1, '#ff00aa');

    ctx.fillStyle = cockpitGrad;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, -4);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 10;
    const flameLength = 6 + Math.random() * 6;
    ctx.fillRect(-8, 17, 4, flameLength);
    ctx.fillRect(4, 17, 4, flameLength);

    if (this.hasShieldPowerup || this.invulnerableTimer > 0) {
      ctx.beginPath();
      ctx.strokeStyle = this.hasShieldPowerup ? '#ff00ff' : '#00ffff';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2.5;
      ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Tipos de Inimigos
const EnemyType = {
  SCOUT: { hp: 1.5, score: 100, speed: 1.9, color: '#ffe600', radius: 14 },
  FIGHTER: { hp: 3.5, score: 250, speed: 1.4, color: '#00ffff', radius: 18 },
  TANK: { hp: 8, score: 500, speed: 0.9, color: '#ff00ff', radius: 26 },
  BOSS: { hp: 75, score: 5000, speed: 0.7, color: '#ff1144', radius: 46 }
};

class Enemy {
  constructor(typeKey, x, y) {
    this.typeKey = typeKey;
    this.data = EnemyType[typeKey];
    this.x = x ?? Math.random() * (width - 80) + 40;
    this.y = y ?? -40;
    const waveScale = this.typeKey === 'BOSS' ? (wave - 1) * 8 : (wave - 1) * 0.4;
    this.hp = this.data.hp + waveScale;
    if (typeKey === 'BOSS') this.data = { ...this.data, color: stageData().color };
    this.maxHp = this.hp;
    this.radius = this.data.radius;
    this.speed = this.data.speed;
    this.markedForDeletion = false;
    this.timer = Math.random() * 100;
    this.bossMotion = 0;
    this.shootTimer = 0;
  }

  update(deltaTime = 1000 / 60) {
    const bossStep = deltaTime / (1000 / 60);
    this.timer += 0.025;

    if (this.typeKey === 'SCOUT') {
      this.y += this.speed;
      this.x += Math.sin(this.timer * 1.5) * 1.8;
    } else if (this.typeKey === 'FIGHTER') {
      this.y += this.speed;
      this.shootTimer++;
      if (this.shootTimer > 150) {
        this.shootTimer = 0;
        lasers.push(new Laser(this.x, this.y + this.radius, 0, 2.6, true, '#ff0055'));
      }
    } else if (this.typeKey === 'TANK') {
      this.y += this.speed;
      this.shootTimer++;
      if (this.shootTimer > 190) {
        this.shootTimer = 0;
        lasers.push(new Laser(this.x - 10, this.y + this.radius, -0.8, 2.3, true, '#ff00ff'));
        lasers.push(new Laser(this.x + 10, this.y + this.radius, 0.8, 2.3, true, '#ff00ff'));
      }
    } else if (this.typeKey === 'BOSS') {
      const targetY = Math.min(160, height * 0.28);
      if (this.y < targetY) {
        this.y = Math.min(targetY, this.y + 0.8 * bossStep);
      } else {
        this.bossMotion += 0.007 * bossStep;
        const targetX = width / 2 + Math.sin(this.bossMotion) * Math.max(0, width / 2 - this.radius - 12);
        const maxMove = 1.6 * bossStep;
        this.x += Math.max(-maxMove, Math.min(maxMove, targetX - this.x));
      }
      this.shootTimer++;
      if (this.shootTimer > (this.hp < this.maxHp / 2 ? 55 : 95)) {
        this.shootTimer = 0;
        if (stage % 3 === 0) {
          [-1.4, 0, 1.4].forEach(vx => lasers.push(new Laser(this.x, this.y + this.radius, vx, 2.6, true, this.data.color)));
        } else if (stage % 3 === 1) {
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.3, 0, 0.3].forEach(offset => lasers.push(new Laser(this.x, this.y, Math.cos(angle + offset) * 3, Math.sin(angle + offset) * 3, true, this.data.color)));
        } else {
          for (let i = 0; i < 10; i++) {
            const angle = i * Math.PI / 5 + this.timer;
            lasers.push(new Laser(this.x, this.y, Math.cos(angle) * 2.8, Math.sin(angle) * 2.8, true, this.data.color));
          }
        }
      }
    }

    if (this.y > height + 60) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = this.data.color;
    ctx.fillStyle = '#0e0417';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.data.color;

    if (this.typeKey === 'SCOUT') {
      ctx.beginPath();
      ctx.moveTo(0, this.radius);
      ctx.lineTo(this.radius, -this.radius);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.typeKey === 'FIGHTER') {
      ctx.beginPath();
      ctx.moveTo(0, this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(this.radius * 0.7, -this.radius);
      ctx.lineTo(-this.radius * 0.7, -this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.typeKey === 'TANK') {
      ctx.beginPath();
      ctx.moveTo(0, this.radius);
      ctx.lineTo(this.radius, this.radius * 0.4);
      ctx.lineTo(this.radius, -this.radius);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.lineTo(-this.radius, this.radius * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.typeKey === 'BOSS') {
      // Disco alienígena com cúpula, casco metálico e luzes de propulsão.
      const r = this.radius;
      const hull = ctx.createLinearGradient(0, -r * 0.25, 0, r * 0.55);
      hull.addColorStop(0, '#748caa');
      hull.addColorStop(0.45, '#23364f');
      hull.addColorStop(1, '#090e23');
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.08, r, r * 0.43, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#102c3a';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.2, r * 0.46, r * 0.5, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a2ffb0';
      ctx.shadowColor = '#65ff91';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, r * 0.17, r * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06120d';
      [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.ellipse(side * r * 0.075, -r * 0.36, r * 0.045, r * 0.08, side * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = this.data.color;
      ctx.shadowColor = this.data.color;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.88, r * 0.12, 0, 0, Math.PI);
      ctx.stroke();
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = i % 2 === 0 ? this.data.color : '#ffe600';
        ctx.beginPath();
        ctx.arc(i * r * 0.3, r * 0.29 - Math.abs(i) * r * 0.035, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.save();
      const barW = 120;
      const barH = 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 20, barW, barH);
      ctx.fillStyle = '#ff1144';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff1144';
      const fillW = Math.max(0, (this.hp / this.maxHp) * barW);
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 20, fillW, barH);
      ctx.restore();
      return;
    }

    ctx.restore();
  }
}

/* ==========================================================================
   4. SISTEMA DE GERENCIAMENTO, SPAWN E COLISÕES
   ========================================================================= */
const starfield = new Starfield();
const player = new Player();
let enemies = [];
let lasers = [];
let powerups = [];
let particles = [];
let damageNumbers = [];

let spawnTimer = 0;
let activeBoss = null;

function createExplosion(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color, 3.5, 5, 35));
  }
}

function triggerScreenBomb() {
  sound.bombSound();
  screenShake = 25;
  enemies.forEach(enemy => {
    if (enemy.markedForDeletion) return;
    if (enemy.typeKey === 'BOSS') {
      enemy.hp -= 35;
      if (enemy.hp > 0) return;
      activeBoss = null;
    }
    enemy.markedForDeletion = true;
    createExplosion(enemy.x, enemy.y, enemy.data.color, 25);
    damageNumbers.push(new DamageNumber(enemy.x, enemy.y, 'EMP!', '#ff3333', true));
    score += enemy.data.score;
  });
  enemies = enemies.filter(e => !e.markedForDeletion);
  saveHighScore(score);
  lasers = lasers.filter(l => !l.isEnemy);
}

function checkCollisions() {
  for (let l of lasers) {
    if (l.isEnemy || l.markedForDeletion) continue;

    for (let enemy of enemies) {
      if (enemy.markedForDeletion) continue;

      const dist = Math.hypot(l.x - enemy.x, l.y - enemy.y);
      if (dist < l.radius + enemy.radius) {
        l.markedForDeletion = true;
        enemy.hp -= player.bulletDamage;
        createExplosion(l.x, l.y, '#ffffff', 4);

        if (enemy.hp <= 0) {
          enemy.markedForDeletion = true;
          const pointsEarned = enemy.data.score * combo;
          score += pointsEarned;
          comboTimer = 180;
          combo = Math.min(combo + 1, 8);

          saveHighScore(score);

          damageNumbers.push(new DamageNumber(enemy.x, enemy.y, `+${pointsEarned}`, '#00ffff'));

          createExplosion(enemy.x, enemy.y, enemy.data.color, enemy.typeKey === 'BOSS' ? 70 : 25);
          sound.explosion(enemy.typeKey === 'BOSS' ? 'boss' : 'small');

          if (enemy.typeKey === 'BOSS') {
            activeBoss = null;
            damageNumbers.push(new DamageNumber(width / 2, height / 2, 'CHEFÃO DESTRUÍDO!', '#ffe600', true));
          }

          if (Math.random() < 0.22) {
            powerups.push(new PowerUp(enemy.x, enemy.y));
          }
        }
        break;
      }
    }
  }

  for (let l of lasers) {
    if (!l.isEnemy || l.markedForDeletion) continue;

    const dist = Math.hypot(l.x - player.x, l.y - player.y);
    if (dist < l.radius + player.radius) {
      l.markedForDeletion = true;
      player.takeDamage(6);
    }
  }

  for (let enemy of enemies) {
    if (enemy.markedForDeletion) continue;

    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < enemy.radius + player.radius) {
      if (enemy.typeKey !== 'BOSS') enemy.markedForDeletion = true;
      player.takeDamage(12);
      createExplosion(enemy.x, enemy.y, enemy.data.color, 18);
    }
  }

  for (let p of powerups) {
    if (p.markedForDeletion) continue;

    const dist = Math.hypot(p.x - player.x, p.y - player.y);
    if (dist < p.radius + player.radius) {
      p.markedForDeletion = true;
      sound.powerUp();
      score += 150;
      saveHighScore(score);
      damageNumbers.push(new DamageNumber(p.x, p.y - 15, p.data.label, p.data.color, true));

      if (p.typeKey === 'TRIPLE') {
        player.tripleShotTimer = 9000;
      } else if (p.typeKey === 'SHIELD') {
        player.hasShieldPowerup = true;
        player.shieldTimer = 12000;
      } else if (p.typeKey === 'SPEED') {
        player.speedTimer = 8000;
      } else if (p.typeKey === 'BOMB') {
        player.bombs = Math.min(player.bombs + 1, 3);
      }
    }
  }
}

function spawnLogic(deltaTime) {
  announcementTimer = Math.max(0, announcementTimer - deltaTime);
  if (transitionTimer > 0) {
    transitionTimer = Math.max(0, transitionTimer - deltaTime);
    return;
  }
  const bossWave = wave % 6 === 0;
  const target = bossWave ? 1 : waveTarget();
  if (spawnedThisWave >= target) {
    if (!enemies.some(e => !e.markedForDeletion)) advanceWave();
    return;
  }
  if (wave % 6 === 0 && !activeBoss) {
    activeBoss = new Enemy('BOSS', width / 2, -50);
    enemies.push(activeBoss);
    spawnedThisWave++;
    sound.bossAlert();
    return;
  }

  if (activeBoss) return;

  spawnTimer += deltaTime;
  const spawnInterval = Math.max(400, 1100 - wave * 50);
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    const rand = Math.random();
    let type = 'SCOUT';
    if (rand > 0.85) type = 'TANK';
    else if (rand > 0.55) type = 'FIGHTER';

    enemies.push(new Enemy(type));
    spawnedThisWave++;
  }
}

/* ==========================================================================
   5. INTERFACE (HUD), CONTROLE DE ESTADOS E LOOP PRINCIPAL
   ========================================================================== */
function drawProgression() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillStyle = stageData().color;
  const remaining = Math.max(0, waveTarget() - spawnedThisWave) + enemies.filter(e => !e.markedForDeletion).length;
  const progress = wave % 6 === 0
    ? `${stageData().boss}${activeBoss ? ' • ' + Math.ceil(Math.max(0, activeBoss.hp)) + ' HP' : ''}`
    : `RESTANTES: ${remaining}`;
  ctx.fillText(`FASE ${stage + 1} • ${stageData().name} • ${progress}`, width / 2, height - 18, width - 24);
  if (announcementTimer > 0) {
    ctx.fillStyle = 'rgba(3, 0, 8, 0.85)';
    ctx.fillRect(0, height * 0.4 - 28, width, 56);
    ctx.fillStyle = stageData().color;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(`FASE ${stage + 1}: ${stageData().name}`, width / 2, height * 0.4 - 3, width - 32);
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(wave % 6 === 0 ? `CHEFÃO: ${stageData().boss}` : `ONDA ${(wave - 1) % 6 + 1} / 5`, width / 2, height * 0.4 + 19, width - 32);
  }
  ctx.restore();
}
function drawCompactHUD() {
  ctx.save();
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#00ffff';
  ctx.fillStyle = '#00ffff';
  ctx.fillText(`SCORE: ${score}`, 12, 24);
  ctx.fillStyle = '#ffe600';
  ctx.fillText(`HI: ${Math.max(score, highScore).toLocaleString()}`, 12, 43);
  ctx.textAlign = 'right';
  const right = width - 72;
  ctx.fillStyle = '#00ffff';
  ctx.fillText(`WAVE: ${wave}`, right, 24);
  ctx.fillStyle = '#ff3344';
  ctx.fillText(`VIDAS: ${player.lives} | EMP: ${player.bombs}`, right, 43);
  const barWidth = width - 24;
  ctx.fillStyle = 'rgba(6, 4, 18, 0.85)';
  ctx.fillRect(12, 62, barWidth, 14);
  ctx.fillStyle = player.shield <= 30 ? '#ff1144' : '#00ffff';
  ctx.fillRect(14, 64, (barWidth - 4) * Math.max(0, Math.min(1, player.shield / player.maxShield)), 10);
  ctx.strokeStyle = '#00ffff';
  ctx.strokeRect(12, 62, barWidth, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.round(player.shield)}%`, width - 16, 73);
  ctx.textAlign = 'left';
  const effects = [];
  if (combo > 1) effects.push(`COMBO x${combo}`);
  if (player.tripleShotTimer > 0) effects.push('TIRO TRIPLO');
  if (player.hasShieldPowerup) effects.push('ESCUDO');
  if (player.speedTimer > 0) effects.push('HYPER');
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText(effects.join(' | '), 12, 94, width - 24);
  ctx.restore();
}
function drawHUD() {
  if (width <= 768) { drawCompactHUD(); return; }
  ctx.save();
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00ffff';

  ctx.fillText(`SCORE: ${score}`, 20, 52);
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#ffe600';
  ctx.shadowColor = '#ffe600';
  ctx.fillText(`👑 HI: ${Math.max(score, highScore).toLocaleString()}`, 20, 70);

  if (combo > 1) {
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.fillText(`COMBO x${combo}`, 20, 90);
  }

  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = '#00ffff';
  ctx.shadowColor = '#00ffff';
  ctx.fillText(`WAVE: ${wave}`, width / 2 - 35, 30);

  ctx.fillStyle = '#ff3344';
  ctx.shadowColor = '#ff3344';
  ctx.fillText(`BOMBAS [B]: ${'💣 '.repeat(player.bombs)}`, width / 2 - 70, 52);

  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#6bf';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#6bf';
  ctx.fillText('[P] PAUSA  |  [ESC] MENU', width / 2 - 65, 70);

  let livesText = '❤️ '.repeat(Math.max(0, player.lives));
  ctx.fillStyle = '#ff2b55';
  ctx.shadowColor = '#ff2b55';
  ctx.fillText(`VIDAS: ${livesText}`, width - 210, 30);

  const barW = 180;
  const barH = 14;
  const barX = width - 210;
  const barY = 42;

  ctx.fillStyle = 'rgba(6, 4, 18, 0.85)';
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#00ffff';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeRect(barX, barY, barW, barH);

  const ghostPct = Math.max(0, Math.min(1, player.ghostShield / player.maxShield));
  ctx.fillStyle = '#ff8800';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#ff8800';
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * ghostPct, barH - 4);

  const healthPct = Math.max(0, Math.min(1, player.shield / player.maxShield));
  const isCritical = player.shield <= 30;
  const barColor = isCritical ? '#ff1144' : '#00ffff';

  ctx.fillStyle = barColor;
  ctx.shadowBlur = isCritical ? 14 : 8;
  ctx.shadowColor = barColor;
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * healthPct, barH - 4);

  ctx.strokeStyle = 'rgba(5, 5, 15, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  for (let s = 1; s <= 4; s++) {
    const segX = barX + (barW / 5) * s;
    ctx.beginPath();
    ctx.moveTo(segX, barY + 2);
    ctx.lineTo(segX, barY + barH - 2);
    ctx.stroke();
  }

  ctx.font = 'bold 11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#000000';
  ctx.fillText(`${Math.round(player.shield)}%`, barX + barW - 6, barY + barH - 3);
  ctx.textAlign = 'left';

  let pY = 112;
  ctx.font = '12px "Courier New", Courier, monospace';
  if (player.tripleShotTimer > 0) {
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`⚡ TIRO TRIPLO: ${(player.tripleShotTimer / 1000).toFixed(1)}s`, 20, pY);
    pY += 18;
  }
  if (player.hasShieldPowerup) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`🛡️ ESCUDO CIBERNÉTICO ATIVO`, 20, pY);
    pY += 18;
  }
  if (player.speedTimer > 0) {
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`🚀 HYPER VELOCIDADE: ${(player.speedTimer / 1000).toFixed(1)}s`, 20, pY);
  }

  ctx.restore();
}

function triggerGameOver() {
  currentState = GameState.GAMEOVER;
  const wasRecordBroken = saveHighScore(score);
  finalScoreEl.textContent = score.toLocaleString();
  finalHighScoreEl.textContent = highScore.toLocaleString();

  if (wasRecordBroken) {
    newRecordAlert.style.display = 'block';
  } else {
    newRecordAlert.style.display = 'none';
  }

  gameOverScreen.style.display = 'flex';
  updateMobileHUD();
  sound.explosion('boss');
}

function startGame() {
  sound.init();
  currentState = GameState.PLAYING;
  setPaused(false);
  score = 0;
  wave = 1;
  combo = 1;
  comboTimer = 0;
  activeBoss = null;
  enemies = [];
  lasers = [];
  powerups = [];
  particles = [];
  damageNumbers = [];
  player.reset();
  stage = 0;
  beginWave();

  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  updateMobileHUD();
}

let lastTime = performance.now();

function gameLoop(timestamp) {
  const deltaTime = Math.min(50, Math.max(0, timestamp - lastTime));
  lastTime = timestamp;

  if (damageFlashTimer > 0) {
    damageFlashTimer--;
    damageVignette.style.opacity = (damageFlashTimer / 15).toFixed(2);
  } else {
    damageVignette.style.opacity = '0';
  }

  ctx.save();
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShake;
    const shakeY = (Math.random() - 0.5) * screenShake;
    ctx.translate(shakeX, shakeY);
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }

  ctx.clearRect(0, 0, width, height);

  starfield.update();
  starfield.draw(ctx);

  if (currentState === GameState.PLAYING) {
    if (!isPaused) {
      if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) combo = 1;
      }

      spawnLogic(deltaTime);
      player.update(deltaTime);
      checkCollisions();

      lasers.forEach(l => l.update());
      lasers = lasers.filter(l => !l.markedForDeletion);

      enemies.forEach(e => e.update(deltaTime));
      enemies = enemies.filter(e => !e.markedForDeletion);

      powerups.forEach(p => p.update());
      powerups = powerups.filter(p => !p.markedForDeletion);

      particles.forEach(p => p.update());
      particles = particles.filter(p => p.life > 0);

      damageNumbers.forEach(d => d.update());
      damageNumbers = damageNumbers.filter(d => d.life > 0);
    }

    powerups.forEach(p => p.draw(ctx));
    lasers.forEach(l => l.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    player.draw(ctx);
    particles.forEach(p => p.draw(ctx));
    damageNumbers.forEach(d => d.draw(ctx));
    drawHUD();
    drawProgression();
    updateMobileHUD();

  } else if (currentState === GameState.MENU || currentState === GameState.GAMEOVER) {
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    particles = particles.filter(p => p.life > 0);
    updateMobileHUD();
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  requestAnimationFrame(gameLoop);
};
