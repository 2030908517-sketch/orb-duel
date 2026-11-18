(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
 const line=(c,pts,color,w)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=w;c.stroke();};
 const arc=(c,r,a,z,color,w)=>{c.beginPath();c.arc(0,0,r,a,z);c.strokeStyle=color;c.lineWidth=w;c.stroke();};
 const V=G.TimeRegularView={
  rimPiece(c,r,a,span,shift=0,spin=0,alpha=1){const mid=a+span*.5;c.save();c.globalAlpha*=alpha;c.translate(Math.cos(mid)*shift,Math.sin(mid)*shift);c.rotate(spin);c.beginPath();c.arc(0,0,r,a,a+span);c.arc(0,0,r-6,a+span,a,true);c.closePath();const metal=c.createLinearGradient(-r,-r,r,r);metal.addColorStop(0,'#f3edff');metal.addColorStop(.2,'#9699c5');metal.addColorStop(.48,'#3d456a');metal.addColorStop(.7,'#c2cae5');metal.addColorStop(1,'#62617f');c.fillStyle=metal;c.fill();arc(c,r,a,a+span,'#d1d6ed',.7);arc(c,r-6,a,a+span,'#252f4b',1.2);arc(c,r-1,a+.04,a+Math.min(span-.02,.31),'#faf2ff',1.2);
   const count=Math.max(3,Math.floor(span*9));for(let i=0;i<count;i++){const t=a+.055+i*(span-.11)/(count-1),inner=r-(i%3?3.6:5);line(c,[[Math.cos(t)*inner,Math.sin(t)*inner],[Math.cos(t)*(r-1.5),Math.sin(t)*(r-1.5)]],i%3?'#9fadd0':'#f1dfb8',i%3?.55:.9);}c.restore();
  },
  dial(c,r,hand=0,solid=true){
   if(solid){const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#f0ecff');g.addColorStop(.22,'#afa5db');g.addColorStop(.48,'#514b83');g.addColorStop(.76,'#d0c7f7');g.addColorStop(1,'#70628f');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();const f=c.createRadialGradient(-r*.3,-r*.4,0,0,0,r);f.addColorStop(0,'#575582');f.addColorStop(.4,'#292a4d');f.addColorStop(1,'#121b31');c.fillStyle=f;c.beginPath();c.arc(0,0,r*.84,0,TAU);c.fill();arc(c,r*.91,-2.5,-.6,'#fbf5ff',.8);}
   for(let i=0;i<24;i++){const a=i*TAU/24,x=Math.cos(a),y=Math.sin(a),major=i%6===0;line(c,[[x*r*(major?.58:.72),y*r*(major?.58:.72)],[x*r*.8,y*r*.8]],major?'#fff0cf':'#b6b4d8',major?1:.55);}
   for(const [a,l,w]of [[hand-.5,r*.43,1.35],[hand-2,r*.65,.9]])line(c,[[0,0],[Math.cos(a)*l,Math.sin(a)*l]],'#f2f3ff',w);
   c.fillStyle='#f8e8bd';c.beginPath();c.arc(0,0,1.2,0,TAU);c.fill();
   if(solid){c.save();c.rotate(-.5);const g=c.createLinearGradient(0,-r,0,0);g.addColorStop(0,'#e4f5ff5c');g.addColorStop(1,'#b1d5ff00');c.fillStyle=g;c.beginPath();c.ellipse(0,-r*.33,r*.66,r*.28,0,0,TAU);c.fill();c.restore();}
  },
  field(r,d,e){if(d.visualSource==='clock')return this.clockField(r,d,e);const c=r.ctx,t=e.time,armed=t>=d.armedAt,open=ease((t-d.armedAt+.25)/.25),fade=clamp((d.expires-t)/.35),rad=d.radius,covered=e.timeDomains.some(v=>v!==d&&v.visualSource!=='clock'&&v.owner===d.owner&&v.id>d.id&&Math.hypot(v.x-d.x,v.y-d.y)<Math.min(v.radius,rad)*.7);
   c.save();c.translate(d.x,d.y);c.globalAlpha=fade;c.lineCap='round';
   const g=c.createRadialGradient(0,0,rad*.08,0,0,rad);g.addColorStop(0,'#726ca00a');g.addColorStop(.72,'#8f8bc71b');g.addColorStop(.95,'#9692d52c');g.addColorStop(1,'#a8c2f411');c.fillStyle=g;c.beginPath();c.arc(0,0,rad,0,TAU);c.fill();
   arc(c,rad,0,TAU,armed?'#c0b8eeaa':'#a79fc480',armed?1.3:.8);arc(c,rad-3,-2.9,-.6,'#f3edff7a',.7);arc(c,rad-5,.5,2.7,'#697cae91',.65);
   if(covered){c.restore();return;}
   c.save();c.rotate((t-d.armedAt)*(armed?d.rate:.12)*.6);for(let i=0;i<48;i++){const a=i*TAU/48,major=i%4===0;c.globalAlpha=fade*(major?.8:.38);line(c,[[Math.cos(a)*(rad-7),Math.sin(a)*(rad-7)],[Math.cos(a)*(rad-(major?13:9)),Math.sin(a)*(rad-(major?13:9))]],major?'#f0e4c9':'#c2c4ed',major?1.05:.6);}c.restore();
   c.globalAlpha=fade*.52;c.fillStyle='#e2dbf4';c.font=Math.max(6,rad*.12)+'px Georgia';c.textAlign='center';c.textBaseline='middle';for(const [str,a]of [['XII',-Math.PI/2],['III',0],['VI',Math.PI/2],['IX',Math.PI]])c.fillText(str,Math.cos(a)*rad*.64,Math.sin(a)*rad*.64);
   if(armed){const a=(t-d.armedAt)*d.rate*.75-Math.PI/2;c.save();c.rotate(a);c.globalAlpha=fade*.2;const s=c.createRadialGradient(0,0,0,0,0,rad*.77);s.addColorStop(0,'#c9cbf800');s.addColorStop(1,'#b9bff4');c.fillStyle=s;c.beginPath();c.moveTo(0,0);c.arc(0,0,rad*.76,-.27,0);c.closePath();c.fill();line(c,[[0,0],[rad*.77,0]],'#e5e5ff',.8);c.restore();}
   else{c.globalAlpha=fade*.8;arc(c,rad*open,-Math.PI/2,-Math.PI/2+TAU*open,'#e2dbff',1);}
   if(armed&&t-d.armedAt<.2){c.globalAlpha=fade*(1-(t-d.armedAt)/.2)*.65;arc(c,rad*(.84+.16*ease((t-d.armedAt)/.2)),0,TAU,'#f5efff',1.5);}
   c.restore();
  },
  clockField(r,d,e){const c=r.ctx,age=Math.max(0,e.time-d.armedAt),fade=clamp((d.expires-e.time)/.38),open=ease(age/.3),rad=d.radius,closing=ease(1-(d.expires-e.time)/.4),seed=(d.id%17)*.37;
   c.save();c.translate(d.x,d.y);c.lineJoin='round';c.lineCap='round';c.globalAlpha=fade;
   const g=c.createRadialGradient(-rad*.18,-rad*.16,rad*.08,0,0,rad);g.addColorStop(0,'#a6a1df19');g.addColorStop(.6,'#687ab231');g.addColorStop(.9,'#a5b9e31c');g.addColorStop(1,'#afbbef04');c.fillStyle=g;c.beginPath();c.arc(0,0,rad,0,TAU);c.fill();
   // The perimeter is a refractive surface, not detached pieces of a metal clock.
   const rim=c.createRadialGradient(0,0,rad-9,0,0,rad);rim.addColorStop(0,'#a5b6de00');rim.addColorStop(.65,'#9aaee21a');rim.addColorStop(.9,'#d6dffd35');rim.addColorStop(1,'#d6dffd00');c.fillStyle=rim;c.beginPath();c.arc(0,0,rad,0,TAU);c.fill();arc(c,rad-.5,0,TAU,'#b1bfe346',.65);
   c.beginPath();c.arc(0,0,rad-1,0,TAU);c.clip();
   // Taper both ends of each moving highlight into the same continuous boundary.
   for(let i=0;i<3;i++){const a=seed+i*2.12-age*(.32+i*.06),span=1.45+(i%2)*.35,outer=[],inner=[],crest=[];
    for(let j=0;j<=36;j++){const u=j/36,t=a+span*u,s=Math.sin(Math.PI*u),env=s*s,rr=rad-1.6-(1-open)*7-closing*5+Math.sin(t*3+age*.8+i)*.6*env,depth=(2.5+1.1*Math.sin(u*5+age+i))*env;
     outer.push([Math.cos(t)*rr,Math.sin(t)*rr]);inner.push([Math.cos(t)*(rr-depth),Math.sin(t)*(rr-depth)]);if(j>4&&j<32)crest.push([Math.cos(t)*(rr-depth*.18),Math.sin(t)*(rr-depth*.18)]);}
    c.globalAlpha=fade*open*(.6+.12*Math.sin(age*1.1+i));c.beginPath();[...outer,...inner.reverse()].forEach((p,j)=>j?c.lineTo(...p):c.moveTo(...p));c.closePath();
    const sheen=c.createLinearGradient(-rad,-rad,rad,rad);sheen.addColorStop(0,'#dceaff99');sheen.addColorStop(.45,'#95a7d756');sheen.addColorStop(.7,'#d2dafa8f');sheen.addColorStop(1,'#8eacd32b');c.fillStyle=sheen;c.fill();
    c.globalAlpha=fade*open*.5;line(c,crest,'#dfe9ff',.65);
   }
   // Broad, low-contrast refraction pulses flow inward instead of static centre wires.
   for(let i=0;i<3;i++){const q=(age*.42+i/3)%1,rr=rad*(.2+.67*(1-q));c.globalAlpha=fade*open*Math.sin(q*Math.PI)*.24;
    const a=seed-age*.7+i*2.1;arc(c,rr,a,a+1.5,'#bac8f1',1.2);arc(c,rr-2,a+.1,a+1.15,'#7b8cb9',2.5);}
   // These faces share their original fracture edges and dial coordinates.
   // Each moves around its own centre, rather than seven similar chips orbiting the field.
   const face=rad*.69,parts=[
    {centre:[-.48,-.48],drift:[-1,-.65],points:[[-.05,-.05],[-.36,-.25],[-1.04,-.25],[-.8,-.8],[-.24,-1.05],[.05,-.7]]},
    {centre:[.41,-.45],drift:[.8,-1],points:[[-.05,-.05],[.05,-.7],[-.24,-1.05],[.68,-.87],[1.06,-.2],[.4,-.13],[.17,.12]]},
    {centre:[.63,.32],drift:[1,.55],points:[[.17,.12],[.4,-.13],[1.06,-.2],[1.02,.38],[.45,.96],[.29,.48]]},
    {centre:[-.04,.58],drift:[.13,1],points:[[-.05,-.05],[.17,.12],[.29,.48],[.45,.96],[-.05,1.06],[-.54,.92],[-.32,.32]]},
    {centre:[-.62,.17],drift:[-1,.3],points:[[-.05,-.05],[-.32,.32],[-.54,.92],[-.98,.49],[-1.04,-.25],[-.36,-.25]]}
   ];
   for(let i=0;i<parts.length;i++){const s=parts[i],cx=s.centre[0]*face,cy=s.centre[1]*face,scatter=(1-open)*11+open*(5+i%3*1.2),drift=(1-closing*.7),dx=(s.drift[0]*scatter+Math.sin(age*(.86+i*.13)+seed+i*2)*2)*drift,dy=(s.drift[1]*scatter+Math.cos(age*(1.1+i*.09)+i)*2.2)*drift;
    c.save();c.translate(cx+dx,cy+dy);c.rotate(Math.sin(age*(.65+i*.08)+i*1.8)*.12+(i-2)*.018);c.scale(1,.9+.09*Math.sin(age*.9+i));c.translate(-cx,-cy);c.globalAlpha=fade*open*.88;
    c.beginPath();s.points.forEach((p,j)=>j?c.lineTo(p[0]*face,p[1]*face):c.moveTo(p[0]*face,p[1]*face));c.closePath();c.clip();c.beginPath();c.arc(0,0,face,0,TAU);c.clip();
    const enamel=c.createLinearGradient(-face,-face,face,face);enamel.addColorStop(0,'#6f7d9c9c');enamel.addColorStop(.4,'#28364b9c');enamel.addColorStop(1,'#162239a6');c.fillStyle=enamel;c.fillRect(-face,-face,face*2,face*2);
    arc(c,face-1,0,TAU,'#b2bedca1',2.5);arc(c,face-4.1,0,TAU,'#586a8d',.8);
    this.dial(c,face*.98,-age*.7,false);
    c.font=Math.max(7,face*.21)+'px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#e0d8bf';
    for(const [text,a]of [['XII',-Math.PI/2],['III',0],['VI',Math.PI/2],['IX',Math.PI]])c.fillText(text,Math.cos(a)*face*.48,Math.sin(a)*face*.48);
    // Fracture edges are clipped portions of this plate, never extra floating wires.
    const edge=s.points.map(p=>[p[0]*face,p[1]*face]);line(c,[...edge,edge[0]],'#bdcdea',1.05);
    const stripe=((age*.3+i*.23)%1)*face*3-face*1.5,gloss=c.createLinearGradient(stripe-9,0,stripe+9,0);gloss.addColorStop(0,'#d4e4ff00');gloss.addColorStop(.5,'#d4e4ff24');gloss.addColorStop(1,'#d4e4ff00');c.fillStyle=gloss;c.fillRect(-face,-face,face*2,face*2);c.restore();
   }
   c.restore();
  },
  slowBody(r,b,e){const amount=clamp(1-b.temporal.rate),c=r.ctx;if(amount<=0)return false;const a=Math.atan2(b.vy,b.vx),rad=b.radius;c.save();c.translate(b.x,b.y);c.rotate(a);c.lineCap='round';
   // Refractive drag clings to two flanks, never a dotted status halo.
   for(const side of [-1,1]){c.save();c.globalAlpha=amount*.66;c.beginPath();c.moveTo(rad*.1,side*(rad+2));c.bezierCurveTo(-rad*.4,side*(rad+5),-rad*.9,side*(rad+4),-rad*1.35,side*(rad*.75));const glint=c.createLinearGradient(-rad*1.35,0,rad*.1,0);glint.addColorStop(0,'#919ac700');glint.addColorStop(.5,'#bac6ecb0');glint.addColorStop(1,'#eff0ff');c.strokeStyle=glint;c.lineWidth=1.2;c.stroke();c.translate(-rad*.5,side*(rad+3));c.rotate(side*.25);line(c,[[0,-2],[0,2]],'#ddd8ef',.7);c.restore();}
   c.globalAlpha=amount*.23;line(c,[[-rad-1,-3],[-rad-17,-2]],'#c4c9eb',.75);line(c,[[-rad-3,4],[-rad-23,5]],'#c4c9eb',.55);c.restore();return true;
  },
  clock(r,p,e){const c=r.ctx,a=p.angle,nx=Math.cos(a),ny=Math.sin(a),t=e.time-(p.started||0);c.save();c.translate(p.x,p.y);c.rotate(a);c.lineCap='round';
   const tail=c.createLinearGradient(-48,0,-8,0);tail.addColorStop(0,'#7e8bd900');tail.addColorStop(.6,'#a5b3e244');tail.addColorStop(1,'#e4eaffbb');for(const s of [-1,1]){c.beginPath();c.moveTo(-9,s*5);c.bezierCurveTo(-20,s*7,-29,s*3,-46,s*(1+Math.sin(t*13)*.7));c.strokeStyle=tail;c.lineWidth=1.4;c.stroke();}line(c,[[-37,0],[-13,0]],'#b9c7f057',.6);
   c.save();c.rotate(-a);this.dial(c,11.6,t*5,true);c.restore();c.restore();
  },
  cast(r,b,e){const c=r.ctx,s=b.temporal,p=ease(1-(s.castAt-e.time)/.35),a=s.aim,reach=b.def.clockRange;c.save();c.translate(b.x,b.y);c.rotate(a);c.globalAlpha=.25+p*.55;c.setLineDash([3,7]);line(c,[[b.radius+15,0],[reach,0]],'#c2c6e8',.7);c.setLineDash([]);c.globalAlpha=.6+p*.4;
   c.save();c.translate(b.radius+8+5*p,0);c.scale(.5+.5*p,.5+.5*p);c.rotate(-a);this.dial(c,8,p*3,true);c.restore();for(const side of [-1,1])line(c,[[reach-5,side*4],[reach,0]],'#eee6ff',.8);c.restore();
  },
  burst(r,f){const c=r.ctx,p=clamp(f.age/f.life),q=ease(p/.32),rad=f.radius;c.save();c.translate(f.x,f.y);c.lineCap='round';
   if(p<.48){const a=1-p/.48,g=c.createRadialGradient(0,0,1,0,0,rad);g.addColorStop(0,'#f1e9ff88');g.addColorStop(.22,'#a9b9fa50');g.addColorStop(1,'#758ae000');c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(0,0,rad*q,0,TAU);c.fill();}
   for(let i=0;i<9;i++){const a=i*TAU/9+.17,rr=13+q*(rad*.57)+(p*p)*(8+(i%3)*5),span=.31+(i%3)*.04;c.save();c.rotate(a);c.translate(rr,0);c.rotate((i%2?1:-1)*p*.65);c.globalAlpha=(1-p)**1.4;const g=c.createLinearGradient(-3,0,3,0);g.addColorStop(0,'#68678d');g.addColorStop(.6,'#d4d3f2');g.addColorStop(1,'#fbf6ff');c.strokeStyle=g;c.lineWidth=2.6*(1-p)+.4;c.beginPath();c.arc(-rr,0,rr,-span/2,span/2);c.stroke();line(c,[[-2,-1],[2,-1]],'#fff0ca',.8);c.restore();}
   for(let i=0;i<13;i++){const a=i*2.4,rr=7+ease(p)*(rad*(.5+(i%4)*.12));c.globalAlpha=(1-p)**2*.85;line(c,[[Math.cos(a)*rr,Math.sin(a)*rr],[Math.cos(a)*(rr+4*(1-p)),Math.sin(a)*(rr+4*(1-p))]],i%4?'#c0caef':'#f4e7bf',.75);}
   c.restore();
  },
  tick(r,f){const c=r.ctx,p=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.globalAlpha=(1-p)**1.6;for(let i=0;i<3;i++){const a=-1.9+i*.65,rr=12+p*10;line(c,[[Math.cos(a)*(rr-4),Math.sin(a)*(rr-4)],[Math.cos(a)*(rr+2),Math.sin(a)*(rr+2)]],'#ded5ff',1.1);}c.restore();},
  signature(r,f,e){if(e.timeRewind?.active||f.style!=='awaken')return false;const c=r.ctx,p=clamp(f.age/f.life),fade=(1-p)**1.3,owner=e.balls.find(v=>v.id===f.owner),point=owner||f;c.save();c.translate(point.x,point.y);c.lineCap='round';
   const form=ease(p/.42),release=ease((p-.48)/.52),rad=34+form*10+release*13;c.globalAlpha=fade;
   for(let i=0;i<6;i++){const a=i*TAU/6-.2*(1-form),z=a+Math.PI/3-.08;c.save();c.rotate((i%2?1:-1)*(1-form)*.2);arc(c,rad+2,a,z,'#303956',4);arc(c,rad,a,z,'#c4c2e8',1.7);arc(c,rad-2,a,z,'#f0eafa',.55);c.restore();}
   for(let i=0;i<24;i++){const a=i*TAU/24;line(c,[[Math.cos(a)*(rad-7*form),Math.sin(a)*(rad-7*form)],[Math.cos(a)*(rad-2),Math.sin(a)*(rad-2)]],i%6?'#b9bfe4':'#ffe7b2',i%6?.65:1.2);}
   const needle=-Math.PI/2+(1-ease(p/.6))*2.3;c.globalAlpha=fade*form;for(const side of [-1,1])line(c,[[Math.cos(needle)*side*28,Math.sin(needle)*side*28],[Math.cos(needle)*side*(rad-5),Math.sin(needle)*side*(rad-5)]],'#fff0cc',1.5);
   c.restore();return true;},
  recall(r,e){const c=r.ctx;for(const f of e.effects)if(f.kind==='timeRecall'&&f.path.length){const p=clamp(f.age/f.life),path=f.path,index=Math.floor((1-ease(p))*(path.length-1));c.save();c.lineCap='round';for(let i=Math.max(1,index-22);i<=index;i++){const a=path[i-1],b=path[i];c.globalAlpha=(1-p)*.6*(1-(index-i)/23);line(c,[[a.x,a.y],[b.x,b.y]],'#b7bde7',1.6);}const v=path[index];c.translate(v.x,v.y);c.globalAlpha=(1-p)*.75;for(let i=0;i<3;i++)arc(c,12+i*4,-2.7+i*.8,-2.1+i*.8,'#f2e8ff',1.1);c.restore();}}
 };
 const temporal=G.Renderer.prototype.drawTemporal,bursts=G.Renderer.prototype.drawTimeBursts;
 G.Renderer.prototype.drawTemporal=function(e){if(e.timeRewind?.active)return temporal.call(this,e);for(const d of e.timeDomains)V.field(this,d,e);for(const p of e.timeClocks)V.clock(this,p,e);for(const b of e.balls)if(b.type==='time'&&b.temporal.castAt>e.time)V.cast(this,b,e);};
 G.Renderer.prototype.drawTimeBursts=function(e){if(e.timeRewind?.active)return bursts.call(this,e);for(const f of e.effects){if(f.kind==='timeBurst')V.burst(this,f);else if(f.kind==='timeTick')V.tick(this,f);}V.recall(this,e);};
 // Only the non-ultimate field-recall overlay is replaced; the Arcana renderer stays intact.
 if(G.TimeRewindView){const front=G.TimeRewindView.front;G.TimeRewindView.front=function(r,e){if(e.timeRewind?.active)return front.call(this,r,e);};}
})(typeof window!=='undefined'?window:globalThis);
