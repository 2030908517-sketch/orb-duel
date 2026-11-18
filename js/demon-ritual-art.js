(function(root){
  'use strict';
  const G=root.OrbDuel,V=G.DemonView,TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>1-(1-clamp(n))**3;
  const line=(c,p,color,w=1)=>{c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.strokeStyle=color;c.lineWidth=w;c.stroke();};
  const poly=(c,p,color)=>{c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fillStyle=color;c.fill();};
  function glow(c,x,y,r,power=1){c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=power;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffb37e9c');g.addColorStop(.22,'#f04b3b59');g.addColorStop(.6,'#97133127');g.addColorStop(1,'#500d2200');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  function ring(c,x,y,r,color,w=1){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
  const R=G.DemonRitualView={
    state(e){const f=e.demonCinematic;if(!f)return null;const b=e.balls.find(v=>v.id===f.owner),t=e.balls.find(v=>v.id===f.target),s=e.demonWorld?.souls.find(v=>v.id===f.soul);if(!b||!t||!s)return null;return{f,b,t,s,age:f.age,mid:{x:(t.x+s.x)/2,y:(t.y+s.y)/2},heat:clamp((f.age-.36)/.76),dye:clamp((f.age-1.12)/.88)};},
    // A living flame silhouette with curling tips and open negative spaces, not a luminous beam.
    fire(c,x,y,size,time,tilt=0,alpha=1){if(size<=0||alpha<=0)return;c.save();c.translate(x,y);c.rotate(tilt);c.scale(size,size);c.globalAlpha*=alpha;const bend=Math.sin(time*11)*4;
      c.fillStyle='#3a0c22';c.beginPath();c.moveTo(-15,6);c.bezierCurveTo(-25,-8,-12,-22,-17,-32);c.quadraticCurveTo(-5,-28,-7,-17);c.bezierCurveTo(-1,-29,-11,-43,bend+8,-58);c.quadraticCurveTo(bend+1,-35,11,-32);c.quadraticCurveTo(22,-38,18,-46);c.bezierCurveTo(34,-28,12,-14,22,-5);c.quadraticCurveTo(25,11,0,12);c.quadraticCurveTo(-8,13,-15,6);c.fill();
      c.fillStyle='#b9223c';c.beginPath();c.moveTo(-11,5);c.bezierCurveTo(-19,-5,-5,-19,-10,-28);c.quadraticCurveTo(0,-24,-4,-13);c.bezierCurveTo(5,-23,-2,-36,bend+6,-47);c.quadraticCurveTo(bend+5,-26,12,-25);c.quadraticCurveTo(18,-27,19,-34);c.quadraticCurveTo(23,-21,11,-12);c.quadraticCurveTo(22,-4,13,4);c.quadraticCurveTo(7,11,-11,5);c.fill();
      c.fillStyle='#f35b43';c.beginPath();c.moveTo(-8,4);c.quadraticCurveTo(-11,-6,-2,-15);c.quadraticCurveTo(1,-10,-1,-3);c.quadraticCurveTo(11,-11,6,-28);c.quadraticCurveTo(20,-15,10,-5);c.quadraticCurveTo(15,5,2,8);c.quadraticCurveTo(-3,8,-8,4);c.fill();
      c.fillStyle='#ffd49a';c.beginPath();c.moveTo(-5,4);c.quadraticCurveTo(-6,-3,0,-7);c.quadraticCurveTo(2,-2,4,-1);c.quadraticCurveTo(8,5,0,7);c.quadraticCurveTo(-3,7,-5,4);c.fill();c.restore();
    },
    sigil(c,x,y,r,draw,heat,time){if(draw<=0)return;c.save();c.translate(x,y);c.scale(1,.68);c.globalAlpha*=ease(draw/.25);glow(c,0,0,r*1.7,heat*.75);
      c.beginPath();c.arc(0,0,r,-Math.PI/2,-Math.PI/2+TAU*clamp(draw*1.8));c.strokeStyle='#4b142b';c.lineWidth=5;c.stroke();c.strokeStyle='#ba3b52';c.lineWidth=2;c.stroke();
      const pts=[];for(let i=0;i<=5;i++){const a=Math.PI/2+(i*2%5)*TAU/5;pts.push([Math.cos(a)*r*.83,Math.sin(a)*r*.83]);}
      const progress=clamp((draw-.18)/.82)*5;for(let i=0;i<5;i++){const q=clamp(progress-i);if(!q)continue;const a=pts[i],b=pts[i+1],end=[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q];line(c,[a,end],'#661d37',5);line(c,[a,end],heat>.4?'#ffa077':'#dd6b74',1.65);}
      c.save();c.rotate(-time*.16);for(let i=0;i<15;i++){const a=i*TAU/15;if(i/15>draw)continue;c.save();c.rotate(a);line(c,[[r+5,-3],[r+9,1],[r+5,5]],'#cf5862',1);if(i%3===0)line(c,[[r+5,0],[r+12,0]],'#ffa37d',1);c.restore();}c.restore();
      c.beginPath();c.arc(0,0,r+15,.2,.2+TAU*clamp((draw-.3)/.7));c.strokeStyle='#72213b';c.lineWidth=1;c.stroke();c.restore();
    },
    embers(c,x,y,age,count,spread,power=1){c.save();c.globalCompositeOperation='lighter';for(let i=0;i<count;i++){const q=(age*(.8+i%3*.17)+i*.618)%1,a=i*2.399,dx=Math.cos(a)*spread*(.2+q),dy=-q*(28+i%6*9)+Math.sin(a)*spread*.3;c.globalAlpha=power*(1-q)**1.4;line(c,[[x+dx,y+dy],[x+dx+Math.sin(a)*2,y+dy-3-i%3]],i%4?'#e76554':'#ffdb9c',i%4?.8:1.5);}c.restore();},
    ribbon(c,points,width,color,rough=0,phase=0){
      if(points.length<2||width<=0)return;const top=[],bottom=[];
      for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,q=i/(points.length-1),w=width*Math.sin(Math.PI*q)**.42;const wa=w*(1+rough*(Math.sin(i*.83-phase)*.6+Math.sin(i*1.79+phase)*.3)),wb=w*(1+rough*(Math.sin(i*.97+phase)*.6+Math.cos(i*1.63-phase)*.3));top.push([p[0]-dy/len*wa,p[1]+dx/len*wa]);bottom.push([p[0]+dy/len*wb,p[1]-dx/len*wb]);}
      const outline=[...top,...bottom.reverse()],last=outline[outline.length-1];c.beginPath();c.moveTo((last[0]+outline[0][0])*.5,(last[1]+outline[0][1])*.5);for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])*.5,(a[1]+b[1])*.5);}c.closePath();c.fillStyle=color;c.fill();
    },
    jet(c,a,b,age,power){if(power<=0)return;const angle=Math.atan2(b.y-a.y,b.x-a.x),distance=Math.hypot(b.x-a.x,b.y-a.y),len=(distance+34)*ease((age-.32)/.22),width=(21+17*power)*power;c.save();c.translate(a.x,a.y);c.rotate(angle);glow(c,len*.72,0,95,power*.72);
      // One continuous advecting stream, not repeated upright flame stamps.
      for(const [color,scale,shift]of [['#390b27',1.35,0],['#a51c3c',1.03,1.4],['#ed5140',.65,2.1],['#ffc47e',.23,2.8]]){
        const points=[];for(let i=0;i<=52;i++){const q=i/52,x=len*q,y=Math.sin(q*12-age*17+shift)*width*.17*q+Math.sin(q*24-age*12)*width*.065*q;points.push([x,y]);}this.ribbon(c,points,width*scale,color,.55,age*18+shift);
      }
      c.save();c.globalCompositeOperation='lighter';
      for(let j=0;j<7;j++){const q=(age*1.7+j/7)%1,side=j%2?1:-1,x=len*(.16+q*.91),y=side*width*(.28+q*.2),points=[];for(let i=0;i<=20;i++){const u=i/20,ang=side*(u*4.7-age*.6),r=(2+q*12)*(1-u*.8);points.push([x+Math.cos(ang)*r-len*.13*(1-u),y+Math.sin(ang)*r]);}c.globalAlpha=power*(1-q)*.72;this.ribbon(c,points,1.2+q*2.7,j%3?'#ffb66d':'#ffedb9');}c.restore();
      for(let i=0;i<12;i++){const q=(age*1.9+i*.618)%1,side=i%2?1:-1,x=len*(.55+q*.75),y=side*width*(.4+q*.85);c.save();c.globalAlpha=power*(1-q);c.translate(x,y);c.rotate(side*(q+.2));c.beginPath();c.moveTo(-9,0);c.quadraticCurveTo(0,-7,11,-2);c.quadraticCurveTo(2,-2,-2,4);c.quadraticCurveTo(2,0,-9,0);c.fillStyle=i%3?'#e65449':'#ffca89';c.fill();c.restore();}c.restore();
    },
    mantleSample(age){return{strength:clamp((age-1.12)/.22)*(1-ease((age-2)/.4)),open:ease((age-1.78)/.62),turn:(age-1.12)*3.3};},
    mantle(c,x,y,age,back=false){const m=this.mantleSample(age);if(m.strength<=0)return;c.save();const radius=47+36*m.open,phase=m.turn,half=back?Math.PI:0;
      // Same envelope before and after spawn: no second ignition or closed curtain.
      for(const side of [-1,1]){const points=[];for(let i=0;i<=44;i++){const q=i/44,a=half+q*Math.PI+phase*.12*side,r=radius+(1-q)*8+Math.sin(q*14-age*11)*3;points.push([x+Math.cos(a)*r*side,y+Math.sin(a)*r*.64-8-q*9]);}
        c.globalAlpha=m.strength*(back?.58:.86);this.ribbon(c,points,back?12:15,'#4b102b',.68,age*17);this.ribbon(c,points,back?8:10,'#b42a42',.55,age*19+side);
        for(let patch=0;patch<4;patch++){const q=(age*1.2+patch/4)%1,from=Math.max(0,Math.floor((q-.16)*44)),to=Math.min(45,Math.floor((q+.12)*44));if(to-from<3)continue;const part=points.slice(from,to);c.globalAlpha=m.strength*(back?.55:.85)*(1-q*.4);this.ribbon(c,part,back?4:5.5,'#ed6849',.55,age*18+patch);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=m.strength*.4;this.ribbon(c,part.slice(0,Math.max(3,Math.floor(part.length*.6))),1.8,'#ffd29a',.4,age*18);c.restore();}
        for(let j=0;j<7;j++){const q=(age*1.4+j/7)%1,a=half+q*Math.PI+phase*.12*side,r=radius+Math.sin(q*14-age*11)*3,px=x+Math.cos(a)*r*side,py=y+Math.sin(a)*r*.64-8-q*9;c.globalAlpha=m.strength*(1-q)*.8;this.ribbon(c,[[px,py],[px+side*(8+q*12),py-10-q*10],[px+side*(2+q*7),py-22-q*12]],2.8,'#f58b61');}
      }this.embers(c,x,y,age,40,62+30*m.open,m.strength*.8);glow(c,x,y,105,m.strength*.32);c.restore();
    },
    excludeBodies(c,q){
      // Preserve readable centres at their real positions. Clip each hole separately.
      for(const b of [q.b,q.t]){c.beginPath();c.rect(-1000,-1000,2400,2400);c.moveTo(b.x+b.radius*.82,b.y);c.arc(b.x,b.y,b.radius*.82,0,TAU);c.clip('evenodd');}
    },
    subtitleY(e,b,base,index=0){return b?.type==='demon'?28+index*31:base;},
    floor(r,e){const q=this.state(e);if(!q)return;const{f,b,s,age,dye}=q,c=r.ctx;
      if(age<.25){for(let i=0;i<7;i++){const k=i/6;c.save();c.globalAlpha=(1-age/.25)*(.1+k*.13);V.orb(r,b,f.from.x+(f.to.x-f.from.x)*k,f.from.y+(f.to.y-f.from.y)*k,23,e,1,.7);c.restore();}this.embers(c,f.from.x,f.from.y,age,16,35,1-age/.25);}
      if(age>.16)this.sigil(c,s.x,s.y+9,62,clamp((age-.16)/.7),clamp((age-.45)/.9),age);
      if(dye>0){this.mantle(c,s.x,s.y+9,age,true);c.save();c.globalAlpha=(1-dye)*.6;ring(c,s.x,s.y+6,40+dye*72,'#c44051',1.6);c.restore();}
    },
    rope(c,s,t,e){const q=this.state(e);if(!q||q.s.id!==s.id)return false;const{age,heat}=q,dx=s.x-t.x,dy=s.y-t.y,mid=q.mid;
      if(age<1.12){line(c,[[t.x,t.y],[s.x,s.y]],'#3c1229',5);line(c,[[t.x,t.y],[s.x,s.y]],'#e55d69',2);const span=.025+heat*.2,a=.5-span,b=.5+span;line(c,[[t.x+dx*a,t.y+dy*a],[t.x+dx*b,t.y+dy*b]],'#ffe5bb',1.4+heat*1.4);glow(c,mid.x,mid.y,15+heat*22,heat*.65);}
      else {const retract=ease((age-1.12)/.24),pieces=[[0,.5*(1-retract)],[.5+.5*retract,1]];for(const[a,b]of pieces){if(b-a<.002)continue;line(c,[[t.x+dx*a,t.y+dy*a],[t.x+dx*b,t.y+dy*b]],'#ef8b7b',2);const k=a===0?b:a;glow(c,t.x+dx*k,t.y+dy*k,12,(1-retract)*.7);}}
      return true;
    },
    soul(r,s,t,e){const q=this.state(e);if(!q||q.s.id!==s.id)return false;const c=r.ctx,dye=ease(q.dye),size=s.radius+(18-s.radius)*q.dye;c.save();c.translate(s.x,s.y);
      // Red progressively invades the original silhouette; it is the same soul, not a new flame unit.
      V.orb(r,t,0,0,size,e,false,.66+q.dye*.34);
      if(dye>0){c.save();const edge=size*(1-2*dye);c.beginPath();c.moveTo(-size-5,edge+3);for(let i=0;i<=8;i++){const x=-size+2*size*i/8,y=edge+Math.sin(i*2.3+q.age*3)*2.5;c.lineTo(x,y);}c.lineTo(size+5,size+5);c.lineTo(-size-5,size+5);c.closePath();c.clip();V.orb(r,t,0,0,size,e,1,.9);c.restore();
        c.save();c.globalAlpha=clamp(q.dye*2)*(1-ease((q.dye-.72)/.28));for(let i=0;i<4;i++){const a=i*1.5+.2;c.save();c.rotate(a);line(c,[[-size*.7,6],[-size*.25,-2],[2,3],[size*.5,-7]],'#ffb88e',.9);c.restore();}c.restore();}
      c.restore();
      if(q.age<1.12){const fade=1-clamp((q.age-.85)/.27);for(const side of [-1,1])V.chain(c,s.x+side*35,s.y+18,s.x+side*8,s.y+6,fade*.8,true);}
      return true;
    },
    gate(c,claw,e){if(!claw.arcStage)return;const p=clamp((e.time-claw.warningAt)/(claw.at-claw.warningAt)),flight=clamp((e.time-claw.at)/claw.flight),fade=clamp((claw.expires-e.time)/.18),pin=claw.arcStage==='pin';c.save();c.translate(claw.startX,claw.startY);c.rotate(claw.portalAngle);c.globalAlpha=fade;glow(c,0,0,48,ease(p)*.48);
      // Arcana-only inner rift and side flames; the gate's anchor and facing stay fixed.
      for(const side of [-1,1]){this.fire(c,side*11,23,.36*ease(p),e.time+side*.6,side*.25,.8);line(c,[[side*15,-31],[side*24,-15],[side*18,7],[side*12,34]],pin?'#e58f97':'#be3e53',1.5);}
      if(pin){const charge=clamp((e.time-(claw.at-.16))/.16);glow(c,8,0,18,charge*.8);if(e.time>=claw.at&&!claw.hit){line(c,[[0,0],[(claw.x-claw.startX)*Math.cos(claw.portalAngle)+(claw.y-claw.startY)*Math.sin(claw.portalAngle),-(claw.x-claw.startX)*Math.sin(claw.portalAngle)+(claw.y-claw.startY)*Math.cos(claw.portalAngle)]],'#f3a89c',1.2*(1-flight));}}
      c.restore();
    },
    foreground(r,e){const c=r.ctx,q=this.state(e);c.save();
      for(const claw of e.demonWorld?.claws||[])this.gate(c,claw,e);
      if(q){const{b,s,age,heat,dye,mid}=q;
        if(age>.16&&age<.55){glow(c,b.x,b.y,44,(1-(age-.16)/.39)*.5);this.embers(c,b.x,b.y,age,20,28,clamp((.55-age)/.39));}
        c.save();this.excludeBodies(c,q);
        if(age>.32&&age<1.47){const dx=mid.x-b.x,dy=mid.y-b.y,d=Math.hypot(dx,dy)||1,power=ease((age-.32)/.2)*(1-ease((age-1.15)/.32));this.jet(c,{x:b.x+dx/d*19,y:b.y+dy/d*19},mid,age,power);this.embers(c,mid.x,mid.y,age,38,36,power);}
        if(age>=1.12&&age<1.64){const p=clamp((age-1.12)/.52);c.save();c.translate(mid.x,mid.y);c.rotate(Math.atan2(s.y-q.t.y,s.x-q.t.x)+Math.PI/2);glow(c,0,0,125,(1-p)**1.6);
          for(const side of [-1,1]){const points=[];for(let i=0;i<=38;i++){const u=i/38;points.push([side*u*(65+p*95),Math.sin(u*5-p*6)*16*Math.sin(u*Math.PI)]);}c.globalAlpha=(1-p)**1.3;this.ribbon(c,points,18*(1-p),'#a72644',.7,age*19);this.ribbon(c,points,8*(1-p),'#ed674c',.6,age*21);this.ribbon(c,points.slice(0,18),2.2*(1-p),'#ffdeb0',.4,age*23);}c.restore();this.embers(c,mid.x,mid.y,age*1.6,46,82,(1-p)**1.2);}
        c.restore();this.soul(r,s,q.t,e);
        if(dye>0){c.save();this.excludeBodies(c,q);this.mantle(c,s.x,s.y+9,age,false);c.restore();}

      }
      for(const f of e.effects){if(f.kind!=='demonSoul')continue;if(f.style==='hellfireSeal')this.birth(r,e,f);else if(f.style==='pierce'&&!f.soulId&&e.balls.some(b=>b.id===f.owner&&G.DemonArcana.active(b))){const p=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);glow(c,0,0,43,(1-p)*.6);for(const side of [-1,1])line(c,[[-20-p*18,side*(3+p*12)],[16+p*27,0]],'#ffbd9e',1.8*(1-p));c.restore();}}
      c.restore();
    },
    birthFloor(r,e,f){const power=(1-clamp(f.age/f.life))**1.2;this.sigil(r.ctx,f.x,f.y+9,62,1,power,2+f.age);this.mantle(r.ctx,f.x,f.y+9,2+f.age,true);},
    birth(r,e,f){const c=r.ctx,b=e.balls.find(v=>v.id===f.owner),record=e.demonWorld?.servants.find(v=>v.owner===f.owner),t=record&&e.balls.find(v=>v.id===record.host);c.save();if(b&&t)this.excludeBodies(c,{b,t});this.mantle(c,f.x,f.y+9,2+f.age,false);c.restore();}

  };
  // Install only in Arcana-capable pages; ordinary / team visuals remain the original methods.
  const hellfire=V.hellfire,rope=V.rope,soul=V.soul,front=V.front,behind=V.behind;
  V.hellfire=function(r,e){if(e.demonCinematic)return R.floor(r,e);return hellfire.call(this,r,e);};
  V.rope=function(c,s,t,e){if(R.rope(c,s,t,e))return;return rope.call(this,c,s,t,e);};
  V.soul=function(r,s,t,e){if(R.state(e)?.s.id===s.id)return;return soul.call(this,r,s,t,e);};
  V.behind=function(r,e){for(const f of e.effects)if(f.kind==='demonSoul'&&f.style==='hellfireSeal')R.birthFloor(r,e,f);behind.call(this,r,e);};
  V.front=function(r,e){front.call(this,r,e);R.foreground(r,e);};
})(typeof window!=='undefined'?window:globalThis);
