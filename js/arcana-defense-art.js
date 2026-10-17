(function(root){
  'use strict';const G=root.OrbDuel,A=G.ArcanaView,C=G.Constants,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function shape(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}
  function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function shard(c,x,y,angle,size,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;shape(c,[[-size,-3],[size*.3,-7],[size,0],[size*.1,5]],'#33685e');shape(c,[[-size,-3],[size*.3,-7],[size,0],[-size*.2,-1]],'#7bc8b2');line(c,[[-size,-3],[size*.3,-7],[size,0]],'#daf8df',.8);c.restore();}
  function hex(c,x,y,r,color,width=1){line(c,Array.from({length:7},(_,i)=>[x+Math.cos(i*TAU/6)*r,y+Math.sin(i*TAU/6)*r]),color,width);}
  function slab(c,x,y,w,open,lit,index){c.save();c.translate(x,y);const h=20*open,cut=4;c.globalAlpha*=clamp(open*2);
    shape(c,[[-w/2,2],[-w/2-2,8],[w/2+2,8],[w/2,2]],'#020f16aa');
    shape(c,[[-w/2,0],[-w/2,-h+cut],[-w/2+cut,-h],[w/2-cut,-h],[w/2,-h+cut],[w/2,0],[0,4]],'#12383b');
    shape(c,[[-w/2+2,-h+4],[-w/2+6,-h-4],[w/2-4,-h-4],[w/2,-h+2],[w/2,-1],[0,3]],'#2d665e');
    shape(c,[[-w/2+6,-h-4],[w/2-4,-h-4],[w/2,-h+2],[-w/2+3,-h+2]],'#539984');
    shape(c,[[-w/2+3,-h+3],[0,-h+6],[w/2-2,-h+2],[w/2-2,-1],[0,1],[-w/2+3,-2]],'#1a4c4d');
    line(c,[[-w/2+3,-2],[0,2],[w/2-2,-1]],lit?'#edffcd':'#8be3c1',lit?2.4:1.4);
    line(c,[[-w/2+5,-h+1],[w/2-5,-h+1]],'#adba86',1.3);
    if(open>.7){hex(c,0,-h*.48,Math.min(5,w*.14),lit?'#d6ffb5':'#57a78a',.8);for(const s of [-1,1])line(c,[[s*9,-h*.48],[s*(w/2-6),-h*.48]],'#7f9d7c',.65);}
    if(index%2===0)shape(c,[[-3,-h-3],[0,-h-9],[3,-h-3],[0,-h+1]],lit?'#f6f4bb':'#9bc5a2');c.restore();
  }
  function walls(c,f,e){const age=e.time-f.started,rect=f.bounds,open=f.phase==='rise'?clamp(age/.65):1,lit=f.phase==='release'||f.phase==='hold'&&age<2.35;
    const l=Math.max(7,rect.left),r=Math.min(C.width-7,rect.right),t=Math.max(7,rect.top),bot=Math.min(C.height-7,rect.bottom);
    // Four distinct banks, mechanically staggered during the rise. Their inner
    // bright edge follows the physical rectangle, not a separately animated box.
    for(const [x,y,angle,len,side]of [[l,t,0,r-l,0],[r,t,Math.PI/2,bot-t,1],[r,bot,Math.PI,r-l,2],[l,bot,-Math.PI/2,bot-t,3]]){c.save();c.translate(x,y);c.rotate(angle);const n=Math.max(4,Math.round(len/40)),w=len/n;for(let i=0;i<n;i++){const local=f.phase==='rise'?clamp((age-side*.09-i*.025)/.28):open;slab(c,(i+.5)*w,0,w-2,local,lit,i);}c.restore();}
    if(f.phase==='shrink'){c.save();c.globalAlpha=.35;const p=(age-.8)/1.2;for(let i=0;i<5;i++){const x=rect.left+18+(rect.right-rect.left-36)*i/4;shape(c,[[x-3,rect.top+8],[x,rect.top+13],[x+3,rect.top+8],[x,rect.top+10]],'#a0e1b6');shape(c,[[x-3,rect.bottom-8],[x,rect.bottom-13],[x+3,rect.bottom-8],[x,rect.bottom-10]],'#a0e1b6');}c.restore();}
  }
  function scars(c,b,e){const u=b.arcana,charge=u.phase==='debtCharge';if(u.used&&!charge)return;const p=charge?clamp((e.time-u.started)/.9):clamp((u.scarDebt||0)/60);if(p<=.001)return;c.save();c.translate(b.x,b.y);c.globalAlpha=charge?.35+p*.65:.3+p*.6;
    const debt=clamp((u.scarDebt||0)/60),r=b.radius;
    for(let i=0;i<7;i++){const growth=clamp((debt*8-i)/1.65);if(!growth)continue;c.save();c.rotate(i*2.399+.25);c.beginPath();c.arc(0,0,r*.95*growth,0,TAU);c.clip();
      shape(c,[[0,-1],[r*.22,-2],[r*.38,1],[r*.57,-4],[r*.73,-2],[r*.95,-5],[r*.73,0],[r*.58,-1],[r*.38,4],[r*.2,1],[0,1]],charge?b.def.color:'#75629d');
      line(c,[[0,0],[r*.22,-.5],[r*.38,2],[r*.58,-2],[r*.74,-1],[r*.95,-5]],charge?'#eee6ff':'#c7b5ef',.7);line(c,[[r*.42,1],[r*.53,6],[r*.72,8]],'#9983c4',.7);c.restore();}
    if(charge){const pull=1-clamp((p-.65)/.35);c.save();c.beginPath();c.arc(0,0,b.radius+clamp(p/.48)*75,0,TAU);c.clip();for(let i=0;i<5;i++){const a=u.aim+(i-2)*.63,dist=32+pull*(28+i%2*16);c.save();c.rotate(a);const bend=(i%2?1:-1)*(10+pull*15);shape(c,[[14,-2],[dist*.65,bend-4],[dist+10,bend],[dist*.66,bend+1],[21,3]],'#514067');shape(c,[[18,-1],[dist*.65,bend-3],[dist+10,bend],[dist*.65,bend],[23,1]],'#9276bd');line(c,[[19,0],[dist*.65,bend-2],[dist+10,bend]],'#d8c4ff',.9);c.restore();}c.restore();}c.restore();
  }
  function chain(c,a,b,fade){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),n=Math.min(24,Math.max(2,Math.floor(len/10)));c.save();c.translate(a.x,a.y);c.rotate(angle);c.globalAlpha*=fade;
    for(let i=0;i<n;i++){const x=(i+.5)*len/n,w=len/n*.44,y=Math.sin(i*Math.PI)*2;c.save();c.translate(x,y);line(c,[[-w,0],[-w*.5,-2.6],[w*.5,-2.6],[w,0],[w*.5,2.6],[-w*.5,2.6],[-w,0]],i%2?'#67508e':'#bda7f4',i%2?1.8:1.25);if(i%3===0)line(c,[[-w*.5,-2.6],[w*.5,-2.6],[w,0]],'#eee5ff',.7);c.restore();}c.restore();
  }
  function debtFront(c,p){c.save();c.translate(p.x,p.y);c.rotate(p.angle);shape(c,[[-65,-11],[-12,-5],[16,-24],[32,0],[14,24],[-11,5],[-58,12],[-26,0]],'#45375f');shape(c,[[-36,-8],[10,-17],[26,0],[10,17],[-30,9],[-5,0]],'#b39cff');shape(c,[[8,-17],[26,0],[10,17],[18,0]],'#e7dfff');line(c,[[8,-17],[26,0],[10,17]],'#f5eeff',1.1);for(const s of [-1,1])line(c,[[-65,s*18],[-22,s*10],[3,s*10]],'#9f87d3',1.2);c.restore();}
  const behind=A.behind,front=A.front;A.behind=function(r,e){behind.call(this,r,e);const c=r.ctx,w=e.arcanaWorld?.defense;if(!w)return;c.save();
    if(w.fortress){c.fillStyle='#071922';c.globalAlpha=.12;c.fillRect(0,0,C.width,C.height);c.globalAlpha=1;walls(c,w.fortress,e);}
    for(const v of w.returns){const b=e.balls.find(b=>b.id===v.owner),t=e.balls.find(b=>b.id===v.target);if(!b||!t)continue;const fade=clamp((v.until-e.time)/.3);for(const s of [-1,1])chain(c,{x:b.x,y:b.y+s*11},{x:t.x,y:t.y+s*12},fade*.8);const a=Math.atan2(b.y-t.y,b.x-t.x);c.save();c.translate(t.x,t.y);c.rotate(a);shape(c,[[24,-19],[38,-11],[30,-9],[25,-13]],'#a78bd7');shape(c,[[24,19],[38,11],[30,9],[25,13]],'#a78bd7');c.restore();}c.restore();};
  A.front=function(r,e){front.call(this,r,e);const c=r.ctx,w=e.arcanaWorld?.defense;if(!w)return;c.save();for(const b of e.balls){if(!G.DefenseArcana.handles(b))continue;if(b.type==='reflector')scars(c,b,e);if(b.arcana.royalActive){c.save();c.translate(b.x,b.y);const rad=b.radius+7;for(let i=0;i<6;i++){const a=i*TAU/6;c.save();c.rotate(a);shape(c,[[rad,-9],[rad+3,-6],[rad+3,6],[rad,9],[rad-1,5],[rad-1,-5]],'#a6e9c2');c.restore();}c.restore();}}for(const p of w.bolts)debtFront(c,p);
    for(const f of e.effects){if(f.kind!=='arcana')continue;const age=Math.max(f.age,(e.presentationTime||0)-(f.bornReal||0));
      if(f.style==='royalDissolve'&&age<.65){const p=clamp(age/.65),b=e.balls.find(b=>b.id===f.owner)||f;for(let side=0;side<4;side++)for(let i=0;i<7;i++){const q=(i+.5)/7,x=side===0?q*C.width:side===1?C.width:side===2?(1-q)*C.width:0,y=side===0?0:side===1?q*C.height:side===2?C.height:(1-q)*C.height;const out=clamp(p/.2),back=clamp((p-.23)/.77),xx=x+(x-C.width/2)*out*.06+(b.x-x)*back*back,yy=y+(y-C.height/2)*out*.06+(b.y-y)*back*back;shard(c,xx,yy,side*Math.PI/2+i*.4+p,10*(1-back*.75),1-p);}}
      if(f.style==='debtImpact'&&age<.65){const p=clamp(age/.65),q=1-Math.exp(-p*7);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-p)**1.6;for(let i=0;i<6;i++){const a=i*TAU/6+.15,rr=16+q*(35+i%2*14);c.save();c.rotate(a);shape(c,[[8,-3],[rr*.65,-8],[rr+20,0],[rr*.6,2],[12,1]],i%2?'#625087':'#b39cff');line(c,[[rr*.6,-6],[rr+20,0]],'#e2d5ff',1);c.restore();}if(age<.06)shape(c,[[-8,-4],[-3,-18],[5,-4],[26,0],[7,6],[1,22],[-5,7],[-22,2]],'#f5efff');c.restore();}
      if(f.style==='debtRelease'&&age<.32){c.save();c.globalAlpha=.7*(1-age/.32);c.translate(f.x,f.y);c.rotate(f.angle);for(const s of [-1,1]){shape(c,[[1,0],[-23,s*22],[-65,s*28],[-28,s*16]],'#8f71c2');line(c,[[-65,s*28],[-23,s*22],[1,0]],'#cdb9f4',1);}c.restore();}
      if(f.style==='debtPredict'&&age<.4){c.save();c.globalAlpha=1-age/.4;for(let i=0;i<4;i++){const a=i*TAU/4,x=f.x+Math.cos(a)*(29+age*20),y=f.y+Math.sin(a)*(29+age*20);shard(c,x,y,a,6,1);}c.restore();}
    }c.restore();};
  const draw=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e,...args){const old=G.Charge.localBounds;G.Charge.localBounds=e.arcanaWorld?.defense?.fortress?.bounds||null;try{return draw.call(this,e,...args);}finally{G.Charge.localBounds=old;}};
})(typeof window!=='undefined'?window:globalThis);
