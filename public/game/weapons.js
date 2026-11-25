// Nuevos movimientos de armas estilo Graal (gani) + guardado en la nube vía la página padre.
(function () {
  const G = () => window.__GAME;
  const fx = []; // efectos activos
  const sparks = [];
  let attacks = 0;
  let cooldown = 0;
  const DIRS = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

  function center(p) { return { x: p.x, y: p.y - 14 }; }

  function spark(x, y, color, speed, life) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * speed;
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color });
  }

  function startAttack(kind) {
    const g = G(); if (!g || cooldown > 0) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    const p = g.player;
    fx.push({ kind, t: 0, dir: DIRS[p.dir] ?? Math.PI / 2 });
    cooldown = kind === 'blades' ? 26 : 34;
    attacks++;
    g.playSound(kind === 'blades' ? 'snowball' : 'ice');
    g.player.speechBubble = kind === 'blades' ? '¡Corte Cruzado!' : '¡Lanza Relámpago!';
    g.player.speechTimer = 60;
  }

  window.__updateWeapons = function () {
    if (cooldown > 0) cooldown--;
    const g = G(); if (!g) return;
    const c = center(g.player);
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t++;
      if (f.kind === 'blades') {
        if (f.t === 9) for (let k = 0; k < 22; k++) spark(c.x + Math.cos(f.dir) * 14, c.y + Math.sin(f.dir) * 14, k % 2 ? '#d9f99d' : '#84cc16', 3, 20);
        if (f.t > 26) fx.splice(i, 1);
      } else {
        if (f.t < 10 && f.t % 2 === 0) spark(c.x, c.y, '#7dd3fc', 2, 14);
        if (f.t === 12) { f.bx = c.x + Math.cos(f.dir) * 30; f.by = c.y + Math.sin(f.dir) * 30; }
        if (f.t >= 12) {
          f.bx += Math.cos(f.dir) * 7; f.by += Math.sin(f.dir) * 7;
          if (f.t % 1 === 0) spark(f.bx, f.by, Math.random() < 0.5 ? '#38bdf8' : '#e0f2fe', 2.5, 16);
        }
        if (f.t > 40) { for (let k = 0; k < 18; k++) spark(f.bx, f.by, '#60a5fa', 3.5, 22); fx.splice(i, 1); }
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= 0.9; s.vy *= 0.9;
      if (--s.life <= 0) sparks.splice(i, 1);
    }
  };

  function blade(ctx, x, y, ang, len, color, glow) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.shadowColor = glow; ctx.shadowBlur = 8;
    ctx.fillStyle = '#1f2937'; ctx.fillRect(-4, -1.5, 6, 3);       // empuñadura
    ctx.fillStyle = '#facc15'; ctx.fillRect(2, -3, 2, 6);          // guarda
    ctx.fillStyle = color; ctx.fillRect(4, -1.5, len, 3);          // hoja
    ctx.fillStyle = '#f7fee7'; ctx.fillRect(4, -0.5, len - 2, 1);  // filo brillante
    ctx.beginPath(); ctx.moveTo(4 + len, -1.5); ctx.lineTo(8 + len, 0); ctx.lineTo(4 + len, 1.5); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  function bolt(ctx, x1, y1, x2, y2, segs, jitter) {
    ctx.beginPath(); ctx.moveTo(x1, y1);
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      ctx.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter, y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter);
    }
    ctx.lineTo(x2, y2); ctx.stroke();
  }

  window.__drawWeapons = function (ctx) {
    const g = G(); if (!g) return;
    const c = center(g.player);
    for (const f of fx) {
      const d = f.dir;
      if (f.kind === 'blades') {
        // Fase 1: espadas levantadas que bajan y se cruzan en X. Fase 2: tajos en arco.
        const k = Math.min(1, f.t / 9);
        const e = 1 - Math.pow(1 - k, 3);
        const spread = (1 - e) * 1.9 + 0.55;
        const off = 6 + e * 6;
        const ox = Math.cos(d) * off, oy = Math.sin(d) * off;
        blade(ctx, c.x + ox, c.y + oy, d - spread, 20, '#a3e635', '#65a30d');
        blade(ctx, c.x + ox, c.y + oy, d + spread, 20, '#a3e635', '#65a30d');
        if (f.t >= 8) {
          const a = Math.max(0, 1 - (f.t - 8) / 18), r = 16 + (f.t - 8) * 1.6;
          ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = '#bef264'; ctx.shadowBlur = 12;
          ctx.strokeStyle = '#d9f99d'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(c.x, c.y, r, d - 1.1, d + 0.3); ctx.stroke();
          ctx.beginPath(); ctx.arc(c.x, c.y, r, d - 0.3, d + 1.1); ctx.stroke();
          // X luminosa
          const fx2 = c.x + Math.cos(d) * (r + 4), fy2 = c.y + Math.sin(d) * (r + 4);
          ctx.lineWidth = 2; ctx.strokeStyle = '#ecfccb';
          ctx.beginPath(); ctx.moveTo(fx2 - 7, fy2 - 7); ctx.lineTo(fx2 + 7, fy2 + 7); ctx.moveTo(fx2 + 7, fy2 - 7); ctx.lineTo(fx2 - 7, fy2 + 7); ctx.stroke();
          ctx.restore();
        }
      } else {
        // Lanza: retroceso de carga, estocada y rayo
        let ext;
        if (f.t < 10) ext = -6 * (f.t / 10);
        else if (f.t < 15) ext = -6 + 30 * ((f.t - 10) / 5);
        else ext = Math.max(0, 24 - (f.t - 15) * 1.5);
        const sx = c.x + Math.cos(d) * (ext - 10), sy = c.y + Math.sin(d) * (ext - 10);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(d);
        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 14;
        ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, -1.5, 34, 3);
        ctx.fillStyle = '#7dd3fc'; ctx.fillRect(2, -0.5, 30, 1);
        ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(34, -4); ctx.lineTo(46, 0); ctx.lineTo(34, 4); ctx.fill();
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(30, -5, 3, 10);
        ctx.restore();
        // Aura eléctrica alrededor del jugador
        ctx.save(); ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1; ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 10;
        for (let n = 0; n < 3; n++) { const a = Math.random() * 6.28; bolt(ctx, c.x, c.y, c.x + Math.cos(a) * 16, c.y + Math.sin(a) * 16, 4, 6); }
        if (f.bx !== undefined) {
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#e0f2fe';
          const tx = f.bx - Math.cos(d) * 40, ty = f.by - Math.sin(d) * 40;
          bolt(ctx, tx, ty, f.bx, f.by, 7, 8);
          ctx.lineWidth = 1; ctx.strokeStyle = '#38bdf8';
          bolt(ctx, tx, ty, f.bx, f.by, 7, 14);
          ctx.fillStyle = '#f0f9ff'; ctx.beginPath(); ctx.arc(f.bx, f.by, 4, 0, 6.28); ctx.fill();
        }
        ctx.restore();
      }
    }
    for (const s of sparks) {
      ctx.globalAlpha = s.life / s.max; ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 2, 2);
    }
    ctx.globalAlpha = 1;
  };

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'q') startAttack('blades');
    if (k === 'r') startAttack('spear');
  });

  function addButtons() {
    const box = document.getElementById('mobile-action-container');
    if (!box) return;
    const mk = (label, title, kind, cls) => {
      const b = document.createElement('button');
      b.title = title; b.textContent = label;
      b.className = 'w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl active:scale-90 transition backdrop-blur-sm border-2 ' + cls;
      b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); startAttack(kind); });
      box.insertBefore(b, box.firstChild);
    };
    mk('⚔️', 'Corte Cruzado (Q)', 'blades', 'bg-lime-950/85 border-lime-400');
    mk('⚡', 'Lanza Relámpago (R)', 'spear', 'bg-blue-950/85 border-sky-400');
  }

  // --- Guardado en la nube (la página padre habla con la base de datos) ---
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    const m = e.data; const g = G();
    if (m && m.type === 'santatown:load' && m.save && g) {
      const s = m.save;
      if (window.__CITY) window.__CITY.applySave(s);
      else { g.player.x = s.x; g.player.y = s.y; }
      g.player.dir = s.dir;
      if (s.name) g.player.name = s.name;
      attacks = s.attacks || 0;
    }
  });
  function post(msg) { if (window.parent !== window) window.parent.postMessage(msg, location.origin); }
  setInterval(() => {
    const g = G(); if (!g) return;
    const p = g.player;
    post({ type: 'santatown:save', save: { map: window.__CITY ? 'era-city-v1' : 'santatown', name: p.name || 'Jugador', x: p.x, y: p.y, dir: p.dir, attacks } });
  }, 8000);

  function init() { addButtons(); post({ type: 'santatown:ready' }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
