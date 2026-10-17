(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),SEA=['bloodLiquefy','bloodTide','bloodReverse','bloodRebirth','bloodFinale'];
  G.Arcana.defs.vampire.name='血海重生';
  G.VampireArcana={
    sea:true,waveRaw:7,damageCap:28,
    active(b){return b.type==='vampire'&&SEA.includes(b.arcana?.phase);},
    hidden(b,e){const u=b.arcana;if(!u)return false;if(u.phase==='bloodRebirth')return false;if(u.phase==='bloodFinale')return (e?.time??u.started)<u.started+.85;return ['bloodLiquefy','bloodTide','bloodReverse'].includes(u.phase);},
    immune(b){return b.hp>0&&this.active(b)&&!!b.arcana.seaImmune;},
    event(b,e,stage,cue,p=b,extra={}){const castId=b.arcana.castId,eventId=castId+':'+stage+':'+e.tick;G.Arcana.effect(e,b,stage,p,{eventId,castId,...extra});if(cue){const sound={kind:cue,pan:(p.x/C.width-.5)*1.2,tick:e.tick,presentationId:eventId};e.soundEvents.push(sound);if(e.soundEvents.length>32)e.soundEvents.shift();G.Presentation?.observeSound(e,sound);}G.Presentation?.note(e,'arcana.stage',{castId,eventId,stage,actorId:b.id,cue:cue||null,...extra});},
    begin(b,t,e){const u=b.arcana;G.Arcana.commit(b,e);const count=clamp(Math.floor(b.role.blood),3,8);b.role.blood=Math.max(0,b.role.blood-count);
      Object.assign(u,{phase:'bloodLiquefy',started:e.time,until:e.time+.6,center:{x:b.x,y:b.y},waveCount:count,waveRaw:Math.min(this.waveRaw,this.damageCap/count),emitted:0,nextWave:e.time+.65,seaImmune:true,healBudget:20,totalHealed:0,pendingHeal:0,healSettled:false,waveBudget:{},returnAngle:Math.atan2(b.vy,b.vx),baseAngle:Math.atan2(t.y-b.y,t.x-b.x)});e.arcanaWorld.tides??=[];b.vx=b.vy=b.motionSpeed=b.inertia=0;b.trail=[];
      this.event(b,e,'seaBreak','arcSeaBreak',b,{life:.7});
    },
    spawn(b,t,e){const u=b.arcana,q=b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height},slot=u.emitted,at=u.baseAngle+slot*2.399963,spots=[];
      for(let i=0;i<12;i++){const a=at+i*Math.PI/6,p={x:clamp(t.x+Math.cos(a)*120,q.left+20,q.right-20),y:clamp(t.y+Math.sin(a)*120,q.top+20,q.bottom-20)};if(Math.hypot(p.x-t.x,p.y-t.y)>85)spots.push(p);}const p=spots[0]||{x:clamp(q.right-t.x,q.left+20,q.right-20),y:clamp(q.bottom-t.y,q.top+20,q.bottom-20)};
      const w={id:e.nextWorldId++,owner:b.id,target:t.id,slot,x:p.x,y:p.y,origin:{...p},angle:0,width:96,thickness:30,speed:200,travel:0,reach:300,formedAt:e.time,armAt:e.time+.3,expires:e.time+1.85,launched:false,hitIds:[],history:[]};this.aim(w,b,t,e);e.arcanaWorld.tides.push(w);u.emitted++;u.nextWave=e.time+.56;u.lastWaveEnds=e.time+1.25;this.event(b,e,'seaRise','arcSeaRise',p,{slot,angle:w.angle,life:.35});
    },
    aim(w,b,t,e){const mark=t.role.bloodMark,marked=mark?.owner===b.id&&mark.until>=e.time,flight=Math.min(.85,Math.hypot(t.x-w.x,t.y-w.y)/w.speed),p=G.Awakening.predict(t,marked?flight:Math.min(.18,flight*.3));w.angle=Math.atan2(p.y-w.y,p.x-w.x);w.markedAim=!!marked;},
    returnCenter(b){const u=b.arcana,q=b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height};u.reverseFrom={x:b.x,y:b.y};u.center={x:clamp(C.width/2,q.left+b.radius,q.right-b.radius),y:clamp(C.height/2,q.top+b.radius,q.bottom-b.radius)};},
    update(b,t,e,dt){const u=b.arcana;if(!t){this.cancel(b,e);return;}
      if(u.phase==='bloodLiquefy'&&e.time+1e-9>=u.until){u.phase='bloodTide';u.started=e.time;u.seaImmune=true;u.until=Infinity;}
      if(u.phase==='bloodTide'){
        if(u.emitted<u.waveCount&&e.time+1e-9>=u.nextWave)this.spawn(b,t,e);
        if(u.emitted>=u.waveCount&&(e.time>=u.lastWaveEnds||!e.arcanaWorld.tides.some(w=>w.owner===b.id))){const traces=e.arcanaWorld.tides.filter(w=>w.owner===b.id).map(w=>({x:w.x,y:w.y}));e.arcanaWorld.tides=e.arcanaWorld.tides.filter(w=>w.owner!==b.id);this.returnCenter(b);u.phase='bloodReverse';u.started=e.time;u.until=e.time+.85;this.event(b,e,'seaReverse','arcSeaReverse',u.center,{amount:u.totalHealed,traces,life:.9});}
      }else if(u.phase==='bloodReverse'){const p=clamp((e.time-u.started)/.85,0,1),q=p*p*(3-2*p),from=u.reverseFrom||b;b.x=from.x+(u.center.x-from.x)*q;b.y=from.y+(u.center.y-from.y)*q;if(e.time+1e-9>=u.until){b.x=u.center.x;b.y=u.center.y;u.phase='bloodRebirth';u.started=e.time;u.until=e.time+1.1;u.seaImmune=false;this.settleHeal(b,e);this.event(b,e,'seaRebirth','arcSeaRebirth',u.center,{amount:u.totalHealed,life:1.25});}}
      else if(u.phase==='bloodRebirth'){u.seaImmune=e.time<u.started;if(e.time+1e-9>=u.until){u.seaImmune=false;G.Arcana.finish(b,e);}}
    },
    world(e,dt){if(!e.arcanaWorld.tides)return;e.arcanaWorld.tides=e.arcanaWorld.tides.filter(w=>{const b=e.balls.find(b=>b.id===w.owner&&b.hp>0);if(!b||e.time>w.expires)return false;const t=e.balls.find(t=>t.id===w.target&&t.hp>0);if(!w.launched){if(t)this.aim(w,b,t,e);if(e.time+1e-9<w.armAt)return true;w.launched=true;w.launchedAt=e.time;this.event(b,e,'seaLaunch','arcSeaLaunch',w,{angle:w.angle,slot:w.slot,life:.45});}
        const nx=Math.cos(w.angle),ny=Math.sin(w.angle),ox=w.x,oy=w.y,d=Math.min(w.reach-w.travel,w.speed*dt*b.temporal.rate);w.x+=nx*d;w.y+=ny*d;w.travel+=d;if(e.tick%3===0){w.history.unshift({x:ox,y:oy});w.history.length=Math.min(12,w.history.length);}
        for(const target of e.balls){if(!G.World.enemy(b,target,e)||target.hp<=0||w.hitIds.includes(target.id)||G.Arcana.immuneTarget(target,e))continue;let touch=false;
          for(let i=0;i<=4&&!touch;i++){const f=i/4,x=ox+(w.x-ox)*f,y=oy+(w.y-oy)*f,tx=(target.previousX??target.x)+(target.x-(target.previousX??target.x))*f,ty=(target.previousY??target.y)+(target.y-(target.previousY??target.y))*f,dx=tx-x,dy=ty-y;touch=Math.abs(dx*nx+dy*ny)<=w.thickness/2+target.radius&&Math.abs(-dx*ny+dy*nx)<=w.width/2+target.radius;}
          if(!touch)continue;w.hitIds.push(target.id);const spent=b.arcana.waveBudget[target.id]||0,raw=Math.min(b.arcana.waveRaw*e.heatMultiplier,this.damageCap*e.heatMultiplier-spent);if(raw<=0)continue;b.arcana.waveBudget[target.id]=spent+raw;e.pendingAttacks.push({source:b,target,kind:'arcTide',raw,healRatio:0,angle:w.angle,point:{x:target.x,y:target.y},waveId:w.id});
        }return w.travel<w.reach&&w.x>=-60&&w.x<=C.width+60&&w.y>=-60&&w.y<=C.height+60;
      });},
    hit(h,e){if(h.kind!=='arcTide'||h.avoided||h.actual+h.blocked<=0)return;const b=h.source,u=b.arcana;u.hits++;b.stats.arcanaHits=(b.stats.arcanaHits||0)+1;h.target.role.bloodMark={owner:b.id,until:e.time+5};
      if(h.actual>0){const heal=Math.min(4,u.healBudget,h.actual*.8);u.healBudget-=heal;u.pendingHeal+=heal;h.healRatio=0;}
      this.event(b,e,h.actual>0?'seaHit':'seaBlock',h.actual>0?'arcSeaHit':'guardHeavy',h.target,{angle:h.angle,life:.5});G.Roles.heavyImpact(b,h,e,'arcanaBloodContact',h.actual>0?'arcSeaHit':'guardHeavy',65,0);h.feedback.presented=true;if(h.actual>0)G.Arcana.stop(e,h.actual>=15?.06:.035);
    },
    // Waves bank real HP-drain; only the visible rebirth applies the capped heal.
    settleHeal(b,e){const u=b.arcana;if(!u||u.healSettled||b.hp<=0)return;u.healSettled=true;const amount=Math.min(Math.max(0,b.maxHp-b.hp),u.pendingHeal||0);u.pendingHeal=0;u.totalHealed=amount;b.hp+=amount;b.stats.healing+=amount;},
    healed(){},
    finishStep(e){for(const b of e.balls)if(b.arcana?.phase==='bloodFinale'&&e.time+1e-9>=b.arcana.started+.85)this.settleHeal(b,e);},
    move(b){b.vx=b.vy=0;b.inertia=b.motionSpeed=0;return false;},
    cancel(b,e){if(e.arcanaWorld.tides)e.arcanaWorld.tides=e.arcanaWorld.tides.filter(w=>w.owner!==b.id);b.arcana.seaImmune=false;b.arcana.pendingHeal=0;G.Arcana.finish(b,e);},
    slow(b,e,lost){if(!this.active(b))return;const u=b.arcana;if(Number.isFinite(u.nextWave))u.nextWave+=lost;if(Number.isFinite(u.lastWaveEnds))u.lastWaveEnds+=lost;for(const w of e.arcanaWorld.tides||[])if(w.owner===b.id){w.formedAt+=lost;w.armAt+=lost;w.expires+=lost;if(w.launchedAt)w.launchedAt+=lost;}},
    endCombat(e){if(e.arcanaWorld.tides)e.arcanaWorld.tides=[];for(const b of e.balls)if(this.active(b)&&b.hp>0){const u=b.arcana;this.returnCenter(b);b.x=u.center.x;b.y=u.center.y;u.phase='bloodFinale';u.started=e.time;u.until=e.time+1.85;u.seaImmune=true;b.vx=b.vy=b.inertia=0;this.event(b,e,'seaFinale','arcSeaReverse',u.center,{amount:u.totalHealed,life:1.85});}},
    copy:'血海重生：觉醒且生命≤30%，至少3血能；无需血印，仍等待敌方无敌/盾/反伤结束。消费全部整数血能，等量3～8道宽96、厚30血浪，0.3秒卷起预瞄后固定方向以200速度推进，不追踪；已有自己的血印可获得更完整的预瞄。每浪每敌最多一次、最高7基础伤；28基础伤预算按波数分摊；命中补5秒血印，按实际生命伤害80%吸血、每浪最多4、全招最多20。从液化开始至血柱启动显形前处于“离场”：不参与选中、受击和触发敌方锁定攻击，陷阱及毒池仍正常布置；显形后恢复受击。血浪只累计待回血量，显形展开双翼并出现总回血字时才统一恢复生命与血条。逆流0.85秒将血核收回竞技场中央（受现有边界约束），重生1.1秒，翼展随实际吸血变化。沉默不能取消或阻止奥义。'
  };
})(typeof window!=='undefined'?window:globalThis);
