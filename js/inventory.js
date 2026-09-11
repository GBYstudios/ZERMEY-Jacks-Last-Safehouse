class Inventory {
  constructor() {
    this.items = {
      food: 0,
      medkits: 5,
      batteries: 0,
      materials: 0
    };
  }
  
  addItem(item, quantity = 1) {
    if (this.items.hasOwnProperty(item)) {
      this.items[item] += quantity;
      return true;
    }
    return false;
  }
  
  removeItem(item, quantity = 1) {
    if (this.items.hasOwnProperty(item) && this.items[item] >= quantity) {
      this.items[item] -= quantity;
      return true;
    }
    return false;
  }
  
  hasItem(item, quantity = 1) {
    return this.items.hasOwnProperty(item) && this.items[item] >= quantity;
  }
  
  use(item, player) {
    if (item === 'medkits' && this.hasItem('medkits')) {
      player.heal(50);
      this.removeItem('medkits');
      audioManager.playSound('button');
      return true;
    }
    if (item === 'food' && this.hasItem('food')) {
      player.heal(25);
      this.removeItem('food');
      audioManager.playSound('button');
      return true;
    }
    return false;
  }
  
  getAll() {
    return { ...this.items };
  }
}
