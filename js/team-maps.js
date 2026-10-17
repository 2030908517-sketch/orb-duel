(function(root){
  'use strict';
  const G=root.OrbDuel;
  // Loaded only by team.html, before the existing simulation modules capture dimensions.
  G.Constants=Object.freeze({...G.Constants,width:640,height:440});
  G.Team={
    colors:['#70b5ff','#ef86ba'],names:['蓝队','粉队'],current:null,
    maps:Object.freeze({
      open:{name:'开阔竞技场',description:'640 × 440 · 无障碍，尽情交锋',obstacles:[]},
      pillars:{name:'双柱回廊',description:'640 × 440 · 两座反弹立柱，三条通路',obstacles:[{x:245,y:220,radius:38},{x:395,y:220,radius:38}]},
      cover:{name:'错位掩体',description:'640 × 440 · 三座错位掩体，打断直射路线',obstacles:[{x:200,y:145,radius:34},{x:320,y:295,radius:34},{x:440,y:145,radius:34}]}
    }),
    targetFor(ball,e){return e.balls.find(b=>b.id===ball.teamTarget&&G.World.targetable(b,e)&&b.team!==ball.team)||this.chooseTarget(ball,e);},
    acquire(e){for(const ball of e.balls){if(ball.hp<=0)continue;const previous=e.balls.find(b=>b.id===ball.teamTarget&&b.hp>0);
      if(!previous&&ball.awakening.chainActive)G.Roles.finishChain(ball,e);
      if(!previous&&ball.role.chainWarning)ball.role.chainWarning=0;
      ball.teamTarget=this.chooseTarget(ball,e)?.id??null;
    }},
    chooseTarget(ball,e){
      const enemies=e.balls.filter(b=>G.World.targetable(b,e)&&b.team!==ball.team);
      const locked=enemies.find(b=>b.id===ball.teamTarget);
      const busy=G.Arcana?.busy(ball)||ball.role.chainWarning||ball.awakening.chainActive||ball.laser||ball.magnetic.phase!=='rest'||ball.awakening.chargeUntil||ball.ghost.chargeUntil||ball.temporal.castAt;
      if(locked&&busy)return locked;
      const visible=enemies.filter(b=>this.rayLimit(ball.x,ball.y,(b.x-ball.x)/(Math.hypot(b.x-ball.x,b.y-ball.y)||1),(b.y-ball.y)/(Math.hypot(b.x-ball.x,b.y-ball.y)||1),0,e.obstacles)>=Math.hypot(b.x-ball.x,b.y-ball.y)-b.radius);
      const choices=visible.length?visible:enemies;
      choices.sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y)||a.id-b.id);
      return choices[0];
    },
    rayLimit(x,y,nx,ny,radius,obstacles){
      let limit=Infinity;
      for(const o of obstacles){const dx=x-o.x,dy=y-o.y,r=o.radius+radius,b=dx*nx+dy*ny,c=dx*dx+dy*dy-r*r,disc=b*b-c;
        if(c< -1e-8){limit=0;continue;}
        if(disc<0)continue;const t=-b-Math.sqrt(disc);if(t>=-1e-8)limit=Math.min(limit,Math.max(0,t));
      }
      return limit;
    },
    overlaps(ball,o,tolerance=0){return Math.hypot(ball.x-o.x,ball.y-o.y)<ball.radius+o.radius-tolerance;},
    obstacleContact(ball,obstacles,reflect=true){
      if(G.Ghost?.phased(ball))return false;
      let changed=false;
      for(const o of obstacles){let dx=ball.x-o.x,dy=ball.y-o.y,d=Math.hypot(dx,dy),r=ball.radius+o.radius;if(d>=r)continue;
        if(d<1e-8){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d;
        ball.x=o.x+nx*(r+.02);ball.y=o.y+ny*(r+.02);changed=true;
        const normal=ball.vx*nx+ball.vy*ny;
        if(reflect&&normal<0){const speed=-normal;ball.vx-=2*normal*nx;ball.vy-=2*normal*ny;
          if(!ball.wallContact||speed>ball.wallContact.speed)ball.wallContact={speed,nx,ny,obstacle:true};
        }
      }
      return changed;
    },
    freePoint(point,radius,obstacles){const p={...point,radius,vx:0,vy:0};this.obstacleContact(p,obstacles,false);return {x:p.x,y:p.y};}
  };
})(typeof window!=='undefined'?window:globalThis);
