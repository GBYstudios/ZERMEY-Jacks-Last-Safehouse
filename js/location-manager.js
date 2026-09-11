class LocationManager {
  constructor(scene) {
    this.scene = scene;
    this.locations = {};
    this.safeZoneMarkers = {};
    
    for (const [name, config] of Object.entries(CONFIG.LOCATIONS)) {
      this.locations[name] = {
        ...config,
        restored: name === 'TREEHOUSE',
        zombiesDefeated: 0,
        totalZombies: CONFIG.BASE_ZOMBIE_COUNT[name] || 0
      };
    }
    
    this.createSafeZoneMarker('TREEHOUSE');
  }
  
  isLocationRestored(location) {
    return this.locations[location]?.restored || false;
  }
  
  restoreLocation(location, zombieManager) {
    if (this.locations[location]) {
      this.locations[location].restored = true;
      this.createSafeZoneMarker(location);
      audioManager.playSafeZoneSound();
    }
  }
  
  createSafeZoneMarker(location) {
    if (this.safeZoneMarkers[location]) return;
    const config = CONFIG.LOCATIONS[location];
    const group = new THREE.Group();
    group.position.set(config.x, 0, config.z);
    
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(config.size / 2, config.size / 2, 0.25, 32),
      new THREE.MeshStandardMaterial({
        color: 0x00d084,
        emissive: 0x0a3e30,
        transparent: true,
        opacity: 0.2,
        roughness: 0.8
      })
    );
    ring.position.y = 0.12;
    ring.receiveShadow = true;
    group.add(ring);
    
    const outline = new THREE.Mesh(
      new THREE.TorusGeometry((config.size / 2) - 0.8, 0.35, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0x73ffd2,
        emissive: 0x14644d,
        roughness: 0.45,
        metalness: 0.1
      })
    );
    outline.rotation.x = Math.PI / 2;
    outline.position.y = 0.35;
    group.add(outline);
    
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.26, 3.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xb3e6d2, emissive: 0x11362a, roughness: 0.5 })
      );
      post.position.set(Math.cos(angle) * ((config.size / 2) - 1.4), 1.6, Math.sin(angle) * ((config.size / 2) - 1.4));
      post.castShadow = true;
      group.add(post);
    }
    
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 8, 10, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x7df8cb,
        emissive: 0x0d4c39,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      })
    );
    beacon.position.y = 4;
    group.add(beacon);
    
    this.scene.add(group);
    this.safeZoneMarkers[location] = group;
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
