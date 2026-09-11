const CONFIG = {
  GAME_NAME: 'ZERMEY: JACK\'S LAST SAFEHOUSE',
  GAME_VERSION: '1.0.0',
  
  PLAYER_NAME: 'Jack',
  PLAYER_START_HEALTH: 100,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_SPEED: 8,
  PLAYER_RUN_SPEED: 16,
  PLAYER_PUNCH_RANGE: 2.5,
  PLAYER_PUNCH_DAMAGE: 1,
  PLAYER_PUNCH_COOLDOWN: 0.6,
  PLAYER_HEALTH_REGEN_RATE: 1,
  
  PUNCH_ANIMATION_DURATION: 0.4,
  ZOMBIE_KNOCK_DISTANCE: 1.5,
  
  ZOMBIE_TYPES: {
    NORMAL: { speed: 4, damage: 5, health: 1, attackRange: 2, attackCooldown: 1.5 },
    FAST: { speed: 8, damage: 3, health: 1, attackRange: 2, attackCooldown: 1.2 },
    STRONG: { speed: 3, damage: 10, health: 3, attackRange: 2.5, attackCooldown: 2 }
  },
  
  WORLD_SIZE: 500,
  TREEHOUSE_SIZE: 40,
  DAY_CYCLE_DURATION: 120,
  
  LOCATIONS: {
    TREEHOUSE: { x: 0, z: 0, size: 40, type: 'spawn' },
    WALMART: { x: 150, z: 100, size: 60, type: 'location' },
    MCDONALDS: { x: -120, z: 140, size: 40, type: 'location' },
    NEIGHBORHOOD: { x: -150, z: -100, size: 100, type: 'location' }
  },
  
  BASE_ZOMBIE_COUNT: {
    WALMART: 12,
    MCDONALDS: 8,
    NEIGHBORHOOD: 15
  },
  
  HUD_UPDATE_INTERVAL: 0.1,
  MASTER_VOLUME: 0.7,
  MUSIC_VOLUME: 0.5,
  EFFECTS_VOLUME: 0.7,
  
  FOG_NEAR: 10,
  FOG_FAR: 400,
  SHADOW_MAP_SIZE: 2048,
  GRAPHICS_QUALITY: {
    AUTO: 'auto',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  GRAPHICS_PRESETS: {
    low: { pixelRatio: 1, shadowMapSize: 1024, fogNear: 18, fogFar: 240, particleCount: 18, toneMappingExposure: 0.95, useSoftShadows: false },
    medium: { pixelRatio: 1.25, shadowMapSize: 1536, fogNear: 14, fogFar: 320, particleCount: 36, toneMappingExposure: 1.02, useSoftShadows: false },
    high: { pixelRatio: 1.5, shadowMapSize: 2048, fogNear: 10, fogFar: 420, particleCount: 60, toneMappingExposure: 1.1, useSoftShadows: true }
  },
  
  MAX_PARTICLES: 100,
  ZOMBIE_UPDATE_INTERVAL: 0.016,
  
  MULTIPLAYER_ENABLED: true,
  SERVER_URL: 'https://zermey-server.herokuapp.com',
  MAX_PLAYERS: 4,
  SYNC_INTERVAL: 0.05
};

const DEBUG = { enabled: false, showGrid: false, showColliders: false, infiniteHealth: false, showStats: true };
