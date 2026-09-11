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
    this.createModel();
  }
  
  createModel() {
    const group = new THREE.Group();
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4e });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x5a9c5e });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);
    
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
    
    const distanceToPlayer = this.position.distanceTo(player.position);
    if (distanceToPlayer < 80) {
      const directionToPlayer = new THREE.Vector3();
      directionToPlayer.subVectors(player.position, this.position);
      directionToPlayer.normalize();
      
      this.velocity.copy(directionToPlayer).multiplyScalar(this.config.speed * deltaTime);
      this.position.add(this.velocity);
      this.group.position.copy(this.position);
      
      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
      
      if (distanceToPlayer < this.config.attackRange) {
        if (this.attackCooldown <= 0) {
          this.attack(player);
        }
      }
    }
    
    this.attackCooldown -= deltaTime;
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
      { x: 150, z: 100 },
      { x: -120, z: 140 },
      { x: -150, z: -100 }
    ];
  }
  
  spawnZombies(location, count) {
    const locIndex = Object.keys(CONFIG.LOCATIONS).indexOf(location);
    const spawnPoint = this.spawnPoints[locIndex];
    if (!spawnPoint) return;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const x = spawnPoint.x + Math.cos(angle) * distance;
      const z = spawnPoint.z + Math.sin(angle) * distance;
      const position = new THREE.Vector3(x, 1, z);
      
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
        if (angle < Math.PI / 3) {
          closest = zombie;
          closestDistance = distance;
        }
      }
    }
    
    return closest;
  }
  
  clear() {
    for (const zombie of this.zombies) {
      zombie.remove();
    }
    this.zombies = [];
  }
}
