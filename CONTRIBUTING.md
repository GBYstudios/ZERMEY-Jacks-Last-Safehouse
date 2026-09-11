# Contributing to ZERMEY

## Development Setup

1. Clone the repository
2. Open `index.html` in a modern browser
3. No build process required - uses CDN for dependencies

## Dependencies

- Three.js (via CDN)
- Cannon-ES (via CDN)
- No build tools needed

## Code Style

- Use ES6 classes for all systems
- Camel case for variables and methods
- Descriptive names for clarity
- Comments for complex logic
- Config constants instead of magic numbers

## Adding Features

### New Zombie Type

1. Add to `CONFIG.ZOMBIE_TYPES` in `config.js`
2. Update zombie spawning in `ZombieManager.spawnZombies()`

### New Location

1. Add to `CONFIG.LOCATIONS` in `config.js`
2. Add spawn/builder method in `world-builder.js`
3. Update `LocationManager` if needed

### New Item Type

1. Add to inventory in `Inventory` class
2. Add use case in `Inventory.use()`
3. Update UI display

### New UI Screen

1. Add HTML in `UIManager.initMainMenu()`
2. Add CSS in `styles/main.css`
3. Add show/hide methods in `UIManager`
4. Attach event listeners

## Testing

- Test in Chrome, Firefox, Safari
- Test on Chromebook
- Test on mobile devices
- Check performance with DevTools
- Test all UI screens
- Test multiplayer if available

## Performance Tips

- Use object pooling for frequently created objects
- Limit particle count
- Optimize shader complexity
- Profile with DevTools
- Minimize DOM updates in HUD
- Use local references instead of repeated lookups

## Debugging

Enable debug mode in `config.js`:

```javascript
const DEBUG = {
  enabled: true,
  showGrid: true,
  showColliders: true,
  infiniteHealth: true,
  showStats: true
};
```

## Future Enhancements

- Additional weapon types
- More zombie varieties
- Building/crafting system
- Advanced upgrades
- Missions/quests
- Leaderboard
- Mobile app version
- Accessibility features

---

Thank you for contributing to ZERMEY!
