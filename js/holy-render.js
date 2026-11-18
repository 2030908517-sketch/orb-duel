(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
  G.HolyView={
    cross(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();},
    waterShape(p){const dx=p.x-p.ax,dy=p.y-p.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,tx=dx/d,ty=dy/d,left=[],right=[];
      for(let i=0;i<=4;i++){const u=i/4,x=p.ax+dx*u+tx*(u*2-1),y=p.ay+dy*u+ty*(u*2-1),wave=Math.sin(p.ax*.14+p.ay*.11+u*3.2);
        const a=6.6+wave*1.2,b=6.6+Math.cos(p.ax*.1-p.ay*.17+u*2.5)*1.1;left.push({x:x+nx*a,y:y+ny*a});right.push({x:x-nx*b,y:y-ny*b});
      }return [...left,...right.reverse()];
    },
    wetReflection(p){let n=Math.imul((p.id||0)^Math.imul((p.owner||0)+17,0x45d9f3b),0x27d4eb2d);n^=n>>>15;n=Math.imul(n,0x85ebca6b);n^=n>>>13;return (n>>>0)/4294967296<.105;},
    floor(renderer,e){
      const w=e.holyWorld;if(!w)return;const c=renderer.ctx,t=e.time;c.save();c.lineCap='butt';c.lineJoin='round';
      // Fixed per-sample ground decals: age changes opacity only, never geometry or highlights.
      const patch=(context,p)=>{const shape=this.waterShape(p),last=shape.at(-1);context.moveTo((last.x+shape[0].x)/2,(last.y+shape[0].y)/2);for(let i=0;i<shape.length;i++){const point=shape[i],next=shape[(i+1)%shape.length];context.quadraticCurveTo(point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2);}context.closePath();};
      if(root.document){
        if(!this.waterLayer){this.waterLayer=root.document.createElement('canvas');this.waterLayer.width=C.width;this.waterLayer.height=C.height;this.waterContext=this.waterLayer.getContext('2d');}
        const mask=this.waterContext;mask.clearRect(0,0,C.width,C.height);mask.globalCompositeOperation='lighten';
        // Opaque brightness values combine by maximum, so adjoining samples cannot form dark seams.
        for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade)continue;mask.beginPath();patch(mask,p);mask.fillStyle='rgb('+Math.round(153*fade)+','+Math.round(188*fade)+','+Math.round(204*fade)+')';mask.fill();}
        c.save();c.globalCompositeOperation='screen';c.globalAlpha=.34;c.drawImage(this.waterLayer,0,0,C.width,C.height);
        // Difference of two fixed union masks produces a thin wet rim without seams at adjoining samples.
        if(!this.waterRim){this.waterRim=root.document.createElement('canvas');this.waterRim.width=C.width;this.waterRim.height=C.height;this.waterRimContext=this.waterRim.getContext('2d');}const rim=this.waterRimContext;rim.globalCompositeOperation='source-over';rim.clearRect(0,0,C.width,C.height);rim.drawImage(this.waterLayer,0,0);rim.globalCompositeOperation='difference';rim.drawImage(this.waterLayer,0,-1);c.globalAlpha=.68;c.drawImage(this.waterRim,0,0);c.restore();
      }else{for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade)continue;c.beginPath();patch(c,p);c.globalAlpha=fade*.40;c.fillStyle='#99bccc';c.fill();}}
      // Reflections are anchored to each sample; fading never changes their location or shape.
      for(const p of w.water){const fade=Math.max(0,Math.min(1,(p.expires-t)/.8));if(!fade||!this.wetReflection(p))continue;const dx=p.x-p.ax,dy=p.y-p.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,x=(p.ax+p.x)/2,y=(p.ay+p.y)/2;
        c.globalAlpha=fade*.52;c.strokeStyle='#e8f5f1';c.lineWidth=1.25;c.beginPath();c.moveTo(x-dx*.72+nx*3,y-dy*.72+ny*3);c.quadraticCurveTo(x+nx*5,y+ny*5,x+dx*.72+nx*3,y+dy*.72+ny*3);c.stroke();
      }
      c.globalAlpha=1;
      for(const z of w.zones)G.HolyAngelView?.floor(renderer,e,z);
      for(const l of w.lights){if(l.landed||t<l.warningAt)continue;const f=clamp((t-l.warningAt)/(l.at-l.warningAt)),r=l.radius;c.save();c.translate(l.x,l.y);
        c.globalAlpha=.32+f*.48;c.strokeStyle='#c4dce9';c.lineWidth=.8;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
        c.fillStyle='#dfefff';c.globalAlpha=.035+f*.055;c.fill();
        // A converging outer arc indicates time, while the fixed inner circle is the real footprint.
        c.globalAlpha=.7;c.strokeStyle='#f8ebc5';c.lineWidth=1.25;for(let i=0;i<4;i++){const a=i*TAU/4-.35;c.beginPath();c.arc(0,0,r+6*(1-f)+2,a,a+.15+f*.70);c.stroke();}
        c.globalAlpha=.4+f*.5;this.cross(c,0,0,3+f*2,'#ffffff',.8);c.restore();}
      c.restore();
    },
    pillar(c,l,y,alpha,strike=0,time=0){
      const r=l.radius,seed=l.id*.713;c.save();c.translate(l.x,0);c.globalAlpha=alpha;
      const body=c.createLinearGradient(-r,0,r,0);body.addColorStop(0,'#aecbdf00');body.addColorStop(.13,'#b7d5ec48');body.addColorStop(.39,'#f3f7ffa8');body.addColorStop(.5,'#fff9def2');body.addColorStop(.6,'#e6f5ffb8');body.addColorStop(.88,'#a2cbe34c');body.addColorStop(1,'#aecbdf00');
      c.fillStyle=body;c.fillRect(-r,0,r*2,y);
      // Different-width streams transport light down the column; no repeated scrolling rectangles.
      c.beginPath();c.rect(-r,0,r*2,y+r*.4);c.clip();
      for(let i=0;i<7;i++){const x=r*(-.82+i*.265),phase=time*(1.15+i*.11)+seed+i*.391,v=phase-Math.floor(phase),head=v*(y+95)-65,span=38+i%3*21,width=(i===3?2.8:1+i%2*.7)*(1+strike*.5);
        const g=c.createLinearGradient(0,head-span,0,head+16);g.addColorStop(0,'#ebf6ff00');g.addColorStop(.65,i===3?'#fffdf0cc':'#d9edff70');g.addColorStop(.85,'#ffffffbb');g.addColorStop(1,'#ecf5ff00');
        c.fillStyle=g;c.beginPath();c.moveTo(x-width*.1,head-span);c.bezierCurveTo(x+width*1.5,head-span*.5,x-width,head-13,x+width,head);c.quadraticCurveTo(x,head+18,x-width,head);c.bezierCurveTo(x-width*1.8,head-20,x+width*.6,head-span*.55,x-width*.1,head-span);c.fill();
      }
      const foot=c.createRadialGradient(0,y,0,0,y,r);foot.addColorStop(0,'#fffdf3');foot.addColorStop(.38,'#fff1cbb0');foot.addColorStop(.73,'#d8edff44');foot.addColorStop(1,'#beddf400');c.fillStyle=foot;c.beginPath();c.ellipse(0,y,r,r*.38,0,0,TAU);c.fill();
      c.strokeStyle='#fff5d9';c.lineWidth=.85+strike*1.4;c.beginPath();c.ellipse(0,y,r*.87,r*.32,0,.05,Math.PI-.05);c.stroke();
      c.globalAlpha=alpha*(.35+strike*.45);c.strokeStyle='#e2f3ff';c.lineWidth=.65;for(const side of [-1,1]){c.beginPath();c.moveTo(side*r*.72,y-16-strike*10);c.quadraticCurveTo(side*r*.95,y-7,side*r*.75,y);c.stroke();}c.restore();
    },
    front(renderer,e){
      const w=e.holyWorld;if(!w)return;const c=renderer.ctx,t=e.time;c.save();
      for(const b of e.balls){if(b.type!=='holy'||b.hp<=0||!b.holy.chargeUntil)continue;const progress=clamp(1-(b.holy.chargeUntil-t)/.7);c.save();c.translate(b.x,b.y);
        for(let i=0;i<6;i++){const angle=i*TAU/6,reach=37-12*progress;c.globalAlpha=.25+progress*.5;c.strokeStyle=i%2?'#c2d7e7':'#f5e6b8';c.lineWidth=.8;c.beginPath();c.arc(0,0,reach,angle-.2,angle+.2);c.stroke();const u=(progress*1.4+i/6)%1;c.globalAlpha=Math.sin(u*Math.PI)*progress;this.cross(c,Math.cos(angle)*(42-25*u),Math.sin(angle)*(42-25*u),1+u*2,'#fff7dc',.8);}c.restore();
      }
      for(const b of e.balls){if(b.hp<=0||!G.Holy.burnStatus(b,e))continue;
        for(let i=0;i<3;i++){const x=b.x+(i-1)*5,y=b.y-b.radius-3,reach=7+Math.sin(t*9+i*2)*2,bend=Math.sin(t*11+i*3)*2;c.save();c.translate(x,y);c.globalAlpha=.85;c.beginPath();c.moveTo(-3,1);c.bezierCurveTo(-5,-reach*.4,bend-1,-reach*.65,bend+1,-reach);c.bezierCurveTo(bend+5,-reach*.5,1,-reach*.3,3,1);c.closePath();c.fillStyle='#9dbbcc';c.fill();c.beginPath();c.moveTo(-2,0);c.bezierCurveTo(-2,-reach*.3,bend+2,-reach*.35,bend+1,-reach*.76);c.quadraticCurveTo(5,-reach*.22,2,0);c.closePath();c.fillStyle=i===1?'#fff8da':'#eef7ff';c.fill();c.restore();}
      }
      for(const l of w.lights){
        if(!l.landed){if(t>=l.at-.085&&t<l.at){const p=(t-l.at+.085)/.085;this.pillar(c,l,l.y*p*p,.3+p*.7,0,t);}continue;}
        const age=t-l.at,fade=Math.max(0,Math.min(1,(l.expires-t)/.16)),strike=Math.max(0,1-age/.16);
        this.pillar(c,l,l.y,fade,strike,t);
      }
      for(const impact of e.effects){if(impact.kind!=='holyLanding')continue;const p=clamp(impact.age/impact.life),ease=1-(1-p)**3,reach=impact.radius+5+ease*28;c.save();c.translate(impact.x,impact.y);
        c.globalAlpha=(1-p)**2;c.strokeStyle='#aac9dc';c.lineWidth=4.2*(1-p)+.3;c.beginPath();c.ellipse(0,0,reach,reach*.38,0,.12,Math.PI-.12);c.stroke();c.strokeStyle='#fff5d8';c.lineWidth=1.5*(1-p)+.4;c.beginPath();c.ellipse(0,0,reach-1,reach*.36,0,.15,Math.PI-.15);c.stroke();
        if(p<.32){const g=c.createRadialGradient(0,0,0,0,0,impact.radius+5);g.addColorStop(0,'#fffefa');g.addColorStop(.45,'#fff2cbb0');g.addColorStop(1,'#bddcf000');c.globalAlpha=(1-p/.32)*.85;c.fillStyle=g;c.beginPath();c.ellipse(0,0,impact.radius+5,impact.radius*.48,0,0,TAU);c.fill();}
        for(let i=0;i<7;i++){const a=i*2.399+impact.id*.7,d=reach*(.65+i%3*.1),x=Math.cos(a)*d,y=Math.sin(a)*d*.38-ease*(3+i%3*4);c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=(1-p)**1.5;c.fillStyle=i%3?'#e8f4ff':'#fff0c5';c.beginPath();c.moveTo(0,0);c.lineTo(-2*(1-p),-1.2);c.lineTo(-7*(1-p),0);c.lineTo(-2*(1-p),1);c.closePath();c.fill();c.restore();}c.restore();
      }
      for(const impact of e.effects){if(impact.kind!=='roster'||impact.style!=='holyImpact')continue;const p=clamp(impact.age/impact.life),ease=1-(1-p)**3;c.save();c.translate(impact.x,impact.y);c.rotate(impact.angle||0);c.globalAlpha=(1-p)**2;
        const reach=8+ease*22;c.strokeStyle='#b9d8ea';c.lineWidth=2.6*(1-p)+.4;c.beginPath();c.ellipse(3+ease*8,0,reach*.42,reach*.8,0,-1.25,1.25);c.stroke();c.strokeStyle='#fff3c8';c.lineWidth=1.1;c.beginPath();c.ellipse(5+ease*8,0,reach*.36,reach*.7,0,-1.05,1.05);c.stroke();
        if(p<.32){c.globalAlpha=(1-p/.32)*.95;c.fillStyle='#fff7db';c.beginPath();c.moveTo(-15,0);c.quadraticCurveTo(-1,-5*(1-p),26,0);c.quadraticCurveTo(-1,5*(1-p),-15,0);c.fill();}
        for(let i=0;i<6;i++){const a=(i-2.5)*.37,d=8+ease*(20+i%3*6),x=Math.cos(a)*d,y=Math.sin(a)*d;c.globalAlpha=(1-p)**1.6;c.strokeStyle=i%2?'#fff4cd':'#c6e2f5';c.lineWidth=.8+i%2*.6;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(a)*7*(1-p),y-Math.sin(a)*7*(1-p));c.stroke();}c.restore();
      }
      for(const effect of e.effects){const p=effect.age/effect.life;if(effect.kind==='holySeal'){c.save();c.translate(effect.x,effect.y);c.globalAlpha=(1-p)**2*.5;c.strokeStyle='#f3e5be';c.lineWidth=.8;for(let i=0;i<6;i++){const a=i*TAU/6,rad=effect.radius*(.96+.06*p);c.beginPath();c.arc(0,0,rad,a,a+.16*(1-p));c.stroke();}c.restore();}
        if(effect.kind==='holySweep'){const x=effect.corner&1?C.width-14:14,y=effect.corner&2?C.height-14:14;c.globalAlpha=(1-p)*.8;this.cross(c,x,y,15+p*25,effect.color,2);}
      }c.restore();
    },
    icon(c,x,y){c.strokeStyle='#101721';c.lineWidth=3;c.beginPath();c.ellipse(x,y,12,5.5,0,0,Math.PI*2);c.stroke();}
  };
})(typeof window!=='undefined'?window:globalThis);
