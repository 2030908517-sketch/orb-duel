(function(root){
  'use strict';const G=root.OrbDuel;
  G.ChargeView={
    icon(c,x,y){c.beginPath();c.moveTo(x-10,y-8);c.lineTo(x-10,y+8);c.moveTo(x+10,y-8);c.lineTo(x+10,y+8);c.stroke();c.beginPath();c.moveTo(x+3,y-12);c.lineTo(x-5,y+1);c.lineTo(x+2,y+1);c.lineTo(x-2,y+12);c.lineTo(x+7,y-3);c.lineTo(x,y-3);c.closePath();c.fill();},
    bolt(c,points,seed,width,color){if(points.length<2)return;c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.beginPath();c.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,n=Math.max(1,Math.ceil(d/7));for(let k=1;k<=n;k++){const u=k/n,j=k===n&&(i===points.length-1||n>1)?0:Math.sin((i*7+k)*13.7+seed)*2.7;c.lineTo(a.x+dx*u-dy/d*j,a.y+dy*u+dx/d*j);}}c.stroke();},
    path(s,direction,length,wall=true){const result=[];for(let i=0;i<=Math.ceil(length/4);i++){const p=s-direction*Math.min(length,i*4);result.push(wall?G.Charge.wallPoint(p):G.Charge.point(p,G.Constants.radius));}return result;},
    behind(r,e){const w=e.chargeWorld;if(!w)return;const c=r.ctx;c.save();c.lineCap='round';
      for(const p of [...w.segments,...w.points]){const b=e.balls.find(b=>b.id===p.owner&&b.hp>0);if(!b)continue;const q=G.Charge.wallPoint(p.s),s=G.Charge.point(p.s,G.Constants.radius),alpha=Math.min(1,(p.until-e.time)*2);c.globalAlpha=alpha*(.55+.15*Math.sin(e.time*17+p.s));c.strokeStyle='#87efff';c.lineWidth=p.id===undefined?2:3;c.beginPath();c.moveTo(q.x-s.tx*7+ s.nx*2,q.y-s.ty*7+s.ny*2);c.lineTo(q.x+s.tx*7+s.nx*2,q.y+s.ty*7+s.ny*2);c.stroke();if(p.id!==undefined){c.globalAlpha=alpha;c.fillStyle='#f5ffff';r.circle(q.x+s.nx*3,q.y+s.ny*3,2);c.fill();}}
      c.globalAlpha=1;for(const p of w.currents){const path=this.path(p.s,p.direction,70),seed=Math.floor(e.time*35)+p.id;this.bolt(c,path,seed,6,'#54b7d980');this.bolt(c,path,seed,2.3,'#e9feff');const q=path[0];c.fillStyle='#fff';r.circle(q.x,q.y,3);c.fill();}
      for(const b of e.balls)if(G.Charge.flowing(b)){const a=b.charge,seed=Math.floor(e.time*38);this.bolt(c,this.path(a.s,a.direction,100,false),seed,12,'#62d7f033');this.bolt(c,this.path(a.s,a.direction,85,false),seed,5,'#76e6ff');this.bolt(c,this.path(a.s,a.direction,70,false),seed,1.7,'#ffffff');c.fillStyle='#fff';r.circle(b.x,b.y,4);c.fill();}
      c.restore();
    },
    front(r,e){const c=r.ctx;for(const f of e.effects){if(f.kind!=='charge')continue;const p=f.age/f.life;c.save();c.globalAlpha=1-p;c.strokeStyle=f.color;c.fillStyle='#fff';c.lineWidth=2;
        if(['arc','ground'].includes(f.style)){const path=[{x:f.x,y:f.y},{x:f.endX,y:f.endY}],seed=Math.floor(p*8)+f.x;this.bolt(c,path,seed,6*(1-p)+1,'#7febff');this.bolt(c,path,seed,1.6,'#ffffff');}
        const radius=f.style==='ground'?12+p*35:f.style==='transform'?28*(1-p):f.style==='reform'?32*(1-p)+4:4+p*19;
        if(f.style==='reform'){c.lineWidth=2.5;r.circle(f.x,f.y,radius);c.stroke();r.circle(f.x,f.y,6*(1-p));c.fill();}
        for(let i=0;i<7;i++){const a=i*Math.PI*2/7+f.x,inner=f.style==='reform'?radius:radius*.3;this.bolt(c,[{x:f.x+Math.cos(a)*inner,y:f.y+Math.sin(a)*inner},{x:f.x+Math.cos(a+.1)*radius,y:f.y+Math.sin(a+.1)*radius}],i,1.5,'#daffff');}c.restore();
      }
    }
  };
})(typeof window!=='undefined'?window:globalThis);
