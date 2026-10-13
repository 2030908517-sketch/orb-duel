(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Character resources and attacks; all damage uses the shared simultaneous batch.
  G.Roles={
    fresh(){return {blood:0,bloodMark:null,chainWarning:0,chainDamage:0,pressure:0,shieldRelease:0,shieldAngle:0,ammo:3,calibration:0,calibrationUntil:0,reloadUntil:0,overload:false,round:0,capacitor:0,coolingUntil:0,disruptedUntil:0,mirrors:0,counterAngle:0,netTriggers:0,waveHits:0,heavyRounds:0};},
    update(ball,engine){const r=ball.role;if(r.bloodMark&&r.bloodMark.until<engine.time)r.bloodMark=null;},
    effect(ball,engine,style,point=ball,angle=Math.atan2(ball.vy,ball.vx),life=.4){engine.effects.push({kind:'roster',style,owner:ball.id,x:point.x,y:point.y,angle,color:ball.def.color,age:0,life});},
    wave(ball,engine,raw,angle,kind,reach=90,width=25){
      engine.waves.push({id:engine.nextWorldId++,owner:ball.id,x:ball.x,y:ball.y,originX:ball.x,originY:ball.y,angle,speed:310,travel:0,reach,width,raw,kind,color:ball.def.color,hitIds:[],expires:engine.time+reach/310});
      this.effect(ball,engine,kind,ball,angle,.42);engine.sound(kind==='fistWave'?'fistRelease':'pressureRelease',ball.x);
    },
    updateWaves(engine,dt){
      const live=[];
      for(const w of engine.waves){const owner=engine.balls.find(b=>b.id===w.owner&&b.hp>0);if(!owner||engine.time>w.expires+1e-9)continue;
        const old={x:w.x,y:w.y},nx=Math.cos(w.angle),ny=Math.sin(w.angle);w.travel+=w.speed*dt;w.x=w.originX+nx*w.travel;w.y=w.originY+ny*w.travel;
        for(const target of engine.balls){if(target.id===w.owner||target.hp<=0||w.hitIds.includes(target.id))continue;
          const dx=target.x-w.originX,dy=target.y-w.originY,forward=dx*nx+dy*ny,lateral=Math.abs(-dx*ny+dy*nx);
          if(forward>=-target.radius&&forward<=w.travel+target.radius&&lateral<=w.width+target.radius&&G.World.intersects({x:w.x,y:w.y,radius:w.width},old.x,old.y,target)){
            w.hitIds.push(target.id);engine.pendingAttacks.push({source:owner,target,raw:w.raw,kind:w.kind,angle:w.angle});
          }
        }live.push(w);
      }engine.waves=live;
    },
    prepareContacts(hits,engine){for(const h of hits)if(h.source.type==='shield'&&!G.Awakening.dashing(h.target,engine)){h.pressureSpent=h.source.role.pressure;h.source.role.pressure=0;}},
    multiplier(ball){return ball.type==='shield'?1+Math.min(.55,ball.role.pressure/14):1;},
    normalHit(ball,hit,engine){
      if(hit.kind!=='contact'||hit.actual+hit.blocked<=0)return;
      if(ball.charges>=3){hit.heavyContact=true;ball.charges=0;ball.stats.heavyHits++;engine.signal(ball,'破阵重拳','fistHit',hit.target);this.effect(ball,engine,'fistHit',hit.target,Math.atan2(hit.impact?.ny??0,hit.impact?.nx??1));
        if(G.Awakening.active(ball))this.wave(ball,engine,3.5*engine.heatMultiplier,Math.atan2(hit.impact?.ny??0,hit.impact?.nx??1),'fistWave',100,19);
      }else{ball.charges=Math.min(3,ball.charges+(hit.actual>0?1:.5));if(ball.charges===3)engine.signal(ball,'重拳就绪','ready');}
    },
    absorb(ball,blocked,engine){if(ball.type==='shield'&&blocked>0)ball.role.pressure=Math.min(8,ball.role.pressure+blocked*.45/engine.heatMultiplier);},
    shieldEnd(ball,engine){const r=ball.role;if(G.Awakening.active(ball)&&r.pressure>0){r.shieldRelease=r.pressure;r.shieldAngle=Math.atan2(ball.vy,ball.vx);}r.pressure=0;},
    shieldUpdate(ball,dt,engine){
      const r=ball.role,spec=G.Awakening.shieldOptions(ball);
      if(ball.shield>0&&engine.time>=ball.shieldUntil){this.shieldEnd(ball,engine);ball.shield=0;}
      if(r.shieldRelease>0&&engine.state==='running'){this.wave(ball,engine,r.shieldRelease*.9*engine.heatMultiplier,r.shieldAngle,'pressureWave',115,30);r.shieldRelease=0;ball.awakening.pendingBurst=false;}
      if(engine.time+1e-9>=ball.nextShield){r.pressure=0;ball.shield=spec.amount;ball.shieldUntil=engine.time+spec.duration;ball.nextShield=engine.time+spec.period;engine.ring(ball.x,ball.y,ball.def.color,48);engine.sound('shield',ball.x);engine.log(engine.label(ball)+'屏障展开 · '+spec.amount+' 盾');}
    },
    hit(hit,engine){
      const b=hit.source,t=hit.target,r=b.role;
      if(b.type==='ranger')this.rangerHit(b,hit,engine);
      if(t.type==='laser')this.laserReceive(t,hit,engine);
      if(hit.kind==='laser'&&hit.push&&hit.actual+hit.blocked>0&&!hit.avoided){t.vx+=Math.cos(hit.angle)*hit.push;t.vy+=Math.sin(hit.angle)*hit.push;t.inertia=.35;G.Physics.limit(t);}
      if(b.type==='vampire'&&hit.kind==='contact'&&hit.actual>0){t.role.bloodMark={owner:b.id,until:engine.time+5};r.blood=Math.min(8,r.blood+hit.actual*b.def.lifesteal);this.effect(b,engine,'bloodMark',t,0,.35);}
      if(b.type==='shield'&&hit.kind==='contact'&&hit.actual+hit.blocked>0&&hit.pressureSpent>0){engine.signal(b,'承压盾击','shieldBash',t);if(!hit.avoided){const nx=hit.impact?.nx??1,ny=hit.impact?.ny??0;t.vx+=nx*65;t.vy+=ny*65;t.inertia=.45;G.Physics.limit(t);}this.effect(b,engine,'shieldBash',t,Math.atan2(hit.impact?.ny??0,hit.impact?.nx??1));}
      if(['fistWave','pressureWave'].includes(hit.kind)&&hit.actual>0){r.waveHits++;engine.sound(hit.kind==='fistWave'?'fistHit':'shieldBash',t.x);engine.impact(t.x,t.y,b.def.color,1.6);this.effect(b,engine,hit.kind,t,hit.angle);}
      if(hit.kind==='bloodFinish'&&hit.actual>0){engine.signal(b,'血契收束','bloodFinish',t);this.effect(b,engine,'bloodFinish',t,0,.48);engine.impact(t.x,t.y,b.def.color,1.5);}
    },
    vampireUpdate(ball,dt,engine){
      const a=ball.awakening,r=ball.role,t=engine.time,target=G.World.targetFor(ball,engine);if(!target)return;
      const inRange=Math.hypot(target.x-ball.x,target.y-ball.y)<=220;
      if(r.chainWarning){if(t+1e-9>=r.chainWarning){r.chainWarning=0;a.chainActive=true;a.chainStartedAt=t;a.chainConnected=0;a.chainRefund=0;a.chainUntil=t+2.1;a.nextPulse=t+.3;r.chainDamage=0;r.blood=Math.max(0,r.blood-1);a.casts++;engine.sound('chain',ball.x);this.effect(ball,engine,'bloodConnect');}}
      else if(!a.chainActive&&t+1e-9>=a.nextCast&&inRange&&r.blood>=1){r.chainWarning=t+.25;a.nextCast=t+8.5;engine.sound('bloodCharge',ball.x);engine.signal(ball,'血契锁定','miss');}
      if(!a.chainActive)return;
      if(!inRange){this.finishChain(ball,engine);return;}
      a.chainConnected=Math.min(2.1,Math.max(0,t-a.chainStartedAt));
      if(t<=a.chainUntil+1e-9&&t+1e-9>=a.nextPulse){if(r.blood<.25){this.finishChain(ball,engine);return;}r.blood-=.25;a.nextPulse+=.3;r.chainDamage++;engine.pendingAttacks.push({source:ball,target,raw:1.05*engine.heatMultiplier,kind:'chain',healRatio:.85});}
      if(t+1e-9>=a.chainUntil){const mark=target.role.bloodMark;if(r.chainDamage===7&&mark?.owner===ball.id&&mark.until>=t){target.role.bloodMark=null;engine.pendingAttacks.push({source:ball,target,raw:2.6*engine.heatMultiplier,kind:'bloodFinish',healRatio:1});}this.finishChain(ball,engine);}
    },
    finishChain(ball,engine){const a=ball.awakening;if(!a.chainActive)return;a.chainActive=false;a.chainUntil=0;a.nextPulse=Infinity;a.chainRefund=G.Recovery.refund(ball,engine,'nextCast',1.2*Math.max(0,1-a.chainConnected/2.1),'血契中断',a);},
    activate(ball){if(ball.type==='shield'){ball.role.pressure=0;ball.role.shieldRelease=0;}if(ball.type==='vampire')ball.role.blood=Math.max(3,ball.role.blood);if(ball.type==='reflector'&&ball.stance.phase==='active')ball.role.mirrors=2;},
    rangerDamage(ball){return G.Awakening.active(ball)?ball.role.overload&&ball.role.round===2?8.4:4.6:ball.def.shotDamage;},
    rangerUpdate(ball,dt,engine){
      if(engine.state!=='running')return;const r=ball.role,t=engine.time,awake=G.Awakening.active(ball);
      if(t>r.calibrationUntil)r.calibration=0;
      if(r.reloadUntil){if(t+1e-9<r.reloadUntil)return;r.reloadUntil=0;r.ammo=3;r.round=0;r.overload=awake&&r.calibration>=2;if(r.overload){r.calibration=0;engine.signal(ball,'过载弹匣','ready');}ball.nextShot=t;}
      if(t+1e-9<ball.nextShot)return;const target=G.World.targetFor(ball,engine);if(!target)return;
      const direct=Math.atan2(target.y-ball.y,target.x-ball.x),lead=G.World.aim(ball,target,ball.def.shotSpeed),delta=Math.atan2(Math.sin(lead-direct),Math.cos(lead-direct)),angle=direct+delta*(.65+r.calibration*.175),heavy=r.overload&&r.round===2;
      G.World.fire(ball,engine,{angle,damage:this.rangerDamage(ball),heavy,radius:heavy?5.5:ball.def.shotRadius});engine.sound(heavy?'heavyShot':'shot',ball.x);this.effect(ball,engine,heavy?'heavyMuzzle':'muzzle',ball,angle,.14);ball.hitVisual={age:0,life:.12,angle,power:heavy?1.3:.5};if(heavy)r.heavyRounds++;
      r.ammo--;r.round++;if(!r.ammo){const reload=r.overload?5.1:awake?3.8:4.1;r.reloadUntil=t+reload;ball.nextShot=r.reloadUntil;engine.sound('reload',ball.x);}else ball.nextShot=t+(awake?.32:.42);
    },
    rangerHit(ball,hit,engine){if(hit.kind==='shot'&&hit.actual+hit.blocked>0){ball.role.calibration=Math.min(2,ball.role.calibration+1);ball.role.calibrationUntil=engine.time+6;}},
    laserUpdate(ball,dt,engine){
      if(engine.state!=='running')return;const r=ball.role,t=engine.time,awake=G.Awakening.active(ball),target=G.World.targetFor(ball,engine);if(!target)return;
      if(ball.laser){const l=ball.laser;if(t<l.trackUntil){const dest=G.Awakening.predict(target,Math.max(0,l.fireAt-t)),origin=G.Awakening.predict(ball,Math.max(0,l.fireAt-t));l.origin=origin;l.angle=Math.atan2(dest.y-origin.y,dest.x-origin.x);}else if(!l.locked){l.locked=true;engine.sound('laserLock',ball.x);}if(t+1e-9>=l.fireAt){this.laserFire(ball,engine);ball.laser=null;}return;}
      if(t+1e-9<r.coolingUntil)return;r.capacitor=Math.min(1,r.capacitor+dt/(awake?3.6:4.2));ball.nextLaser=t+(1-r.capacitor)*(awake?3.6:4.2);
      if(r.capacitor+1e-9>=1){const delay=.18+(awake?.55:.65),dest=G.Awakening.predict(target,delay),origin=G.Awakening.predict(ball,delay);ball.laser={origin,angle:Math.atan2(dest.y-origin.y,dest.x-origin.x),trackUntil:t+.18,fireAt:t+delay,locked:false,awake};engine.sound('charge',ball.x);engine.signal(ball,'电容满载 · 瞄准','miss');}
    },
    laserFire(ball,engine){
      const r=ball.role,l=ball.laser,awake=l.awake??G.Awakening.active(ball),ray=G.World.ray(ball,l.angle),raw=G.Combat.rollAttack(ball,engine,awake?22.2:ball.def.laserDamage,'laser');ball.stats.lasersFired++;r.capacitor=0;r.coolingUntil=engine.time+(awake?1.45:1.1);ball.nextLaser=r.coolingUntil+(awake?3.6:4.2);
      if(awake){engine.beams.push({id:engine.nextWorldId++,owner:ball.id,angle:l.angle,width:7,raw,started:engine.time,duration:.18,expires:engine.time+.18,nextPulse:engine.time,pulses:0,hitCounts:{},touched:false});engine.sound('cannon',ball.x);this.effect(ball,engine,'cannon',ball,l.angle,.35);engine.impact(ball.x,ball.y,ball.def.color,1.7);}
      else{let touched=false;for(const target of engine.balls)if(target.id!==ball.id&&target.hp>0&&G.World.distanceToRay(ray,target)<=target.radius+ball.def.laserWidth){engine.pendingAttacks.push({source:ball,target,raw,kind:'laser',angle:l.angle});touched=true;}const cleared=engine.traps.filter(trap=>trap.owner!==ball.id&&trap.armedAt<=engine.time&&trap.expires>=engine.time&&G.World.distanceToRay(ray,trap)<=trap.radius+ball.def.laserWidth);for(const trap of cleared)G.World.clearTrap(trap,ball,engine);this.laserOutcome(ball,engine,touched||cleared.length>0);engine.effects.push({kind:'beam',...ray,color:ball.def.color,width:ball.def.laserWidth,age:0,life:.22});engine.sound('laser',ball.x);}
    },
    laserOutcome(ball,engine,touched){if(touched)ball.laserMisses=0;else if(++ball.laserMisses>=2){ball.laserMisses=0;G.Recovery.refund(ball,engine,'coolingUntil',.6,'重炮连续落空',ball.role);ball.nextLaser=ball.role.coolingUntil+(G.Awakening.active(ball)?3.6:4.2);}},
    updateBeams(engine){
      const live=[];for(const beam of engine.beams){const ball=engine.balls.find(b=>b.id===beam.owner&&b.hp>0);if(!ball)continue;
        if(beam.pulses<3&&engine.time+1e-9>=beam.nextPulse){beam.pulses++;beam.nextPulse+=.06;const ray=G.World.ray(ball,beam.angle);for(const target of engine.balls)if(target.id!==ball.id&&target.hp>0&&(beam.hitCounts[target.id]||0)<3&&G.World.distanceToRay(ray,target)<=target.radius+beam.width){beam.hitCounts[target.id]=(beam.hitCounts[target.id]||0)+1;beam.touched=true;engine.pendingAttacks.push({source:ball,target,raw:beam.raw*(beam.pulses===1?.5:.25),kind:'laser',angle:beam.angle,push:18,beamId:beam.id});}
          for(const trap of [...engine.traps])if(trap.owner!==ball.id&&trap.armedAt<=engine.time&&trap.expires>=engine.time&&G.World.distanceToRay(ray,trap)<=trap.radius+beam.width){G.World.clearTrap(trap,ball,engine);beam.touched=true;}
        }
        if(engine.time>beam.expires+1e-9){this.laserOutcome(ball,engine,beam.touched);continue;}live.push(beam);
      }engine.beams=live;
    },
    laserReceive(ball,hit,engine){const r=ball.role;if(hit.kind==='contact'&&hit.actual+hit.blocked>0&&!ball.laser&&engine.time>=r.coolingUntil&&engine.time>=r.disruptedUntil){r.capacitor=Math.max(0,r.capacitor-.14);r.disruptedUntil=engine.time+1.5;engine.signal(ball,'电容震荡 −14%','miss');}},
    reflectorUpdate(ball,dt,engine){
      if(engine.state!=='running')return;const s=ball.stance,r=ball.role,t=engine.time,awake=G.Awakening.active(ball);
      if(s.phase==='active'&&t+1e-9>=s.until){s.phase='rest';r.mirrors=0;if(awake&&s.stored>0&&ball.hp>0){G.World.counter(ball,engine,s.stored,r.counterAngle);this.effect(ball,engine,'mirrorRelease',ball,r.counterAngle);}s.stored=0;}
      if(s.phase==='warning'&&t+1e-9>=s.until){s.phase='active';s.until=t+(awake?3.2:ball.def.stanceDuration);r.mirrors=awake?2:1;engine.signal(ball,'镜面姿态','stance');}
      if(t+1e-9>=s.next&&s.phase!=='active'){s.phase='warning';s.until=t+.45;s.next=t+ball.def.stancePeriod;engine.sound('ready',ball.x);}
    },
    reflectorReceive(ball,hit,engine){if(ball.stance.phase!=='active'||hit.actual<=0)return;const r=ball.role;r.counterAngle=hit.incomingAngle??(hit.impact?Math.atan2(-hit.impact.ny,-hit.impact.nx):Math.atan2(hit.source.y-ball.y,hit.source.x-ball.x));if(G.Awakening.active(ball))ball.stance.stored=Math.min(8*engine.heatMultiplier,ball.stance.stored+hit.actual*.25);},
    intercept(shot,target,engine){
      if((shot.mode||'shot')!=='shot'||shot.noMirror||target.type!=='reflector'||target.stance.phase!=='active'||target.role.mirrors<=0)return null;
      target.role.mirrors--;const speed=Math.hypot(shot.vx,shot.vy)||shot.speed,nx=shot.vx/speed,ny=shot.vy/speed,d=target.radius+shot.radius+2;
      const returned={id:engine.nextWorldId++,mode:'counter',owner:target.id,x:clamp(target.x-nx*d,shot.radius,C.width-shot.radius),y:clamp(target.y-ny*d,shot.radius,C.height-shot.radius),vx:-shot.vx,vy:-shot.vy,speed,radius:shot.radius,raw:shot.raw*.55,expires:engine.time+1.1,maxBounces:0,bounces:0,charged:false,color:target.def.color,noMirror:true,heavy:shot.heavy};
      target.stats.countersFired++;engine.signal(target,'镜片截获 · 原路折返','mirrorCatch');this.effect(target,engine,'mirrorCatch',target,Math.atan2(returned.vy,returned.vx),.25);return returned;
    },
    netLinks(engine){
      const links=[];for(const owner of engine.balls){if(owner.type!=='trapper'||owner.hp<=0)continue;const nodes=engine.traps.filter(m=>m.owner===owner.id&&m.armedAt<=engine.time+1e-9&&m.expires>=engine.time&&!Number.isFinite(m.detonateAt)),candidates=[],parent=new Map(nodes.map(n=>[n.id,n.id]));
        const find=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
        for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>=18&&d<=120)candidates.push({a,b,d});}
        candidates.sort((a,b)=>a.d-b.d||a.a.id-b.a.id||a.b.id-b.b.id);for(const edge of candidates){const a=find(edge.a.id),b=find(edge.b.id);if(a===b)continue;parent.set(a,b);links.push(edge);}
      }return links;
    },
    crossesLink(target,link){
      const ray={x:link.a.x,y:link.a.y,endX:link.b.x,endY:link.b.y},r=target.radius+2;if(G.World.distanceToRay(ray,target)<=r||G.World.distanceToRay(ray,{x:target.previousX??target.x,y:target.previousY??target.y})<=r)return true;
      const cross=(ax,ay,bx,by,cx,cy)=>(bx-ax)*(cy-ay)-(by-ay)*(cx-ax),x=target.previousX??target.x,y=target.previousY??target.y,a=link.a,b=link.b;
      const c1=cross(a.x,a.y,b.x,b.y,x,y),c2=cross(a.x,a.y,b.x,b.y,target.x,target.y),c3=cross(x,y,target.x,target.y,a.x,a.y),c4=cross(x,y,target.x,target.y,b.x,b.y);return c1*c2<0&&c3*c4<0;
    },
    startMine(mine,owner,engine){const chain={id:engine.nextWorldId++,owner:owner.id,until:engine.time+1,hitCounts:{}};engine.trapChains.push(chain);mine.chainId=chain.id;mine.depth=0;mine.detonateAt=engine.time;return chain;},
    updateTraps(engine){
      engine.trapChains=engine.trapChains.filter(c=>c.until>=engine.time);
      engine.traps=engine.traps.filter(m=>{const owner=engine.balls.find(b=>b.id===m.owner&&b.hp>0);if(!owner)return false;if(engine.time>m.expires&&!Number.isFinite(m.detonateAt)){G.Recovery.refund(owner,engine,'nextTrap',.4,'节点未触发');return false;}if(!m.armSound&&engine.time+1e-9>=m.armedAt){m.armSound=true;engine.sound('netArm',m.x);}return true;});
      const startedOwners=new Set();
      for(const mine of engine.traps){if(startedOwners.has(mine.owner)||Number.isFinite(mine.detonateAt)||engine.time+1e-9<mine.armedAt)continue;const owner=engine.balls.find(b=>b.id===mine.owner),target=engine.balls.find(b=>b.id!==mine.owner&&b.hp>0&&Math.hypot(b.x-mine.x,b.y-mine.y)<=b.radius+mine.radius);if(target){this.startMine(mine,owner,engine);startedOwners.add(owner.id);}}
      for(const link of this.netLinks(engine)){const owner=engine.balls.find(b=>b.id===link.a.owner),target=engine.balls.find(b=>b.id!==owner.id&&b.hp>0&&this.crossesLink(b,link));if(!target||startedOwners.has(owner.id))continue;const mine=Math.hypot(target.x-link.a.x,target.y-link.a.y)<=Math.hypot(target.x-link.b.x,target.y-link.b.y)?link.a:link.b;if(Number.isFinite(mine.detonateAt))continue;this.startMine(mine,owner,engine);startedOwners.add(owner.id);owner.role.netTriggers++;engine.signal(owner,'感应线触发','netTrigger');engine.effects.push({kind:'arc',x:link.a.x,y:link.a.y,endX:link.b.x,endY:link.b.y,color:owner.def.color,age:0,life:.2});}
      const due=engine.traps.filter(m=>Number.isFinite(m.detonateAt)&&engine.time+1e-9>=m.detonateAt).sort((a,b)=>a.detonateAt-b.detonateAt||a.id-b.id),removed=new Set();
      for(const mine of due){const owner=engine.balls.find(b=>b.id===mine.owner&&b.hp>0),chain=engine.trapChains.find(c=>c.id===mine.chainId);removed.add(mine.id);if(!owner||!chain)continue;
        for(const target of engine.balls)if(target.id!==owner.id&&target.hp>0&&Math.hypot(target.x-mine.x,target.y-mine.y)<=target.radius+(mine.blastRadius||mine.radius)){
          const count=chain.hitCounts[target.id]||0;if(count>=2)continue;chain.hitCounts[target.id]=count+1;engine.pendingAttacks.push({source:owner,target,raw:mine.raw*(count?.55:1),kind:'trap'});
        }
        G.Spectacle?.emit(engine,owner,'detonate',{point:mine,radius:mine.blastRadius||45,life:.45,cooldown:0,sound:false});engine.ring(mine.x,mine.y,mine.color,mine.blastRadius||45);engine.burst(mine.x,mine.y,mine.color,12);engine.sound('chainBlast',mine.x);engine.impact(mine.x,mine.y,mine.color,1.6);this.effect(owner,engine,'groundBurst',mine,0,.5);
        if(mine.chainRange)for(const other of engine.traps)if(other.owner===owner.id&&!removed.has(other.id)&&!Number.isFinite(other.detonateAt)&&other.chainRange&&other.armedAt<=engine.time+1e-9&&other.expires>=engine.time&&Math.hypot(other.x-mine.x,other.y-mine.y)<=mine.chainRange){other.detonateAt=engine.time+.09;other.chainId=chain.id;other.depth=(mine.depth||0)+1;other.expires=Math.max(other.expires,other.detonateAt+.01);engine.effects.push({kind:'arc',x:mine.x,y:mine.y,endX:other.x,endY:other.y,color:mine.color,age:0,life:.15});}
      }engine.traps=engine.traps.filter(m=>!removed.has(m.id));
    },
    status(ball,engine){const r=ball.role,t=engine.time;
      if(ball.type==='normal')return [{label:'拳势',value:ball.charges+'/3'},...G.Recovery.pressureStatus(ball),{label:'拳劲',value:G.Awakening.active(ball)?(3.5*engine.heatMultiplier).toFixed(1):'未觉醒'}];
      if(ball.type==='vampire')return [{label:'汲取',value:Math.round(ball.def.lifesteal*100)+'%'},{label:'血能',value:r.blood.toFixed(1)+'/8'},{label:'血契',value:r.chainWarning?'预警':ball.awakening.chainActive?(ball.awakening.chainUntil-t).toFixed(1)+'s':G.Awakening.active(ball)?Math.max(0,ball.awakening.nextCast-t).toFixed(1)+'s':'未觉醒'},{label:'链伤',value:(1.05*engine.heatMultiplier).toFixed(1)+'/次'},{label:'已回复',value:ball.stats.healing.toFixed(1)},...G.Recovery.refundStatus(ball)];
      if(ball.type==='shield')return [{label:'护盾',value:ball.shield.toFixed(1)},{label:'充能',value:Math.max(0,ball.nextShield-t).toFixed(1)+'s'},{label:'盾时',value:Math.max(0,ball.shieldUntil-t).toFixed(1)+'s'},{label:'压力',value:r.pressure.toFixed(1)+'/8'},...G.Recovery.pressureStatus(ball),{label:'释放',value:G.Awakening.active(ball)?(r.pressure*.9*engine.heatMultiplier).toFixed(1):'未觉醒'}];
      if(ball.type==='ranger')return [{label:'弹伤',value:G.Combat.attackValue(ball,engine,this.rangerDamage(ball),'shot').toFixed(1)},{label:'弹匣',value:r.ammo+'/3'},{label:'装填',value:Math.max(0,r.reloadUntil-t).toFixed(1)+'s'},{label:'校准',value:r.calibration+'/2'},{label:'弹种',value:r.overload?'过载':'普通'},{label:'重弹伤',value:(8.4*engine.heatMultiplier).toFixed(1)}];
      if(ball.type==='laser')return [{label:'束伤',value:G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?22.2:ball.def.laserDamage,'laser').toFixed(1)},{label:'电容',value:Math.round(r.capacitor*100)+'%'},{label:'阶段',value:ball.laser?ball.laser.locked?'锁线':'瞄准':r.coolingUntil>t?'散热':'充能'},{label:'散热',value:Math.max(0,r.coolingUntil-t).toFixed(1)+'s'},{label:'落空',value:ball.laserMisses+'/2'},...G.Recovery.refundStatus(ball)];
      if(ball.type==='reflector')return [{label:'姿态',value:{rest:'空窗',warning:'预警',active:'反击'}[ball.stance.phase]},{label:'镜片',value:r.mirrors+'/'+(G.Awakening.active(ball)?2:1)},{label:'即时返还',value:ball.stance.phase==='active'?(G.Awakening.active(ball)?60:75)+'%':'0%'},{label:'蓄能',value:ball.stance.stored.toFixed(1)},{label:'姿态CD',value:Math.max(0,(ball.stance.phase==='rest'?ball.stance.next:ball.stance.until)-t).toFixed(1)+'s'},{label:'反击命中',value:ball.stats.countersHit}];
      if(ball.type==='trapper')return [{label:'雷伤',value:G.Combat.attackValue(ball,engine,G.Awakening.trapOptions(ball).damage,'trap').toFixed(1)},{label:'节点',value:engine.traps.filter(m=>m.owner===ball.id).length+'/'+G.Awakening.trapOptions(ball).cap},{label:'布置',value:Math.max(0,ball.nextTrap-t).toFixed(1)+'s'},{label:'感应线',value:this.netLinks(engine).filter(l=>l.a.owner===ball.id).length},{label:'触线',value:r.netTriggers},...G.Recovery.refundStatus(ball)];
      return [];
    }
  };
})(typeof window!=='undefined'?window:globalThis);
