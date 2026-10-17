(function(root){
 'use strict';const G=root.OrbDuel,S=G.ArcanaLab,A=G.ArcanaView,TAU=Math.PI*2,clamp=S.clamp,renderers=new WeakMap();
 const names={laser:'日轮·断界天刃',trapper:'诡匣·替身收监',shield:'王城·天垒封锁',reflector:'旧债·逆命清算',ranger:'死线·极限反击',normal:'一拳定音',accelerator:'破空音爆',vampire:'血海重生'};
 function line(c,x,y,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
 function ellipse(c,x,y,rx,ry,color,width=1){A.ellipse(c,x,y,Math.max(.01,rx),Math.max(.01,ry),color,width);}
 function disk(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(.01,r),0,TAU);c.fill();}
 function age(time,event){return event?time-event.time:Infinity;}
 function ball(c,b,deform=0,angle=0){
  c.save();c.translate(b.x,b.y);c.rotate(angle);c.scale(1-deform,1/(1-deform));c.globalAlpha=b.ghost?.phase==='phased'?.3:1;
  const grad=c.createRadialGradient(-7,-9,2,0,0,b.radius);grad.addColorStop(0,b.def.color);grad.addColorStop(1,'#172638');disk(c,0,0,b.radius,grad);ellipse(c,0,0,b.radius,b.radius,b.def.color,1.8);
  c.rotate(-angle);c.fillStyle='#09111d';if(b.type==='vampire'){c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-18,-1,-9,-15,0,-6);c.bezierCurveTo(9,-15,18,-1,0,8);c.fill();}else if(b.type==='accelerator'){c.beginPath();c.moveTo(4,-12);c.lineTo(-9,2);c.lineTo(0,2);c.lineTo(-3,13);c.lineTo(10,-3);c.lineTo(2,-3);c.closePath();c.fill();}else disk(c,0,0,5,'#09111d');
  if(b.shield>0)ellipse(c,0,0,b.radius+5,b.radius+5,'#a5fbe6',3);c.restore();
 }
 function burst(c,x,y,angle,t,color,scale=1){
  c.save();c.translate(x,y);c.rotate(angle);const p=clamp(t/.45,0,1),reach=(40+150*(1-Math.exp(-p*5)))*scale;c.globalAlpha=Math.pow(1-p,1.4);
  for(let i=0;i<18;i++){const a=(i/17-.5)*2.9,d=reach*(.65+((i*17)%7)/18),inner=d*(.15+.45*p);line(c,Math.cos(a)*inner,Math.sin(a)*inner,Math.cos(a)*d,Math.sin(a)*d,i%3?color:'#fffcec',i%3?1.5:3.4);}
  for(let i=0;i<3;i++)ellipse(c,reach*.3-i*14,0,8+p*22,28+p*(90-i*14),i?color:'#fff9e9',Math.max(1,6-i*2)*(1-p));c.restore();
 }
 function draw(canvas,clip,map,time,options){
  const sample=S.sample(clip,map,time),e=sample.frame.source,b=e.balls[0],t=e.balls[1],events=sample.events,opts=S.tune(options);
  if(!map.original||clip.type==='laser'||clip.scene.startsWith('hunt')||clip.scene==='scarGrowth'){let r=renderers.get(canvas);if(!r){r=new G.Renderer(canvas);renderers.set(canvas,r);}r.reducedMotion=opts.shake===0;r.draw(e);let stage=({laserFocus:'日轮展开',laserForge:'光铸天刃',laserSweep:'断界裁切',laserReturn:'万光归零',trapReady:'替身待机',trapAftermath:'收监倒计时',royalRise:'王城降临',royalShrink:'王城收缩',royalHold:'铁壁斗兽场',royalRelease:'王城解放',debtCharge:'旧债觉醒',debtRecovery:'因果清算',idle:'回归战斗',warning:'预兆 · 蓄势',blink:'瞬身到位',punch:'压缩蓄势',orbit:'环天疾行',sonicRecovery:'音障内压',punchRecovery:'破阵轰击',bloodRecovery:'错位绞切',counterStep:'险避来袭',counterCharge:'架枪 · 穿甲蓄力',counterRecovery:'高速反击'})[b.arcana.phase]||b.arcana.phase;if(clip.type==='vampire'&&b.arcana.used&&G.VampireArcana){stage=({bloodLiquefy:'血肉崩解',bloodTide:'血潮猎杀',bloodReverse:'万血逆流',bloodRebirth:'猩红重生',bloodFinale:'重生收尾',bloodCage:'血狱 · 三刃绞杀',bloodHunt:'收割择机',bloodMist:'血雾贴身',bloodBite:'贴身噬心',bloodReturn:'噬心回流',idle:'回归战斗'})[b.arcana.phase]||stage;}else if(clip.type==='vampire'&&b.arcana.used){const blades=e.projectiles.filter(p=>p.mode==='arcBlood');stage=blades.some(p=>p.launched)?'错位绞切':blades.length?'三面凝刃':e.effects.some(f=>f.kind==='arcana'&&f.style==='returnBlood'&&f.age<.7)?'汲血回流':'回归战斗';}if(clip.scene.startsWith('hunt'))stage=({warning:'血影预备',flight:'锁定扑袭',reform:'凝形恢复',idle:'追猎结束'})[b.hunt.phase];return {...sample,stage};}
  if(map.original){let r=renderers.get(canvas);if(!r){r=new G.Renderer(canvas);renderers.set(canvas,r);}r.draw(e);return sample;}
  if(clip.type==='vampire'&&G.VampireStudy)return G.VampireStudy.draw(canvas,clip,map,time,options);
  const pixels=Math.round(canvas.clientWidth*Math.min(root.devicePixelRatio||1,2));if(canvas.width!==pixels){canvas.width=pixels;canvas.height=Math.round(pixels*340/360);}
  const c=canvas.getContext('2d');c.setTransform(canvas.width/360,0,0,canvas.height/340,0,0);c.clearRect(0,0,360,340);c.fillStyle='#0d1523';c.fillRect(0,0,360,340);
  c.fillStyle='#26364a';for(let x=20;x<360;x+=20)for(let y=20;y<340;y+=20)disk(c,x,y,.5,'#26364a');c.strokeStyle='#2a3c54';c.lineWidth=1;c.strokeRect(7,7,346,326);
  const impact=[...events].reverse().find(v=>v.kind==='hit'&&v.actual>0),hAge=age(time,impact);c.save();
  if(hAge<.24&&opts.shake){const q=Math.exp(-hAge*16)*opts.shake*(clip.type==='normal'?4:2.5);c.translate(Math.sin(hAge*157)*q,Math.cos(hAge*139)*q);}
  const phase=events.filter(v=>v.kind==='phase').at(-1),phaseAge=age(time,phase),u=b.arcana;
  if(['warning','punch','rush','bloodRecovery'].includes(u.phase)){c.fillStyle=clip.type==='vampire'?'#220415':'#030a15';c.globalAlpha=.22;c.fillRect(0,0,360,340);c.globalAlpha=1;}
  if(u.phase==='warning'){
   const p=clamp((e.time-u.started)/(u.until-u.started),0,1);
   if(clip.type==='normal'){
    for(let i=0;i<12;i++){const a=i*TAU/12,d=35+(1-p)*55;line(c,b.x+Math.cos(a)*d,b.y+Math.sin(a)*d,b.x+Math.cos(a)*(d-9),b.y+Math.sin(a)*(d-9),'#97bde888',1);}
    c.setLineDash([4,5]);ellipse(c,t.x,t.y,t.radius+9,t.radius+9,'#e6cc8b',1);c.setLineDash([]);
   }else if(clip.type==='accelerator'){
    c.save();c.translate(b.x,b.y);c.rotate(u.aim);line(c,15,0,220,0,'#f4d09766',1);
    for(let i=0;i<4;i++){c.globalAlpha=.8-i*.14;ellipse(c,18+i*11,0,3+(1-p)*7,46-i*7,'#ffe6b5',2.5-i*.4);}c.restore();
   }else{
    const q=u.anchor||t;ellipse(c,q.x,q.y,112,112,'#9f345f',1.2);c.setLineDash([2,11]);ellipse(c,q.x,q.y,119,119,'#ffabc855',1);c.setLineDash([]);
    const a=Math.atan2(b.y-q.y,b.x-q.x);for(let i=0;i<3;i++){const z=a+i*TAU/3,x=clamp(q.x+Math.cos(z)*112,72,288),y=clamp(q.y+Math.sin(z)*112,72,268);c.save();c.globalAlpha=.12+.28*p;A.blade(c,x,y,Math.atan2(q.y-y,q.x-x),.45+.35*p);c.restore();}
    c.save();c.translate(b.x,b.y);c.fillStyle='#a91d4e55';c.beginPath();c.arc(0,0,57,0,TAU);c.arc(18,-13,46,0,TAU,true);c.fill();c.restore();
   }
  }
  // Real trail samples, without invented displacement or extra damaging objects.
  for(const v of e.balls){if(Math.hypot(v.vx,v.vy)<3)continue;let prev=v;for(let i=1;i<v.trail.length;i+=2){const q=v.trail[i];if(Math.hypot(q.x-prev.x,q.y-prev.y)<3)continue;c.globalAlpha=.13*(1-i/v.trail.length);disk(c,q.x,q.y,v.radius*.7,v.def.color);prev=q;}c.globalAlpha=1;}
  const blink=events.find(v=>v.style==='blink'),blinkAge=age(time,blink);
  if(blinkAge>=0&&blinkAge<.13){const p=clamp(blinkAge/.13,0,1);for(let i=0;i<9;i++){const q=i/8;c.globalAlpha=(1-p)*(.1+q*.4);c.save();c.translate(blink.x+(blink.endX-blink.x)*q,blink.y+(blink.endY-blink.y)*q);c.rotate(blink.angle);c.fillStyle='#b5d8ff';c.beginPath();c.ellipse(0,0,24,14,0,0,TAU);c.fill();c.restore();}c.globalAlpha=1;}
  if(u.phase==='rush'){
   c.save();const path=[b,...u.history];for(let i=path.length-1;i>0;i--){c.globalAlpha=(1-i/path.length)*.65;line(c,path[i].x,path[i].y,path[i-1].x,path[i-1].y,'#fca73c',20*(1-i/path.length)+1);line(c,path[i].x,path[i].y,path[i-1].x,path[i-1].y,'#fff3dc',5*(1-i/path.length)+1);}c.globalAlpha=1;A.speedLines(c,b.x,b.y,u.aim,'#ffe2b2',.65);c.restore();
  }
  for(const w of e.arcanaWorld?.cones||[]){c.save();c.translate(w.x,w.y);c.rotate(w.angle);const x=w.travel,y=12+x*.43;c.fillStyle='#e8f7ff18';c.beginPath();c.moveTo(0,0);c.lineTo(x,-y);c.quadraticCurveTo(x+23,0,x,y);c.closePath();c.fill();for(const [width,color]of [[18,'#ffa83f88'],[8,'#d5eeff'],[2.5,'#ffffff']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,-y);c.quadraticCurveTo(x+23,0,x,y);c.stroke();}c.restore();}
  let shape=0;if(hAge<.15)shape=.2*Math.exp(-hAge*20)*opts.strength;ball(c,b,clip.type==='normal'&&u.phase==='punch'?.06:0,u.aim);ball(c,t,shape,u.aim);
  if(clip.type==='normal'&&u.phase==='punch'&&blinkAge>.085){
   const p=clamp((blinkAge-.085)/.5,0,1);c.save();c.translate(b.x,b.y);c.rotate(u.aim);c.globalAlpha=.45+.55*p;
   // A stable drawn-back fist is the threat; the release is a separate forward pose.
   A.fist(c,-13-8*p,-6,0,(1.1+.65*p)*opts.strength);
   for(let i=0;i<9;i++){const a=i*TAU/9+.18,d=55+(1-p)*20;line(c,-12+Math.cos(a)*d,Math.sin(a)*d,-12+Math.cos(a)*(d-10),Math.sin(a)*(d-10),'#f9d89a',1.3);}c.restore();
  }
  for(const p of e.projectiles)if(p.mode==='arcBlood'){
   const angle=Math.atan2(p.vy,p.vx);if(p.launched&&p.history?.length){for(let i=1;i<p.history.length;i++){c.globalAlpha=(1-i/p.history.length)*.42;line(c,p.history[i].x,p.history[i].y,p.history[i-1].x,p.history[i-1].y,'#ed3874',Math.max(1,15*(1-i/p.history.length)));}c.globalAlpha=1;}
   const release=events.find(v=>v.style==='bloodSeal'),growth=p.launched?1:clamp(age(time,release)/.18,.15,1);c.save();c.globalAlpha=growth;A.blade(c,p.x,p.y,angle,(1.12+.08*(1-growth))*opts.strength);c.restore();
  }
  for(const f of events.filter(v=>v.kind==='effect')){
   const a=age(time,f);if(a<0||a>1.05)continue;
   if(f.style==='fist'&&a<.23){const p=clamp(a/.11,0,1);c.save();c.translate(f.x,f.y);c.rotate(f.angle);for(let i=3;i>=1;i--){c.globalAlpha=(1-a/.23)*.15;A.fist(c,20+70*p-i*16,-5,0,2.2*opts.strength);}c.globalAlpha=1-a/.23;A.fist(c,25+70*p,-5,0,2.2*opts.strength);c.restore();}
   if(['fistImpact','sonicImpact'].includes(f.style)&&a<.5)burst(c,f.x,f.y,f.angle,a,clip.type==='normal'?'#ffcf7d':'#b5e8ff',opts.strength*(clip.type==='normal'?1:.75));
   if(f.style==='bloodRupture'&&a<.45){c.save();c.translate(f.x,f.y);c.globalAlpha=Math.pow(1-a/.45,1.5);const p=1-Math.exp(-a*18);for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3);c.strokeStyle=i?'#f94481':'#ffe1ef';c.lineWidth=(6-i)*(1-a/.45)+.5;c.beginPath();c.moveTo(-18-p*45,-20-p*20);c.bezierCurveTo(20+p*40,-60-p*20,65,15,-15,30+p*25);c.stroke();c.restore();}c.restore();}
   if(f.style==='sonic'&&a<.7){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=Math.pow(1-a/.7,1.5);for(let i=0;i<3;i++){const p=clamp(a*2-i*.055,0,1);ellipse(c,20+p*195-i*14,0,7+p*17,18+p*120,i?'#ffc57599':'#d9f6ff',i?1.5:4);}c.restore();}
   if(f.style==='bloodSeal'&&a<.9){c.save();c.globalAlpha=(1-a/.9)*.65;ellipse(c,f.x,f.y,112,112,'#e9487a',2);for(let i=0;i<12;i++){const z=i*TAU/12;line(c,f.x+Math.cos(z)*112,f.y+Math.sin(z)*112,f.x+Math.cos(z)*102,f.y+Math.sin(z)*102,'#ffb6d0',1.5);}c.restore();}
   if(f.style==='bloodHit'&&a<.34){c.save();c.translate(f.x,f.y);c.rotate(f.angle-.3);c.globalAlpha=1-a/.34;c.fillStyle='#ffe4ee';c.beginPath();c.ellipse(0,0,35+65*(1-Math.exp(-a*24)),Math.max(.2,6*(1-a/.34)),0,0,TAU);c.fill();c.restore();}
   if(f.style==='shatter'&&a<.5){for(let i=0;i<12;i++){const z=i*TAU/12,d=22+120*a;c.save();c.globalAlpha=1-a/.5;c.translate(f.x+Math.cos(z)*d,f.y+Math.sin(z)*d);c.rotate(z+a);c.fillStyle='#aff9ed';c.beginPath();c.moveTo(-3,-6);c.lineTo(7,0);c.lineTo(-2,6);c.closePath();c.fill();c.restore();}}
  }
  for(const v of events.filter(v=>v.kind==='heal')){const a=age(time,v);if(a<0||a>.65)continue;const p=clamp(a/.45,0,1);c.save();c.globalAlpha=Math.sin(p*Math.PI);for(let i=0;i<3;i++){const z=clamp(p-i*.05,0,1),x=v.x+(v.endX-v.x)*z,y=v.y+(v.endY-v.y)*z-Math.sin(z*Math.PI)*(20+i*8);disk(c,x,y,3-i*.5,i?'#ff89b5':'#ffe3ee');}c.restore();}
  const hitGroups=new Map();for(const v of events.filter(v=>v.kind==='hit'&&v.actual>0)){const group=[...hitGroups.values()].find(q=>q.targetId===v.targetId&&v.time-q.time<.16);if(group)group.actual+=v.actual;else hitGroups.set(v.id,{...v});}
  for(const v of hitGroups.values()){const a=age(time,v);if(a<0||a>.8)continue;const src=clip.frames[v.frame].source,target=src.balls.find(q=>q.id===v.targetId)||src.balls[1];c.save();c.globalAlpha=clamp((.8-a)/.25,0,1);c.font='800 17px "Segoe UI"';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#080e18';c.fillStyle=clip.type==='vampire'?'#ffc5db':'#fff0bf';const text='−'+v.actual.toFixed(v.actual%1?1:0);c.strokeText(text,target.x,target.y-35-a*25);c.fillText(text,target.x,target.y-35-a*25);c.restore();}
  const heals=events.filter(v=>v.kind==='heal');if(heals.length){const first=heals[0],a=age(time,first);if(a>=0&&a<.6){c.save();c.globalAlpha=clamp((.6-a)/.2,0,1);c.font='700 13px "Segoe UI"';c.textAlign='center';c.fillStyle='#b5f3d4';c.fillText('+'+heals.reduce((sum,v)=>sum+v.amount,0).toFixed(0),first.endX,first.endY-32-a*25);c.restore();}}
  if(hAge<.045){c.globalAlpha=(1-hAge/.045)*.13;c.fillStyle=clip.type==='vampire'?'#ff9dbc':'#fff0cc';c.fillRect(0,0,360,340);c.globalAlpha=1;}
  c.restore();c.font='10px "Segoe UI"';c.fillStyle='#7990ae';c.fillText(names[clip.type]+' / EXPERIMENT',15,323);return sample;
 }
 G.ArcanaLabView=Object.freeze({draw,names});
})(typeof window!=='undefined'?window:globalThis);
