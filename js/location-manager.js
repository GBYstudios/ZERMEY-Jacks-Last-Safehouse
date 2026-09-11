class LocationManager {
  constructor(scene) {
    this.scene = scene;
    this.locations = {};
    this.safeZoneMarkers = {};
    
    // Initialize locations
    for (const [name, config] of Object.entries(CONFIG.LOCATIONS)) {
      this.locations[name] = {
        ...config,
        restored: name === 'TREEHOUSE',
        zombiesDefeated: 0,
        totalZombies: CONFIG.BASE_ZOMBIE_COUNT[name] || 0
      };
    }
  }
  
  isLocationRestored(location) {
    return this.locations[location]?.restored || false;
  }
  
  restoreLocation(location, zombieManager) {
    if (this.locations[location]) {
      this.locations[location].restored = true;
      this.createSafeZoneMarker(location);
      audioManager.playSafeZoneSound();
      zombieManager.spawnPoints[Object.keys(CONFIG.LOCATIONS).indexOf(location)] = null;
    }
  }
  
  createSafeZoneMarker(location) {
    const config = CONFIG.LOCATIONS[location];
    
    // Create a glowing safe zone indicator
    const markerGeometry = new THREE.CylinderGeometry(config.size / 2, config.size / 2, 0.5, 32);
    const markerMaterial = new THREE.MeshLambertMaterial({
      color: 0x00d084,
      transparent: true,
      opacity: 0.3
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(config.x, 0.1, config.z);
    this.scene.add(marker);
    
    this.safeZoneMarkers[location] = marker;
  }
  
  checkLocationCompletion(location, zombieCount) {
    if (zombieCount === 0 && !this.isLocationRestored(location)) {
      return true;
    }
    return false;
  }
  
  getRestoredCount() {
    let count = 0;
    for (const location of Object.values(this.locations)) {
      if (location.restored) count++;
    }
    return count;
  }
  
  isGameComplete() {
    const locations = Object.values(CONFIG.LOCATIONS);
    let restoredCount = 0;
    for (const loc of Object.values(this.locations)) {
      if (loc.restored) restoredCount++;
    }
    return restoredCount === locations.length;
  }
}
