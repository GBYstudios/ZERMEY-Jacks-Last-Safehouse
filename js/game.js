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
    
    this.worldBuilder = new WorldBuilder(this.scene);
    this.worldBuilder.build();
    
    this.player = new Player(this.scene);
    this.player.health = this.gameState.player.health;
    
    this.zombieManager = new ZombieManager(this.scene);
    this.locationManager = new LocationManager(this.scene);
    this.cameraController = new Camera();
    
    for (const [name, data] of Object.entries(this.gameState.locations)) {
      if (data.restored && name !== 'TREEHOUSE') {
        this.locationManager.restoreLocation(name, this.zombieManager);
      }
    }
    
    this.setupInput();
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.startTime = Date.now();
    this.lastFrameTime = this.startTime;
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a5c7d);
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    
    const container = document.getElementById('game-canvas-container');
    if (!container) {
      console.error('game-canvas-container not found!');
      return;
    }
    container.appendChild(this.renderer.domElement);
  }
  
  setupInput() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    switch(key) {
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
    switch(key) {
      case 'w': case 'arrowup': this.input.forward = false; break;
      case 's': case 'arrowdown': this.input.backward = false; break;
      case 'a': case 'arrowleft': this.input.left = false; break;
      case 'd': case 'arrowright': this.input.right = false; break;
      case 'shift': this.input.sprint = false; break;
      case ' ': this.input.punch = false; break;
    }
  }
  
  togglePause() {
    if (this.isRunning) {
      this.isPaused ? this.resume() : this.pause();
    }
  }
  
  pause() {
    this.isPaused = true;
    uiManager.pauseGame();
  }
  
  resume() {
    this.isPaused = false;
    uiManager.resumeGame();
  }
  
  useItem() {
    const inventory = this.gameState.inventory;
    if (inventory.medkits > 0) {
      inventory.medkits--;
      this.player.heal(50);
      audioManager.playSound('button');
    }
  }
  
  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.gameState.statistics.sessionsStarted++;
    
    for (const [name, config] of Object.entries(CONFIG.LOCATIONS)) {
      if (name !== 'TREEHOUSE' && !this.locationManager.isLocationRestored(name)) {
        const count = CONFIG.BASE_ZOMBIE_COUNT[name] || 0;
        this.zombieManager.spawnZombies(name, count);
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
    this.deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    this.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  update() {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    this.worldBuilder.updateDayNightCycle(elapsedTime);
    
    this.player.update(this.deltaTime, this.input, this.gameState);
    this.gameState.player.health = this.player.health;
    this.gameState.player.position = {
      x: this.player.position.x,
      y: this.player.position.y,
      z: this.player.position.z
    };
    
    this.cameraController.update(this.player.position, this.player.direction, this.camera);
    this.zombieManager.update(this.deltaTime, this.player, this.gameState);
    combatSystem.performAttack(this.player, this.zombieManager, this.gameState);
    
    for (const [name, config] of Object.entries(CONFIG.LOCATIONS)) {
      if (name !== 'TREEHOUSE' && !this.locationManager.isLocationRestored(name)) {
        const zombiesInLocation = this.zombieManager.zombies.filter(z => {
          const dist = z.position.distanceTo(new THREE.Vector3(config.x, 0, config.z));
          return !z.isDead && dist < config.size;
        }).length;
        
        if (zombiesInLocation === 0) {
          this.locationManager.restoreLocation(name, this.zombieManager);
          console.log(`${name} restored!`);
        }
      }
    }
    
    this.gameState.statistics.timeAlive = elapsedTime;
    
    if (this.player.isDead) {
      this.endGame();
      return;
    }
    
    if (this.locationManager.isGameComplete()) {
      this.victory();
      return;
    }
    
    uiManager.updateHUD(this.gameState);
  }
  
  endGame() {
    this.isRunning = false;
    saveSystem.save(this.gameState);
    
    const stats = {
      survivalTime: this.gameState.statistics.timeAlive,
      zombiesDefeated: this.gameState.statistics.zombiesDefeated,
      locationsRestored: this.locationManager.getRestoredCount()
    };
    
    uiManager.showDeathScreen(stats);
  }
  
  victory() {
    this.isRunning = false;
    saveSystem.save(this.gameState);
    
    const stats = {
      survivalTime: this.gameState.statistics.timeAlive,
      zombiesDefeated: this.gameState.statistics.zombiesDefeated
    };
    
    uiManager.showVictoryScreen(stats);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  uiManager.initMainMenu();
  window.game = new Game();
  await window.game.initialize();
});
