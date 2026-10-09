// Multi-time-zone digital clock overlay (toggle with the C key)
const CLOCK_ZONES = [
  { label: 'UTC', zone: 'UTC' },
  { label: 'New York', zone: 'America/New_York' },
  { label: 'London', zone: 'Europe/London' },
  { label: 'Tokyo', zone: 'Asia/Tokyo' },
  { label: 'Sydney', zone: 'Australia/Sydney' }
];

class WorldClock {
  constructor(zones = CLOCK_ZONES) {
    this.zones = zones;
    this.timer = null;
    this.rows = [];
    this.build();
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  static format(date, zone) {
    const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    if (zone) opts.timeZone = zone;
    return new Intl.DateTimeFormat('en-GB', opts).format(date);
  }

  static abbreviation(date, zone) {
    const opts = { timeZoneName: 'short' };
    if (zone) opts.timeZone = zone;
    const part = new Intl.DateTimeFormat('en-US', opts).formatToParts(date)
      .find(p => p.type === 'timeZoneName');
    return part ? part.value : '';
  }

  build() {
    this.el = document.createElement('div');
    this.el.id = 'world-clock';
    this.el.setAttribute('aria-label', 'World clock');
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    this.localRow = this.makeRow('Local', 'world-clock-local');
    this.localRow.name.title = local;
    this.el.appendChild(this.localRow.row);
    this.rows = this.zones.map(z => {
      const r = this.makeRow(z.label);
      this.el.appendChild(r.row);
      return r;
    });
    document.body.appendChild(this.el);
  }

  makeRow(label, extra) {
    const row = document.createElement('div');
    row.className = 'world-clock-row' + (extra ? ' ' + extra : '');
    const name = document.createElement('span');
    name.className = 'world-clock-name';
    name.textContent = label;
    const time = document.createElement('span');
    time.className = 'world-clock-time';
    row.append(name, time);
    return { row, name, time };
  }

  tick() {
    const now = new Date();
    this.localRow.time.textContent = WorldClock.format(now) + ' ' + WorldClock.abbreviation(now);
    this.zones.forEach((z, i) => {
      this.rows[i].time.textContent = WorldClock.format(now, z.zone) + ' ' + WorldClock.abbreviation(now, z.zone);
    });
  }

  toggle() {
    this.el.classList.toggle('hidden');
  }
}

window.WorldClock = WorldClock;
document.addEventListener('DOMContentLoaded', () => {
  window.worldClock = new WorldClock();
});
