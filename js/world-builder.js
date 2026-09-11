class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
  }
  
  build() {
    this.buildTerrain();
    this.buildTreehouse();
    this.buildTown();
    this.buildWalmart();
    this.buildMcdonalds();
    this.buildNeighborhood();
    this.setupLighting();
    this.setupFog();
  }
  
  buildTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
      const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
      const size = Math.random() * 15 + 5;
      const height = Math.random() * 3 + 1;
      const hillGeometry = new THREE.ConeGeometry(size, height, 8);
      const hillMaterial = new THREE.MeshLambertMaterial({ color: 0x3d6b1f });
      const hill = new THREE.Mesh(hillGeometry, hillMaterial);
      hill.position.set(x, height / 2, z);
      hill.castShadow = true;
      hill.receiveShadow = true;
      this.scene.add(hill);
    }
  }
  
  buildTreehouse() {
    const group = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 15, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c1a });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 7.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    const platformGeometry = new THREE.BoxGeometry(15, 1, 12);
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 10;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);
    
    const roofGeometry = new THREE.ConeGeometry(12, 4, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 14.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    this.scene.add(group);
  }
  
  buildTown() {
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(300, 20), roadMaterial);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    road1.receiveShadow = true;
    this.scene.add(road1);
    
    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 300), roadMaterial);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.01;
    road2.receiveShadow = true;
    this.scene.add(road2);
    
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 250;
      const z = (Math.random() - 0.5) * 250;
      this.addTree(x, z);
    }
    
    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      this.addAbandonedCar(x, z);
    }
  }
  
  buildWalmart() {
    const buildingGeometry = new THREE.BoxGeometry(60, 12, 50);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(CONFIG.LOCATIONS.WALMART.x, 6, CONFIG.LOCATIONS.WALMART.z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);
  }
  
  buildMcdonalds() {
    const buildingGeometry = new THREE.BoxGeometry(35, 8, 30);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(CONFIG.LOCATIONS.MCDONALDS.x, 4, CONFIG.LOCATIONS.MCDONALDS.z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);
  }
  
  buildNeighborhood() {
    const neighborhood = CONFIG.LOCATIONS.NEIGHBORHOOD;
    for (let i = 0; i < 6; i++) {
      const x = neighborhood.x + (i % 3) * 40 - 40;
      const z = neighborhood.z + Math.floor(i / 3) * 40 - 20;
      this.addHouse(x, z);
    }
  }
  
  addHouse(x, z) {
    const houseGeometry = new THREE.BoxGeometry(15, 10, 12);
    const houseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(x, 5, z);
    house.castShadow = true;
    house.receiveShadow = true;
    this.scene.add(house);
  }
  
  addTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 8, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    this.scene.add(trunk);
    
    const foliageGeometry = new THREE.SphereGeometry(6, 8, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 10, z);
    foliage.castShadow = true;
    this.scene.add(foliage);
  }
  
  addAbandonedCar(x, z) {
    const carGeometry = new THREE.BoxGeometry(4, 2, 8);
    const carMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.set(x, 1, z);
    car.rotation.y = Math.random() * Math.PI * 2;
    car.castShadow = true;
    this.scene.add(car);
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(100, 100, 100);
    sun.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.camera.far = 300;
    sun.castShadow = true;
    this.scene.add(sun);
    this.sun = sun;
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x4a5c7d, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
  }
  
  updateDayNightCycle(time) {
    const cycle = (time % CONFIG.DAY_CYCLE_DURATION) / CONFIG.DAY_CYCLE_DURATION;
    const dayIntensity = Math.sin(cycle * Math.PI) * 0.8 + 0.2;
    this.sun.intensity = dayIntensity;
  }
}
