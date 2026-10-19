(function(root){
  'use strict';const G=root.OrbDuel;
  const H=G.VampireHunt={
    wait:6,cooldown:10,speed:420,
    fresh(){return {phase:'idle',started:0,until:0,nextCast:0,aim:0,target:null,awake:false,missing:{},tick:0,safeTick:-1,casts:0,hits:0};},
    reset(e){for(const b of e.balls)if(b.type==='vampire')b.hunt=this.fresh();},
    busy(b){return !!b.hunt&&b.hunt.phase!=='idle';},
    phasing(b){return !!b.hunt&&(['flight','reform'].includes(b.hunt.phase)||b.hunt.safeTick>=0&&b.hunt.safeTick===b.hunt.tick);},
    hidden(b){return b.hunt?.phase==='flight';},
    event(b,e,stage,cue,p=b){const h=b.hunt,id='hunt:'+b.id+':'+h.casts+':'+stage;e.effects.push({kind:'hunt',style:stage,owner:b.id,x:p.x,y:p.y,angle:h.aim,age:0,life:.3,eventId:id});if(cue){e.sound(cue,p.x);e.soundEvents.at(-1).presentationId=id;}G.Presentation?.note(e,'vampire.hunt',{eventId:id,stage,actorId:b.id,targetId:stage==='mark'?p.id:h.target,x:p.x,y:p.y,cue:cue||null});},
    update(b,e){if(b.type!=='vampire'||e.state!=='running'||e.ending||b.hp<=0)return;const h=b.hunt??=this.fresh();h.tick=e.tick;
      if(!h.awake){h.awake=true;for(const t of e.balls)if(G.World.enemy(b,t,e))h.missing[t.id]=e.time;}
      for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0)continue;const mark=t.role.bloodMark;if(mark?.owner===b.id&&mark.until>e.time)h.missing[t.id]=e.time;else h.missing[t.id]??=e.time;}
      const target=e.balls.find(t=>t.id===h.target&&G.World.targetable(t,e)&&G.World.enemy(b,t,e));
      if(h.phase!=='idle'){
        if(G.Temporal.silenced(b,e)||!target){this.finish(b,e);return;}
        if(h.phase==='warning'){
          if(e.time<h.until-.08)h.aim=G.Aim.direct(b,target,e,'hunt',this.speed,Math.max(0,h.until-e.time));
          if(e.time+1e-9>=h.until){h.phase='flight';h.flightAim=h.aim;h.started=e.time;h.until=e.time+Math.max(.28,Math.min(450/this.speed,Math.hypot(target.x-b.x,target.y-b.y)/this.speed+.1));b.inertia=0;this.event(b,e,'launch','huntLaunch');}return;
        }
        if(h.phase==='flight'&&e.time+1e-9>=h.until)this.reform(b,e);
        else if(h.phase==='reform'&&e.time+1e-9>=h.until)this.finish(b,e);
        return;
      }
      const t=G.World.targetFor(b,e);if(!t||e.time<h.nextCast||e.time-(h.missing[t.id]??e.time)<this.wait||G.Temporal.silenced(b,e)||G.Arcana?.busy(b)||b.awakening.chainActive||b.role.chainWarning||b.awakening.chargeUntil>e.time||G.Awakening.dashing(b,e))return;
      if(G.Ghost.phased(t)||G.Awakening.dashing(t,e)||G.Arcana?.immune(t))return;
      h.phase='warning';h.started=e.time;h.until=e.time+.24;h.nextCast=e.time+this.cooldown;h.target=t.id;h.aim=G.World.aim(b,t,this.speed,.24);h.casts++;h.hit=false;h.wallHit=false;this.event(b,e,'prepare','huntPrepare');e.signal(b,'血影追猎 · 锁定扑袭','miss');
    },
    move(b,dt,e){const h=b.hunt,flight=h.phase==='flight',speed=flight?this.speed:b.speed;b.vx=Math.cos(h.aim)*speed*b.temporal.rate;b.vy=Math.sin(h.aim)*speed*b.temporal.rate;b.inertia=0;b.x+=b.vx*dt;b.y+=b.vy*dt;
      const wall=G.Physics.constrain(b);if(wall){h.aim=Math.atan2(b.vy,b.vx);if(flight)h.wallHit=true;}return wall;
    },
    contacts(e){for(const b of e.balls){const h=b.hunt;if(!h||h.phase!=='flight'||h.hit||b.hp<=0)continue;
        const hits=e.balls.filter(t=>t.hp>0&&G.World.enemy(b,t,e)&&!G.Ghost.phased(t)&&!G.Awakening.dashing(t,e)&&!G.Arcana?.immune(t)&&G.Mines.freeLine(b,t,e)).map(t=>{const old={x:t.previousX??t.x,y:t.previousY??t.y},relative={x:b.x-t.x+old.x,y:b.y-t.y+old.y,radius:b.radius};return {t,at:G.World.sweep(relative,b.previousX,b.previousY,{...old,radius:t.radius})};}).filter(v=>v.at!==Infinity).sort((a,b)=>a.at-b.at);
        const t=hits[0]?.t;if(!t){if(h.wallHit)this.reform(b,e);continue;}h.hit=true;h.hits++;e.pendingAttacks.push({source:b,target:t,kind:'hunt',raw:8*e.heatMultiplier});t.role.bloodMark={owner:b.id,until:e.time+5};h.missing[t.id]=e.time;h.aim=Math.atan2(b.y-t.y,b.x-t.x);this.event(b,e,'mark','huntMark',t);t.hitVisual={age:0,life:.18,angle:h.aim+Math.PI,power:1.3};e.hitStop(.025);e.float(t.x,t.y-30,'血印',b.def.color);G.Roles.effect(b,e,'bloodMark',t,0,.35);this.reform(b,e);
      }},
    reform(b,e){const h=b.hunt;if(h.phase==='reform'||h.phase==='idle')return;h.phase='reform';h.started=e.time;h.until=e.time+.22;b.vx=Math.cos(h.aim)*b.speed*b.temporal.rate;b.vy=Math.sin(h.aim)*b.speed*b.temporal.rate;this.event(b,e,'reform','huntReform');},
    finish(b,e,quiet=false){const h=b.hunt;if(!h||h.phase==='idle')return;if(h.phase==='warning')h.aim=Math.atan2(b.vy,b.vx);h.phase='idle';h.safeTick=h.tick=e.tick;h.target=null;b.inertia=0;b.vx=Math.cos(h.aim)*b.speed*b.temporal.rate;b.vy=Math.sin(h.aim)*b.speed*b.temporal.rate;
      if(!quiet&&b.hp>0){for(let pass=0;pass<32;pass++){G.Physics.constrain(b);let overlap=false;for(const t of e.balls)if(t!==b&&t.hp>0&&!G.Ghost.phased(t)&&!G.Arcana?.noContact(t)&&Math.hypot(t.x-b.x,t.y-b.y)<b.radius+t.radius){G.Physics.resolve(b,t);G.Physics.constrain(t);overlap=true;}if(!overlap)break;}G.Physics.constrain(b);}
    },
    endCombat(e){for(const b of e.balls)if(b.hunt)this.finish(b,e,true);},
    slow(b,lost){if(b.hunt&&this.busy(b))b.hunt.started+=lost;},
    snapshot(h){return {...h,missing:{...h.missing}};},
    status(b,e){if(!b.hunt)return '待机';if(this.busy(b))return {warning:'预备',flight:'扑袭',reform:'凝形'}[b.hunt.phase];return Math.max(0,b.hunt.nextCast-e.time).toFixed(1)+'s';},
    copy:'全期可用：当前目标连续6秒无自己的血印，可独立发动血影追猎，冷却10秒：0.24秒预备、末0.08秒锁定，以420速度真实定向扑袭最多1.07秒；首次接触非无敌敌人造成一次8基础伤害并按实际伤害正常吸血，同时补5秒血印、不送血能。扑袭/恢复不结算身体碰撞，仍可受技能伤害；碰墙/障碍或落空正常凝形，沉默可中断。'
  };
  const noContact=G.Arcana.noContact,custom=G.Arcana.customMove,move=G.Arcana.move;
  G.Arcana.noContact=function(b){return H.phasing(b)||noContact.call(this,b);};
  G.Arcana.customMove=function(b){return H.phasing(b)&&b.hunt.phase!=='idle'||custom.call(this,b);};
  G.Arcana.move=function(b,dt,e){return H.phasing(b)&&b.hunt.phase!=='idle'?H.move(b,dt,e):move.call(this,b,dt,e);};
})(typeof window!=='undefined'?window:globalThis);
