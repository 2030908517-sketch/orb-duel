(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Character resources and attacks; all damage uses the shared simultaneous batch.
  G.Roles={
    fresh(){return {blood:0,bloodMark:null,chainWarning:0,chainDamage:0,pressure:0,shieldRelease:0,shieldReserve:0,shieldAngle:0,shieldFireAt:0,salvoFireAt:0,salvoAngle:0,ammo:3,calibration:0,calibrationUntil:0,reloadUntil:0,overload:false,round:0,capacitor:0,coolingUntil:0,disruptedUntil:0,mirrors:0,counterAngle:0,counterRelease:0,counterFireAt:0,chainOutSince:-1,chainMarked:false,netTriggers:0,waveHits:0,heavyRounds:0};},
    update(ball,engine){const r=ball.role;if(r.bloodMark&&r.bloodMark.until<engine.time)r.bloodMark=null;G.VampireHunt?.update(ball,engine);},
    effect(ball,engine,style,point=ball,angle=Math.atan2(ball.vy,ball.vx),life=.4){engine.effects.push({kind:'roster',style,owner:ball.id,x:point.x,y:point.y,angle,color:ball.def.color,age:0,life});},
    wave(ball,engine,raw,angle,kind,reach=90,width=25){
      engine.waves.push({id:engine.nextWorldId++,owner:ball.id,x:ball.x,y:ball.y,originX:ball.x,originY:ball.y,angle,speed:kind==='fistWave'?620:390,travel:0,reach,width,baseWidth:width,push:kind==='pressureWave'?190:0,raw,kind,color:ball.def.color,hitIds:[],expires:engine.time+reach/(kind==='fistWave'?620:390)});
      this.effect(ball,engine,kind,ball,angle,.42);engine.sound(kind==='fistWave'?'fistRelease':'pressureRelease',ball.x);
    },
    updateWaves(engine,dt){
      const live=[];
      for(const w of engine.waves){const owner=engine.balls.find(b=>b.id===w.owner&&b.hp>0);if(!owner||engine.time>w.expires+1e-9)continue;
        const old={x:w.x,y:w.y},nx=Math.cos(w.angle),ny=Math.sin(w.angle);w.travel+=w.speed*dt;if(w.kind==='pressureWave')w.width=w.baseWidth+28*Math.min(1,w.travel/w.reach);w.x=w.originX+nx*w.travel;w.y=w.originY+ny*w.travel;
        if(engine.mode==='2v2'&&G.Team.rayLimit(old.x,old.y,nx,ny,0,engine.obstacles)<=w.speed*dt)continue;
        for(const target of engine.balls){if(!G.World.enemy(w.owner,target,engine)||target.hp<=0||G.Ghost.phased(target)||w.hitIds.includes(target.id))continue;
          const dx=target.x-w.originX,dy=target.y-w.originY,forward=dx*nx+dy*ny,lateral=Math.abs(-dx*ny+dy*nx);
          if(forward>=-target.radius&&forward<=w.travel+target.radius&&lateral<=w.width+target.radius&&G.World.intersects({x:w.x,y:w.y,radius:w.width},old.x,old.y,target)){
            w.hitIds.push(target.id);engine.pendingAttacks.push({source:owner,target,raw:w.raw,kind:w.kind,adaptiveId:w.adaptiveId,angle:w.angle,push:w.push});
          }
        }live.push(w);
      }engine.waves=live;
    },
    prepareContacts(hits,engine){for(const h of hits)if(h.source.type==='shield'&&!G.Awakening.dashing(h.target,engine)){h.pressureSpent=h.source.role.pressure;h.source.role.pressure=0;}},
    multiplier(ball){return ball.type==='shield'?1+Math.min(.55,ball.role.pressure/14):1;},
    shove(target,angle,power,duration=.65){
      if(G.Physics.armored(target))return;
      target.vx+=Math.cos(angle)*power;target.vy+=Math.sin(angle)*power;target.inertia=Math.max(target.inertia||0,duration);G.Physics.limit(target);
    },
    heavyImpact(ball,hit,engine,style,cue,push=170,stop=.055){
      if(hit.avoided||hit.actual+hit.blocked<=0)return;
      const old=hit.feedback;hit.feedback={style,cue:cue||old?.cue||'heavy',push:Math.max(old?.push||0,push),stop:Math.max(old?.stop||0,stop),power:2.3};
    },
    finishImpacts(hits,engine){
      const targets=new Map();
      for(const hit of hits){
        if(hit.actual>=15&&!hit.feedback){
          const physical=['contact','shot','counter','boomerang'].includes(hit.kind),style=hit.kind==='laser'?'beamImpact':hit.kind==='reflection'?'mirrorStrike':hit.kind==='boomerang'?'bladeImpact':hit.kind==='toxinBurst'||hit.kind==='poison'?'toxinErupt':hit.kind==='chain'||hit.kind==='bloodFinish'?'bloodFinish':'largeHit';
          this.heavyImpact(hit.source,hit,engine,style,style==='beamImpact'?'cannonHit':style==='mirrorStrike'?'mirrorStrike':style==='bladeImpact'?'bladeHeavyHit':style==='toxinErupt'?'toxinErupt':style==='bloodFinish'?'bloodFinish':'largeHit',physical?110:0,.055);
        }
        if(!hit.feedback){G.Spectacle?.hit(engine,hit);continue;}
        if(hit.actual>=15){hit.feedback.stop=Math.max(hit.feedback.stop,Math.min(.075,.055+(hit.actual-15)*.001));hit.feedback.power=2.3+Math.min(.6,(hit.actual-15)/30);}
        const previous=targets.get(hit.target);if(!previous||hit.feedback.push>previous.feedback.push||hit.feedback.push===previous.feedback.push&&hit.actual>previous.actual)targets.set(hit.target,hit);
      }
      for(const hit of targets.values()){
        const {source:ball,target,feedback:f}=hit,angle=hit.angle??(hit.impact?Math.atan2(hit.impact.ny,hit.impact.nx):Math.atan2(target.y-(hit.point?.y??ball.y),target.x-(hit.point?.x??ball.x)));
        if(f.push){const push=Math.min(480,f.push*1.35+hit.actual*5);this.shove(target,angle,push,1.05);target.impactDrag=2.2;}target.hitVisual={age:.045,life:.24,angle,power:f.power};
        const dedicatedArcana=!!hit.dance||engine.mode==='arcana'&&['arcDebt','arcSonic','arcBlood','arcPierce','arcBite','arcTide','arcCage'].includes(hit.kind);if(!dedicatedArcana){engine.impact(target.x,target.y,ball.def.color,2);engine.burst(target.x,target.y,ball.def.color,14);}if(!f.presented)engine.hitStop(f.stop);if(!hit.actual){f.style='guardImpact';f.cue='guardHeavy';}
        const number=engine.effects.findLast(e=>e.kind==='text'&&e.damageTarget===target.id);if(number){number.strong=true;number.color='#fff0a4';}if(!f.presented){this.effect(ball,engine,f.style,target,angle,.34);engine.sound(f.cue,target.x);}ball.stats.powerHits++;
      }
    },
    normalHit(ball,hit,engine){
      if(hit.kind!=='contact'||hit.actual+hit.blocked<=0||G.Arcana?.busy(ball))return;
      if(ball.charges>=3&&(!G.ManualRoles?.owns(ball,engine)||engine.manual.heavyReady)){if(G.ManualRoles?.owns(ball,engine))engine.manual.heavyReady=false;hit.heavyContact=true;this.heavyImpact(ball,hit,engine,'fistHit','fistHit',190,.06);ball.charges=0;ball.stats.heavyHits++;engine.signal(ball,'破阵重拳','miss',hit.target);
        if(G.Awakening.active(ball)&&!G.Temporal.silenced(ball,engine))this.wave(ball,engine,3.5*engine.heatMultiplier,Math.atan2(hit.impact?.ny??0,hit.impact?.nx??1),'fistWave',150,24);
      }else if(ball.charges<3){ball.charges=Math.min(3,ball.charges+(hit.actual>0?1:.5));if(ball.charges===3)engine.signal(ball,'重拳就绪','ready');}
    },
    absorb(ball,blocked,engine){if(blocked>0&&ball.type==='shield')G.Adaptive?.goodKey(ball,'shield');if(ball.type==='shield'&&blocked>0)ball.role.pressure=Math.min(8,ball.role.pressure+blocked*.40/engine.heatMultiplier);},
    shieldEnd(ball,engine){const r=ball.role,release=G.Awakening.active(ball)&&!G.Temporal.silenced(ball,engine)&&(r.pressure>0||ball.shield>0);if(!release)G.Adaptive?.close(ball,r.shieldAdaptiveId);if(release){const enemy=G.World.targetFor(ball,engine);r.shieldReserve=ball.shield;r.shieldRelease=r.pressure;r.shieldAngle=enemy?G.Aim.direct(ball,enemy,engine,'shield',390,.22):Math.atan2(ball.vy,ball.vx);r.shieldFireAt=engine.time+.22;engine.signal(ball,'盾片收拢 · 锁定冲击','pressureCharge');this.effect(ball,engine,'shieldGather',ball,r.shieldAngle,.22);}r.pressure=0;},
    shieldUpdate(ball,dt,engine){
      if(engine.state!=='running')return;const r=ball.role,spec=G.Awakening.shieldOptions(ball),enemy=G.World.targetFor(ball,engine);if(enemy)G.Aim.direct(ball,enemy,engine,'shield',390);
      if(ball.shield>0&&engine.time>=ball.shieldUntil){this.shieldEnd(ball,engine);ball.shield=0;}
      if((r.shieldRelease>0||r.shieldReserve>0)&&engine.state==='running'&&engine.time+1e-9>=r.shieldFireAt&&G.World.targetFor(ball,engine)){r.shieldAngle=G.Aim.direct(ball,G.World.targetFor(ball,engine),engine,'shield',390);this.wave(ball,engine,(r.shieldRelease*.7+r.shieldReserve*.5)*engine.heatMultiplier,r.shieldAngle,'pressureWave',230,32);engine.waves.at(-1).adaptiveId=r.shieldAdaptiveId;G.Adaptive?.close(ball,r.shieldAdaptiveId);engine.signal(ball,'堡垒震荡','miss');engine.burst(ball.x,ball.y,ball.def.color,18);r.shieldRelease=0;r.shieldReserve=0;r.shieldFireAt=0;ball.awakening.pendingBurst=false;}
      if(!ball.arcana?.royalActive&&engine.time+1e-9>=ball.nextShield&&ball.shield<=0&&!r.shieldRelease&&!r.shieldReserve){if(!ball.arcana?.royalActive)r.pressure=0;ball.shield=spec.amount;ball.shieldUntil=engine.time+spec.duration+(G.Adaptive?.duration(ball,'shield')||0);r.shieldAdaptiveId=G.Adaptive?.begin(ball,'shield',engine);ball.nextShield=engine.time+spec.period;engine.ring(ball.x,ball.y,ball.def.color,48);engine.sound('shield',ball.x);engine.log(engine.label(ball)+'屏障展开 · '+spec.amount+' 盾');}
    },
    hit(hit,engine){
      const b=hit.source,t=hit.target,r=b.role;
      if(['chain','bloodFinish'].includes(hit.kind)&&hit.bloodEnergyPaid){if(hit.actual+hit.blocked>0){if(hit.kind==='chain')r.chainDamage++;}else r.blood=Math.min(8,r.blood+hit.bloodEnergyPaid);}
      if(hit.kind==='counter'&&hit.storedCounter)this.heavyImpact(b,hit,engine,'mirrorStrike','mirrorStrike',100,.05);if(hit.kind==='trap'&&hit.mineBlast&&hit.actual+hit.blocked>0)this.heavyImpact(b,hit,engine,'groundBurst','mineHit',210,.06);if(hit.kind==='trap'&&!hit.mineBlast&&hit.actual+hit.blocked>0){const chain=engine.trapChains.find(c=>c.id===hit.chainId);if(chain&&!chain.feedbackDone){chain.feedbackDone=true;this.heavyImpact(b,hit,engine,'groundBurst','chainHit',hit.chainFinal?100:0,.05);}else if(hit.chainFinal)this.shove(t,Math.atan2(t.y-(hit.point?.y??b.y),t.x-(hit.point?.x??b.x)),90);}
      if(b.type==='ranger')this.rangerHit(b,hit,engine);
      if(t.type==='laser')this.laserReceive(t,hit,engine);
      if(hit.kind==='laser'&&hit.push&&hit.actual+hit.blocked>0&&!hit.avoided){this.shove(t,hit.angle,hit.push*(1+Math.min(1,hit.actual/20)),.85);this.effect(b,engine,'beamContact',t,hit.angle,.16);engine.sound('beamGrind',t.x);if(hit.beamFirst)this.heavyImpact(b,hit,engine,'beamImpact','cannonHit',0,.04);}
      if(hit.heavyShot&&hit.actual+hit.blocked>0)this.heavyImpact(b,hit,engine,'shellHit',hit.sniperShot?'sniperHit':'heavyShotHit',hit.sniperShot?205:180,hit.sniperShot?.065:.055);
      if(hit.kind==='pressureWave'&&hit.actual+hit.blocked>0)this.heavyImpact(b,hit,engine,'pressureHit','pressureHit',hit.push||190,.06);
      if(b.type==='vampire'&&hit.kind==='contact'&&hit.actual>0){t.role.bloodMark={owner:b.id,until:engine.time+3};this.effect(b,engine,'bloodMark',t,0,.35);}
      if(b.type==='shield'&&hit.kind==='contact'&&hit.actual+hit.blocked>0&&hit.pressureSpent>0){engine.signal(b,'承压盾击','miss',t);this.heavyImpact(b,hit,engine,'pressureHit','shieldBash',85+hit.pressureSpent*11,.05);}
      if(['fistWave','pressureWave'].includes(hit.kind)&&hit.actual>0){r.waveHits++;if(hit.kind==='fistWave')engine.sound('fistRelease',t.x);engine.impact(t.x,t.y,b.def.color,1.6);this.effect(b,engine,hit.kind,t,hit.angle);}
      if(hit.kind==='bloodFinish'&&hit.actual>0){engine.signal(b,'血契收束','miss',t);this.heavyImpact(b,hit,engine,'bloodFinish','bloodFinish',0,.05);}
    },
    startChain(ball,engine){const r=ball.role,a=ball.awakening,t=engine.time;r.chainAdaptiveId=G.Adaptive?.begin(ball,'vampire',engine);r.chainWarning=t+.25;a.nextCast=t+8.5;engine.sound('bloodCharge',ball.x);engine.signal(ball,'血契锁定','miss');},
    vampireUpdate(ball,dt,engine){
      const a=ball.awakening,r=ball.role,t=engine.time,target=G.World.targetFor(ball,engine);if(!target)return;
      const distance=Math.hypot(target.x-ball.x,target.y-ball.y),inRange=distance<=220;
      if(r.chainWarning){if(t+1e-9>=r.chainWarning){r.chainWarning=0;if(distance>235){G.Adaptive?.close(ball,r.chainAdaptiveId);a.nextCast=Math.min(a.nextCast,t+.6);return;}r.chainOutSince=-1;r.chainMarked=!!(target.role.bloodMark?.owner===ball.id&&target.role.bloodMark.until>=t);a.chainActive=true;a.chainStartedAt=t;a.chainConnected=0;a.chainRefund=0;a.chainUntil=t+2.1;a.nextPulse=t+.3;r.chainDamage=0;r.chainPulses=0;a.casts++;engine.sound('chain',ball.x);this.effect(ball,engine,'bloodConnect');}}
      else if(!G.ManualRoles?.owns(ball,engine)&&!a.chainActive&&t+1e-9>=a.nextCast&&inRange&&r.blood>=.5&&!G.Adaptive?.wait(ball,target,engine,'vampire')){this.startChain(ball,engine);}
      if(!a.chainActive)return;
      if(distance>260){if(r.chainOutSince<0)r.chainOutSince=t;if(t-r.chainOutSince>=.12){this.finishChain(ball,engine);return;}}else r.chainOutSince=-1;
      if(distance<=260)a.chainConnected=Math.min(2.1,Math.max(0,t-a.chainStartedAt));
      if(t<=a.chainUntil+1e-9&&t+1e-9>=a.nextPulse){if(distance>260){a.nextPulse+=.3;return;}if(r.blood<.5){this.finishChain(ball,engine);return;}r.blood-=.5;a.nextPulse+=.3;r.chainPulses++;engine.pendingAttacks.push({source:ball,target,raw:1.05*engine.heatMultiplier,kind:'chain',bloodEnergyPaid:.5,adaptiveId:r.chainAdaptiveId,healRatio:.85});}
      if(t+1e-9>=a.chainUntil){if(engine.pendingAttacks.some(h=>h.source===ball&&h.kind==='chain'))return;const mark=target.role.bloodMark;if(r.chainDamage===7&&r.chainMarked&&r.blood>=.5){r.blood-=.5;if(mark?.owner===ball.id)target.role.bloodMark=null;engine.pendingAttacks.push({source:ball,target,raw:2.6*engine.heatMultiplier,kind:'bloodFinish',bloodEnergyPaid:.5,shatterShield:true,adaptiveId:r.chainAdaptiveId,healRatio:1});}this.finishChain(ball,engine);}
    },
    cleanse(ball,engine){
      // Remove actor debuffs, not buffs, spent cooldowns, physical walls or hostile areas.
      ball.poison=ball.magneticMark=ball.bladeMark=ball.stagger=null;ball.role.bloodMark=null;ball.temporal.silenceUntil=0;ball.role.cutSlowUntil=0;ball.role.cutSlowActive=false;ball.role.disruptedUntil=0;
      G.Temporal.releaseControl(ball);ball.inertia=ball.impactDrag=0;G.Physics.normalizeSpeed(ball);
      const removeTarget=(world,key)=>{if(world?.[key])world[key]=world[key].filter(v=>v.target!==ball.id);};
      removeTarget(engine.holyWorld,'burns');removeTarget(engine.cosmicWorld,'marks');removeTarget(engine.chargeWorld,'conductive');// Arcana forced movement is not a cleansable debuff.
      if(engine.demonWorld){for(const c of engine.demonWorld.chains.filter(c=>c.target===ball.id)){const cast=engine.demonWorld.casts.find(v=>v.id===c.castId);if(cast){cast.finished??={};cast.finished[ball.id]=true;}}removeTarget(engine.demonWorld,'marks');removeTarget(engine.demonWorld,'chains');}
      for(const trap of engine.traps)if(trap.captureTarget===ball.id){trap.captureTarget=null;trap.captureUntil=0;trap.captureStarted=0;}
    },
    finishChain(ball,engine){const a=ball.awakening;if(!a.chainActive)return;a.chainActive=false;a.chainUntil=0;a.nextPulse=Infinity;G.Adaptive?.close(ball,ball.role.chainAdaptiveId);a.chainRefund=G.Recovery.refund(ball,engine,'nextCast',1.2*Math.max(0,1-a.chainConnected/2.1),'血契中断',a);},
    activate(ball,engine){if(ball.type==='ranger'){ball.role.calibration=ball.def.calibrationCap;ball.role.calibrationUntil=engine.time+6;}if(ball.type==='shield'){ball.role.pressure=0;ball.role.shieldRelease=0;ball.role.shieldFireAt=0;}if(ball.type==='vampire')ball.role.blood=Math.max(3,ball.role.blood);},
    rangerDamage(ball){return G.Awakening.active(ball)?ball.role.overload&&ball.role.round===2?7.8:ball.role.overload?4.6:4.6:ball.def.shotDamage;},
    rangerUpdate(ball,dt,engine){
      if(G.Ranger)return G.Ranger.update(ball,dt,engine);
      if(engine.state!=='running')return;const r=ball.role,t=engine.time,awake=G.Awakening.active(ball);
      if(t>r.calibrationUntil)r.calibration=0;
      if(r.reloadUntil){
        if(t+1e-9<r.reloadUntil)return;r.reloadUntil=0;r.ammo=3;r.round=0;r.overload=awake&&r.calibration>=ball.def.calibrationCap;
        if(r.overload){const target=G.World.targetFor(ball,engine);r.calibration=0;r.salvoAngle=target?G.World.aim(ball,target,ball.def.shotSpeed):Math.atan2(ball.vy,ball.vx);r.salvoFireAt=t+.3;ball.nextShot=r.salvoFireAt;engine.signal(ball,'枪阵展开 · 后坐突击','salvoCharge');this.effect(ball,engine,'gunDeploy',ball,r.salvoAngle,.3);}else ball.nextShot=t;
      }
      if(r.salvoFireAt>t){const enemy=G.World.targetFor(ball,engine);if(enemy)r.salvoAngle=G.World.aim(ball,enemy,ball.def.shotSpeed,r.salvoFireAt-t);}
      if(t+1e-9<ball.nextShot)return;const target=G.World.targetFor(ball,engine);if(!target)return;
      const direct=Math.atan2(target.y-ball.y,target.x-ball.x),lead=G.World.aim(ball,target,ball.def.shotSpeed),delta=Math.atan2(Math.sin(lead-direct),Math.cos(lead-direct)),heavy=r.overload&&r.round===2,angle=G.World.aim(ball,target,heavy?520:ball.def.shotSpeed);r.salvoAngle=angle;
      const error=r.overload?0:G.Aim?.offset(ball,target,engine,'ranger')||0;
      for(const offset of r.overload&&!heavy?[-.22,0,.22]:[0]){const shot=G.World.fire(ball,engine,{angle:angle+offset+error,damage:offset?1.25:this.rangerDamage(ball),heavy,speed:heavy?520:ball.def.shotSpeed,radius:heavy?6.5:ball.def.shotRadius});if(shot){shot.calibrationEligible=offset===0;shot.calibrationIgnored=offset!==0;}}
      engine.sound(heavy?'heavyShot':r.overload?'salvoShot':'shot',ball.x);this.effect(ball,engine,heavy?'heavyMuzzle':r.overload?'salvoMuzzle':'muzzle',ball,angle,heavy?.22:.16);
      ball.hitVisual={age:0,life:.16,angle,power:heavy?1.5:.5};if(r.overload){const forward=Math.max(0,ball.vx*Math.cos(angle)+ball.vy*Math.sin(angle));this.shove(ball,angle+Math.PI,forward+(heavy?125:70),.5);if(heavy){r.heavyRounds++;engine.signal(ball,'终结重弹','miss');}}
      r.salvoFireAt=0;r.ammo--;r.round++;
      if(!r.ammo){const reload=r.overload?5.1:awake?3.8:4.1;r.reloadUntil=t+reload;ball.nextShot=r.reloadUntil;engine.sound('reload',ball.x);}else ball.nextShot=t+(r.overload?.22:awake?.32:.42);
    },
    rangerHit(ball,hit,engine){if(G.Ranger)return G.Ranger.hit(ball,hit,engine);if(hit.kind!=='shot')return;if(hit.calibrationShot){G.Aim.result(hit.calibrationShot,engine,hit.actual+hit.blocked>0);return;}if(!hit.calibrationIgnored&&hit.actual+hit.blocked>0){ball.role.calibration=Math.min(ball.def.calibrationCap,ball.role.calibration+1);ball.role.calibrationUntil=engine.time+6;}},
    laserUpdate(ball,dt,engine){
      if(engine.state!=='running')return;const r=ball.role,t=engine.time,awake=G.Awakening.active(ball),target=G.World.targetFor(ball,engine);if(!target)return;
      if(!ball.laser)G.Aim.track(ball,target,engine,'laser',Infinity,0,6.5,dt);
      if(ball.laser){const l=ball.laser;if(t<l.trackUntil){const dest=G.Awakening.predict(target,Math.max(0,l.fireAt-t)),origin=G.Awakening.predict(ball,Math.max(0,l.fireAt-t));l.origin=origin;l.angle=G.Aim.track(ball,target,engine,'laser',Infinity,Math.max(0,l.fireAt-t),6.5,dt);}else if(!l.locked){l.locked=true;engine.sound('laserLock',ball.x);}if(t+1e-9>=l.fireAt){this.laserFire(ball,engine);ball.laser=null;}return;}
      if(t+1e-9<r.coolingUntil||engine.beams.some(beam=>beam.owner===ball.id))return;r.capacitor=Math.min(1,r.capacitor+dt/(ball.temporal.rate||1)*(ball.temporal.cooldownRate??ball.temporal.rate)/(awake?3.6:4.2));ball.nextLaser=t+(1-r.capacitor)*(awake?3.6:4.2);
      if(r.capacitor+1e-9>=1){if(G.Adaptive?.wait(ball,target,engine,'laser'))return;r.laserAdaptiveId=G.Adaptive?.begin(ball,'laser',engine);const delay=.18+(awake?.55:.65),dest=G.Awakening.predict(target,delay),origin=G.Awakening.predict(ball,delay);ball.laser={origin,angle:ball.role.aimTracks.laser.angle,trackUntil:t+delay-.18,fireAt:t+delay,locked:false,awake};engine.sound('charge',ball.x);engine.signal(ball,'电容满载 · 瞄准','miss');}
    },
    laserFire(ball,engine){
      const r=ball.role,l=ball.laser,awake=l.awake??G.Awakening.active(ball),ray=G.World.ray(ball,l.angle),raw=G.Combat.rollAttack(ball,engine,awake?22.2:ball.def.laserDamage,'laser');ball.stats.lasersFired++;G.Adaptive?.close(ball,r.laserAdaptiveId);r.capacitor=0;r.coolingUntil=engine.time+(awake?2.10:1.1);ball.nextLaser=r.coolingUntil+(awake?3.6:4.2);
      if(awake){engine.beams.push({id:engine.nextWorldId++,owner:ball.id,adaptiveId:r.laserAdaptiveId,angle:l.angle,baseAngle:l.angle,sweep:(Math.sin(Math.atan2(G.World.targetFor(ball,engine)?.vy||0,G.World.targetFor(ball,engine)?.vx||0)-l.angle)>=0?1:-1)*.38,width:8,raw:raw*.28,started:engine.time,duration:.65,expires:engine.time+.65,nextPulse:engine.time,pulses:0,hitCounts:{},touched:false});for(const target of engine.balls)if(G.World.enemy(ball,target,engine)&&target.hp>0&&!G.Ghost.phased(target)&&G.World.distanceToRay(ray,target)<=target.radius+7){engine.pendingAttacks.push({source:ball,target,raw:raw*.88,kind:'laser',adaptiveId:r.laserAdaptiveId,angle:l.angle,beamId:engine.beams.at(-1).id,beamFirst:true,push:100,mainBeam:true});engine.beams.at(-1).hitCounts[target.id]=0;engine.beams.at(-1).touched=true;engine.beams.at(-1).initialIds=[target.id];}engine.sound('cannon',ball.x);this.effect(ball,engine,'cannon',ball,l.angle,.65);engine.signal(ball,'扫射重炮','miss');engine.impact(ball.x,ball.y,ball.def.color,1.7);}
      else{let touched=false;for(const target of engine.balls)if(G.World.enemy(ball,target,engine)&&target.hp>0&&!G.Ghost.phased(target)&&G.World.distanceToRay(ray,target)<=target.radius+ball.def.laserWidth){engine.pendingAttacks.push({source:ball,target,raw,kind:'laser',adaptiveId:r.laserAdaptiveId,angle:l.angle});touched=true;}const cleared=engine.traps.filter(trap=>G.World.enemy(ball,trap.owner,engine)&&trap.armedAt<=engine.time&&trap.expires>=engine.time&&G.World.distanceToRay(ray,trap)<=trap.radius+ball.def.laserWidth);for(const trap of cleared)G.World.clearTrap(trap,ball,engine);if(cleared.length)G.Adaptive?.good(ball,r.laserAdaptiveId);this.laserOutcome(ball,engine,touched||cleared.length>0);engine.effects.push({kind:'beam',...ray,color:ball.def.color,width:ball.def.laserWidth,age:0,life:.22});engine.sound('laser',ball.x);}
    },
    laserOutcome(ball,engine,touched){if(touched)ball.laserMisses=0;else if(++ball.laserMisses>=2){ball.laserMisses=0;G.Recovery.refund(ball,engine,'coolingUntil',.6,'重炮连续落空',ball.role);ball.nextLaser=ball.role.coolingUntil+(G.Awakening.active(ball)?3.6:4.2);}},
    updateBeams(engine){
      const live=[];for(const beam of engine.beams){const ball=engine.balls.find(b=>b.id===beam.owner&&b.hp>0);if(!ball)continue;
        if(engine.time>beam.expires+1e-9){this.laserOutcome(ball,engine,beam.touched);continue;}
        const progress=clamp((engine.time-beam.started)/beam.duration,0,1);beam.angle=beam.baseAngle+beam.sweep*progress;
        if(beam.pulses<6&&engine.time+1e-9>=beam.nextPulse){beam.pulses++;beam.nextPulse+=.12;const ray=G.World.ray(ball,beam.angle);
          for(const target of engine.balls)if(G.World.enemy(ball,target,engine)&&target.hp>0&&!G.Ghost.phased(target)&&(beam.hitCounts[target.id]||0)<6&&G.World.distanceToRay(ray,target)<=target.radius+beam.width){const beamFirst=!beam.hitCounts[target.id]&&!beam.initialIds?.includes(target.id);beam.hitCounts[target.id]=(beam.hitCounts[target.id]||0)+1;beam.touched=true;engine.pendingAttacks.push({source:ball,target,raw:beam.raw/6,kind:'laser',adaptiveId:beam.adaptiveId,angle:beam.angle,push:35,beamFirst,beamId:beam.id});}
          for(const trap of [...engine.traps])if(G.World.enemy(ball,trap.owner,engine)&&trap.armedAt<=engine.time&&trap.expires>=engine.time&&G.World.distanceToRay(ray,trap)<=trap.radius+beam.width){G.World.clearTrap(trap,ball,engine);G.Adaptive?.good(ball,beam.adaptiveId);beam.touched=true;}
        }live.push(beam);
      }engine.beams=live;
    },
    laserReceive(ball,hit,engine){const r=ball.role;if(hit.kind==='contact'&&hit.actual+hit.blocked>0&&!ball.laser&&engine.time>=r.coolingUntil&&engine.time>=r.disruptedUntil){r.capacitor=Math.max(0,r.capacitor-.14);r.disruptedUntil=engine.time+1.5;engine.signal(ball,'电容震荡 −14%','miss');}},
    reflectorUpdate(ball,dt,engine){
      if(engine.state!=='running'||G.Temporal.silenced(ball,engine)&&!G.DefenseArcana?.guardActive(ball,engine))return;const s=ball.stance,r=ball.role,t=engine.time,awake=G.Awakening.active(ball);
      r.stanceDamage??=0;r.predictReady??=false;r.predictiveActive??=false;r.predictions??=0;
      if(r.counterRelease>0){const enemy=G.World.targetFor(ball,engine);if(enemy&&t<r.counterFireAt-.08)r.counterAngle=G.Aim.track(ball,enemy,engine,'counter',440,Math.max(0,r.counterFireAt-t),7,dt);if(enemy&&t+1e-9>=r.counterFireAt){G.World.counter(ball,engine,r.counterRelease,r.counterAngle);this.effect(ball,engine,'mirrorRelease',ball,r.counterAngle);r.counterRelease=0;r.counterFireAt=0;}}
      if(s.phase==='active'&&t+1e-9>=s.until){G.Adaptive?.close(ball,r.stanceAdaptiveId);s.phase='rest';r.mirrors=0;r.predictiveActive=false;r.predictReady=awake&&r.stanceDamage<=1e-9;if(r.predictReady)engine.signal(ball,'镜鉴就绪 · 下次预判','ready');if(s.stored>0&&ball.hp>0){r.counterRelease=s.stored;r.counterFireAt=t+.18;const target=G.World.targetFor(ball,engine);if(target){r.aimTracks??={};r.aimTracks.counter={angle:Math.atan2(target.y-ball.y,target.x-ball.x),tick:-1};r.counterAngle=G.Aim.track(ball,target,engine,'counter',440,.18,7,dt);}engine.signal(ball,'碎镜蓄势','mirrorAim');}s.stored=0;}
      if(G.Temporal.silenced(ball,engine))return;
      if(awake&&s.phase!=='active'&&(r.predictReady||G.DefenseArcana?.predictionReady(ball,engine))&&!G.Temporal.silenced(ball,engine)){const threat=this.reflectorThreat(ball,engine);if(threat){this.reflectorOpen(ball,engine,threat);return;}}
      if(s.phase==='warning'&&t+1e-9>=s.until)this.reflectorOpen(ball,engine);
      if(t+1e-9>=s.next&&s.phase!=='active'&&!r.predictReady){s.phase='warning';s.until=t+ball.def.stanceWarning;s.next=t+ball.def.stancePeriod;engine.sound('ready',ball.x);}
    },
    reflectorOpen(ball,engine,threat=''){
      if(threat)G.DefenseArcana?.consumePrediction(ball,engine);
      const s=ball.stance,r=ball.role,awake=G.Awakening.active(ball);s.phase='active';s.until=engine.time+(awake?3.2:ball.def.stanceDuration)+(threat?0:G.Adaptive?.duration(ball,'reflector')||0);r.stanceAdaptiveId=G.Adaptive?.begin(ball,'reflector',engine);s.stored=0;r.mirrors=0;r.stanceDamage=0;r.predictReady=false;r.predictiveActive=!!threat;
      if(threat){s.next=engine.time+ball.def.stancePeriod;r.predictions=(r.predictions||0)+1;this.effect(ball,engine,'mirrorCatch',ball,Math.atan2(ball.vy,ball.vx),.28);engine.ring(ball.x,ball.y,ball.def.color,46);}
      engine.signal(ball,threat?'预判反击 · '+threat:'镜面姿态','stance');
    },
    reflectorThreat(ball,engine){
      const t=engine.time,soon=at=>Number.isFinite(at)&&at>0&&at>=t-1e-9&&at-t<=.1;
      const approaching=(object,horizon=.12)=>{const vx=(object.vx??Math.cos(object.angle)*object.speed)-ball.vx,vy=(object.vy??Math.sin(object.angle)*object.speed)-ball.vy,dx=object.x-ball.x,dy=object.y-ball.y,r=ball.radius+object.radius+1,cc=dx*dx+dy*dy-r*r,aa=vx*vx+vy*vy,bb=dx*vx+dy*vy;
        if(cc<=0)return true;if(bb>=0||aa<1e-9)return false;const disc=bb*bb-aa*cc;if(disc<0)return false;const at=(-bb-Math.sqrt(disc))/aa;return at>=0&&at<=horizon;};
      for(const enemy of engine.balls){if(!G.World.enemy(ball,enemy,engine)||enemy.hp<=0)continue;
        const key=ball.id<enemy.id?ball.id+':'+enemy.id:enemy.id+':'+ball.id,closing=(enemy.vx-ball.vx)*(enemy.x-ball.x)+(enemy.vy-ball.vy)*(enemy.y-ball.y)<0;
        if(!G.Ghost.phased(enemy)&&closing&&!engine.pairs.get(key)?.touching&&approaching(enemy))return '迎撞';
        if(G.Temporal.silenced(enemy,engine))continue;
        const targeted=G.World.targetFor(enemy,engine)?.id===ball.id,r=enemy.role,c=enemy.character,a=enemy.awakening;
        if(soon(enemy.laser?.fireAt)){const p=G.Awakening.predict(ball,Math.max(0,enemy.laser.fireAt-t)),origin=G.Awakening.predict(enemy,Math.max(0,enemy.laser.fireAt-t));if(G.World.distanceToRay(G.World.ray(origin,enemy.laser.angle),p)<=ball.radius+8)return '锁线将至';}
        if(targeted&&(soon(r.salvoFireAt)||soon(r.sniperFireAt)||soon(a.chargeUntil)||soon(enemy.temporal.castAt)||soon(r.chainWarning)&&Math.hypot(enemy.x-ball.x,enemy.y-ball.y)<=235))return '预警结束';
        if(soon(r.shieldFireAt)&&Math.hypot(enemy.x-ball.x,enemy.y-ball.y)<=255&&G.World.distanceToRay(G.World.ray(enemy,r.shieldAngle),ball)<=ball.radius+60)return '冲击将至';
        if(targeted&&['warning','overloadWarning'].includes(enemy.magnetic.phase)&&soon(enemy.magnetic.until)&&Math.hypot(enemy.x-ball.x,enemy.y-ball.y)<=enemy.def.magnetRange)return '磁极将至';
        if(soon(c.spreadFireAt)&&engine.pools.some(p=>p.owner===enemy.id&&p.expires>t&&Math.hypot(p.x-ball.x,p.y-ball.y)<=p.radius+18+ball.radius))return '毒波将至';
      }
      for(const p of [...engine.projectiles,...engine.timeClocks])if(G.World.enemy(p.owner,ball,engine)&&(p.expires===undefined||p.expires>=t)&&approaching(p))return '实体将至';
      for(const claw of engine.demonWorld?.claws||[])if(G.World.enemy(claw.owner,ball,engine)&&claw.target===ball.id&&soon(claw.at)){const p=G.Awakening.predict(ball,Math.max(0,claw.at+claw.flight-t));if(Math.hypot(p.x-claw.endX,p.y-claw.endY)<=ball.radius+13)return '魔爪将至';}
      for(const light of engine.holyWorld?.lights||[])if(!light.landed&&G.World.enemy(light.owner,ball,engine)&&soon(light.at)){const p=G.Awakening.predict(ball,Math.max(0,light.at-t));if(Math.hypot(p.x-light.x,p.y-light.y)<=light.radius+ball.radius)return '圣光将至';}
      for(const mine of engine.traps)if(G.World.enemy(mine.owner,ball,engine)&&mine.expires>t&&mine.armedAt<=t+.12&&approaching({...mine,vx:0,vy:0}))return '节点将至';
      return '';
    },
    trapPosition(ball,engine){return {x:ball.x,y:ball.y};},
    reflectorReceive(ball,hit,engine){if(ball.stance.phase!=='active'||hit.actual<=0)return;const r=ball.role;r.counterAngle=hit.incomingAngle??(hit.impact?Math.atan2(-hit.impact.ny,-hit.impact.nx):Math.atan2(hit.source.y-ball.y,hit.source.x-ball.x));ball.stance.stored=Math.min(8*engine.heatMultiplier,ball.stance.stored+hit.actual*.25);},
    intercept(shot,target,engine){return null;},
    netLinks(engine){
      if(G.Mines)return G.Mines.links(engine);
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
      if(G.Mines){G.Mines.update(engine);return;}
      engine.trapChains=engine.trapChains.filter(c=>c.until>=engine.time);
      engine.traps=engine.traps.filter(m=>{const owner=engine.balls.find(b=>b.id===m.owner&&b.hp>0);if(!owner)return false;if(engine.time>m.expires&&!Number.isFinite(m.detonateAt)){G.Recovery.refund(owner,engine,'nextTrap',.4,'节点未触发');return false;}if(!m.armSound&&engine.time+1e-9>=m.armedAt){m.armSound=true;engine.sound('netArm',m.x);}return true;});
      const startedOwners=new Set();
      for(const mine of engine.traps){if(startedOwners.has(mine.owner)||Number.isFinite(mine.detonateAt)||engine.time+1e-9<mine.armedAt)continue;const owner=engine.balls.find(b=>b.id===mine.owner),target=engine.balls.find(b=>G.World.enemy(mine.owner,b,engine)&&b.hp>0&&!G.Ghost.phased(b)&&Math.hypot(b.x-mine.x,b.y-mine.y)<=b.radius+mine.radius);if(target){this.startMine(mine,owner,engine);startedOwners.add(owner.id);}}
      for(const link of this.netLinks(engine)){const owner=engine.balls.find(b=>b.id===link.a.owner),target=engine.balls.find(b=>G.World.enemy(owner,b,engine)&&b.hp>0&&!G.Ghost.phased(b)&&this.crossesLink(b,link));if(!target||startedOwners.has(owner.id))continue;const mine=Math.hypot(target.x-link.a.x,target.y-link.a.y)<=Math.hypot(target.x-link.b.x,target.y-link.b.y)?link.a:link.b;if(Number.isFinite(mine.detonateAt))continue;this.startMine(mine,owner,engine);startedOwners.add(owner.id);owner.role.netTriggers++;engine.signal(owner,'感应线触发','netTrigger');engine.effects.push({kind:'arc',x:link.a.x,y:link.a.y,endX:link.b.x,endY:link.b.y,color:owner.def.color,age:0,life:.2});}
      const due=engine.traps.filter(m=>Number.isFinite(m.detonateAt)&&engine.time+1e-9>=m.detonateAt).sort((a,b)=>a.detonateAt-b.detonateAt||a.id-b.id),removed=new Set();
      for(const mine of due){const owner=engine.balls.find(b=>b.id===mine.owner&&b.hp>0),chain=engine.trapChains.find(c=>c.id===mine.chainId);removed.add(mine.id);if(!owner||!chain)continue;
        for(const target of engine.balls)if(G.World.enemy(owner,target,engine)&&target.hp>0&&Math.hypot(target.x-mine.x,target.y-mine.y)<=target.radius+(mine.blastRadius||mine.radius)){
          const count=chain.hitCounts[target.id]||0;if(count>=2)continue;chain.hitCounts[target.id]=count+1;engine.pendingAttacks.push({source:owner,target,raw:mine.raw*(count?.55:1),kind:'trap',point:{x:mine.x,y:mine.y},chainId:chain.id,chainFinal:count===1});
        }
        G.Spectacle?.emit(engine,owner,'detonate',{point:mine,radius:mine.blastRadius||45,life:.45,cooldown:0,sound:false});engine.ring(mine.x,mine.y,mine.color,mine.blastRadius||45);engine.burst(mine.x,mine.y,mine.color,12);engine.sound('chainBlast',mine.x);engine.impact(mine.x,mine.y,mine.color,1.6);this.effect(owner,engine,'groundBurst',mine,0,.5);
        if(mine.chainRange)for(const other of engine.traps)if(other.owner===owner.id&&!removed.has(other.id)&&!Number.isFinite(other.detonateAt)&&other.chainRange&&other.armedAt<=engine.time+1e-9&&other.expires>=engine.time&&Math.hypot(other.x-mine.x,other.y-mine.y)<=mine.chainRange){other.detonateAt=engine.time+.09;other.chainId=chain.id;other.depth=(mine.depth||0)+1;other.expires=Math.max(other.expires,other.detonateAt+.01);engine.effects.push({kind:'arc',x:mine.x,y:mine.y,endX:other.x,endY:other.y,color:mine.color,age:0,life:.15});}
      }engine.traps=engine.traps.filter(m=>!removed.has(m.id));
    },
    status(ball,engine){const r=ball.role,t=engine.time;
      if(ball.type==='normal')return [{label:'追击CD',value:Math.max(0,(r.nextPursuit||0)-t).toFixed(1)+'s'},{label:'追击',value:r.pursuitUntil>t?'回身':'待擦肩'},{label:'拳势',value:ball.charges+'/3'},...G.Recovery.pressureStatus(ball),{label:'拳劲',value:G.Awakening.active(ball)?(3.5*engine.heatMultiplier).toFixed(1):'未觉醒'}];
      if(ball.type==='vampire')return [{label:'汲取',value:Math.round(ball.def.lifesteal*100)+'%'},{label:'血能',value:r.blood.toFixed(1)+'/8'},{label:'血契',value:r.chainWarning?'预警':ball.awakening.chainActive?(ball.awakening.chainUntil-t).toFixed(1)+'s':G.Awakening.active(ball)?Math.max(0,ball.awakening.nextCast-t).toFixed(1)+'s':'未觉醒'},{label:'链伤',value:(1.05*engine.heatMultiplier).toFixed(1)+'/次'},{label:'追猎',value:G.VampireHunt?G.VampireHunt.status(ball,engine):'未觉醒'},{label:'已回复',value:ball.stats.healing.toFixed(1)},...G.Recovery.refundStatus(ball)];
      if(ball.type==='shield')return [{label:'护盾',value:ball.shield.toFixed(1)},{label:'充能',value:Math.max(0,ball.nextShield-t).toFixed(1)+'s'},{label:'盾时',value:Math.max(0,ball.shieldUntil-t).toFixed(1)+'s'},{label:'压力',value:r.pressure.toFixed(1)+'/8'},...G.Recovery.pressureStatus(ball),{label:(r.shieldRelease||r.shieldReserve)?'锁定':'波伤',value:(r.shieldRelease||r.shieldReserve)?Math.max(0,r.shieldFireAt-t).toFixed(1)+'s':G.Awakening.active(ball)?((r.pressure*.7+ball.shield*.5)*engine.heatMultiplier).toFixed(1):'未觉醒'}];
      if(ball.type==='ranger'&&G.Ranger)return G.Ranger.status(ball,engine);
      if(ball.type==='ranger')return [{label:'弹/重伤',value:G.Combat.attackValue(ball,engine,this.rangerDamage(ball),'shot').toFixed(1)+'/'+(7.8*engine.heatMultiplier).toFixed(1)},{label:'弹匣',value:r.ammo+'/3'},{label:'装填',value:Math.max(0,r.reloadUntil-t).toFixed(1)+'s'},{label:'校准',value:r.calibration+'/'+ball.def.calibrationCap},{label:'枪阵',value:r.reloadUntil>t?'装填':r.salvoFireAt>t?'展开':r.overload?'突击':'普通'},{label:'散布',value:((G.Aim?.spread(ball,G.World.targetFor(ball,engine)||ball,'ranger')||0)*180/Math.PI).toFixed(1)+'°'}];
      if(ball.type==='laser')return [{label:'主炮',value:G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?22.2*.88:ball.def.laserDamage,'laser').toFixed(1)},{label:'电容',value:Math.round(r.capacitor*100)+'%'},{label:'阶段',value:engine.beams.some(beam=>beam.owner===ball.id)?'扫射':ball.laser?ball.laser.locked?'锁线':'瞄准':r.coolingUntil>t?'散热':'充能'},{label:'散热',value:Math.max(0,r.coolingUntil-t).toFixed(1)+'s'},{label:'余波',value:G.Awakening.active(ball)?(22.2*.28*engine.heatMultiplier).toFixed(1):'未觉醒'},...G.Recovery.refundStatus(ball)];
      if(ball.type==='reflector')return [{label:'姿态',value:r.predictiveActive?'预判中':{rest:'空窗',warning:'预警',active:'反击'}[ball.stance.phase]},{label:'即时返还',value:ball.stance.phase==='active'?(G.Awakening.active(ball)?60:75)+'%':'0%'},{label:'蓄能',value:(ball.stance.stored+r.counterRelease).toFixed(1)},{label:'姿态CD',value:r.predictReady?'预判待机':Math.max(0,(ball.stance.phase==='rest'?ball.stance.next:ball.stance.until)-t).toFixed(1)+'s'},{label:'反击命中',value:ball.stats.countersHit}];
      if(ball.type==='trapper')return [{label:'雷伤',value:G.Combat.attackValue(ball,engine,G.Awakening.trapOptions(ball).damage,'trap').toFixed(1)},{label:'节点',value:engine.traps.filter(m=>m.owner===ball.id).length+'/'+G.Awakening.trapOptions(ball).cap},{label:'布置',value:ball.nextTrap<=t&&G.Trapper&&!G.Trapper.placement(ball,engine,ball.def.trapRadius)?'移位待布':Math.max(0,ball.nextTrap-t).toFixed(1)+'s'},{label:'捕获',value:engine.traps.filter(m=>m.owner===ball.id&&m.captureUntil).length},{label:'置换',value:ball.mechanism?Math.max(0,ball.mechanism.nextSwap-t).toFixed(1)+'s':'—'},{label:'扫线',value:G.Awakening.active(ball)?this.netLinks(engine).some(l=>l.dynamic&&l.a.owner===ball.id)?'连接':'等待节点':'未觉醒'},...G.Recovery.refundStatus(ball)];
      return [];
    }
  };
})(typeof window!=='undefined'?window:globalThis);
