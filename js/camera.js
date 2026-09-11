class Camera {
  constructor() {
    this.offset = new THREE.Vector3(0, 3, 5);
    this.smoothing = 0.1;
  }
  
  update(playerPosition, playerDirection, camera) {
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(playerPosition);
    targetPosition.y += this.offset.y;
    
    const sideways = new THREE.Vector3(-playerDirection.z, 0, playerDirection.x);
    targetPosition.addScaledVector(playerDirection, this.offset.z);
    targetPosition.addScaledVector(sideways, 0);
    
    camera.position.lerp(targetPosition, this.smoothing);
    camera.lookAt(playerPosition.x, playerPosition.y + 1, playerPosition.z);
  }
}
