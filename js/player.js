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
    this.lastAttackTime = 0;
    this.isDead = false;
    
    this.createModel();
    this.setupAnimation();
  }
  
  createModel() {
    // Create Jack character (simple placeholder)
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf4a460 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);
    
    // Arms
    for (let i = -1; i <= 1; i += 2) {
      const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8, 4, 8);
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0xff8c69 });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(i * 0.5, 0.9, 0);
      arm.castShadow = true;
      group.add(arm);
    }
    
    // Legs
    for (let i = -1; i <= 1; i += 2) {
      const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 4, 8);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(i * 0.25, 0.2, 0);
      leg.castShadow = true;
      group.add(leg);
    }
    
    group.position.copy(this.position);
    this.group = group;
    this.body = body;
    this.scene.add(group);
  }
  
  setupAnimation() {
    this.animationState = 'idle';
    this.animationTime = 0;
  }
  
  update(deltaTime, input, gameState) {
    if (this.isDead) return;
    
    // Handle movement input
    const movement = new THREE.Vector3();
    if (input.forward) movement.z -= 1;
    if (input.backward) movement.z += 1;
    if (input.left) movement.x -= 1;
    if (input.right) movement.x += 1;
    
    if (movement.length() > 0) {
      movement.normalize();
      this.isMoving = true;
      
      // Update direction
      this.direction.copy(movement);
      this.direction.y = 0;
      this.direction.normalize();
      
      // Set speed
      this.speed = input.sprint ? CONFIG.PLAYER_RUN_SPEED : CONFIG.PLAYER_SPEED;
      this.isRunning = input.sprint;
    } else {
      this.isMoving = false;
      this.speed = 0;
      this.isRunning = false;
    }
    
    // Update position
    this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);
    this.position.add(this.velocity);
    
    // Clamp to world bounds
    const limit = CONFIG.WORLD_SIZE / 2;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
    
    // Rotation
    const targetRotation = Math.atan2(this.direction.x, -this.direction.z);
    this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
    
    // Update group position
    this.group.position.copy(this.position);
    
    // Handle punching
    if (input.punch && this.punchCooldown <= 0 && !this.isPunching) {
      this.punch();
    }
    
    this.punchCooldown -= deltaTime;
    
    // Health regeneration in safe zone
    if (gameState && this.isInSafeZone(gameState)) {
      this.health = Math.min(this.health + CONFIG.PLAYER_HEALTH_REGEN_RATE * deltaTime, CONFIG.PLAYER_MAX_HEALTH);
    }
    
    // Update animation
    this.updateAnimation(deltaTime);
  }
  
  punch() {
    this.isPunching = true;
    this.animationState = 'punch';
    this.animationTime = 0;
    this.punchCooldown = CONFIG.PLAYER_PUNCH_COOLDOWN;
    this.lastAttackTime = Date.now();
    
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
  
  updateAnimation(deltaTime) {
    this.animationTime += deltaTime;
    
    if (this.animationState === 'punch') {
      if (this.animationTime >= CONFIG.PUNCH_ANIMATION_DURATION) {
        this.isPunching = false;
        this.animationState = 'idle';
      }
    } else if (this.isMoving) {
      this.animationState = this.isRunning ? 'run' : 'walk';
    } else {
      this.animationState = 'idle';
    }
  }
}
