class AudioManager {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterVolume = CONFIG.MASTER_VOLUME;
    this.musicVolume = CONFIG.MUSIC_VOLUME;
    this.effectsVolume = CONFIG.EFFECTS_VOLUME;
    this.sounds = {};
    this.musicTracks = {};
    this.currentMusic = null;
    this.ambientOscillators = [];
    this.ambientGain = null;
    this.ambientStarted = false;
  }
  
  initAmbientSounds() {
    if (this.ambientStarted) return;
    const gainNode = this.context.createGain();
    gainNode.gain.value = (this.masterVolume * this.musicVolume) * 0.1;
    gainNode.connect(this.context.destination);
    const osc = this.context.createOscillator();
    osc.frequency.value = 40;
    osc.type = 'sine';
    osc.connect(gainNode);
    osc.start();
    this.ambientGain = gainNode;
    this.ambientOscillators.push(osc);
    this.ambientStarted = true;
  }
  
  async resume() {
    try {
      if (this.context.state !== 'running') {
        await this.context.resume();
      }
      if (!this.ambientStarted) {
        this.initAmbientSounds();
      }
    } catch (e) {
      console.error('Audio resume error:', e);
    }
  }
  
  playSound(name, volume = 1) {
    try {
      if (this.context.state !== 'running') return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.connect(gain);
      gain.connect(this.context.destination);
      const effectiveVolume = this.masterVolume * this.effectsVolume * volume;
      gain.gain.value = effectiveVolume * 0.3;
      switch(name) {
        case 'punch':
          osc.frequency.value = 150;
          osc.type = 'square';
          osc.start(this.context.currentTime);
          osc.stop(this.context.currentTime + 0.1);
          break;
        case 'hit':
          osc.frequency.value = 80;
          osc.type = 'square';
          osc.start(this.context.currentTime);
          osc.stop(this.context.currentTime + 0.2);
          break;
        case 'zombie_groan':
          osc.frequency.value = 60 + Math.random() * 40;
          osc.type = 'sine';
          osc.start(this.context.currentTime);
          osc.stop(this.context.currentTime + 0.8);
          break;
        case 'death':
          osc.frequency.value = 200;
          osc.type = 'sawtooth';
          osc.start(this.context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
          osc.stop(this.context.currentTime + 0.5);
          break;
        case 'button':
          osc.frequency.value = 400;
          osc.type = 'sine';
          osc.start(this.context.currentTime);
          osc.stop(this.context.currentTime + 0.1);
          break;
        case 'victory':
          osc.frequency.value = 440;
          osc.type = 'sine';
          osc.start(this.context.currentTime);
          osc.stop(this.context.currentTime + 0.3);
          break;
      }
    } catch(e) {
      console.error('Audio error:', e);
    }
  }
  
  playMusicTrack(trackName) {
    if (this.currentMusic === trackName) return;
    this.currentMusic = trackName;
    this.playSound('button', 0.1);
  }
  
  setVolume(type, value) {
    value = Math.max(0, Math.min(1, value));
    if (type === 'master') this.masterVolume = value;
    if (type === 'music') this.musicVolume = value;
    if (type === 'effects') this.effectsVolume = value;
    if (this.ambientGain) {
      this.ambientGain.gain.value = (this.masterVolume * this.musicVolume) * 0.1;
    }
  }
  
  playFootstep() { this.playSound('punch', 0.2); }
  playSafeZoneSound() { this.playSound('victory', 0.5); }
  playDeathSound() { this.playSound('death', 0.8); }
}

const audioManager = new AudioManager();
window.audioManager = audioManager;
