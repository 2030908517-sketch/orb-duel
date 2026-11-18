(function(root){
 'use strict';const G=root.OrbDuel,S=G.HolySeals,C=G.Constants,TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);},mix=(a,b,t)=>a+(b-a)*t;
 const V=G.HolySealView={
  path(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}},
  cross(c,x,y,r,thick=2){c.beginPath();c.moveTo(x,y-r);c.lineTo(x,y+r);c.moveTo(x-r*.65,y-r*.28);c.lineTo(x+r*.65,y-r*.28);c.lineWidth=thick;c.stroke();},
  runes(c,r,time,count=16){c.save();c.rotate(time);for(let i=0;i<count;i++){c.save();c.rotate(i*TAU/count);c.translate(0,-r);c.strokeStyle=i%3?'#e4c77e':'#fff7d7';c.lineWidth=.75;c.beginPath();c.moveTo(-2,3);c.lineTo(-2,-3);c.lineTo(2,-1);c.lineTo(-1,1);if(i%2)c.lineTo(3,3);c.stroke();c.restore();}c.restore();},
  sigil(c,x,y,r,time,n,alpha=1){c.save();c.translate(x,y);c.globalAlpha*=alpha;c.strokeStyle='#d7b56b';c.lineWidth=1.1;for(const k of [1,.83]){c.beginPath();c.arc(0,0,r*k,0,TAU);c.stroke();}this.runes(c,r*.92,time,12+n*2);
   c.save();c.rotate(-time*.55);for(let j=0;j<4;j++){const z=j*TAU/4+n*.11;c.strokeStyle=j%2?'#e9cb85':'#fff4c5';c.lineWidth=.75;c.beginPath();c.arc(0,0,r*1.12,z+.06,z+.40);c.stroke();this.path(c,[[Math.cos(z)*r*1.14,Math.sin(z)*r*1.14],[Math.cos(z+.045)*r*1.20,Math.sin(z+.045)*r*1.20],[Math.cos(z-.045)*r*1.20,Math.sin(z-.045)*r*1.20]],'#f1dc9b');}c.restore();if(n===1){c.scale(1,.38);c.lineWidth=3;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
   else if(n===2){for(let i=0;i<3;i++){c.save();c.rotate(time*.4+i*TAU/3);c.translate(0,-r*.45);if(i===0)this.path(c,[[-7,-5],[7,-5],[5,4],[0,9],[-5,4]],null,'#fff1bb');else if(i===1)this.cross(c,0,0,7,2);else{c.beginPath();c.moveTo(-7,7);c.lineTo(0,-7);c.lineTo(7,7);c.stroke();}c.restore();}}
   else if(n===3||n===6){this.cross(c,0,0,r*.74,n===6?6:3);for(const side of [-1,1])for(let j=0;j<3;j++){c.save();c.translate(side*r*(.26+j*.2),-r*.17);c.rotate(side*.6);c.strokeRect(-4,-2.5,8,5);c.restore();}}
   else if(n===4){for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4+time*.2);c.beginPath();c.arc(0,0,r*.65,.12,.9);c.lineTo(r*.6,r*.13);c.stroke();c.restore();}this.cross(c,0,0,r*.25,1.5);}
   else if(n===5){for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);this.path(c,[[0,-r*.72],[-3,-r*.40],[0,-r*.22],[3,-r*.40]],'#f7e5af');c.restore();}}
   else{this.cross(c,0,0,r*.6,3);for(let i=0;i<7;i++){const a=i*TAU/7;this.path(c,[[Math.cos(a)*r*.7,Math.sin(a)*r*.7],[Math.cos(a+.08)*r*.83,Math.sin(a+.08)*r*.83],[Math.cos(a-.08)*r*.83,Math.sin(a-.08)*r*.83]],'#fff6d1');}}
   c.restore();
  },
  smallSeal(c,x,y,n,alpha){c.save();c.translate(x,y);c.globalAlpha*=alpha;
   const glow=c.createRadialGradient(0,0,0,0,0,12);glow.addColorStop(0,'#fff5d044');glow.addColorStop(1,'#f6d47900');c.fillStyle=glow;c.beginPath();c.arc(0,0,12,0,TAU);c.fill();
   c.strokeStyle='#fff2c2';c.lineWidth=1.1;c.beginPath();c.arc(0,0,7,0,TAU);c.stroke();c.strokeStyle='#d7b76c';c.lineWidth=.7;c.beginPath();c.arc(0,0,5.2,-2.3,.55);c.stroke();
   c.strokeStyle='#fff9dc';this.cross(c,0,.5,3.4,1);for(let i=0;i<n%4;i++){c.fillStyle='#ffedb9';c.fillRect(-3+i*2,5,1,1.5);}c.restore();},
  sword(c,x,y,a,alpha=1){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;c.lineWidth=1;
   // Continuous solid blade with a dark bevel and broad cross guard; no separate floating blade.
   this.path(c,[[0,-122],[-11,-97],[-9,50],[-6,59],[6,59],[9,50],[11,-97]],'#fff6d3','#caa95e');
   this.path(c,[[0,-122],[0,55],[6,59],[9,50],[11,-97]],'#c4d6dc');
   this.path(c,[[0,-122],[-4,-88],[-3,45],[0,54]],'#ffffff');
   const shine=c.createLinearGradient(-10,0,10,0);shine.addColorStop(0,'#d5e5e900');shine.addColorStop(.46,'#ffffffbb');shine.addColorStop(.55,'#fffdf2');shine.addColorStop(1,'#b2d0d700');
   this.path(c,[[-7,-91],[0,-117],[8,-91],[6,42],[0,50],[-6,42]],shine);
   c.strokeStyle='#e4d5aa';c.lineWidth=.6;c.beginPath();c.moveTo(-6,-76);c.lineTo(-5,33);c.moveTo(6,-76);c.lineTo(5,33);c.stroke();
   this.path(c,[[-7,49],[-32,43],[-39,51],[-35,58],[-9,56],[-5,61],[5,61],[9,56],[35,58],[39,51],[32,43],[7,49]],'#d4af5b','#fff1b6');
   this.path(c,[[-29,48],[-12,51],[-8,55],[-31,54]],'#fff2bc');this.path(c,[[29,48],[12,51],[8,55],[31,54]],'#fff2bc');
   this.path(c,[[0,44],[-6,50],[0,57],[6,50]],'#efcf77','#fff9db');this.path(c,[[0,46],[-2,50],[0,54],[2,50]],'#fffdf2');
   this.path(c,[[-4,59],[-4,86],[4,86],[4,59]],'#8c713f','#edda9d');for(let i=0;i<4;i++){c.strokeStyle='#ecce82';c.beginPath();c.moveTo(-4,64+i*5);c.lineTo(4,67+i*5);c.stroke();}
   this.path(c,[[0,83],[-8,90],[0,99],[8,90]],'#edce81','#fff4bf');c.strokeStyle='#b7984d';this.cross(c,0,25,12,1.4);c.restore();
  },
  // Opaque forged faces share their seams; the raised ridge, recessed fuller
  // and cutting bevel turn with the same off-screen weapon, never separate slabs.
  colossal(c,p,fade){c.save();const depth=p.penetration||0,ux=-Math.sin(p.angle),uy=Math.cos(p.angle);c.translate(p.x-ux*depth,p.y-uy*depth);c.rotate(p.angle);c.scale(p.edgeScale,1);c.globalAlpha*=p.alpha*fade;
   // The point continues below the floor. Clip at the shaft/floor intersection,
   // never paint an intact point skating along the glowing ground line.
   if(depth>0){const y=-480+depth;c.beginPath();for(let x=-500,n=0;x<=500;x+=10,n++){const z=y+x*.18+Math.sin(x*.17)*3+Math.cos(x*.31)*1.8;if(n)c.lineTo(x,z);else c.moveTo(x,z);}c.lineTo(500,1800);c.lineTo(-500,1800);c.closePath();c.clip();}
   const tip=-480,L=1600,width=y=>y< -260?(y-tip)/220*76:76+(y+260)*.035;
   const outline=[[0,tip],[35,-390],[76,-260],[141,L],[-141,L],[-76,-260],[-35,-390]];
   this.path(c,outline,'#71858a');c.save();c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
   const left=c.createLinearGradient(-110,0,30,0);left.addColorStop(0,'#8b998d');left.addColorStop(.28,'#c0ccbf');left.addColorStop(.73,'#e5e8d4');left.addColorStop(1,'#fff8d4');
   this.path(c,[[0,tip],[-76,-260],[-141,L],[2,L],[-7,-220]],left);
   const right=c.createLinearGradient(-8,0,140,0);right.addColorStop(0,'#f4ecc9');right.addColorStop(.09,'#a7b5ac');right.addColorStop(.42,'#6b858c');right.addColorStop(.85,'#3e5967');right.addColorStop(1,'#a1a995');
   this.path(c,[[0,tip],[-7,-220],[2,L],[141,L],[76,-260],[35,-390]],right);
   // A physically connected grind narrows continuously to a single credible tip.
   this.path(c,[[0,tip],[-35,-390],[-76,-260],[-141,L],[-119,L],[-57,-255],[-25,-386]],'#dccb91');
   this.path(c,[[0,tip],[35,-390],[76,-260],[141,L],[127,L],[63,-257],[28,-386]],'#bda466');
   this.path(c,[[0,tip],[-5,-244],[-1,L],[5,L],[0,-240]],'#fff5cf');
   const glint=c.createLinearGradient(0,-460,0,500);glint.addColorStop(0,'#ffffed00');glint.addColorStop(.35,'#ffffe6a0');glint.addColorStop(.48,'#ffffef00');glint.addColorStop(.8,'#dcefff00');glint.addColorStop(1,'#e9ffff55');c.fillStyle=glint;c.fillRect(-150,-480,300,2080);
   // Recessed inscription band has dark walls and a thin warm reflected lip.
   this.path(c,[[10,-290],[18,-245],[37,L],[17,L],[4,-246]],'#47616a');
   c.strokeStyle='#c5c6a0';c.lineWidth=1.3;c.beginPath();c.moveTo(9,-288);c.lineTo(16,-245);c.lineTo(35,L);c.stroke();
   for(let y=-222,n=0;y<1100;y+=73,n++){const x=16+(y+240)*.01;c.save();c.translate(x,y);c.strokeStyle=n%3?'#b4b994':'#e2cf91';c.lineWidth=1.1;c.beginPath();c.moveTo(-4,-13);c.lineTo(4,-7);c.lineTo(-3,0);c.lineTo(5,8);c.moveTo(-4,0);c.lineTo(4,0);c.stroke();c.restore();}
   // Long, restrained machining marks follow the forged surface, not screen space.
   for(let j=0;j<14;j++){const side=j%2?-1:1,y=-260+j*58,x=side*width(y)*(.27+(j%3)*.14);c.strokeStyle=j%3?'#eff5dc27':'#233e4938';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+side*1.7,y+28+j%4*12);c.stroke();}
   c.restore();c.strokeStyle='#fff5ce';c.lineWidth=1.7;c.beginPath();c.moveTo(0,tip);c.lineTo(-35,-390);c.lineTo(-76,-260);c.lineTo(-141,L);c.stroke();c.strokeStyle='#8a713e';c.lineWidth=1;c.beginPath();c.moveTo(0,tip);c.lineTo(35,-390);c.lineTo(76,-260);c.lineTo(141,L);c.stroke();c.restore();
  },
  sweep(s,e,cut,at=e.time-s.started){const c=s.center;if(!c)return null;const horizontal=cut===1,started=horizontal?6.90:6.06,hit=horizontal?7.36:6.72,ended=horizontal?8.08:7.12,a=at;
   if(a<started||a>=ended)return null;
   // A continuous Hermite arc keeps the original contact time while giving
   // the approach and follow-through more time. No added combat freeze.
   const t=a<hit?(a-started)/(hit-started):(a-hit)/(ended-hit),duration=a<hit?hit-started:ended-hit,from=a<hit?-.26:0,to=a<hit?0:.28,m0=a<hit?0:.72,m1=a<hit?.72:0,t2=t*t,t3=t2*t,theta=(2*t3-3*t2+1)*from+(t3-2*t2+t)*duration*m0+(-2*t3+3*t2)*to+(t3-t2)*duration*m1;
   const pivot=horizontal?{x:-900,y:c.y-1000}:{x:c.x-520,y:-900},v={x:c.x-pivot.x,y:c.y-pivot.y},tangent=horizontal?{x:1250,y:0}:{x:0,y:1250},tx=pivot.x+v.x*Math.cos(theta)+tangent.x*Math.sin(theta),ty=pivot.y+v.y*Math.cos(theta)+tangent.y*Math.sin(theta),dx=pivot.x-tx,dy=pivot.y-ty,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,penetration=170*smooth((a-started)/.18)*(1-smooth((a-(ended-.10))/.10)),angle=Math.atan2(-ux,uy),edgeScale=.79+.15*Math.cos(theta*3),cutHalfWidth=(penetration<220?penetration/220*76:76+(penetration-220)*.035)*edgeScale;
   return{penetration,cutHalfWidth,groundX:tx,groundY:ty,x:tx+ux*480,y:ty+uy*480,angle,edgeScale,alpha:smooth((a-started)/.08)*clamp((ended-a)/.08),cut,tipX:tx,tipY:ty,pivotX:pivot.x,pivotY:pivot.y,theta};
  },
  pose(s,e,at=e.time-s.started){if(at<7.12)return this.sweep(s,e,0,at);return this.sweep(s,e,1,at);},
  groundContact(c,p,fade,front=false){const q=clamp((p.penetration||0)/170);if(q<=0)return;const r=Math.max(12,p.cutHalfWidth||0);
   // The torn floor follows the ground lane, not the sword's orientation.
   // A ring rigidly rotating with the weapon would read as a metal collar.
   c.save();c.translate(p.groundX,p.groundY);c.rotate(p.cut===0?Math.PI/2:0);c.globalAlpha*=p.alpha*fade*smooth(q*2);
   if(!front){const shadow=c.createRadialGradient(-18,0,2,-18,0,r*1.4);shadow.addColorStop(0,'#ffe6a47a');shadow.addColorStop(.65,'#d9b66b55');shadow.addColorStop(1,'#d9b66b00');c.fillStyle=shadow;c.fillRect(-r*1.8,-r*1.3,r*3,r*2.6);
    this.path(c,[[-r*1.6,-10],[-r,-r*.45],[-r*.4,-r*.52],[8,-r*.34],[r*.42,-5],[r*.5,6],[2,r*.38],[-r*.7,r*.50],[-r*1.5,12]],'#efcd88');
    this.path(c,[[-r*1.6,-10],[-r,-r*.45],[-r*.4,-r*.52],[8,-r*.34],[r*.42,-5],[5,-r*.22],[-r*.5,-r*.36],[-r,-r*.27]],'#c8a15d');
    c.strokeStyle='#fff0bc';c.lineWidth=.8;c.beginPath();c.moveTo(-r*1.45,-11);c.lineTo(-r,-r*.40);c.lineTo(-r*.45,-r*.46);c.stroke();
   }else{
    // Only the freshly torn near edge occludes the shaft. It is broken soil,
    // not a closed rim or a ring attached to the weapon.
    c.rotate(p.angle-(p.cut===0?Math.PI/2:0));
    const soil=c.createLinearGradient(0,-18,0,18);soil.addColorStop(0,'#f2d28e00');soil.addColorStop(.55,'#ffe2a5cc');soil.addColorStop(1,'#f2d28e00');c.fillStyle=soil;c.fillRect(-r*1.2,-18,r*2.4,36);
    const top=[],bottom=[];for(let x=-r;x<=r+.1;x+=r/8){const y=x*.18+Math.sin(x*.17)*3+Math.cos(x*.31)*1.8;top.push([x,y+5]);bottom.unshift([x,y-7-Math.cos(x*.2)*2]);}this.path(c,[...top,...bottom],'#dabb78');
    c.strokeStyle='#fff0c1';c.lineWidth=.8;c.beginPath();for(let i=0;i<top.length;i++){const [x,y]=top[i];if(i===0||i%5===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();
    const progress=smooth(clamp((p.theta+.26)/.54));for(let i=0;i<3;i++){const side=i%2?-1:1,x=side*(r+5+progress*(8+i*4)),y=-5+i*9+Math.sin(progress*Math.PI)*5;c.save();c.translate(x,y);c.rotate(side*(.1+progress*.7));this.path(c,[[-4,-2],[2,-3],[5,1],[0,4],[-3,2]],i%2?'#e8c982':'#cfaa61');c.restore();}
   }c.restore();
  },
  gouge(c,start,length,impact,travel,vertical,eruption,halfWidth){const end=start+length*travel,side=vertical?-15:15,center=x=>{const at=start+impact,u=x<at?(x-start)/(impact||1):(x-at)/(length-impact||1);return 3.75*side*u*(1-u);},upper=[],lower=[];
   // The incision itself is the wide gold scar. Its broad face matches the
   // section of metal entering the floor; no thin black channel is overlaid.
   for(let x=start,n=0;x<=end;x=Math.min(end,x+11),n++){const y=center(x),w=halfWidth*(.98+Math.sin(x*.17)*.025+Math.cos(x*.31)*.015);upper.push([x,y-w]);lower.push([x,y+w]);if(x===end)break;}
   c.save();c.globalAlpha*=1-eruption*.88;const gold=c.createLinearGradient(0,-halfWidth,0,halfWidth);for(const [n,color]of [[0,'#b88f4500'],[.10,'#bc934ca0'],[.30,'#e3c183cf'],[.48,'#fff0c1eb'],[.54,'#ffedb9eb'],[.76,'#d7b477c0'],[.92,'#bb91498a'],[1,'#bb914900']])gold.addColorStop(n,color);this.path(c,[...upper,...lower.reverse()],gold);
   c.strokeStyle='#fff4cf';c.lineWidth=.8;c.globalAlpha*=.50;for(let j=0;j<4;j++){c.beginPath();for(let x=start,n=0;x<=end;x=Math.min(end,x+12),n++){const y=center(x)+Math.sin(x*.024+j*2)*2+(j-1.5)*halfWidth*.34;if(n)c.lineTo(x,y);else c.moveTo(x,y);if(x===end)break;}c.stroke();}c.restore();
  },
  cleanIncision(c,start,length,impact,travel,vertical){const half=55,face=c.createLinearGradient(0,-half,0,half);for(const [n,color]of [[0,'#d5a94300'],[.18,'#d2a84a55'],[.38,'#fff0b994'],[.5,'#fff7dbb0'],[.62,'#fff0b994'],[.82,'#d2a84a55'],[1,'#d5a94300']])face.addColorStop(n,color);c.save();c.globalAlpha*=.72;c.fillStyle=face;c.fillRect(start,-half,length*travel,half*2);c.restore();
  },
  edge(c,s,e,pose){if(pose.cut===undefined)return;const old=this.pose(s,e,e.time-s.started-.075);if(!old)return;const tip=p=>({x:p.x+Math.sin(p.angle)*122,y:p.y-Math.cos(p.angle)*122}),a=tip(old),b=tip(pose);c.save();c.globalAlpha*=.58;const grad=c.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,'rgba(188,142,52,0)');grad.addColorStop(.6,'#e2c16b');grad.addColorStop(1,'#fff8d1');c.fillStyle=grad;c.beginPath();c.moveTo(old.x,old.y);c.quadraticCurveTo(a.x,a.y,a.x+(b.x-a.x)*.5,a.y+(b.y-a.y)*.5);c.quadraticCurveTo(b.x,b.y,pose.x,pose.y);c.closePath();c.fill();c.strokeStyle='#fffbea';c.lineWidth=1.6;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(a.x+(b.x-a.x)*.5,a.y+(b.y-a.y)*.5,b.x,b.y);c.stroke();c.restore();
  },
  floor(r,e){const c=r.ctx;for(const s of S.list(e)){const t=e.balls.find(b=>b.id===s.target),b=e.balls.find(b=>b.id===s.owner);if(!t||!b)continue;const a=e.time-s.started,fade=s.active?1:clamp(1-(e.time-s.finished)/.65);if(fade<=0)continue;c.save();c.globalAlpha=fade;
    this.sigil(c,b.x,b.y,b.radius+15,e.time*.12,7,.45);const strength=s.broken?.17:.6;
    if(a<6){for(let i=1;i<=Math.min(s.stage,6);i++){const age=a-(i-1),k=smooth(age/.42),r0=t.radius+13+i*3;c.save();c.translate(t.x,t.y);c.rotate(i%2?e.time*.09:-e.time*.07);c.scale(1,.55);c.strokeStyle='#d7ba71';c.lineWidth=i===s.stage?1.8: .7;c.globalAlpha*=strength*k;c.beginPath();c.arc(0,0,r0,-Math.PI/2,-Math.PI/2+TAU*k);c.stroke();c.restore();}
     // A single descending illumination connects each seal to its target;
     // short uneven highlights resolve into the existing true seal state.
     const age=a-(s.stage-1),arrival=smooth(age/.18)*clamp((.58-age)/.30)*(s.broken?.12:1);
     if(arrival>0){c.save();c.translate(t.x,t.y);const beam=c.createLinearGradient(0,-105,0,16);beam.addColorStop(0,'#fff1c000');beam.addColorStop(.55,'#e4bd6450');beam.addColorStop(1,'#fff4d700');c.globalAlpha=arrival*.8;c.fillStyle=beam;c.beginPath();c.moveTo(-33,-105);c.lineTo(30,-105);c.lineTo(20,12);c.lineTo(-21,12);c.closePath();c.fill();c.strokeStyle='#fff4cf';c.lineWidth=1.1;for(const [x,y,len] of [[-27,-79,28],[-15,-106,39],[17,-91,23],[29,-73,36]]){c.beginPath();c.moveTo(x,y+age*48);c.lineTo(x,y+len+age*48);c.stroke();}c.restore();}
     this.runesAt(c,t.x,t.y+7,t.radius+29,e.time*.2,strength);}
    // A broad, transient shadow precedes the blade; it remains below both
    // actors and uses the real target before the existing centre is locked.
    if(a>=5.65&&a<6.28){const q=smooth((a-5.65)/.3)*clamp((6.28-a)/.22),point=s.center||t;c.save();c.translate(point.x,point.y);c.rotate(-.45);const shade=c.createLinearGradient(-120,0,120,0);shade.addColorStop(0,'rgba(3,7,18,0)');shade.addColorStop(.5,'rgba(3,7,18,.60)');shade.addColorStop(1,'rgba(3,7,18,0)');c.globalAlpha*=q;c.fillStyle=shade;c.fillRect(-120,-C.height,240,C.height*2);c.restore();}
    if(s.center&&a>=6.06){const p=s.center,w=Math.max(S.config.halfWidth,76),k=clamp((a-7.48)/.66),eruption=a>=8.14?clamp(1-(a-8.14)/.5):.20+k*.14;
     const trace=(vertical)=>{c.save();c.translate(p.x,p.y);const length=vertical?C.height:C.width,start=vertical?-p.y:-p.x;
      c.globalAlpha*=vertical?clamp((a-6.06)/.10):clamp((a-6.90)/.10);if(vertical)c.rotate(Math.PI/2);
      // The luminous cut grows behind the visible tip after the real impact;
      // the already-committed attack remains the existing full-lane hit.
      const elapsed=a-(vertical?6.72:7.36),impact=vertical?p.y:p.x,growth=smooth(elapsed/(vertical?.26:.30)),blade=this.sweep(s,e,vertical?0:1),travel=clamp(blade&&blade.cut===(vertical?0:1)?(vertical?blade.tipY:blade.tipX)/length:1);if(travel<=0){c.restore();return;}const end=start+length*travel,cap=Math.min(w*.8,length*travel);c.beginPath();c.moveTo(start,-w*2);c.lineTo(end-cap,-w*2);c.quadraticCurveTo(end,-w*2,end,0);c.quadraticCurveTo(end,w*2,end-cap,w*2);c.lineTo(start,w*2);c.closePath();c.clip();
      // Dark-gold incision remains continuous across the entire physical lane.
      const mark=c.createLinearGradient(0,-w,0,w);mark.addColorStop(0,'#a67d2900');mark.addColorStop(.32,'#ae873b77');mark.addColorStop(.5,'#ffedb6cc');mark.addColorStop(.68,'#ae873b77');mark.addColorStop(1,'#a67d2900');
      c.save();c.globalAlpha*=1-eruption*.88;const layer=this.scarLayer||(this.scarLayer=document.createElement('canvas'));if(layer.width!==C.width*2||layer.height!==Math.ceil(w*4)){layer.width=C.width*2;layer.height=Math.ceil(w*4);}const g=layer.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,layer.width,layer.height);g.globalCompositeOperation='source-over';g.setTransform(2,0,0,2,0,w*2);
      const ink=g.createLinearGradient(0,-w,0,w);for(const [n,color]of [[0,'#a67d2900'],[.32,'#ae873b77'],[.5,'#ffedb6cc'],[.68,'#ae873b77'],[1,'#a67d2900']])ink.addColorStop(n,color);g.fillStyle=ink;g.fillRect(0,-w,length,w*2);
      if(travel<.999){const along=g.createLinearGradient(0,0,Math.max(1,length*travel),0);along.addColorStop(0,'#ffffffff');along.addColorStop(Math.max(0,1-48/Math.max(1,length*travel)),'#ffffffff');along.addColorStop(1,'#ffffff00');g.globalCompositeOperation='destination-in';g.fillStyle=along;g.fillRect(0,-w,length,w*2);}c.drawImage(layer,0,0,length*2,w*4,start,-w,length,w*2);c.strokeStyle='#fff4c6';c.lineWidth=1.1+k*2;c.beginPath();c.moveTo(start,0);const impactAt=start+impact,side=vertical?-15:15;c.bezierCurveTo(start+(impactAt-start)*.33,side*1.25,start+(impactAt-start)*.67,side*1.25,impactAt,0);c.bezierCurveTo(impactAt+(start+length-impactAt)*.33,side*1.25,impactAt+(start+length-impactAt)*.67,side*1.25,start+length,0);this.gouge(c,start,length,impact,travel,vertical,eruption,Math.max(54,blade?.cutHalfWidth||0));c.restore();
      c.globalAlpha*=.5+k*.4;for(let j=0;j<8;j++){const x=start+((j/8+e.time*.065)%1)*length;c.strokeStyle=j%2?'#e6c984':'#fff5d4';this.cross(c,x,(j%2?1:-1)*w*.17,3+k*2,.7);}
      if(eruption){c.globalAlpha=fade*eruption;
       const light=c.createLinearGradient(0,-w,0,w);light.addColorStop(0,'#d5a94300');light.addColorStop(.20,'#d2a84a88');light.addColorStop(.38,'#fff0b9dd');light.addColorStop(.5,'#fffef5');light.addColorStop(.62,'#fff0b9dd');light.addColorStop(.80,'#d2a84a88');light.addColorStop(1,'#d5a94300');
       // The body falls off to transparency across the full lane; the
       // material is built from uneven moving currents rather than a wavy slab.
       c.save();c.globalAlpha=fade*eruption*.72;c.fillStyle=light;c.fillRect(start,-w,length,w*2);c.restore();
       // White-hot center, gently feathered across the width; the bloom follows
       // the entire real cross rather than implying a separate center explosion.
       c.save();c.globalAlpha=fade*eruption*.80;const core=c.createLinearGradient(0,-7,0,7);core.addColorStop(0,'#fffbed00');core.addColorStop(.28,'#fff9dcc0');core.addColorStop(.5,'#fffffa');core.addColorStop(.72,'#fff9dcc0');core.addColorStop(1,'#fffbed00');c.fillStyle=core;c.fillRect(start,-7,length,14);c.restore();
       // A few continuous unequal luminous currents within the incision.
       for(let j=0;j<5;j++){const side=j%2?1:-1,at=start+length*((j*.137+e.time*.08)%1),span=32+(j*23%66),y=side*(w*.22+j%3*w*.07);
        const streak=c.createLinearGradient(at-span,0,at+span,0);streak.addColorStop(0,'#fff5c500');streak.addColorStop(.48,'#fff9d4bb');streak.addColorStop(1,'#fff5c500');c.strokeStyle=streak;c.lineWidth=1.2+(j%3)*1.1;c.beginPath();c.moveTo(Math.max(start,at-span),y);c.bezierCurveTo(at-span*.35,y-side*7,at+span*.3,y+side*8,Math.min(start+length,at+span),y);c.stroke();}
       // Broad asymmetric sheets lift away from each actual cut, with
       // independent lengths, curves and fades rather than repeated points.
       const sheets=[[.08,-1,57,24],[.22,1,72,31],[.39,-1,48,19],[.57,1,67,27],[.73,-1,74,33],[.90,1,53,22]];
       for(let j=0;j<sheets.length;j++){const [fraction,side,span,high]=sheets[j],x=start+fraction*length+Math.sin(e.time*3+j*2)*7,base=side*w*.35,h=high*eruption;
        const plume=c.createLinearGradient(0,base,0,base+side*h);plume.addColorStop(0,'#fff9d6aa');plume.addColorStop(.45,'#ffe6a063');plume.addColorStop(1,'#e6bd6700');
        c.globalAlpha=fade*eruption*(.52+j%3*.1);c.fillStyle=plume;c.beginPath();c.moveTo(x-span,base);c.bezierCurveTo(x-span*.54,base+side*h*.12,x-span*.40,base+side*h*.7,x+span*.12,base+side*h);c.bezierCurveTo(x-span*.04,base+side*h*.55,x+span*.35,base+side*h*.1,x+span,base);c.closePath();c.fill();
        c.globalAlpha=fade*eruption*.68;c.strokeStyle='#fff9df';c.lineWidth=.9;c.beginPath();c.moveTo(x-span*.7,base);c.bezierCurveTo(x-span*.43,base+side*h*.18,x-span*.27,base+side*h*.68,x+span*.12,base+side*h);c.stroke();}
       // Long tapered luminous ribbons shear across the beam at varied offsets;
       // each has a soft transparent tip and a narrow white inner edge.
       for(let j=0;j<12;j++){const side=j%2?1:-1,q=((j*.147+e.time*(j%2?.09:-.07))%1+1)%1,x=start+q*length,span=24+(j*17%55),y=side*(w*.18+(j%4)*w*.12),bend=side*(7+(j*7%13));
        const ribbon=c.createLinearGradient(x-span,0,x+span,0);ribbon.addColorStop(0,'#fff7d000');ribbon.addColorStop(.38,'#ffe3a0bb');ribbon.addColorStop(.65,'#fffce9ee');ribbon.addColorStop(1,'#ffeaba00');
        const thick=3+(j*5%7);c.globalAlpha=fade*eruption*(.62+(j%3)*.12);c.fillStyle=ribbon;c.beginPath();c.moveTo(x-span,y);c.bezierCurveTo(x-span*.45,y-bend-side*thick,x+span*.15,y+bend*.2-side*thick,x+span,y-side*3);c.bezierCurveTo(x+span*.15,y+bend*.5+side*thick,x-span*.45,y-bend+side*thick,x-span,y);c.closePath();c.fill();
        c.globalAlpha=fade*eruption*.65;c.strokeStyle=ribbon;c.lineWidth=.9;c.beginPath();c.moveTo(x-span*.7,y-bend*.35);c.bezierCurveTo(x-span*.3,y-bend-side*thick,x+span*.25,y+bend*.1-side*thick,x+span*.72,y-side*2);c.stroke();}
       // Filament fragments follow the whole cut, with asynchronous size and
       // fading. They remain subordinate to the two real damage lanes.
       for(let j=0;j<24;j++){const q=((j*.618033+e.time*(j%3===0?.08:-.045))%1+1)%1,x=start+q*length,side=j%2?1:-1;
        const spread=(.45+(j*17%50)/100)*w,offset=side*(spread+(1-eruption)*(7+j%8)),size=.6+(j*7%17)/10;
        c.globalAlpha=fade*eruption*(.25+(j%4)*.12);c.fillStyle=j%3?'#ffe9aa':'#fffdf1';c.beginPath();c.moveTo(x-size*2,offset);c.quadraticCurveTo(x,offset-size*.9,x+size*2,offset);c.quadraticCurveTo(x,offset+size*.9,x-size*2,offset);c.fill();}
       // Streaks advect along the complete cross, with uneven lengths and spacing.
       c.lineCap='round';for(let j=0;j<11;j++){const q=((j*.173+e.time*(j%2?.12:-.10))%1+1)%1,x=start+q*length,y=(j%5-2)*w*.12,len=5+(j*7%19);c.globalAlpha=fade*eruption*(.32+(j%3)*.12);c.strokeStyle='#fffdf1';c.lineWidth=j%4===0?1.6:.7;c.beginPath();c.moveTo(Math.max(start,x-len),y);c.lineTo(Math.min(start+length,x+len),y);c.stroke();}
      }c.restore();};trace(true);if(a>=6.90)trace(false);
    }
    if(a>=4&&a<4.7){const k=clamp((a-4)/S.config.purgeDuration),rad=Math.hypot(C.width,C.height)*.5*k;c.strokeStyle='#fff3ce';c.lineWidth=3*(1-k)+1;c.globalAlpha=.7*(1-k);c.beginPath();c.arc(C.width/2,C.height/2,rad,0,TAU);c.stroke();this.sigil(c,C.width/2,55,48,-e.time*.2,5,(1-k)*.8);}
    const bladePose=this.pose(s,e);if(bladePose){this.groundContact(c,bladePose,fade);this.colossal(c,bladePose,fade);this.groundContact(c,bladePose,fade,true);}
    c.restore();}}
  ,runesAt(c,x,y,rad,t,alpha){c.save();c.translate(x,y);c.scale(1,.55);c.globalAlpha*=alpha;this.runes(c,rad,t);c.restore();},
  front(r,e){const c=r.ctx;for(const s of S.list(e)){const t=e.balls.find(b=>b.id===s.target),b=e.balls.find(b=>b.id===s.owner);if(!t||!b)continue;const a=e.time-s.started,fade=s.active?1:clamp(1-(e.time-s.finished)/.65);if(fade<=0)continue;c.save();c.globalAlpha=fade;
    c.strokeStyle='#d5b66e';this.cross(c,b.x,b.y-8,b.radius+22,1.1);c.globalAlpha*=.3;c.strokeStyle='#fff5d2';this.cross(c,b.x,b.y-8,b.radius+28,3);c.globalAlpha=fade;
    if(a<6.72){const age=a-(s.stage-1),k=smooth(age/.45),fall=(1-k)*48,rad=t.radius+17;
     // A stage-specific seal closes in measured segments. When broken it is
     // faint and cannot suggest the already removed restriction still applies.
     if(age>=0&&age<.72){const entry=smooth(age/.25),decay=clamp((.72-age)/.25),extent=rad+17+(1-entry)*34;c.save();c.translate(t.x,t.y);c.globalAlpha*=entry*decay*(s.broken?.12:.72);c.scale(1,.68);
      const glow=c.createRadialGradient(0,0,rad*.45,0,0,extent*1.2);glow.addColorStop(0,'#fff2c400');glow.addColorStop(.65,'#f2d48722');glow.addColorStop(.88,'#ffe5a84d');glow.addColorStop(1,'#d1a75200');c.fillStyle=glow;c.beginPath();c.arc(0,0,extent*1.2,0,TAU);c.fill();
      for(let j=0;j<4;j++){const ang=j*TAU/4+s.stage*.16+e.time*.08;c.strokeStyle=j%2?'#dfbb70':'#fff3ca';c.lineWidth=j%2?1.5:2.2;c.beginPath();c.arc(0,0,extent,ang+.08,ang+.70);c.stroke();c.save();c.rotate(ang+.04);this.path(c,[[extent-3,-2],[extent+5,0],[extent-3,2]],'#fff1bb');c.restore();}c.restore();}
     this.sigil(c,t.x,t.y-fall,rad,-e.time*.13,s.stage,(s.broken?.16:.85)*(age<.7?1:clamp(1-(age-.7)/.3)));
     if(s.stage>=3&&!s.broken){c.strokeStyle='#cfac5b';this.cross(c,t.x,t.y-2,t.radius+7,1.7);}if(s.stage>=6&&!s.broken){c.save();c.globalAlpha*=.45;c.strokeStyle='#fff2c3';this.cross(c,t.x,t.y-9,51,6);c.restore();}}
    if(a>=6&&a<8.5&&s.center){const q=s.center,k=smooth((a-6)/.32),charge=clamp((a-7.48)/.66);for(let j=0;j<7;j++){const ang=-Math.PI*.9+j*Math.PI*.8/6,rad=55+charge*5,x=q.x+Math.cos(ang)*rad,y=q.y-20+Math.sin(ang)*rad;c.save();c.globalAlpha*=k*(.35+charge*.45);this.smallSeal(c,x,y,j+1,1);c.restore();}if(charge>0&&a<8.14){c.save();c.globalAlpha*=charge*.8;c.strokeStyle='#fff2bb';for(let j=0;j<8;j++){const u=(a*1.2+j/8)%1,side=j%2?1:-1,dist=(1-u)*140;c.beginPath();c.moveTo(q.x+side*dist,q.y-2);c.lineTo(q.x+side*Math.max(0,dist-8),q.y-2);c.moveTo(q.x-2,q.y+side*dist);c.lineTo(q.x-2,q.y+side*Math.max(0,dist-8));c.stroke();}c.restore();}}
    c.restore();}
   for(const f of e.effects||[]){if(f.kind!=='holySeal'||f.style==='seal'||f.style==='judge')continue;const u=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.globalAlpha=(1-u)**1.4;c.strokeStyle='#f8e2a1';if(['break','release','purify'].includes(f.style)){for(let i=0;i<10;i++){const a=i*2.399,d=(f.style==='purify'?7:24)+u*28,x=Math.cos(a)*d,y=Math.sin(a)*d-u*19;c.save();c.translate(x,y);c.rotate(a+u);this.path(c,[[-2,-5],[2,-3],[1,5],[-1,3]],i%2?'#fff6d3':'#ceab62');c.restore();}}else if(f.style==='impact'){for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);const d=8+u*(f.part===2?42:26);this.path(c,[[d,0],[d+12*(1-u),-2],[d+18*(1-u),0],[d+12*(1-u),2]],'#fff5c9');c.restore();}}else{c.lineWidth=2;c.beginPath();c.arc(0,0,20+u*19,-2.1,-1.0);c.stroke();}c.restore();}
  }
 };
 const floor=G.HolyView.floor,front=G.HolyView.front;G.HolyView.floor=function(r,e){floor.call(this,r,e);V.floor(r,e);};G.HolyView.front=function(r,e){front.call(this,r,e);V.front(r,e);};
})(typeof window!=='undefined'?window:globalThis);
