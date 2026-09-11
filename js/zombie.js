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
    this.attackPose = 0;
    this.fallDirection = Math.random() < 0.5 ? -1 : 1;
    this.bodyLean = -0.2 - Math.random() * 0.12;
    this.bodyRoll = (Math.random() - 0.5) * 0.16;
    this.headTilt = (Math.random() - 0.5) * 0.25;
    this.armSpread = 0.2 + Math.random() * 0.18;
    this._directionToPlayer = new THREE.Vector3();
    this.createModel();
  }

  static initSharedAssets() {
    if (Zombie.sharedAssets) return;

    Zombie.sharedAssets = {
      geometries: {
        torso: new THREE.BoxGeometry(0.62, 0.82, 0.34),
        pelvis: new THREE.BoxGeometry(0.5, 0.24, 0.26),
        neck: new THREE.CylinderGeometry(0.08, 0.09, 0.14, 6),
        head: new THREE.SphereGeometry(0.24, 10, 8),
        shoulder: new THREE.BoxGeometry(0.16, 0.12, 0.18),
        arm: new THREE.CylinderGeometry(0.08, 0.1, 0.68, 6),
        hand: new THREE.BoxGeometry(0.14, 0.14, 0.16),
        leg: new THREE.CylinderGeometry(0.1, 0.12, 0.78, 6),
        boot: new THREE.BoxGeometry(0.18, 0.16, 0.34),
        eye: new THREE.SphereGeometry(0.05, 6, 6),
        wound: new THREE.BoxGeometry(0.12, 0.05, 0.02),
        patch: new THREE.BoxGeometry(0.2, 0.16, 0.02),
        cheekWound: new THREE.BoxGeometry(0.08, 0.06, 0.02),
        scalp: new THREE.SphereGeometry(0.25, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.42)
      },
      materials: {
        skin: new THREE.MeshStandardMaterial({ color: 0x8ba380, roughness: 0.96, metalness: 0.02 }),
        skinPale: new THREE.MeshStandardMaterial({ color: 0xb3c6a3, roughness: 0.98, metalness: 0.01 }),
        clothes: new THREE.MeshStandardMaterial({ color: 0x4d5b4f, roughness: 0.92, metalness: 0.03 }),
        clothesDark: new THREE.MeshStandardMaterial({ color: 0x2f3731, roughness: 0.94, metalness: 0.04 }),
        boots: new THREE.MeshStandardMaterial({ color: 0x241d1b, roughness: 0.88, metalness: 0.05 }),
        blood: new THREE.MeshStandardMaterial({ color: 0x6e1616, roughness: 0.7, metalness: 0.02 }),
        sores: new THREE.MeshStandardMaterial({ color: 0x7e4c42, roughness: 0.95, metalness: 0.01 }),
        eyes: new THREE.MeshBasicMaterial({ color: 0x120f0d }),
        scalp: new THREE.MeshStandardMaterial({ color: 0x4f4f46, roughness: 1, metalness: 0 })
      }
    };
  }

  createModel() {
    Zombie.initSharedAssets();
    const { geometries, materials } = Zombie.sharedAssets;
    const group = new THREE.Group();
    const bodyRoot = new THREE.Group();
    const upperBody = new THREE.Group();

    const addPart = (parent, geometry, material, position, rotation) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, position.y, position.z);
      if (rotation) {
        mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    group.add(bodyRoot);
    bodyRoot.add(upperBody);

    this.bodyRoot = bodyRoot;
    this.upperBody = upperBody;

    addPart(bodyRoot, geometries.pelvis, materials.clothesDark, { x: 0, y: -0.02, z: 0.01 });
    addPart(upperBody, geometries.torso, materials.clothes, { x: 0, y: 0.42, z: 0 });
    addPart(upperBody, geometries.patch, materials.blood, { x: 0.12, y: 0.36, z: -0.18 }, { x: -0.18, y: 0, z: -0.2 });
    addPart(upperBody, geometries.patch, materials.sores, { x: -0.16, y: 0.55, z: -0.175 }, { x: 0.1, y: 0.14, z: 0.25 });
    addPart(upperBody, geometries.neck, materials.skinPale, { x: 0.02, y: 0.89, z: -0.01 });

    this.head = addPart(upperBody, geometries.head, materials.skin, { x: 0.04, y: 1.11, z: -0.02 }, { x: 0.08, y: 0.08, z: this.headTilt });
    addPart(upperBody, geometries.scalp, materials.scalp, { x: 0.04, y: 1.22, z: -0.01 }, { x: 0.05, y: 0.12, z: this.headTilt * 0.35 });
    addPart(upperBody, geometries.eye, materials.eyes, { x: -0.08, y: 1.12, z: -0.21 }, { x: -0.12, y: 0, z: 0 });
    addPart(upperBody, geometries.eye, materials.eyes, { x: 0.12, y: 1.08, z: -0.2 }, { x: 0.14, y: 0.05, z: 0 });
    addPart(upperBody, geometries.cheekWound, materials.blood, { x: 0.14, y: 1.01, z: -0.2 }, { x: 0.05, y: -0.3, z: -0.35 });

    addPart(upperBody, geometries.shoulder, materials.clothesDark, { x: -0.38, y: 0.7, z: 0.02 }, { x: 0, y: 0, z: 0.18 });
    addPart(upperBody, geometries.shoulder, materials.skinPale, { x: 0.39, y: 0.69, z: 0.04 }, { x: 0, y: 0.12, z: -0.08 });

    this.leftArm = addPart(upperBody, geometries.arm, materials.clothesDark, { x: -0.44, y: 0.38, z: 0.02 }, { x: -0.86, y: 0.08, z: this.armSpread });
    this.rightArm = addPart(upperBody, geometries.arm, materials.skinPale, { x: 0.48, y: 0.36, z: 0.02 }, { x: -0.68, y: -0.12, z: -this.armSpread - 0.12 });
    this.leftHand = addPart(upperBody, geometries.hand, materials.skinPale, { x: -0.61, y: 0.08, z: -0.03 }, { x: -0.35, y: 0, z: 0.22 });
    this.rightHand = addPart(upperBody, geometries.hand, materials.blood, { x: 0.67, y: 0.12, z: -0.08 }, { x: 0.1, y: 0, z: -0.4 });

    addPart(upperBody, geometries.wound, materials.blood, { x: -0.51, y: 0.18, z: -0.05 }, { x: -0.4, y: 0.2, z: 0.24 });
    addPart(upperBody, geometries.wound, materials.sores, { x: 0.34, y: 0.61, z: -0.17 }, { x: 0.18, y: -0.14, z: -0.12 });

    this.leftLeg = addPart(bodyRoot, geometries.leg, materials.clothesDark, { x: -0.15, y: -0.5, z: 0.02 }, { x: 0.04, y: 0, z: 0.04 });
    this.rightLeg = addPart(bodyRoot, geometries.leg, materials.clothesDark, { x: 0.16, y: -0.48, z: -0.01 }, { x: -0.08, y: 0, z: -0.06 });
    this.leftBoot = addPart(bodyRoot, geometries.boot, materials.boots, { x: -0.16, y: -0.95, z: 0.05 }, { x: 0, y: 0, z: 0.02 });
    this.rightBoot = addPart(bodyRoot, geometries.boot, materials.boots, { x: 0.14, y: -0.93, z: -0.02 }, { x: 0, y: 0.08, z: -0.06 });

    const typeScale = this.type === 'STRONG' ? 1.14 : this.type === 'FAST' ? 0.92 : 1;
    group.scale.set(typeScale, typeScale, typeScale);
    if (this.type === 'FAST') {
      this.bodyLean -= 0.08;
    }
    if (this.type === 'STRONG') {
      upperBody.scale.set(1.08, 1.02, 1.08);
      this.armSpread += 0.05;
    }

    group.position.copy(this.position);
    this.group = group;
    this.scene.add(group);
    this.animateAlive(false);
  }

  update(deltaTime, player) {
    if (this.isDead) {
      this.deathTime += deltaTime;
      this.animateDeath();
      if (this.deathTime > 2) {
        this.remove();
      }
      return;
    }

    let isMoving = false;
    const directionToPlayer = this._directionToPlayer;
    const distanceToPlayer = directionToPlayer.subVectors(player.position, this.position).length();

    if (distanceToPlayer < 80) {
      isMoving = true;
      directionToPlayer.normalize();
      this.velocity.copy(directionToPlayer).multiplyScalar(this.config.speed * deltaTime);
      this.position.add(this.velocity);
      this.group.position.copy(this.position);

      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;

      if (distanceToPlayer < this.config.attackRange && this.attackCooldown <= 0) {
        this.attack(player);
      }
    }

    this.walkTime += deltaTime * (isMoving ? this.config.speed * 2.2 : 1.8);
    this.attackCooldown -= deltaTime;
    this.attackPose = Math.max(this.attackPose - deltaTime * 3.8, 0);
    this.isAttacking = this.attackPose > 0.01;
    this.animateAlive(isMoving);
  }

  animateAlive(isMoving) {
    const stride = isMoving ? Math.sin(this.walkTime) * 0.55 : 0;
    const sway = Math.sin(this.walkTime * 0.5) * 0.09;
    const bob = isMoving ? Math.cos(this.walkTime * 2) * 0.035 : Math.sin(this.walkTime) * 0.01;
    const attackOffset = this.attackPose * 0.65;

    this.bodyRoot.position.y = bob;
    this.bodyRoot.rotation.x = this.bodyLean + (isMoving ? Math.abs(stride) * 0.08 : 0);
    this.bodyRoot.rotation.z = this.bodyRoll + sway * 0.65;
    this.upperBody.rotation.y = sway * 0.3;

    this.head.rotation.x = 0.08 + Math.abs(stride) * 0.08 + attackOffset * 0.2;
    this.head.rotation.y = sway * 0.4;
    this.head.rotation.z = this.headTilt + sway * 0.25;

    this.leftLeg.rotation.x = stride * 0.75;
    this.rightLeg.rotation.x = -stride * 0.75;
    this.leftBoot.rotation.x = stride * 0.28;
    this.rightBoot.rotation.x = -stride * 0.28;

    this.leftArm.rotation.x = -1 + stride * -0.32 + attackOffset * 0.15;
    this.rightArm.rotation.x = -0.82 + stride * 0.4 - attackOffset;
    this.leftArm.rotation.z = this.armSpread + sway * 0.3;
    this.rightArm.rotation.z = -this.armSpread - 0.12 - sway * 0.35;
    this.leftHand.rotation.x = -0.3 + attackOffset * 0.1;
    this.rightHand.rotation.x = 0.2 + attackOffset * 0.5;
  }

  animateDeath() {
    const collapse = Math.min(this.deathTime / 0.7, 1);
    const limbDrop = collapse * 0.65;

    this.bodyRoot.position.y = -collapse * 0.3;
    this.bodyRoot.rotation.x = this.bodyLean - collapse * 0.8;
    this.bodyRoot.rotation.z = this.bodyRoll + this.fallDirection * collapse * 1.2;

    this.head.rotation.x = 0.1 + collapse * 0.5;
    this.leftArm.rotation.x = -1.1 - limbDrop;
    this.rightArm.rotation.x = -0.7 - limbDrop;
    this.leftLeg.rotation.x = collapse * 0.25;
    this.rightLeg.rotation.x = -collapse * 0.25;
  }

  attack(player) {
    this.isAttacking = true;
    this.attackPose = 1;
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
      this.attackPose = Math.max(this.attackPose, 0.35);
    }
  }

  die() {
    this.isDead = true;
    this.deathTime = 0;
    this.attackPose = 0;
    audioManager.playSound('death');
  }

  remove() {
    this.scene.remove(this.group);
  }
}

Zombie.sharedAssets = null;

class ZombieManager {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
    this.spawnPoints = [
      { x: 150, z: 100 },
      { x: -120, z: 140 },
      { x: -150, z: -100 }
    ];
    this._toZombie = new THREE.Vector3();
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
    const toZombie = this._toZombie;

    for (const zombie of this.zombies) {
      if (zombie.isDead) continue;
      const distance = toZombie.subVectors(zombie.position, position).length();

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
