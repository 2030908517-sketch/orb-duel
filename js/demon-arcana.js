(function(root){
 'use strict';const G=root.OrbDuel,D=G.Demon,C=G.Constants;
 const A=G.DemonArcana={
  active(b){return b?.type==='demon'&&b.arcana?.phase.startsWith('soul');},
  holding(b){return ['soulBlink','soulBurn','soulDye'].includes(b.arcana?.phase);},
  ready(b,t,e){const u=b.arcana;if(!u||u.used||u.phase!=='idle'||b.hp<=0||e.ending||!G.Awakening.active(b)||b.hp>b.maxHp*.3||!t||G.Priority?.forced(b,e))return false;const other=D.soul(e,t);return !other||other.owner===b.id;},
  update(b,t,e,dt=C.dt){const u=b.arcana;if(!u)return;if(this.active(b)){if(e.demonCinematic?.owner===b.id)this.advance(e,dt);return;}if(this.ready(b,t,e)){u.waiting='等待下一轮双门';if(e.time>=b.demon.nextGate&&!e.demonWorld.claws.some(c=>c.owner===b.id&&!c.arcana&&e.time<=c.expires))this.begin(b,t,e);}},
  point(b,t,s,e){const mid={x:(t.x+s.x)/2,y:(t.y+s.y)/2},a=Math.atan2(s.y-t.y,s.x-t.x)+Math.PI/2;for(const side of [1,-1])for(const gap of [38,55,24]){const p={x:mid.x+Math.cos(a)*side*gap,y:mid.y+Math.sin(a)*side*gap};if(D.legal(p,e,b.radius)&&D.clear(p,mid,e,2)&&Math.hypot(p.x-t.x,p.y-t.y)>=b.radius+t.radius)return p;}return null;},
  begin(b,t,e){if(e.state!=='running'||e.demonCinematic||b.arcana.used)return false;const u=b.arcana,rate=b.temporal.rate,cd=b.temporal.cooldownRate,vx=b.vx,vy=b.vy;G.Arcana.commit(b,e);b.temporal.rate=rate;b.temporal.cooldownRate=cd;b.vx=vx;b.vy=vy;
   Object.assign(u,{phase:'soulGateOne',target:t.id,started:e.time,until:Infinity,returnAngle:Math.atan2(vy,vx),waiting:'',cinemaAge:0});b.demon.nextGate=e.time+b.def.gatePeriod;const cast=D.cast(b,t,e,true);this.gate(b,t,e,cast,'extract');return true;
  },
  gate(b,t,e,cast,stage){const second=stage==='pin';const c=D.newClaw(b,t,e,cast,{gate:true,second,warning:second?.45:.55,lock:second?.15:.2,flight:b.def.gateFlight,raw:(second?b.def.soulPierceDamage:b.def.gateDamage*e.rng.between(.9,1.1))*cast.heat});c.arcStage=stage;return c;},
  gateWorld(c,cast,b,t,e,dt){if(e.time>c.expires){e.demonWorld.claws=e.demonWorld.claws.filter(v=>v!==c);return;}if(c.done)return;
   if(G.Arcana.immuneTarget(t,e)||c.arcStage==='pin'&&(G.Temporal.controlImmune(t,e)||G.Priority?.armored(t))){for(const k of ['at','lockAt','expires','warningAt'])c[k]+=dt;return;}
   c.endX=t.x;c.endY=t.y;c.locked=e.time>=c.lockAt;if(e.time<c.at)return;if(!c.released){c.released=true;e.sound(c.arcStage==='pin'?'demonNailLaunch':'demonClaw',c.startX);}const u=Math.max(0,Math.min(1,(e.time-c.at)/c.flight));c.x=c.startX+(c.endX-c.startX)*u;c.y=c.startY+(c.endY-c.startY)*u;
   if(u>=1&&!c.hit){c.hit=true;c.resultPending=true;e.pendingAttacks.push({source:b,target:t,raw:c.raw,heat:c.heat,kind:c.arcStage==='pin'?'arcSoulPin':'arcSoulClaim',priority:'arcana',bypassShield:true,clawId:c.id,castId:cast.id,point:{x:t.x,y:t.y},angle:Math.atan2(c.endY-c.startY,c.endX-c.startX),healRatio:0});}
  },
  clawDone(c,e){const b=D.actor(e,c.owner),t=D.actor(e,c.target);if(!b||!t||!this.active(b))return;const s=D.soul(e,t,b),cast=e.demonWorld.casts.find(v=>v.id===c.castId);if(!c.success||!s){this.finish(b,e,'failed');return;}if(c.arcStage==='extract'){b.arcana.phase='soulGateTwo';this.gate(b,t,e,cast,'pin');}else this.burn(b,t,s,e);},
  burn(b,t,s,e){const p=this.point(b,t,s,e)||{x:b.x,y:b.y};s.arcana=true;s.bound=true;b.arcana.phase='soulBlink';e.demonCinematic={owner:b.id,target:t.id,soul:s.id,age:0,from:{x:b.x,y:b.y},to:p,soulPoint:{x:s.x,y:s.y},hostPoint:{x:t.x,y:t.y},cut:false};D.event(e,b,'hellfireStart',b,'demonFireCharge',{life:.3});},
  advance(e,dt){const c=e.demonCinematic;if(!c||e.state!=='running')return;const b=D.actor(e,c.owner),t=D.actor(e,c.target),s=e.demonWorld?.souls.find(s=>s.id===c.soul);if(!b||!t||!s||b.hp<=0||t.hp<=0||e.ending){this.finish(b,e,'end');return;}
   c.age+=dt;const u=b.arcana;u.cinemaAge=c.age;

   if(c.age>=.16&&u.phase==='soulBlink'){b.x=b.previousX=c.to.x;b.y=b.previousY=c.to.y;b.vx=b.vy=0;u.phase='soulBurn';e.sound('demonHellfire',b.x);}
   if(c.age>=1.12&&!c.cut){c.cut=true;u.phase='soulDye';e.sound('demonFireSever',s.x);G.Presentation?.note(e,'demon.hellfireSever',{actorId:b.id,x:s.x,y:s.y});}
   if(c.age>=2){const r=D.Servants.add(b,t,{x:s.x,y:s.y},e);r.at=e.time;D.Servants.spawn(r,e);e.effects=e.effects.filter(f=>!(f.kind==='demonSoul'&&f.owner===b.id&&['assimilate','reborn'].includes(f.style)));D.effect(e,b,'hellfireSeal',s,{life:.4});D.consume(b.id,t.id,e);e.demonWorld.souls=e.demonWorld.souls.filter(v=>v!==s);this.finish(b,e,'success');}
  },
  finish(b,e,reason='return'){if(!b||!this.active(b)){if(e.demonCinematic?.owner===b?.id)delete e.demonCinematic;return;}const u=b.arcana;u.phase='idle';u.target=null;u.waiting='';u.cinemaAge=0;delete e.demonCinematic;b.demon.resumeAt=Math.max(b.demon.resumeAt||0,e.time+.5);for(const s of e.demonWorld?.souls||[])if(s.owner===b.id)s.arcana=false;if(b.hp>0&&Math.hypot(b.vx,b.vy)<1e-6){b.vx=Math.cos(u.returnAngle||0)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle||0)*b.speed*b.temporal.rate;}}
 };
 G.Arcana.health.demon=244;G.Arcana.defs.demon={name:'冥契·万魂归主',raw:0};
 const custom=G.Arcana.customMove,move=G.Arcana.move,interrupt=G.Arcana.interrupt,copy=G.Arcana.copy,status=G.Arcana.status;
 G.Arcana.customMove=function(b){return b.type==='demon'?A.holding(b):custom.call(this,b);};
 G.Arcana.move=function(b,dt,e){if(b.type==='demon'){b.vx=b.vy=0;return false;}return move.call(this,b,dt,e);};
 G.Arcana.interrupt=function(b,e,reason){if(A.active(b)){if(['silence','cleanse','control','slow'].includes(reason))return false;A.finish(b,e,reason);return true;}return interrupt.call(this,b,e,reason);};

 G.Arcana.copy=function(type){return type==='demon'?'奥义 · 冥契·万魂归主：已觉醒且≤30%生命、每局一次。就绪后首轮双门必中穿盾抽魂、穿刺肉身使目标失魂静止3秒，再瞬身以地狱火烧断魂索；世界继续运行，目标技能CD暂停，灵魂脚下逆五芒星将其染成恶魔色；有效起手后必中同化。50生命、55%原伤、原角色觉醒前基础能力仆从，无觉醒与奥义，死亡使原主人失魂静止3秒，自身5秒后0.75秒重新凝聚至对局结束，不决定胜负。奥义使用后常规出招改为单门钉击肉身，实伤失魂2秒，不再抽魂；奥义强制穿刺与此后穿身钉均不产生献祭魂力。':copy.call(this,type);};
 G.Arcana.status=function(b,e){if(b.type!=='demon'||!b.arcana)return status.call(this,b,e);const u=b.arcana;return {label:'奥义',value:A.active(b)?({soulGateOne:'首门抽魂',soulGateTwo:'次门穿身',soulBlink:'瞬身临索',soulBurn:'地狱火焚契',soulDye:'逆星同化'}[u.phase]):u.used?'已使用':b.hp>b.maxHp*.3?'≤30%解锁':u.waiting||(!G.Awakening.active(b)?'等待觉醒':'就绪')};};
})(typeof window!=='undefined'?window:globalThis);
