(function(root){
 'use strict';const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,EPS=1e-7;
 const R=G.ShieldResonance={
  config:{raw:6,royalRaw:3.5,speed:650,push:180,royalPush:205,freeze:.24,pause:.22,width:7,rays:96},
  event(e,b,style,p=b,extra={}){e.effects.push({kind:'shieldResonance',style,owner:b.id,x:p.x,y:p.y,age:0,life:.5,...extra});if(['break','royalBreak','rebound','hit'].includes(style)){const power=style==='royalBreak'?2.4:style==='break'?1.8:style==='rebound'?1.2:.8;e.shieldCamera={at:e.time,power};}},
  clear(e){e.shieldRings=[];e.shieldCamera=null;for(const b of e.balls||[]){if(b.demonStasis?.shieldResonance){b.vx=b.demonStasis.vx;b.vy=b.demonStasis.vy;delete b.demonStasis;}}for(const p of [...(e.projectiles||[]),...(e.timeClocks||[])])delete p.shieldPauseUntil;},
  emit(b,e,royal=false){if(b.hp<=0||e.ending||e.state!=='running')return;
   const w={id:e.nextWorldId++,owner:b.id,x:b.x,y:b.y,royal,heat:e.heatMultiplier,raw:royal?this.config.royalRaw:this.config.raw,started:e.time,until:e.time+1.8,hits:[[],[]],projectiles:[],rays:Array.from({length:this.config.rays},(_,i)=>{const a=i*TAU/this.config.rays;return{x:b.x,y:b.y,nx:Math.cos(a),ny:Math.sin(a),phase:0,alive:true};}),walls:{}};
   (e.shieldRings??=[]).push(w);this.event(e,b,royal?'royalBreak':'break',b,{life:.62});e.sound(royal?'royalResonance':'shieldResonance',b.x);e.hitStop(royal?.045:.035);G.Presentation?.note(e,'shield.resonance',{actorId:b.id,waveId:w.id,royal});return w;
  },
  breakOrdinary(b,e){const r=b.role;if(r.shieldRingUsed||!G.Awakening.active(b)||G.Temporal.silenced(b,e))return;r.shieldRingUsed=true;b.shield=0;b.shieldUntil=0;r.shieldReserve=r.shieldFireAt=0;b.awakening.pendingBurst=false;G.Adaptive?.close(b,r.shieldAdaptiveId);this.emit(b,e);},
  royalDamage(b,old,e){const u=b.arcana;if(!u||old<=u.royalShield)return;u.royalRingMask??=0;for(let i=0;i<3;i++){const threshold=G.DefenseArcana.royalAmount*(2-i)/3,bit=1<<i;if(!(u.royalRingMask&bit)&&old>=threshold-EPS&&(i===2?u.royalShield<=EPS:u.royalShield<threshold-EPS)){u.royalRingMask|=bit;this.emit(b,e,true);}}},
  distance(t,a,z){const dx=z.x-a.x,dy=z.y-a.y,l=dx*dx+dy*dy,u=l?Math.max(0,Math.min(1,((t.x-a.x)*dx+(t.y-a.y)*dy)/l)):0;return Math.hypot(t.x-a.x-dx*u,t.y-a.y-dy*u);},
  segment(w,ray,old,end,e){const b=e.balls.find(v=>v.id===w.owner);if(!b)return;const phase=ray.phase,angle=Math.atan2(ray.ny,ray.nx),padding=this.config.width+Math.hypot(end.x-w.x,end.y-w.y)*Math.PI/this.config.rays;
   for(const t of e.balls){if(t.hp<=0||!G.World.enemy(b,t,e)||G.World.absent(t,e)||G.Ghost.phased(t)||w.hits[phase].includes(t.id))continue;if(this.distance(t,old,end)>t.radius+padding)continue;
    // A blocked radial sector cannot hit through a team pillar or cage wall.
    if(!G.ArenaWalls.clear(end,t,e,0)||e.mode==='2v2'&&G.Team.rayLimit(end.x,end.y,Math.cos(Math.atan2(t.y-end.y,t.x-end.x)),Math.sin(Math.atan2(t.y-end.y,t.x-end.x)),0,e.obstacles)+EPS<Math.hypot(t.x-end.x,t.y-end.y))continue;
    w.hits[phase].push(t.id);e.pendingAttacks.push({source:b,target:t,kind:w.royal?'arcRoyalRing':'shieldRing',priority:w.royal?'arcana':undefined,raw:w.raw*w.heat,heat:w.heat,angle,ringId:w.id,ringPhase:phase,healRatio:0});
   }
   for(const field of ['projectiles','timeClocks'])for(const p of e[field]||[]){const key=field+':'+p.id;if(w.projectiles.includes(key)||!G.World.enemy(b,typeof p.owner==='object'?p.owner.id:p.owner,e)||this.distance(p,old,end)>(p.radius||5)+padding)continue;
    // Preserve the existing protected-ultimate entity hierarchy.
    if(G.Priority?.canRemove(p,e,{priority:w.royal?'arcana':'ordinary',reason:'shieldResonance'})===false)continue;
    w.projectiles.push(key);if(w.royal){p.shieldDestroyed=true;this.event(e,b,'disintegrate',p,{life:.32});}else{p.shieldPauseUntil=Math.max(p.shieldPauseUntil||0,e.time+this.config.pause);this.event(e,b,'suspend',p,{life:this.config.pause});}
   }
  },
  update(e,dt){if(!e.shieldRings?.length)return;if(e.ending||e.state==='ended'){this.clear(e);return;}if(e.state!=='running')return;
   e.shieldRings=e.shieldRings.filter(w=>{const b=e.balls.find(v=>v.id===w.owner&&v.hp>0);if(!b||e.time>=w.until)return false;const bounds=e.arcanaWorld?.defense?.fortress?.bounds||{left:0,right:C.width,top:0,bottom:C.height};
    for(const ray of w.rays){if(!ray.alive)continue;let remaining=this.config.speed*dt;
     for(let pass=0;pass<2&&remaining>EPS&&ray.alive;pass++){ray.x=Math.max(bounds.left,Math.min(bounds.right,ray.x));ray.y=Math.max(bounds.top,Math.min(bounds.bottom,ray.y));const old={x:ray.x,y:ray.y},dx=ray.nx>EPS?(bounds.right-ray.x)/ray.nx:ray.nx< -EPS?(bounds.left-ray.x)/ray.nx:Infinity,dy=ray.ny>EPS?(bounds.bottom-ray.y)/ray.ny:ray.ny< -EPS?(bounds.top-ray.y)/ray.ny:Infinity;
      const obstacle=G.ArenaWalls.hit(ray.x,ray.y,ray.nx,ray.ny,0,e),team=e.mode==='2v2'?G.Team.rayLimit(ray.x,ray.y,ray.nx,ray.ny,0,e.obstacles):Infinity,edge=Math.max(0,Math.min(dx,dy)),cover=Math.min(obstacle.distance,team),travel=Math.max(0,Math.min(remaining,edge,cover));ray.x+=ray.nx*travel;ray.y+=ray.ny*travel;this.segment(w,ray,old,ray,e);remaining-=travel;
      if(travel+EPS>=Math.min(edge,cover)){if(w.royal&&ray.phase===0&&edge<=cover+EPS&&e.arcanaWorld?.defense?.fortress){const side=dx<dy?(ray.nx>0?'right':'left'):(ray.ny>0?'bottom':'top');ray.phase=1;if(Math.abs(dx-dy)<EPS){ray.nx=-ray.nx;ray.ny=-ray.ny;}else if(dx<dy)ray.nx=-ray.nx;else ray.ny=-ray.ny;
        if(!w.walls[side]||e.time-w.walls[side]>.13){w.walls[side]=e.time;this.event(e,b,'rebound',ray,{side,life:.42});e.sound('royalRingRebound',ray.x);e.arcanaWorld.defense.fortress.resonanceAt=e.time;e.hitStop(.02);}
       }else ray.alive=false;
      }
     }
    }return w.rays.some(r=>r.alive);
   });
   for(const p of e.projectiles.filter(p=>p.shieldDestroyed)){const owner=e.balls.find(b=>b.id===p.owner);G.Aim?.result(p,e,false);G.Stellar?.detach(p,e);if(p.mode==='boomerang')G.Characters.bladeRemoved(p,owner,e,false);}
   e.projectiles=e.projectiles.filter(p=>!p.shieldDestroyed);e.timeClocks=e.timeClocks.filter(p=>!p.shieldDestroyed);
  },
  hit(h,e){if(!['shieldRing','arcRoyalRing'].includes(h.kind))return;if(h.avoided||h.actual+h.blocked<=0){h.feedback={presented:true,push:0,stop:0};return;}
   const t=h.target,prior=t.demonStasis,frozen=G.Demon.frozen(t,e);if(frozen){t.vx=prior.vx;t.vy=prior.vy;}G.Roles.shove(t,h.angle,h.kind==='arcRoyalRing'?this.config.royalPush:this.config.push,.75);
   if(h.kind==='arcRoyalRing'&&G.Demon.stasis(t,h.source,e,this.config.freeze)){t.demonStasis.until=Math.max(prior?.until||0,t.demonStasis.until);t.demonStasis.shieldResonance=!prior||!!prior.shieldResonance;t.vx=t.vy=0;}else if(frozen){prior.vx=t.vx;prior.vy=t.vy;t.vx=t.vy=0;}
   h.feedback={style:'shieldRingImpact',presented:true,push:0,stop:0,power:1.6};this.event(e,h.source,'hit',t,{angle:h.angle,royal:h.kind==='arcRoyalRing',life:.3});e.sound('shieldRingImpact',t.x);e.hitStop(.035);t.hitVisual={age:0,life:.18,angle:h.angle,power:1.5};
  }
 };
 // Reuse common damage, role and world entry points in every mode.
 const reset=G.Engine.prototype.reset;G.Engine.prototype.reset=function(...a){const r=reset.apply(this,a);R.clear(this);return r;};
 const ending=G.Engine.prototype.beginEnding;G.Engine.prototype.beginEnding=function(...a){R.clear(this);return ending.apply(this,a);};
 const rewind=G.TimeRewind.trigger;G.TimeRewind.trigger=function(e){const r=rewind.call(this,e);if(r)R.clear(e);return r;};
 const snapshot=G.Engine.prototype.snapshot;G.Engine.prototype.snapshot=function(){const s=snapshot.call(this);if(this.shieldRings?.length)s.shieldRings=JSON.parse(JSON.stringify(this.shieldRings));return s;};
 const grant=G.Roles.shieldUpdate;G.Roles.shieldUpdate=function(b,dt,e){const before=b.shield;grant.call(this,b,dt,e);if(before<=0&&b.shield>0){b.role.shieldRingUsed=false;b.role.shieldRingMax=b.shield;}};
 const awaken=G.Roles.activate;G.Roles.activate=function(b,e){awaken.call(this,b,e);if(b.type==='shield'){b.role.shieldRingUsed=false;b.role.shieldRingMax=G.Awakening.shieldOptions(b).amount;}};
 const shieldEnd=G.Roles.shieldEnd;G.Roles.shieldEnd=function(b,e){if(b.role.shieldRingUsed){b.role.shieldReserve=b.role.shieldFireAt=0;b.awakening.pendingBurst=false;return;}return shieldEnd.call(this,b,e);};
 const batch=G.Combat.resolveBatch;G.Combat.resolveBatch=function(packets,e,...args){const prev=e.balls.filter(b=>b.type==='shield').map(b=>({b,shield:b.shield})),r=batch.call(this,packets,e,...args);for(const {b,shield}of prev){if(shield>0&&b.shield<=0&&!G.Awakening.active(b))G.Roles.shieldEnd(b,e);if(shield>0&&b.shield<shield&&b.shield<(b.role.shieldRingMax||G.Awakening.shieldOptions(b).amount)*.5-EPS&&packets.some(h=>h.target===b&&G.World.enemy(h.source,b,e)&&h.raw>0))R.breakOrdinary(b,e);}return r;};
 const hit=G.Roles.hit;G.Roles.hit=function(h,e){hit.call(this,h,e);R.hit(h,e);};
 const world=G.World.update;G.World.update=function(e,dt){R.update(e,dt);const paused=e.projectiles.filter(p=>p.shieldPauseUntil>e.time&&e.balls.some(b=>b.id===p.owner&&b.hp>0));if(!paused.length)return world.call(this,e,dt);e.projectiles=e.projectiles.filter(p=>!paused.includes(p));for(const p of paused){if(Number.isFinite(p.expires))p.expires+=dt;if(Number.isFinite(p.curve?.started))p.curve.started+=dt;for(const key of ['turnAt','relayUntil','magnetUntil'])if(Number.isFinite(p[key])&&p[key]>e.time-dt)p[key]+=dt;}const r=world.call(this,e,dt);e.projectiles.push(...paused);return r;};
 const clocks=G.Temporal.moveClocks;G.Temporal.moveClocks=function(e,dt){const paused=e.timeClocks.filter(p=>p.shieldPauseUntil>e.time&&e.balls.some(b=>b.id===p.owner&&b.hp>0));e.timeClocks=e.timeClocks.filter(p=>!paused.includes(p));for(const p of paused)if(Number.isFinite(p.expires))p.expires+=dt;const r=clocks.call(this,e,dt);e.timeClocks.push(...paused);return r;};
 const status=G.Roles.status;G.Roles.status=function(b,e){const items=status.call(this,b,e);if(b.type!=='shield'||!G.Awakening.active(b)||b.role.shieldReserve)return items;const i=items.findIndex(v=>v.label==='波伤');if(i>=0)items[i]={label:'破盾波',value:b.role.shieldRingUsed?'本盾已用':b.shield>0?'低于50%触发':'待护盾'};return items;};
 if(G.DefenseArcana){const D=G.DefenseArcana,grantRoyal=D.grantRoyal,absorb=D.absorbRoyal;D.grantRoyal=function(b,e,f){const fresh=!b.arcana.royalGranted;grantRoyal.call(this,b,e,f);if(fresh)b.arcana.royalRingMask=0;};D.absorbRoyal=function(b,raw,e){const before=b.arcana?.royalShield||0,result=absorb.call(this,b,raw,e);if(result>0)R.royalDamage(b,before,e);return result;};D.queueShield=function(b,e){b.role.shieldReserve=b.role.shieldFireAt=0;b.awakening.pendingBurst=false;};}
})(typeof window!=='undefined'?window:globalThis);
