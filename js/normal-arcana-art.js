(function(root){
 'use strict';const G=root.OrbDuel,V=G.ArcanaView,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const owned=(f,e)=>e.balls.some(b=>b.id===f.owner&&b.type==='normal');
 const styles=new Set(['blink','fist','fistPose','fistImpact']);
 function age(f,e){return Math.max(f.age||0,(e.presentationTime||0)-(f.bornReal||0));}
 function line(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function band(c,pts,width,color){if(pts.length<2||width<=0)return;const sides=[[],[]];for(let i=0;i<pts.length;i++){const p=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=width*Math.sin(Math.PI*i/(pts.length-1))**.6;sides[0].push([p[0]-dy/len*w,p[1]+dx/len*w]);sides[1].push([p[0]+dy/len*w*.55,p[1]-dx/len*w*.55]);}c.beginPath();[...sides[0],...sides[1].reverse()].forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=color;c.fill();}
 function curve(c,x,y,len,span,width,color,phase=0){const pts=[];for(let i=0;i<=28;i++){const q=i/28,a=(q-.5)*Math.PI*.92;pts.push([x+Math.cos(a)*len+Math.sin(q*9+phase)*2,y+Math.sin(a)*span]);}band(c,pts,width,color);}
 function local(c,x,y,a,fn){c.save();c.translate(x,y);c.rotate(a);fn();c.restore();}
 function shape(c,commands,color,rule){c.beginPath();for(const [op,...v]of commands)c[op](...v);if(color){c.fillStyle=color;c.fill(rule||'nonzero');}}
 function strokeShape(c,commands,color,width){shape(c,commands);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 const N=G.NormalArcanaView={
  live(e){return e.state==='running'||e.state==='paused';},
  flowAlpha(q){return Math.sin(Math.PI*clamp(q))**.8;},
  aim(b,e){const t=e.balls.find(t=>t.id===b.arcana?.target);return b.arcana?.phase==='warning'&&t?Math.atan2(t.y-b.y,t.x-b.x):(b.arcana?.aim||0);},
  subtitleY(e,b,base,index){const top=28+index*31,low=base;if(!e||!b)return top;const t=e.balls.find(t=>t.id===b.arcana?.target),actors=[b,t].filter(Boolean),cost=y=>actors.reduce((n,a)=>n+(Math.abs(a.y-y)<a.radius+28?1:0),0);return cost(low)<cost(top)?low:top;},
  pose(b,e){const f=e.effects.find(f=>f.kind==='arcana'&&f.owner===b.id&&f.style==='fistPose');return f?clamp(age(f,e)/.6):(b.arcana?.phase==='punch'?1:0);},
  hideTrail(b){return b.type==='normal'&&['blink','punch','punchRecovery'].includes(b.arcana?.phase);},
  stepProgress(b,e){return clamp(((e.presentationTime||0)-(b.arcana?.stepStartedReal||0))/G.Arcana.stepDuration);},
  displayPosition(b,e){return b.arcana?.phase==='blink'&&b.arcana.stepRoute?G.Arcana.stepPosition(b.arcana.stepRoute,this.stepProgress(b,e)):{x:b.x,y:b.y};},
  background(r,e){if(!this.live(e))return;const b=e.balls.find(b=>b.type==='normal'&&['blink','punch'].includes(b.arcana?.phase)),hit=e.effects.find(f=>f.kind==='arcana'&&f.style==='fistImpact'&&owned(f,e)&&age(f,e)<.55);if(!b&&!hit)return;const p=b?this.displayPosition(b,e):hit,c=r.ctx,power=b?.arcana.phase==='blink'?.48:b?.arcana.phase==='punch'?.62:.3*(1-age(hit,e)/.55);c.save();c.globalAlpha=power;c.fillStyle='#020913';c.fillRect(0,0,G.Constants.width,G.Constants.height);const g=c.createRadialGradient(p.x,p.y,8,p.x,p.y,135);g.addColorStop(0,'#2f93b855');g.addColorStop(.4,'#153c4c22');g.addColorStop(1,'#07132100');c.fillStyle=g;c.fillRect(0,0,G.Constants.width,G.Constants.height);c.restore();},
  charge(c,b,e,released=null){const pose=b.arcana.phase==='punch',p=released===null?this.pose(b,e):1;if(!pose&&released===null)return;const travel=released===null?0:released,drain=1-ease(travel/.16);if(drain<=0)return;
   local(c,b.x,b.y,this.aim(b,e),()=>{const q=ease(p),t=p*.6+travel,F=b.radius+4+q*3;c.translate(68*(1-Math.exp(-travel*17)),0);
    // Density advects inward along curved stream tubes; the compressed face is
    // broken and transparent rather than a solid crescent, glove or barrier.
    const W=112,H=112,left=-38,top=-56;let canvas=this.chargeCanvas;
    if(!canvas){canvas=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(W,H):root.document?.createElement?.('canvas');if(canvas){canvas.width=W;canvas.height=H;this.chargeCanvas=canvas;}}
    if(canvas){const ctx=canvas.getContext('2d'),data=this.chargeImage||(this.chargeImage=ctx.createImageData(W,H)),px=data.data;px.fill(0);
     for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){const x=left+ix,y=top+iy,ax=x-F,spread=40-q*13+travel*140,ny=y/spread,front=F+7-ny*ny*10,dx=x-front,bulge=Math.exp(-dx*dx/(18-q*7+travel*70)**2-y*y/(spread*spread)),edge=clamp((x+30)/22),warp=Math.sin(y*.15+t*13)+.45*Math.sin(x*.23-y*.12+t*19),phase=y*.34+ax*.1+warp,fold=(.5+.5*Math.sin(phase))**8,breakup=.35+.65*(.5+.5*Math.sin(x*.25-y*.15-t*24)),face=Math.exp(-dx*dx/10)*Math.exp(-y*y/(spread*spread*.72)),d=(bulge*(.12+fold*1.2*breakup)+face*.62)*edge*ease(p/.18);if(d<.004)continue;const k=(iy*W+ix)*4,hot=clamp(d*1.5);px[k]=170+hot*83;px[k+1]=211+hot*43;px[k+2]=231+hot*24;px[k+3]=Math.min(210,d*(350+q*190)*drain);}
     ctx.putImageData(data,0,0);c.drawImage(canvas,left,top,W,H);
    }
    // Three unequal packets approach the compression point along the body.
    // Each contracts and dissolves separately, with no permanent surrounding arc.
    for(let i=0;i<3;i++){const u=(p*1.35+travel*2+i*.317)%1,side=i===1?-1:1,span=(24+i*5)*(1-u*.65),pts=[];for(let j=0;j<=24;j++){const v=j/24,x=-25+(F+27)*v+u*5,y=side*(span*Math.sin(v*Math.PI*.85)+5)*(1-v*.83);pts.push([x,y]);}c.globalAlpha=Math.sin(u*Math.PI)*ease(p/.15)*(.26+q*.24)*drain;band(c,pts,(1.4+q)*Math.sin(u*Math.PI),i===1?'#e2f6ff':'#91cee9');}
   });},
  blink(c,f,e){const a=age(f,e),duration=f.duration||.42,route=f.route||[{x:f.x,y:f.y},{x:f.endX,y:f.endY}];if(a>duration+.20)return;const b=e.balls.find(b=>b.id===f.owner);if(!b)return;
   for(let i=0;i<route.length-1;i++){const at=i*duration/(route.length-1),passed=a-at;if(passed<0||passed>.34)continue;const p=route[i],end=route[i+1],ang=Math.atan2(end.y-p.y,end.x-p.x),fade=(1-passed/.34)**1.3,stretch=1.05+.35*ease(passed/.12);
    local(c,p.x,p.y,ang,()=>{c.globalAlpha=fade*.58;const g=c.createLinearGradient(-50,0,20,0);g.addColorStop(0,'#6fb8d000');g.addColorStop(.65,'#5296c0aa');g.addColorStop(1,'#d4f1f5');shape(c,[['moveTo',19,0],['bezierCurveTo',7,-19,-25,-21,-58,-8],['quadraticCurveTo',-27,-10,-10,-2],['lineTo',-43,10],['bezierCurveTo',-20,5,6,23,19,0],['closePath']],g);c.save();c.scale(stretch,.87);const ball=c.createRadialGradient(-5,-6,1,0,0,b.radius);ball.addColorStop(0,'#bfe9f7');ball.addColorStop(.65,'#579fd0');ball.addColorStop(1,'#2c547c');c.globalAlpha=fade*.76;c.fillStyle=ball;c.beginPath();c.arc(0,0,b.radius*.88,0,TAU);c.fill();c.globalAlpha=fade*.58;strokeShape(c,[['moveTo',-b.radius*.65,-b.radius*.42],['bezierCurveTo',-b.radius*1.3,-b.radius*.72,-b.radius*1.8,-b.radius*.25,-b.radius*2.5,-b.radius*.38]],'#b5e8f3',.8);c.fillStyle='#132e46';c.beginPath();c.ellipse(2,0,4,4.5,0,0,TAU);c.fill();strokeShape(c,[['moveTo',8,-15],['bezierCurveTo',21,-8,22,8,8,15]],'#d7f4fa',1.6);c.restore();});
   }
   // Arrival tear is an open, crooked pressure cut, not a portal or full ring.
   if(a>duration-.06&&a<duration+.15){const v=ease((a-duration+.06)/.21),end=route.at(-1);local(c,end.x,end.y,f.angle||0,()=>{c.globalAlpha=(1-v)*.8;strokeShape(c,[['moveTo',-15,-37+v*9],['bezierCurveTo',22,-22,24,5,11,15],['quadraticCurveTo',-5,21,-12,35-v*8]],'#bdebf7',2.2);});}
  },
  windFade(a,reach=220){const arrival=Math.max(.14,.16+(reach/1.18-245)/620);return 1-ease((a-arrival-.10)/.30);},
  wallReach(f){const dx=Math.cos(f.angle||0),dy=Math.sin(f.angle||0),C=G.Constants,x=dx>1e-6?(C.width-f.x)/dx:dx<-1e-6?-f.x/dx:Infinity,y=dy>1e-6?(C.height-f.y)/dy:dy<-1e-6?-f.y/dy:Infinity;return Math.max(0,Math.min(x,y));},
  pressureSample(a,x,y,reach=220){
   const drive=1-Math.exp(-a*15),spread=1-Math.exp(-a*20),depart=ease((a-.23)/.48),L=35+drive*216+Math.max(0,a-.16)*620,H=15+spread*125,q=(x+18)/L;
   if(q<=0||q>=1.22)return 0;
   const width=H*(.10+.90*Math.pow(q,.78)),v=y/width,bend=.08*Math.sin(q*9-a*13)+.045*Math.sin(q*19-a*21),z=v+bend;
   if(Math.abs(z)>=1)return 0;
   const wake=depart*(.57+.075*Math.sin(z*6.3+a*8)+.045*Math.sin(z*13-a*11)+.11*z*z),nose=1.18-.17*z*z+.035*Math.sin(z*9-a*7),tail=ease((q-wake)/(.14+.035*Math.sin(z*8+a*9))),cap=ease((nose-q)/.36),envelope=Math.max(0,1-z*z)**.55*cap*tail,swirl=1.25*Math.sin(q*9+z*7-a*14)+.55*Math.sin(q*21-z*13-a*23),phase=z*13+q*8+swirl,breakup=Math.max(0,Math.sin(q*11+z*4-a*19)),streak=(.5+.5*Math.sin(phase))**7*breakup,grain=(.5+.5*Math.sin(q*27-z*23+a*24+swirl))**12*Math.max(0,Math.sin(q*15+z*11-a*18));
   return envelope*(.13+streak*.88+grain*.31)*this.windFade(a,reach);
  },
  pressureTexture(c,a,power,reach=220){
   const scale=1.5,left=-42,top=-210,width=600,height=284;
   let canvas=this.airCanvas;if(!canvas){canvas=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(width,height):root.document?.createElement?.('canvas');if(!canvas)return false;canvas.width=width;canvas.height=height;this.airCanvas=canvas;}const ctx=canvas.getContext('2d');
   const data=this.airImage||(this.airImage=ctx.createImageData(width,height)),pixels=data.data,key=a+'/'+power+'/'+reach;if(this.airCache?.canvas===canvas&&this.airCache.image===data&&this.airCache.key===key){c.drawImage(canvas,left,top,width*scale,height*scale);return true;}pixels.fill(0);const right=Math.min(width,Math.ceil((35+(1-Math.exp(-a*15))*216+Math.max(0,a-.16)*620)*1.22/scale)+40);
   for(let y=0;y<height;y++)for(let x=0;x<right;x++){const density=this.pressureSample(a,left+x*scale,top+y*scale,reach)*ease(Math.min(x,y,width-1-x,height-1-y)/14);if(density<.004)continue;const at=(y*width+x)*4,hot=clamp((density-.12)/.36);pixels[at]=126+hot*106;pixels[at+1]=177+hot*71;pixels[at+2]=203+hot*49;pixels[at+3]=Math.min(255,density*power*410);}
   ctx.putImageData(data,0,0);this.airCache={canvas,image:data,key};c.drawImage(canvas,left,top,width*scale,height*scale);return true;
  },
  jet(c,a,power=1,reach=220){if(a<0||a>.85)return;c.save();this.pressureTexture(c,a,power,reach);
   const drive=1-Math.exp(-a*12),spread=1-Math.exp(-a*17),depart=ease((a-.20)/.48),F=24+drive*172+Math.max(0,a-.16)*620,H=18+spread*113,fade=this.windFade(a,reach);
   // Slip lines sweep into the pressure layer and dissolve inside it, not rigid spokes.
   for(let i=0;i<11;i++){const flow=(a*2.3+i*.618)%1,side=Math.sin(i*2.399)*.84,start=flow*.65,end=Math.min(.99,start+.19+i%3*.018),pts=[];for(let j=0;j<=18;j++){const q=start+(end-start)*j/18,x=-18+(F+8)*q,y=side*H*Math.pow(q,1.35)+Math.sin(q*8-a*13+i)*3*q;pts.push([x,y]);}c.globalAlpha=power*fade*(.16+.30*Math.sin(flow*Math.PI));line(c,pts,i%3?'#a6cedf':'#e8faff',i%3?.6:1);}
   // Local roll-up is tied to the compressed front, never a giant detached crescent.
   for(let i=0;i<6;i++){const side=[-.82,-.46,-.09,.29,.63,.91][i],u=(a*1.7+i*.173)%1,r=(3+i%3*1.8)*Math.sin(u*Math.PI),x=F*(.42+i%3*.13),y=side*H*(.58+i%2*.1),pts=[];for(let j=0;j<=24;j++){const q=j/24,ang=q*4.9+i*.8,rr=r*(1-q*.8);pts.push([x+Math.cos(ang)*rr,y+Math.sin(ang)*rr]);}c.globalAlpha=power*fade*.44;line(c,pts,'#e2f5fa',.7);}
   if(a<.10){c.globalAlpha=power*(1-a/.10)*.65;for(const [x,h]of [[-4,16],[9,21]]){c.beginPath();c.moveTo(x,-h);c.bezierCurveTo(x+9,-h*.5,x+9,h*.5,x,h);c.strokeStyle='#e7fcff';c.lineWidth=1.2;c.stroke();}}
   c.restore();
  },
  release(c,f,e){const a=age(f,e);if(a>.16)return;const b=e.balls.find(b=>b.id===f.owner);if(!b)return;c.save();for(const t of e.balls){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(t.x+t.radius*.79,t.y);c.arc(t.x,t.y,t.radius*.79,0,TAU);c.clip('evenodd');}this.charge(c,{...b,x:f.x,y:f.y,arcana:{...b.arcana,aim:f.angle}},e,a);c.restore();},
  particleSeed(f){let h=2166136261;for(const ch of String(f.castId||f.owner||'normal'))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;},
  particleCount:38,
  particle(f,i,a){if(i<0||i>=this.particleCount)return null;const seed=this.particleSeed(f),rand=n=>{let h=(seed^Math.imul(i+1,374761393)^Math.imul(n+1,668265263))>>>0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;},late=i>=26,born=late?.11+rand(1)*.08:rand(1)*.07,life=.14+rand(2)*.21,t=a-born;if(t<0||t>life)return null;const angle=(rand(3)-.5)*.85,speed=140+rand(4)*235,drag=(1-Math.exp(-t*3))/3,baseX=late?40+rand(5)*65:rand(5)*12,baseY=(rand(6)-.5)*(late?46:14);return{x:baseX+Math.cos(angle)*speed*drag,y:baseY+Math.sin(angle)*speed*drag,angle,size:.32+rand(7)*.65,stretch:4+rand(8)*9,type:rand(9)<.18?'dot':'streak',alpha:Math.min(1,t/.018)*(1-t/life)**1.5,hot:rand(10)>.6};
  },
  impactParticles(c,f,e){const a=age(f,e);if(a>.6)return;c.save();for(const b of e.balls){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(b.x+b.radius*.88,b.y);c.arc(b.x,b.y,b.radius*.88,0,TAU);c.clip('evenodd');}local(c,f.x,f.y,f.angle||0,()=>{for(let i=0;i<this.particleCount;i++){const p=this.particle(f,i,a);if(!p)continue;c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha=p.alpha*(p.hot?.58:.32);c.fillStyle=p.hot?'#edfaff':'#b8dce9';if(p.type==='dot'){c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}else{c.beginPath();c.moveTo(-p.stretch,0);c.quadraticCurveTo(-p.stretch*.35,-p.size,p.size*2,0);c.quadraticCurveTo(-p.stretch*.25,p.size*.25,-p.stretch,0);c.closePath();c.fill();}c.restore();}});c.restore();},
  impact(c,f,e){const a=age(f,e);if(a>.85)return;c.save();for(const b of e.balls){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(b.x+b.radius*.9,b.y);c.arc(b.x,b.y,b.radius*.9,0,TAU);c.clip('evenodd');}local(c,f.x,f.y,f.angle||0,()=>this.jet(c,a,ease(a/.085),this.wallReach(f)));c.restore();},
  behind(r,e){/* Compression is a foreground air layer; actors must not hide it. */},
  front(r,e){if(!this.live(e))return;if(e.effects.some(f=>f.kind==='arcana'&&owned(f,e)&&['fist','fistImpact'].includes(f.style)))r.normalWindMatrix=r.ctx.getTransform?.();const c=r.ctx;for(const b of e.balls)if(b.type==='normal'&&b.arcana?.phase==='punch'){c.save();for(const a of e.balls){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(a.x+a.radius*.79,a.y);c.arc(a.x,a.y,a.radius*.79,0,TAU);c.clip('evenodd');}this.charge(c,b,e);c.restore();}for(const f of e.effects)if(f.kind==='arcana'&&owned(f,e)){if(f.style==='blink')this.blink(c,f,e);if(f.style==='fist')this.release(c,f,e);if(f.style==='fistImpact'){this.impact(c,f,e);this.impactParticles(c,f,e);}}},
  spill(r,e){
   const doc=root.document;if(!doc?.createElement||!r.canvas?.getBoundingClientRect)return;
   const visible=this.live(e)&&!doc.body?.classList.contains('review-mode')&&(e.effects.some(f=>f.kind==='arcana'&&owned(f,e)&&['fist','fistImpact'].includes(f.style)&&age(f,e)<.85)||G.KineticView?.hasOverflow?.(e));
   let canvas=r.normalWindSpill;if(!visible){if(canvas){canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);canvas.hidden=true;}return;}
   if(!canvas){canvas=doc.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.dataset.normalWindSpill='';canvas.style.cssText='position:fixed;pointer-events:none;z-index:12;max-width:none;max-height:none;';doc.body.appendChild(canvas);r.normalWindSpill=canvas;if(!this.spillStyle){const style=doc.createElement('style');style.textContent='.review-mode canvas[data-normal-wind-spill]{display:none!important}';doc.head.appendChild(style);this.spillStyle=style;}}
   const rect=r.canvas.getBoundingClientRect(),dpr=Math.min(root.devicePixelRatio||1,2),scale=rect.width/G.Constants.width,pad=320*scale,w=rect.width+pad*2,h=rect.height+pad*2;
   canvas.hidden=false;canvas.style.left=(rect.left-pad)+'px';canvas.style.top=(rect.top-pad)+'px';canvas.style.width=w+'px';canvas.style.height=h+'px';if(canvas.width!==Math.ceil(w*dpr)||canvas.height!==Math.ceil(h*dpr)){canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);}
   const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.save();
   // Keep the native arena untouched. Only its visual overflow is painted here.
   c.beginPath();c.rect(0,0,canvas.width,canvas.height);c.rect(pad*dpr,pad*dpr,rect.width*dpr,rect.height*dpr);c.clip('evenodd');
   const m=r.normalWindMatrix,k=rect.width/r.canvas.width*dpr;if(m)c.setTransform(m.a*k,m.b*k,m.c*k,m.d*k,pad*dpr+m.e*k,pad*dpr+m.f*k);else c.setTransform(scale*dpr,0,0,scale*dpr,pad*dpr,pad*dpr);
   for(const f of e.effects)if(f.kind==='arcana'&&owned(f,e)){if(f.style==='fist')this.release(c,f,e);if(f.style==='fistImpact'){this.impact(c,f,e);this.impactParticles(c,f,e);}}
   G.KineticView?.overflow?.(c,e);c.restore();
  },
  filtered(e){return Object.assign(Object.create(e),{effects:e.effects.filter(f=>!(f.kind==='arcana'&&styles.has(f.style)&&owned(f,e)))});}
 };
 const behind=V.behind,front=V.front,overlay=V.overlay;
 V.behind=function(r,e){behind.call(this,r,Object.assign(Object.create(e),{balls:e.balls.map(b=>b.type==='normal'?Object.assign(Object.create(b),{arcana:null}):b)}));N.behind(r,e);};
 V.front=function(r,e){front.call(this,r,N.filtered(e));N.front(r,e);};
 V.overlay=function(r,e){overlay.call(this,r,N.filtered(e));};
 const markerLayout=G.OrbMarkers.layout;G.OrbMarkers.layout=function(e){return markerLayout.call(this,e).map(m=>{const b=e.balls.find(b=>b.id===m.owner);if(b?.type!=='normal'||b.arcana?.phase!=='blink')return m;const p=N.displayPosition(b,e);return {...m,x:m.x+p.x-b.x,y:m.y+p.y-b.y};});};
 const scene=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e,...args){const result=scene.call(this,e,...args);N.spill(this,e);return result;};
 const draw=G.Renderer.prototype.drawBall;
 G.Renderer.prototype.drawBall=function(b,e){if(b.type!=='normal'||!e.balls.includes(b))return draw.call(this,b,e);const c=this.ctx;
  if(b.arcana?.phase==='blink'){const p=N.displayPosition(b,e);c.save();c.translate(p.x-b.x,p.y-b.y);draw.call(this,b,e);c.restore();return;}
  const release=e.effects.find(f=>f.kind==='arcana'&&f.owner===b.id&&f.style==='fist'),recovery=b.arcana?.phase==='punchRecovery'&&release&&age(release,e)<.16;if(b.arcana?.phase!=='punch'&&!recovery)return draw.call(this,b,e);const settle=recovery?ease(age(release,e)/.16):0,p=recovery?1:N.pose(b,e),a=b.arcana.aim||0,load=ease(p)*(1-settle);c.save();c.translate(b.x,b.y);c.rotate(a);c.translate(-load*6+(recovery?Math.sin(settle*Math.PI)*5:0),0);c.scale(1-.18*load,1+.12*load);c.rotate(-a);c.translate(-b.x,-b.y);draw.call(this,b,e);c.restore();};
})(typeof window!=='undefined'?window:globalThis);
