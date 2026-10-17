(function(root){
  'use strict';
  const G=root.OrbDuel,A=G.ArcanaView,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
  const shapes=new Map(),path=d=>{if(!shapes.has(d)){if(shapes.size>180)shapes.clear();shapes.set(d,new Path2D(d));}return shapes.get(d);};
  function fill(c,d,color){c.fillStyle=color;c.fill(path(d));}
  function line(c,x,y,xx,yy,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
  function ghost(c,p,alpha){c.save();c.translate(p.x,p.y);c.globalAlpha*=alpha;c.fillStyle='#a6573a';c.beginPath();c.ellipse(0,0,20,21,0,0,TAU);c.fill();c.strokeStyle='#f6bf8c';c.lineWidth=1.2;c.beginPath();c.arc(0,0,21,-1.8,.4);c.stroke();c.fillStyle='#262133';c.beginPath();c.arc(0,0,5,0,TAU);c.fill();for(const s of [-1,1]){line(c,s*8,0,s*15,0,'#e4a67d',1.5);line(c,0,s*8,0,s*15,'#e4a67d',1.5);}c.restore();}
  function breech(c,b,e){const u=b.arcana,q=clamp((e.time-u.started)/G.RangerArcana.chargeTime),close=clamp(q/.4);c.save();c.translate(b.x,b.y);c.rotate(u.aim);
    // Three receiver planes seat independently; no complete weapon is scaled up.
    for(const sign of [-1,1]){c.save();c.scale(1,sign);c.translate(-(1-close)*15,(1-close)*12);
      fill(c,'M3 13 L17 7 46 7 53 11 42 17 15 19Z','#583a31');fill(c,'M11 13 L23 9 46 9 39 13 18 16Z','#be8255');line(c,23,9,45,9,'#ffd9a4',1.1);line(c,16,18,35,15,'#714d39',1.7);c.restore();}
    c.save();c.translate(-22*(1-clamp((q-.12)/.28)),0);fill(c,'M-11 -6 L22 -4 30 0 22 4 -11 6 -5 0Z','#543c32');fill(c,'M2 -2 L27 0 2 2Z','#ffca82');c.restore();
    for(let i=0;i<4;i++){const hot=clamp(q*4-i);c.globalAlpha=.2+hot*.8;fill(c,`M${20+i*6} -2 L${24+i*6} -2 ${24+i*6} 2 ${20+i*6} 2Z`,i===3?'#fff6d3':'#ffc483');}
    c.globalAlpha=1;const length=24+q*16;for(const sign of [-1,1]){c.save();c.scale(1,sign);c.globalAlpha=q*.65;fill(c,`M${length} 0 Q${34+q*10} ${-4-q*3} ${51+q*5} -1 Q${42+q*5} 0 ${length} 0Z`,'#fff0cb');c.restore();}
    if(q>.55){c.globalAlpha=(q-.55)*1.4;for(const s of [-1,1])line(c,42,s*5,48,s*2,'#fff3cf',1.3);}c.restore();
    const ray=G.World.ray(b,u.aim);c.save();c.globalAlpha=u.locked?.8:.28;c.setLineDash(u.locked?[]:[3,6]);line(c,b.x,b.y,ray.endX,ray.endY,u.locked?'#fff1c3':'#da9a6b',u.locked?.8:.6);c.restore();
  }
  function muzzle(c,f,a){const q=1-Math.exp(-a*30);c.save();c.translate(f.x,f.y);c.rotate(f.angle);
    if(a<.18){c.globalAlpha=(1-a/.18)**.75;
      fill(c,`M-12 -6 Q2 -8 13 -14 L9 -25 Q28 -17 38 -12 Q${57+q*15} -8 ${63+q*26} -2 Q55 0 45 8 L27 18 22 11 Q5 15 -7 24 L-2 8 -20 5Z`,'#965439');
      fill(c,`M-9 -3 Q6 -4 21 -8 L16 -16 Q34 -8 42 -7 Q${57+q*10} -4 ${62+q*20} -1 Q45 0 37 5 L19 12 19 7 6 6 -7 14 -1 4Z`,'#ffb15f');
      fill(c,`M-7 -2 L29 -4 ${53+q*23} 0 28 4 7 2 -5 7Z`,'#fff3cd');
      for(const s of [-1,1]){c.save();c.scale(1,s);fill(c,`M-7 4 Q-25 7 ${-37-q*13} ${18+q*5} Q-22 9 -7 8Z`,'#e0a26c');c.restore();}
    }
    if(a>.04){c.globalAlpha=clamp(1-a/.65)*.4;const drift=a*30;fill(c,`M-16 -11 Q-42 ${-24-drift} ${-53-drift} -12 Q-41 -15 -39 -6 Q-18 -14 -4 -6Z`,'#75818a');fill(c,`M-10 10 Q-28 ${24+drift} ${-41-drift} 22 Q-36 9 -18 8Z`,'#59616b');}
    if(a<.4)for(let i=0;i<6;i++){const sign=i%2?1:-1,x=13+q*(20+i*8),y=sign*(4+q*(7+i*2));c.globalAlpha=(1-a/.4)*.75;line(c,x-5,y,x,y+sign*2,i%3?'#d4894b':'#ffe9ae',i%3?1:1.6);}c.restore();
  }
  function contact(c,f,a){const q=1-Math.exp(-a*19);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-clamp(a/.6))**1.3;
    // A narrow puncture, then downstream strips and a torn exit: distinct from a punch face.
    fill(c,`M-17 -5 L${12+q*72} -9 ${26+q*98} 0 ${9+q*67} 7 -22 3 -5 0Z`,'#ba7148');
    fill(c,`M-12 -2 L${12+q*70} -3 ${28+q*94} 0 ${9+q*60} 3 -17 1Z`,'#ffe5ab');
    for(const sign of [-1,1]){c.save();c.scale(1,sign);fill(c,`M-4 3 Q${20+q*13} ${15+q*19} ${57+q*27} ${18+q*33} L${26+q*14} ${8+q*13} 8 3Z`,'#d59a68');line(c,8,4,38+q*37,17+q*22,'#fff0ce',1.1);c.restore();}
    if(a<.09){c.globalAlpha=1-a/.09;fill(c,'M-17 -2 L-5 -5 -3 -22 3 -6 19 -12 9 -2 28 2 7 5 1 24 -3 7 -19 13 -9 3Z','#fff9e2');}
    c.globalAlpha*=.65;for(let i=0;i<9;i++){const angle=(i/8-.5)*2.2,x=Math.cos(angle)*(25+q*(40+i*4)),y=Math.sin(angle)*(25+q*(40+i*4));line(c,x*.8,y*.8,x,y,i%3?'#bc8759':'#fff2cc',i%3?1:1.7);}c.restore();
  }
  const oldBehind=A.behind,oldFront=A.front;
  A.behind=function(r,e){oldBehind.call(this,r,e);const c=r.ctx;c.save();
    for(const b of e.balls){if(b.type!=='ranger'||!b.arcana||b.hp<=0)continue;const u=b.arcana;
      if(u.phase==='counterStep'){const h=u.history||[];for(let i=h.length-1;i>=0;i-=4)ghost(c,h[i],.12+.18*(1-i/Math.max(1,h.length)));}
      if(u.phase==='counterCharge')breech(c,b,e);
    }c.restore();};
  A.front=function(r,e){oldFront.call(this,r,e);const c=r.ctx;c.save();
    for(const p of e.projectiles)if(p.mode==='arcPierce'){
      c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));
      const len=Math.min(45,(p.history?.length||0)*5);fill(c,`M${-len} -1 L-4 -4 13 0 -5 4 ${-len} 1Z`,'#b16b3e');fill(c,'M-10 -3 L8 -3 18 0 8 3 -10 3 -5 0Z','#ffe2a3');fill(c,'M-3 -1 L17 0 -3 1Z','#fffced');c.restore();
    }
    for(const f of e.effects){if(f.kind!=='arcana')continue;const a=Math.max(f.age,(e.presentationTime||0)-(f.bornReal||0));
      if(f.style==='counterEvade'&&a<.28)ghost(c,f,.6*(1-a/.28));
      if(f.style==='counterWake'&&a<.42){const h=f.history||[];for(let i=h.length-1;i>=0;i-=4)ghost(c,h[i],.26*(1-a/.42)*(1-i/Math.max(1,h.length)));}
      if(f.style==='counterMuzzle'&&a<.65)muzzle(c,f,a);
      if(f.style==='counterHit'&&a<.6)contact(c,f,a);
      if((f.style==='counterMiss'||f.style==='counterFizzle')&&a<.3){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=.4*(1-a/.3);for(const s of [-1,1]){c.save();c.scale(1,s);fill(c,`M-12 2 Q${-4-a*22} ${10+a*16} ${13+a*35} 10 Q4 3 -12 2Z`,'#8c9296');c.restore();}c.restore();}
    }c.restore();};
})(typeof window!=='undefined'?window:globalThis);
