/* Read-only visual history. No combat snapshots are restored or simulated here. */
(() => {
  'use strict';
  const G = window.OrbDuel;
  G.AnimationReview = class {
    constructor(engine, canvas) {
      this.engine = engine; this.source = canvas;
      this.frames = []; this.bytes = 0; this.generation = 0;
      this.index = -1; this.active = false; this.playing = false;
      this.pending = false; this.elapsed = 0; this.lastWall = null;
      this.lastCapture = -Infinity; this.lastTick = engine.tick;
      this.endedCaptured = false; this.decodeSerial = 0;
      this.scratch = document.createElement('canvas');
      this.syncLayout = () => {
        if (!this.active) return;
        const wrap = this.source.parentElement;
        wrap.classList.remove('review-fit');
        const rect = wrap.getBoundingClientRect();
        const scale = rect.width / wrap.offsetWidth || 1;
        const available = this.toolbar.getBoundingClientRect().top - rect.top - 12;
        const aspect = this.source.width / this.source.height;
        if (available > 80) {
          wrap.style.setProperty('--review-field', Math.min(rect.width, available * aspect) / scale + 'px');
          wrap.classList.add('review-fit');
        }
      };
      this.panels = Array.from(document.querySelectorAll('.fighter,.team-card'));
      this.view = document.createElement('canvas'); this.view.className = 'review-image';
      this.view.setAttribute('aria-label', '历史战斗画面'); this.view.hidden = true;
      canvas.parentElement.append(this.view);
      this.button = document.createElement('button'); this.button.type = 'button';
      this.button.className = 'review-open icon-button'; this.button.textContent = '回看 V';
      this.button.title = '回看最近约20秒画面（静音），不会倒回战斗'; this.button.disabled = true;
      document.querySelector('.transport').append(this.button);
      this.button.addEventListener('click', () => this.open());
      this.toolbar = document.createElement('section'); this.toolbar.className = 'review-toolbar';
      this.toolbar.setAttribute('aria-label', '动画回看控制'); this.toolbar.hidden = true;
      this.toolbar.innerHTML = '<div class="review-title"><b>动画回看 · 静音</b><output class="review-time"></output><button type="button" data-review="close">返回对局 V</button></div>' +
        '<input class="review-range" type="range" min="0" max="0" value="0" step="1" aria-label="回看帧时间轴">' +
        '<div class="review-actions"><button type="button" data-review="back10">−10秒</button><button type="button" data-review="back5">−5秒</button><button type="button" data-review="prev">◀ 上一帧</button><button type="button" data-review="play">播放</button><button type="button" data-review="next">下一帧 ▶</button><button type="button" data-review="next5">+5秒</button><select class="review-speed" aria-label="回看速度"><option value="0.25">¼×慢放</option><option value="0.5">½×慢放</option><option value="1">1×回放</option></select></div>' +
        '<small>← / → 逐帧 · Shift + ← / → 跳10帧 · 空格播放/暂停回看 · 仅回看已记录画面；退出后仍暂停</small>';
      document.body.append(this.toolbar);
      window.addEventListener('resize', () => requestAnimationFrame(() => this.syncLayout()));
      new MutationObserver(() => {
        if (this.active) requestAnimationFrame(() => requestAnimationFrame(() => this.syncLayout()));
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      this.range = this.toolbar.querySelector('input'); this.time = this.toolbar.querySelector('output');
      this.speed = this.toolbar.querySelector('select');
      this.speed.addEventListener('change', () => {
        if (this.active && this.playing) { this.playCursor = this.frames[this.index].t; this.playWall = performance.now(); }
      });
      this.range.addEventListener('input', () => this.seek(Number(this.range.value)));
      this.toolbar.addEventListener('click', e => {
        const action = e.target.closest('[data-review]')?.dataset.review;
        if (action === 'close') this.close();
        if (action === 'prev') this.seek(this.index - 1);
        if (action === 'next') this.seek(this.index + 1);
        if (action === 'back10') this.jump(-10);
        if (action === 'back5') this.jump(-5);
        if (action === 'next5') this.jump(5);
        if (action === 'play') this.togglePlay();
      });
      document.addEventListener('keydown', e => {
        if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || document.querySelector('dialog[open]')) return;
        if (e.target.closest?.('input:not(.review-range),textarea,[contenteditable="true"]')) return;
        const key = e.key.toLowerCase();
        if (key === 'v') { e.preventDefault(); e.stopImmediatePropagation(); this.active ? this.close() : this.open(); }
        else if (this.active && (e.code === 'Space' || key === 'arrowleft' || key === 'arrowright' || key === 'escape')) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (key === 'escape') this.close();
          else if (e.code === 'Space') this.togglePlay();
          else this.seek(this.index + (key === 'arrowleft' ? -1 : 1) * (e.shiftKey ? 10 : 1));
        } else if (this.active && key === 'r') {
          e.preventDefault(); e.stopImmediatePropagation(); this.close(); document.getElementById('restart').click();
        }
      }, true);
    }
    reset() {
      this.close(); this.generation++; this.frames = []; this.bytes = 0;
      this.elapsed = 0; this.lastWall = null; this.lastCapture = -Infinity;
      this.lastTick = this.engine.tick; this.endedCaptured = false; this.button.disabled = true;
    }
    panelHTML(panel) {
      const clone = panel.cloneNode(true); clone.querySelector('.review-panel')?.remove();
      const original = panel.querySelectorAll('select');
      clone.querySelectorAll('select').forEach((select, i) => {
        const name = document.createElement('b'); name.className = 'review-orb-name';
        name.textContent = original[i]?.selectedOptions[0]?.textContent || '';
        select.replaceWith(name);
      });
      clone.querySelectorAll('details').forEach(el => el.remove());
      return clone.innerHTML;
    }
    capture(now) {
      // Match reset is explicit in each app; an in-match time-rewind may lower the tick.
      this.lastTick = this.engine.tick;
      if (this.active) { this.updatePlayback(now); return; }
      if (!['running', 'ended'].includes(this.engine.state)) { this.lastWall = null; return; }
      if (this.engine.state === 'ended' && this.endedCaptured) return;
      this.elapsed += this.lastWall === null ? 0 : Math.min(.25, Math.max(0, (now - this.lastWall) / 1000));
      this.lastWall = now;
      if (this.pending || now - this.lastCapture < 15) return;
      this.lastCapture = now;
      const w = Math.min(800, this.source.width), h = Math.max(1, Math.round(w * this.source.height / this.source.width));
      if (this.scratch.width !== w || this.scratch.height !== h) { this.scratch.width = w; this.scratch.height = h; }
      this.scratch.getContext('2d').drawImage(this.source, 0, 0, w, h);
      const entry = { t: this.elapsed, gameTime: this.engine.time, tick: this.engine.tick,
        panels: this.panels.map(p => this.panelHTML(p)), width: w, height: h };
      const generation = this.generation;
      this.pending = true;
      this.scratch.toBlob(blob => {
        this.pending = false;
        if (!blob || generation !== this.generation) return;
        entry.blob = blob; entry.bytes = blob.size + entry.panels.reduce((sum, html) => sum + html.length * 2, 0);
        this.frames.push(entry); this.bytes += entry.bytes;
        // Bound compressed images AND HUD strings. Always retain at least the latest frame.
        while (this.frames.length > 1 && (entry.t - this.frames[0].t > 20 || this.bytes > 64 * 1024 * 1024 || this.frames.length > 1250)) {
          this.bytes -= this.frames.shift().bytes;
        }
        this.button.disabled = false;
      }, 'image/webp', .85);
      if (this.engine.state === 'ended') this.endedCaptured = true;
    }
    open() {
      if (!this.frames.length || this.active) return;
      if (this.engine.state === 'running') document.getElementById('toggle').click();
      // A late encoder callback must not shift the selected frame after entering review.
      this.generation++;
      this.active = true; this.playing = false; this.lastWall = null;
      document.body.classList.add('review-mode'); this.toolbar.hidden = false; this.view.hidden = false;
      this.range.max = this.frames.length - 1;
      this.seek(this.frames.length - 1);
      requestAnimationFrame(() => this.syncLayout());
    }
    close() {
      if (!this.active) return;
      this.active = false; this.playing = false; this.decodeSerial++;
      if (this.imageURL) { URL.revokeObjectURL(this.imageURL); this.imageURL = null; }
      document.body.classList.remove('review-mode'); this.toolbar.hidden = true; this.view.hidden = true;
      this.source.parentElement.classList.remove('review-fit');
      this.source.parentElement.style.removeProperty('--review-field');
      this.panels.forEach(p => p.querySelector('.review-panel')?.remove());
      this.lastWall = null;
    }
    seek(index, playing = false) {
      if (!this.active) return;
      this.playing = playing; this.index = Math.max(0, Math.min(this.frames.length - 1, index));
      this.range.value = this.index;
      const frame = this.frames[this.index];
      this.time.textContent = '对局 ' + G.formatTime(frame.gameTime) + ' · ' + (this.frames.at(-1).t - frame.t).toFixed(2) + '秒前 · 帧 ' + (this.index + 1) + '/' + this.frames.length;
      this.toolbar.querySelector('[data-review="play"]').textContent = this.playing ? '暂停回看' : '播放';
      this.panels.forEach((panel, i) => {
        let overlay = panel.querySelector('.review-panel');
        if (!overlay) { overlay = document.createElement('div'); overlay.className = 'review-panel'; panel.append(overlay); }
        overlay.innerHTML = frame.panels[i];
        overlay.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        overlay.querySelectorAll('[for]').forEach(el => el.removeAttribute('for'));
      });
      const serial = ++this.decodeSerial;
      if (this.imageURL) URL.revokeObjectURL(this.imageURL);
      const url = this.imageURL = URL.createObjectURL(frame.blob), image = new Image();
      image.onload = () => {
        if (serial !== this.decodeSerial || !this.active) return;
        this.view.width = frame.width; this.view.height = frame.height;
        this.view.getContext('2d').drawImage(image, 0, 0);
        URL.revokeObjectURL(url); if (this.imageURL === url) this.imageURL = null;
      };
      image.src = url;
      this.playCursor = frame.t; this.playWall = performance.now();
    }
    jump(seconds) {
      if (!this.active) return;
      const target = this.frames[this.index].t + seconds;
      let nearest = 0;
      for (let i = 1; i < this.frames.length; i++) if (Math.abs(this.frames[i].t - target) < Math.abs(this.frames[nearest].t - target)) nearest = i;
      this.seek(nearest);
    }
    togglePlay() {
      if (this.index === this.frames.length - 1 && !this.playing) this.seek(0);
      this.playing = !this.playing; this.playCursor = this.frames[this.index].t; this.playWall = performance.now();
      this.toolbar.querySelector('[data-review="play"]').textContent = this.playing ? '暂停回看' : '播放';
    }
    updatePlayback(now) {
      // Other controls may resume/reset the match; history never intercepts the live engine.
      if (!['paused', 'ended'].includes(this.engine.state)) { this.close(); return; }
      if (!this.playing) return;
      const desired = this.playCursor + (now - this.playWall) / 1000 * Number(this.speed.value);
      let next = this.index;
      while (next + 1 < this.frames.length && this.frames[next + 1].t <= desired) next++;
      if (next !== this.index) {
        const cursor = this.playCursor, wall = this.playWall;
        this.seek(next, true); this.playCursor = cursor; this.playWall = wall;
      }
      if (next === this.frames.length - 1) {
        this.playing = false; this.toolbar.querySelector('[data-review="play"]').textContent = '播放';
      }
    }
    info() { return { active: this.active, playing: this.playing, index: this.index, frames: this.frames.length, bytes: this.bytes,
      seconds: this.frames.length ? this.frames.at(-1).t - this.frames[0].t : 0, gameTime: this.frames[this.index]?.gameTime ?? null }; }
  };
})();
