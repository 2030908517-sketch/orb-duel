(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  G.Magnet={
    isFlyer(object){return G.Flyers?G.Flyers.physical(object):['shot','counter','boomerang'].includes(object.mode)||object.range!==undefined;},
    finishAttempt(ball,engine){const m=ball.magnetic,p=m.pullAttempt;if(!p)return;
      if(!p.hit){m.pullBonus=Math.min(.36,p.usedBonus+.12);ball.stats.pullMisses++;engine.signal(ball,'牵引落空 · 下次吸力 +'+Math.round(m.pullBonus*100)+'%','magnetFocus');}
      m.pullAttempt=null;
    },
    settle(ball,engine){if(ball.magnetic.pullAttempt&&engine.time>ball.magnetic.pullAttempt.until+1e-9)this.finishAttempt(ball,engine);},
    touch(a,b,engine){for(const [owner,target] of [[a,b],[b,a]]){const p=owner.magnetic?.pullAttempt;if(p&&p.target===target.id&&p.until>=engine.time){p.hit=true;owner.magnetic.pullBonus=0;}}},
    energy(mass,speed,cap=18){return Math.min(cap,.5*mass*speed*speed/18000);},
    effect(ball,engine,mode,life=.42){engine.effects.push({kind:'magnetPulse',owner:ball.id,x:ball.x,y:ball.y,color:ball.def.color,mode,age:0,life,radius:ball.def.magnetRange});},
    velocity(object,ball,mode,speed){
      const dx=object.x-ball.x,dy=object.y-ball.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;
      const vx=object.vx??Math.cos(object.angle)*object.speed,vy=object.vy??Math.sin(object.angle)*object.speed,radial=vx*nx+vy*ny;
      const desired=mode==='pull'?-speed:speed;
      // Replace the radial component so an opposing cruise velocity cannot erase the kick.
      return {vx:vx+nx*(desired-radial),vy:vy+ny*(desired-radial)};
    },
    flyers(ball,engine,mode,power){
      let count=0;
      for(const shot of [...engine.projectiles,...engine.timeClocks]){
        if(!this.isFlyer(shot)||shot.noMagnet)continue;
        if(Math.hypot(shot.x-ball.x,shot.y-ball.y)>ball.def.magnetRange)continue;
        const v=this.velocity(shot,ball,mode,power*.8),length=Math.hypot(v.vx,v.vy)||1,speed=Math.min(720,length);
        shot.vx=v.vx*speed/length;shot.vy=v.vy*speed/length;shot.speed=speed;
        if(shot.mode==='boomerang')shot.magnetUntil=engine.time+.32;
        if(shot.range!==undefined)shot.angle=Math.atan2(shot.vy,shot.vx);
        engine.effects.push({kind:'link',x:ball.x,y:ball.y,endX:shot.x,endY:shot.y,color:mode==='pull'?'#9cbaff':'#ff97ac',age:0,life:.18});count++;
      }
      ball.stats.flyersBent+=count;return count;
    },
    force(ball,target,engine,mode,power,mark=true,bonus=0){
      if(!target||target.hp<=0||['counterStep','bloodMist'].includes(target.arcana?.phase)||G.Awakening.dashing(target,engine)||G.Ghost.phased(target))return false;
      if(G.Physics.armored(target))return true;
      let v=this.velocity(target,ball,mode,power*(target.temporal?.rate??1));
      if(mode==='pull'&&bonus>0){const aim=G.Aim.adjust(ball,engine,'magnetPull',G.World.aim(target,ball,power)),nx=Math.cos(aim),ny=Math.sin(aim),radial=target.vx*nx+target.vy*ny,retain=1-Math.min(.75,bonus*2),speed=power*(target.temporal?.rate??1);v={vx:nx*speed+(target.vx-nx*radial)*retain,vy:ny*speed+(target.vy-ny*radial)*retain};}
      target.vx=v.vx;target.vy=v.vy;
      target.inertia=Math.max(target.inertia,1.25);target.impactDrag=1.3;G.Physics.limit(target);
      if(mark)target.magneticMark={owner:ball.id,cause:mode,until:engine.time+ball.def.magnetLife,heat:engine.heatMultiplier};
      return true;
    },
    pulse(ball,engine,mode,power,overload=false){
      const pushRound=mode==='push'?G.Adaptive?.begin(ball,'magnetPush',engine):undefined;G.Adaptive?.close(ball,pushRound);
      this.finishAttempt(ball,engine);const m=ball.magnetic,target=G.World.targetFor(ball,engine),bonus=mode==='pull'?m.pullBonus:0;power*=1+bonus;
      if(this.force(ball,target,engine,mode,power,true,bonus)&&mode==='pull'){m.pullBonus=0;m.pullAttempt={target:target.id,until:engine.time+ball.def.magnetLife,hit:false,usedBonus:bonus};}
      if(target?.magneticMark&&mode==='push'){target.magneticMark.adaptiveId=pushRound;const round=G.Adaptive?.round(ball,pushRound);if(round)round.deferUntil=target.magneticMark.until;}if(this.flyers(ball,engine,mode,power)>0)G.Adaptive?.good(ball,pushRound);ball.stats.magnetPulses++;
      this.effect(ball,engine,mode,overload?.55:.42);engine.sound(mode==='pull'?'magnetPull':overload?'magnetReverse':'magnetPush',ball.x);
      engine.signal(ball,overload?mode==='pull'?'极性坍缩 · 强制捕获':'极性反转 · 猛烈弹射':mode==='pull'?'异极相吸':'同极排斥','miss');
      if(mode==='push'){engine.impact(ball.x,ball.y,ball.def.color,overload?2:1.5);engine.burst(ball.x,ball.y,ball.def.color,overload?20:12);}
    },
    update(ball,dt,engine){
      if(engine.state!=='running'||G.Temporal.silenced(ball,engine))return;
      const m=ball.magnetic,t=engine.time,target=G.World.targetFor(ball,engine);if(!target)return;
      if(G.Awakening.active(ball)&&!Number.isFinite(m.nextOverload))m.nextOverload=t+.6;
      if(m.phase==='overloadWarning'&&t+1e-9>=m.until){m.phase='pull';m.until=t+.5;m.anchored=true;ball.vx=ball.vy=0;ball.stats.overloads++;this.pulse(ball,engine,'pull',760,true);}
      if(m.phase==='pull'){
        if(t+1e-9>=m.until){m.phase='rest';m.anchored=false;this.pulse(ball,engine,'push',900,true);m.nextPulse=Math.max(m.nextPulse,t+2);}
        else this.force(ball,target,engine,'pull',760*(1+(m.pullAttempt?.usedBonus||0)),false,m.pullAttempt?.usedBonus||0);
        return;
      }
      if(m.phase==='warning'&&t+1e-9>=m.until){const distance=Math.hypot(target.x-ball.x,target.y-ball.y),mode=distance>ball.def.magnetNear?'pull':'push';m.mode=mode;m.phase='rest';this.pulse(ball,engine,mode,mode==='pull'?ball.def.pullSpeed:ball.def.pushSpeed);return;}
      if(m.phase!=='rest')return;
      if(G.Awakening.active(ball)&&t+1e-9>=m.nextOverload){m.phase='overloadWarning';m.until=t+.35;m.nextOverload=t+ball.def.overloadPeriod;m.nextPulse=Math.max(m.nextPulse,t+1.2);engine.sound('magnetCharge',ball.x);engine.signal(ball,'磁极过载 · 坍缩预警','miss');}
      else if(t+1e-9>=m.nextPulse&&!G.Adaptive?.wait(ball,target,engine,'magnetPush')){m.phase='warning';m.until=t+.28;m.nextPulse=t+ball.def.magnetPeriod;m.mode=Math.hypot(target.x-ball.x,target.y-ball.y)>ball.def.magnetNear?'pull':'push';engine.sound('magnetCharge',ball.x);}
    },
    interrupt(ball,engine){const m=ball.magnetic;m.phase='rest';m.until=0;m.anchored=false;},
    contactPackets(a,b,engine,impact){
      const packets=[];
      for(const [target,source,forward] of [[a,b,impact.aForward],[b,a,impact.bForward]]){
        const mark=target.magneticMark;
        if(!mark||mark.cause!=='pull'||mark.owner!==source.id||mark.until<engine.time)continue;
        target.magneticMark=null;
        if(forward<160)continue;
        packets.push({source,target,raw:this.energy(target.mass,forward,source.def.magnetEnergyCap)*(mark.heat||1),kind:'magneticContact',impact:{nx:target===b?impact.nx:-impact.nx,ny:target===b?impact.ny:-impact.ny},magneticSpeed:forward});
      }
      return packets;
    },
    wall(target,engine){
      const mark=target.magneticMark,w=target.wallContact;if(!mark||!w||mark.until<engine.time)return;
      target.magneticMark=null;const source=engine.balls.find(b=>b.id===mark.owner&&b.hp>0);if(!source||w.speed<160)return;
      const point={x:target.x-w.nx*target.radius,y:target.y-w.ny*target.radius};
      const pullWall=mark.cause==='pull',energy=this.energy(target.mass,w.speed,source.def.magnetEnergyCap);
      engine.pendingAttacks.push({source,target,raw:(pullWall?Math.min(7,energy*.4):energy)*.75*(mark.heat||1),kind:'magneticWall',adaptiveId:mark.adaptiveId,pullWall,damageOrigin:pullWall?'wall':'orb',point,magneticSpeed:w.speed,angle:Math.atan2(w.ny,w.nx)});
    },
    hit(hit,engine){
      if(hit.kind==='timeErode'){hit.source.stats.domainDamage+=hit.actual;if(hit.actual>0)engine.sound('timeErode',hit.target.x);return;}
      if(!['magneticContact','magneticWall'].includes(hit.kind)||hit.actual+hit.blocked<=0||hit.avoided)return;
      if(hit.kind==='magneticContact')hit.source.stats.magneticPullHits++;else{hit.source.stats.magneticWallHits++;if(hit.pullWall)hit.source.stats.magneticPullWallHits++;}
      G.Roles.heavyImpact(hit.source,hit,engine,hit.kind==='magneticWall'?'wallCrack':'kineticHit',hit.pullWall?'magnetGraze':hit.kind==='magneticWall'?'magnetWall':'magnetCrush',0,hit.pullWall?.035:.06);
      engine.signal(hit.source,hit.pullWall?'牵引偏航 · 轻墙撞':hit.kind==='magneticWall'?'磁排斥 · 动能墙撞':'磁吸引 · 动能压碎','miss');
    },
    moveBlade(shot,owner,engine,dt){
      if(!shot.magnetUntil)return false;
      if(engine.time<shot.magnetUntil){
        shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;G.Physics.constrain(shot);
        if(engine.tick%4===0){shot.history.unshift({x:shot.x,y:shot.y});shot.history.length=Math.min(shot.history.length,12);}return true;
      }
      shot.magnetUntil=0;
      // Rejoin an arc at the actual displaced position, retaining hit/mark/catch budgets.
      if(!shot.returning&&engine.time>=shot.turnAt)G.Characters.returnBlade(shot,owner,engine);
      else{const end=shot.returning?G.Awakening.predict(owner,.6):shot.curve.end,duration=shot.returning?.6:clamp(shot.turnAt-engine.time,.18,.6),r=shot.radius;
        shot.curve={start:{x:shot.x,y:shot.y},control:{x:clamp(shot.x+shot.vx*.15,r,C.width-r),y:clamp(shot.y+shot.vy*.15,r,C.height-r)},end:{...end},started:engine.time,duration};if(!shot.returning)shot.turnAt=engine.time+duration;
      }
      return false;
    },
    status(ball,engine){const m=ball.magnetic,t=engine.time,target=G.World.targetFor(ball,engine),distance=target?Math.hypot(target.x-ball.x,target.y-ball.y):0;return [
      {label:'脉冲CD',value:Math.max(0,m.nextPulse-t).toFixed(1)+'s'},
      {label:'极性',value:m.phase==='pull'?'坍缩':distance>ball.def.magnetNear?'吸引':'排斥'},
      {label:'吸力',value:'+'+Math.round((m.pullAttempt?.usedBonus||m.pullBonus)*100)+'%'},
      {label:'过载CD',value:G.Awakening.active(ball)?Math.max(0,m.nextOverload-t).toFixed(1)+'s':'未觉醒'},
      {label:'牵引命中',value:ball.stats.magneticPullHits},
      {label:'墙撞命中',value:ball.stats.magneticWallHits}
    ];}
  };
})(typeof window!=='undefined'?window:globalThis);
