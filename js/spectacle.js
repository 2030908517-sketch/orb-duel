(function(root){
  'use strict';
  const G=root.OrbDuel,TAU=Math.PI*2;
  // Presentation only: no attacks, combat RNG, movement changes or extra simulation time.
  const cues={normal:'awakenHit',vampire:'bloodPulse',accelerator:'thunderHit',reflector:'revengeHit',shield:'fortressBlast',ranger:'volley',trapper:'magnetBlast',boomerang:'moonCut',laser:'beamAwake',venom:'corrosion'};
  G.Spectacle={
    emit(engine,ball,style,options={}){
      if(!G.Awakening.active(ball))return;
      const cooldown=options.cooldown??.16,key=ball.id+':'+style;
      engine.fxCooldowns ||= Object.create(null);
      if(engine.time-(engine.fxCooldowns[key]??-Infinity)<cooldown)return;
      engine.fxCooldowns[key]=engine.time;
      const point=options.point||ball;
      const angle=options.angle??Math.atan2(ball.vy,ball.vx);
      engine.effects.push({kind:'signature',style,owner:ball.id,color:ball.def.color,x:point.x,y:point.y,angle,radius:options.radius||55,ray:options.ray,age:0,life:options.life||.42,follow:!!options.follow});
      if(options.sound!==false)engine.sound(style==='awaken'?'awakening':cues[ball.type],point.x);
    },
    hit(engine,hit){
      const ball=hit.source;
      if(!G.Awakening.active(ball))return;
      if(hit.actual<=0){if(hit.blocked>0)this.emit(engine,hit.target,'guard',{point:hit.target,sound:false,radius:36,life:.2});return;}
      const heavy=hit.kind==='laser'||hit.kind==='counter'||hit.dash||(ball.type==='normal'&&hit.heavyContact);
      if(hit.kind==='contact'&&!heavy&&ball.type!=='boomerang')return;
      const angle=Math.atan2(hit.target.y-ball.y,hit.target.x-ball.x);
      const style=hit.kind==='chain'?'drain':hit.kind==='poison'?'corrode':hit.kind==='boomerang'?'cut':heavy?'strike':'spark';
      this.emit(engine,ball,style,{point:hit.target,angle,radius:heavy?65:36,life:heavy?.42:.3,cooldown:hit.kind==='poison'?.45:hit.kind==='chain'?.27:.12});
      if(heavy){engine.impact(hit.target.x,hit.target.y,ball.def.color,2);hit.target.hitVisual={age:0,life:.22,angle,power:1.8};}
    },
    polygon(c,x,y,r,sides,rotation=0){c.beginPath();for(let i=0;i<=sides;i++){const a=rotation+i*TAU/sides;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();},
    ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.strokeStyle=color;c.lineWidth=width;c.stroke();},
    line(c,x,y,endX,endY,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.strokeStyle=color;c.lineWidth=width;c.stroke();},
    behind(renderer,engine){
      const c=renderer.ctx,t=engine.time;
      c.save();
      for(const b of engine.balls){
        if(!G.Awakening.active(b)||b.hp<=0)continue;
        const a=b.awakening,color=b.def.color,r=b.radius;
        c.save();c.lineCap='round';
        if(b.type==='normal'&&b.charges===3){
          this.polygon(c,b.x,b.y,r+12,4,t);c.strokeStyle='#c6e2ff';c.lineWidth=1.4;c.stroke();
          for(let i=0;i<4;i++){const angle=t*2+i*TAU/4;this.line(c,b.x+Math.cos(angle)*39,b.y+Math.sin(angle)*39,b.x+Math.cos(angle)*29,b.y+Math.sin(angle)*29,'#fff0a4',2);}
        }
        if(b.type==='vampire'&&a.chainUntil>t){
          const enemy=G.World.targetFor(b,engine);
          if(enemy){
            const dx=enemy.x-b.x,dy=enemy.y-b.y,d=Math.hypot(dx,dy)||1;
            c.shadowColor=color;c.shadowBlur=8;
            for(const side of [-1,1]){c.beginPath();c.moveTo(b.x,b.y);for(let i=1;i<=20;i++){const u=i/20,offset=Math.sin(u*Math.PI)*Math.sin(u*18-t*10+side)*7*side;c.lineTo(b.x+dx*u-dy/d*offset,b.y+dy*u+dx/d*offset);}c.strokeStyle=color+'bb';c.lineWidth=1.6;c.stroke();}
            for(let i=0;i<9;i++){const u=(i/9+t*1.4)%1,x=enemy.x-dx*u,y=enemy.y-dy*u;this.polygon(c,x,y,2.5,4,t);c.fillStyle='#ffdded';c.fill();}
            this.ring(c,enemy.x,enemy.y,enemy.radius+11+Math.sin(t*12)*2,color+'b0',1.6);
            c.beginPath();c.arc(b.x,b.y,r+13,t,t+Math.PI*1.5);c.strokeStyle='#f3bdd9';c.lineWidth=3;c.stroke();
          }
        }
        if(b.type==='accelerator'){
          if(a.chargeUntil>t){const p=1-Math.min(1,(a.chargeUntil-t)/.7);this.polygon(c,b.x,b.y,r+34*(1-p)+5,6,t*5);c.strokeStyle='#fff1ab';c.lineWidth=1.5;c.stroke();}
          if(G.Awakening.dashing(b,engine)){
            for(let i=0;i<Math.min(10,b.trail.length);i++){const point=b.trail[i];c.globalAlpha=(1-i/10)*.36;this.ring(c,point.x,point.y,r-i*.9,'#fff2ac',2);}
            c.globalAlpha=1;const v=Math.hypot(b.vx,b.vy)||1,nx=b.vx/v,ny=b.vy/v;
            for(const side of [-1,1])this.line(c,b.x-ny*side*18,b.y+nx*side*18,b.x-nx*110-ny*side*25,b.y-ny*110+nx*side*25,'#ffe17888',1.6);
          }
        }
        if(b.type==='reflector'&&b.stance.phase==='active'){
          const fraction=b.stance.stored/(8*engine.heatMultiplier);
          this.polygon(c,b.x,b.y,r+16,6,-t*.7);c.strokeStyle='#c7b4ff66';c.lineWidth=1;c.stroke();
          for(let i=0;i<6;i++){const angle=i*TAU/6+t*.7,d=r+16+(1-fraction)*9;this.line(c,b.x+Math.cos(angle)*d,b.y+Math.sin(angle)*d,b.x+Math.cos(angle)*(r+3),b.y+Math.sin(angle)*(r+3),color+'aa',1+fraction);}
        }
        if(b.type==='shield'&&b.shield>0){this.polygon(c,b.x,b.y,r+12,6,-Math.PI/2);c.strokeStyle='#d0fff4';c.lineWidth=2;c.stroke();this.polygon(c,b.x,b.y,r+17,6,-Math.PI/2);c.strokeStyle=color+'50';c.lineWidth=1;c.stroke();}
        if((b.type==='ranger'||b.type==='boomerang')&&b.nextShot-t<.4){
          const p=1-Math.max(0,b.nextShot-t)/.4;this.ring(c,b.x,b.y,r+8+(1-p)*17,color+'a0',1.5);
          if(b.type==='boomerang')for(let i=0;i<2;i++){c.beginPath();c.arc(b.x,b.y,r+15,t*6+i*Math.PI,t*6+i*Math.PI+1.3);c.strokeStyle='#cdf7ff';c.lineWidth=3;c.stroke();}
        }
        if(b.laser){
          const p=1-Math.min(1,Math.max(0,b.laser.fireAt-t)/.55),radius=r+8+(1-p)*33;
          for(let i=0;i<2;i++){this.polygon(c,b.x,b.y,radius+i*7,4,t*(i?3:-3));c.strokeStyle=i?color+'60':'#fff3b8';c.lineWidth=1.3;c.stroke();}
          c.beginPath();c.arc(b.x,b.y,r+6,-Math.PI/2,-Math.PI/2+p*TAU);c.strokeStyle='#fff8d5';c.lineWidth=3;c.stroke();
        }
        c.restore();
      }
      for(const pool of engine.pools){const b=engine.balls.find(b=>b.id===pool.owner);if(!b?.awakening.active)continue;
        const armed=t>=pool.armedAt;c.globalAlpha=armed?.65:.28;
        for(let i=0;i<3;i++){c.beginPath();c.ellipse(pool.x,pool.y,pool.radius*(.45+i*.22),pool.radius*(.25+i*.15),t*(i%2?-.6:.6)+i,0,Math.PI*1.5);c.strokeStyle=pool.color;c.lineWidth=1.2;c.stroke();}
      }
      c.globalAlpha=1;
      for(const shot of engine.projectiles){const b=engine.balls.find(b=>b.id===shot.owner);if(!b?.awakening.active)continue;
        const angle=Math.atan2(shot.vy,shot.vx);c.save();c.translate(shot.x,shot.y);c.rotate(angle);c.shadowColor=shot.color;c.shadowBlur=10;
        if(shot.mode==='boomerang'){c.rotate(t*18);c.beginPath();c.arc(0,0,10,-2.5,1.2);c.strokeStyle=shot.returning?'#fffbd9':'#b7f4ff';c.lineWidth=3;c.stroke();c.beginPath();c.arc(0,0,15,-2.4,-.2);c.strokeStyle=shot.color+'70';c.lineWidth=2;c.stroke();}
        else {c.beginPath();c.moveTo(9,0);c.lineTo(-13,-4);c.lineTo(-8,0);c.lineTo(-13,4);c.closePath();c.fillStyle=shot.mode==='counter'?'#e7dfff':'#fff1d3';c.fill();this.line(c,-10,0,-40,0,shot.color+'80',shot.mode==='counter'?4:2);}
        c.restore();
      }
      for(const trap of engine.traps){if(!trap.chainRange)continue;const p=1-Math.max(0,trap.armedAt-t)/.4;this.ring(c,trap.x,trap.y,trap.radius+7+Math.sin(t*6)*1.3,trap.color+'80',1.5);this.polygon(c,trap.x,trap.y,trap.radius+5,4,Math.PI/4);c.strokeStyle='#ffb3b9';c.lineWidth=1;c.stroke();if(p<1)this.ring(c,trap.x,trap.y,trap.radius+28*(1-p),trap.color+'70',1);}
      c.restore();
    },
    front(renderer,engine){
      const c=renderer.ctx;
      c.save();c.lineCap='round';
      for(const e of engine.effects){
        if(e.kind!=='signature')continue;
        const t=e.age/e.life,fade=Math.pow(1-t,1.4),owner=engine.balls.find(b=>b.id===e.owner),x=e.follow&&owner?owner.x:e.x,y=e.follow&&owner?owner.y:e.y;
        c.save();const fieldTransform=c.getTransform();c.globalAlpha=fade;c.translate(x,y);c.rotate(e.angle);c.shadowColor=e.color;c.shadowBlur=renderer.reducedMotion?0:8;
        if(e.style==='beam'&&e.ray){
          c.setTransform(fieldTransform);
          const ray=e.ray,pulse=1-t;
          this.line(c,ray.x,ray.y,ray.endX,ray.endY,e.color+'35',28*pulse+8);
          this.line(c,ray.x,ray.y,ray.endX,ray.endY,e.color,13*pulse+2);
          this.line(c,ray.x,ray.y,ray.endX,ray.endY,'#fffef1',4*pulse+.6);
          this.ring(c,ray.endX,ray.endY,8+t*35,e.color,2*fade+.5);
        }else if(e.style==='strike'||e.style==='cut'||e.style==='spark'){
          const power=e.style==='strike'?1: .6,length=e.radius*(.35+t*.9);
          this.line(c,-length,0,length,0,e.color+'50',12*(1-t)*power);
          this.line(c,-length*.75,0,length*.75,0,'#fffceb',4*(1-t)*power+.4);
          this.line(c,0,-length*.45,0,length*.45,e.color,2*(1-t)+.4);
          for(let i=0;i<7;i++){const a=(i*2.39)+e.angle,d=8+t*e.radius;this.line(c,Math.cos(a)*d,Math.sin(a)*d,Math.cos(a)*(d+13*(1-t)),Math.sin(a)*(d+13*(1-t)),e.color,1.7);}
          c.beginPath();c.ellipse(0,0,Math.max(1,length*.6),Math.max(1,length*.3),.5,0,TAU);c.strokeStyle=e.color;c.lineWidth=1.4;c.stroke();
        }else if(e.style==='drain'||e.style==='corrode'){
          this.ring(c,0,0,17+t*23,e.color,2*fade+.5);
          for(let i=0;i<5;i++){const a=i*TAU/5+t*2,r=22*(1-t)+5;this.polygon(c,Math.cos(a)*r,Math.sin(a)*r,2.5,4,a);c.fillStyle=e.color;c.fill();}
        }else if(e.style==='detonate'||e.style==='barrier'){
          const r=e.radius*(.25+Math.sin(Math.min(1,t*1.5)*Math.PI/2)*.75);
          this.ring(c,0,0,r,e.color,4*(1-t)+.5);this.ring(c,0,0,r*.72,'#fff1dc',2*(1-t)+.5);
          for(let i=0;i<8;i++){const a=i*TAU/8;this.line(c,Math.cos(a)*r*.4,Math.sin(a)*r*.4,Math.cos(a)*r*.95,Math.sin(a)*r*.95,e.color+'b0',1.7);}
          this.polygon(c,0,0,r*.8,e.style==='barrier'?6:4,t);c.strokeStyle=e.color+'90';c.lineWidth=1.2;c.stroke();
        }else if(e.style==='guard'){this.polygon(c,0,0,e.radius,6,0);c.strokeStyle='#e0fff6';c.lineWidth=3*(1-t)+.5;c.stroke();}
        else {
          const inward=e.style==='launch'||e.style==='counter',r=inward?18+(1-t)*35:18+t*e.radius;
          this.polygon(c,0,0,r,e.style==='toxic'?5:6,t*1.5);c.strokeStyle=e.color;c.lineWidth=2*fade+.5;c.stroke();this.ring(c,0,0,r*.7,'#fff2d0',1.3);
          for(let i=0;i<8;i++){const a=i*TAU/8+t;this.line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+9),Math.sin(a)*(r+9),e.color+'90',2);}
        }
        c.restore();
      }
      c.restore();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
