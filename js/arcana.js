(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // These one-use bursts are gated by the actor's health and resources, never match time.
  G.Arcana={
    ratio:.3,
    health:{normal:280,accelerator:220,vampire:198,ranger:224},
    orbitRadius:94,
    defs:{normal:{name:'瞬身·破阵轰拳',raw:32},accelerator:{name:'极境·环天压爆',raw:25},vampire:{name:'血月·绞刃回流',raw:10}},
    fresh(){return {phase:'idle',used:false,started:0,until:0,target:null,aim:0,anchor:null,travel:0,budget:0,healBudget:20,impactDone:false,history:[],waiting:'',casts:0,hits:0};},
    reset(e){e.arcanaWorld={cones:[]};for(const b of e.balls){delete b.arcana;if(e.mode==='arcana'&&this.defs[b.type])b.arcana=this.fresh();}},
    busy(b){return !!b.arcana&&b.arcana.phase!=='idle';},
    noContact(b){return ['blink','punch','orbit','punchRecovery','counterStep','bloodMist','bloodBite','bloodReturn','bloodLiquefy','bloodTide','bloodReverse','bloodRebirth','bloodFinale'].includes(b.arcana?.phase);},
    immune(b){return G.VampireArcana?.immune(b)||['orbit','counterStep','bloodMist'].includes(b.arcana?.phase)&&b.hp>0;},
    immuneTarget(t,e){return G.World.absent(t,e)||G.Ghost.phased(t)||G.Awakening.dashing(t,e)||this.immune(t);},
    protected(t,e,type){if(!G.World.targetable(t,e))return '等待离场结束';if(this.immuneTarget(t,e))return '等待无敌结束';if(t.stance?.phase==='active')return '等待反伤结束';if(!['accelerator','ranger'].includes(type)&&t.shield>0)return '等待护盾结束';return '';},
    effect(e,b,style,p=b,extra={}){e.effects.push({kind:'arcana',style,castId:b.arcana?.castId,owner:b.id,x:p.x,y:p.y,color:b.def.color,age:0,life:.4,bornReal:e.presentationTime||0,...extra});},
    stop(e,seconds){if(e.state!=='running')return;if(e.lastHitStop!==e.time){e.hitStopSerial++;e.hitStopDuration=0;e.lastHitStop=e.time;}e.hitStopDuration=Math.max(e.hitStopDuration,Math.min(.8,seconds));},
    resources(b,t,e){if(b.type==='normal')return b.charges>=3?'':'等待满拳势';if(b.type==='accelerator')return b.speed>=245&&Math.hypot(b.x-t.x,b.y-t.y)>=100?'':'等待速度/距离';return b.role.blood>=3?'':'等待血能';},
    start(b,t,e){const u=b.arcana;u.phase='warning';G.Temporal.releaseControl(b);u.started=e.time;u.until=e.time+(b.type==='vampire'?.65:.8);u.target=t.id;u.aim=G.World.aim(b,t,1050,.3);u.anchor=G.Awakening.predict(t,.18);u.waiting='';
      e.signal(b,'奥义预警 · '+this.defs[b.type].name,b.type==='normal'?'arcFistCharge':b.type==='accelerator'?'arcSonicCharge':'arcBloodCharge');
    },
    cancel(b,e){const u=b.arcana;if(u.used){this.finish(b,e);return;}u.phase='idle';u.target=null;u.anchor=null;u.history=[];u.waiting='重新择机';e.signal(b,'奥义收势 · 保留机会','miss');},
    commit(b,e){G.Temporal.releaseControl(b);const u=b.arcana;u.used=true;u.casts++;u.castId='arcana:'+b.id+':'+e.tick;u.waiting='';b.stats.arcanaCasts=(b.stats.arcanaCasts||0)+1;e.log(e.label(b)+'释放奥义 · '+this.defs[b.type].name);this.effect(e,b,'subtitle',b,{title:this.defs[b.type].name,side:b.id,life:2.3});},
    near(t,b,e){const base=Math.hypot(t.vx,t.vy)>5?Math.atan2(t.vy,t.vx)+Math.PI:Math.atan2(t.y-b.y,t.x-b.x);for(const gap of [7,24,42])for(let i=0;i<24;i++){const angle=base+(i%2?1:-1)*Math.ceil(i/2)*TAU/24,d=b.radius+t.radius+gap,p={x:t.x+Math.cos(angle)*d,y:t.y+Math.sin(angle)*d,radius:b.radius};
        if((b.cageBounds||b.cageWalls?.length)&&G.Trapper&&!G.Trapper.legal(p,b.radius,e,b,false))continue;
        if(p.x<p.radius+1||p.x>C.width-p.radius-1||p.y<p.radius+1||p.y>C.height-p.radius-1)continue;
        if(e.mode==='2v2'&&e.obstacles.some(o=>G.Team.overlaps(p,o,1)))continue;
        if(e.balls.some(v=>v!==b&&v!==t&&v.hp>0&&!G.Ghost.phased(v)&&Math.hypot(p.x-v.x,p.y-v.y)<v.radius+p.radius+1))continue;return p;
      }return null;},
    blink(b,t,e){const p=this.near(t,b,e);if(!p)return false;const from={x:b.x,y:b.y};this.commit(b,e);b.arcana.returnAngle=Math.atan2(b.vy,b.vx);G.Demon?.relocated(b,e);b.x=b.previousX=p.x;b.y=b.previousY=p.y;b.arcana.aim=Math.atan2(t.y-b.y,t.x-b.x);b.arcana.phase='blink';b.arcana.until=e.time+.085;b.charges=0;G.Pursuit.interrupt(b);b.vx=b.vy=0;b.inertia=0;
      this.effect(e,b,'blink',from,{endX:b.x,endY:b.y,angle:b.arcana.aim,life:1.25});e.sound('arcBlink',b.x);return true;
    },
    punch(b,t,e){const u=b.arcana;u.phase='punchRecovery';u.until=e.time+.13;
      // A punch is its own attack, with no reciprocal body contact or extra ordinary heavy hit.
      if(t&&t.hp>0&&Math.hypot(t.x-b.x,t.y-b.y)<=120&&G.Mines.freeLine(b,t,e)){u.aim=Math.atan2(t.y-b.y,t.x-b.x);e.pendingAttacks.push({source:b,target:t,kind:'arcFist',raw:this.defs.normal.raw*e.heatMultiplier,angle:u.aim,point:{x:b.x,y:b.y},healRatio:0});}
      this.effect(e,b,'fist',b,{angle:u.aim,life:1.35});e.sound('arcFistRelease',b.x);
    },
    rush(b,t,e){const u=b.arcana;this.commit(b,e);u.phase='orbit';u.started=e.time;u.power=clamp((b.speed-b.def.speed)/(b.def.maxSpeed-b.def.speed),0,1);u.cruise=b.speed;
      const p=G.Awakening.predict(t,.22),margin=this.orbitRadius+24;u.center={x:clamp(p.x,margin,C.width-margin),y:clamp(p.y,margin,C.height-margin)};u.radius=this.orbitRadius;u.entry={x:b.x,y:b.y};u.startAngle=Math.atan2(b.y-u.center.y,b.x-u.center.x);const ex=u.center.x+Math.cos(u.startAngle)*u.radius,ey=u.center.y+Math.sin(u.startAngle)*u.radius,dx=ex-b.x,dy=ey-b.y,len=Math.hypot(dx,dy)||1;
      u.entryDuration=clamp(len/680,.18,.34);u.orbitDuration=1.05;u.until=e.time+u.entryDuration+u.orbitDuration;u.control={x:clamp((b.x+ex)/2-dy/len*32,24,C.width-24),y:clamp((b.y+ey)/2+dx/len*32,24,C.height-24)};u.locked=false;u.history=[];u.nextPass=e.time+u.entryDuration+.35;b.motionSpeed=1000;b.inertia=0;e.sound('arcOrbit',b.x);
    },
    sonic(b,e){const u=b.arcana,angle=u.startAngle+TAU*1.65;u.phase='sonicRecovery';u.until=e.time+.68;b.motionSpeed=0;b.inertia=0;b.speed=Math.max(b.def.speed,Math.min(b.def.dashRecoveryCap,b.speed*.72));b.vx=-Math.sin(angle)*b.speed*b.temporal.rate;b.vy=Math.cos(angle)*b.speed*b.temporal.rate;b.awakening.dashUntil=e.time;b.awakening.stopAfterContact=false;
      e.arcanaWorld.cones.push({id:e.nextWorldId++,owner:b.id,x:u.center.x,y:u.center.y,angle:0,inward:true,radius:u.radius,previous:u.radius,travel:0,reach:u.radius,speed:155,formedAt:e.time,spin:angle,raw:(this.defs.accelerator.raw+u.power*7)*e.heatMultiplier,hitIds:[],until:e.time+.7});this.effect(e,b,'sonic',u.center,{radius:u.radius,angle,life:.9});this.effect(e,b,'orbitWake',b,{history:u.history.slice(0,16).map(p=>({...p})),life:.32});e.sound('arcSonicRelease',u.center.x);
    },
    bloodSlots(b,t,anchor){const q=anchor||t,base=Math.atan2(b.y-q.y,b.x-q.x);return [0,1,2].map(slot=>{const a=base+slot*TAU/3,x=clamp(q.x+Math.cos(a)*112,72,C.width-72),y=clamp(q.y+Math.sin(a)*112,72,C.height-72);return {slot,x,y,angle:Math.atan2(q.y-y,q.x-x)};});},
    blood(b,t,e){if(G.VampireArcana)return G.VampireArcana.begin(b,t,e);const u=b.arcana;this.commit(b,e);b.role.blood-=3;if(t.role.bloodMark?.owner===b.id)t.role.bloodMark=null;u.phase='bloodRecovery';u.until=e.time+.9;u.healBudget=20;u.impactDone=false;
      const center=u.anchor||G.Awakening.predict(t,.16);u.anchor={...center};u.until=e.time+1.25;for(const p of this.bloodSlots(b,t,center)){const angle=p.angle,distance=Math.hypot(center.x-p.x,center.y-p.y),delay=.42+p.slot*.21;
        e.projectiles.push({id:e.nextWorldId++,owner:b.id,mode:'arcBlood',noMirror:true,noMagnet:true,arcanaOwner:b.id,slot:p.slot,x:p.x,y:p.y,vx:Math.cos(angle)*300,vy:Math.sin(angle)*300,speed:300,radius:15,range:distance+100,travel:0,bounces:0,maxBounces:0,expires:e.time+delay+1.25,formedAt:e.time,armAt:e.time+delay,aimTarget:t.id,launched:false,color:b.def.color,raw:this.defs.vampire.raw*e.heatMultiplier,history:[]});
      }this.effect(e,b,'bloodSeal',center,{life:1.5});e.sound('arcBloodRelease',center.x);
    },
    update(e,dt){if(e.state!=='running')return;for(const b of e.balls){const u=b.arcana;if(!u||b.hp<=0||G.Demon?.frozen?.(b,e)&&!G.Priority?.armoredArcana(b))continue;const t=u.target!==null?e.balls.find(t=>t.id===u.target&&G.World.targetable(t,e)&&G.World.enemy(b,t,e)):G.World.targetFor(b,e);
        if(b.type==='holy'&&G.HolySeals)continue;if(G.HolySeals?.canStart(b,e)===false&&!u.used)continue;
        if(G.ManualRoles?.arcanaUpdate(b,t,e,dt))continue;
        if(b.type==='demon'&&G.DemonArcana){G.DemonArcana.update(b,t,e,dt);continue;}
        // A prepared, target-dependent release waits for the locked actor to re-enter.
        const locked=e.balls.find(v=>v.id===u.target);
        if(G.World.absent(locked,e)&&['warning','counterStep','counterCharge','debtStep','debtWarning','laserFocus','laserForge'].includes(u.phase)){for(const key of ['started','until','lockAt'])if(Number.isFinite(u[key]))u[key]+=dt;continue;}
        if(G.BladeDance?.handles(b)){G.BladeDance.update(b,t,e,dt);continue;}
        if(b.type==='accelerator'&&G.Overdrive){G.Overdrive.update(b,e,dt);continue;}if(b.type==='time'&&G.TimeRewind)continue;if(b.type==='laser'&&G.LaserBlade){G.LaserBlade.arcanaUpdate(b,t,e,dt);continue;}
        if(G.Trapper?.handles(b)){G.Trapper.arcanaUpdate(b,e);continue;}
        if(G.DefenseArcana?.handles(b)){G.DefenseArcana.update(b,t,e,dt);continue;}
        if(b.type==='vampire'&&G.VampireArcana&&u.phase!=='idle'&&u.phase!=='warning'){G.VampireArcana.update(b,t,e,dt);continue;}
        if(b.type==='ranger'&&G.RangerArcana){G.RangerArcana.update(b,t,e,dt);continue;}
        if(u.phase==='idle'){if(u.used)continue;if(b.hp>b.maxHp*this.ratio){u.waiting='';continue;}if(!G.Awakening.active(b)||!t)continue;
          const busy=G.VampireHunt?.busy(b)||G.Awakening.dashing(b,e)||b.awakening.chargeUntil>e.time||b.awakening.chainActive||b.role.chainWarning||b.role.pursuitUntil>e.time;if(busy){u.waiting='等待当前动作';continue;}
          if(b.type==='normal'&&b.hp<b.maxHp*.1&&b.charges<3&&!this.protected(t,e,b.type)){b.charges=3;e.signal(b,'绝境拳势 · 奥义就绪','ready');}
          u.waiting=this.protected(t,e,b.type)||this.resources(b,t,e);if(!u.waiting)this.start(b,t,e);continue;
        }
        if(u.phase==='warning'){
          if(!t||b.hp>b.maxHp*this.ratio||this.protected(t,e,b.type)||this.resources(b,t,e)){this.cancel(b,e);continue;}
          if(e.time<u.until-.12){u.aim=G.World.aim(b,t,1050,Math.max(0,u.until-e.time)+.08);u.anchor=G.Awakening.predict(t,Math.max(0,u.until-e.time)+.13);}
          if(e.time+1e-9>=u.until){if(b.type==='normal'){if(!this.blink(b,t,e))this.cancel(b,e);}else if(b.type==='accelerator')this.rush(b,t,e);else this.blood(b,t,e);}continue;
        }
        if(u.phase==='blink'&&e.time+1e-9>=u.until){u.phase='punch';u.until=e.time+C.dt;this.effect(e,b,'fistPose',b,{angle:u.aim,life:.55});e.sound('arcFistTension',b.x);this.stop(e,.6);}
        else if(u.phase==='punch'&&e.time+1e-9>=u.until)this.punch(b,t,e);
        else if(u.phase==='orbit'&&e.time>=u.until)this.sonic(b,e);
        else if(['punchRecovery','sonicRecovery','bloodRecovery'].includes(u.phase)&&e.time>=u.until)this.finish(b,e);
      }
    },
    move(b,dt,e){if(b.arcana?.phase==='debtCharge'){b.vx=b.vy=0;return false;}if(b.type==='vampire'&&G.VampireArcana)return G.VampireArcana.move(b,dt,e);if(b.type==='ranger'&&G.RangerArcana)return G.RangerArcana.move(b,dt,e);const u=b.arcana;if(u.phase==='orbit'){const age=e.time-u.started,entry=u.entryDuration,q=clamp(age/entry,0,1),progress=clamp((age-entry)/u.orbitDuration,0,1),angle=u.startAngle+TAU*1.65*progress;
      if(age<entry+.75){const t=e.balls.find(t=>t.id===u.target&&t.hp>0);if(t){const lead=G.Awakening.predict(t,.12),margin=u.radius+24,goal={x:clamp(lead.x,margin,C.width-margin),y:clamp(lead.y,margin,C.height-margin)},dx=goal.x-u.center.x,dy=goal.y-u.center.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,170*dt*b.temporal.rate/d);u.center.x+=dx*k;u.center.y+=dy*k;}}
      else u.locked=true;
      const x=u.center.x+Math.cos(angle)*u.radius,y=u.center.y+Math.sin(angle)*u.radius,ox=b.x,oy=b.y;
      if(q<1){b.x=(1-q)**2*u.entry.x+2*(1-q)*q*u.control.x+q*q*x;b.y=(1-q)**2*u.entry.y+2*(1-q)*q*u.control.y+q*q*y;}else{b.x=x;b.y=y;}
      const length=Math.hypot(b.x-ox,b.y-oy),cap=b.motionSpeed*b.temporal.rate*dt;if(length>cap){b.x=ox+(b.x-ox)*cap/length;b.y=oy+(b.y-oy)*cap/length;}b.vx=(b.x-ox)/dt;b.vy=(b.y-oy)/dt;u.heading=angle;
      if(e.time>=u.nextPass){e.sound('arcOrbitPass',b.x);u.nextPass+=.38;}if(e.tick%2===0){u.history.unshift({x:b.x,y:b.y});u.history.length=Math.min(100,u.history.length);}return false;}
      b.vx=b.vy=0;return false;
    },
    customMove(b){return ['debtCharge','orbit','blink','punch','punchRecovery','counterStep','counterCharge','bloodMist','bloodBite','bloodReturn','bloodLiquefy','bloodTide','bloodReverse','bloodRebirth','bloodFinale'].includes(b.arcana?.phase);},
    finish(b,e){const u=b.arcana;if(b.type==='vampire'&&G.VampireArcana){b.motionSpeed=0;b.vx=Math.cos(u.returnAngle||0)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle||0)*b.speed*b.temporal.rate;}if(b.type==='ranger'&&G.RangerArcana)G.RangerArcana.finish(b,e);if(u.phase==='orbit'){b.motionSpeed=0;b.speed=Math.max(b.def.speed,Math.min(b.def.dashRecoveryCap,b.speed*.72));}if(['blink','punch','punchRecovery'].includes(u.phase)){b.vx=Math.cos(u.returnAngle)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle)*b.speed*b.temporal.rate;}u.phase='idle';u.history=[];u.target=null;b.inertia=0;G.Physics.normalizeSpeed(b);},
    interrupt(b,e,reason){if(reason==='silence')return false;if(!this.busy(b))return false;if(!b.arcana.used)this.cancel(b,e);else this.finish(b,e);return true;},
    bloodSweep(p,ox,oy,t,e){if(!G.Mines.freeLine(p,t,e))return Infinity;const length=Math.hypot(p.vx,p.vy)||1,nx=p.vx/length,ny=p.vy/length;return Math.min(...[-30,-10,10].map(d=>G.World.sweep({...p,x:p.x+nx*d,y:p.y+ny*d},ox+nx*d,oy+ny*d,t)));},
    projectile(p,e,dt){if(p.prison&&G.VampireArcana)return G.VampireArcana.projectile(p,e,dt);if(e.state!=='running')return p;const b=e.balls.find(b=>b.id===p.owner&&b.hp>0);if(!b||e.time>p.expires)return null;
      // Visible formation is harmless. Each blade acquires one lead at launch, never homes in flight.
      if(!p.launched){if(e.time<p.armAt)return p;const target=e.balls.find(t=>t.id===p.aimTarget&&t.hp>0&&G.World.enemy(b,t,e));if(!target)return null;const lead=G.Awakening.predict(target,Math.min(.32,Math.hypot(target.x-p.x,target.y-p.y)/p.speed)),a=Math.atan2(lead.y-p.y,lead.x-p.x);p.vx=Math.cos(a)*p.speed;p.vy=Math.sin(a)*p.speed;p.range=Math.hypot(lead.x-p.x,lead.y-p.y)+100;p.launched=true;p.launchedAt=e.time;e.sound(p.slot===2?'arcBloodLast':'arcBloodClose',p.x);this.effect(e,b,'bloodLaunch',p,{angle:a,slot:p.slot,life:.26});}
      const ox=p.x,oy=p.y,move=G.Flyers.move(p,e,dt);if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y});p.history.length=Math.min(30,p.history.length);}
      const hits=e.balls.filter(t=>G.World.enemy(b,t,e)&&t.hp>0&&!G.Ghost.phased(t)).map(t=>({t,u:this.bloodSweep(p,ox,oy,t,e)})).filter(v=>v.u!==Infinity).sort((a,b)=>a.u-b.u),first=hits[0];
      if(first){p.x=ox+(p.x-ox)*first.u;p.y=oy+(p.y-oy)*first.u;const reflected=G.Roles.intercept(p,first.t,e);if(reflected)return reflected.absorbed?null:reflected;e.pendingAttacks.push({source:b,target:first.t,kind:'arcBlood',raw:p.raw,angle:Math.atan2(p.vy,p.vx),point:{x:p.x,y:p.y},arcanaHeal:p.arcanaOwner===b.id,healRatio:0,noReflect:!!p.noReflect});return null;}if(move.ended)this.effect(e,b,'bloodMiss',p,{angle:Math.atan2(p.vy,p.vx),life:.22});return move.ended?null:p;
    },
    world(e,dt){if(e.state!=='running')return;G.DefenseArcana?.world(e,dt);G.VampireArcana?.world(e,dt);e.arcanaWorld.cones=e.arcanaWorld.cones.filter(w=>{const b=e.balls.find(b=>b.id===w.owner&&b.hp>0);if(!b||e.time>w.until)return false;if(w.inward){w.previous=w.radius;w.radius=Math.max(0,w.radius-w.speed*dt);w.travel=w.reach-w.radius;
          for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0||w.hitIds.includes(t.id)||this.immuneTarget(t,e))continue;const a=Math.hypot((t.previousX??t.x)-w.x,(t.previousY??t.y)-w.y),d=Math.hypot(t.x-w.x,t.y-w.y);if(Math.min(a,d)>w.previous+t.radius||Math.max(a,d)<w.radius-t.radius||!G.Mines.freeLine(w,t,e))continue;w.hitIds.push(t.id);e.pendingAttacks.push({source:b,target:t,kind:'arcSonic',raw:w.raw,bypassShield:true,shatterShield:false,healRatio:0,angle:Math.atan2(t.y-w.y,t.x-w.x),point:{x:t.x,y:t.y},waveOrigin:{x:w.x,y:w.y}});}
          return w.radius>0;}w.previous=w.travel;w.travel=Math.min(w.reach,w.travel+w.speed*dt);const nx=Math.cos(w.angle),ny=Math.sin(w.angle);
        for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0||w.hitIds.includes(t.id))continue;const old={x:t.previousX??t.x,y:t.previousY??t.y},delta={x:t.x-old.x,y:t.y-old.y},before=(old.x-w.x)*nx+(old.y-w.y)*ny,after=(t.x-w.x)*nx+(t.y-w.y)*ny;
          // Swept front/lateral overlap; the pressure front bypasses but never shatters shields.
          if(Math.min(before,after)>w.travel+t.radius||Math.max(before,after)<w.previous-t.radius)continue;const u=clamp((w.travel-before)/((after-before)||1),0,1),px=old.x+delta.x*u,py=old.y+delta.y*u,lateral=Math.abs(-(px-w.x)*ny+(py-w.y)*nx),forward=(px-w.x)*nx+(py-w.y)*ny;
          if(forward< -t.radius||lateral>12+Math.max(0,forward)*.43+t.radius||!G.Mines.freeLine(w,t,e))continue;
          if(this.immuneTarget(t,e))continue;w.hitIds.push(t.id);e.pendingAttacks.push({source:b,target:t,kind:'arcSonic',raw:w.raw,bypassShield:true,shatterShield:false,healRatio:0,angle:w.angle,point:{x:w.x,y:w.y}});
        }return w.travel<w.reach;});
    },
    mixedDamage(target,total,ordinary,piercing,shatter,e,trueRaw=0,trueOrdinary=0){if(this.immuneTarget(target,e))return G.Combat.applyDamage(target,total,e,{bypassShield:true});
        const reduction=1-G.Combat.reduction(target,e),truePiercing=trueRaw-trueOrdinary;total=(total-trueRaw)*reduction+trueRaw;ordinary=(ordinary-trueOrdinary)*reduction+trueOrdinary;piercing=(piercing-truePiercing)*reduction+truePiercing;
      const old=target.shield,royal=G.DefenseArcana?.absorbRoyal(target,ordinary,e)||0,normalBlocked=G.HolySeals?.defense(target,e)?0:Math.min(old,Math.max(0,ordinary-royal)),blocked=royal+normalBlocked;target.shield-=normalBlocked;target.stats.absorbed+=blocked;G.Roles.absorb(target,blocked,e);G.DefenseArcana?.afterAbsorb(target,e);if(shatter)G.DefenseArcana?.shatterRoyal(target,e);
      if(old>0&&(target.shield<=0||shatter)){target.shield=0;target.shieldUntil=0;if(target.type==='shield'&&G.Awakening.active(target)){target.awakening.pendingBurst=true;G.Roles.shieldEnd(target,e);}e.signal(target,'护盾破裂','break');e.burst(target.x,target.y,target.def.color,18);this.effect(e,target,'shatter',target,{life:.45});}
      const healthRaw=ordinary-blocked+piercing,result=G.Combat.applyDamage(target,healthRaw,e,{bypassShield:true,damageReduced:true});if(blocked)e.float(target.x,target.y+30,'盾 −'+blocked.toFixed(1),target.def.color);
        return {...result,blocked,...(trueRaw?{trueAware:true,ordinaryScale:reduction}:{}),ordinaryRaw:ordinary,piercingRaw:piercing,ordinaryActual:healthRaw>0?result.actual*(ordinary-blocked)/healthRaw:0,piercingActual:healthRaw>0?result.actual*piercing/healthRaw:0};
    },
    hit(h,e){if(h.kind==='arcDebt'){G.DefenseArcana?.hit(h,e);return;}if(G.VampireArcana&&(h.prison||h.kind==='arcBite'||h.kind==='arcTide')){G.VampireArcana.hit(h,e);return;}if(h.kind==='arcPierce'){G.RangerArcana?.hit(h,e);return;}const b=h.source,u=b.arcana;if(!['arcFist','arcSonic','arcBlood'].includes(h.kind)||h.actual+h.blocked<=0||h.avoided)return;
      if(u){u.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;}
      if(h.kind==='arcFist'){G.Roles.heavyImpact(b,h,e,'fistHit','arcFistHit',430,.075);this.effect(e,b,'fistImpact',h.target,{angle:h.angle,life:1.7});this.stop(e,.075);}
      if(h.kind==='arcSonic'){G.Roles.heavyImpact(b,h,e,'arcanaSonicContact','arcSonicHit',420,.06);this.effect(e,b,'sonicImpact',h.target,{angle:h.angle,centerX:h.waveOrigin?.x??h.target.x,centerY:h.waveOrigin?.y??h.target.y,life:.55});this.stop(e,.06);}
      if(h.kind==='arcBlood'){if(h.actual>0)this.groupNumber(e,'blood:'+b.id+':'+h.target.id,e.effects.findLast(f=>f.kind==='text'&&f.damageTarget===h.target.id&&f.age===0),'−');this.effect(e,b,h.actual>0?'bloodHit':'bloodBlock',h.point||h.target,{angle:h.angle,life:.5});if(h.arcanaHeal&&u&&h.actual>0){const amount=Math.min(u.healBudget,h.actual*.8);u.healBudget-=amount;h.healRatio=amount/h.actual;}
        G.Roles.heavyImpact(b,h,e,'arcanaBloodContact',h.actual>0?'arcBloodHit':'guardHeavy',55,0);if(u&&!u.impactDone&&h.actual>0){u.impactDone=true;this.stop(e,.045);}
      }
    },
    groupNumber(e,key,number,prefix){if(!number||number.arcanaGroup)return;const value=Number(number.text.match(/[\d.]+/)?.[0]);if(!Number.isFinite(value))return;const previous=e.effects.findLast(f=>f!==number&&f.arcanaGroup===key&&f.age<.7);if(previous){previous.groupValue+=value;previous.text=prefix+previous.groupValue.toFixed(1);previous.x=number.x;previous.y=number.y;previous.age=0;previous.life=.9;e.effects.splice(e.effects.indexOf(number),1);}else{number.arcanaGroup=key;number.groupValue=value;}},
    healed(b,amount,requested,hits,e){if(G.VampireArcana&&hits.some(h=>h.source===b&&['arcBite','arcTide'].includes(h.kind))){G.VampireArcana.healed(b,amount,requested,hits,e);return;}if(!b.arcana||amount<=0||requested<=0)return;let returned=false;for(const h of hits){if(h.source!==b||h.kind!=='arcBlood'||!h.arcanaHeal||h.actual<=0||!h.healRatio)continue;const actual=amount*h.actual*h.healRatio/requested;if(actual>0){returned=true;this.effect(e,b,'returnBlood',h.target,{endX:b.x,endY:b.y,amount:actual,life:.85});}}if(returned){this.groupNumber(e,'bloodHeal:'+b.id,e.effects.findLast(f=>f.kind==='text'&&f.text.startsWith('+')&&f.age===0),'+');e.sound('arcBloodReturn',b.x);}},
    afterImpacts(hits,e){for(const h of hits){if(!['arcFist','arcSonic'].includes(h.kind)||h.actual+h.blocked<=0||h.avoided||h.target.magnetic.anchored)continue;const t=h.target;if(G.Physics.armored(t))continue;if(this.noContact(t)&&!this.immune(t)){if(G.VampireArcana?.active(t))G.VampireArcana.cancel(t,e);else this.finish(t,e);}const speed=Math.min(780,640+h.actual*3)*t.temporal.rate;t.vx=Math.cos(h.angle)*speed;t.vy=Math.sin(h.angle)*speed;t.inertia=1.15;t.impactDrag=1.55;G.Physics.limit(t);}},
    cleanup(e){if(e.arcanaWorld)e.arcanaWorld.cones=e.arcanaWorld.cones.filter(w=>e.balls.some(b=>b.id===w.owner&&b.hp>0));},
    slow(b,e,lost){G.VampireArcana?.slow(b,e,lost);if(this.busy(b)){b.arcana.started+=lost;b.arcana.until+=lost;if(b.arcana.phase==='orbit')b.arcana.nextPass+=lost;if(b.arcana.phase==='counterCharge')b.arcana.lockAt+=lost;}},
    snapshot(v){return {...v,anchor:v.anchor?{...v.anchor}:null,history:v.history?.map(p=>({...p})),center:v.center?{...v.center}:undefined,...(v.waveBudget?{waveBudget:{...v.waveBudget}}:{}),entry:v.entry?{...v.entry}:undefined,threat:v.threat?{...v.threat}:undefined,control:v.control?{...v.control}:undefined,hitIds:v.hitIds?[...v.hitIds]:undefined};},
    copy(type){const rules={normal:'满三格拳势；低于10%生命且只差拳势时补满，等待无敌/护盾/反伤结束，0.8秒预警后瞬身贴近；0.6秒到位蓄势、命中短顿帧，32基础伤害与强击退，清空拳势，不结算双方接触伤害。',accelerator:'速度≥245且距离≥100，等待无敌/反伤结束；预警后侧切入场后高速环行，前段有限跟随、后段锁定，期间无敌且不结算碰撞；闭环后压力环向内实际传播，单敌限一次25至32伤，穿盾但不碎盾。敌人可逃出范围或以无敌躲避，结束降速。',vampire:'3血能与自己的有效血印，等待无敌/护盾/反伤结束；1.05秒预警后三向巨型血刃显形，0.42/0.63/0.84秒错位出手，各自预瞄后以300速度绞切，每刃10基础伤害，实际扣血的80%回血、整招最多20，取代常规吸血；消耗血印与3血能。'};return '奥义 · '+this.defs[type].name+'：仅自身生命≤30%且觉醒后择机释放，每局一次、不设时间门槛。'+(type==='ranger'?G.RangerArcana.copy:type==='vampire'&&G.VampireArcana?G.VampireArcana.copy:rules[type]);},
    status(b,e){const u=b.arcana;if(!u)return null;const phases={warning:'预警',blink:'瞬身到位',punch:'定格蓄拳',orbit:'环天疾行',punchRecovery:'轰拳',rush:'破音突进',sonicRecovery:'音爆',bloodRecovery:'错位绞切',bloodCage:'三刃血狱',bloodHunt:'收割择机',bloodMist:'化雾贴身',bloodBite:'贴身噬心',bloodReturn:'噬心回流',bloodLiquefy:'血肉崩解',bloodTide:'血潮猎杀',bloodReverse:'万血逆流',bloodRebirth:'猩红重生',bloodFinale:'重生收尾',counterStep:'极限闪避',counterCharge:'穿甲蓄力',counterRecovery:'反击收势'};return {label:'奥义',value:this.busy(b)?phases[u.phase]+(b.type==='ranger'?' '+Math.max(0,u.until-e.time).toFixed(1)+'s':''):u.used?'已使用':b.hp>b.maxHp*this.ratio?'≤30%解锁':u.waiting?(b.type==='ranger'?u.waiting:'择机'):'就绪'};}
  };
})(typeof window!=='undefined'?window:globalThis);
