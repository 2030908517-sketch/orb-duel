(function(root){
 'use strict';const G=root.OrbDuel,D=G.Demon,C=G.Constants;
 const A=G.DemonArcana={
  stage:Object.freeze({gateDistance:230,reach:190,pullDuration:.85,flight:.55,pinWarning:.20,pinFlight:.18,gripHold:.50,sideGap:56,soulMargin:74}),
  farPoint(t,e,limit,angle,margin=28){let best=null,score=-Infinity;
   for(const turn of [0,.35,-.35,.7,-.7,1.05,-1.05,1.5,-1.5,2,-2,2.55,-2.55,Math.PI])for(let d=limit;d>=35;d-=10){const a=angle+turn,p={x:t.x+Math.cos(a)*d,y:t.y+Math.sin(a)*d};if(!D.legal(p,e,margin)||!D.clear(t,p,e,14))continue;const value=d-Math.abs(turn)*10;if(value>score){best=p;score=value;}}
   return best;
  },
  gatePoint(b,t,e,second=false){const soul=D.soul(e,t,b),speed=Math.hypot(t.vx,t.vy),angle=second&&soul?Math.atan2(t.y-soul.y,t.x-soul.x):speed>1?Math.atan2(-t.vy,-t.vx):Math.atan2(b.y-t.y,b.x-t.x);return this.farPoint(t,e,this.stage.gateDistance,angle)||D.rearPoint(b,t,t,e,second);},
  drawSoul(b,t,s,e,portal,duration=this.stage.pullDuration){const angle=Math.atan2(portal.y-t.y,portal.x-t.x),goal=this.farPoint(t,e,this.stage.reach,angle,this.stage.soulMargin)||this.farPoint(t,e,this.stage.reach,angle,s.radius+2);if(!goal)return false;
   s.arcana=true;s.arcanaReach=this.stage.reach;s.grandStage=true;s.bound=true;s.binding=false;s.until=e.time+8;
   s.arcPull={x:s.x,y:s.y,goalX:goal.x,goalY:goal.y,started:e.time,duration};
   const d=Math.hypot(goal.x-t.x,goal.y-t.y)||1;s.extraction={started:e.time,duration,dx:(goal.x-t.x)/d,dy:(goal.y-t.y)/d,portalX:portal.x,portalY:portal.y,portalAngle:portal.angle??angle,clawId:portal.id};return true;
  },
  moveSoul(s,e,dt){const b=D.actor(e,s.owner),t=D.actor(e,s.target);if(!b||!t)return;s.previousX=s.x;s.previousY=s.y;
   if(!D.clear(t,s,e,2)){this.finish(b,e,'obstructed');return;}
   const p=s.arcPull;if(p?.waitForPin){p.started=e.time;s.extraction.duration=e.time-s.extraction.started+p.duration;s.vx=s.vy=0;return;}if(p&&!p.done){const u=Math.min(1,Math.max(0,(e.time-p.started)/p.duration)),q=u*u*(3-2*u),goal={x:p.x+(p.goalX-p.x)*q,y:p.y+(p.goalY-p.y)*q};D.advance(s,(goal.x-s.x)/dt,(goal.y-s.y)/dt,dt,e);
    if(Math.hypot(s.x-t.x,s.y-t.y)>s.arcanaReach||!D.clear(t,s,e,2)||!D.legal(s,e,s.radius))D.fitTether(s,t,e,s.arcanaReach);
    if(u>=1){p.done=true;s.extraction.finished=true;s.binding=true;s.anchorX=s.x;s.anchorY=s.y;D.event(e,b,'bind',s,'demonChain',{life:.45});}
   }else {s.vx=s.vy=0;if(Math.hypot(s.x-t.x,s.y-t.y)>s.arcanaReach||!D.legal(s,e,s.radius))D.fitTether(s,t,e,s.arcanaReach);}
   s.lastHostX=t.x;s.lastHostY=t.y;
  },

  active(b){return b?.type==='demon'&&b.arcana?.phase.startsWith('soul');},
  holding(b){return ['soulBlink','soulBurn','soulDye'].includes(b.arcana?.phase);},
  ready(b,t,e){const u=b.arcana;if(!u||u.used||u.phase!=='idle'||b.hp<=0||e.ending||!G.Awakening.active(b)||b.hp>b.maxHp*.3||!t||G.Priority?.forced(b,e))return false;const other=D.soul(e,t);return !other||other.owner===b.id;},
  update(b,t,e,dt=C.dt){const u=b.arcana;if(!u)return;if(this.active(b)){if(u.phase==='soulSpread'){const s=D.soul(e,t,b);if(!s){this.finish(b,e,'failed');return;}if(e.time>=u.until&&s.arcPull?.done)this.burn(b,t,s,e);}else if(e.demonCinematic?.owner===b.id)this.advance(e,dt);return;}if(this.ready(b,t,e)){u.waiting='等待下一轮双门';if(e.time>=b.demon.nextGate&&!e.demonWorld.claws.some(c=>c.owner===b.id&&!c.arcana&&e.time<=c.expires))this.begin(b,t,e);}},
  point(b,t,s,e){const mid={x:(t.x+s.x)/2,y:(t.y+s.y)/2},a=Math.atan2(s.y-t.y,s.x-t.x)+Math.PI/2;for(const side of [1,-1])for(const gap of [this.stage.sideGap,72,40,28]){const p={x:mid.x+Math.cos(a)*side*gap,y:mid.y+Math.sin(a)*side*gap};if(D.legal(p,e,b.radius)&&D.clear(p,mid,e,2)&&Math.hypot(p.x-t.x,p.y-t.y)>=b.radius+t.radius+4&&Math.hypot(p.x-s.x,p.y-s.y)>=b.radius+s.radius+4)return p;}return null;},
  begin(b,t,e){if(e.state!=='running'||e.demonCinematic||b.arcana.used)return false;const u=b.arcana,rate=b.temporal.rate,cd=b.temporal.cooldownRate,vx=b.vx,vy=b.vy;G.Arcana.commit(b,e);b.temporal.rate=rate;b.temporal.cooldownRate=cd;b.vx=vx;b.vy=vy;
   Object.assign(u,{phase:'soulGateOne',target:t.id,started:e.time,until:Infinity,returnAngle:Math.atan2(vy,vx),waiting:'',cinemaAge:0});b.demon.nextGate=e.time+b.def.gatePeriod;const cast=D.cast(b,t,e,true);this.gate(b,t,e,cast,'extract');return true;
  },
  gate(b,t,e,cast,stage){const second=stage==='pin';const c=D.newClaw(b,t,e,cast,{gate:true,second,warning:second?this.stage.pinWarning:.55,lock:second?.10:.2,flight:second?this.stage.pinFlight:this.stage.flight,start:this.gatePoint(b,t,e,second),raw:(second?b.def.soulPierceDamage:b.def.gateDamage*e.rng.between(.9,1.1))*cast.heat});c.arcStage=stage;return c;},
  gateWorld(c,cast,b,t,e,dt){if(e.time>c.expires){e.demonWorld.claws=e.demonWorld.claws.filter(v=>v!==c);return;}if(c.done)return;
   if(G.Arcana.immuneTarget(t,e)||c.arcStage==='pin'&&(G.Temporal.controlImmune(t,e)||G.Priority?.armored(t))){for(const k of ['at','lockAt','expires','warningAt'])c[k]+=dt;return;}
   if(!D.clear({x:c.startX,y:c.startY},t,e,c.attackRadius)){c.blockedFor=(c.blockedFor||0)+dt;for(const k of ['at','lockAt','expires','warningAt'])c[k]+=dt;if(c.blockedFor>2)this.finish(b,e,'obstructed');return;}c.blockedFor=0;
   c.endX=t.x;c.endY=t.y;c.locked=e.time>=c.lockAt;if(e.time<c.at)return;if(!c.released){c.released=true;e.sound(c.arcStage==='pin'?'demonNailLaunch':'demonClaw',c.startX);}const u=Math.max(0,Math.min(1,(e.time-c.at)/c.flight));c.x=c.startX+(c.endX-c.startX)*u;c.y=c.startY+(c.endY-c.startY)*u;
   if(u>=1&&!c.hit){c.hit=true;c.resultPending=true;e.pendingAttacks.push({source:b,target:t,raw:c.raw,heat:c.heat,kind:c.arcStage==='pin'?'arcSoulPin':'arcSoulClaim',priority:'arcana',bypassShield:true,clawId:c.id,castId:cast.id,point:{x:t.x,y:t.y},angle:Math.atan2(c.endY-c.startY,c.endX-c.startX),healRatio:0});}
  },
  clawDone(c,e){const b=D.actor(e,c.owner),t=D.actor(e,c.target);if(!b||!t||!this.active(b))return;const s=D.soul(e,t,b),cast=e.demonWorld.casts.find(v=>v.id===c.castId);if(!c.success||!s){this.finish(b,e,'failed');return;}if(c.arcStage==='extract'){
    if(!this.drawSoul(b,t,s,e,{x:c.startX,y:c.startY,angle:c.portalAngle,id:c.id})){this.finish(b,e,'obstructed');return;}
    // Keep this first hand closed on the same soul; the nail, never another hand, releases the pull.
    s.arcPull.waitForPin=true;D.stasis(t,b,e,this.stage.gripHold);b.arcana.phase='soulGateTwo';this.gate(b,t,e,cast,'pin');
   }else {s.arcPull.waitForPin=false;s.arcPull.started=e.time;s.extraction.duration=e.time-s.extraction.started+s.arcPull.duration;b.arcana.phase='soulSpread';b.arcana.until=e.time+s.arcPull.duration;}
  },
  burn(b,t,s,e){const p=this.point(b,t,s,e);if(!p){this.finish(b,e,'obstructed');return;}s.arcana=true;s.bound=true;b.arcana.phase='soulBlink';e.demonCinematic={owner:b.id,target:t.id,soul:s.id,age:0,from:{x:b.x,y:b.y},to:p,soulPoint:{x:s.x,y:s.y},hostPoint:{x:t.x,y:t.y},cut:false};D.event(e,b,'hellfireStart',b,'demonFireCharge',{life:.3});},
  advance(e,dt){const c=e.demonCinematic;if(!c||e.state!=='running')return;const b=D.actor(e,c.owner),t=D.actor(e,c.target),s=e.demonWorld?.souls.find(s=>s.id===c.soul);if(!b||!t||!s||b.hp<=0||t.hp<=0||e.ending){this.finish(b,e,'end');return;}
   c.age+=dt;const u=b.arcana;u.cinemaAge=c.age;

   if(c.age>=.16&&u.phase==='soulBlink'){b.x=b.previousX=c.to.x;b.y=b.previousY=c.to.y;b.vx=b.vy=0;u.phase='soulBurn';e.sound('demonHellfire',b.x);}
   if(c.age>=1.12&&!c.cut){c.cut=true;u.phase='soulDye';e.sound('demonFireSever',s.x);G.Presentation?.note(e,'demon.hellfireSever',{actorId:b.id,x:s.x,y:s.y});}
   if(c.age>=2){const r=D.Servants.add(b,t,{x:s.x,y:s.y},e);r.at=e.time;D.Servants.spawn(r,e);e.effects=e.effects.filter(f=>!(f.kind==='demonSoul'&&f.owner===b.id&&['assimilate','reborn'].includes(f.style)));D.effect(e,b,'hellfireSeal',s,{life:.4});D.consume(b.id,t.id,e);e.demonWorld.souls=e.demonWorld.souls.filter(v=>v!==s);this.finish(b,e,'success');}
  },
  finish(b,e,reason='return'){if(!b||!this.active(b)){if(e.demonCinematic?.owner===b?.id)delete e.demonCinematic;return;}const u=b.arcana;u.phase='idle';u.target=null;u.waiting='';u.cinemaAge=0;delete e.demonCinematic;b.demon.resumeAt=Math.max(b.demon.resumeAt||0,e.time+.5);for(const s of [...(e.demonWorld?.souls||[])])if(s.owner===b.id){s.arcana=false;if(s.grandStage)D.release(s.owner,s.target,e,reason==='end'?'end':'return');}if(e.demonWorld)e.demonWorld.claws=e.demonWorld.claws.filter(c=>c.owner!==b.id||!c.arcStage);if(b.hp>0&&Math.hypot(b.vx,b.vy)<1e-6){b.vx=Math.cos(u.returnAngle||0)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle||0)*b.speed*b.temporal.rate;}}
 };
 const ordinarySoulMove=D.moveSoul;D.moveSoul=function(s,e,dt){if(s.arcana&&s.grandStage)return A.moveSoul(s,e,dt);return ordinarySoulMove.call(this,s,e,dt);};
 G.Arcana.health.demon=244;G.Arcana.defs.demon={name:'冥契·万魂归主',raw:0};
 const custom=G.Arcana.customMove,move=G.Arcana.move,interrupt=G.Arcana.interrupt,copy=G.Arcana.copy,status=G.Arcana.status;
 G.Arcana.customMove=function(b){return b.type==='demon'?A.holding(b):custom.call(this,b);};
 G.Arcana.move=function(b,dt,e){if(b.type==='demon'){b.vx=b.vy=0;return false;}return move.call(this,b,dt,e);};
 G.Arcana.interrupt=function(b,e,reason){if(A.active(b)){if(['silence','cleanse','control','slow'].includes(reason))return false;A.finish(b,e,reason);return true;}return interrupt.call(this,b,e,reason);};

 G.Arcana.copy=function(type){return type==='demon'?'奥义 · 冥契·万魂归主：已觉醒且≤30%生命、每局一次。就绪后首爪必中穿盾抓魂并立即短暂静止，钉子穿身接续静止3秒并同步开始远距拉魂，奥义远门与长距牵魂（最大190，普通75不变），再瞬身至魂线中段侧方以地狱火烧断魂索；世界继续运行，目标技能CD暂停，灵魂脚下逆五芒星将其染成恶魔色；有效起手后必中同化。50生命、55%原伤、原角色觉醒前基础能力仆从，无觉醒与奥义，死亡使原主人失魂静止3秒，自身5秒后0.75秒重新凝聚至对局结束，不决定胜负。奥义使用后常规出招改为单门钉击肉身，实伤失魂2秒，不再抽魂；奥义强制穿刺与此后穿身钉均不产生献祭魂力。':copy.call(this,type);};
 G.Arcana.status=function(b,e){if(b.type!=='demon'||!b.arcana)return status.call(this,b,e);const u=b.arcana;return {label:'奥义',value:A.active(b)?({soulGateOne:'首门抽魂',soulGateTwo:'握魂待钉',soulSpread:'钉身牵魂',soulBlink:'瞬身临索',soulBurn:'地狱火焚契',soulDye:'逆星同化'}[u.phase]):u.used?'已使用':b.hp>b.maxHp*.3?'≤30%解锁':u.waiting||(!G.Awakening.active(b)?'等待觉醒':'就绪')};};
})(typeof window!=='undefined'?window:globalThis);
