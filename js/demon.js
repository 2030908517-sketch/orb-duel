(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  G.Demon={
    fresh(){return {nextClaw:2.8,nextGate:Infinity};},
    reset(e){e.demonWorld=e.balls.some(b=>b.type==='demon')?{marks:[],claws:[],chains:[],casts:[],queued:[]}:null;for(const b of e.balls)if(b.type==='demon')b.demon=this.fresh();},
    activate(b,e){b.demon??=this.fresh();b.demon.nextGate=e.time+.8;},
    snapshotWorld(e){const w=e.demonWorld;return {marks:w.marks.map(v=>({...v})),claws:w.claws.map(v=>({...v})),chains:w.chains.map(v=>({...v})),casts:w.casts.map(v=>({...v,spent:{...v.spent},finished:{...v.finished},dualAt:{...v.dualAt}})),queued:w.queued.map(v=>({owner:v.source.id,target:v.target.id,raw:v.raw,kind:v.kind,castId:v.castId}))};},
    mark(b,t,e){const w=e.demonWorld;let m=w.marks.find(v=>v.owner===b.id&&v.target===t.id);if(m)m.until=e.time+b.def.brandLife;else{w.marks.push({owner:b.id,target:t.id,until:e.time+b.def.brandLife});e.float(t.x,t.y-32,'烙印',b.def.color);e.sound('demonBrand',t.x);}},
    branded(b,t,e){return e.demonWorld?.marks.some(v=>v.owner===b.id&&v.target===t.id&&v.until>=e.time);},
    release(owner,target,e){e.demonWorld.chains=e.demonWorld.chains.filter(c=>c.owner!==owner||c.target!==target);},
    consume(owner,target,e,keepChains=false){e.demonWorld.marks=e.demonWorld.marks.filter(m=>m.owner!==owner||m.target!==target);if(!keepChains)this.release(owner,target,e);},
    budget(cast,t,raw){const left=Math.max(0,cast.cap-(cast.spent[t.id]||0)),amount=Math.min(left,raw);cast.spent[t.id]=(cast.spent[t.id]||0)+amount;return amount;},
    summon(b,t,e,gates=false){const adaptiveId=G.Adaptive?.begin(b,'demon',e),w=e.demonWorld,id=e.nextWorldId++,cast={id,owner:b.id,adaptiveId,cap:b.def.castCap*e.heatMultiplier,spent:{},finished:{},dualAt:{},expires:e.time+4.5};w.casts.push(cast);
      const vertical=gates&&e.rng.next()<.5;for(let i=0;i<(gates?2:1);i++){
        const warning=.55+(gates?i*.26:0),flight=gates?.30:.18,p=G.Awakening.predict(t,Math.min(.7,warning+flight));
        let x,y;if(gates){x=vertical?clamp(p.x,35,C.width-35):i?C.width-9:9;y=vertical?(i?C.height-9:9):clamp(p.y,35,C.height-35);}
        else{const a=Math.atan2(t.y-b.y,t.x-b.x);x=clamp(p.x-Math.cos(a)*65,12,C.width-12);y=clamp(p.y-Math.sin(a)*65,12,C.height-12);}
        if(e.mode==='2v2')({x,y}=G.Team.freePoint({x,y},12,e.obstacles));
        const claw={id:e.nextWorldId++,castId:id,owner:b.id,adaptiveId,marked:this.branded(b,t,e),target:t.id,gate:gates,x,y,startX:x,startY:y,endX:p.x,endY:p.y,warningAt:e.time,lockAt:e.time+warning-.20,at:e.time+warning,flight,expires:e.time+warning+flight+.26,hit:false,locked:false,released:false,raw:(gates?b.def.gateDamage:b.def.clawDamage)*e.heatMultiplier*e.rng.between(.9,1.1)};w.claws.push(claw);
      }G.Adaptive?.close(b,adaptiveId);b.stats.demonCasts=(b.stats.demonCasts||0)+1;e.signal(b,gates?'地狱双门 · 围猎':'地狱裂隙 · 魔爪蓄势',gates?'demonGate':'demonWarn');
    },
    update(b,dt,e){if(e.state!=='running'||G.Temporal.silenced(b,e))return;b.demon??=this.fresh();const t=G.World.targetFor(b,e);if(!t)return;
      if(G.Awakening.active(b)){if(e.time+1e-9>=b.demon.nextGate&&!G.Adaptive?.wait(b,t,e,'demon')){this.summon(b,t,e,true);b.demon.nextGate=e.time+b.def.gatePeriod;}}
      else if(e.time+1e-9>=b.demon.nextClaw&&!G.Adaptive?.wait(b,t,e,'demon')){this.summon(b,t,e);b.demon.nextClaw=e.time+b.def.clawPeriod;}
    },
    interrupt(b,e){const w=e.demonWorld;if(!w)return false;const active=w.claws.some(c=>c.owner===b.id)||w.chains.some(c=>c.owner===b.id);w.claws=w.claws.filter(c=>c.owner!==b.id);w.chains=w.chains.filter(c=>c.owner!==b.id);w.queued=w.queued.filter(p=>p.source!==b);return active;},
    slow(b,e,lost){const w=e.demonWorld;if(!w||b.type!=='demon')return;for(const c of w.claws)if(c.owner===b.id){for(const k of ['at','lockAt','expires'])if(c[k]>e.time-C.dt)c[k]+=lost;c.warningAt+=lost;}},
    cleanup(e){const w=e.demonWorld;if(!w)return;const living=id=>e.balls.some(b=>b.id===id&&b.hp>0);w.marks=w.marks.filter(m=>living(m.owner)&&living(m.target)&&m.until>=e.time);
      w.claws=w.claws.filter(c=>living(c.owner)&&living(c.target));w.chains=w.chains.filter(c=>living(c.owner)&&living(c.target)&&!G.Ghost.phased(e.balls.find(b=>b.id===c.target)));w.casts=w.casts.filter(c=>living(c.owner)&&(c.expires>=e.time||w.claws.some(v=>v.castId===c.id)||w.chains.some(v=>v.castId===c.id)));w.queued=w.queued.filter(p=>p.source.hp>0&&p.target.hp>0);
    },
    forces(e,dt){const w=e.demonWorld;if(!w||e.state!=='running')return;this.cleanup(e);const sums=new Map();
      for(const c of [...w.chains]){const b=e.balls.find(v=>v.id===c.owner),t=e.balls.find(v=>v.id===c.target),cast=w.casts.find(v=>v.id===c.castId);if(!b||!t||!cast||!w.chains.includes(c))continue;
        if(G.Temporal.silenced(b,e)||G.World.absent(t,e)||G.Ghost.phased(t)||G.Awakening.dashing(t,e)){cast.finished[t.id]=true;this.release(c.owner,c.target,e);continue;}
        if(!cast.finished[t.id]&&cast.dualAt[t.id]&&e.time+1e-9>=cast.dualAt[t.id])this.execute(b,t,cast,e,true);
        if(e.time+1e-9>=c.until){if(!cast.finished[t.id]){cast.finished[t.id]=true;const raw=this.budget(cast,t,b.def.terminalDamage*e.heatMultiplier);e.pendingAttacks.push({source:b,target:t,raw,kind:'demonTerminal',adaptiveId:cast.adaptiveId,castId:cast.id});this.consume(b.id,t.id,e);}else this.release(b.id,t.id,e);e.sound('demonBreak',t.x);continue;}
        const dx=c.x-t.x,dy=c.y-t.y,d=Math.hypot(dx,dy)||1,radial=(t.vx*dx+t.vy*dy)/d,tension=cast.dualAt[t.id]&&!cast.finished[t.id]?1+.35*clamp(1-(cast.dualAt[t.id]-e.time)/b.def.dualDelay,0,1):1;
        const force=d>55?clamp(((d-55)*10-radial*3.5)*tension,0,850):0,sum=sums.get(t)||{x:0,y:0};sum.x+=dx/d*force;sum.y+=dy/d*force;sums.set(t,sum);
      }
      for(const [t,s] of sums){if(G.Physics.armored(t))continue;const length=Math.hypot(s.x,s.y),factor=length?Math.min(1,1200/length):1;t.vx+=s.x*factor*dt*t.temporal.rate;t.vy+=s.y*factor*dt*t.temporal.rate;t.inertia=Math.max(t.inertia,.12);G.Physics.limit(t);}
    },
    world(e,dt){const w=e.demonWorld;if(!w||e.state!=='running')return;const live=[];
      for(const c of w.claws){const b=e.balls.find(v=>v.id===c.owner&&v.hp>0),t=e.balls.find(v=>v.id===c.target&&v.hp>0);if(!b||!t||G.Temporal.silenced(b,e)||e.time>c.expires)continue;
        if(e.time<c.lockAt){const p=G.Awakening.predict(t,Math.min(.7,Math.max(0,c.at+c.flight-e.time)));c.endX=p.x;c.endY=p.y;}else c.locked=true;
        if(e.time+1e-9<c.at){live.push(c);continue;}
        if(!c.released){c.released=true;e.sound('demonClaw',c.startX);}
        const oldX=c.x,oldY=c.y,age=e.time-c.at,u=age<=c.flight+.1?clamp(age/c.flight,0,1):clamp(1-(age-c.flight-.1)/.16,0,1),reach=Math.hypot(c.endX-c.startX,c.endY-c.startY),nx=reach?(c.endX-c.startX)/reach:1,ny=reach?(c.endY-c.startY)/reach:0;
        const limit=e.mode==='2v2'?G.Team.rayLimit(c.startX,c.startY,nx,ny,13,e.obstacles):Infinity,d=Math.min(reach*u,limit);c.x=c.startX+nx*d;c.y=c.startY+ny*d;
        if(!c.hit&&e.time<=c.at+c.flight+.10&&!G.Ghost.phased(t)&&G.World.intersects({x:c.x,y:c.y,radius:13},oldX,oldY,t)){
          c.hit=true;const cast=w.casts.find(v=>v.id===c.castId);if(cast){const raw=this.budget(cast,t,c.raw);e.pendingAttacks.push({source:b,target:t,raw,kind:'demonClaw',adaptiveId:c.adaptiveId,markQualified:c.marked,castId:c.castId,clawId:c.id,anchorX:c.startX,anchorY:c.startY,gate:c.gate,point:{x:c.x,y:c.y},angle:Math.atan2(ny,nx)});}
        }live.push(c);
      }w.claws=live;
    },
    execute(b,t,cast,e,dual=false){if(cast.finished[t.id])return;cast.finished[t.id]=true;this.consume(b.id,t.id,e,true);for(const c of e.demonWorld.chains)if(c.owner===b.id&&c.target===t.id)c.executed=true;const raw=this.budget(cast,t,(dual?b.def.dualDamage:b.def.executionDamage)*e.heatMultiplier);
      e.demonWorld.queued.push({source:b,target:t,raw,adaptiveId:cast.adaptiveId,kind:dual?'demonDual':'demonExecution',castId:cast.id,point:{x:t.x,y:t.y}});
    },
    hit(h,e){const w=e.demonWorld,b=h.source,t=h.target;if(!w||b.type!=='demon'||G.Temporal.silenced(b,e)||h.avoided)return;
      if(h.kind==='contact'&&h.actual+h.blocked>0)this.mark(b,t,e);
      if(['demonExecution','demonDual','demonTerminal'].includes(h.kind)){if(h.actual+h.blocked>0){G.Roles.heavyImpact(b,h,e,'largeHit',h.kind==='demonTerminal'?'demonBreak':'demonExecute',h.kind==='demonTerminal'?45:175,h.kind==='demonTerminal'?.03:.065);e.effects.push({kind:'demonSoul',x:t.x,y:t.y,dual:h.kind==='demonDual',color:b.def.color,age:0,life:.5});b.stats.demonExecutions=(b.stats.demonExecutions||0)+(h.kind!=='demonTerminal'?1:0);}return;}
      if(h.actual<=0)return;
      if(h.kind==='demonClaw'){G.Roles.heavyImpact(b,h,e,'largeHit','demonGrip',35,.035);b.stats.demonClawHits=(b.stats.demonClawHits||0)+1;}
      const existing=w.chains.filter(c=>c.owner===b.id&&c.target===t.id&&c.createdTick<e.tick&&c.until>e.time);
      if(existing.length&&!(h.kind==='demonClaw'&&existing.some(c=>c.castId===h.castId))){const cast=w.casts.find(v=>v.id===existing[0].castId);if(cast&&!cast.dualAt[t.id])this.execute(b,t,cast,e);return;}
      if(h.kind!=='demonClaw')return;
      if(!h.markQualified&&!this.branded(b,t,e)&&!w.chains.some(c=>c.owner===b.id&&c.target===t.id&&c.castId===h.castId))return;const cast=w.casts.find(v=>v.id===h.castId);if(!cast||cast.finished[t.id]||w.chains.some(c=>c.owner===b.id&&c.target===t.id&&c.castId!==h.castId))return;
      const first=w.chains.find(c=>c.owner===b.id&&c.target===t.id&&c.castId===h.castId);
      w.chains.push({owner:b.id,target:t.id,castId:h.castId,adaptiveId:h.adaptiveId,clawId:h.clawId,gate:!!h.gate,x:h.anchorX,y:h.anchorY,until:first?.until??e.time+b.def.chainLife,createdAt:first?.createdAt??e.time,createdTick:e.tick,executed:false});e.sound('demonChain',t.x);e.signal(b,'魂锁扣合 · 3.2秒追猎','miss');
      if(h.gate&&w.chains.filter(c=>c.owner===b.id&&c.target===t.id&&c.castId===h.castId).length>=2){cast.dualAt[t.id]=Math.min(e.time+b.def.dualDelay,first.until-.05);e.signal(b,'双魂锁收束 · 处刑将至','demonTension');}
    },
    afterBatch(e){const w=e.demonWorld;if(!w||!w.queued.length)return;const packets=w.queued.splice(0);G.Combat.resolveBatch(packets,e);},
    debuff(b,e){const w=e.demonWorld;if(!w)return '';const chains=w.chains.filter(c=>c.target===b.id),marks=w.marks.filter(m=>m.target===b.id&&m.until>=e.time);return chains.length?'魂锁 '+Math.max(0,...chains.map(c=>c.until-e.time)).toFixed(1)+'s':marks.length?'地狱烙印 '+Math.max(...marks.map(m=>m.until-e.time)).toFixed(1)+'s':'';},
    status(b,e){const w=e.demonWorld,d=b.demon||this.fresh(),awake=G.Awakening.active(b);return [{label:'魔爪伤',value:((awake?b.def.gateDamage:b.def.clawDamage)*e.heatMultiplier).toFixed(1)},{label:awake?'双门CD':'魔爪CD',value:Math.max(0,(awake?d.nextGate:d.nextClaw)-e.time).toFixed(1)+'s'},{label:'烙印',value:w?.marks.filter(m=>m.owner===b.id).length||0},{label:'魂锁',value:w?.chains.filter(c=>c.owner===b.id).length||0},{label:'处刑伤',value:(b.def.executionDamage*e.heatMultiplier).toFixed(1)+(awake?'/'+(b.def.dualDamage*e.heatMultiplier).toFixed(1):'')},{label:'单轮限',value:(b.def.castCap*e.heatMultiplier).toFixed(0)}];}
  };
})(typeof window!=='undefined'?window:globalThis);
