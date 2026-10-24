(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  Object.assign(G.Arcana.defs,{shield:{name:'王城·天垒封锁'},reflector:{name:'旧债·逆命清算',raw:18}});
  Object.assign(G.Arcana.health,{shield:236,reflector:250});
  const D=G.DefenseArcana={
    debtCap:60,royalAmount:24,
    handles(b){return !!b.arcana&&['shield','reflector'].includes(b.type);},
    event(b,e,stage,cue,p=b,extra={}){const eventId=(b.arcana.castId||'debt:'+b.id+':'+e.tick)+':'+stage;G.Arcana.effect(e,b,stage,p,{eventId,life:.65,...extra});if(cue){e.sound(cue,p.x);const s=e.soundEvents.at(-1);if(s?.kind===cue)s.presentationId=eventId;}G.Presentation?.note(e,'arcana.stage',{eventId,stage,actorId:b.id,cue:cue||null,x:p.x,y:p.y});},
    reset(e){if(e.mode!=='arcana'||!e.balls.some(b=>this.handles(b)))return;e.arcanaWorld.defense={fortress:null,bolts:[],returns:[]};for(const b of e.balls)if(this.handles(b))Object.assign(b.arcana,{debts:{},debt:0,scarDebt:0,royalGranted:false,royalShield:0,royalActive:false,royalUntil:0,predictUntil:0});},
    beginShield(b,t,e){const u=b.arcana;G.Arcana.commit(b,e);u.target=t.id;u.phase='royalRise';u.started=e.time;u.royalGranted=false;
      let f=e.arcanaWorld.defense.fortress;if(f){f.owners.push(b.id);}else{f={owners:[b.id],started:e.time,phase:'rise',bounds:{left:0,right:C.width,top:0,bottom:C.height},lastStage:'rise'};e.arcanaWorld.defense.fortress=f;}u.until=f.started+6.95;this.event(b,e,'royalRise','arcRoyalRise',b,{life:.8});
    },
    grantRoyal(b,e,f){const u=b.arcana;if(u.royalGranted||b.hp<=0)return;u.royalGranted=true;b.shield=0;b.shieldUntil=0;u.royalShield=this.royalAmount;u.royalActive=true;u.royalUntil=f.started+6.2;this.event(b,e,'royalGuardGrant',null,b,{life:.45});},
    beginDebt(b,t,e){const u=b.arcana;G.Arcana.commit(b,e);u.phase='debtCharge';u.started=e.time;u.until=e.time+.9;u.target=t.id;u.returnAngle=Math.atan2(b.vy,b.vx);u.aim=G.World.aim(b,t,820,.9);u.debtSpend=Math.min(40,u.debt);b.vx=b.vy=0;b.inertia=0;this.event(b,e,'debtWake','arcDebtWake',b,{angle:u.aim,life:.9});},
    update(b,t,e,dt){const u=b.arcana;
      if(b.type==='shield'){
        if(u.royalActive&&(u.royalShield<=1e-9||e.time>=u.royalUntil))this.endRoyal(b,e);
        const f=e.arcanaWorld.defense.fortress;if(u.used){if(f?.owners.includes(b.id)){u.phase={rise:'royalRise',shrink:'royalShrink',hold:'royalHold',release:'royalRelease'}[f.phase];u.until=f.started+6.95;}else if(u.phase!=='idle'){u.phase='idle';u.target=null;}return;}
      }else if(u.phase==='debtCharge'){
        if(!t){this.finishDebt(b,e);return;}
        if(e.time<u.until-.16)u.aim=G.World.aim(b,t,820,Math.max(0,u.until-e.time));
        if(e.time+1e-9>=u.until){const spend=Math.min(u.debtSpend,u.debt);e.arcanaWorld.defense.bolts.push({...(e.demonWorld?{heat:1}:{}),id:e.nextWorldId++,owner:b.id,target:t.id,x:b.x,y:b.y,origin:{x:b.x,y:b.y},angle:u.aim,vx:Math.cos(u.aim)*820,vy:Math.sin(u.aim)*820,radius:10,raw:Math.min(18,6+spend*.28),spend,until:e.time+.6,history:[]});u.phase='debtRecovery';u.until=e.time+.55;this.event(b,e,'debtRelease','arcDebtRelease',b,{angle:u.aim,life:.55});b.vx=Math.cos(u.returnAngle)*b.speed*b.temporal.rate;b.vy=Math.sin(u.returnAngle)*b.speed*b.temporal.rate;}return;
      }else if(u.phase==='debtRecovery'){if(e.time>=u.until)this.finishDebt(b,e);return;}
      if(u.used||b.hp>b.maxHp*G.Arcana.ratio||!G.Awakening.active(b)||!t)return;
      if(G.Awakening.dashing(b,e)||b.awakening.chargeUntil>e.time){u.waiting='等待当前动作';return;}
      if(b.type==='reflector'&&(G.Arcana.immuneTarget(t,e)||u.debt<4)){u.waiting=u.debt<4?'等待旧债':'等待无敌结束';return;}
      u.waiting='';if(b.type==='shield')this.beginShield(b,t,e);else this.beginDebt(b,t,e);
    },
    finishDebt(b,e){if(b.arcana.phase==='debtCharge'){b.vx=Math.cos(b.arcana.returnAngle||0)*b.speed*b.temporal.rate;b.vy=Math.sin(b.arcana.returnAngle||0)*b.speed*b.temporal.rate;}b.arcana.phase='idle';b.arcana.target=null;},
    absorbRoyal(b,raw,e){const u=b.arcana;if(!this.handles(b)||b.type!=='shield'||!u.royalActive)return 0;const blocked=Math.min(u.royalShield,Math.max(0,raw));u.royalShield=Math.max(0,u.royalShield-blocked);return blocked;},
    afterAbsorb(b,e){if(b.arcana?.royalActive&&b.arcana.royalShield<=1e-9)this.endRoyal(b,e);},
    queueShield(b,e,reserve){const r=b.role;if(!G.Awakening.active(b)||G.Temporal.silenced(b,e)){r.pressure=0;return;}const pressure=r.pressure;r.pressure=0;if(pressure<=0&&reserve<=0)return;
      r.shieldReserve=(r.shieldReserve||0)+reserve;r.shieldRelease=Math.min(8,(r.shieldRelease||0)+pressure);
      if(!r.shieldFireAt||r.shieldFireAt<=e.time){const t=G.World.targetFor(b,e);r.shieldAngle=t?G.World.aim(b,t,390,.22):Math.atan2(b.vy,b.vx);r.shieldFireAt=e.time+.22;e.signal(b,'王城盾能 · 残盾汇流','pressureCharge');G.Roles.effect(b,e,'shieldGather',b,r.shieldAngle,.22);}b.awakening.pendingBurst=true;
    },
    endRoyal(b,e,shatter=false){const u=b.arcana;if(!u?.royalActive)return;const reserve=shatter?0:u.royalShield;u.royalActive=false;u.royalShield=0;this.queueShield(b,e,reserve);this.event(b,e,'royalGuardEnd',null,b,{life:.42});},
    shatterRoyal(b,e){this.endRoyal(b,e,true);},
    debtAdd(b,enemy,amount){const u=b.arcana;if(!u||b.type!=='reflector'||!(amount>0))return;const gain=Math.min(amount,this.debtCap-u.debt);u.debts[enemy]=(u.debts[enemy]||0)+gain;u.debt+=gain;},
    debtPay(b,enemy,amount){const u=b.arcana;if(!u||b.type!=='reflector')return 0;const paid=Math.min(u.debts[enemy]||0,Math.max(0,amount));u.debts[enemy]=Math.max(0,(u.debts[enemy]||0)-paid);u.debt=Math.max(0,u.debt-paid);return paid;},
    afterBatch(hits,e){if(!e.arcanaWorld?.defense)return;
      // First settle actual immediate return, then credit a detached stored counter
      // only when it really takes HP. Wall and reflected-return packets never accrue debt.
      for(const h of hits)if(h.target.type==='reflector'&&h.actual>0&&h.kind!=='reflection'&&h.damageOrigin!=='wall'&&h.kind!=='wallSlam'&&!(h.kind==='magneticWall'&&h.pullWall)&&G.World.enemy(h.source,h.target,e))this.debtAdd(h.target,h.source.id,Math.max(0,h.actual-(h.reflectedActual||0)));
      for(const h of hits)if(h.source.type==='reflector'&&h.storedCounter&&h.actual>0)this.debtPay(h.source,h.target.id,h.actual);
    },
    hit(h,e){if(h.avoided||h.actual<=0){if(!h.avoided&&h.blocked>0&&h.target.arcana?.royalActive)G.Priority?.pull(h.source,h.target,e);return;}const b=h.source,u=b.arcana;if(!u)return;h.feedback={style:'debtImpact',cue:'arcDebtHit',push:0,stop:.065,power:2.4,presented:true};this.debtPay(b,h.target.id,h.debtSpend||0);u.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;u.predictUntil=e.time+4;
      const list=e.arcanaWorld.defense.returns;if(G.Priority)G.Priority.pull(b,h.target,e);else list.push({owner:b.id,target:h.target.id,started:e.time,until:e.time+1.35,wallUntil:0});this.event(b,e,'debtImpact','arcDebtHit',h.target,{angle:h.angle,life:.65});G.Arcana.stop(e,.065);e.impact(h.target.x,h.target.y,b.def.color,2.4);G.Presentation?.note(e,'arcana.debtSettled',{actorId:b.id,targetId:h.target.id,actual:h.actual,spent:h.debtSpend,predictUntil:u.predictUntil});
    },
    predictionReady(b,e){return !!b.arcana?.predictUntil&&b.arcana.predictUntil>e.time&&b.hp>0;},
    preempt(packets,e){if(!e.arcanaWorld?.defense)return;for(const b of e.balls){if(!this.predictionReady(b,e)||b.stance.phase==='active'||G.Arcana.immuneTarget(b,e))continue;const h=packets.find(h=>h.target===b&&h.source.hp>0&&h.raw>0&&G.World.enemy(h.source,b,e)&&h.damageOrigin!=='wall'&&h.kind!=='wallSlam'&&!(h.kind==='magneticWall'&&h.pullWall));if(h)G.Roles.reflectorOpen(b,e,'清算预判');}},
    guardActive(b,e){return !!b.arcana?.predictionGuard&&(b.stance.phase==='active'||b.role.counterRelease>0);},
    consumePrediction(b,e){if(this.predictionReady(b,e)){b.arcana.predictUntil=0;b.arcana.predictionGuard=true;this.event(b,e,'debtPredict','arcDebtCatch',b,{life:.4});}},
    prepare(e,dt){const w=e.arcanaWorld?.defense;if(!w)return;for(const b of e.balls)if(b.arcana?.predictionGuard&&!this.guardActive(b,e))b.arcana.predictionGuard=false;
      for(const b of e.balls)if(b.type==='reflector'&&b.arcana){const u=b.arcana,delta=u.debt-u.scarDebt;u.scarDebt+=clamp(delta,-90*dt,30*dt);}
      const f=w.fortress;if(f){const owners=f.owners.map(id=>e.balls.find(b=>b.id===id&&b.hp>0)).filter(Boolean);if(!owners.length){this.releaseBounds(e,true);w.fortress=null;}else{
        const age=e.time-f.started;let amount=0,phase='rise';if(age>=.8&&age<2){phase='shrink';const p=clamp((age-.8)/1.2,0,1);amount=p*p*(3-2*p);}else if(age>=2&&age<6.2){phase='hold';amount=1;}else if(age>=6.2){phase='release';const p=clamp((age-6.2)/.75,0,1);amount=1-p*p*(3-2*p);}
        f.phase=phase;if(phase==='hold')for(const b of owners)this.grantRoyal(b,e,f);f.bounds={left:C.width*.18*amount,right:C.width*(1-.18*amount),top:C.height*.18*amount,bottom:C.height*(1-.18*amount)};
        if(phase!==f.lastStage){f.lastStage=phase;this.event(owners[0],e,phase==='shrink'?'royalClose':phase==='hold'?'royalLock':'royalOpen',phase==='shrink'?'arcRoyalSlide':phase==='hold'?'arcRoyalLock':'arcRoyalOpen',owners[0],{life:phase==='hold'?.45:.75});}
        for(const b of e.balls){b.combatBounds={...f.bounds};const was={x:b.x,y:b.y};G.Physics.constrain(b);if(was.x!==b.x||was.y!==b.y){b.previousX=b.x;b.previousY=b.y;}b.wallContact=null;}
        if(age>=6.95){this.event(owners[0],e,'royalDissolve','arcRoyalReturn',owners[0],{life:.65,bounds:{...f.bounds}});for(const b of owners){b.arcana.phase='idle';b.arcana.target=null;}this.releaseBounds(e);w.fortress=null;}
      }}
      w.returns=w.returns.filter(v=>{const b=e.balls.find(b=>b.id===v.owner),t=e.balls.find(b=>b.id===v.target);if(!b||!t||b.hp<=0||t.hp<=0||e.time>=v.until)return false;if(G.Priority)return !G.Physics.armored(t);if(G.Physics.armored(t)||G.Arcana.immuneTarget(t,e)||G.Arcana.customMove(t)||G.Charge?.flowing(t)||t.magnetic.anchored)return true;
        const speed=Math.hypot(t.vx,t.vy);if(speed<1)return true;const bounds=t.combatBounds,l=(bounds?.left||0)+t.radius,r=(bounds?.right??C.width)-t.radius,top=(bounds?.top||0)+t.radius,bot=(bounds?.bottom??C.height)-t.radius;
        if(t.x<=l+.1&&t.vx>0||t.x>=r-.1&&t.vx<0||t.y<=top+.1&&t.vy>0||t.y>=bot-.1&&t.vy<0)v.wallUntil=e.time+.1;if(e.time<v.wallUntil)return true;
        const a=Math.atan2(t.vy,t.vx),goal=Math.atan2(b.y-t.y,b.x-t.x),delta=Math.atan2(Math.sin(goal-a),Math.cos(goal-a)),turn=clamp(delta,-4.8*dt*t.temporal.rate,4.8*dt*t.temporal.rate);t.vx=Math.cos(a+turn)*speed;t.vy=Math.sin(a+turn)*speed;return true;});
    },
    releaseBounds(e){for(const o of [...e.balls,...e.projectiles,...e.timeClocks])delete o.combatBounds;},
    world(e,dt){const w=e.arcanaWorld?.defense;if(!w)return;w.bolts=w.bolts.filter(p=>{const b=e.balls.find(b=>b.id===p.owner&&b.hp>0);if(!b||e.time>=p.until)return false;const ox=p.x,oy=p.y,bounds=w.fortress?.bounds||{left:0,right:C.width,top:0,bottom:C.height};const wall=G.ArenaWalls?.hit(p.x,p.y,Math.cos(p.angle),Math.sin(p.angle),p.radius||4,e),travel=Math.min(Math.hypot(p.vx,p.vy)*dt,wall?.distance??Infinity);p.x+=Math.cos(p.angle)*travel;p.y+=Math.sin(p.angle)*travel;
        const intersections=e.balls.filter(t=>t.hp>0&&G.World.enemy(b,t,e)).map(t=>({t,at:G.World.sweep(p,ox,oy,t,e)})).filter(v=>v.at!==Infinity).sort((a,b)=>a.at-b.at);
        const hit=intersections[0];if(hit){p.x=ox+(p.x-ox)*hit.at;p.y=oy+(p.y-oy)*hit.at;e.pendingAttacks.push({source:b,target:hit.t,kind:'arcDebt',raw:p.raw,heat:p.heat,angle:p.angle,point:{x:p.x,y:p.y},debtSpend:p.spend,healRatio:0});return false;}
        if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y});p.history.length=Math.min(14,p.history.length);}return (wall?.distance??Infinity)>Math.hypot(p.vx,p.vy)*dt&&p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom;});
    },
    endCombat(e){const w=e.arcanaWorld?.defense;if(!w)return;if(w.fortress){const b=e.balls.find(b=>w.fortress.owners.includes(b.id));if(b)this.event(b,e,'royalDissolve',null,b,{life:.65,bounds:{...w.fortress.bounds}});}w.fortress=null;w.bolts=[];w.returns=[];this.releaseBounds(e);for(const b of e.balls)if(this.handles(b)){b.arcana.royalActive=false;b.arcana.royalShield=0;b.arcana.predictUntil=0;if(b.arcana.phase==='debtCharge')this.finishDebt(b,e);}},
    copy(type){return type==='shield'?'立起盾墙并在1.2秒内收缩至约41%面积，维持4.2秒再展开；无挤压伤害。收缩完成后获得24专盾，替代普通盾、不可叠加，持续至封锁结束（最多4.2秒），吸收沿用压力，到期残盾只转波一次；普通盾冷却不重置。':'记录最多60点未实际返还的敌方生命伤害（墙伤除外）；0.9秒蓄势后发射实际传播的清算锋，最多消费40旧债、伤害最高18。实伤命中才消费旧债、施加1.35秒有限转向，并给4秒内一次等待威胁才开启的预判机会。落空、全盾、无敌无后续收益。';}
  };
  const reset=G.Arcana.reset,finish=G.Arcana.finish,status=G.Arcana.status,copy=G.Arcana.copy,snapshot=G.Arcana.snapshot;
  G.Arcana.reset=function(e){reset.call(this,e);D.reset(e);};
  G.Arcana.finish=function(b,e){if(D.handles(b)&&b.type==='reflector'){D.finishDebt(b,e);return;}finish.call(this,b,e);};
  G.Arcana.copy=function(type){return ['shield','reflector'].includes(type)?'奥义 · '+this.defs[type].name+'：觉醒且生命≤30%，每局一次。'+D.copy(type):copy.call(this,type);};
  G.Arcana.status=function(b,e){
    if(!D.handles(b))return status.call(this,b,e);const u=b.arcana;
    if(b.type==='shield'){
      if(u.royalActive)return {label:'专盾',value:u.royalShield.toFixed(1)+'·'+Math.max(0,u.royalUntil-e.time).toFixed(1)+'s'};
      const phase={royalRise:'升起',royalShrink:'收缩',royalHold:'封锁',royalRelease:'解放',idle:'已使用'}[u.phase];
      return {label:u.used&&u.phase!=='idle'?'王城':'奥义',value:u.used?phase+(u.phase!=='idle'?Math.max(0,u.until-e.time).toFixed(1)+'s':''):b.hp>b.maxHp*.3?'≤30%解锁':'就绪'};
    }
    return {label:D.predictionReady(b,e)?'债/判':'旧债',value:u.debt.toFixed(1)+'·'+(D.predictionReady(b,e)?(u.predictUntil-e.time).toFixed(1)+'s':u.phase==='debtCharge'?'蓄势':u.phase==='debtRecovery'?'清算':u.used?'已用':'待机')};
  };
  G.Arcana.snapshot=function(u){return {...snapshot.call(this,u),...(u.debts?{debts:{...u.debts}}:{})};};
  const shieldEnd=G.Roles.shieldEnd;G.Roles.shieldEnd=function(b,e){if(b.arcana?.royalActive||D.handles(b)&&b.type==='shield'&&(b.role.shieldRelease||b.role.shieldReserve)){D.queueShield(b,e,b.shield);return;}shieldEnd.call(this,b,e);};
  const worldUpdate=G.World.update;G.World.update=function(e,dt){const bounds=e.arcanaWorld?.defense?.fortress?.bounds;for(const p of e.projectiles){if(bounds)p.combatBounds={...bounds};else delete p.combatBounds;}return worldUpdate.call(this,e,dt);};
  // Charge's perimeter coordinates remain continuous, but follow the temporary
  // rectangle while it exists. No mutation of global arena dimensions.
  const point=G.Charge.point,length=G.Charge.length,coordinate=G.Charge.coordinate,wallPoint=G.Charge.wallPoint;
  G.Charge.length=function(r=0){const q=this.localBounds;return q?2*(q.right-q.left+q.bottom-q.top-4*r):length.call(this,r);};
  G.Charge.point=function(s,r=0){const q=this.localBounds;if(!q)return point.call(this,s,r);const w=q.right-q.left-2*r,h=q.bottom-q.top-2*r;s=((s%(2*(w+h)))+2*(w+h))%(2*(w+h));if(s<w)return{x:q.left+r+s,y:q.top+r,tx:1,ty:0,nx:0,ny:1};s-=w;if(s<h)return{x:q.right-r,y:q.top+r+s,tx:0,ty:1,nx:-1,ny:0};s-=h;if(s<w)return{x:q.right-r-s,y:q.bottom-r,tx:-1,ty:0,nx:0,ny:-1};s-=w;return{x:q.left+r,y:q.bottom-r-s,tx:0,ty:-1,nx:1,ny:0};};
  G.Charge.coordinate=function(b){const q=this.localBounds;if(!q)return coordinate.call(this,b);const r=b.radius,w=q.right-q.left-2*r,h=q.bottom-q.top-2*r,n=b.wallContact;if(!n)return null;if(n.ny===1)return b.x-q.left-r;if(n.nx===-1)return w+b.y-q.top-r;if(n.ny===-1)return w+h+q.right-r-b.x;if(n.nx===1)return 2*w+h+q.bottom-r-b.y;return null;};
  G.Charge.wallPoint=function(s){const q=this.localBounds;if(!q)return wallPoint.call(this,s);const p=this.point(s,C.radius);return {x:p.ty===0?p.x:p.nx===1?q.left:q.right,y:p.ty===0?p.ny===1?q.top:q.bottom:p.y};};
  for(const name of ['wall','move','end','update','world']){const fn=G.Charge[name];G.Charge[name]=function(...args){const e=args.find(v=>v?.arcanaWorld&&Array.isArray(v.balls)),old=this.localBounds;this.localBounds=e?.arcanaWorld?.defense?.fortress?.bounds||null;try{return fn.apply(this,args);}finally{this.localBounds=old;}};}
})(typeof window!=='undefined'?window:globalThis);
