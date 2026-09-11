class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.zombieManager = null;
    this.worldBuilder = null;
    this.locationManager = null;
    this.cameraController = null;
    this.isPaused = false;
    this.isRunning = false;
    this.startTime = 0;
    this.deltaTime = 0;
    this.lastFrameTime = 0;
    this.graphicsPreset = CONFIG.GRAPHICS_PRESETS.high;
    this.resolvedGraphicsQuality = CONFIG.GRAPHICS_QUALITY.HIGH;
    
    this.gameState = {
      player: { health: CONFIG.PLAYER_START_HEALTH, position: { x: 0, y: 2, z: 0 } },
      locations: {},
      inventory: { food: 0, medkits: 5, batteries: 0, materials: 0 },
      statistics: { zombiesDefeated: 0, timeAlive: 0, sessionsStarted: 0 }
    };
    
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      punch: false
    };
  }
  
  async initialize() {
    const saved = saveSystem.load();
    this.gameState = saved;
    
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.cameraController = new Camera();
    this.applySavedSettings();
    
    this.worldBuilder = new WorldBuilder(this.scene);
    this.worldBuilder.setQuality(this.graphicsPreset, this.resolvedGraphicsQuality);
    this.worldBuilder.build();
    
    this.player = new Player(this.scene);
    this.player.health = this.gameState.player.health;
    
    this.zombieManager = new ZombieManager(this.scene);
    this.locationManager = new LocationManager(this.scene);
    
    for (const [name, data] of Object.entries(this.gameState.locations)) {
      if (data.restored && name !== 'TREEHOUSE') {
        this.locationManager.restoreLocation(name, this.zombieManager);
      }
    }
    
    this.setupInput();
    uiManager.syncSettings(this.gameState.settings);
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.startTime = Date.now();
    this.lastFrameTime = this.startTime;
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5b7390);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    if ('physicallyCorrectLights' in this.renderer) {
      this.renderer.physicallyCorrectLights = true;
    }
    const container = document.getElementById('game-canvas-container');
    if (!container) throw new Error('game-canvas-container not found');
    container.appendChild(this.renderer.domElement);
  }

  applySavedSettings() {
    const settings = this.gameState.settings || {};
    this.gameState.settings = { ...saveSystem.defaultSave.settings, ...settings };
    audioManager.setVolume('master', this.gameState.settings.masterVolume);
    audioManager.setVolume('music', this.gameState.settings.musicVolume);
    audioManager.setVolume('effects', this.gameState.settings.effectsVolume);
    this.cameraController.setMouseSensitivity(this.mapSensitivityPercentToValue(this.getSavedSensitivityPercent()));
    this.applyGraphicsQuality(this.gameState.settings.graphicsQuality || CONFIG.GRAPHICS_QUALITY.HIGH);
  }

  getSavedSensitivityPercent() {
    const value = Number(this.gameState.settings?.cameraSensitivity);
    if (!Number.isFinite(value)) return 100;
    return value <= 4 ? Math.round(value * 100) : Math.max(25, Math.min(400, value));
  }

  mapSensitivityPercentToValue(percent) {
    const normalizedPercent = Math.max(25, Math.min(400, Number(percent) || 100));
    return 0.0005 + ((normalizedPercent - 25) / 375) * 0.0095;
  }

  resolveGraphicsQuality(quality) {
    if (quality && quality !== CONFIG.GRAPHICS_QUALITY.AUTO) return quality;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 900;
    if (cores <= 4 || memory <= 4) return CONFIG.GRAPHICS_QUALITY.LOW;
    if (cores <= 8 || smallScreen) return CONFIG.GRAPHICS_QUALITY.MEDIUM;
    return CONFIG.GRAPHICS_QUALITY.HIGH;
  }

  applyGraphicsQuality(quality) {
    this.gameState.settings.graphicsQuality = quality;
    this.resolvedGraphicsQuality = this.resolveGraphicsQuality(quality);
    this.graphicsPreset = CONFIG.GRAPHICS_PRESETS[this.resolvedGraphicsQuality] || CONFIG.GRAPHICS_PRESETS.high;

    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.graphicsPreset.pixelRatio));
      this.renderer.shadowMap.type = this.graphicsPreset.useSoftShadows && THREE.PCFSoftShadowMap ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      this.renderer.toneMappingExposure = this.graphicsPreset.toneMappingExposure;
    }

    if (this.worldBuilder) {
      this.worldBuilder.applyGraphicsSettings(this.graphicsPreset, this.resolvedGraphicsQuality);
    }

    return this.resolvedGraphicsQuality;
  }
  
  setupInput() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    switch (key) {
      case 'w': case 'arrowup': this.input.forward = true; break;
      case 's': case 'arrowdown': this.input.backward = true; break;
      case 'a': case 'arrowleft': this.input.left = true; break;
      case 'd': case 'arrowright': this.input.right = true; break;
      case 'shift': this.input.sprint = true; break;
      case ' ': e.preventDefault(); this.input.punch = true; break;
      case 'escape': this.togglePause(); break;
      case 'i': uiManager.toggleInventory(); break;
      case 'e': this.useItem(); break;
    }
  }
  
  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    switch (key) {
      case 'w': case 'arrowup': this.input.forward = false; break;
      case 's': case 'arrowdown': this.input.backward = false; break;
      case 'a': case 'arrowleft': this.input.left = false; break;
      case 'd': case 'arrowright': this.input.right = false; break;
      case 'shift': this.input.sprint = false; break;
      case ' ': this.input.punch = false; break;
    }
  }
  
  togglePause() {
    if (this.isRunning) this.isPaused ? this.resume() : this.pause();
  }
  pause() { this.isPaused = true; uiManager.pauseGame(); }
  resume() { this.isPaused = false; uiManager.resumeGame(); }
  
  useItem() {
    const inventory = this.gameState.inventory;
    if (inventory.medkits > 0) {
      inventory.medkits--;
      this.player.heal(50);
      audioManager.playSound('button');
    }
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.gameState.statistics.sessionsStarted++;
    
    for (const [name] of Object.entries(CONFIG.LOCATIONS)) {
      if (name !== 'TREEHOUSE' && !this.locationManager.isLocationRestored(name)) {
        this.zombieManager.spawnZombies(name, CONFIG.BASE_ZOMBIE_COUNT[name] || 0);
      }
    }
    this.gameLoop();
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.gameLoop());
    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const now = Date.now();
    this.deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  update() {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    this.worldBuilder.updateDayNightCycle(elapsedTime);
    const movementBasis = this.cameraController.getMovementBasis();
    this.player.update(this.deltaTime, this.input, this.gameState, movementBasis);
    this.gameState.player.health = this.player.health;
    this.gameState.player.position = { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z };
    this.cameraController.update(this.player.position, this.player.direction, this.camera);
    this.zombieManager.update(this.deltaTime, this.player, this.gameState);
    combatSystem.performAttack(this.player, this.zombieManager, this.gameState);
    
    for (const [name, config] of Object.entries(CONFIG.LOCATIONS)) {
      if (name !== 'TREEHOUSE' && !this.locationManager.isLocationRestored(name)) {
        const zombiesInLocation = this.zombieManager.zombies.filter(z => {
          const dist = z.position.distanceTo(new THREE.Vector3(config.x, 0, config.z));
          return !z.isDead && dist < config.size;
        }).length;
        if (zombiesInLocation === 0) this.locationManager.restoreLocation(name, this.zombieManager);
      }
    }
    
    this.gameState.statistics.timeAlive = elapsedTime;
    if (this.player.isDead) return this.endGame();
    if (this.locationManager.isGameComplete()) return this.victory();
    uiManager.updateHUD(this.gameState);
  }
  
  endGame() {
    this.isRunning = false;
    saveSystem.save(this.gameState);
    uiManager.showDeathScreen({ survivalTime: this.gameState.statistics.timeAlive, zombiesDefeated: this.gameState.statistics.zombiesDefeated, locationsRestored: this.locationManager.getRestoredCount() });
  }
  
  victory() {
    this.isRunning = false;
    saveSystem.save(this.gameState);
    uiManager.showVictoryScreen({ survivalTime: this.gameState.statistics.timeAlive, zombiesDefeated: this.gameState.statistics.zombiesDefeated });
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.applyGraphicsQuality(this.gameState.settings.graphicsQuality || CONFIG.GRAPHICS_QUALITY.HIGH);
  }
}

window.Game = Game;
