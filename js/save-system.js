class SaveSystem {
  constructor() {
    this.STORAGE_KEY = 'ZERMEY_SAVE';
    this.defaultSave = {
      version: CONFIG.GAME_VERSION,
      timestamp: Date.now(),
      player: { health: CONFIG.PLAYER_START_HEALTH, position: { x: 0, y: 2, z: 0 } },
      locations: {
        TREEHOUSE: { restored: true },
        WALMART: { restored: false, zombiesDefeated: 0, totalZombies: CONFIG.BASE_ZOMBIE_COUNT.WALMART },
        MCDONALDS: { restored: false, zombiesDefeated: 0, totalZombies: CONFIG.BASE_ZOMBIE_COUNT.MCDONALDS },
        NEIGHBORHOOD: { restored: false, zombiesDefeated: 0, totalZombies: CONFIG.BASE_ZOMBIE_COUNT.NEIGHBORHOOD }
      },
      inventory: { food: 0, medkits: 5, batteries: 0, materials: 0 },
      statistics: { zombiesDefeated: 0, timeAlive: 0, sessionsStarted: 0 },
      settings: { masterVolume: CONFIG.MASTER_VOLUME, musicVolume: CONFIG.MUSIC_VOLUME, effectsVolume: CONFIG.EFFECTS_VOLUME, cameraSensitivity: 100, graphicsQuality: CONFIG.GRAPHICS_QUALITY.HIGH }
    };
  }
  
  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return this.mergeWithDefaults(data);
      }
    } catch(e) {
      console.error('Load error:', e);
    }
    return JSON.parse(JSON.stringify(this.defaultSave));
  }
  
  save(gameState) {
    try {
      const save = {
        version: CONFIG.GAME_VERSION,
        timestamp: Date.now(),
        player: gameState.player,
        locations: gameState.locations,
        inventory: gameState.inventory,
        statistics: gameState.statistics,
        settings: gameState.settings
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(save));
      return true;
    } catch(e) {
      console.error('Save error:', e);
      return false;
    }
  }
  
  reset() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch(e) {
      console.error('Reset error:', e);
      return false;
    }
  }
  
  mergeWithDefaults(saved) {
    const settings = { ...this.defaultSave.settings, ...saved.settings };
    if (typeof settings.cameraSensitivity === 'number' && settings.cameraSensitivity <= 4) {
      settings.cameraSensitivity = Math.round(settings.cameraSensitivity * 100);
    }
    return {
      ...this.defaultSave,
      ...saved,
      player: { ...this.defaultSave.player, ...saved.player },
      locations: { ...this.defaultSave.locations, ...saved.locations },
      inventory: { ...this.defaultSave.inventory, ...saved.inventory },
      statistics: { ...this.defaultSave.statistics, ...saved.statistics },
      settings
    };
  }
  
  hasSave() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}

const saveSystem = new SaveSystem();
