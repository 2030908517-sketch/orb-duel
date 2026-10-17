(function(root){
  'use strict';const G=root.OrbDuel;
  G.CosmicView={
    star(c,x,y,r=7){c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,d=i%2?r*.38:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();},
    icon(c,x,y,type){if(type==='storm'){c.beginPath();c.moveTo(x-12,y);c.bezierCurveTo(x-17,y-10,x-6,y-13,x-2,y-8);c.bezierCurveTo(x+3,y-15,x+13,y-10,x+12,y-3);c.quadraticCurveTo(x+18,y+3,x+8,y+3);c.stroke();c.beginPath();c.moveTo(x+1,y-1);c.lineTo(x-4,y+7);c.lineTo(x+2,y+6);c.lineTo(x-2,y+13);c.stroke();}else{c.beginPath();c.ellipse(x,y,13,5,-.4,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}},
    bolt(c,x,y,tx,ty,seed,width){const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;c.beginPath();c.moveTo(x,y);for(let i=1;i<=12;i++){const u=i/12,offset=i===12?0:Math.sin(i*13.4+seed)*6;c.lineTo(x+dx*u+nx*offset,y+dy*u+ny*offset);}c.lineWidth=width;c.stroke();},
    behind(r,e){const w=e.cosmicWorld;if(!w)return;const c=r.ctx;c.save();c.shadowBlur=0;
      for(const v of w.strikes){if(e.time<v.warningAt)continue;const p=Math.min(1,(e.time-v.warningAt)/(v.at-v.warningAt)),b=e.balls.find(b=>b.id===v.owner);if(!b)continue;c.strokeStyle=b.def.color;c.globalAlpha=.35+p*.4;c.lineWidth=1.5;c.setLineDash([3,4]);r.circle(v.x,v.y,v.radius);c.stroke();c.setLineDash([]);c.beginPath();c.arc(v.x,v.y,v.radius+4,-Math.PI/2,-Math.PI/2+p*Math.PI*2);c.stroke();c.beginPath();c.moveTo(v.x-7,v.y);c.lineTo(v.x+7,v.y);c.moveTo(v.x,v.y-7);c.lineTo(v.x,v.y+7);c.stroke();}
      c.globalAlpha=1;c.restore();
    },
    front(r,e){const c=r.ctx;c.save();c.shadowBlur=0;      for(const f of e.effects){if(f.kind!=='cosmic')continue;const p=Math.min(1,f.age/f.life);c.save();c.globalAlpha=1-p;c.strokeStyle=f.color;c.fillStyle=f.color;c.translate(f.x,f.y);
        if(f.style==='lightning'){const top=-Math.max(80,f.y),seed=Math.floor(p*7)+f.x;c.strokeStyle=f.color;this.bolt(c,0,top,0,0,seed,5*(1-p)+1);c.strokeStyle='#eef7ff';this.bolt(c,0,top,0,0,seed,1.8);c.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(Math.cos(a)*9,Math.sin(a)*9);c.lineTo(Math.cos(a+.08)*(17+p*28),Math.sin(a+.08)*(17+p*28));c.lineTo(Math.cos(a)*(27+p*38),Math.sin(a)*(27+p*38));c.stroke();}r.circle(0,0,8+p*28);c.lineWidth=3*(1-p)+.5;c.stroke();c.fillStyle='#e7f5ff';r.circle(0,0,9*(1-p));c.fill();}
        if(f.style==='staticShock'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;this.bolt(c,Math.cos(a)*8,Math.sin(a)*8,Math.cos(a+.4)*(15+p*22),Math.sin(a+.4)*(15+p*22),i+p*5,2);} }
        if(f.style==='poisonSpray'){for(let i=0;i<3;i++){const a=(f.angle||0)+i*Math.PI*2/3,d=8+p*30;c.save();c.rotate(a);c.beginPath();c.ellipse(d,0,5*(1-p)+1,2.5,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(2,0);c.lineTo(d-5,0);c.lineWidth=3*(1-p);c.stroke();c.restore();}}
        c.restore();
      }c.restore();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
