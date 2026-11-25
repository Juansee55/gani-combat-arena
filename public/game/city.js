(function () {
  const factor = 8;
  const image = new Image();
  let mask = null;
  let initialized = false;
  let pendingSave = null;
  let powers = { tag: '', invisible: false, giant: false, flying: false, noclip: false };
  const city = window.__CITY = {
    ready: false, factor, width: 769 * factor, height: 1042 * factor,
    spawn: { x: 350 * factor, y: 350 * factor },
    get powers() { return powers; },
    blocked(x, y, radius = 6, ignorePowers = false) {
      if (x - radius < 0 || y - radius < 0 || x + radius >= city.width || y + radius >= city.height) return true;
      if (!ignorePowers && (powers.flying || powers.noclip)) return false;
      if (!mask) return true;
      for (const [dx, dy] of [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius],[0,0]]) {
        const cx = Math.floor((x + dx) / factor / mask.cell);
        const cy = Math.floor((y + dy) / factor / mask.cell);
        if (mask.runs[cy]?.some(([from, to]) => cx >= from && cx < to)) return true;
      }
      return false;
    },
    safePosition(p) {
      if (!city.blocked(p.x, p.y, 6, true)) return;
      for (let r = 16; r < 800; r += 16) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
          if (!city.blocked(x, y, 6, true)) { p.x = x; p.y = y; return; }
        }
      }
      Object.assign(p, city.spawn);
    },
    applySave(save) {
      pendingSave = save;
      const g = window.__GAME;
      if (!g || !city.ready) return;
      if (save.map === 'era-city-v1') Object.assign(g.player, { x: save.x, y: save.y });
      else Object.assign(g.player, city.spawn);
      city.safePosition(g.player);
    },
    draw(ctx) {
      if (city.ready) ctx.drawImage(image, 0, 0, city.width, city.height);
    },
    minimap(ctx, canvas, player) {
      if (!city.ready) return;
      const w = 76, h = w * image.height / image.width, x = canvas.width - w - 12, y = 60;
      ctx.drawImage(image, x, y, w, h);
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(x + player.x / city.width * w, y + player.y / city.height * h, 3, 0, Math.PI * 2); ctx.fill();
    },
    update() {
      const g = window.__GAME;
      if (!g || !city.ready) return;
      if (!initialized) {
        initialized = true; Object.assign(g.player, city.spawn);
        if (pendingSave) city.applySave(pendingSave);
      }
      const title = g.player.y > 780 * factor ? 'Isla Sur' : g.player.y > 500 * factor ? 'Puente Central' : 'Ciudad Era';
      const label = document.getElementById('hud-sector-name'); if (label) label.textContent = title;
      const profile = document.getElementById('profile-sector-text'); if (profile) profile.textContent = title;
    },
  };
  Promise.all([fetch('/game/city-mask.json').then(r => r.json()), new Promise(resolve => { image.onload = resolve; })])
    .then(([data]) => { mask = data; city.width = image.width * factor; city.height = image.height * factor; city.ready = true; })
    .catch(() => { window.parent.postMessage({ type: 'city:error' }, location.origin); });
  window.addEventListener('message', e => {
    if (e.source !== window.parent || e.origin !== location.origin) return;
    const m = e.data;
    if (m?.type === 'city:config' && typeof m.url === 'string' && !image.src) image.src = m.url;
    if (m?.type === 'city:powers') {
      powers = m.isAdmin ? { ...m.powers } : { tag: '', invisible: false, giant: false, flying: false, noclip: false };
      if (city.ready && !powers.flying && !powers.noclip && window.__GAME) city.safePosition(window.__GAME.player);
    }
    if (m?.type === 'city:profile' && window.__GAME && typeof m.name === 'string') window.__GAME.player.name = m.name;
  });
  window.addEventListener('DOMContentLoaded', () => {
    const toast = document.getElementById('sector-toast'); if (toast) toast.style.display = 'none';
    const mapModal = document.getElementById('map-modal');
    if (mapModal) {
      mapModal.replaceChildren();
      const mapImage = document.createElement('img'); mapImage.alt = 'Mapa de Ciudad Era';
      mapImage.style.cssText = 'max-width:90%;max-height:85%;object-fit:contain;image-rendering:pixelated';
      mapImage.addEventListener('load', () => {});
      image.addEventListener('load', () => { mapImage.src = image.src; });
      mapModal.append(mapImage);
      mapModal.addEventListener('click', () => mapModal.classList.add('hidden'));
    }
  });
})();