class ZombieAssetLibrary {
  constructor() {
    this.loader = typeof THREE.GLTFLoader === 'function' ? new THREE.GLTFLoader() : null;
    this.cloneSkinnedModel = THREE.SkeletonUtils && typeof THREE.SkeletonUtils.clone === 'function'
      ? THREE.SkeletonUtils.clone.bind(THREE.SkeletonUtils)
      : null;
    this.assetDefinitions = {
      basic: {
        path: './assets/models/zombies/zombie-basic.gltf',
        baseScale: 0.92,
        preferredClips: {
          idle: ['Idle', 'No', 'Yes'],
          move: ['Walk', 'Run_Arms', 'Run'],
          attack: ['Punch', 'Run_Attack', 'Idle_Attack'],
          hit: ['HitReact'],
          death: ['Death']
        }
      },
      chubby: {
        path: './assets/models/zombies/zombie-chubby.gltf',
        baseScale: 0.88,
        preferredClips: {
          idle: ['Idle', 'No'],
          move: ['Walk', 'Run'],
          attack: ['Punch', 'Idle_Attack'],
          hit: ['HitReact'],
          death: ['Death']
        }
      },
      arm: {
        path: './assets/models/zombies/zombie-arm.gltf',
        baseScale: 0.94,
        preferredClips: {
          idle: ['Idle', 'No'],
          move: ['Run_Arms', 'Run', 'Walk'],
          attack: ['Run_Attack', 'Punch', 'Idle_Attack'],
          hit: ['HitReact'],
          death: ['Death']
        }
      },
      ribcage: {
        path: './assets/models/zombies/zombie-ribcage.gltf',
        baseScale: 0.9,
        preferredClips: {
          idle: ['Idle', 'No'],
          move: ['Crawl', 'Walk', 'Run'],
          attack: ['Punch', 'Run_Attack', 'Idle_Attack'],
          hit: ['HitReact'],
          death: ['Death']
        }
      }
    };
    this.typeVariants = {
      NORMAL: ['basic', 'basic', 'ribcage'],
      FAST: ['arm', 'basic', 'arm'],
      STRONG: ['chubby', 'chubby', 'basic']
    };
    this.cache = new Map();
    this.loaderWarningShown = false;
    this.assetWarningPaths = new Set();
  }

  preload() {
    if (!this.loader) {
      this.warnLoaderUnavailable();
      return;
    }

    for (const assetId of Object.keys(this.assetDefinitions)) {
      this.loadAsset(assetId).catch(() => {});
    }
  }

  pickVariant(type) {
    const pool = this.typeVariants[type] || this.typeVariants.NORMAL;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  loadAsset(assetId) {
    const definition = this.assetDefinitions[assetId];
    if (!definition) {
      return Promise.reject(new Error(`Unknown zombie asset: ${assetId}`));
    }

    if (!this.loader) {
      this.warnLoaderUnavailable();
      return Promise.reject(new Error('THREE.GLTFLoader unavailable'));
    }

    if (!this.cache.has(assetId)) {
      const loadPromise = new Promise((resolve, reject) => {
        this.loader.load(
          definition.path,
          (gltf) => {
            this.applyShadowSettings(gltf.scene);
            gltf.scene.updateMatrixWorld(true);
            const bounds = new THREE.Box3().setFromObject(gltf.scene);
            const size = new THREE.Vector3();
            bounds.getSize(size);
            resolve({
              animations: gltf.animations || [],
              definition,
              scene: gltf.scene,
              minY: Number.isFinite(bounds.min.y) ? bounds.min.y : 0,
              height: size.y || 1
            });
          },
          undefined,
          (error) => {
            if (!this.assetWarningPaths.has(definition.path)) {
              console.warn(`Failed to load zombie asset "${definition.path}". Falling back to procedural zombies.`, error);
              this.assetWarningPaths.add(definition.path);
            }
            reject(error);
          }
        );
      });

      this.cache.set(assetId, loadPromise);
    }

    return this.cache.get(assetId);
  }

  async createInstance(type) {
    const variantId = this.pickVariant(type);
    const asset = await this.loadAsset(variantId);
    const root = this.cloneSkinnedModel ? this.cloneSkinnedModel(asset.scene) : asset.scene.clone(true);
    this.applyShadowSettings(root);
    return {
      variantId,
      root,
      animations: asset.animations,
      definition: asset.definition,
      minY: asset.minY,
      height: asset.height
    };
  }

  applyShadowSettings(root) {
    root.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.frustumCulled && node.isSkinnedMesh) {
        node.frustumCulled = false;
      }
    });
  }

  warnLoaderUnavailable() {
    if (this.loaderWarningShown) return;
    console.warn('GLTFLoader or SkeletonUtils failed to load. Using procedural zombie fallback.');
    this.loaderWarningShown = true;
  }
}

const zombieAssetLibrary = new ZombieAssetLibrary();

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
    this.isRemoved = false;
    this.isChasing = false;
    this.animationLock = null;
    this.currentAnimation = '';
    this.currentVariant = null;
    this.mixer = null;
    this.actions = {};
    this.variantScale = 1 + (Math.random() - 0.5) * 0.12;
    this.rotationJitter = (Math.random() - 0.5) * 0.08;
    this.createModel();
  }

  createModel() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.visualRoot = new THREE.Group();
    this.visualRoot.rotation.y = this.rotationJitter;
    this.group.add(this.visualRoot);

    this.fallbackModel = this.createFallbackModel();
    this.visualModel = this.fallbackModel;
    this.visualRoot.add(this.fallbackModel);

    this.scene.add(this.group);
    this.loadVisualModel();
  }

  createFallbackModel() {
    const group = new THREE.Group();
    const torsoColor = this.type === 'STRONG' ? 0x4b5f42 : this.type === 'FAST' ? 0x4d7658 : 0x556c4a;
    const skinColor = this.type === 'FAST' ? 0x779272 : 0x7d8f6a;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 1.1, 12),
      new THREE.MeshLambertMaterial({ color: torsoColor })
    );
    body.position.y = -0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const shoulders = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.18, 0.32),
      new THREE.MeshLambertMaterial({ color: torsoColor })
    );
    shoulders.position.y = 0.02;
    shoulders.castShadow = true;
    shoulders.receiveShadow = true;
    group.add(shoulders);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    head.position.y = 0.52;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    group.rotation.y = Math.PI;
    return group;
  }

  async loadVisualModel() {
    try {
      const instance = await zombieAssetLibrary.createInstance(this.type);
      if (this.isRemoved) return;

      this.currentVariant = instance.variantId;
      this.setVisualModel(instance.root, instance);
      this.setupAnimations(instance.root, instance.animations, instance.definition.preferredClips);
      this.syncAnimationToState(false, true);
    } catch (error) {
      // Keep the procedural fallback active if a local asset fails to load.
    }
  }

  setVisualModel(root, instanceMeta) {
    if (this.visualModel && this.visualModel !== this.fallbackModel) {
      this.visualRoot.remove(this.visualModel);
    }

    const scale = instanceMeta.definition.baseScale * this.variantScale;
    root.scale.setScalar(scale);
    root.rotation.y = Math.PI;
    root.position.set(0, -this.position.y - (instanceMeta.minY * scale), 0);
    root.updateMatrixWorld(true);

    this.visualModel = root;
    this.visualRoot.add(root);

    if (this.fallbackModel.parent) {
      this.visualRoot.remove(this.fallbackModel);
    }
  }

  setupAnimations(root, clips, preferredClips) {
    this.disposeMixer();
    if (!clips || clips.length === 0) return;

    this.mixer = new THREE.AnimationMixer(root);
    this.mixer.addEventListener('finished', (event) => this.onAnimationFinished(event));

    this.actions = {};
    const mappedClips = {
      idle: this.findClip(clips, preferredClips.idle),
      move: this.findClip(clips, preferredClips.move),
      attack: this.findClip(clips, preferredClips.attack),
      hit: this.findClip(clips, preferredClips.hit),
      death: this.findClip(clips, preferredClips.death)
    };

    for (const [state, clip] of Object.entries(mappedClips)) {
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = state === 'attack' || state === 'hit' || state === 'death';
      action.setLoop(
        state === 'attack' || state === 'hit' || state === 'death' ? THREE.LoopOnce : THREE.LoopRepeat,
        state === 'attack' || state === 'hit' || state === 'death' ? 1 : Infinity
      );
      this.actions[state] = action;
    }
  }

  findClip(clips, preferences) {
    const lookup = new Map(clips.map((clip) => [clip.name.toLowerCase(), clip]));
    for (const name of preferences) {
      const clip = lookup.get(name.toLowerCase());
      if (clip) return clip;
    }

    const lowered = preferences.map((name) => name.toLowerCase());
    return clips.find((clip) => lowered.some((name) => clip.name.toLowerCase().includes(name))) || null;
  }

  onAnimationFinished(event) {
    const finishedAction = event.action;
    if (this.animationLock && this.actions[this.animationLock] === finishedAction) {
      if (this.animationLock === 'death') {
        this.currentAnimation = 'death';
        return;
      }

      this.animationLock = null;
      this.syncAnimationToState(this.isChasing, true);
    }
  }

  playAnimation(name, force = false) {
    const nextAction = this.actions[name];
    if (!nextAction) return;
    if (!force && this.currentAnimation === name) return;

    const previousAction = this.actions[this.currentAnimation];
    this.currentAnimation = name;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(0.15);
    }

    nextAction.reset();
    nextAction.paused = false;
    nextAction.enabled = true;
    nextAction.timeScale = this.getAnimationTimeScale(name);
    nextAction.fadeIn(0.15);
    nextAction.play();
  }

  getAnimationTimeScale(name) {
    if (name !== 'move') return 1;
    if (this.type === 'FAST' || this.currentVariant === 'arm') return 1.25;
    if (this.type === 'STRONG' || this.currentVariant === 'chubby') return 0.82;
    if (this.currentVariant === 'ribcage') return 0.92;
    return 1;
  }

  syncAnimationToState(isMoving = false, force = false) {
    if (!this.mixer || this.animationLock === 'death') return;
    if (!force && this.animationLock) return;

    if (this.isDead) {
      this.animationLock = 'death';
      this.playAnimation('death', true);
      return;
    }

    this.playAnimation(isMoving ? 'move' : 'idle', force);
  }

  update(deltaTime, player) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    if (this.isDead) {
      this.deathTime += deltaTime;
      if (this.deathTime > 2) {
        this.remove();
      }
      return;
    }

    this.isChasing = false;
    const distanceToPlayer = this.position.distanceTo(player.position);
    if (distanceToPlayer < 80) {
      const directionToPlayer = new THREE.Vector3();
      directionToPlayer.subVectors(player.position, this.position);
      directionToPlayer.normalize();

      this.velocity.copy(directionToPlayer).multiplyScalar(this.config.speed * deltaTime);
      this.position.add(this.velocity);
      this.group.position.copy(this.position);
      this.isChasing = true;

      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;

      if (distanceToPlayer < this.config.attackRange && this.attackCooldown <= 0) {
        this.attack(player);
      }
    }

    this.attackCooldown -= deltaTime;
    this.syncAnimationToState(this.isChasing);
  }

  attack(player) {
    this.isAttacking = true;
    this.attackCooldown = this.config.attackCooldown;
    player.takeDamage(this.config.damage);
    audioManager.playSound('zombie_groan');
    if (this.actions.attack) {
      this.animationLock = 'attack';
      this.playAnimation('attack', true);
    }
    this.isAttacking = false;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    } else {
      audioManager.playSound('hit');
      if (this.actions.hit) {
        this.animationLock = 'hit';
        this.playAnimation('hit', true);
      }
    }
  }

  die() {
    this.isDead = true;
    this.deathTime = 0;
    audioManager.playSound('death');
    this.syncAnimationToState(false, true);
  }

  disposeMixer() {
    if (!this.mixer) return;
    this.mixer.stopAllAction();
    const root = this.mixer.getRoot();
    this.mixer.uncacheRoot(root);
    this.mixer = null;
    this.actions = {};
    this.animationLock = null;
    this.currentAnimation = '';
  }

  remove() {
    if (this.isRemoved) return;
    this.isRemoved = true;
    this.disposeMixer();
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
    zombieAssetLibrary.preload();
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

window.Zombie = Zombie;
window.ZombieManager = ZombieManager;
