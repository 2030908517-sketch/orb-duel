(function(root){
  'use strict';const G=root.OrbDuel,A=G.ArcanaView,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function path(c,draw,fill,stroke,width=1){c.beginPath();draw(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function ribbon(c,a,b,width,color,bend=0){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,mx=(a.x+b.x)/2+nx*bend,my=(a.y+b.y)/2+ny*bend;path(c,p=>{p.moveTo(a.x,a.y);p.quadraticCurveTo(mx+nx*width,my+ny*width,b.x,b.y);p.quadraticCurveTo(mx-nx*width*.4,my-ny*width*.4,a.x,a.y);},color);}
  function smoothBlob(c,points,color){path(c,p=>{const first=points[0],last=points.at(-1);p.moveTo((last.x+first.x)/2,(last.y+first.y)/2);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];p.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}p.closePath();},color);}
  const C=G.Constants,ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  function polygon(c,points,color){path(c,p=>{points.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();},color);}
  function pool(c,b,e,age,drain=0){const center=b.arcana.center,spread=ease(age/.56),reach=Math.max(...[[0,0],[C.width,0],[0,C.height],[C.width,C.height]].map(([x,y])=>Math.hypot(x-center.x,y-center.y)))*1.15;
    c.save();c.beginPath();c.rect(0,0,C.width,C.height);c.clip();
    // A connected flood grows from the dissolved body, reaching every corner.
    const boundary=[];for(let i=0;i<48;i++){const a=i*TAU/48,r=reach/(1+.15*ease(drain/.12))*spread*(1-ease(drain))*(.95+.045*Math.sin(i*1.7+e.time*2)+.025*Math.sin(i*.7-e.time*3));boundary.push({x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r});}
    path(c,p=>{boundary.forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y));p.closePath();},'#360b20');c.clip();
    c.globalAlpha=.8;const prey=G.World.targetFor(b,e)||center,t=e.time;
    // Broad, low-contrast currents steer the eye towards the prey without fake hit areas.
    for(let j=0;j<11;j++){const y=j*39-20+Math.sin(t*.8+j)*7,x=-30+(j%3)*12,end={x:C.width+40,y:y+Math.sin(j*1.9)*26};ribbon(c,{x,y},end,9+j%3*6,j%2?'#4b0c24':'#591229',Math.sin(j*2+t*.6)*21);}
    for(let side=-1;side<=1;side+=2){for(let j=0;j<3;j++){const y=prey.y+side*(45+j*25),x=prey.x-side*(60+j*11);path(c,p=>{p.moveTo(x,y+side*18);p.bezierCurveTo(prey.x-side*105,y,prey.x+side*76,prey.y+side*72,prey.x+side*42,prey.y+side*22);},null,j?'#711730':'#9c253c',j?1.4:2.3);}}
    for(let i=0;i<18;i++){const x=(i*83+33)%C.width,y=(i*57+21)%C.height,k=(t*.32+i*.13)%1,dx=prey.x-x,dy=prey.y-y;
      path(c,p=>{p.moveTo(x+dx*k*.22,y+dy*k*.22);p.quadraticCurveTo(x+18+dx*k*.22,y-3+dy*k*.22,x+31+dx*k*.22,y+2+dy*k*.22);},null,i%4?'#7d1a32':'#b83b4d',i%4?1:1.5);}
    c.restore();
  }
  function wave(c,w,time){const form=ease((time-w.formedAt)/.3),fly=w.launched?Math.max(0,time-w.launchedAt):0,crash=ease((fly-.36)/.34),curl=ease((time-w.formedAt-.11)/.34),h=(57+Math.sin(w.slot*2)*5)*form*(1-crash*.85),nx=Math.cos(w.angle),ny=Math.sin(w.angle),fade=clamp((w.expires-time)/.24);
    const project=(x,side,height)=>({x:w.x+nx*x-ny*side,y:w.y+ny*x+nx*side-height*.83}),span=w.width*(.58+.42*form),at=(j,x,height)=>{const side=(j/16-.5)*span,edge=Math.sin(j/16*Math.PI),ripple=Math.sin(j*.8+w.slot*1.7+time*5);return project(x+Math.sin(j*.7+w.slot+time*3)*4,side,height*(.22+.78*edge**.7+.07*Math.sin(j*.8+time*4))+ripple*form*.7);};
    c.save();c.globalAlpha=fade;
    // The foot is the real moving attack; the lifted sheet arches above it.
    const foot=[];for(let i=0;i<=16;i++)foot.push(at(i,-30-crash*14,0));for(let i=16;i>=0;i--)foot.push(at(i,12+crash*15,0));polygon(c,foot,'#64132d');
    const profile=[[-36,0],[-23,h*.18],[-17,h*.6],[-10,h*.94],[4+curl*7,h],[9+curl*29,h*(1-curl*.18)],[9+curl*25,h*(1-curl*.7)]],colors=['#65132d','#83172f','#ad233d','#bc2a43','#dc4056','#ea6572'];
    for(let k=0;k<profile.length-1;k++){const points=[];for(let j=0;j<=16;j++)points.push(at(j,...profile[k]));for(let j=16;j>=0;j--)points.push(at(j,...profile[k+1]));smoothBlob(c,points,colors[k]);}
    // The turned-over lip exposes a dark inner chamber, bordered by a thick falling rim.
    if(curl>.1){const hollow=[],lip=[];for(let j=1;j<=15;j++)hollow.push(at(j,18+curl*9,h*.72));for(let j=15;j>=1;j--)hollow.push(at(j,18+curl*11,h*(.77-curl*.43)));smoothBlob(c,hollow,'#591027');
      for(let j=0;j<=16;j++)lip.push(at(j,9+curl*29,h*(1-curl*.18)));for(let j=16;j>=0;j--)lip.push(at(j,14+curl*25,h*(1-curl*.35)));smoothBlob(c,lip,'#e14a5c');}
    // A lobed liquid crown folds over the hollow; short droplets hang from the falling edge.
    const crown=[];for(let j=0;j<=32;j++){const jj=j/2,v=at(jj,7+curl*28,h*(1-curl*.13));crown.push({x:v.x,y:v.y-2-Math.sin(j*.85)**2*3});}for(let j=32;j>=0;j--){const v=at(j/2,13+curl*28,h*(1-curl*.32));crown.push(v);}smoothBlob(c,crown,'#df4a5c');
    for(const [start,end]of [[3,6],[9,12]])path(c,p=>{for(let j=start;j<=end;j++){const v=at(j,9+curl*29,h*(1-curl*.16));j===start?p.moveTo(v.x,v.y):p.lineTo(v.x,v.y);}},null,'#fba393',1.9);
    for(const j of [3,7,12]){const v=at(j,12+curl*28,h*(1-curl*.35)),hang=(5+Math.sin(j+fly*5)**2*13)*curl*(1-crash);path(c,p=>{p.moveTo(v.x-2,v.y-3);p.bezierCurveTo(v.x-3,v.y+hang*.6,v.x+5,v.y+hang,v.x+2,v.y+hang+2);p.quadraticCurveTo(v.x+10,v.y+hang*.4,v.x+4,v.y-2);},'#eb6c78');}
    // A lower lip peels forward then falls, spreading into a flat rushing splash.
    if(crash>0){for(let j=0;j<7;j++){const side=(j-3)*span/8,splash=Math.sin(crash*Math.PI)*24,v=project(15+crash*25,side,splash*(.35+j%3*.2));ribbon(c,project(-18,side,1),v,3+(j%3),'#c73851',j%2?4:-4);}}
    if(w.launched){for(let i=0;i<10;i++){const dt=fly-(.3+(i%4)*.035);if(dt<0||dt>.5)continue;const side=(i/9-.5)*span,d=dt*(35+i%3*22),v=project(8+d-dt*w.speed,side+(i%2?1:-1)*dt*22,Math.max(0,19+dt*(100+i%3*25)-dt*dt*270));c.globalAlpha=fade*clamp((.5-dt)/.13);path(c,p=>p.ellipse(v.x,v.y,1.8+i%3,3+i%2,.3,0,TAU),i%3?'#c9344e':'#f4928a');}}
    c.restore();}
  function vortex(c,center,age,life=.85,amount=0){const q=clamp(age/life),spin=age*(3.5+q*3),radius=155-139*ease(q),squash=.73;c.save();c.translate(center.x,center.y);c.globalAlpha=ease(age/.1);
    path(c,p=>p.ellipse(0,7,radius+9,(radius+9)*squash,0,0,TAU),'#55102a');
    // Continuous ribbons spiral down into a deep throat, while their widths and radii contract.
    for(let j=0;j<2;j++){const outer=[],inner=[],light=[];for(let i=0;i<=64;i++){const t=i/64,r=7+radius*(1-t)**1.14,a=j*Math.PI+spin+t*9.1+.16*Math.sin(t*13+j),width=(5+17*(1-t))*(.78+.22*Math.sin(t*19+j))*Math.sin(t*Math.PI)**.35;
      outer.push({x:Math.cos(a)*(r+width),y:Math.sin(a)*(r+width)*squash+t*t*9});inner.push({x:Math.cos(a)*Math.max(2,r-width),y:Math.sin(a)*Math.max(2,r-width)*squash+t*t*9});light.push({x:Math.cos(a)*(r+width*.55),y:Math.sin(a)*(r+width*.55)*squash+t*t*9});}
      smoothBlob(c,[...outer,...inner.reverse()],j%2?'#a72741':'#7b1731');path(c,p=>light.slice(5,57).forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y)),null,j%2?'#c63e55':'#a82c45',3.5);
      if(j<1+Math.ceil(amount/7))path(c,p=>light.slice(17+j*5,33+j*5).forEach((v,i)=>i?p.lineTo(v.x,v.y):p.moveTo(v.x,v.y)),null,'#f4958b',1.1);}
    path(c,p=>p.ellipse(0,9,13+q*4,8+q*3,0,0,TAU),'#120b18');
    // Surface splinters follow the same converging spiral, with no radial starburst.
    for(let i=0;i<15;i++){const t=(age*1.25+i*.17)%1,a=i*2.399+spin+t*3,r=(1-t)*(radius+45),v={x:Math.cos(a)*r,y:Math.sin(a)*r*squash};ribbon(c,v,{x:v.x+Math.cos(a+1.2)*11*(1-t),y:v.y+Math.sin(a+1.2)*7*(1-t)},1.5+t*2,'#be3850',3);}
    c.restore();}
  function wings(c,b,age,amount){const open=clamp(age/.5),fade=clamp((1.1-age)/.2),size=.68+.34*clamp(amount/20),bounds=b.combatBounds||{left:0,right:G.Constants.width,top:0,bottom:G.Constants.height};c.save();c.translate(b.x,b.y-8);c.globalAlpha=.9*fade;
    for(const side of [-1,1]){c.save();const room=side<0?b.x-bounds.left-3:bounds.right-b.x-3;c.scale(side*Math.min(size,Math.max(.15,room/116)),Math.min(size,Math.max(.18,(b.y-bounds.top-3)/80)));const elbow=26+open*27,tip=54+open*58,up=-18-open*42;
      path(c,p=>{p.moveTo(9,-4);p.quadraticCurveTo(17,-30,elbow,up);p.lineTo(tip,up-18);p.quadraticCurveTo(tip-20,up+1,tip-16,-10);p.quadraticCurveTo(tip-43,-28,elbow+13,8);p.quadraticCurveTo(elbow-1,-5,36,25);p.quadraticCurveTo(22,6,9,16);p.closePath();},'#481026');
      path(c,p=>{p.moveTo(13,-6);p.quadraticCurveTo(22,-28,elbow,up+7);p.lineTo(tip-6,up-13);p.quadraticCurveTo(tip-37,up+18,tip-25,-14);p.quadraticCurveTo(elbow+25,-15,elbow+11,0);p.quadraticCurveTo(35,-6,35,15);p.quadraticCurveTo(20,3,13,9);},'#a92540');
      path(c,p=>{p.moveTo(10,-5);p.quadraticCurveTo(19,-29,elbow,up);p.lineTo(tip,up-18);p.moveTo(elbow,up+5);p.quadraticCurveTo(elbow+17,-23,tip-16,-10);p.moveTo(elbow,up+5);p.quadraticCurveTo(43,-1,36,25);},null,'#ed7b7c',1.6);c.restore();}c.restore();}
  function rebirth(c,b,age,amount){const rise=ease(age/.17),burst=ease((age-.24)/.26),fade=clamp((.78-age)/.3),h=Math.min(172,b.y+28)*rise;c.save();c.translate(b.x,b.y);c.globalAlpha=fade;
    path(c,p=>p.ellipse(0,7,48-16*burst,19-5*burst,0,0,TAU),'#4b0c24','#b62c48',2);
    // A thick twisting column grows out of the vortex throat; its crown tears apart after the burst.
    const half=18+13*Math.sin(clamp(age/.55)*Math.PI);
    path(c,p=>{p.moveTo(-half,8);p.bezierCurveTo(-half-12,-h*.24,-9,-h*.66,-22,-h);p.quadraticCurveTo(-10,-h+14,-4,-h-12);p.quadraticCurveTo(10,-h+8,22,-h-4);p.bezierCurveTo(10,-h*.6,half+14,-h*.3,half,8);p.quadraticCurveTo(0,26,-half,8);},'#7c1630');
    path(c,p=>{p.moveTo(-12,8);p.bezierCurveTo(-24,-h*.3,11,-h*.55,-8,-h+6);p.quadraticCurveTo(1,-h+14,10,-h+3);p.bezierCurveTo(27,-h*.6,-3,-h*.32,17,8);p.quadraticCurveTo(0,20,-12,8);},'#cd304b');
    path(c,p=>{p.moveTo(-5,7);p.bezierCurveTo(-15,-h*.28,17,-h*.56,2,-h+9);},null,'#f4787d',5);
    for(let i=0;i<9;i++){const side=i%2?1:-1,t=clamp((age-.19-i%3*.025)/.58),x=side*(17+t*(34+i%4*10)),y=-h*(.76+i%3*.09)+t*t*140;ribbon(c,{x:x-side*8,y:y-18*(1-t)},{x:x+side*6,y:y+7},3+i%3,'#c9334e',side*7);}
    c.restore();if(age>=0){wings(c,b,age,amount);if(amount>0){const t=age;c.save();c.globalAlpha=clamp((1.1-t)/.18);c.textAlign='center';c.font='bold 18px system-ui';c.lineWidth=3;c.strokeStyle='#102319';c.strokeText('+'+amount.toFixed(1),b.x,b.y-39-t*20);c.fillStyle='#88efb2';c.fillText('+'+amount.toFixed(1),b.x,b.y-39-t*20);c.restore();}}}
  G.VampireArcanaView={};const behind=A.behind,front=A.front;
  A.behind=function(r,e){behind.call(this,r,e);const c=r.ctx;for(const b of e.balls){if(b.type!=='vampire'||!b.arcana||b.hp<=0)continue;const u=b.arcana,age=e.time-u.started;
      if(['bloodLiquefy','bloodTide'].includes(u.phase)){pool(c,b,e,u.phase==='bloodLiquefy'?age:.6);}
      if(u.phase==='bloodReverse'){pool(c,b,e,.6,clamp(age/.85));vortex(c,u.center,age,.85,(u.pendingHeal||0)+u.totalHealed);}
      if(u.phase==='bloodRebirth'){if(age<.3)vortex(c,u.center,.8,.85,u.totalHealed);rebirth(c,b,age,u.totalHealed);}
      if(u.phase==='bloodFinale'){if(age<.85){pool(c,b,e,.6,clamp(age/.85));vortex(c,u.center,age,.85,(u.pendingHeal||0)+u.totalHealed);}else rebirth(c,b,age-.85,u.totalHealed);}
    }};
  A.front=function(r,e){front.call(this,r,e);const c=r.ctx;for(const w of e.arcanaWorld?.tides||[])wave(c,w,e.time);
    for(const b of e.balls){const u=b.arcana;if(b.type!=='vampire'||u?.phase!=='warning')continue;const p=clamp((e.time-u.started)/(u.until-u.started));c.save();c.translate(b.x,b.y);for(let i=0;i<5;i++){const a=i*TAU/5+.1;c.save();c.rotate(a);path(c,x=>{x.moveTo(2,-1);x.lineTo(8,1);x.lineTo(11,-3);x.lineTo(23*p,-1);},null,'#ed7480',1.8);c.restore();}c.restore();}
    for(const f of e.effects){if(f.kind!=='arcana')continue;const age=f.age;
      if(f.style==='seaBreak'&&age<.6){c.save();c.translate(f.x,f.y);c.globalAlpha=1-age/.6;for(let i=0;i<9;i++){const a=i*TAU/9,d=12+age*(75+i%3*18);ribbon(c,{x:Math.cos(a)*d,y:Math.sin(a)*d*.7},{x:Math.cos(a)*(d+13),y:Math.sin(a)*(d+13)*.7},4,'#bf2e4b',6);}c.restore();}
      if(['seaHit','seaBlock'].includes(f.style)&&age<.5){const p=clamp(age/.5);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-p)**1.5;for(let i=0;i<7;i++){const a=(i-3)*.36,d=12+70*(1-Math.exp(-age*12));ribbon(c,{x:Math.cos(a)*9,y:Math.sin(a)*9},{x:Math.cos(a)*d,y:Math.sin(a)*d},i%2?2:5,f.style==='seaBlock'?'#a4cbd0':i%2?'#a82743':'#f38a8a',5);}c.restore();}
    }};
})(typeof window!=='undefined'?window:globalThis);
