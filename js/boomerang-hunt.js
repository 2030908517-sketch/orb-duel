(function(root){
'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),turn=(a,b,n)=>a+clamp(Math.atan2(Math.sin(b-a),Math.cos(b-a)),-n,n);
const H=G.BladeHunt={
 config:{range:200,awakeRange:180,mainMarkDamage:3.6,subMarkDamage:2.2,slingStop:.055,bodyFactor:.7,awayFactor:.8,chaseTurn:5,relayFraction:.58,relayTime:.42,relayWait:.45,slingSpeed:560,rewardLife:8,slashReach:28,slashWind:.075,slashLife:.30,singleDamage:8,doubleDamage:11,singleHalfAngle:1.2,doubleHalfAngle:1.5,crossWindow:.24},
 state(b){return b.character.bladeHunt||(b.character.bladeHunt={plan:null,swing:null});},
 clear(a,b,e,r=0){return (!G.ArenaWalls||G.ArenaWalls.clear(a,b,e,r))&&(e.mode!=='2v2'||G.Team.rayLimit(a.x,a.y,(b.x-a.x)/(Math.hypot(b.x-a.x,b.y-a.y)||1),(b.y-a.y)/(Math.hypot(b.x-a.x,b.y-a.y)||1),r,e.obstacles)>=Math.hypot(b.x-a.x,b.y-a.y)-1e-7);},
 point(b,p,r=5){const q=b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height};return{x:clamp(p.x,q.left+r,q.right-r),y:clamp(p.y,q.top+r,q.bottom-r)};},
 cue(e,b,style,point=b,extra={}){e.effects.push({kind:'bladeHunt',style,owner:b.id,x:point.x,y:point.y,age:0,life:.35,angle:Math.atan2(b.vy,b.vx),...extra});},
 update(b,dt,e){
  const t=G.World.targetFor(b,e);if(t)G.Aim.direct(b,t,e,'blade',b.def.shotSpeed);const pending=b.character.bladeHunt?.plan;if(pending?.mode==='relay'&&!pending.relayed){const relayTarget=e.balls.find(v=>v.id===pending.target&&G.World.targetable(v,e));if(relayTarget)G.Aim.direct({...b,x:pending.meet.x,y:pending.meet.y},relayTarget,e,'bladeRelay',this.config.slingSpeed);}
  if(!t||e.state!=='running'||e.time+1e-9<b.nextShot||b.character.bladeRemaining||this.state(b).swing)return;
  if(!G.ManualRoles?.owns(b,e))this.cast(b,t,e);
 },
 cast(b,t,e,requestedMode=null,requestedAngle=null){
  const awake=G.Awakening.active(b),range=awake?this.config.awakeRange:this.config.range,distance=Math.hypot(t.x-b.x,t.y-b.y),castId=++b.bladeCastId;
  b.character.bladeAdaptiveId=G.Adaptive?.begin(b,'blade',e);b.character.bladeLost=false;b.character.caughtInCast=0;
  // Choose the move from the same wall-aware future position used by its outbound arc.
  const predicted=G.Awakening.predict(t,awake?.58:.65),heading=G.World.aim(b,t,b.def.shotSpeed),aim=G.Aim.adjust(b,e,'blade',heading),offset=aim-heading,dx=predicted.x-b.x,dy=predicted.y-b.y,d=Math.hypot(dx,dy)||1,far=d>range,angle=requestedAngle??Math.atan2(dy,dx)+offset,nx=Math.cos(angle),ny=Math.sin(angle);
  const end=this.point(b,{x:b.x+nx*Math.min(range,d),y:b.y+ny*Math.min(range,d)},b.def.shotRadius),meet=this.point(b,{x:b.x+nx*range*this.config.relayFraction,y:b.y+ny*range*this.config.relayFraction},b.def.shotRadius);
  const plan=this.state(b).plan={id:castId,mode:requestedMode??(awake?(far?'relay':'cross'):(far?'chase':'single')),target:t.id,created:e.time,meet,crossHits:[],crossDone:false,relayed:false};
  for(let slot=0;slot<(awake?2:1);slot++){
   const side=slot?1:-1,p=G.World.fire(b,e,{mode:'boomerang',castId,angleOffset:side*.16,damage:slot?2.3:b.def.shotDamage});if(!p)continue;
   p.bladeHunt=true;p.bladeSlot=slot;p.bladeBase=slot?2.3:b.def.shotDamage;p.bladeMarkUsed=false;p.bladePlan=plan.mode;p.bladeTarget=t.id;p.bladeCreated=e.time;p.bladeDisposed=false;
   const destination=plan.mode==='relay'?meet:end,duration=plan.mode==='relay'?this.config.relayTime:awake?.58:.65;
   p.curve={start:{x:p.x,y:p.y},control:this.point(b,{x:(p.x+destination.x)/2-ny*side*clamp(distance*.3,24,58),y:(p.y+destination.y)/2+nx*side*clamp(distance*.3,24,58)},p.radius),end:{...destination},started:e.time,duration};
   p.turnAt=e.time+duration;p.relayUntil=e.time+duration+this.config.relayWait;
  }
  G.Adaptive?.close(b,b.character.bladeAdaptiveId);e.sound('throw',b.x);b.nextShot=e.time+(awake?4.2:b.def.shotPeriod);
 },
 // Only the relay rendezvous and the non-returning blade use a new mover.
 // Ordinary outbound and return arcs continue through Characters.moveBlade and wall sweeps.
 move(p,b,e,dt){
  if(!p.bladeSling&&(p.bladePlan!=='relay'||p.returning))return false;
  if(p.bladeSling){p.returning=false;if(p.magnetUntil&&p.magnetUntil<=e.time)p.magnetUntil=0;}
  if(G.Magnet.moveBlade(p,b,e,dt))return true;
  const ox=p.x,oy=p.y;
  if(p.bladeSling){p.x+=p.vx*dt;p.y+=p.vy*dt;}
  else if(e.time>p.relayUntil){G.Characters.returnBlade(p,b,e);return false;}
  else{const q=p.curve,u=clamp((e.time-q.started)/q.duration,0,1),v=1-u;p.x=v*v*q.start.x+2*v*u*q.control.x+u*u*q.end.x;p.y=v*v*q.start.y+2*v*u*q.control.y+u*u*q.end.y;if(dt){p.vx=(p.x-ox)/dt;p.vy=(p.y-oy)/dt;}}
  if(e.tick%4===0){p.history.unshift({x:p.x,y:p.y,at:e.time});p.history.length=Math.min(p.history.length,p.bladeSling?24:16);}
  return true;
 },
 relay(e){
  for(const b of e.balls){const plan=b.character?.bladeHunt?.plan;if(b.hp<=0||!plan||plan.mode!=='relay'||plan.relayed)continue;
   const blades=e.projectiles.filter(p=>p.owner===b.id&&p.castId===plan.id&&p.bladeHunt&&!p.returning&&!p.bladeDisposed&&!p.bladeSling),a=blades.find(p=>p.bladeSlot===0),other=blades.find(p=>p.bladeSlot===1);
   if(!a||!other||a.magnetUntil>e.time||other.magnetUntil>e.time)continue;
   // Both blades must have reached the distant rendezvous and actually meet.
   if(e.time<plan.created+this.config.relayTime*.85||Math.hypot(a.x-plan.meet.x,a.y-plan.meet.y)>14||Math.hypot(other.x-plan.meet.x,other.y-plan.meet.y)>14||Math.hypot(a.x-other.x,a.y-other.y)>a.radius+other.radius+1)continue;
   plan.relayed=true;const target=e.balls.find(t=>t.id===plan.target&&G.World.targetable(t,e)&&G.World.enemy(b,t,e));
   if(!target){G.Characters.returnBlade(a,b,e);G.Characters.returnBlade(other,b,e);continue;}
   const angle=G.ManualFour?.owns(b,e)?G.ManualFour.relayAim(b,a,e):G.Aim.adjust(b,e,'bladeRelay',G.World.aim({...b,x:a.x,y:a.y},target,this.config.slingSpeed));
   a.bladeSling=true;a.speed=this.config.slingSpeed;a.vx=Math.cos(angle)*a.speed;a.vy=Math.sin(angle)*a.speed;a.expires=e.time+Math.hypot(target.x-a.x,target.y-a.y)/a.speed+.6;
   this.cue(e,b,'relay',{x:(a.x+other.x)/2,y:(a.y+other.y)/2},{angle});e.sound('bladeCatch',a.x);e.sound('throw',a.x);G.Characters.returnBlade(other,b,e);
  }
 },
 reward(b,e,count=Math.min(2,b.character.caughtInCast)){if(b.hp<=0||e.ending)return;b.character.catchPower=count>=2?1.4:1.2;b.character.catchUntil=e.time+this.config.rewardLife;e.signal(b,count>=2?'双刃重斩就绪':'单刃重斩就绪','bladeCatch');this.cue(e,b,'catch',b,{count});},
 inArc(b,t,e,s){const dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy),r=b.radius+this.config.slashReach;if(d>r+t.radius)return false;const delta=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-s.angle),Math.cos(Math.atan2(dy,dx)-s.angle))),half=s.count>=2?this.config.doubleHalfAngle:this.config.singleHalfAngle;return delta<=half+Math.asin(Math.min(1,t.radius/(d||1)))&&this.clear(b,t,e);},
 startSwing(b,t,e,dance=false){const state=this.state(b);if(state.swing||b.character.catchUntil<=e.time)return false;state.swing={at:e.time,angle:Math.atan2(t.y-b.y,t.x-b.x),count:b.character.catchPower>=1.4?2:1,struck:false,dance};b.character.catchUntil=0;e.sound(state.swing.count>=2?'bladeTwinWhoosh':'bladeSlashWhoosh',b.x);return true;},
 beforeMove(b,dt,e){
  if(b.type!=='boomerang')return;const state=this.state(b),c=this.config;
  if(b.hp<=0||e.ending||G.World.absent(b,e)){state.swing=null;state.plan=null;return;}
  const dance=!!G.BladeDance?.active(b);
  let s=state.swing;
  if(s){if(G.Temporal.silenced(b,e)&&!s.dance)state.swing=null;else{
   if(!s.struck&&e.time+1e-9>=s.at+c.slashWind){s.struck=true;s.x=b.x;s.y=b.y;for(const t of e.balls)if(G.World.targetable(t,e)&&G.World.enemy(b,t,e)&&this.inArc(b,t,e,s))e.pendingAttacks.push({source:b,target:t,kind:'bladeSlash',damageOrigin:'weapon',raw:G.Combat.rollAttack(b,e,s.count>=2?c.doubleDamage:c.singleDamage,'bladeSlash'),angle:s.angle,slashCount:s.count,...(s.dance?{priority:'arcana'}:{})});}
   if(e.time>=s.at+c.slashLife)state.swing=null;
  }}
  if(dance)return;
  if(!G.ManualRoles?.owns(b,e)&&!state.swing&&!G.Temporal.silenced(b,e)&&b.character.catchUntil>e.time&&!b.character.bladeRemaining){const t=G.World.targetFor(b,e);if(t&&Math.hypot(t.x-b.x,t.y-b.y)<=b.radius+t.radius+c.slashReach-5&&this.clear(b,t,e)){
   this.startSwing(b,t,e);
  }}
  // Chase provides steering, not armor, forced speed, or a replacement for knockback.
  if(G.ManualFour?.owns(b,e)&&e.manual.chaseCast!==state.plan?.id)return;
  if(state.plan?.mode!=='chase'||G.Temporal.silenced(b,e)||b.inertia>0||b.magnetic?.anchored||G.Priority?.forced(b,e))return;
  const p=e.projectiles.find(p=>p.owner===b.id&&p.castId===state.plan.id&&p.bladeHunt&&p.returning&&!p.bladeDisposed);if(!p||!this.clear(b,p,e,b.radius))return;
  const heading=Math.atan2(b.vy,b.vx),desired=Math.atan2(p.y-b.y,p.x-b.x),a=turn(heading,desired,c.chaseTurn*dt*(b.temporal?.rate??1)*(G.Venom?.speedFactor(b)||1)),speed=Math.hypot(b.vx,b.vy)||b.speed;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;
 },
 hit(h,e){
  if(h.source.type!=='boomerang')return;
  if(h.kind==='boomerang'&&h.bladeSling&&h.actual+h.blocked>0&&!h.avoided){G.Roles.heavyImpact(h.source,h,e,'bladeImpact','bladeHeavyHit',0,this.config.slingStop);this.cue(e,h.source,'slingHit',h.target,{angle:h.angle,blocked:!h.actual,life:.28});}
  if(h.kind==='bladeSlash'&&h.actual+h.blocked>0&&!h.avoided){G.Roles.heavyImpact(h.source,h,e,'bladeImpact',h.slashCount>=2?'bladeTwinHit':'bladeSlashHit',h.slashCount>=2?155:90,h.slashCount>=2?.06:.045);this.cue(e,h.source,'slashHit',h.target,{angle:h.angle,count:h.slashCount,blocked:!h.actual});}
  if(h.kind==='boomerang'&&h.bladeCross&&h.actual+h.blocked>0&&!h.avoided){const plan=h.source.character.bladeHunt?.plan;if(!plan||plan.id!==h.bladeCast||plan.crossDone)return;plan.crossHits=plan.crossHits.filter(v=>e.time-v.at<=this.config.crossWindow);const other=plan.crossHits.find(v=>v.slot!==h.bladeSlot&&v.target===h.target.id);if(other){plan.crossDone=true;this.cue(e,h.source,'cross',h.target,{angle:h.angle});}plan.crossHits.push({slot:h.bladeSlot,target:h.target.id,at:e.time});}
 },
 retire(b){if(b.type!=='boomerang')return;b.character.bladeRemaining=0;b.character.caughtInCast=0;b.character.catchUntil=0;const s=b.character.bladeHunt;if(s){s.plan=null;s.swing=null;}},
 endCombat(e){for(const b of e.balls)this.retire(b);},
 status(b,e){const s=b.character.bladeHunt,plan=s?.plan;return[{label:'刃伤',value:G.Combat.attackValue(b,e,b.def.shotDamage,'boomerang').toFixed(1)},{label:'投掷',value:Math.max(0,b.nextShot-e.time).toFixed(1)+'s'},{label:'武器',value:b.character.bladeRemaining?'在外 '+b.character.bladeRemaining:'手中'},{label:'招式',value:G.BladeDance?.active(b)?'双生轮舞':b.character.bladeRemaining?({chase:'逐刃追猎',single:'弧刃投返',cross:'交错斩',relay:'极限弹射'})[plan?.mode]||'投返':'待机'},{label:'接刃',value:b.character.catchUntil>e.time?(b.character.catchPower>=1.4?'双刃':'单刃')+' '+(b.character.catchUntil-e.time).toFixed(1)+'s':s?.swing?'挥斩中':'未蓄势'},...G.Recovery.refundStatus(b)];}
};
const hit=G.Characters.hit;G.Characters.hit=function(h,e){hit.call(this,h,e);H.hit(h,e);};
})(typeof window!=='undefined'?window:globalThis);
