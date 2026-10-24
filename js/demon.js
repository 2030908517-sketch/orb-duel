(function(root){
 'use strict';
 const G=root.OrbDuel,C=G.Constants,EPS=1e-7,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const D=G.Demon={
  fresh(){return {nextClaw:2.8,nextGate:Infinity,resumeAt:0};},
  reset(e){delete e.demonCinematic;e.demonWorld=e.balls.some(b=>b.type==='demon')?{marks:[],claws:[],souls:[],casts:[],queued:[],servants:[]}:null;for(const b of e.balls)if(b.type==='demon')b.demon=this.fresh();},
  activate(b,e){b.demon??=this.fresh();b.demon.nextGate=e.time+.8;},
  actor(e,id){return e.balls.find(b=>b.id===id);},
  snapshotWorld(e){return JSON.parse(JSON.stringify(e.demonWorld));},
  soul(e,t,b){return e.demonWorld?.souls.find(s=>s.target===(t.id??t)&&s.state==='tether'&&(b===undefined||s.owner===(b.id??b)));},
  branded(b,t,e){return e.demonWorld?.marks.some(m=>m.owner===b.id&&m.target===t.id&&m.until>=e.time);},
  mark(b,t,e){let m=e.demonWorld.marks.find(v=>v.owner===b.id&&v.target===t.id);if(m)m.until=e.time+b.def.brandLife;else{e.demonWorld.marks.push({owner:b.id,target:t.id,until:e.time+b.def.brandLife});this.event(e,b,'brand',t,'demonBrand',{life:.45});}},
  consume(owner,target,e){e.demonWorld.marks=e.demonWorld.marks.filter(m=>m.owner!==owner||m.target!==target);},
  effect(e,b,style,p,extra={}){e.effects.push({kind:'demonSoul',style,owner:b.id,x:p.x,y:p.y,color:b.def.color,age:0,life:.35,...extra});},
  event(e,b,style,p,cue,extra={}){const id=e.nextWorldId++;this.effect(e,b,style,p,{eventId:id,...extra});if(cue)e.sound(cue,p.x);G.Presentation?.note(e,'demon.'+style,{eventId:id,actorId:b.id,x:p.x,y:p.y});return id;},
  release(owner,target,e,reason='return'){const w=e.demonWorld;if(!w)return;for(const s of w.souls.filter(s=>s.owner===owner&&s.target===target)){w.souls=w.souls.filter(v=>v!==s);const b=this.actor(e,owner),t=this.actor(e,target);if(b&&t&&!['reset','end','rewind'].includes(reason))this.event(e,b,s.state==='servant'?'dissolve':'return',s,s.state==='servant'?'demonServantDeath':'demonReturn',{endX:t.x,endY:t.y,host:t.id,returnColor:t.def.color,life:1.2});if(s.arcana)G.DemonArcana?.finish(b,e,reason);}},
  cleanse(t,e){if(!e.demonWorld)return;e.demonWorld.marks=e.demonWorld.marks.filter(m=>m.target!==t.id);for(const s of [...e.demonWorld.souls])if(s.target===t.id&&!s.arcana)this.release(s.owner,s.target,e,'cleanse');},
  relocated(t,e,rewind=false){if(rewind&&e.demonWorld)e.demonWorld.queued=e.demonWorld.queued.filter(p=>p.target!==t);for(const s of [...(e.demonWorld?.souls||[])])if(s.target===t.id&&(rewind||!s.arcana))this.release(s.owner,s.target,e,rewind?'rewind':'relocate');},
  clear(a,b,e,r=0){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);return !d||(!G.ArenaWalls||G.ArenaWalls.clear(a,b,e,r))&&(e.mode!=='2v2'||G.Team.rayLimit(a.x,a.y,dx/d,dy/d,r,e.obstacles)>=d-EPS);},
  legal(p,e,r=9){return p.x>=r&&p.x<=C.width-r&&p.y>=r&&p.y<=C.height-r&&(e.mode!=='2v2'||!e.obstacles.some(o=>G.Team.overlaps({...p,radius:r},o)));},
  cast(b,t,e,arcana=false){const c={id:e.nextWorldId++,owner:b.id,target:t.id,heat:e.heatMultiplier,arcana,expires:e.time+12,secondStarted:false};e.demonWorld.casts.push(c);return c;},
  rearPoint(b,t,p,e,second=false){const speed=Math.hypot(t.vx,t.vy),a=speed>1?Math.atan2(t.vy,t.vx):Math.atan2(t.y-b.y,t.x-b.x),distance=Math.min(b.def.gateHardLimit,clamp(b.def.gateMinDistance+speed*.10+(second?5:0),b.def.gateMinDistance,b.def.gateMaxDistance)),side=second?.55:0;
   for(const turn of [side,-side,.7,-.7,1.3,-1.3,Math.PI])for(const scale of [1,.7,.4]){const q={x:clamp(t.x-Math.cos(a+turn)*distance*scale,28,C.width-28),y:clamp(t.y-Math.sin(a+turn)*distance*scale,28,C.height-28)};if(Math.hypot(q.x-t.x,q.y-t.y)>30&&this.legal(q,e,13)&&this.clear(q,t,e,13)&&this.clear(q,p,e,13)&&(!second||!(e.demonWorld?.claws||[]).some(c=>c.owner===b.id&&c.gate&&c.expires>=e.time&&Math.hypot(c.startX-q.x,c.startY-q.y)<60)))return q;}
   return {x:clamp(t.x-Math.cos(a)*40,14,C.width-14),y:clamp(t.y-Math.sin(a)*40,14,C.height-14)};
  },
  newClaw(b,t,e,cast,o={}){
   const gate=!!o.gate,warning=o.warning??.55,flight=o.flight??(gate?b.def.gateFlight:b.def.clawFlight),s=o.pierce||o.cut?this.soul(e,t,b):null;
   const p=s?{x:s.x,y:s.y}:G.Awakening.predict(t,Math.min(.7,warning+flight));let start=o.start;
   if(!start)start=this.rearPoint(b,t,p,e,!!o.second);
   if(e.mode==='2v2')start=G.Team.freePoint(start,13,e.obstacles);
   const c={id:e.nextWorldId++,castId:cast.id,owner:b.id,target:t.id,adaptiveId:cast.adaptiveId,marked:!!this.branded(b,t,e),gate,second:!!o.second,arcana:!!cast.arcana,cut:!!o.cut,pierce:!!o.pierce,bodyNail:!!o.bodyNail,portalAngle:Math.atan2(p.y-start.y,p.x-start.x),attackRadius:13*(G.DemonHell?.active(b,e)?b.def.hellWidth:1),x:start.x,y:start.y,startX:start.x,startY:start.y,endX:p.x,endY:p.y,warningAt:e.time,lockAt:e.time+warning-(o.lock??.20),at:e.time+warning,flight,expires:e.time+warning+flight+.26,raw:o.raw??b.def.clawDamage*cast.heat*e.rng.between(.9,1.1),heat:cast.heat,hit:false,locked:false,released:false};
   e.demonWorld.claws.push(c);e.sound(o.cut?'demonTension':o.pierce||cast.arcana&&o.second?'demonNailWarn':o.second?'demonGateEcho':gate?'demonGate':'demonWarn',c.startX);return c;
  },
  summon(b,t,e,gates=false){const c=this.cast(b,t,e);c.adaptiveId=G.Adaptive?.begin(b,'demon',e);c.gates=gates;c.vertical=gates&&e.rng.next()<.5;this.newClaw(b,t,e,c,{gate:gates,raw:(gates?b.def.gateDamage:b.def.clawDamage)*c.heat*e.rng.between(.9,1.1)});G.Adaptive?.close(b,c.adaptiveId);b.stats.demonCasts=(b.stats.demonCasts||0)+1;e.signal(b,gates?'猎身 → 摄魂':'勾魂·噬魄','miss');return c;},
  second(c,e){if(!c.gates||c.secondStarted||c.cancelled)return;const b=this.actor(e,c.owner),t=this.actor(e,c.target);if(!b||!t||b.hp<=0||t.hp<=0||G.Temporal.silenced(b,e))return;c.secondStarted=true;const pierce=!!(c.firstBound&&this.soul(e,t,b)?.bound);this.newClaw(b,t,e,c,{gate:true,second:true,pierce,warning:.45,lock:.15,raw:(pierce?b.def.soulPierceDamage:b.def.gateDamage*e.rng.between(.9,1.1))*c.heat});},
  update(b,dt,e){if(e.state!=='running'||e.ending||G.Temporal.silenced(b,e)||G.DemonArcana?.active(b))return;b.demon??=this.fresh();const t=G.World.targetFor(b,e);if(!t||e.time<b.demon.resumeAt)return;const awake=G.Awakening.active(b),key=awake?'nextGate':'nextClaw';if(e.time+EPS>=b.demon[key]&&!G.Adaptive?.wait(b,t,e,'demon')){if(awake&&G.DemonArcana?.ready?.(b,t,e))G.DemonArcana.begin(b,t,e);else this.summon(b,t,e,awake);b.demon[key]=e.time+(awake?b.def.gatePeriod:b.def.clawPeriod);}},
  interrupt(b,e){const w=e.demonWorld;if(!w)return false;const active=w.claws.some(c=>c.owner===b.id&&!c.arcana);for(const s of [...w.souls])if(s.owner===b.id&&!s.arcana)this.release(s.owner,s.target,e,'silence');for(const c of w.casts)if(c.owner===b.id&&!c.arcana)c.cancelled=true;w.claws=w.claws.filter(c=>c.owner!==b.id||c.arcana);return active;},
  slow(b,e,lost){for(const c of e.demonWorld?.claws||[])if(c.owner===b.id&&!c.arcana){for(const k of ['at','lockAt','expires'])if(c[k]>e.time-C.dt)c[k]+=lost;c.warningAt+=lost;}},
  endCombat(e){const w=e.demonWorld;if(!w)return;for(const s of [...w.souls])this.release(s.owner,s.target,e,'end');w.claws=[];w.queued=[];this.Servants?.clear(e);for(const b of e.balls){delete b.demonLoss;delete b.demonStasis;}for(const b of e.balls)if(b.type==='demon')G.DemonArcana?.finish(b,e,'end');},
  cleanup(e){const w=e.demonWorld;if(!w)return;const alive=id=>this.actor(e,id)?.hp>0;w.marks=w.marks.filter(m=>alive(m.owner)&&alive(m.target)&&m.until>=e.time);for(const s of [...w.souls])if(!alive(s.owner)||!alive(s.target)||G.World.absent(this.actor(e,s.target),e)||e.ending||e.state==='ended')this.release(s.owner,s.target,e,'end');w.claws=w.claws.filter(c=>alive(c.owner)&&alive(c.target));w.casts=w.casts.filter(c=>alive(c.owner)&&(c.expires>=e.time||w.claws.some(v=>v.castId===c.id)));},
  forces(e){if(e.demonWorld&&e.state==='running')this.cleanup(e);},
  create(b,t,c,e,claw){if(b.hp<=0||t.hp<=0||e.demonWorld.souls.some(s=>s.target===t.id)||!G.World.enemy(b,t,e)||G.World.absent(t,e))return null;
   const a=Math.atan2(claw.startY-t.y,claw.startX-t.x),bound=!!(claw.marked||this.branded(b,t,e)),s={id:e.nextWorldId++,owner:b.id,target:t.id,state:'tether',x:t.x,y:t.y,previousX:t.x,previousY:t.y,radius:14,angle:a,omega:b.def.soulOrbitSpeed,bound,binding:false,until:e.time+b.def.soulLife,nextTug:e.time+.25,createdAt:e.time,createdTick:e.tick,lastHostX:t.x,lastHostY:t.y,vx:0,vy:0,history:[]};
   const speed=Math.hypot(t.vx,t.vy),pullAngle=speed>1?Math.atan2(-t.vy,-t.vx):a;s.angle=pullAngle;s.extraction={started:e.time,duration:b.def.soulPullDuration??.32,dx:Math.cos(pullAngle),dy:Math.sin(pullAngle),portalX:claw.startX,portalY:claw.startY,portalAngle:claw.portalAngle,clawId:claw.id};
   e.demonWorld.souls.push(s);claw.createdSoul=s.id;this.event(e,b,'peel',t,'demonExtract',{host:t.id,soulId:s.id,endX:t.x+Math.cos(pullAngle)*35,endY:t.y+Math.sin(pullAngle)*35,life:.4});return s;
  },
  outputFactor(b,e){return b?.demonServant?.damageFactor??1;},
  // Soul is a collision point against walls, not a second combat body.
  advance(s,vx,vy,dt,e){const ox=s.x,oy=s.y,speed=Math.hypot(vx,vy),wall=speed?G.ArenaWalls?.hit(ox,oy,vx/speed,vy/speed,s.radius,e):null;let travel=1;
   if(wall&&wall.distance<speed*dt){travel=Math.max(0,wall.distance-.002)/(speed*dt||1);const dot=vx*wall.nx+vy*wall.ny;s.vx=vx-2*dot*wall.nx;s.vy=vy-2*dot*wall.ny;s.bounced=true;}else{s.vx=vx;s.vy=vy;s.bounced=false;}
   s.x+=vx*dt*travel;s.y+=vy*dt*travel;const hit=G.Physics.constrain(s);if(hit)s.bounced=true;
   // Team's native constrain projects obstacle contacts; check swept travel to avoid tunnelling.
   if(!this.clear({x:ox,y:oy},s,e,s.radius)&&!(wall&&travel<1)){s.x=ox;s.y=oy;s.vx=-vx;s.vy=-vy;s.bounced=true;}
  },
  fitTether(s,t,e,reach=75){const dx=s.x-t.x,dy=s.y-t.y,d=Math.hypot(dx,dy);if(!d)return;const nx=dx/d,ny=dy/d,wall=G.ArenaWalls?.hit(t.x,t.y,nx,ny,s.radius,e).distance??Infinity,obstacle=e.mode==='2v2'?G.Team.rayLimit(t.x,t.y,nx,ny,s.radius,e.obstacles):Infinity;let max=Math.min(d,reach,Math.max(0,wall-.002),Math.max(0,obstacle-.002));
   for(const [v,n,lo,hi]of [[t.x,nx,s.radius,C.width-s.radius],[t.y,ny,s.radius,C.height-s.radius]])if(n>EPS)max=Math.min(max,(hi-v)/n);else if(n< -EPS)max=Math.min(max,(lo-v)/n);
   s.x=t.x+nx*Math.max(0,max);s.y=t.y+ny*Math.max(0,max);s.wallUntil=e.time+.12;
  },
  moveSoul(s,e,dt){const b=this.actor(e,s.owner),t=this.actor(e,s.target);if(!b||!t)return;s.previousX=s.x;s.previousY=s.y;if(!s.arcana&&e.time>=s.until){this.release(s.owner,s.target,e,'recovered');return;}
   const pull=s.extraction;if(pull&&e.time-pull.started<=pull.duration){const u=clamp((e.time-pull.started)/pull.duration,0,1),q=u*u*(3-2*u),distance=b.def.soulReach*q,goal={x:t.x+pull.dx*distance,y:t.y+pull.dy*distance};
    this.advance(s,(goal.x-s.x)/dt,(goal.y-s.y)/dt,dt,e);if(Math.hypot(s.x-t.x,s.y-t.y)>b.def.soulReach||!this.clear(t,s,e)||!this.legal(s,e,s.radius))this.fitTether(s,t,e,b.def.soulReach);s.lastHostX=t.x;s.lastHostY=t.y;return;}
   if(pull&&!pull.finished){pull.finished=true;if(s.bound&&!s.binding){s.binding=true;s.anchorX=s.x;s.anchorY=s.y;s.until=e.time+b.def.soulBoundLife;this.event(e,b,'bind',s,'demonChain',{life:.45});}}
   if(s.bound&&s.binding){const a=e.time*.8,goal={x:s.anchorX+Math.cos(a)*b.def.soulBindRadius,y:s.anchorY+Math.sin(a)*b.def.soulBindRadius};this.advance(s,(goal.x-s.x)*5,(goal.y-s.y)*5,dt,e);if(!this.clear(t,s,e)||!this.legal(s,e,s.radius))this.fitTether(s,t,e,b.def.soulReach);s.lastHostX=t.x;s.lastHostY=t.y;return;}
   // A newly formed/moving physical wall depenetrates the tether locally, like the native body solver.
   // It cannot erase the independent loss ledger or create damage.
   if(!this.clear(t,s,e)||!this.legal(s,e,s.radius))this.fitTether(s,t,e,b.def.soulReach);
   const dx=s.x-t.x,dy=s.y-t.y,d=Math.hypot(dx,dy),a=d>1?Math.atan2(dy,dx):s.angle,radial=Math.min(b.def.soulReach,d+(e.time<(s.wallUntil||0)?0:130*dt)),omega=s.omega||b.def.soulOrbitSpeed;
   const vx=(Math.cos(a+omega*dt)*radial-dx)/dt,vy=(Math.sin(a+omega*dt)*radial-dy)/dt;this.advance(s,vx,vy,dt,e);
   const space=Math.hypot(s.x-t.x,s.y-t.y);if(space>b.def.soulReach||!this.clear(t,s,e))this.fitTether(s,t,e,b.def.soulReach);
   if(s.bounced){s.omega=-omega;s.wallUntil=e.time+.12;s.angle=Math.atan2(s.y-t.y,s.x-t.x);}else s.angle=a+omega*dt;
   s.omega+=(Math.sign(s.omega||1)*b.def.soulOrbitSpeed-s.omega)*(1-Math.exp(-dt*5));if(s.bound&&!s.binding&&e.time-s.createdAt>.32){s.binding=true;s.anchorX=s.x;s.anchorY=s.y;s.until=e.time+b.def.soulBoundLife;this.event(e,b,'bind',s,'demonChain',{life:.45});}s.lastHostX=t.x;s.lastHostY=t.y;
  },
  canSoul(s,e){const t=this.actor(e,s.target);return !!t&&t.hp>0&&!G.World.absent(t,e)&&!G.Ghost.phased(t);},
  line(s,t){const dx=s.x-t.x,dy=s.y-t.y,d=Math.hypot(dx,dy);if(d<35)return null;const k=34/d;return {a:{x:t.x+dx*k,y:t.y+dy*k},b:{x:s.x,y:s.y}};},
  pointLine(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return {distance:Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy),x:a.x+k*dx,y:a.y+k*dy};},
  lineHit(s,t,p,ox,oy,r,e){const line=this.line(s,t);if(!line||!this.clear({x:ox,y:oy},p,e,r))return null;
   for(let i=0;i<=8;i++){const u=i/8,q={x:ox+(p.x-ox)*u,y:oy+(p.y-oy)*u},f=this.pointLine(q,line.a,line.b);if(f.distance<=r+1&&this.clear(q,f,e))return {...f,u};}return null;},
  touch(s,e){const b=this.actor(e,s.owner),t=this.actor(e,s.target);if(!b||!t||s.arcana||G.Temporal.silenced(b,e)||this.frozen?.(b,e)||e.time<s.nextTug||e.time-s.createdAt<.2||!this.canSoul(s,e))return;
   if(Math.hypot(b.x-t.x,b.y-t.y)<b.radius+t.radius+5||e.contactPairs?.some(([a,c])=>a.id===b.id&&c.id===t.id||c.id===b.id&&a.id===t.id))return;
   const proxy={...s,previousX:s.previousX,previousY:s.previousY};const u=G.World.sweep({x:b.x,y:b.y,radius:b.radius},b.previousX??b.x,b.previousY??b.y,proxy,e);
   if(u===Infinity||!this.clear(b,s,e,2))return;s.nextTug=e.time+b.def.soulTugCooldown;
   e.pendingAttacks.push({source:b,target:t,raw:b.def.soulTugDamage*e.heatMultiplier,heat:e.heatMultiplier,kind:'demonTug',trueDamage:true,bypassShield:true,soulId:s.id,soulProxy:s.id,point:{x:s.x,y:s.y},healRatio:0});
  },
  tug(b,t,s,e){s.pulseAt=e.time;this.event(e,b,'tug',s,'demonRend',{host:t.id,soulId:s.id,startX:t.x,startY:t.y,endX:s.x,endY:s.y,life:.44});e.impact(s.x,s.y,'#ed8f9e',1.45);e.hitStop(.035);},
  enslave(b,t,s,e){if(!s||G.Arcana.immuneTarget(t,e)||!this.Servants)return false;const p={x:s.x,y:s.y};s.arcana=false;e.demonWorld.souls=e.demonWorld.souls.filter(v=>v!==s);this.consume(b.id,t.id,e);this.Servants.add(b,t,p,e);this.event(e,b,'sever',p,'demonExecute',{startX:t.x,startY:t.y,endX:p.x,endY:p.y,life:.65});e.hitStop(.065);return true;},
  world(e,dt){const w=e.demonWorld;if(!w||e.state!=='running'||e.ending)return;this.cleanup(e);for(const s of [...w.souls]){this.moveSoul(s,e,dt);if(w.souls.includes(s))this.touch(s,e);}
   for(const c of [...w.claws]){const b=this.actor(e,c.owner),t=this.actor(e,c.target),cast=w.casts.find(v=>v.id===c.castId);if(!b||!t||!cast||b.hp<=0||t.hp<=0||this.frozen?.(b,e)||!c.arcana&&G.Temporal.silenced(b,e))continue;
    c.attackRadius=13*(G.DemonHell?.active(b,e)?b.def.hellWidth:1);if(c.arcStage){G.DemonArcana.gateWorld(c,cast,b,t,e,dt);continue;}
    if(e.time>c.expires){w.claws=w.claws.filter(v=>v!==c);continue;}const s=this.soul(e,t,b),aimLine=!!s&&c.cut,aimSoul=!!s&&c.pierce&&s.bound;
    if(e.time<c.lockAt){let desired=aimLine?{x:(s.x+t.x)*.5,y:(s.y+t.y)*.5}:aimSoul?{x:s.x,y:s.y}:G.Awakening.predict(t,Math.min(.7,Math.max(0,c.at+c.flight-e.time)));const p=c.arcana?desired:G.Aim.point(b,t,e,'claw:'+c.id,desired,dt);c.endX=p.x;c.endY=p.y;c.lineTarget=aimLine?s.id:null;}else c.locked=true;
    if(e.time+EPS<c.at)continue;if(!c.released){c.released=true;e.sound(c.pierce||c.bodyNail?'demonNailLaunch':'demonClaw',c.startX);}
    const ox=c.x,oy=c.y,age=e.time-c.at,u=age<=c.flight+.1?clamp(age/c.flight,0,1):clamp(1-(age-c.flight-.1)/.16,0,1),reach=Math.hypot(c.endX-c.startX,c.endY-c.startY),nx=(c.endX-c.startX)/(reach||1),ny=(c.endY-c.startY)/(reach||1),wall=G.ArenaWalls?.hit(c.startX,c.startY,nx,ny,c.attackRadius,e).distance??Infinity,obstacle=e.mode==='2v2'?G.Team.rayLimit(c.startX,c.startY,nx,ny,c.attackRadius,e.obstacles):Infinity,d=Math.min(reach*u,wall,obstacle);c.x=c.startX+nx*d;c.y=c.startY+ny*d;
    if(!c.hit&&age<=c.flight+.1&&this.canTarget(t,e)){
     const line=aimLine&&s.createdTick!==e.tick?this.lineHit(s,t,c,ox,oy,c.attackRadius,e):null;
     const soulHit=aimSoul&&s.createdTick!==e.tick?G.World.sweep({x:c.x,y:c.y,radius:10*(c.attackRadius/13)},ox,oy,s,e):Infinity;
     const body=c.cut||c.pierce?Infinity:G.World.sweep({x:c.x,y:c.y,radius:c.attackRadius},ox,oy,t,e);
     if(line&&c.cut){c.hit=true;if(this.enslave(b,t,s,e))c.success=true;}
     else if(soulHit!==Infinity||body!==Infinity){c.hit=true;const u=Math.min(soulHit,body);e.pendingAttacks.push({source:b,target:t,raw:c.raw,heat:c.heat,kind:soulHit!==Infinity?'demonPierce':c.bodyNail?'demonBodyNail':c.arcana?'arcSoulClaim':'demonClaw',priority:c.arcana?'arcana':undefined,markQualified:c.marked,soulId:soulHit!==Infinity?s.id:undefined,soulProxy:soulHit!==Infinity?s.id:undefined,castId:cast.id,clawId:c.id,adaptiveId:c.adaptiveId,point:{x:ox+(c.x-ox)*u,y:oy+(c.y-oy)*u},angle:Math.atan2(ny,nx),healRatio:0});c.resultPending=true;}

    }
    if(!c.done&&age+EPS>=c.flight+.1&&!c.resultPending)this.completed(c,e);
   }
  },
  canTarget(t,e){return t.hp>0&&!G.Ghost.phased(t)&&!G.World.absent(t,e);},
  completed(c,e){if(c.done)return;c.done=true;const cast=e.demonWorld.casts.find(v=>v.id===c.castId);if(c.arcana)G.DemonArcana?.clawDone?.(c,e);else if(cast&&!c.second)this.second(cast,e);if(!c.hit)this.event(e,this.actor(e,c.owner),'miss',c,null,{life:.22});},
  hit(h,e){const w=e.demonWorld,b=h.source,t=h.target;if(!w||b.type!=='demon'||h.avoided)return;
   if(h.kind==='contact'&&h.actual+h.blocked>0&&!G.Temporal.silenced(b,e))this.mark(b,t,e);
   if(h.kind==='demonTug'){const s=w.souls.find(s=>s.id===h.soulId);h.soulProxy=h.soulId;if(s&&h.actual>0){this.tug(b,t,s,e,!!h.strongTug);h.feedback={style:'largeHit',presented:true,push:0,stop:0,power:h.strongTug?1.5:.8};}return;}
   if(h.kind==='arcSoulServant'){if(h.actual+h.blocked>0){this.event(e,b,h.actual>0?'servantHit':'block',h.point||t,h.actual>0?'demonGrip':'shieldHit',{life:.3});h.feedback={style:'largeHit',presented:true,push:0,stop:0,power:1.3};if(h.actual>0)e.hitStop(.025);b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;}return;}
   if(h.kind==='demonPierce'){const s=w.souls.find(v=>v.id===h.soulId);if(s&&h.hpLoss>0){if(this.stasis?.(t,b,e)){Object.assign(t.demonStasis,{pinAngle:h.angle??0,pinSoul:s.id,pinX:s.x,pinY:s.y});h.demonPierced=true;}this.event(e,b,'pierce',s,'demonSoulCut',{host:t.id,soulId:s.id,life:.5,angle:h.angle});e.hitStop(.05);h.feedback={style:'largeHit',presented:true,push:0,stop:0,power:1.3};}else this.feedback(h,e);return;}
   if(['arcSoulClaim','arcSoulPin'].includes(h.kind)){const c=w.claws.find(v=>v.id===h.clawId),cast=w.casts.find(v=>v.id===h.castId);if(c&&h.actual+h.blocked>0&&!h.avoided){if(h.kind==='arcSoulClaim'){let s=this.soul(e,t,b);if(!s)s=this.create(b,t,cast,e,c);if(s){s.bound=true;s.arcana=true;s.until=e.time+6;cast.firstBound=true;}}else{if(this.stasis(t,b,e,b.def.arcPinStasis))Object.assign(t.demonStasis,{pinAngle:h.angle??0,pinX:t.x,pinY:t.y});this.event(e,b,'pierce',t,'demonNailImpact',{host:t.id,angle:h.angle,life:.5});}c.success=true;}this.feedback(h,e);return;}
   if(!['demonClaw','arcSoulClaim'].includes(h.kind))return;
   if(h.kind==='demonClaw'&&G.Temporal.silenced(b,e))return;
   const claw=w.claws.find(c=>c.id===h.clawId),cast=w.casts.find(c=>c.id===h.castId);
   if(claw&&cast&&h.hpLoss>0){let s=this.soul(e,t,b);if(!s){s=this.create(b,t,cast,e,claw);h.extracted=!!s;}else{s.until=Math.max(s.until,e.time+b.def.soulLife);if(h.markQualified||this.branded(b,t,e))s.bound=true;s.pulseAt=e.time;}if(!claw.second&&s?.bound)cast.firstBound=true;if(h.kind==='arcSoulClaim')G.DemonArcana?.claimed?.(b,t,s,e);}this.feedback(h,e);
  },
  feedback(h,e){if(h.actual+h.blocked<=0)return;h.soulProxy=h.clawId;h.feedback={style:'largeHit',presented:true,push:0,stop:0,power:1.2};this.event(e,h.source,h.actual>0?'strike':'block',h.point||h.target,h.actual>0&&h.kind!=='arcSoulPin'?'demonGrip':null,{life:.28,angle:h.angle||0});if(h.actual>0)e.hitStop(h.extracted?.035:.025);},
  afterBatch(e){if(!e.demonWorld)return;for(const c of [...e.demonWorld.claws])if(c.resultPending){c.resultPending=false;this.completed(c,e);}},
  debuff(b,e){const s=e.demonWorld?.souls.find(s=>s.target===b.id),marks=e.demonWorld?.marks.filter(m=>m.target===b.id&&m.until>=e.time)||[];return this.frozen?.(b,e)?'失魂静止 '+(b.demonStasis.until-e.time).toFixed(1)+'s':s?.bound?'魂链束缚':s?'灵魂外离':marks.length?'地狱烙印 '+Math.max(...marks.map(m=>m.until-e.time)).toFixed(1)+'s':'';},
  status(b,e){const w=e.demonWorld,d=b.demon||this.fresh(),a=G.Awakening.active(b);return [{label:'魔爪伤',value:((a?b.def.gateDamage:b.def.clawDamage)*e.heatMultiplier).toFixed(1)},{label:a?'双门CD':'魔爪CD',value:Math.max(0,Math.max(a?d.nextGate:d.nextClaw,d.resumeAt||0)-e.time).toFixed(1)+'s'},{label:'烙印',value:w?.marks.filter(m=>m.owner===b.id).length||0},{label:'魂线',value:w?.souls.filter(s=>s.owner===b.id&&s.state==='tether').length||0},{label:'扯魂伤',value:(b.def.soulTugDamage*e.heatMultiplier).toFixed(1)},{label:'契魂',value:w?.servants?.filter(s=>s.owner===b.id).length||0}];}
 };
})(typeof window!=='undefined'?window:globalThis);
