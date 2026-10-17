(function(root){
  'use strict';const S=root.OrbDuel.CollisionStudy,TAU=Math.PI*2,COLORS=['#77b7ff','#f096c4'];
  function path(c,points,fill=false){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(fill)c.closePath();fill?c.fill():c.stroke();}
  function effect(c,key,e,age,o){
    const p=S.profiles[key];if(age<0||age>p.life)return;
    const t=age/p.life,fade=(1-t)**2,k=o.strength;c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.scale(k,k);c.lineCap='round';
    if(key==='A'){
      c.fillStyle=`rgba(246,251,255,${Math.exp(-age*55)})`;path(c,[[-5,0],[0,-21],[5,0],[0,21]],true);
      c.strokeStyle=`rgba(207,232,255,${fade})`;c.lineWidth=1.6;
      for(let i=0;i<6;i++){const a=(i%2?1:-1)*Math.PI/2+(Math.floor(i/2)-1)*.45,r=7+age*135;path(c,[[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(a)*(r+7*(1-t)),Math.sin(a)*(r+7*(1-t))]]);}
    }else if(key==='B'){
      const grow=1-Math.exp(-age*18);c.lineWidth=2.3*(1-t)+.5;
      // Tangential release braces, not extra circular silhouettes between the real balls.
      for(const side of [-1,1]){c.strokeStyle=side<0?`rgba(119,183,255,${fade*.85})`:`rgba(240,150,196,${fade*.85})`;c.beginPath();c.moveTo(-11-grow*10,side*(15+grow*12));c.quadraticCurveTo(0,side*(25+grow*19),11+grow*10,side*(15+grow*12));c.stroke();}
      c.fillStyle=`rgba(232,245,255,${Math.exp(-age*65)*.7})`;c.beginPath();c.ellipse(0,0,5,20,0,0,TAU);c.fill();
    }else{
      // A fixed contact key for 22 ms, then rapidly separated pressure fronts. No ball/clock freeze.
      const release=Math.max(0,age-.022),travel=1-Math.exp(-release*18);
      c.fillStyle=`rgba(246,250,255,${Math.exp(-release*55)*.9})`;path(c,[[-3,-29],[3,-20],[4,29],[-4,20]],true);
      for(const side of [-1,1]){
        if(age>.045){c.strokeStyle=`rgba(205,230,249,${fade*.85})`;c.lineWidth=2.7*(1-t)+.3;c.beginPath();c.ellipse(side*(46+release*330),0,7+travel*9,18+travel*15,0,side<0?Math.PI/2:-Math.PI/2,side<0?Math.PI*1.5:Math.PI/2);c.stroke();}
        c.fillStyle=`rgba(163,205,235,${fade*.12})`;path(c,[[side*7,-13],[side*(18+travel*43),-24*travel],[side*(30+travel*33),0],[side*(18+travel*43),24*travel],[side*7,13]],true);
      }
      c.strokeStyle=`rgba(220,239,255,${fade*.8})`;c.lineWidth=1.4;
      for(let i=0;i<6;i++){const a=i*TAU/6+Math.PI/6,r=15+release*(180+(i%3)*45);path(c,[[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(a)*(r+8*(1-t)),Math.sin(a)*(r+8*(1-t))]]);}
    }c.restore();
  }
  function draw(canvas,key,clip,time,options={},diagnostic=false){
    const o=S.tune(options),c=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(canvas.clientWidth*dpr)||720,h=Math.round(w*340/360);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    c.setTransform(w/360,0,0,h/340,0,0);c.fillStyle='#0c131e';c.fillRect(0,0,360,340);
    const f=S.stateAt(clip,time),recent=f.events.at(-1),age=recent?time-recent.time:Infinity;
    c.save();c.beginPath();c.rect(0,0,360,340);c.clip();
    if(o.effects&&key==='C'&&o.camera&&age<.14){const q=S.profiles.C.shake*o.strength*Math.exp(-age*32)*Math.sin(age*155);c.translate(Math.cos(recent.angle)*q,Math.sin(recent.angle)*q);}
    c.fillStyle='#233143';for(let x=20;x<360;x+=20)for(let y=20;y<340;y+=20){c.beginPath();c.arc(x,y,.6,0,TAU);c.fill();}
    for(const b of f.balls){
      const color=COLORS[b.id];c.save();c.strokeStyle=color;c.lineWidth=3;c.globalAlpha=.13;c.beginPath();b.trail.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.restore();
      const q=o.effects&&recent?S.deformation(key,age,o.deform):0,sx=1-q,sy=1/sx;
      c.save();c.translate(b.x,b.y);c.rotate(recent?.angle||0);c.scale(sx,sy);
      const g=c.createLinearGradient(-20,-23,18,23);g.addColorStop(0,color);g.addColorStop(1,'#22374e');c.fillStyle=g;c.strokeStyle=color;c.lineWidth=1.9;c.beginPath();c.arc(0,0,b.radius,0,TAU);c.fill();c.stroke();
      // Fixed white rim only during confirmed contact, never a constant aura.
      if(o.effects&&age<.085){c.strokeStyle=`rgba(250,253,255,${.7*Math.exp(-age*28)})`;c.lineWidth=2;c.stroke();}
      c.fillStyle='#0a1421';c.beginPath();c.arc(0,0,5,0,TAU);c.fill();c.restore();
      if(diagnostic){c.save();c.setLineDash([2,3]);c.strokeStyle='#b2ed81';c.lineWidth=.7;c.beginPath();c.arc(b.x,b.y,b.radius,0,TAU);c.stroke();c.restore();}
    }
    if(o.effects)for(const e of f.events){const a=time-e.time;effect(c,key,e,a,o);if(a<.55)for(const hit of e.hits){if(!hit.actual)continue;const b=f.balls[hit.targetId];c.save();c.globalAlpha=Math.min(1,(.55-a)*4);c.fillStyle=COLORS[b.id];c.font='bold 11px system-ui';c.textAlign='center';c.fillText('−'+hit.actual.toFixed(1),Math.max(22,Math.min(338,b.x)),Math.max(19,b.y-30-a*23));c.restore();}}
    c.restore();
    // Stable frame and HUD, outside camera transform.
    c.strokeStyle='#304052';c.lineWidth=1;c.strokeRect(.5,.5,359,339);
    c.font='10px system-ui';c.textAlign='left';c.fillStyle='#9daec1';c.fillText(clip.fixture==='miss'?'错身对照 · 未命中无接触反馈':'同一真实碰撞 · 无新增停时',12,18);
    c.textAlign='right';c.fillText(Math.min(time,clip.duration).toFixed(3)+'s',348,18);
    for(const b of f.balls){const x=b.id===0?12:254;c.fillStyle=COLORS[b.id];c.textAlign='left';c.fillText((b.id?'右':'左')+' '+b.hp.toFixed(1)+' / '+b.maxHp,x,324);c.fillStyle='#253344';c.fillRect(x,330,94,3);c.fillStyle=COLORS[b.id];c.fillRect(x,330,94*b.hp/b.maxHp,3);}
    return {particles:o.effects&&age<S.profiles[key].life?S.profiles[key].particles:0,drawnContact:!!(o.effects&&age<S.profiles[key].life),deformation:o.effects?S.deformation(key,age,o.deform):0,world:f};
  }
  root.OrbDuel.CollisionView=Object.freeze({draw});
})(typeof window!=='undefined'?window:globalThis);
