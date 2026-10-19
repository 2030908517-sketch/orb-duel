(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Arcana-only module. Threat observation and real movement belong to combat;
  // the renderer receives snapshots and cannot decide a dodge or a hit.
  G.Arcana.defs.ranger={name:'死线·极限反击',raw:28};
  G.RangerArcana={
    chargeTime:1.08,lockTime:.16,bulletSpeed:1350,
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
        if(!G.World.enemy(p.owner,b,e)||!e.balls.some(v=>v.id===p.owner&&v.hp>0)||p.expires<e.time||!G.Flyers.physical(p)||p.mode==='arcBlood'&&!p.launched)continue;
        const samples=p.mode==='arcBlood'?[-30,-10,10].map(offset=>({...p,x:p.x+Math.cos(Math.atan2(p.vy,p.vx))*offset,y:p.y+Math.sin(Math.atan2(p.vy,p.vx))*offset})):[p];const hit=samples.map(q=>this.approach(b,q)).filter(Boolean).sort((a,b)=>a.at-b.at)[0];if(hit&&(!Number.isFinite(p.expires)||e.time+hit.at<=p.expires)&&(p.range===undefined||Math.hypot(hit.vx,hit.vy)*hit.at<=p.range-(p.travel||0)))list.push({...hit,kind:'projectile',owner:p.owner,id:p.id});
      }
      for(const t of e.balls){if(t.hp<=0||!G.World.enemy(b,t,e)||G.Ghost.phased(t)||G.Arcana.noContact(t)||G.Charge?.flowing(t))continue;
        const hit=this.approach(b,t);if(hit)list.push({...hit,kind:'body',owner:t.id,id:t.id});
        const l=t.laser,delay=l?.fireAt-e.time;
        if(l&&delay>0&&delay<=.22&&e.time>=l.trackUntil-1e-9){const origin=G.Awakening.predict(t,delay),ray=G.World.ray(origin,l.angle),point=G.Awakening.predict(b,delay);
          if(G.World.distanceToRay(ray,point)<=b.radius+10)list.push({kind:'laser',owner:t.id,id:t.id,at:delay,angle:l.angle,x:origin.x,y:origin.y,vx:Math.cos(l.angle)*1350,vy:Math.sin(l.angle)*1350,radius:10});
        }
      }
      return list.sort((a,b)=>a.at-b.at||a.owner-b.owner||a.id-b.id);
    },
    route(b,threat,e){if(b.magnetic.anchored)return null;let best=null;
      const threats=this.threats(b,e),duration=.16;
      const flyers=[...e.projectiles,...e.timeClocks].filter(p=>G.World.enemy(p.owner,b,e)&&G.Flyers.physical(p)&&(p.expires===undefined||p.expires>=e.time+duration)&&!(p.mode==='arcBlood'&&!p.launched)).concat(this.tideSamples(b,e));
      // The path may pass through bodies and attacks while invulnerable. Walls
      // remain solid; the landing and the start of the charge must be safe.
      for(const distance of [92,74,58])for(let turn=0;turn<24;turn++){
        const angle=threat.angle+turn*Math.PI/12,dx=Math.cos(angle)*distance,dy=Math.sin(angle)*distance,end={x:b.x+dx,y:b.y+dy};let legal=true;
        for(let i=1;i<=8;i++){const q=i/8,p={x:b.x+dx*q,y:b.y+dy*q,radius:b.radius};
          if((b.cageBounds||b.cageWalls?.length)&&G.Trapper&&!G.Trapper.legal(p,b.radius,e,b,false)){legal=false;break;}
          if(p.x<b.radius+3||p.x>C.width-b.radius-3||p.y<b.radius+3||p.y>C.height-b.radius-3||e.mode==='2v2'&&e.obstacles.some(o=>G.Team.overlaps(p,o,2))){legal=false;break;}
        }
        if(!legal)continue;let clearance=100;
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
        if(clearance<5)continue;
        const margin=Math.min(end.x-b.radius,C.width-b.radius-end.x,end.y-b.radius,C.height-b.radius-end.y),score=Math.min(85,clearance)*2+margin*.45+distance*.08;
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
      u.phase='counterStep';u.started=e.time;u.until=e.time+.16;u.target=t.id;u.returnAngle=Math.atan2(b.vy,b.vx);u.entry={x:b.x,y:b.y};u.history=[];u.threat={...threat};u.evadeAngle=route.angle;
      b.motionSpeed=route.distance/.16;b.inertia=0;b.vx=Math.cos(route.angle)*b.motionSpeed*b.temporal.rate;b.vy=Math.sin(route.angle)*b.motionSpeed*b.temporal.rate;
      this.event(b,e,'evade','arcRangerEvade',b,{style:'counterEvade',angle:route.angle,threatAngle:threat.angle,life:.5});
      G.Presentation?.note(e,'arcana.ranger.dodge',{actorId:b.id,threatKind:threat.kind,threatId:threat.id,arrival:threat.at});
    },
    brace(b,t,e){const u=b.arcana;u.phase='counterCharge';u.started=e.time;u.until=e.time+this.chargeTime;u.lockAt=u.until-this.lockTime;u.waitBudget=.75;u.locked=false;u.lockCue=false;
      u.aim=G.World.aim(b,t,this.bulletSpeed,this.chargeTime);b.role.aimTracks??={};b.role.aimTracks.arcPierce={angle:u.aim,tick:-1};b.motionSpeed=b.speed*.24;
      this.event(b,e,'brace','arcRangerBreech',b,{style:'counterWake',history:[...u.history],life:.42});this.event(b,e,'charge','arcRangerCharge');
    },
    update(b,t,e,dt){const u=b.arcana;
      if(u.phase==='idle'){
        if(u.used||b.hp>b.maxHp*G.Arcana.ratio){u.waiting='';return;}
        if(!G.Awakening.active(b)||!t)return;
        G.Ranger.init(b);if(b.role.sniperPhase!=='idle'||b.role.sniperPending!==null){u.waiting='等待当前狙击';return;}
        u.waiting=G.Arcana.protected(t,e,'ranger');if(u.waiting)return;
        u.waiting='警戒 · 等待来袭';for(const threat of this.threats(b,e)){const route=this.route(b,threat,e);if(!route){u.waiting='警戒 · 等待闪避空间';continue;}
          const attacker=e.balls.find(v=>v.id===threat.owner&&v.hp>0);if(attacker&&!G.Arcana.protected(attacker,e,'ranger')){this.begin(b,attacker,threat,route,e);break;}}
        return;
      }
      if(!t){G.Arcana.finish(b,e);return;}
      if(u.phase==='counterStep'&&e.time+1e-9>=u.until){this.separateExit(b,e);this.brace(b,t,e);return;}
      if(u.phase==='counterCharge'){
        if(e.time<u.lockAt-1e-9)u.aim=G.Aim.track(b,t,e,'arcPierce',this.bulletSpeed,Math.max(0,u.until-e.time),7,dt*b.temporal.rate,true);
        else if(!u.locked){u.locked=true;if(!u.lockCue){u.lockCue=true;this.event(b,e,'lock','arcRangerLock');}}
        if(e.time+1e-9<u.until)return;
        if(G.Arcana.immuneTarget(t,e)){
          if(u.waitBudget<=1e-9){u.phase='counterRecovery';u.until=e.time+.2;G.Arcana.effect(e,b,'counterFizzle',b,{angle:u.aim,life:.32});e.signal(b,'反击收势 · 目标失锁','miss');return;}
          const delay=Math.min(.2,u.waitBudget);u.waitBudget-=delay;u.until=e.time+delay;u.lockAt=u.until-this.lockTime;u.locked=false;return;
        }
        this.fire(b,e);return;
      }
      if(u.phase==='counterRecovery'&&e.time>=u.until)G.Arcana.finish(b,e);
    },
    move(b,dt,e){const u=b.arcana,bounced=G.Physics.integrate(b,dt);
      if(u.phase==='counterStep'&&e.tick%3===0){u.history.unshift({x:b.x,y:b.y});u.history.length=Math.min(14,u.history.length);}return bounced;
    },
    finish(b,e){b.motionSpeed=0;b.inertia=0;G.Physics.normalizeSpeed(b);G.Ranger.reload(b,e);},
    fire(b,e){const u=b.arcana,a=u.aim,nx=Math.cos(a),ny=Math.sin(a),radius=5.5;
      const p={id:e.nextWorldId++,owner:b.id,mode:'arcPierce',noMirror:true,noMagnet:true,x:clamp(b.x+nx*(b.radius+radius+2),radius,C.width-radius),y:clamp(b.y+ny*(b.radius+radius+2),radius,C.height-radius),vx:nx*this.bulletSpeed,vy:ny*this.bulletSpeed,speed:this.bulletSpeed,radius,range:580,travel:0,bounces:0,maxBounces:0,expires:e.time+.65,raw:G.Arcana.defs.ranger.raw*e.heatMultiplier,history:[],color:b.def.color};
      e.projectiles.push(p);b.stats.shotsFired++;u.phase='counterRecovery';u.until=e.time+.32;b.motionSpeed=0;
      this.event(b,e,'release','arcRangerShot',p,{style:'counterMuzzle',angle:a,life:.65});G.Roles.shove(b,a+Math.PI,125,.5);b.hitVisual={age:0,life:.20,angle:a+Math.PI,power:1.3};
      G.Presentation?.note(e,'arcana.ranger.release',{actorId:b.id,projectileId:p.id,angle:a});
    },
    projectile(p,e,dt){if(e.state!=='running')return p;const b=e.balls.find(v=>v.id===p.owner&&v.hp>0);if(!b||e.time>p.expires)return null;
      const ox=p.x,oy=p.y,move=G.Flyers.move(p,e,dt);p.history.unshift({x:ox,y:oy});p.history.length=Math.min(15,p.history.length);
      const hit=e.balls.filter(t=>t.hp>0&&G.World.enemy(b,t,e)&&!G.Ghost.phased(t)).map(t=>({t,at:G.World.sweep(p,ox,oy,t)})).filter(v=>v.at!==Infinity).sort((a,b)=>a.at-b.at)[0];
      if(hit){p.x=ox+(p.x-ox)*hit.at;p.y=oy+(p.y-oy)*hit.at;const reflected=G.Roles.intercept(p,hit.t,e);if(reflected)return reflected.absorbed?null:reflected;
        e.pendingAttacks.push({source:b,target:hit.t,kind:'arcPierce',raw:p.raw,bypassShield:true,shatterShield:true,healRatio:0,noReflect:!!p.noReflect,angle:Math.atan2(p.vy,p.vx),point:{x:p.x,y:p.y},incomingAngle:Math.atan2(-p.vy,-p.vx)});return null;
      }
      if(move.ended)G.Arcana.effect(e,b,'counterMiss',p,{angle:Math.atan2(p.vy,p.vx),life:.30});return move.ended?null:p;
    },
    hit(h,e){if(h.kind!=='arcPierce'||h.actual+h.blocked<=0||h.avoided)return;
      const b=h.source;if(b.arcana){b.arcana.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;}b.stats.shotsHit++;
      if(b.type==='ranger'&&h.actual>0){b.role.calibration=b.def.calibrationCap;b.role.calibrationUntil=e.time+6;}
      G.Roles.heavyImpact(b,h,e,'arcanaPierceContact','arcRangerHit',235,.07);G.Arcana.effect(e,b,'counterHit',h.point||h.target,{angle:h.angle,life:.7});
    },
    copy:'低血觉醒后警戒来弹、近身撞击与锁线激光，优先选择能避开伤害的路线；约0.16秒真实闪步，期间无敌、可穿过小球与攻击，但不能穿墙。允许迎着宽幅攻击穿过去，或在角落闪到逼近者身后。到位后恢复受伤与碰撞，蓄力1.08秒，末0.16秒锁线；1350速度实体穿甲弹基础28伤，穿盾并碎盾，不追踪、不反弹、不受镜片折返或磁力偏转。临发无敌最多延迟0.75秒；蓄力可被沉默打断。实际命中恢复满校准，落空不补判，结束恢复正常装填。'
  };
})(typeof window!=='undefined'?window:globalThis);
