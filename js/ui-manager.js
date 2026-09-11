class UIManager {
  constructor() {
    this.currentScreen = 'menu';
    this.hudVisible = true;
    this.pausedState = false;
  }
  
  initMainMenu() {
    const html = `
      <div class="menu-screen active" id="mainMenu">
        <div class="menu-background"></div>
        <div class="menu-content">
          <h1 class="menu-title">ZERMEY</h1>
          <p class="menu-subtitle">JACK'S LAST SAFEHOUSE</p>
          <div class="menu-buttons">
            <button class="menu-btn" id="btnPlay">PLAY</button>
            <button class="menu-btn secondary" id="btnMultiplayer">MULTIPLAYER</button>
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
              <span>Music Volume</span>
              <span class="setting-value" id="musicVolValue">50%</span>
            </div>
            <input type="range" min="0" max="100" value="50" class="slider" id="musicVolSlider">
          </div>
          
          <div class="setting-group">
            <div class="setting-label">
              <span>Effects Volume</span>
              <span class="setting-value" id="effectsVolValue">70%</span>
            </div>
            <input type="range" min="0" max="100" value="70" class="slider" id="effectsVolSlider">
          </div>
          
          <div class="setting-group">
            <div class="setting-label">
              <span>Camera Sensitivity</span>
              <span class="setting-value" id="cameraSensValue">100%</span>
            </div>
            <input type="range" min="50" max="200" value="100" class="slider" id="cameraSensSlider">
          </div>
          
          <div class="setting-group">
            <button class="menu-btn secondary" id="btnResetSave">RESET SAVE</button>
          </div>
          
          <div class="setting-group">
            <button class="menu-btn" id="btnBackSettings">BACK</button>
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
      
      <div class="map-screen" id="mapScreen">
        <div class="map-content">
          <canvas class="map-canvas" id="mapCanvas"></canvas>
          <button class="menu-btn" id="btnCloseMap">CLOSE</button>
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
    // Main Menu
    document.getElementById('btnPlay')?.addEventListener('click', () => this.playGame());
    document.getElementById('btnMultiplayer')?.addEventListener('click', () => this.openMultiplayer());
    document.getElementById('btnSettings')?.addEventListener('click', () => this.openSettings());
    document.getElementById('btnControls')?.addEventListener('click', () => this.openControls());
    
    // Pause Menu
    document.getElementById('btnResume')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btnSettings2')?.addEventListener('click', () => this.openSettings());
    document.getElementById('btnMenu')?.addEventListener('click', () => this.mainMenu());
    
    // Settings
    document.getElementById('masterVolSlider')?.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('masterVolValue').textContent = val + '%';
      audioManager.setVolume('master', val / 100);
    });
    
    document.getElementById('musicVolSlider')?.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('musicVolValue').textContent = val + '%';
      audioManager.setVolume('music', val / 100);
    });
    
    document.getElementById('effectsVolSlider')?.addEventListener('input', (e) => {
      const val = e.target.value;
      document.getElementById('effectsVolValue').textContent = val + '%';
      audioManager.setVolume('effects', val / 100);
    });
    
    document.getElementById('cameraSensSlider')?.addEventListener('input', (e) => {
      document.getElementById('cameraSensValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('btnResetSave')?.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        saveSystem.reset();
        this.mainMenu();
      }
    });
    
    document.getElementById('btnBackSettings')?.addEventListener('click', () => this.closeSettings());
    
    // Inventory
    document.getElementById('btnInventory')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btnCloseInventory')?.addEventListener('click', () => this.toggleInventory());
    
    // Map
    document.getElementById('btnCloseMap')?.addEventListener('click', () => this.closeMap());
    
    // Death Screen
    document.getElementById('btnRestart')?.addEventListener('click', () => this.restartGame());
    document.getElementById('btnMenuDeath')?.addEventListener('click', () => this.mainMenu());
    
    // Victory Screen
    document.getElementById('btnPlayAgain')?.addEventListener('click', () => this.restartGame());
    document.getElementById('btnMenuVictory')?.addEventListener('click', () => this.mainMenu());
  }
  
  playGame() {
    audioManager.playSound('button');
    this.currentScreen = 'game';
    document.getElementById('mainMenu').classList.remove('active');
    window.game?.start();
  }
  
  openMultiplayer() {
    audioManager.playSound('button');
    alert('MULTIPLAYER\n\nSelect Mode:\n\n1. CREATE ROOM - Host a game\n2. JOIN ROOM - Enter room code\n\nMultiplayer requires network connection.');
    const choice = prompt('CREATE or JOIN?').toUpperCase();
    if (choice === 'CREATE') {
      const result = networkManager.createRoom();
      if (result.success) {
        alert(`Room Code: ${result.roomCode}\nShare this code with friends!`);
      } else {
        alert('Multiplayer unavailable on this platform');
      }
    } else if (choice === 'JOIN') {
      const code = prompt('Enter Room Code:');
      if (code) {
        const result = networkManager.joinRoom(code.toUpperCase());
        if (result.success) {
          alert(`Joined room: ${code}`);
        } else {
          alert('Failed to join room');
        }
      }
    }
  }
  
  openSettings() {
    audioManager.playSound('button');
    document.getElementById('settingsScreen').classList.add('active');
  }
  
  closeSettings() {
    audioManager.playSound('button');
    document.getElementById('settingsScreen').classList.remove('active');
  }
  
  openControls() {
    audioManager.playSound('button');
    alert(
      'CONTROLS\n\n' +
      'WASD / Arrow Keys - Move\n' +
      'Shift - Run\n' +
      'Space - Punch\n' +
      'ESC - Pause Menu\n' +
      'I - Inventory\n' +
      'M - Map\n' +
      'E - Interact/Use Items\n\n' +
      'Objective: Restore all safe zones by clearing every zombie from each location!'
    );
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
      div.innerHTML = `
        <div class="inventory-item-name">${item.toUpperCase()}</div>
        <div class="inventory-item-count">×${count}</div>
      `;
      grid.appendChild(div);
    }
  }
  
  openMap() {
    audioManager.playSound('button');
    document.getElementById('mapScreen').classList.add('active');
    this.drawMap();
  }
  
  closeMap() {
    audioManager.playSound('button');
    document.getElementById('mapScreen').classList.remove('active');
  }
  
  drawMap() {
    const canvas = document.getElementById('mapCanvas');
    if (!canvas || !window.game) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);
    
    // Draw locations
    const locations = window.game.gameState.locations;
    const centerX = w / 2;
    const centerY = h / 2;
    const scale = 0.5;
    
    for (const [name, data] of Object.entries(CONFIG.LOCATIONS)) {
      const x = centerX + data.x * scale;
      const y = centerY + data.z * scale;
      const restored = locations[name]?.restored || false;
      
      ctx.fillStyle = restored ? '#00d084' : '#ff4444';
      ctx.fillRect(x - 15, y - 15, 30, 30);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(name.substring(0, 3), x, y + 4);
    }
    
    // Draw player
    if (window.game.player) {
      const px = centerX + window.game.player.position.x * scale;
      const py = centerY + window.game.player.position.z * scale;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  showDeathScreen(stats) {
    audioManager.playSound('death');
    this.currentScreen = 'death';
    document.getElementById('deathScreen').classList.add('active');
    document.getElementById('deathStats').innerHTML = `
      <p>⏱️ Survival Time: ${this.formatTime(stats.survivalTime)}</p>
      <p>🧟 Zombies Defeated: ${stats.zombiesDefeated}</p>
      <p>📍 Locations Restored: ${stats.locationsRestored}/3</p>
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
    document.getElementById('zombiesDefeated').textContent = gameState.statistics.zombiesDefeated;
    
    let restored = 0;
    for (const [name, data] of Object.entries(gameState.locations)) {
      if (data.restored) restored++;
    }
    document.getElementById('locationsRestored').textContent = `${restored}/4`;
    
    const time = Math.floor(gameState.statistics.timeAlive);
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    document.getElementById('survivalTime').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const health = gameState.player.health;
    const maxHealth = CONFIG.PLAYER_MAX_HEALTH;
    const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    document.getElementById('healthBarFill').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = `❤️ ${Math.ceil(health)}/${maxHealth}`;
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}

const uiManager = new UIManager();