(function () {
  'use strict';
  const G = window.OrbDuel, $ = id => document.getElementById(id);
  const isArcana=document.body.dataset.mode==='arcana';
  const selects = [$('type-0'), $('type-1')];
  for (const select of selects) for (const [id, def] of Object.entries(G.Types)) { if(document.body.dataset.control==='manual'&&select===selects[0]&&!G.ManualRoles.types.includes(id))continue;const option = document.createElement('option'); option.value = id; option.textContent = def.name; select.append(option); }
  selects[0].value = document.body.dataset.control==='manual'?'ranger':'normal'; selects[1].value = 'vampire';
  function randomSeed() { const words = new Uint32Array(1); crypto.getRandomValues(words); return 'orb-' + words[0].toString(36).padStart(7, '0'); }
  $('seed').value = randomSeed();
  const engine = new G.Engine(selects.map(s => s.value), $('seed').value,{mode:isArcana?'arcana':'1v1'});
  const clock = new G.Clock(engine), renderer = new G.Renderer($('arena')), audio = new G.Audio();
  const manualUI = document.body.dataset.control==='manual'?new G.ManualUI(engine,clock,renderer):null;
  const review = new G.AnimationReview(engine, $('arena'));
  let previous = performance.now(), lastUi = -Infinity, seenEvents = '', renderedState = '';
  const timeString = G.formatTime;
  const roundHp = hp => hp <= 0 ? '0' : hp < 1 ? hp.toFixed(1) : Math.ceil(hp).toString();
  function updateSelection() {
    selects.forEach((select, i) => {
      const def = G.Types[select.value];
      $('mini-orb-' + i).style.background = def.color;
      $('skill-title-' + i).style.color = def.color; $('skill-title-' + i).textContent = def.skill;
      $('skill-description-' + i).textContent = def.description+(select.value==='vampire'?' '+G.VampireHunt.copy:'');
      const awakening=document.createElement('span');awakening.className='awakening-copy';awakening.textContent='觉醒 · '+G.Awakening.defs[select.value].name+'：'+G.Awakening.defs[select.value].description;$('skill-description-' + i).append(awakening);if(isArcana&&G.Arcana?.defs[select.value]){const arc=document.createElement('span');arc.className='awakening-copy';arc.textContent=G.Arcana.copy(select.value);$('skill-description-' + i).append(arc);}
      const container = $('attributes-' + i); container.replaceChildren();
      for (const [label, value] of [['生命', isArcana?(G.Arcana.health[select.value]||def.hp):def.hp], ['攻击', def.damage], ['速度', def.speed]]) { const span = document.createElement('span'); span.append(label); const b = document.createElement('b'); b.textContent = value; span.append(b); container.append(span); }
    });
  }
  function reset(start = false, newSeed = false) {
    review.reset(); manualUI?.clear();
    audio.stop();
    updateAudioDiagnostics();
    if (newSeed) $('seed').value = randomSeed();
    $('seed').value = $('seed').value.trim() || 'orb-001';
    engine.reset(selects.map(s => s.value), $('seed').value,{mode:isArcana?'arcana':'1v1'}); clock.reset(); previous = performance.now(); seenEvents = ''; renderedState = '';
    if (start) { void audio.unlock().then(updateAudioButton); engine.start(); }
    updateSelection(); updateUI(); renderer.draw(engine);
  }
  function toggle() {
    if (engine.state === 'running') { audio.stop(); engine.soundEvents.length=0; updateAudioDiagnostics(); }
    else void audio.unlock().then(updateAudioButton);
    if (engine.state === 'ready') {
      // Commit an edited seed even if a browser has not dispatched blur/change yet.
      const chosenSeed = $('seed').value.trim() || 'orb-001';
      if (engine.seed !== chosenSeed) reset();
      engine.start();
    }
    else if (engine.state === 'running') engine.pause();
    else if (engine.state === 'paused') engine.resume();
    else reset(true);
    clock.reset(); previous = performance.now(); updateUI();
  }
  function setSpeed(speed) {
    clock.speed = speed;
    document.querySelectorAll('[data-speed]').forEach(button => { const active = Number(button.dataset.speed) === speed; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  }
  function fitArena(){
    const arena=$('arena').parentElement,stage=document.querySelector('.battle-stage'),column=document.querySelector('.arena-column');
    const outerHeight=element=>{const style=getComputedStyle(element);return element.offsetHeight+(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0);};
    // Result details live in the rail and never reduce the field at the end.
    const reserve=outerHeight(document.querySelector('.transport'))+outerHeight(document.querySelector('.arena-note'))+16;
    const wide=window.matchMedia('(min-width:1100px)').matches,battleWidth=document.querySelector('.battle').clientWidth;
    const railWidth=Math.max(240,Math.min(300,battleWidth*.19)),gap=16;
    const top=column.getBoundingClientRect().top+window.scrollY,available=window.innerHeight-top-reserve;
    const width=Math.floor(Math.min(wide?battleWidth-railWidth*2-gap*2:battleWidth,1080,Math.max(180,available*G.Constants.width/G.Constants.height)));
    stage.style.setProperty('--rail-size',railWidth+'px');stage.style.setProperty('--arena-size',width+'px');
    if(arena.style.width!==width+'px')arena.style.width=width+'px';
  }
  function updateUI() {
    engine.balls.filter(b=>!b.demonServant).forEach((ball, i) => {
      $('name-' + i).textContent = ball.def.name;
      $('orb-dot-' + i).style.background = ball.def.color; $('orb-dot-' + i).style.boxShadow = `0 0 15px ${ball.def.color}33`;
      $('health-' + i).replaceChildren(document.createTextNode(roundHp(ball.hp) + ' '));
      const max = document.createElement('small'); max.textContent = '/ ' + ball.maxHp; $('health-' + i).append(max);
      $('fill-' + i).style.width = (ball.hp / ball.maxHp * 100) + '%'; $('fill-' + i).style.background = ball.def.color;
      G.VenomArcana?.updateBar(ball,$('bar-'+i));
      $('bar-' + i).setAttribute('aria-valuenow', ball.hp.toFixed(1)); $('bar-' + i).setAttribute('aria-valuemin', '0'); $('bar-' + i).setAttribute('aria-valuemax', ball.maxHp);
      $('fighter-' + i).classList.toggle('awakened',ball.awakening.active);
      const notice=$('awake-notice-'+i), recently=ball.awakening.active && engine.time-ball.awakening.activatedAt<2.4;
      const event=ball.notice,noticeText=recently?'✦ 觉醒！':event && engine.time-event.at<1.6?event.text:'';
      if(notice.textContent!==noticeText)notice.textContent=noticeText;
      notice.classList.toggle('active',!!noticeText);
      const meta=$('fighter-meta-'+i);
      const makeChip=stat=>{const chip=document.createElement('span'),label=document.createElement('span'),value=document.createElement('b');chip.className='stat-chip';label.className='stat-label';label.textContent=stat.label;value.textContent=String(stat.value).replace(/ \/ /g,'/');chip.append(label,value);chip.title=(stat.label==='返还CD'?'本局累计返还冷却：':stat.label+' ')+stat.value;return chip;};
      const status=document.getElementById('status-slot-'+i)||document.createElement('div');status.className='status-slot';status.id='status-slot-'+i;status.setAttribute('aria-label','当前状态与增益');
      const statusScroll=document.getElementById(status.id)?.querySelector('.status-items')?.scrollTop||0;
      G.StatusPanel.fillStats(meta,ball,engine,makeChip);meta.append(status);G.StatusPanel.render(status,ball,engine,statusScroll);
    });
    $('timer').textContent = timeString(engine.time);
    $('collision-count').textContent = engine.collisions + ' 次碰撞'; $('round-seed').textContent = 'SEED ' + engine.seed;
    $('phase-label').textContent = engine.time >= G.Constants.decayStart ? '决胜阶段 · 每秒流失 3 HP' : engine.time >= G.Constants.heatStart ? '加热阶段 · 伤害 ×' + engine.heatMultiplier.toFixed(2) : `${G.Constants.width} × ${G.Constants.height} · 球间动量 · 墙面反弹`;
    const eventKey = engine.events.length + ':' + engine.events[0]?.tick + ':' + engine.events[0]?.text;
    if (eventKey !== seenEvents) {
      seenEvents = eventKey;
      if (engine.events.length) {
        $('event-log').replaceChildren();
        for (const event of engine.events.slice(0, 4)) { const li = document.createElement('li'); const time = document.createElement('time'); time.textContent = timeString(event.time).slice(0, -3); const text = document.createElement('span'); text.textContent = event.text; li.append(time, text); $('event-log').append(li); }
      } else { const li = document.createElement('li'); li.className = 'empty-log'; li.textContent = '每一次碰撞，都有迹可循。'; const small = document.createElement('small'); small.textContent = '开场后记录伤害与技能。'; li.append(small); $('event-log').replaceChildren(li); }
    }
    if (engine.state !== renderedState) { renderedState = engine.state; updateState(); }
  }
  function updateState() {
    const state = engine.state, active = state === 'running' || state === 'paused';
    selects.forEach((select,i) => { select.disabled = active; }); $('seed').disabled = active; $('random-seed').disabled = active;
    $('config-note').textContent = active ? '本局配置已锁定；重新开始后可调整。' : '选择球种，观察能力如何相互作用。';
    const labels = { ready: '准备就绪', running: '对战进行中', paused: '已暂停', ended: '对战结束' };
    $('state-badge').textContent = state==='running'&&engine.ending?'收招结算中':labels[state]; $('state-badge').className = 'status-badge ' + state;
    $('arena-status').textContent = { ready: '等待开场', running: clock.speed + '× 自动模拟', paused: '模拟暂停', ended: '胜负已定' }[state];
    document.body.classList.toggle('paused-mode', state === 'paused'); document.body.classList.toggle('ended-mode', state === 'ended');
    $('toggle-label').textContent = { ready: '开始对战', running: '暂停', paused: '继续对战', ended: '再战同一局' }[state];
    $('toggle-icon').textContent = state === 'running' ? 'Ⅱ' : '▶';
    $('overlay').hidden = state === 'running'; $('result-summary').hidden = state !== 'ended';
    if (state === 'ready') { $('overlay-kicker').textContent = 'READY TO COLLIDE'; $('overlay-title').textContent = '一场碰撞，无限可能'; $('overlay-description').textContent = '选好双方球种，开始一场自动对决。'; $('overlay-start').textContent = '开始对战  ▶'; }
    if (state === 'paused') { $('overlay-kicker').textContent = 'TIME STANDS STILL'; $('overlay-title').textContent = '让时间停一会儿'; $('overlay-description').textContent = '运动、技能与伤害均已暂停。'; $('overlay-start').textContent = '继续对战  ▶'; }
    if (state === 'ended') {
      const winner = engine.balls.find(ball => ball.id === engine.winner);
      $('overlay-kicker').textContent = winner ? 'VICTORY / ' + (winner.id === 0 ? '01' : '02') : 'DOUBLE KNOCKOUT';
      $('overlay-title').textContent = winner ? engine.label(winner) + '获胜' : '势均力敌，双方平局';
      $('overlay-description').textContent = `${timeString(engine.time)} · ${engine.collisions} 次碰撞` + (winner ? ` · 剩余 ${winner.hp.toFixed(1)} 生命` : ' · 双方同时阵亡');
      $('overlay-start').textContent = '再战同一局  ↺';
      $('result-summary').textContent = engine.balls.filter(b=>!b.demonServant).map(ball => `${ball.id === 0 ? '左方' : '右方'}：伤害 ${ball.stats.damage.toFixed(1)} / 回复 ${ball.stats.healing.toFixed(1)} / 护盾吸收 ${ball.stats.absorbed.toFixed(1)} / 反伤 ${ball.stats.reflected.toFixed(1)}`+(ball.stats.wallSlams?` / 撞墙追击 ${ball.stats.wallSlams}`:'')+(ball.stats.bladesCaught?` / 接刃 ${ball.stats.bladesCaught} / 斩印 ${ball.stats.bladeFinishers}`:'')+(ball.stats.shotsFired?` / ${ball.type==='boomerang'?'飞刃命中次数':'子弹命中'} ${ball.stats.shotsHit}${ball.type==='boomerang'?'':'/'+ball.stats.shotsFired}`:'')+(ball.stats.lasersFired?` / 光束命中 ${ball.stats.lasersHit}/${ball.stats.lasersFired}`:'')+(ball.stats.countersFired?` / 反击命中 ${ball.stats.countersHit}/${ball.stats.countersFired}`:'')+(ball.stats.poisonHits?` / 毒伤 ${ball.stats.poisonHits}`:'')+(ball.stats.trapsPlaced?` / 陷阱触发 ${ball.stats.trapsTriggered}/${ball.stats.trapsPlaced}`:'')).join('　｜　');
    }
    fitArena();
  }
  window.addEventListener('resize',fitArena);
  const hudObserver=new ResizeObserver(fitArena);for(const selector of ['.header','.section-heading','.fighter','.transport'])hudObserver.observe(document.querySelector(selector));
  $('toggle').addEventListener('click', toggle); $('overlay-start').addEventListener('click', toggle);
  $('restart').addEventListener('click', () => reset()); $('new-match').addEventListener('click', () => reset(true, true));
  $('random-seed').addEventListener('click', () => reset(false, true));
  function updateAudioButton() {
    const button = $('sound-toggle');
    button.setAttribute('aria-pressed', String(audio.enabled));
    button.setAttribute('aria-label', audio.available ? (audio.enabled ? '关闭对战音效' : '开启对战音效') : '浏览器不支持音效');
    button.title = audio.available ? (audio.enabled ? '音效开启：碰撞、技能与觉醒使用不同声音' : '音效已静音') : '浏览器不支持 Web Audio';
    button.classList.toggle('muted', !audio.enabled); button.disabled = !audio.available;
  }
  $('sound-toggle').addEventListener('click', () => { audio.setEnabled(!audio.enabled); if (audio.enabled) void audio.unlock().then(updateAudioButton); updateAudioButton(); });
  selects.forEach(select => select.addEventListener('change', () => reset())); $('seed').addEventListener('change', () => reset());
  document.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => { setSpeed(Number(button.dataset.speed)); renderedState = ''; updateUI(); }));
  document.addEventListener('keydown', event => {
    if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName) || $('rules-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (event.code === 'Space') { event.preventDefault(); toggle(); }
    if (event.code === 'KeyR') { event.preventDefault(); reset(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && engine.state === 'running') { engine.pause(); audio.stop(); clock.reset(); updateUI(); } previous = performance.now(); });
  $('rules-button').addEventListener('click', () => { if (engine.state === 'running') { engine.pause(); audio.stop(); clock.reset(); updateUI(); } $('rules-dialog').showModal(); });
  $('close-rules').addEventListener('click', () => $('rules-dialog').close()); $('rules-done').addEventListener('click', () => $('rules-dialog').close());
  $('rules-dialog').addEventListener('click', event => { const box = $('rules-dialog').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('rules-dialog').close(); });
  function updateAudioDiagnostics() {
    // DOM diagnostics let local browser checks observe real sound triggers.
    const soundState = audio.snapshot();
    $('sound-toggle').dataset.audioState = soundState.contextState;
    $('sound-toggle').dataset.wallCount = soundState.played.wall;
    $('sound-toggle').dataset.ballCount = soundState.played.ball;
    $('sound-toggle').dataset.activeVoices = soundState.activeVoices;
    $('sound-toggle').dataset.skillCount=Object.entries(soundState.played).filter(([kind])=>kind!=='wall'&&kind!=='ball').reduce((n,[,count])=>n+count,0);
    $('sound-toggle').dataset.lastCue=soundState.lastCue || '';
  }
  function frame(now) {
    clock.advance((now - previous) / 1000); previous = now;
    // A queued cue or delayed audio unlock must not revive sound after pausing.
    if(engine.state==='paused'||engine.state==='ready'){engine.soundEvents.length=0;audio.stop();}
    else audio.consume(engine.soundEvents.splice(0));
    updateAudioDiagnostics();
    renderer.draw(engine);
    if (now - lastUi >= 50 || renderedState !== engine.state) { updateUI(); lastUi = now; }
    review.capture(now);
    requestAnimationFrame(frame);
  }
  updateSelection(); updateUI(); updateAudioButton(); renderer.draw(engine); requestAnimationFrame(frame);
  // Read-only snapshots are useful for local diagnostics without coupling UI to the engine.
  window.orbDuel = Object.freeze({ snapshot: () => engine.snapshot(), clock: () => ({ speed: clock.speed, accumulator: clock.accumulator }), audio: () => audio.snapshot(), review: () => review.info() });
})();
