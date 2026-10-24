(function (root) {
  'use strict';
  const G = root.OrbDuel, C = G.Constants;
  G.Engine = class Engine {
    constructor(types = ['normal', 'vampire'], seed = 'orb-001', options = {}) { this.mode=options.mode==='arcana'?'arcana':'1v1'; this.reset(types, seed); }
    reset(types, seed) {
      this.seed = String(seed || 'orb-001').trim();
      this.rng = new G.RNG(this.seed); this.fxRng = new G.RNG(this.seed + ':effects');
      this.balls = types.map((type, id) => G.makeBall(id, type, id === 0 ? C.width * 0.26 : C.width * 0.74, id === 0 ? C.height * 0.42 : C.height * 0.58, this.rng));
      if(this.mode==='arcana')for(const b of this.balls){const hp=G.Arcana?.health[b.type];if(hp)b.hp=b.maxHp=hp;}
      this.tick = 0; this.time = 0; this.state = 'ready'; this.winner = null; this.ending=null; this.resolvedThisTick=[];
      this.collisions = 0; this.lastContactTime = 0; this.pairs = new Map();
      this.fxCooldowns = Object.create(null); this.effects = []; this.events = []; this.soundEvents = []; this.heatMultiplier = 1;
      this.domainHitClocks={};this.timeDomains=[];this.timeClocks=[];this.trapChains=[];this.waves=[];this.beams=[];this.projectiles=[];this.traps=[];this.pools=[];this.pendingAttacks=[];this.contactPairs=[];this.nextWorldId=0;
      G.Holy?.reset(this);
      this.ghostEchoes=[];G.Demon?.reset(this);G.Cosmic?.reset(this);G.Charge?.reset(this);G.Stellar?.reset(this);G.Adaptive?.reset(this);G.Arcana?.reset(this);G.VampireHunt?.reset(this);G.Trapper?.reset(this);
      this.heatAnnounced = false; this.decayAnnounced = false;
      this.presentationEpoch=(this.presentationEpoch||0)+1;this.presentationTime=0;this.hitStopSerial=0;this.hitStopDuration=0;this.lastHitStop=-Infinity;
      G.Presentation?.reset(this);
      for (const ball of this.balls) { G.Skills[ball.type]?.update?.(ball, 0, this); }
    }
    label(ball) { return (ball.id === 0 ? '左方' : '右方') + ball.def.name; }
    start() { if (this.state === 'ready') { this.state = 'running'; this.log('对战开始 · 随机方向已就位'); } }
    pause() { if (this.state === 'running') this.state = 'paused'; }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    log(text) { this.events.unshift({ tick: this.tick, time: this.time, text }); this.events.length = Math.min(this.events.length, 40); }
    sound(kind, x, audio={}) { const event={ kind, pan: (x / C.width - 0.5) * 1.2, tick: this.tick, ...(Number.isFinite(audio.impactSpeed)?{impactSpeed:audio.impactSpeed}:{}) };this.soundEvents.push(event);G.Presentation?.observeSound(this,event); if (this.soundEvents.length > 32) this.soundEvents.shift(); }
    present(kind,data) { return G.Presentation?.emit(this,kind,data)||null; }
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
    hitStop(seconds=.055) {
      if(this.state!=='running')return;if(this.time===this.lastHitStop){this.hitStopDuration=Math.max(this.hitStopDuration,Math.min(.075,seconds));return;}if(this.time-this.lastHitStop<.22)return;
      this.lastHitStop=this.time;this.hitStopDuration=Math.min(.075,seconds);this.hitStopSerial++;
    }
    ring(x, y, color, size) { this.effects.push({ kind: 'ring', x, y, color, size, age: 0, life: 0.4 }); }
    burst(x, y, color, count) { for (let i = 0; i < count; i++) { const angle = this.fxRng.between(0, Math.PI * 2), speed = this.fxRng.between(35, 130); this.effects.push({ kind: 'particle', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, age: 0, life: this.fxRng.between(0.25, 0.55) }); } }
    updateEffects(dt) {
      G.Presentation?.advance(this,dt);
      for (const effect of this.effects) { effect.age += dt; if (effect.kind === 'particle') { effect.x += effect.vx * dt; effect.y += effect.vy * dt; } }
      this.effects = this.effects.filter(effect => effect.age < effect.life).slice(-180);
    }
    step() {
      if (this.state !== 'running') return;
      if(this.ending){this.finishStep(C.dt);return;}
      const dt = C.dt;
      this.resolvedThisTick=[];
      this.tick++; this.time = this.tick * dt;
      this.pendingAttacks=[];this.contactPairs=[];
      this.updateEffects(dt);
      this.heatMultiplier = Math.min(2.5, 1 + Math.max(0, this.time - C.heatStart) / 60);
      if (this.time >= C.heatStart && !this.heatAnnounced) { this.heatAnnounced = true; this.log('加热阶段 · 攻击伤害逐渐提升'); }
      if (this.time >= C.decayStart && !this.decayAnnounced) { this.decayAnnounced = true; this.log('决胜阶段 · 双方每秒流失 3 点生命'); }
      for(const ball of this.balls) {ball.previousX=ball.x;ball.previousY=ball.y;}
      G.Demon?.freezeStep?.(this,dt);G.Ghost.prepare(this);G.Temporal.begin(this,dt);G.DefenseArcana?.prepare(this,dt);G.Trapper?.prepare(this);G.Demon?.forces(this,dt);
      for (const ball of this.balls) {
        ball.flash = Math.max(0, ball.flash - dt);
        if(ball.hitVisual)ball.hitVisual.age+=dt;
        if(G.Demon?.frozen?.(ball,this))continue;
        G.Characters.update(ball,this);G.Magnet.settle(ball,this);G.Roles.update(ball,this);G.Recovery.pressure(ball,this);G.Awakening.update(ball,dt*ball.temporal.rate,this);
        if(!G.Temporal.silenced(ball,this)||ball.type==='accelerator'||G.DefenseArcana?.guardActive(ball,this))G.Skills[ball.type]?.update?.(ball, dt*ball.temporal.rate, this);
      }
      G.Arcana?.update(this,dt);
      for (const ball of this.balls) {
        if(G.Demon?.frozen?.(ball,this))continue;
        G.BladeHunt?.beforeMove(ball,dt,this);
        if (G.Priority?.forced(ball,this)?G.Physics.integrate(ball,dt):G.Arcana?.customMove(ball)?G.Arcana.move(ball,dt,this):G.Charge?.flowing(ball)?G.Charge.move(ball,dt,this):G.Physics.integrate(ball, dt)) {
          this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);
          if (this.tick % 2 === 0) this.burst(ball.x, ball.y, ball.def.color, 3);
        }
        if (this.tick % 5 === 0 && !G.VampireArcana?.hidden(ball,this)) { ball.trail.unshift({ x: ball.x, y: ball.y }); ball.trail.length = Math.min(ball.trail.length, 16); }
      }
      G.VampireHunt?.contacts(this);
      for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i], b = this.balls[j], key = `${a.id}:${b.id}`;
        let pair = this.pairs.get(key);
        if (!pair) { pair = { touching: false, lastHit: -Infinity }; this.pairs.set(key, pair); }
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        if (distance > a.radius + b.radius + 1) pair.touching = false;
        if(G.Ghost.phased(a)||G.Ghost.phased(b)||G.Arcana?.noContact(a)||G.Arcana?.noContact(b)||G.Charge?.flowing(a)||G.Charge?.flowing(b)){pair.touching=false;continue;}
        if(distance<=a.radius+b.radius&&!pair.touching&&this.time-pair.lastHit>=C.collisionCooldown&&G.World.enemy(a,b,this)&&G.Trapper?.contact(a,b,this)){pair.touching=true;pair.lastHit=this.time;continue;}
        const impact=G.Physics.contactInfo(a,b);
        if (G.Physics.resolve(a, b)) {
          if(!G.World.enemy(a,b,this)){pair.touching=true;continue;}
          G.Overdrive?.contact(a,b,this);
          if(G.Ghost.justExited(a,this)||G.Ghost.justExited(b,this)){pair.touching=true;continue;}
          G.Magnet.touch(a,b,this);
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
        for (const ball of this.balls) if (G.Physics.constrain(ball)){this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);}
        let overlap = false;
        for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
          if (!G.Ghost.phased(this.balls[i])&&!G.Ghost.phased(this.balls[j])&&!G.Arcana?.noContact(this.balls[i])&&!G.Arcana?.noContact(this.balls[j])&&!G.Charge?.flowing(this.balls[i])&&!G.Charge?.flowing(this.balls[j])&&Math.hypot(this.balls[i].x - this.balls[j].x, this.balls[i].y - this.balls[j].y) < this.balls[i].radius + this.balls[j].radius - 0.001) { G.Physics.resolve(this.balls[i], this.balls[j]); overlap = true; }
        }
        if (!overlap) break;
      }
      for (const ball of this.balls) if (G.Physics.constrain(ball)){this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);}
      G.Demon?.constrainHosts?.(this);G.Trapper?.swapDue(this);G.Pursuit?.update(this);G.Ghost.contacts(this);G.Holy?.updateWorld(this,dt);G.Demon?.world(this,dt);G.Cosmic?.world(this);G.Charge?.world(this,dt);G.Stellar?.world(this,dt);G.Arcana?.world(this,dt);G.World.update(this,dt);
      G.Combat.resolveBatch(this.pendingAttacks,this,this.contactPairs);G.Adaptive?.observe(this);
      this.checkEnd();if(this.ending||this.state==='ended')return;
      if (this.time >= C.decayStart) for (const ball of this.balls) G.Combat.applyDamage(ball, C.decayPerSecond * dt, this, { bypassShield: true, bypassInvulnerability:true, silent: true });
      this.checkEnd();
    }
    beginEnding(winner,message,pan,winnerTeam){
      G.Demon?.endCombat(this);
      if(this.ending||this.state==='ended')return;
      G.BladeHunt?.endCombat(this);G.LaserBlade?.endCombat(this);G.DefenseArcana?.endCombat(this);G.VampireHunt?.endCombat(this);G.Trapper?.clear(this,{reason:'end'});G.VampireArcana?.endCombat(this);
      for(const b of this.balls)if(b.hp<=1e-8)b.hp=0;
      const lethal=(this.resolvedThisTick||[]).filter(h=>this.balls.find(b=>b.id===h.target)?.hp===0);
      const duration=.3+Math.max(.32,...lethal.map(h=>h.kind==='arcTide'?1.6:h.kind==='arcBite'?1.55:h.kind==='arcBlood'?.9:['arcFist','arcSonic','arcPierce','supernova'].includes(h.kind)?.7:h.heavy?.55:.4));
      this.ending={started:this.time,until:this.time+duration,winner,message,pan,...(winnerTeam!==undefined?{winnerTeam}:{}),attacks:lethal.map(h=>({...h}))};
      this.pendingAttacks=[];this.contactPairs=[];
      // Other detached attacks cannot steal a posthumous kill. Existing impact
      // effects remain; no skill/world update is run during the recovery.
      this.projectiles=[];this.timeClocks=[];this.trapChains=[];
      G.Presentation?.note(this,'combat.ending',{duration,winner,attacks:lethal});
    }
    finishStep(dt){
      this.tick++;this.time=this.tick*dt;this.pendingAttacks=[];this.contactPairs=[];this.updateEffects(dt);G.VampireArcana?.finishStep(this);
      for(const b of this.balls){
        b.previousX=b.x;b.previousY=b.y;b.flash=Math.max(0,b.flash-dt);if(b.hitVisual)b.hitVisual.age+=dt;
        if(this.retired?.has(b.id))continue;
        // Continue existing momentum with its existing drag, never a new charge,
        // wall skill, contact attack or wall-slam damage.
        if(b.inertia>0){const decay=Math.exp(-dt*(b.impactDrag||4)*(b.temporal?.rate??1));b.vx*=decay;b.vy*=decay;b.inertia=Math.max(0,b.inertia-dt);}
        b.x+=b.vx*dt;b.y+=b.vy*dt;G.Physics.constrain(b);
        if(this.tick%5===0){b.trail.unshift({x:b.x,y:b.y});b.trail.length=Math.min(b.trail.length,16);}
      }
      for(let pass=0;pass<32;pass++){let overlap=false;
        for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
          const a=this.balls[i],b=this.balls[j];if(this.retired?.has(a.id)||this.retired?.has(b.id)||G.Ghost.phased(a)||G.Ghost.phased(b)||G.Arcana?.noContact(a)||G.Arcana?.noContact(b)||G.Charge?.flowing(a)||G.Charge?.flowing(b))continue;
          if(Math.hypot(a.x-b.x,a.y-b.y)<a.radius+b.radius-.001){G.Physics.resolve(a,b);overlap=true;}
        }
        for(const b of this.balls)G.Physics.constrain(b);if(!overlap)break;
      }
      // Advance only visual envelopes of already released attacks; hit tests and
      // periodic damage are deliberately absent from this branch.
      for(const w of this.arcanaWorld?.cones||[]){if(w.inward){w.previous=w.radius;w.radius=Math.max(0,w.radius-(w.speed||155)*dt);w.travel=w.reach-w.radius;}else{w.previous=w.travel;w.travel=Math.min(w.reach,w.travel+w.speed*dt);}}
      if(this.arcanaWorld)this.arcanaWorld.cones=this.arcanaWorld.cones.filter(w=>this.time<=w.until&&(!w.inward||w.radius>0));
      for(const w of this.waves)w.radius=Math.min(w.maxRadius||Infinity,(w.radius||0)+(w.speed||0)*dt);
      this.waves=this.waves.filter(w=>this.time< (w.expires??w.until??this.ending.until));
      if(this.time+1e-9>=this.ending.until)this.completeEnding();
    }
    completeEnding(){
      const result=this.ending;if(!result||this.state==='ended')return;
      for(const b of this.balls){b.vx=b.vy=0;b.motionSpeed=b.inertia=b.impactDrag=0;if(b.arcana){b.arcana.phase='idle';b.arcana.history=[];b.arcana.target=null;}}
      this.state='ended';this.winner=result.winner;if(result.winnerTeam!==undefined)this.winnerTeam=result.winnerTeam;
      this.sound('victory',result.pan);this.log(result.message);
    }
    checkEnd() {
      if(this.ending||this.state==='ended')return;
      const living=this.balls.filter(b=>!b.demonServant&&b.hp>1e-8);
      if(living.length<=1){this.beginEnding(living.length?living[0].id:'draw',living.length?`${this.label(living[0])}获胜 · 对战结束`:'双方同时阵亡 · 平局',living.length?living[0].x:C.width/2);return;}
      G.Demon?.cleanup(this);G.Cosmic?.cleanup(this);G.Charge?.cleanup(this);G.Stellar?.cleanup(this);G.Arcana?.cleanup(this);
      if(this.ghostEchoes.length)this.ghostEchoes=this.ghostEchoes.filter(v=>this.balls.some(b=>b.id===v.owner&&b.hp>0));
    }
    snapshot() {
      return { ...(this.trapperWorld?{trapperWorld:G.Trapper?G.Trapper.snapshot(this.trapperWorld):JSON.parse(JSON.stringify(this.trapperWorld))}:{}),...(this.ending?{ending:{...this.ending,attacks:this.ending.attacks.map(h=>({...h}))}}:{}),...(this.balls.some(b=>b.arcana)?{arcanaWorld:{cones:this.arcanaWorld.cones.map(w=>G.Arcana.snapshot(w)),...(this.arcanaWorld.tides?{tides:this.arcanaWorld.tides.map(w=>({...w,origin:{...w.origin},hitIds:[...w.hitIds],history:w.history.map(p=>({...p}))}))}:{}),...(this.arcanaWorld.defense?{defense:JSON.parse(JSON.stringify(this.arcanaWorld.defense))}:{})}}:{}),...(this.balls.some(b=>b.charge)?{chargeWorld:G.Charge.snapshot(this.chargeWorld)}:{}),...(this.balls.some(b=>b.stellar)?{stellarWorld:G.Stellar.snapshot(this.stellarWorld)}:{}),...(this.balls.some(b=>b.cosmic)?{cosmicWorld:G.Cosmic.snapshot(this.cosmicWorld)}:{}),...(this.demonWorld?{demonWorld:G.Demon.snapshotWorld(this)}:{}),...(this.balls.some(b=>b.type==='ghost')?{ghostEchoes:this.ghostEchoes.map(v=>G.Ghost.snapshotEcho(v))}:{}),...(this.holyWorld?{holyWorld:G.Holy.snapshotWorld(this.holyWorld)}:{}),mode:this.mode, seed: this.seed, tick: this.tick, time: this.time, state: this.state, winner: this.winner, collisions: this.collisions,domainHitClocks:{...this.domainHitClocks},timeDomains:this.timeDomains.map(d=>({...d})),timeClocks:this.timeClocks.map(c=>({...c})), trapChains:this.trapChains.map(c=>({...c,hitCounts:{...c.hitCounts},...(c.damage?{damage:{...c.damage}}:{})})),waves:this.waves.map(w=>({...w,hitIds:[...w.hitIds]})),beams:this.beams.map(b=>({...b,hitCounts:{...b.hitCounts}})),pools:this.pools.map(p=>({...p})),projectiles:this.projectiles.map(p=>({...p,hitIds:p.hitIds?[...p.hitIds]:undefined,history:p.history?p.history.map(v=>({...v})):undefined,curve:p.curve?{...p.curve,start:{...p.curve.start},control:{...p.curve.control},end:{...p.curve.end}}:undefined})),traps:this.traps.map(t=>({...t})),balls: this.balls.map(b => ({ ...(b.mechanism?{mechanism:{...b.mechanism}}:{}),...(b.cageWalls?.length?{cageWalls:b.cageWalls.map(w=>({id:w.id,bounds:{...w.bounds}}))}:{}),...(b.cageBounds?{cageBounds:{...b.cageBounds},cageId:b.cageId}:{}),...(b.hunt?{hunt:G.VampireHunt.snapshot(b.hunt)}:{}), ...(b.arcana?{arcana:G.Arcana.snapshot(b.arcana)}:{}), ...(b.charge?{charge:G.Charge.snapshot(b.charge)}:{}),...(b.stellar?{stellar:G.Stellar.snapshot(b.stellar)}:{}), ...(b.cosmic?{cosmic:{...b.cosmic,satellites:b.cosmic.satellites.map(v=>({...v}))}}:{}),...(b.adaptive?{adaptive:G.Adaptive.snapshot(b.adaptive)}:{}),...(b.demon?{demon:{...b.demon}}:{}),...(b.holy?{holy:G.Holy.snapshot(b.holy)}:{}),...(b.type==='reflector'?{stance:{...b.stance}}:{}),id: b.id, type: b.type, x: b.x, y: b.y, vx: b.vx, vy: b.vy, hp: b.hp, shield: b.shield, speed: b.speed, motionSpeed:b.motionSpeed,inertia:b.inertia,impactDrag:b.impactDrag,magnetic:{...b.magnetic,pullAttempt:b.magnetic.pullAttempt?{...b.magnetic.pullAttempt}:null},ghost:G.Ghost.snapshot(b.ghost),magneticMark:b.magneticMark?{...b.magneticMark}:null,temporal:{...b.temporal},shieldUntil:b.shieldUntil,nextShield:b.nextShield,stagger:b.stagger?{...b.stagger}:null,bladeMark:b.bladeMark?{...b.bladeMark}:null,character:{...b.character,bladeHunt:b.character.bladeHunt?JSON.parse(JSON.stringify(b.character.bladeHunt)):null,contactPoisonReady:{...b.character.contactPoisonReady}},role:{...b.role,...(b.role.aimTracks?{aimTracks:Object.fromEntries(Object.entries(b.role.aimTracks).map(([k,v])=>[k,{...v}]))}:{}),...(b.role.nearMisses?{nearMisses:Object.fromEntries(Object.entries(b.role.nearMisses).map(([id,v])=>[id,{...v}]))}:{}),bloodMark:b.role.bloodMark?{...b.role.bloodMark}:null},charges:b.charges,pressure:{...b.pressure},laserMisses:b.laserMisses,bladeCastId:b.bladeCastId,lastRecallCast:b.lastRecallCast,stance:{...b.stance},nextLaser:b.nextLaser,laser:b.laser?{...b.laser,origin:{...b.laser.origin}}:null,nextPool:b.nextPool,poison:b.poison?JSON.parse(JSON.stringify(b.poison)):null,venomTiming:b.venomTiming?JSON.parse(JSON.stringify(b.venomTiming)):null,awakening:{...b.awakening},nextShot:b.nextShot,nextTrap:b.nextTrap,stats: { ...b.stats } })) };
    }
  };
  // The accumulator owns wall-clock conversion; the engine only sees fixed steps.
  G.Clock = class Clock {
    constructor(engine) { this.engine = engine; this.accumulator = 0; this.speed = 1;this.stopRemaining=0;this.stopSeen=0;this.epoch=engine.presentationEpoch; }
    reset() { this.accumulator = 0; }
    advance(realSeconds) {
      if (this.engine.state !== 'running') { this.reset(); return 0; }
      if(this.epoch!==this.engine.presentationEpoch){this.epoch=this.engine.presentationEpoch;this.stopRemaining=0;this.stopSeen=0;}
      let remaining=Math.min(.1,Math.max(0,realSeconds));
      // Cosmetic release tails may decay through a hold; this never advances combat.
      this.engine.presentationTime+=remaining;
      const held=Math.min(remaining,this.stopRemaining);this.stopRemaining-=held;remaining-=held;
      this.accumulator += remaining * this.speed;
      let steps = 0;
      while (this.accumulator + 1e-12 >= C.dt && this.engine.state === 'running') {
        this.engine.step(); this.accumulator -= C.dt; steps++;
        if(this.stopSeen!==this.engine.hitStopSerial){this.stopSeen=this.engine.hitStopSerial;this.stopRemaining=this.engine.hitStopDuration;const held=Math.min(this.stopRemaining,Math.max(0,this.accumulator)/this.speed);this.stopRemaining-=held;this.accumulator-=held*this.speed;}
      }
      if (this.engine.state !== 'running') this.reset();
      return steps;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
