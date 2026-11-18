(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const regular=b=>b&&!G.Arcana?.busy(b)&&!G.VampireArcana?.active(b);
 function local(c,x,y,a,fn){c.save();c.translate(x,y);c.rotate(a);fn();c.restore();}
 function fill(c,pts,color){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=color;c.fill();}
 // A variable cross-section, with a narrow reflected plane on one wet edge.
 function ribbon(c,points,width,color,shine=false){const left=[],right=[],light=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,u=i/(points.length-1),w=width*Math.sin(Math.PI*u)**.55*(.78+.22*Math.sin(u*11));left.push([p[0]-dy/len*w,p[1]+dx/len*w]);right.push([p[0]+dy/len*w*.66,p[1]-dx/len*w*.66]);light.push([p[0]-dy/len*w*.68,p[1]+dx/len*w*.68]);}fill(c,[...left,...right.reverse()],color);if(shine){c.beginPath();light.slice(3,-4).forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=shine;c.lineWidth=.9;c.stroke();}}
 function drop(c,x,y,size,angle,alpha=1){local(c,x,y,angle,()=>{c.globalAlpha*=alpha;c.beginPath();c.moveTo(size*2.1,0);c.bezierCurveTo(size*.4,-size*1.3,-size,-size,-size,0);c.bezierCurveTo(-size,size,size*.4,size*1.3,size*2.1,0);c.fillStyle='#68182d';c.fill();c.strokeStyle='#dc4059';c.lineWidth=.8;c.stroke();c.beginPath();c.ellipse(0,-size*.28,size*.65,size*.25,0,0,TAU);c.fillStyle='#ffc1b3';c.fill();});}
 function path(a,b,t,arch=13){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,off=Math.sin(t*Math.PI)*arch;return[a.x+dx*t-dy/d*off,a.y+dy*t+dx/d*off];}
 const chargeGains=new WeakMap();
 const N=G.NormalRegularView={
  owns(b){return b?.type==='normal'&&b.hp>0&&(regular(b)||b.arcana?.phase==='warning');},
  level(b,e){let pending=0;for(const f of e.effects)if(f.kind==='regularFeel'&&f.style==='chargeGain'&&f.owner===b.id&&f.age<.26)pending+=f.delta*(1-ease(f.age/.26));return Math.max(0,Math.min(3,b.charges-pending));},
  flow(c,x,y,a,span,length,t,power=1){if(power<=.002)return;local(c,x,y,a,()=>{const W=128,H=112;let cv=this.canvas;if(!cv){cv=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(W,H):root.document?.createElement?.('canvas');if(!cv)return;cv.width=W;cv.height=H;this.canvas=cv;}const ctx=cv.getContext('2d'),im=this.image||(this.image=ctx.createImageData(W,H)),px=im.data;px.fill(0);
   for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){const q=ix/(W-1),v=(iy/(H-1)-.5)*2,warp=.10*Math.sin(q*8-v*5-t*11)+.035*Math.sin(q*17+v*9-t*18),z=v+warp,nose=.95-.17*z*z+.035*Math.sin(z*8-t*7),back=.07+.055*Math.sin(z*6+t*5),env=ease((q-back)/.20)*ease((nose-q)/.22)*Math.max(0,1-z*z)**.7,fold=(.5+.5*Math.sin(z*16+q*7+1.1*Math.sin(q*10+z*5-t*12)-t*15))**8,breaks=.25+.75*(.5+.5*Math.sin(q*13-z*7+t*9)),front=Math.exp(-(((q-(nose-.14))/.075)**2))*Math.max(0,1-z*z),d=env*(.10+fold*.8*breaks+front*.32),at=(iy*W+ix)*4,hot=clamp(d*1.7);px[at]=142+hot*108;px[at+1]=196+hot*58;px[at+2]=224+hot*31;px[at+3]=Math.min(235,d*power*420);}
   ctx.putImageData(im,0,0);c.drawImage(cv,-length*.65,-span,length,span*2);
  });},
  surface(c,b,level,t,release){const W=112,H=112,R=b.radius+5,amount=release>0?3:level,filled=clamp(amount/3);let cv=this.surfaceCanvas;if(!cv){cv=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(W,H):root.document?.createElement?.('canvas');if(!cv)return;cv.width=W;cv.height=H;this.surfaceCanvas=cv;}const ctx=cv.getContext('2d'),im=this.surfaceImage||(this.surfaceImage=ctx.createImageData(W,H)),px=im.data;px.fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const xx=(x/(W-1)-.5)*2*R/b.radius,yy=(y/(H-1)-.5)*2*R/b.radius,rr=Math.hypot(xx,yy),a=Math.atan2(yy,xx),u=((a+Math.PI/2+TAU)%TAU)/TAU;if(rr<.64||rr>1.03||filled<=0)continue;const edge=filled>.999?1:ease((filled-u)/.012)*ease((u+.004)/.014),skin=.905+.016*Math.sin(a*3-t*3)+.01*Math.sin(a*7+t*4),crest=Math.exp(-(((rr-skin)/.036)**2)),inner=Math.exp(-(((rr-skin+.065)/.065)**2)),flow=(.5+.5*Math.sin(a*8+rr*19-t*5+Math.sin(a*3+t)))**6,pressure=.72+.16*Math.cos(a*3),opacity=release>0?release:1,d=edge*(crest*.7+inner*(.30+flow*.48))*pressure*opacity,k=(y*W+x)*4,hot=clamp(d*1.3);px[k]=147+hot*107;px[k+1]=209+hot*46;px[k+2]=240+hot*15;px[k+3]=Math.min(245,d*370);}ctx.putImageData(im,0,0);c.drawImage(cv,-R,-R,R*2,R*2);},
  awakened(c,b,t){const cSize=144,R=b.radius+24;let cv=this.powerCanvas;if(!cv){cv=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(cSize,cSize):root.document?.createElement?.('canvas');if(!cv)return;cv.width=cv.height=cSize;this.powerCanvas=cv;}const ctx=cv.getContext('2d'),im=this.powerImage||(this.powerImage=ctx.createImageData(cSize,cSize)),px=im.data;px.fill(0);const enter=ease((t-b.awakening.activatedAt)/.38),breath=.88+.12*Math.sin(t*3.2);for(let y=0;y<cSize;y++)for(let x=0;x<cSize;x++){const xx=(x/(cSize-1)-.5)*2*R,yy=(y/(cSize-1)-.5)*2*R,rr=Math.hypot(xx,yy)/b.radius,a=Math.atan2(yy,xx);if(rr<1.01||rr>1.83)continue;const skin=1.16+.16*Math.sin(a*2+.8)**2+.065*Math.sin(a*4-t*2.5),envelope=Math.exp(-(((rr-skin)/.16)**2)),phase=a*4+rr*12-t*4.5+Math.sin(a*2+t*1.3),fold=(.5+.5*Math.sin(phase))**6,patch=.4+.6*(.5+.5*Math.sin(a*3-rr*7+t*2)),outer=Math.exp(-(((rr-(skin+.15))/.11)**2))*(.5+.5*Math.sin(a*11+rr*21-t*8))**10,d=(envelope*(.21+fold*1.05*patch)+outer*.33)*ease((rr-1.01)/.07)*ease((1.83-rr)/.20)*enter*breath*ease(Math.min(x,y,cSize-1-x,cSize-1-y)/9),hot=clamp(d*1.8),k=(y*cSize+x)*4;px[k]=89+hot*164;px[k+1]=170+hot*84;px[k+2]=224+hot*31;px[k+3]=Math.min(230,d*390);}ctx.putImageData(im,0,0);c.save();c.globalAlpha=1;c.drawImage(cv,b.x-R,b.y-R,R*2,R*2);c.restore();},
  recovery(r,b,e,f){const c=r.ctx,p=clamp(f.age/f.life);if(b.hp<=0||p>=1)return;c.save();for(const other of e.balls)if(other!==b){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(other.x+other.radius,other.y);c.arc(other.x,other.y,other.radius,0,TAU);c.clip('evenodd');}local(c,b.x,b.y,0,()=>{for(let i=0;i<6;i++){const at=i*2.399+.3,delay=i*.025,q=clamp((p-delay)/(1-delay)),sample=v=>{const d=(b.radius+22)*(1-ease(v))+b.radius*.40*ease(v),bend=Math.sin(v*Math.PI)*(i%2?9:-7);return[Math.cos(at)*d-Math.sin(at)*bend,Math.sin(at)*d+Math.cos(at)*bend];},pts=[];for(let j=0;j<=24;j++)pts.push(sample(Math.max(0,q-.24+j/24*.24)));const fade=ease(q/.12)*(1-ease((q-.72)/.28));c.globalAlpha=fade*.72;ribbon(c,pts,2.4*(1-q*.35),'#51dba9','#c3ffe2');const head=sample(q),g=c.createRadialGradient(head[0],head[1],0,head[0],head[1],4.2);g.addColorStop(0,'#edfff6');g.addColorStop(.25,'#aaffd4');g.addColorStop(1,'#68eab400');c.fillStyle=g;c.beginPath();c.arc(head[0],head[1],4.2,0,TAU);c.fill();}const breath=Math.sin(p*Math.PI),g=c.createRadialGradient(0,0,b.radius*.3,0,0,b.radius);g.addColorStop(0,'#76f5b900');g.addColorStop(.6,'#80edba22');g.addColorStop(1,'#c0ffe2');c.globalAlpha=breath*.4;c.fillStyle=g;c.beginPath();c.arc(0,0,b.radius,0,TAU);c.fill();});c.restore();},
  strike(r,f,blocked){const c=r.ctx,t=f.age,p=clamp(t/.22),a=f.angle||0,x=f.x-Math.cos(a)*17,y=f.y-Math.sin(a)*17;if(p>=1)return;local(c,x,y,a,()=>{const burst=1-Math.exp(-t*65),h=11+burst*13,thick=3+Math.sin(p*Math.PI)*5,fade=(1-p)**1.8;c.globalAlpha=fade*(blocked?.5:1);const g=c.createLinearGradient(-6,0,thick+7,0);g.addColorStop(0,'#81bbda00');g.addColorStop(.4,'#d1efff');g.addColorStop(.72,'#f5fcff');g.addColorStop(1,'#81c9ec00');c.beginPath();c.moveTo(-4,-h);c.bezierCurveTo(thick+8,-h*.5,thick+8,h*.5,-4,h);c.bezierCurveTo(2,h*.35,2,-h*.35,-4,-h);c.fillStyle=g;c.fill();for(let i=0;i<5;i++){const side=i%2?1:-1,at=(i*.41+.2)*side,rr=6+burst*(10+i*2),pts=[];for(let j=0;j<=20;j++){const u=j/20,ang=at+(u-.5)*.95;pts.push([Math.cos(ang)*rr*.55,Math.sin(ang)*rr]);}c.globalAlpha=fade*(i<2?.65:.3);ribbon(c,pts,(i<2?1.7:.9)*(1-p),'#d5efff');}});},
  body(r,b,e){if(!this.owns(b))return;const c=r.ctx,t=e.time,level=this.level(b,e),heavy=e.effects.find(f=>f.kind==='roster'&&f.owner===b.id&&['fistHit','guardImpact'].includes(f.style)&&f.age<.18),release=heavy?1-ease(heavy.age/.18):0,full=clamp((level-2)/1),energy=Math.max(level/3,release),awake=b.awakening.active,opening=awake?1-ease((t-b.awakening.activatedAt)/.55):0;if(energy<.01&&!awake)return;
   c.save();c.translate(b.x,b.y);c.lineCap='round';this.surface(c,b,level,t,release);
   if(awake){const pulse=.5+.5*Math.sin(t*3.4),g=c.createRadialGradient(-6,-7,3,0,0,b.radius);g.addColorStop(0,'#c2e6ff00');g.addColorStop(.7,'#b5dfff00');g.addColorStop(1,'#c7edff');c.globalAlpha=.14+.13*pulse+.22*opening;c.fillStyle=g;c.beginPath();c.arc(0,0,b.radius,0,TAU);c.fill();}
   c.restore();
   for(const gain of e.effects)if(gain.kind==='regularFeel'&&gain.style==='chargeGain'&&gain.owner===b.id&&gain.age<.28){const p=clamp(gain.age/.28),rr=b.radius+10*(1-ease(p));local(c,b.x,b.y,gain.angle,()=>{c.globalAlpha=Math.sin(p*Math.PI)*.65;for(const side of [-1,1]){const pts=[];for(let j=0;j<=20;j++){const u=j/20,a=side*(.5+u*.85),rad=rr-4*u;pts.push([Math.cos(a)*rad,Math.sin(a)*rad]);}ribbon(c,pts,1.5*(1-p*.5),'#b4e3ff','#f6fdff');}});}
   if(awake)this.awakened(c,b,t);
   const heal=b.awakening.normalRecovery;if(heal&&e.time-heal.started<.78)this.recovery(r,b,e,{age:Math.max(0,e.time-heal.started),life:.78});

  },
  impact(r,f,heavy=false,blocked=false){if(heavy)return this.strike(r,f,blocked);const c=r.ctx,p=clamp(f.age/f.life),drive=1-Math.exp(-p*10),fade=(1-p)**1.5;if(p>=1)return;c.save();this.flow(c,f.x+Math.cos(f.angle)*drive*(heavy?22:5),f.y+Math.sin(f.angle)*drive*(heavy?22:5),f.angle,(heavy?29:12)+drive*(heavy?17:5),(heavy?68:29)+drive*(heavy?36:13),p,fade*(blocked?.42:heavy?1.25:.8));
   local(c,f.x,f.y,f.angle,()=>{if(p<.22){c.globalAlpha=(1-p/.22)*(blocked?.45:.9);const g=c.createRadialGradient(0,0,0,0,0,heavy?18:8);g.addColorStop(0,'#f3fcff');g.addColorStop(.3,'#c5e8ffb0');g.addColorStop(1,'#a9dfff00');c.fillStyle=g;c.beginPath();c.ellipse(0,0,heavy?9:4,heavy?20:9,0,0,TAU);c.fill();}for(let i=0;i<(heavy?7:3);i++){const a=(i*.618%1-.5)*1.7,speed=heavy?65:26,d=5+drive*speed*(.65+i%3*.17),len=(heavy?11:5)*(1-p),y=Math.sin(a)*d;c.globalAlpha=fade*(i%2?.65:.4);const pts=[[Math.cos(a)*d-len,y-Math.sin(a)*len],[Math.cos(a)*d,y],[Math.cos(a)*d+2,y+Math.sin(a)*2]];ribbon(c,pts,heavy?.85:.5,'#d6efff');}});c.restore();
  },
  wave(r,w){const p=clamp(w.travel/w.reach),c=r.ctx,birth=.22+.78*ease(w.travel/48),fade=1-ease((p-.72)/.28);this.flow(c,w.x,w.y,w.angle,w.width*(.85+p*.22),40+Math.min(46,w.travel*.55),p,birth*fade*1.2);},
  pursuit(r,f){const p=clamp(f.age/f.life),c=r.ctx;for(const side of [-1,1]){const a=f.angle+Math.PI+side*.52;this.flow(c,f.x-Math.cos(f.angle)*8,f.y-Math.sin(f.angle)*8,a,10+ease(p)*8,24+ease(p)*23,p,Math.sin(Math.PI*clamp(p*1.7))*(1-p)*.65);}},
  slip(b,e){return e.effects.find(f=>f.kind==='regularFeel'&&f.style==='pursuitSlip'&&f.owner===b.id&&f.age<f.life);},
  trailMix(b,e){if(!this.owns(b))return 1;const f=this.slip(b,e);return f?ease((f.age-.28)/.18):1;},
  punchPose(b,e){if(!this.owns(b))return null;const f=e.effects.find(f=>f.kind==='roster'&&f.owner===b.id&&['fistHit','guardImpact'].includes(f.style)&&f.age<.14);if(!f)return null;return {angle:f.angle,power:Math.sin(Math.PI*clamp(f.age/.14))*.09};},
  trail(r,b,e){const f=this.slip(b,e);if(!f)return;const fade=1-ease((f.age-.28)/.18),points=[{x:b.x,y:b.y},...(b.trail||[]).slice(0,Math.min(16,Math.ceil(f.age*48)+1))],pts=[];if(points.length<3)return;for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],p=points[i],q=points[i+1],z=points[Math.min(points.length-1,i+2)];for(let j=0;j<8;j++){const u=j/8,u2=u*u,u3=u2*u;pts.push([.5*(2*p.x+(-a.x+q.x)*u+(2*a.x-5*p.x+4*q.x-z.x)*u2+(-a.x+3*p.x-3*q.x+z.x)*u3),.5*(2*p.y+(-a.y+q.y)*u+(2*a.y-5*p.y+4*q.y-z.y)*u2+(-a.y+3*p.y-3*q.y+z.y)*u3)]);}}const c=r.ctx;c.save();c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(b.x+b.radius*.85,b.y);c.arc(b.x,b.y,b.radius*.85,0,TAU);c.clip('evenodd');for(let i=0;i<3;i++){const start=Math.floor(i/3*(pts.length-1)),end=Math.floor((i+1)/3*(pts.length-1)),p=pts[start],q=pts[end],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<1)continue;this.flow(c,(p[0]+q[0])*.5,(p[1]+q[1])*.5,Math.atan2(p[1]-q[1],p[0]-q[0]),12-i*2,d+19,f.age*2+i*.25,fade*(.78-i*.17));}c.restore();}

 };

 const V=G.RegularDuelView={
  regular,
  hit(b,h,e){if(!regular(b)||h.actual+h.blocked<=0)return;const angle=h.angle??(h.impact?Math.atan2(h.impact.ny,h.impact.nx):Math.atan2(h.target.y-b.y,h.target.x-b.x));if(b.type==='normal'&&h.kind==='contact'&&(chargeGains.get(h)||0)>0){e.effects.push({kind:'regularFeel',style:'chargeGain',owner:b.id,angle,delta:chargeGains.get(h),age:0,life:.28});}if(b.type==='normal'&&h.kind==='contact'&&!h.heavyContact)e.effects.push({kind:'regularFeel',style:'touch',owner:b.id,x:(b.x+h.target.x)/2,y:(b.y+h.target.y)/2,angle,age:0,life:.22,blocked:h.actual<=0});if(b.type==='vampire'&&h.kind==='chain')e.effects.push({kind:'regularFeel',style:'pulse',owner:b.id,target:h.target.id,x:h.target.x,y:h.target.y,angle,age:0,life:.27,blocked:h.actual<=0});},
  healed(b,heal,hits,e){if(b.type!=='vampire'||!regular(b))return false;const sources=hits.filter(h=>h.source===b&&h.actual>0&&['contact','chain','bloodFinish','hunt'].includes(h.kind));if(!sources.length)return false;e.effects.push({kind:'regularFeel',style:'return',owner:b.id,origins:sources.map(h=>({x:h.target.x,y:h.target.y})),x:b.x,y:b.y,age:0,life:.42,amount:heal,chain:sources.every(h=>['chain','bloodFinish'].includes(h.kind))});return true;},
  detach(b,e){if(!regular(b))return;const t=G.World.targetFor(b,e);if(t)e.effects.push({kind:'regularFeel',style:'detach',owner:b.id,x:b.x,y:b.y,endX:t.x,endY:t.y,age:0,life:.18});},
  // Small advected density field: air remains hollow, with isolated pressure ridges.
  air(c,x,y,angle,span,length,p,power=1){local(c,x,y,angle,()=>{const W=112,H=100;let cv=this.airCanvas;if(!cv){cv=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(W,H):root.document?.createElement?.('canvas');if(!cv)return;cv.width=W;cv.height=H;this.airCanvas=cv;}const ctx=cv.getContext('2d'),data=this.airImage||(this.airImage=ctx.createImageData(W,H)),px=data.data;px.fill(0);for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){const xx=(ix/W-.7)*length,yy=(iy/H-.5)*span*2.4,yn=yy/span,front=8-yn*yn*10,dist=xx-front,wrap=Math.sin(yy*.18-xx*.1-p*12)*2.8,body=Math.exp(-(((dist-wrap)/(8+power*3))**2)-yn*yn*1.8),fold=(.5+.5*Math.sin(yy*.38+xx*.12-p*18))**9,holes=.25+.75*(.5+.5*Math.sin(yy*.18-xx*.21+p*8)),tail=Math.exp(-(((xx+length*.23)/(length*.4))**2)-yn*yn*2.5)*(.5+.5*Math.sin(yy*.35+xx*.22-p*19))**12,den=(body*(.27+fold*.9)*holes+tail*.3)*clamp((xx+length*.7)/20),k=(iy*W+ix)*4,hot=clamp(den*1.7);px[k]=166+hot*87;px[k+1]=205+hot*50;px[k+2]=220+hot*35;px[k+3]=Math.min(225,den*300)*power;}ctx.putImageData(data,0,0);c.drawImage(cv,-length*.7,-span*1.2,length,span*2.4);});},
  wave(r,w,e){if(e.balls.find(b=>b.id===w.owner)?.type==='normal')return N.wave(r,w);const p=clamp(w.travel/w.reach),c=r.ctx;c.save();c.globalAlpha=1-p*.7;this.air(c,w.x,w.y,w.angle,w.width*(.8+p*.3),65+p*25,p,1.15);c.restore();},
  ready(r,b,e){if(b.type==='normal')return true;if(!regular(b))return false;const c=r.ctx,a=Math.atan2(b.vy,b.vx),p=(e.time*.8)%1;this.air(c,b.x+Math.cos(a)*21,b.y+Math.sin(a)*21,a,23,37,p,.48);return true;},
  pursuit(r,f){return N.pursuit(r,f);},
  warning(r,b,e){if(!regular(b))return false;const t=G.World.targetFor(b,e);if(!t)return true;const pose=this.pactPose(b,t,e),c=r.ctx;local(c,b.x,b.y,pose.angle,()=>{c.globalAlpha=.35+.6*pose.progress;this.conduit(c,pose.start,pose.end,e.time,pose.energy);});return true;},
  pactPose(b,target,e,pulse=0){const d=Math.hypot(target.x-b.x,target.y-b.y),warning=b.role.chainWarning>e.time,age=Math.max(0,e.time-b.awakening.chainStartedAt),progress=warning?ease(1-(b.role.chainWarning-e.time)/.25):1,start=b.radius+1,finish=Math.max(start,d-target.radius-1),blend=warning?0:ease(age/.085);return{start,end:start+(finish-start)*progress,angle:Math.atan2(target.y-b.y,target.x-b.x),progress,energy:warning?.25+.6*progress:.85+(.45+pulse*.2)*blend};},
  conduit(c,start,end,t,energy=1,hotX=-1){
   const len=end-start;if(len<1||energy<=0)return;
   const W=144,H=64;let cv=this.pactCanvas;
   if(!cv){cv=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(W,H):root.document?.createElement?.('canvas');if(cv){cv.width=W;cv.height=H;this.pactCanvas=cv;}}
   if(!cv){this.thread(c,start,end,7*energy,'#9c214c');this.thread(c,start,end,2*energy,'#ffa08d');return;}
   const ctx=cv.getContext('2d'),data=this.pactImage||(this.pactImage=ctx.createImageData(W,H)),px=data.data;px.fill(0);
   // Three advecting value planes occupy distinct cross-sections. The axis
   // remains straight; shear belongs to the sheath and its exposed folds.
   for(let ix=0;ix<W;ix++){
    const u=ix/(W-1),edge=Math.min(.08,4/len),envelope=.93*ease(u/edge)*ease((1-u)/edge),drift=u*len*.085+t*8.5;
    const packet=hotX<0?0:Math.exp(-(((u-hotX)/.14)**2));
    for(let iy=0;iy<H;iy++){
     const y=(iy/(H-1)-.5)*2,warp=Math.sin(u*15+y*5+t*6)*.12+Math.sin(u*37-y*9+t*11)*.065;
     const outside=(.57+.08*Math.sin(u*19+t*3)+.055*Math.sin(u*43-t*7))*envelope;
     const exterior=clamp((outside-Math.abs(y+warp*.4))*14);
     if(exterior<.003)continue;
     const fold=(.5+.5*Math.sin(drift+y*7+.85*Math.sin(u*23-y*8+t*4)))**7;
     const split=.5+.5*Math.sin(u*29-y*12+t*8.2);
     const middleWidth=(.27+.09*fold+.035*Math.sin(u*31+t*6))*envelope;
     const middle=clamp((middleWidth-Math.abs(y+warp*.36))*24);
     const gap=.4+.6*split,outerAlpha=exterior*(.22+.35*fold)*gap;
     const filament=(.5+.5*Math.sin(u*35+y*21+t*13+Math.sin(u*16-y*13)))**18*exterior*(1-middle);
     let red=89+filament*90,green=30+filament*31,blue=143+filament*77,alpha=outerAlpha+filament*.26;
     if(middle>0){
      const plane=.3+.7*fold,shade=.75+.25*split;
      const bodyR=(166+plane*69)*shade,bodyG=27+plane*17,bodyB=65+plane*26;
      red+=(bodyR-red)*middle;green+=(bodyG-green)*middle;blue+=(bodyB-blue)*middle;alpha=Math.max(alpha,middle*(.8+.16*fold));
      const ridge=clamp((.075*envelope-Math.abs(y+warp*.11))*37)*(.18+.75*fold+packet*.75);
      const heat=clamp(ridge)*middle;
      red+=(255-red)*heat;green+=(153+packet*66-green)*heat;blue+=(112+packet*61-blue)*heat;
     }
     const k=(iy*W+ix)*4;px[k]=red;px[k+1]=green;px[k+2]=blue;px[k+3]=clamp(alpha)*255;
    }
   }
   ctx.putImageData(data,0,0);const half=20*energy;c.drawImage(cv,start,-half,len,half*2);
  },
  thread(c,start,end,width,color,core){if(end-start<.1)return;const mid=(start+end)/2;fill(c,[[start,0],[start+Math.min(10,(end-start)*.2),-width*.65],[mid,-width],[end,0],[mid,width*.8],[start+Math.min(8,(end-start)*.2),width*.5]],color);if(core&&end-start>6){c.beginPath();c.moveTo(start+3,-width*.2);c.lineTo(end-3,-width*.2);c.strokeStyle=core;c.lineWidth=.65;c.stroke();}},
  chain(r,b,t,e){if(!regular(b))return false;const c=r.ctx,slack=b.role.chainOutSince>=0?clamp((e.time-b.role.chainOutSince)/.12):0;let pulse=0,hotX=-1;
   for(const f of e.effects)if(f.kind==='regularFeel'&&f.style==='pulse'&&f.owner===b.id){const q=clamp(f.age/f.life);pulse=Math.max(pulse,Math.sin(Math.PI*q));hotX=1-ease(q);}
   local(c,b.x,b.y,Math.atan2(t.y-b.y,t.x-b.x),()=>{c.globalAlpha=1-slack*.65;const pose=this.pactPose(b,t,e,pulse);this.conduit(c,pose.start,pose.end,e.time,pose.energy,hotX);});return true;},
  effect(r,f,e){const b=e.balls.find(b=>b.id===f.owner);if(!regular(b))return false;const normal=b.type==='normal'&&['fistHit','fistWave','guardImpact'].includes(f.style),vamp=b.type==='vampire'&&['bloodMark','bloodConnect','bloodFinish'].includes(f.style);if(!normal&&!vamp)return false;const c=r.ctx,p=clamp(f.age/f.life);if(f.style==='bloodConnect')return true;if(f.style==='bloodFinish'){local(c,f.x,f.y,(f.angle||0)+Math.PI,()=>{c.globalAlpha=(1-p)**1.2;this.conduit(c,23,23+30*(1-ease(p)),p*2,1.35*(1-p));for(const [offset,y]of [[9,-5],[0,3],[-8,-2]]){const x=24+p*58+offset;fill(c,[[x-11,y],[x+9,y*.6],[x-3,y-2*(1-p)]],'#f99ab2');}if(p<.16){c.globalAlpha*=1-p/.16;fill(c,[[-7,0],[0,-9],[3,-2],[14,0],[2,3],[0,7],[-2,2]],'#ffe4d3');}});return true;}c.save();c.globalAlpha=(1-p)**1.3;
   if(normal){c.restore();if(f.style==='fistWave'&&e.waves.some(w=>w.kind==='fistWave'&&w.owner===b.id&&Math.hypot(w.originX-f.x,w.originY-f.y)<5))return true;N.impact(r,f,f.style!=='fistWave',f.style==='guardImpact');return true;}
   local(c,f.x,f.y,f.angle||0,()=>{const reach=8+ease(p)*14;for(let i=0;i<3;i++){const a=i*2.399+.4,rr=reach+5*Math.sin(i*3);drop(c,Math.cos(a)*rr,Math.sin(a)*rr,2.8*(1-p*.6),a);}});c.restore();return true;},
  front(r,e){const c=r.ctx;for(const b of e.balls)N.body(r,b,e);for(const b of e.balls){if(b.type!=='normal'||b.hp<=0||!regular(b)||!N.slip(b,e))continue;N.trail(r,b,e);}

   for(const f of e.effects){if(f.kind!=='regularFeel')continue;const b=e.balls.find(b=>b.id===f.owner);if(!regular(b))continue;const p=clamp(f.age/f.life);c.save();if(f.style==='touch'){N.impact(r,f,false,f.blocked);}
    if(f.style==='return'&&b.hp>0){if(f.chain){const a=f.origins[0],angle=Math.atan2(a.y-b.y,a.x-b.x);local(c,b.x,b.y,angle,()=>{c.globalAlpha=Math.sin(Math.PI*p)**.7;this.conduit(c,b.radius-3,b.radius+18*(1-p),p*2.4,.7,0);const outer=b.radius-1,inner=outer-5;c.beginPath();c.arc(0,0,outer,-.68,.68);c.arc(0,0,inner,.68,-.68,true);c.closePath();const absorbed=c.createLinearGradient(inner,0,outer,0);absorbed.addColorStop(0,'#d23e6b00');absorbed.addColorStop(.65,'#fa866d');absorbed.addColorStop(1,'#ffe2c0');c.fillStyle=absorbed;c.fill();});c.restore();continue;}for(let j=0;j<f.origins.length;j++){const a=f.origins[j],q=ease(p),pts=[];for(let i=0;i<=25;i++){const u=clamp(q-.19+i/25*.19);pts.push(path(a,b,u,20+9*j));}c.globalAlpha=Math.sin(Math.PI*p)**.5;ribbon(c,pts,2.8,'#b83150','#ffb5ad');const at=path(a,b,q,20+9*j),ahead=path(a,b,clamp(q+.01),20+9*j);drop(c,at[0],at[1],3.1*(1-p*.6),Math.atan2(ahead[1]-at[1],ahead[0]-at[0]));}if(p>.45){c.globalAlpha=Math.sin((p-.45)/.55*Math.PI)*.8;local(c,b.x,b.y,Math.atan2(f.origins[0].y-b.y,f.origins[0].x-b.x),()=>{const pts=[];for(let i=0;i<=22;i++){const a=-.85+i/22*1.7;pts.push([Math.cos(a)*(b.radius+2),Math.sin(a)*(b.radius+2)]);}ribbon(c,pts,2.5,'#e95d70','#ffe0c6');});}}
    if(f.style==='detach'){const d=Math.hypot(f.endX-f.x,f.endY-f.y),q=1-ease(p);local(c,f.x,f.y,Math.atan2(f.endY-f.y,f.endX-f.x),()=>{c.globalAlpha=(1-p)**1.4;const reach=d*.45*q;this.conduit(c,b.radius+1,Math.max(b.radius+1,reach),p*1.8,q*1.35);this.conduit(c,Math.min(d-25,d-reach),d-25,p*1.8,q*1.35);for(const [u,len]of [[.42,8],[.53,5],[.59,3]]){const x=d*u+p*11;fill(c,[[x-len,0],[x+len,1-p],[x,-2*(1-p)]],'#ef8fa8');}});}
    c.restore();}
  }
 };
 const pursue=G.Pursuit.perform;G.Pursuit.perform=function(b,t,e){const result=pursue.call(this,b,t,e);if(N.owns(b))e.effects.push({kind:'regularFeel',style:'pursuitSlip',owner:b.id,age:0,life:.46});return result;};
 const normalHit=G.Roles.normalHit;G.Roles.normalHit=function(b,h,e){const before=b.charges,result=normalHit.call(this,b,h,e);chargeGains.set(h,Math.max(0,b.charges-before));return result;};
 const awaken=G.Awakening.activate;G.Awakening.activate=function(b,e){const start=e.effects.length,fresh=!b.awakening.active,result=awaken.call(this,b,e);if(fresh&&N.owns(b))for(let i=start;i<e.effects.length;i++){const f=e.effects[i];if(['ring','particle'].includes(f.kind))f.regularImpact=true;if(f.kind==='signature'&&f.style==='awaken'&&f.owner===b.id)f.regularNormalAwaken=true;}return result;};
})(typeof window!=='undefined'?window:globalThis);

// Shared reflector presentation. Reads native stance/projectile clocks in every mode.
(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
 function stroke(c,pts,color,w){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=w;c.stroke();}
 function plate(c,r,span,power=1,open=1){
  const h=2.8,tip=r+.5+open*3.8;
  c.beginPath();c.moveTo(r-1,-h);c.lineTo(r+1,-h*.72);c.lineTo(tip,0);c.lineTo(r+1,h*.72);c.lineTo(r-1,h);c.lineTo(r,0);c.closePath();
  const g=c.createLinearGradient(r,-h,tip,h);g.addColorStop(0,'#54416f');g.addColorStop(.6,'#8f75b7');g.addColorStop(1,'#c6a6e3');c.fillStyle=g;c.fill();c.strokeStyle='#c9b1e6';c.lineWidth=.65;c.stroke();
  c.beginPath();c.moveTo(r-1,-h);c.lineTo(r+1,-h*.72);c.lineTo(tip,0);c.lineTo(r,0);c.closePath();c.fillStyle='#c0a6e1';c.fill();stroke(c,[[r,0],[tip,0]],power>.6?'#fff0ff':'#e6d0fa',power>.6?1.15:.65);
 }
 function chip(c,x,y,a,size=1,light=false){c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);c.beginPath();c.moveTo(8,0);c.lineTo(1,-4);c.lineTo(-6,-2);c.lineTo(-8,1);c.lineTo(-1,4);c.closePath();c.fillStyle=light?'#b38ad9':'#8562af';c.fill();c.beginPath();c.moveTo(8,0);c.lineTo(1,-4);c.lineTo(-6,-2);c.lineTo(-1,0);c.closePath();c.fillStyle='#e9d5fa';c.fill();stroke(c,[[-6,-2],[-1,0],[8,0]],'#fff0ff',.7);c.restore();}
 const V=G.ReflectorView={
  awaken(r,f,e){const c=r.ctx,b=e.balls.find(v=>v.id===f.owner),p=clamp(f.age/f.life);c.save();c.translate(f.follow&&b?b.x:f.x,f.follow&&b?b.y:f.y);c.globalAlpha=Math.sin(Math.PI*p)**.6;for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6+.12);const x=25+(1-p)**2*23;chip(c,x,0,0,.24+.18*p,true);stroke(c,[[24,0],[30+p*10,-2]],'#ddc4f4',1.2*(1-p));c.restore();}c.restore();},
  receive(b,h,e){if(e.effects.some(f=>f.kind==='roster'&&f.style==='reflectReceive'&&f.owner===b.id&&f.age<.08))return;e.effects.push({kind:'roster',style:'reflectReceive',owner:b.id,x:b.x,y:b.y,angle:b.role.counterAngle,color:b.def.color,age:0,life:.22});},
  stance(r,b,e){const c=r.ctx,s=b.stance,a=s.phase==='active',w=s.phase==='warning',ready=b.role.predictReady||G.DefenseArcana?.predictionReady(b,e),exit=!a&&!w&&e.time>=s.until?clamp(1-(e.time-s.until)/.18):0;if(!a&&!w&&!ready&&!exit)return true;
   const opening=a&&e.effects.find(f=>f.kind==='roster'&&f.style==='mirrorCatch'&&f.owner===b.id&&f.age<.14),q=w?clamp(1-(s.until-e.time)/b.def.stanceWarning):a?(opening?clamp(opening.age/.14):1):exit||.22,p=q*q*(3-2*q),energy=clamp(s.stored/(8*e.heatMultiplier));c.save();c.translate(b.x,b.y);c.lineJoin='round';
   // One independent annular armour shell; short teeth belong to its rim.
   const inner=b.radius+1.5,outer=inner+1.3,teeth=16,height=.6+3.8*p;
   c.globalAlpha=a?.85+energy*.15:ready?.5:clamp(p*1.6);
   c.beginPath();for(let i=0;i<teeth;i++){const angle=.12+i*TAU/teeth;for(const [offset,rad]of [[-.5,outer],[-.17,outer],[0,outer+height],[.17,outer],[.5,outer]]){const t=angle+offset*TAU/teeth,x=Math.cos(t)*rad,y=Math.sin(t)*rad;if(!i&&offset===-.5)c.moveTo(x,y);else c.lineTo(x,y);}}c.closePath();c.moveTo(inner,0);c.arc(0,0,inner,0,TAU,true);
   const shell=c.createLinearGradient(-outer,-outer,outer,outer);shell.addColorStop(0,'#e4cbff');shell.addColorStop(.35,'#a78ac9');shell.addColorStop(.6,'#645080');shell.addColorStop(1,'#c6a6e2');c.fillStyle=shell;c.fill('evenodd');c.strokeStyle='#dcc0f3';c.lineWidth=.65;c.stroke();
   for(let i=0;i<teeth;i++){c.save();c.rotate(.12+i*TAU/teeth);stroke(c,[[outer-.8,-1],[outer+height,0]],i%3===0?'#fff0ff':'#c8a8e8',.7+energy*.35);c.restore();}
   if(energy>0){c.beginPath();c.arc(0,0,outer+height+1.4,-Math.PI/2,-Math.PI/2+TAU*energy);c.strokeStyle='#d9b8ff';c.lineWidth=2;c.stroke();}c.restore();return true;
  },
  aim(r,b,e){if(!b.role.counterRelease)return false;const c=r.ctx,p=clamp(1-(b.role.counterFireAt-e.time)/.18);c.save();c.translate(b.x,b.y);c.rotate(b.role.counterAngle);for(let i=0;i<3;i++){const side=i-1;c.globalAlpha=.35+p*.6;chip(c,26+6*p,side*10*(1-p),side*(1-p)*.5,.35+p*.12);}c.restore();return true;},
  flyer(r,p){if(p.mode!=='counter')return false;const c=r.ctx;c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));const glow=c.createRadialGradient(0,0,2,0,0,25);glow.addColorStop(0,'#efd8ff9a');glow.addColorStop(.42,'#bb82e94a');glow.addColorStop(1,'#9a61d300');c.fillStyle=glow;c.fillRect(-25,-25,50,50);
   const trail=c.createLinearGradient(-36,0,-7,0);trail.addColorStop(0,'#a477d300');trail.addColorStop(1,'#d9b5f7ba');stroke(c,[[-36,0],[-7,0]],trail,4);chip(c,0,0,0,1.6,true);stroke(c,[[-5,-1],[10,0]],'#fff7ff',1.3);chip(c,-19,-4,-.2,.43);chip(c,-27,4,.15,.33);c.restore();return true;
  },
  impact(c,x,y,a,p){const d=1-Math.exp(-p*7);c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=(1-p)**1.5;
   const glow=c.createRadialGradient(0,0,1,0,0,65);glow.addColorStop(0,'#efd5ff99');glow.addColorStop(.35,'#a363d84a');glow.addColorStop(1,'#8544c000');c.fillStyle=glow;c.fillRect(-65,-65,130,130);
   for(let i=0;i<6;i++){const a=-1.1+i*.43,x=3+Math.cos(a)*d*(18+i*2),y=Math.sin(a)*d*(23+i*2);chip(c,x,y,a+p*(i%2?2:-2),.2+(i%3)*.08,i%2===0);stroke(c,[[x,y],[x-Math.cos(a)*7,y-Math.sin(a)*7]],'#c59bea',.65);}if(p<.24){stroke(c,[[-8,0],[12,0]],'#fff2ff',2*(1-p/.24));stroke(c,[[0,-10],[1,8]],'#e9d3ff',1.4*(1-p/.24));}c.restore();
  },
  effect(r,f){if(!['mirrorStrike','mirrorCatch','mirrorRelease','reflectReceive'].includes(f.style))return false;const c=r.ctx,p=clamp(f.age/f.life);if(f.style==='mirrorStrike'){this.impact(c,f.x,f.y,f.angle,p);return true;}c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);c.globalAlpha=(1-p)**.7;
   if(f.style==='reflectReceive'){plate(c,25,.35,1);for(let i=0;i<4;i++){const side=i%2?1:-1,x=34+p*(12+i*5),y=side*(3+p*(5+i*3));stroke(c,[[x,y],[x-4,y-side*2]],i%2?'#d1a3f5':'#fff0ff',i===0?1.7:.8);}}
   else if(f.style==='mirrorCatch'){for(let i=0;i<16;i++){c.save();c.rotate(i*TAU/16+.12-(f.angle||0));stroke(c,[[26,-.6],[27+3.2*clamp(p/.5),0]],'#f6e4ff',.8*(1-p));c.restore();}}
   else{for(let i=0;i<3;i++){const side=i-1;chip(c,24+p*16,side*(4+p*8),side*p,.35*(1-p)+.12,true);stroke(c,[[18,side*3],[29+p*14,side*(4+p*8)]],'#cba7ec',.9*(1-p));}}c.restore();return true;
  }
 };

})(typeof window!=='undefined'?window:globalThis);

