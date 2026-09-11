class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3(0, 0, -1);
    this.health = CONFIG.PLAYER_START_HEALTH;
    this.speed = 0;
    this.isRunning = false;
    this.isMoving = false;
    this.isPunching = false;
    this.punchCooldown = 0;
    this.isDead = false;
    this.walkCycle = 0;
    this.createModel();
  }
  
  static getSharedAssets() {
    if (!Player.sharedAssets) {
      Player.sharedAssets = {
        materials: {
          jacket: new THREE.MeshStandardMaterial({ color: 0xb45a2f, roughness: 0.95 }),
          shirt: new THREE.MeshStandardMaterial({ color: 0x43576a, roughness: 0.95 }),
          jeans: new THREE.MeshStandardMaterial({ color: 0x26364d, roughness: 0.95 }),
          skin: new THREE.MeshStandardMaterial({ color: 0xd4a07a, roughness: 1 }),
          hair: new THREE.MeshStandardMaterial({ color: 0x2d211b, roughness: 1 }),
          shoes: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 1 }),
          eye: new THREE.MeshStandardMaterial({ color: 0xe8f1ff, emissive: 0x203040, roughness: 0.4 }),
          strap: new THREE.MeshStandardMaterial({ color: 0x5b4730, roughness: 1 })
        },
        geometries: {
          torso: new THREE.BoxGeometry(0.9, 1.15, 0.55),
          chest: new THREE.BoxGeometry(0.72, 0.45, 0.6),
          head: new THREE.SphereGeometry(0.34, 10, 10),
          arm: new THREE.BoxGeometry(0.22, 0.82, 0.22),
          leg: new THREE.BoxGeometry(0.28, 0.92, 0.28),
          hand: new THREE.BoxGeometry(0.2, 0.18, 0.18),
          foot: new THREE.BoxGeometry(0.28, 0.16, 0.5),
          eye: new THREE.BoxGeometry(0.08, 0.08, 0.04),
          backpack: new THREE.BoxGeometry(0.58, 0.72, 0.22),
          cap: new THREE.BoxGeometry(0.5, 0.18, 0.5)
        }
      };
    }
    return Player.sharedAssets;
  }
  
  createModel() {
    const assets = Player.getSharedAssets();
    const group = new THREE.Group();
    
    const torso = new THREE.Mesh(assets.geometries.torso, assets.materials.jacket);
    torso.position.y = 1.35;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);
    
    const chest = new THREE.Mesh(assets.geometries.chest, assets.materials.shirt);
    chest.position.set(0, 1.25, 0.18);
    chest.castShadow = true;
    group.add(chest);
    
    const head = new THREE.Mesh(assets.geometries.head, assets.materials.skin);
    head.position.y = 2.15;
    head.castShadow = true;
    group.add(head);
    
    const hair = new THREE.Mesh(assets.geometries.cap, assets.materials.hair);
    hair.position.set(0, 2.38, -0.02);
    hair.castShadow = true;
    group.add(hair);
    
    const backpack = new THREE.Mesh(assets.geometries.backpack, assets.materials.strap);
    backpack.position.set(0, 1.35, -0.38);
    backpack.castShadow = true;
    backpack.receiveShadow = true;
    group.add(backpack);
    
    this.leftArm = this.createLimb(assets.geometries.arm, assets.materials.skin, -0.58, 1.7);
    this.rightArm = this.createLimb(assets.geometries.arm, assets.materials.skin, 0.58, 1.7);
    this.leftLeg = this.createLimb(assets.geometries.leg, assets.materials.jeans, -0.22, 0.88);
    this.rightLeg = this.createLimb(assets.geometries.leg, assets.materials.jeans, 0.22, 0.88);
    
    group.add(this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);
    
    const leftFoot = new THREE.Mesh(assets.geometries.foot, assets.materials.shoes);
    leftFoot.position.set(-0.22, 0.08, 0.08);
    leftFoot.castShadow = true;
    group.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(assets.geometries.foot, assets.materials.shoes);
    rightFoot.position.set(0.22, 0.08, 0.08);
    rightFoot.castShadow = true;
    group.add(rightFoot);
    
    for (let i = -1; i <= 1; i += 2) {
      const eye = new THREE.Mesh(assets.geometries.eye, assets.materials.eye);
      eye.position.set(i * 0.12, 2.18, 0.31);
      group.add(eye);
    }
    
    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
  }
  
  createLimb(geometry, material, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    
    const limb = new THREE.Mesh(geometry, material);
    limb.position.y = -geometry.parameters.height / 2;
    limb.castShadow = true;
    limb.receiveShadow = true;
    pivot.add(limb);
    
    return pivot;
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
      this.walkCycle += deltaTime * (this.isRunning ? 11 : 7);
    } else {
      this.isMoving = false;
      this.speed = 0;
      this.isRunning = false;
      this.walkCycle += deltaTime * 2;
    }
    
    this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);
    this.position.add(this.velocity);
    const limit = CONFIG.WORLD_SIZE / 2;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
    
    const targetRotation = Math.atan2(this.direction.x, -this.direction.z);
    const rotationDelta = Math.atan2(Math.sin(targetRotation - this.group.rotation.y), Math.cos(targetRotation - this.group.rotation.y));
    this.group.rotation.y += rotationDelta * 0.16;
    
    const stride = this.isMoving ? Math.sin(this.walkCycle) * (this.isRunning ? 0.95 : 0.55) : 0;
    const bob = this.isMoving ? Math.abs(Math.sin(this.walkCycle * 2)) * (this.isRunning ? 0.11 : 0.06) : 0;
    this.leftArm.rotation.x = stride;
    this.rightArm.rotation.x = -stride;
    this.leftLeg.rotation.x = -stride * 0.8;
    this.rightLeg.rotation.x = stride * 0.8;
    this.group.position.set(this.position.x, this.position.y + bob, this.position.z);
    
    if (input.punch && this.punchCooldown <= 0 && !this.isPunching) {
      this.punch();
    }
    this.punchCooldown -= deltaTime;
    
    if (gameState && this.isInSafeZone(gameState)) {
      this.health = Math.min(this.health + CONFIG.PLAYER_HEALTH_REGEN_RATE * deltaTime, CONFIG.PLAYER_MAX_HEALTH);
    }
  }
  
  punch() {
    this.isPunching = true;
    this.punchCooldown = CONFIG.PLAYER_PUNCH_COOLDOWN;
    audioManager.playSound('punch');
    setTimeout(() => {
      this.isPunching = false;
    }, CONFIG.PUNCH_ANIMATION_DURATION * 1000);
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
