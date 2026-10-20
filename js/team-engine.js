(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,T=G.Team;
  G.TeamEngine=class TeamEngine extends G.Engine {
    constructor(types=['normal','ranger','vampire','shield'],seed='team-001',map='open'){super(types,seed);this.reset(types,seed,map);}
    reset(types,seed,map=this.mapId||'open'){
      if(types.length!==4)throw new Error('2v2 requires four orb types');
      this.mode='2v2';this.mapId=T.maps[map]?map:'open';this.obstacles=T.maps[this.mapId].obstacles.map(o=>({...o}));T.current=this;
      super.reset(types,seed);for(const b of this.balls){const hp=({normal:280,accelerator:220,vampire:198})[b.type];if(hp)b.hp=b.maxHp=hp;}this.winnerTeam=null;this.retired=new Set();
      const positions=[[96,120],[96,320],[544,120],[544,320]];
      this.balls.forEach((b,i)=>{b.team=i<2?0:1;b.teamTarget=null;b.x=b.previousX=positions[i][0];b.y=b.previousY=positions[i][1];});
    }
    label(b){return T.names[b.team??(b.id<2?0:1)]+(b.id%2+1)+'号·'+b.def.name;}
    retire(){
      G.Demon?.cleanup(this);G.Cosmic?.cleanup(this);G.Charge?.cleanup(this);G.Stellar?.cleanup(this);G.Arcana?.cleanup(this);
      for(const b of this.balls)if(b.hp<=1e-8&&!this.retired.has(b.id)){
        G.BladeHunt?.retire(b,this);G.Holy?.retire(b,this);G.VampireHunt?.finish(b,this,true);this.retired.add(b.id);b.hp=0;b.vx=b.vy=0;b.motionSpeed=b.inertia=b.impactDrag=0;b.shield=0;b.trail=[];b.poison=b.stagger=b.magneticMark=b.bladeMark=null;b.laser=null;
        b.ghost.phase='solid';b.ghost.lungeSpeed=b.ghost.chargeUntil=0;b.magnetic.phase='rest';b.magnetic.anchored=false;b.magnetic.pullAttempt=null;b.role.chainWarning=b.role.salvoFireAt=b.role.shieldFireAt=b.role.counterRelease=0;b.awakening.chainActive=false;b.awakening.dashUntil=b.awakening.chargeUntil=0;
        b.ghost.trace=null;
        for(const field of ['projectiles','traps','pools','waves','beams','timeDomains','timeClocks','trapChains','ghostEchoes'])this[field]=this[field].filter(v=>v.owner!==b.id);
        this.signal(b,'已淘汰','miss');this.burst(b.x,b.y,b.def.color,16);
      }
    }
    checkEnd(){
      if(this.ending||this.state==='ended')return;
      const live=[0,1].filter(team=>this.balls.some(b=>b.team===team&&b.hp>1e-8));
      if(live.length<2)this.beginEnding(live.length?live[0]:'draw',live.length?T.names[live[0]]+'获胜 · 敌队全灭':'两队同时全灭 · 平局',C.width/2,live.length?live[0]:'draw');
    }
    snapshot(){const s=super.snapshot();return {...s,mode:this.mode,mapId:this.mapId,width:C.width,height:C.height,winnerTeam:this.winnerTeam,obstacles:this.obstacles.map(o=>({...o})),balls:s.balls.map((b,i)=>({...b,team:this.balls[i].team,teamTarget:this.balls[i].teamTarget}))};}
    step() {
      if (this.state !== 'running') return;
      if(this.ending){G.Team.current=this;this.finishStep(C.dt);return;}
      this.resolvedThisTick=[];
      const dt = C.dt;
      this.tick++; this.time = this.tick * dt;
      G.Team.current=this;this.pendingAttacks=[];this.contactPairs=[];
      this.updateEffects(dt);
      this.heatMultiplier = Math.min(2.5, 1 + Math.max(0, this.time - C.heatStart) / 60);
      if (this.time >= C.heatStart && !this.heatAnnounced) { this.heatAnnounced = true; this.log('加热阶段 · 攻击伤害逐渐提升'); }
      if (this.time >= C.decayStart && !this.decayAnnounced) { this.decayAnnounced = true; this.log('决胜阶段 · 存活小球每秒流失 3 点生命'); }
      for(const ball of this.balls) {if(ball.hp<=0)continue;ball.previousX=ball.x;ball.previousY=ball.y;}
      G.Team.acquire(this);G.Ghost.prepare(this);G.Temporal.begin(this,dt);G.Trapper?.prepare(this);G.Demon?.forces(this,dt);
      for (const ball of this.balls) {
        if(ball.hp<=0)continue;
        ball.flash = Math.max(0, ball.flash - dt);
        if(ball.hitVisual)ball.hitVisual.age+=dt;
        G.Characters.update(ball,this);G.Magnet.settle(ball,this);G.Roles.update(ball,this);G.Recovery.pressure(ball,this);G.Awakening.update(ball,dt*ball.temporal.rate,this);
        if(!G.Temporal.silenced(ball,this)||ball.type==='accelerator'||G.DefenseArcana?.guardActive(ball,this))G.Skills[ball.type]?.update?.(ball, dt*ball.temporal.rate, this);
      }
      G.Arcana?.update(this,dt);
      for (const ball of this.balls) {
        if(ball.hp<=0)continue;
        G.BladeHunt?.beforeMove(ball,dt,this);
        if (G.Arcana?.customMove(ball)?G.Arcana.move(ball,dt,this):G.Charge?.flowing(ball)?G.Charge.move(ball,dt,this):G.Physics.integrate(ball, dt)) {
          this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);
          if (this.tick % 2 === 0) this.burst(ball.x, ball.y, ball.def.color, 3);
        }
        if (this.tick % 5 === 0) { ball.trail.unshift({ x: ball.x, y: ball.y }); ball.trail.length = Math.min(ball.trail.length, 16); }
      }
      G.VampireHunt?.contacts(this);
      for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i], b = this.balls[j], key = `${a.id}:${b.id}`;if(a.hp<=0||b.hp<=0)continue;
        let pair = this.pairs.get(key);
        if (!pair) { pair = { touching: false, lastHit: -Infinity }; this.pairs.set(key, pair); }
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        if (distance > a.radius + b.radius + 1) pair.touching = false;
        if(G.Ghost.phased(a)||G.Ghost.phased(b)||G.Arcana?.noContact(a)||G.Arcana?.noContact(b)||G.Charge?.flowing(a)||G.Charge?.flowing(b)){pair.touching=false;continue;}
        if(distance<=a.radius+b.radius&&!pair.touching&&this.time-pair.lastHit>=C.collisionCooldown&&G.Trapper?.contact(a,b,this)){pair.touching=true;pair.lastHit=this.time;continue;}
        const impact=G.Physics.contactInfo(a,b);
        if (G.Physics.resolve(a, b)) {
          if(G.Ghost.justExited(a,this)||G.Ghost.justExited(b,this)){pair.touching=true;continue;}
          if(!G.World.enemy(a,b,this)){pair.touching=true;continue;}
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
        for (const ball of this.balls) if (ball.hp>0&&G.Physics.constrain(ball)){this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);}
        let overlap = false;
        for (let i = 0; i < this.balls.length; i++) for (let j = i + 1; j < this.balls.length; j++) {
          if (this.balls[i].hp>0&&this.balls[j].hp>0&&!G.Ghost.phased(this.balls[i])&&!G.Ghost.phased(this.balls[j])&&!G.Arcana?.noContact(this.balls[i])&&!G.Arcana?.noContact(this.balls[j])&&!G.Charge?.flowing(this.balls[i])&&!G.Charge?.flowing(this.balls[j])&&Math.hypot(this.balls[i].x - this.balls[j].x, this.balls[i].y - this.balls[j].y) < this.balls[i].radius + this.balls[j].radius - 0.001) { G.Physics.resolve(this.balls[i], this.balls[j]); overlap = true; }
        }
        if (!overlap) break;
      }
      for (const ball of this.balls) if (ball.hp>0&&G.Physics.constrain(ball)){this.sound('wall', ball.x,{impactSpeed:ball.wallContact?.speed});G.Characters.wall(ball,this);}
      G.Trapper?.swapDue(this);G.Pursuit?.update(this);G.Ghost.contacts(this);G.Holy?.updateWorld(this,dt);G.Demon?.world(this,dt);G.Cosmic?.world(this);G.Charge?.world(this,dt);G.Stellar?.world(this,dt);G.Arcana?.world(this,dt);G.World.update(this,dt);
      G.Combat.resolveBatch(this.pendingAttacks,this,this.contactPairs);G.Adaptive?.observe(this);
      this.checkEnd();if(this.ending||this.state==='ended')return;this.retire();
      if (this.time >= C.decayStart) for (const ball of this.balls) if(ball.hp>0)G.Combat.applyDamage(ball, C.decayPerSecond * dt, this, { bypassShield: true, bypassInvulnerability:true, silent: true });
      this.checkEnd();if(!this.ending)this.retire();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
