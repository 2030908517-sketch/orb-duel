(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return 1-(1-v)**3;};
 function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function line(c,pts,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function disk(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
 // Clean enamel planes and broad edge accents match the game's graphic balls; no rivets or polished steel bands.
 function metal(c,x,y,w,h,angle=0){c.save();c.translate(x,y);c.rotate(angle);const k=Math.min(3,h*.3,w*.2),pts=[[-w/2+k,-h/2],[w/2-k,-h/2],[w/2,-h/2+k],[w/2,h/2-k],[w/2-k,h/2],[-w/2+k,h/2],[-w/2,h/2-k],[-w/2,-h/2+k]];poly(c,pts,'#44485f');c.strokeStyle='#181e30';c.lineWidth=1.2;c.stroke();poly(c,[[-w/2+k,-h/2],[w/2-k,-h/2],[w/2-k,0],[-w/2+k,0]],'#737b98');line(c,[[-w*.30,-h/2+.6],[w*.30,-h/2+.6]],'#b6c5df',Math.min(1,h*.2));if(w>23&&h>5)line(c,[[-w*.24,h*.20],[w*.24,h*.20]],'#f29c88',1.3);c.restore();}
 function gear(c,x,y,r,a,color='#e5a18b'){c.save();c.translate(x,y);c.rotate(a);const pts=[];for(let i=0;i<32;i++){const angle=i*TAU/32,rr=i%4<2?r:r*.77;pts.push([Math.cos(angle)*rr,Math.sin(angle)*rr]);}poly(c,pts,color);c.strokeStyle='#29273c';c.lineWidth=1;c.stroke();disk(c,0,0,r*.61,'#3b3e58');for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3);line(c,[[r*.18,0],[r*.53,0]],'#b8bfd6',Math.max(.8,r*.13));c.restore();}disk(c,0,0,r*.21,'#f5c6ae');c.restore();}
 function chain(c,a,b,tension=1,offset=0){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<2)return;const angle=Math.atan2(dy,dx),count=Math.min(35,Math.floor(d/9));c.save();c.translate(a.x,a.y);c.rotate(angle);for(let i=0;i<count;i++){const x=(i+.5)*d/count,y=Math.sin(i*.65+offset)*2*(1-tension);c.strokeStyle=i%2?'#aeb4d0':'#69728f';c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,4,i%2?1.1:2.4,0,0,TAU);c.stroke();}c.restore();}

 function cage(c,box,e,front){const q=box.bounds,cx=box.x,cy=box.y,age=e.time-box.started,build=ease(age/.36),lift=ease((age-.05)/.27),height=34*lift,drive=Math.min(age,2.82),pulse=Math.max(0,1-(age%1)/.14),brake=age>2.82;
  c.save();c.lineJoin='round';
  if(!front){const glow=c.createRadialGradient(cx,cy,20,cx,cy,110);glow.addColorStop(0,'#6b392117');glow.addColorStop(.8,'#6b392129');glow.addColorStop(1,'#6b392100');c.fillStyle=glow;c.fillRect(cx-115,cy-115,230,230);
   // Foundation tracks remain on the actual collision footprint; raised rear framing gives depth.
   for(const y of [q.top,q.bottom]){metal(c,cx,y,142,10);line(c,[[q.left+10,y],[q.right-10,y]],'#171e29',2);for(let x=q.left+15;x<q.right;x+=12)line(c,[[x,y-3],[x+4,y+3]],'#b3bbd2',1);}
   for(const x of [q.left,q.right])metal(c,x,cy,126,9,Math.PI/2);
   metal(c,cx,q.top-height,112*build,8);for(let i=0;i<5;i++){const x=q.left+17+i*23;metal(c,x,q.top-height/2,Math.max(.1,height),3,Math.PI/2);}
   for(const item of box.gather||[]){const n=e.traps.find(v=>v.id===item.id);if(!n)continue;const anchor={x:Math.max(q.left,Math.min(q.right,n.x)),y:Math.max(q.top,Math.min(q.bottom,n.y))};chain(c,n,anchor,clamp((age-.2)/.4),drive*8);if(n.gatherMovedTick>=e.tick-2){c.globalAlpha=.4;line(c,[[n.x-(n.x-(n.previousX??n.x))*20,n.y-(n.y-(n.previousY??n.y))*20],[n.x,n.y]],'#efbc7b',2);c.globalAlpha=1;}}
   c.restore();return;
  }
  // Four telescoping outriggers enter from outside then stand and fold shut, rather than scaling a completed cage.
  const corners=[[q.left,q.top,-1,-1],[q.right,q.top,1,-1],[q.left,q.bottom,-1,1],[q.right,q.bottom,1,1]];
  corners.forEach(([x,y,sx,sy],i)=>{const close=ease((age-i*.035)/.26),slide=(1-close)*41,xx=x+sx*slide,yy=y+sy*slide;c.save();c.translate(xx,yy);metal(c,0,-height/2,Math.max(.1,height+10),12,Math.PI/2);metal(c,sx*10,4,34,13,sx*sy*.33);gear(c,0,-height,10,drive*(i%2?-2:2));metal(c,sx*10,-height-1,29*ease((age-.14-i*.02)/.18),6,sy*(1-close)*1.2);gear(c,sx*13,7,7,-drive*2.8);c.restore();});
  // Side braces and visible front grid preserve a wide central aperture for the prisoner.
  for(const x of [q.left,q.right]){metal(c,x,cy-height,120*build,6,Math.PI/2);for(let i=0;i<4;i++){const y=q.top+17+i*29,fold=ease((age-.12-i*.025)/.2);metal(c,x,y-height/2,height*fold,3,Math.PI/2);}}
  metal(c,cx,q.bottom-height,113*ease((age-.20)/.16),8);for(let i=0;i<5;i++){const x=q.left+18+i*23;metal(c,x,q.bottom-height/2,Math.max(.1,height*ease((age-.17-i*.02)/.17)),3.5,Math.PI/2);}
  for(const sx of [-1,1]){gear(c,cx+sx*39,q.bottom+3,12,drive*sx*4);gear(c,cx+sx*24,q.bottom+4,5.7,-drive*sx*8);metal(c,cx+sx*39,q.bottom+3,16,4);const latch=ease((age-.27)/.14);metal(c,cx+sx*(19-8*latch),q.bottom-height,18,10,sx*(1-latch)*.9);disk(c,cx+sx*10,q.bottom-height,2,pulse?'#fff4b8':'#df7e43');}
  const by=q.bottom-13;metal(c,cx,by,31,22);for(let i=0;i<3;i++)metal(c,cx-10+i*10,by,15,3,Math.PI/2);disk(c,cx,by,4,brake?'#fff4c6':pulse?'#ffd280':'#a74c35');
  const label=q.top-height>30?q.top-height-10:q.bottom+26;c.font='900 23px "Segoe UI"';c.textAlign='center';c.strokeStyle='#0b121c';c.lineWidth=4;const digit=String(Math.max(1,Math.ceil(box.until-e.time)));c.strokeText(digit,cx,label);c.fillStyle=pulse?'#fff4cd':'#efbd7b';c.fillText(digit,cx,label);
  // Steel shutters of the bomb visibly compress in the last half second.
  for(const sx of [-1,1])metal(c,cx+sx*(12-5*clamp((age-2.4)/.42)),by,8,14);
  c.restore();
 }
 function substitute(c,f){const age=f.age,open=ease(age/.23),fade=clamp((.7-age)/.27);c.save();c.translate(f.x,f.y);c.globalAlpha=fade;
  for(let i=0;i<6;i++){const a=i*TAU/6+.2,x=Math.cos(a)*(10+open*27),y=Math.sin(a)*(10+open*23)+age*age*36;c.save();c.translate(x,y);c.rotate(a+open*.5);metal(c,0,0,24,13);metal(c,-2,-3,16,3);disk(c,6,3,1.3,'#ffdca3');c.restore();}
  for(let i=0;i<3;i++){const a=i*2.3;gear(c,Math.cos(a)*open*28,Math.sin(a)*open*25+age*age*40,5+i,age*(i%2?-9:7));const pts=[];for(let j=0;j<13;j++)pts.push([Math.cos(a)*(j*1.6+open*5),Math.sin(a)*(j*1.6)+Math.sin(j*Math.PI/2)*(3+open*3)]);line(c,pts,'#c3b4a0',1.1);}
  chain(c,{x:-7,y:0},{x:-35*open,y:21*open},.3);c.restore();
  if(age>.10){c.save();c.globalAlpha=clamp((age-.10)/.12)*clamp((.65-age)/.18);for(let i=0;i<3;i++)metal(c,f.endX+(i-1)*14,f.endY+(1-ease((age-.1)/.2))*25,10,3,(i-1)*.65);c.restore();}
 }
 function explosion(c,f){const a=f.age,p=clamp(a/f.life),expand=1-Math.exp(-a*14),hw=f.bounds?(f.bounds.right-f.bounds.left)/2:64,hh=f.bounds?(f.bounds.bottom-f.bounds.top)/2:60;c.save();c.translate(f.x,f.y);
  // Back smoke has actual rolling lobes; luminous gas grows then tears away before steel lands.
  for(let i=0;i<9;i++){const angle=i*2.399+.12,travel=expand*(29+(i*17%51)),r=(10+ease(a/.4)*(18+i%3*5))*(1-p*.55),x=Math.cos(angle)*travel,y=Math.sin(angle)*travel-a*18;c.globalAlpha=clamp((a-.06)/.15)*clamp((.95-a)/.5)*.72;const smoke=c.createRadialGradient(x-r*.25,y-r*.3,1,x,y,r);smoke.addColorStop(0,'#5b5775');smoke.addColorStop(.55,'#35384f');smoke.addColorStop(1,'#292e4500');c.fillStyle=smoke;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  if(a<.52){
   // One connected, folding gas body with nested hot lobes, not separate glowing balls.
   for(let layer=0;layer<3;layer++){const pts=[],scale=[1,.75,.43][layer],r=(22+expand*71)*scale,tear=clamp((a-.18)/.30);
    for(let i=0;i<42;i++){const angle=i*TAU/42,rough=1+.14*Math.sin(angle*3+.7+layer*.4)+.075*Math.sin(angle*6-a*5+layer*.8)+.04*Math.sin(angle*9+2.1),rr=r*rough*(1-.35*tear);pts.push([Math.cos(angle)*rr,Math.sin(angle)*rr*.79-a*15]);}
    c.globalAlpha=clamp((.52-a)/.22)*(layer===0?.82:1);const heat=c.createRadialGradient(-r*.20,-r*.26,2,0,0,r*1.2);heat.addColorStop(0,['#e8a16c','#ffe2ac','#fff4cf'][layer]);heat.addColorStop(.52,['#ad502b','#efad64','#ffdd95'][layer]);heat.addColorStop(1,['#552d28','#a94824','#dc863e'][layer]);c.fillStyle=heat;c.beginPath();
    for(let i=0;i<pts.length;i++){const p0=pts[(i+pts.length-1)%pts.length],p1=pts[i],p2=pts[(i+1)%pts.length],p3=pts[(i+2)%pts.length];if(!i)c.moveTo(...p1);c.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,...p2);}c.closePath();if(tear>0)for(let h=0;h<4;h++){const an=h*2.399,xx=Math.cos(an)*r*.49,yy=Math.sin(an)*r*.43-a*15,hr=r*.21*tear;c.moveTo(xx+hr,yy);c.arc(xx,yy,hr,0,TAU);}c.fill('evenodd');
    // Curled hot seams follow the expansion, opening dark channels as gas rolls outward.
    if(layer===1)for(let j=0;j<5;j++){const angle=j*2.399+.2,x=Math.cos(angle)*r*.63,y=Math.sin(angle)*r*.49;c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#ffc779';c.beginPath();c.moveTo(-12,-4);c.bezierCurveTo(-2,-14,19,-9,16,3);c.bezierCurveTo(10,-2,5,5,-12,-4);c.fill();c.restore();}
   }
  }
  c.globalAlpha=clamp((.105-a)/.105);const flash=c.createRadialGradient(0,0,2,0,0,90);flash.addColorStop(0,'#fff9de');flash.addColorStop(.30,'#ffdc9ae8');flash.addColorStop(1,'#ef993300');c.fillStyle=flash;c.fillRect(-90,-90,180,180);
  c.globalAlpha=clamp((1-a)/.45);
  for(let i=0;i<16;i++){const side=i%4,x=side<2?(side===0?-hw:hw):(i%4-1.5)*26,y=side>=2?(side===2?-hh:hh):(Math.floor(i/4)-1.5)*27,angle=Math.atan2(y,x)+Math.sin(i*8)*.25,v=55+(i*37%100),travel=a*v,x1=x+Math.cos(angle)*travel,y1=y+Math.sin(angle)*travel+a*a*95;c.save();c.translate(x1,y1);c.rotate(angle+a*(i%2?5:-4));if(i%4===0)gear(c,0,0,8+i%3,a*6);else metal(c,0,0,i%3===0?38:19,4+i%3);if(i%3===1)chain(c,{x:0,y:0},{x:-19,y:11+Math.sin(a*10+i)*6},.2);c.restore();}
  for(let i=0;i<30;i++){const angle=i*2.399+.6,d=expand*(38+i*3),x=Math.cos(angle)*d,y=Math.sin(angle)*d+a*a*100;c.globalAlpha=clamp((.7+(i%4)*.1-a)/.45);line(c,[[x,y],[x-Math.cos(angle)*(4+i%7),y-Math.sin(angle)*(4+i%7)]],i%3?'#e8a66a':'#fff0bb',i%5===0?1.8:.8);}
  c.restore();
 }
 const V=G.TrapperView={
    deploy(c,f,p){const x=(f.endX-f.x)*p,y=(f.endY-f.y)*p-Math.sin(p*Math.PI)*22;c.save();c.translate(x,y);c.rotate(p*3);metal(c,0,0,9,6);for(const side of [-1,1])metal(c,side*4,1,4,2,side*p);c.restore();},
    node(r,m,e){const c=r.ctx,age=Math.max(0,e.time-(m.armedAt-.55)),open=ease(age/.38),armed=e.time>=m.armedAt,drive=m.gatherTravel||0,catching=m.captureUntil>e.time,spin=catching?(e.time-m.captureStarted)*14:drive/10;
      c.save();c.translate(m.x,m.y);c.lineJoin='round';c.globalAlpha=1;
      c.fillStyle='#040b1480';c.beginPath();c.ellipse(1,3,14,10,0,0,TAU);c.fill();
      // Alternate corners of one beveled hexagon seat all three jaws identically.
      const corners=Array.from({length:6},(_,i)=>{const a=i*TAU/6-Math.PI/6;return[Math.cos(a)*13.5,Math.sin(a)*13.5];}),shell=[];
      for(let i=0;i<6;i++){const p=corners[i],prev=corners[(i+5)%6],next=corners[(i+1)%6];for(const q of [prev,next])shell.push([p[0]+(q[0]-p[0])*.18,p[1]+(q[1]-p[1])*.18]);}
      const enamel=c.createLinearGradient(0,-12,0,12);enamel.addColorStop(0,'#747e9c');enamel.addColorStop(.45,'#555a73');enamel.addColorStop(1,'#45465f');
      poly(c,shell,enamel);c.strokeStyle='#a4b5d4';c.lineWidth=1;c.stroke();
      for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3-Math.PI/6);c.translate(6+open*5,0);c.rotate((1-open)*-.85);poly(c,[[-3,-3],[3,-3],[5,0],[3,3],[-3,3]],'#a8b5d1');line(c,[[0,-2],[3,-2],[4,0]],'#f5d0c4',1);c.restore();}
      gear(c,0,0,7.5,spin,'#da9c95');disk(c,0,0,4.6,'#25283f');
      const core=armed?(Number.isFinite(m.detonateAt)?'#fff1d1':m.color):'#73738b';poly(c,[[0,-3.4],[3.4,0],[0,3.4],[-3.4,0]],core);line(c,[[-1.7,-1.7],[0,-3.4],[1.7,-1.7]],'#ffe2d6',.7);
      if(!armed){for(let i=0;i<3;i++){const q=clamp((age-i*.12)/.12);metal(c,-5+i*5,-12+3*(1-q),3,1.4);}}
      if(Number.isFinite(m.detonateAt)){const q=clamp(1-(m.detonateAt-e.time)/.09);c.globalAlpha=q;disk(c,0,0,5,'#ffd396');}
      c.restore();
    },
    link(r,l,e){const c=r.ctx,a=l.a,b=l.b,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1)return;const active=l.dynamic||l.hub,width=l.dynamic?1.7:l.hub?1.3:.9;c.save();c.lineCap='round';
      line(c,[[a.x,a.y],[b.x,b.y]],'#080f1bd0',width+2);line(c,[[a.x,a.y],[b.x,b.y]],active?'#c8a9bdb0':'#9d97b878',width);line(c,[[a.x,a.y-.35],[b.x,b.y-.35]],active?'#f5d0d880':'#bdc6df43',.45);
      c.translate(a.x,a.y);c.rotate(Math.atan2(dy,dx));for(const u of [.12,.88]){if(d<30)break;metal(c,d*u,0,4,2);}
      if(active){const u=((e.time*.36+(a.id||0)*.17)%1),x=d*u;const glow=c.createLinearGradient(x-6,0,x+6,0);glow.addColorStop(0,'#ffe0a300');glow.addColorStop(.5,'#ffdfb6b0');glow.addColorStop(1,'#ffe0a300');line(c,[[x-6,0],[x+6,0]],glow,1.1);}
      c.restore();return true;
    },
    capture(r,m,t,e){const c=r.ctx,p=clamp((e.time-m.captureStarted)/.3),dx=t.x-m.x,dy=t.y-m.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx),slack=(1-ease(p))*7;c.save();c.lineCap='round';
      // Braided hauling cable and a contracting three-jaw lock remain tied to real endpoints.
      const pts=[];for(let i=0;i<=14;i++){const u=i/14,bulge=Math.sin(u*Math.PI)*slack;pts.push([m.x+dx*u-dy/d*bulge,m.y+dy*u+dx/d*bulge]);}
      line(c,pts,'#131b29',4);line(c,pts,'#b8a5c0',2);line(c,pts.map(([x,y])=>[x-.4,y-.5]),'#eee2f0',.65);
      c.translate(t.x,t.y);c.rotate(a);const rad=t.radius+3+(1-ease(p))*9;for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3);poly(c,[[rad-2,-6],[rad+2,-6],[rad+3,3],[rad-1,6],[rad-4,6],[rad-1,2]],'#7e87a8');line(c,[[rad-1,-5],[rad+1,-5],[rad+2,2]],'#f6d3cf',1);c.restore();}c.restore();return true;
    },
    shard(r,p){const c=r.ctx;c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));line(c,[[-8,0],[0,0]],'#c6a07765',1);poly(c,[[4,0],[-2,-2.1],[-4,1.5],[0,3]],'#929ac1');line(c,[[-2,-2.1],[4,0],[0,3]],'#f3d0dd',.6);c.restore();return true;},
    effect(r,f){const c=r.ctx;if(f.kind!=='tactic'||!['catch','mineBlast'].includes(f.style))return false;
      if(f.style==='mineBlast'){c.save();const scale=(f.radius||45)/90;c.translate(f.x,f.y);c.scale(scale,scale);explosion(c,{...f,x:0,y:0,age:f.age/f.life*.8,life:.8,bounds:{left:-20,right:20,top:-18,bottom:18}});c.restore();}
      else{const p=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.globalAlpha=1-p;for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3);const x=27-ease(p)*7;metal(c,x,0,9,3);line(c,[[x-4,-5],[x-4,5]],'#ffe7b3',1);c.restore();}c.restore();}
      return true;
    },
    swap(r,f){const c=r.ctx,p=clamp(f.age/f.life),q=ease(f.age/.13),fade=clamp((f.life-f.age)/.12),end={x:f.endX,y:f.endY};
      for(const [at,reverse] of [[f,false],[end,true]]){c.save();c.translate(at.x,at.y);c.globalAlpha=fade;for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3+.2);const shift=(reverse?1-q:q)*9;metal(c,24+shift,0,13,4);gear(c,20+shift,-4,3,(reverse?-1:1)*q*2);c.restore();}c.restore();}
      // Local shell echoes indicate the exchange; no fabricated travelling physical actor.
      const dx=end.x-f.x,dy=end.y-f.y;for(let i=0;i<3;i++){const u=clamp(q-i*.13),x=f.x+dx*u,y=f.y+dy*u;c.save();c.translate(x,y);c.globalAlpha=(1-p)*(.24-i*.06);poly(c,[[-7,-9],[7,-9],[11,0],[6,9],[-6,9],[-11,0]],'#c9a17d');line(c,[[-7,-9],[7,-9],[10,0]],'#f0d4a0',1);c.restore();}
    },

    hub(r,m,e){const c=r.ctx,age=e.time-(m.armedAt-.3),open=ease(age/.3);c.save();c.translate(m.x,m.y);c.lineJoin='round';
      c.fillStyle='#030b1480';c.beginPath();c.ellipse(1,4,24,16,0,0,TAU);c.fill();
      for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4+.6);c.translate(13+open*7,0);metal(c,0,0,15,8);metal(c,-2,-1,7,2);disk(c,4,0,1.2,'#e3c18a');c.restore();}
      poly(c,[[-16,-7],[-8,-15],[9,-15],[17,-7],[17,7],[9,14],[-9,14],[-17,5]],'#45475f');c.strokeStyle='#adbdda';c.lineWidth=1.2;c.stroke();poly(c,[[-15,-7],[-7,-14],[8,-14],[16,-7],[10,-3],[-10,-3]],'#7e89a9');
      gear(c,0,-2,11,e.time*.9,'#edb5a3');for(const side of [-1,1])gear(c,side*10,7,4.2,-e.time*2.4,'#a5b3d0');
      disk(c,0,-2,6,'#272b42');poly(c,[[0,-7],[5,-2],[0,3],[-5,-2]],m.color||'#ef829f');line(c,[[-2.5,-4.5],[0,-7],[2.5,-4.5]],'#ffe1d8',1);
      for(const side of [-1,1]){metal(c,side*10,-9,7,3);line(c,[[side*13,4],[side*13,9]],'#f8c378',1.5);}c.restore();},
    behind(r,e){for(const box of e.trapperWorld?.cages||[])cage(r.ctx,box,e,false);for(const b of e.balls)if(b.type==='trapper'&&b.arcana?.phase==='trapReady'&&b.hp>0){const c=r.ctx;c.save();c.globalAlpha=.45+.2*Math.sin(e.time*5);for(let i=0;i<3;i++){c.save();c.translate(b.x,b.y);c.rotate(i*TAU/3+e.time*.3);line(c,[[6,-21],[15,-16],[17,-5]],'#f5b78a',1.1);c.restore();}gear(c,b.x+18,b.y+13,4,-e.time*2);c.restore();}},
    front(r,e){const c=r.ctx;for(const box of e.trapperWorld?.cages||[])cage(c,box,e,true);for(const f of e.effects){if(f.kind!=='mechanism')continue;c.save();const p=clamp(f.age/f.life);
      if(f.style==='dismantle'){c.globalAlpha=1-p;for(let i=0;i<5;i++){const a=i*2.399,d=ease(p)*14;c.save();c.translate(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d+p*p*8);c.rotate(a+p*2);if(i===0)gear(c,0,0,4,p*4);else metal(c,0,0,6,2);c.restore();}}
      else if(f.style==='substitute')substitute(c,f);
      else if(f.style==='swap')this.swap(r,f);
      else if(f.style==='cageBlast')explosion(c,f);
      else if(f.style==='cageRelease'){const q=f.bounds||{left:f.x-64,right:f.x+64,top:f.y-60,bottom:f.y+60};c.globalAlpha=1-p;for(const sx of [-1,1]){const x=(sx<0?q.left:q.right)+sx*ease(p)*20;metal(c,x,f.y,(q.bottom-q.top)*(1-ease(p)*.8),6,Math.PI/2);for(const y of [q.top,q.bottom]){c.save();c.translate(x,y);c.rotate(sx*ease(p)*1.2);metal(c,sx*8,-10*(1-p),23,5);gear(c,0,0,6,p*3);c.restore();}}}
      else if(f.style==='hubDeploy'||f.style==='hubOnline'){const n=e.traps.find(v=>v.id===f.nodeId);if(n){c.globalAlpha=1-p;for(const t of e.traps.filter(t=>t.owner===n.owner&&t!==n))chain(c,n,{x:n.x+(t.x-n.x)*ease(f.age/.3),y:n.y+(t.y-n.y)*ease(f.age/.3)},ease(f.age/.3));}}
      c.restore();}
    }
 };
})(typeof window!=='undefined'?window:globalThis);

