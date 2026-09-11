class Zombie {
  constructor(scene, position, type = 'NORMAL') {
    this.scene = scene;
    this.position = position.clone();
    this.type = type;
    this.config = CONFIG.ZOMBIE_TYPES[type];
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.velocity = new THREE.Vector3();
    this.target = null;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.isDead = false;
    this.deathTime = 0;
    this.animationTime = 0;
    this.animationState = 'walk';
    
    this.createModel();
  }
  
  createModel() {
    const group = new THREE.Group();
    
    // Zombie body - greenish tint
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4e });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x5a9c5e });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);
    
    // Empty eye sockets
    const eyeGeometry = new THREE.SphereGeometry(0.08, 4, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    for (let i = -0.1; i <= 0.1; i += 0.2) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set(i, 1.15, -0.15);
      group.add(eye);
    }
    
    // Arms (dangly)
    for (let i = -1; i <= 1; i += 2) {
      const armGeometry = new THREE.CapsuleGeometry(0.1, 0.7, 4, 8);
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4e });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(i * 0.35, 0.6, 0);
      arm.castShadow = true;
      group.add(arm);
    }
    
    // Legs
    for (let i = -1; i <= 1; i += 2) {
      const legGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 4, 8);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x3a6c3e });
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(i * 0.15, 0.15, 0);
      leg.castShadow = true;
      group.add(leg);
    }
    
    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
  }
  
  update(deltaTime, player) {
    if (this.isDead) {
      this.deathTime += deltaTime;
      if (this.deathTime > 2) {
        this.remove();
      }
      return;
    }
    
    // Calculate distance to player
    const distanceToPlayer = this.position.distanceTo(player.position);
    
    // Follow player if in range
    if (distanceToPlayer < 80) {
      const directionToPlayer = new THREE.Vector3();
      directionToPlayer.subVectors(player.position, this.position);
      directionToPlayer.normalize();
      
      this.velocity.copy(directionToPlayer).multiplyScalar(this.config.speed * deltaTime);
      this.position.add(this.velocity);
      this.group.position.copy(this.position);
      
      // Face player
      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
      
      this.animationState = 'walk';
      
      // Attack if close enough
      if (distanceToPlayer < this.config.attackRange) {
        if (this.attackCooldown <= 0) {
          this.attack(player);
        }
      }
    }
    
    this.attackCooldown -= deltaTime;
    this.animationTime += deltaTime;
  }
  
  attack(player) {
    this.isAttacking = true;
    this.attackCooldown = this.config.attackCooldown;
    player.takeDamage(this.config.damage);
    audioManager.playSound('zombie_groan');
  }
  
  takeDamage(amount) {
    if (this.isDead) return;
    
    this.health -= amount;
    
    if (this.health <= 0) {
      this.die();
    } else {
      audioManager.playSound('hit');
    }
  }
  
  die() {
    this.isDead = true;
    this.deathTime = 0;
    this.animationState = 'death';
    
    // Fade out effect
    this.group.traverse((child) => {
      if (child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
      }
    });
    
    audioManager.playSound('death');
  }
  
  remove() {
    this.scene.remove(this.group);
  }
}

class ZombieManager {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
    this.spawnPoints = [
      { x: 150, z: 100 },   // Walmart
      { x: -120, z: 140 },  // McDonald's
      { x: -150, z: -100 }  // Neighborhood
    ];
  }
  
  spawnZombies(location, count) {
    const spawnPoint = this.spawnPoints[Object.keys(CONFIG.LOCATIONS).indexOf(location)];
    if (!spawnPoint) return;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const x = spawnPoint.x + Math.cos(angle) * distance;
      const z = spawnPoint.z + Math.sin(angle) * distance;
      const position = new THREE.Vector3(x, 1, z);
      
      // Mix of zombie types
      let type = 'NORMAL';
      const rand = Math.random();
      if (rand < 0.15) type = 'FAST';
      if (rand < 0.08) type = 'STRONG';
      
      const zombie = new Zombie(this.scene, position, type);
      this.zombies.push(zombie);
    }
  }
  
  update(deltaTime, player, gameState) {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      this.zombies[i].update(deltaTime, player);
      if (this.zombies[i].isDead && this.zombies[i].deathTime > 2) {
        this.zombies.splice(i, 1);
      }
    }
  }
  
  getZombiesInRange(position, range) {
    return this.zombies.filter(z => !z.isDead && z.position.distanceTo(position) < range);
  }
  
  getZombieInFrontOf(position, direction, range) {
    let closest = null;
    let closestDistance = range;
    
    for (const zombie of this.zombies) {
      if (zombie.isDead) continue;
      
      const toZombie = new THREE.Vector3();
      toZombie.subVectors(zombie.position, position);
      const distance = toZombie.length();
      
      if (distance < closestDistance && distance > 0) {
        const angle = Math.acos(toZombie.normalize().dot(direction));
        if (angle < Math.PI / 3) { // 60 degree cone in front
          closest = zombie;
          closestDistance = distance;
        }
      }
    }
    
    return closest;
  }
  
  countZombiesInLocation(location) {
    return this.zombies.filter(z => !z.isDead).length;
  }
  
  clear() {
    for (const zombie of this.zombies) {
      zombie.remove();
    }
    this.zombies = [];
  }
}
