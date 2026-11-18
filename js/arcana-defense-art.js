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
    if(open>.15){
      c.save();c.globalAlpha*=.45*open;
      const sheen=c.createLinearGradient(0,-h,0,1);sheen.addColorStop(0,'#c4fff3');sheen.addColorStop(.35,'#58c3ad');sheen.addColorStop(1,'#123b40');
      shape(c,[[-w/2+5,-h+4],[w/2-5,-h+4],[w/2-8,-h*.61],[0,-h*.35],[-w/2+8,-h*.61]],sheen);
      line(c,[[-w/2+5,-h+3],[0,-h+5],[w/2-5,-h+3]],'#e5ffed',.75);c.restore();
    }
    if(open>.7){hex(c,0,-h*.48,Math.min(5,w*.14),lit?'#d6ffb5':'#57a78a',.8);for(const s of [-1,1])line(c,[[s*9,-h*.48],[s*(w/2-6),-h*.48]],'#7f9d7c',.65);}
    if(index%2===0)shape(c,[[-3,-h-3],[0,-h-9],[3,-h-3],[0,-h+1]],lit?'#f6f4bb':'#9bc5a2');c.restore();
  }
  function walls(c,f,e){
    const age=e.time-f.started,rect=f.bounds,open=f.phase==='rise'?clamp(age/.8):1;
    const l=Math.max(7,rect.left),r=Math.min(C.width-7,rect.right),t=Math.max(7,rect.top),bot=Math.min(C.height-7,rect.bottom);
    const pulse=f.phase==='hold'?Math.max(0,1-(age-2)/.32):f.phase==='release'?Math.max(0,1-(age-6.2)/.45):0;
    const sides=[[l,t,0,r-l,0],[r,t,Math.PI/2,bot-t,1],[r,bot,Math.PI,r-l,2],[l,bot,-Math.PI/2,bot-t,3]];
    for(const [x,y,angle,len,side] of sides){
      const appear=f.phase==='rise'?clamp((age-side*.08)/.44):open;
      if(appear<=0)continue;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=appear;
      const deep=31*appear;
      // Two continuous structural bands; only the inner edge denotes the wall.
      const metal=c.createLinearGradient(0,-deep,0,3);metal.addColorStop(0,'#91bde4');metal.addColorStop(.12,'#365b7f');metal.addColorStop(.52,'#142c47');metal.addColorStop(.88,'#2b567f');metal.addColorStop(1,'#f7dba0');
      shape(c,[[0,2],[0,-deep],[len,-deep],[len,2]],metal);
      shape(c,[[0,-deep*.85],[len,-deep*.85],[len,-deep*.59],[0,-deep*.59]],'#18354f');
      line(c,[[0,1],[len,1]],'#e5f4ff',2);line(c,[[0,-deep*.85],[len,-deep*.85]],'#c4d7ac',1);
      // Three interlocking large armor panels, not a strip of duplicated icons.
      const n=3,w=len/n;for(let i=0;i<n;i++){
        const x0=i*w,x1=(i+1)*w,m=(x0+x1)/2;
        shape(c,[[x0+2,-deep*.72],[x1-2,-deep*.72],[x1-9,-deep*.18],[m,-deep*.08],[x0+9,-deep*.18]],i===1?'#315d8a':'#25476c');
        shape(c,[[x0+7,-deep*.7],[m,-deep*.68],[m+10,-deep*.4],[x0+12,-deep*.25]],'#c3ddf555');
        line(c,[[x0+4,-deep*.72],[x1-4,-deep*.72],[x1-9,-deep*.18]],'#92b9df',.9);
        line(c,[[x0+8,-deep*.16],[m,-deep*.06],[x1-8,-deep*.16]],'#e0c380',1.1);
        // Faceted inset and paired bevels give each interlocked section depth.
        shape(c,[[x0+15,-deep*.59],[m,-deep*.58],[x1-15,-deep*.59],[x1-21,-deep*.28],[m,-deep*.19],[x0+21,-deep*.28]],'#153f3e');
        shape(c,[[x0+15,-deep*.59],[m,-deep*.58],[m,-deep*.49],[x0+21,-deep*.28]],'#8cceb155');
        line(c,[[x0+15,-deep*.59],[m,-deep*.58],[x1-15,-deep*.59]],'#b9dec1',.8);
        line(c,[[x0+21,-deep*.28],[m,-deep*.19],[x1-21,-deep*.28]],'#64bca5',.8);
        if(i===1){hex(c,m,-deep*.42,5,'#d3f6c2',1);line(c,[[m-13,-deep*.42],[m-7,-deep*.42]],'#d6d2a2',.8);line(c,[[m+7,-deep*.42],[m+13,-deep*.42]],'#d6d2a2',.8);}
      }
      // Crest and overlapping armor plates give the wall an unmistakable shield silhouette.
      const mid=len*.5;
      shape(c,[[mid-23,-deep*.82],[mid,-deep*.96],[mid+23,-deep*.82],[mid+19,-deep*.34],[mid,-deep*.08],[mid-19,-deep*.34]],'#102c32');
      shape(c,[[mid-19,-deep*.78],[mid,-deep*.9],[mid+19,-deep*.78],[mid+15,-deep*.36],[mid,-deep*.15],[mid-15,-deep*.36]],'#3a8777');
      shape(c,[[mid-17,-deep*.76],[mid,-deep*.86],[mid,-deep*.23],[mid-14,-deep*.37]],'#99dec088');
      line(c,[[mid-19,-deep*.78],[mid,-deep*.9],[mid+19,-deep*.78],[mid+15,-deep*.36],[mid,-deep*.15],[mid-15,-deep*.36],[mid-19,-deep*.78]],'#d9f6d0',1.1);
      line(c,[[mid,-deep*.8],[mid,-deep*.26]],'#e2ffe7',.8);
      // Inner engraving and split highlights remain part of the shield material.
      line(c,[[mid-11,-deep*.58],[mid,-deep*.68],[mid+11,-deep*.58],[mid+8,-deep*.39],[mid,-deep*.28],[mid-8,-deep*.39],[mid-11,-deep*.58]],'#d6f5cd',.8);
      shape(c,[[mid-11,-deep*.58],[mid,-deep*.68],[mid,-deep*.31],[mid-8,-deep*.39]],'#d4ffdc55');
      // Four staggered buttresses bridge the long plates with metallic depth.
      for(const fraction of [.17,.34,.66,.83]){const px=len*fraction,half=Math.min(7,len*.022);
        shape(c,[[px-half,-deep],[px+half,-deep],[px+half+2,-deep*.52],[px+half,-deep*.12],[px-half,-deep*.12],[px-half-2,-deep*.52]],'#214e4a');
        shape(c,[[px-half+1,-deep*.96],[px+half-1,-deep*.96],[px+half,-deep*.7],[px-half,-deep*.7]],'#a7d3ae');
        line(c,[[px-half,-deep*.14],[px,-deep*.06],[px+half,-deep*.14]],'#c8f7cf',1.1);
      }
      // A narrow, translucent inward field is decorative, inside the boundary.
      const g=c.createLinearGradient(0,1,0,18);g.addColorStop(0,'#9affcf77');g.addColorStop(1,'#7bf5cf00');c.fillStyle=g;c.fillRect(0,1,len,17);
      const pos=((age*.40+side*.19)%1)*len;const light=c.createLinearGradient(Math.max(0,pos-32),0,Math.min(len,pos+32),0);light.addColorStop(0,'#caffed00');light.addColorStop(.5,'#f4ffe9');light.addColorStop(1,'#caffed00');
      c.globalAlpha=appear*(.55+.4*pulse);line(c,[[Math.max(0,pos-32),1],[Math.min(len,pos+32),1]],light,3);
      if(f.phase==='shrink'||pulse>0){const surge=f.phase==='shrink'?Math.sin(Math.PI*clamp((age-.8)/1.2))*.45:pulse;
        c.globalAlpha=surge*.38;const wave=c.createLinearGradient(0,1,0,32);wave.addColorStop(0,'#baffda77');wave.addColorStop(.6,'#9bf3ce22');wave.addColorStop(1,'#9bf3ce00');c.fillStyle=wave;c.fillRect(0,1,len,31);}
      c.restore();
    }
    // Lock pillars are anchored to the four actual moving corners.
    for(const [x,y,rot] of [[l,t,0],[r,t,Math.PI/2],[r,bot,Math.PI],[l,bot,-Math.PI/2]]){
      c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha=open;shape(c,[[-7,-7],[0,-15],[7,-7],[7,1],[0,6],[-7,1]],'#173f40');
      shape(c,[[-5,-7],[0,-12],[5,-7],[4,-1],[0,3],[-4,-1]],'#74bda5');line(c,[[-5,-7],[0,-12],[5,-7]],'#e4f6c7',1.2);
      if(pulse>0){c.globalAlpha=open*pulse*.8;c.strokeStyle='#e9fff0';c.lineWidth=1.5;c.beginPath();c.arc(0,0,7+(1-pulse)*15,0,TAU);c.stroke();}c.restore();
    }
  }
  function scars(c,b,e){const u=b.arcana,charge=u.phase==='debtCharge';if(u.used&&!charge)return;const p=charge?clamp((e.time-u.started)/G.DefenseArcana.debtTiming.charge):clamp((u.scarDebt||0)/60);if(p<=.001)return;c.save();c.translate(b.x,b.y);c.globalAlpha=charge?.35+p*.65:.3+p*.6;
    const debt=clamp((u.scarDebt||0)/60),r=b.radius;
    for(let i=0;i<6;i++){const growth=clamp((debt*7-i)/1.55);if(!growth)continue;c.save();c.rotate(i*2.399+.25);c.beginPath();c.arc(0,0,r*(.76+(i%3)*.095)*growth,0,TAU);c.clip();
      shape(c,[[0,-1],[r*.22,-2],[r*.38,1],[r*.57,-4],[r*.73,-2],[r*.95,-5],[r*.73,0],[r*.58,-1],[r*.38,4],[r*.2,1],[0,1]],charge?b.def.color:'#75629d');
      line(c,[[0,0],[r*.22,-.5],[r*.38,2],[r*.58,-2],[r*.74,-1],[r*.95,-5]],charge?'#eee6ff':'#c7b5ef',.7);line(c,[[r*.42,1],[r*.53,6],[r*.72,8]],'#9983c4',.7);c.restore();}
    c.restore();
  }
  function chain(c,a,b,fade,time){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),n=Math.min(30,Math.max(3,Math.floor(len/11)));
    c.save();c.translate(a.x,a.y);c.rotate(angle);c.globalAlpha*=fade;c.lineCap='round';
    // A dark cord beneath overlapping beveled links keeps one continuous tension line.
    c.strokeStyle='#2d1b46';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(len,0);c.stroke();
    const phase=(time*2.2)%1;
    for(let i=0;i<n;i++){const q=(i+.5)/n,x=q*len,w=Math.max(3,len/n*.46),twist=i%2,bright=Math.max(0,1-Math.abs(q-phase)*8);
      c.save();c.translate(x,0);c.rotate(twist?.38:-.38);
      c.beginPath();c.ellipse(0,0,w,twist?2.1:3.2,0,0,TAU);c.strokeStyle='#39244f';c.lineWidth=3.2;c.stroke();
      c.beginPath();c.ellipse(0,0,w,twist?2.1:3.2,0,0,TAU);c.strokeStyle=bright>.3?'#f8e4ff':twist?'#9274be':'#c5a9e7';c.lineWidth=1.55;c.stroke();
      c.beginPath();c.ellipse(0,0,w,twist?2.1:3.2,0,Math.PI*1.12,Math.PI*1.78);c.strokeStyle='#fff0ff';c.lineWidth=.6;c.stroke();c.restore();
    }c.restore();
  }
  function debtFront(c,p){
    if(p.history?.length){c.save();c.lineCap='round';const trail=[{x:p.x,y:p.y},...p.history];
      for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],v=1-i/trail.length;c.globalAlpha=v*.23;c.strokeStyle='#a06ae9';c.lineWidth=6+v*15;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.globalAlpha=v*.65;c.strokeStyle='#f4dcff';c.lineWidth=1+v*2.2;c.stroke();}c.restore();}
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);
    const aura=c.createRadialGradient(0,0,2,0,0,54);aura.addColorStop(0,'#dfb5ff88');aura.addColorStop(.4,'#a464e250');aura.addColorStop(1,'#6b368000');c.fillStyle=aura;c.fillRect(-60,-54,120,108);
    // Curving pressure flanks converge on the actual projectile, not a broad opaque arrow.
    for(const [scale,color]of [[1,'#4c2c72'],[.73,'#9361c7'],[.43,'#d5b0f4']]){c.save();c.scale(1,scale);c.beginPath();c.moveTo(24,0);c.bezierCurveTo(5,-29,-24,-35,-83,-21);c.bezierCurveTo(-42,-19,-35,-7,-18,-3);c.bezierCurveTo(-36,4,-59,16,-78,18);c.bezierCurveTo(-26,27,7,21,24,0);const body=c.createLinearGradient(-65,-26,24,22);body.addColorStop(0,color);body.addColorStop(.57,color);body.addColorStop(1,scale>.9?'#7950a7':scale>.6?'#c59bec':'#eed5ff');c.fillStyle=body;c.fill();c.restore();}
    const g=c.createLinearGradient(-75,0,25,0);g.addColorStop(0,'#b784e000');g.addColorStop(.55,'#efd5ff');g.addColorStop(1,'#fff8ff');c.fillStyle=g;c.beginPath();c.moveTo(-75,-1);c.quadraticCurveTo(-15,-10,24,0);c.quadraticCurveTo(-15,9,-75,2);c.closePath();c.fill();
    for(const side of [-1,1]){c.save();c.globalAlpha=.5;line(c,[[-61,side*9],[-41,side*11],[-27,side*6],[-11,side*8],[8,side*2]],'#f0d4ff',.75);c.restore();}
    for(const side of [-1,1]){c.strokeStyle='#d8b8fa';c.lineWidth=1.1;c.beginPath();c.moveTo(-86,side*27);c.bezierCurveTo(-60,side*34,-22,side*23,8,side*7);c.stroke();}
    c.restore();
  }
  function debtGather(c,b,e){
    const u=b.arcana;if(u.phase!=='debtCharge')return;const p=clamp((e.time-u.started)/G.DefenseArcana.debtTiming.charge),fade=clamp(p/.10)*clamp((1-p)/.10);
    const paths=[[[-125,-64],[-108,-5],[-54,-39],[-7,-3]],[[-104,61],[-73,71],[-37,12],[-7,3]],[[-79,-91],[-65,-48],[-15,-52],[-4,-5]]];
    c.save();c.translate(b.x,b.y);c.rotate(u.aim);c.globalAlpha=fade;
    const halo=c.createRadialGradient(0,0,5,0,0,80);halo.addColorStop(0,'#ba7de85a');halo.addColorStop(.45,'#703ca029');halo.addColorStop(1,'#64248600');c.fillStyle=halo;c.fillRect(-80,-80,160,160);
    paths.forEach((pts,i)=>{const head=clamp((p-i*.045)/.69),tail=Math.max(0,head-.78),at=t=>{const v=1-t;return[v*v*v*pts[0][0]+3*v*v*t*pts[1][0]+3*v*t*t*pts[2][0]+t*t*t*pts[3][0],v*v*v*pts[0][1]+3*v*v*t*pts[1][1]+3*v*t*t*pts[2][1]+t*t*t*pts[3][1]];};
      for(const [scale,color]of [[1,'#713da68c'],[.57,'#bc8de3b0'],[.19,'#f3dfff']]){const left=[],right=[];for(let j=0;j<=32;j++){const q=j/32,t=tail+(head-tail)*q,a=at(t),prev=at(Math.max(0,t-.003)),next=at(Math.min(1,t+.003)),dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1,w=Math.sin(Math.PI*q)**.7*(5+8*p)*(1-i*.16)*scale;left.push([a[0]-dy/len*w,a[1]+dx/len*w]);right.push([a[0]+dy/len*w,a[1]-dx/len*w]);}c.globalAlpha=fade;shape(c,[...left,...right.reverse()],color);}
      for(let j=0;j<2;j++){const t=clamp((p*.95+i*.17+j*.24)%1),a=at(t);c.save();c.translate(...a);c.rotate(i*.8+p*2+j);c.globalAlpha=fade*Math.sin(Math.PI*t)*.8;shape(c,[[-4,-2],[2,-4],[6,0],[-1,3]],'#caa1ed');line(c,[[-4,-2],[2,-4],[6,0]],'#f4e0ff',.7);c.restore();}
    });c.restore();
  }
  const behind=A.behind,front=A.front;A.behind=function(r,e){behind.call(this,r,e);const c=r.ctx,w=e.arcanaWorld?.defense;if(!w)return;c.save();
    for(const b of e.balls)if(b.type==='reflector'&&b.hp>0&&b.arcana?.phase==='debtCharge')debtGather(c,b,e);
    if(w.fortress){c.fillStyle='#071922';c.globalAlpha=.12;c.fillRect(0,0,C.width,C.height);c.globalAlpha=1;walls(c,w.fortress,e);}
    for(const v of w.returns){const b=e.balls.find(b=>b.id===v.owner),t=e.balls.find(b=>b.id===v.target);if(!b||!t)continue;const fade=clamp((v.until-e.time)/.3);for(const s of [-1,1])chain(c,{x:b.x,y:b.y+s*11},{x:t.x,y:t.y+s*12},fade*.8,e.time-v.started);const a=Math.atan2(b.y-t.y,b.x-t.x);c.save();c.translate(t.x,t.y);c.rotate(a);shape(c,[[24,-19],[38,-11],[30,-9],[25,-13]],'#a78bd7');shape(c,[[24,19],[38,11],[30,9],[25,13]],'#a78bd7');c.restore();}c.restore();};
  A.front=function(r,e){front.call(this,r,e);const c=r.ctx,w=e.arcanaWorld?.defense;if(!w)return;c.save();for(const b of e.balls){if(!G.DefenseArcana.handles(b))continue;if(b.type==='reflector')scars(c,b,e);if(b.arcana.royalActive){c.save();c.translate(b.x,b.y);const rad=b.radius+7;for(let i=0;i<6;i++){const a=i*TAU/6;c.save();c.rotate(a);shape(c,[[rad,-9],[rad+3,-6],[rad+3,6],[rad,9],[rad-1,5],[rad-1,-5]],'#a6e9c2');c.restore();}c.restore();}}for(const p of w.bolts)debtFront(c,p);
    for(const f of e.effects){if(f.kind!=='arcana')continue;const age=Math.max(f.age,(e.presentationTime||0)-(f.bornReal||0));
      if(f.style==='royalDissolve'&&age<.65){const p=clamp(age/.65),b=e.balls.find(b=>b.id===f.owner)||f;for(let side=0;side<4;side++)for(let i=0;i<7;i++){const q=(i+.5)/7,x=side===0?q*C.width:side===1?C.width:side===2?(1-q)*C.width:0,y=side===0?0:side===1?q*C.height:side===2?C.height:(1-q)*C.height;const out=clamp(p/.2),back=clamp((p-.23)/.77),xx=x+(x-C.width/2)*out*.06+(b.x-x)*back*back,yy=y+(y-C.height/2)*out*.06+(b.y-y)*back*back;shard(c,xx,yy,side*Math.PI/2+i*.4+p,10*(1-back*.75),1-p);}}
      if(f.style==='debtImpact'&&age<G.DefenseArcana.debtTiming.impact){const p=clamp(age/G.DefenseArcana.debtTiming.impact),q=1-Math.exp(-p*7);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-p)**1.4;
        // A broad pair of fractured energy sheets unfurls from the true contact.
        const glow=c.createRadialGradient(0,0,2,0,0,96);glow.addColorStop(0,'#f5d9ff99');glow.addColorStop(.32,'#b36be966');glow.addColorStop(1,'#642e9100');c.fillStyle=glow;c.fillRect(-98,-98,196,196);
        for(const side of [-1,1]){c.save();c.scale(1,side);const sweep=35+q*100;
          const g=c.createLinearGradient(0,0,-sweep,0);g.addColorStop(0,'#f4d4ffcc');g.addColorStop(.42,'#b57fe49a');g.addColorStop(1,'#793fa300');
          c.fillStyle=g;c.beginPath();c.moveTo(3,0);c.bezierCurveTo(-18,-8,-sweep*.35,-27-q*12,-sweep,-31-q*27);c.bezierCurveTo(-sweep*.66,-13-q*17,-sweep*.34,-7,-4,5);c.closePath();c.fill();
          c.strokeStyle='#f0d7ff';c.lineWidth=1.2;c.beginPath();c.moveTo(3,0);c.bezierCurveTo(-18,-8,-sweep*.35,-27-q*12,-sweep,-31-q*27);c.stroke();c.restore();}
        // Splintered force continues past contact: irregular forked seams,
        // each linked to the hit position rather than fixed screen decoration.
        const fractures=[[-.88,106],[-.34,138],[.14,118],[.63,96]];
        fractures.forEach(([angle,length],i)=>{c.save();c.rotate(angle);const d=length*q;
          const fg=c.createLinearGradient(0,0,d,0);fg.addColorStop(0,'#f8e6ffdd');fg.addColorStop(.35,'#cb98f6bb');fg.addColorStop(1,'#9964ce00');
          shape(c,[[2,-2],[d*.35,-5-i],[d*.50,-1],[d*.72,-5],[d,0],[d*.67,3],[d*.48,1],[d*.33,5+i],[2,2]],fg);
          line(c,[[2,0],[d*.35,-3-i],[d*.5,0],[d,0]],'#f7e6ff',1.1);
          line(c,[[d*.42,-2],[d*.57,-12-i*2],[d*.7,-14-i*3]],'#cfa4f4',.8);c.restore();});
        // Directional shards leave a broken seam rather than a radial star.
        for(const s of [-1,1]){const reach=22+q*76;
          shape(c,[[0,0],[-11,s*6],[-reach*.54,s*(14+q*8)],[-reach,s*(19+q*11)],[-reach*.51,s*(8+q*4)],[-6,s*2]],'#644888');
          shape(c,[[1,0],[-reach*.46,s*(9+q*5)],[-reach,s*(19+q*11)],[-reach*.4,s*(6+q*4)]],'#b99ae8');
          line(c,[[1,0],[-reach*.46,s*(9+q*5)],[-reach,s*(19+q*11)]],'#f1ddff',1.25);
        }
        for(let i=0;i<5;i++){const side=i%2?1:-1,x=(12+i*8)*q,y=side*(10+i*7)*q;c.globalAlpha=(1-p)*(i%2?.4:.7);line(c,[[x,y],[x+8+q*12,y+side*(3+i)]],'#ddc3ff',1);}
        if(age<.06){c.globalAlpha=1;shape(c,[[-7,-3],[0,-14],[5,-3],[20,0],[5,4],[0,15],[-5,4]],'#fff4ff');}c.restore();}
      if(f.style==='debtRelease'&&age<.32){c.save();c.globalAlpha=.7*(1-age/.32);c.translate(f.x,f.y);c.rotate(f.angle);for(const s of [-1,1]){shape(c,[[1,0],[-23,s*22],[-65,s*28],[-28,s*16]],'#8f71c2');line(c,[[-65,s*28],[-23,s*22],[1,0]],'#cdb9f4',1);}c.restore();}
      if(f.style==='debtPredict'&&age<.4){c.save();c.globalAlpha=1-age/.4;for(let i=0;i<4;i++){const a=i*TAU/4,x=f.x+Math.cos(a)*(29+age*20),y=f.y+Math.sin(a)*(29+age*20);shard(c,x,y,a,6,1);}c.restore();}
    }c.restore();};
  const draw=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e,...args){const old=G.Charge.localBounds;G.Charge.localBounds=e.arcanaWorld?.defense?.fortress?.bounds||null;try{return draw.call(this,e,...args);}finally{G.Charge.localBounds=old;}};
})(typeof window!=='undefined'?window:globalThis);
