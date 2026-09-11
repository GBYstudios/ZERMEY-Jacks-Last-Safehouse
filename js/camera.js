class Camera {
  constructor() {
    this.distanceBehind = 8;
    this.height = 4;
    this.lookAheadDistance = 12;
    this.positionSmoothing = 0.15;
    this.rotationSmoothing = 0.08;
    this.mouseSensitivity = 0.0025;
    this.maxPitch = Math.PI / 3;
    this.currentDirection = new THREE.Vector3(0, 0, -1);
    this.mouseYaw = 0;
    this.mousePitch = 0.08;
    this.isMouseLocked = false;
    this.mouseControlsAttached = false;
  }

  setMouseSensitivity(value) {
    this.mouseSensitivity = Math.max(0.0005, Math.min(0.01, Number(value)));
  }

  attachMouseControls(element) {
    if (this.mouseControlsAttached || !element) return;
    this.mouseControlsAttached = true;

    element.addEventListener('click', () => {
      if (document.pointerLockElement !== element && element.requestPointerLock) {
        element.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isMouseLocked = document.pointerLockElement === element;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isMouseLocked) return;

      this.mouseYaw -= event.movementX * this.mouseSensitivity;
      this.mousePitch -= event.movementY * this.mouseSensitivity;
      this.mousePitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.mousePitch));
    });
  }

  getViewDirection() {
    return new THREE.Vector3(
      Math.sin(this.mouseYaw),
      0,
      -Math.cos(this.mouseYaw)
    ).normalize();
  }

  getMovementBasis() {
    const forward = this.currentDirection.clone();
    if (forward.lengthSq() === 0) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();
    return { forward, right };
  }

  update(playerPosition, playerDirection, camera) {
    const canvas = camera?.domElement || document.querySelector('#game-canvas-container canvas, canvas');
    this.attachMouseControls(canvas);
    const desiredDirection = this.getViewDirection();
    this.currentDirection.lerp(desiredDirection, this.rotationSmoothing);
    this.currentDirection.normalize();
    const viewDirection = this.currentDirection.clone();

    const targetPosition = playerPosition.clone()
      .addScaledVector(viewDirection, -this.distanceBehind);
    targetPosition.y += this.height;
    camera.position.lerp(targetPosition, this.positionSmoothing);

    const lookTarget = playerPosition.clone()
      .addScaledVector(viewDirection, this.lookAheadDistance);
    lookTarget.y += 1.5 + this.mousePitch * 5;
    camera.lookAt(lookTarget);
  }
}

window.Camera = Camera;
