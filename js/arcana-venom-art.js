(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t,states=new WeakMap();
 if(!G.Renderer||!G.VenomArcana)return;
 // Cosmetic phase is deliberately independent of nextTick, pool payments and combat RNG.
 const V=G.VenomVisual={duration:.64,
  state(b,e){const token=G.VenomArcana.state(b);let v=states.get(b);if(!v||v.token!==token||v.epoch!==e.presentationEpoch){v={token,epoch:e.presentationEpoch,phase:0,lastTime:e.time,boost:0};states.set(b,v);}return v;},
  hurt(b,e,amount){const v=this.state(b,e);v.boost=Math.min(.9,v.boost+Math.max(.12,amount/b.maxHp*3));},
  frequency(b,boost=0){const s=G.VenomArcana.state(b),p=clamp((s?.pool||0)/(b.maxHp*.65));return .85+p*2.15+boost*.7;},
  update(e){for(const b of e.balls){const s=G.VenomArcana.state(b);if(!s?.active||b.hp<=0)continue;const v=this.state(b,e),dt=Math.max(0,e.time-v.lastTime);v.lastTime=e.time;if(!dt)continue;v.boost*=Math.exp(-dt*2.6);if(e.time-s.started<this.duration)continue;const old=Math.floor(v.phase-.36);v.phase+=Math.min(.1,dt)*this.frequency(b,v.boost);if(Math.floor(v.phase-.36)>old){e.sound('arcVenomBeat',b.x);e.soundEvents.at(-1).gain=.90+.35*clamp(s.pool/(b.maxHp*.65))+.12*v.boost;}}},
  frame(b,e){const s=G.VenomArcana.state(b);if(!s)return null;const v=states.get(b),valid=v?.token===s&&v.epoch===e.presentationEpoch,t=e.time-s.started,p=clamp(s.pool/(b.maxHp*.65)),phase=valid?v.phase%1:0,opening=t>=0&&t<this.duration;
   const squeeze=Math.exp(-Math.pow((phase-.12)/.075,2)),push=Math.exp(-Math.pow((phase-.36)/.15,2)),shape=-(.11+.10*p)*squeeze+(.12+.14*p)*push;let sx=1+shape,sy=1+shape*.88;
   if(opening){if(t<.1){sx=.70-t*.2;sy=.75-t*.1;}else if(t<.24){const q=(t-.1)/.14;sx=mix(.68,1.34,Math.sin(q*Math.PI/2));sy=mix(.74,1.27,Math.sin(q*Math.PI/2));}else{const q=(t-.24)/.4,decay=(1-q)**2;sx=1+.34*decay*Math.cos(q*Math.PI*2.5);sy=1+.27*decay*Math.cos(q*Math.PI*2.5);}}
   const pulse=opening?Math.exp(-Math.pow((t-.24)/.105,2)):push;
   return{t,p,phase,opening,sx,sy,pulse,frequency:this.frequency(b,valid?v.boost:0)};
  }
 };
 // The nest is a transient visual only: world-time governs its growth and
 // retraction, while the existing damage ledger remains authoritative.
 V.nest=function(c,b,t){
  const ease=q=>{q=clamp(q);return q*q*(3-2*q);};if(t<.10||t>=2.35)return;
  const fade=ease((2.35-t)/.18),drain=ease((t-1.58)/.70),r=b.radius;
  // One deforming skin. Lobes are protrusions in this shared volume, never
  // separately outlined balloons or a radial arrangement of pointed petals.
  const outline=[[-85,-21],[-91,-48],[-63,-72],[-33,-59],[-8,-81],[36,-73],[54,-43],[87,-25],[92,8],[61,27],[67,55],[30,72],[-3,58],[-35,73],[-66,46],[-72,15],[-94,8]];
  // Independent bounded paths supply both the visible bodies and local membrane pressure.
  const creature=(n,at)=>{const k=ease((at-.27)/.36)*(1-drain*.98),a=at*(2.35+n*.19)+n*1.89;return{x:(Math.sin(a)*49+Math.sin(a*1.71+n)*10)*k,y:(Math.cos(at*(3.15+n*.13)+n*2.37)*36+Math.sin(a*.81)*12)*k};};
  const swarm=Array.from({length:6},(_,n)=>creature(n,t));
  const poly=outline.map(([x,y],i)=>{const delay=(i*7%11)*.012,g=ease((t-.12-delay)/.38),back=ease((t-1.60-delay*.55)/.58),k=g*(1-.99*back),wobble=1+.045*Math.sin(t*8+i*1.37)+swarm.reduce((v,p)=>v+.09*Math.exp(-((p.x-x*.67)**2+(p.y-y*.67)**2)/270),0);return[x*k*wobble,y*k*(1+.04*Math.cos(t*9+i*2.1))];});
  const path=points=>{c.beginPath();for(let i=0;i<points.length;i++){const p=points[i],z=points[(i+1)%points.length],x=(p[0]+z[0])*.5,y=(p[1]+z[1])*.5;if(!i)c.moveTo(x,y);else c.quadraticCurveTo(p[0],p[1],x,y);}c.closePath();};
  const grow=ease((t-.14)/.42),size=grow*(1-drain*.97);if(size<.01)return;
  c.save();c.translate(b.x,b.y);c.globalAlpha=fade;
  c.save();c.translate(0,5*size);path(poly);c.fillStyle='rgba(4,29,19,.62)';c.fill();c.restore();
  path(poly);const skin=c.createLinearGradient(-52*size,-70*size,60*size,65*size);skin.addColorStop(0,'#64b446');skin.addColorStop(.24,'#83c94e');skin.addColorStop(.49,'#357e38');skin.addColorStop(.80,'#19572e');skin.addColorStop(1,'#082f20');c.fillStyle=skin;c.fill();
  c.save();path(poly);c.clip();
  // The underside rolls into the core: a broad dark fold, rather than a rim.
  c.fillStyle='rgba(5,41,24,.34)';c.beginPath();c.moveTo(-110*size,12*size);c.bezierCurveTo(-45*size,62*size,34*size,-7*size,110*size,10*size);c.lineTo(110*size,100*size);c.lineTo(-110*size,100*size);c.closePath();c.fill();
  // Unequal pressure chambers appear beneath a single uninterrupted skin.
  // Gradient bounds have no stroked circles; broad dark backs imply depth.
  const chambers=[[-49,-30,37,25,.04],[30,-41,35,30,.16],[49,25,40,29,.10],[-32,40,34,26,.24]];
  for(let n=0;n<chambers.length;n++){const[x,y,rx,ry,delay]=chambers[n],g=ease((t-.20-delay)/.32),back=ease((t-1.57-delay*.5)/.52),k=g*(1-back*.98),pump=1+.09*Math.sin(t*10+n*1.8),px=x*k,py=y*k,w=rx*size*pump,h=ry*size/pump;if(w<1)continue;
   c.save();c.translate(px,py);c.scale(1,h/w);const shade=c.createRadialGradient(w*.12,w*.38,w*.1,0,0,w*1.18);shade.addColorStop(0,'#0a382b88');shade.addColorStop(.68,'#0d3a2470');shade.addColorStop(1,'#163c2500');c.fillStyle=shade;c.fillRect(-w*1.2,-w*1.2,w*2.4,w*2.4);
   const body=c.createRadialGradient(-w*.22,-w*.26,0,-w*.10,-w*.13,w);body.addColorStop(0,'rgba(181,233,104,.78)');body.addColorStop(.32,'rgba(108,185,70,.68)');body.addColorStop(.65,'rgba(57,137,52,.38)');body.addColorStop(1,'rgba(47,110,42,0)');c.fillStyle=body;c.fillRect(-w,-w,w*2,w*2);
   c.lineCap='round';c.strokeStyle='rgba(231,255,173,.65)';c.lineWidth=1.4;c.beginPath();c.moveTo(-w*.53,-w*.08);c.bezierCurveTo(-w*.53,-w*.37,-w*.25,-w*.50,w*.06,-w*.46);c.stroke();c.restore();
  }
  // Wide, opposing liquid fronts shear past one another under the skin.
  for(let n=0;n<3;n++){const phase=t*(2.7+n*.31)+n*2.2,cy=(Math.sin(phase)*34+(n-1)*12)*size,roll=Math.cos(phase*.87)*18*size;c.save();c.globalAlpha=fade*(.12+.08*Math.sin(phase)**2);c.fillStyle=n%2?'#d0f482':'#164b2b';c.beginPath();c.moveTo(-100*size,cy-12*size);c.bezierCurveTo(-55*size,cy-29*size+roll,-8*size,cy+25*size,48*size,cy-4*size);c.bezierCurveTo(77*size,cy-20*size,101*size,cy-17*size,110*size,cy-8*size);c.lineTo(110*size,cy+6*size);c.bezierCurveTo(50*size,cy-7*size,10*size,cy+40*size,-43*size,cy+8*size);c.bezierCurveTo(-70*size,cy-3*size,-91*size,cy+8*size,-100*size,cy+3*size);c.closePath();c.fill();c.restore();}
  // Six persistent live-toxin identities, each with its own curved path and
  // a tapering trail sampled from that path. All remain clipped inside the nest.
  for(let n=0;n<swarm.length;n++){const pts=[],w=(4.5+n%3)*(1-drain*.95)*ease((t-.26)/.3);if(w<.2)continue;
   for(let j=0;j<=18;j++){const u=j/18,p=creature(n,t-u*(.17+n*.009)),prev=creature(n,t-u*(.17+n*.009)-.005),dx=p.x-prev.x,dy=p.y-prev.y,len=Math.hypot(dx,dy)||1;pts.push({x:p.x,y:p.y,nx:-dy/len,ny:dx/len,w:w*Math.pow(1-u,.68)*(1+.18*Math.sin(u*8-t*11+n))});}
   const body=()=>{c.beginPath();const p=pts[0];c.moveTo(p.x+p.nx*p.w,p.y+p.ny*p.w);for(const v of pts.slice(1))c.lineTo(v.x+v.nx*v.w,v.y+v.ny*v.w);for(const v of pts.slice().reverse())c.lineTo(v.x-v.nx*v.w,v.y-v.ny*v.w);c.quadraticCurveTo(p.x+(p.x-pts[1].x)*2.5,p.y+(p.y-pts[1].y)*2.5,p.x+p.nx*p.w,p.y+p.ny*p.w);c.closePath();};
   c.save();c.globalAlpha=fade*(.75-.2*drain);c.save();c.translate(1,2);body();c.fillStyle='#073a27';c.fill();c.restore();body();const h=pts[0],tail=pts.at(-1),gel=c.createLinearGradient(h.x,h.y,tail.x,tail.y);gel.addColorStop(0,'#d8fda2');gel.addColorStop(.2,'#9de64f');gel.addColorStop(.6,'#399f3d');gel.addColorStop(1,'#20643500');c.fillStyle=gel;c.fill();
   c.globalAlpha=fade*.65;c.strokeStyle='#e6ffc4';c.lineCap='round';c.lineWidth=1.1*(1-drain*.8);c.beginPath();pts.slice(1,7).forEach((p,i)=>i?c.lineTo(p.x+p.nx*p.w*.35,p.y+p.ny*p.w*.35):c.moveTo(p.x+p.nx*p.w*.35,p.y+p.ny*p.w*.35));c.stroke();c.restore();
  }
  // Wide folds move inwards along curved routes. Their pressure crest drains
  // the outer chamber before arriving at the owner, making volume transfer clear.
  const routes=[[-71,-22,-35,-52,-23,-17,.03],[25,-65,49,-35,14,-19,.19],[69,22,41,57,21,13,.11],[-39,59,-58,25,-21,17,.27]];
  for(let n=0;n<routes.length;n++){const[x,y,cx,cy,mx,my,phase]=routes[n],wave=((t*1.55+phase)%1),flow=(.35+.65*drain)*Math.sin(Math.PI*wave),start={x:x*size,y:y*size},end={x:mx*size,y:my*size};
   c.save();c.globalAlpha=fade*(.27+.16*drain);c.lineCap='round';c.lineWidth=(7+6*flow)*size;c.strokeStyle='#124c2d';c.beginPath();c.moveTo(start.x,start.y);c.quadraticCurveTo(cx*size,cy*size,end.x,end.y);c.stroke();
   c.globalAlpha=fade*.42;const pts=[];for(let i=0;i<=16;i++){const u=Math.max(0,Math.min(1,wave+(i/16-.5)*.32)),a=1-u;pts.push({x:a*a*start.x+2*a*u*cx*size+u*u*end.x,y:a*a*start.y+2*a*u*cy*size+u*u*end.y});}c.strokeStyle='#b9ed77';c.lineWidth=(2+4*flow)*size;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();
  }
  c.restore();
  // Only short wet glints catch the raised perimeter; no uniform bright outline.
  c.strokeStyle='rgba(214,249,151,.65)';c.lineWidth=1.25;c.lineCap='round';for(const[start,count]of[[1,2],[5,2],[10,1],[14,1]]){c.beginPath();for(let j=0;j<=count;j++){const p=poly[(start+j)%poly.length],z=poly[(start+j+1)%poly.length],x=(p[0]+z[0])*.5,y=(p[1]+z[1])*.5;if(!j)c.moveTo(x,y);else c.quadraticCurveTo(p[0],p[1],x,y);}c.stroke();}
  c.restore();
 };
 // Opening-stage ambient lighting is behind every actor and ends with the
 // native .64 second transformation; no extra hazard or surrounding barrier.
 if(G.ArcanaView){const previous=G.ArcanaView.behind;G.ArcanaView.behind=function(renderer,e){previous.call(this,renderer,e);const c=renderer.ctx;
  for(const b of e.balls){const state=G.VenomArcana.state(b);if(!state?.active||b.hp<=0)continue;const f=V.frame(b,e);if(!f||f.t<0||f.t>=2.35||renderer.reducedMotion)continue;
   const fade=clamp((f.t-.04)/.14)*clamp((.58-f.t)/.23),rad=140+50*f.pulse,g=c.createRadialGradient(b.x,b.y,b.radius,b.x,b.y,rad);g.addColorStop(0,'rgba(91,190,44,.24)');g.addColorStop(.38,'rgba(54,127,38,.14)');g.addColorStop(1,'rgba(25,70,29,0)');c.save();c.globalAlpha=fade;c.fillStyle=g;c.fillRect(0,0,G.Constants.width,G.Constants.height);c.restore();V.nest(c,b,f.t);
  }};}
 if(G.Presentation){const camera=G.Presentation.camera;G.Presentation.camera=function(renderer,e){camera.call(this,renderer,e);if(renderer.reducedMotion)return;let amount=0;for(const b of e.balls){const s=G.VenomArcana.state(b);if(!s?.active||b.hp<=0)continue;const t=e.time-s.started;amount=Math.max(amount,Math.exp(-(((t-.22)/.12)**2))*2.4+Math.exp(-(((t-1.28)/.12)**2))*1.2);}if(amount>.01)renderer.ctx.translate(Math.sin(e.time*92)*amount,Math.cos(e.time*73)*amount*.7);};}
 const draw=G.Renderer.prototype.drawBall;
 G.Renderer.prototype.drawBall=function(b,e){const s=G.VenomArcana.state(b);if((!s?.active&&!(s?.pool>0))||b.hp<=0)return draw.call(this,b,e);const f=V.frame(b,e),c=this.ctx,r=b.radius,strength=this.reducedMotion?.5:1;
  if(f.opening&&!this.reducedMotion){const rise=clamp((f.t-.05)/.16),fall=clamp((.55-f.t)/.25),glow=c.createRadialGradient(b.x,b.y,r*.5,b.x,b.y,r*4.4);glow.addColorStop(0,'rgba(127,222,68,.27)');glow.addColorStop(.38,'rgba(79,161,49,.13)');glow.addColorStop(1,'rgba(57,119,40,0)');c.save();c.globalAlpha=rise*fall;c.fillStyle=glow;c.fillRect(b.x-r*4.4,b.y-r*4.4,r*8.8,r*8.8);c.restore();}
  c.save();c.translate(b.x,b.y);c.scale(1+(f.sx-1)*strength,1+(f.sy-1)*strength);c.translate(-b.x,-b.y);draw.call(this,b,e);
  c.save();c.translate(b.x,b.y);c.beginPath();c.arc(0,0,r-1,0,TAU);c.clip();
  c.fillStyle='rgba(35,82,38,.32)';c.fillRect(-r,-r,2*r,2*r);
  // Fine residual veins remain inside the active body after the temporary
  // nest retracts; they are not a second shield or a new combat indicator.
  if(!f.opening){c.save();c.globalAlpha=.16+.12*f.pulse;c.strokeStyle='#c9ff9c';c.lineWidth=.8;c.lineCap='round';for(const [x,y,side] of [[-r*.76,-r*.04,1],[r*.64,r*.16,-1]]){c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+side*r*.10,y-r*.14,x+side*r*.16,y-r*.22,x+side*r*.24,y-r*.26);c.stroke();}c.restore();}
  // A translucent living body, with internal folds that deform with the
  // existing heartbeat; all material remains inside the real orb silhouette.
  const liquid=c.createRadialGradient(-r*.32,-r*.38,1,0,0,r*1.2);liquid.addColorStop(0,'rgba(204,255,130,.40)');liquid.addColorStop(.38,'rgba(86,184,55,.25)');liquid.addColorStop(.78,'rgba(24,90,37,.38)');liquid.addColorStop(1,'rgba(14,49,26,.58)');c.fillStyle=liquid;c.fillRect(-r,-r,2*r,2*r);
  const motion=f.opening?clamp(f.t/.64):f.phase;for(let j=0;j<3;j++){const offset=(j-1)*r*.44,beat=f.pulse*(2+j),bend=Math.sin(motion*TAU+j*2.1)*r*.12;
   c.beginPath();c.moveTo(-r,offset-5+bend);c.bezierCurveTo(-r*.55,offset-9+beat,r*.12,offset+4-bend,r,offset-3);c.lineTo(r,offset+5);c.bezierCurveTo(r*.38,offset+11+bend,-r*.35,offset-1-beat,-r,offset+5);c.closePath();
   const fold=c.createLinearGradient(0,offset-8,0,offset+10);fold.addColorStop(0,j%2?'rgba(188,255,110,.22)':'rgba(100,209,58,.23)');fold.addColorStop(1,'rgba(32,105,41,.05)');c.fillStyle=fold;c.fill();}
  // Broad liquid folds pump from the core toward the shell, never forming an external barrier.
  for(let j=0;j<3;j++){const a=j*TAU/3+.45,flow=f.opening?clamp((f.t-.1)/.45):f.phase,dist=r*(.2+flow*.65),w=r*(.4-flow*.16);c.save();c.rotate(a);c.beginPath();c.moveTo(-w*.8,dist-9);c.bezierCurveTo(-w,dist+3,-w*.4,dist+9,0,dist+10);c.bezierCurveTo(w*.65,dist+8,w,dist+1,w*.75,dist-7);c.bezierCurveTo(w*.2,dist-3,-w*.3,dist-2,-w*.8,dist-9);c.fillStyle=j%2?'rgba(125,202,65,.28)':'rgba(49,125,48,.44)';c.fill();c.restore();}
  // Unequal translucent lobes shift within the orb with its actual pulse;
  // they are fluid material, not concentric status rings.
  for(let j=0;j<3;j++){const phase=f.opening?clamp(f.t/.64):f.phase,theta=j*TAU/3+.4+Math.sin(phase*TAU+j)*.2;
   const dist=r*(.26+.10*Math.sin(phase*TAU-j)),x=Math.cos(theta)*dist,y=Math.sin(theta)*dist,rad=r*(.36+.10*f.pulse+(j===1?.07:0));
   const blob=c.createRadialGradient(x-rad*.24,y-rad*.3,0,x,y,rad);blob.addColorStop(0,j===0?'rgba(201,255,119,.42)':'rgba(155,239,88,.32)');blob.addColorStop(.48,'rgba(104,208,55,.19)');blob.addColorStop(1,'rgba(49,137,38,0)');c.fillStyle=blob;c.beginPath();c.arc(x,y,rad,0,TAU);c.fill();
   c.strokeStyle='rgba(206,255,137,'+(.13+.18*f.pulse)+')';c.lineWidth=1.1;c.beginPath();c.moveTo(x-rad*.62,y-rad*.26);c.quadraticCurveTo(x-rad*.30,y-rad*.65,x+rad*.18,y-rad*.52);c.stroke();}
  // Broad, asymmetric liquid faces within the body. Their contours flex with
  // the existing pulse, with a bright wet edge and deep translucent underside.
  c.save();const ph=f.opening?clamp(f.t/.64):f.phase,sw=Math.sin(ph*TAU)*r*.12,pressure=.35+.35*f.pulse+.15*f.p;
  let face=c.createLinearGradient(-r,-r,r,r);face.addColorStop(0,'rgba(223,255,150,.68)');face.addColorStop(.45,'rgba(113,222,61,.35)');face.addColorStop(1,'rgba(35,115,38,0)');c.globalAlpha=pressure;c.fillStyle=face;
  c.beginPath();c.moveTo(-r*.94,-r*.12);c.bezierCurveTo(-r*.9,-r*.77,-r*.43,-r*.9,r*.14,-r*.72+sw);c.bezierCurveTo(-r*.16,-r*.65+sw,-r*.44,-r*.40,-r*.54,r*.22);c.bezierCurveTo(-r*.67,r*.12,-r*.84,r*.05,-r*.94,-r*.12);c.closePath();c.fill();
  c.globalAlpha=.28+.2*f.pulse;c.fillStyle='#143e1f';c.beginPath();c.moveTo(r*.83,-r*.08);c.bezierCurveTo(r*.91,r*.37,r*.60,r*.76,r*.12,r*.85);c.bezierCurveTo(r*.48,r*.64,r*.61,r*.31,r*.54,-r*.05-sw);c.closePath();c.fill();
  c.globalAlpha=.32+.35*f.pulse;c.strokeStyle='#d8ff9c';c.lineWidth=1.25;c.lineCap='round';c.beginPath();c.moveTo(-r*.75,-r*.27);c.bezierCurveTo(-r*.67,-r*.58,-r*.43,-r*.72,-r*.20,-r*.73+sw);c.stroke();c.restore();
  const core=c.createRadialGradient(-4,-3,1,-4,-3,r*.78);core.addColorStop(0,'rgba(211,255,124,'+(.48+f.pulse*.46)+')');core.addColorStop(.4,'rgba(128,241,61,'+(.23+f.pulse*.40)+')');core.addColorStop(1,'rgba(77,177,41,0)');c.fillStyle=core;c.fillRect(-r,-r,2*r,2*r);
  // Pressure ripples spread within the liquid body and fade before the shell;
  // their changing curvature follows the existing heartbeat, not a shield.
  c.save();const wave=f.opening?clamp((f.t-.10)/.45):f.phase,travel=r*(.12+.7*wave);c.globalAlpha=(1-wave)*(.32+.24*f.pulse);for(let i=0;i<2;i++){c.beginPath();c.moveTo(-travel*.78,-travel*.26-i*2);c.bezierCurveTo(-travel*.55,-travel*.8,travel*.14,-travel*.92,travel*.55,-travel*.42);c.strokeStyle=i?'#86dc52':'#d9ff9c';c.lineWidth=i?1.8:1;c.stroke();}c.restore();
  // An asymmetric meniscus and internal darker fold slide with each pump;
  // their curves stop at the orb edge and keep the drop emblem readable.
  c.save();const flow=f.opening?clamp(f.t/.64):f.phase,swim=Math.sin(flow*TAU)*r*.08;
  const meniscus=c.createLinearGradient(-r,-r,r,r);meniscus.addColorStop(0,'rgba(236,255,173,.50)');meniscus.addColorStop(.42,'rgba(163,242,91,.23)');meniscus.addColorStop(1,'rgba(83,176,47,0)');
  c.fillStyle=meniscus;c.beginPath();c.moveTo(-r*.88,-r*.42);c.bezierCurveTo(-r*.72,-r*.92,-r*.15,-r*.9,r*.22,-r*.68);c.bezierCurveTo(-r*.25,-r*.73,-r*.62,-r*.46,-r*.78,-r*.12+swim);c.closePath();c.fill();
  c.fillStyle='rgba(19,85,36,.24)';c.beginPath();c.moveTo(r*.40,r*.18);c.bezierCurveTo(r*.74,r*.02,r*.77,r*.41,r*.42,r*.70);c.bezierCurveTo(r*.19,r*.82,-r*.12,r*.82,-r*.22,r*.66);c.bezierCurveTo(r*.03,r*.70,r*.31,r*.54,r*.40,r*.18);c.closePath();c.fill();c.restore();
  // Small wet highlights stretch and relax with the liquid, rather than
  // simulating detached bubbles or implying a new combat effect.
  c.save();c.globalAlpha=.30+.25*f.pulse;c.lineCap='round';c.strokeStyle='#dcffb0';c.lineWidth=1.15;
  c.beginPath();c.moveTo(-r*.62,-r*.40);c.quadraticCurveTo(-r*.47,-r*.64,-r*.18,-r*.68);c.stroke();
  c.globalAlpha=.18+.20*f.pulse;c.lineWidth=.8;c.beginPath();c.moveTo(r*.40,r*.34);c.quadraticCurveTo(r*.52,r*.22,r*.55,r*.08);c.stroke();c.restore();
  // Retain the orb's drop emblem instead of drawing anatomical heart shapes.
  c.beginPath();c.moveTo(0,-10);c.bezierCurveTo(-13,2,-7,10,0,10);c.bezierCurveTo(7,10,13,2,0,-10);c.fillStyle='#244a23';c.fill();c.beginPath();c.moveTo(-2,-5);c.quadraticCurveTo(-7,3,-2,5);c.strokeStyle='rgba(191,255,116,'+(.25+f.pulse*.5)+')';c.lineWidth=1.7;c.stroke();

  c.restore();c.restore();
 };
})(typeof window!=='undefined'?window:globalThis);

