# Project Structure

## Files

### HTML
- `index.html` - Main entry point with all UI elements

### CSS
- `styles/main.css` - All styling for UI, animations, and responsive design

### JavaScript

#### Core Systems
- `js/config.js` - Game configuration and constants
- `js/game.js` - Main game loop and orchestration

#### Player & Combat
- `js/player.js` - Player character (Jack) and movement
- `js/zombie.js` - Zombie AI and behavior
- `js/combat-system.js` - Combat mechanics and damage

#### World & Locations
- `js/world-builder.js` - 3D world generation and environment
- `js/location-manager.js` - Location state and restoration logic
- `js/camera.js` - Third-person camera controller

#### Game Systems
- `js/inventory.js` - Item management and usage
- `js/ui-manager.js` - Menu, HUD, and UI updates
- `js/audio-manager.js` - Sound effects and music
- `js/save-system.js` - Game save/load functionality
- `js/networking.js` - Multiplayer support

## Architecture

```
Game (main orchestrator)
├── Player (Jack character)
├── ZombieManager (all zombies)
├── WorldBuilder (3D environment)
├── LocationManager (location states)
├── CombatSystem (damage/attacks)
├── Inventory (items)
├── UIManager (menus/HUD)
├── AudioManager (sound)
├── SaveSystem (persistence)
└── NetworkManager (multiplayer)
```

## Game States

1. **Menu** - Main menu screen
2. **Game** - Active gameplay
3. **Paused** - Game paused
4. **Death** - Game over
5. **Victory** - Successfully completed

## Data Flow

```
Input Handling (keyboard)
  ↓
Player Update (position, health)
  ↓
Zombie Updates (AI, combat)
  ↓
Location Checks (completion)
  ↓
HUD Update (statistics)
  ↓
Render (Three.js)
```

## Performance Optimization

- Frustum culling for off-screen objects
- Shadow map caching
- Zombie pool recycling
- Efficient collision detection
- Minimal particle effects
- Compressed audio

## Browser APIs Used

- WebGL 2.0
- Web Audio API
- LocalStorage
- RequestAnimationFrame
- EventListener
- WebSocket (optional multiplayer)

## Configuration

All game constants defined in `config.js`:
- Player stats (health, speed, damage)
- Zombie types and spawn counts
- World size and locations
- UI settings
- Audio levels
- Graphics settings

## Customization

Easy to modify:
- Difficulty (adjust zombie count in config)
- Graphics (fog, lighting, shadows)
- Audio (volume levels)
- Controls (keyboard mappings)
- World size and layout
- Location positions

---

*See README.md for gameplay documentation*
