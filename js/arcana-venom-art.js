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
 const draw=G.Renderer.prototype.drawBall;
 G.Renderer.prototype.drawBall=function(b,e){const s=G.VenomArcana.state(b);if((!s?.active&&!(s?.pool>0))||b.hp<=0)return draw.call(this,b,e);const f=V.frame(b,e),c=this.ctx,r=b.radius,strength=this.reducedMotion?.5:1;
  c.save();c.translate(b.x,b.y);c.scale(1+(f.sx-1)*strength,1+(f.sy-1)*strength);c.translate(-b.x,-b.y);draw.call(this,b,e);
  c.save();c.translate(b.x,b.y);c.beginPath();c.arc(0,0,r-1,0,TAU);c.clip();
  c.fillStyle='rgba(35,82,38,.32)';c.fillRect(-r,-r,2*r,2*r);
  // Broad liquid folds pump from the core toward the shell, never forming an external barrier.
  for(let j=0;j<3;j++){const a=j*TAU/3+.45,flow=f.opening?clamp((f.t-.1)/.45):f.phase,dist=r*(.2+flow*.65),w=r*(.4-flow*.16);c.save();c.rotate(a);c.beginPath();c.moveTo(-w*.8,dist-9);c.bezierCurveTo(-w,dist+3,-w*.4,dist+9,0,dist+10);c.bezierCurveTo(w*.65,dist+8,w,dist+1,w*.75,dist-7);c.bezierCurveTo(w*.2,dist-3,-w*.3,dist-2,-w*.8,dist-9);c.fillStyle=j%2?'rgba(125,202,65,.28)':'rgba(49,125,48,.44)';c.fill();c.restore();}
  const count=f.opening?1:2+(f.p>.65?1:0);
  for(let j=0;j<count;j++){const u=f.opening?clamp((f.t-.12)/.46):(f.phase+j/count)%1;if(u<=0||u>=1)continue;const rr=r*(.12+u*1.05),alpha=Math.sin(u*Math.PI)*(.25+f.p*.18);c.beginPath();for(let k=0;k<=40;k++){const a=k/40*TAU,d=rr*(1+.055*Math.sin(a*3+e.time*3));const x=Math.cos(a)*d,y=Math.sin(a)*d;k?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.strokeStyle='rgba(176,255,99,'+alpha+')';c.lineWidth=3.5*(1-u)+1.2;c.stroke();}
  const core=c.createRadialGradient(-4,-3,1,-4,-3,r*.78);core.addColorStop(0,'rgba(211,255,124,'+(.48+f.pulse*.46)+')');core.addColorStop(.4,'rgba(128,241,61,'+(.23+f.pulse*.40)+')');core.addColorStop(1,'rgba(77,177,41,0)');c.fillStyle=core;c.fillRect(-r,-r,2*r,2*r);
  // Retain the orb's drop emblem instead of drawing anatomical heart shapes.
  c.beginPath();c.moveTo(0,-10);c.bezierCurveTo(-13,2,-7,10,0,10);c.bezierCurveTo(7,10,13,2,0,-10);c.fillStyle='#244a23';c.fill();c.beginPath();c.moveTo(-2,-5);c.quadraticCurveTo(-7,3,-2,5);c.strokeStyle='rgba(191,255,116,'+(.25+f.pulse*.5)+')';c.lineWidth=1.7;c.stroke();
  c.restore();c.restore();
 };
})(typeof window!=='undefined'?window:globalThis);
