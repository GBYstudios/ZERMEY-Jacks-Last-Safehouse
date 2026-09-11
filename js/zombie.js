const ZOMBIE_RENDER_HEIGHT = 1;
const ZOMBIE_DETECTION_RANGE = 80;
const ZOMBIE_MODEL_VARIANTS = {
  NORMAL: {
    path: './assets/models/zombies/zombie_basic.glb',
    scale: 1,
    posture: 0.12,
    sway: 0.06,
    tint: 0xb7c5a1,
    accent: 0x7e1212,
    cloth: 0x5b5950,
    movementClip: 'Walk',
    attackClip: 'Idle_Attack'
  },
  FAST: {
    path: './assets/models/zombies/zombie_ribcage.glb',
    scale: 1.25,
    posture: 0.24,
    sway: 0.09,
    tint: 0xa7bf92,
    accent: 0x8e1f19,
    cloth: 0x3f433d,
    movementClip: 'Run',
    attackClip: 'Run_Attack'
  },
  STRONG: {
    path: './assets/models/zombies/zombie_chubby.glb',
    scale: 0.84,
    posture: 0.08,
    sway: 0.04,
    tint: 0x9aac87,
    accent: 0x5f1014,
    cloth: 0x413a35,
    movementClip: 'Walk',
    attackClip: 'Punch'
  }
};

class ZombieAssetLibrary {
  static preload() {
    const loads = [];
    for (const variant of Object.values(ZOMBIE_MODEL_VARIANTS)) {
      if (!this.templatePromises.has(variant.path)) {
        loads.push(this.loadTemplate(variant.path));
      }
    }

    return Promise.allSettled(loads);
  }

  static loadTemplate(path) {
    if (!this.templatePromises.has(path)) {
      const loadPromise = Promise.resolve()
        .then(() => {
          const loader = this.getLoader();
          return new Promise((resolve, reject) => {
            loader.load(
              path,
              (gltf) => {
                resolve({
                  scene: gltf.scene,
                  animations: gltf.animations || []
                });
              },
              undefined,
              reject
            );
          });
        })
        .catch((error) => {
        console.warn(`Failed to load zombie asset at ${path}. Using procedural fallback.`, error);
        this.templatePromises.delete(path);
        throw error;
      });

      this.templatePromises.set(path, loadPromise);
    }

    return this.templatePromises.get(path);
  }

  static async createInstance(type) {
    const variant = this.getVariant(type);
    const template = await this.loadTemplate(variant.path);

    return {
      root: THREE.SkeletonUtils.clone(template.scene),
      animations: template.animations,
      variant
    };
  }

  static getLoader() {
    if (!this.loader) {
      if (!THREE.GLTFLoader || !THREE.SkeletonUtils || typeof THREE.SkeletonUtils.clone !== 'function') {
        throw new Error('THREE.GLTFLoader or THREE.SkeletonUtils is unavailable');
      }
      this.loader = new THREE.GLTFLoader();
    }

    return this.loader;
  }

  static getVariant(type) {
    return ZOMBIE_MODEL_VARIANTS[type] || ZOMBIE_MODEL_VARIANTS.NORMAL;
  }
}

ZombieAssetLibrary.loader = null;
ZombieAssetLibrary.templatePromises = new Map();

class Zombie {
  constructor(scene, position, type = 'NORMAL') {
    this.scene = scene;
    this.position = position.clone();
    this.position.y = ZOMBIE_RENDER_HEIGHT;
    this.type = type;
    this.config = CONFIG.ZOMBIE_TYPES[type];
    this.visualConfig = ZombieAssetLibrary.getVariant(type);
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.velocity = new THREE.Vector3();
    this.target = null;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.isDead = false;
    this.deathTime = 0;
    this.cleanupDelay = 2;
    this.removed = false;
    this.animationTime = Math.random() * Math.PI * 2;
    this.attackAnimationTime = 0;
    this.hitAnimationTime = 0;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.currentActionName = '';
    this.modelRoot = null;
    this.fallbackParts = null;
    this.disposableMaterials = [];
    this.disposableGeometries = [];

    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.renderRoot = new THREE.Group();
    this.renderRoot.position.y = -ZOMBIE_RENDER_HEIGHT;
    this.animationRoot = new THREE.Group();
    this.renderRoot.add(this.animationRoot);
    this.group.add(this.renderRoot);
    this.scene.add(this.group);

    this.createModel();
  }

  createModel() {
    this.applyRenderable(this.createProceduralFallback(), false);

    ZombieAssetLibrary.createInstance(this.type)
      .then((instance) => {
        if (this.removed) return;
        this.applyRenderable(instance.root, true, instance.animations);
      })
      .catch(() => {
        // Fallback already active.
      });
  }

  applyRenderable(root, useLoadedModel, animations = []) {
    this.teardownRenderable();
    this.modelRoot = root;
    this.animationRoot.add(root);

    if (useLoadedModel) {
      this.setupLoadedModel(root, animations);
    } else {
      this.setupFallbackModel(root);
    }
  }

  setupLoadedModel(root, animations) {
    root.scale.setScalar(this.visualConfig.scale);
    root.rotation.y = Math.PI;
    this.centerAndGround(root);
    this.applySharedVisualSettings(root);
    this.applySurfaceVariation(root);
    this.attachZombieDetails(root);
    this.configureAnimations(root, animations);
    this.setAnimationState('idle', true);
  }

  setupFallbackModel(root) {
    this.fallbackParts = root.userData.fallbackParts || null;
    this.applySharedVisualSettings(root);
  }

  centerAndGround(root) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);

    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= bounds.min.y;
  }

  applySharedVisualSettings(root) {
    root.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
    });
  }

  applySurfaceVariation(root) {
    const skinTint = new THREE.Color(this.visualConfig.tint);
    const clothTint = new THREE.Color(this.visualConfig.cloth);
    const accentTint = new THREE.Color(this.visualConfig.accent);

    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => this.cloneZombieMaterial(material, child.name, skinTint, clothTint, accentTint));
        return;
      }

      child.material = this.cloneZombieMaterial(child.material, child.name, skinTint, clothTint, accentTint);
    });
  }

  cloneZombieMaterial(material, meshName, skinTint, clothTint, accentTint) {
    const cloned = material.clone();
    this.disposableMaterials.push(cloned);

    if (cloned.color) {
      const lowerName = (meshName || '').toLowerCase();
      let targetTint = skinTint;

      if (lowerName.includes('eyelid')) {
        targetTint = accentTint;
      } else if (lowerName.includes('body')) {
        targetTint = clothTint;
      }

      cloned.color.lerp(targetTint, 0.35);
    }

    if ('roughness' in cloned) cloned.roughness = Math.min(1, (cloned.roughness ?? 0.8) + 0.15);
    if ('metalness' in cloned) cloned.metalness = 0;
    if (cloned.emissive) cloned.emissive.setHex(0x000000);

    return cloned;
  }

  attachZombieDetails(root) {
    const head = root.getObjectByName('Head');
    const torso = root.getObjectByName('Torso') || root.getObjectByName('Body');
    const shoulder = root.getObjectByName(this.type === 'STRONG' ? 'Shoulder.R' : 'Shoulder.L');

    if (head) {
      const eyeGeometry = new THREE.SphereGeometry(0.035, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x0d0a0a, roughness: 1 });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      const rightEye = new THREE.Mesh(eyeGeometry.clone(), eyeMaterial.clone());
      const cheekWound = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: this.visualConfig.accent, roughness: 1 })
      );

      leftEye.position.set(-0.075, 0.03, 0.12);
      rightEye.position.set(0.075, 0.03, 0.12);
      cheekWound.position.set(this.type === 'FAST' ? -0.11 : 0.11, -0.05, 0.11);
      cheekWound.rotation.z = this.type === 'FAST' ? -0.5 : 0.45;

      this.trackDisposableDetail(leftEye);
      this.trackDisposableDetail(rightEye);
      this.trackDisposableDetail(cheekWound);

      head.add(leftEye);
      head.add(rightEye);
      head.add(cheekWound);
    }

    if (torso) {
      const clothFlap = new THREE.Mesh(
        new THREE.PlaneGeometry(this.type === 'STRONG' ? 0.28 : 0.22, this.type === 'FAST' ? 0.34 : 0.28),
        new THREE.MeshStandardMaterial({
          color: this.visualConfig.cloth,
          roughness: 1,
          side: THREE.DoubleSide
        })
      );
      const chestWound = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.05, 0.03),
        new THREE.MeshStandardMaterial({ color: this.visualConfig.accent, roughness: 1 })
      );

      clothFlap.position.set(this.type === 'FAST' ? -0.08 : 0.09, -0.12, 0.14);
      clothFlap.rotation.set(0.2, 0.25, this.type === 'FAST' ? 0.6 : -0.4);
      chestWound.position.set(this.type === 'STRONG' ? -0.14 : 0.12, 0.05, 0.11);
      chestWound.rotation.y = 0.35;

      this.trackDisposableDetail(clothFlap);
      this.trackDisposableDetail(chestWound);

      torso.add(clothFlap);
      torso.add(chestWound);
    }

    if (shoulder) {
      const shoulderSlash = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.04, 0.03),
        new THREE.MeshStandardMaterial({ color: this.visualConfig.accent, roughness: 1 })
      );

      shoulderSlash.position.set(0.02, 0.05, 0.08);
      shoulderSlash.rotation.z = this.type === 'STRONG' ? -0.25 : 0.35;
      this.trackDisposableDetail(shoulderSlash);
      shoulder.add(shoulderSlash);
    }
  }

  trackDisposableDetail(mesh) {
    if (mesh.geometry) this.disposableGeometries.push(mesh.geometry);
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        this.disposableMaterials.push(...mesh.material);
      } else {
        this.disposableMaterials.push(mesh.material);
      }
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  configureAnimations(root, animations) {
    if (!animations.length) return;

    this.mixer = new THREE.AnimationMixer(root);
    const clipsByName = new Map();

    for (const clip of animations) {
      clipsByName.set(clip.name, clip);
    }

    this.actions = {
      idle: this.createAnimationAction(clipsByName.get('Idle')),
      walk: this.createAnimationAction(clipsByName.get('Walk')),
      run: this.createAnimationAction(clipsByName.get('Run')),
      attack: this.createAnimationAction(
        clipsByName.get(this.visualConfig.attackClip) ||
        clipsByName.get('Punch') ||
        clipsByName.get('Idle_Attack') ||
        clipsByName.get('Run_Attack'),
        true
      ),
      hit: this.createAnimationAction(clipsByName.get('HitReact'), true),
      death: this.createAnimationAction(clipsByName.get('Death'), true)
    };
  }

  createAnimationAction(clip, loopOnce = false) {
    if (!clip || !this.mixer) return null;

    const action = this.mixer.clipAction(clip);
    action.enabled = true;

    if (loopOnce) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    return action;
  }

  setAnimationState(state, force = false) {
    const nextAction = this.actions[state];
    if (!nextAction) return;
    if (!force && this.currentActionName === state) return;

    const previousAction = this.currentAction;
    this.currentAction = nextAction;
    this.currentActionName = state;

    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(0.12);
    }

    nextAction.reset();
    nextAction.fadeIn(0.12);
    nextAction.play();
  }

  update(deltaTime, player) {
    this.animationTime += deltaTime * (2 + this.config.speed * 0.2);
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    if (this.isDead) {
      this.deathTime += deltaTime;
      this.updatePose(deltaTime, false);
      if (this.deathTime > this.cleanupDelay) {
        this.remove();
      }
      return;
    }

    const distanceToPlayer = this.position.distanceTo(player.position);
    let isMoving = false;

    if (distanceToPlayer < ZOMBIE_DETECTION_RANGE) {
      const directionToPlayer = new THREE.Vector3();
      directionToPlayer.subVectors(player.position, this.position);
      directionToPlayer.normalize();

      this.velocity.copy(directionToPlayer).multiplyScalar(this.config.speed * deltaTime);
      this.position.add(this.velocity);
      this.position.y = ZOMBIE_RENDER_HEIGHT;
      this.group.position.copy(this.position);

      const targetRotation = Math.atan2(directionToPlayer.x, -directionToPlayer.z);
      this.group.rotation.y += (targetRotation - this.group.rotation.y) * 0.1;
      isMoving = distanceToPlayer > this.config.attackRange * 0.85;

      if (distanceToPlayer < this.config.attackRange && this.attackCooldown <= 0) {
        this.attack(player);
      }
    }

    this.attackCooldown -= deltaTime;
    this.attackAnimationTime = Math.max(0, this.attackAnimationTime - deltaTime);
    this.hitAnimationTime = Math.max(0, this.hitAnimationTime - deltaTime);
    if (this.attackAnimationTime <= 0) this.isAttacking = false;

    this.updateAnimationState(isMoving);
    this.updatePose(deltaTime, isMoving);
  }

  updateAnimationState(isMoving) {
    if (this.isDead) {
      this.setAnimationState('death');
      return;
    }

    if (this.hitAnimationTime > 0 && this.actions.hit) {
      this.setAnimationState('hit');
      return;
    }

    if (this.attackAnimationTime > 0 && this.actions.attack) {
      this.setAnimationState('attack');
      return;
    }

    if (isMoving) {
      const movementState = this.visualConfig.movementClip === 'Run' && this.actions.run ? 'run' : 'walk';
      this.setAnimationState(movementState);
      return;
    }

    this.setAnimationState('idle');
  }

  updatePose(deltaTime, isMoving) {
    const moveBlend = isMoving && !this.isDead ? 1 : 0.15;
    const bob = Math.sin(this.animationTime * (this.visualConfig.movementClip === 'Run' ? 2.1 : 1.4)) * 0.05 * moveBlend;
    const sway = Math.sin(this.animationTime * 0.7) * this.visualConfig.sway;
    const attackLean = this.attackAnimationTime > 0 ? 0.22 : 0;
    const hitLean = this.hitAnimationTime > 0 ? -0.14 : 0;
    const deathLean = this.isDead ? -1.1 : 0;
    const targetLean = -(this.visualConfig.posture + attackLean + hitLean) + deathLean;
    const lerpFactor = 1 - Math.pow(0.001, deltaTime);

    this.animationRoot.position.y += (bob - this.animationRoot.position.y) * lerpFactor;
    this.animationRoot.rotation.z += (targetLean - this.animationRoot.rotation.z) * lerpFactor;
    this.animationRoot.rotation.x += (sway - this.animationRoot.rotation.x) * lerpFactor;

    if (this.fallbackParts) {
      const stride = Math.sin(this.animationTime * (this.visualConfig.movementClip === 'Run' ? 4.4 : 3.1)) * 0.55 * moveBlend;
      this.fallbackParts.leftArm.rotation.x = -stride - attackLean * 2;
      this.fallbackParts.rightArm.rotation.x = stride - attackLean * 2;
      this.fallbackParts.leftLeg.rotation.x = stride;
      this.fallbackParts.rightLeg.rotation.x = -stride;
      this.fallbackParts.head.rotation.z = Math.sin(this.animationTime * 1.1) * 0.08 + hitLean * 0.35;
      this.fallbackParts.torso.rotation.y = Math.sin(this.animationTime * 0.55) * 0.08;
    }
  }

  attack(player) {
    this.isAttacking = true;
    this.attackCooldown = this.config.attackCooldown;
    this.attackAnimationTime = this.getActionDuration(this.actions.attack, 0.65);
    player.takeDamage(this.config.damage);
    audioManager.playSound('zombie_groan');
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.health -= amount;
    this.position.y = ZOMBIE_RENDER_HEIGHT;
    this.group.position.copy(this.position);

    if (this.health <= 0) {
      this.die();
    } else {
      this.hitAnimationTime = this.getActionDuration(this.actions.hit, 0.35);
      audioManager.playSound('hit');
    }
  }

  getActionDuration(action, fallbackDuration) {
    if (!action) return fallbackDuration;
    const clip = action.getClip();
    return clip && clip.duration ? clip.duration : fallbackDuration;
  }

  die() {
    this.isDead = true;
    this.isAttacking = false;
    this.deathTime = 0;
    this.hitAnimationTime = 0;
    this.attackAnimationTime = 0;
    this.position.y = ZOMBIE_RENDER_HEIGHT;
    this.group.position.copy(this.position);
    this.setAnimationState('death', true);
    audioManager.playSound('death');
  }

  teardownRenderable() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      if (this.modelRoot) {
        this.mixer.uncacheRoot(this.modelRoot);
      }
      this.mixer = null;
    }

    this.actions = {};
    this.currentAction = null;
    this.currentActionName = '';
    this.fallbackParts = null;

    if (this.modelRoot) {
      this.animationRoot.remove(this.modelRoot);
      this.modelRoot = null;
    }

    for (const material of this.disposableMaterials) {
      if (material && typeof material.dispose === 'function') {
        material.dispose();
      }
    }

    for (const geometry of this.disposableGeometries) {
      if (geometry && typeof geometry.dispose === 'function') {
        geometry.dispose();
      }
    }

    this.disposableMaterials = [];
    this.disposableGeometries = [];
  }

  remove() {
    if (this.removed) return;
    this.removed = true;
    this.teardownRenderable();
    this.scene.remove(this.group);
  }

  createProceduralFallback() {
    const group = new THREE.Group();
    const fallbackParts = {};
    const skinMaterial = this.registerFallbackMaterial(new THREE.MeshStandardMaterial({
      color: this.visualConfig.tint,
      roughness: 0.95,
      metalness: 0
    }));
    const headMaterial = this.registerFallbackMaterial(new THREE.MeshStandardMaterial({
      color: this.visualConfig.tint,
      roughness: 1,
      metalness: 0
    }));
    const clothMaterial = this.registerFallbackMaterial(new THREE.MeshStandardMaterial({
      color: this.visualConfig.cloth,
      roughness: 1
    }));
    const woundMaterial = this.registerFallbackMaterial(new THREE.MeshStandardMaterial({
      color: this.visualConfig.accent,
      roughness: 1
    }));
    const socketMaterial = this.registerFallbackMaterial(new THREE.MeshStandardMaterial({
      color: 0x120d0d,
      roughness: 1
    }));

    const hips = new THREE.Group();
    hips.position.y = 0.95;
    group.add(hips);

    const torsoPivot = new THREE.Group();
    fallbackParts.torso = torsoPivot;
    hips.add(torsoPivot);

    const torso = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(0.5, 0.72, 0.28)), clothMaterial);
    torso.position.y = 0.3;
    torso.castShadow = true;
    torso.receiveShadow = true;
    torsoPivot.add(torso);

    const chest = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(0.42, 0.34, 0.26)), skinMaterial);
    chest.position.set(0, 0.25, 0.05);
    chest.castShadow = true;
    chest.receiveShadow = true;
    torsoPivot.add(chest);

    const tornCloth = new THREE.Mesh(this.registerFallbackGeometry(new THREE.PlaneGeometry(0.3, 0.34)), clothMaterial);
    tornCloth.position.set(this.type === 'FAST' ? -0.08 : 0.07, 0.16, 0.16);
    tornCloth.rotation.set(0.25, 0.18, this.type === 'FAST' ? 0.5 : -0.35);
    tornCloth.castShadow = true;
    tornCloth.receiveShadow = true;
    torsoPivot.add(tornCloth);

    const chestWound = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(0.15, 0.05, 0.03)), woundMaterial);
    chestWound.position.set(this.type === 'STRONG' ? -0.13 : 0.1, 0.3, 0.15);
    chestWound.rotation.y = 0.35;
    chestWound.castShadow = true;
    torsoPivot.add(chestWound);

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.74;
    fallbackParts.head = headPivot;
    torsoPivot.add(headPivot);

    const head = new THREE.Mesh(this.registerFallbackGeometry(new THREE.SphereGeometry(0.18, 14, 14)), headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    headPivot.add(head);

    const jaw = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(0.18, 0.08, 0.14)), skinMaterial);
    jaw.position.set(0, -0.1, 0.03);
    jaw.rotation.x = 0.22;
    jaw.castShadow = true;
    headPivot.add(jaw);

    const leftEye = new THREE.Mesh(this.registerFallbackGeometry(new THREE.SphereGeometry(0.038, 8, 8)), socketMaterial);
    leftEye.position.set(-0.07, 0.03, 0.13);
    const rightEye = leftEye.clone();
    rightEye.geometry = this.registerFallbackGeometry(new THREE.SphereGeometry(0.038, 8, 8));
    leftEye.castShadow = true;
    rightEye.castShadow = true;
    rightEye.position.x = 0.07;
    headPivot.add(leftEye);
    headPivot.add(rightEye);

    const scalpWound = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(0.11, 0.04, 0.03)), woundMaterial);
    scalpWound.position.set(this.type === 'FAST' ? -0.11 : 0.1, 0.1, 0.08);
    scalpWound.rotation.z = this.type === 'FAST' ? -0.55 : 0.4;
    scalpWound.castShadow = true;
    headPivot.add(scalpWound);

    const leftArm = this.createFallbackLimb(0.25, 0.62, skinMaterial, clothMaterial);
    leftArm.position.set(-0.34, 0.58, 0);
    leftArm.rotation.z = 0.18;
    fallbackParts.leftArm = leftArm;
    torsoPivot.add(leftArm);

    const rightArm = this.createFallbackLimb(0.24, 0.64, skinMaterial, clothMaterial);
    rightArm.position.set(0.34, 0.58, 0);
    rightArm.rotation.z = -0.28;
    fallbackParts.rightArm = rightArm;
    torsoPivot.add(rightArm);

    const leftLeg = this.createFallbackLeg(0.13, 0.72, skinMaterial, clothMaterial);
    leftLeg.position.set(-0.16, -0.02, 0);
    fallbackParts.leftLeg = leftLeg;
    hips.add(leftLeg);

    const rightLeg = this.createFallbackLeg(0.13, 0.72, skinMaterial, clothMaterial);
    rightLeg.position.set(0.16, -0.02, 0);
    fallbackParts.rightLeg = rightLeg;
    hips.add(rightLeg);

    if (this.type === 'FAST') {
      const ribcage = new THREE.Mesh(
        this.registerFallbackGeometry(new THREE.TorusGeometry(0.15, 0.045, 8, 14, Math.PI * 1.35)),
        this.registerFallbackMaterial(boneTint(woundMaterial))
      );
      ribcage.position.set(0, 0.28, 0.11);
      ribcage.rotation.set(Math.PI / 2, 0, 0.2);
      ribcage.castShadow = true;
      torsoPivot.add(ribcage);
    }

    if (this.type === 'STRONG') {
      const belly = new THREE.Mesh(this.registerFallbackGeometry(new THREE.SphereGeometry(0.24, 14, 12)), clothMaterial);
      belly.scale.set(1, 0.8, 0.78);
      belly.position.set(0, 0.1, 0.02);
      belly.castShadow = true;
      belly.receiveShadow = true;
      torsoPivot.add(belly);
    }

    group.userData.fallbackParts = fallbackParts;
    return group;

    function boneTint(material) {
      const clone = material.clone();
      clone.color.lerp(new THREE.Color(0xc0b49c), 0.65);
      return clone;
    }
  }

  createFallbackLimb(radius, length, skinMaterial, clothMaterial) {
    const pivot = new THREE.Group();
    const upper = new THREE.Mesh(this.registerFallbackGeometry(new THREE.CapsuleGeometry(radius, length * 0.46, 5, 10)), clothMaterial);
    const lower = new THREE.Mesh(this.registerFallbackGeometry(new THREE.CapsuleGeometry(radius * 0.82, length * 0.42, 5, 10)), skinMaterial);
    const hand = new THREE.Mesh(this.registerFallbackGeometry(new THREE.SphereGeometry(radius * 0.95, 8, 8)), skinMaterial);

    upper.position.y = -length * 0.22;
    lower.position.y = -length * 0.6;
    lower.rotation.z = 0.08;
    hand.position.y = -length * 0.92;

    upper.castShadow = true;
    upper.receiveShadow = true;
    lower.castShadow = true;
    lower.receiveShadow = true;
    hand.castShadow = true;
    hand.receiveShadow = true;

    pivot.add(upper);
    pivot.add(lower);
    pivot.add(hand);
    return pivot;
  }

  createFallbackLeg(radius, length, skinMaterial, clothMaterial) {
    const pivot = new THREE.Group();
    const thigh = new THREE.Mesh(this.registerFallbackGeometry(new THREE.CapsuleGeometry(radius, length * 0.44, 5, 10)), clothMaterial);
    const shin = new THREE.Mesh(this.registerFallbackGeometry(new THREE.CapsuleGeometry(radius * 0.88, length * 0.4, 5, 10)), skinMaterial);
    const foot = new THREE.Mesh(this.registerFallbackGeometry(new THREE.BoxGeometry(radius * 1.5, radius * 0.8, radius * 2.6)), clothMaterial);

    thigh.position.y = -length * 0.2;
    shin.position.y = -length * 0.58;
    shin.rotation.z = -0.04;
    foot.position.set(0, -length * 0.94, radius * 0.5);

    thigh.castShadow = true;
    thigh.receiveShadow = true;
    shin.castShadow = true;
    shin.receiveShadow = true;
    foot.castShadow = true;
    foot.receiveShadow = true;

    pivot.add(thigh);
    pivot.add(shin);
    pivot.add(foot);
    return pivot;
  }

  registerFallbackGeometry(geometry) {
    this.disposableGeometries.push(geometry);
    return geometry;
  }

  registerFallbackMaterial(material) {
    this.disposableMaterials.push(material);
    return material;
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

    ZombieAssetLibrary.preload();
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
      const position = new THREE.Vector3(x, ZOMBIE_RENDER_HEIGHT, z);

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
      if (this.zombies[i].isDead && this.zombies[i].deathTime > this.zombies[i].cleanupDelay) {
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
        const facingDot = THREE.MathUtils.clamp(toZombie.normalize().dot(direction), -1, 1);
        const angle = Math.acos(facingDot);
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
