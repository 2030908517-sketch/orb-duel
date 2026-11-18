(function(root){
'use strict';const G=root.OrbDuel,H=G.BladeHunt,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
const V=G.BladeHuntView={
 // An asymmetric hooked weapon insignia, with an inset notch rather than a lunar disc.
 icon(c,x,y,size=12,angle=0){c.save();c.translate(x,y);c.rotate(angle-.3);c.scale(size,size);c.fillStyle='#101f2b';c.beginPath();c.moveTo(1.18,-.25);c.bezierCurveTo(.35,-1.14,-.94,-.81,-1.03,.78);c.bezierCurveTo(-.51,.16,-.26,-.04,.04,.08);c.lineTo(-.12,.43);c.quadraticCurveTo(.34,-.09,1.18,-.25);c.closePath();c.fill();c.beginPath();c.moveTo(.82,-.35);c.bezierCurveTo(.12,-.84,-.61,-.49,-.81,.25);c.strokeStyle='#294555';c.lineWidth=.10;c.stroke();c.restore();},
 blade(c,x,y,a,size,slot=0,alpha=1){
  // One metal silhouette is shared by Classic, Team and the Arcana presentation.

  const p=slot?{dark:'#365769',body:'#8eabbc',light:'#d2edf0',edge:'#f3ffff'}:{dark:'#164c62',body:'#329bb9',light:'#77e0ed',edge:'#e3fbff'};
  c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);c.globalAlpha=alpha;
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.55,-1.16,-.83,-.98,-1.14,.63);c.bezierCurveTo(-.51,.03,.12,-.25,.3,.44);c.quadraticCurveTo(.21,.02,1.22,-.2);c.closePath();c.fillStyle=p.dark;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.65,-.21,-.04,-.45,.7,-.35);c.closePath();c.fillStyle=p.body;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.78,-.48,.22,-.94,1.22,-.2);c.closePath();c.fillStyle=p.light;c.fill();
  c.beginPath();c.moveTo(1.12,-.25);c.bezierCurveTo(.61,-.87,-.17,-.88,-.69,-.27);c.strokeStyle=p.edge;c.lineWidth=.065;c.stroke();
  c.beginPath();c.moveTo(-.72,.30);c.quadraticCurveTo(-.35,-.51,.63,-.30);c.lineTo(.12,-.22);c.quadraticCurveTo(-.35,-.28,-.72,.30);c.fillStyle=p.dark;c.fill();c.beginPath();c.moveTo(-.65,.22);c.quadraticCurveTo(-.28,-.46,.44,-.34);c.strokeStyle=p.light;c.lineWidth=.025;c.stroke();
  c.beginPath();c.moveTo(.86,-.45);c.lineTo(1.14,-.24);c.lineTo(.65,-.30);c.closePath();c.fillStyle=p.edge;c.fill();c.restore();
 },
 ribbon(c,path,color,width,alpha=1){if(path.length<3)return;const sides=[[],[]];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1,u=i/(path.length-1),w=width*.5*Math.pow(1-u,.8),nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;sides[0].push({x:path[i].x+nx*w,y:path[i].y+ny*w});sides[1].push({x:path[i].x-nx*w*.65,y:path[i].y-ny*w*.65});}const outline=[...sides[0],...sides[1].reverse()];c.save();c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.moveTo(outline[0].x,outline[0].y);for(let i=1;i<outline.length;i++){const q=outline[i],n=outline[(i+1)%outline.length];c.quadraticCurveTo(q.x,q.y,(q.x+n.x)*.5,(q.y+n.y)*.5);}c.closePath();c.fill();c.restore();},
 crescent(c,x,y,a,rad,progress,width,slot=0,alpha=1){const path=[],tip=a-1.3+progress*2.7,length=2.7*Math.min(1,progress*2);for(let i=0;i<=36;i++){const u=i/36,ang=tip-length*u,r=rad*(1-.065*Math.sin(u*Math.PI));path.push({x:x+Math.cos(ang)*r,y:y+Math.sin(ang)*r});}this.ribbon(c,path,slot?'#203e53':'#123e52',width+3,alpha*.8);this.ribbon(c,path,slot?'#779eb5':'#3299b4',width,alpha);this.ribbon(c,path.slice(0,29),slot?'#cde4ec':'#a1eef1',width*.32,alpha);this.ribbon(c,path.slice(0,21),'#f0ffff',.85,alpha*.9);
  for(let j=0;j<2;j++){const peel=path.slice(6+j*6,24+j*5).map((q,i)=>{const k=(i+1)/22,dx=q.x-x,dy=q.y-y;return{x:q.x+dx/rad*k*(3+j*4),y:q.y+dy/rad*k*(3+j*4)};});this.ribbon(c,peel,slot?'#bbd7e5':'#8bdde6',1.2,alpha*.44);}
  if(progress<.94&&progress>.1)this.blade(c,path[0].x,path[0].y,tip+1.57,slot?6:7,slot,alpha);
 },
 flyer(r,p,e){if(!p.bladeHunt)return false;const c=r.ctx,age=e?.time??G.ArenaWalls?.current?.time??0,slot=p.bladeSlot||0,sling=p.bladeSling,history=p.history||[],path=[{x:p.x,y:p.y},...history.filter(v=>!v.at||age-v.at<(sling?.4:.25))];
  c.save();this.ribbon(c,path,slot?'#203e54':'#12394f',sling?13:7,.68);this.ribbon(c,path,slot?'#789eaf':'#399fbc',sling?8:4,.87);this.ribbon(c,path.slice(0,10),slot?'#e3f7fc':'#a9f6fa',sling?2.4:1.3,.95);if(path.length>6){const peel=path.slice(3,10).map((v,i)=>({x:v.x+Math.sin(age*2+slot)*i*.3,y:v.y-i*.35}));this.ribbon(c,peel,'#b8e9ed',.65,.4);}
  if(sling){this.ribbon(c,path.slice(0,12),'#edffff',1.25,.95);const a=Math.atan2(p.vy,p.vx),nx=-Math.sin(a),ny=Math.cos(a),speed=p.speed;for(const side of [-1,1])this.ribbon(c,[{x:p.x+nx*side*5,y:p.y+ny*side*5},{x:p.x-p.vx/speed*25+nx*side*6,y:p.y-p.vy/speed*25+ny*side*6},{x:p.x-p.vx/speed*105+nx*side*3,y:p.y-p.vy/speed*105+ny*side*3}],'#97dce9',.8,.4);}
  this.blade(c,p.x,p.y,age*(slot?-20:20)+Math.atan2(p.vy,p.vx),slot?7.5:9,slot);c.restore();return true;
 },
 cross(c,x,y,a,k,blocked=false){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=k;for(const direction of [-.67,.67]){c.save();c.rotate(direction);c.beginPath();c.moveTo(-27*k,0);c.quadraticCurveTo(-8,-3.5*k,26*k,0);c.quadraticCurveTo(6,2*k,-27*k,0);c.fillStyle=blocked?'#95b0c0':'#b0e7ed';c.fill();c.beginPath();c.moveTo(-20*k,0);c.lineTo(-2,-1.05*k);c.lineTo(27*k,0);c.lineTo(1,1.05*k);c.closePath();c.fillStyle=blocked?'#c1d1d7':'#f0ffff';c.fill();c.restore();}if(!blocked){c.globalAlpha*=.58;for(const side of [-1,1]){c.beginPath();c.moveTo(1,side*2);c.bezierCurveTo(9,side*9,16,side*6,22,side*14);c.strokeStyle='#76bfcf';c.lineWidth=.8;c.stroke();}}c.restore();},
 front(r,e){const c=r.ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const b of e.balls){if(b.type!=='boomerang'||b.hp<=0||G.World.absent(b,e))continue;const t=e.time,s=b.character.bladeHunt?.swing;
   if(b.character.catchUntil>t&&(!b.character.bladeRemaining||G.BladeDance?.active(b))){const count=b.character.catchPower>=1.4?2:1,a=Math.atan2(b.vy,b.vx);for(let i=0;i<count;i++){const ang=a+(i?1.1:-1.1),rad=b.radius+5;this.blade(c,b.x+Math.cos(ang)*rad,b.y+Math.sin(ang)*rad,ang+1.57,6,i,.85);}}
   if(!s)continue;const age=t-s.at,wind=s.wind??H.config.slashWind,cut=1-(1-clamp((age-wind)/(s.dance?.22:.15)))**3,fade=1-clamp((age-(s.dance?.27:.19))/(s.dance?.13:.11)),x=s.struck?s.x:b.x,y=s.struck?s.y:b.y;
   if(age<wind){for(let i=0;i<s.count;i++){if(s.dance){const q=1-(1-clamp(age/wind))**3,side=i?-1:1,desired=s.angle+(s.count===2?side*.55:0)-1.3,from=(s.handAngle??s.angle)+(i?1.1:-1.1),a=from+Math.atan2(Math.sin(desired-from),Math.cos(desired-from))*q,radius=b.radius+5+19*q,off=s.count===2?side*7*q:0;this.blade(c,x-Math.sin(s.angle)*off+Math.cos(a)*radius,y+Math.cos(s.angle)*off+Math.sin(a)*radius,a+1.57,8,i);}else{const a=s.angle-1.3+(i?2.6:0);this.blade(c,x+Math.cos(a)*(b.radius+5),y+Math.sin(a)*(b.radius+5),a+1.57,8,i);}}}
   else for(let i=0;i<s.count;i++){const side=i?-1:1,a=s.angle+(s.count===2?side*.55:0),off=s.count===2?side*7:0;this.crescent(c,x-Math.sin(s.angle)*off,y+Math.cos(s.angle)*off,a,b.radius+24,cut,s.dance?(s.count===2?14:12):(s.count===2?9:8),i,fade);}
  }
  for(const b of e.balls){const t=e.time;   if(b.bladeMark?.until>t){const q=clamp((b.bladeMark.until-t)/.3);c.save();c.translate(b.x,b.y);c.rotate(-.7);c.globalAlpha=q*.8;for(const k of [-1,1]){c.beginPath();c.moveTo(k*3,-7);c.quadraticCurveTo(k,0,k*3,7);c.strokeStyle='#b4e9ec';c.lineWidth=.9;c.stroke();}c.restore();}
}
  for(const f of e.effects){if(f.kind!=='bladeHunt')continue;const q=f.age/f.life,k=1-q;
   if(f.style==='release'){for(let i=0;i<(f.count||1);i++)this.crescent(c,f.x,f.y,f.angle+(i?Math.PI:0),25+q*6,clamp(q*2.2),3,i,k*.7);}
   if(f.style==='returnCatch'){this.ribbon(c,f.path||[],'#9eeaf0',3,k*.65);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=k;for(const side of [-1,1]){c.beginPath();c.moveTo(-6,side*2);c.quadraticCurveTo(-14-q*13,side*(5+q*8),-20-q*20,side*(4+q*12));c.strokeStyle='#d6f6ee';c.lineWidth=.8;c.stroke();}c.restore();}
   if(f.style==='cut'||f.style==='markCut'){this.cross(c,f.x,f.y,f.angle,k*(f.style==='markCut'?1:.7),f.blocked);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=k;for(let j=0;j<(f.style==='markCut'?6:3);j++){const sign=j%2?1:-1,x=q*(15+j*7),y=sign*(3+q*(5+j*4));c.beginPath();c.moveTo(x-5*k,y);c.lineTo(x+4*k,y+sign*2*k);c.lineTo(x-3*k,y+sign*1.4*k);c.closePath();c.fillStyle=f.blocked?'#889da7':j%2?'#b3dbe5':'#edffff';c.fill();}c.restore();}
   if(f.style==='cross')this.cross(c,f.x,f.y,f.angle,k);
   if(f.style==='slashHit'){if(f.count>=2)this.cross(c,f.x,f.y,f.angle,k, f.blocked);else{c.save();c.translate(f.x,f.y);c.rotate(f.angle+.6);c.globalAlpha=k;c.strokeStyle=f.blocked?'#9bb0ba':'#e0ffff';c.lineWidth=2*k+.3;c.beginPath();c.moveTo(-18*k,0);c.lineTo(18*k,0);c.stroke();c.restore();}}
   if(f.style==='slingHit'){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=k;c.fillStyle=f.blocked?'#9cb0c1':'#eaffff';c.beginPath();c.moveTo(-32*k,0);c.quadraticCurveTo(-3,-3.5,28*k,0);c.lineTo(-18*k,2*k);c.closePath();c.fill();c.restore();}
   if(f.style==='relay'){
    this.cross(c,f.x,f.y,f.angle,Math.pow(k,2));c.save();c.translate(f.x,f.y);c.rotate(f.angle);
    // A compact compression flash opens into two directional shear fronts.
    if(f.age<.07){c.globalAlpha=(1-f.age/.07)*.9;c.fillStyle='#eaffff';c.beginPath();c.moveTo(-6,0);c.quadraticCurveTo(-2,-5,12,0);c.quadraticCurveTo(-2,5,-6,0);c.fill();}
    const spread=1-Math.pow(1-clamp(f.age/.18),3),fade=1-clamp(f.age/.24);
    for(const side of [-1,1]){const path=[];for(let i=0;i<=16;i++){const u=i/16;path.push({x:18*spread-36*u,y:side*(3+14*spread*u+6*spread*u*u)});}this.ribbon(c,path,'#7bd7e6',3,fade*.8);this.ribbon(c,path.slice(0,13),'#e3ffff',.9,fade);}
    c.globalAlpha=k;c.fillStyle='#e9f7da';for(let i=0;i<8;i++){const a=(i%2?1:-1)*(.4+Math.floor(i/2)*.4),d=5+q*(22+i*3),len=(5+i%3*2)*k;c.save();c.translate(Math.cos(a)*d,Math.sin(a)*d);c.rotate(a);c.beginPath();c.moveTo(-len,0);c.lineTo(len,0);c.lineTo(-len*.5,1.1*k);c.closePath();c.fill();c.restore();}c.restore();
   }
   if(f.style==='catch')for(let i=0;i<f.count;i++)this.crescent(c,f.x,f.y,f.angle+i*Math.PI,25,clamp(q*2),2,i,k*.55);
  }c.restore();
 }
};
const removed=G.Characters.bladeRemoved;G.Characters.bladeRemoved=function(p,b,e,caught){const show=caught&&b&&p.bladeHunt&&!p.bladeDisposed;const result=removed.call(this,p,b,e,caught);if(show)H.cue(e,b,'returnCatch',b,{angle:Math.atan2(p.vy,p.vx),path:[{x:b.x,y:b.y},...(p.history||[]).slice(0,9)],life:.24});return result;};
const emit=G.Spectacle.emit;G.Spectacle.emit=function(e,b,style,...args){if(b.type==='boomerang'&&style==='moon')return;return emit.call(this,e,b,style,...args);};
const flyer=G.TacticsView.flyer;G.TacticsView.flyer=function(r,p,e){return V.flyer(r,p,e)||flyer.call(this,r,p,e);};
const effects=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){effects.call(this,e);V.front(this,e);};
})(typeof window!=='undefined'?window:globalThis);
