(function(root){
'use strict';const G=root.OrbDuel,O=G.Overdrive,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));if(!G.Renderer||!O||!G.ArcanaView)return;
const V=G.KineticView={
 line(c,x,y,xx,yy,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke();},
 ellipse(c,x,y,rx,ry,color,width=1){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();},
 stream(c,points,time,phase){
  points=points.filter(p=>time-p.t<.44);if(points.length<2)return;c.save();c.lineJoin='round';c.lineCap='butt';
  const sides=points.map((p,i)=>{const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=before.x-after.x,dy=before.y-after.y,d=Math.hypot(dx,dy)||1;return {p,nx:-dy/d,ny:dx/d,w:clamp(1-(time-p.t)/.44)*10};});
  // One filled tapered ribbon: no repeated round caps or overlapping bead sprites.
  for(const [scale,color,alpha]of [[1,'#a36b29',.55],[.58,'#eab751',.65],[.12,'#fff2c9',.85]]){c.beginPath();sides.forEach((v,i)=>{const x=v.p.x+v.nx*v.w*scale,y=v.p.y+v.ny*v.w*scale;i?c.lineTo(x,y):c.moveTo(x,y);});for(const v of [...sides].reverse())c.lineTo(v.p.x-v.nx*v.w*scale,v.p.y-v.ny*v.w*scale);c.closePath();c.fillStyle=color;c.globalAlpha=alpha*clamp(1-(time-points[0].t)/.44);c.fill();}
  c.restore();
 },
 compression(c,b,t,s,e){const p=s.focus,q=clamp(s.gather||0),a=s.angle;
  // Energy is stripped from the moving enemy and narrows into the fixed gap.
  if(s.phase==='flight'){
   const dx=p.x-t.x,dy=p.y-t.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
   c.save();c.lineCap='butt';
   for(let i=0;i<7;i++){
    const side=(i-3)*11,curve=side*(1-q*.2),phase=((e.time-s.gatherAt)*3+i/7)%1;
    const point=u=>({x:t.x+dx*u+nx*curve*(1-u)*(1+Math.sin(Math.PI*u)),y:t.y+dy*u+ny*curve*(1-u)*(1+Math.sin(Math.PI*u))});
    const start=.12+phase*.76,end=Math.min(1,start+.30),head=point(end);
    c.beginPath();for(let j=0;j<=8;j++){const u=start+(end-start)*j/8,v=point(u);j?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);}
    c.strokeStyle=i%2?'#e8b65b':'#fff4ce';c.globalAlpha=(.35+q*.6)*Math.sin(phase*Math.PI);c.lineWidth=(i===3?4:3.2)*(1-q*.35);c.stroke();
    const back=point(Math.max(start,end-.025));this.line(c,back.x,back.y,head.x,head.y,'#fff9e5',1.3);
   }c.restore();
  }
  c.save();c.fillStyle='#090e19';c.globalAlpha=.26;c.fillRect(0,0,G.Constants.width,G.Constants.height);c.globalAlpha=1;c.translate(p.x,p.y);c.rotate(a);
  for(const sign of [-1,1]){c.save();c.scale(sign,1);c.beginPath();c.moveTo(2,-36+q*15);c.bezierCurveTo(17-q*9,-22,19-q*15,22,2,36-q*15);c.bezierCurveTo(7,12,7,-12,2,-36+q*15);c.fillStyle='#9d5c26';c.fill();c.beginPath();c.moveTo(3,-29+q*13);c.quadraticCurveTo(12-q*8,0,3,29-q*13);c.strokeStyle='#fff0b3';c.lineWidth=2.2;c.stroke();
   for(let i=0;i<6;i++){const u=((q*1.8+i/6)%1),x=10+(1-u)*62,y=(i-2.5)*10*(1-u);c.globalAlpha=Math.sin(u*Math.PI)*.75;this.line(c,x,y,x+8*(1-u),y+(i-2.5)*2,'#e7b45b',1.5);}c.restore();}
  c.globalAlpha=.8;this.ellipse(c,0,0,2+q*2.5,10+q*9,'#fff8de',2+q*2);c.restore();
 },
 impact(c,v,age){const q=clamp(age/.48),a=Math.atan2(v.ny||0,v.nx||1);c.save();c.translate(v.x,v.y);c.rotate(a);if(v.final)c.scale(1.45,1.45);c.globalAlpha=(1-q)**1.2;
  // A wall-anchored fan, visibly perpendicular to the surface, not an explosion icon.
  c.beginPath();c.moveTo(0,-22*(1-q));c.quadraticCurveTo(12+q*30,-10,35+q*35,0);c.quadraticCurveTo(12+q*30,10,0,22*(1-q));c.quadraticCurveTo(9,0,0,-22*(1-q));c.fillStyle='#b96b26';c.fill();
  for(let i=-3;i<=3;i++){const y=i*8*(.8+q),x=12+q*(25+Math.abs(i)*6);this.line(c,3,y*.55,x,y,'#ffe3a0',i===0?3:1.6);}c.restore();
 },
 explosion(c,v,age){const q=clamp(age/.75),growth=1-Math.exp(-q*6);c.save();c.translate(v.x,v.y);c.rotate(v.angle);c.globalAlpha=(1-q)**1.1;
  // A broad expanding shell with an open launch corridor, not two crescent weapons.
  const rx=16+growth*119,ry=24+growth*132;
  for(let panel=0;panel<4;panel++){const start=.12+panel*Math.PI/2,end=start+Math.PI/2-.24,steps=12,thick=(1-q)*9+2;c.beginPath();for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps,ruffle=1+.025*Math.sin(a*11+panel),x=Math.cos(a)*rx*ruffle,y=Math.sin(a)*ry*ruffle;i?c.lineTo(x,y):c.moveTo(x,y);}for(let i=steps;i>=0;i--){const a=start+(end-start)*i/steps;c.lineTo(Math.cos(a)*(rx-thick),Math.sin(a)*(ry-thick));}c.closePath();c.fillStyle='#d49a43';c.fill();c.beginPath();for(let i=0;i<=steps;i++){const a=start+(end-start)*i/steps,x=Math.cos(a)*rx,y=Math.sin(a)*ry;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#fff2c7';c.lineWidth=1.2+2*(1-q);c.stroke();}
  if(q<.38){c.globalAlpha=(1-q/.38)*.9;c.beginPath();c.ellipse(0,0,6+growth*12,32+growth*60,0,0,TAU);c.fillStyle='#fff9df';c.fill();}
  c.globalAlpha=(1-q)*.8;for(let i=0;i<14;i++){const a=i*TAU/14+.13,d=27+growth*130,y=Math.sin(a)*d,x=Math.cos(a)*d*1.1,len=(1-q)*(10+i%3*8);this.line(c,x,y,x+Math.cos(a)*len,y+Math.sin(a)*len,i%3?'#efba59':'#fff3d2',i%3?1.6:2.5);}c.restore();
 },
 behind(r,e){const c=r.ctx;for(const b of e.balls){const s=O.state(b);if(!s)continue;c.save();if(s.active){for(const id of [b.id,b.arcana.target])this.stream(c,s.path.filter(p=>p.actor===id),e.time,s.phase);if(s.phase==='hold'||s.phase==='flight'&&s.decelerating){const t=e.balls.find(t=>t.id===b.arcana.target);if(t)this.compression(c,b,t,s,e);}}
  for(const v of s.events){const age=e.time-v.t;if(age<0)continue;if(v.kind==='wall'&&age<.48)this.impact(c,v,age);if(v.kind==='burst'&&age<.75)this.explosion(c,v,age);if(v.kind==='transfer'&&age<.3){c.save();c.globalAlpha=1-age/.3;const dx=v.x-v.fromX,dy=v.y-v.fromY,a=Math.atan2(dy,dx),len=Math.hypot(dx,dy);c.translate(v.fromX,v.fromY);c.rotate(a);c.beginPath();c.moveTo(-25,-14);c.lineTo(len+age*90,0);c.lineTo(-25,14);c.quadraticCurveTo(0,0,-25,-14);c.fillStyle='#efbc65';c.fill();this.line(c,-10,0,len+age*90,0,'#fff5d4',3);c.restore();}}
  c.restore();}
 }
};
const behind=G.ArcanaView.behind;G.ArcanaView.behind=function(r,e){behind.call(this,r,e);V.behind(r,e);};
const scene=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e){if(!e.balls.some(b=>O.controlled(b)))return scene.call(this,e);const view=Object.create(e);view.balls=e.balls.map(b=>O.controlled(b)?Object.assign(Object.create(b),{trail:[]}):b);return scene.call(this,view);};
const draw=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){const owner=O.controlled(b)&&O.owner(b,e),s=owner&&O.state(owner);if(!s)return draw.call(this,b,e);const c=this.ctx;
 c.save();if(s.phase==='flight'&&b!==owner||s.phase==='burst'){const a=Math.atan2(b.vy,b.vx),speed=clamp(Math.hypot(b.vx,b.vy)/900);c.translate(b.x,b.y);c.rotate(a);c.scale(1+.18*speed,1-.12*speed);c.rotate(-a);c.translate(-b.x,-b.y);}draw.call(this,b,e);c.restore();
};
})(typeof window!=='undefined'?window:globalThis);
