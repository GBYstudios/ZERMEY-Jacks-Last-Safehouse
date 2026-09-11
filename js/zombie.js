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
    this.walkTime = Math.random() * Math.PI * 2;
    this.createModel();
  }
  
  createModel() {
    const group = new THREE.Group();
    const palettes = {
      NORMAL: { skin: 0x7f8c60, clothes: 0x49513e, accent: 0x98a77a, scale: 1 },
      FAST: { skin: 0x8da56d, clothes: 0x3a4740, accent: 0xb3c17a, scale: 0.94 },
      STRONG: { skin: 0x6f8257, clothes: 0x58524a, accent: 0xc1c48f, scale: 1.14 }
    };
    const palette = palettes[this.type] || palettes.NORMAL;
    const skin = new THREE.MeshStandardMaterial({ color: palette.skin, roughness: 0.95, metalness: 0.02 });
    const clothes = new THREE.MeshStandardMaterial({ color: palette.clothes, roughness: 0.88, metalness: 0.06 });
    const accent = new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.7, metalness: 0.04, emissive: 0x223311, emissiveIntensity: this.type === 'FAST' ? 0.2 : 0.05 });
    const eyes = new THREE.MeshBasicMaterial({ color: 0xcde86b });

    const addPart = (parent, geometry, material, position, rotation = null) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addPart(group, new THREE.BoxGeometry(0.62 * palette.scale, 0.92 * palette.scale, 0.36 * palette.scale), clothes, { x: 0, y: 0.95 * palette.scale, z: 0 });
    addPart(group, new THREE.BoxGeometry(0.3 * palette.scale, 0.46 * palette.scale, 0.08 * palette.scale), accent, { x: 0, y: 0.94 * palette.scale, z: -0.16 * palette.scale });

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14 * palette.scale, 0.68 * palette.scale, 0);
    group.add(this.leftLeg);
    addPart(this.leftLeg, new THREE.CylinderGeometry(0.11 * palette.scale, 0.12 * palette.scale, 0.78 * palette.scale, 7), clothes, { x: 0, y: -0.32 * palette.scale, z: 0 });
    addPart(this.leftLeg, new THREE.BoxGeometry(0.2 * palette.scale, 0.12 * palette.scale, 0.34 * palette.scale), accent, { x: 0, y: -0.72 * palette.scale, z: -0.05 * palette.scale });

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14 * palette.scale, 0.68 * palette.scale, 0);
    group.add(this.rightLeg);
    addPart(this.rightLeg, new THREE.CylinderGeometry(0.11 * palette.scale, 0.12 * palette.scale, 0.78 * palette.scale, 7), clothes, { x: 0, y: -0.32 * palette.scale, z: 0 });
    addPart(this.rightLeg, new THREE.BoxGeometry(0.2 * palette.scale, 0.12 * palette.scale, 0.34 * palette.scale), accent, { x: 0, y: -0.72 * palette.scale, z: -0.05 * palette.scale });

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.34 * palette.scale, 1.28 * palette.scale, 0);
    group.add(this.leftArm);
    addPart(this.leftArm, new THREE.CylinderGeometry(0.09 * palette.scale, 0.11 * palette.scale, 0.8 * palette.scale, 7), clothes, { x: 0, y: -0.34 * palette.scale, z: 0 });
    addPart(this.leftArm, new THREE.SphereGeometry(0.1 * palette.scale, 6, 6), skin, { x: 0, y: -0.76 * palette.scale, z: 0 });

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.34 * palette.scale, 1.28 * palette.scale, 0);
    group.add(this.rightArm);
    addPart(this.rightArm, new THREE.CylinderGeometry(0.09 * palette.scale, 0.11 * palette.scale, 0.8 * palette.scale, 7), clothes, { x: 0, y: -0.34 * palette.scale, z: 0 });
    addPart(this.rightArm, new THREE.SphereGeometry(0.1 * palette.scale, 6, 6), skin, { x: 0, y: -0.76 * palette.scale, z: 0 });

    this.head = addPart(group, new THREE.SphereGeometry(0.26 * palette.scale, 10, 8), skin, { x: 0, y: 1.56 * palette.scale, z: -0.02 * palette.scale });
    addPart(group, new THREE.BoxGeometry(0.16 * palette.scale, 0.08 * palette.scale, 0.08 * palette.scale), accent, { x: 0, y: 1.32 * palette.scale, z: -0.15 * palette.scale });
    addPart(group, new THREE.SphereGeometry(0.035 * palette.scale, 5, 5), eyes, { x: -0.09 * palette.scale, y: 1.58 * palette.scale, z: -0.22 * palette.scale });
    addPart(group, new THREE.SphereGeometry(0.035 * palette.scale, 5, 5), eyes, { x: 0.09 * palette.scale, y: 1.58 * palette.scale, z: -0.22 * palette.scale });
    addPart(group, new THREE.BoxGeometry(0.42 * palette.scale, 0.08 * palette.scale, 0.24 * palette.scale), accent, { x: 0, y: 1.72 * palette.scale, z: 0.02 * palette.scale }, { x: 0.18, y: 0, z: 0 });
    
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
      this.walkTime += deltaTime * (3 + this.config.speed * 0.45);
      
      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
      this.animateBody(distanceToPlayer < this.config.attackRange + 0.5);
      
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

  animateBody(isThreatening) {
    const sway = Math.sin(this.walkTime) * 0.4;
    if (this.leftLeg) this.leftLeg.rotation.x = sway;
    if (this.rightLeg) this.rightLeg.rotation.x = -sway;
    if (this.leftArm) {
      this.leftArm.rotation.x = -sway * 0.7 - 0.35 - (isThreatening ? 0.2 : 0);
      this.leftArm.rotation.z = -0.1;
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = sway * 0.7 - 0.35 - (isThreatening ? 0.35 : 0);
      this.rightArm.rotation.z = 0.1;
    }
    if (this.head) this.head.rotation.z = Math.sin(this.walkTime * 0.5) * 0.08;
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
    this.group.rotation.z = Math.PI * 0.5;
    this.group.position.y = 0.35;
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
