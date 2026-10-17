(function(root){
  'use strict';const G=root.OrbDuel;
  G.TacticsView={
    flyer(renderer,p){const c=renderer.ctx;if(!['venom','shard','blade'].includes(p.mode))return false;c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));c.shadowBlur=0;
      if(p.mode==='venom'){c.fillStyle=p.color;c.strokeStyle='#162519';c.lineWidth=1;c.beginPath();c.moveTo(7,0);c.bezierCurveTo(2,-7,-7,-6,-9,0);c.bezierCurveTo(-7,6,2,7,7,0);c.fill();c.stroke();c.fillStyle='#e0ffb5';c.beginPath();c.ellipse(2,-2,2.2,1.3,0,0,Math.PI*2);c.fill();c.strokeStyle=p.color+'75';c.lineWidth=3;c.beginPath();c.moveTo(-10,0);c.lineTo(-22,0);c.stroke();}
      else if(p.mode==='shard'){c.fillStyle='#ffd3be';c.beginPath();c.moveTo(4,0);c.lineTo(-3,-2.5);c.lineTo(-1,3);c.closePath();c.fill();}
      else{c.strokeStyle=p.color;c.lineWidth=3;c.beginPath();c.moveTo(-7,4);c.lineTo(0,-4);c.lineTo(7,4);c.stroke();}
      c.restore();return true;
    },
    front(renderer,e){const c=renderer.ctx;c.save();c.shadowBlur=0;
      for(const m of e.traps){if(!m.captureUntil)continue;const target=e.balls.find(b=>b.id===m.captureTarget&&b.hp>0);if(!target)continue;const p=Math.max(0,Math.min(1,(e.time-m.captureStarted)/.3)),dx=target.x-m.x,dy=target.y-m.y,d=Math.hypot(dx,dy)||1;
        c.strokeStyle=m.color;c.lineWidth=2.7;c.beginPath();c.moveTo(m.x,m.y);c.quadraticCurveTo((m.x+target.x)/2-dy/d*8*(1-p),(m.y+target.y)/2+dx/d*8*(1-p),target.x,target.y);c.stroke();c.strokeStyle='#fff0df';c.lineWidth=1;c.setLineDash([3,5]);c.lineDashOffset=e.time*60;c.stroke();c.setLineDash([]);
        renderer.circle(m.x,m.y,m.radius+5*(1-p));c.strokeStyle='#ffd8ba';c.lineWidth=2;c.stroke();
        for(const u of [.25,.55,.8]){const x=m.x+dx*u,y=m.y+dy*u;c.beginPath();c.moveTo(x+dx/d*4-dy/d*3,y+dy/d*4+dx/d*3);c.lineTo(x,y);c.lineTo(x+dx/d*4+dy/d*3,y+dy/d*4-dx/d*3);c.stroke();}
      }
      for(const f of e.effects){if(f.kind!=='tactic')continue;const p=f.age/f.life;c.globalAlpha=Math.pow(1-p,1.5);c.strokeStyle=f.color;c.fillStyle=f.color;c.lineWidth=2.5*(1-p)+.4;
        if(f.style==='mineBlast'){const r=10+(f.radius+25)*(1-Math.pow(1-p,3));c.beginPath();c.ellipse(f.x,f.y,r,r*.55,0,0,Math.PI*2);c.stroke();if(p<.18){renderer.circle(f.x,f.y,12+p*100);c.fillStyle='#fff2dc';c.fill();}for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(f.x+Math.cos(a)*r*.55,f.y+Math.sin(a)*r*.4);c.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.65);c.stroke();}}
        if(f.style==='catch'){for(let i=0;i<4;i++){const a=i*Math.PI/2,r=25-8*p;c.beginPath();c.arc(f.x,f.y,r,a+.1,a+.65);c.stroke();}}
        if(f.style==='spill'){const r=6+24*p;c.beginPath();c.ellipse(f.x,f.y,r,r*.6,0,0,Math.PI*2);c.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*.4;renderer.circle(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.7,2*(1-p)+.5);c.fill();}}
        if(f.style==='pursuit'){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.beginPath();c.arc(0,0,26+p*12,Math.PI*.4,Math.PI*1.5);c.stroke();c.beginPath();c.moveTo(9,-5);c.lineTo(18,0);c.lineTo(9,5);c.stroke();c.restore();}
      }c.restore();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
