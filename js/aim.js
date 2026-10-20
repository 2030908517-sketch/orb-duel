(function(root){
  'use strict';const G=root.OrbDuel,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  G.Aim={
    horizon(ball,speed){return ball.type==='laser'?1:ball.type==='ranger'&&speed>=700?.9:.5;},
    turn(angle,desired,limit){const delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));return angle+clamp(delta,-limit,limit);},
    track(ball,target,e,key,speed,delay=0,rate=4,dt=G.Constants.dt,arcana=false){
      const tracks=ball.role.aimTracks??={};let a=tracks[key];
      if(!a)a=tracks[key]={angle:Math.atan2(target.y-ball.y,target.x-ball.x),tick:-1};
      // Observe at fixed 60 Hz; turn at the physics rate. This also bounds work at 4×.
      if(a.desiredTick===undefined||e.tick-a.desiredTick>=4||a.target!==target.id){a.desired=G.World.aim(ball,target,speed,delay);a.desiredTick=e.tick;a.target=target.id;}
      if(a.tick!==e.tick){const control=arcana?{rate:1,offset:0}:G.Venom?.aimControl(ball,e)||{rate:1,offset:0};a.angle=this.turn(a.angle,a.desired+control.offset,rate*control.rate*dt);a.tick=e.tick;}
      return a.angle;
    },
    direct(ball,target,e,key,speed,delay=0,dt=G.Constants.dt){const desired=G.World.aim(ball,target,speed,delay);return this.adjust(ball,e,key,desired,dt);},
    adjust(ball,e,key,desired,dt=G.Constants.dt){const control=G.Venom?.aimControl(ball,e)||{rate:1,offset:0},tracks=ball.role.aimTracks??={},k='debuff:'+key;let a=tracks[k];if(!a)a=tracks[k]={angle:Math.atan2(ball.vy,ball.vx),tick:-1};if(a.tick!==e.tick){a.angle=control.rate===1&&control.offset===0?desired:this.turn(a.angle,desired+control.offset,8*control.rate*dt);a.tick=e.tick;}return a.angle;},
    point(ball,target,e,key,desired,dt=G.Constants.dt){const control=G.Venom?.aimControl(ball,e)||{rate:1,offset:0},tracks=ball.role.aimTracks??={},k='point:'+key;let p=tracks[k];if(!p)p=tracks[k]={x:target.x,y:target.y,tick:-1};if(p.tick!==e.tick){const dx=desired.x-p.x,dy=desired.y-p.y,d=Math.hypot(dx,dy)||1,k=control.rate===1?1:Math.min(1,540*control.rate*dt/d);p.x+=dx*k;p.y+=dy*k;p.tick=e.tick;}return {x:p.x,y:p.y};},
    spread(ball,target,kind,calibration=ball.role.calibration){const distance=Math.hypot(target.x-ball.x,target.y-ball.y);
      if(kind==='ranger')return (9-3*clamp(calibration,0,ball.def.calibrationCap))*Math.PI/180;
      if(kind==='sniper')return ball.def.sniperSpread*(1-clamp(calibration,0,ball.def.calibrationCap)/ball.def.calibrationCap)*Math.PI/180;
      if(kind==='venom')return .10+.18*clamp((distance-70)/160,0,1);return 0;
    },
    offset(ball,target,e,kind,calibration=ball.role.calibration){const sequence=ball.role.aimSequence=(ball.role.aimSequence||0)+1;
      const rng=new G.RNG(e.seed+':aim:'+ball.id+':'+sequence+':'+kind);return rng.between(-1,1)*this.spread(ball,target,kind,calibration);
    },
    result(shot,e,hit){if(!shot.calibrationEligible||shot.aimResolved)return;shot.aimResolved=true;const b=e.balls.find(v=>v.id===shot.owner&&v.hp>0);if(!b||b.type!=='ranger')return;
      if(shot.sniper){if(b.role.sniperPending===shot.id)b.role.sniperPending=null;b.role.calibration=hit?b.def.calibrationCap:0;e.signal(b,hit?'狙击命中 · 校准回满':'狙击落空 · 校准清空',hit?'ready':'miss');}
      else if(hit)b.role.calibration=Math.min(b.def.calibrationCap,b.role.calibration+1);if(hit)b.role.calibrationUntil=e.time+6;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
