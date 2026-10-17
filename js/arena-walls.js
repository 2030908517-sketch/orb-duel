(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,EPS=1e-7;
  const W=G.ArenaWalls={
    rectangles(e){return [...(e.trapperWorld?.cages||[]).map(c=>c.bounds),...(e.arcanaWorld?.defense?.fortress?[e.arcanaWorld.defense.fortress.bounds]:[])].filter(Boolean);},
    hit(x,y,nx,ny,r,e){let best={distance:Infinity,nx:0,ny:0};for(const q of this.rectangles(e)){const inside=x>=q.left&&x<=q.right&&y>=q.top&&y<=q.bottom,l=q.left+(inside?r:-r),rr=q.right+(inside?-r:r),t=q.top+(inside?r:-r),b=q.bottom+(inside?-r:r);
      for(const [axis,value,outward]of [[0,q.left,-1],[0,q.right,1],[1,q.top,-1],[1,q.bottom,1]]){const normal=inside?-outward:outward,coordinate=axis?y:x,other=axis?x:y;if(r>0&&Math.abs(coordinate-value)<r-EPS&&other>=(axis?q.left:q.top)-r&&other<=(axis?q.right:q.bottom)+r&&(axis?ny:nx)*normal<0)best={distance:0,nx:axis?0:normal,ny:axis?normal:0};}
      for(const [axis,value,normal]of [[0,l,-1],[0,rr,1],[1,t,-1],[1,b,1]]){const v=axis?ny:nx;if(Math.abs(v)<EPS)continue;const d=(value-(axis?y:x))/v,other=(axis?x:y)+(axis?nx:ny)*d;if(d< -EPS||other<(axis?l:t)-EPS||other>(axis?rr:b)+EPS)continue;
        const face=inside?-normal:normal;if(v*face>=0)continue;if(d<best.distance)best={distance:Math.max(0,d),nx:axis?0:face,ny:axis?face:0};}}
      return best;},
    clear(a,b,e,r=0){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);return !d||this.hit(a.x,a.y,dx/d,dy/d,r,e).distance>=d-EPS;},
    spawn(p,e){if(p.wallSpawnChecked)return;p.wallSpawnChecked=true;const b=e.balls.find(b=>b.id===p.owner);if(!b)return;const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);if(!d)return;const h=this.hit(b.x,b.y,dx/d,dy/d,p.radius||0,e);if(h.distance<d){p.x=b.x+dx/d*Math.max(0,h.distance-.001);p.y=b.y+dy/d*Math.max(0,h.distance-.001);}},
    integrate(p,e,dt){const speed=Math.hypot(p.vx,p.vy),h=speed?this.hit(p.x,p.y,p.vx/speed,p.vy/speed,p.radius||0,e):{distance:Infinity};if(h.distance>speed*dt+EPS)return G.Physics.integrate(p,dt);p.x+=p.vx/speed*h.distance;p.y+=p.vy/speed*h.distance;const dot=p.vx*h.nx+p.vy*h.ny;p.vx-=2*dot*h.nx;p.vy-=2*dot*h.ny;return true;}
  };
  const move=G.Flyers.move;G.Flyers.move=function(p,e,dt){const speed=Math.hypot(p.vx,p.vy),h=speed?W.hit(p.x,p.y,p.vx/speed,p.vy/speed,p.radius||0,e):{distance:Infinity};const result=move.call(this,p,e,Math.min(dt,speed?h.distance/speed:dt));if(h.distance<=speed*dt+EPS)result.ended=true;return result;};
  const line=G.Mines.freeLine;G.Mines.freeLine=function(a,b,e){return W.clear(a,b,e)&&line.call(this,a,b,e);};
  const sweep=G.World.sweep;G.World.sweep=function(p,x,y,target,e){const engine=e||W.current;if(engine&&!W.clear({x,y},target,engine,p.radius||0))return Infinity;return sweep.call(this,p,x,y,target,e);};
  const ray=G.World.ray;G.World.ray=function(b,a){const result=ray.call(this,b,a),e=W.current;if(!e)return result;const h=W.hit(result.x,result.y,Math.cos(a),Math.sin(a),0,e),d=Math.hypot(result.endX-result.x,result.endY-result.y);if(h.distance<d){result.endX=result.x+Math.cos(a)*h.distance;result.endY=result.y+Math.sin(a)*h.distance;}return result;};
  const reset=G.Engine.prototype.reset;G.Engine.prototype.reset=function(...args){W.current=this;return reset.apply(this,args);};
  const step=G.Engine.prototype.step;G.Engine.prototype.step=function(){W.current=this;return step.call(this);};
  if(G.TeamEngine){const team=G.TeamEngine.prototype.step;G.TeamEngine.prototype.step=function(){W.current=this;return team.call(this);};}
  const world=G.World.update;G.World.update=function(e,dt){W.current=e;for(const p of e.projectiles)W.spawn(p,e);return world.call(this,e,dt);};
  const clocks=G.Temporal.moveClocks;G.Temporal.moveClocks=function(e,dt){for(const p of e.timeClocks)W.spawn(p,e);return clocks.call(this,e,dt);};
  const blade=G.Characters.moveBlade;G.Characters.moveBlade=function(p,b,e,dt){const ox=p.x,oy=p.y;blade.call(this,p,b,e,dt);const dx=p.x-ox,dy=p.y-oy,d=Math.hypot(dx,dy);if(!d)return;const h=W.hit(ox,oy,dx/d,dy/d,p.radius||0,e);if(h.distance<=d+EPS){p.x=ox+dx/d*h.distance;p.y=oy+dy/d*h.distance;p.expires=-1;p.bounces=1;G.Characters.bladeRemoved(p,b,e,false);}};
})(typeof window!=='undefined'?window:globalThis);
