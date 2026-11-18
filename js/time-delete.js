(function(root){
 'use strict';const G=root.OrbDuel,C=G.Constants;
 // Run the final public fixed-step pipeline, including mode-specific overrides.
 const direct=new Set(['holySword','holySpear','fistWave','demonClaw','demonPierce','demonBodyNail','shieldRing','arcRoyalRing','supernova','soulBurst','contact','shot','counter','sniper','scatter','boomerang','blade','bladeSlash','bladeHunt','poisonShot','holyLance','comet','satellite','laser','laserBlade','timeBlast','pressureWave','pursuitWave','normalWave','holyAngel','holySweep','demonHellSlash','demonHellCounter','demonSoul','demonTug','ghostCut','arcPierce','arcBlood','arcTide','arcFist','arcSonic','arcDebt','arcHolyJudge']);
 const T=G.TimeDelete={config:Object.freeze({seconds:1,cooldown:13,first:6,visual:.42,horizon:.10}),
  ready(b,e){return !!b&&b.type==='time'&&!b.demonServant&&b.hp>0&&e.state==='running'&&!e.ending&&!e.timeDeleting&&e.timeDeleteRequest===undefined&&!e.timeRewind?.active&&!e.balls.some(v=>G.Arcana?.busy(v))&&!G.Demon?.frozen(b,e)&&!G.World.absent(b,e)&&!G.Ghost.phased(b)&&!G.Temporal.silenced(b,e)&&e.time+1e-9>=(b.temporal.nextDelete??this.config.first);},
  approach(b,p){const vx=(p.vx??Math.cos(p.angle||0)*(p.speed||0))-b.vx,vy=(p.vy??Math.sin(p.angle||0)*(p.speed||0))-b.vy,dx=p.x-b.x,dy=p.y-b.y,r=b.radius+(p.radius||0),a=vx*vx+vy*vy,c=dx*dx+dy*dy-r*r,d=dx*vx+dy*vy;if(c<=0)return 0;if(a<1e-8||d>=0)return Infinity;const disc=d*d-a*c;return disc<0?Infinity:Math.max(0,(-d-Math.sqrt(disc))/a);},
  clear(a,b,e){return (!G.ArenaWalls||G.ArenaWalls.clear(a,b,e))&&(!G.Mines||G.Mines.freeLine(a,b,e));},
  threat(b,e){const horizon=this.config.horizon;
   for(const t of e.balls){if(!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||G.Ghost.phased(t)||G.Arcana?.noContact(t)||G.Charge?.flowing(t)||!(t.def.damage>0)||!this.clear(t,b,e))continue;const key=Math.min(b.id,t.id)+':'+Math.max(b.id,t.id),pair=e.pairs.get(key),distance=Math.hypot(t.x-b.x,t.y-b.y);if(pair?.touching&&distance<=b.radius+t.radius+1||pair&&e.time+horizon-pair.lastHit<C.collisionCooldown)continue;const at=this.approach(b,t);if(at<=horizon)return {kind:'contact',at,owner:t.id};}
   for(const p of [...e.projectiles,...e.timeClocks]){if(p.mode==='shard'||p.fromTrap||!e.balls.some(v=>v.id===p.owner&&v.hp>0)||!G.World.enemy(p.owner,b,e)||p.raw<=0||p.expires<e.time||p.shieldPauseUntil>e.time||p.mode==='arcBlood'&&!p.launched||!this.clear(p,b,e))continue;const at=this.approach(b,p),speed=Math.hypot(p.vx??Math.cos(p.angle||0)*(p.speed||0),p.vy??Math.sin(p.angle||0)*(p.speed||0));if(at<=horizon&&(!Number.isFinite(p.expires)||e.time+at<=p.expires)&&(p.range===undefined||speed*at<=p.range-(p.travel||0)))return {kind:'projectile',at,owner:p.owner};}
   // Reuse the locked-laser observation from the existing defensive skill.
   const laser=G.RangerArcana?.threats(b,e).find(v=>v.kind==='laser'&&v.at<=horizon&&this.clear(v,b,e));return laser||null;
  },
  request(b,e,confirmed=null){if(!this.ready(b,e)||!(confirmed||this.threat(b,e)))return false;e.timeDeleteRequest=b.id;return true;},
  run(e){const id=e.timeDeleteRequest;if(id===undefined)return false;delete e.timeDeleteRequest;const b=e.balls.find(v=>v.id===id);if(!this.ready(b,e))return false;
   const origin={x:b.x,y:b.y},start=e.time,tick=e.tick,stop=e.hitStopSerial,duration=e.hitStopDuration,lastStop=e.lastHitStop,sounds=e.soundEvents;
   e.timeDeleting=true;e.timeDeleteIntercept=false;e.soundEvents=[];
   // No wall-clock recursion: exactly 240 ordinary simulation steps, rendered zero times.
   try{for(let i=0,n=Math.round(this.config.seconds/C.dt);i<n;i++)e.step();}
   finally{e.timeDeleting=false;e.soundEvents=sounds;e.hitStopSerial=stop;e.hitStopDuration=duration;e.lastHitStop=lastStop;}
   b.temporal.nextDelete=e.time+this.config.cooldown;
   if(G.ManualCues&&G.ManualRoles?.owns(b,e))G.ManualCues.state(e).periods.delete=this.config.cooldown;
   e.timeDeleteView={serial:(e.timeDeleteView?.serial||0)+1,at:e.time,from:start,to:e.time,age:0};
   e.effects.push({kind:'timeDelete',x:b.x,y:b.y,startX:origin.x,startY:origin.y,age:0,life:this.config.visual});
   e.sound('timeDelete',b.x);e.log(e.label(b)+' · 时删·命运断章 · 跳过1秒');
   e.timeDeleteLast={owner:id,from:start,to:e.time,steps:e.tick-tick};return true;
  }
 };
 for(const proto of [G.Engine.prototype,...(G.TeamEngine?[G.TeamEngine.prototype]:[])]){const step=proto.step;proto.step=function(){if(this.timeDeleting)return step.call(this);for(const b of this.balls)if(!G.ManualRoles?.owns(b,this)&&T.ready(b,this)&&T.threat(b,this)){T.request(b,this);break;}if(this.timeDeleteRequest!==undefined&&T.run(this))return;const r=step.call(this);if(this.timeDeleteRequest!==undefined)T.run(this);this.timeDeleteIntercept=false;return r;};}
 const batch=G.Combat.resolveBatch;G.Combat.resolveBatch=function(packets,e,...args){if(!e.timeDeleting&&!e.timeDeleteIntercept)for(const h of packets){if(direct.has(h.kind)&&h.raw>0&&h.source.hp>0&&h.source!==h.target&&G.World.enemy(h.source,h.target,e)&&!G.ManualRoles?.owns(h.target,e)&&T.ready(h.target,e)&&T.request(h.target,e,{kind:h.kind,at:0})){e.timeDeleteIntercept=true;break;}}return batch.call(this,packets,e,...args);};
 const reset=G.Engine.prototype.reset;G.Engine.prototype.reset=function(...args){const r=reset.apply(this,args);delete this.timeDeleteRequest;delete this.timeDeleteView;delete this.timeDeleteLast;this.timeDeleting=this.timeDeleteIntercept=false;for(const b of this.balls)if(b.type==='time')b.temporal.nextDelete=T.config.first;return r;};
 const damage=G.Combat.applyDamage;G.Combat.applyDamage=function(b,raw,e,...rest){return e.timeDeleting||e.timeDeleteIntercept?{actual:0,blocked:0,avoided:raw}:damage.call(this,b,raw,e,...rest);};
 if(G.Arcana?.mixedDamage){const mixed=G.Arcana.mixedDamage;G.Arcana.mixedDamage=function(b,total,ordinary,piercing,shatter,e,...rest){return e.timeDeleting||e.timeDeleteIntercept?{actual:0,blocked:0,avoided:total,ordinaryActual:0,piercingActual:0}:mixed.call(this,b,total,ordinary,piercing,shatter,e,...rest);};}
 const status=G.Temporal.status;G.Temporal.status=function(b,e){const s=status.call(this,b,e);s.splice(1,0,{label:'时删CD',value:(b.temporal.nextDelete??T.config.first)>e.time?Math.max(0,(b.temporal.nextDelete??T.config.first)-e.time).toFixed(1)+'s':'就绪·待来袭'});return s;};
 if(G.ManualFour){const middle=G.ManualFour.middle,panel=G.ManualFour.panel;G.ManualFour.middle=function(b,e,probe=false){return b.type==='time'?(probe?!!(T.ready(b,e)&&T.threat(b,e)):T.request(b,e)):middle.call(this,b,e,probe);};G.ManualFour.panel=function(b,e){const p=panel.call(this,b,e);if(b.type==='time'){p.fields.splice(2,0,{label:'时删CD',value:(b.temporal.nextDelete??T.config.first)>e.time?Math.max(0,(b.temporal.nextDelete??T.config.first)-e.time).toFixed(1)+'s':'就绪·待来袭'});p.controls+=' · 中键：来袭时发动时删';}return p;};}
})(typeof window!=='undefined'?window:globalThis);
