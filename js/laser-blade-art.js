(function(root){
  'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>1-(1-clamp(v))**3;
  const poly=(c,p,color)=>{c.fillStyle=color;c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fill();},line=(c,p,color,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke();};
  function blade(c,len,w,alpha=1){c.save();c.globalAlpha*=alpha;poly(c,[[24,-w*.45],[len*.7,-w],[len-24,-w*.55],[len,0],[len-28,w*.5],[len*.35,w*.8],[24,w*.38]],'#7a542b');poly(c,[[25,-w*.35],[len*.69,-w*.72],[len-25,-w*.43],[len-2,0],[len-28,w*.35],[len*.35,w*.55],[25,w*.28]],'#ffd56b');poly(c,[[28,0],[len*.71,-w*.28],[len-15,-w*.1],[len-2,0],[len-30,w*.12],[len*.35,w*.23]],'#fffbe0');line(c,[[25,w*.28],[len*.35,w*.55],[len-28,w*.35],[len-2,0]],'#fffef1',Math.max(.7,w*.08));line(c,[[27,-w*.3],[len*.68,-w*.62],[len-25,-w*.35]],'#f3a53d',Math.max(.7,w*.07));c.restore();}
  function trail(c,start,end,reach,width,alpha){if(end<=start)return;c.save();c.globalAlpha*=alpha;const p=[];for(let i=0;i<=20;i++){const a=start+(end-start)*i/20;p.push([Math.cos(a)*reach,Math.sin(a)*reach]);}for(let i=20;i>=0;i--){const a=start+(end-start)*i/20,r=reach-width*(i/20);p.push([Math.cos(a)*r,Math.sin(a)*r]);}poly(c,p,'#ffe7a5');c.restore();}
  // Solar rig is presentation-only. Its angle comes from the authoritative sweep,
  // never an independently eased animation, and its sampling consumes no RNG.
  function arc(c,r,a,z,color,w=1){c.beginPath();c.arc(0,0,Math.max(.1,r),a,z);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
  function sector(c,inner,outer,a,z,color){c.beginPath();c.arc(0,0,outer,a,z);c.arc(0,0,inner,z,a,true);c.closePath();c.fillStyle=color;c.fill();}
  function sample(u){const age=u.laserClock||0,unload=clamp((age-G.LaserBlade.returnStart)/.95),open=ease(age/.44),close=ease((age-.32)/.48),fold=ease((unload-.36)/.64);return{age,unload,open,close,fold,alpha:1-ease((unload-.76)/.24),angle:u.laserAngle??u.aim-1.2,reach:u.laserReach||300,forge:ease((age-.8)/.42)};}
  G.LaserSolarArt={sample};
  function optics(c,s,aim){
    const r=31+27*s.open-24*s.fold,load=clamp((s.age-.3)/.5)*(1-s.unload),rotation=.46*(1-s.close)-.13*clamp((s.age-1.4)/.36)+.18*s.fold;
    c.save();c.globalAlpha*=s.alpha;c.rotate(rotation);
    // One continuous recessed race, with three curved load-bearing shells.
    arc(c,r,0,TAU,'#1e2831',7);arc(c,r-4,0,TAU,'#715b39',1);
    for(let i=0;i<3;i++){
      const a=i*TAU/3+.2,z=a+1.82;
      sector(c,r-1,r+7,a,z,'#40382d');sector(c,r+3,r+7,a+.04,z-.04,'#9f824c');
      arc(c,r+6,a+.08,z-.12,'#e4c784',1.2);arc(c,r-1,a+.08,z-.08,load>.7?'#ffedac':'#7f704b',1.3);
      for(const end of [a+.16,z-.16]){c.save();c.rotate(end);poly(c,[[r-4,-3],[r+8,-3],[r+8,3],[r-4,3]],'#5b5140');line(c,[[r-3,-2],[r+6,-2]],'#e7cd8b',.8);c.restore();}
      // Slotted rails constrain each lens; they remain connected while it slides.
      c.save();c.rotate(a+.9);line(c,[[29,0],[r-4,0]],'#202b32',8);line(c,[[30,-2.5],[r-4,-2.5]],'#967a47',1.1);
      const x=r-9-(r-43)*s.close+13*s.fold;
      poly(c,[[x-5,-10],[x+5,-10],[x+8,-5],[x+8,5],[x+5,10],[x-5,10],[x-8,5],[x-8,-5]],'#3b4140');
      poly(c,[[x-3,-8],[x+3,-8],[x+5,-4],[x+5,4],[x+3,8],[x-3,8]],load>.8?'#ffe9a8':'#b5bda1');
      line(c,[[x-2,-7],[x-4,0],[x-2,7]],load>.5?'#fff7c6':'#e0d9ae',1.7);
      c.restore();
    }
    // Segmented inner aperture leaves overlap on a common ring, never floating squares.
    for(let i=0;i<6;i++){const a=i*TAU/6+.34*(1-s.close);sector(c,26,32,a,a+.93,'#6b5938');arc(c,27,a+.1,a+.86,load>.8?'#ffe8a0':'#b79858',1);}
    c.restore();
    // Three light paths converge at the rotating emitter, not an arbitrary centre flash.
    if(s.age<1.4&&s.age>.25){const power=ease((s.age-.25)/.36)*(1-clamp((s.age-1.02)/.24)),root=[Math.cos(s.angle)*31,Math.sin(s.angle)*31];
      c.save();c.globalAlpha*=power*.62;
      for(let i=0;i<3;i++){const a=i*TAU/3+1.1+rotation,x=Math.cos(a)*43,y=Math.sin(a)*43;line(c,[[x,y],[root[0],root[1]]],'#f9ce6e',.8);const q=(s.age*2+i/3)%1;line(c,[[x+(root[0]-x)*q,y+(root[1]-y)*q],[x+(root[0]-x)*Math.min(1,q+.16),y+(root[1]-y)*Math.min(1,q+.16)]],'#fff7d5',1.8);}
      c.restore();}
  }
  function emitter(c,s){
    // A forked collimator attached to the inner axle supports the full blade.
    for(const side of [-1,1]){poly(c,[[23,side*5],[28,side*12],[44,side*13],[59,side*7],[59,side*4],[43,side*7],[31,side*6]],'#3f3930');poly(c,[[29,side*10],[44,side*11],[56,side*6],[43,side*8]],'#d4af64');line(c,[[31,side*7],[44,side*8],[57,side*4]],'#fff0b3',1.1);}
    c.save();c.globalAlpha*=clamp((s.age-.65)/.3)*(1-s.unload);line(c,[[27,0],[53,0]],'#fff7cf',3);c.restore();
  }
  function glow(c,x,y,r,power=1){
    c.save();c.globalAlpha*=power;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffe8');g.addColorStop(.12,'#fff2adbd');g.addColorStop(.38,'#ffc64d45');g.addColorStop(1,'#ff990000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
  }
  function chargeLight(c,s){
    const gathering=ease(s.age/.6)*(1-clamp((s.age-.78)/.2)),lock=clamp((s.age-.25)/.55)*(1-clamp((s.age-1.35)/.18));
    if(gathering>0){
      c.save();c.globalCompositeOperation='lighter';
      // Deterministic inward flow: coherent curved paths, not a field of unrelated glitter.
      for(let i=0;i<42;i++){
        const phase=(s.age*(1.2+i%3*.22)+i*.618)%1,a=i*2.399+.38*(1-phase),r=35+(1-phase)**1.7*(65+i%5*16),tail=6+(1-phase)*13;
        c.globalAlpha=gathering*(.18+.64*phase);line(c,[[Math.cos(a-.05)* (r+tail),Math.sin(a-.05)*(r+tail)],[Math.cos(a)*r,Math.sin(a)*r]],i%4?'#f7c55f':'#fff7d7',i%4?.8:1.7);
      }
      for(let j=0;j<3;j++){const q=(s.age*1.6+j/3)%1;c.globalAlpha=gathering*(1-q)*.65;arc(c,32+(1-q)*62,-s.age*2+j*2,-s.age*2+j*2+1.65,'#ffdf81',1.8*(1-q)+.5);}
      c.restore();
    }
    if(lock>0){c.save();c.globalCompositeOperation='lighter';glow(c,Math.cos(s.angle)*32,Math.sin(s.angle)*32,35+lock*19,lock*.56);c.restore();}
    // Ignition / release use brief local diffraction rather than a full-screen white card.
    for(const at of [.8,1.4]){const q=(s.age-at)/.24;if(q<0||q>1)continue;c.save();c.rotate(s.angle);c.translate(44,0);c.globalCompositeOperation='lighter';c.globalAlpha=(1-q)**2;glow(c,0,0,at===1.4?92:65,.9);c.strokeStyle='#fff5bd';c.lineWidth=2*(1-q)+.5;c.beginPath();c.ellipse(0,0,5+q*30,10+q*62,0,0,TAU);c.stroke();line(c,[[-20-q*30,0],[45+q*100,0]],'#fff9d8',1.6);line(c,[[0,-12-q*35],[0,12+q*35]],'#ffdf88',.9);c.restore();}
  }
  function energyEnvelope(c,length,width,age,fill,rough=1){
    const top=[],bottom=[];
    for(let i=0;i<=52;i++){const q=i/52,x=45+(length-45)*q,edge=Math.sin(Math.PI*q)**.4,w=(2+width*edge)*(1-q**16),ripple=(Math.sin(q*39-age*21)+Math.sin(q*87+age*33)*.45)*rough*edge;top.push([x,-w+ripple]);bottom.push([x,w+ripple*.6]);}
    poly(c,[...top,...bottom.reverse()],fill);
  }
  function solarBlade(c,s){
    if(s.age<.8)return;
    const length=49+(s.reach-49)*s.forge*(1-ease(s.unload/.77));if(length<=50)return;
    const power=ease((s.age-.8)/.18)*(1-s.unload),width=8+4*Math.sin(clamp((s.age-.8)/.6)*Math.PI*.5),age=s.age;
    c.save();c.globalCompositeOperation='lighter';
    // The body is emitted light: no bronze back, bevel, outline or solid metal plane.
    const halo=c.createLinearGradient(0,-35,0,35);halo.addColorStop(0,'#ff9d0000');halo.addColorStop(.25,'#ffac0020');halo.addColorStop(.44,'#ffd16c9c');halo.addColorStop(.5,'#fffad4df');halo.addColorStop(.56,'#ffd16c9c');halo.addColorStop(.75,'#ffac0020');halo.addColorStop(1,'#ff9d0000');
    c.globalAlpha=power;energyEnvelope(c,length,width+18,age,halo,2.2);
    const body=c.createLinearGradient(0,-15,0,15);body.addColorStop(0,'#ffbb2b00');body.addColorStop(.23,'#ffce5e85');body.addColorStop(.42,'#fff3b5ef');body.addColorStop(.5,'#fffff8');body.addColorStop(.58,'#fff3b5ef');body.addColorStop(.77,'#ffce5e85');body.addColorStop(1,'#ffbb2b00');
    energyEnvelope(c,length,width,age,body,.75);
    // A stable, unbroken white-hot axis carries the cutting direction.
    energyEnvelope(c,length,3.2,age,'#ffffed',.16);
    for(let strand=0;strand<5;strand++){
      const points=[];for(let i=0;i<=38;i++){const q=i/38,x=46+(length-46)*q,w=Math.sin(q*Math.PI)**.5,side=(strand%2?1:-1),y=side*(6+strand*2.5)*w+Math.sin(q*24-age*17+strand*1.8)*2.2*w;points.push([x,y]);}
      c.globalAlpha=power*(strand%2?.28:.5);line(c,points,strand%2?'#ffc23f':'#fff6c7',strand%2?.8:1.2);
    }
    // Root-to-tip luminous packets keep the material alive between formation and sweep.
    for(let i=0;i<24;i++){
      const q=(i*.618+age*(s.unload?-.9:2.4))%1;if(q<0)continue;
      const x=48+q*(length-48),side=i%2?1:-1,y=side*(9+5*Math.sin(q*Math.PI))*(.3+Math.sin(q*Math.PI)*.7);
      c.globalAlpha=power*(.18+.45*Math.sin(q*Math.PI));line(c,[[x,y],[Math.max(47,x-7-i%4*3),y*.9]],i%3?'#ffd46f':'#fffde9',i%3?.8:1.5);
    }
    c.globalAlpha=power;glow(c,48,0,42,.68);glow(c,length-3,0,19,.45);
    c.restore();
  }
  function afterimage(c,s,aim){
    if(s.age<1.4)return;
    const progress=clamp((s.age-1.4)/.36),end=aim-1.2+progress*2.4,start=aim-1.2,fade=1-ease(clamp((s.age-1.76)/.68));if(fade<=0||end<=start)return;
    c.save();c.globalCompositeOperation='lighter';
    const field=c.createRadialGradient(0,0,34,0,0,s.reach);field.addColorStop(0,'#ffb52c00');field.addColorStop(.22,'#ffc33b0c');field.addColorStop(.64,'#ffcb512b');field.addColorStop(.93,'#ffde8a3d');field.addColorStop(1,'#fff1bc00');
    c.globalAlpha=fade;sector(c,35,s.reach,start,end,field);
    // Swept energy has a bright moving front and older, progressively broken arcs.
    for(let i=0;i<6;i++){
      const lag=(i+1)*.055,angle=end-lag;if(angle<start)continue;c.save();c.rotate(angle);c.globalAlpha=fade*(.32-i*.043);const tail=s.reach*(1-i*.025);energyEnvelope(c,tail,5+i*.8,s.age-i*.017,'#ffd777',.3);c.restore();
    }
    for(let band=0;band<3;band++){
      const radius=s.reach*(.34+band*.25),points=[];
      for(let j=0;j<=80;j++){
        const q=j/80;if(q>progress)break;const a=start+q*2.4,r=radius+Math.sin(q*17+s.age*3+band)*3+Math.sin(q*43-band)*1.2;
        points.push([Math.cos(a)*r,Math.sin(a)*r]);
      }
      if(points.length>1){const heat=fade*Math.exp(-Math.max(0,s.age-1.65)*4);c.globalAlpha=heat*.22;line(c,points,'#ffc851',6-band);c.globalAlpha=heat*.64;line(c,points,band%2?'#ffdf8b':'#fff0bc',1.15);}
    }
    // Sparks peel tangentially off the actual sweep, then cool during recovery.
    for(let i=0;i<34;i++){
      const q=(i+.5)/34;if(q>progress)continue;const a=start+q*2.4,t=Math.max(0,s.age-(1.4+q*.36));if(t>.6)continue;
      const r=85+(i*67%310)+t*(22+i%4*11),x=Math.cos(a)*r,y=Math.sin(a)*r,tx=-Math.sin(a),ty=Math.cos(a);
      c.globalAlpha=(1-t/.6)**2*.72;line(c,[[x,y],[x+tx*(4+t*28),y+ty*(4+t*28)]],i%4?'#ffd477':'#fffbe2',i%4?.8:1.4);
    }
    // Reaction jets share the blade's axis; they decorate, never move the actor.
    if(s.age<1.76){c.save();c.rotate(s.angle);c.globalAlpha=.6;for(const side of [-1,1])poly(c,[[23,side*14],[0,side*20],[-37,side*28],[-14,side*18],[21,side*11]],'#ffe4a0');c.restore();}
    c.restore();
  }
  function fragments(c,reach,p){ // Abort/end only: light drains inward instead of an unexplained explosion.
    for(let i=0;i<12;i++){const q=(i+.5)/12,x=28+(reach-28)*q*(1-ease(p));c.save();c.globalAlpha*=(1-p)*.6;line(c,[[x,0],[Math.max(24,x-10-8*q),0]],i%3?'#edca76':'#fff8cf',i%3?1:1.8);c.restore();}
  }
  function giant(c,b,e){const u=b.arcana,s=sample(u);c.save();c.translate(b.x,b.y);chargeLight(c,s);afterimage(c,s,u.aim);optics(c,s,u.aim);c.save();c.rotate(s.angle);c.globalAlpha*=s.alpha;emitter(c,s);solarBlade(c,s);c.restore();c.restore();}
  function solarContact(c,f,p){
    const block=f.style==='cutBlock',entity=f.style==='entityCut',length=block?19:entity?13:48,travel=ease(p);
    c.save();c.globalCompositeOperation='lighter';
    if(!entity){glow(c,0,0,(block?34:59)*(1-p*.5),block?.48:.85);c.save();c.scale(.45,1);arc(c,12+travel*(block?35:53),0,TAU,block?'#c4f9ef':'#ffeaaa',Math.max(.4,(1-p)*3));c.restore();}
    c.rotate(Math.PI/2);
    const g=c.createLinearGradient(-length,0,length,0);g.addColorStop(0,'#ffad0000');g.addColorStop(.25,block?'#7be2de90':'#ffd15da0');g.addColorStop(.5,block?'#eaffff':'#ffffff');g.addColorStop(.75,block?'#7be2de90':'#ffd15da0');g.addColorStop(1,'#ffad0000');
    c.globalAlpha*=1-p*.6;line(c,[[-length,0],[length,0]],g,Math.max(.6,(1-p)*6));
    if(!block){
      for(let i=0;i<(entity?4:22);i++){
        const side=i%2?1:-1,spread=(i*2.399),v=12+i%5*13,x=Math.cos(spread)*travel*v,y=side*(4+travel*(15+i%6*10));
        c.globalAlpha=(1-p)**1.2*(i%4?.65:1);line(c,[[x,y],[x+Math.cos(spread)*(3+travel*8),y+side*(3+travel*13)]],i%4?'#ffd775':'#ffffea',i%4?.9:1.8);
      }
    }else{for(const side of [-1,1])line(c,[[side*7,0],[side*(16+travel*26),-12-travel*18]],'#c5f6ee',1.5);}
    c.restore();
  }
  G.LaserBladeView={
    background(r,e){if(!e.balls.some(b=>G.LaserBlade.active(b)))return;const ages=e.balls.filter(b=>G.LaserBlade.active(b)).map(b=>b.arcana.laserClock||0),a=Math.max(...ages.map(age=>age<.8?ease(age/.2)*.28:age>G.LaserBlade.returnStart?.28*(1-clamp((age-G.LaserBlade.returnStart)/.95)):.28));r.ctx.save();r.ctx.fillStyle='#02040a';r.ctx.globalAlpha=a;r.ctx.fillRect(0,0,G.Constants.width,G.Constants.height);r.ctx.restore();},
    front(r,e){const c=r.ctx;c.save();for(const b of e.balls){if(b.hp<=0)continue;if(G.LaserBlade.active(b)){giant(c,b,e);continue;}if(G.LaserRegularView?.actor(r,b,e))continue;const s=b.role;if(b.type==='laser'&&s.jetActive){c.save();c.translate(b.x,b.y);c.rotate(s.jetAngle);const q=clamp(s.jetClock/G.LaserBlade.jetDuration),power=1-q*.45;poly(c,[[-21,-7*power],[-36,-9*power],[-62,-4],[-50,0],[-61,4],[-36,8*power],[-21,6*power]],'#a7772f');poly(c,[[-22,-4],[-35,-4],[-53,-1],[-47,2],[-22,4]],'#fff6c8');line(c,[[-24,0],[-45,0]],'#ffffff',2);for(const side of [-1,1])line(c,[[-47,side*6],[-60,side*8]],'#e4c575',1.2);for(let i=1;i<=2;i++){c.globalAlpha=.17/i;c.beginPath();c.ellipse(-i*17,0,b.radius,b.radius*.88,0,0,TAU);c.fillStyle='#f2cf75';c.fill();}c.restore();}if(b.type!=='laser'||!s.bladePhase)continue;c.save();c.translate(b.x,b.y);const age=s.bladeClock||0,angle=s.bladeAngle||0;if(age>=G.LaserBlade.heatWarmup)trail(c,Math.max(s.bladeAim-G.LaserBlade.heatLead,angle-.55),angle,G.LaserBlade.reach,11,.48*(1-clamp((age-G.LaserBlade.heatWarmup-G.LaserBlade.heatSweep)/G.LaserBlade.heatRecovery)));c.rotate(angle);blade(c,24+(G.LaserBlade.reach-24)*ease(age/G.LaserBlade.heatWarmup),4.5,age<G.LaserBlade.heatWarmup+G.LaserBlade.heatSweep?1:1-clamp((age-G.LaserBlade.heatWarmup-G.LaserBlade.heatSweep)/G.LaserBlade.heatRecovery));c.restore();}
      for(const f of e.effects){if(f.kind!=='laserBlade')continue;if(G.LaserRegularView?.effect(r,f,e))continue;const p=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);c.globalAlpha=(1-p)**1.5;
      if(f.giant&&['cutHit','cutBlock','entityCut'].includes(f.style)){solarContact(c,f,p);c.restore();continue;}
      if(f.style==='solarEnd')fragments(c,f.reach||260,p);
      if(['entityCut','cutHit','cutBlock'].includes(f.style)){const len=f.style==='cutHit'?25:13;line(c,[[-len*(1+p),-3-p*6],[len*(1+p),3+p*6]],f.style==='cutBlock'?'#c5e9e1':'#fff7d5',2*(1-p)+.4);for(const side of [-1,1])poly(c,[[side*(3+p*22),-2-p*7],[side*(9+p*24),-1-p*5],[side*(8+p*22),2-p*4]],'#eec370');}c.restore();}c.restore();}
  };
})(typeof window!=='undefined'?window:globalThis);
