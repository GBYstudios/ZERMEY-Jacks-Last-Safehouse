class Camera {
  constructor() {
    this.offset = new THREE.Vector3(0, 3, 5);
    this.smoothing = 0.1;
  }
  
  update(playerPosition, playerDirection, camera) {
    // Position camera behind and above player
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(playerPosition);
    targetPosition.y += this.offset.y;
    
    // Offset based on player direction
    const sideways = new THREE.Vector3(-playerDirection.z, 0, playerDirection.x);
    targetPosition.addScaledVector(playerDirection, this.offset.z);
    targetPosition.addScaledVector(sideways, 0);
    
    // Smooth camera movement
    camera.position.lerp(targetPosition, this.smoothing);
    
    // Look at player
    camera.lookAt(playerPosition.x, playerPosition.y + 1, playerPosition.z);
  }
}
