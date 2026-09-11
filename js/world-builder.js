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
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add some hills with displaced geometry
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
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 15, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2c1a });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 7.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    // Platform
    const platformGeometry = new THREE.BoxGeometry(15, 1, 12);
    const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 10;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);
    
    // Walls
    for (let i = 0; i < 4; i++) {
      const wallGeometry = new THREE.BoxGeometry(12, 3, 0.5);
      const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.y = 12.5;
      wall.rotation.y = i * Math.PI / 2;
      wall.position.z = i % 2 === 0 ? (i === 0 ? -5.5 : 5.5) : 0;
      wall.position.x = i % 2 === 1 ? (i === 1 ? 5.5 : -5.5) : 0;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(12, 4, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 14.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // Ladder
    for (let i = 0; i < 5; i++) {
      const rungGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
      const rungMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(-5, 5 + i * 1.5, 0);
      rung.rotation.z = Math.PI / 2;
      rung.castShadow = true;
      group.add(rung);
    }
    
    this.scene.add(group);
  }
  
  buildTown() {
    // Roads
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    // Horizontal road
    const road1 = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 20),
      roadMaterial
    );
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    road1.receiveShadow = true;
    this.scene.add(road1);
    
    // Vertical road
    const road2 = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 300),
      roadMaterial
    );
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.01;
    road2.receiveShadow = true;
    this.scene.add(road2);
    
    // Sidewalks
    const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    for (let i = -2; i <= 2; i++) {
      const sidewalk = new THREE.Mesh(
        new THREE.PlaneGeometry(250, 8),
        sidewalkMaterial
      );
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.y = 0.02;
      sidewalk.position.x = i * 40;
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);
    }
    
    // Streetlights
    for (let i = -4; i <= 4; i++) {
      const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8);
      const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(i * 30, 4, -80);
      pole.castShadow = true;
      this.scene.add(pole);
      
      const lightGeometry = new THREE.BoxGeometry(2, 1, 2);
      const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff88 });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(i * 30, 8, -80);
      light.castShadow = true;
      this.scene.add(light);
    }
    
    // Trees
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 250;
      const z = (Math.random() - 0.5) * 250;
      this.addTree(x, z);
    }
    
    // Abandoned cars
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
    
    // Roof
    const roofGeometry = new THREE.BoxGeometry(62, 1, 52);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f1e });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(CONFIG.LOCATIONS.WALMART.x, 12.5, CONFIG.LOCATIONS.WALMART.z);
    this.scene.add(roof);
    
    // Broken windows
    for (let i = 0; i < 12; i++) {
      const windowGeometry = new THREE.BoxGeometry(4, 3, 0.2);
      const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        CONFIG.LOCATIONS.WALMART.x - 25 + (i % 6) * 10,
        5 + (i < 6 ? 0 : 4),
        CONFIG.LOCATIONS.WALMART.z - 24
      );
      this.scene.add(window);
    }
    
    // Broken sign
    const signGeometry = new THREE.BoxGeometry(8, 2, 0.5);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(CONFIG.LOCATIONS.WALMART.x, 14, CONFIG.LOCATIONS.WALMART.z - 26);
    this.scene.add(sign);
  }
  
  buildMcdonalds() {
    const buildingGeometry = new THREE.BoxGeometry(35, 8, 30);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(CONFIG.LOCATIONS.MCDONALDS.x, 4, CONFIG.LOCATIONS.MCDONALDS.z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(25, 4, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(CONFIG.LOCATIONS.MCDONALDS.x, 8, CONFIG.LOCATIONS.MCDONALDS.z);
    this.scene.add(roof);
    
    // Broken arches
    const archGeometry = new THREE.CylinderGeometry(3, 3, 1, 8);
    const archMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    const arch1 = new THREE.Mesh(archGeometry, archMaterial);
    arch1.position.set(CONFIG.LOCATIONS.MCDONALDS.x - 10, 6, CONFIG.LOCATIONS.MCDONALDS.z - 16);
    this.scene.add(arch1);
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
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(10, 5, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 10, z);
    this.scene.add(roof);
    
    // Windows
    for (let j = 0; j < 4; j++) {
      const windowGeometry = new THREE.BoxGeometry(2, 2, 0.2);
      const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(x - 6 + (j % 2) * 6, 5 + (j < 2 ? 0 : 3), z - 6);
      this.scene.add(window);
    }
  }
  
  addTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.8, 1, 8);
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
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light for shadows
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(100, 100, 100);
    sun.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    sun.castShadow = true;
    this.scene.add(sun);
    
    // Store for day/night cycle
    this.sun = sun;
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x4a5c7d, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
  }
  
  updateDayNightCycle(time) {
    // Cycle between 0 and 1
    const cycle = (time % CONFIG.DAY_CYCLE_DURATION) / CONFIG.DAY_CYCLE_DURATION;
    
    // Adjust sun intensity
    const dayIntensity = Math.sin(cycle * Math.PI) * 0.8 + 0.2;
    this.sun.intensity = dayIntensity;
    
    // Adjust fog and sky
    const fogColor = new THREE.Color(
      0.29 + cycle * 0.2,
      0.36 + cycle * 0.2,
      0.49 + cycle * 0.1
    );
    this.scene.fog.color = fogColor;
  }
}
