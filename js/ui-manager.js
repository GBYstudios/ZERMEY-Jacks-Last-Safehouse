class UIManager {
  constructor() {
    this.currentScreen = 'menu';
    this.hudVisible = true;
    this.pausedState = false;
  }
  
  initMainMenu() {
    const html = `
      <div id="game-canvas-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;"></div>
      
      <div class="menu-screen active" id="mainMenu">
        <div class="menu-background"></div>
        <div class="menu-content">
          <h1 class="menu-title">ZERMEY</h1>
          <p class="menu-subtitle">JACK'S LAST SAFEHOUSE</p>
          <div class="menu-buttons">
            <button class="menu-btn" id="btnPlay">PLAY</button>
            <button class="menu-btn secondary" id="btnSettings">SETTINGS</button>
            <button class="menu-btn secondary" id="btnControls">CONTROLS</button>
          </div>
        </div>
      </div>
      
      <div class="pause-menu" id="pauseMenu">
        <h2>⏸ PAUSED</h2>
        <div class="menu-buttons">
          <button class="menu-btn" id="btnResume">RESUME</button>
          <button class="menu-btn secondary" id="btnSettings2">SETTINGS</button>
          <button class="menu-btn secondary" id="btnMenu">MAIN MENU</button>
        </div>
      </div>
      
      <div class="settings-screen" id="settingsScreen">
        <div class="settings-content">
          <h2>⚙️ SETTINGS</h2>
          <div class="setting-group">
            <div class="setting-label">
              <span>Master Volume</span>
              <span class="setting-value" id="masterVolValue">70%</span>
            </div>
            <input type="range" min="0" max="100" value="70" class="slider" id="masterVolSlider">
          </div>
          <div class="setting-group">
            <div class="setting-label">
              <span>Mouse Sensitivity</span>
              <span class="setting-value" id="mouseSensitivityValue">100%</span>
            </div>
            <input type="range" min="25" max="400" value="100" class="slider" id="mouseSensitivitySlider">
          </div>
          <div class="setting-group">
            <div class="setting-label">
              <span>Graphics Quality</span>
              <span class="setting-value" id="graphicsQualityValue">HIGH</span>
            </div>
            <select class="setting-select" id="graphicsQualitySelect">
              <option value="auto">AUTO</option>
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
            </select>
          </div>
          <div class="setting-group">
            <button class="menu-btn secondary" id="btnBackSettings">BACK</button>
          </div>
        </div>
      </div>
      
      <div class="inventory-screen" id="inventoryScreen">
        <div class="inventory-content">
          <h2>📦 INVENTORY</h2>
          <div class="inventory-grid" id="inventoryGrid"></div>
          <button class="menu-btn" id="btnCloseInventory">CLOSE</button>
        </div>
      </div>
      
      <div class="death-screen" id="deathScreen">
        <div class="death-content">
          <h1 class="death-title">💀 GAME OVER</h1>
          <div class="death-stats" id="deathStats"></div>
          <div class="menu-buttons">
            <button class="menu-btn" id="btnRestart">RESTART</button>
            <button class="menu-btn secondary" id="btnMenuDeath">MAIN MENU</button>
          </div>
        </div>
      </div>
      
      <div class="victory-screen" id="victoryScreen">
        <div class="victory-content">
          <h1 class="victory-title">🏆 YOU SAVED THE TOWN!</h1>
          <p class="victory-subtitle">JACK SURVIVED THE APOCALYPSE</p>
          <div class="victory-stats" id="victoryStats"></div>
          <div class="menu-buttons">
            <button class="menu-btn" id="btnPlayAgain">PLAY AGAIN</button>
            <button class="menu-btn secondary" id="btnMenuVictory">MAIN MENU</button>
          </div>
        </div>
      </div>
      
      <div class="hud" id="hud">
        <div class="hud-row">
          <div class="hud-item">🧟 ZOMBIES DEFEATED: <span id="zombiesDefeated">0</span></div>
          <div class="hud-item">📍 LOCATIONS RESTORED: <span id="locationsRestored">1/4</span></div>
        </div>
        <div class="hud-row">
          <div class="hud-item">⏱️ SURVIVAL TIME: <span id="survivalTime">00:00</span></div>
        </div>
      </div>
      
      <div class="health-bar" id="healthBar">
        <div class="health-bar-fill" id="healthBarFill"></div>
        <div class="health-text" id="healthText">❤️ 100/100</div>
      </div>
      
      <button class="inventory-btn" id="btnInventory">INVENTORY (I)</button>
    `;
    
    document.getElementById('game-container').innerHTML = html;
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    document.getElementById('btnPlay')?.addEventListener('click', () => this.playGame());
    document.getElementById('btnSettings')?.addEventListener('click', () => this.openSettings());
    document.getElementById('btnControls')?.addEventListener('click', () => this.openControls());
    document.getElementById('btnResume')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btnSettings2')?.addEventListener('click', () => this.openSettings());
    document.getElementById('btnMenu')?.addEventListener('click', () => this.mainMenu());
    document.getElementById('masterVolSlider')?.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('masterVolValue').textContent = val + '%';
      audioManager.setVolume('master', val / 100);
      if (window.game?.gameState?.settings) window.game.gameState.settings.masterVolume = val / 100;
    });
    document.getElementById('mouseSensitivitySlider')?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      document.getElementById('mouseSensitivityValue').textContent = val + '%';
      const normalizedSensitivity = 0.0005 + ((val - 25) / 375) * 0.0095;
      window.game?.cameraController?.setMouseSensitivity(normalizedSensitivity);
      if (window.game?.gameState?.settings) window.game.gameState.settings.cameraSensitivity = val;
    });
    document.getElementById('graphicsQualitySelect')?.addEventListener('change', (e) => {
      const value = e.target.value;
      document.getElementById('graphicsQualityValue').textContent = value.toUpperCase();
      window.game?.applyGraphicsQuality(value);
    });
    document.getElementById('btnBackSettings')?.addEventListener('click', () => this.closeSettings());
    document.getElementById('btnInventory')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btnCloseInventory')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btnRestart')?.addEventListener('click', () => this.restartGame());
    document.getElementById('btnMenuDeath')?.addEventListener('click', () => this.mainMenu());
    document.getElementById('btnPlayAgain')?.addEventListener('click', () => this.restartGame());
    document.getElementById('btnMenuVictory')?.addEventListener('click', () => this.mainMenu());
  }
  
  playGame() {
    audioManager.playSound('button');
    this.currentScreen = 'game';
    document.getElementById('mainMenu').classList.remove('active');
    window.game?.start();
  }
  
  openSettings() {
    audioManager.playSound('button');
    this.syncSettings(window.game?.gameState?.settings);
    document.getElementById('settingsScreen').classList.add('active');
  }
  
  closeSettings() {
    audioManager.playSound('button');
    document.getElementById('settingsScreen').classList.remove('active');
  }
  
  openControls() {
    audioManager.playSound('button');
    alert('CONTROLS\n\nWASD / Arrow Keys - Move\nShift - Run\nSpace - Punch\nESC - Pause Menu\nI - Inventory\nE - Use Item\n\nClick the game to capture the mouse. Move the mouse to rotate the camera. Press ESC to release it.\n\nObjective: Restore all safe zones by clearing every zombie!');
  }
  
  toggleInventory() {
    audioManager.playSound('button');
    document.getElementById('inventoryScreen').classList.toggle('active');
    this.updateInventoryDisplay();
  }
  
  updateInventoryDisplay() {
    if (!window.game) return;
    const inventory = window.game.gameState.inventory;
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const [item, count] of Object.entries(inventory)) {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.innerHTML = `<div style="font-weight:bold">${item.toUpperCase()}</div><div>×${count}</div>`;
      grid.appendChild(div);
    }
  }
  
  showDeathScreen(stats) {
    audioManager.playSound('death');
    this.currentScreen = 'death';
    document.getElementById('deathScreen').classList.add('active');
    document.getElementById('deathStats').innerHTML = `
      <p>⏱️ Survival Time: ${this.formatTime(stats.survivalTime)}</p>
      <p>🧟 Zombies Defeated: ${stats.zombiesDefeated}</p>
      <p>📍 Locations Restored: ${stats.locationsRestored}/4</p>
    `;
  }
  
  showVictoryScreen(stats) {
    audioManager.playSound('victory');
    this.currentScreen = 'victory';
    document.getElementById('victoryScreen').classList.add('active');
    document.getElementById('victoryStats').innerHTML = `
      <p>✅ All Safe Zones Restored</p>
      <p>⏱️ Survival Time: ${this.formatTime(stats.survivalTime)}</p>
      <p>🧟 Zombies Defeated: ${stats.zombiesDefeated}</p>
    `;
  }
  
  pauseGame() {
    if (this.pausedState) return;
    this.pausedState = true;
    audioManager.playSound('button');
    document.getElementById('pauseMenu').classList.add('active');
    window.game?.pause();
  }
  
  resumeGame() {
    if (!this.pausedState) return;
    this.pausedState = false;
    audioManager.playSound('button');
    document.getElementById('pauseMenu').classList.remove('active');
    window.game?.resume();
  }
  
  restartGame() {
    audioManager.playSound('button');
    saveSystem.reset();
    location.reload();
  }
  
  mainMenu() {
    audioManager.playSound('button');
    location.reload();
  }
  
  updateHUD(gameState) {
    const zombiesDefeated = document.getElementById('zombiesDefeated');
    const locationsRestored = document.getElementById('locationsRestored');
    const survivalTime = document.getElementById('survivalTime');
    const healthBarFill = document.getElementById('healthBarFill');
    const healthText = document.getElementById('healthText');
    
    if (!zombiesDefeated || !locationsRestored || !survivalTime || !healthBarFill || !healthText) {
      console.warn('HUD elements not found - game may not be running');
      return;
    }
    
    zombiesDefeated.textContent = gameState.statistics.zombiesDefeated;
    let restored = 0;
    for (const [name, data] of Object.entries(gameState.locations)) {
      if (data.restored) restored++;
    }
    locationsRestored.textContent = `${restored}/4`;
    const time = Math.floor(gameState.statistics.timeAlive);
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    survivalTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const health = gameState.player.health;
    const maxHealth = CONFIG.PLAYER_MAX_HEALTH;
    const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    healthBarFill.style.width = healthPercent + '%';
    healthText.textContent = `❤️ ${Math.ceil(health)}/${maxHealth}`;
  }

  syncSettings(settings = {}) {
    const masterVolume = Math.round((settings.masterVolume ?? CONFIG.MASTER_VOLUME) * 100);
    const cameraSensitivity = settings.cameraSensitivity <= 4 ? Math.round(settings.cameraSensitivity * 100) : (settings.cameraSensitivity ?? 100);
    const graphicsQuality = settings.graphicsQuality || CONFIG.GRAPHICS_QUALITY.HIGH;

    const masterSlider = document.getElementById('masterVolSlider');
    const mouseSlider = document.getElementById('mouseSensitivitySlider');
    const qualitySelect = document.getElementById('graphicsQualitySelect');

    if (masterSlider) masterSlider.value = masterVolume;
    if (mouseSlider) mouseSlider.value = cameraSensitivity;
    if (qualitySelect) qualitySelect.value = graphicsQuality;

    const masterLabel = document.getElementById('masterVolValue');
    const sensitivityLabel = document.getElementById('mouseSensitivityValue');
    const qualityLabel = document.getElementById('graphicsQualityValue');

    if (masterLabel) masterLabel.textContent = masterVolume + '%';
    if (sensitivityLabel) sensitivityLabel.textContent = cameraSensitivity + '%';
    if (qualityLabel) qualityLabel.textContent = graphicsQuality.toUpperCase();
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}

const uiManager = new UIManager();
window.uiManager = uiManager;
