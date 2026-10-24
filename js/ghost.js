(function(root){
  'use strict';
  const G=root.OrbDuel;
  G.Ghost={
    record(ball,dt,e){const g=ball.ghost;if(!g.trace)return;g.traceTime+=dt;g.trace.push({t:g.traceTime,x:ball.x,y:ball.y,segments:[{x:ball.previousX,y:ball.previousY,endX:ball.x,endY:ball.y,u0:0,u1:1}]});},
    touches(segments,target,radius){return segments.some(s=>{const tx=target.previousX??target.x,ty=target.previousY??target.y,dx=target.x-tx,dy=target.y-ty;return G.World.intersects({x:s.endX,y:s.endY,radius},s.x,s.y,{radius:target.radius,previousX:tx+dx*s.u0,previousY:ty+dy*s.u0,x:tx+dx*s.u1,y:ty+dy*s.u1});});},
    echo(ball,e){const g=ball.ghost;if(!g.trace||g.trace.length<2)return;e.ghostEchoes??=[];const start=g.trace[0];e.ghostEchoes.push({id:e.nextWorldId++,...(e.demonWorld?{heat:e.heatMultiplier}:{}),owner:ball.id,adaptiveId:g.adaptiveId,started:e.time,duration:g.traceTime,path:g.trace,x:start.x,y:start.y,radius:ball.radius,cursor:1,elapsed:0,nextFear:{},burst:g.exitBurst?(5+Math.min(3,g.scares))*e.heatMultiplier:0});ball.stats.echoes=(ball.stats.echoes||0)+1;e.signal(ball,'魂影回响 · 重走虚化','ghostEcho');},
    replay(echo,age){const path=echo.path,from=echo.elapsed,to=Math.min(echo.duration,Math.max(from,age)),segments=[];let i=echo.cursor;
      while(i<path.length){const frame=path[i],previous=path[i-1],span=frame.t-previous.t;if(previous.t>to+1e-9)break;
        for(const s of frame.segments){const a=previous.t+s.u0*span,b=previous.t+s.u1*span,lo=Math.max(a,from),hi=Math.min(b,to);if(hi-lo<=1e-10)continue;const q0=(lo-a)/(b-a),q1=(hi-a)/(b-a),dx=s.endX-s.x,dy=s.endY-s.y;segments.push({x:s.x+dx*q0,y:s.y+dy*q0,endX:s.x+dx*q1,endY:s.y+dy*q1,u0:(lo-from)/(to-from),u1:(hi-from)/(to-from)});}
        if(frame.t>to+1e-9)break;i++;
      }
      echo.cursor=Math.min(i,path.length-1);echo.elapsed=to;if(segments.length){echo.x=segments.at(-1).endX;echo.y=segments.at(-1).endY;}return segments;
    },
    updateEchoes(e){if(e.state!=='running')return;const live=[];for(const echo of e.ghostEchoes||[]){const owner=e.balls.find(b=>b.id===echo.owner&&b.hp>0);if(!owner)continue;const segments=this.replay(echo,e.time-echo.started);
        for(const target of e.balls){if(!G.World.enemy(owner,target,e)||target.hp<=0||e.time+1e-9<(echo.nextFear[target.id]||0))continue;const motion=segments.length?segments:[{x:echo.x,y:echo.y,endX:echo.x,endY:echo.y,u0:0,u1:1}];if(!this.touches(motion,target,echo.radius))continue;echo.nextFear[target.id]=e.time+owner.def.fearInterval;e.pendingAttacks.push({source:owner,target,raw:owner.def.fearDamage*e.heatMultiplier,kind:'fear',adaptiveId:echo.adaptiveId,echo:true,point:{x:echo.x,y:echo.y}});}
        if(echo.elapsed+1e-9>=echo.duration){if(echo.burst){for(const target of e.balls)if(G.World.enemy(owner,target,e)&&target.hp>0&&Math.hypot(target.x-echo.x,target.y-echo.y)<=95+target.radius)e.pendingAttacks.push({source:owner,target,raw:echo.burst,heat:echo.heat,kind:'soulBurst',adaptiveId:echo.adaptiveId,echo:true,point:{x:echo.x,y:echo.y}});e.effects.push({kind:'soulBurst',owner:owner.id,x:echo.x,y:echo.y,color:owner.def.color,age:0,life:.55,radius:95});e.sound('soulBurst',echo.x);owner.stats.echoBursts=(owner.stats.echoBursts||0)+1;}}else live.push(echo);
      }e.ghostEchoes=live;
    },
    phased(ball){return ball.hp>0&&ball.ghost?.phase==='phased';},
    justExited(ball,engine){return ball.ghost?.endedTick===engine.tick;},
    enter(ball,engine){const g=ball.ghost;g.phase='phased';g.started=engine.time;g.until=engine.time+(G.Awakening.active(ball)?1.9:ball.def.phaseDuration);g.exitBurst=G.Awakening.active(ball);g.nextFear={};g.scares=0;g.lunges=0;g.chargeUntil=0;g.nextLunge=g.exitBurst?engine.time+.1:Infinity;g.lungeUntil=0;g.lungeSpeed=0;
      g.adaptiveId=G.Adaptive?.begin(ball,'ghost',engine);g.trace=[{t:0,x:ball.x,y:ball.y}];g.traceTime=0;ball.inertia=0;ball.stagger=null;ball.magneticMark=null;
      if(ball.temporal.rate<1){ball.vx/=ball.temporal.rate;ball.vy/=ball.temporal.rate;ball.temporal.rate=1;G.Physics.limit(ball);}
      ball.stats.phases++;engine.signal(ball,g.exitBurst?'追魂虚化 · 三连穿':'幽灵虚化','ghostPhase');engine.effects.push({kind:'ghostShift',owner:ball.id,x:ball.x,y:ball.y,color:ball.def.color,age:0,life:.4});
    },
    finish(ball,engine){const g=ball.ghost;this.echo(ball,engine);g.trace=null;G.Adaptive?.close(ball,g.adaptiveId);g.phase='solid';g.until=0;g.lungeSpeed=0;g.chargeUntil=0;g.nextLunge=Infinity;g.endedTick=engine.tick;
      if(g.exitBurst){ball.stats.soulBursts++;const raw=(5+Math.min(3,g.scares))*engine.heatMultiplier;
        for(const target of engine.balls)if(G.World.enemy(ball,target,engine)&&target.hp>0&&Math.hypot(target.x-ball.x,target.y-ball.y)<=95+target.radius)engine.pendingAttacks.push({source:ball,target,raw,kind:'soulBurst',adaptiveId:g.adaptiveId,point:{x:ball.x,y:ball.y}});
        engine.effects.push({kind:'soulBurst',owner:ball.id,x:ball.x,y:ball.y,color:ball.def.color,age:0,life:.55,radius:95});engine.sound('soulBurst',ball.x);engine.burst(ball.x,ball.y,ball.def.color,14);
      }else{engine.sound('ghostReturn',ball.x);engine.effects.push({kind:'ghostShift',owner:ball.id,x:ball.x,y:ball.y,color:ball.def.color,age:0,life:.3});}
      g.exitBurst=false;G.Physics.normalizeSpeed(ball);
    },
    prepare(engine){for(const ball of engine.balls){if(ball.type!=='ghost'||ball.hp<=0||G.Demon?.frozen?.(ball,engine))continue;const g=ball.ghost;
      if(g.phase==='phased'&&engine.time+1e-9>=g.until)this.finish(ball,engine);
      else if(g.phase==='warning'&&engine.time+1e-9>=g.until){if(G.Temporal.silenced(ball,engine)){g.phase='solid';g.until=0;}else this.enter(ball,engine);}
    }},
    update(ball,dt,engine){if(engine.state!=='running'||G.Temporal.silenced(ball,engine))return;const g=ball.ghost,t=engine.time,target=G.World.targetFor(ball,engine);
      if(g.phase==='solid'&&t+1e-9>=g.nextPhase){g.phase='warning';g.until=t+.25;g.nextPhase=t+ball.def.phasePeriod+(G.Awakening.active(ball)?1.6:0);engine.sound('ghostCharge',ball.x);return;}
      if(!this.phased(ball)||!g.exitBurst||!target)return;
      if(g.lungeSpeed&&t+1e-9>=g.lungeUntil)g.lungeSpeed=0;
      if(g.chargeUntil){if(t<g.chargeUntil-.04)g.aim=G.Venom.steer(ball,engine,g.aim,G.World.aim(ball,target,560,g.chargeUntil-t),dt);
        if(t+1e-9>=g.chargeUntil){g.chargeUntil=0;g.lunges++;g.lungeUntil=t+.23;g.lungeSpeed=560;g.nextLunge=t+.45;ball.inertia=0;ball.vx=Math.cos(g.aim)*560;ball.vy=Math.sin(g.aim)*560;engine.sound('ghostLunge',ball.x);engine.effects.push({kind:'ghostCut',owner:ball.id,x:ball.x,y:ball.y,angle:g.aim,color:ball.def.color,age:0,life:.3});}
      }else if(g.lunges<3&&t+1e-9>=g.nextLunge){g.aim=G.World.aim(ball,target,560,.12);g.chargeUntil=t+.12;}
    },
    contacts(engine){if(engine.state!=='running')return;for(const ball of engine.balls){if(!this.phased(ball))continue;const g=ball.ghost;this.record(ball,G.Constants.dt,engine);
      for(const target of engine.balls){if(!G.World.enemy(ball,target,engine)||target.hp<=0||engine.time+1e-9<(g.nextFear[target.id]||0))continue;
        if(!this.touches(g.trace?.at(-1)?.segments||[{x:ball.previousX,y:ball.previousY,endX:ball.x,endY:ball.y,u0:0,u1:1}],target,ball.radius))continue;
        g.nextFear[target.id]=engine.time+ball.def.fearInterval;engine.pendingAttacks.push({source:ball,target,raw:ball.def.fearDamage*engine.heatMultiplier,kind:'fear',adaptiveId:g.adaptiveId});
      }
    }this.updateEchoes(engine);},
    interrupt(ball){const g=ball.ghost;if(g.phase==='warning'){g.phase='solid';g.until=0;}},
    hit(hit,engine){if(hit.kind==='fear'&&hit.actual>0){if(hit.echo)hit.source.stats.echoHits=(hit.source.stats.echoHits||0)+1;else{hit.source.stats.fearHits++;hit.source.ghost.scares++;}engine.sound(hit.echo?'ghostEchoHit':'ghostFear',hit.target.x);engine.effects.push({kind:'ghostFear',owner:hit.source.id,x:hit.target.x,y:hit.target.y,color:hit.source.def.color,age:0,life:.25});}
      if(hit.kind==='soulBurst'&&hit.actual+hit.blocked>0&&!hit.avoided)G.Roles.heavyImpact(hit.source,hit,engine,'pressureHit','soulHit',90,.05);
    },
    snapshot(g){return {...g,nextFear:{...g.nextFear},...(g.trace?{trace:g.trace.map(f=>({...f,segments:f.segments?.map(s=>({...s}))}))}:{})};},
    snapshotEcho(e){return {...e,nextFear:{...e.nextFear},path:e.path.map(f=>({...f,segments:f.segments?.map(s=>({...s}))}))};},
    status(ball,engine){const g=ball.ghost,t=engine.time,echo=(engine.ghostEchoes||[]).find(v=>v.owner===ball.id);return [
      {label:'虚化CD',value:Math.max(0,g.nextPhase-t).toFixed(1)+'s'},
      {label:'形态',value:this.phased(ball)&&G.Awakening.active(ball)?'虚化'+g.lunges+'/3':{solid:'实体',warning:'预警',phased:'虚化'}[g.phase]},
      {label:'虚化余时',value:this.phased(ball)?Math.max(0,g.until-t).toFixed(1)+'s':'0.0s'},
      {label:'恐吓/跳',value:(ball.def.fearDamage*engine.heatMultiplier).toFixed(1)},
      {label:'魂爆',value:G.Awakening.active(ball)?((5+Math.min(3,g.scares))*engine.heatMultiplier).toFixed(1):'未觉醒'},
      {label:'魂影',value:echo?Math.max(0,echo.duration-echo.elapsed).toFixed(1)+'s':this.phased(ball)?'录制':'待机'}
    ];}
  };
})(typeof window!=='undefined'?window:globalThis);
