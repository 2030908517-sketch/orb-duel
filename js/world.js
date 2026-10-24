(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants;
  G.World={
    enemy(a,b,engine){const x=typeof a==='number'?engine.balls.find(v=>v.id===a):a,y=typeof b==='number'?engine.balls.find(v=>v.id===b):b;return !!x&&!!y&&x.id!==y.id&&(engine.mode!=='2v2'||x.team!==y.team);},
    // Absence removes the actor from target selection and contact, without changing allegiance.
    absent(ball,engine){return !!ball&&!!G.VampireArcana?.hidden(ball,engine);},
    targetable(ball,engine){return !!ball&&ball.hp>0&&!this.absent(ball,engine);},
    targetFor(ball,engine){if(engine.mode==='2v2')return G.Team.targetFor(ball,engine);return engine.balls.find(other=>other.id!==ball.id && this.targetable(other,engine));},
    aim(ball,target,speed,delay=0){
      // Estimate from observed velocity only, with a finite prediction horizon.
      const horizon=G.Aim?.horizon(ball,speed)??.5;
      const origin=G.Awakening.predict(ball,delay);if(!Number.isFinite(speed)){const p=G.Awakening.predict(target,Math.min(horizon,delay));return Math.atan2(p.y-origin.y,p.x-origin.x);}
      const offset=ball.radius+(ball.def.shotRadius||4)+2;
      const f=t=>{const p=G.Awakening.predict(target,Math.min(horizon,delay+t));return Math.hypot(p.x-origin.x,p.y-origin.y)-offset-speed*t;};
      let lo=0,hi=0,previous=f(0);
      if(previous>0)for(let i=1;i<=180;i++){const t=i/120,value=f(t);if(value<=0){lo=(i-1)/120;hi=t;break;}previous=value;}
      if(hi)for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
      const point=G.Awakening.predict(target,Math.min(horizon,delay+(hi||0)));return Math.atan2(point.y-origin.y,point.x-origin.x);
    },
    fire(ball,engine,options={}){
      const target=this.targetFor(ball,engine);if(!target)return;
      const mode=options.mode||'shot';if(mode==='boomerang')return G.Characters.throwBlade(ball,engine,options);const speed=options.speed||ball.def.shotSpeed;
      const radius=options.radius||ball.def.shotRadius,angle=options.angle??(G.Aim.direct(ball,target,engine,'projectile',speed)+(options.angleOffset||0)),distance=ball.radius+radius+2;
      const shot={id:engine.nextWorldId++,...(engine.demonWorld?{heat:engine.heatMultiplier}:{}),mode,owner:ball.id,x:ball.x+Math.cos(angle)*distance,y:ball.y+Math.sin(angle)*distance,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,radius,bounces:0,maxBounces:options.maxBounces??(mode==='counter'?0:1),sniper:!!options.sniper,expires:engine.time+(options.life||ball.def.shotLife),color:ball.def.color,raw:options.raw??G.Combat.rollAttack(ball,engine,options.damage??ball.def.shotDamage,mode),charged:false,heavy:!!options.heavy,storedCounter:!!options.storedCounter};
      if(ball.combatBounds)shot.combatBounds={...ball.combatBounds};
      if(G.Physics.constrain(shot)){shot.bounces++;this.ricochet(shot,engine);}
      engine.projectiles.push(shot);if(mode!=='counter')G.Spectacle?.emit(engine,ball,mode==='boomerang'?'moon':'volley',{angle,life:.3,sound:false});if(mode!=='counter')ball.stats.shotsFired++;
      engine.burst(shot.x,shot.y,ball.def.color,5);engine.log(engine.label(ball)+(mode==='boomerang'?'投出飞刃':mode==='counter'?'释放蓄能反击弹':'发射子弹'));return shot;
    },
    ricochet(shot,engine){
      if((shot.mode||'shot')==='shot' && !shot.charged && !shot.sniper){shot.charged=true;shot.raw*=1.15;engine.sound('ricochet',shot.x);engine.ring(shot.x,shot.y,'#fff0a4',20);}
    },
    counter(ball,engine,damage,angle){
      this.fire(ball,engine,{mode:'counter',angle,raw:damage,storedCounter:true,speed:440,radius:5,life:1.4});ball.stats.countersFired++;G.Spectacle?.emit(engine,ball,'counter',{angle:Math.atan2(engine.projectiles.at(-1)?.vy||0,engine.projectiles.at(-1)?.vx||1),life:.42,sound:false});engine.signal(ball,'镜裂返还 '+damage.toFixed(1),'mirrorRelease');
    },
    placeTrap(ball,engine){
      const spec=G.Awakening.trapOptions(ball),position=G.Trapper?G.Trapper.placement(ball,engine,spec.radius):G.Roles.trapPosition(ball,engine);if(!position)return false;const owned=engine.traps.filter(t=>t.owner===ball.id);
      if(owned.length>=spec.cap){const oldest=owned.reduce((a,n)=>n.id<a.id?n:a);engine.traps=engine.traps.filter(t=>t!==oldest);}
      engine.traps.push({id:engine.nextWorldId++,...(engine.demonWorld?{heat:engine.heatMultiplier}:{}),owner:ball.id,x:position.x,y:position.y,radius:spec.radius,blastRadius:spec.blastRadius,chainRange:spec.chainRange,armedAt:engine.time+spec.armDelay,expires:engine.time+spec.life,color:ball.def.color,raw:G.Combat.rollAttack(ball,engine,spec.damage,'trap')});
      if(Math.hypot(position.x-ball.x,position.y-ball.y)>10)engine.effects.push({kind:'roster',style:'mineDeploy',owner:ball.id,x:ball.x,y:ball.y,endX:position.x,endY:position.y,color:ball.def.color,angle:0,age:0,life:spec.armDelay});ball.stats.trapsPlaced++;engine.sound('trap',ball.x);engine.ring(ball.x,ball.y,ball.def.color,22);engine.log(engine.label(ball)+'布置陷阱 · '+spec.armDelay+'s 后生效');return engine.traps.at(-1);
    },
    pool(ball,engine,point=null,options={}){
      return G.Venom.pool(ball,engine,point,options);
    },
    ray(ball,angle){
      const dx=Math.cos(angle),dy=Math.sin(angle),x=ball.x,y=ball.y;
      const bounds=ball.combatBounds;
      const tx=dx>1e-9?((bounds?.right??C.width)-x)/dx:dx< -1e-9?((bounds?.left||0)-x)/dx:Infinity;
      const ty=dy>1e-9?((bounds?.bottom??C.height)-y)/dy:dy< -1e-9?((bounds?.top||0)-y)/dy:Infinity;
      const length=Math.max(0,Math.min(tx,ty));return {x,y,endX:x+dx*length,endY:y+dy*length};
    },
    distanceToRay(ray,target){
      const dx=ray.endX-ray.x,dy=ray.endY-ray.y,length=dx*dx+dy*dy;
      const u=length?Math.max(0,Math.min(1,((target.x-ray.x)*dx+(target.y-ray.y)*dy)/length)):0;
      return Math.hypot(target.x-ray.x-dx*u,target.y-ray.y-dy*u);
    },
    laser(ball,engine){
      return G.Roles.laserFire(ball,engine);
    },
    clearTrap(trap,ball,engine){
      engine.traps=engine.traps.filter(t=>t.id!==trap.id);ball.stats.trapsCleared++;
      engine.burst(trap.x,trap.y,'#b8c5d5',8);engine.signal(ball,'拆除陷阱','disarm');
    },
    // Entry time along relative swept paths, rather than just proximity at the end.
    sweep(shot,oldX,oldY,target){
      if(this.absent(target))return Infinity;
      const ax=oldX-(target.previousX??target.x),ay=oldY-(target.previousY??target.y);
      const dx=shot.x-target.x-ax,dy=shot.y-target.y-ay,r=shot.radius+target.radius;
      const c=ax*ax+ay*ay-r*r;if(c<=0)return 0;
      const a=dx*dx+dy*dy,b=2*(ax*dx+ay*dy),disc=b*b-4*a*c;
      if(a<=1e-12 || disc<0)return Infinity;
      const t=(-b-Math.sqrt(disc))/(2*a);return t>=0 && t<=1?t:Infinity;
    },
    intersects(shot,oldX,oldY,target){return this.sweep(shot,oldX,oldY,target)!==Infinity;},
    update(engine,dt){
      const nextShots=[];
      for(const shot of engine.projectiles){
        const owner=engine.balls.find(b=>b.id===shot.owner),mode=shot.mode||'shot';
        if(mode==='arcPierce'){const next=G.RangerArcana?.projectile(shot,engine,dt);if(next)nextShots.push(next);continue;}
        if(mode==='arcBlood'){const next=G.Arcana?.projectile(shot,engine,dt);if(next)nextShots.push(next);continue;}
        if(mode==='comet'){const next=G.Stellar?.projectile(shot,engine,dt);if(next)nextShots.push(next);continue;}
        if(!owner || owner.hp<=0 || engine.time>shot.expires){G.Aim?.result(shot,engine,false);if(mode==='boomerang')G.Characters.bladeRemoved(shot,owner,engine,false);continue;}
        const oldX=shot.x,oldY=shot.y;let ended=false;
        if(mode==='boomerang')G.Characters.moveBlade(shot,owner,engine,dt);
        else if(['venom','shard','blade','satellite','holyLance'].includes(mode))ended=G.Flyers.move(shot,engine,dt).ended;
        else if(G.ArenaWalls?G.ArenaWalls.integrate(shot,engine,dt):G.Physics.integrate(shot,dt)){shot.bounces++;this.ricochet(shot,engine);engine.burst(shot.x,shot.y,shot.color,2);}
        if(shot.bounces>(shot.maxBounces??1)){G.Aim?.result(shot,engine,false);continue;}
        const candidates=[];
        for(const target of engine.balls)if(this.enemy(shot.owner,target,engine) && target.hp>0&&!G.Ghost.phased(target)){
          const key=(shot.returning?'back:':'out:')+target.id;
          if(mode==='boomerang' && shot.hitIds.includes(key))continue;
          const t=this.sweep(shot,oldX,oldY,target);if(t!==Infinity)candidates.push({target,t,key});
        }
        if(mode==='shot')for(const trap of engine.traps)if(this.enemy(shot.owner,trap.owner,engine) && engine.time>=trap.armedAt && engine.time<=trap.expires){
          const t=this.sweep(shot,oldX,oldY,trap);if(t!==Infinity)candidates.push({trap,t});
        }
        candidates.sort((a,b)=>a.t-b.t || (a.trap?1:0)-(b.trap?1:0));
        const first=candidates[0];
        if(first?.trap){G.Aim?.result(shot,engine,false);this.clearTrap(first.trap,owner,engine);continue;}
        if(first?.target){
          const reflected=G.Roles.intercept(shot,first.target,engine);if(reflected){if(!reflected.absorbed)nextShots.push(reflected);continue;}
          G.Aim?.result(shot,engine,true);
          engine.pendingAttacks.push(mode==='boomerang'?G.Characters.bladePacket(shot,owner,first.target,engine):{source:owner,target:first.target,raw:shot.raw,heat:shot.heat,adaptiveId:shot.adaptiveId,kind:mode==='venom'?'poisonShot':mode==='blade'?'boomerang':shot.noMirror&&mode==='shot'?'counter':mode,noReflect:!!shot.noReflect||mode==='counter',incomingAngle:Math.atan2(-shot.vy,-shot.vx),angle:Math.atan2(shot.vy,shot.vx),heavyShot:!!shot.heavy,sniperShot:!!shot.sniper,storedCounter:!!shot.storedCounter,calibrationShot:shot.calibrationEligible?shot:null,calibrationIgnored:!!shot.calibrationIgnored,poisonUnit:shot.poisonUnit,poisonLife:shot.poisonLife,mirrorReturn:!!shot.noMirror});
          if(shot.danceOwner===undefined&&mode!=='holyLance')engine.ring(shot.x,shot.y,shot.color,22);
          if(mode!=='boomerang')continue;
          shot.hitIds.push(first.key);if(shot.bladeSling){G.Characters.bladeRemoved(shot,owner,engine,false);continue;}
        }
        if(mode==='boomerang' && shot.returning && this.intersects(shot,oldX,oldY,owner)){G.Characters.bladeRemoved(shot,owner,engine,true);continue;}
        if(ended){if(mode==='venom')G.Flyers.spill(shot,owner,engine);continue;}
        nextShots.push(shot);
      }
      engine.projectiles=nextShots;G.BladeHunt?.relay(engine);
      G.Roles.updateWaves(engine,dt);G.Roles.updateBeams(engine);this.updateTraps(engine);
      G.Venom.world(engine);
    },
    updateTraps(engine){
      G.Roles.updateTraps(engine);
    }
  };
})(typeof window!=='undefined'?window:globalThis);
