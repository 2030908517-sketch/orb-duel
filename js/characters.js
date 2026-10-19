(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Character mechanics share the existing simultaneous damage pipeline.
  G.Characters={
    fresh(){return {recoveryUntil:0,catchUntil:0,catchPower:1.4,caughtInCast:0,nextSpread:0,spreadFireAt:0,bladeRemaining:0,bladeLost:false};},
    effect(engine,source,target,style,options={}){engine.effects.push({kind:'role',style,owner:source.id,color:source.def.color,x:target.x,y:target.y,angle:Math.atan2(target.y-source.y,target.x-source.x),age:0,life:.45,...options});},
    contactExtras(){return [];},
    poison(ball,target,engine,unitRaw,fromPool=false,noReflect=false,duration=3,poolPoint=null){
      return G.Venom.apply(ball,target,engine,fromPool&&poolPoint?.venomV2?G.Venom.stage(poolPoint,engine.time):'erosion',{noReflect});
    },
    attackMultiplier(ball,engine,base,kind){
      if(ball.type!=='boomerang'||kind!=='contact'||base!==ball.def.damage)return 1;
      if(ball.character.bladeRemaining>0)return .8;
      return ball.character.catchUntil>engine.time?ball.character.catchPower:1;
    },
    dashContact(ball,target,engine){
      if(G.Awakening.dashing(target,engine))return;
      // Mark before wall projection so an immediate wall impact shares this damage batch.
      if(!G.Physics.armored(target)){target.inertia=1.1;target.stagger={owner:ball.id,until:engine.time+1.1,energy:true,heat:engine.heatMultiplier};}
      ball.character.recoveryUntil=engine.time+.6;
    },
    hit(hit,engine){
      const b=hit.source,t=hit.target;
      if(hit.dash && !hit.avoided){
        // Physics already transferred normal momentum. Shields absorb damage, not inertia.
        b.stats.strongHits++;
        engine.signal(b,'动能传递','miss',t);G.Roles.heavyImpact(b,hit,engine,'kineticHit','thunderHit',0,.06);
      }
      if(hit.actual<=0)return;
      if(hit.kind==='poisonShot')this.poison(b,t,engine,hit.poisonUnit,false,hit.noReflect);
      if(b.type==='venom'&&hit.kind==='contact'&&!G.Temporal.silenced(b,engine))this.poison(b,t,engine);
      if(b.type==='accelerator'&&hit.kind==='contact'&&!hit.dash&&hit.impact?.closing>=430&&hit.impact.forward>=250){
        const {nx,ny,forward}=hit.impact,extra=clamp(forward*.16,40,145);
        if(!G.Physics.armored(t)){t.vx+=nx*extra;t.vy+=ny*extra;t.inertia=.85;G.Physics.limit(t);t.stagger={owner:b.id,until:engine.time+.7,energy:true,heat:engine.heatMultiplier};}
        b.character.recoveryUntil=engine.time+.8;b.stats.strongHits++;
        engine.signal(b,'动能强撞','miss',t);G.Roles.heavyImpact(b,hit,engine,'kineticHit','thunderHit',0,.055);
      }
      if(hit.kind==='wallSlam'){b.stats.wallSlams++;engine.signal(b,'撞墙追击','miss',t);this.effect(engine,b,hit.point||t,'wallSlam',{angle:hit.wallAngle});G.Roles.heavyImpact(b,hit,engine,'wallCrack','wallSlam',0,.065);}
      if(b.type==='boomerang'){
        if(hit.kind==='boomerang'&&!hit.returning){t.bladeMark={owner:b.id,until:engine.time+3.2,claimedTick:-1};engine.signal(b,'飞刃留印','shotHit');}
        if(hit.kind==='boomerang'&&hit.markBonus){t.bladeMark=null;b.stats.bladeFinishers++;engine.signal(b,'回刃斩印','miss',t);G.Roles.heavyImpact(b,hit,engine,'bladeImpact','bladeHeavyHit',35,.045);}
        if(hit.kind==='contact'&&b.character.bladeRemaining===0&&b.character.catchUntil>engine.time){b.character.catchUntil=0;engine.signal(b,'接刃重击','miss',t);G.Roles.heavyImpact(b,hit,engine,'bladeImpact','bladeHeavyHit',155,.06);}
      }
    },
    spread(ball,engine){G.Venom.resonate(ball,engine);},
    update(ball,engine){if(ball.magneticMark&&ball.magneticMark.until<engine.time)ball.magneticMark=null;if(ball.stagger&&ball.stagger.until<engine.time)ball.stagger=null;if(ball.bladeMark&&ball.bladeMark.until<engine.time)ball.bladeMark=null;},
    wall(ball,engine){
      if(ball.type==='accelerator'&&!G.Overdrive?.active(ball)&&ball.wallContact&&ball.character.wallBoostTick!==engine.tick){ball.character.wallBoostTick=engine.tick;const old=ball.speed;ball.speed=Math.min(ball.def.maxSpeed,ball.speed+ball.def.wallBoost);if(!ball.motionSpeed)G.Physics.normalizeSpeed(ball);if(ball.speed>old)engine.burst(ball.x,ball.y,ball.def.color,3);}
      G.Magnet.wall(ball,engine);G.Cosmic?.wall(ball,engine);G.Charge?.wall(ball,engine);
      const s=ball.stagger,w=ball.wallContact;if(!s||s.until<engine.time||!w)return;
      // Consume even an absorbed wall hit; the same shove cannot farm a corner.
      ball.stagger=null;const source=engine.balls.find(b=>b.id===s.owner&&b.hp>0);
      if(!source||w.speed<160)return;
      const point={x:ball.x-w.nx*ball.radius,y:ball.y-w.ny*ball.radius};
      engine.pendingAttacks.push({source,target:ball,raw:s.energy?Math.min(12,.5*ball.mass*w.speed*w.speed/18000)*.75*(s.heat||1):s.raw*clamp(w.speed/340,.6,1.4),kind:'wallSlam',damageOrigin:'wall',point,wallAngle:Math.atan2(w.ny,w.nx)});
    },
    throwBlade(ball,engine,options){
      const target=G.World.targetFor(ball,engine);if(!target)return;
      const desired=G.World.aim(ball,target,ball.def.shotSpeed),angle=G.Aim.adjust(ball,engine,'blade',desired)+(options.angleOffset||0),nx=Math.cos(angle),ny=Math.sin(angle),side=(options.angleOffset||0)<0?-1:1,r=ball.def.shotRadius;
      const bounded=p=>({x:clamp(p.x,r,C.width-r),y:clamp(p.y,r,C.height-r)});
      const start=bounded({x:ball.x+nx*(ball.radius+r+2),y:ball.y+ny*(ball.radius+r+2)}),duration=G.Awakening.active(ball)?.58:.65,predicted=G.Awakening.predict(target,duration),dx=predicted.x-ball.x,dy=predicted.y-ball.y,distance=Math.hypot(dx,dy)||1,reach=Math.min(1,230/distance),endAngle=Math.atan2(dy,dx)+angle-desired-(options.angleOffset||0),end=bounded({x:ball.x+Math.cos(endAngle)*distance*reach,y:ball.y+Math.sin(endAngle)*distance*reach});
      // Lock the end at cast time; the curved outgoing path never homes on an enemy.
      const control=bounded({x:(start.x+end.x)/2-ny*side*55,y:(start.y+end.y)/2+nx*side*55});
      const shot={id:engine.nextWorldId++,mode:'boomerang',owner:ball.id,adaptiveId:ball.character.bladeAdaptiveId,castId:options.castId,x:start.x,y:start.y,vx:nx*ball.def.shotSpeed,vy:ny*ball.def.shotSpeed,speed:ball.def.shotSpeed,radius:r,bounces:0,maxBounces:0,expires:engine.time+2.8,color:ball.def.color,raw:G.Combat.rollAttack(ball,engine,options.damage??ball.def.shotDamage,'boomerang'),returning:false,hitIds:[],turnAt:engine.time+duration,curve:{start,control,end,started:engine.time,duration},history:[]};
      engine.projectiles.push(shot);ball.stats.shotsFired++;ball.character.bladeRemaining++;
      engine.log(engine.label(ball)+'投出弧线飞刃');G.Spectacle?.emit(engine,ball,'moon',{angle,life:.3});
      return shot;
    },
    returnBlade(shot,owner,engine){
      const end=G.Awakening.predict(owner,.5),start={x:shot.x,y:shot.y},dx=end.x-start.x,dy=end.y-start.y,d=Math.hypot(dx,dy)||1;
      const side=shot.id%2?-1:1,r=shot.radius;
      shot.curve={start,control:{x:clamp((start.x+end.x)/2-dy/d*side*65,r,C.width-r),y:clamp((start.y+end.y)/2+dx/d*side*65,r,C.height-r)},end,started:engine.time,duration:.72};shot.returning=true;engine.sound('return',shot.x);
    },
    moveBlade(shot,owner,engine,dt){
      if(G.Magnet.moveBlade(shot,owner,engine,dt))return;
      if(!shot.returning&&engine.time+1e-9>=shot.turnAt)this.returnBlade(shot,owner,engine);
      const curve=shot.curve;
      if(shot.returning){const weight=1-Math.exp(-dt*7);curve.end.x+=(owner.x-curve.end.x)*weight;curve.end.y+=(owner.y-curve.end.y)*weight;}
      const u=clamp((engine.time-curve.started)/curve.duration,0,1),oldX=shot.x,oldY=shot.y;
      if(u<1){const v=1-u;shot.x=v*v*curve.start.x+2*v*u*curve.control.x+u*u*curve.end.x;shot.y=v*v*curve.start.y+2*v*u*curve.control.y+u*u*curve.end.y;}
      else{const desired=Math.atan2(owner.y-shot.y,owner.x-shot.x),angle=Math.atan2(shot.vy,shot.vx),delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle)),next=angle+clamp(delta,-8*dt,8*dt);shot.x+=Math.cos(next)*shot.speed*dt;shot.y+=Math.sin(next)*shot.speed*dt;}
      const bounds=shot.combatBounds;shot.x=clamp(shot.x,(bounds?.left||0)+shot.radius,(bounds?.right??C.width)-shot.radius);shot.y=clamp(shot.y,(bounds?.top||0)+shot.radius,(bounds?.bottom??C.height)-shot.radius);
      if(dt>0){shot.vx=(shot.x-oldX)/dt;shot.vy=(shot.y-oldY)/dt;}
      if(engine.tick%4===0){shot.history.unshift({x:shot.x,y:shot.y});shot.history.length=Math.min(shot.history.length,12);}
    },
    bladePacket(shot,owner,target,engine){
      const mark=target.bladeMark,bonus=shot.returning&&mark?.owner===owner.id&&mark.until>=engine.time&&mark.claimedTick!==engine.tick;
      if(bonus)mark.claimedTick=engine.tick;
      return {source:owner,target,raw:shot.raw*(bonus?1.5:1),kind:'boomerang',adaptiveId:shot.adaptiveId,returning:shot.returning,markBonus:!!bonus};
    },
    bladeRemoved(shot,owner,engine,caught){
      if(!owner)return;owner.character.bladeRemaining=Math.max(0,owner.character.bladeRemaining-1);
      if(!caught)owner.character.bladeLost=true;
      if(caught){const round=G.Adaptive?.round(owner,shot.adaptiveId);if(round)round.caught=true;owner.character.caughtInCast++;owner.stats.bladesCaught++;if(shot.castId&&owner.lastRecallCast!==shot.castId){owner.lastRecallCast=shot.castId;G.Recovery.refund(owner,engine,'nextShot',.35,'飞刃回收');}}
      if(owner.character.bladeRemaining===0&&owner.character.caughtInCast>0){owner.character.catchPower=owner.character.bladeLost?1.2:1.4;owner.character.catchUntil=engine.time+8;engine.signal(owner,'接刃蓄势','bladeCatch');this.effect(engine,owner,owner,'bladeCatch');}
    }
  };
})(typeof window!=='undefined'?window:globalThis);
(function(root){
 'use strict';const G=root.OrbDuel,EPS=1e-8,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // All V2 tuning lives here. Layer clocks use simulation time, never render time.
 const V=G.Venom={
  config:{capacity:4,typeCap:3,applyInterval:1.1,erosionLife:6,concentratedLife:7.5,paralysisLife:5.5,pulsePeriod:.5,mistPulsePeriod:.5,mistDamage:.18,erosionDamage:.55,awakeErosionDamage:.65,replacementHits:2,replacementCooldown:2,slowPerLayer:.04,contactReductionPerLayer:.08,aimReductionPerLayer:.14,mistAimDegrees:5,poolPeriod:3.2,spitPeriod:9,spitFirstDelay:1.6,spitDamage:2.4,poolCap:4,poolGap:8,armDelay:.5,normalRadius:46,concentratedRadius:30,mistRadius:62,shotPoolRadius:36,normalTime:3.5,concentratedTime:3,mistTime:4.5,concentratedMinorEvery:2,mistExtend:1.5,mistMaxExtension:3},
  colors:{erosion:'#b5ed71',paralysis:'#b5ed71'},
  layers(b,time=Infinity){return (b.poison?.layers||[]).filter(l=>time===Infinity||l.until>time+EPS);},
  count(b,type,time=Infinity){return this.layers(b,time).filter(l=>l.type===type).length;},
  sync(b,e){const p=b.poison;if(!p?.layers)return;p.layers=p.layers.filter(l=>l.until>e.time+EPS);if(!p.layers.length){b.poison=null;return;}p.stacks=p.layers.length;p.until=Math.max(...p.layers.map(l=>l.until));p.raw=p.layers.filter(l=>l.type==='erosion').reduce((n,l)=>n+l.raw,0);p.nextPulse=b.venomTiming.nextPulse;if(p.layers.length<this.config.capacity)p.progress={erosion:0,paralysis:0};},
  timing(b,e){if(!b.venomTiming)b.venomTiming={nextPulse:e.time+this.config.pulsePeriod,ready:{},concentrated:{},fogNext:{},replaceAt:0};return b.venomTiming;},
  eligible(b,t,e){return G.World.enemy(b,t,e)&&G.World.targetable(t,e)&&!G.Ghost.phased(t)&&!G.Awakening.dashing(t,e);},
  add(b,t,e,type,options={}){
   const c=this.config,clock=this.timing(t,e);let p=t.poison;if(!p)p=t.poison={layers:[],progress:{erosion:0,paralysis:0},replaceAt:clock.replaceAt||0};
   const own=p.layers.filter(l=>l.type===type),other=p.layers.filter(l=>l.type!==type),shortest=xs=>xs.reduce((a,l)=>!a||l.until<a.until?l:a,null);
   const life=type==='paralysis'?c.paralysisLife:options.concentrated?c.concentratedLife:c.erosionLife;
   const fresh=()=>({type,owner:b.id,created:e.time,until:e.time+life,raw:(G.Awakening.active(b)?c.awakeErosionDamage:c.erosionDamage)*e.heatMultiplier,noReflect:!!options.noReflect});
   if(own.length>=c.typeCap){const l=shortest(own);Object.assign(l,fresh());t.venomChange={at:e.time,type,kind:'refresh'};return 'refresh';}
   if(p.layers.length<c.capacity){p.layers.push(fresh());p.progress={erosion:0,paralysis:0};t.venomChange={at:e.time,type,kind:'add'};return 'add';}
   if(!other.length)return false;
   p.progress[type]=Math.min(c.replacementHits,p.progress[type]+1);
   if(p.progress[type]<c.replacementHits||e.time+EPS<p.replaceAt)return 'progress';
   const old=shortest(other);p.layers[p.layers.indexOf(old)]=fresh();p.progress={erosion:0,paralysis:0};p.replaceAt=clock.replaceAt=e.time+c.replacementCooldown;t.venomChange={at:e.time,type,kind:'replace'};return 'replace';
  },
  apply(b,t,e,source='erosion',options={}){
   if(!this.eligible(b,t,e))return false;const clock=this.timing(t,e);if(e.time+EPS<(clock.ready[b.id]??0))return false;
   // If damage clock survived a cleanse/empty interval, skip idle pulses without restarting its phase.
   if(!t.poison&&clock.nextPulse<=e.time+EPS)clock.nextPulse+=Math.floor((e.time-clock.nextPulse+EPS)/this.config.pulsePeriod+1)*this.config.pulsePeriod;
   this.sync(t,e);clock.ready[b.id]=e.time+this.config.applyInterval;
   const type=source==='mist'||source==='paralysis'?'paralysis':'erosion',result=this.add(b,t,e,type,{...options,concentrated:source==='concentrated'});
   if(source==='concentrated'){const n=clock.concentrated[b.id]=(clock.concentrated[b.id]||0)+1;if(n%this.config.concentratedMinorEvery===0)this.add(b,t,e,'paralysis',options);}
   this.sync(t,e);return result;
  },
  poolSpot(b,e,point,scale,others){
   const c=this.config,C=G.Constants,origin={x:point?.x??b.x,y:point?.y??b.y},reserve=Math.max(c.normalRadius,c.mistRadius)*scale,gap=c.poolGap;
   const legal=q=>q.x>=2&&q.y>=2&&q.x<=C.width-2&&q.y<=C.height-2&&this.clear(origin,q,e)&&!(e.obstacles||[]).some(o=>Math.hypot(q.x-o.x,q.y-o.y)<o.radius+2)&&others.every(p=>Math.hypot(q.x-p.x,q.y-p.y)>=reserve+Math.max(c.normalRadius,c.mistRadius)*p.scale+gap-EPS);
   if(legal(origin))return origin;
   let best=null,distance=Infinity;const consider=q=>{const d=(q.x-origin.x)**2+(q.y-origin.y)**2;if(d<distance&&legal(q)){best=q;distance=d;}};
   // Tangent candidates preserve a short gap; bounded grid supplies wall/corner alternatives.
   for(const p of others){const r=reserve+Math.max(c.normalRadius,c.mistRadius)*p.scale+gap+.001,base=Math.atan2(origin.y-p.y,origin.x-p.x);for(let i=0;i<48;i++){const a=base+i*TAU/48;consider({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r});}}
   for(let y=2;y<=C.height-2;y+=12)for(let x=2;x<=C.width-2;x+=12)consider({x,y});
   return best;
  },
  pool(b,e,point,options={}){
   const c=this.config,owned=e.pools.filter(p=>p.owner===b.id&&p.expires>e.time),oldest=owned.length>=c.poolCap?owned.reduce((a,p)=>a.created<=p.created?a:p):null;
   const scale=(options.radius||c.normalRadius)/c.normalRadius,spot=this.poolSpot(b,e,point,scale,owned.filter(p=>p!==oldest));if(!spot)return false;
   if(oldest)e.pools=e.pools.filter(p=>p!==oldest);
   const armed=e.time+c.armDelay;
   const p={id:e.nextWorldId++,owner:b.id,venomV2:true,created:e.time,x:spot.x,y:spot.y,radius:c.normalRadius*scale,scale,color:b.def.color,adaptiveId:options.adaptiveId,armedAt:armed,concentrateAt:armed+c.normalTime,mistAt:armed+c.normalTime+c.concentratedTime,expires:armed+c.normalTime+c.concentratedTime+c.mistTime,noReflect:!!options.noReflect,extension:0,touched:false,refundField:options.refund===false?null:'nextPool'};
   e.pools.push(p);b.stats.poolsPlaced++;e.sound('poison',p.x);return p;
  },
  stage(p,t){return t+EPS>=p.mistAt?'mist':t+EPS>=p.concentrateAt?'concentrated':'normal';},
  radius(p,t){const c=this.config,s=this.stage(p,t);return (s==='mist'?c.mistRadius:s==='concentrated'?c.concentratedRadius:c.normalRadius)*p.scale;},
  clear(a,b,e){if(G.ArenaWalls&&!G.ArenaWalls.clear(a,b,e))return false;if(e.mode==='2v2'){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d&&G.Team.rayLimit(a.x,a.y,dx/d,dy/d,0,e.obstacles)<d-EPS)return false;}return true;},
  contains(p,b,e){return e.time+EPS>=p.armedAt&&e.time<p.expires-EPS&&Math.hypot(b.x-p.x,b.y-p.y)<=this.radius(p,e.time)+b.radius*.55&&this.clear(p,b,e);},
  inMist(b,e){return e.pools.some(p=>p.venomV2&&this.stage(p,e.time)==='mist'&&G.World.enemy(p.owner,b,e)&&e.balls.some(o=>o.id===p.owner&&o.hp>0)&&this.contains(p,b,e));},
  speedFactor(b){return G.Physics.armored(b)?1:Math.max(.6,1-this.count(b,'paralysis')*this.config.slowPerLayer);},
  aimControl(b,e){if(G.Physics.armored(b)||G.World.absent(b,e))return {rate:1,offset:0};const n=this.count(b,'paralysis',e.time),mist=this.inMist(b,e);return {rate:1-n*this.config.aimReductionPerLayer,offset:mist?this.config.mistAimDegrees*Math.PI/180*(Math.sin(e.time*6.3+b.id*1.7)*.65+Math.sin(e.time*11.1+b.id)*.35):0};},
  steer(b,e,angle,desired,dt){const control=this.aimControl(b,e);return control.rate===1&&control.offset===0?desired:G.Aim.turn(angle,desired+control.offset,8*control.rate*dt);},
  contactPacket(h,e){
   if(h.kind!=='contact'||h.dash||h.heavyContact||h.heavyShot||h.priority==='arcana'||G.Arcana?.busy(h.source))return h;
   const b=h.source,t=e.time,special=b.type==='normal'&&b.charges>=3||b.type==='shield'&&(h.pressureSpent||b.role.pressure)>0||b.type==='boomerang'&&b.character.catchUntil>t||b.type==='accelerator'&&h.impact?.closing>=430&&h.impact?.forward>=250||b.ghost?.lungeUntil>t;
   if(special)return h;const n=this.count(b,'paralysis',t);return n?{...h,raw:h.raw*(1-n*this.config.contactReductionPerLayer)}:h;
  },
  settle(b,e){
   const p=b.poison,clock=b.venomTiming;if(!p?.layers||!clock)return;
   while(clock.nextPulse<=e.time+EPS){const at=clock.nextPulse;clock.nextPulse+=this.config.pulsePeriod;const groups=new Map();for(const l of p.layers){if(l.type!=='erosion'||l.created>at+EPS||l.until<=at+EPS)continue;const key=l.owner+':'+l.noReflect;let g=groups.get(key);if(!g)groups.set(key,g={owner:l.owner,noReflect:l.noReflect,raw:0});g.raw+=l.raw;}for(const g of groups.values()){const owner=e.balls.find(o=>o.id===g.owner&&o.hp>0);if(owner&&b.hp>0)e.pendingAttacks.push({source:owner,target:b,raw:g.raw*(G.LivingVenom?.erosionMultiplier(owner,b,e,at)||1),kind:'poison',noReflect:g.noReflect});}}
   const before=p.layers.length;this.sync(b,e);if(before!==(b.poison?.layers.length||0))b.venomChange={at:e.time,kind:'expire'};
  },
  world(e){
   for(const b of e.balls)this.settle(b,e);
   e.pools=e.pools.filter(p=>{const owner=e.balls.find(o=>o.id===p.owner&&o.hp>0);if(!owner)return false;if(e.time+EPS>=p.expires){if(!p.touched&&p.refundField!==null)G.Recovery.refund(owner,e,'nextPool',.35,'毒液未接触');return false;}p.radius=this.radius(p,e.time);return true;});
   G.LivingVenom?.world(e);

  },
  advance(p,e){const c=this.config,s=this.stage(p,e.time);p.transition={at:e.time,from:s,radius:this.radius(p,e.time)};if(s==='normal'){p.concentrateAt=e.time;p.mistAt=e.time+c.concentratedTime;p.expires=p.mistAt+c.mistTime;}else if(s==='concentrated'){p.mistAt=e.time;p.expires=e.time+c.mistTime;}else{const add=Math.min(c.mistExtend,c.mistMaxExtension-p.extension);p.extension+=add;p.expires+=add;}p.radius=this.radius(p,e.time);},
  resonate(){},
  label(b,e){return '侵蚀 '+this.count(b,'erosion',e.time)+' · 麻痹 '+this.count(b,'paralysis',e.time)+' /4';},
  status(b,e){const pools=e.pools.filter(p=>p.owner===b.id),n=s=>pools.filter(p=>this.stage(p,e.time)===s).length;return [{label:'双毒上限',value:'4槽 / 单毒3层'},{label:'侵蚀/跳',value:(G.Awakening.active(b)?this.config.awakeErosionDamage:this.config.erosionDamage).toFixed(2)+'/层'},{label:'施毒间隔',value:this.config.applyInterval+'s'},{label:'毒液三态',value:n('normal')+'/'+n('concentrated')+'/'+n('mist')},{label:'同巢共鸣',value:G.Awakening.active(b)?'体内外同毒触发':'未觉醒'},{label:'喷吐CD',value:Math.max(0,(b.role.nextSpit||0)-e.time).toFixed(1)+'s'}];},
  inspect(b,e){return {layers:this.layers(b,e.time).map(l=>({type:l.type,owner:l.owner,remaining:+Math.max(0,l.until-e.time).toFixed(2)})),progress:{...b.poison?.progress},replacementCooldown:Math.max(0,(b.venomTiming?.replaceAt||0)-e.time),applyCooldown:{...b.venomTiming?.ready},nextPulse:b.venomTiming?.nextPulse};},
  drawPool(r,p,e){
   if(!p.venomV2)return;const c=r.ctx,t=e.time,s=this.stage(p,t),fog=s==='mist',con=s==='concentrated',color=fog?'#a77dde':'#93ca59',radius=this.radius(p,t),last=s==='mist'?p.mistAt:s==='concentrated'?p.concentrateAt:p.armedAt;
   const k=clamp((t-(p.transition?.at>last?p.transition.at:last))/.55,0,1),fade=clamp((p.expires-t)/.7,0,1);c.save();
   // Clip to the visible side of physical walls; pools and fog cannot reach through them.
   c.beginPath();for(let i=0;i<=64;i++){const a=i*TAU/64,nx=Math.cos(a),ny=Math.sin(a),wall=G.ArenaWalls?.hit(p.x,p.y,nx,ny,0,e).distance??Infinity,team=e.mode==='2v2'?G.Team.rayLimit(p.x,p.y,nx,ny,0,e.obstacles):Infinity,d=Math.min(radius,wall,team);if(i)c.lineTo(p.x+nx*d,p.y+ny*d);else c.moveTo(p.x+nx*d,p.y+ny*d);}c.closePath();c.clip();
   c.globalAlpha=(t<p.armedAt?.35:1)*fade;c.translate(p.x,p.y);
   c.beginPath();c.arc(0,0,radius,0,TAU);c.fillStyle=fog?'#6b468b16':con?'#29452b88':'#608a352b';c.fill();c.strokeStyle=color+'90';c.lineWidth=1;c.setLineDash(fog?[2,5]:[7,4]);c.stroke();c.setLineDash([]);
   if(fog){const lobes=[[-.35,.05,.36],[.05,-.25,.43],[.34,.02,.36],[.12,.24,.43],[-.22,.26,.3],[0,.05,.45]];for(let i=0;i<lobes.length;i++){const [xx,yy,rr]=lobes[i],x=radius*(xx+.035*Math.sin(t*1.2+i*2.7)),y=radius*(yy+.04*Math.sin(t*.9+i))-4*k;c.beginPath();c.ellipse(x,y,radius*rr,radius*rr*.7,0,0,TAU);c.fillStyle=i%2?'#bd92ea29':'#9464bf38';c.fill();}}

   else{const rr=radius*(con?.66:.78)*(con?1+.10*(1-k):1);c.beginPath();for(let i=0;i<=48;i++){const a=i*TAU/48,d=rr*(1+.07*Math.sin(a*5+t*1.7)+.035*Math.cos(a*9-t));if(i)c.lineTo(Math.cos(a)*d,Math.sin(a)*d);else c.moveTo(d,0);}c.closePath();c.fillStyle=con?'#416f32bb':'#72a84345';c.fill();}
   c.restore();
  },

 };
})(typeof window!=='undefined'?window:globalThis);
