(function(root){
'use strict';const G=root.OrbDuel,A=G.Arcana,C=G.Constants,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=(x,y)=>Math.atan2(y,x),turn=(a,b,n)=>a+clamp(Math.atan2(Math.sin(b-a),Math.cos(b-a)),-n,n);
const D=G.BladeDance={
 config:{hp:228,wind:.36,rounds:4,deadline:8.2,roundDeadline:2.1,recovery:.35,bodySpeed:280,climaxSpeed:340,bladeSpeed:390,bodyTurn:5.8,bladeTurn:10,scale:.8,budget:32,maxHits:10,hitGap:.16,orbitRadius:72,catchRadiusGain:21,bodyCoupling:.38,relayDelay:.035,cycleTime:2.1,outerRadius:94,innerRadius:29,innerSpeed:180},
 handles(b){return b.type==='boomerang'&&!!b.arcana;},active(b){return !!b.arcana?.dance?.active;},state(b){return b.arcana?.dance;},
 point(b,p,r=b.radius){const q=b.cageBounds&&G.Trapper?G.Trapper.bounds(b):b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height};return{x:clamp(p.x,q.left+r+1,q.right-r-1),y:clamp(p.y,q.top+r+1,q.bottom-r-1)};},
 event(b,e,type,extra={}){const s=this.state(b);if(!s)return;s.events.push({type,at:e.time,x:b.x,y:b.y,angle:angle(b.vx,b.vy),round:s.round,...extra});s.events=s.events.filter(v=>e.time-v.at<1);G.Presentation?.note(e,'arcana.dance',{actorId:b.id,stage:type,round:s.round,...extra});},
 begin(b,t,e){A.commit(b,e);const u=b.arcana;u.phase='danceWind';u.target=t.id;u.dance={active:true,started:e.time,phaseAt:e.time,round:0,side:1,meet:{x:b.x,y:b.y},bodyGoal:{x:b.x,y:b.y},heading:angle(b.vx,b.vy),speed:Math.hypot(b.vx,b.vy),events:[],path:[],hits:{},catches:0,relays:0,lastCatch:-99,lost:0,next:0,savedCatchUntil:b.character.catchUntil,savedCatchPower:b.character.catchPower,launches:[0,0],queue:[],attackSlot:0,orbitSide:1,orbitCenter:this.point(b,t,68),radiusKick:0,catchFlow:null,exchanges:0,catchMask:0,orbitRadius:this.config.outerRadius,tightness:0};G.Temporal.releaseControl(b);b.motionSpeed=Math.max(b.speed,u.dance.speed);this.event(b,e,'wind');e.sound('arcDanceWind',b.x);},
 blades(b,e){return e.projectiles.filter(p=>p.danceOwner===b.id&&!p.danceRemoved);},
 launch(b,t,e){const s=this.state(b);if(!t){this.finish(b,e);return;}s.phaseAt=e.time;s.round=1;s.attackSlot=0;b.character.bladeLost=false;b.character.caughtInCast=0;this.launchBlade(b,t,e,0,false);if(G.Awakening.active(b))this.launchBlade(b,t,e,1,true);},
 launchBlade(b,t,e,slot,guide=false){const s=this.state(b),c=this.config;if(!t||s.launches[slot]>=c.rounds)return;
  const cycle=++s.launches[slot];s.round=Math.max(s.round,cycle);s.side=s.orbitSide;s.phaseAt=e.time;b.arcana.phase=s.round>=c.rounds?'danceFinal':'danceFlight';
  const predicted=G.Awakening.predict(t,clamp(Math.hypot(t.x-b.x,t.y-b.y)/c.bladeSpeed*.7,.12,.42)),dx=predicted.x-b.x,dy=predicted.y-b.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d,side=s.orbitSide,castId=++b.bladeCastId;
  const p=G.Characters.throwBlade(b,e,{castId,angleOffset:side*(slot?-.12:.12),damage:(slot?2.3:b.def.shotDamage)*c.scale});if(!p)return;
  if(G.ArenaWalls&&!G.ArenaWalls.clear(b,p,e,p.radius)){p.x=b.x;p.y=b.y;}
  let end,control;
  if(guide){const center=s.orbitCenter,a=angle(b.x-center.x,b.y-center.y)+side*.9,r=c.orbitRadius+30;
   end=this.point(b,{x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r},p.radius);const mid=a-side*.45;
   control=this.point(b,{x:center.x+Math.cos(mid)*(r+18),y:center.y+Math.sin(mid)*(r+18)},p.radius);
  }else{const reach=Math.min(205,d),aim={x:b.x+nx*reach,y:b.y+ny*reach};
   const spread=12*(1-s.tightness)+3*s.tightness,forward=clamp(d*.35,24,52);
   end=this.point(b,{x:aim.x+nx*forward+ny*side*spread,y:aim.y+ny*forward-nx*side*spread},p.radius);
   control=this.point(b,{x:2*aim.x-(p.x+end.x)*.5-ny*side*spread,y:2*aim.y-(p.y+end.y)*.5+nx*side*spread},p.radius);
  }
  const travel=Math.hypot(control.x-p.x,control.y-p.y)+Math.hypot(end.x-control.x,end.y-control.y),duration=guide?clamp(travel/c.bladeSpeed,.30,.50):clamp(travel/c.bladeSpeed,.34,cycle===1?.68:.58),heading=angle(control.x-p.x,control.y-p.y);
  Object.assign(p,{danceOwner:b.id,danceRound:cycle,danceSlot:slot,danceRole:guide?'guide':'attack',danceLaunchedAt:e.time,danceOrigin:{x:b.x,y:b.y},danceSide:side,danceControl:{...control},danceEnd:{...end},priority:'arcana',speed:c.bladeSpeed,vx:Math.cos(heading)*c.bladeSpeed,vy:Math.sin(heading)*c.bladeSpeed,expires:e.time+c.roundDeadline+.2,turnAt:e.time+duration,curve:{start:{x:p.x,y:p.y},control,end,started:e.time,duration}});
  this.event(b,e,'release',{side,slot,role:p.danceRole});e.sound('arcDanceThrow',b.x);
 },
 update(b,t,e,dt){const u=b.arcana,c=this.config,s=this.state(b);if(!s?.active){if(!u.used&&b.hp<=b.maxHp*A.ratio&&G.Awakening.active(b)&&t){if(b.character.bladeRemaining>0){u.waiting='等待接刃';return;}this.begin(b,t,e);}return;}
  if(b.hp<=0||e.ending||e.state!=='running'){this.finish(b,e,true);return;}
  if(e.time-s.started>=c.deadline){this.finish(b,e);return;}
  if(u.phase==='danceRecover'){if(e.time-s.phaseAt>=c.recovery)this.finish(b,e);return;}
  if(u.phase==='danceWind'){if(e.time-s.phaseAt>=c.wind)this.launch(b,t,e);return;}
  const blades=this.blades(b,e),back=blades.filter(p=>p.returning),guide=back.find(p=>p.danceSlot!==s.attackSlot)||back[0]||blades.find(p=>p.danceRole==='guide');
  if(t&&G.World.targetable(t,e)){const goal=this.point(b,G.Awakening.predict(t,.08),68),k=1-Math.exp(-dt*3);s.orbitCenter.x+=(goal.x-s.orbitCenter.x)*k;s.orbitCenter.y+=(goal.y-s.orbitCenter.y)*k;}
  if(guide){const goal=this.point(b,{x:b.x+b.vx*.10+(guide.x+guide.vx*.10-b.x)*.30,y:b.y+b.vy*.10+(guide.y+guide.vy*.10-b.y)*.30}),k=1-Math.exp(-dt*5);s.meet.x+=(goal.x-s.meet.x)*k;s.meet.y+=(goal.y-s.meet.y)*k;}
  const beat=((e.time-s.started-c.wind)/c.cycleTime)%1,smooth=v=>v*v*(3-2*v);
  s.step=beat<.22?'outer':beat<.70?'inner':'expand';
  s.tightness=beat<.22?0:beat<.48?smooth((beat-.22)/.26):beat<.70?1:1-smooth((beat-.70)/.30);
  s.orbitRadius=c.outerRadius+(c.innerRadius-c.outerRadius)*s.tightness;
  s.radiusKick*=Math.exp(-dt*3.8);
  const ready=s.queue.filter(v=>e.time>=v.at);s.queue=s.queue.filter(v=>e.time<v.at);
  for(const v of ready)if(t&&G.World.targetable(t,e)){s.attackSlot=v.slot;s.exchanges++;s.relays++;for(const p of this.blades(b,e))if(p.danceSlot!==v.slot){p.danceRole='guide';p.turnAt=Math.min(p.turnAt,Math.max(e.time+.05,p.danceLaunchedAt+.30));}this.launchBlade(b,t,e,v.slot);}
  if(!this.blades(b,e).length&&!s.queue.length){if(!s.next)s.next=e.time+.035;if(e.time>=s.next){u.phase='danceRecover';s.phaseAt=e.time;this.event(b,e,s.lost?'releaseEnd':'finale');if(!s.lost){e.sound('arcDanceFinale',b.x);}}}else s.next=0;
  for(const p of blades)if(!p.danceRemoved&&e.time-p.danceLaunchedAt>c.roundDeadline){G.Characters.bladeRemoved(p,b,e,false);e.projectiles=e.projectiles.filter(v=>v!==p);}
 },
 steer(v,goal,speed,maxTurn,dt){const heading=angle(v.vx,v.vy),desired=angle(goal.x-v.x,goal.y-v.y),a=turn(heading,desired,maxTurn*dt),old=Math.hypot(v.vx,v.vy),n=old+(speed-old)*(1-Math.exp(-dt*7));v.vx=Math.cos(a)*n;v.vy=Math.sin(a)*n;},
 integrate(v,b,e,dt){const old={x:v.x,y:v.y},speed=Math.hypot(v.vx,v.vy),hit=G.ArenaWalls?.hit(v.x,v.y,v.vx/(speed||1),v.vy/(speed||1),v.radius,e),travel=speed*dt;if(hit&&hit.distance<=travel){const d=Math.max(0,hit.distance-.002);v.x+=v.vx/(speed||1)*d;v.y+=v.vy/(speed||1)*d;const dot=v.vx*hit.nx+v.vy*hit.ny;v.vx-=2*dot*hit.nx;v.vy-=2*dot*hit.ny;if(v.danceOwner!==undefined){v.returning=true;v.wallReturnAt=e.time;}}else{v.x+=v.vx*dt;v.y+=v.vy*dt;}
  G.Physics.constrain(v);return old;
 },
 move(b,dt,e){const s=this.state(b),u=b.arcana,c=this.config;if(!s?.active)return false;const blades=this.blades(b,e),back=blades.find(p=>p.returning&&p.danceSlot!==s.attackSlot)||blades.find(p=>p.returning);
  let speed=u.phase==='danceWind'||u.phase==='danceRecover'?b.speed:s.round<=1?c.bodySpeed:c.climaxSpeed;
  if(u.phase==='danceWind'||u.phase==='danceRecover'){const n=Math.hypot(b.vx,b.vy)||1,v=n+(speed-n)*(1-Math.exp(-dt*7));b.vx=b.vx/n*v;b.vy=b.vy/n*v;}else{
   speed+=(c.innerSpeed-speed)*s.tightness;
   const center=s.orbitCenter,dx=b.x-center.x,dy=b.y-center.y,r=Math.hypot(dx,dy)||1,rx=dx/r,ry=dy/r,radius=s.orbitRadius+s.radiusKick*(1-s.tightness*.8),radial=clamp((radius-r)*4,-speed,speed),side=s.orbitSide;
   let vx=-ry*side*speed+rx*radial,vy=rx*side*speed+ry*radial;
   if(back){const gx=s.meet.x-b.x,gy=s.meet.y-b.y,d=Math.hypot(gx,gy)||1;const weight=.38-.20*s.tightness;vx=vx*(1-weight)+gx/d*speed*weight;vy=vy*(1-weight)+gy/d*speed*weight;if(Math.hypot(back.x-b.x,back.y-b.y)<80)speed*=.8;}
   if(s.catchFlow){const k=.35*Math.exp(-(e.time-s.catchFlow.at)/.24);vx=vx*(1-k)+s.catchFlow.vx*k;vy=vy*(1-k)+s.catchFlow.vy*k;}

   const bounds=b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height},margin=b.radius+24;vx+=Math.max(0,bounds.left+margin-b.x)*10-Math.max(0,b.x-(bounds.right-margin))*10;vy+=Math.max(0,bounds.top+margin-b.y)*10-Math.max(0,b.y-(bounds.bottom-margin))*10;
   s.bodyGoal=this.point(b,{x:b.x+vx*.22,y:b.y+vy*.22});this.steer(b,s.bodyGoal,speed,c.bodyTurn+s.tightness*3,dt);
  }
  b.motionSpeed=Math.max(b.speed,Math.hypot(b.vx,b.vy));b.inertia=0;b.impactDrag=0;this.integrate(b,b,e,dt);s.heading=angle(b.vx,b.vy);s.speed=Math.hypot(b.vx,b.vy);if(e.tick%3===0){s.path.unshift({x:b.x,y:b.y,at:e.time});s.path.length=Math.min(22,s.path.length);}return false;
 },
 bladeMove(p,b,e,dt){const s=this.state(b),c=this.config;if(!s?.active){p.expires=-1;return;}
  if(!p.returning&&e.time>=p.turnAt){p.returning=true;p.danceRole='guide';s.meet=this.point(b,{x:b.x+b.vx*.12,y:b.y+b.vy*.12});this.event(b,e,'pull',{slot:p.danceSlot});e.sound('arcDanceReturn',p.x);}
  let goal;if(p.returning){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy)||1,bend=p.danceSide*clamp((d-40)*.30,0,30);goal={x:b.x*.7+s.meet.x*.3+b.vx*.07-dy/d*bend,y:b.y*.7+s.meet.y*.3+b.vy*.07+dx/d*bend};}
  else{const q=p.curve,ox=clamp((b.x-p.danceOrigin.x)*c.bodyCoupling,-34,34),oy=clamp((b.y-p.danceOrigin.y)*c.bodyCoupling,-34,34);q.control.x=p.danceControl.x+ox;q.control.y=p.danceControl.y+oy;q.end.x=p.danceEnd.x+ox*.28;q.end.y=p.danceEnd.y+oy*.28;
   const u=clamp((e.time-q.started)/q.duration+.16,0,1),v=1-u;goal={x:v*v*q.start.x+2*v*u*q.control.x+u*u*q.end.x,y:v*v*q.start.y+2*v*u*q.control.y+u*u*q.end.y};}
  goal=this.point(b,goal,p.radius);this.steer(p,goal,c.bladeSpeed,c.bladeTurn+(p.returning?3:0),dt);this.integrate(p,b,e,dt);
  if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y,at:e.time});p.history.length=Math.min(30,p.history.length);}
 },
 packet(p,b,t,e,base){const s=this.state(b),c=this.config,h=s.hits[t.id]||(s.hits[t.id]={raw:0,n:0,at:-99}),cap=c.budget*e.heatMultiplier,remaining=Math.max(0,cap-h.raw),allowed=h.n<c.maxHits&&e.time-h.at>=c.hitGap;const raw=allowed?Math.min(base.raw,remaining):0;if(raw>0){h.raw+=raw;h.n++;h.at=e.time;}return {...base,raw,markBonus:raw>0&&base.markBonus,priority:'arcana',dance:true,point:{x:p.x,y:p.y},angle:angle(p.vx,p.vy)};},
 caught(p,b,e,caught){const s=this.state(b);if(!s?.active)return;p.danceRemoved=true;if(caught){s.catches++;s.lastCatch=e.time;s.catchMask|=1<<p.danceSlot;G.BladeHunt.reward(b,e,s.catchMask===3?2:1);const dx=b.x-s.orbitCenter.x,dy=b.y-s.orbitCenter.y,momentum=dx*p.vy-dy*p.vx;s.orbitSide=Math.sign(momentum)||s.orbitSide;s.side=s.orbitSide;s.radiusKick=this.config.catchRadiusGain;s.catchFlow={vx:p.vx,vy:p.vy,at:e.time};
   this.event(b,e,'catch',{slot:p.danceSlot,side:s.orbitSide,incoming:angle(p.vx,p.vy),path:[{x:b.x,y:b.y},{x:p.x,y:p.y},...p.history.slice(0,14).map(v=>({...v}))]});
   if(s.launches[p.danceSlot]<this.config.rounds)s.queue.push({slot:p.danceSlot,at:e.time+this.config.relayDelay+s.queue.length*.12});
  }else s.lost++;
 },
 finish(b,e,silent=false){const s=this.state(b);if(!s?.active)return;const removed=this.blades(b,e).length;e.projectiles=e.projectiles.filter(p=>p.danceOwner!==b.id);b.character.bladeRemaining=Math.max(0,b.character.bladeRemaining-removed);if(removed)b.character.bladeLost=true;s.queue=[];s.active=false;b.arcana.phase='idle';b.arcana.target=null;b.motionSpeed=0;b.inertia=0;b.impactDrag=0;b.nextShot=Math.max(e.time+.25,b.nextShot);if(b.hp>0)G.Physics.normalizeSpeed(b);if(!silent)this.event(b,e,'end');}
};
A.health.boomerang=D.config.hp;A.defs.boomerang={name:'回天·双生轮舞',raw:0};
const skill=G.Skills.boomerang.update;G.Skills.boomerang.update=function(b,dt,e){if(D.active(b)||D.handles(b)&&!b.arcana.used&&b.hp<=b.maxHp*A.ratio&&G.Awakening.active(b))return;return skill.call(this,b,dt,e);};
const move=G.Characters.moveBlade;G.Characters.moveBlade=function(p,b,e,dt){return p.danceOwner!==undefined?D.bladeMove(p,b,e,dt):move.call(this,p,b,e,dt);};
const packet=G.Characters.bladePacket;G.Characters.bladePacket=function(p,b,t,e){const h=packet.call(this,p,b,t,e);return p.danceOwner!==undefined?D.packet(p,b,t,e,h):h;};
const characterHit=G.Characters.hit;G.Characters.hit=function(h,e){characterHit.call(this,h,e);if(h.dance&&h.feedback)h.feedback.presented=true;if(h.dance&&h.actual+h.blocked>0&&D.state(h.source)){D.event(h.source,e,'cut',{x:h.target.x,y:h.target.y,angle:h.angle,blocked:!h.actual});e.sound(h.actual?'arcDanceCut':'shieldHit',h.target.x);}};
const removed=G.Characters.bladeRemoved;G.Characters.bladeRemoved=function(p,b,e,caught){if(p.danceRemoved)return;removed.call(this,p,b,e,caught);if(p.danceOwner!==undefined&&b)D.caught(p,b,e,caught);};
// A physical contact starts the existing weapon swing instead of adding body damage.
const contacts=G.Combat.contactAttacks;G.Combat.contactAttacks=function(...args){const e=args[2];return contacts.apply(this,args).filter(h=>{
 if(h.kind!=='contact'||!D.active(h.source))return true;
 const b=h.source,state=G.BladeHunt.state(b);if(state.swing)return false;
 if(b.character.catchUntil<=e.time)return true;
 G.BladeHunt.startSwing(b,h.target,e,true);D.state(b).catchMask=0;return false;
});};
const armored=G.Priority.armored;G.Priority.armored=function(b){return b?.hp>0&&D.active(b)||armored.call(this,b);};
const custom=A.customMove,mover=A.move,finish=A.finish;A.customMove=function(b){return D.active(b)||custom.call(this,b);};A.move=function(b,dt,e){return D.active(b)?D.move(b,dt,e):mover.call(this,b,dt,e);};A.finish=function(b,e){return D.active(b)?D.finish(b,e):finish.call(this,b,e);};
const cleanup=A.cleanup;A.cleanup=function(e){cleanup.call(this,e);for(const b of e.balls)if(D.active(b)&&b.hp<=0)D.finish(b,e,true);};
const ending=G.Engine.prototype.beginEnding;G.Engine.prototype.beginEnding=function(...args){for(const b of this.balls)if(D.active(b))D.finish(b,this,true);return ending.apply(this,args);};
const copy=A.copy,status=A.status;A.copy=function(type){return type==='boomerang'?'奥义 · 回天·双生轮舞：觉醒且生命≤30%时每局一次。全程霸体但可受伤；双刃交替切割与引导、各四次真实投返，借回刃动量旋转换步，末环无额外伤害。保留刃印与接刃奖励，不能穿盾、无视无敌或反伤。':copy.call(this,type);};A.status=function(b,e){const s=D.state(b);return D.active(b)?{label:'轮舞',value:({danceWind:'起舞',danceFlight:'共舞',danceFinal:'终舞',danceRecover:'归环'})[b.arcana.phase]+' '+s.round+'/'+D.config.rounds}:status.call(this,b,e);};
const snap=A.snapshot;A.snapshot=function(u){const result=snap.call(this,u);if(u.dance)result.dance=JSON.parse(JSON.stringify(u.dance));return result;};
})(typeof window!=='undefined'?window:globalThis);
