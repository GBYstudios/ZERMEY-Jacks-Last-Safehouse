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
    this.punchTimer = 0;
    this.isDead = false;
    this.walkTime = 0;
    this.createModel();
  }

  createModel() {
    const group = new THREE.Group();
    const materials = {
      skin: new THREE.MeshStandardMaterial({ color: 0xc9825b, roughness: 0.72, metalness: 0.02 }),
      skinLight: new THREE.MeshStandardMaterial({ color: 0xe0a078, roughness: 0.68, metalness: 0.02 }),
      hair: new THREE.MeshStandardMaterial({ color: 0x2b1b16, roughness: 0.9, metalness: 0.05 }),
      jacket: new THREE.MeshStandardMaterial({ color: 0x31506b, roughness: 0.64, metalness: 0.12 }),
      jacketDark: new THREE.MeshStandardMaterial({ color: 0x20384c, roughness: 0.7, metalness: 0.08 }),
      shirt: new THREE.MeshStandardMaterial({ color: 0xd9d2bf, roughness: 0.82, metalness: 0.02 }),
      pants: new THREE.MeshStandardMaterial({ color: 0x263342, roughness: 0.75, metalness: 0.08 }),
      boots: new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.5, metalness: 0.28 }),
      eyes: new THREE.MeshBasicMaterial({ color: 0x101820 }),
      belt: new THREE.MeshStandardMaterial({ color: 0x4b3021, roughness: 0.78, metalness: 0.12 }),
      gear: new THREE.MeshStandardMaterial({ color: 0x4f5b39, roughness: 0.86, metalness: 0.08 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x7c8188, roughness: 0.38, metalness: 0.82 })
    };

    const addPart = (parent, geometry, material, position, name, rotation = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const torso = new THREE.Group();
    group.add(torso);
    addPart(torso, new THREE.BoxGeometry(0.82, 0.94, 0.46), materials.jacket, { x: 0, y: 1.1, z: 0 }, 'jacket');
    addPart(torso, new THREE.BoxGeometry(0.54, 0.68, 0.12), materials.shirt, { x: 0, y: 1.1, z: -0.18 }, 'shirt');
    addPart(torso, new THREE.BoxGeometry(0.86, 0.09, 0.48), materials.belt, { x: 0, y: 0.67, z: 0 }, 'belt');
    addPart(torso, new THREE.BoxGeometry(0.58, 0.24, 0.24), materials.gear, { x: 0, y: 1.14, z: 0.28 }, 'backpack');
    addPart(torso, new THREE.BoxGeometry(0.08, 0.9, 0.06), materials.gear, { x: -0.2, y: 1.08, z: 0.18 }, 'leftStrap', { x: 0.14, y: 0, z: -0.12 });
    addPart(torso, new THREE.BoxGeometry(0.08, 0.9, 0.06), materials.gear, { x: 0.2, y: 1.08, z: 0.18 }, 'rightStrap', { x: 0.14, y: 0, z: 0.12 });
    addPart(torso, new THREE.BoxGeometry(0.32, 0.16, 0.06), materials.metal, { x: 0.14, y: 0.84, z: -0.25 }, 'flashlight');

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18, 0.82, 0);
    group.add(this.leftLeg);
    addPart(this.leftLeg, new THREE.CylinderGeometry(0.16, 0.18, 0.86, 8), materials.pants, { x: 0, y: -0.35, z: 0 }, 'leftLegMesh');
    this.leftBoot = addPart(this.leftLeg, new THREE.BoxGeometry(0.3, 0.2, 0.54), materials.boots, { x: 0, y: -0.82, z: -0.08 }, 'leftBoot');

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18, 0.82, 0);
    group.add(this.rightLeg);
    addPart(this.rightLeg, new THREE.CylinderGeometry(0.16, 0.18, 0.86, 8), materials.pants, { x: 0, y: -0.35, z: 0 }, 'rightLegMesh');
    this.rightBoot = addPart(this.rightLeg, new THREE.BoxGeometry(0.3, 0.2, 0.54), materials.boots, { x: 0, y: -0.82, z: -0.08 }, 'rightBoot');

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 1.46, 0);
    group.add(this.leftArm);
    addPart(this.leftArm, new THREE.CylinderGeometry(0.13, 0.14, 0.82, 8), materials.jacketDark, { x: 0, y: -0.38, z: 0 }, 'leftArmMesh');
    addPart(this.leftArm, new THREE.BoxGeometry(0.16, 0.14, 0.16), materials.skinLight, { x: 0, y: -0.78, z: 0 }, 'leftHand');

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 1.46, 0);
    group.add(this.rightArm);
    addPart(this.rightArm, new THREE.CylinderGeometry(0.13, 0.14, 0.82, 8), materials.jacketDark, { x: 0, y: -0.38, z: 0 }, 'rightArmMesh');
    this.rightHand = addPart(this.rightArm, new THREE.BoxGeometry(0.16, 0.14, 0.16), materials.skinLight, { x: 0, y: -0.78, z: 0 }, 'rightHand');

    addPart(group, new THREE.CylinderGeometry(0.13, 0.13, 0.18, 8), materials.skinLight, { x: 0, y: 1.58, z: 0 }, 'neck');
    addPart(group, new THREE.SphereGeometry(0.36, 14, 12), materials.skin, { x: 0, y: 1.92, z: 0 }, 'head');
    addPart(group, new THREE.BoxGeometry(0.12, 0.18, 0.04), materials.skinLight, { x: -0.28, y: 1.88, z: -0.02 }, 'leftEar');
    addPart(group, new THREE.BoxGeometry(0.12, 0.18, 0.04), materials.skinLight, { x: 0.28, y: 1.88, z: -0.02 }, 'rightEar');
    addPart(group, new THREE.SphereGeometry(0.37, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), materials.hair, { x: 0, y: 2.07, z: 0.01 }, 'hair');
    addPart(group, new THREE.BoxGeometry(0.42, 0.08, 0.16), materials.hair, { x: 0, y: 1.68, z: -0.22 }, 'beard');
    addPart(group, new THREE.SphereGeometry(0.05, 6, 6), materials.eyes, { x: -0.12, y: 1.96, z: -0.31 }, 'leftEye');
    addPart(group, new THREE.SphereGeometry(0.05, 6, 6), materials.eyes, { x: 0.12, y: 1.96, z: -0.31 }, 'rightEye');
    addPart(group, new THREE.BoxGeometry(0.12, 0.05, 0.06), materials.skinLight, { x: 0, y: 1.84, z: -0.33 }, 'nose');
    addPart(group, new THREE.BoxGeometry(0.16, 0.03, 0.03), materials.hair, { x: 0, y: 1.74, z: -0.35 }, 'mouth');

    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
  }

  update(deltaTime, input, gameState, movementBasis) {
    if (this.isDead) return;
    const movement = new THREE.Vector3();
    const forward = movementBasis?.forward || new THREE.Vector3(0, 0, -1);
    const right = movementBasis?.right || new THREE.Vector3(1, 0, 0);
    if (input.forward) movement.add(forward);
    if (input.backward) movement.sub(forward);
    if (input.left) movement.sub(right);
    if (input.right) movement.add(right);

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
    if (this.isPunching) {
      this.punchTimer = Math.max(0, this.punchTimer - deltaTime);
      if (this.punchTimer === 0) this.isPunching = false;
    }

    if (gameState && this.isInSafeZone(gameState)) {
      this.health = Math.min(this.health + CONFIG.PLAYER_HEALTH_REGEN_RATE * deltaTime, CONFIG.PLAYER_MAX_HEALTH);
    }
  }

  animateBody() {
    if (!this.leftLeg || !this.rightLeg) return;
    const stride = this.isMoving ? Math.sin(this.walkTime) * (this.isRunning ? 0.35 : 0.22) : 0;
    const punchProgress = this.isPunching ? 1 - (this.punchTimer / CONFIG.PUNCH_ANIMATION_DURATION) : 0;
    const punchCurve = punchProgress > 0 ? Math.sin(punchProgress * Math.PI) : 0;
    this.leftLeg.rotation.x = stride;
    this.rightLeg.rotation.x = -stride;
    this.leftBoot.rotation.x = stride * 0.2;
    this.rightBoot.rotation.x = -stride * 0.2;
    this.leftArm.rotation.x = -stride * 0.85;
    this.leftArm.rotation.z = 0.08;
    this.rightArm.rotation.x = (stride * 0.35) - (1.45 * punchCurve);
    this.rightArm.rotation.z = -0.1 - (0.18 * punchCurve);
    if (this.rightHand) this.rightHand.position.z = -0.22 * punchCurve;
  }

  punch() {
    this.isPunching = true;
    this.punchTimer = CONFIG.PUNCH_ANIMATION_DURATION;
    this.punchCooldown = CONFIG.PLAYER_PUNCH_COOLDOWN;
    audioManager.playSound('punch');
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
