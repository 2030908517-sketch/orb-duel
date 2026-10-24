(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // These one-use bursts are gated by the actor's health and resources, never match time.
  G.Arcana={
    ratio:.4,
    defs:{normal:{name:'瞬身·破阵轰拳',raw:32},accelerator:{name:'断空·音障崩裂',raw:25},vampire:{name:'血月·噬心回流',raw:10}},
    fresh(){return {phase:'idle',used:false,started:0,until:0,target:null,aim:0,anchor:null,travel:0,budget:0,healBudget:20,impactDone:false,history:[],waiting:'',casts:0,hits:0};},
    reset(e){e.arcanaWorld={cones:[]};for(const b of e.balls)if(this.defs[b.type])b.arcana=this.fresh();},
    busy(b){return !!b.arcana&&b.arcana.phase!=='idle';},
    noContact(b){return ['punch','rush','punchRecovery'].includes(b.arcana?.phase);},
    immune(b){return b.arcana?.phase==='rush'&&b.hp>0;},
    immuneTarget(t,e){return G.Ghost.phased(t)||G.Awakening.dashing(t,e)||this.immune(t);},
    protected(t,e,type){if(this.immuneTarget(t,e))return '等待无敌结束';if(t.stance?.phase==='active')return '等待反伤结束';if(type!=='accelerator'&&t.shield>0)return '等待护盾结束';return '';},
    effect(e,b,style,p=b,extra={}){e.effects.push({kind:'arcana',style,owner:b.id,x:p.x,y:p.y,color:b.def.color,age:0,life:.4,...extra});},
    stop(e,seconds){if(e.state!=='running')return;if(e.lastHitStop!==e.time){e.hitStopSerial++;e.hitStopDuration=0;e.lastHitStop=e.time;}e.hitStopDuration=Math.max(e.hitStopDuration,Math.min(.8,seconds));},
    resources(b,t,e){if(b.type==='normal')return b.charges>=3?'':'等待满拳势';if(b.type==='accelerator')return b.speed>=245&&Math.hypot(b.x-t.x,b.y-t.y)>=100?'':'等待速度/距离';return b.role.blood>=3&&t.role.bloodMark?.owner===b.id&&t.role.bloodMark.until>e.time?'':'等待血能/血印';},
    start(b,t,e){const u=b.arcana;u.phase='warning';u.started=e.time;u.until=e.time+(b.type==='vampire'?1.05:.8);u.target=t.id;u.aim=G.World.aim(b,t,1050,.3);u.anchor=G.Awakening.predict(t,.18);u.waiting='';
      e.signal(b,'奥义预警 · '+this.defs[b.type].name,b.type==='normal'?'arcFistCharge':b.type==='accelerator'?'arcSonicCharge':'arcBloodCharge');
    },
    cancel(b,e){const u=b.arcana;if(u.used){this.finish(b,e);return;}u.phase='idle';u.target=null;u.anchor=null;u.history=[];u.waiting='重新择机';e.signal(b,'奥义收势 · 保留机会','miss');},
    commit(b,e){const u=b.arcana;u.used=true;u.casts++;u.waiting='';b.stats.arcanaCasts=(b.stats.arcanaCasts||0)+1;e.log(e.label(b)+'释放奥义 · '+this.defs[b.type].name);},
    near(t,b,e){const base=Math.atan2(b.y-t.y,b.x-t.x);for(const gap of [7,24,42])for(let i=0;i<24;i++){const angle=base+(i%2?1:-1)*Math.ceil(i/2)*TAU/24,d=b.radius+t.radius+gap,p={x:t.x+Math.cos(angle)*d,y:t.y+Math.sin(angle)*d,radius:b.radius};
        if(p.x<p.radius+1||p.x>C.width-p.radius-1||p.y<p.radius+1||p.y>C.height-p.radius-1)continue;
        if(e.mode==='2v2'&&e.obstacles.some(o=>G.Team.overlaps(p,o,1)))continue;
        if(e.balls.some(v=>v!==b&&v!==t&&v.hp>0&&!G.Ghost.phased(v)&&Math.hypot(p.x-v.x,p.y-v.y)<v.radius+p.radius+1))continue;return p;
      }return null;},
    blink(b,t,e){const p=this.near(t,b,e);if(!p)return false;const from={x:b.x,y:b.y};this.commit(b,e);b.arcana.returnAngle=Math.atan2(b.vy,b.vx);b.x=b.previousX=p.x;b.y=b.previousY=p.y;b.arcana.aim=Math.atan2(t.y-b.y,t.x-b.x);b.arcana.phase='punch';b.arcana.until=e.time+C.dt;b.charges=0;G.Pursuit.interrupt(b);b.vx=b.vy=0;b.inertia=0;
      this.effect(e,b,'blink',from,{endX:b.x,endY:b.y,angle:b.arcana.aim,life:1.25});this.effect(e,b,'fistPose',b,{angle:b.arcana.aim,life:.6});e.sound('arcBlink',b.x);this.stop(e,.68);return true;
    },
    punch(b,t,e){const u=b.arcana;u.phase='punchRecovery';u.until=e.time+.13;
      // A punch is its own attack, with no reciprocal body contact or extra ordinary heavy hit.
      if(t&&t.hp>0&&Math.hypot(t.x-b.x,t.y-b.y)<=120&&G.Mines.freeLine(b,t,e)){u.aim=Math.atan2(t.y-b.y,t.x-b.x);e.pendingAttacks.push({source:b,target:t,kind:'arcFist',raw:this.defs.normal.raw*e.heatMultiplier,angle:u.aim,point:{x:b.x,y:b.y},healRatio:0});}
      this.effect(e,b,'fist',b,{angle:u.aim,life:1.35});e.sound('arcFistRelease',b.x);
    },
    rush(b,t,e){const u=b.arcana;this.commit(b,e);u.phase='rush';u.started=e.time;u.budget=clamp(Math.hypot(u.anchor.x-b.x,u.anchor.y-b.y)-65,35,290);u.travel=0;u.power=clamp((b.speed-b.def.speed)/(b.def.maxSpeed-b.def.speed),0,1);u.history=[];u.until=e.time+.65;
      b.motionSpeed=1050;b.inertia=0;b.vx=Math.cos(u.aim)*1050*b.temporal.rate;b.vy=Math.sin(u.aim)*1050*b.temporal.rate;u.cruise=b.speed;e.sound('arcSonicRush',b.x);this.effect(e,b,'rushStart',b,{angle:u.aim,life:.8});
    },
    sonic(b,e){const u=b.arcana,angle=Math.atan2(b.vy,b.vx);b.motionSpeed=0;b.inertia=0;b.speed=Math.max(b.def.speed,Math.min(b.def.dashRecoveryCap,b.speed*.72));b.awakening.dashUntil=e.time;b.awakening.stopAfterContact=false;u.phase='sonicRecovery';u.until=e.time+.24;b.vx=Math.cos(angle)*b.speed*b.temporal.rate;b.vy=Math.sin(angle)*b.speed*b.temporal.rate;
      e.arcanaWorld.cones.push({id:e.nextWorldId++,owner:b.id,x:b.x,y:b.y,angle,travel:0,previous:0,reach:185,speed:820,raw:(this.defs.accelerator.raw+u.power*7)*e.heatMultiplier,hitIds:[],until:e.time+.3});this.effect(e,b,'sonic',b,{angle,life:1.6});e.sound('arcSonicRelease',b.x);this.stop(e,.26);
    },
    blood(b,t,e){const u=b.arcana;this.commit(b,e);b.role.blood-=3;if(t.role.bloodMark?.owner===b.id)t.role.bloodMark=null;u.phase='bloodRecovery';u.until=e.time+.9;u.healBudget=20;u.impactDone=false;
      const center=G.Awakening.predict(t,.16),base=Math.atan2(b.y-center.y,b.x-center.x);u.anchor={...center};for(let i=0;i<3;i++){const a=base+i*TAU/3;let p={x:clamp(center.x+Math.cos(a)*112,72,C.width-72),y:clamp(center.y+Math.sin(a)*112,72,C.height-72)};if(e.mode==='2v2')p=G.Team.freePoint(p,15,e.obstacles);const angle=Math.atan2(center.y-p.y,center.x-p.x),distance=Math.hypot(center.x-p.x,center.y-p.y);
        e.projectiles.push({id:e.nextWorldId++,owner:b.id,mode:'arcBlood',arcanaOwner:b.id,x:p.x,y:p.y,vx:Math.cos(angle)*420,vy:Math.sin(angle)*420,speed:420,radius:15,range:distance+100,travel:0,bounces:0,maxBounces:0,expires:e.time+1.25,formedAt:e.time,armAt:e.time+.24,aimTarget:t.id,launched:false,color:b.def.color,raw:this.defs.vampire.raw*e.heatMultiplier,history:[]});
      }this.effect(e,b,'bloodSeal',center,{life:1.5});e.sound('arcBloodRelease',center.x);this.stop(e,.36);
    },
    update(e,dt){if(e.state!=='running')return;for(const b of e.balls){const u=b.arcana;if(!u||b.hp<=0)continue;const t=u.target!==null?e.balls.find(t=>t.id===u.target&&t.hp>0&&G.World.enemy(b,t,e)):G.World.targetFor(b,e);
        if(u.phase==='idle'){if(u.used)continue;if(b.hp>b.maxHp*this.ratio){u.waiting='';continue;}if(!G.Awakening.active(b)||!t)continue;
          const busy=G.VampireHunt?.busy(b)||G.Awakening.dashing(b,e)||b.awakening.chargeUntil>e.time||b.awakening.chainActive||b.role.chainWarning||b.role.pursuitUntil>e.time;if(busy){u.waiting='等待当前动作';continue;}
          u.waiting=this.protected(t,e,b.type)||this.resources(b,t,e);if(!u.waiting)this.start(b,t,e);continue;
        }
        if(u.phase==='warning'){
          if(!t||b.hp>b.maxHp*this.ratio||this.protected(t,e,b.type)||this.resources(b,t,e)){this.cancel(b,e);continue;}
          if(e.time<u.until-.12){u.aim=G.World.aim(b,t,1050,Math.max(0,u.until-e.time)+.08);u.anchor=G.Awakening.predict(t,Math.max(0,u.until-e.time)+.13);}
          if(e.time+1e-9>=u.until){if(b.type==='normal'){if(!this.blink(b,t,e))this.cancel(b,e);}else if(b.type==='accelerator')this.rush(b,t,e);else this.blood(b,t,e);}continue;
        }
        if(u.phase==='punch'&&e.time+1e-9>=u.until)this.punch(b,t,e);
        else if(u.phase==='rush'&&e.time>=u.until)this.sonic(b,e);
        else if(['punchRecovery','sonicRecovery','bloodRecovery'].includes(u.phase)&&e.time>=u.until)this.finish(b,e);
      }
    },
    move(b,dt,e){const u=b.arcana;if(u.phase==='rush'){const bounced=G.Physics.integrate(b,dt);u.travel+=Math.hypot(b.vx,b.vy)*dt;if(e.tick%2===0){u.history.unshift({x:b.x,y:b.y});u.history.length=Math.min(28,u.history.length);}if(u.travel>=u.budget)this.sonic(b,e);return bounced;}
      b.vx=b.vy=0;return false;
    },
    customMove(b){return ['rush','punch','punchRecovery'].includes(b.arcana?.phase);},
    finish(b,e){const u=b.arcana;if(u.phase==='rush'){b.motionSpeed=0;b.speed=Math.max(b.def.speed,Math.min(b.def.dashRecoveryCap,b.speed*.72));}if(['punch','punchRecovery'].includes(u.phase)){b.vx=Math.cos(u.returnAngle)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle)*b.speed*b.temporal.rate;}u.phase='idle';u.history=[];u.target=null;b.inertia=0;G.Physics.normalizeSpeed(b);},
    interrupt(b,e,reason){if(reason==='silence')return false;if(!this.busy(b))return false;if(!b.arcana.used)this.cancel(b,e);else this.finish(b,e);return true;},
    bloodSweep(p,ox,oy,t,e){if(!G.Mines.freeLine(p,t,e))return Infinity;const length=Math.hypot(p.vx,p.vy)||1,nx=p.vx/length,ny=p.vy/length;return Math.min(...[-30,-10,10].map(d=>G.World.sweep({...p,x:p.x+nx*d,y:p.y+ny*d},ox+nx*d,oy+ny*d,t)));},
    projectile(p,e,dt){if(e.state!=='running')return p;const b=e.balls.find(b=>b.id===p.owner&&b.hp>0);if(!b||e.time>p.expires)return null;
      // Visible formation is harmless. Each blade acquires one lead at launch, never homes in flight.
      if(!p.launched){if(e.time<p.armAt)return p;const target=e.balls.find(t=>t.id===p.aimTarget&&t.hp>0&&G.World.enemy(b,t,e));if(target){const lead=G.Awakening.predict(target,Math.min(.28,Math.hypot(target.x-p.x,target.y-p.y)/p.speed)),a=Math.atan2(lead.y-p.y,lead.x-p.x);p.vx=Math.cos(a)*p.speed;p.vy=Math.sin(a)*p.speed;p.range=Math.hypot(lead.x-p.x,lead.y-p.y)+100;}p.launched=true;if(!e.soundEvents.some(s=>s.kind==='arcBloodClose'))e.sound('arcBloodClose',p.x);}
      const ox=p.x,oy=p.y,move=G.Flyers.move(p,e,dt);if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y});p.history.length=Math.min(30,p.history.length);}
      const hits=e.balls.filter(t=>G.World.enemy(b,t,e)&&t.hp>0&&!G.Ghost.phased(t)).map(t=>({t,u:this.bloodSweep(p,ox,oy,t,e)})).filter(v=>v.u!==Infinity).sort((a,b)=>a.u-b.u),first=hits[0];
      if(first){p.x=ox+(p.x-ox)*first.u;p.y=oy+(p.y-oy)*first.u;const reflected=G.Roles.intercept(p,first.t,e);if(reflected)return reflected.absorbed?null:reflected;e.pendingAttacks.push({source:b,target:first.t,kind:'arcBlood',raw:p.raw,angle:Math.atan2(p.vy,p.vx),point:{x:p.x,y:p.y},arcanaHeal:p.arcanaOwner===b.id,healRatio:0,noReflect:!!p.noReflect});this.effect(e,b,'bloodHit',p,{angle:Math.atan2(p.vy,p.vx),life:.9});return null;}return move.ended?null:p;
    },
    world(e,dt){if(e.state!=='running')return;e.arcanaWorld.cones=e.arcanaWorld.cones.filter(w=>{const b=e.balls.find(b=>b.id===w.owner&&b.hp>0);if(!b||e.time>w.until)return false;w.previous=w.travel;w.travel=Math.min(w.reach,w.travel+w.speed*dt);const nx=Math.cos(w.angle),ny=Math.sin(w.angle);
        for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0||w.hitIds.includes(t.id))continue;const old={x:t.previousX??t.x,y:t.previousY??t.y},delta={x:t.x-old.x,y:t.y-old.y},before=(old.x-w.x)*nx+(old.y-w.y)*ny,after=(t.x-w.x)*nx+(t.y-w.y)*ny;
          // Swept front/lateral overlap; a shield is shattered only by a real, nonimmune hit.
          if(Math.min(before,after)>w.travel+t.radius||Math.max(before,after)<w.previous-t.radius)continue;const u=clamp((w.travel-before)/((after-before)||1),0,1),px=old.x+delta.x*u,py=old.y+delta.y*u,lateral=Math.abs(-(px-w.x)*ny+(py-w.y)*nx),forward=(px-w.x)*nx+(py-w.y)*ny;
          if(forward< -t.radius||lateral>12+Math.max(0,forward)*.43+t.radius||!G.Mines.freeLine(w,t,e))continue;
          if(this.immuneTarget(t,e))continue;w.hitIds.push(t.id);e.pendingAttacks.push({source:b,target:t,kind:'arcSonic',raw:w.raw,bypassShield:true,shatterShield:true,healRatio:0,angle:w.angle,point:{x:w.x,y:w.y}});
        }return w.travel<w.reach;});
    },
    mixedDamage(target,total,ordinary,piercing,shatter,e,trueRaw=0,trueOrdinary=0){if(this.immuneTarget(target,e))return G.Combat.applyDamage(target,total,e,{bypassShield:true});
      const reduction=1-G.Combat.reduction(target,e);if(trueRaw){const truePiercing=trueRaw-trueOrdinary;ordinary=(ordinary-trueOrdinary)*reduction+trueOrdinary;piercing=(piercing-truePiercing)*reduction+truePiercing;}
      const old=target.shield,blocked=Math.min(old,ordinary);target.shield-=blocked;target.stats.absorbed+=blocked;G.Roles.absorb(target,blocked,e);
      if(old>0&&(target.shield<=0||shatter)){target.shield=0;target.shieldUntil=0;if(target.type==='shield'&&G.Awakening.active(target)){target.awakening.pendingBurst=true;G.Roles.shieldEnd(target,e);}e.signal(target,'音爆破盾','break');e.burst(target.x,target.y,target.def.color,18);this.effect(e,target,'shatter',target,{life:.45});}
      const healthRaw=ordinary-blocked+piercing,result=G.Combat.applyDamage(target,healthRaw,e,{bypassShield:true,damageReduced:true});if(blocked)e.float(target.x,target.y+30,'盾 −'+blocked.toFixed(1),target.def.color);
      return {...result,blocked,...(trueRaw?{trueAware:true,ordinaryScale:reduction}:{}),ordinaryRaw:ordinary,piercingRaw:piercing,ordinaryActual:healthRaw>0?result.actual*(ordinary-blocked)/healthRaw:0,piercingActual:healthRaw>0?result.actual*piercing/healthRaw:0};
    },
    hit(h,e){const b=h.source,u=b.arcana;if(!['arcFist','arcSonic','arcBlood'].includes(h.kind)||h.actual+h.blocked<=0||h.avoided)return;
      if(u){u.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;}
      if(h.kind==='arcFist'){G.Roles.heavyImpact(b,h,e,'fistHit','arcFistHit',430,.075);this.effect(e,b,'fistImpact',h.target,{angle:h.angle,life:1.7});this.stop(e,.34);}
      if(h.kind==='arcSonic'){G.Roles.heavyImpact(b,h,e,'pressureHit','arcSonicHit',420,.075);this.effect(e,b,'sonicImpact',h.target,{angle:h.angle,life:1.35});this.stop(e,.22);}
      if(h.kind==='arcBlood'){if(h.arcanaHeal&&u&&h.actual>0){const amount=Math.min(u.healBudget,h.actual*.8);u.healBudget-=amount;h.healRatio=amount/h.actual;this.effect(e,b,'returnBlood',h.target,{endX:b.x,endY:b.y,life:1});}
        G.Roles.heavyImpact(b,h,e,'bloodFinish','arcBloodHit',65,.06);if(u&&!u.impactDone){u.impactDone=true;this.stop(e,.22);this.effect(e,b,'bloodRupture',h.target,{life:1.45});}
      }
    },
    afterImpacts(hits,e){for(const h of hits){if(!['arcFist','arcSonic'].includes(h.kind)||h.actual+h.blocked<=0||h.avoided||h.target.magnetic.anchored)continue;const t=h.target;if(G.Physics.armored(t))continue;if(this.noContact(t)&&!this.immune(t))this.finish(t,e);const speed=Math.min(780,640+h.actual*3)*t.temporal.rate;t.vx=Math.cos(h.angle)*speed;t.vy=Math.sin(h.angle)*speed;t.inertia=1.15;t.impactDrag=1.55;G.Physics.limit(t);}},
    cleanup(e){if(e.arcanaWorld)e.arcanaWorld.cones=e.arcanaWorld.cones.filter(w=>e.balls.some(b=>b.id===w.owner&&b.hp>0));},
    slow(b,e,lost){if(this.busy(b)){b.arcana.started+=lost;b.arcana.until+=lost;}},
    snapshot(v){return {...v,anchor:v.anchor?{...v.anchor}:null,history:v.history?.map(p=>({...p})),hitIds:v.hitIds?[...v.hitIds]:undefined};},
    copy(type){const rules={normal:'满三格拳势，等待无敌/护盾/反伤结束，0.8秒预警后瞬身贴近；0.68秒全局定格蓄拳，32基础伤害与强击退，清空拳势，不结算双方接触伤害。',accelerator:'速度≥245且距离≥100，等待无敌/反伤结束；0.8秒预警后锁线高速突进、急停释放25至32伤的真实音爆锥，无视护盾并直接碎盾，仍可被无敌躲过；结束降速，不额外附赠墙伤。',vampire:'3血能与自己的有效血印，等待无敌/护盾/反伤结束；1.05秒预警后三向巨型血刃显形，0.24秒后独立预瞄并以420速度合拢，每刃10基础伤害，实际扣血的80%回血、整招最多20，取代常规吸血；消耗血印与3血能。'};return '奥义 · '+this.defs[type].name+'：仅自身生命≤40%且觉醒后择机释放，每局一次、不设时间门槛。'+rules[type];},
    status(b,e){const u=b.arcana;if(!u)return null;const phases={warning:'预警',punch:'定格蓄拳',punchRecovery:'轰拳',rush:'破音突进',sonicRecovery:'音爆',bloodRecovery:'血刃合拢'};return {label:'奥义',value:this.busy(b)?phases[u.phase]:u.used?'已使用':b.hp>b.maxHp*this.ratio?'≤40%解锁':u.waiting?'择机':'就绪'};}
  };
})(typeof window!=='undefined'?window:globalThis);
