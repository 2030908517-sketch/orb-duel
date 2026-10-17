(function(root){
  'use strict';const G=root.OrbDuel,TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
  function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function gear(c,x,y,r,angle,color){c.save();c.translate(x,y);c.rotate(angle);const pts=[];for(let i=0;i<48;i++){const a=i*TAU/48,d=i%4<2?r:r*.77;pts.push([Math.cos(a)*d,Math.sin(a)*d]);}poly(c,pts,color);c.restore();}
  function ring(c,p,age,alpha=1){c.save();c.translate(p.x,p.y);c.rotate(age*5);c.globalAlpha*=alpha;for(let i=0;i<6;i++){const a=i*TAU/6;c.save();c.rotate(a);poly(c,[[26,-8],[30,-6],[30,6],[26,8],[25,4],[25,-4]],'#8a4939');line(c,[[26,-7],[29,-5],[29,5],[26,7]],'#ffd196',1.3);c.restore();}c.restore();}
  function beam(c,a,b,age){const p=clamp(age/.2),alpha=clamp((.3-age)/.16);c.save();c.globalAlpha*=alpha;line(c,[[a.x,a.y],[a.x+(b.x-a.x)*p,a.y+(b.y-a.y)*p]],'#f18d68',2.4);line(c,[[a.x,a.y+2],[b.x,b.y+2]],'#ffdfae',.7);c.restore();}
  function plate(c,x,y,angle,pulse=0){c.save();c.translate(x,y);c.rotate(angle);poly(c,[[-8,-8],[6,-8],[10,-3],[10,6],[-8,6]],'#342b38');poly(c,[[-8,-8],[6,-8],[10,-3],[-4,-3]],'#89706c');line(c,[[-5,-3],[5,-3],[5,4]],pulse?'#fff0b6':'#d59168',2);poly(c,[[-3,-1],[0,-3],[3,0],[0,3]],'#b5a79a');c.restore();}
  function cage(c,box,e,front){const q=box.bounds,age=e.time-box.started,build=clamp(age/.28),pulse=Math.max(0,1-(age%1)/.16),cx=box.x,cy=box.y;
    c.save();if(!front){c.fillStyle='#24202b3b';c.fillRect(q.left,q.top,q.right-q.left,q.bottom-q.top);line(c,[[q.left,q.top],[q.right,q.top],[q.right,q.bottom],[q.left,q.bottom],[q.left,q.top]],'#eab48188',1);
      for(let i=0;i<4;i++){const x=q.left+12+i*(q.right-q.left-24)/3;line(c,[[x,q.top+7],[x+9,q.top+18]],'#8b645444',1);line(c,[[x,q.bottom-7],[x-9,q.bottom-18]],'#8b645444',1);}c.restore();return;}
    for(const[x,y,a]of [[q.left,q.top,0],[q.right,q.top,Math.PI/2],[q.right,q.bottom,Math.PI],[q.left,q.bottom,-Math.PI/2]]){c.save();c.translate(cx+(x-cx)*build,cy+(y-cy)*build);c.rotate(a-(1-build)*Math.PI/2);poly(c,[[-5,-5],[23,-5],[28,0],[23,5],[5,5],[5,23],[0,28],[-5,23]],'#43323d');poly(c,[[-5,-5],[23,-5],[28,0],[0,0],[0,28],[-5,23]],'#9b7c70');line(c,[[25,1],[2,1],[2,25]],pulse?'#fff0ba':'#f5af79',1.5);c.restore();}
    if(build>.6){const alpha=clamp((build-.6)/.4);c.globalAlpha*=alpha;for(const[a,b]of [[[q.left+20,q.top],[q.right-20,q.top]],[[q.right,q.top+20],[q.right,q.bottom-20]],[[q.right-20,q.bottom],[q.left+20,q.bottom]],[[q.left,q.bottom-20],[q.left,q.top+20]]]){line(c,[a,b],'#3b303b',7);line(c,[[a[0]-1,a[1]-1],[b[0]-1,b[1]-1]],'#c09278',2);}
      for(const[x,y,a]of [[cx,q.top,0],[q.right,cy,Math.PI/2],[cx,q.bottom,Math.PI],[q.left,cy,-Math.PI/2]])plate(c,x,y,a,pulse);
      const by=q.bottom-22;poly(c,[[cx-13,by-10],[cx+10,by-10],[cx+15,by-5],[cx+15,by+8],[cx-13,by+8],[cx-17,by+2],[cx-17,by-5]],'#2c2832');poly(c,[[cx-13,by-10],[cx+10,by-10],[cx+15,by-5],[cx-9,by-5]],'#987b70');line(c,[[cx-8,by-3],[cx+10,by-3]],'#fa9669',3);for(let i=0;i<3;i++)poly(c,[[cx-9+i*7,by],[cx-5+i*7,by],[cx-7+i*7,by+5],[cx-11+i*7,by+5]],pulse?'#fff0bb':'#db665d');gear(c,cx,by-13,6,e.time*(5+age*2),'#d7a66d');
      const label=q.top>34?q.top-15:q.bottom+22;c.font='900 22px "Segoe UI"';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#0b121c';const digit=String(Math.max(1,Math.ceil(box.until-e.time)));c.strokeText(digit,cx,label);c.fillStyle=pulse?'#fff2ca':'#ffb17b';c.fillText(digit,cx,label);
      c.strokeStyle='#e8aa70';c.lineWidth=2;c.beginPath();c.arc(cx,label-7,18,-Math.PI/2,-Math.PI/2+TAU*clamp((box.until-e.time)/3));c.stroke();
    }c.restore();
  }
  const V=G.TrapperView={
    hub(r,m,e){const c=r.ctx,age=e.time-(m.armedAt-.3),open=clamp(age/.3);c.save();c.translate(m.x,m.y);c.globalAlpha=e.time>=m.armedAt?1:.65;poly(c,[[-18,-6],[-9,-14],[11,-14],[19,-5],[15,12],[-12,12],[-19,4]],'#4b303b');poly(c,[[-18,-6],[-9,-14],[11,-14],[19,-5],[10,-1],[-9,-1]],'#987152');line(c,[[-16,6],[-10,11],[13,11],[18,3]],'#ffd395',2);
      for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4+.6);c.translate(12+open*7,0);poly(c,[[-3,-4],[6,-4],[8,0],[6,4],[-3,4]],'#ad6b49');line(c,[[0,-3],[6,-3],[8,0]],'#ffd295',1.2);c.restore();}gear(c,0,-3,11,e.time*3,'#db9254');gear(c,0,-3,7,-e.time*2,'#302332');poly(c,[[0,-8],[4,-3],[0,2],[-4,-3]],'#fff0b8');c.restore();},
    behind(r,e){const c=r.ctx;for(const box of e.trapperWorld?.cages||[])cage(c,box,e,false);for(const b of e.balls)if(b.type==='trapper'&&b.arcana?.phase==='trapReady'&&b.hp>0){c.save();c.globalAlpha=.45+.2*Math.sin(e.time*5);for(let i=0;i<3;i++){const a=i*TAU/3+e.time*.3;c.save();c.translate(b.x,b.y);c.rotate(a);line(c,[[6,-21],[15,-16],[17,-5]],'#f5b78a',1.1);c.restore();}gear(c,b.x+18,b.y+13,4,-e.time*2,'#be8b69');c.restore();}},
    front(r,e){const c=r.ctx;for(const box of e.trapperWorld?.cages||[])cage(c,box,e,true);for(const f of e.effects){if(f.kind!=='mechanism')continue;const p=clamp(f.age/f.life);c.save();
        if(f.style==='swap'||f.style==='substitute'){const end={x:f.endX,y:f.endY};ring(c,f,f.age,1-p);ring(c,end,-f.age,1-p);beam(c,f,end,f.age);c.globalAlpha=.5*(1-p);c.strokeStyle='#edb288';c.lineWidth=1.3;c.beginPath();c.arc(f.x,f.y,23,0,TAU);c.stroke();line(c,[[f.x-14,f.y],[f.x,f.y-12],[f.x+14,f.y]],'#d6a277',1.3);}
        if(f.style==='hubDeploy'){const m=e.traps.find(m=>m.id===f.nodeId);if(m){const links=e.traps.filter(n=>n.owner===m.owner&&n!==m);for(let i=0;i<links.length;i++){const t=links[i],at=clamp((f.age-i*.025)/.16);if(!at)continue;c.globalAlpha=(1-p)*.75;line(c,[[m.x,m.y],[m.x+(t.x-m.x)*at,m.y+(t.y-m.y)*at]],'#ffd397',1.6);}}}
        if(f.style==='hubOnline'){c.globalAlpha=1-p;for(let i=0;i<4;i++){const a=i*TAU/4;c.save();c.translate(f.x,f.y);c.rotate(a);poly(c,[[20+p*9,-4],[25+p*9,0],[20+p*9,4],[22+p*9,0]],'#f7c67d');c.restore();}}
        if(f.style==='cageBlast'||f.style==='cageRelease'){const blast=f.style==='cageBlast',q=1-Math.exp(-f.age*17);c.translate(f.x,f.y);c.globalAlpha=(1-p)**1.3;
          if(blast){const fire=clamp(1-f.age/.38),rad=20+q*70;c.globalAlpha=fire*fire;
            for(let i=0;i<7;i++){const a=i*TAU/7+.13,reach=rad*(.7+(i*7%5)*.085);c.save();c.rotate(a);c.fillStyle=i%2?'#d86a46':'#ffc679';c.beginPath();c.moveTo(-5,-6);c.quadraticCurveTo(reach*.25,-19,reach*.65,-13);c.lineTo(reach,-4);c.lineTo(reach*.75,3);c.quadraticCurveTo(reach*.5,12,3,8);c.closePath();c.fill();c.restore();}
            if(f.age<.075){c.globalAlpha=1-f.age/.075;poly(c,[[0,-55],[13,-15],[49,-5],[18,11],[2,50],[-12,14],[-48,0],[-14,-12]],'#fff1ca');}
            c.globalAlpha=clamp(1-f.age/.55)*.7;c.strokeStyle='#efbe80';c.lineWidth=3*(1-p);c.beginPath();c.ellipse(0,0,rad+5,rad*.7,0,0,TAU);c.stroke();}
          c.globalAlpha=(1-p)**1.8;const hw=f.bounds?(f.bounds.right-f.bounds.left)/2:60,hh=f.bounds?(f.bounds.bottom-f.bounds.top)/2:55;
          for(let i=0;i<8;i++){const side=i%4,a=i*TAU/8+.2,sx=side===0?-hw:side===1?hw:((i%3)-1)*hw*.6,sy=side===2?-hh:side===3?hh:((i%3)-1)*hh*.6,travel=q*(blast?65:18);c.save();c.translate(sx+Math.cos(a)*travel,sy+Math.sin(a)*travel);c.rotate(a+f.age*(i%2?-4:4));poly(c,[[-13,-4],[9,-4],[14,1],[7,6],[-12,3]],'#70545b');poly(c,[[-13,-4],[9,-4],[14,1],[-8,1]],'#b79379');line(c,[[-13,-4],[9,-4],[14,1]],'#ffd49c',1.3);c.restore();}
        }c.restore();}
    }
  };
})(typeof window!=='undefined'?window:globalThis);
