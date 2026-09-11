class NetworkManager {
  constructor() {
    this.connected = false;
    this.roomCode = null;
    this.players = {};
    this.isHost = false;
    this.ws = null;
    this.peerConnections = {};
    this.localStream = null;
  }
  
  async initialize() {
    // Check if networking is available
    if (!this.isNetworkingAvailable()) {
      console.log('Networking not available on this platform');
      return false;
    }
    return true;
  }
  
  isNetworkingAvailable() {
    // Check for WebSocket support
    return (
      typeof WebSocket !== 'undefined' &&
      navigator.onLine &&
      CONFIG.MULTIPLAYER_ENABLED
    );
  }
  
  createRoom() {
    if (!this.isNetworkingAvailable()) {
      return { success: false, message: 'Multiplayer unavailable' };
    }
    
    this.roomCode = this.generateRoomCode();
    this.isHost = true;
    this.connected = true;
    
    return { success: true, roomCode: this.roomCode };
  }
  
  joinRoom(code) {
    if (!this.isNetworkingAvailable()) {
      return { success: false, message: 'Multiplayer unavailable' };
    }
    
    this.roomCode = code;
    this.isHost = false;
    this.connected = true;
    
    return { success: true, roomCode: this.roomCode };
  }
  
  generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  addPlayer(playerId, playerData) {
    this.players[playerId] = playerData;
    this.broadcastUpdate('playerJoined', { playerId, playerData });
  }
  
  removePlayer(playerId) {
    delete this.players[playerId];
    this.broadcastUpdate('playerLeft', { playerId });
  }
  
  broadcastUpdate(type, data) {
    // Broadcast game state to all players
    const message = { type, data, timestamp: Date.now() };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  updatePlayerPosition(playerId, position) {
    if (this.players[playerId]) {
      this.players[playerId].position = position;
      this.broadcastUpdate('playerMoved', { playerId, position });
    }
  }
  
  updatePlayerHealth(playerId, health) {
    if (this.players[playerId]) {
      this.players[playerId].health = health;
      this.broadcastUpdate('playerDamaged', { playerId, health });
    }
  }
  
  synchronizeZombie(zombieId, data) {
    this.broadcastUpdate('zombieSync', { zombieId, data });
  }
  
  reportZombieKilled(zombieId, playerId) {
    this.broadcastUpdate('zombieKilled', { zombieId, playerId });
  }
  
  reportLocationRestored(location, restoredBy) {
    this.broadcastUpdate('locationRestored', { location, restoredBy });
  }
  
  disconnect() {
    this.connected = false;
    this.roomCode = null;
    if (this.ws) {
      this.ws.close();
    }
  }
}

const networkManager = new NetworkManager();