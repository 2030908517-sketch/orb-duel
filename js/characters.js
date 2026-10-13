(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Character mechanics share the existing simultaneous damage pipeline.
  G.Characters={
    fresh(){return {burstAt:0,recoveryUntil:0,catchUntil:0,bladeRemaining:0,bladeLost:false};},
    effect(engine,source,target,style,options={}){engine.effects.push({kind:'role',style,owner:source.id,color:source.def.color,x:target.x,y:target.y,angle:Math.atan2(target.y-source.y,target.x-source.x),age:0,life:.45,...options});},
    contactExtras(ball,target,engine){
      const poison=target.poison;
      if(ball.type==='venom'&&poison?.owner===ball.id&&poison.stacks>=3&&poison.until>=engine.time&&engine.time>=ball.character.burstAt&&!G.Awakening.dashing(target,engine))return [this.toxinBurst(ball,target,engine,'contact')];
      return [];
    },
    toxinBurst(ball,target,engine,reason){
      target.poison=null;ball.character.burstAt=engine.time+2.5;
      return {source:ball,target,raw:ball.def.toxinBurst*engine.heatMultiplier,kind:'toxinBurst',reason};
    },
    poison(ball,target,engine,unitRaw,fromPool=false){
      if(target.hp<=0||G.Awakening.dashing(target,engine))return;
      let p=target.poison;const active=p&&p.until>=engine.time&&p.owner===ball.id;
      if(active&&fromPool&&G.Awakening.active(ball)&&p.stacks>=3&&engine.time>=ball.character.burstAt){engine.pendingAttacks.push(this.toxinBurst(ball,target,engine,'pool'));p=null;}
      if(!p||p.until<engine.time||p.owner!==ball.id){
        p=target.poison={owner:ball.id,stacks:1,unitRaw,raw:unitRaw,until:0,nextPulse:engine.time+.5,nextStackAt:engine.time+.9};
        engine.signal(target,'腐蚀 1/3','poison');
      }else if(!fromPool||engine.time+1e-9>=p.nextStackAt){
        const old=p.stacks||1;p.stacks=Math.min(3,old+1);p.nextStackAt=engine.time+.9;
        if(p.stacks>old)engine.signal(target,'腐蚀 '+p.stacks+'/3',p.stacks===3?'ready':'poison');
      }
      p.unitRaw=Math.max(p.unitRaw||unitRaw,unitRaw);p.raw=p.unitRaw*p.stacks;
      p.until=Math.max(p.until,engine.time+(fromPool?1.5:3));
    },
    attackMultiplier(ball,engine,base,kind){
      if(ball.type!=='boomerang'||kind!=='contact'||base!==ball.def.damage)return 1;
      if(ball.character.bladeRemaining>0)return .8;
      return ball.character.catchUntil>engine.time?1.4:1;
    },
    dashContact(ball,target,engine){
      if(G.Awakening.dashing(target,engine))return;
      // Mark before wall projection so an immediate wall impact shares this damage batch.
      target.inertia=1.1;target.stagger={owner:ball.id,until:engine.time+1.1,energy:true,heat:engine.heatMultiplier};
      ball.character.recoveryUntil=engine.time+.6;
    },
    hit(hit,engine){
      const b=hit.source,t=hit.target;
      if(hit.dash && !hit.avoided){
        // Physics already transferred normal momentum. Shields absorb damage, not inertia.
        b.stats.strongHits++;
        engine.signal(b,'动能传递','thunderHit',t);this.effect(engine,b,t,'kinetic',{angle:Math.atan2(hit.impact?.ny??0,hit.impact?.nx??1)});
      }
      if(hit.actual<=0)return;
      if(b.type==='venom'&&hit.kind==='contact')this.poison(b,t,engine,(G.Awakening.active(b)?b.def.awakePoolDamage:b.def.poolDamage)*engine.heatMultiplier);
      if(hit.kind==='toxinBurst'){b.stats.toxinBursts++;engine.signal(b,hit.reason==='pool'?'毒池引爆':'满毒引爆','toxinBurst',t);this.effect(engine,b,t,'toxinBurst');engine.impact(t.x,t.y,b.def.color,1.8);engine.burst(t.x,t.y,b.def.color,14);}
      if(b.type==='accelerator'&&hit.kind==='contact'&&!hit.dash&&hit.impact?.closing>=430&&hit.impact.forward>=250){
        const {nx,ny,forward}=hit.impact,extra=clamp(forward*.16,40,145);
        t.vx+=nx*extra;t.vy+=ny*extra;t.inertia=.85;G.Physics.limit(t);
        t.stagger={owner:b.id,until:engine.time+.7,energy:true,heat:engine.heatMultiplier};
        b.character.recoveryUntil=engine.time+.8;b.speed=Math.max(b.def.speed,b.speed-20);b.stats.strongHits++;
        engine.signal(b,'动能强撞','thunderHit',t);this.effect(engine,b,t,'kinetic',{angle:Math.atan2(ny,nx)});
      }
      if(hit.kind==='wallSlam'){b.stats.wallSlams++;engine.signal(b,'撞墙追击','wallSlam',t);this.effect(engine,b,hit.point||t,'wallSlam',{angle:hit.wallAngle});engine.impact(t.x,t.y,'#fff0a4',2);}
      if(b.type==='boomerang'){
        if(hit.kind==='boomerang'&&!hit.returning){t.bladeMark={owner:b.id,until:engine.time+3.2,claimedTick:-1};engine.signal(b,'飞刃留印','shotHit');}
        if(hit.kind==='boomerang'&&hit.markBonus){t.bladeMark=null;b.stats.bladeFinishers++;engine.signal(b,'回刃斩印','moonCut',t);this.effect(engine,b,t,'bladeCut');engine.impact(t.x,t.y,b.def.color,1.5);}
        if(hit.kind==='contact'&&b.character.bladeRemaining===0&&b.character.catchUntil>engine.time){b.character.catchUntil=0;engine.signal(b,'接刃重击','moonCut',t);this.effect(engine,b,t,'bladeCut');}
      }
    },
    update(ball,engine){if(ball.stagger&&ball.stagger.until<engine.time)ball.stagger=null;if(ball.bladeMark&&ball.bladeMark.until<engine.time)ball.bladeMark=null;},
    wall(ball,engine){
      const s=ball.stagger,w=ball.wallContact;if(!s||s.until<engine.time||!w)return;
      // Consume even an absorbed wall hit; the same shove cannot farm a corner.
      ball.stagger=null;const source=engine.balls.find(b=>b.id===s.owner&&b.hp>0);
      if(!source||w.speed<160)return;
      const point={x:ball.x-w.nx*ball.radius,y:ball.y-w.ny*ball.radius};
      engine.pendingAttacks.push({source,target:ball,raw:s.energy?Math.min(12,.5*ball.mass*w.speed*w.speed/18000)*(s.heat||1):s.raw*clamp(w.speed/340,.6,1.4),kind:'wallSlam',point,wallAngle:Math.atan2(w.ny,w.nx)});
    },
    throwBlade(ball,engine,options){
      const target=G.World.targetFor(ball,engine);if(!target)return;
      const angle=G.World.aim(ball,target,ball.def.shotSpeed)+(options.angleOffset||0),nx=Math.cos(angle),ny=Math.sin(angle),side=(options.angleOffset||0)<0?-1:1,r=ball.def.shotRadius;
      const bounded=p=>({x:clamp(p.x,r,C.width-r),y:clamp(p.y,r,C.height-r)});
      const start=bounded({x:ball.x+nx*(ball.radius+r+2),y:ball.y+ny*(ball.radius+r+2)}),predicted=G.Awakening.predict(target,.72),dx=predicted.x-ball.x,dy=predicted.y-ball.y,distance=Math.hypot(dx,dy)||1,reach=Math.min(1,230/distance),end=bounded({x:ball.x+dx*reach,y:ball.y+dy*reach});
      // Lock the end at cast time; the curved outgoing path never homes on an enemy.
      const control=bounded({x:(start.x+end.x)/2-ny*side*75,y:(start.y+end.y)/2+nx*side*75});
      const shot={id:engine.nextWorldId++,mode:'boomerang',owner:ball.id,castId:options.castId,x:start.x,y:start.y,vx:nx*ball.def.shotSpeed,vy:ny*ball.def.shotSpeed,speed:ball.def.shotSpeed,radius:r,bounces:0,maxBounces:0,expires:engine.time+2.8,color:ball.def.color,raw:G.Combat.rollAttack(ball,engine,options.damage??ball.def.shotDamage,'boomerang'),returning:false,hitIds:[],turnAt:engine.time+.72,curve:{start,control,end,started:engine.time,duration:.72},history:[]};
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
      if(!shot.returning&&engine.time+1e-9>=shot.turnAt)this.returnBlade(shot,owner,engine);
      const curve=shot.curve;
      if(shot.returning){const weight=1-Math.exp(-dt*7);curve.end.x+=(owner.x-curve.end.x)*weight;curve.end.y+=(owner.y-curve.end.y)*weight;}
      const u=clamp((engine.time-curve.started)/curve.duration,0,1),oldX=shot.x,oldY=shot.y;
      if(u<1){const v=1-u;shot.x=v*v*curve.start.x+2*v*u*curve.control.x+u*u*curve.end.x;shot.y=v*v*curve.start.y+2*v*u*curve.control.y+u*u*curve.end.y;}
      else{const desired=Math.atan2(owner.y-shot.y,owner.x-shot.x),angle=Math.atan2(shot.vy,shot.vx),delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle)),next=angle+clamp(delta,-8*dt,8*dt);shot.x+=Math.cos(next)*shot.speed*dt;shot.y+=Math.sin(next)*shot.speed*dt;}
      shot.x=clamp(shot.x,shot.radius,C.width-shot.radius);shot.y=clamp(shot.y,shot.radius,C.height-shot.radius);
      if(dt>0){shot.vx=(shot.x-oldX)/dt;shot.vy=(shot.y-oldY)/dt;}
      if(engine.tick%4===0){shot.history.unshift({x:shot.x,y:shot.y});shot.history.length=Math.min(shot.history.length,12);}
    },
    bladePacket(shot,owner,target,engine){
      const mark=target.bladeMark,bonus=shot.returning&&mark?.owner===owner.id&&mark.until>=engine.time&&mark.claimedTick!==engine.tick;
      if(bonus)mark.claimedTick=engine.tick;
      return {source:owner,target,raw:shot.raw*(bonus?1.5:1),kind:'boomerang',returning:shot.returning,markBonus:!!bonus};
    },
    bladeRemoved(shot,owner,engine,caught){
      if(!owner)return;owner.character.bladeRemaining=Math.max(0,owner.character.bladeRemaining-1);
      if(!caught)owner.character.bladeLost=true;
      if(caught){owner.stats.bladesCaught++;if(shot.castId&&owner.lastRecallCast!==shot.castId){owner.lastRecallCast=shot.castId;G.Recovery.refund(owner,engine,'nextShot',.35,'飞刃回收');}}
      if(owner.character.bladeRemaining===0&&!owner.character.bladeLost&&caught){owner.character.catchUntil=engine.time+3;engine.signal(owner,'接刃蓄势','bladeCatch');this.effect(engine,owner,owner,'bladeCatch');}
    }
  };
})(typeof window!=='undefined'?window:globalThis);
