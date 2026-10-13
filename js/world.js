(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants;
  G.World={
    targetFor(ball,engine){return engine.balls.find(other=>other.id!==ball.id && other.hp>0);},
    aim(ball,target,speed){
      const dx=target.x-ball.x,dy=target.y-ball.y;
      const a=target.vx*target.vx+target.vy*target.vy-speed*speed,b=2*(dx*target.vx+dy*target.vy),c=dx*dx+dy*dy;
      const disc=b*b-4*a*c;let lead=0;
      if(disc>=0 && Math.abs(a)>1e-8){const ts=[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)].filter(t=>t>0);if(ts.length)lead=Math.min(1,Math.min(...ts));}
      return Math.atan2(dy+target.vy*lead,dx+target.vx*lead);
    },
    fire(ball,engine,options={}){
      const target=this.targetFor(ball,engine);if(!target)return;
      const mode=options.mode||'shot';if(mode==='boomerang')return G.Characters.throwBlade(ball,engine,options);const speed=options.speed||ball.def.shotSpeed;
      const radius=options.radius||ball.def.shotRadius,angle=this.aim(ball,target,speed)+(options.angleOffset||0),distance=ball.radius+radius+2;
      const shot={id:engine.nextWorldId++,mode,owner:ball.id,x:ball.x+Math.cos(angle)*distance,y:ball.y+Math.sin(angle)*distance,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,radius,bounces:0,maxBounces:mode==='counter'?0:1,expires:engine.time+(options.life||ball.def.shotLife),color:ball.def.color,raw:options.raw??G.Combat.rollAttack(ball,engine,options.damage??ball.def.shotDamage,mode),charged:false};
      if(G.Physics.constrain(shot)){shot.bounces++;this.ricochet(shot,engine);}
      engine.projectiles.push(shot);if(mode!=='counter')G.Spectacle?.emit(engine,ball,mode==='boomerang'?'moon':'volley',{angle,life:.3});if(mode!=='counter')ball.stats.shotsFired++;
      engine.burst(shot.x,shot.y,ball.def.color,5);engine.log(engine.label(ball)+(mode==='boomerang'?'投出飞刃':mode==='counter'?'释放蓄能反击弹':'发射子弹'));
    },
    ricochet(shot,engine){
      if((shot.mode||'shot')==='shot' && !shot.charged){shot.charged=true;shot.raw*=1.15;engine.sound('ricochet',shot.x);engine.ring(shot.x,shot.y,'#fff0a4',20);}
    },
    counter(ball,engine,damage){
      this.fire(ball,engine,{mode:'counter',raw:damage,speed:440,radius:5,life:1.4});ball.stats.countersFired++;G.Spectacle?.emit(engine,ball,'counter',{angle:Math.atan2(engine.projectiles.at(-1)?.vy||0,engine.projectiles.at(-1)?.vx||1),life:.42});engine.signal(ball,'返还蓄能 '+damage.toFixed(1),'counter');
    },
    placeTrap(ball,engine){
      const spec=G.Awakening.trapOptions(ball),owned=engine.traps.filter(t=>t.owner===ball.id);
      if(owned.length>=spec.cap)engine.traps=engine.traps.filter(t=>t!==owned[0]);
      engine.traps.push({id:engine.nextWorldId++,owner:ball.id,x:ball.x,y:ball.y,radius:spec.radius,blastRadius:spec.blastRadius,chainRange:spec.chainRange,armedAt:engine.time+spec.armDelay,expires:engine.time+spec.life,color:ball.def.color,raw:G.Combat.rollAttack(ball,engine,spec.damage,'trap')});
      ball.stats.trapsPlaced++;engine.sound('trap',ball.x);engine.ring(ball.x,ball.y,ball.def.color,22);engine.log(engine.label(ball)+'布置陷阱 · '+spec.armDelay+'s 后生效');
    },
    pool(ball,engine){
      const awake=G.Awakening.active(ball),owned=engine.pools.filter(p=>p.owner===ball.id);
      if(owned.length>=ball.def.poolCap)engine.pools=engine.pools.filter(p=>p!==owned[0]);
      engine.pools.push({id:engine.nextWorldId++,owner:ball.id,x:ball.x,y:ball.y,radius:awake?36:ball.def.poolRadius,color:ball.def.color,armedAt:engine.time+.5,expires:engine.time+(awake?5.5:ball.def.poolLife),nextPulse:engine.time+.5,raw:G.Combat.attackValue(ball,engine,awake?ball.def.awakePoolDamage:ball.def.poolDamage)});
      ball.stats.poolsPlaced++;G.Spectacle?.emit(engine,ball,'toxic',{radius:36,life:.55});engine.sound('poison',ball.x);engine.log(engine.label(ball)+'留下毒池');
    },
    ray(ball,angle){
      const dx=Math.cos(angle),dy=Math.sin(angle),x=ball.x,y=ball.y;
      const tx=dx>1e-9?(C.width-x)/dx:dx< -1e-9?-x/dx:Infinity;
      const ty=dy>1e-9?(C.height-y)/dy:dy< -1e-9?-y/dy:Infinity;
      const length=Math.max(0,Math.min(tx,ty));return {x,y,endX:x+dx*length,endY:y+dy*length};
    },
    distanceToRay(ray,target){
      const dx=ray.endX-ray.x,dy=ray.endY-ray.y,length=dx*dx+dy*dy;
      const u=length?Math.max(0,Math.min(1,((target.x-ray.x)*dx+(target.y-ray.y)*dy)/length)):0;
      return Math.hypot(target.x-ray.x-dx*u,target.y-ray.y-dy*u);
    },
    laser(ball,engine){
      const ray=this.ray(ball,ball.laser.angle),awake=G.Awakening.active(ball),width=awake?7:ball.def.laserWidth;
      const raw=G.Combat.rollAttack(ball,engine,awake?18:ball.def.laserDamage);ball.stats.lasersFired++;
      let hit=false;
      for(const target of engine.balls)if(target.id!==ball.id && target.hp>0 && this.distanceToRay(ray,target)<=target.radius+width){engine.pendingAttacks.push({source:ball,target,raw,kind:'laser'});hit=true;}
      const cleared=engine.traps.filter(t=>t.owner!==ball.id && t.armedAt<=engine.time && t.expires>=engine.time && this.distanceToRay(ray,t)<=t.radius+width);
      for(const trap of cleared)this.clearTrap(trap,ball,engine);
      G.Spectacle?.emit(engine,ball,'beam',{ray,life:.38});engine.effects.push({kind:'beam',...ray,color:ball.def.color,width,age:0,life:.24});engine.sound('laser',ball.x);
      if(hit||cleared.length)ball.laserMisses=0;
      else{ball.laserMisses++;if(ball.laserMisses>=2){ball.laserMisses=0;G.Recovery.refund(ball,engine,'nextLaser',.6,'连续落空');}else engine.signal(ball,'光束落空 1/2','miss');}
    },
    clearTrap(trap,ball,engine){
      engine.traps=engine.traps.filter(t=>t.id!==trap.id);ball.stats.trapsCleared++;
      engine.burst(trap.x,trap.y,'#b8c5d5',8);engine.signal(ball,'拆除陷阱','disarm');
    },
    // Entry time along relative swept paths, rather than just proximity at the end.
    sweep(shot,oldX,oldY,target){
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
        if(!owner || owner.hp<=0 || engine.time>shot.expires){if(mode==='boomerang')G.Characters.bladeRemoved(shot,owner,engine,false);continue;}
        const oldX=shot.x,oldY=shot.y;
        if(mode==='boomerang')G.Characters.moveBlade(shot,owner,engine,dt);
        else if(G.Physics.integrate(shot,dt)){shot.bounces++;this.ricochet(shot,engine);engine.burst(shot.x,shot.y,shot.color,2);}
        if(shot.bounces>(shot.maxBounces??1))continue;
        const candidates=[];
        for(const target of engine.balls)if(target.id!==shot.owner && target.hp>0){
          const key=(shot.returning?'back:':'out:')+target.id;
          if(mode==='boomerang' && shot.hitIds.includes(key))continue;
          const t=this.sweep(shot,oldX,oldY,target);if(t!==Infinity)candidates.push({target,t,key});
        }
        if(mode==='shot')for(const trap of engine.traps)if(trap.owner!==shot.owner && engine.time>=trap.armedAt && engine.time<=trap.expires){
          const t=this.sweep(shot,oldX,oldY,trap);if(t!==Infinity)candidates.push({trap,t});
        }
        candidates.sort((a,b)=>a.t-b.t || (a.trap?1:0)-(b.trap?1:0));
        const first=candidates[0];
        if(first?.trap){this.clearTrap(first.trap,owner,engine);continue;}
        if(first?.target){
          engine.pendingAttacks.push(mode==='boomerang'?G.Characters.bladePacket(shot,owner,first.target,engine):{source:owner,target:first.target,raw:shot.raw,kind:mode,noReflect:mode==='counter'});
          engine.ring(shot.x,shot.y,shot.color,22);
          if(mode!=='boomerang')continue;
          shot.hitIds.push(first.key);
        }
        if(mode==='boomerang' && shot.returning && this.intersects(shot,oldX,oldY,owner)){G.Characters.bladeRemoved(shot,owner,engine,true);continue;}
        nextShots.push(shot);
      }
      engine.projectiles=nextShots;
      this.updateTraps(engine);
      engine.pools=engine.pools.filter(pool=>{const owner=engine.balls.find(b=>b.id===pool.owner&&b.hp>0);if(!owner)return false;if(pool.expires<engine.time){if(!pool.touched)G.Recovery.refund(owner,engine,'nextPool',.35,'毒池未接触');return false;}return true;});
      for(const pool of engine.pools)if(engine.time+1e-9>=pool.armedAt){
        for(const target of engine.balls)if(target.id!==pool.owner && target.hp>0 && Math.hypot(target.x-pool.x,target.y-pool.y)<=pool.radius+target.radius*.55){
          pool.touched=true;const owner=engine.balls.find(b=>b.id===pool.owner);if(owner)G.Characters.poison(owner,target,engine,pool.raw,true);
        }
      }
      for(const target of engine.balls){const poison=target.poison;if(!poison)continue;
        if(engine.time+1e-9>=poison.nextPulse && engine.time<=poison.until+1e-9){
          poison.nextPulse+=.5;const owner=engine.balls.find(b=>b.id===poison.owner && b.hp>0);
          if(owner && target.hp>0)engine.pendingAttacks.push({source:owner,target,raw:poison.raw,kind:'poison'});
        }
        if(engine.time>poison.until+1e-9)target.poison=null;
      }
    },
    updateTraps(engine){
      const nextTraps=[],removed=new Set();
      for(const trap of engine.traps){
        if(removed.has(trap.id))continue;
        const owner=engine.balls.find(b=>b.id===trap.owner);if(!owner || owner.hp<=0)continue;if(engine.time>trap.expires){G.Recovery.refund(owner,engine,'nextTrap',.4,'陷阱未触发');continue;}
        const target=engine.time+1e-9>=trap.armedAt?engine.balls.find(b=>b.id!==trap.owner && b.hp>0 && Math.hypot(b.x-trap.x,b.y-trap.y)<=b.radius+trap.radius):null;
        if(!target){nextTraps.push(trap);continue;}
        const queue=[trap];removed.add(trap.id);
        for(let i=0;i<queue.length;i++){
          const mine=queue[i];
          for(const enemy of engine.balls)if(enemy.id!==owner.id && enemy.hp>0 && Math.hypot(enemy.x-mine.x,enemy.y-mine.y)<=enemy.radius+(mine.blastRadius||mine.radius))engine.pendingAttacks.push({source:owner,target:enemy,raw:mine.raw,kind:'trap'});
          G.Spectacle?.emit(engine,owner,'detonate',{point:mine,radius:mine.blastRadius||54,life:.5,cooldown:0});engine.ring(mine.x,mine.y,mine.color,mine.blastRadius||54);engine.burst(mine.x,mine.y,mine.color,16);engine.sound('explosion',mine.x);engine.impact(mine.x,mine.y,mine.color,1.7);
          if(mine.chainRange)for(const other of engine.traps)if(other.owner===owner.id && other.chainRange && !removed.has(other.id) && engine.time+1e-9>=other.armedAt && engine.time<=other.expires && Math.hypot(other.x-mine.x,other.y-mine.y)<=mine.chainRange){removed.add(other.id);queue.push(other);engine.effects.push({kind:'arc',x:mine.x,y:mine.y,endX:other.x,endY:other.y,color:mine.color,age:0,life:.35});}
        }
        if(queue.length>1)engine.signal(owner,'连锁引爆 ×'+queue.length,'combo');
      }
      engine.traps=nextTraps.filter(t=>!removed.has(t.id));
    }
  };
})(typeof window!=='undefined'?window:globalThis);
