class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.tempColor = new THREE.Color();
    this.skyColors = {
      day: new THREE.Color(0x6b8596),
      dusk: new THREE.Color(0xb16953),
      night: new THREE.Color(0x101827)
    };
    this.fogColors = {
      day: new THREE.Color(0x728395),
      night: new THREE.Color(0x131a27)
    };
    this.createSharedAssets();
  }
  
  createSharedAssets() {
    this.materials = {
      ground: new THREE.MeshStandardMaterial({ color: 0x405f2d, roughness: 1 }),
      dirt: new THREE.MeshStandardMaterial({ color: 0x5b4b31, roughness: 1 }),
      asphalt: new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.95 }),
      shoulder: new THREE.MeshStandardMaterial({ color: 0x4f513f, roughness: 1 }),
      line: new THREE.MeshStandardMaterial({ color: 0xcabf8d, roughness: 0.9 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 1 }),
      foliageDark: new THREE.MeshStandardMaterial({ color: 0x1f4423, roughness: 1 }),
      foliageMid: new THREE.MeshStandardMaterial({ color: 0x355f2d, roughness: 1 }),
      foliageLight: new THREE.MeshStandardMaterial({ color: 0x4f7d37, roughness: 1 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x86633f, roughness: 0.95 }),
      woodDark: new THREE.MeshStandardMaterial({ color: 0x5f4327, roughness: 0.95 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x693028, roughness: 0.9 }),
      wallLight: new THREE.MeshStandardMaterial({ color: 0x9ea7b4, roughness: 0.95 }),
      wallBlue: new THREE.MeshStandardMaterial({ color: 0x395c89, roughness: 0.95 }),
      wallRed: new THREE.MeshStandardMaterial({ color: 0x7d2e2e, roughness: 0.95 }),
      window: new THREE.MeshStandardMaterial({ color: 0x9fc4d8, emissive: 0x153042, roughness: 0.2, metalness: 0.15 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x5d626a, roughness: 0.6, metalness: 0.55 }),
      primaryWheel: new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 1 }),
      rust: new THREE.MeshStandardMaterial({ color: 0x70412d, roughness: 0.95, metalness: 0.2 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0x70757d, roughness: 1 }),
      trim: new THREE.MeshStandardMaterial({ color: 0xd7d0bd, roughness: 0.8 }),
      lantern: new THREE.MeshStandardMaterial({ color: 0xf2c879, emissive: 0x6a4f18, roughness: 0.3 }),
      rock: new THREE.MeshStandardMaterial({ color: 0x666a64, roughness: 1 })
    };
    this.geometries = {
      trunk: new THREE.CylinderGeometry(0.8, 1.1, 8, 7),
      foliageLow: new THREE.ConeGeometry(4.8, 7, 7),
      foliageHigh: new THREE.ConeGeometry(4, 6, 7),
      rock: new THREE.DodecahedronGeometry(1, 0),
      shrub: new THREE.DodecahedronGeometry(1.8, 0),
      carBody: new THREE.BoxGeometry(4.4, 1.5, 8),
      carCabin: new THREE.BoxGeometry(3, 1.4, 3.8),
      wheel: new THREE.CylinderGeometry(0.75, 0.75, 0.6, 10),
      curb: new THREE.BoxGeometry(1.2, 0.25, 10),
      laneMark: new THREE.BoxGeometry(5, 0.05, 0.5),
      windowPanel: new THREE.BoxGeometry(3, 2.5, 0.25),
      crate: new THREE.BoxGeometry(1.4, 1.4, 1.4)
    };
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
    this.updateDayNightCycle(0);
  }
  
  buildTerrain() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE),
      this.materials.ground
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    const clearing = new THREE.Mesh(
      new THREE.CircleGeometry(CONFIG.TREEHOUSE_SIZE * 0.7, 24),
      this.materials.dirt
    );
    clearing.rotation.x = -Math.PI / 2;
    clearing.position.y = 0.02;
    clearing.receiveShadow = true;
    this.scene.add(clearing);
    
    for (let i = 0; i < 28; i++) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 60);
      if (this.isRoadOrStructureArea(x, z, 28)) continue;
      this.addGroundPatch(x, z, 10 + Math.random() * 18, 8 + Math.random() * 14, i % 2 === 0 ? this.materials.dirt : this.materials.shoulder);
    }
    
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 90);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 90);
      if (this.isRoadOrStructureArea(x, z, 30)) continue;
      this.addHill(x, z, 7 + Math.random() * 8, 1.8 + Math.random() * 3);
    }
    
    for (let i = 0; i < 36; i++) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 70);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 70);
      if (this.isRoadOrStructureArea(x, z, 16)) continue;
      if (i % 3 === 0) {
        this.addRockCluster(x, z, 0.7 + Math.random() * 0.8);
      } else {
        this.addShrubCluster(x, z, 0.7 + Math.random() * 0.7);
      }
    }
  }
  
  buildTreehouse() {
    const group = new THREE.Group();
    
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.6, 16, 9), this.materials.bark);
    trunk.position.y = 8;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    for (let i = 0; i < 4; i++) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 5.5, 6), this.materials.bark);
      const angle = i * Math.PI / 2;
      root.position.set(Math.cos(angle) * 2.3, 1.2, Math.sin(angle) * 2.3);
      root.rotation.z = Math.PI / 2.7;
      root.rotation.y = angle;
      root.castShadow = true;
      root.receiveShadow = true;
      group.add(root);
    }
    
    const platform = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 12), this.materials.wood);
    platform.position.y = 10;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);
    
    const house = new THREE.Mesh(new THREE.BoxGeometry(11, 5.5, 8.5), this.materials.woodDark);
    house.position.set(0, 13, -0.5);
    house.castShadow = true;
    house.receiveShadow = true;
    group.add(house);
    
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 4.5, 4), this.materials.roof);
    roof.position.y = 17.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    for (let i = -1; i <= 1; i += 2) {
      const railSide = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 12), this.materials.woodDark);
      railSide.position.set(i * 7.1, 10.8, 0);
      railSide.castShadow = true;
      group.add(railSide);
    }
    
    for (let i = -1; i <= 1; i += 2) {
      const railFront = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 0.5), this.materials.woodDark);
      railFront.position.set(0, 10.8, i * 5.7);
      railFront.castShadow = true;
      group.add(railFront);
    }
    
    for (let i = 0; i < 4; i++) {
      const support = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 10, 6), this.materials.woodDark);
      support.position.set(i < 2 ? -5.2 : 5.2, 5.1, i % 2 === 0 ? -3.8 : 3.8);
      support.rotation.z = i < 2 ? 0.08 : -0.08;
      support.castShadow = true;
      support.receiveShadow = true;
      group.add(support);
    }
    
    for (let i = 0; i < 6; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.4), this.materials.wood);
      rung.position.set(0, 2 + i * 1.2, 5.9);
      rung.castShadow = true;
      group.add(rung);
    }
    
    for (let i = -1; i <= 1; i += 2) {
      const ladderRail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 8.5, 0.35), this.materials.woodDark);
      ladderRail.position.set(i * 1.1, 5.4, 5.9);
      ladderRail.rotation.x = -0.14;
      ladderRail.castShadow = true;
      group.add(ladderRail);
    }
    
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, 0.3), this.materials.trim);
    door.position.set(0, 12.2, 3.9);
    door.castShadow = true;
    group.add(door);
    
    for (let i = -1; i <= 1; i += 2) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.7, 0.2), this.materials.window);
      window.position.set(i * 3.2, 13.4, 4.36);
      group.add(window);
    }
    
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.materials.lantern);
    lantern.position.set(-5.2, 12.6, 5.2);
    group.add(lantern);
    
    const crate = new THREE.Mesh(this.geometries.crate, this.materials.woodDark);
    crate.position.set(4.5, 10.9, -4);
    crate.rotation.y = 0.4;
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
    
    this.scene.add(group);
  }
  
  buildTown() {
    this.addRoad(0, 0, 320, 24, true);
    this.addRoad(0, 0, 24, 320, false);
    
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 260;
      const z = (Math.random() - 0.5) * 260;
      if (this.isRoadOrStructureArea(x, z, 18)) continue;
      this.addTree(x, z, 0.9 + Math.random() * 0.35);
    }
    
    for (let i = 0; i < 8; i++) {
      const lane = i % 2 === 0 ? { x: (Math.random() - 0.5) * 220, z: (i - 4) * 12 } : { x: (i - 4) * 12, z: (Math.random() - 0.5) * 220 };
      this.addAbandonedCar(lane.x, lane.z);
    }
    
    this.addStreetLamp(52, 18);
    this.addStreetLamp(-52, -18);
    this.addStreetLamp(18, -52);
    this.addStreetLamp(-18, 52);
  }
  
  buildWalmart() {
    const { x, z } = CONFIG.LOCATIONS.WALMART;
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(88, 72), this.materials.asphalt);
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(x, 0.03, z);
    lot.receiveShadow = true;
    this.scene.add(lot);
    
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    const base = new THREE.Mesh(new THREE.BoxGeometry(60, 12, 50), this.materials.wallBlue);
    base.position.y = 6;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(62, 1.2, 52), this.materials.trim);
    roofTrim.position.y = 12.5;
    roofTrim.castShadow = true;
    group.add(roofTrim);
    
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 6), this.materials.wallLight);
    entrance.position.set(0, 4, 28);
    entrance.castShadow = true;
    entrance.receiveShadow = true;
    group.add(entrance);
    
    const sign = new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 0.8), this.materials.trim);
    sign.position.set(0, 10.5, 25.6);
    sign.castShadow = true;
    group.add(sign);
    
    for (let i = -2; i <= 2; i++) {
      const window = new THREE.Mesh(this.geometries.windowPanel, this.materials.window);
      window.position.set(i * 9, 6.5, 25.3);
      group.add(window);
    }
    
    const loadingBay = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 8), this.materials.concrete);
    loadingBay.position.set(20, 3, -28);
    loadingBay.castShadow = true;
    group.add(loadingBay);
    
    this.scene.add(group);
  }
  
  buildMcdonalds() {
    const { x, z } = CONFIG.LOCATIONS.MCDONALDS;
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(54, 42), this.materials.asphalt);
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(x, 0.03, z);
    lot.receiveShadow = true;
    this.scene.add(lot);
    
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    const base = new THREE.Mesh(new THREE.BoxGeometry(35, 8, 30), this.materials.wallRed);
    base.position.y = 4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    const roof = new THREE.Mesh(new THREE.BoxGeometry(38, 1.2, 33), this.materials.roof);
    roof.position.y = 8.3;
    roof.castShadow = true;
    group.add(roof);
    
    const awning = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 4), this.materials.trim);
    awning.position.set(0, 5.4, 17);
    awning.castShadow = true;
    group.add(awning);
    
    for (let i = -1; i <= 1; i++) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 0.2), this.materials.window);
      window.position.set(i * 8, 4.5, 15.2);
      group.add(window);
    }
    
    for (let i = -1; i <= 1; i += 2) {
      const archLeg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5, 1.2), this.materials.line);
      archLeg.position.set(i * 5, 11, 14.5);
      archLeg.castShadow = true;
      group.add(archLeg);
    }
    
    const archTop = new THREE.Mesh(new THREE.TorusGeometry(5, 0.7, 6, 14, Math.PI), this.materials.line);
    archTop.position.set(0, 13.2, 14.5);
    archTop.rotation.z = Math.PI;
    archTop.castShadow = true;
    group.add(archTop);
    
    this.scene.add(group);
  }
  
  buildNeighborhood() {
    const neighborhood = CONFIG.LOCATIONS.NEIGHBORHOOD;
    const street = new THREE.Mesh(new THREE.PlaneGeometry(120, 86), this.materials.shoulder);
    street.rotation.x = -Math.PI / 2;
    street.position.set(neighborhood.x, 0.02, neighborhood.z);
    street.receiveShadow = true;
    this.scene.add(street);
    
    for (let i = 0; i < 6; i++) {
      const x = neighborhood.x + (i % 3) * 38 - 38;
      const z = neighborhood.z + Math.floor(i / 3) * 38 - 19;
      this.addHouse(x, z, i);
    }
  }
  
  addHouse(x, z, index = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    
    const wallMaterials = [this.materials.wallLight, this.materials.trim, this.materials.wallBlue];
    const wall = new THREE.Mesh(new THREE.BoxGeometry(15, 9 + (index % 2), 12), wallMaterials[index % wallMaterials.length]);
    wall.position.y = 4.5 + (index % 2) * 0.5;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    
    const roof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 4.2, 4), this.materials.roof);
    roof.position.y = 10 + (index % 2) * 0.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 0.3), this.materials.woodDark);
    door.position.set(0, 2.2, 6.16);
    door.castShadow = true;
    group.add(door);
    
    for (let i = -1; i <= 1; i += 2) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.4, 0.2), this.materials.window);
      window.position.set(i * 4.2, 4.8, 6.14);
      group.add(window);
    }
    
    const porch = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.45, 2.8), this.materials.concrete);
    porch.position.set(0, 0.22, 7.6);
    porch.receiveShadow = true;
    group.add(porch);
    
    const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), this.materials.metal);
    mailbox.position.set(-6.4, 0.6, 8.2);
    mailbox.castShadow = true;
    group.add(mailbox);
    
    this.scene.add(group);
  }
  
  addTree(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    
    const trunk = new THREE.Mesh(this.geometries.trunk, this.materials.bark);
    trunk.position.y = 4 * scale;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    const foliageBottom = new THREE.Mesh(this.geometries.foliageLow, this.materials.foliageMid);
    foliageBottom.position.y = 8.2 * scale;
    foliageBottom.scale.setScalar(scale);
    foliageBottom.castShadow = true;
    group.add(foliageBottom);
    
    const foliageTop = new THREE.Mesh(this.geometries.foliageHigh, Math.random() > 0.5 ? this.materials.foliageDark : this.materials.foliageLight);
    foliageTop.position.y = 11.2 * scale;
    foliageTop.scale.setScalar(scale * 0.9);
    foliageTop.castShadow = true;
    group.add(foliageTop);
    
    this.scene.add(group);
  }
  
  addAbandonedCar(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.75, z);
    group.rotation.y = (Math.random() * 0.8 - 0.4) + (Math.abs(z) < 18 ? Math.PI / 2 : 0);
    
    const bodyMaterial = Math.random() > 0.5 ? this.materials.rust : this.materials.metal;
    const body = new THREE.Mesh(this.geometries.carBody, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const cabin = new THREE.Mesh(this.geometries.carCabin, this.materials.window);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    group.add(cabin);
    
    const hood = new THREE.Mesh(new THREE.BoxGeometry(4, 0.35, 1.4), this.materials.metal);
    hood.position.set(0, 0.65, 2.8);
    hood.castShadow = true;
    group.add(hood);
    
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const wheel = new THREE.Mesh(this.geometries.wheel, this.materials.primaryWheel);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i * 2.1, -0.25, j * 2.5);
        wheel.castShadow = true;
        group.add(wheel);
      }
    }
    
    this.scene.add(group);
  }
  
  addRoad(x, z, width, depth, horizontal) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.materials.asphalt);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.04, z);
    road.receiveShadow = true;
    this.scene.add(road);
    
    const shoulderGeometry = horizontal ? new THREE.BoxGeometry(width, 0.1, 2) : new THREE.BoxGeometry(2, 0.1, depth);
    for (let i = -1; i <= 1; i += 2) {
      const shoulder = new THREE.Mesh(shoulderGeometry, this.materials.shoulder);
      shoulder.position.set(
        x + (horizontal ? 0 : i * ((width / 2) + 1)),
        0.05,
        z + (horizontal ? i * ((depth / 2) + 1) : 0)
      );
      shoulder.receiveShadow = true;
      this.scene.add(shoulder);
    }
    
    const segmentCount = Math.floor((horizontal ? width : depth) / 18);
    for (let i = 0; i < segmentCount; i++) {
      const line = new THREE.Mesh(this.geometries.laneMark, this.materials.line);
      line.position.set(
        x + (horizontal ? -width / 2 + 12 + i * 18 : 0),
        0.06,
        z + (horizontal ? 0 : -depth / 2 + 12 + i * 18)
      );
      if (!horizontal) line.rotation.y = Math.PI / 2;
      line.receiveShadow = true;
      this.scene.add(line);
    }
  }
  
  addStreetLamp(x, z) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 8, 6), this.materials.metal);
    post.position.set(x, 4, z);
    post.castShadow = true;
    this.scene.add(post);
    
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.2), this.materials.metal);
    arm.position.set(x + 1.1, 7.5, z);
    arm.castShadow = true;
    this.scene.add(arm);
    
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), this.materials.lantern);
    lamp.position.set(x + 2.1, 7.3, z);
    lamp.castShadow = true;
    this.scene.add(lamp);
  }
  
  addGroundPatch(x, z, width, depth, material) {
    const size = Math.max(width, depth) * 0.5;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(size, 18), material);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = Math.random() * Math.PI * 2;
    patch.position.set(x, 0.015, z);
    patch.scale.set(width / (size * 2), depth / (size * 2), 1);
    patch.receiveShadow = true;
    this.scene.add(patch);
  }
  
  addHill(x, z, radius, height) {
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius, height, 10), this.materials.foliageLight);
    hill.position.set(x, height * 0.5, z);
    hill.castShadow = true;
    hill.receiveShadow = true;
    this.scene.add(hill);
  }
  
  addRockCluster(x, z, scale) {
    const group = new THREE.Group();
    group.position.set(x, 0.2, z);
    
    for (let i = 0; i < 3; i++) {
      const rock = new THREE.Mesh(this.geometries.rock, this.materials.rock);
      rock.position.set((Math.random() - 0.5) * 2.5, Math.random() * 0.8, (Math.random() - 0.5) * 2.5);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.setScalar(scale * (0.5 + Math.random() * 0.7));
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
    }
    
    this.scene.add(group);
  }
  
  addShrubCluster(x, z, scale) {
    const group = new THREE.Group();
    group.position.set(x, 0.5, z);
    
    for (let i = 0; i < 2; i++) {
      const shrub = new THREE.Mesh(this.geometries.shrub, i === 0 ? this.materials.foliageMid : this.materials.foliageDark);
      shrub.position.set((i * 1.2) - 0.6, 0, (Math.random() - 0.5) * 1.2);
      shrub.scale.setScalar(scale * (0.8 + i * 0.2));
      shrub.castShadow = true;
      shrub.receiveShadow = true;
      group.add(shrub);
    }
    
    this.scene.add(group);
  }
  
  isRoadOrStructureArea(x, z, padding = 0) {
    if (Math.abs(z) < 14 + padding || Math.abs(x) < 14 + padding) return true;
    for (const config of Object.values(CONFIG.LOCATIONS)) {
      const dx = x - config.x;
      const dz = z - config.z;
      if (Math.sqrt(dx * dx + dz * dz) < (config.size * 0.7) + padding) return true;
    }
    return false;
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xbcc5d4, 0.55);
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;
    
    const hemiLight = new THREE.HemisphereLight(0x7d8ea3, 0x243018, 0.55);
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;
    
    const sun = new THREE.DirectionalLight(0xfff0c2, 1.15);
    sun.position.set(120, 160, 80);
    sun.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
    sun.shadow.camera.left = -220;
    sun.shadow.camera.right = 220;
    sun.shadow.camera.top = 220;
    sun.shadow.camera.bottom = -220;
    sun.shadow.camera.far = 420;
    sun.castShadow = true;
    this.scene.add(sun);
    this.sun = sun;
    
    const moon = new THREE.DirectionalLight(0x7a95c9, 0.18);
    moon.position.set(-100, 120, -100);
    this.scene.add(moon);
    this.moon = moon;
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(this.fogColors.day.getHex(), CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
  }
  
  updateDayNightCycle(time) {
    const cycle = (time % CONFIG.DAY_CYCLE_DURATION) / CONFIG.DAY_CYCLE_DURATION;
    const sunAngle = (cycle * Math.PI * 2) - (Math.PI / 2);
    const daylight = Math.max(0, Math.sin(sunAngle) * 0.9 + 0.15);
    const duskBlend = 1 - Math.min(1, Math.abs(daylight - 0.35) / 0.35);
    
    this.sun.position.set(Math.cos(sunAngle) * 150, Math.max(18, Math.sin(sunAngle) * 170 + 35), Math.sin(sunAngle + 0.3) * 100);
    this.sun.intensity = 0.2 + daylight * 1.1;
    this.moon.intensity = 0.08 + (1 - daylight) * 0.26;
    this.ambientLight.intensity = 0.2 + daylight * 0.45;
    this.hemiLight.intensity = 0.18 + daylight * 0.5;
    
    this.tempColor.copy(this.skyColors.night).lerp(this.skyColors.day, daylight);
    this.tempColor.lerp(this.skyColors.dusk, duskBlend * 0.35);
    this.scene.background.copy(this.tempColor);
    
    this.scene.fog.color.copy(this.fogColors.night).lerp(this.fogColors.day, daylight);
  }
}
