class Camera {
  constructor() {
    this.height = 2.4;
    this.lookAheadDistance = 12;
    this.smoothing = 0.15;
  }

  update(playerPosition, playerDirection, camera) {
    const direction = playerDirection.clone();
    direction.y = 0;

    if (direction.lengthSq() === 0) {
      direction.set(0, 0, -1);
    } else {
      direction.normalize();
    }

    // Place the camera at the player's eye level and aim it in the
    // direction the player is moving, instead of looking back at the player.
    const targetPosition = playerPosition.clone();
    targetPosition.y += this.height;
    camera.position.lerp(targetPosition, this.smoothing);

    const lookTarget = targetPosition.clone().addScaledVector(direction, this.lookAheadDistance);
    camera.lookAt(lookTarget);
  }
}

window.Camera = Camera;
