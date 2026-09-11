class CombatSystem {
  constructor() {
    this.isAttacking = false;
    this.lastAttackTime = 0;
  }
  
  performAttack(player, zombieManager, gameState) {
    // Can only attack if punch is pressed
    if (player.isPunching) {
      // Get zombie in front of player
      const zombie = zombieManager.getZombieInFrontOf(
        player.position,
        player.direction,
        CONFIG.PLAYER_PUNCH_RANGE
      );
      
      if (zombie) {
        this.hitZombie(zombie, player, gameState);
      }
    }
  }
  
  hitZombie(zombie, player, gameState) {
    zombie.takeDamage(CONFIG.PLAYER_PUNCH_DAMAGE);
    
    if (zombie.isDead) {
      gameState.statistics.zombiesDefeated++;
      // Drop items randomly
      if (Math.random() < 0.3) {
        const items = ['food', 'medkits', 'batteries', 'materials'];
        gameState.inventory[items[Math.floor(Math.random() * items.length)]]++;
      }
    }
    
    // Knock back
    const knockback = new THREE.Vector3();
    knockback.subVectors(zombie.position, player.position);
    knockback.normalize();
    knockback.multiplyScalar(CONFIG.ZOMBIE_KNOCK_DISTANCE);
    zombie.position.add(knockback);
    zombie.group.position.copy(zombie.position);
  }
}

const combatSystem = new CombatSystem();
