(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants;
  G.HolyView={
    cross(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();},
    waterShape(p){const dx=p.x-p.ax,dy=p.y-p.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,tx=dx/d,ty=dy/d,left=[],right=[];
      for(let i=0;i<=4;i++){const u=i/4,x=p.ax+dx*u+tx*(u*2-1),y=p.ay+dy*u+ty*(u*2-1),wave=Math.sin(p.ax*.14+p.ay*.11+u*3.2);
        const a=6.6+wave*1.2,b=6.6+Math.cos(p.ax*.1-p.ay*.17+u*2.5)*1.1;left.push({x:x+nx*a,y:y+ny*a});right.push({x:x-nx*b,y:y-ny*b});
      }return [...left,...right.reverse()];
    },
    floor(renderer,e){
      const w=e.holyWorld;if(!w)return;const c=renderer.ctx,t=e.time;c.save();c.lineCap='butt';c.lineJoin='round';
      // Fixed per-sample ground decals: age changes opacity only, never geometry or highlights.
      const patch=(context,p)=>{const shape=this.waterShape(p),last=shape.at(-1);context.moveTo((last.x+shape[0].x)/2,(last.y+shape[0].y)/2);for(let i=0;i<shape.length;i++){const point=shape[i],next=shape[(i+1)%shape.length];context.quadraticCurveTo(point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2);}context.closePath();};
      if(root.document){
        if(!this.waterLayer){this.waterLayer=root.document.createElement('canvas');this.waterLayer.width=C.width;this.waterLayer.height=C.height;this.waterContext=this.waterLayer.getContext('2d');}
        const mask=this.waterContext;mask.clearRect(0,0,C.width,C.height);mask.globalCompositeOperation='lighten';
        // Opaque brightness values combine by maximum, so adjoining samples cannot form dark seams.
        for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade)continue;mask.beginPath();patch(mask,p);mask.fillStyle='rgb('+Math.round(135*fade)+','+Math.round(172*fade)+','+Math.round(190*fade)+')';mask.fill();}
        c.save();c.globalCompositeOperation='screen';c.globalAlpha=.28;c.drawImage(this.waterLayer,0,0,C.width,C.height);c.restore();
      }else{for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade)continue;c.beginPath();patch(c,p);c.globalAlpha=fade*.28;c.fillStyle='#87acbe';c.fill();}}
      // Reflections are anchored to each sample; fading never changes their location or shape.
      for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade||(p.id||0)%5!==0)continue;const dx=p.x-p.ax,dy=p.y-p.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,x=(p.ax+p.x)/2,y=(p.ay+p.y)/2;
        c.globalAlpha=fade*.17;c.strokeStyle='#e8f5f1';c.lineWidth=.8;c.beginPath();c.moveTo(x-dx*.18+nx*3,y-dy*.18+ny*3);c.quadraticCurveTo(x+nx*5,y+ny*5,x+dx*.18+nx*3,y+dy*.18+ny*3);c.stroke();
      }
      c.globalAlpha=1;
      for(const z of w.zones)G.HolyAngelView?.floor(renderer,e,z);
      for(const l of w.lights){if(l.landed||t<l.warningAt)continue;const f=Math.min(1,(t-l.warningAt)/(l.at-l.warningAt));c.globalAlpha=.38+f*.48;c.strokeStyle=l.kind==='judgement'?'#ffffff':'#dfebff';c.lineWidth=1.2;
        renderer.circle(l.x,l.y,l.radius+8-f*5);c.stroke();this.cross(c,l.x,l.y,4+f*3,'#ffffff',1.3);c.fillStyle='#edf4ff12';c.fill();}
      c.restore();
    },
    pillar(c,l,y,alpha,strike=0){
      const r=l.radius,depth=r*.38;
      c.save();c.globalAlpha=alpha;
      const silhouette=(radius)=>{c.beginPath();c.moveTo(l.x-radius,0);c.lineTo(l.x+radius,0);c.lineTo(l.x+radius,y);c.ellipse(l.x,y,radius,radius*.38,0,0,Math.PI);c.closePath();};
      // A rounded cylinder silhouette, with bright center and shaded side walls.
      const halo=c.createLinearGradient(l.x-r-5,0,l.x+r+5,0);halo.addColorStop(0,'#eef5ff00');halo.addColorStop(.5,'#ffffff35');halo.addColorStop(1,'#eef5ff00');silhouette(r+5);c.fillStyle=halo;c.fill();
      const body=c.createLinearGradient(l.x-r,0,l.x+r,0);body.addColorStop(0,'#dceaff38');body.addColorStop(.16,'#edf4ff88');body.addColorStop(.4,'#ffffffdf');body.addColorStop(.55,'#ffffff');body.addColorStop(.8,'#edf4ff90');body.addColorStop(1,'#dceaff38');
      silhouette(r);c.globalAlpha=alpha*(.65+strike*.3);c.fillStyle=body;c.fill();
      const base=c.createRadialGradient(l.x,y,1,l.x,y,r);base.addColorStop(0,'#ffffff');base.addColorStop(1,'#dbeaff70');
      c.globalAlpha=alpha;c.beginPath();c.ellipse(l.x,y,r,depth,0,0,Math.PI*2);c.fillStyle=base;c.fill();c.strokeStyle='#f4f8ff';c.lineWidth=1.4+strike*1.5;c.stroke();
      c.beginPath();c.ellipse(l.x,y,r,depth,0,0,Math.PI);c.strokeStyle='#ffffff';c.lineWidth=2.1+strike;c.stroke();c.restore();
    },
    front(renderer,e){
      const w=e.holyWorld;if(!w)return;const c=renderer.ctx,t=e.time;c.save();
      for(const b of e.balls){if(b.type!=='holy'||b.hp<=0||!b.holy.chargeUntil)continue;const progress=1-Math.max(0,b.holy.chargeUntil-t)/.7;c.globalAlpha=.6;
        for(let i=0;i<4;i++){const angle=i*Math.PI/2+t*.7;this.cross(c,b.x+Math.cos(angle)*34,b.y+Math.sin(angle)*34,3+progress*2,b.def.color,1.4);}c.globalAlpha=1;
      }
      for(const b of e.balls){if(b.hp<=0||!G.Holy.burnStatus(b,e))continue;c.globalAlpha=.85;
        for(let i=0;i<3;i++){const x=b.x+(i-1)*8,y=b.y-b.radius-4,reach=7+Math.sin(t*10+i*2)*2;c.beginPath();c.moveTo(x-3,y);c.quadraticCurveTo(x-4,y-reach*.5,x+1,y-reach);c.quadraticCurveTo(x+1,y-reach*.45,x+3,y);c.closePath();c.fillStyle=i===1?'#ffffff':'#dcecff';c.fill();}
      }
      for(const l of w.lights){
        if(!l.landed){if(t>=l.at-.085&&t<l.at){const p=(t-l.at+.085)/.085;this.pillar(c,l,l.y*p*p,.3+p*.7);}continue;}
        const age=t-l.at,fade=Math.max(0,Math.min(1,(l.expires-t)/.16)),strike=Math.max(0,1-age/.16);
        this.pillar(c,l,l.y,fade,strike);
        for(let i=0;i<4;i++){const a=i*Math.PI*.5+l.id*.3,r=l.radius*.7;c.globalAlpha=fade*.55;c.fillStyle='#f6f9ff';c.fillRect(l.x+Math.cos(a)*r-1,l.y+Math.sin(a)*r-((age*18+i*7)%28),2,4);}
      }
      for(const impact of e.effects){if(impact.kind!=='holyLanding')continue;const p=impact.age/impact.life,ease=1-Math.pow(1-p,3),reach=impact.radius+5+ease*30;
        c.globalAlpha=Math.pow(1-p,2);c.strokeStyle='#f5f9ff';c.lineWidth=3.8*(1-p)+.3;c.beginPath();c.ellipse(impact.x,impact.y,reach,reach*.38,0,0,Math.PI*2);c.stroke();
        if(p<.32){c.globalAlpha=(1-p/.32)*.65;c.fillStyle='#ffffff';c.beginPath();c.ellipse(impact.x,impact.y,impact.radius+4,impact.radius*.48,0,0,Math.PI*2);c.fill();}
        for(let i=0;i<6;i++){const a=i*Math.PI/3+impact.id*.7,x=impact.x+Math.cos(a)*reach*.75,y=impact.y+Math.sin(a)*reach*.4-ease*14;c.globalAlpha=(1-p)*.8;c.strokeStyle='#f0f6ff';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*5*(1-p),y-5*(1-p));c.stroke();}
      }
      for(const impact of e.effects){if(impact.kind!=='roster'||impact.style!=='holyImpact')continue;const age=impact.age/impact.life,reach=7+45*(1-Math.pow(1-age,3));c.globalAlpha=Math.pow(1-age,2);
        c.strokeStyle='#eef4ff';c.lineWidth=2.6*(1-age)+.4;c.beginPath();c.ellipse(impact.x,impact.y,reach,reach*.35,0,0,Math.PI*2);c.stroke();
        for(let i=0;i<8;i++){const angle=i*Math.PI/4+impact.angle*.35,x=impact.x+Math.cos(angle)*reach,y=impact.y+Math.sin(angle)*reach*.5-age*12;c.fillStyle=i%2?'#e8f1ff':'#ffffff';c.beginPath();c.moveTo(x,y-4*(1-age));c.lineTo(x+2*(1-age),y);c.lineTo(x,y+4*(1-age));c.lineTo(x-2*(1-age),y);c.closePath();c.fill();}
      }
      for(const effect of e.effects){const p=effect.age/effect.life;if(effect.kind==='holySeal'){c.globalAlpha=1-p;renderer.circle(effect.x,effect.y,Math.max(1,effect.radius*(.8+p*.35)));c.strokeStyle=effect.color;c.lineWidth=2*(1-p)+.5;c.stroke();}
        if(effect.kind==='holySweep'){const x=effect.corner&1?C.width-14:14,y=effect.corner&2?C.height-14:14;c.globalAlpha=(1-p)*.8;this.cross(c,x,y,15+p*25,effect.color,2);}
      }c.restore();
    },
    icon(c,x,y){c.strokeStyle='#101721';c.lineWidth=3;c.beginPath();c.ellipse(x,y,12,5.5,0,0,Math.PI*2);c.stroke();}
  };
})(typeof window!=='undefined'?window:globalThis);
