(function(root){
'use strict';const G=root.OrbDuel,D=G.BladeDance,TAU=Math.PI*2;
const V=G.BladeDanceView={
 ribbon(c,path,color,width,alpha=1){if(path.length<3)return;const left=[],right=[];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1,w=width*.5*(1-i/path.length),nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;left.push({x:path[i].x+nx*w,y:path[i].y+ny*w});right.push({x:path[i].x-nx*w,y:path[i].y-ny*w});}c.beginPath();c.moveTo(left[0].x,left[0].y);for(const p of left)c.lineTo(p.x,p.y);for(const p of right.reverse())c.lineTo(p.x,p.y);c.closePath();c.fillStyle=color;c.globalAlpha=alpha;c.fill();c.globalAlpha=1;},
 blade(c,x,y,a,size,color){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(size,-size*.3);c.bezierCurveTo(size*.2,-size*1.4,-size,-size*.55,-size*.75,size*.55);c.bezierCurveTo(-size*.2,-size*.25,size*.2,-size*.4,size,-size*.3);c.closePath();c.fillStyle=color;c.fill();c.beginPath();c.moveTo(size,-size*.3);c.bezierCurveTo(size*.2,-size*1.4,-size,-size*.55,-size*.75,size*.55);c.strokeStyle='#e7fcff';c.lineWidth=1.2;c.stroke();c.restore();},
 behind(r,e){const c=r.ctx;c.save();for(const b of e.balls){const s=D.state(b);if(!s?.active)continue;
  for(let i=4;i<s.path.length;i+=5){const p=s.path[i];c.globalAlpha=.10*(1-i/s.path.length);c.beginPath();c.arc(p.x,p.y,b.radius*.9,0,TAU);c.fillStyle='#65cee9';c.fill();}c.globalAlpha=1;
  this.ribbon(c,s.path,'#4094b0',3,.28);
  for(const p of D.blades(b,e)){this.ribbon(c,[{x:p.x,y:p.y},...p.history],p.danceSlot?'#c5e3ed':'#47bedc',p.returning?7:5,.75);this.ribbon(c,[{x:p.x,y:p.y},...p.history.slice(0,15)],'#d8f8ff',1.3,.8);
   const pull=s.events.findLast(v=>v.type==='pull'&&v.slot===p.danceSlot),age=pull?e.time-pull.at:99;if(p.returning&&age<.24){const k=1-age/.24;c.beginPath();c.moveTo(b.x,b.y);c.quadraticCurveTo(s.meet.x-s.side*12,s.meet.y+s.side*16,p.x,p.y);c.strokeStyle='#a6eafa';c.globalAlpha=k*.33;c.lineWidth=1.3;c.stroke();c.globalAlpha=1;}}
 }c.restore();},
 front(r,e){const c=r.ctx;c.save();for(const b of e.balls){const s=D.state(b);if(!s)continue;const age=e.time-s.started;
  if(s.active&&b.arcana.phase==='danceWind'){const k=Math.min(1,age/D.config.wind);for(let i=0;i<2;i++){const a=s.heading+i*Math.PI-k*2.1,rad=b.radius+10;this.blade(c,b.x+Math.cos(a)*rad,b.y+Math.sin(a)*rad,a+1.57,7+k*3,i?'#c9e6ef':'#4bc3e0');}}
  for(const p of D.blades(b,e))this.blade(c,p.x,p.y,e.time*19*(p.danceSlot?-1:1),p.danceSlot?7:9,p.danceSlot?'#bedee8':'#43b6d7');
  for(const v of s.events){const t=e.time-v.at;if(t<0||t>.5)continue;const q=t/.5,k=1-q;
   if(v.type==='cut'){c.save();c.translate(v.x,v.y);c.rotate(v.angle);c.globalAlpha=k*.8;c.fillStyle=v.blocked?'#aac5d4':'#c7f4ff';c.beginPath();c.moveTo(-21*k,-3);c.lineTo(21*k,2);c.lineTo(-12*k,0);c.closePath();c.fill();c.restore();}
   if(v.type==='catch'){c.save();c.translate(v.x,v.y);c.rotate(v.angle+q*1.5);c.fillStyle='#d9f9ff';c.globalAlpha=k*.85;c.beginPath();c.moveTo(-14*k,0);c.lineTo(-2,-1.7);c.lineTo(12*k,0);c.lineTo(2,1.7);c.closePath();c.fill();c.globalAlpha=k*.5;c.strokeStyle='#65cee9';c.lineWidth=2;c.beginPath();c.arc(0,0,b.radius+7,v.angle-q*2,v.angle+1.5-q*2);c.stroke();c.restore();}
   if(v.type==='finale'){c.save();c.translate(v.x,v.y);c.rotate(v.angle+q*2);const radius=29+q*19;c.globalAlpha=k;for(let i=0;i<2;i++){c.beginPath();c.arc(0,0,radius,i*Math.PI+q*.08,i*Math.PI+Math.PI-q*.12);c.strokeStyle=i?'#d9f4ff':'#5bcbe8';c.lineWidth=(i?2:4)*k+.3;c.stroke();}c.globalAlpha=k*.7;for(let i=0;i<4;i++){const a=i*TAU/4;c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);c.lineTo(Math.cos(a)*(radius+8*k),Math.sin(a)*(radius+8*k));c.strokeStyle='#e6faff';c.lineWidth=1;c.stroke();}c.restore();}
  }
 }c.restore();}
};
// Dedicated dance presentation replaces older generic moon/catch overlays, never their combat rewards.
const emit=G.Spectacle.emit,hit=G.Spectacle.hit,effect=G.Characters.effect,flyer=G.TacticsView.flyer;
G.Spectacle.emit=function(e,b,style,...args){if(D.active(b)&&style==='moon')return;return emit.call(this,e,b,style,...args);};
G.Spectacle.hit=function(e,h){if(h.dance)return;return hit.call(this,e,h);};
G.Characters.effect=function(e,b,t,style,...args){if(D.active(b)&&style==='bladeCatch')return;return effect.call(this,e,b,t,style,...args);};
G.TacticsView.flyer=function(r,p){return p.danceOwner!==undefined||flyer.call(this,r,p);};
const ball=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){return ball.call(this,D.active(b)?{...b,trail:b.trail.slice(0,6)}:b,e);};
const world=G.Renderer.prototype.drawWorld;G.Renderer.prototype.drawWorld=function(e){world.call(this,e);V.behind(this,e);};
const signals=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){signals.call(this,e);V.front(this,e);};
})(typeof window!=='undefined'?window:globalThis);
