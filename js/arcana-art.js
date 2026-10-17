(function(root){
  'use strict';
  const G=root.OrbDuel,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),paths=new Map();
  const path=d=>{if(!paths.has(d)){if(paths.size>=256)paths.clear();paths.set(d,new Path2D(d));}return paths.get(d);};
  function fill(c,d,color){c.fillStyle=color;c.fill(path(d));}
  function stroke(c,d,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.stroke(path(d));}
  function ribbon(c,a,b,width,color,bend=0){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,mx=(a.x+b.x)/2+nx*bend,my=(a.y+b.y)/2+ny*bend;c.fillStyle=color;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(mx+nx*width,my+ny*width,b.x,b.y);c.quadraticCurveTo(mx-nx*width*.4,my-ny*width*.4,a.x,a.y);c.fill();}
  function arc(c,x,y,r,start,end,width,color){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(.01,r),start,end);c.stroke();}
  // Reuse the approved vector geometry. Formation reveals a local edge, then its body;
  // the finished blade never grows from an icon-sized copy.
  function bez(a,b,c,d,t){const q=1-t;return {x:q*q*q*a[0]+3*q*q*t*b[0]+3*q*t*t*c[0]+t*t*t*d[0],y:q*q*q*a[1]+3*q*q*t*b[1]+3*q*t*t*c[1]+t*t*t*d[1]};}
  const outline=[];for(let i=0;i<=28;i++)outline.push(bez([348,92],[624,53],[854,167],[884,337],i/28));for(let i=1;i<=28;i++)outline.push(bez([884,337],[916,507],[731,642],[438,614],i/28));
  function edgeBand(progress){const shape=new Path2D();for(const [i,p] of outline.entries())i?shape.lineTo(p.x,p.y):shape.moveTo(p.x,p.y);for(let i=outline.length-1;i>=0;i--){const p=outline[i],dx=490-p.x,dy=350-p.y,len=Math.hypot(dx,dy)||1,w=280*progress*Math.pow(Math.sin(i/(outline.length-1)*Math.PI),.7);shape.lineTo(p.x+dx/len*w,p.y+dy/len*w);}shape.closePath();return shape;}
  function blade(c,x,y,angle,form=1,alpha=1,edge=form){
    const D=G.CodeBloodBladeData;if(!D)return;c.save();c.translate(x,y);c.rotate(angle);c.scale(.16,.16);c.translate(-730,-350);c.globalAlpha*=alpha;
    const gradients={};for(const g of D.gradients){const v=c.createLinearGradient(+g.x1,+g.y1,+g.x2,+g.y2);for(const s of g.stops)v.addColorStop(+(s.offset||0),s['stop-color']+(s['stop-opacity']===undefined?'':Math.round(+s['stop-opacity']*255).toString(16).padStart(2,'0')));gradients[g.id]=v;}
    function node(n){const a=n.a;c.save();c.globalAlpha*=a.opacity===undefined?1:+a.opacity;if(a['clip-path'])c.clip(path(D.body));if(n.tag==='g')n.children.forEach(node);else{const d=n.tag==='use'?D.body:a.d;if(d){if(a.fill!=='none'){c.fillStyle=a.fill?.startsWith('url')?gradients[a.fill.slice(5,-1)]:a.fill||'#000';c.fill(path(d));}if(a.stroke)stroke(c,d,a.stroke,+(a['stroke-width']||1));}}c.restore();}
    if(form>0){c.save();c.globalAlpha*=clamp((form-.4)/.6);D.nodes.slice(0,3).forEach(node);c.restore();c.save();if(form<.995)c.clip(edgeBand(form));D.nodes.slice(3).forEach(node);c.restore();}
    if(form<1&&edge>0){c.globalAlpha*=.8;c.setLineDash([Math.max(.1,650*edge),1800]);stroke(c,'M884 337 C854 167 624 53 348 92',gradients.edge,4);stroke(c,'M884 337 C916 507 731 642 438 614',gradients.edge,4);}c.restore();
  }
  // Compressed air: pointed wake, broad pressure face, separated dark body/light edge.
  // No anatomical fist or uniformly outlined sticker.
  function lance(c,x,y,angle,reach=110,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.scale(reach/110,1);
    fill(c,'M-94 -19 C-23 -35 56 -49 111 0 C65 42 -5 39 -88 22 C-53 16 -20 13 4 2 C-36 -9 -63 -13 -94 -19Z','#264b72');
    fill(c,'M-70 -19 C6 -32 62 -35 111 0 C65 30 6 30 -60 20 C-9 12 27 7 48 0 C20 -10 -25 -12 -70 -19Z','#356c9a');
    fill(c,'M-26 -19 C27 -30 76 -24 111 0 C82 20 33 29 -9 20 C41 13 66 9 83 0 C59 -11 20 -14 -26 -19Z','#82c7ed');
    fill(c,'M9 -22 C53 -28 90 -16 111 0 C87 18 47 28 19 22 C55 18 87 9 97 0 C81 -12 47 -21 9 -22Z','#d9f2ff');
    stroke(c,'M27 -24 C65 -25 95 -13 111 0 C94 14 68 22 42 24','#fffce9',1.6);
    ribbon(c,{x:-91,y:-34},{x:70,y:-17},2,'#80b8e0',-8);ribbon(c,{x:-64,y:35},{x:66,y:18},3,'#7ab7da',9);c.restore();
  }
  function impact(c,f){const p=clamp(f.age/.55),q=1-Math.exp(-p*7),normal=f.style==='fistImpact';c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);c.globalAlpha=Math.pow(1-p,1.6);
    // One convex pressure face moves downstream, then tears asymmetrically.
    // The middle remains open around the victim instead of a mirrored leaf burst.
    const front=14+q*60,span=26+q*66;c.save();c.translate(front,0);
    fill(c,`M-28 ${-span} C36 ${-span*.8} 47 ${span*.62} -19 ${span} C4 ${span*.55} 14 ${-span*.48} -28 ${-span}Z`,'#305373');
    fill(c,`M-24 ${-span} C35 ${-span*.75} 40 ${span*.69} -19 ${span} C11 ${span*.6} 20 ${-span*.54} -24 ${-span}Z`,normal?'#3f79a5':'#bc823b');
    fill(c,`M-20 ${-span*.96} C32 ${-span*.7} 38 ${span*.64} -13 ${span*.93} C17 ${span*.52} 23 ${-span*.48} -20 ${-span*.96}Z`,normal?'#8ccdf2':'#ffe0a0');
    stroke(c,`M-20 ${-span*.96} C32 ${-span*.7} 38 ${span*.64} -13 ${span*.93}`,normal?'#eafaff':'#fff8d4',1.5);c.restore();
    ribbon(c,{x:-30,y:-12},{x:75+q*100,y:-15-q*34},3,'#d7a35e',-15);
    ribbon(c,{x:-20,y:8},{x:40+q*110,y:23+q*24},1.6,'#83afd0',18);
    c.globalAlpha*=.75;for(let i=0;i<13;i++){const a=(i/12-.5)*2.7,d=18+q*(55+(i*31)%83),tip={x:Math.cos(a)*d,y:Math.sin(a)*d};ribbon(c,{x:tip.x*.62,y:tip.y*.62},tip,i%4===0?3:1.1,i%3?'#d79b57':'#fff4c9',((i%3)-1)*4);}
    if(f.age<.1){c.globalAlpha=1-f.age/.1;fill(c,'M-12 -4 L-4 -17 3 -6 17 -12 10 -2 28 3 9 8 1 23 -4 8 -22 14 -10 2Z','#fff8e3');}c.restore();
  }
  function wake(c,points,width=14,alpha=1){if(points.length<3)return;c.save();c.globalAlpha*=alpha;for(let layer=0;layer<3;layer++){const sides=[];c.fillStyle=['#654329','#bf853f','#f3d296'][layer];for(let i=0;i<points.length;i++){const p=points[i],next=points[Math.min(points.length-1,i+1)],prev=points[Math.max(0,i-1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1,w=(width-layer*3)*Math.pow(1-i/points.length,1.4)*(1+.12*Math.sin(i*.7));sides.push({p,nx:-dy/len,ny:dx/len,w});}c.beginPath();for(const [i,s]of sides.entries()){const x=s.p.x+s.nx*s.w*.45,y=s.p.y+s.ny*s.w*.45;i?c.lineTo(x,y):c.moveTo(x,y);}for(let i=sides.length-1;i>=0;i--){const s=sides[i];c.lineTo(s.p.x-s.nx*s.w*.6,s.p.y-s.ny*s.w*.6);}c.closePath();c.fill();}c.restore();}
  function orbit(c,b,e){const u=b.arcana;if(!u.center)return;const age=e.time-u.started,progress=clamp((age-u.entryDuration)/u.orbitDuration),head=u.heading??u.startAngle;c.save();wake(c,[b,...u.history],17,.92);
    if(progress>.42){const amount=clamp((progress-.42)/.58);for(let i=0;i<3;i++){c.globalAlpha=amount*(.3+i*.12);const a=head+i*TAU/3;arc(c,u.center.x,u.center.y,u.radius+4-i*4,a,a+1.65,3+i*2,i===2?'#e5bd7d':'#6c4b2f');}}
    c.globalAlpha=1;const speed=Math.atan2(b.vy,b.vx);c.save();c.translate(b.x,b.y);c.rotate(speed);fill(c,'M-9 -26 Q24 -23 30 0 Q19 24 -12 25 Q8 10 12 0 Q5 -15 -9 -26Z','#fff0c5');stroke(c,'M-9 -26 Q24 -23 30 0 Q19 24 -12 25','#fff9df',1.4);c.restore();
    for(let i=0;i<4;i++){const a=head-.4-i*.43;arc(c,u.center.x,u.center.y,u.radius+12+i*3,a-.22,a,1.2,i%2?'#8da6b3':'#e6b876');}c.restore();
  }
  function pressure(c,w){const r=w.radius,p=1-r/w.reach;c.save();c.globalAlpha=.9;for(let layer=0;layer<3;layer++){c.fillStyle=['#62442c','#c18a4c','#f4d8a4'][layer];c.beginPath();const n=96;for(let i=0;i<=n;i++){const a=i*TAU/n,rr=r+Math.sin(a*5+(w.spin||0))*(1-layer*.22),x=w.x+Math.cos(a)*(rr+5-layer*2),y=w.y+Math.sin(a)*(rr+5-layer*2);i?c.lineTo(x,y):c.moveTo(x,y);}for(let i=n;i>=0;i--){const a=i*TAU/n,rr=Math.max(.01,r-5+layer*2+Math.sin(a*5+(w.spin||0))*.8);c.lineTo(w.x+Math.cos(a)*rr,w.y+Math.sin(a)*rr);}c.closePath();c.fill();}
    for(let i=0;i<7;i++){const a=i*TAU/7+(w.spin||0);arc(c,w.x,w.y,r+9+(i%3)*3,a,a+.26,1,i%2?'#89a9bd':'#e8c58e');const outer={x:w.x+Math.cos(a)*(r+23),y:w.y+Math.sin(a)*(r+23)},inner={x:w.x+Math.cos(a+.16)*Math.max(1,r-5),y:w.y+Math.sin(a+.16)*Math.max(1,r-5)};c.globalAlpha=.45*(1-p*.5);ribbon(c,outer,inner,1.1,'#e6ce9e',7);}c.restore();
  }
  function sonicContact(c,f){const p=clamp(f.age/.42),fade=(1-p)**1.5,inward=clamp(f.age/.11),out=clamp((f.age-.11)/.31);c.save();c.translate(f.x,f.y);c.globalAlpha=fade;
    // Three concave folds converge from different sides, then tear away. This is
    // compression around the victim, not the normal orb's forward pressure blade.
    for(let i=0;i<3;i++){c.save();c.rotate(i*TAU/3+.25);const x=52-inward*31+out*22;fill(c,`M${x+8} -37 Q${x-31} -9 ${x+5} 35 Q${x-7} 3 ${x+16} -23Z`,'#a87842');fill(c,`M${x+8} -37 Q${x-22} -8 ${x+5} 35 Q${x-3} -1 ${x+13} -25Z`,'#f5d5a0');stroke(c,`M${x+8} -37 Q${x-22} -8 ${x+5} 35`,'#fff3ce',1.5);c.restore();}
    for(let i=0;i<10;i++){const a=i*TAU/10+.19,near=20+out*24,far=near+10+out*28;ribbon(c,{x:Math.cos(a)*near,y:Math.sin(a)*near},{x:Math.cos(a+.13)*far,y:Math.sin(a+.13)*far},i%3?1:2.4,i%2?'#d5b47c':'#b5cbd3',i%2?3:-3);}if(f.age<.045){c.globalAlpha=(1-f.age/.045)*.65;arc(c,0,0,18,-.8,1.6,3,'#fff8dd');}c.restore();
  }
  G.ArcanaView={
    blade,lance,
    // Kept for the historical comparison view's helper API, never rendered as a fist.
    fist(c,x,y,a,size=1){lance(c,x,y,a,65*size);},
    line(c,a,b,color,width){stroke(c,`M${a.x} ${a.y}L${b.x} ${b.y}`,color,width);},
    ellipse(c,x,y,rx,ry,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.stroke();},
    behind(r,e){const c=r.ctx;c.save();
      const active=e.balls.filter(b=>b.hp>0&&G.Arcana.busy(b));if(active.length){c.fillStyle='#020710';c.globalAlpha=.22;c.fillRect(0,0,G.Constants.width,G.Constants.height);c.globalAlpha=1;}
      for(const b of active){const u=b.arcana,t=e.balls.find(v=>v.id===u.target);if(u.phase==='warning'){
        const p=clamp((e.time-u.started)/(u.until-u.started));c.save();c.globalAlpha=.4+.5*p;
        if(b.type==='accelerator'&&u.anchor){const radius=G.Arcana.orbitRadius,margin=radius+24,q={x:clamp(u.anchor.x,margin,G.Constants.width-margin),y:clamp(u.anchor.y,margin,G.Constants.height-margin)};for(let i=0;i<3;i++)arc(c,q.x,q.y,radius,i*TAU/3+.12,i*TAU/3+1.7,1.2,'#cba86b');}
        else if(b.type==='normal'&&t){arc(c,t.x,t.y,t.radius+9,-.45,.45,2,'#edce9a');arc(c,t.x,t.y,t.radius+9,Math.PI-.45,Math.PI+.45,2,'#edce9a');}
        else if(b.type==='vampire'&&t&&!G.VampireArcanaView){for(const s of G.Arcana.bloodSlots(b,t,u.anchor)){c.save();c.globalAlpha=.25+p*.4;ribbon(c,b,s,1.4,'#8d2239',(s.slot-1)*27);c.restore();blade(c,s.x,s.y,s.angle,0,.3+p*.45,p*.8);}}
        // Flow converges towards the actor during warning; no early hit shapes.
        for(let i=0;i<7;i++){const a=i*TAU/7+.2,d=33+(1-p)*45;ribbon(c,{x:b.x+Math.cos(a)*d,y:b.y+Math.sin(a)*d},{x:b.x+Math.cos(a)*(d-13),y:b.y+Math.sin(a)*(d-13)},1.1,b.type==='vampire'?'#ac2942':'#cda772',5);}c.restore();
      }if(u.phase==='orbit')orbit(c,b,e);
        if(u.phase==='punch'){c.save();c.translate(b.x,b.y);c.rotate(u.aim);for(const sign of [-1,1]){c.save();c.scale(1,sign);fill(c,'M-65 -30 Q-33 -39 8 -23 L26 -7 Q-9 -24 -65 -30Z','#486580');stroke(c,'M-57 -30 Q-16 -31 21 -10','#efc782',1.7);c.restore();}c.restore();}
      }
      for(const w of e.arcanaWorld?.cones||[])if(w.inward)pressure(c,w);c.restore();
    },
    front(r,e){const c=r.ctx;c.save();for(const p of e.projectiles||[])if(p.mode==='arcBlood'&&!p.prison){const a=Math.atan2(p.vy,p.vx),form=p.launched?1:clamp((e.time-p.formedAt)/.34);if(p.launched&&p.history?.length>3){c.save();c.globalAlpha=.35;ribbon(c,p.history[Math.min(p.history.length-1,10)],p,4.5,'#a5263a',7);c.restore();}else if(!p.launched){const b=e.balls.find(b=>b.id===p.owner);if(b){c.save();c.globalAlpha=.28*(1-form*.6);ribbon(c,b,p,1.3,'#ab2c42',(p.slot-1)*25);c.restore();}}blade(c,p.x,p.y,a,form,1,1);}
      for(const original of e.effects){if(original.kind!=='arcana')continue;const a=Math.max(original.age,(e.presentationTime||0)-(original.bornReal||0)),f={...original,age:a};
        if(f.style==='blink'&&a<.15){c.save();c.globalAlpha=1-a/.15;for(let i=0;i<6;i++){const q=i/6,x=f.x+(f.endX-f.x)*q,y=f.y+(f.endY-f.y)*q;c.globalAlpha=(1-a/.15)*(.05+q*.3);c.fillStyle='#8bb2d6';c.beginPath();c.ellipse(x,y,24,14,f.angle,0,TAU);c.fill();}ribbon(c,{x:f.x,y:f.y},{x:f.endX,y:f.endY},1.5,'#bad9ed',5);c.restore();}
        if(f.style==='fist'&&a<.28){const p=clamp(a/.10);lance(c,f.x+Math.cos(f.angle)*p*24,f.y+Math.sin(f.angle)*p*24,f.angle,95+20*p,Math.pow(1-a/.28,.7));}
        if(f.style==='fistImpact'&&a<.55)impact(c,f);
        if(f.style==='sonicImpact'&&a<.42)sonicContact(c,f);
        if(f.style==='orbitWake'&&a<.32)wake(c,f.history||[],8,clamp(1-a/.32)*.55);
        if(f.style==='sonic'&&a>.5&&a<.9){c.save();c.globalAlpha=(.9-a)/.4*.4;for(let i=0;i<6;i++){const z=i*TAU/6,q=(a-.5)*65;arc(c,f.x,f.y,8+q,z,z+.6,1.2,'#b8b69b');}c.restore();}
        if((f.style==='bloodHit'||f.style==='bloodBlock')&&a<.34){const hp=f.style==='bloodHit';c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-a/.34)**1.2;const q=1-Math.exp(-a*26),span=25+q*18;fill(c,`M-7 ${-span} C17 -13 31 8 15 ${span} C23 8 9 -11 -7 ${-span}Z`,hp?'#b5263f':'#568e91');stroke(c,`M-7 ${-span} C17 -13 31 8 15 ${span}`,hp?'#ffb6a1':'#c6f3ed',1.8);if(hp)for(let i=0;i<4;i++){const sign=i%2?1:-1;ribbon(c,{x:5,y:sign*4},{x:18+q*(8+i*7),y:sign*(9+q*(5+i*5))},1.5*(1-a/.34),'#d94a53',sign*5);}c.restore();}
        if(f.style==='bloodLaunch'&&a<.24){c.save();c.globalAlpha=.45*(1-a/.24);ribbon(c,{x:f.x-Math.cos(f.angle)*45,y:f.y-Math.sin(f.angle)*45},f,2,'#df4254',f.slot%2?8:-8);c.restore();}
        if(f.style==='bloodMiss'&&a<.22){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=.55*(1-a/.22);for(let i=0;i<4;i++)ribbon(c,{x:-28+i*8,y:(i-1.5)*5},{x:-8+a*95+i*7,y:(i-1.5)*(7+a*15)},1.6,'#8e263b',3);c.restore();}
        if(f.style==='returnBlood'&&a<.85){const owner=e.balls.find(b=>b.id===f.owner&&b.hp>0);if(!owner)continue;const q=clamp(a/.45),back=clamp((a-.12)/.45),p=t=>({x:f.x+(owner.x-f.x)*t+Math.sin(t*Math.PI)*18,y:f.y+(owner.y-f.y)*t});c.save();c.globalAlpha=Math.min(1,a/.04)*clamp((.72-a)/.2);ribbon(c,p(back),p(q),4.4,'#bd263f',5);ribbon(c,p(back),p(q),1,'#ffa494',5);if(a>.4){c.globalAlpha=clamp(1-(a-.4)/.4)*.8;arc(c,owner.x,owner.y,owner.radius+3,-2.5,1.8,2,'#f6b4b4');}c.restore();}
        if(f.style==='shatter'&&a<.45){c.save();c.globalAlpha=1-a/.45;for(let i=0;i<9;i++){const z=i*TAU/9,d=30+a*140;c.save();c.translate(f.x+Math.cos(z)*d,f.y+Math.sin(z)*d);c.rotate(z+a);fill(c,'M-3 -7 L6 -2 2 8 -5 2Z','#b3e8e4');c.restore();}c.restore();}
      }c.restore();
    },
    overlay(r,e){const c=r.ctx,C=G.Constants,f=e.effects.find(v=>v.kind==='arcana'&&v.style==='fistImpact'&&v.age<.04);if(f){c.save();c.globalAlpha=.1*(1-f.age/.04);c.fillStyle='#ffedcb';c.fillRect(0,0,C.width,C.height);c.restore();}
      const titles=e.effects.filter(v=>v.kind==='arcana'&&v.style==='subtitle'&&Math.max(v.age,(e.presentationTime||0)-(v.bornReal||0))<v.life).slice(-2);
      c.save();c.setTransform(r.canvas.width/C.width,0,0,r.canvas.height/C.height,0,0);titles.forEach((v,i)=>{const age=Math.max(v.age,(e.presentationTime||0)-(v.bornReal||0)),b=e.balls.find(b=>b.id===v.owner),y=C.height-27-(titles.length-1-i)*31;c.save();c.globalAlpha=Math.min(1,age/.09,(v.life-age)/.35);c.fillStyle='#07101bea';c.fillRect(38,y-13,C.width-76,28);c.fillStyle=v.color;c.fillRect(38,y-13,2,28);c.textAlign='center';c.textBaseline='middle';c.font='600 8px "Segoe UI","Microsoft YaHei",sans-serif';c.fillStyle='#afbed0';c.fillText((v.side===0?'左方':'右方')+' · '+(b?.def.name||'')+' · 奥义',C.width/2,y-6);c.font='700 12px "Segoe UI","Microsoft YaHei",sans-serif';c.fillStyle='#fff2da';c.fillText(v.title,C.width/2,y+6,C.width-92);c.restore();});c.restore();}

  };
})(typeof window!=='undefined'?window:globalThis);
