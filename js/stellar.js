(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  G.Stellar={
    reset(e){e.stellarWorld={waves:[],queued:[],resonance:[]};for(const b of e.balls)if(b.type==='orbital')b.stellar={phase:'orbit',started:0,until:0,nextNova:Infinity,nextLaunch:0,volley:null,satellites:Array.from({length:3},(_,i)=>({slot:i,phase:'orbit',energy:0,angle:i*TAU/3,x:b.x,y:b.y,history:[],touch:{},projectileId:null}))};},
    effect(e,b,style,p,extra={}){e.effects.push({kind:'stellar',style,owner:b.id,color:b.def.color,x:p.x,y:p.y,age:0,life:.4,...extra});},
    orbitPoint(b,s,radius=38+s.slot*9){return {x:clamp(b.x+Math.cos(s.angle)*radius,6,C.width-6),y:clamp(b.y+Math.sin(s.angle)*radius,6,C.height-6)};},
    returning(b,s,p,e){if(s.phase==='return')return;s.phase='return';s.x=p.x;s.y=p.y;s.projectileId=null;s.energy=0;s.returnedAt=e.time;s.history=[];},
    detach(p,e){if(p.stellarOwner===undefined)return;const b=e.balls.find(b=>b.id===p.stellarOwner),s=b?.stellar?.satellites[p.slot];if(s&&s.projectileId===p.id)this.returning(b,s,p,e);},
    launch(b,s,t,e,options={}){const speed=options.rebirth?620:500+Math.min(1.35,s.energy)*85,raw=options.rebirth?b.def.rebirthDamage:b.def.cometDamage+Math.min(1.35,s.energy)*b.def.cometEnergyDamage;
      const angle=options.angle??G.Aim.direct({...b,x:s.x,y:s.y,radius:6},t,e,'comet:'+s.slot,speed),p={id:e.nextWorldId++,...(e.demonWorld?{heat:e.heatMultiplier}:{}),owner:b.id,stellarOwner:b.id,slot:s.slot,mode:'comet',x:s.x,y:s.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,radius:6,bounces:0,maxBounces:2,expires:e.time+1.25,raw:raw*e.heatMultiplier,color:b.def.color,history:[],adaptiveId:options.adaptiveId,volleyId:options.volleyId,awake:G.Awakening.active(b),rebirth:!!options.rebirth};
      s.phase='flight';s.projectileId=p.id;s.history=[];e.projectiles.push(p);b.stats.cometsFired=(b.stats.cometsFired||0)+1;this.effect(e,b,'launch',p,{angle,life:.25});e.sound('cometLaunch',p.x);
    },
    beginNova(b,e){const a=b.stellar;a.phase='recall';a.started=e.time;a.until=e.time+1.4;a.volley=null;a.novaId=G.Adaptive?.begin(b,'supernova',e);a.nextNova=e.time+b.def.novaPeriod;
      for(const s of a.satellites){if(s.phase==='flight'){const p=e.projectiles.find(p=>p.id===s.projectileId);this.returning(b,s,p||s,e);}s.energy=0;}
      e.projectiles=e.projectiles.filter(p=>p.stellarOwner!==b.id);e.signal(b,'恒星坍缩 · 三星归核','starCollapse');
    },
    collapse(b,e){const a=b.stellar;a.phase='collapse';a.started=e.time;a.until=e.time+.9;for(const s of a.satellites){s.phase='collapse';s.startRadius=Math.hypot(s.x-b.x,s.y-b.y)||38+s.slot*9;s.angle=Math.atan2(s.y-b.y,s.x-b.x);s.history=[];}},
    nova(b,e){const a=b.stellar;a.phase='rebirth';a.started=e.time;a.until=e.time+.28;const reach=Math.hypot(C.width,C.height)*.73;
      e.stellarWorld.waves.push({id:e.nextWorldId++,...(e.demonWorld?{heat:e.heatMultiplier}:{}),owner:b.id,x:b.x,y:b.y,radius:0,previous:0,reach,speed:510,raw:b.def.novaDamage*e.heatMultiplier,hitIds:[],adaptiveId:a.novaId,until:e.time+reach/510+.1});this.effect(e,b,'nova',b,{life:.65,radius:reach});e.signal(b,'超新星 · 星核爆发','starNova');e.hitStop(.065);e.burst(b.x,b.y,b.def.color,22);
    },
    update(b,dt,e){if(e.state!=='running'||G.Temporal.silenced(b,e))return;const a=b.stellar,t=G.World.targetFor(b,e);if(!t)return;for(const sat of a.satellites)G.Aim.direct({...b,x:sat.x,y:sat.y,radius:6},t,e,'comet:'+sat.slot,500+Math.min(1.35,sat.energy)*85);G.Aim.direct(b,t,e,'rebirth',620);
      if(G.Awakening.active(b)&&!Number.isFinite(a.nextNova))a.nextNova=e.time+.9;
      if(a.phase==='orbit'&&G.Awakening.active(b)&&e.time>=a.nextNova&&!G.Adaptive?.wait(b,t,e,'supernova'))this.beginNova(b,e);
      if(a.phase==='recall'&&(a.satellites.every(s=>s.phase==='orbit')||e.time>=a.until)){if(a.satellites.some(s=>s.phase==='return'))a.until=e.time+.1;else this.collapse(b,e);}
      if(a.phase==='collapse'&&e.time>=a.until){a.phase='core';a.started=e.time;a.until=e.time+.2;for(const s of a.satellites){s.phase='merged';s.x=b.x;s.y=b.y;s.history=[];}e.sound('starCompression',b.x);}
      if(a.phase==='core'&&e.time>=a.until)this.nova(b,e);
      if(a.phase==='rebirth'&&e.time>=a.until){const angle=G.Aim.direct(b,t,e,'rebirth',620),volleyId=e.nextWorldId++;for(const s of a.satellites){s.x=b.x;s.y=b.y;s.energy=1;this.launch(b,s,t,e,{angle:angle+s.slot*TAU/3,rebirth:true,adaptiveId:a.novaId,volleyId});}G.Adaptive?.close(b,a.novaId);a.phase='orbit';a.nextLaunch=e.time+1;this.effect(e,b,'rebirth',b,{life:.55});e.sound('starRebirth',b.x);}
      if(a.phase!=='orbit')return;
      if(a.volley){if(e.time>=a.nextLaunch){const s=a.satellites[a.volley.slots.shift()];if(s.phase==='orbit')this.launch(b,s,t,e,{adaptiveId:a.volley.adaptiveId,volleyId:a.volley.id});a.nextLaunch=e.time+.18;if(!a.volley.slots.length){G.Adaptive?.close(b,a.volley.adaptiveId);a.volley=null;}}return;}
      const ready=a.satellites.filter(s=>s.phase==='orbit'&&s.energy>=1);
      if(e.time<a.nextLaunch||!ready.length)return;
      // Charged satellites may wait briefly for a returning sibling to make a real three-star volley.
      if(ready.length<3&&Math.max(...ready.map(s=>s.energy))<1.35)return;
      if(G.Adaptive?.wait(b,t,e,'stellarVolley'))return;const id=G.Adaptive?.begin(b,'stellarVolley',e);a.volley={id:e.nextWorldId++,adaptiveId:id,slots:ready.map(s=>s.slot)};a.nextLaunch=e.time+.12;e.sound(ready.length===3?'starResonate':'starPrepare',b.x);e.signal(b,ready.length===3?'三星共振 · 彗星夹击':'彗星投射','miss');
    },
    satelliteWorld(b,s,e,dt){const a=b.stellar,rate=b.temporal.rate;if(!s.positioned){Object.assign(s,this.orbitPoint(b,s));s.positioned=true;}const oldX=s.x,oldY=s.y;
      if(s.phase==='return'){const dx=b.x-s.x,dy=b.y-s.y,d=Math.hypot(dx,dy),travel=900*dt;if(d<=b.radius+6){s.phase='orbit';s.angle=Math.atan2(dy,dx)+Math.PI;s.energy=0;s.history=[];this.effect(e,b,'return',b,{life:.25});e.sound('starReturn',b.x);}else{s.x+=dx/d*Math.min(travel,d);s.y+=dy/d*Math.min(travel,d);}}
      else if(s.phase==='orbit'){s.angle+=(2.1+s.slot*.25)*dt*rate;Object.assign(s,this.orbitPoint(b,s));if(a.phase==='orbit'&&!G.Temporal.silenced(b,e))s.energy=Math.min(1.35,s.energy+dt*rate/b.def.orbitCharge);
        if(a.phase==='orbit'&&!G.Temporal.silenced(b,e)&&(e.mode!=='2v2'||!e.obstacles.some(o=>G.Team.overlaps({...s,radius:6},o,0))))for(const t of e.balls){const key='touch'+t.id;if(!G.World.enemy(b,t,e)||t.hp<=0||G.Ghost.phased(t)||e.time<(a[key]||0)||!G.Mines.freeLine(b,s,e))continue;
          if(G.World.sweep({...s,radius:6},oldX,oldY,t)!==Infinity){a[key]=e.time+.9;e.pendingAttacks.push({source:b,target:t,kind:'orbitTouch',raw:b.def.orbitTouch*e.heatMultiplier,point:{x:s.x,y:s.y}});}}
      }else if(s.phase==='collapse'){const p=clamp((e.time-a.started)/.9,0,1);s.angle+=(5+p*15)*dt*rate;const radius=s.startRadius*Math.pow(1-p,1.3);s.x=b.x+Math.cos(s.angle)*radius;s.y=b.y+Math.sin(s.angle)*radius;}
      else if(s.phase==='merged'){s.x=b.x;s.y=b.y;}
      if(['orbit','return','collapse'].includes(s.phase)&&e.tick%3===0){s.history.unshift({x:s.x,y:s.y});s.history.length=Math.min(18,s.history.length);}
    },
    projectile(p,e,dt){if(e.state!=='running')return p;const b=e.balls.find(b=>b.id===p.owner&&b.hp>0);if(!b)return null;
      if(e.time>p.expires){this.detach(p,e);return null;}const ox=p.x,oy=p.y;p.speed=Math.hypot(p.vx,p.vy);if(G.Physics.integrate(p,dt)){p.bounces++;e.sound('cometBounce',p.x);this.effect(e,b,'spark',p,{life:.2});}
      if(p.bounces>p.maxBounces){this.detach(p,e);return null;}
      if(e.tick%2===0){p.history.unshift({x:p.x,y:p.y});p.history.length=Math.min(34,p.history.length);}
      const contacts=e.balls.filter(t=>G.World.enemy(b,t,e)&&t.hp>0&&!G.Ghost.phased(t)).map(t=>({target:t,u:G.World.sweep(p,ox,oy,t)})).filter(v=>v.u!==Infinity).sort((a,b)=>a.u-b.u);
      const first=contacts[0];if(!first)return p;p.x=ox+(p.x-ox)*first.u;p.y=oy+(p.y-oy)*first.u;
      const reflected=G.Roles.intercept(p,first.target,e);if(reflected)return reflected.absorbed?null:reflected;
      e.pendingAttacks.push({source:b,target:first.target,kind:'comet',raw:p.raw,heat:p.heat,adaptiveId:p.adaptiveId,point:{x:p.x,y:p.y},angle:Math.atan2(p.vy,p.vx),volleyId:p.volleyId,stellarSlot:p.slot,stellarAwake:p.awake,stellarOriginal:p.stellarOwner===b.id,noReflect:!!p.noReflect});
      this.effect(e,b,'burst',p,{life:.38});e.sound('cometImpact',p.x);this.detach(p,e);return null;
    },
    world(e,dt){if(e.state!=='running')return;for(const b of e.balls)if(b.stellar&&b.hp>0)for(const s of b.stellar.satellites)this.satelliteWorld(b,s,e,dt);
      e.stellarWorld.resonance=e.stellarWorld.resonance.filter(v=>e.time-v.at<1.1);
      e.stellarWorld.waves=e.stellarWorld.waves.filter(w=>{const b=e.balls.find(b=>b.id===w.owner&&b.hp>0);if(!b||e.time>w.until)return false;w.previous=w.radius;w.radius=Math.min(w.reach,w.radius+w.speed*dt);
        for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0||G.Ghost.phased(t)||G.Awakening.dashing(t,e)||w.hitIds.includes(t.id)||!G.Mines.freeLine(w,t,e))continue;
          const d=Math.hypot(t.x-w.x,t.y-w.y),old=Math.hypot(t.previousX-w.x,t.previousY-w.y);
          if(Math.min(d,old)<=w.radius+t.radius+8&&Math.max(d,old)>=w.previous-t.radius-8){w.hitIds.push(t.id);e.pendingAttacks.push({source:b,target:t,kind:'supernova',raw:w.raw,heat:w.heat,adaptiveId:w.adaptiveId,angle:Math.atan2(t.y-w.y,t.x-w.x),point:{x:w.x,y:w.y}});}}
        return w.radius<w.reach;});
    },
    hit(h,e){const b=h.source;if(!b.stellar||h.actual+h.blocked<=0)return;
      if(h.kind==='comet'){G.Roles.heavyImpact(b,h,e,'kineticHit','cometImpact',75,.035);if(h.actual<=0||!h.stellarOriginal)return;b.stats.cometsHit=(b.stats.cometsHit||0)+1;
        if(h.stellarAwake)for(const t of e.balls)if(t!==h.target&&G.World.enemy(b,t,e)&&t.hp>0&&Math.hypot(t.x-h.point.x,t.y-h.point.y)<=t.radius+25&&G.Mines.freeLine(h.point,t,e))e.stellarWorld.queued.push({source:b,target:t,kind:'starSplash',raw:1.8*e.heatMultiplier,adaptiveId:h.adaptiveId,point:h.point});
        if(h.volleyId!==undefined){let r=e.stellarWorld.resonance.find(v=>v.owner===b.id&&v.target===h.target.id&&v.volleyId===h.volleyId);if(!r){r={owner:b.id,target:h.target.id,volleyId:h.volleyId,slots:[],at:e.time,fired:false};e.stellarWorld.resonance.push(r);}if(!r.slots.includes(h.stellarSlot))r.slots.push(h.stellarSlot);if(r.slots.length>=2&&!r.fired){r.fired=true;e.stellarWorld.queued.push({source:b,target:h.target,kind:'starResonance',raw:b.def.resonanceDamage*e.heatMultiplier,adaptiveId:h.adaptiveId,point:h.point});this.effect(e,b,'resonance',h.point,{life:.5});}}
      }
      if(h.kind==='supernova')G.Roles.heavyImpact(b,h,e,'largeHit','starNovaHit',210,.065);
      if(h.kind==='starResonance')G.Roles.heavyImpact(b,h,e,'kineticHit','starResonance',90,.04);
      if(h.kind==='orbitTouch')e.sound('starTap',h.target.x);
    },
    afterBatch(e){const q=e.stellarWorld?.queued;if(q?.length){const h=q.splice(0).filter(v=>v.source.hp>0&&v.target.hp>0);if(h.length)G.Combat.resolveBatch(h,e);}},
    interrupt(b,e){const a=b.stellar;if(!a)return false;const volley=!!a.volley;if(a.volley){G.Adaptive?.close(b,a.volley.adaptiveId);a.volley=null;}if(a.phase==='orbit')return volley;G.Adaptive?.cancel(b,'supernova');a.phase='orbit';a.volley=null;for(const s of a.satellites)if(['merged','collapse'].includes(s.phase)){s.phase='return';s.energy=0;s.history=[];}return true;},
    slow(b,e,lost){const a=b.stellar;if(a&&a.phase!=='orbit'){a.started+=lost;a.until+=lost;}},
    cleanup(e){if(!e.stellarWorld)return;e.stellarWorld.waves=e.stellarWorld.waves.filter(w=>e.balls.some(b=>b.id===w.owner&&b.hp>0));},
    snapshot(v){return JSON.parse(JSON.stringify(v));},
    status(b,e){const a=b.stellar,states={orbit:'公转',recall:'召回',collapse:'坍缩',core:'星核',rebirth:'重生'},cd=v=>Math.max(0,v-e.time).toFixed(1)+'s';return [{label:'卫星',value:a.satellites.filter(s=>s.phase==='orbit').length+'/3'},{label:'轨道能',value:'均'+Math.round(a.satellites.reduce((n,s)=>n+s.energy,0)/3*100)+'%'},{label:'彗星伤',value:((b.def.cometDamage+b.def.cometEnergyDamage)*e.heatMultiplier).toFixed(1)},{label:'星核',value:states[a.phase]},{label:'爆发伤',value:(b.def.novaDamage*e.heatMultiplier).toFixed(1)},{label:'超新星CD',value:G.Awakening.active(b)?Number.isFinite(a.nextNova)?cd(a.nextNova):'就绪':'未觉醒'}];}
  };
  G.Skills.orbital={update:(b,dt,e)=>G.Stellar.update(b,dt,e),status:(b,e)=>G.Stellar.status(b,e)};
})(typeof window!=='undefined'?window:globalThis);
