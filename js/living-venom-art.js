(function(root){
'use strict';const G=root.OrbDuel,L=G.LivingVenom,A=G.VenomArt,TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,k)=>a+(b-a)*k;
const F=G.LivingVenomView={
 roots:new WeakMap(),
 curve(c,from,to,e,width=5,bend=15,seed=0,alpha=1){const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;let control={x:(from.x+to.x)/2+nx*bend,y:(from.y+to.y)/2+ny*bend};if(!G.Venom.clear(from,control,e)||!G.Venom.clear(control,to,e))control={x:(from.x+to.x)/2,y:(from.y+to.y)/2};const left=[],right=[];for(let i=0;i<=20;i++){const u=i/20,v=1-u,w=(width*(1-u)+1)*.5,wave=Math.sin(u*Math.PI)*Math.sin(u*7-e.time*5+seed)*1.6;const x=v*v*from.x+2*v*u*control.x+u*u*to.x+nx*wave,y=v*v*from.y+2*v*u*control.y+u*u*to.y+ny*wave;left.push({x:x+nx*w,y:y+ny*w});right.push({x:x-nx*w,y:y-ny*w});}c.save();c.globalAlpha*=alpha;c.beginPath();c.moveTo(left[0].x,left[0].y);for(const p of left)c.lineTo(p.x,p.y);for(const p of right.reverse())c.lineTo(p.x,p.y);c.closePath();c.fillStyle='#588f31';c.fill();c.beginPath();c.moveTo(from.x,from.y);c.quadraticCurveTo(control.x,control.y,to.x,to.y);c.strokeStyle='#c2ed78';c.lineWidth=1.2;c.stroke();c.restore();return control;},
 // Presentation-only damped material chain. Endpoints are attached to material points,
 // not recomputed from the changing centre-to-centre bearing.
 threads:new WeakMap(),
 fitLength(thread,distance,slack=1.2){const extra=Math.min(10,distance*(.03+.14*clamp(distance/80))*(.7+.6*clamp((slack-1)/.35)));thread.adaptive=true;thread.rest=Math.max(.5,distance+extra);return Math.pow(clamp(distance/55),2);},
 solve(thread,from,to,time,seed){const count=14;
  if(!thread.nodes||time<thread.at){const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy)||1,bend=Math.min(18,d*(thread.bend||.08),thread.adaptive?Math.sqrt(Math.max(0,thread.rest*thread.rest-d*d))*.45:Infinity)*(thread.side??(seed%2?1:-1));thread.nodes=Array.from({length:count+1},(_,i)=>{const u=i/count,b=Math.sin(u*Math.PI)*bend,x=from.x+dx*u-dy/d*b,y=from.y+dy*u+dx/d*b;return{x,y,px:x,py:y};});if(!thread.adaptive)thread.rest=Math.max(thread.rest||0,5,d*(thread.slack||1.06));thread.at=time;thread.acc=0;}
  const nodes=thread.nodes,distance=Math.hypot(to.x-from.x,to.y-from.y);if(!thread.rootTangent&&distance>1)thread.rootTangent={x:(to.x-from.x)/distance,y:(to.y-from.y)/distance};const tangent=thread.rootTangent||{x:1,y:0},socketLength=thread.rootTangent?3.5:0,socket={x:from.x+tangent.x*socketLength,y:from.y+tangent.y*socketLength},pin=()=>{Object.assign(nodes[0],from);Object.assign(nodes[1],socket);Object.assign(nodes[count],to);};thread.acc+=Math.min(.1,Math.max(0,time-thread.at));thread.at=time;
  while(thread.acc>=1/120){thread.acc-=1/120;
   for(let i=2;i<count;i++){const p=nodes[i],vx=(p.x-p.px)*(thread.damping??.88),vy=(p.y-p.py)*(thread.damping??.88);p.px=p.x;p.py=p.y;p.x+=vx+(thread.feedX||0)/14400;p.y+=vy+(thread.feedY||0)/14400;}
   const segment=Math.max(thread.rest-socketLength,Math.hypot(to.x-socket.x,to.y-socket.y)*1.002)/(count-1);
   for(let k=0;k<14;k++){pin();for(let i=1;i<count;i++){const a=nodes[i],b=nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,q=(d-segment)/d;if(i===1){b.x-=dx*q;b.y-=dy*q;}else if(i===count-1){a.x+=dx*q;a.y+=dy*q;}else{a.x+=dx*q*.5;a.y+=dy*q*.5;b.x-=dx*q*.5;b.y-=dy*q*.5;}}}
  }
  pin();return nodes;
 },
 viscous(c,from,to,e,tension,seed,width=7,alpha=1,thread={}){const points=this.solve(thread,from,to,e.time,seed),last=points.length-1,left=[],right=[],length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0),stretch=Math.max(1,length/thread.rest),thin=1/Math.sqrt(stretch);
  for(let i=0;i<=last;i++){const u=i/last,p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(last,i+1)],dd=Math.hypot(next.x-prev.x,next.y-prev.y)||1,xx=-(next.y-prev.y)/dd,yy=(next.x-prev.x)/dd,ends=Math.pow(Math.abs(u*2-1),4),bulge=1+.10*Math.sin(u*17+seed),w=width*(.48+ends*.6)*thin*bulge;left.push({x:p.x+xx*w,y:p.y+yy*w});right.push({x:p.x-xx*w,y:p.y-yy*w});}
  const trace=pts=>{c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++)c.quadraticCurveTo(pts[i].x,pts[i].y,(pts[i].x+pts[i+1].x)*.5,(pts[i].y+pts[i+1].y)*.5);c.lineTo(pts.at(-1).x,pts.at(-1).y);};
  c.save();c.globalAlpha*=alpha;c.beginPath();trace(left);c.lineTo(right.at(-1).x,right.at(-1).y);for(let i=right.length-2;i>0;i--)c.quadraticCurveTo(right[i].x,right[i].y,(right[i].x+right[i-1].x)*.5,(right[i].y+right[i-1].y)*.5);c.lineTo(right[0].x,right[0].y);c.closePath();const tangent=thread.rootTangent||{x:1,y:0},fade=Math.min(8,Math.max(2,length*.22)),color=c.createLinearGradient?.(from.x,from.y,from.x+tangent.x*fade,from.y+tangent.y*fade);if(color){color.addColorStop(0,'rgba(75,125,45,0)');color.addColorStop(.45,'rgba(75,125,45,.35)');color.addColorStop(1,'#4b7d2d');}c.fillStyle=color||'#4b7d2d';c.fill();
  for(let j=0;j<3;j++){const start=3+j*4;c.beginPath();for(let i=start;i<=Math.min(start+2,last);i++){const p=left[i],q=points[i],x=mix(q.x,p.x,.38),y=mix(q.y,p.y,.38);if(i===start)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle=j%2?'#a2cf62':'#80ac42';c.lineWidth=width*.3*thin;c.lineCap='round';c.stroke();}c.restore();
 },
 gel(c,x,y,r,t,seed,flat=1){A.contour(c,x,y,r,t,seed,flat);c.fillStyle='#356b2b';c.fill();A.contour(c,x-r*.08,y-r*.12,r*.82,t,seed,flat);c.fillStyle='#8ac442';c.fill();c.beginPath();c.ellipse(x-r*.23,y-r*.36,r*.3,r*.12,-.5,0,TAU);c.fillStyle='#e0f8a3';c.fill();},
 glob(c,a,e){const age=e.time-a.phaseAt,angle=Math.atan2(a.vy,a.vx),wind=a.phase==='wind',miss=a.phase==='retract',q=clamp(age/(wind?L.config.globWind:miss?L.config.retractTime:.10));
  // Top-down projection: the visible centre stays on the real swept collision path.
  const centre=miss?(a.missFrom||a):a;c.save();c.translate(centre.x,centre.y);c.rotate(angle);
  if(miss){c.globalAlpha*=1-q;c.scale(1+q*1.6,.75+q*.25);this.gel(c,0,0,7,e.time,a.id,.7);for(let i=-1;i<=1;i++)this.gel(c,-3-q*8, i*(3+q*5),1.7*(1-q),e.time,a.id+i,.7);c.restore();return;}
  const sx=wind?mix(.62,1.45,q*q):mix(1.45,1.08,q),sy=1/sx;c.scale(sx,sy);this.gel(c,0,0,7,e.time,a.id,1);c.restore();
  if(a.phase==='flight'&&age<.08){const tail=1-age/.08;c.save();c.globalAlpha*=tail;this.viscous(c,a.start,{x:a.x-Math.cos(angle)*5,y:a.y-Math.sin(angle)*5},e,.6,a.id,3*tail,.7);c.restore();}
 },
 coating(c,b,angle,q,e,seed,size=7.5){const draw=q<.42?q/.42:(q-.42)/.58,spread=q<.42?mix(.75,1.65,draw):mix(1.65,.08,draw),radial=q<.42?mix(1,.62,draw):mix(.62,.06,draw),radius=b.radius*(q<.42?.88:mix(.88,.30,draw));c.save();c.translate(b.x,b.y);c.rotate(angle);c.translate(radius,0);c.scale(radial,spread);this.gel(c,0,0,size,e.time,seed,1);c.restore();},
 behind(r,e){const s=e.livingVenom;if(!s)return;const c=r.ctx,t=e.time;c.save();
  for(const v of s.binds){const b=L.target(e,v.target),pool=e.pools.find(p=>p.id===v.pool);if(!b||!pool)continue;let layout=this.roots.get(v);
   if(!layout){layout={strands:(v.strands||L.strands(v,b,pool,e)).map(spec=>({...spec,thread:{bend:spec.bend,slack:spec.slack,damping:spec.damping,side:spec.side}}))};this.roots.set(v,layout);}
   for(const strand of layout.strands){const{root:start,offset,i,thread}=strand,grow=clamp((t-v.born-strand.delay)/strand.growTime);if(grow<=0)continue;const end={x:mix(start.x,b.x+offset.x,grow),y:mix(start.y,b.y+offset.y,grow)},distance=Math.hypot(end.x-start.x,end.y-start.y),bearing=Math.atan2(offset.y,offset.x)+Math.PI/2*strand.side,flow=(strand.slack-1)*5200*this.fitLength(thread,distance,strand.slack);thread.feedX=Math.cos(bearing)*flow*grow;thread.feedY=Math.sin(bearing)*flow*grow;this.viscous(c,start,end,e,v.tension,strand.seed,strand.width,.97,thread);if(grow>=1)this.gel(c,end.x,end.y,i===0?5:3.8,t,strand.seed,.75);}

  }
  for(const a of s.attacks){if(a.phase==='cling'&&a.kind!=='tendril')continue;const q=clamp((t-a.phaseAt)/(a.phase==='wind'?.2:L.config.flightLife));if(a.kind==='tendril'){const b=L.target(e,a.target),end=a.phase==='cling'&&b?{x:b.x+Math.cos(a.contactAngle)*b.radius*.94,y:b.y+Math.sin(a.contactAngle)*b.radius*.94}:a,start=a.start,width=a.phase==='wind'?2+q*3:a.phase==='retract'?4*(1-clamp((t-a.phaseAt)/L.config.retractTime)):4;let thread=this.threads.get(a);if(!thread){thread={bend:a.variation?.bend||.28,side:a.variation?.side||1,damping:a.variation?.damping||.88};this.threads.set(a,thread);}const distance=Math.hypot(end.x-start.x,end.y-start.y);if(a.phase==='flight'){if(!thread.extruded&&distance>8){delete thread.nodes;thread.extruded=true;}const flowScale=this.fitLength(thread,distance,a.variation?.slack||1.22);const feedAngle=a.angle+Math.PI/2*(a.variation?.side||1)+(a.variation?.deflect||0),force=(a.variation?.force||1800)*flowScale;thread.feedX=Math.cos(feedAngle)*force;thread.feedY=Math.sin(feedAngle)*force;}else{this.fitLength(thread,distance,a.variation?.slack||1.22);thread.feedX=thread.feedY=0;}this.viscous(c,start,end,e,.1,a.id,width,a.phase==='wind'?.65:.95,thread);if(a.phase==='flight'&&distance>8)this.gel(c,a.x,a.y,2.8,t,a.id);}

   else if(a.kind==='glob')this.glob(c,a,e);
   // Mist has no outward projectile/wisp animation; contact and attached clouds remain visible.


  }
  for(const v of s.swarms){const b=L.target(e,v.target);if(!b)continue;const dx=b.x-v.x,dy=b.y-v.y,d=Math.hypot(dx,dy),age=t-v.born,fade=clamp((v.until-t)/.6),grow=clamp(age/.35);for(let i=2;i<v.tail.length;i+=3){const p=v.tail[i];c.save();c.globalAlpha=.15*fade*(1-i/v.tail.length);c.translate(p.x,p.y);A.fog(c,v,14,t-i*.025,1);c.restore();}c.save();c.translate(v.x,v.y);c.rotate(Math.atan2(dy,dx));c.scale(1+clamp(d/60)*.8,.82);c.globalAlpha=.66*fade*grow;A.fog(c,v,b.radius+13,t,1);c.restore();}

  for(const v of s.events){const age=t-v.at;if(age>.65)continue;const k=1-age/.65;if(v.type==='snap'){const end={x:v.endX,y:v.endY},dx=end.x-v.x,dy=end.y-v.y;const recoil=Math.pow(Math.max(0,1-age/.45),2);if(recoil>0)this.viscous(c,v,{x:v.x+dx*.65*recoil,y:v.y+dy*.65*recoil},e,.1,v.owner,5*k,k);for(let i=0;i<5;i++){const u=(i+1)/6,x=v.x+dx*u+Math.sin(i)*age*12,y=v.y+dy*u-age*18*(1-u);this.gel(c,x,y,1.7*k,t,i,.8);}}if(v.type==='shed'){c.save();c.translate(v.x,v.y);c.globalAlpha=k*.35;A.fog(c,{...v,id:v.owner+77},25+age*12,t,1);c.restore();}}
 c.restore();},
 invade(c,b,e,age,angle,kind){const q=clamp(age/.38),shrink=1-q,color=kind==='mist'||kind==='swarm'?'#b5ed71':'#a3d85c';for(let i=-1;i<=1;i++){const a=angle+i*.45+q*.6,r=b.radius*(.92-.65*q),x=b.x+Math.cos(a)*r,y=b.y+Math.sin(a)*r;c.beginPath();c.ellipse(x,y,(2.5+shrink*2)*shrink,(1.6+shrink*2.8)*shrink,a,0,TAU);c.fillStyle=color;c.globalAlpha=.8*shrink;c.fill();}c.globalAlpha=1;},
 front(r,e){const s=e.livingVenom;if(!s)return;const c=r.ctx,t=e.time;c.save();for(const a of s.attacks){if(a.phase!=='cling')continue;const b=L.target(e,a.target);if(!b)continue;const life=a.kind==='mist'||a.kind==='swarm'?L.config.mistCling:L.config.clingTime,q=clamp((t-a.phaseAt)/life);if(a.kind==='glob'||a.kind==='tendril'){this.coating(c,b,a.contactAngle,q*.65,e,a.id,a.kind==='tendril'?4.5:7.5);continue;}if(a.kind==='mist'||a.kind==='swarm'){c.save();c.translate(b.x+Math.cos(a.contactAngle)*b.radius*.55,b.y+Math.sin(a.contactAngle)*b.radius*.55);c.rotate(a.contactAngle);c.scale(.6+q*.3,1.4);c.globalAlpha=.45*(1-q*.4);A.fog(c,a,b.radius*.72,t,1);c.restore();continue;}for(let i=-1;i<=1;i++){const angle=a.contactAngle+i*.28+q*.65,rr=b.radius*(.98-q*.25),x=b.x+Math.cos(angle)*rr,y=b.y+Math.sin(angle)*rr;this.gel(c,x,y,(a.kind==='glob'?5:3.2)*(1-q*.7),t,a.id+i,.6);}}
  for(const v of s.binds){const b=L.target(e,v.target),layout=this.roots.get(v);if(!b||!layout)continue;for(const strand of layout.strands){if(t<v.born+strand.delay+strand.growTime)continue;const end={x:b.x+strand.offset.x,y:b.y+strand.offset.y};this.gel(c,end.x,end.y,strand.i===0?5:3.5,t,v.pool+strand.i,.65);}}
  for(const v of s.events){const age=t-v.at,b=L.target(e,v.target);if(b&&v.type==='invade'&&age<.38){if(v.kind==='glob'||v.kind==='tendril')this.coating(c,b,v.angle,.65+age/.38*.35,e,v.owner,v.kind==='tendril'?4.5:7.5);else this.invade(c,b,e,age,v.angle,v.kind);}}
 c.restore();}
};
// Persistent ambient reactions are replaced by combat-owned capture and invasion states.
A.react=function(){};
const world=G.Renderer.prototype.drawWorld;G.Renderer.prototype.drawWorld=function(e){world.call(this,e);F.behind(this,e);};
const effects=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){effects.call(this,e);F.front(this,e);};
})(typeof window!=='undefined'?window:globalThis);

