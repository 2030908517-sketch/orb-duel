/* Recording layout only: existing controls remain the sole start/pause/reset entry. */
(() => {
  'use strict';
  const root = document.documentElement;
  const team = document.body.classList.contains('team-mode');
  const stage = document.querySelector(team ? '.team-workspace' : '.battle-stage');
  if (!stage) return;
  let saved, busy = false, frame = 0;
  const active = () => root.classList.contains('recording-mode');
  function fit() {
    if (!active()) return;
    const pad = 16, gap = 16, width = innerWidth - pad * 2, height = innerHeight - pad * 2;
    const world = window.OrbDuel?.Constants;
    const aspect = world ? world.width / world.height : (team ? 640 / 440 : 360 / 340);
    if (root.classList.contains('recording-portrait')) {
      // Fit the natural content height, rather than stretching panels to fill an empty frame.
      const previousScale = Number(stage.style.getPropertyValue('--portrait-scale')) || 1;
      const rails = stage.querySelectorAll(team ? '.team-rail' : '.rail-left');
      const railHeight = Math.max(...Array.from(rails, el => el.getBoundingClientRect().height / previousScale));
      const field = 568;
      const contentHeight = Math.ceil(32 + railHeight + gap + field / aspect + 2);
      stage.style.setProperty('--portrait-height', contentHeight + 'px');
      stage.style.setProperty('--portrait-scale', Math.min(width / 600, height / contentHeight));
      stage.style.setProperty('--record-field', field + 'px');
      return;
    }
    const narrow = innerWidth < 900;
    const panel = Math.max(240, Math.min(team ? 320 : 360, width * .23));
    stage.style.setProperty('--record-panel', panel + 'px');
    stage.style.setProperty('--record-height', height + 'px');
    let field;
    if (narrow) {
      const rails = stage.querySelectorAll(team ? '.team-rail' : '.rail-left');
      const railHeight = Math.max(...Array.from(rails, el => el.getBoundingClientRect().height));
      field = Math.max(1, Math.min(width, (height - railHeight - gap) * aspect));
    } else field = Math.max(1, Math.min(width - (panel + gap) * (team ? 2 : 1), height * aspect));
    stage.style.setProperty('--record-field', field + 'px');
    stage.style.setProperty('--record-total', (narrow ? width : field + (panel + gap) * (team ? 2 : 1)) + 'px');
  }
  function scheduleFit() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  }
  function restore() {
    if (!active()) return;
    root.classList.remove('recording-mode', 'recording-portrait');
    for (const [el, tab] of saved?.tabs || []) {
      if (tab === null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', tab);
    }
    saved?.focus?.focus({ preventScroll: true });
    window.scrollTo(saved?.x || 0, saved?.y || 0);
    window.dispatchEvent(new Event('resize'));
  }
  async function toggle(exitOnly = false) {
    if (busy) return;
    busy = true;
    try {
      if (active()) {
        if (!exitOnly && !root.classList.contains('recording-portrait')) {
          root.classList.add('recording-portrait');
          fit();
          scheduleFit();
          return;
        }
        if (document.fullscreenElement === root) await document.exitFullscreen();
        restore();
      } else {
        saved = { x: scrollX, y: scrollY, focus: document.activeElement,
          tabs: Array.from(stage.querySelectorAll('.team-card select'), el => [el, el.getAttribute('tabindex')]) };
        saved.tabs.forEach(([el]) => el.setAttribute('tabindex', '-1'));
        document.activeElement?.blur();
        root.classList.add('recording-mode');
        fit();
        // Embedded browsers may deny native fullscreen; keep the clean viewport layout usable.
        try { await root.requestFullscreen?.({ navigationUI: 'hide' }); } catch (_) { /* viewport fallback */ }
        scheduleFit();
      }
    } finally { busy = false; }
  }
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target.closest?.('input, textarea, [contenteditable="true"]') || document.querySelector('dialog[open]')) return;
    const key = event.key.toLowerCase();
    if (key === 'f') { event.preventDefault(); event.stopImmediatePropagation(); void toggle(); }
    else if (active() && (event.code === 'Space' || key === 'r' || key === 'escape')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (key === 'escape') void toggle(true);
      else document.getElementById(key === 'r' ? 'restart' : 'toggle')?.click();
    }
  }, true);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) restore(); else scheduleFit();
  });
  window.addEventListener('resize', scheduleFit);
  const observer = new ResizeObserver(scheduleFit);
  stage.querySelectorAll('.fighter, .squad').forEach(el => observer.observe(el));
})();
