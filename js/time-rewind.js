(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const R=G.TimeRewind={seconds:10,freeze:.6,reverse:1.8,restart:.4,
    enabled(e){return e.mode==='arcana'&&e.balls.some(b=>b.type==='time'&&b.arcana&&!b.arcana.used&&!e.timeRewind?.spent.has(b.id));},
    fresh(e){e.timeRewind={history:[],spent:new Set(),active:null};if(this.enabled(e))this.record(e);},
    frame(e){return {time:e.time,balls:e.balls.map(b=>({id:b.id,x:b.x,y:b.y,hp:b.hp,used:!!b.arcana?.used,jump:Math.hypot(b.x-(e.timeRewind?.history.at(-1)?.balls.find(v=>v.id===b.id)?.x??b.x),b.y-(e.timeRewind?.history.at(-1)?.balls.find(v=>v.id===b.id)?.y??b.y))>Math.max(20,Math.hypot(b.vx,b.vy)*C.dt*2)}))};},
    record(e){if(!this.enabled(e)||e.timeRewind.active||e.ending)return;const h=e.timeRewind.history;h.push(this.frame(e));while(h.length>Math.ceil(this.seconds/C.dt)+2)h.shift();},
    trigger(e){if(!this.enabled(e)||e.timeRewind.active||e.ending)return false;const dying=e.balls.filter(b=>b.type==='time'&&b.hp<=1e-8&&!b.arcana?.used&&!e.timeRewind.spent.has(b.id)),b=dying[0];if(!b)return false;
      const history=e.timeRewind.history,desired=e.time-this.seconds;let index=0;for(let i=0;i<history.length;i++)if(history[i].time<=desired+1e-8)index=i;const target=history[index]||this.frame(e),frames=history.slice(index);frames.push(this.frame(e));e.effects=[];e.soundEvents=[];for(const actor of dying){e.timeRewind.spent.add(actor.id);G.Arcana.commit(actor,e);}b.arcana.phase='timeFreeze';e.timeRewind.active={owner:b.id,elapsed:0,phase:'freeze',target,frames,deathTime:e.time};e.pendingAttacks=[];e.contactPairs=[];e.sound('arcTimeFreeze',b.x);e.log('命运重启 · 终焉冻结');return true;},
    at(s,time,id){const frames=s.frames;let lo=0,hi=frames.length-1;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(frames[m].time<=time)lo=m;else hi=m-1;}const a=frames[lo],z=frames[Math.min(lo+1,frames.length-1)],p=clamp((time-a.time)/(z.time-a.time||1),0,1),b=a.balls.find(v=>v.id===id),c=z.balls.find(v=>v.id===id)||b;const move=c.jump&&p<1?0:p;return {x:b.x+(c.x-b.x)*move,y:b.y+(c.y-b.y)*move,hp:b.hp+(c.hp-b.hp)*p};},
    update(e,dt){const s=e.timeRewind.active;if(!s)return;s.elapsed+=dt;const phase=s.elapsed<this.freeze?'freeze':s.elapsed<this.freeze+this.reverse?'reverse':'restart';if(phase!==s.phase){s.phase=phase;e.sound(phase==='reverse'?'arcTimeReverse':'arcTimeRestart',C.width/2);}
      if(s.elapsed>=this.freeze){const p=clamp((s.elapsed-this.freeze)/this.reverse,0,1),time=s.deathTime+(s.target.time-s.deathTime)*p;s.cursor=time;for(const b of e.balls){const f=this.at(s,time,b.id);b.x=b.previousX=f.x;b.y=b.previousY=f.y;b.hp=clamp(f.hp,0,b.maxHp);b.vx=b.vy=0;b.trail=[];}}
      if(s.elapsed>=this.freeze+this.reverse+this.restart)this.finish(e);
    },
    cooldowns(b,e){const t=e.time,d=b.def,a=G.Awakening.active(b),r=b.role;
      b.nextShot=t+(d.shotPeriod||0);b.nextTrap=t+(b.type==='trapper'?G.Awakening.trapOptions(b).period:0);b.nextPool=t+(b.type==='venom'?G.Venom.config.poolPeriod:d.poolPeriod||0);b.nextShield=t+(b.type==='shield'?G.Awakening.shieldOptions(b).period:0);b.nextLaser=t+(a?2.1:1.1)+(a?3.6:4.2);r.coolingUntil=t+(a?2.1:1.1);r.capacitor=0;r.nextPursuit=t+7;r.nextSpit=t+(b.type==='venom'?G.Venom.config.spitPeriod:d.spitPeriod||0);b.character.nextSpread=0;b.pressure.lastHit=t;
      if(b.type==='ranger'){G.Ranger.init(b);r.ammo=0;r.reloadUntil=t+(a?d.reloadTime:d.baseReloadTime);b.nextShot=r.reloadUntil;}
      b.awakening.nextCast=a?t+8.5:Infinity;b.stance.next=t+(d.stancePeriod||0);b.temporal.nextDomain=b.type==='time'?t+d.domainPeriod:Infinity;b.temporal.nextClock=b.type==='time'&&a?t+d.clockPeriod:Infinity;
      b.ghost.nextPhase=b.type==='ghost'?t+d.phasePeriod+(a?1.6:0):Infinity;b.magnetic.nextPulse=b.type==='magnet'?t+d.magnetPeriod:Infinity;b.magnetic.nextOverload=b.type==='magnet'&&a?t+d.overloadPeriod:Infinity;
      if(b.holy){b.holy.triangleReady=t+4.2;b.holy.nextWard=t+d.wardPeriod;b.holy.nextJudgement=a?t+d.judgementPeriod:Infinity;}
      if(b.demon){b.demon.nextClaw=t+d.clawPeriod;b.demon.nextGate=a?t+d.gatePeriod:Infinity;}
      if(b.cosmic){b.cosmic.nextStrike=t+d.strikePeriod;b.cosmic.nextCharge=t+.5;b.cosmic.nextOrbit=t+1.5;b.cosmic.nextAwake=a?t+11.5:Infinity;}
      if(b.charge){b.charge.nextGain=t+.45;b.charge.nextDischarge=t+d.dischargePeriod;b.charge.nextForm=t+d.formPeriod;}
      if(b.stellar){b.stellar.nextLaunch=t+d.orbitCharge;b.stellar.nextNova=a?t+d.novaPeriod:Infinity;}
      if(b.type==='venom')for(const target of e.balls.filter(v=>G.World.enemy(b,v,e)))G.Venom.timing(target,e).ready[b.id]=t+G.Venom.config.applyInterval;
      if(b.hunt)b.hunt.nextCast=t+G.VampireHunt.cooldown;if(b.mechanism)b.mechanism.nextSwap=t+G.Trapper.swapPeriod;
    },
    finish(e){const state=e.timeRewind,s=state.active,preserved=e.balls.map(b=>({id:b.id,hp:b.maxHp,stats:b.stats,awake:G.Awakening.active(b),activatedAt:b.awakening.activatedAt}));
      for(const b of e.balls){const keep=preserved.find(v=>v.id===b.id),old=s.target.balls.find(v=>v.id===b.id),fresh=G.makeBall(b.id,b.type,old.x,old.y,e.rng);for(const key of Object.keys(b))delete b[key];Object.assign(b,fresh,{hp:clamp(old.hp,0,keep.hp),maxHp:keep.hp,stats:keep.stats});b.awakening.active=keep.awake;b.awakening.activatedAt=keep.activatedAt;}
      // Direct disposal, never cleanup callbacks that explode, refund, recall or heal.
      for(const key of ['timeDomains','timeClocks','trapChains','waves','beams','projectiles','traps','pools','pendingAttacks','contactPairs','ghostEchoes','effects','soundEvents','resolvedThisTick'])e[key]=[];e.domainHitClocks={};e.pairs=new Map();for(let i=0;i<e.balls.length;i++)for(let j=i+1;j<e.balls.length;j++)e.pairs.set(e.balls[i].id+':'+e.balls[j].id,{touching:false,lastHit:e.time});e.lastContactTime=e.time;e.fxCooldowns=Object.create(null);
      G.Holy?.reset(e);G.Demon?.reset(e);G.Cosmic?.reset(e);G.Charge?.reset(e);G.Stellar?.reset(e);G.Adaptive?.reset(e);G.Arcana?.reset(e);G.VampireHunt?.reset(e);G.Trapper?.reset(e);
      for(const b of e.balls){const old=s.target.balls.find(v=>v.id===b.id);if(b.arcana)b.arcana.used=state.spent.has(b.id)||old.used;this.cooldowns(b,e);if(b.id===s.owner){b.temporal.nextDomain=e.time;b.temporal.nextClock=G.Awakening.active(b)?e.time:Infinity;b.awakening.nextCast=G.Awakening.active(b)?e.time:Infinity;}G.Physics.constrain(b);b.previousX=b.x;b.previousY=b.y;}
      state.active=null;state.history=[];this.record(e);e.log('命运重启 · 自身技能就绪 / 敌方完整冷却');
    },
    recall(e){for(const d of e.timeDomains){if(e.time<d.armedAt||e.time>d.expires||d.rewindUsed)continue;d.rewindEntries??={};for(const b of e.balls){if(b.hp<=0||!G.World.enemy(d.owner,b,e)||G.VampireArcana?.hidden(b,e))continue;const inside=Math.hypot(b.x-d.x,b.y-d.y)<=d.radius+b.radius,entry=d.rewindEntries[b.id];if(inside){if(!entry)d.rewindEntries[b.id]={x:b.x,y:b.y,inside:true,path:[]};const a=d.rewindEntries[b.id];a.inside=true;a.path.push({x:b.x,y:b.y});if(a.path.length>600)a.path.splice(1,1);}
          else if(entry?.inside){entry.inside=false;if(G.Physics.armored(b))continue;d.rewindUsed=true;const path=[...entry.path,{x:b.x,y:b.y}];b.x=d.x;b.y=d.y;G.Physics.constrain(b);path.unshift({x:b.x,y:b.y});b.previousX=b.x;b.previousY=b.y;b.trail=[];e.effects.push({kind:'timeRecall',actor:b.id,path,color:b.def.color,symbol:b.def.symbol||'◷',age:0,life:.45});e.sound('domainRewind',b.x);break;}}}
    }
  };
  if(G.Arcana.health){G.Arcana.health.time=215;G.Arcana.defs.time={name:'终焉·命运重启',raw:0};}
  const reset=G.Engine.prototype.reset,step=G.Engine.prototype.step,end=G.Engine.prototype.checkEnd,snapshot=G.Engine.prototype.snapshot;
  G.Engine.prototype.reset=function(...args){const result=reset.apply(this,args);R.fresh(this);return result;};
  G.Engine.prototype.step=function(){if(this.timeRewind?.active){if(this.state==='running'){this.updateEffects(C.dt);R.update(this,C.dt);}return;}const result=step.call(this);if(this.timeRewind&&!this.timeRewind.active&&this.state==='running')R.record(this);return result;};
  G.Engine.prototype.checkEnd=function(){if(this.timeRewind?.active||R.trigger(this))return;return end.call(this);};
  G.Engine.prototype.snapshot=function(){const s=snapshot.call(this);if(s.timeDomains)s.timeDomains=s.timeDomains.map(d=>d.rewindEntries?{...d,rewindEntries:JSON.parse(JSON.stringify(d.rewindEntries))}:d);if(this.timeRewind?.active){const a=this.timeRewind.active;s.rewind={phase:a.phase,elapsed:a.elapsed,from:a.deathTime,to:a.target.time};}return s;};
  const damage=G.Combat.applyDamage;G.Combat.applyDamage=function(b,raw,e,...rest){if(e.timeRewind?.active)return {actual:0,blocked:0,avoided:raw};return damage.call(this,b,raw,e,...rest);};
  const begin=G.Temporal.begin;G.Temporal.begin=function(e,dt){begin.call(this,e,dt);R.recall(e);};
  const world=G.World.update;G.World.update=function(e,dt){world.call(this,e,dt);R.recall(e);};
  const copy=G.Arcana.copy,status=G.Arcana.status;G.Arcana.copy=function(type){return type==='time'?'奥义 · 终焉·命运重启：首次致死时自动触发，每局一次、不需觉醒。双方按真实轨迹倒退10秒（不足则到最早记录），只恢复位置和血量。临时实体/资源/状态清空，自身所有技能冷却清零、敌方所有技能进入完整冷却；保留已觉醒能力。本次奥义永久消耗；对手在被撤销窗口内用过的奥义恢复资格。':copy.call(this,type);};G.Arcana.status=function(b,e){return b.type==='time'&&b.arcana?{label:'奥义',value:e.timeRewind?.active?'命运逆流':b.arcana.used?'已使用':'首次致死触发'}:status.call(this,b,e);};
})(typeof window!=='undefined'?window:globalThis);
