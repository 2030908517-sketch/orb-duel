(function(root){
'use strict';const G=root.OrbDuel,H=G.BladeHunt,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
const V=G.BladeHuntView={
 // An asymmetric hooked weapon insignia, with an inset notch rather than a lunar disc.
 icon(c,x,y,size=12,angle=0){c.save();c.translate(x,y);c.rotate(angle-.3);c.scale(size,size);c.fillStyle='#101f2b';c.beginPath();c.moveTo(1.18,-.25);c.bezierCurveTo(.35,-1.14,-.94,-.81,-1.03,.78);c.bezierCurveTo(-.51,.16,-.26,-.04,.04,.08);c.lineTo(-.12,.43);c.quadraticCurveTo(.34,-.09,1.18,-.25);c.closePath();c.fill();c.beginPath();c.moveTo(.82,-.35);c.bezierCurveTo(.12,-.84,-.61,-.49,-.81,.25);c.strokeStyle='#294555';c.lineWidth=.10;c.stroke();c.restore();},
 blade(c,x,y,a,size,slot=0,alpha=1){
  // Reuse the accepted Arcana metal blade in that mode; same silhouette below in Classic/Team.
  if(G.BladeDanceView)return G.BladeDanceView.blade(c,x,y,a,size,slot,alpha);
  const p=slot?{dark:'#365769',body:'#8eabbc',light:'#d2edf0',edge:'#f3ffff'}:{dark:'#164c62',body:'#329bb9',light:'#77e0ed',edge:'#e3fbff'};
  c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);c.globalAlpha=alpha;
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.55,-1.16,-.83,-.98,-1.14,.63);c.bezierCurveTo(-.51,.03,.12,-.25,.3,.44);c.quadraticCurveTo(.21,.02,1.22,-.2);c.closePath();c.fillStyle=p.dark;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.65,-.21,-.04,-.45,.7,-.35);c.closePath();c.fillStyle=p.body;c.fill();
  c.beginPath();c.moveTo(1.22,-.2);c.bezierCurveTo(.48,-1.13,-.77,-.81,-1.14,.63);c.bezierCurveTo(-.78,-.48,.22,-.94,1.22,-.2);c.closePath();c.fillStyle=p.light;c.fill();
  c.beginPath();c.moveTo(1.12,-.25);c.bezierCurveTo(.61,-.87,-.17,-.88,-.69,-.27);c.strokeStyle=p.edge;c.lineWidth=.065;c.stroke();c.restore();
 },
 ribbon(c,path,color,width,alpha=1){if(path.length<3)return;const left=[],right=[];for(let i=0;i<path.length;i++){const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1,w=width*.5*Math.pow(1-i/path.length,.9),nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;left.push({x:path[i].x+nx*w,y:path[i].y+ny*w});right.push({x:path[i].x-nx*w*.6,y:path[i].y-ny*w*.6});}c.save();c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.moveTo(left[0].x,left[0].y);for(const p of left.slice(1))c.lineTo(p.x,p.y);for(const p of right.reverse())c.lineTo(p.x,p.y);c.closePath();c.fill();c.restore();},
 crescent(c,x,y,a,rad,progress,width,slot=0,alpha=1){const path=[],tip=a-1.3+progress*2.7,length=2.7*Math.min(1,progress*2);for(let i=0;i<=32;i++){const u=i/32,ang=tip-length*u;path.push({x:x+Math.cos(ang)*rad,y:y+Math.sin(ang)*rad});}this.ribbon(c,path,slot?'#698eab':'#287e9b',width+2,alpha*.75);this.ribbon(c,path,slot?'#cbe3ec':'#7edce9',width,alpha);this.ribbon(c,path.slice(0,23),'#efffff',1,alpha*.85);},
 flyer(r,p,e){if(!p.bladeHunt)return false;const c=r.ctx,age=e?.time??G.ArenaWalls?.current?.time??0,slot=p.bladeSlot||0,sling=p.bladeSling,history=p.history||[],path=[{x:p.x,y:p.y},...history.filter(v=>!v.at||age-v.at<(sling?.4:.25))];
  c.save();this.ribbon(c,path,slot?'#45617a':'#1b6986',sling?11:5,.72);this.ribbon(c,path,slot?'#d3e9ee':'#70d6e6',sling?4:1.7,.9);
  if(sling){this.ribbon(c,path.slice(0,12),'#edffff',1.25,.95);const a=Math.atan2(p.vy,p.vx),nx=-Math.sin(a),ny=Math.cos(a),speed=p.speed;for(const side of [-1,1])this.ribbon(c,[{x:p.x+nx*side*5,y:p.y+ny*side*5},{x:p.x-p.vx/speed*25+nx*side*6,y:p.y-p.vy/speed*25+ny*side*6},{x:p.x-p.vx/speed*105+nx*side*3,y:p.y-p.vy/speed*105+ny*side*3}],'#97dce9',.8,.4);}
  this.blade(c,p.x,p.y,age*(slot?-20:20)+Math.atan2(p.vy,p.vx),slot?7.5:9,slot);c.restore();return true;
 },
 cross(c,x,y,a,k,blocked=false){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=k;c.fillStyle=blocked?'#95b0c0':'#e2fcff';for(const direction of [-.67,.67]){c.save();c.rotate(direction);c.beginPath();c.moveTo(-25*k,0);c.lineTo(-3,-2.1*k);c.lineTo(25*k,0);c.lineTo(2,2.1*k);c.closePath();c.fill();c.restore();}c.restore();},
 front(r,e){const c=r.ctx;c.save();c.lineCap='round';c.lineJoin='round';
  for(const b of e.balls){if(b.type!=='boomerang'||b.hp<=0||G.World.absent(b,e))continue;const t=e.time,s=b.character.bladeHunt?.swing;
   if(b.character.catchUntil>t&&(!b.character.bladeRemaining||G.BladeDance?.active(b))){const count=b.character.catchPower>=1.4?2:1,a=Math.atan2(b.vy,b.vx);for(let i=0;i<count;i++){const ang=a+(i?1.1:-1.1),rad=b.radius+5;this.blade(c,b.x+Math.cos(ang)*rad,b.y+Math.sin(ang)*rad,ang+1.57,6,i,.85);}}
   if(!s)continue;const age=t-s.at,cut=clamp((age-H.config.slashWind)/.15),fade=1-clamp((age-.19)/.11),x=s.struck?s.x:b.x,y=s.struck?s.y:b.y;
   if(age<H.config.slashWind){for(let i=0;i<s.count;i++){const a=s.angle-1.3+(i?2.6:0);this.blade(c,x+Math.cos(a)*(b.radius+5),y+Math.sin(a)*(b.radius+5),a+1.57,8,i);}}
   else for(let i=0;i<s.count;i++){const side=i?-1:1,a=s.angle+(s.count===2?side*.55:0),off=s.count===2?side*7:0;this.crescent(c,x-Math.sin(s.angle)*off,y+Math.cos(s.angle)*off,a,b.radius+20,cut,s.count===2?7:6,i,fade);}
  }
  for(const f of e.effects){if(f.kind!=='bladeHunt')continue;const q=f.age/f.life,k=1-q;
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
const flyer=G.TacticsView.flyer;G.TacticsView.flyer=function(r,p,e){return V.flyer(r,p,e)||flyer.call(this,r,p,e);};
const effects=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){effects.call(this,e);V.front(this,e);};
})(typeof window!=='undefined'?window:globalThis);
