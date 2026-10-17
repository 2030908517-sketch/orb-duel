(function(root){
  'use strict';
  const G=root.OrbDuel,T=G.Team,C=G.Constants;
  // These adapters run exclusively in the team page. The duel entry never loads them.
  const constrain=G.Physics.constrain.bind(G.Physics);
  G.Physics.constrain=function(ball){const wall=constrain(ball),obstacle=T.obstacleContact(ball,T.current?.obstacles||[]);return wall||obstacle;};
  const ray=G.World.ray.bind(G.World);
  G.World.ray=function(ball,angle){const r=ray(ball,angle),nx=Math.cos(angle),ny=Math.sin(angle),limit=T.rayLimit(ball.x,ball.y,nx,ny,0,T.current?.obstacles||[]),length=Math.min(Math.hypot(r.endX-r.x,r.endY-r.y),limit);return {...r,endX:r.x+nx*length,endY:r.y+ny*length};};
  const predict=G.Awakening.predict.bind(G.Awakening);
  G.Awakening.predict=function(ball,seconds){
    if(!T.current?.obstacles.length||G.Ghost.phased(ball))return predict(ball,seconds);
    const p={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,radius:ball.radius};const steps=Math.ceil(Math.max(0,seconds)*60),dt=steps?seconds/steps:0;
    for(let i=0;i<steps;i++){p.x+=p.vx*dt;p.y+=p.vy*dt;G.Physics.constrain(p);}return {x:p.x,y:p.y};
  };
  const blade=G.Characters.moveBlade.bind(G.Characters);
  G.Characters.moveBlade=function(shot,owner,e,dt){
    const x=shot.x,y=shot.y;shot.wallContact=null;blade(shot,owner,e,dt);
    const dx=shot.x-x,dy=shot.y-y,d=Math.hypot(dx,dy),limit=d?T.rayLimit(x,y,dx/d,dy/d,shot.radius,e.obstacles):Infinity;
    if(limit<=d||shot.wallContact?.obstacle){if(d>0&&limit<=d){shot.x=x+dx/d*limit;shot.y=y+dy/d*limit;}shot.expires=-1;shot.bounces=1;G.Characters.bladeRemoved(shot,owner,e,false);e.burst(shot.x,shot.y,shot.color,5);e.sound('wall',shot.x);}
  };
  const placeTrap=G.World.placeTrap.bind(G.World);
  G.World.placeTrap=function(ball,e){const m=placeTrap(ball,e);if(m===false)return false;if(m)Object.assign(m,T.freePoint(m,m.radius,e.obstacles));return m;};
  const pool=G.World.pool.bind(G.World);
  G.World.pool=function(ball,e,...args){const p=pool(ball,e,...args);if(p&&!p.venomV2)Object.assign(p,T.freePoint(p,2,e.obstacles));return p;};
  const links=G.Roles.netLinks.bind(G.Roles);
  G.Roles.netLinks=function(e){return links(e).filter(l=>{const dx=l.b.x-l.a.x,dy=l.b.y-l.a.y,d=Math.hypot(dx,dy);return !d||T.rayLimit(l.a.x,l.a.y,dx/d,dy/d,0,e.obstacles)>=d;});};
  const force=G.Magnet.force.bind(G.Magnet);
  G.Magnet.force=function(ball,target,e,...args){if(!G.World.enemy(ball,target,e))return false;return force(ball,target,e,...args);};
  const flyers=G.Magnet.flyers.bind(G.Magnet);
  G.Magnet.flyers=function(ball,e,...args){const shots=e.projectiles,clocks=e.timeClocks;e.projectiles=shots.filter(p=>G.World.enemy(ball,p.owner,e));e.timeClocks=clocks.filter(p=>G.World.enemy(ball,p.owner,e));try{return flyers(ball,e,...args);}finally{e.projectiles=shots;e.timeClocks=clocks;}};
  const poison=G.Characters.poison.bind(G.Characters);
  G.Characters.poison=function(ball,target,e,...args){if(G.World.enemy(ball,target,e))return poison(ball,target,e,...args);};
  const silence=G.Temporal.silence.bind(G.Temporal);
  G.Temporal.silence=function(ball,source,e,...args){return G.World.enemy(ball,source,e)?silence(ball,source,e,...args):false;};
  G.TeamRenderer=class TeamRenderer extends G.Renderer{
    draw(e){T.current=e;super.draw(e);}
    drawRoster(e){
      const c=this.ctx;for(const o of e.obstacles){c.fillStyle='#202d3e';c.strokeStyle='#667a94';c.lineWidth=2;this.circle(o.x,o.y,o.radius);c.fill();c.stroke();c.strokeStyle='#354a64';c.lineWidth=1;this.circle(o.x,o.y,o.radius-6);c.stroke();c.fillStyle='#91a5bd';c.fillRect(o.x-5,o.y-1,10,2);}
      super.drawRoster(e);
    }
    drawBall(ball,e){
      if(ball.hp<=0){const c=this.ctx;c.save();c.strokeStyle=T.colors[ball.team]+'55';c.lineWidth=2;c.beginPath();c.moveTo(ball.x-7,ball.y-7);c.lineTo(ball.x+7,ball.y+7);c.moveTo(ball.x+7,ball.y-7);c.lineTo(ball.x-7,ball.y+7);c.stroke();c.restore();return;}
      if(G.Charge?.flowing(ball)||ball.stellar&&['core','rebirth'].includes(ball.stellar.phase))return;super.drawBall(ball,e);const c=this.ctx;c.save();c.fillStyle=T.colors[ball.team];c.strokeStyle='#101722';c.lineWidth=1.5;c.beginPath();
      if(ball.team===0){c.moveTo(ball.x+17,ball.y+12);c.lineTo(ball.x+26,ball.y+23);c.lineTo(ball.x+8,ball.y+23);c.closePath();}else c.rect(ball.x+9,ball.y+12,17,12);
      c.fill();c.stroke();c.fillStyle='#101722';c.font='bold 8px Segoe UI';c.textAlign='center';c.fillText(String(ball.id%2+1),ball.x+17.5,ball.y+21.5);c.restore();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
