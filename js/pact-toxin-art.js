(function(root){
'use strict';const G=root.OrbDuel,clamp=x=>Math.max(0,Math.min(1,x));
const P=G.PactToxinView={
 point(v,n,u,t){const dx=n.x-v.x,dy=n.y-v.y,d=Math.hypot(dx,dy)||1,offset=Math.sin(u*Math.PI)*Math.sin(u*18-t*10+1)*7;return{x:v.x+dx*u-dy/d*offset,y:v.y+dy*u+dx/d*offset};},
 drop(c,v,n,u,t,power=1){const centre=this.point(v,n,u,t),ahead=this.point(v,n,Math.max(0,u-.025),t),angle=Math.atan2(ahead.y-centre.y,ahead.x-centre.x),fade=Math.min(1,u*8,(1-u)*8);if(fade<=0)return;c.save();c.globalAlpha*=fade;c.translate(centre.x,centre.y);c.rotate(angle);c.beginPath();c.moveTo(6*power,0);c.quadraticCurveTo(0,-3.3*power,-6*power,-1.2*power);c.quadraticCurveTo(-10*power,0,-6*power,1.2*power);c.quadraticCurveTo(0,3.1*power,6*power,0);c.closePath();c.fillStyle='#4a792e';c.fill();c.beginPath();c.moveTo(4.5*power,-.4);c.quadraticCurveTo(-1,-2.4*power,-5*power,-.7);c.quadraticCurveTo(-1,.8,4.5*power,-.4);c.fillStyle='#b0df65';c.fill();c.restore();},
 draw(r,e){const c=r.ctx,t=e.time;c.save();for(const v of e.balls){if(v.type!=='vampire'||v.hp<=0||!v.awakening.chainActive||v.awakening.chainUntil<=t||G.World.absent(v,e))continue;const n=G.World.targetFor(v,e);if(!n||n.type!=='venom'||n.hp<=0||G.World.absent(n,e))continue;for(let i=0;i<3;i++){const phase=((t-v.awakening.chainStartedAt)*1.4+i/3)%1;this.drop(c,v,n,1-phase,t,.72);}}
  for(const f of e.effects){if(f.kind!=='pactToxin')continue;const v=e.balls.find(b=>b.id===f.target),n=e.balls.find(b=>b.id===f.owner);if(!v||!n||v.hp<=0||G.World.absent(v,e))continue;const q=clamp(f.age/f.life);this.drop(c,v,n,1-q,t,1.25*(1-q*.25));}c.restore();}
};
const draw=G.Renderer.prototype.drawAbilities;G.Renderer.prototype.drawAbilities=function(e){draw.call(this,e);P.draw(this,e);};
})(typeof window!=='undefined'?window:globalThis);
