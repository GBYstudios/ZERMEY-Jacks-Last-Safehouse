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

  update(playerPosition, playerDirection, camera) {
    // Attach to the game's canvas automatically, so game.js needs no extra setup.
    const canvas = camera?.domElement || document.querySelector('#game-canvas-container canvas, canvas');
    this.attachMouseControls(canvas);

    const direction = playerDirection.clone();
    direction.y = 0;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.currentDirection.lerp(direction, this.rotationSmoothing);
      this.currentDirection.normalize();
    }

    // Add mouse yaw to the player's facing direction.
    const baseAngle = Math.atan2(this.currentDirection.x, -this.currentDirection.z);
    const cameraAngle = baseAngle + this.mouseYaw;
    const viewDirection = new THREE.Vector3(
      Math.sin(cameraAngle),
      0,
      -Math.cos(cameraAngle)
    );

    // Third-person camera stays behind the player and turns smoothly.
    const targetPosition = playerPosition.clone()
      .addScaledVector(viewDirection, -this.distanceBehind);
    targetPosition.y += this.height;
    camera.position.lerp(targetPosition, this.positionSmoothing);

    // Look ahead so the player can see in front of themselves.
    const lookTarget = playerPosition.clone()
      .addScaledVector(viewDirection, this.lookAheadDistance);
    lookTarget.y += 1.5 + this.mousePitch * 5;
    camera.lookAt(lookTarget);
  }
}

window.Camera = Camera;
