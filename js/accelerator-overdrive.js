(function(root){
'use strict';
const G=root.OrbDuel,A=G.Arcana,C=G.Constants,EPS=1e-7;
// Existing module name retained for static entry compatibility. Gear behavior is removed.
const O=G.Overdrive={
 config:{speed:900,wallCap:4,cruiseRamp:.24,brakeGap:8,brakeDistance:270,peakStop:.12,timeout:6},
 state:b=>b.arcana?.overdrive,active:()=>false,running:b=>!!b?.arcana?.overdrive?.active,controlled:b=>!!b?.kineticCycle,
 eligible(b,e){return e.mode==='arcana'&&b.type==='accelerator'&&b.arcana&&!b.arcana.used&&b.hp>0&&b.hp<=b.maxHp*A.ratio&&G.Awakening.active(b);},
 ensure(b,e){if(e.mode!=='arcana'||b.type!=='accelerator'||!b.arcana)return null;return b.arcana.overdrive??={active:false,ready:false,phase:'idle',path:[],events:[],walls:0};},
 owner(v,e){return e.balls.find(b=>b.id===v.kineticCycle?.owner&&this.running(b));},
 bounds(t){const q=t.combatBounds||{},r=t.radius;return {left:(q.left||0)+r,right:(q.right??C.width)-r,top:(q.top||0)+r,bottom:(q.bottom??C.height)-r};},
 route(b,t,e){
  if(!G.Mines.freeLine(b,t,e))return null;
  const q=this.bounds(t),w=q.right-q.left,h=q.bottom-q.top;
  if(w<70||h<70||b.x<q.left||b.x>q.right||b.y<q.top||b.y>q.bottom)return null;
  const nx=(t.x-b.x)/(Math.hypot(t.x-b.x,t.y-b.y)||1),ny=(t.y-b.y)/(Math.hypot(t.x-b.x,t.y-b.y)||1),candidates=[];
  for(let ix=-4;ix<=4;ix++)for(let iy=-4;iy<=4;iy++){
   const imageX=q.left+ix*w+(ix%2?w-(b.x-q.left):b.x-q.left),imageY=q.top+iy*h+(iy%2?h-(b.y-q.top):b.y-q.top);
   const dx=imageX-t.x,dy=imageY-t.y,len=Math.hypot(dx,dy),dot=(dx*nx+dy*ny)/(len||1);if(len<650||len>2300||dot<.08)continue;
   let x=t.x,y=t.y,ux=dx/len,uy=dy/len,left=len-b.radius-t.radius-this.config.brakeGap,nodes=[],valid=true;
   for(let i=0;i<12&&left>EPS;i++){
    const tx=Math.abs(ux)<EPS?Infinity:((ux>0?q.right:q.left)-x)/ux,ty=Math.abs(uy)<EPS?Infinity:((uy>0?q.bottom:q.top)-y)/uy,wall=Math.min(tx,ty),distance=Math.min(left,wall),end={x:x+ux*distance,y:y+uy*distance};
    const sx=end.x-x,sy=end.y-y,den=sx*sx+sy*sy,along=den?Math.max(0,Math.min(1,((b.x-x)*sx+(b.y-y)*sy)/den)):0;
    if(nodes.length&&Math.hypot(x+sx*along-b.x,y+sy*along-b.y)<b.radius+t.radius+.5||G.ArenaWalls&&!G.ArenaWalls.clear({x,y},end,e,t.radius)){valid=false;break;}
    const hit=wall<=left+EPS,wx=hit&&Math.abs(tx-wall)<EPS?(ux>0?-1:1):0,wy=hit&&Math.abs(ty-wall)<EPS?(uy>0?-1:1):0;
    nodes.push({...end,nx:wx,ny:wy});x=end.x;y=end.y;left-=distance;if(wx)ux=-ux;if(wy)uy=-uy;
   }
   const walls=nodes.filter(p=>p.nx||p.ny).length,last=nodes.at(-1);
   if(valid&&left<EPS&&walls>=2&&walls<=4&&last&&Math.abs(Math.hypot(last.x-b.x,last.y-b.y)-(b.radius+t.radius+this.config.brakeGap))<.01)candidates.push({nodes,length:len,score:Math.abs(walls-3)*240+(1-dot)*140+Math.abs(len-1300)*.12});
  }
  return candidates.sort((a,b)=>a.score-b.score)[0]||null;
 },
 blocked(t,e){return A.immuneTarget(t,e)||G.Physics.armored(t)||t.magnetic?.anchored||t.stance?.phase==='active'||this.controlled(t)||G.Priority?.forced(t,e);},
 event(b,e,kind,p=b,extra={}){const s=this.state(b);s.events.push({kind,t:e.time,x:p.x,y:p.y,...extra});s.events=s.events.slice(-16);G.Presentation?.note(e,'arcana.kinetic',{actorId:b.id,targetId:b.arcana.target,stage:kind,walls:s.walls});},
 begin(b,t,e,route){
  const u=b.arcana,s=this.ensure(b,e),contactRaw=G.Combat.rollAttack(b,e);A.commit(b,e);u.target=t.id;u.phase='kineticFlight';
  Object.assign(s,{active:true,ready:false,phase:'flight',started:e.time,until:e.time+this.config.timeout,nodes:route.nodes,index:0,walls:0,path:[],events:[],gather:0,gatherAt:null,decelerating:false,origin:{x:b.x,y:b.y},cruise:b.speed,transferAngle:Math.atan2(t.y-b.y,t.x-b.x)});
  b.kineticCycle={owner:b.id,side:'caster'};t.kineticCycle={owner:b.id,side:'target'};
  b.awakening.dashUntil=e.time;b.awakening.chargeUntil=0;b.awakening.stopAfterContact=false;b.awakening.dashHit=true;b.awakening.dashSuccess=true;
  b.speed=0;b.motionSpeed=0;b.vx=b.vy=0;b.inertia=0;t.motionSpeed=900;t.inertia=0;t.stagger=null;t.magneticMark=null;
  const p=s.nodes[0],d=Math.hypot(p.x-t.x,p.y-t.y)||1;t.vx=(p.x-t.x)/d*900;t.vy=(p.y-t.y)/d*900;t.awakening.stopAfterContact=false;
  this.event(b,e,'transfer',t,{angle:s.transferAngle,fromX:b.x,fromY:b.y});e.sound('arcSonicRush',t.x);e.pendingAttacks.push(this.packet(b,t,e,contactRaw,'arcKineticTransfer'));
 },
 packet(b,t,e,raw,kind){return {source:b,target:t,kind,kineticCycle:true,dash:kind==='arcKineticTransfer',raw,priority:'arcana',healRatio:0,noReflect:kind!=='arcKineticTransfer',damageOrigin:kind==='arcKineticTransfer'?'actor':'wall',feedback:{presented:true,push:0,stop:0,power:1.2},point:{x:t.x,y:t.y}};},
 update(b,e,dt=C.dt){const s=this.ensure(b,e);if(!s)return;
  if(!s.active){s.ready=this.eligible(b,e);b.arcana.waiting=s.ready?'等待觉醒冲刺命中':'';return;}
  const t=e.balls.find(v=>v.id===b.arcana.target);
  if(t)s.until+=dt*(1-(t.temporal?.rate??1));
  if(!t||b.hp<=0||t.hp<=0||e.ending||e.time>s.until||e.time>s.started+30||G.World.absent(t,e)||G.Ghost.phased(t)||G.Physics.armored(t)||A.immune(t)||G.Priority?.forced(t,e)||G.Priority?.forced(b,e)||s.phase==='flight'&&Math.hypot(b.x-s.origin.x,b.y-s.origin.y)>1){this.finish(b,e);return;}
  if(s.phase==='hold'&&e.time+EPS>=s.releaseAt)this.burst(b,t,e);
  if(s.phase==='burst'&&s.casterDone&&s.targetDone)this.finish(b,e);
 },
 contact(a,b,e){if(e.ending||e.state!=='running'||!G.World.enemy(a,b,e)||Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius+.1)return;for(const [v,t]of [[a,b],[b,a]]){const s=this.ensure(v,e);if(!s||!s.ready||!this.eligible(v,e)||s.active||!G.Awakening.dashing(v,e)||this.blocked(t,e)||G.Ghost.justExited(t,e)||G.Priority?.forced(v,e))continue;const route=this.route(v,t,e);if(!route){v.arcana.waiting='等待可回归路线';continue;}this.begin(v,t,e,route);return;}},
 wall(b,t,e,normal,final=false){
  const s=this.state(b),speed=Math.max(normal.nx?Math.abs(t.vx):0,normal.ny?Math.abs(t.vy):0),allowed=final||s.walls<this.config.wallCap,before=e.pendingAttacks.length;
  t.wallContact={speed,nx:normal.nx,ny:normal.ny};t.stagger=allowed?{owner:b.id,until:e.time+.1,energy:true,heat:e.heatMultiplier}:null;
  // Same wall entry, normal velocity, mass, shield rules and feedback as ordinary dash knockback.
  G.Characters.wall(t,e);
  for(const hit of e.pendingAttacks.slice(before))if(hit.kind==='wallSlam'&&hit.source===b&&hit.target===t){hit.priority='arcana';hit.kineticCycle=true;hit.kineticFinal=final;hit.kineticWallSpeed=speed;}
  this.event(b,e,'wall',t,{nx:normal.nx,ny:normal.ny,final});e.sound('wall',t.x,{impactSpeed:speed});if(!final)s.walls++;
 },
 gather(b,t,e,speed){const s=this.state(b);if(s.gatherAt===null){s.gatherAt=e.time;const end=s.nodes.at(-1);s.focus={x:(b.x+end.x)/2,y:(b.y+end.y)/2};s.angle=Math.atan2(end.y-b.y,end.x-b.x);this.event(b,e,'gather',s.focus,{angle:s.angle});e.sound('arcSonicCharge',s.focus.x);}s.gather=Math.max(s.gather,1-speed/this.config.speed);},
 brake(b,t,e){const s=this.state(b);this.gather(b,t,e,0);s.phase='hold';b.arcana.phase='kineticHold';s.releaseAt=e.time+C.dt;s.brakeAt=e.time;s.focus={x:(b.x+t.x)/2,y:(b.y+t.y)/2};s.angle=Math.atan2(t.y-b.y,t.x-b.x);t.motionSpeed=0;t.vx=t.vy=b.vx=b.vy=0;t.inertia=0;this.event(b,e,'brake',s.focus,{angle:s.angle});A.stop(e,this.config.peakStop);},
 burst(b,t,e){const s=this.state(b);s.phase='burst';s.burstAt=e.time;b.arcana.phase='kineticBurst';s.casterDone=s.targetDone=false;s.launch={};for(const [v,sign]of [[b,-1],[t,1]]){s.launch[v.id]={nx:Math.cos(s.angle)*sign,ny:Math.sin(s.angle)*sign};v.motionSpeed=900;v.vx=Math.cos(s.angle)*900*sign;v.vy=Math.sin(s.angle)*900*sign;v.inertia=0;v.stagger=null;}this.event(b,e,'burst',s.focus,{angle:s.angle});e.sound('arcSonicRelease',s.focus.x);e.impact(s.focus.x,s.focus.y,'#fff2c5',2.6);},
 restore(v,e,carry=false){delete v.kineticCycle;v.motionSpeed=0;v.inertia=carry?.75:0;v.impactDrag=carry?3.1:0;v.stagger=null;v.trail=[];v.awakening.stopAfterContact=false;if(carry)G.Physics.limit(v);else G.Physics.normalizeSpeed(v);},
 finish(b,e){const s=this.state(b);if(!s?.active)return;for(const v of e.balls)if(v.kineticCycle?.owner===b.id){if(v===b)v.speed=Math.max(v.def.speed,Math.min(v.def.dashRecoveryCap,s.cruise*.82));this.restore(v,e);}s.active=false;s.ready=false;s.phase='idle';s.ended=e.time;b.arcana.phase='idle';b.arcana.target=null;b.character.recoveryUntil=e.time+.6;},
 move(v,dt,e){const b=this.owner(v,e);if(!b){delete v.kineticCycle;return false;}const s=this.state(b),t=e.balls.find(t=>t.id===b.arcana.target);v.wallContact=null;
  if((v===b&&s.phase!=='burst')||s.phase==='hold'){v.vx=v.vy=0;return false;}
  let distance=900*dt*(v.temporal?.rate??1),guard=0;
  let returnSpeed=900;
  if(s.phase==='flight'){
   let remaining=0,previous=v;for(let i=s.index;i<s.nodes.length;i++){const p=s.nodes[i];remaining+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}
   if(remaining<=EPS){this.brake(b,t,e);return false;}
   const zone=this.config.brakeDistance,fast=Math.max(0,remaining-zone);
   if(distance>fast){const available=Math.min(remaining,zone),seconds=(distance-fast)/900,root=Math.max(0,Math.sqrt(available)-900/(2*Math.sqrt(zone))*seconds),left=root*root;distance=fast+available-left;returnSpeed=900*root/Math.sqrt(zone);s.decelerating=true;this.gather(b,t,e,returnSpeed);}else s.decelerating=false;
  }
  while(distance>EPS&&guard++<8){
   if(s.phase==='flight'){
    const p=s.nodes[s.index];if(!p){this.brake(b,t,e);break;}const dx=p.x-v.x,dy=p.y-v.y,len=Math.hypot(dx,dy),amount=Math.min(distance,len),nx=dx/(len||1),ny=dy/(len||1);
    if(G.ArenaWalls&&!G.ArenaWalls.clear(v,{x:v.x+nx*amount,y:v.y+ny*amount},e,v.radius)){this.finish(b,e);break;}
    v.vx=nx*returnSpeed*(v.temporal?.rate??1);v.vy=ny*returnSpeed*(v.temporal?.rate??1);v.x+=nx*amount;v.y+=ny*amount;distance-=amount;
    if(len<=amount+EPS){s.index++;if(p.nx||p.ny){if(p.nx)v.vx=-v.vx;if(p.ny)v.vy=-v.vy;this.wall(b,v,e,p);}else{this.brake(b,t,e);break;}}
   }else if(s.phase==='burst'){
    const q=this.bounds(v),{nx,ny}=s.launch[v.id],tx=Math.abs(nx)<EPS?Infinity:((nx>0?q.right:q.left)-v.x)/nx,ty=Math.abs(ny)<EPS?Infinity:((ny>0?q.bottom:q.top)-v.y)/ny;v.vx=nx*900*(v.temporal?.rate??1);v.vy=ny*900*(v.temporal?.rate??1);
    let edge=Math.max(0,Math.min(tx,ty)),normal={nx:Math.abs(tx-edge)<EPS?(nx>0?-1:1):0,ny:Math.abs(ty-edge)<EPS?(ny>0?-1:1):0};
    const inner=G.ArenaWalls?.hit(v.x,v.y,nx,ny,v.radius,e);if(inner&&inner.distance<edge){edge=inner.distance;normal=inner;}
    const amount=Math.min(distance,edge);v.x+=nx*amount;v.y+=ny*amount;distance=0;
    if(edge<=amount+EPS){if(normal.nx)v.vx=-v.vx;if(normal.ny)v.vy=-v.vy;if(v===t){this.wall(b,t,e,normal,true);s.targetDone=true;}else{s.casterDone=true;this.event(b,e,'return',b);e.sound('wall',b.x,{impactSpeed:900});b.speed=Math.max(b.def.speed,Math.min(b.def.dashRecoveryCap,s.cruise*.82));b.kineticCruise={from:b.speed,started:e.time,until:e.time+this.config.cruiseRamp};}this.restore(v,e,true);}
   }else break;
  }
  if(e.tick%2===0&&s.active){s.path.unshift({x:v.x,y:v.y,t:e.time,actor:v.id});s.path=s.path.filter(p=>e.time-p.t<.48).slice(0,120);}return false;
 }
};
A.defs.accelerator={name:'超速·动能轮回',raw:0};
const contacts=G.Combat.contactAttacks;G.Combat.contactAttacks=function(a,b,e,...args){return O.controlled(a)||O.controlled(b)?[]:contacts.call(this,a,b,e,...args);};
const batch=G.Combat.resolveBatch;G.Combat.resolveBatch=function(p,e,c=[]){return batch.call(this,p,e,c.filter(([a,b])=>!O.controlled(a)&&!O.controlled(b)));};
const characterHit=G.Characters.hit;G.Characters.hit=function(h,e){characterHit.call(this,h,e);if(h.kineticFinal&&!h.avoided&&h.actual+h.blocked>0&&h.feedback){h.feedback.cue='arcSonicHit';h.feedback.stop=.08;h.feedback.power=2.9;}};

const custom=A.customMove,move=A.move,noContact=A.noContact,finish=A.finish;
A.customMove=function(b){return O.controlled(b)||custom.call(this,b);};A.move=function(b,dt,e){return O.controlled(b)?O.move(b,dt,e):move.call(this,b,dt,e);};A.noContact=function(b){return O.controlled(b)||noContact.call(this,b);};A.finish=function(b,e){return O.running(b)?O.finish(b,e):finish.call(this,b,e);};
const cleanup=A.cleanup;A.cleanup=function(e){cleanup.call(this,e);for(const b of e.balls)if(O.running(b)&&(b.hp<=0||e.balls.find(v=>v.id===b.arcana.target)?.hp<=0))O.finish(b,e);};
const ending=G.Engine.prototype.beginEnding;G.Engine.prototype.beginEnding=function(...args){for(const b of this.balls)if(O.running(b))O.finish(b,this);return ending.apply(this,args);};
const reset=A.reset;A.reset=function(e){for(const b of e.balls){delete b.kineticCycle;delete b.kineticCruise;}return reset.call(this,e);};
const awaken=G.Awakening.update;G.Awakening.update=function(b,dt,e){if(O.controlled(b))return;if(!O.eligible(b,e))return awaken.call(this,b,dt,e);const silence=b.temporal.silenceUntil;b.temporal.silenceUntil=0;try{return awaken.call(this,b,dt,e);}finally{b.temporal.silenceUntil=silence;}};
// Only the eligible Arcana's dash primer survives silence. Other skill clocks and
// debuffs still run through the original interrupt routine unchanged.
const interrupt=G.Temporal.interrupt;G.Temporal.interrupt=function(b,e){const save=O.eligible(b,e)&&(b.awakening.chargeUntil>e.time||G.Awakening.dashing(b,e))?{chargeUntil:b.awakening.chargeUntil,dashUntil:b.awakening.dashUntil,dashStartedAt:b.awakening.dashStartedAt,dashStartSpeed:b.awakening.dashStartSpeed,dashStopSpeed:b.awakening.dashStopSpeed,dashHit:b.awakening.dashHit,dashSuccess:b.awakening.dashSuccess,stopAfterContact:b.awakening.stopAfterContact}:null,velocity=save&&{vx:b.vx,vy:b.vy,motionSpeed:b.motionSpeed,speed:b.speed};const result=interrupt.call(this,b,e);if(save){Object.assign(b.awakening,save);Object.assign(b,velocity);}return result;};
const skillUpdate=G.Skills.accelerator.update;G.Skills.accelerator.update=function(b,dt,e){if(O.controlled(b))return;if(b.kineticCruise){const p=b.kineticCruise,q=Math.max(0,Math.min(1,(e.time-p.started)/(p.until-p.started)));b.speed=p.from+(b.def.maxSpeed-p.from)*(1-(1-q)**2);if(q>=1)delete b.kineticCruise;return;}return skillUpdate.call(this,b,dt,e);};
const status=A.status,copy=A.copy;A.status=function(b,e){const s=O.state(b);return b.type==='accelerator'&&b.arcana?{label:'奥义',value:s?.active?({flight:'动能传递',hold:'零距制动',burst:'动能轮回'})[s.phase]:b.arcana.used?'已使用':s?.ready?'冲刺命中发动':'≤30%解锁'}:status.call(this,b,e);};
A.copy=function(type){return type==='accelerator'?'奥义 · 超速·动能轮回：觉醒且生命≤30%后，下一次觉醒冲刺命中发动，每局一次。本体交出动能静止，敌人900速度真实多墙反弹后回归；零距刹停蓄压，双方反向900弹射，敌人追加一次墙伤，本体首次撞墙后恢复巡航。失衡墙伤有次数/总量上限；沉默不阻止奥义。':copy.call(this,type);};
const snapshot=A.snapshot;A.snapshot=function(u){const result=snapshot.call(this,u);if(u.overdrive)result.overdrive=JSON.parse(JSON.stringify(u.overdrive));return result;};
const engineSnapshot=G.Engine.prototype.snapshot;G.Engine.prototype.snapshot=function(){const result=engineSnapshot.call(this);for(const v of result.balls){const actor=this.balls.find(b=>b.id===v.id);if(actor.kineticCycle)v.kineticCycle={...actor.kineticCycle};if(actor.kineticCruise)v.kineticCruise={...actor.kineticCruise};}return result;};
})(typeof window!=='undefined'?window:globalThis);
