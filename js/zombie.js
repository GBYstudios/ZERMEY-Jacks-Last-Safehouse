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
    this.walkCycle = Math.random() * Math.PI * 2;
    this.variant = Math.floor(Math.random() * 3);
    this.createModel();
  }
  
  static getSharedAssets() {
    if (!Zombie.sharedAssets) {
      Zombie.sharedAssets = {
        geometries: {
          torso: new THREE.BoxGeometry(0.72, 0.92, 0.42),
          head: new THREE.SphereGeometry(0.26, 8, 8),
          arm: new THREE.BoxGeometry(0.18, 0.78, 0.18),
          leg: new THREE.BoxGeometry(0.22, 0.82, 0.22),
          eye: new THREE.BoxGeometry(0.06, 0.06, 0.04)
        },
        materials: {
          normal: [
            {
              skin: new THREE.MeshStandardMaterial({ color: 0x6f8d58, roughness: 1 }),
              shirt: new THREE.MeshStandardMaterial({ color: 0x4b5e3d, roughness: 1 }),
              pants: new THREE.MeshStandardMaterial({ color: 0x463f48, roughness: 1 })
            },
            {
              skin: new THREE.MeshStandardMaterial({ color: 0x77916b, roughness: 1 }),
              shirt: new THREE.MeshStandardMaterial({ color: 0x5d4c3f, roughness: 1 }),
              pants: new THREE.MeshStandardMaterial({ color: 0x313940, roughness: 1 })
            },
            {
              skin: new THREE.MeshStandardMaterial({ color: 0x6b8a63, roughness: 1 }),
              shirt: new THREE.MeshStandardMaterial({ color: 0x42585a, roughness: 1 }),
              pants: new THREE.MeshStandardMaterial({ color: 0x413b34, roughness: 1 })
            }
          ],
          fast: [
            {
              skin: new THREE.MeshStandardMaterial({ color: 0x8b9f7c, roughness: 1 }),
              shirt: new THREE.MeshStandardMaterial({ color: 0x355066, roughness: 1 }),
              pants: new THREE.MeshStandardMaterial({ color: 0x202931, roughness: 1 })
            }
          ],
          strong: [
            {
              skin: new THREE.MeshStandardMaterial({ color: 0x728f60, roughness: 1 }),
              shirt: new THREE.MeshStandardMaterial({ color: 0x65493f, roughness: 1 }),
              pants: new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 1 })
            }
          ],
          eye: new THREE.MeshStandardMaterial({ color: 0xf0cf84, emissive: 0x6a3c10, roughness: 0.5 })
        }
      };
    }
    return Zombie.sharedAssets;
  }
  
  createModel() {
    const assets = Zombie.getSharedAssets();
    const paletteKey = this.type === 'FAST' ? 'fast' : this.type === 'STRONG' ? 'strong' : 'normal';
    const palette = assets.materials[paletteKey][this.variant % assets.materials[paletteKey].length];
    const scale = this.type === 'STRONG' ? 1.28 : this.type === 'FAST' ? 0.92 : 1;
    const group = new THREE.Group();
    
    const torso = new THREE.Mesh(assets.geometries.torso, palette.shirt);
    torso.position.y = 1.08;
    torso.scale.setScalar(scale);
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);
    
    const head = new THREE.Mesh(assets.geometries.head, palette.skin);
    head.position.y = 1.78 * scale;
    head.scale.setScalar(scale);
    head.castShadow = true;
    group.add(head);
    
    this.leftArm = this.createLimb(assets.geometries.arm, palette.skin, -0.38 * scale, 1.46 * scale, scale);
    this.rightArm = this.createLimb(assets.geometries.arm, palette.skin, 0.38 * scale, 1.46 * scale, scale);
    this.leftLeg = this.createLimb(assets.geometries.leg, palette.pants, -0.15 * scale, 0.72 * scale, scale);
    this.rightLeg = this.createLimb(assets.geometries.leg, palette.pants, 0.15 * scale, 0.72 * scale, scale);
    group.add(this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);
    
    for (let i = -1; i <= 1; i += 2) {
      const eye = new THREE.Mesh(assets.geometries.eye, assets.materials.eye);
      eye.position.set(i * 0.09 * scale, 1.8 * scale, 0.24 * scale);
      group.add(eye);
    }
    
    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
  }
  
  createLimb(geometry, material, x, y, scale = 1) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    
    const limb = new THREE.Mesh(geometry, material);
    limb.position.y = -(geometry.parameters.height * scale) / 2;
    limb.scale.setScalar(scale);
    limb.castShadow = true;
    limb.receiveShadow = true;
    pivot.add(limb);
    
    return pivot;
  }
  
  update(deltaTime, player) {
    if (this.isDead) {
      this.deathTime += deltaTime;
      this.group.rotation.z = Math.min(Math.PI / 2, this.deathTime * 2.8);
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
      this.walkCycle += deltaTime * (this.type === 'FAST' ? 11 : this.type === 'STRONG' ? 6 : 8);
      this.animateWalk();
      this.group.position.copy(this.position);
      
      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      const rotationDelta = Math.atan2(Math.sin(targetRotation - this.group.rotation.y), Math.cos(targetRotation - this.group.rotation.y));
      this.group.rotation.y += rotationDelta * 0.14;
      
      if (distanceToPlayer < this.config.attackRange) {
        if (this.attackCooldown <= 0) {
          this.attack(player);
        }
      }
    }
    
    this.attackCooldown -= deltaTime;
  }
  
  animateWalk() {
    const swing = Math.sin(this.walkCycle) * (this.type === 'FAST' ? 0.8 : this.type === 'STRONG' ? 0.42 : 0.55);
    this.leftArm.rotation.x = swing - 0.3;
    this.rightArm.rotation.x = -swing - 0.3;
    this.leftLeg.rotation.x = -swing * 0.7;
    this.rightLeg.rotation.x = swing * 0.7;
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
      const position = new THREE.Vector3(x, 0, z);
      
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
