class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.health = CONFIG.PLAYER_START_HEALTH;
    this.speed = 0;
    this.isRunning = false;
    this.isMoving = false;
    this.isPunching = false;
    this.punchCooldown = 0;
    this.isDead = false;
    this.walkTime = 0;
    this.createModel();
  }

  createModel() {
    const group = new THREE.Group();
    const materials = {
      skin: new THREE.MeshLambertMaterial({ color: 0xc9825b }),
      skinLight: new THREE.MeshLambertMaterial({ color: 0xe0a078 }),
      hair: new THREE.MeshLambertMaterial({ color: 0x2b1b16 }),
      jacket: new THREE.MeshLambertMaterial({ color: 0x31506b }),
      jacketDark: new THREE.MeshLambertMaterial({ color: 0x20384c }),
      shirt: new THREE.MeshLambertMaterial({ color: 0xd9d2bf }),
      pants: new THREE.MeshLambertMaterial({ color: 0x263342 }),
      boots: new THREE.MeshLambertMaterial({ color: 0x17191c }),
      eyes: new THREE.MeshBasicMaterial({ color: 0x101820 }),
      belt: new THREE.MeshLambertMaterial({ color: 0x4b3021 })
    };

    const addPart = (geometry, material, position, name, rotation = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    // Legs, boots, and torso give Jack a recognizable human silhouette.
    this.leftLeg = addPart(
      new THREE.CylinderGeometry(0.16, 0.18, 0.8, 8),
      materials.pants,
      { x: -0.18, y: 0.4, z: 0 },
      'leftLeg'
    );
    this.rightLeg = addPart(
      new THREE.CylinderGeometry(0.16, 0.18, 0.8, 8),
      materials.pants,
      { x: 0.18, y: 0.4, z: 0 },
      'rightLeg'
    );
    this.leftBoot = addPart(
      new THREE.BoxGeometry(0.28, 0.18, 0.48),
      materials.boots,
      { x: -0.18, y: 0.02, z: -0.08 },
      'leftBoot'
    );
    this.rightBoot = addPart(
      new THREE.BoxGeometry(0.28, 0.18, 0.48),
      materials.boots,
      { x: 0.18, y: 0.02, z: -0.08 },
      'rightBoot'
    );

    addPart(
      new THREE.BoxGeometry(0.74, 0.86, 0.42),
      materials.jacket,
      { x: 0, y: 1.05, z: 0 },
      'jacket'
    );
    addPart(
      new THREE.BoxGeometry(0.78, 0.08, 0.46),
      materials.belt,
      { x: 0, y: 0.72, z: 0 },
      'belt'
    );
    addPart(
      new THREE.BoxGeometry(0.26, 0.5, 0.08),
      materials.shirt,
      { x: 0, y: 1.12, z: -0.235 },
      'shirt'
    );

    this.leftArm = addPart(
      new THREE.CylinderGeometry(0.12, 0.14, 0.72, 8),
      materials.jacketDark,
      { x: -0.48, y: 1.08, z: 0 },
      'leftArm'
    );
    this.rightArm = addPart(
      new THREE.CylinderGeometry(0.12, 0.14, 0.72, 8),
      materials.jacketDark,
      { x: 0.48, y: 1.08, z: 0 },
      'rightArm'
    );
    this.leftHand = addPart(
      new THREE.SphereGeometry(0.14, 8, 6),
      materials.skinLight,
      { x: -0.48, y: 0.68, z: 0 },
      'leftHand'
    );
    this.rightHand = addPart(
      new THREE.SphereGeometry(0.14, 8, 6),
      materials.skinLight,
      { x: 0.48, y: 0.68, z: 0 },
      'rightHand'
    );

    addPart(
      new THREE.CylinderGeometry(0.13, 0.13, 0.18, 8),
      materials.skinLight,
      { x: 0, y: 1.58, z: 0 },
      'neck'
    );
    addPart(
      new THREE.SphereGeometry(0.34, 12, 10),
      materials.skin,
      { x: 0, y: 1.88, z: 0 },
      'head'
    );
    addPart(
      new THREE.SphereGeometry(0.355, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.48),
      materials.hair,
      { x: 0, y: 2.04, z: 0 },
      'hair'
    );

    // Face details point toward the character's forward direction (-Z).
    addPart(
      new THREE.SphereGeometry(0.045, 6, 6),
      materials.eyes,
      { x: -0.12, y: 1.94, z: -0.31 },
      'leftEye'
    );
    addPart(
      new THREE.SphereGeometry(0.045, 6, 6),
      materials.eyes,
      { x: 0.12, y: 1.94, z: -0.31 },
      'rightEye'
    );
    addPart(
      new THREE.BoxGeometry(0.12, 0.035, 0.04),
      materials.skinLight,
      { x: 0, y: 1.82, z: -0.325 },
      'nose'
    );
    addPart(
      new THREE.BoxGeometry(0.16, 0.025, 0.035),
      materials.hair,
      { x: 0, y: 1.76, z: -0.32 },
      'mouth'
    );

    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
  }

  update(deltaTime, input, gameState) {
    if (this.isDead) return;
    const movement = new THREE.Vector3();
    if (input.forward) movement.z -= 1;
    if (input.backward) movement.z += 1;
    if (input.left) movement.x -= 1;
    if (input.right) movement.x += 1;

    if (movement.length() > 0) {
      movement.normalize();
      this.isMoving = true;
      this.direction.copy(movement);
      this.direction.y = 0;
      this.direction.normalize();
      this.speed = input.sprint ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_SPEED;
      this.isRunning = input.sprint;
      this.walkTime += deltaTime * (this.isRunning ? 12 : 8);
    } else {
      this.isMoving = false;
      this.speed = 0;
      this.isRunning = false;
      this.walkTime += deltaTime * 2;
    }

    this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);
    this.position.add(this.velocity);
    const limit = CONFIG.WORLD_SIZE / 2;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));

    const targetRotation = Math.atan2(this.direction.x, -this.direction.z);
    this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
    this.group.position.copy(this.position);
    this.animateBody();

    if (input.punch && this.punchCooldown <= 0 && !this.isPunching) {
      this.punch();
    }
    this.punchCooldown -= deltaTime;

    if (gameState && this.isInSafeZone(gameState)) {
      this.health = Math.min(this.health + CONFIG.PLAYER_HEALTH_REGEN_RATE * deltaTime, CONFIG.PLAYER_MAX_HEALTH);
    }
  }

  animateBody() {
    if (!this.leftLeg || !this.rightLeg) return;
    const stride = this.isMoving ? Math.sin(this.walkTime) * (this.isRunning ? 0.35 : 0.22) : 0;
    this.leftLeg.rotation.x = stride;
    this.rightLeg.rotation.x = -stride;
    this.leftBoot.rotation.x = stride;
    this.rightBoot.rotation.x = -stride;
    this.leftArm.rotation.x = -stride * 0.8;
    this.rightArm.rotation.x = stride * 0.8;
  }

  punch() {
    this.isPunching = true;
    this.punchCooldown = CONFIG.PLAYER_PUNCH_COOLDOWN;
    audioManager.playSound('punch');
    if (this.rightArm) this.rightArm.rotation.x = -1.2;
    if (this.rightHand) this.rightHand.position.z = -0.35;
    setTimeout(() => {
      this.isPunching = false;
      if (this.rightHand) this.rightHand.position.z = 0;
    }, 180);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    audioManager.playSound('hit');
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      audioManager.playDeathSound();
    }
  }

  heal(amount) {
    this.health = Math.min(this.health + amount, CONFIG.PLAYER_MAX_HEALTH);
  }

  isInSafeZone(gameState) {
    const treehousePos = new THREE.Vector3(CONFIG.LOCATIONS.TREEHOUSE.x, 0, CONFIG.LOCATIONS.TREEHOUSE.z);
    const distance = this.position.distanceTo(treehousePos);
    return distance < CONFIG.TREEHOUSE_SIZE / 2;
  }
}

window.Player = Player;
