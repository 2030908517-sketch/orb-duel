(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  G.Cosmic={
    fresh(){return {charge:0,energy:0,nextGuard:0,nextCharge:0,nextStrike:2.8,nextOrbit:1.5,nextAwake:Infinity,satellites:[],orbitStarted:0,launchAt:0,angle:0};},
    reset(e){e.cosmicWorld={strikes:[],binary:[],marks:[],queued:[]};for(const b of e.balls)if(b.type==='storm')b.cosmic=this.fresh();},
    marks(b,t,e){return e.cosmicWorld.marks.find(m=>m.owner===b.id&&m.target===t.id&&m.until>e.time);},
    mark(b,t,e){let m=this.marks(b,t,e);if(!m){m={owner:b.id,target:t.id,stacks:0,until:0,nextShock:0};e.cosmicWorld.marks.push(m);}m.stacks=Math.min(3,m.stacks+1);m.until=e.time+5;return m;},
    effect(e,b,style,point,extra={}){e.effects.push({kind:'cosmic',style,owner:b.id,color:b.def.color,x:point.x,y:point.y,age:0,life:.35,...extra});},
    wall(b,e){if(e.state!=='running'||b.type!=='storm'||G.Temporal.silenced(b,e)||b.cosmic.nextCharge>e.time)return;b.cosmic.nextCharge=e.time+.5;const previous=b.cosmic.charge;b.cosmic.charge=Math.min(3,b.cosmic.charge+1);if(previous<3&&b.cosmic.charge===3)e.signal(b,'电容蓄满 · 强雷就绪','stormReady');},
    strike(b,t,e,awake){const s=b.cosmic,id=G.Adaptive?.begin(b,awake?'stormAwake':'storm',e),charged=!awake&&s.charge>=3;
      if(charged)s.charge=0;const count=awake?3:1,base=G.Awakening.predict(t,.4),angle=Math.atan2(t.vy,t.vx),spread=awake?48:0;
      for(let i=0;i<count;i++){const offset=(i-1)*spread;const p={x:clamp(base.x+Math.cos(angle+Math.PI/2)*offset,27,C.width-27),y:clamp(base.y+Math.sin(angle+Math.PI/2)*offset,27,C.height-27)};
        e.cosmicWorld.strikes.push({id:e.nextWorldId++,owner:b.id,adaptiveId:id,x:p.x,y:p.y,originX:b.x,originY:b.y,target:t.id,offset,lockAt:e.time+.26+i*.38,locked:false,at:e.time+.42+i*.38,warningAt:e.time+i*.38,radius:awake?27:25,raw:(awake?3.8:charged?7.4:4.9)*e.heatMultiplier,charged,awake});}
      G.Adaptive?.close(b,id);e.sound(awake?'stormGather':'stormWarn',b.x);e.signal(b,awake?'雷暴接力 · 三点锁定':charged?'强雷蓄势':'引雷锁定','miss');
    },






    update(b,dt,e){if(e.state!=='running'||G.Temporal.silenced(b,e))return;const s=b.cosmic,t=G.World.targetFor(b,e);if(!t)return;s.angle+=dt*2.7;
      if(G.Awakening.active(b)&&!Number.isFinite(s.nextAwake))s.nextAwake=e.time+.8;
      if(G.Awakening.active(b)&&e.time>=s.nextAwake&&!G.Adaptive?.wait(b,t,e,'stormAwake')){this.strike(b,t,e,true);s.nextAwake=e.time+11.5;s.nextStrike=Math.max(s.nextStrike,e.time+3.2);}
      else if(e.time>=s.nextStrike&&!G.Adaptive?.wait(b,t,e,'storm')){this.strike(b,t,e,false);s.nextStrike=e.time+b.def.strikePeriod;}
    },
    world(e){if(e.state!=='running')return;const w=e.cosmicWorld;w.marks=w.marks.filter(m=>m.until>e.time&&e.balls.some(b=>b.id===m.owner&&b.hp>0)&&e.balls.some(b=>b.id===m.target&&b.hp>0));
      w.strikes=w.strikes.filter(v=>{const b=e.balls.find(b=>b.id===v.owner&&b.hp>0);if(!b)return false;if(!v.locked&&e.time>=v.warningAt){const target=e.balls.find(t=>t.id===v.target&&t.hp>0);if(target&&e.time<v.lockAt){const q=G.Awakening.predict(target,Math.min(.4,Math.max(0,v.at-e.time))),a=Math.atan2(target.vy,target.vx),nx=clamp(q.x+Math.cos(a+Math.PI/2)*v.offset,27,C.width-27),ny=clamp(q.y+Math.sin(a+Math.PI/2)*v.offset,27,C.height-27),dx=nx-v.x,dy=ny-v.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,360*(G.Venom?.aimControl(b,e).rate??1)*C.dt/d);v.x+=dx*k;v.y+=dy*k;}if(e.time>=v.lockAt)v.locked=true;}if(e.time<v.at)return true;
        for(const t of e.balls)if(G.World.enemy(b,t,e)&&t.hp>0&&dist(v,t)<=t.radius+v.radius&&G.Mines.freeLine({x:v.originX,y:v.originY},v,e))e.pendingAttacks.push({source:b,target:t,kind:'stormBolt',adaptiveId:v.adaptiveId,raw:v.raw,point:v,charged:v.charged});
        this.effect(e,b,'lightning',v,{originX:v.x,originY:0,radius:v.radius,life:.32,charged:v.charged});e.sound('stormCrash',v.x);e.burst(v.x,v.y,b.def.color,10);return false;});

    },
    hit(h,e){if(h.actual<=0)return;const b=h.source,t=h.target;if(!b.cosmic)return;
      if(b.type==='storm'&&['contact','stormBolt'].includes(h.kind)){const m=this.mark(b,t,e);if(m.stacks>=3&&e.time>=m.nextShock){m.stacks=0;m.nextShock=e.time+1.2;e.cosmicWorld.queued.push({source:b,target:t,kind:'staticShock',raw:3.5*e.heatMultiplier,point:t});this.effect(e,b,'staticShock',t,{radius:38});}}
      if(['stormBolt','staticShock'].includes(h.kind)){b.stats.cosmicHits=(b.stats.cosmicHits||0)+1;const strong=h.kind==='staticShock'||h.kind==='stormBolt'&&h.charged;if(strong)G.Roles.heavyImpact(b,h,e,'kineticHit','stormHit',45,.035);else{e.sound('stormHit',t.x);e.impact(t.x,t.y,b.def.color,1);e.burst(t.x,t.y,b.def.color,5);}}
    },
    afterBatch(e){const q=e.cosmicWorld?.queued;if(q?.length){const hits=q.splice(0).filter(h=>h.source.hp>0&&h.target.hp>0);if(hits.length)G.Combat.resolveBatch(hits,e);}},
    interrupt(b,e){if(!b.cosmic)return;for(const key of ['storm','stormAwake'])G.Adaptive?.cancel(b,key,key==='orbital');b.cosmic.satellites=[];e.cosmicWorld.strikes=e.cosmicWorld.strikes.filter(v=>v.owner!==b.id);e.cosmicWorld.binary=e.cosmicWorld.binary.filter(v=>v.owner!==b.id);},
    slow(b,e,lost){if(!b.cosmic)return;if(b.cosmic.satellites.length)b.cosmic.orbitStarted+=lost;for(const v of e.cosmicWorld.strikes)if(v.owner===b.id){v.at+=lost;v.warningAt+=lost;v.lockAt+=lost;}},
    cleanup(e){if(!e.cosmicWorld)return;for(const key of ['strikes','binary','marks'])e.cosmicWorld[key]=e.cosmicWorld[key].filter(v=>e.balls.some(b=>b.id===v.owner&&b.hp>0));},
    snapshot(w){return {strikes:w.strikes.map(v=>({...v})),binary:w.binary.map(v=>({...v,hitCounts:{...v.hitCounts},orbitCounts:{...v.orbitCounts},nextTouch:{...v.nextTouch}})),marks:w.marks.map(v=>({...v}))};},
    status(b,e){const s=b.cosmic,t=G.World.targetFor(b,e),m=t&&this.marks(b,t,e),cd=n=>Math.max(0,n-e.time).toFixed(1)+'s',awake=G.Awakening.active(b);return [{label:'电荷',value:s.charge+'/3'},{label:'引雷CD',value:cd(s.nextStrike)},{label:'雷伤',value:((s.charge>=3?7.4:4.9)*e.heatMultiplier).toFixed(1)},{label:'导电',value:(m?.stacks||0)+'/3'},{label:'电解伤',value:(3.5*e.heatMultiplier).toFixed(1)},{label:'雷暴CD',value:awake?Number.isFinite(s.nextAwake)?cd(s.nextAwake):'就绪':'未觉醒'}];}
  };
  for(const type of ['storm'])G.Skills[type]={update:(b,dt,e)=>G.Cosmic.update(b,dt,e),status:(b,e)=>G.Cosmic.status(b,e)};
})(typeof window!=='undefined'?window:globalThis);
