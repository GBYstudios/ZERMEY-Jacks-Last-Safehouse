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
    this.createModel();
  }
  
  createModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf4a460 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);
    
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
    } else {
      this.isMoving = false;
      this.speed = 0;
      this.isRunning = false;
    }
    
    this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);
    this.position.add(this.velocity);
    const limit = CONFIG.WORLD_SIZE / 2;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
    
    const targetRotation = Math.atan2(this.direction.x, -this.direction.z);
    this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
    this.group.position.copy(this.position);
    
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
