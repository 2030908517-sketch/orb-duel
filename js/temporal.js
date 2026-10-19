(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants;
  // Only the affected actor's skill clock slows. Debuffs and released objects use world time.
  const timers={mechanism:['nextSwap'],hunt:['nextCast','until'],
    ball:['nextShot','nextTrap','nextPool','nextLaser','nextShield','shieldUntil'],
    role:['chainWarning','shieldFireAt','salvoFireAt','counterFireAt','reloadUntil','coolingUntil','disruptedUntil','nextSpit','sniperLockAt','sniperFireAt','nextPursuit','pursuitUntil','jetNext'],
    character:['recoveryUntil','nextSpread','spreadFireAt'],
    awakening:['nextCast','nextPulse','chargeUntil','dashUntil','chainUntil'],
    demon:['nextClaw','nextGate'],holy:['triangleReady','nextJudgement','chargeUntil','nextWard'],stance:['next','until'],temporal:['nextDomain','nextClock','castAt'],magnetic:['nextPulse','nextOverload','until'],ghost:['nextPhase','until','nextLunge','chargeUntil','lungeUntil'],charge:['nextGain','nextDischarge','nextForm'],stellar:['nextNova','nextLaunch'],cosmic:['nextGain','nextDischarge','nextForm','nextNova','nextLaunch','nextStrike','nextOrbit','nextAwake','nextCharge','nextGuard','launchAt']
  };
  G.Temporal={
    releaseControl(ball){if(['reflector','shield'].includes(ball.type))return;const rate=ball.temporal.rate||1;ball.vx/=rate;ball.vy/=rate;ball.temporal.rate=ball.temporal.cooldownRate=1;},
    controlImmune(ball,engine){return G.World.absent(ball,engine)||!!G.VenomArcana?.state(ball)?.active||!!G.Arcana?.busy(ball)&&!['reflector','shield'].includes(ball.type);},
    silenced(ball,engine){return !this.controlImmune(ball,engine)&&(ball.temporal?.silenceUntil||0)>engine.time+1e-9;},
    domain(ball,engine,x,y,warning=.25,custom=null){
      const spec=custom||ball.def;
      const owned=engine.timeDomains.filter(d=>d.owner===ball.id);
      if(owned.length>=2)engine.timeDomains=engine.timeDomains.filter(d=>d!==owned[0]);
      engine.timeDomains.push({id:engine.nextWorldId++,owner:ball.id,x,y,radius:spec.domainRadius,rate:spec.timeRate,cooldownRate:spec.cooldownRate??spec.timeRate,armedAt:engine.time+warning,nextPulse:engine.time+warning+.5,expires:engine.time+warning+spec.domainDuration,color:ball.def.color,...(custom?{damage:custom.domainDamage,noReflect:true}:{})});
      ball.stats.domainsCreated++;engine.sound('timeField',x);engine.log(engine.label(ball)+'展开时间领域 · 运动减速80% · CD减速30% / 持续侵蚀');
    },
    interrupt(ball,engine){
      const huntCasting=G.VampireHunt?.busy(ball);G.Adaptive?.interrupt(ball,engine);G.VampireHunt?.finish(ball,engine);const a=ball.awakening,r=ball.role,c=ball.character,t=ball.temporal;
      const demonCasting=ball.type==='demon'&&G.Demon?.interrupt(ball,engine);
      const arcanaCasting=G.Arcana?.interrupt(ball,engine,'silence');
      const stellarCasting=G.Stellar?.interrupt(ball,engine),chargeCasting=G.Charge?.flowing(ball);
      const casting=!!(huntCasting||arcanaCasting||stellarCasting||chargeCasting||ball.cosmic&&(ball.cosmic.satellites.length||engine.cosmicWorld.strikes.some(v=>v.owner===ball.id)||engine.cosmicWorld.binary.some(v=>v.owner===ball.id))||demonCasting||ball.laser||r.pursuitUntil>engine.time||a.chargeUntil>engine.time||a.chainActive||r.chainWarning||r.salvoFireAt||r.sniperFireAt||r.shieldFireAt||r.counterRelease||c.spreadFireAt||t.castAt||ball.holy?.chargeUntil>engine.time||engine.holyWorld?.lights.some(l=>l.owner===ball.id&&l.kind==='judgement'&&!l.landed)||ball.ghost?.phase==='warning'||ball.magnetic?.phase!=='rest'||G.Awakening.dashing(ball,engine)||ball.stance.phase!=='rest'||engine.beams.some(b=>b.owner===ball.id));
      // Consumed resources stay consumed; silence cannot create a free recast/refund.
      if(ball.laser){ball.laser=null;r.capacitor=0;r.coolingUntil=Math.max(r.coolingUntil,engine.time+1.1);}
      a.chargeUntil=0;a.chainActive=false;a.chainUntil=0;a.nextPulse=Infinity;r.chainWarning=0;
      if(ball.motionSpeed&&!G.Arcana?.customMove(ball)&&ball.type==='accelerator'){G.Awakening.finishDash(ball,engine,true);}else if(ball.motionSpeed&&!G.Arcana?.customMove(ball)){ball.motionSpeed=0;a.dashUntil=engine.time;a.stopAfterContact=false;ball.inertia=0;G.Physics.normalizeSpeed(ball);}
      if(ball.type==='ranger')G.Ranger?.interrupt(ball,engine);
      if(r.salvoFireAt){r.salvoFireAt=0;r.overload=false;}
      r.shieldRelease=0;r.shieldReserve=0;r.shieldFireAt=0;if(!G.DefenseArcana?.guardActive(ball,engine)){r.counterRelease=0;r.counterFireAt=0;}
      if(ball.stance.phase!=='rest'&&!G.DefenseArcana?.guardActive(ball,engine)){ball.stance.phase='rest';r.mirrors=0;ball.stance.stored=0;r.predictiveActive=false;}
      c.spreadFireAt=0;if(t.castAt){t.castAt=0;t.nextClock=Math.max(t.nextClock,engine.time+(ball.def.clockPeriod||8.5));}
      if(ball.type==='magnet')G.Magnet.interrupt(ball,engine);
      if(ball.type==='ghost')G.Ghost.interrupt(ball);G.Cosmic?.interrupt(ball,engine);if(chargeCasting)G.Charge.end(ball,engine,true);
      if(ball.type==='holy')G.Holy.interrupt(ball,engine);if(ball.type==='normal')G.Pursuit?.interrupt(ball);
      engine.beams=engine.beams.filter(b=>b.owner!==ball.id);
      // Remove following cast telegraphs, but preserve impact visuals and detached weapons.
      const warnings=['shieldGather','gunDeploy','mirrorAim','toxinGather'];
      engine.effects=engine.effects.filter(e=>e.owner!==ball.id||!warnings.includes(e.style));
      if(casting){ball.stats.interruptions++;engine.signal(ball,'施法中断','timeInterrupt');}
      return casting;
    },
    silence(ball,source,engine,duration=source.def.silenceDuration){
      if(ball.hp<=0||this.controlImmune(ball,engine)||G.Awakening.dashing(ball,engine)||G.Ghost.phased(ball))return false;
      const waiting=this.waitingAttacks(ball,engine);
      ball.temporal.silenceUntil=Math.max(ball.temporal.silenceUntil,engine.time+duration);
      source.stats.silences++;this.interrupt(ball,engine);
      for(const [state,key] of waiting){state[key]=Math.max(engine.time,state[key])+1;}
      if(ball.type==='laser'&&waiting.length)ball.nextLaser=ball.role.coolingUntil+(1-ball.role.capacitor)*(G.Awakening.active(ball)?3.6:4.2);
      if(waiting.length){ball.stats.delaysAdded+=1;engine.float(ball.x,ball.y+36,'攻击延后 +1s','#ede5ff');}
      engine.sound('timeSilence',ball.x);engine.float(ball.x,ball.y-38,'沉默','#ede5ff');
      return true;
    },
    waitingAttacks(ball,engine){
      const t=engine.time,a=ball.awakening,r=ball.role,c=ball.character,s=ball.temporal,m=ball.magnetic,waiting=[];
      const add=(state,key,charging=false)=>{if(Number.isFinite(state[key])&&(state[key]>t+1e-9||charging))waiting.push([state,key]);};
      if(ball.charge){add(ball.charge,'nextDischarge');add(ball.charge,'nextForm');}if(ball.stellar){add(ball.stellar,'nextNova',ball.stellar.phase!=='orbit');add(ball.stellar,'nextLaunch');}if(ball.cosmic){add(ball.cosmic,'nextStrike');add(ball.cosmic,'nextAwake');}if(ball.type==='demon'&&ball.demon)add(ball.demon,G.Awakening.active(ball)?'nextGate':'nextClaw');
      if(ball.type==='normal')add(r,'nextPursuit',r.pursuitUntil>t);
      if(ball.type==='ranger'){add(ball,'nextShot',r.salvoFireAt>t||r.sniperFireAt>t);add(r,'reloadUntil');}
      if(ball.type==='boomerang')add(ball,'nextShot');
      if(ball.type==='trapper'){add(ball,'nextTrap');if(ball.mechanism)add(ball.mechanism,'nextSwap');}
      if(ball.type==='venom'){add(ball.role,'nextSpit');add(ball,'nextPool');add(c,'nextSpread',c.spreadFireAt>t);}
      if(ball.hunt)add(ball.hunt,'nextCast',G.VampireHunt?.busy(ball));
      if(ball.type==='vampire'||ball.type==='accelerator')add(a,'nextCast',a.chargeUntil>t||!!r.chainWarning);
      if(ball.type==='reflector')add(ball.stance,'next',ball.stance.phase==='warning'||r.counterRelease>0);
      if(ball.type==='shield')add(ball,'nextShield',r.shieldFireAt>t);
      if(ball.type==='time'){add(s,'nextDomain');add(s,'nextClock',s.castAt>t);}
      if(ball.type==='magnet'){add(m,'nextPulse',m.phase==='warning');add(m,'nextOverload',m.phase==='overloadWarning');}
      if(ball.type==='holy'){add(ball.holy,'nextJudgement',ball.holy.chargeUntil>t);add(ball.holy,'nextWard');}
      if(ball.type==='ghost')add(ball.ghost,'nextPhase',ball.ghost.phase==='warning');
      if(ball.type==='laser')add(r,'coolingUntil',!!ball.laser||r.capacitor>0||t>=r.coolingUntil);
      return waiting;
    },
    erode(engine){
      for(const d of engine.timeDomains){if(engine.time+1e-9<d.nextPulse||engine.time>d.expires+1e-9)continue;d.nextPulse+=.5;
        const owner=engine.balls.find(b=>b.id===d.owner&&b.hp>0);if(!owner)continue;
        for(const target of engine.balls){const key=owner.id+':'+target.id;
          if(!G.World.enemy(owner,target,engine)||!G.World.targetable(target,engine)||G.Ghost.phased(target)||Math.hypot(target.x-d.x,target.y-d.y)>d.radius+target.radius||engine.time+1e-9<(engine.domainHitClocks[key]||0))continue;
          engine.domainHitClocks[key]=engine.time+.5;engine.pendingAttacks.push({source:owner,target,raw:(d.damage??owner.def.domainDamage)*engine.heatMultiplier,kind:'timeErode',adaptiveId:d.adaptiveId,noReflect:!!d.noReflect});
          engine.effects.push({kind:'timeTick',x:target.x,y:target.y,color:d.color,age:0,life:.22});
        }
      }
    },
    explode(clock,ball,engine){
      const spec=clock.castSpec||ball.def;this.domain(ball,engine,clock.x,clock.y,0,clock.castSpec||null);
      if(engine.timeDomains.at(-1))engine.timeDomains.at(-1).adaptiveId=clock.adaptiveId;let hit=false;
      for(const target of engine.balls)if(G.World.enemy(ball,target,engine)&&G.World.targetable(target,engine)&&Math.hypot(target.x-clock.x,target.y-clock.y)<=spec.blastRadius+target.radius&&(!G.ArenaWalls||G.ArenaWalls.clear(clock,target,engine))){
        engine.pendingAttacks.push({source:ball,target,raw:clock.raw,kind:'timeBlast',adaptiveId:clock.adaptiveId,point:{x:clock.x,y:clock.y},noReflect:!!clock.noReflect});
        if(this.silence(target,ball,engine,spec.silenceDuration)){ball.stats.clocksHit++;hit=true;}
      }
      engine.effects.push({kind:'timeBurst',x:clock.x,y:clock.y,color:ball.def.color,age:0,life:.5,radius:spec.blastRadius});
      engine.sound('clockBlast',clock.x);engine.burst(clock.x,clock.y,ball.def.color,18);engine.impact(clock.x,clock.y,ball.def.color,hit?1.8:1);
      if(hit)engine.hitStop(.045);
    },
    moveClocks(engine,dt){
      const live=[];
      for(const clock of engine.timeClocks){const ball=engine.balls.find(b=>b.id===clock.owner&&b.hp>0);if(!ball)continue;
        const remaining=Math.max(0,clock.range-clock.travel),distance=Math.min(clock.speed*dt,remaining),nx=Math.cos(clock.angle),ny=Math.sin(clock.angle),ox=clock.x,oy=clock.y;
        // The wall is also a range limit; clocks never leave the arena.
        const bounds=engine.arcanaWorld?.defense?.fortress?.bounds;
        const wallX=nx>1e-9?((bounds?.right??C.width)-clock.radius-ox)/nx:nx< -1e-9?((bounds?.left||0)+clock.radius-ox)/nx:Infinity;
        const wallY=ny>1e-9?((bounds?.bottom??C.height)-clock.radius-oy)/ny:ny< -1e-9?((bounds?.top||0)+clock.radius-oy)/ny:Infinity;
        let travel=Math.max(0,Math.min(distance,wallX,wallY,G.ArenaWalls?.hit(ox,oy,nx,ny,clock.radius,engine).distance??Infinity,engine.mode==='2v2'?G.Team.rayLimit(ox,oy,nx,ny,clock.radius,engine.obstacles):Infinity)),contact=false,contactTarget=null;
        // Earliest swept contact avoids tunnelling and explodes at the impact, not beyond it.
        for(const target of engine.balls){if(!G.World.enemy(ball,target,engine)||!G.World.targetable(target,engine))continue;
          if(G.Ghost.phased(target))continue;
          const dx=ox-target.x,dy=oy-target.y,r=target.radius+clock.radius,b=dx*nx+dy*ny,discriminant=b*b-(dx*dx+dy*dy-r*r);
          const enter=dx*dx+dy*dy<=r*r?0:discriminant>=0?-b-Math.sqrt(discriminant):Infinity;
          if(enter>=0&&enter<=travel&&(!G.ArenaWalls||G.ArenaWalls.clear({x:ox,y:oy},target,engine))){travel=enter;contact=true;contactTarget=target;}
        }
        clock.x=ox+nx*travel;clock.y=oy+ny*travel;clock.travel+=travel;
        if(contactTarget){const reflected=G.Roles.intercept(clock,contactTarget,engine);if(reflected){if(!reflected.absorbed)live.push(reflected);continue;}}
        if(contact||travel<distance-1e-9||clock.travel>=clock.range-1e-9)this.explode(clock,ball,engine);else live.push(clock);
      }
      engine.timeClocks=live;
    },
    slowTimers(ball,engine,dt){
      if(this.controlImmune(ball,engine))return;
      const lost=dt*(1-ball.temporal.rate),cdLost=dt*(1-(ball.temporal.cooldownRate??ball.temporal.rate));if(lost<=0&&cdLost<=0)return;
      for(const [group,keys] of Object.entries(timers)){
        const state=group==='ball'?ball:ball[group];if(!state)continue;
        for(const key of keys)if(Number.isFinite(state[key])&&state[key]>0&&state[key]>engine.time-dt+1e-9)state[key]+=['jetNext','nextSwap','nextShot','nextTrap','nextPool','nextLaser','nextShield','reloadUntil','coolingUntil','nextSpit','nextPursuit','nextSpread','nextCast','nextClaw','nextGate','triangleReady','nextJudgement','nextWard','next','nextDomain','nextClock','nextPulse','nextOverload','nextPhase','nextGain','nextDischarge','nextForm','nextNova','nextLaunch','nextStrike','nextOrbit','nextAwake','nextCharge','nextGuard'].includes(key)&&!(group==='awakening'&&key==='nextPulse')?cdLost:lost;
      }
      G.VampireHunt?.slow(ball,lost);G.Demon?.slow(ball,engine,lost);G.Cosmic?.slow(ball,engine,lost);G.Stellar?.slow(ball,engine,lost);G.Arcana?.slow(ball,engine,lost);
      if(ball.laser)for(const key of ['fireAt','trackUntil'])if(ball.laser[key]>engine.time-dt+1e-9)ball.laser[key]+=lost;
      if(ball.awakening.chainActive)ball.awakening.chainStartedAt+=lost;
      if(ball.motionSpeed)ball.awakening.dashStartedAt+=lost;
      for(const beam of engine.beams)if(beam.owner===ball.id){beam.started+=lost;beam.expires+=lost;beam.nextPulse+=lost;}
    },
    begin(engine,dt){
      engine.timeDomains=engine.timeDomains.filter(d=>d.expires>engine.time&&engine.balls.some(b=>b.id===d.owner&&b.hp>0));
      this.moveClocks(engine,dt);
      this.erode(engine);
      for(const ball of engine.balls){
        if(engine.mode==='2v2'&&ball.hp<=0)continue;
        const rate=(G.Ghost.phased(ball)||this.controlImmune(ball,engine))?1:engine.timeDomains.reduce((v,d)=>G.World.enemy(d.owner,ball,engine)&&d.armedAt<=engine.time&&Math.hypot(ball.x-d.x,ball.y-d.y)<=d.radius+ball.radius?Math.min(v,d.rate):v,1),old=ball.temporal.rate;ball.temporal.cooldownRate=(G.Ghost.phased(ball)||this.controlImmune(ball,engine))?1:engine.timeDomains.reduce((v,d)=>G.World.enemy(d.owner,ball,engine)&&d.armedAt<=engine.time&&Math.hypot(ball.x-d.x,ball.y-d.y)<=d.radius+ball.radius?Math.min(v,d.cooldownRate??d.rate):v,1);
        if(rate!==old){ball.vx*=rate/old;ball.vy*=rate/old;ball.temporal.rate=rate;G.Physics.limit(ball);}
        if(rate<1)for(const d of engine.timeDomains)if(d.armedAt<=engine.time&&G.World.enemy(d.owner,ball,engine)&&Math.hypot(ball.x-d.x,ball.y-d.y)<=d.radius+ball.radius){const owner=engine.balls.find(b=>b.id===d.owner);if(owner)G.Adaptive?.good(owner,d.adaptiveId);}
        this.slowTimers(ball,engine,dt);
        if(this.silenced(ball,engine)&&ball.shield>0&&engine.time>=ball.shieldUntil){ball.shield=0;ball.role.pressure=0;}
      }
    },
    update(ball,dt,engine){
      if(engine.state!=='running'||this.silenced(ball,engine))return;
      const t=engine.time,s=ball.temporal,target=G.World.targetFor(ball,engine);if(!target)return;const domainAim=G.Aim.point(ball,target,engine,'domain',target,dt);
      if(t+1e-9>=s.nextDomain&&!G.Adaptive?.wait(ball,target,engine,'timeDomain')){const id=G.Adaptive?.begin(ball,'timeDomain',engine);this.domain(ball,engine,domainAim.x,domainAim.y);engine.timeDomains.at(-1).adaptiveId=id;G.Adaptive?.close(ball,id);s.nextDomain=t+ball.def.domainPeriod;}
      if(!G.Awakening.active(ball))return;
      const tracked=G.Aim.track(ball,target,engine,'clock',ball.def.clockSpeed,s.castAt?Math.max(0,s.castAt-t):0,6,dt);
      if(!Number.isFinite(s.nextClock))s.nextClock=t+.6;
      if(s.castAt){
        if(t<s.castAt-.08)s.aim=tracked;
        if(t+1e-9>=s.castAt){const nx=Math.cos(s.aim),ny=Math.sin(s.aim),offset=ball.radius+10;
          const bounds=ball.combatBounds;engine.timeClocks.push({id:engine.nextWorldId++,owner:ball.id,adaptiveId:s.clockAdaptiveId,x:Math.max((bounds?.left||0)+9,Math.min((bounds?.right??C.width)-9,ball.x+nx*offset)),y:Math.max((bounds?.top||0)+9,Math.min((bounds?.bottom??C.height)-9,ball.y+ny*offset)),radius:9,angle:s.aim,speed:ball.def.clockSpeed,range:ball.def.clockRange,travel:0,raw:G.Combat.rollAttack(ball,engine,ball.def.clockDamage,'timeBlast'),color:ball.def.color,started:t});
          G.Adaptive?.close(ball,s.clockAdaptiveId);s.castAt=0;ball.stats.clocksThrown++;engine.sound('clockThrow',ball.x);engine.signal(ball,'零时禁令 · 时钟出手','miss');
        }
      }else if(t+1e-9>=s.nextClock&&!G.Adaptive?.wait(ball,target,engine,'timeClock')){s.clockAdaptiveId=G.Adaptive?.begin(ball,'timeClock',engine);s.aim=tracked;s.castAt=t+.35;s.nextClock=t+ball.def.clockPeriod;engine.sound('clockCharge',ball.x);}
    },
    status(ball,engine){const s=ball.temporal,t=engine.time;return [
      {label:'领域CD',value:Math.max(0,s.nextDomain-t).toFixed(1)+'s'},
      {label:'移/CD缓',value:'80%/30%'},
      {label:'侵蚀/跳',value:(ball.def.domainDamage*engine.heatMultiplier).toFixed(1)},
      {label:'时钟CD',value:G.Awakening.active(ball)?s.castAt>t?'蓄力':Number.isFinite(s.nextClock)?Math.max(0,s.nextClock-t).toFixed(1)+'s':'就绪':'未觉醒'},
      {label:'爆炸伤',value:G.Combat.attackValue(ball,engine,ball.def.clockDamage,'timeBlast').toFixed(1)},
      {label:'沉默时',value:ball.def.silenceDuration+'s'}
    ];}
  };
})(typeof window!=='undefined'?window:globalThis);
