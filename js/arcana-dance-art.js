(function(root){
'use strict';
const G=root.OrbDuel,D=G.BladeDance,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>1-Math.pow(1-clamp(v),3);
// All clocks and geometry are read from the simulation. No particles or drawing RNG.
const V=G.BladeDanceView={
 palette:[{dark:'#164c62',body:'#329bb9',light:'#77e0ed',edge:'#e3fbff'},{dark:'#365769',body:'#8eabbc',light:'#d2edf0',edge:'#f3ffff'}],
 ribbon(c,path,color,width,alpha=1){
  if(path.length<3)return;const sides=[[],[]];
  for(let i=0;i<path.length;i++){
   const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1,u=i/(path.length-1),w=width*.5*Math.pow(1-u,.8),nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
   sides[0].push({x:path[i].x+nx*w,y:path[i].y+ny*w});sides[1].push({x:path[i].x-nx*w*.55,y:path[i].y-ny*w*.55});
  }
  c.save();c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.moveTo(sides[0][0].x,sides[0][0].y);
  for(const p of sides[0].slice(1))c.lineTo(p.x,p.y);for(const p of sides[1].reverse())c.lineTo(p.x,p.y);c.closePath();c.fill();c.restore();
 },
 // A pointed, asymmetric metal blade: bevel on its leading edge, dark inner face.
 blade(c,x,y,a,size,slot=0,alpha=1){
  const p=this.palette[slot?1:0];c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);c.globalAlpha=alpha;
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.55,-1.16,-.83,-.98,-1.14,.63);c.bezierCurveTo(-.51,.03,.12,-.25,.3,.44);c.quadraticCurveTo(.21,.02,1.22,-.2);c.closePath();c.fillStyle=p.dark;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.65,-.21,-.04,-.45,.7,-.35);c.closePath();c.fillStyle=p.body;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.78,-.48,.22,-.94,1.22,-.2);c.closePath();c.fillStyle=p.light;c.fill();
  c.beginPath();c.moveTo(1.12,-.25);c.bezierCurveTo(.61,-.87,-.17,-.88,-.69,-.27);c.strokeStyle=p.edge;c.lineWidth=.065;c.lineCap='round';c.stroke();c.restore();
 },
 // Formed by a moving tip. The narrow tail disappears first; never scale a finished ring.
 sweep(c,x,y,rad,start,length,width,color,alpha=1){
  if(length<=.001)return;const path=[];for(let i=0;i<=36;i++){const u=i/36,a=start-length*u;path.push({x:x+Math.cos(a)*rad,y:y+Math.sin(a)*rad});}
  this.ribbon(c,path,color,width,alpha);
 },
 path(p,e){const life=p.returning?.28:.22;return[{x:p.x,y:p.y},...p.history.filter(v=>e.time-v.at<life)];},
 pose(b,e){const s=D.state(b);if(!s?.active)return 0;const catchEvent=s.events.findLast(v=>v.type==='catch'),a=catchEvent?e.time-catchEvent.at:99;
  if(a<.26)return Math.atan2(b.vy,b.vx)*.18+(catchEvent.side||1)*ease(a/.26)*TAU;
  if(b.arcana.phase==='danceWind')return -s.side*ease((e.time-s.started)/D.config.wind)*.85;
  return Math.atan2(b.vy,b.vx)*.18;
 },
 behind(r,e){const c=r.ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const b of e.balls){const s=D.state(b);if(!s?.active)continue;
   // A continuous tapered wake plus two outlined echoes carrying the orb's own glyph.
   this.ribbon(c,[b,...s.path.filter(v=>e.time-v.at<.2)],'#3c92ac',b.radius*.65,.12);
   if(!r.reducedMotion)for(const [i,delay]of [.10,.20].entries()){
    const p=s.path.find(v=>e.time-v.at>=delay);if(!p)continue;const next=s.path[Math.max(0,s.path.indexOf(p)-1)]||b,a=Math.atan2(next.y-p.y,next.x-p.x);
    if(Math.hypot(b.x-p.x,b.y-p.y)<b.radius)continue;
    c.save();c.translate(p.x,p.y);c.globalAlpha=.18-i*.065;c.strokeStyle='#8adbe8';c.lineWidth=1.1;c.beginPath();c.arc(0,0,b.radius*.88,a+1.7,a+4.5);c.stroke();
    c.rotate(a*.18);this.blade(c,0,0,0,9,0,.18-i*.065);c.restore();
   }
   for(const v of s.events){const age=e.time-v.at;if(v.type!=='catch'||!v.path||age<0||age>.23)continue;const colors=this.palette[v.slot?1:0],alpha=1-age/.23;
    this.ribbon(c,v.path,colors.body,(v.slot?5:8)*alpha,alpha*.72);this.ribbon(c,v.path.slice(0,10),colors.light,1,alpha*.8);
   }
   for(const p of D.blades(b,e)){
    const path=this.path(p,e),colors=this.palette[p.danceSlot?1:0],intense=s.round>=3?1.2:1,w=(p.danceRole==='attack'?8:5)*(p.returning?1.18:1)*intense;
    this.ribbon(c,path,colors.dark,w+3,.52);this.ribbon(c,path,colors.body,w,.82);this.ribbon(c,path.slice(0,Math.min(path.length,17)),colors.light,w*.33,.9);
    // One thin wake offset along the path normal, not an additional full trajectory.
    if(path.length>5){const side=p.danceSlot?-1:1,edge=path.slice(3,13).map((q,i)=>{const n=path[Math.min(i+5,path.length-1)],d=Math.hypot(q.x-n.x,q.y-n.y)||1;return{x:q.x-(q.y-n.y)/d*side*4,y:q.y+(q.x-n.x)/d*side*4};});this.ribbon(c,edge,colors.light,.8,.4);}
    const pull=s.events.findLast(v=>v.type==='pull'&&v.slot===p.danceSlot),age=pull?e.time-pull.at:99;
    if(p.returning&&age<.18){const mid={x:s.meet.x,y:s.meet.y},path=[];for(let i=0;i<=16;i++){const u=i/16,v=1-u;path.push({x:v*v*p.x+2*v*u*mid.x+u*u*b.x,y:v*v*p.y+2*v*u*mid.y+u*u*b.y});}this.ribbon(c,path,colors.light,1.2,(1-age/.18)*.43);}
   }
  }c.restore();
 },
 catch(c,b,v,t){const k=1-clamp(t/.3),progress=ease(t/.18),a=(v.incoming??v.angle)+(v.side||1)*progress*2.7,rad=b.radius+7+progress*7,color=this.palette[v.slot?1:0];
  this.sweep(c,v.x,v.y,rad,a,Math.min(2.6,.18+progress*3),v.slot?3:5,color.body,k*.8);this.sweep(c,v.x,v.y,rad+1,a,Math.min(2.1,.12+progress*2.5),1,color.edge,k);
  if(t<.09){c.save();c.translate(v.x,v.y);c.rotate(v.angle+.7);c.globalAlpha=1-t/.09;c.fillStyle=color.edge;for(const a of [0,Math.PI/2]){c.save();c.rotate(a);c.beginPath();c.moveTo(-13,0);c.lineTo(-1,-1.5);c.lineTo(13,0);c.lineTo(1,1.5);c.closePath();c.fill();c.restore();}c.restore();}
 },
 finale(c,b,v,t){const q=clamp(t/.62),form=ease(t/.19),alpha=1-clamp((t-.18)/.44),radius=Math.max(b.radius+2,Math.min(b.radius+16,v.x-2,G.Constants.width-v.x-2,v.y-2,G.Constants.height-v.y-2));
  for(let i=0;i<2;i++){const start=v.angle+i*Math.PI+form*Math.PI,colors=this.palette[i];
   this.sweep(c,v.x,v.y,radius,start,Math.PI*form,5.5,colors.body,alpha*.9);this.sweep(c,v.x,v.y,radius+1,start,Math.PI*form,1.1,colors.edge,alpha);
   if(t<.19)this.blade(c,v.x+Math.cos(start)*radius,v.y+Math.sin(start)*radius,start+Math.PI/2,8,i,alpha);
   if(t>.19)for(let j=0;j<3;j++){const a=start-j*.52,slide=(t-.19)*(24+j*10),x=v.x+Math.cos(a)*radius-Math.sin(a)*slide,y=v.y+Math.sin(a)*radius+Math.cos(a)*slide;c.save();c.translate(x,y);c.rotate(a+Math.PI/2);c.globalAlpha=alpha*(.7-j*.13);c.fillStyle=colors.light;c.beginPath();c.moveTo(-7*(1-q),-.6);c.lineTo(6*(1-q),0);c.lineTo(-4*(1-q),1);c.closePath();c.fill();c.restore();}
  }
 },
 front(r,e){const c=r.ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const b of e.balls){const s=D.state(b);if(!s)continue;
   if(s.active&&b.arcana.phase==='danceWind'){
    const k=clamp((e.time-s.started)/D.config.wind),a=s.heading-1.3+ease(k)*2.7,rad=b.radius+8;
    for(let i=0;i<2;i++){const ang=a+i*Math.PI;this.sweep(c,b.x,b.y,rad,ang,k*1.7,3,this.palette[i].body,k*.65);this.blade(c,b.x+Math.cos(ang)*rad,b.y+Math.sin(ang)*rad,ang+Math.PI/2,9*ease(k),i);}
   }
   for(const p of D.blades(b,e)){
    const slot=p.danceSlot?1:0,spin=(e.time-s.started)*(slot?-20:20)+Math.atan2(p.vy,p.vx),colors=this.palette[slot];
    this.sweep(c,p.x,p.y,11,spin+.4,1.6,2.8,colors.body,.55);this.blade(c,p.x,p.y,spin,slot?9:11,slot);
   }
   for(const v of s.events){const t=e.time-v.at;if(t<0||t>.64)continue;
    if(v.type==='catch'&&t<.3)this.catch(c,b,v,t);
    if(v.type==='finale')this.finale(c,b,v,t);
    if(v.type==='release'&&t<.16){const k=1-t/.16;this.sweep(c,v.x,v.y,b.radius+8,v.angle+s.side*ease(t/.16)*2.4,1.7,4,'#78dce9',k*.65);}
    if(v.type==='cut'&&t<.25){const k=1-t/.25;c.save();c.translate(v.x,v.y);c.rotate(v.angle);c.globalAlpha=k;c.fillStyle=v.blocked?'#91abb6':'#e0fbff';c.beginPath();c.moveTo(-26*k,-1);c.quadraticCurveTo(-2,-4,26*k,1);c.lineTo(-12*k,1.5);c.closePath();c.fill();if(!v.blocked)for(const side of [-1,1]){c.beginPath();c.moveTo(side*(7+12*(1-k)),-4);c.lineTo(side*(13+14*(1-k)),-7*k);c.strokeStyle='#80cfe1';c.lineWidth=1;c.stroke();}c.restore();}
   }
  }c.restore();
 }
};
// Dedicated dance presentation replaces older overlays, never their combat rewards.
const emit=G.Spectacle.emit,hit=G.Spectacle.hit,effect=G.Characters.effect,flyer=G.TacticsView.flyer;
G.Spectacle.emit=function(e,b,style,...args){if(D.active(b)&&style==='moon')return;return emit.call(this,e,b,style,...args);};
G.Spectacle.hit=function(e,h){if(h.dance)return;return hit.call(this,e,h);};
G.Characters.effect=function(e,b,t,style,...args){if(D.active(b)&&style==='bladeCatch')return;return effect.call(this,e,b,t,style,...args);};
G.TacticsView.flyer=function(r,p){return p.danceOwner!==undefined||flyer.call(this,r,p);};
const world=G.Renderer.prototype.drawWorld;G.Renderer.prototype.drawWorld=function(e){world.call(this,e);V.behind(this,e);};
const signals=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){signals.call(this,e);V.front(this,e);};
})(typeof window!=='undefined'?window:globalThis);
