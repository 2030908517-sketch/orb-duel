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
  function pressure(c,x,reach,width,q,alpha=1){
    c.save();c.globalAlpha*=alpha;
    for(const sign of [-1,1]){c.save();c.scale(1,sign);const asym=sign<0?.91:1;
      fill(c,`M${x} 0 Q${x+reach*.32} ${-width*.7*asym} ${x+reach} ${-width*asym} C${x+reach*.87} ${-width*.79*asym} ${x+reach*.78} ${-width*.87*asym} ${x+reach*.62} ${-width*.48*asym} Q${x+reach*.32} ${-width*.28*asym} ${x} 0Z`,'#8ba9b51d');
      for(let i=0;i<3;i++){const k=.16+i*.22+q*.08,xx=x+reach*k,tail=x+reach*(k+.30),y=-width*(.19+i*.19)*asym,dy=width*(.08+i*.025);c.beginPath();c.moveTo(xx,y*.52);c.bezierCurveTo(xx+reach*.09,y-dy,tail-reach*.02,y+dy*.2,tail,y-dy*.6);c.bezierCurveTo(tail-reach*.02,y+dy*.9,xx+reach*.1,y-dy*.22,xx,y*.52);c.fillStyle=i%2?'#d0e4e72f':'#abc7d533';c.fill();c.beginPath();c.moveTo(xx,y*.52);c.bezierCurveTo(xx+reach*.09,y-dy,tail-reach*.06,y+dy*.2,tail-reach*.025,y-dy*.2);c.strokeStyle=i===1?'#d8e5df90':'#b4cbd65c';c.lineWidth=i===1?.7:.45;c.stroke();}
      c.restore();
    }c.restore();
  }
  function muzzle(c,f,a){const burst=1-Math.exp(-a*65),fade=clamp(1-a/.22);c.save();c.translate(f.x,f.y);c.rotate(f.angle);
    if(fade>0){c.globalAlpha=fade;
      fill(c,`M-14 -5 Q4 -12 18 -15 L13 -29 Q34 -22 45 -10 L${52+burst*45} 0 40 10 29 24 23 13 Q3 16 -10 27 L-6 8 -23 4Z`,'#995134');
      fill(c,`M-10 -3 Q13 -7 25 -13 L22 -19 45 -7 ${55+burst*35} 0 40 7 24 16 22 8 5 6 -7 17 -2 4Z`,'#ffc077');
      fill(c,`M-8 -1 L25 -4 ${49+burst*35} 0 24 4 -7 2 2 0Z`,'#fff9e6');
      for(const sign of [-1,1]){c.save();c.scale(1,sign);fill(c,`M-7 3 Q-30 3 ${-43-burst*19} ${14+burst*10} Q-33 7 -10 7Z`,'#cf9565');c.restore();}
    }
    c.globalAlpha=clamp(1-a/.38);pressure(c,3,40+burst*105,7+burst*40,clamp(a/.35),.9);
    for(let i=0;i<3;i++){const t=Math.max(0,a-i*.025),q=clamp(t/.3);if(!t)continue;c.globalAlpha=(1-q)*(.75-i*.17);c.strokeStyle=i?'#a9c4ce':'#fff0c9';c.lineWidth=1.7-i*.4;c.beginPath();c.ellipse(7+t*(230+i*110),0,3+t*22,7+t*(150+i*35),0,Math.PI*.52,Math.PI*1.48);c.stroke();}
    if(a>.035){const q=clamp((a-.035)/.55);c.globalAlpha=(1-q)*.42;for(const sign of [-1,1]){c.save();c.scale(1,sign);fill(c,`M-13 6 Q${-27-q*24} ${10+q*24} ${-41-q*37} ${8+q*22} Q${-29-q*16} ${5+q*10} -9 3Z`,'#7a838d');c.restore();}}
    c.restore();
  }
  function compression(c,b,e){const u=b.arcana;if(!u.compressionCue||e.time<u.compressionAt||u.phase!=='counterCharge')return;const q=clamp((e.time-u.compressionAt)/.08);c.save();c.translate(b.x,b.y);c.rotate(u.aim);
    for(const sign of [-1,1]){c.save();c.scale(1,sign);const x=34+(1-q)*46,y=5+(1-q)*17;c.globalAlpha=.45+q*.5;fill(c,`M24 -1 Q${x*.8} ${-y*.8} ${x+30} ${-y} Q${x} ${-y*.45} 24 -1Z`,'#bed2db45');c.beginPath();c.moveTo(25,0);c.quadraticCurveTo(x*.8,-y*.75,x+25,-y*.8);c.strokeStyle='#ecedda';c.lineWidth=.7;c.stroke();c.restore();}
    c.fillStyle='#fff9df';c.beginPath();c.ellipse(30,0,2.4-q,1.2,0,0,TAU);c.fill();c.restore();
  }
  function contact(c,f,a){c.save();c.translate(f.x,f.y);c.rotate(f.angle);
    if(a<.02){c.globalAlpha=1;c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,2.5,0,TAU);c.fill();line(c,-38,0,220,0,'#fff8dd',.85);line(c,0,-7,0,7,'#fff9e4',.65);c.restore();return;}
    const t=a-.02,q=1-Math.exp(-t*34),fade=(1-clamp(t/.55))**1.3;c.globalAlpha=fade;
    fill(c,`M-9 -2 L${12+q*126} -4 ${24+q*178} 0 ${12+q*108} 4 -9 2Z`,'#9d643d');
    fill(c,`M-7 -1 L${12+q*120} -1.4 ${28+q*169} 0 ${12+q*100} 1.4 -7 1Z`,'#fff6d8');
    pressure(c,0,32+q*112,6+q*37,q,.9);
    for(let i=0;i<9;i++){const sign=i%2?1:-1,x=12+q*(38+i*11),y=sign*(5+q*(7+i*2)),length=(10+i%3*5)*(1-q*.5);c.save();c.translate(x,y);c.rotate(sign*.3);fill(c,`M${-length} -1 L0 -2 7 0 -1 1Z`,i%3?'#b8885d':'#f9e7bd');c.restore();}
    c.globalAlpha=fade*clamp(1-t/.18);line(c,-20,0,1000,0,'#fff8df',.9);c.restore();
  }
  function wall(c,f,a){const q=1-Math.exp(-a*42),fade=(1-clamp(a/1.05))**.8;c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=fade;
    // The fracture grows into the arena, with dark channels and one lit edge per plate.
    for(let i=0;i<11;i++){const angle=Math.PI*.5+i*Math.PI/10,len=(35+(i*17%49))*q,x=Math.cos(angle)*len,y=Math.sin(angle)*len,mx=x*.48+(i%2?7:-5),my=y*.45;c.beginPath();c.moveTo(0,0);c.lineTo(mx,my);c.lineTo(x,y);c.lineTo(mx+2,my+3);c.closePath();c.fillStyle='#070c13';c.fill();line(c,mx-1,my-1,x,y,'#8e785b',.8);
      const bx=mx+(i%2?-9:7),by=my+(i%3-1)*13;line(c,mx,my,bx,by,'#090d14',2.5);line(c,mx-1,my-1,bx,by,'#bfa277',.55);
      if(a<.35){const d=a*(30+i*5),sx=x*.65-d,sy=y*.65+(i%2?1:-1)*d*.2;c.save();c.translate(sx,sy);c.rotate(i*.73+a*3);fill(c,'M-3 -2 L4 -1 2 3 -2 2Z',i%3?'#8a8174':'#d2b78b');c.restore();}
    }
    c.fillStyle='#080d15';c.beginPath();c.ellipse(-4,0,12*q,30*q,0,0,TAU);c.fill();c.strokeStyle='#9d7958';c.lineWidth=2.5;c.beginPath();c.ellipse(-4,0,11*q,29*q,0,Math.PI*.48,Math.PI*1.52);c.stroke();
    if(a<.11){c.globalAlpha=(1-a/.11)*.9;c.strokeStyle='#fff4d3';c.lineWidth=2;c.beginPath();c.ellipse(-5,0,8+q*8,19+q*17,0,Math.PI*.5,Math.PI*1.5);c.stroke();line(c,-68,0,10,0,'#ffefc5',1);}
    for(let i=0;i<2;i++){const t=Math.max(0,a-i*.035),wave=1-Math.exp(-t*17);c.globalAlpha=fade*clamp(1-t/.42)*(.65-i*.2);c.strokeStyle=i?'#a2c5d2':'#e0e4d1';c.lineWidth=i?.75:1.8;c.beginPath();c.ellipse(-t*30,0,8+wave*76,14+wave*100,0,Math.PI*.5,Math.PI*1.5);c.stroke();}c.restore();
  }
  function scope(c,b,e){const u=b.arcana,W=G.Constants.width,H=G.Constants.height,t=e.time-u.started,q=clamp(t/G.RangerArcana.chargeTime),open=clamp(t/.26),follow=1-(1-clamp(t/.10))**3,zoom=1-(1-clamp(t/.24))**3,close=u.scopeCloseAt!==null?clamp((e.time-u.scopeCloseAt)/G.RangerArcana.scopeCloseTime):0,collapse=u.locked?1:clamp((e.time-u.lockAt+.16)/.16),fade=(1-close)**2;
    const target=e.balls.find(v=>v.id===u.target),dist=u.locked&&u.scopeLock?Math.hypot(u.scopeLock.x-b.x,u.scopeLock.y-b.y):target?Math.hypot(target.x-b.x,target.y-b.y):150,tx=u.locked&&u.scopeLock?u.scopeLock.x:b.x+Math.cos(u.aim)*dist,ty=u.locked&&u.scopeLock?u.scopeLock.y:b.y+Math.sin(u.aim)*dist,cx=W*.5+(tx-W*.5)*follow,cy=H*.5+(ty-H*.5)*follow,R=Math.hypot(W,H)*(.62-.04*zoom),step=13+(1-zoom)*3;
    const tension=u.compressionCue?clamp((e.time-u.compressionAt)/.08):0;c.save();c.fillStyle=`rgba(2,6,12,${.50*clamp(t/.25)*fade+(u.compressionCue?.25+.18*tension:0)})`;c.fillRect(0,0,W,H);c.restore();if(fade<=0)return;
    c.save();c.globalAlpha=fade;
    c.save();c.globalAlpha*=1-collapse;
    // Four offset quadrants seat separately. Only their reveal and seating travel change.
    for(let i=0;i<4;i++){const seat=clamp((t-i*.035)/.18),angle=i*Math.PI*.5,offset=(1-seat)*18;c.save();c.translate(cx+Math.cos(angle+Math.PI*.25)*offset,cy+Math.sin(angle+Math.PI*.25)*offset);for(const [dr,width,color]of [[9,16,'#060a0e'],[4,4,'#536166'],[1,1.3,'#b2b5a4'],[-4,4,'#17232c'],[-9,.8,'#bbab87']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(0,0,R+dr,angle+.012,angle+.012+Math.PI*.49*seat);c.stroke();}c.restore();}
    if(open>.35){const glass=c.createRadialGradient(cx,cy,R*.65,cx,cy,R);glass.addColorStop(0,'#7eb5c500');glass.addColorStop(.94,'#89acbc0c');glass.addColorStop(1,'#07101780');c.fillStyle=glass;c.beginPath();c.arc(cx,cy,R-8,0,TAU);c.fill();}
    for(let i=0;i<120*open;i++){const a=i*TAU/120;line(c,cx+Math.cos(a)*(R+1),cy+Math.sin(a)*(R+1),cx+Math.cos(a)*(R+6),cy+Math.sin(a)*(R+6),i%5?'#7e8e8c':'#d9ca9f',i%5?.5:1);}
    c.restore();
    c.save();c.translate(tx,ty);c.rotate(u.aim);c.scale(1,1-collapse*.985);c.rotate(-u.aim);c.translate(-tx,-ty);c.globalAlpha*=clamp((t-.12)/.22)*(1-collapse*.9);
    const ink='#c9ba96';c.fillStyle=ink;c.font='6px monospace';c.textAlign='center';for(const sign of [-1,1]){const reach=clamp((t-.12)/.28);line(c,tx+sign*4,ty,tx+sign*step*9*reach,ty,ink,.65);line(c,tx,ty+sign*4,tx,ty+sign*step*10*reach,ink,.65);line(c,tx+sign*step*9.5,ty,tx+sign*R*reach,ty,'#bbaa85',2.3);for(let j=1;j<=40*reach;j++){const v=j/4,len=j%4?1.6:j%8?3:4.8,x=tx+sign*v*step,y=ty+sign*v*step;line(c,x,ty-len,x,ty+len,ink,j%4?.4:.7);line(c,tx-len,y,tx+len,y,ink,j%4?.4:.7);if(j%8===0){c.fillText(String(j/4),x,ty-8);c.fillText(String(j/4),tx+10,y+2);}}}
    for(let row=2;row<=10;row++){const show=clamp(t*5-row*.16);if(!show)continue;c.save();c.globalAlpha*=show*.65;const y=ty+row*step,span=row*.62;line(c,tx-span*step,y,tx+span*step,y,ink,.45);for(let n=-Math.floor(span*2);n<=Math.floor(span*2);n++){if(!n)continue;c.beginPath();c.arc(tx+n*step*.5,y,n%2?.48:.72,0,TAU);c.fill();}c.restore();}c.restore();
    // Range brackets move only as the measured aim changes, never by random jitter.
    if(collapse<1){c.save();c.globalAlpha*=clamp(t*4)*(1-collapse);const gate=12+40*(1-clamp(t/.78)),rr=(target?.radius||20)+9;for(const sx of [-1,1])for(const sy of [-1,1]){line(c,tx+sx*gate,ty+sy*gate,tx+sx*(gate-6),ty+sy*gate,'#ecdbac',1);line(c,tx+sx*gate,ty+sy*gate,tx+sx*gate,ty+sy*(gate-6),'#ecdbac',1);}for(let k=-3;k<=3;k++){const yy=ty+k*8,slide=(1-clamp(t/.55))*24;line(c,tx+rr+7+slide,yy,tx+rr+(k%3?10:14)+slide,yy,'#9cbbb9',.7);}c.font='6.5px monospace';c.fillStyle='#d6c49e';c.textAlign='left';c.fillText('MRAD / FFP',Math.max(14,tx-112),Math.min(H-42,ty+97));c.fillText('RNG '+Math.round(dist)+'u  TRACK',Math.max(14,tx-112),Math.min(H-32,ty+107));c.restore();}
    if(collapse>0){const nx=Math.cos(u.aim),ny=Math.sin(u.aim);c.save();c.globalAlpha*=collapse;line(c,tx-nx*1000,ty-ny*1000,tx+nx*1000,ty+ny*1000,'#be987d',2.4);line(c,tx-nx*1000,ty-ny*1000,tx+nx*1000,ty+ny*1000,'#fff7df',.7);c.fillStyle='#ffffff';c.beginPath();c.arc(tx,ty,1.6,0,TAU);c.fill();for(const sign of [-1,1]){const x=tx-ny*sign*6,y=ty+nx*sign*6;line(c,x-nx*3,y-ny*3,tx-ny*sign*3,ty+nx*sign*3,'#fff2d4',.75);}c.restore();}
    c.restore();
  }
  const overlay=A.overlay;A.overlay=function(r,e){overlay?.call(this,r,e);for(const b of e.balls)if(b.type==='ranger'&&b.hp>0&&b.arcana?.phase==='counterCharge'&&b.arcana.manualCounter!=='window')scope(r.ctx,b,e);};
  const oldBehind=A.behind,oldFront=A.front;
  A.behind=function(r,e){oldBehind.call(this,r,e);const c=r.ctx;c.save();
    for(const b of e.balls){if(b.type!=='ranger'||!b.arcana||b.hp<=0)continue;const u=b.arcana;
      if(u.phase==='counterStep'){const h=u.history||[];for(let i=h.length-1;i>=0;i-=4)ghost(c,h[i],.12+.18*(1-i/Math.max(1,h.length)));}
      if(u.phase==='counterCharge'&&u.manualCounter!=='window'){breech(c,b,e);compression(c,b,e);}
    }c.restore();};
  A.front=function(r,e){oldFront.call(this,r,e);const c=r.ctx;c.save();
    for(const p of e.projectiles)if(p.mode==='arcPierce'){
      const h=p.history||[],a=Math.atan2(p.vy,p.vx);if(h.length){c.save();c.lineCap='round';for(const [width,color]of [[5,'#738d9d25'],[1.4,'#d7c699a0'],[.45,'#fff8dc']]){c.beginPath();c.moveTo(p.x,p.y);for(const v of h)c.lineTo(v.x,v.y);c.strokeStyle=color;c.lineWidth=width;c.stroke();}c.restore();}
      c.save();c.translate(p.x,p.y);c.rotate(a);fill(c,'M-12 -2.5 L5 -2.5 15 0 5 2.5 -12 2.5 -7 0Z','#ddbd81');fill(c,'M-5 -1 L15 0 -5 1Z','#fffced');pressure(c,-10,-54,10,.6,.6);c.strokeStyle='#d1e5e2b0';c.lineWidth=.7;c.beginPath();c.ellipse(2,0,2.3,9,0,Math.PI*.5,Math.PI*1.5);c.stroke();c.restore();
    }
    for(const f of e.effects){if(f.kind!=='arcana')continue;const a=Math.max(f.age,(e.presentationTime||0)-(f.bornReal||0));
      if(f.style==='counterEvade'&&a<.28)ghost(c,f,.6*(1-a/.28));
      if(f.style==='counterWake'&&a<.42){const h=f.history||[];for(let i=h.length-1;i>=0;i-=4)ghost(c,h[i],.26*(1-a/.42)*(1-i/Math.max(1,h.length)));}
      if(f.style==='counterMuzzle'&&a<.65)muzzle(c,f,a);
      if(f.style==='counterHit'&&f.age<.6)contact(c,f,f.age);
      if(f.style==='counterBlock'&&a<.25){c.save();c.globalAlpha=1-a/.25;c.strokeStyle='#d9c49c';c.lineWidth=1.2;c.beginPath();c.arc(f.x,f.y,4+a*55,f.angle+1.6,f.angle+4.7);c.stroke();c.restore();}
      if(f.style==='counterWall')wall(c,f,f.age);
      if(f.style==='counterShard'&&a<.38){const q=clamp(a/.38),seed=f.fragmentId||0;c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-q)**1.3;if(a<.035)line(c,-10,0,25,0,'#fff9df',1.3);for(let j=0;j<5;j++){const angle=(j*2.399+seed*.7),d=a*(70+j*24);c.save();c.translate(Math.cos(angle)*d+q*9,Math.sin(angle)*d);c.rotate(angle+a*(j%2?5:-4));fill(c,'M-3 -1 L2 -2 4 0 0 2Z',j%2?f.color:'#eddbaf');line(c,-2,-1,2,-2,'#fff4d0',.6);c.restore();}c.restore();}
      if((f.style==='counterMiss'||f.style==='counterFizzle')&&a<.3){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=.4*(1-a/.3);for(const s of [-1,1]){c.save();c.scale(1,s);fill(c,`M-12 2 Q${-4-a*22} ${10+a*16} ${13+a*35} 10 Q4 3 -12 2Z`,'#8c9296');c.restore();}c.restore();}
    }c.restore();};
})(typeof window!=='undefined'?window:globalThis);
