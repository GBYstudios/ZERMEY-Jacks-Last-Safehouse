class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.dynamicProps = [];
    this.materialCache = {};
    this.qualityPreset = CONFIG.GRAPHICS_PRESETS.high;
    this.qualityName = CONFIG.GRAPHICS_QUALITY.HIGH;
  }
  
  setQuality(preset, qualityName) {
    this.qualityPreset = preset || CONFIG.GRAPHICS_PRESETS.high;
    this.qualityName = qualityName || CONFIG.GRAPHICS_QUALITY.HIGH;
  }
  
  build() {
    this.buildSkyDome();
    this.buildTerrain();
    this.buildTreehouse();
    this.buildTown();
    this.buildWalmart();
    this.buildMcdonalds();
    this.buildNeighborhood();
    this.setupLighting();
    this.setupFog();
    this.buildAtmosphereParticles();
  }
  
  createSurfaceTexture(type, primary, secondary, accent) {
    const cacheKey = [type, primary, secondary, accent].join(':');
    if (this.materialCache[cacheKey]) return this.materialCache[cacheKey];

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, 128, 128);

    if (type === 'grass') {
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 7 === 0 ? accent : secondary;
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 8 + Math.random() * 12);
      }
    } else if (type === 'road') {
      for (let i = 0; i < 240; i++) {
        ctx.fillStyle = secondary;
        const size = 1 + Math.random() * 3;
        ctx.fillRect(Math.random() * 128, Math.random() * 128, size, size);
      }
      ctx.fillStyle = accent;
      ctx.fillRect(58, 0, 12, 128);
      ctx.clearRect(60, 10, 8, 20);
      ctx.clearRect(60, 46, 8, 20);
      ctx.clearRect(60, 82, 8, 20);
    } else if (type === 'wall') {
      for (let y = 0; y < 128; y += 18) {
        for (let x = 0; x < 128; x += 34) {
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, 30, 16);
        }
      }
      ctx.fillStyle = accent;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(10 + i * 20, 16 + (i % 2) * 10, 10, 18);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    this.materialCache[cacheKey] = texture;
    return texture;
  }
  
  createStandardMaterial(options) {
    return new THREE.MeshStandardMaterial({
      color: options.color,
      roughness: options.roughness,
      metalness: options.metalness,
      map: options.map || null,
      emissive: options.emissive || 0x000000,
      emissiveIntensity: options.emissiveIntensity || 0
    });
  }
  
  buildSkyDome() {
    const skyGeometry = new THREE.SphereGeometry(CONFIG.WORLD_SIZE * 0.9, 20, 12);
    const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x617ea2, side: THREE.BackSide, fog: false });
    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyDome);
  }
  
  buildTerrain() {
    const grassTexture = this.createSurfaceTexture('grass', '#304d1f', '#416a2c', '#608f3b');
    grassTexture.repeat.set(18, 18);
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
    const groundMaterial = this.createStandardMaterial({
      color: 0x4d6d31,
      roughness: 0.96,
      metalness: 0.02,
      map: grassTexture
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
      const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE;
      const radius = 6 + Math.random() * 12;
      const height = 1.5 + Math.random() * 3.5;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 10, 8),
        this.createStandardMaterial({ color: 0x55773a, roughness: 1, metalness: 0 })
      );
      hill.scale.y = height / radius;
      hill.position.set(x, height * 0.35, z);
      hill.castShadow = true;
      hill.receiveShadow = true;
      this.scene.add(hill);
    }

    const grassCount = this.qualityPreset.particleCount + 18;
    for (let i = 0; i < grassCount; i++) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 40);
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      this.addGrassPatch(x, z, 0.8 + Math.random() * 1.3);
    }

    for (let i = 0; i < 26; i++) {
      const x = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 30);
      const z = (Math.random() - 0.5) * (CONFIG.WORLD_SIZE - 30);
      this.addRock(x, z, 0.6 + Math.random() * 1.6);
    }
  }
  
  buildTreehouse() {
    const group = new THREE.Group();
    const barkMaterial = this.createStandardMaterial({ color: 0x4f3521, roughness: 0.95, metalness: 0.03 });
    const woodMaterial = this.createStandardMaterial({ color: 0x8c6e4a, roughness: 0.86, metalness: 0.05 });
    const roofMaterial = this.createStandardMaterial({ color: 0x6f1a18, roughness: 0.72, metalness: 0.15 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.1, 16, 10), barkMaterial);
    trunk.position.y = 8;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 12), woodMaterial);
    platform.position.y = 10;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(11.5, 4.4, 4), roofMaterial);
    roof.position.y = 14.7;
    roof.rotation.y = Math.PI * 0.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    for (let i = -1; i <= 1; i += 2) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.1, 10.5), woodMaterial);
      rail.position.set(i * 7.2, 11.2, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);
    }

    for (let step = 0; step < 8; step++) {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(4, 0.24, 0.8), woodMaterial);
      stair.position.set(0, 2.2 + step * 0.72, 5.8 - step * 0.82);
      stair.castShadow = true;
      stair.receiveShadow = true;
      group.add(stair);
    }

    this.scene.add(group);
  }
  
  buildTown() {
    const roadTexture = this.createSurfaceTexture('road', '#2a2d30', '#41464b', '#9f8e4d');
    roadTexture.repeat.set(8, 1);
    const roadMaterial = this.createStandardMaterial({ color: 0x404347, roughness: 0.92, metalness: 0.08, map: roadTexture });
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(300, 20), roadMaterial);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.02;
    road1.receiveShadow = true;
    this.scene.add(road1);

    const road2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 300), roadMaterial);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.02;
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

    for (let i = 0; i < 4; i++) {
      this.addStreetLight(-80 + i * 55, 18);
      this.addStreetLight(-80 + i * 55, -18);
    }
  }
  
  buildWalmart() {
    const wallTexture = this.createSurfaceTexture('wall', '#273449', '#1d2634', '#6fa7ff');
    wallTexture.repeat.set(3, 1.5);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(60, 12, 50),
      this.createStandardMaterial({ color: 0x2c3f59, roughness: 0.82, metalness: 0.12, map: wallTexture })
    );
    building.position.set(CONFIG.LOCATIONS.WALMART.x, 6, CONFIG.LOCATIONS.WALMART.z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(26, 3, 0.8),
      this.createStandardMaterial({ color: 0x7698db, roughness: 0.42, metalness: 0.35, emissive: 0x284c84, emissiveIntensity: 0.35 })
    );
    sign.position.set(CONFIG.LOCATIONS.WALMART.x, 10, CONFIG.LOCATIONS.WALMART.z + 25.6);
    sign.castShadow = true;
    this.scene.add(sign);
  }
  
  buildMcdonalds() {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(35, 8, 30),
      this.createStandardMaterial({ color: 0x7a221d, roughness: 0.78, metalness: 0.08 })
    );
    building.position.set(CONFIG.LOCATIONS.MCDONALDS.x, 4, CONFIG.LOCATIONS.MCDONALDS.z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.5, 6),
      this.createStandardMaterial({ color: 0xc7a02f, roughness: 0.62, metalness: 0.12, emissive: 0x7f4c00, emissiveIntensity: 0.18 })
    );
    awning.position.set(CONFIG.LOCATIONS.MCDONALDS.x, 6.5, CONFIG.LOCATIONS.MCDONALDS.z + 12);
    awning.castShadow = true;
    this.scene.add(awning);
  }
  
  buildNeighborhood() {
    const neighborhood = CONFIG.LOCATIONS.NEIGHBORHOOD;
    for (let i = 0; i < 6; i++) {
      const x = neighborhood.x + (i % 3) * 40 - 40;
      const z = neighborhood.z + Math.floor(i / 3) * 40 - 20;
      this.addHouse(x, z);
      this.addFence(x - 10, z + 9, 18);
    }
  }
  
  addHouse(x, z) {
    const wallTexture = this.createSurfaceTexture('wall', '#846b52', '#5d4a37', '#d7c7a4');
    wallTexture.repeat.set(1.5, 1);
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(15, 10, 12),
      this.createStandardMaterial({ color: 0x8c7355, roughness: 0.88, metalness: 0.04, map: wallTexture })
    );
    house.position.set(x, 5, z);
    house.castShadow = true;
    house.receiveShadow = true;
    this.scene.add(house);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(10, 4.5, 4),
      this.createStandardMaterial({ color: 0x523531, roughness: 0.8, metalness: 0.08 })
    );
    roof.position.set(x, 12.4, z);
    roof.rotation.y = Math.PI * 0.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.scene.add(roof);
  }
  
  addTree(x, z) {
    const trunkMaterial = this.createStandardMaterial({ color: 0x4d341c, roughness: 0.94, metalness: 0.02 });
    const foliageMaterial = this.createStandardMaterial({ color: 0x365a28, roughness: 0.96, metalness: 0.01 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.05, 8, 8), trunkMaterial);
    trunk.position.set(x, 4, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.scene.add(trunk);

    const foliageHeights = [8.8, 11.4, 13.6];
    foliageHeights.forEach((height, index) => {
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(4.8 - index, 5, 8), foliageMaterial);
      foliage.position.set(x, height, z);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      this.scene.add(foliage);
    });
  }
  
  addAbandonedCar(x, z) {
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.6, 8.4),
      this.createStandardMaterial({ color: 0x45494f, roughness: 0.5, metalness: 0.55 })
    );
    carBody.position.y = 1.2;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.1, 3.9),
      this.createStandardMaterial({ color: 0x66707a, roughness: 0.38, metalness: 0.6 })
    );
    roof.position.set(0, 2.1, -0.3);
    roof.castShadow = true;
    roof.receiveShadow = true;
    carGroup.add(roof);

    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.56, 0.56, 0.5, 10),
          this.createStandardMaterial({ color: 0x141517, roughness: 0.88, metalness: 0.25 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i * 2, 0.58, j * 2.7);
        wheel.castShadow = true;
        carGroup.add(wheel);
      }
    }

    carGroup.position.set(x, 0, z);
    carGroup.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(carGroup);
  }
  
  addRock(x, z, scale) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(scale, 0),
      this.createStandardMaterial({ color: 0x717770, roughness: 0.95, metalness: 0.03 })
    );
    rock.position.set(x, scale * 0.6, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);
  }
  
  addGrassPatch(x, z, scale) {
    const bladeMaterial = this.createStandardMaterial({ color: 0x5c8d33, roughness: 1, metalness: 0 });
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.36 * scale, 1.4 * scale), bladeMaterial);
      blade.position.y = 0.7 * scale;
      blade.rotation.y = (Math.PI / 3) * i;
      blade.castShadow = this.qualityName !== CONFIG.GRAPHICS_QUALITY.LOW;
      group.add(blade);
    }
    group.position.set(x, 0, z);
    this.scene.add(group);
  }
  
  addFence(x, z, width) {
    const fenceMaterial = this.createStandardMaterial({ color: 0x825f3d, roughness: 0.92, metalness: 0.02 });
    for (let i = 0; i < 4; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.8, 0.25), fenceMaterial);
      post.position.set(x + i * (width / 3), 0.9, z);
      post.castShadow = true;
      post.receiveShadow = true;
      this.scene.add(post);
    }
    for (let rail = 0; rail < 2; rail++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.18), fenceMaterial);
      beam.position.set(x + width / 2, 0.8 + rail * 0.55, z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      this.scene.add(beam);
    }
  }
  
  addStreetLight(x, z) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 6.5, 8),
      this.createStandardMaterial({ color: 0x636b74, roughness: 0.62, metalness: 0.72 })
    );
    pole.position.set(x, 3.25, z);
    pole.castShadow = true;
    this.scene.add(pole);

    const lampHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 0.9),
      this.createStandardMaterial({ color: 0xd5bc79, roughness: 0.45, metalness: 0.3, emissive: 0x7d5c14, emissiveIntensity: 0.5 })
    );
    lampHead.position.set(x, 6.35, z);
    lampHead.castShadow = true;
    this.scene.add(lampHead);

    const light = new THREE.PointLight(0xffd48d, 1.3, 24, 2);
    light.position.set(x, 5.9, z);
    this.scene.add(light);
    this.dynamicProps.push({ light, baseIntensity: 1.3, type: 'street' });
  }
  
  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xa6b6c9, 0.38);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x89a8d8, 0x24311d, 0.72);
    this.scene.add(this.hemiLight);

    this.sun = new THREE.DirectionalLight(0xfff1cf, 1.45);
    this.sun.position.set(110, 140, 70);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = this.qualityPreset.shadowMapSize;
    this.sun.shadow.mapSize.height = this.qualityPreset.shadowMapSize;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 320;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.sun);
    this.sunMarker = new THREE.Mesh(
      new THREE.SphereGeometry(5, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffdd99, fog: false })
    );
    this.scene.add(this.sunMarker);

    this.moon = new THREE.DirectionalLight(0x7f9ed6, 0.18);
    this.moon.position.set(-90, 110, -60);
    this.scene.add(this.moon);
    this.moonMarker = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xb8c8ff, fog: false })
    );
    this.scene.add(this.moonMarker);

    const safehouseLight = new THREE.PointLight(0xffc980, 1.9, 46, 2);
    safehouseLight.position.set(0, 11.5, 0);
    safehouseLight.castShadow = this.qualityName === CONFIG.GRAPHICS_QUALITY.HIGH;
    this.scene.add(safehouseLight);
    this.dynamicProps.push({ light: safehouseLight, baseIntensity: 1.9, type: 'safehouse' });

    const safehouseFill = new THREE.SpotLight(0xffe5b7, 1.4, 64, Math.PI / 5, 0.45, 1.4);
    safehouseFill.position.set(-6, 13, 9);
    safehouseFill.target.position.set(0, 4, 0);
    safehouseFill.castShadow = this.qualityName === CONFIG.GRAPHICS_QUALITY.HIGH;
    if (safehouseFill.shadow) {
      safehouseFill.shadow.mapSize.width = Math.min(1024, this.qualityPreset.shadowMapSize);
      safehouseFill.shadow.mapSize.height = Math.min(1024, this.qualityPreset.shadowMapSize);
      safehouseFill.shadow.bias = -0.0008;
    }
    this.scene.add(safehouseFill);
    this.scene.add(safehouseFill.target);
    this.dynamicProps.push({ light: safehouseFill, baseIntensity: 1.4, type: 'safehouse' });
  }
  
  setupFog() {
    this.scene.fog = new THREE.Fog(0x516682, this.qualityPreset.fogNear, this.qualityPreset.fogFar);
  }
  
  buildAtmosphereParticles() {
    const particleCount = Math.min(CONFIG.MAX_PARTICLES, this.qualityPreset.particleCount);
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = 1 + Math.random() * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffd9a1,
      size: this.qualityName === CONFIG.GRAPHICS_QUALITY.LOW ? 0.14 : 0.2,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }
  
  applyGraphicsSettings(preset, qualityName) {
    this.setQuality(preset, qualityName);
    if (this.sun) {
      this.sun.shadow.mapSize.width = preset.shadowMapSize;
      this.sun.shadow.mapSize.height = preset.shadowMapSize;
      if (this.sun.shadow.map) this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    if (this.scene.fog) {
      this.scene.fog.near = preset.fogNear;
      this.scene.fog.far = preset.fogFar;
    }
    if (this.dynamicProps.length) {
      this.dynamicProps.forEach(({ light, type }) => {
        light.castShadow = type === 'safehouse' && qualityName === CONFIG.GRAPHICS_QUALITY.HIGH;
      });
    }
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.buildAtmosphereParticles();
    }
  }
  
  updateDayNightCycle(time) {
    const cycle = (time % CONFIG.DAY_CYCLE_DURATION) / CONFIG.DAY_CYCLE_DURATION;
    const daylight = Math.max(0, Math.sin(cycle * Math.PI));
    const twilight = 1 - daylight;
    const orbitAngle = cycle * Math.PI * 2;
    const sunX = Math.cos(orbitAngle) * 120;
    const sunY = Math.sin(orbitAngle) * 110 + 30;
    const sunZ = Math.sin(orbitAngle * 0.7) * 90;

    if (this.sun) this.sun.position.set(sunX, sunY, sunZ);
    if (this.sun) this.sun.intensity = 0.35 + daylight * 1.3;
    if (this.sunMarker) this.sunMarker.position.copy(this.sun.position);
    if (this.sunMarker) this.sunMarker.visible = sunY > 12;
    if (this.moon) this.moon.position.set(-sunX * 0.9, Math.max(12, 120 - sunY * 0.7), -sunZ);
    if (this.moon) this.moon.intensity = 0.12 + twilight * 0.52;
    if (this.moonMarker) this.moonMarker.position.copy(this.moon.position);
    if (this.moonMarker) this.moonMarker.visible = twilight > 0.35;
    if (this.ambientLight) this.ambientLight.intensity = 0.24 + daylight * 0.22;
    if (this.hemiLight) this.hemiLight.intensity = 0.4 + daylight * 0.38;
    if (this.skyDome) this.skyDome.material.color.set(daylight > 0.4 ? 0x6d90b9 : 0x26354d);
    if (this.scene.background) this.scene.background.set(daylight > 0.4 ? 0x5b7390 : 0x101a28);
    if (this.scene.fog) this.scene.fog.color.set(daylight > 0.4 ? 0x516682 : 0x161f2c);

    this.dynamicProps.forEach(({ light, baseIntensity, type }, index) => {
      const pulse = 0.94 + Math.sin(time * 2.5 + index) * 0.06;
      const multiplier = type === 'street' ? (0.45 + twilight * 0.9) : (0.7 + twilight * 0.55);
      light.intensity = baseIntensity * multiplier * pulse;
    });

    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time * 0.8 + i) * 0.0025;
        positions[i] += Math.sin(time * 0.25 + i) * 0.0015;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
