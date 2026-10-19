(function(root){
'use strict';const G=root.OrbDuel,A=G.Arcana,C=G.Constants,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=(x,y)=>Math.atan2(y,x),turn=(a,b,n)=>a+clamp(Math.atan2(Math.sin(b-a),Math.cos(b-a)),-n,n);
const D=G.BladeDance={
 config:{hp:228,wind:.36,rounds:4,deadline:8.2,roundDeadline:2.1,recovery:.35,bodySpeed:280,climaxSpeed:340,bladeSpeed:390,bodyTurn:5.8,bladeTurn:10,scale:.8,budget:32,maxHits:10,hitGap:.16},
 handles(b){return b.type==='boomerang'&&!!b.arcana;},active(b){return !!b.arcana?.dance?.active;},state(b){return b.arcana?.dance;},
 point(b,p,r=b.radius){const q=b.cageBounds&&G.Trapper?G.Trapper.bounds(b):b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height};return{x:clamp(p.x,q.left+r+1,q.right-r-1),y:clamp(p.y,q.top+r+1,q.bottom-r-1)};},
 event(b,e,type,extra={}){const s=this.state(b);if(!s)return;s.events.push({type,at:e.time,x:b.x,y:b.y,angle:angle(b.vx,b.vy),round:s.round,...extra});s.events=s.events.filter(v=>e.time-v.at<1);G.Presentation?.note(e,'arcana.dance',{actorId:b.id,stage:type,round:s.round,...extra});},
 begin(b,t,e){A.commit(b,e);const u=b.arcana;u.phase='danceWind';u.target=t.id;u.dance={active:true,started:e.time,phaseAt:e.time,round:0,side:1,meet:{x:b.x,y:b.y},bodyGoal:{x:b.x,y:b.y},heading:angle(b.vx,b.vy),speed:Math.hypot(b.vx,b.vy),events:[],path:[],hits:{},catches:0,relays:0,lastCatch:-99,lost:0,next:0,savedCatchUntil:b.character.catchUntil,savedCatchPower:b.character.catchPower};b.character.catchUntil=0;G.Temporal.releaseControl(b);b.motionSpeed=Math.max(b.speed,u.dance.speed);this.event(b,e,'wind');e.sound('return',b.x);},
 blades(b,e){return e.projectiles.filter(p=>p.danceOwner===b.id&&!p.danceRemoved);},
 launch(b,t,e){const s=this.state(b),c=this.config;if(!t){this.finish(b,e);return;}s.round++;s.side=s.round%2?1:-1;s.phaseAt=e.time;s.next=0;s.meetLocked=false;s.launch={x:b.x,y:b.y};b.arcana.phase=s.round===c.rounds?'danceFinal':'danceFlight';
  const target=G.Awakening.predict(t,.22),dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d,reach=Math.min(230,d+30),end=this.point(b,{x:b.x+nx*reach,y:b.y+ny*reach},7);s.bodyGoal=this.point(b,{x:b.x+(end.x-b.x)*.74+ny*s.side*clamp(d*.18,14,32),y:b.y+(end.y-b.y)*.74-nx*s.side*clamp(d*.18,14,32)});
  const duration=s.round===1?.68:s.round===c.rounds?.62:.48,sides=G.Awakening.active(b)?[s.side,-s.side]:[s.side];b.character.bladeLost=false;b.character.caughtInCast=0;const castId=++b.bladeCastId;
  for(let slot=0;slot<sides.length;slot++){const side=sides[slot],p=G.Characters.throwBlade(b,e,{castId,angleOffset:side*.12,damage:(slot?2.3:b.def.shotDamage)*c.scale});if(!p)continue;
   if(G.ArenaWalls&&!G.ArenaWalls.clear(b,p,e,p.radius)){p.x=b.x;p.y=b.y;}
   const control=this.point(b,{x:(p.x+end.x)/2-ny*side*(clamp(d*.36,28,65)*(s.round===c.rounds?1.3:1)),y:(p.y+end.y)/2+nx*side*(clamp(d*.36,28,65)*(s.round===c.rounds?1.3:1))},p.radius);
   Object.assign(p,{danceOwner:b.id,danceRound:s.round,danceSlot:slot,priority:'arcana',speed:c.bladeSpeed,expires:e.time+c.roundDeadline+.2,turnAt:e.time+duration+slot*.11,curve:{start:{x:p.x,y:p.y},control,end:{...end},started:e.time,duration:duration+slot*.11}});
  }this.event(b,e,'release',{side:s.side});e.sound('throw',b.x);
 },
 update(b,t,e,dt){const u=b.arcana,c=this.config,s=this.state(b);if(!s?.active){if(!u.used&&b.hp<=b.maxHp*A.ratio&&G.Awakening.active(b)&&t){if(b.character.bladeRemaining>0){u.waiting='等待接刃';return;}this.begin(b,t,e);}return;}
  if(b.hp<=0||e.ending||e.state!=='running'){this.finish(b,e,true);return;}
  if(e.time-s.started>=c.deadline){this.finish(b,e);return;}
  if(u.phase==='danceRecover'){if(e.time-s.phaseAt>=c.recovery)this.finish(b,e);return;}
  if(u.phase==='danceWind'){if(e.time-s.phaseAt>=c.wind)this.launch(b,t,e);return;}
  const blades=this.blades(b,e),back=blades.filter(p=>p.returning);
  if(back.length){const p=back[0],lead=.16,goal=this.point(b,{x:b.x+b.vx*lead*.65+(p.x+p.vx*.10-b.x)*.30,y:b.y+b.vy*lead*.65+(p.y+p.vy*.10-b.y)*.30});const k=1-Math.exp(-dt*5);s.meet.x+=(goal.x-s.meet.x)*k;s.meet.y+=(goal.y-s.meet.y)*k;}
  if(!blades.length){if(!s.next)s.next=e.time+.035;if(e.time>=s.next){if(s.round>=c.rounds){u.phase='danceRecover';s.phaseAt=e.time;this.event(b,e,s.lost?'releaseEnd':'finale');if(!s.lost){e.sound('bladeCatch',b.x);e.sound('moonCut',b.x);}}else{if(e.time-s.lastCatch<.15)s.relays++;this.launch(b,t,e);}}}
  else if(e.time-s.phaseAt>c.roundDeadline){for(const p of blades){G.Characters.bladeRemoved(p,b,e,false);}e.projectiles=e.projectiles.filter(p=>p.danceOwner!==b.id);s.lost++;s.next=e.time+.04;}
 },
 steer(v,goal,speed,maxTurn,dt){const heading=angle(v.vx,v.vy),desired=angle(goal.x-v.x,goal.y-v.y),a=turn(heading,desired,maxTurn*dt),old=Math.hypot(v.vx,v.vy),n=old+(speed-old)*(1-Math.exp(-dt*7));v.vx=Math.cos(a)*n;v.vy=Math.sin(a)*n;},
 integrate(v,b,e,dt){const old={x:v.x,y:v.y},speed=Math.hypot(v.vx,v.vy),hit=G.ArenaWalls?.hit(v.x,v.y,v.vx/(speed||1),v.vy/(speed||1),v.radius,e),travel=speed*dt;if(hit&&hit.distance<=travel){const d=Math.max(0,hit.distance-.002);v.x+=v.vx/(speed||1)*d;v.y+=v.vy/(speed||1)*d;const dot=v.vx*hit.nx+v.vy*hit.ny;v.vx-=2*dot*hit.nx;v.vy-=2*dot*hit.ny;if(v.danceOwner!==undefined){v.returning=true;v.wallReturnAt=e.time;}}else{v.x+=v.vx*dt;v.y+=v.vy*dt;}
  G.Physics.constrain(v);return old;
 },
 move(b,dt,e){const s=this.state(b),u=b.arcana,c=this.config;if(!s?.active)return false;const blades=this.blades(b,e),back=blades.some(p=>p.returning),goal=back?s.meet:s.bodyGoal;
  let speed=u.phase==='danceWind'?b.speed:u.phase==='danceRecover'?b.speed:s.round<=1?c.bodySpeed:c.climaxSpeed;
  if(u.phase==='danceWind'||u.phase==='danceRecover'){const n=Math.hypot(b.vx,b.vy)||1,v=n+(speed-n)*(1-Math.exp(-dt*7));b.vx=b.vx/n*v;b.vy=b.vy/n*v;}else{const target=e.balls.find(v=>v.id===u.target),d=target?Math.hypot(target.x-b.x,target.y-b.y):200;speed*=clamp(d/150,.74,1);this.steer(b,goal,speed,c.bodyTurn*(d<120?1.3:1),dt);}
  b.motionSpeed=Math.max(b.speed,Math.hypot(b.vx,b.vy));b.inertia=0;b.impactDrag=0;this.integrate(b,b,e,dt);s.heading=angle(b.vx,b.vy);s.speed=Math.hypot(b.vx,b.vy);if(e.tick%3===0){s.path.unshift({x:b.x,y:b.y,at:e.time});s.path.length=Math.min(22,s.path.length);}return false;
 },
 bladeMove(p,b,e,dt){const s=this.state(b),c=this.config;if(!s?.active){p.expires=-1;return;}
  if(!p.returning&&e.time>=p.turnAt){p.returning=true;s.meet=this.point(b,{x:b.x+b.vx*.12,y:b.y+b.vy*.12});this.event(b,e,'pull',{slot:p.danceSlot});if(!p.danceSlot)e.sound('return',p.x);}
  let goal;if(p.returning){goal={x:b.x+b.vx*.12,y:b.y+b.vy*.12};goal.x=goal.x*.7+s.meet.x*.3;goal.y=goal.y*.7+s.meet.y*.3;}
  else{const q=p.curve,u=clamp((e.time-q.started)/q.duration+.16,0,1),v=1-u;goal={x:v*v*q.start.x+2*v*u*q.control.x+u*u*q.end.x,y:v*v*q.start.y+2*v*u*q.control.y+u*u*q.end.y};}
  goal=this.point(b,goal,p.radius);this.steer(p,goal,c.bladeSpeed,c.bladeTurn+(p.returning?3:0),dt);this.integrate(p,b,e,dt);
  if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y,at:e.time});p.history.length=Math.min(30,p.history.length);}
 },
 packet(p,b,t,e,base){const s=this.state(b),c=this.config,h=s.hits[t.id]||(s.hits[t.id]={raw:0,n:0,at:-99}),cap=c.budget*e.heatMultiplier,remaining=Math.max(0,cap-h.raw),allowed=h.n<c.maxHits&&e.time-h.at>=c.hitGap;const raw=allowed?Math.min(base.raw,remaining):0;if(raw>0){h.raw+=raw;h.n++;h.at=e.time;}return {...base,raw,markBonus:raw>0&&base.markBonus,priority:'arcana',dance:true,point:{x:p.x,y:p.y},angle:angle(p.vx,p.vy)};},
 caught(p,b,e,caught){const s=this.state(b);if(!s?.active)return;p.danceRemoved=true;if(caught){s.catches++;s.lastCatch=e.time;this.event(b,e,'catch',{slot:p.danceSlot});}else s.lost++;},
 finish(b,e,silent=false){const s=this.state(b);if(!s?.active)return;const removed=this.blades(b,e).length;e.projectiles=e.projectiles.filter(p=>p.danceOwner!==b.id);b.character.bladeRemaining=Math.max(0,b.character.bladeRemaining-removed);if(removed)b.character.bladeLost=true;if(!silent&&b.hp>0){const reward=s.catchReward;if(reward&&s.round===this.config.rounds&&!s.lost){b.character.catchUntil=reward.until;b.character.catchPower=reward.power;}else if(s.savedCatchUntil>e.time){b.character.catchUntil=s.savedCatchUntil;b.character.catchPower=s.savedCatchPower;}}s.active=false;b.arcana.phase='idle';b.arcana.target=null;b.motionSpeed=0;b.inertia=0;b.impactDrag=0;b.nextShot=Math.max(e.time+.25,b.nextShot);if(b.hp>0)G.Physics.normalizeSpeed(b);if(!silent)this.event(b,e,'end');}
};
A.health.boomerang=D.config.hp;A.defs.boomerang={name:'回天·双生轮舞',raw:0};
const skill=G.Skills.boomerang.update;G.Skills.boomerang.update=function(b,dt,e){if(D.active(b)||D.handles(b)&&!b.arcana.used&&b.hp<=b.maxHp*A.ratio&&G.Awakening.active(b))return;return skill.call(this,b,dt,e);};
const move=G.Characters.moveBlade;G.Characters.moveBlade=function(p,b,e,dt){return p.danceOwner!==undefined?D.bladeMove(p,b,e,dt):move.call(this,p,b,e,dt);};
const packet=G.Characters.bladePacket;G.Characters.bladePacket=function(p,b,t,e){const h=packet.call(this,p,b,t,e);return p.danceOwner!==undefined?D.packet(p,b,t,e,h):h;};
const characterHit=G.Characters.hit;G.Characters.hit=function(h,e){characterHit.call(this,h,e);if(h.dance&&h.feedback)h.feedback.presented=true;if(h.dance&&h.actual+h.blocked>0&&D.state(h.source)){D.event(h.source,e,'cut',{x:h.target.x,y:h.target.y,angle:h.angle,blocked:!h.actual});e.sound(h.actual?'moonCut':'shieldHit',h.target.x);}};
const removed=G.Characters.bladeRemoved;G.Characters.bladeRemoved=function(p,b,e,caught){if(p.danceRemoved)return;removed.call(this,p,b,e,caught);if(p.danceOwner!==undefined&&b){const s=D.state(b);if(s?.active&&b.character.catchUntil>e.time){s.catchReward={until:b.character.catchUntil,power:b.character.catchPower};b.character.catchUntil=0;}D.caught(p,b,e,caught);}};
const armored=G.Priority.armored;G.Priority.armored=function(b){return b?.hp>0&&D.active(b)||armored.call(this,b);};
const custom=A.customMove,mover=A.move,finish=A.finish;A.customMove=function(b){return D.active(b)||custom.call(this,b);};A.move=function(b,dt,e){return D.active(b)?D.move(b,dt,e):mover.call(this,b,dt,e);};A.finish=function(b,e){return D.active(b)?D.finish(b,e):finish.call(this,b,e);};
const cleanup=A.cleanup;A.cleanup=function(e){cleanup.call(this,e);for(const b of e.balls)if(D.active(b)&&b.hp<=0)D.finish(b,e,true);};
const ending=G.Engine.prototype.beginEnding;G.Engine.prototype.beginEnding=function(...args){for(const b of this.balls)if(D.active(b))D.finish(b,this,true);return ending.apply(this,args);};
const copy=A.copy,status=A.status;A.copy=function(type){return type==='boomerang'?'奥义 · 回天·双生轮舞：觉醒且生命≤30%时每局一次。全程霸体但可受伤；人刃互引、四轮真实投返，接刃换侧续舞，末环无额外伤害。保留刃印与接刃奖励，不能穿盾、无视无敌或反伤。':copy.call(this,type);};A.status=function(b,e){const s=D.state(b);return D.active(b)?{label:'轮舞',value:({danceWind:'起舞',danceFlight:'共舞',danceFinal:'终舞',danceRecover:'归环'})[b.arcana.phase]+' '+s.round+'/'+D.config.rounds}:status.call(this,b,e);};
const snap=A.snapshot;A.snapshot=function(u){const result=snap.call(this,u);if(u.dance)result.dance=JSON.parse(JSON.stringify(u.dance));return result;};
})(typeof window!=='undefined'?window:globalThis);
