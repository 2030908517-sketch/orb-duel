(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Arcana-only module. Threat observation and real movement belong to combat;
  // the renderer receives snapshots and cannot decide a dodge or a hit.
  G.Arcana.defs.ranger={name:'死线·极限反击',raw:28};
  G.RangerArcana={
    chargeTime:1.40,lockTime:.48,lockHoldTime:.16,scopeCloseTime:.10,lockStopTime:.32,trackRate:30,bulletSpeed:1350,
    event(b,e,stage,cue,point=b,visual={}){
      const castId=b.arcana?.castId||'reflected:'+b.id+':'+e.tick,eventId=castId+':'+stage;
      if(visual.style)G.Arcana.effect(e,b,visual.style,point,{...visual,eventId,castId});
      if(cue){e.sound(cue,point.x);const s=e.soundEvents.at(-1);if(s?.kind===cue)s.presentationId=eventId;}
      G.Presentation?.note(e,'arcana.stage',{castId,eventId,stage,actorId:b.id,x:point.x,y:point.y,cue:cue||null});
    },
    approach(b,p,horizon=.22){
      const pvx=p.vx??Math.cos(p.angle||0)*(p.speed||0),pvy=p.vy??Math.sin(p.angle||0)*(p.speed||0),x=p.x-b.x,y=p.y-b.y,vx=pvx-b.vx,vy=pvy-b.vy,r=b.radius+p.radius+4;
      const a=vx*vx+vy*vy,dot=x*vx+y*vy,c=x*x+y*y-r*r;if(dot>=0||a<1)return null;
      const disc=dot*dot-a*c;if(disc<0)return null;const at=Math.max(0,(-dot-Math.sqrt(disc))/a);
      return at<=horizon?{at,angle:Math.atan2(vy,vx),x:p.x,y:p.y,vx:pvx,vy:pvy,radius:p.radius}:null;
    },
    tideSamples(b,e){return (e.arcanaWorld?.tides||[]).filter(w=>w.launched&&w.expires>=e.time&&G.World.enemy(w.owner,b,e)).flatMap(w=>{const owner=e.balls.find(v=>v.id===w.owner&&v.hp>0);if(!owner)return [];const nx=Math.cos(w.angle),ny=Math.sin(w.angle),speed=w.speed*owner.temporal.rate;return [-48,-24,0,24,48].map(offset=>({id:w.id,owner:w.owner,x:w.x-ny*offset,y:w.y+nx*offset,vx:nx*speed,vy:ny*speed,radius:w.thickness/2,expires:w.expires}));});},
    threats(b,e){const list=[];for(const p of this.tideSamples(b,e)){const hit=this.approach(b,p);if(hit)list.push({...hit,kind:'tide',owner:p.owner,id:p.id});}
      for(const p of [...e.projectiles,...e.timeClocks]){
        if(!G.World.enemy(p.owner,b,e)||!e.balls.some(v=>v.id===p.owner&&v.hp>0)||p.expires<e.time||!(G.Flyers.physical(p)||p.mode==='holyLance')||p.mode==='arcBlood'&&!p.launched)continue;
        const samples=p.mode==='arcBlood'?[-30,-10,10].map(offset=>({...p,x:p.x+Math.cos(Math.atan2(p.vy,p.vx))*offset,y:p.y+Math.sin(Math.atan2(p.vy,p.vx))*offset})):[p];const hit=samples.map(q=>this.approach(b,q)).filter(Boolean).sort((a,b)=>a.at-b.at)[0];if(hit&&(!Number.isFinite(p.expires)||e.time+hit.at<=p.expires)&&(p.range===undefined||Math.hypot(hit.vx,hit.vy)*hit.at<=p.range-(p.travel||0)))list.push({...hit,kind:'projectile',owner:p.owner,id:p.id});
      }
      for(const t of e.balls){if(t.hp<=0||!G.World.enemy(b,t,e)||G.Ghost.phased(t)||G.Arcana.noContact(t)||G.Charge?.flowing(t))continue;
        const hit=this.approach(b,t),pair=e.pairs.get(b.id+':'+t.id)||e.pairs.get(t.id+':'+b.id);if(hit&&!pair?.touching&&(!pair||e.time+hit.at>=pair.lastHit+C.collisionCooldown))list.push({...hit,kind:'body',owner:t.id,id:t.id});
        const l=t.laser,delay=l?.fireAt-e.time;
        if(l&&delay>0&&delay<=.22&&e.time>=l.trackUntil-1e-9){const origin=G.Awakening.predict(t,delay),ray=G.World.ray(origin,l.angle),point=G.Awakening.predict(b,delay);
          if(G.World.distanceToRay(ray,point)<=b.radius+10)list.push({kind:'laser',owner:t.id,id:t.id,at:delay,angle:l.angle,x:origin.x,y:origin.y,vx:Math.cos(l.angle)*1350,vy:Math.sin(l.angle)*1350,radius:10});
        }
      }
      if(this.risk(b,b,e,0,false)>.5){const t=G.World.targetFor(b,e);if(t)list.push({kind:'area',owner:t.id,id:t.id,at:0,angle:Math.atan2(b.y-t.y,b.x-t.x)});}
      return list.sort((a,b)=>a.at-b.at||a.owner-b.owner||a.id-b.id);
    },
    risk(b,q,e,at=0,includeBodies=true){let risk=0;const t=e.time+at,point={...q,radius:b.radius},circle=(v,r,w=1)=>{const gap=Math.hypot(q.x-v.x,q.y-v.y)-r-b.radius;return w*Math.max(0,1-gap/40);},enemy=v=>G.World.enemy(v.owner,b,e)&&(v.expires===undefined||v.expires>t);for(const v of e.balls)if(v!==b&&G.World.enemy(v,b,e)&&G.World.targetable(v,e)){const p=G.Awakening.predict(v,at);if(includeBodies)risk+=circle(p,v.radius,8);if(v.type==='vampire'&&(v.awakening.chainActive||v.role.chainWarning))risk+=circle(p,260,13);if(v.laser){const ray=G.World.ray(p,v.laser.angle);risk+=Math.max(0,1-(G.World.distanceToRay(ray,point)-b.radius-10)/35)*10;}}
      for(const p of [...e.projectiles,...e.timeClocks,...this.tideSamples(b,e)])if(enemy(p)){const vx=p.vx??Math.cos(p.angle||0)*(p.speed||0),vy=p.vy??Math.sin(p.angle||0)*(p.speed||0),lo=Math.max(0,at-.16),hi=Math.max(lo,Math.min(at+.16,(p.expires??Infinity)-e.time,p.range===undefined?Infinity:Math.max(0,p.range-(p.travel||0))/(Math.hypot(vx,vy)||1))),x=p.x+vx*lo,y=p.y+vy*lo,dx=vx*(hi-lo),dy=vy*(hi-lo),u=clamp(((q.x-x)*dx+(q.y-y)*dy)/(dx*dx+dy*dy||1),0,1);risk+=circle({x:x+dx*u,y:y+dy*u},p.radius||8,7);}

      for(const p of e.pools)if(enemy(p)){risk+=circle(p,G.Venom.radius(p,t),9);if(G.Venom.contains(p,point,e))risk+=5;}for(const p of e.traps)if(enemy(p))risk+=circle(p,p.blastRadius||p.radius||25,8);
      for(const l of G.Mines?.links(e)||[])if(G.World.enemy(l.a.owner,b,e))risk+=Math.max(0,1-(G.Holy.distanceToSegment(point,l.a,l.b)-b.radius)/30)*9;
      for(const p of [...(e.holyWorld?.zones||[]),...(e.holyWorld?.lights||[]),...(e.timeDomains||[]),...(e.chargeWorld?.patches||[])])if(enemy(p))risk+=circle(p,p.radius||30,12);
      for(const p of [...(e.beams||[]),...(e.waves||[]),...(e.arcanaWorld?.cones||[])])if(enemy(p)&&Number.isFinite(p.angle)){const ray=G.World.ray(p,p.angle);risk+=Math.max(0,1-(G.World.distanceToRay(ray,point)-b.radius-(p.width||12))/35)*9;}for(const s of e.holySeals||[])if(s.active&&s.center&&G.World.enemy(s.owner,b,e))risk+=Math.max(0,1-(Math.min(Math.abs(q.x-s.center.x),Math.abs(q.y-s.center.y))-b.radius-20)/35)*10;for(const o of e.balls)if(o.wind&&G.World.enemy(o,b,e)){for(const lane of o.wind.lanes||[])if(lane.until>t)for(let i=1;i<lane.points.length;i++)risk+=Math.max(0,1-G.Holy.distanceToSegment(point,lane.points[i-1],lane.points[i])/45)*2;for(const area of [o.wind.vortex,o.wind.storm])if(area&&(area.until??(area.at+4.4))>t)risk+=circle(area,G.Wind.config.vortexRadius||60,5);}return risk;},
    route(b,threat,e,requestedAngle=null){if(b.magnetic.anchored)return null;let best=null;
      const threats=this.threats(b,e),duration=.16;
      const flyers=[...e.projectiles,...e.timeClocks].filter(p=>G.World.enemy(p.owner,b,e)&&(G.Flyers.physical(p)||p.mode==='holyLance')&&(p.expires===undefined||p.expires>=e.time+duration)&&!(p.mode==='arcBlood'&&!p.launched)).concat(this.tideSamples(b,e));
      // The path may pass through bodies and attacks while invulnerable. Walls
      // remain solid; the landing and the start of the charge must be safe.
      for(const distance of [92,74,58])for(let turn=0;turn<24;turn++){
        if(requestedAngle!==null&&turn!==0)continue;
        const angle=requestedAngle??(threat.angle+turn*Math.PI/12),dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance,end={x:b.x+dx,y:b.y+dy};let legal=true;
        for(let i=1;i<=8;i++){const q=i/8,p={x:b.x+dx*q,y:b.y+dy*q,radius:b.radius};
          if((b.cageBounds||b.cageWalls?.length)&&G.Trapper&&!G.Trapper.legal(p,b.radius,e,b,false)){legal=false;break;}
          if(p.x<b.radius+3||p.x>C.width-b.radius-3||p.y<b.radius+3||p.y>C.height-b.radius-3||e.mode==='2v2'&&e.obstacles.some(o=>G.Team.overlaps(p,o,2))){legal=false;break;}
        }
        if(!legal||G.ArenaWalls&&!G.ArenaWalls.clear(b,end,e,b.radius))continue;let clearance=100;
        for(const t of e.balls)if(t!==b&&t.hp>0&&!G.Ghost.phased(t)&&!G.Arcana.noContact(t)){
          const f=G.Awakening.predict(t,duration),gap=Math.hypot(end.x-f.x,end.y-f.y)-b.radius-t.radius;
          if(gap<3){legal=false;break;}clearance=Math.min(clearance,gap);
        }
        if(!legal)continue;
        for(const hit of threats){
          if(hit.kind==='body')continue;
          if(hit.kind==='laser'){
            if(hit.at>=duration){const ray=G.World.ray(hit,hit.angle);clearance=Math.min(clearance,G.World.distanceToRay(ray,end)-b.radius-hit.radius);}
          }
        }
        for(const p of flyers){
          const vx=p.vx??Math.cos(p.angle||0)*p.speed,vy=p.vy??Math.sin(p.angle||0)*p.speed,a=Math.atan2(vy,vx);
          for(const offset of p.mode==='arcBlood'?[-30,-10,10]:[0]){
            const x=p.x+vx*duration+Math.cos(a)*offset,y=p.y+vy*duration+Math.sin(a)*offset,dx=vx*.05,dy=vy*.05,q=clamp(((end.x-x)*dx+(end.y-y)*dy)/(dx*dx+dy*dy||1),0,1);
            clearance=Math.min(clearance,Math.hypot(end.x-x-dx*q,end.y-y-dy*q)-b.radius-p.radius);
          }
        }

        const future=at=>{const drift=Math.max(0,at-.16)*b.speed*.24*(b.temporal.rate||1);return {x:clamp(end.x+Math.cos(angle)*drift,b.radius,C.width-b.radius),y:clamp(end.y+Math.sin(angle)*drift,b.radius,C.height-b.radius)};};const margin=Math.min(end.x-b.radius,C.width-b.radius-end.x,end.y-b.radius,C.height-b.radius-end.y),score=Math.min(85,clearance)*2+margin*.45+distance*.08-90*(this.risk(b,end,e,.16)+this.risk(b,future(.36),e,.36)+this.risk(b,future(.65),e,.65))-8*[.25,.5,.75].reduce((n,u)=>n+this.risk(b,{x:b.x+dx*u,y:b.y+dy*u},e,u*.16),0);
        if(!best||score>best.score)best={...end,angle,distance,score};
      }return best;
    },
    separateExit(b,e){
      // A different collision can invalidate the predicted landing. Resolve
      // only penetration here, never a contact attack or an extra immunity tail.
      for(let pass=0;pass<32;pass++){let overlap=false;G.Physics.constrain(b);
        for(const t of e.balls)if(t!==b&&t.hp>0&&!G.Ghost.phased(t)&&!G.Arcana.noContact(t)&&Math.hypot(b.x-t.x,b.y-t.y)<b.radius+t.radius){G.Physics.resolve(b,t);G.Physics.constrain(t);overlap=true;}
        if(!overlap)break;
      }G.Physics.constrain(b);
    },
    begin(b,t,threat,route,e){const u=b.arcana;G.Arcana.commit(b,e);G.Ranger.interrupt(b,e);
      u.phase='counterStep';u.started=e.time;u.until=e.time+.16;u.target=t.id;u.returnAngle=Math.atan2(b.vy,b.vx);u.entry={x:b.x,y:b.y};u.landing={x:route.x,y:route.y};u.history=[];u.threat={...threat};u.evadeAngle=route.angle;
      b.motionSpeed=route.distance/.16;b.inertia=0;b.vx=Math.cos(route.angle)*b.motionSpeed*b.temporal.rate;b.vy=Math.sin(route.angle)*b.motionSpeed*b.temporal.rate;
      this.event(b,e,'evade','arcRangerEvade',b,{style:'counterEvade',angle:route.angle,threatAngle:threat.angle,life:.5});
      G.Presentation?.note(e,'arcana.ranger.dodge',{actorId:b.id,threatKind:threat.kind,threatId:threat.id,arrival:threat.at});
    },
    prepareCharge(b,t,e){const u=b.arcana;u.phase='counterCharge';u.started=e.time;u.until=e.time+this.chargeTime;u.lockAt=u.until-this.lockTime;u.waitBudget=.75;u.locked=false;u.lockCue=false;u.compressionCue=false;u.scopeCloseAt=null;u.scopeLock=null;
      u.aim=G.World.aim(b,t,this.bulletSpeed,this.chargeTime);b.role.aimTracks??={};b.role.aimTracks.arcPierce={angle:u.aim,tick:-1};b.motionSpeed=b.speed*.24;
    },
    brace(b,t,e){this.prepareCharge(b,t,e);const u=b.arcana;this.event(b,e,'brace','arcRangerBreech',b,{style:'counterWake',history:[...u.history],life:.42});this.event(b,e,'charge','arcRangerCharge');
    },
    update(b,t,e,dt){const u=b.arcana;
      if(u.phase==='idle'){
        if(u.used||b.hp>b.maxHp*G.Arcana.ratio){u.waiting='';return;}
        if(!G.Awakening.active(b)||!t)return;
        G.Ranger.init(b);if(b.role.sniperPhase!=='idle'||b.role.sniperPending!==null){u.waiting='等待当前狙击';return;}
        u.waiting=G.Arcana.protected(t,e,'ranger');if(u.waiting)return;
        u.waiting='警戒 · 等待来袭';for(const threat of this.threats(b,e)){const route=this.route(b,threat,e);if(!route){u.waiting='警戒 · 等待闪避空间';continue;}
          const source=e.balls.find(v=>v.id===threat.owner&&v.hp>0),attacker=source?.demonServant?(G.World.targetFor(b,e)||source):source;if(attacker&&!G.Arcana.protected(attacker,e,'ranger')){this.begin(b,attacker,threat,route,e);break;}}
        return;
      }
      if(!t){G.Arcana.finish(b,e);return;}
      if(u.phase==='counterStep'&&e.time+1e-9>=u.until){if(u.landing&&!u.stepBlocked){b.x=u.landing.x;b.y=u.landing.y;}this.separateExit(b,e);this.brace(b,t,e);return;}
      if(u.phase==='counterCharge'){
        if(e.time<u.lockAt-1e-9)u.aim=G.Aim.track(b,t,e,'arcPierce',this.bulletSpeed,Math.max(0,u.until-e.time),this.trackRate,dt*b.temporal.rate,true);
        else if(!u.locked){u.locked=true;if(u.scopeCloseAt===null)u.scopeCloseAt=e.time+this.lockHoldTime;const distance=Math.hypot(t.x-b.x,t.y-b.y);u.scopeLock={x:b.x+Math.cos(u.aim)*distance,y:b.y+Math.sin(u.aim)*distance};if(!u.lockCue){u.lockCue=true;this.event(b,e,'lock','arcRangerLock');e.hitStop(this.lockStopTime,{cinematic:true});}}
        if(!u.compressionCue&&e.time+1e-9>=u.until-.08&&!G.Arcana.immuneTarget(t,e)){
          u.compressionCue=true;u.compressionAt=e.time;
          this.event(b,e,'compression','arcRangerBreech',b,{style:'counterCompression',angle:u.aim,life:.25});
          e.hitStop(.055,{cinematic:true});
          // A protection wait can end on its deadline: still seat the breech before firing.
          if(e.time+1e-9>=u.until){u.until=e.time+.08;return;}
        }
        if(e.time+1e-9<u.until)return;
        if(G.Arcana.immuneTarget(t,e)){
          if(u.waitBudget<=1e-9){u.phase='counterRecovery';u.until=e.time+.2;G.Arcana.effect(e,b,'counterFizzle',b,{angle:u.aim,life:.32});e.signal(b,'反击收势 · 目标失锁','miss');return;}
          const delay=Math.min(.2,u.waitBudget);u.waitBudget-=delay;u.until=e.time+delay;u.lockAt=u.until-.16;u.locked=false;u.scopeLock=null;return;
        }
        this.fire(b,e);return;
      }
      if(u.phase==='counterRecovery'&&e.time>=u.until)G.Arcana.finish(b,e);
    },
    move(b,dt,e){const u=b.arcana;let bounced=false;if(u.phase==='counterCharge'&&u.locked){b.vx=b.vy=0;b.wallContact=null;return false;}if(u.phase==='counterStep'&&u.landing){if(u.stepBlocked)return false;const q=clamp((e.time-u.started)/.16,0,1),x=u.entry.x+(u.landing.x-u.entry.x)*q,y=u.entry.y+(u.landing.y-u.entry.y)*q,dx=x-b.x,dy=y-b.y,d=Math.hypot(dx,dy),limit=d?Math.min(d,G.ArenaWalls?.hit(b.x,b.y,dx/d,dy/d,b.radius,e).distance??d):0,next={x:b.x+(d?dx/d*limit:0),y:b.y+(d?dy/d*limit:0),radius:b.radius};if(G.Trapper&&!G.Trapper.legal(next,b.radius,e,b,false)){u.stepBlocked=true;}else{b.x=next.x;b.y=next.y;if(limit<d-.01)u.stepBlocked=true;}G.Physics.constrain(b);}else bounced=G.Physics.integrate(b,dt);
      if(u.phase==='counterStep'&&e.tick%3===0){u.history.unshift({x:b.x,y:b.y});u.history.length=Math.min(14,u.history.length);}return bounced;
    },
    finish(b,e){b.motionSpeed=0;b.inertia=0;G.Physics.normalizeSpeed(b);G.Ranger.reload(b,e);},
    fire(b,e){const u=b.arcana,a=u.aim,nx=Math.cos(a),ny=Math.sin(a),radius=5.5;
      const p={id:e.nextWorldId++,...(e.demonWorld?{heat:e.heatMultiplier}:{}),owner:b.id,mode:'arcPierce',noMirror:true,noMagnet:true,x:clamp(b.x+nx*(b.radius+radius+2),radius,C.width-radius),y:clamp(b.y+ny*(b.radius+radius+2),radius,C.height-radius),vx:nx*this.bulletSpeed,vy:ny*this.bulletSpeed,speed:this.bulletSpeed,radius,range:580,travel:0,bounces:0,maxBounces:0,expires:e.time+.65,raw:G.Arcana.defs.ranger.raw*e.heatMultiplier,history:[],color:b.def.color};
      e.projectiles.push(p);b.stats.shotsFired++;u.phase='counterRecovery';u.until=e.time+.32;b.motionSpeed=0;
      this.event(b,e,'release','arcRangerShot',p,{style:'counterMuzzle',angle:a,life:.65});G.Roles.shove(b,a+Math.PI,125,.5);b.hitVisual={age:0,life:.20,angle:a+Math.PI,power:1.3};
      G.Presentation?.note(e,'arcana.ranger.release',{actorId:b.id,projectileId:p.id,angle:a});
    },
    projectile(p,e,dt){if(e.state!=='running')return p;const b=e.balls.find(v=>v.id===p.owner&&v.hp>0);if(!b||e.time>p.expires)return null;
      const ox=p.x,oy=p.y,move=G.Flyers.move(p,e,dt);this.shatter(p,ox,oy,e,dt);p.history.unshift({x:ox,y:oy});p.history.length=Math.min(15,p.history.length);
      const hit=e.balls.filter(t=>t.hp>0&&G.World.enemy(b,t,e)&&!G.Ghost.phased(t)).map(t=>({t,at:G.World.sweep(p,ox,oy,t)})).filter(v=>v.at!==Infinity).sort((a,b)=>a.at-b.at)[0];
      if(hit){p.x=ox+(p.x-ox)*hit.at;p.y=oy+(p.y-oy)*hit.at;const reflected=G.Roles.intercept(p,hit.t,e);if(reflected)return reflected.absorbed?null:reflected;
        e.pendingAttacks.push({source:b,target:hit.t,kind:'arcPierce',raw:p.raw,heat:p.heat,bypassShield:true,shatterShield:true,healRatio:0,noReflect:!!p.noReflect,angle:Math.atan2(p.vy,p.vx),point:{x:p.x,y:p.y},incomingAngle:Math.atan2(-p.vy,-p.vx)});return null;
      }
      if(move.ended)G.Arcana.effect(e,b,'counterMiss',p,{angle:Math.atan2(p.vy,p.vx),life:.30});return move.ended?null:p;
    },
    hit(h,e){if(h.kind!=='arcPierce'||h.actual+h.blocked<=0||h.avoided)return;
      const b=h.source;if(b.arcana){b.arcana.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;}b.stats.shotsHit++;
      if(b.type==='ranger'&&h.actual>0){b.role.calibration=b.def.calibrationCap;b.role.calibrationUntil=e.time+6;}
      G.Roles.heavyImpact(b,h,e,'arcanaPierceContact','arcRangerHit',235,.07);if(h.actual>0){e.hitStop(.065,{cinematic:true});if(!G.Physics.armored(h.target)&&!G.World.absent(h.target,e))this.pin(h.target,h.angle,b,e);}G.Arcana.effect(e,b,h.actual>0?'counterHit':'counterBlock',h.point||h.target,{angle:h.angle,life:.7});
    },
    shatter(p,ox,oy,e,dt){for(const q of [...e.projectiles,...e.timeClocks]){if(q===p||q.rangerShattered||q.expires<e.time||!G.World.enemy(p.owner,q.owner,e)||/^arc/.test(q.mode||'')||q.arcanaOwner!==undefined||G.Priority?.protectedEntity(q,e)||!(G.Flyers.physical(q)||q.mode==='holyLance'))continue;const probe={x:p.x-(q.vx??Math.cos(q.angle||0)*(q.speed||0))*dt,y:p.y-(q.vy??Math.sin(q.angle||0)*(q.speed||0))*dt,radius:p.radius};if(G.World.sweep(probe,ox,oy,q)===Infinity)continue;q.rangerShattered=true;G.Aim?.result(q,e,false);if(q.mode==='boomerang')G.Characters.bladeRemoved(q,e.balls.find(b=>b.id===q.owner),e,false);G.Arcana.effect(e,e.balls.find(b=>b.id===p.owner),'counterShard',q,{angle:Math.atan2(p.vy,p.vx),color:q.color||'#a7bdca',fragmentId:q.id,life:.38});}e.timeClocks=e.timeClocks.filter(q=>!q.rangerShattered);},
    pin(t,a,b,e){const nx=Math.cos(a),ny=Math.sin(a),r=t.radius,box=t.combatBounds||{left:0,right:C.width,top:0,bottom:C.height},distance=Math.max(0,Math.min(nx>1e-6?(box.right-r-t.x)/nx:nx< -1e-6?(box.left+r-t.x)/nx:Infinity,ny>1e-6?(box.bottom-r-t.y)/ny:ny< -1e-6?(box.top+r-t.y)/ny:Infinity,G.ArenaWalls?.hit(t.x,t.y,nx,ny,r,e).distance??Infinity));t.rangerPin={owner:b.id,angle:a,x:t.x+nx*distance,y:t.y+ny*distance,until:e.time+1,wallAt:null};},
    pinMove(t,dt,e){const p=t.rangerPin;if(!p)return false;if(!e||e.state!=='running'||t.hp<=0||e.time>=p.until||G.Physics.armored(t)||G.World.absent(t,e)){delete t.rangerPin;return false;}t.wallContact=null;if(p.wallAt!==null){t.vx=t.vy=0;return true;}const d=Math.hypot(p.x-t.x,p.y-t.y),step=Math.min(d,1600*dt);t.vx=Math.cos(p.angle)*1600;t.vy=Math.sin(p.angle)*1600;t.x+=Math.cos(p.angle)*step;t.y+=Math.sin(p.angle)*step;if(d<=step+.001){p.wallAt=e.time;p.until=e.time+.65;t.vx=t.vy=0;const b=e.balls.find(b=>b.id===p.owner);if(b){this.event(b,e,'wall:'+t.id,'wallSlam',{x:t.x+Math.cos(p.angle)*t.radius,y:t.y+Math.sin(p.angle)*t.radius},{style:'counterWall',angle:p.angle,life:1.05});e.hitStop(.075,{cinematic:true});}}return true;},
    copy:'低血觉醒后警戒身体、冲锋、弹幕、激光、陷阱绊线、血契、毒区与圣阵等危险，综合路径、落点及短时后续风险择优脱险；约0.16秒真实闪步，期间无敌、可穿过小球与攻击，但不能穿墙。允许迎着宽幅攻击穿过去，或在角落闪到逼近者身后。到位后恢复受伤与碰撞，蓄力1.40秒，末0.48秒锁线：首次锁定额外全场时停0.32秒，完整镜面实际定住约0.48秒，0.10秒收镜、净场0.22秒再开枪；1350速度实体穿甲弹基础28伤，穿盾并碎盾，不追踪、不反弹、不受镜片折返或磁力偏转。临发无敌最多延迟0.75秒；沉默不打断奥义。智能选择低风险落点，击碎弹道上的敌方普通飞行物，实伤沿弹道击飞钉壁0.65秒；实际命中恢复满校准，落空不补判，结束恢复正常装填。'
  };
})(typeof window!=='undefined'?window:globalThis);
