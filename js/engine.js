(function (root) {
  'use strict';
  const G = root.OrbDuel, C = G.Constants;
  G.Engine = class Engine {
    constructor(types = ['normal', 'vampire'], seed = 'orb-001') { this.reset(types, seed); }
    reset(types, seed) {
      this.seed = String(seed || 'orb-001').trim();
      this.rng = new G.RNG(this.seed); this.fxRng = new G.RNG(this.seed + ':effects');
      this.balls = types.map((type, id) => G.makeBall(id, type, id === 0 ? C.width * 0.26 : C.width * 0.74, id === 0 ? C.height * 0.42 : C.height * 0.58, this.rng));
      this.tick = 0; this.time = 0; this.state = 'ready'; this.winner = null;
      this.collisions = 0; this.lastContactTime = 0; this.pairs = new Map();
      this.fxCooldowns = Object.create(null); this.effects = []; this.events = []; this.soundEvents = []; this.heatMultiplier = 1;
      this.trapChains=[];this.waves=[];this.beams=[];this.projectiles=[];this.traps=[];this.pools=[];this.pendingAttacks=[];this.contactPairs=[];this.nextWorldId=0;
      this.heatAnnounced = false; this.decayAnnounced = false;
      for (const ball of this.balls) { G.Skills[ball.type]?.update?.(ball, 0, this); }
    }
    label(ball) { return (ball.id === 0 ? '左方' : '右方') + ball.def.name; }
    start() { if (this.state === 'ready') { this.state = 'running'; this.log('对战开始 · 随机方向已就位'); } }
    pause() { if (this.state === 'running') this.state = 'paused'; }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    log(text) { this.events.unshift({ tick: this.tick, time: this.time, text }); this.events.length = Math.min(this.events.length, 40); }
    sound(kind, x) { this.soundEvents.push({ kind, pan: (x / C.width - 0.5) * 1.2, tick: this.tick }); if (this.soundEvents.length > 32) this.soundEvents.shift(); }
    float(x, y, text, color, strong = false) { this.effects.push({ kind: 'text', x:Math.max(38,Math.min(C.width-38,x)), y:Math.max(35,Math.min(C.height-22,y)), text, color, strong, age: 0, life: strong ? 1 : 0.85 }); }
    signal(ball,text,cue,target=null){
      ball.notice={text,at:this.time};this.log(this.label(ball)+' · '+text);
      if(cue!=='miss')this.sound(cue,ball.x);
      if(target){this.effects.push({kind:'link',x:ball.x,y:ball.y,endX:target.x,endY:target.y,color:ball.def.color,age:0,life:.22});}
    }
    impact(x,y,color,power=1) {
      this.effects.push({kind:'impact',x,y,color,power:Math.min(2,power),age:0,life:.18});
      this.ring(x,y,color,25+power*15);
    }
    ring(x, y, color, size) { this.effects.push({ kind: 'ring', x, y, color, size, age: 0, life: 0.4 }); }
    burst(x, y, color, count) { for (let i = 0; i < count; i++) { const angle = this.fxRng.between(0, Math.PI * 2), speed = this.fxRng.between(35, 130); this.effects.push({ kind: 'particle', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, age: 0, life: this.fxRng.between(0.25, 0.55) }); } }
    updateEffects(dt) {
      for (const effect of this.effects) { effect.age += dt; if (effect.kind === 'particle') { effect.x += effect.vx * dt; effect.y += effect.vy * dt; } }
      this.effects = this.effects.filter(effect => effect.age < effect.life).slice(-180);
    }
    step() {
      if (this.state !== 'running') return;
      const dt = C.dt;
      this.tick++; this.time = this.tick * dt;
      this.pendingAttacks=[];this.contactPairs=[];
      this.updateEffects(dt);
      this.heatMultiplier = Math.min(2.5, 1 + Math.max(0, this.time - C.heatStart) / 60);
      if (this.time >= C.heatStart && !this.heatAnnounced) { this.heatAnnounced = true; this.log('加热阶段 · 攻击伤害逐渐提升'); }
      if (this.time >= C.decayStart && !this.decayAnnounced) { this.decayAnnounced = true; this.log('决胜阶段 · 双方每秒流失 3 点生命'); }
      for(const ball of this.balls) {ball.previousX=ball.x;ball.previousY=ball.y;}
      for (const ball of this.balls) {
        ball.flash = Math.max(0, ball.flash - dt);
        if(ball.hitVisual)ball.hitVisual.age+=dt;
        G.Characters.update(ball,this);G.Roles.update(ball,this);G.Recovery.pressure(ball,this);G.Awakening.update(ball,dt,this);
        G.Skills[ball.type]?.update?.(ball, dt, this);
      }
      for (const ball of this.balls) {
        if (G.Physics.integrate(ball, dt)) {
          this.sound('wall', ball.x);G.Characters.wall(ball,this);
          if (this.tick % 2 === 0) this.burst(ball.x, ball.y, ball.def.color, 3);
        }
        if (this.tick % 5 === 0) { ball.trail.unshift({ x: ball.x, y: ball.y }); ball.trail.length = Math.min(ball.trail.length, 16); }
      }
      for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i], b = this.balls[j], key = `${a.id}:${b.id}`;
        let pair = this.pairs.get(key);
        if (!pair) { pair = { touching: false, lastHit: -Infinity }; this.pairs.set(key, pair); }
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        if (distance > a.radius + b.radius + 1) pair.touching = false;
        const impact=G.Physics.contactInfo(a,b);
        if (G.Physics.resolve(a, b)) {
          if (!pair.touching) { const heavy=G.Awakening.dashing(a,this)||G.Awakening.dashing(b,this);this.sound(heavy?'heavy':'ball',(a.x+b.x)/2);this.impact((a.x+b.x)/2,(a.y+b.y)/2,heavy?'#fff2a4':'#e7eef7',heavy?1.8:1); }
          if (!pair.touching && this.time - pair.lastHit >= C.collisionCooldown) {
            this.collisions++; this.lastContactTime = this.time; pair.lastHit = this.time;
            this.ring((a.x + b.x) / 2, (a.y + b.y) / 2, '#e7eef7', 45);
            this.burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#ced9e9', 12);
            this.pendingAttacks.push(...G.Combat.contactAttacks(a,b,this,impact));this.contactPairs.push([a,b]);
          }
          for(const ball of [a,b])if(G.Awakening.dashing(ball,this)){ball.awakening.dashHit=true;ball.awakening.stopAfterContact=true;}
          pair.touching = true;
        }
      }
      // A contact near a wall may push a ball out; alternate projection stabilizes both constraints.
      for (let pass = 0; pass < 32; pass++) {
        for (const ball of this.balls) if (G.Physics.constrain(ball)){this.sound('wall', ball.x);G.Characters.wall(ball,this);}
        let overlap = false;
        for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
          if (Math.hypot(this.balls[i].x - this.balls[j].x, this.balls[i].y - this.balls[j].y) < this.balls[i].radius + this.balls[j].radius - 0.001) { G.Physics.resolve(this.balls[i], this.balls[j]); overlap = true; }
        }
        if (!overlap) break;
      }
      for (const ball of this.balls) if (G.Physics.constrain(ball)){this.sound('wall', ball.x);G.Characters.wall(ball,this);}
      G.World.update(this,dt);
      G.Combat.resolveBatch(this.pendingAttacks,this,this.contactPairs);
      this.checkEnd();if(this.state==='ended')return;
      if (this.time >= C.decayStart) for (const ball of this.balls) G.Combat.applyDamage(ball, C.decayPerSecond * dt, this, { bypassShield: true, bypassInvulnerability:true, silent: true });
      this.checkEnd();
    }
    checkEnd() {
      const living = this.balls.filter(ball => ball.hp > 1e-8);
      if (living.length <= 1) {
        for (const ball of this.balls) { if (ball.hp <= 1e-8) ball.hp = 0; }
        this.state = 'ended'; this.winner = living.length ? living[0].id : 'draw';
        this.sound('victory',living.length?living[0].x:C.width/2);
        this.log(living.length ? `${this.label(living[0])}获胜 · 对战结束` : '双方同时阵亡 · 平局');
      }
    }
    snapshot() {
      return { seed: this.seed, tick: this.tick, time: this.time, state: this.state, winner: this.winner, collisions: this.collisions, trapChains:this.trapChains.map(c=>({...c,hitCounts:{...c.hitCounts}})),waves:this.waves.map(w=>({...w,hitIds:[...w.hitIds]})),beams:this.beams.map(b=>({...b,hitCounts:{...b.hitCounts}})),pools:this.pools.map(p=>({...p})),projectiles:this.projectiles.map(p=>({...p,hitIds:p.hitIds?[...p.hitIds]:undefined,history:p.history?p.history.map(v=>({...v})):undefined,curve:p.curve?{...p.curve,start:{...p.curve.start},control:{...p.curve.control},end:{...p.curve.end}}:undefined})),traps:this.traps.map(t=>({...t})),balls: this.balls.map(b => ({ id: b.id, type: b.type, x: b.x, y: b.y, vx: b.vx, vy: b.vy, hp: b.hp, shield: b.shield, speed: b.speed, motionSpeed:b.motionSpeed,inertia:b.inertia,stagger:b.stagger?{...b.stagger}:null,bladeMark:b.bladeMark?{...b.bladeMark}:null,character:{...b.character},role:{...b.role,bloodMark:b.role.bloodMark?{...b.role.bloodMark}:null},charges:b.charges,pressure:{...b.pressure},laserMisses:b.laserMisses,bladeCastId:b.bladeCastId,lastRecallCast:b.lastRecallCast,stance:{...b.stance},nextLaser:b.nextLaser,laser:b.laser?{...b.laser,origin:{...b.laser.origin}}:null,nextPool:b.nextPool,poison:b.poison?{...b.poison}:null,awakening:{...b.awakening},nextShot:b.nextShot,nextTrap:b.nextTrap,stats: { ...b.stats } })) };
    }
  };
  // The accumulator owns wall-clock conversion; the engine only sees fixed steps.
  G.Clock = class Clock {
    constructor(engine) { this.engine = engine; this.accumulator = 0; this.speed = 1; }
    reset() { this.accumulator = 0; }
    advance(realSeconds) {
      if (this.engine.state !== 'running') { this.reset(); return 0; }
      this.accumulator += Math.min(0.1, Math.max(0, realSeconds)) * this.speed;
      let steps = 0;
      while (this.accumulator + 1e-12 >= C.dt && this.engine.state === 'running') { this.engine.step(); this.accumulator -= C.dt; steps++; }
      if (this.engine.state !== 'running') this.reset();
      return steps;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
