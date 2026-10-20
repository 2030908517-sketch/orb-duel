(function (root) {
  'use strict';
  const G = root.OrbDuel, C = G.Constants;
  G.Renderer = class Renderer {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.dpr = 0; this.reducedMotion=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
    resize() {
      const dpr = Math.min(root.devicePixelRatio || 1, 2);
      const width = Math.max(1, this.canvas.clientWidth);
      const pixels = Math.round(width * dpr);
      if (this.canvas.width !== pixels || this.dpr !== dpr) { this.canvas.width = pixels; this.canvas.height = Math.round(pixels * C.height / C.width); this.dpr = dpr; }
      this.ctx.setTransform(this.canvas.width / C.width, 0, 0, this.canvas.height / C.height, 0, 0);
    }
    circle(x, y, radius) { this.ctx.beginPath(); this.ctx.arc(x, y, radius, 0, Math.PI * 2); }
    draw(engine) {
      this.resize();
      const c = this.ctx;
      c.clearRect(0, 0, C.width, C.height);
      c.fillStyle = '#111721'; c.fillRect(0, 0, C.width, C.height);
      // A restrained field gives the moving orbs and feedback all the emphasis.
      c.fillStyle = '#273246';
      for (let x = 40; x < C.width; x += 40) for (let y = 40; y < C.height; y += 40) { this.circle(x, y, 0.7); c.fill(); }
      c.strokeStyle = '#263244'; c.lineWidth = 1;
      c.setLineDash([4, 10]); c.beginPath(); c.moveTo(C.width / 2, 48); c.lineTo(C.width / 2, C.height - 48); c.stroke(); c.setLineDash([]);
      this.circle(C.width / 2, C.height / 2, 57); c.strokeStyle = '#253042'; c.stroke();
      c.strokeStyle = '#46516a'; c.lineWidth = 1.5;
      for (const [x, y, sx, sy] of [[12, 12, 1, 1], [C.width - 12, 12, -1, 1], [12, C.height - 12, 1, -1], [C.width - 12, C.height - 12, -1, -1]]) { c.beginPath(); c.moveTo(x, y + 12 * sy); c.lineTo(x, y); c.lineTo(x + 12 * sx, y); c.stroke(); }
      if (engine.time >= C.heatStart) { c.strokeStyle = engine.time >= C.decayStart ? '#ce6c6b55' : '#f8c56c28'; c.lineWidth = 2; c.strokeRect(2, 2, C.width - 4, C.height - 4); }
      c.save();
      G.LaserBladeView?.background(this,engine);
      const impulses=engine.effects.filter(e=>e.kind==='impact');
      G.Presentation?.camera(this,engine);
      const impulse=impulses.reduce((best,e)=>e.power*(1-e.age/e.life)>(best?.power||0)*(1-(best?.age||0)/(best?.life||1))?e:best,null);
      if(impulse && !this.reducedMotion){const strength=impulse.power*(1-impulse.age/impulse.life)*.9;c.translate(Math.sin(impulse.age*115)*strength,Math.cos(impulse.age*95)*strength);}
      const arcImpact=engine.effects.find(f=>f.kind==='arcana'&&['fistImpact','sonicImpact','bloodRupture','counterHit'].includes(f.style)&&f.age<.4);
      if(arcImpact&&!this.reducedMotion){const strength=(arcImpact.style==='fistImpact'?5:3.5)*Math.exp(-arcImpact.age*11);c.translate(Math.sin(arcImpact.age*127)*strength,Math.cos(arcImpact.age*109)*strength);}
      G.HolyView?.floor(this,engine);this.drawRoster(engine);this.drawWorld(engine);G.RangerView?.behind(this,engine);G.DemonView?.behind(this,engine);G.CosmicView?.behind(this,engine);G.ChargeView?.behind(this,engine);G.StellarView?.behind(this,engine);G.ArcanaView?.behind(this,engine);G.TrapperView?.behind(this,engine);this.drawTemporal(engine);this.drawMagnet(engine);this.drawGhost(engine);G.Spectacle?.behind(this,engine);
      this.drawAbilities(engine);
      this.drawSignals(engine);
      for (const ball of engine.balls) {
        for (let i = ball.trail.length - 1; i >= 0; i--) { if(ball.arcana?.phase==='orbit'||G.BladeDance?.active(ball))break;const point = ball.trail[i]; c.globalAlpha = (1 - i / ball.trail.length) * (ball.type === 'accelerator' ? 0.19 : 0.10); c.fillStyle = ball.def.color; this.circle(point.x, point.y, ball.radius * (1 - i / (ball.trail.length + 3)) * 0.8); c.fill(); }
        c.globalAlpha = 1;
      }
      for (const effect of engine.effects.filter(e => e.kind === 'ring' || e.kind === 'particle')) {
        const t = effect.age / effect.life; c.globalAlpha = Math.max(0, 1 - t);
        if (effect.kind === 'ring') { this.circle(effect.x, effect.y, 12 + effect.size * t); c.strokeStyle = effect.color; c.lineWidth = 2 * (1 - t) + 0.4; c.stroke(); }
        else { this.circle(effect.x, effect.y, 1.5 + (1 - t)); c.fillStyle = effect.color; c.fill(); }
      }
      c.globalAlpha = 1;
      for (const ball of engine.balls) this.drawBall(ball, engine);G.HolyView?.front(this,engine);G.DemonView?.front(this,engine);G.CosmicView?.front(this,engine);G.ChargeView?.front(this,engine);G.StellarView?.front(this,engine);G.ArcanaView?.front(this,engine);G.TacticsView?.front(this,engine);G.TrapperView?.front(this,engine);G.Spectacle?.front(this,engine);this.drawRoleEffects(engine);this.drawRosterEffects(engine);this.drawTimeBursts(engine);G.LaserBladeView?.front(this,engine);
      G.OrbMarkers.draw(this,engine);
      c.font = '600 16px "Segoe UI", "Microsoft YaHei", sans-serif'; c.textAlign = 'center';
      for(const effect of impulses){
        const t=effect.age/effect.life;c.save();c.globalAlpha=(1-t)*.85;c.translate(effect.x,effect.y);c.rotate(t*.4);c.strokeStyle=effect.color;c.lineWidth=2.5*(1-t)+.5;
        for(let i=0;i<8;i++){const angle=i*Math.PI/4,inner=5+16*t,outer=inner+(1-t)*13*effect.power;c.beginPath();c.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);c.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);c.stroke();}c.restore();
      }
      for (const effect of engine.effects.filter(e => e.kind === 'text')) {
        c.globalAlpha=Math.min(1,2*(1-effect.age/effect.life));c.font=(effect.strong?'800 19px':'600 16px')+' "Segoe UI", "Microsoft YaHei", sans-serif';c.fillStyle=effect.color;c.strokeStyle='#0c1016dd';c.lineWidth=3;
        const y=effect.y-22*effect.age/effect.life;c.strokeText(effect.text,effect.x,y);c.fillText(effect.text,effect.x,y);
      }
      c.globalAlpha = 1;
      G.ArcanaView?.overlay(this,engine);
      G.Presentation?.draw(this,engine);
      c.restore();
    }
    lightning(x,y,endX,endY,time,color,width=2){
      const c=this.ctx,dx=endX-x,dy=endY-y,length=Math.hypot(dx,dy)||1;
      c.save();c.strokeStyle=color;c.lineWidth=width;c.shadowColor=color;c.shadowBlur=8;c.beginPath();c.moveTo(x,y);
      for(let i=1;i<12;i++){const t=i/12,wave=Math.sin(i*7.1+time*26)*5;c.lineTo(x+dx*t-dy/length*wave,y+dy*t+dx/length*wave);}c.lineTo(endX,endY);c.stroke();c.restore();
    }
    drawSoulPath(frames,color,opacity=1){if(!frames||frames.length<2)return;const c=this.ctx;c.save();c.shadowBlur=0;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.beginPath();c.moveTo(frames[0].x,frames[0].y);for(const p of frames.slice(1))c.lineTo(p.x,p.y);
      // One continuous, world-fixed mist band. No moving stamp selection or circular nodes.
      for(const [width,alpha,blur]of [[42,.055,3],[32,.13,2],[22,.09,1]]){c.filter='blur('+blur+'px)';c.lineWidth=width;c.globalAlpha=alpha*opacity;c.stroke();}c.filter='none';
      let distance=0,next=85,count=0;for(let i=1;i<frames.length&&count<4;i++){const p=frames[i],before=frames[i-1];distance+=Math.hypot(p.x-before.x,p.y-before.y);if(distance<next)continue;next+=85;count++;const appear=Math.min(1,(frames.at(-1).t-p.t)/.12);c.save();c.translate(p.x,p.y);c.globalAlpha=.18*opacity*Math.max(0,appear);c.fillStyle='#eaffff';c.beginPath();c.moveTo(-10,10);c.lineTo(-10,-2);c.bezierCurveTo(-10,-15,10,-15,10,-2);c.lineTo(10,10);c.lineTo(5,6);c.lineTo(0,10);c.lineTo(-5,6);c.closePath();c.fill();c.restore();}c.restore();
    }
    drawGhost(engine){const c=this.ctx,t=engine.time;
      const path=(frames,color,opacity=1)=>this.drawSoulPath(frames,color,opacity);
      for(const echo of engine.ghostEchoes||[]){const b=engine.balls.find(v=>v.id===echo.owner);if(!b||b.hp<=0)continue;path(echo.path,b.def.color,Math.min(1,Math.max(0,(echo.duration-echo.elapsed)/.3)));c.save();c.shadowBlur=0;c.globalAlpha=.48;c.fillStyle='#eaffff';c.strokeStyle=b.def.color;c.lineWidth=1.6;this.circle(echo.x,echo.y,echo.radius);c.fill();c.stroke();c.globalAlpha=.9;c.fillStyle='#304d59';const x=echo.x,y=echo.y;c.beginPath();c.moveTo(x-10,y+10);c.lineTo(x-10,y-2);c.bezierCurveTo(x-10,y-15,x+10,y-15,x+10,y-2);c.lineTo(x+10,y+10);c.lineTo(x+5,y+6);c.lineTo(x,y+10);c.lineTo(x-5,y+6);c.closePath();c.fill();c.fillStyle='#fff';for(const side of [-1,1]){this.circle(x+side*4,y-2,2.2);c.fill();}c.restore();}
      for(const ball of engine.balls){const g=ball.ghost;if(ball.type!=='ghost')continue;
        if(G.Ghost.phased(ball))path(g.trace,ball.def.color);
        if(g.phase==='warning'){c.save();c.strokeStyle=ball.def.color;c.globalAlpha=.6;c.lineWidth=1.4;for(let i=0;i<3;i++){c.beginPath();c.arc(ball.x,ball.y,ball.radius+9+i*5,-t*4+i,-t*4+i+2);c.stroke();}c.restore();}
        if(G.Ghost.phased(ball)){c.save();c.strokeStyle=ball.def.color;c.lineWidth=1.3;for(let i=2;i<Math.min(ball.trail.length,11);i+=3){const p=ball.trail[i];c.globalAlpha=(1-i/13)*.28;this.circle(p.x,p.y,ball.radius-2);c.stroke();}c.globalAlpha=.8;
          if(g.chargeUntil>t){c.setLineDash([2,6]);c.beginPath();c.moveTo(ball.x,ball.y);c.lineTo(ball.x+Math.cos(g.aim)*190,ball.y+Math.sin(g.aim)*190);c.stroke();c.setLineDash([]);}c.restore();}
      }
      for(const e of engine.effects){if(!['ghostShift','ghostFear','ghostCut','soulBurst'].includes(e.kind))continue;const p=e.age/e.life;c.save();c.translate(e.x,e.y);c.globalAlpha=1-p;c.strokeStyle=e.color;c.lineWidth=2;
        if(e.kind==='ghostShift'){for(let i=0;i<3;i++){this.circle(0,0,15+p*(30+i*12));c.globalAlpha=(1-p)*(.55-i*.12);c.stroke();}}
        if(e.kind==='ghostFear'){for(const side of [-1,1]){c.beginPath();c.arc(side*9,0,9+p*9,side<0?1.5:-1.5,side<0?4.7:1.5);c.stroke();}c.fillStyle='#f2ffff';for(const side of [-1,1]){this.circle(side*6,-4,2);c.fill();}}
        if(e.kind==='ghostCut'){c.rotate(e.angle);c.strokeStyle='#edfaff';c.lineWidth=3*(1-p);for(const side of [-1,1]){c.beginPath();c.moveTo(-45-p*45,side*17);c.quadraticCurveTo(5,side*26,65+p*30,side*3);c.stroke();}}
        if(e.kind==='soulBurst'){const r=14+e.radius*p;this.circle(0,0,r);c.lineWidth=4*(1-p)+.5;c.stroke();this.circle(0,0,r*.78);c.lineWidth=1;c.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6,d=r*.82;c.beginPath();c.moveTo(Math.cos(a)*d,Math.sin(a)*d);c.lineTo(Math.cos(a+.12)*(r+12),Math.sin(a+.12)*(r+12));c.stroke();}}
        c.restore();
      }
    }
    drawMagnet(engine){
      const c=this.ctx,t=engine.time;
      for(const e of engine.effects)if(e.kind==='magnetPulse'){
        const p=e.age/e.life,color=e.mode==='pull'?'#9ebeff':'#ff809e',radius=Math.max(8,e.radius*(e.mode==='pull'?1-p:p));c.save();c.globalAlpha=(1-p)*.7;c.strokeStyle=color;c.lineWidth=e.mode==='push'?4:2;
        this.circle(e.x,e.y,radius);c.stroke();this.circle(e.x,e.y,Math.max(5,radius-9));c.lineWidth=1;c.stroke();
        for(let i=0;i<10;i++){const a=i*Math.PI/5+e.age,d=radius-12,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d,sign=e.mode==='pull'?-1:1;c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.moveTo(-sign*8,-4);c.lineTo(sign*2,0);c.lineTo(-sign*8,4);c.stroke();c.restore();}c.restore();
      }
      for(const ball of engine.balls){const m=ball.magnetic;
        if(ball.type==='magnet'&&m.phase!=='rest'){c.save();const warning=m.phase==='warning'||m.phase==='overloadWarning',r=ball.radius+(warning?14+5*Math.sin(t*22):15);c.strokeStyle='#a7c9ff';c.lineWidth=2;c.beginPath();c.arc(ball.x,ball.y,r,0,Math.PI);c.stroke();c.strokeStyle='#ff9cae';c.beginPath();c.arc(ball.x,ball.y,r,Math.PI,Math.PI*2);c.stroke();
          if(m.anchored){c.strokeStyle='#e7deff';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(ball.x+side*22,ball.y-24);c.lineTo(ball.x+side*35,ball.y-12);c.lineTo(ball.x+side*35,ball.y+12);c.lineTo(ball.x+side*22,ball.y+24);c.stroke();}const target=G.World.targetFor(ball,engine);if(target){for(const side of [-1,1]){c.beginPath();c.moveTo(ball.x,ball.y+side*10);c.quadraticCurveTo((ball.x+target.x)/2,(ball.y+target.y)/2+side*25,target.x,target.y);c.strokeStyle=side<0?'#94baff99':'#ff97ac99';c.lineWidth=2;c.stroke();}}}c.restore();
        }
      }
    }
    clockFace(x,y,r,angle=0,color='#ede5ff'){
      const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle=color;c.lineWidth=1.6;
      this.circle(0,0,r);c.stroke();
      for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(a)*r*.77,Math.sin(a)*r*.77);c.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);c.stroke();}
      c.beginPath();c.moveTo(0,-r*.55);c.lineTo(0,0);c.lineTo(r*.4,r*.2);c.stroke();c.restore();
    }
    drawTemporal(engine){
      const c=this.ctx,t=engine.time;
      for(const d of engine.timeDomains){const armed=d.armedAt<=t,left=d.expires-t,alpha=Math.min(1,left/.3);c.save();c.globalAlpha=alpha;
        this.circle(d.x,d.y,d.radius);c.fillStyle=d.color+(armed?'17':'09');c.fill();c.strokeStyle=d.color+(armed?'bb':'77');c.lineWidth=armed?2:1;c.setLineDash(armed?[]:[4,4]);c.stroke();c.setLineDash([]);
        c.globalAlpha=alpha*(armed?.55:.35);this.clockFace(d.x,d.y,d.radius*.88,armed?(t-d.armedAt)*d.rate:0,d.color);
        if(!armed){const p=Math.max(0,1-(d.armedAt-t)/.25);this.circle(d.x,d.y,d.radius*p);c.stroke();}c.restore();
      }
      for(const clock of engine.timeClocks){c.save();const nx=Math.cos(clock.angle),ny=Math.sin(clock.angle);c.strokeStyle=clock.color+'88';c.lineWidth=3;c.beginPath();c.moveTo(clock.x-nx*25,clock.y-ny*25);c.lineTo(clock.x,clock.y);c.stroke();this.circle(clock.x,clock.y,11);c.fillStyle='#211e35';c.fill();this.clockFace(clock.x,clock.y,11,(t-clock.started)*9,clock.color);c.restore();}
      for(const b of engine.balls)if(b.type==='time'&&b.temporal.castAt>t){c.save();const s=b.temporal;c.strokeStyle=b.def.color+'88';c.setLineDash([3,5]);c.lineWidth=1;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x+Math.cos(s.aim)*b.def.clockRange,b.y+Math.sin(s.aim)*b.def.clockRange);c.stroke();c.setLineDash([]);this.clockFace(b.x,b.y,b.radius+9,t*6,b.def.color);c.restore();}
    }
    drawTimeBursts(engine){
      const c=this.ctx;
      for(const e of engine.effects)if(e.kind==='timeTick'){c.save();c.globalAlpha=1-e.age/e.life;this.clockFace(e.x,e.y,13+e.age*45,-e.age*8,e.color);c.restore();}
      for(const e of engine.effects)if(e.kind==='timeBurst'){const p=e.age/e.life;c.save();c.translate(e.x,e.y);c.globalAlpha=1-p;c.strokeStyle=e.color;c.lineWidth=3*(1-p)+.5;
        this.circle(0,0,e.radius*(.5+p));c.stroke();
        for(let i=0;i<12;i++){const a=i*Math.PI/6,r=12+e.radius*p,x=Math.cos(a)*r,y=Math.sin(a)*r;c.save();c.translate(x,y);c.rotate(a+p*3);c.beginPath();c.moveTo(-3,-7);c.lineTo(3,0);c.lineTo(-2,6);c.stroke();c.restore();}
        if(p<.35){c.globalAlpha=(1-p/.35)*.8;c.strokeStyle='#fff5ff';c.lineWidth=2;this.clockFace(0,0,20+p*50,p*2);}c.restore();
      }
    }
    drawAbilities(engine){
      const c=this.ctx,t=engine.time;
      for(const ball of engine.balls){
        const a=ball.awakening;if(!a.active || ball.hp<=0)continue;
        const target=G.World.targetFor(ball,engine);
        if(ball.type==='vampire' && a.chainUntil>t && target){
          this.lightning(ball.x,ball.y,target.x,target.y,t,'#ef86baaa',2.4);
          for(let i=0;i<(target.type==='venom'?0:6);i++){const u=(t*1.2+i/6)%1;this.circle(target.x+(ball.x-target.x)*u,target.y+(ball.y-target.y)*u,2.5);c.fillStyle='#a6ffc9';c.fill();}
        }
        if(ball.type==='accelerator' && a.chargeUntil>t){
          c.save();c.strokeStyle='#fff0a488';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(ball.x,ball.y);c.lineTo(ball.x+Math.cos(a.aim)*400,ball.y+Math.sin(a.aim)*400);c.stroke();c.restore();
          this.circle(ball.x,ball.y,ball.radius+7);c.strokeStyle='#fff3b6';c.lineWidth=2;c.stroke();
        }
        if(G.Awakening.dashing(ball,engine)){
          const v=Math.hypot(ball.vx,ball.vy)||1;this.lightning(ball.x-ball.vx/v*90,ball.y-ball.vy/v*90,ball.x,ball.y,t,'#fff3a4',3);
          for(let i=1;i<=3;i++){this.circle(ball.x-ball.vx/v*i*17,ball.y-ball.vy/v*i*17,ball.radius);c.strokeStyle='#ffe484'+['66','44','22'][i-1];c.lineWidth=2;c.stroke();}
        }
      }
      for(const arc of engine.effects.filter(e=>e.kind==='arc')){c.save();c.globalAlpha=1-arc.age/arc.life;this.lightning(arc.x,arc.y,arc.endX,arc.endY,t,arc.color,2);c.restore();}
    }
    drawSignals(engine){
      const c=this.ctx,t=engine.time;
      for(const ball of engine.balls){
        if(ball.hp<=0)continue;
        if(ball.pressure?.bonus>0){c.save();c.beginPath();c.arc(ball.x,ball.y,ball.radius+17,-Math.PI/2,-Math.PI/2+Math.PI*2*ball.pressure.bonus/ball.def.pressureCap);c.strokeStyle='#fff0a4aa';c.lineWidth=2;c.stroke();c.restore();}
        if(ball.type==='reflector'){
          const s=ball.stance,active=s.phase==='active',warning=s.phase==='warning';
          c.save();c.translate(ball.x,ball.y);c.strokeStyle=active?'#decfff':warning?'#b39cff99':'#b39cff30';c.lineWidth=active?2.2:1;
          if(warning)c.setLineDash([2,4]);
          c.beginPath();for(let i=0;i<=24;i++){const a=i*Math.PI/12,r=ball.radius+(active?(i%2?5:11):7);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.stroke();c.setLineDash([]);
          if(s.stored>0){c.beginPath();c.arc(0,0,ball.radius+14,-Math.PI/2,-Math.PI/2+Math.PI*2*s.stored/(8*engine.heatMultiplier));c.strokeStyle='#edddff';c.lineWidth=2.5;c.stroke();}c.restore();
        }

        if(ball.laser){const ray=G.World.ray(ball,ball.laser.angle);c.save();c.strokeStyle=ball.def.color+'99';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.moveTo(ray.x,ray.y);c.lineTo(ray.endX,ray.endY);c.stroke();c.restore();}
      }
      for(const e of engine.effects.filter(e=>e.kind==='beam'||e.kind==='link')){
        c.save();c.globalAlpha=Math.max(0,1-e.age/e.life);c.strokeStyle=e.color;c.lineWidth=e.kind==='beam'?e.width*2:1.5;c.lineCap='round';c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.endX,e.endY);c.stroke();
        if(e.kind==='beam'){c.strokeStyle='#fffce4';c.lineWidth=2;c.stroke();}c.restore();
      }
    }
    drawWorld(engine) {
      const c=this.ctx;
      for(const pool of engine.pools)G.Venom.drawPool(this,pool,engine);
      for(const trap of engine.traps) {
        if(trap.hub&&G.TrapperView){G.TrapperView.hub(this,trap,engine);continue;}
        c.save(); const armed=engine.time>=trap.armedAt;
        c.globalAlpha=armed?0.9:0.4;c.strokeStyle=trap.color;c.fillStyle=trap.color+'20';c.lineWidth=1.5;
        this.circle(trap.x,trap.y,trap.radius);c.fill();c.setLineDash(armed?[]:[3,3]);c.stroke();c.setLineDash([]);
        if(trap.chainRange){this.circle(trap.x,trap.y,trap.radius+4);c.strokeStyle=trap.color+'50';c.stroke();}
        c.beginPath();c.moveTo(trap.x,trap.y-6);c.lineTo(trap.x+6,trap.y);c.lineTo(trap.x,trap.y+6);c.lineTo(trap.x-6,trap.y);c.closePath();c.stroke();
        this.circle(trap.x,trap.y,2);c.fillStyle=armed?'#ffe4e6':trap.color;c.fill();c.restore();
      }
      for(const shot of engine.projectiles) {if(['comet','arcBlood','arcPierce'].includes(shot.mode))continue;
        if(G.RangerView?.flyer(this,shot)||G.TacticsView?.flyer(this,shot,engine))continue;
        if(shot.mode==='boomerang'){
          c.save();if(shot.history?.length){c.beginPath();c.moveTo(shot.x,shot.y);for(const p of shot.history)c.lineTo(p.x,p.y);c.strokeStyle=shot.returning?'#fff5b470':shot.color+'70';c.lineWidth=1.6;c.stroke();}c.translate(shot.x,shot.y);c.rotate(engine.time*20);c.strokeStyle=shot.returning?'#fff5b4':shot.color;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-7,4);c.lineTo(0,-4);c.lineTo(7,4);c.stroke();c.restore();continue;
        }
        if(shot.heavy){c.save();c.translate(shot.x,shot.y);c.rotate(Math.atan2(shot.vy,shot.vx));c.strokeStyle=shot.color+'99';c.lineWidth=7;c.beginPath();c.moveTo(-32,0);c.lineTo(0,0);c.stroke();c.fillStyle='#fff3c4';c.beginPath();c.moveTo(9,0);c.lineTo(-3,-6);c.lineTo(-13,-4);c.lineTo(-13,4);c.lineTo(-3,6);c.closePath();c.fill();c.strokeStyle='#ffbd85';c.lineWidth=1.5;c.stroke();c.restore();continue;}
        c.save();c.strokeStyle=(shot.charged?'#fff0a4':shot.color)+'80';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(shot.x-shot.vx/shot.speed*12,shot.y-shot.vy/shot.speed*12);c.lineTo(shot.x,shot.y);c.stroke();
        c.shadowColor=shot.color;c.shadowBlur=12;this.circle(shot.x,shot.y,shot.radius);c.fillStyle=shot.charged?'#fff0a4':shot.mode==='counter'?'#decfff':'#fff1df';c.fill();if(shot.mode==='counter'){c.strokeStyle='#b39cff';c.lineWidth=1.5;this.circle(shot.x,shot.y,shot.radius+3);c.stroke();}c.restore();
      }
    }
    drawRoleEffects(engine){
      const c=this.ctx;
      for(const e of engine.effects){if(e.kind!=='role')continue;const t=e.age/e.life,r=12+t*45;
        c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=1-t;c.shadowBlur=0;c.strokeStyle=e.color;c.lineWidth=2;
        if(e.style==='wallSlam'){c.beginPath();c.moveTo(0,-r);c.lineTo(0,r);c.stroke();for(let i=0;i<5;i++){const y=(i-2)*12;c.beginPath();c.moveTo(0,y);c.lineTo(14+t*25,y+(i%2?9:-9));c.lineTo(22+t*30,y);c.stroke();}c.strokeStyle='#fff1bb';c.lineWidth=4;c.beginPath();c.arc(0,0,r,-Math.PI/2,Math.PI/2);c.stroke();}
        else if(e.style==='toxinBurst'){c.beginPath();for(let i=0;i<=16;i++){const a=i*Math.PI/8,d=r*(i%2?.65:1);c.lineTo(Math.cos(a)*d,Math.sin(a)*d);}c.closePath();c.stroke();c.fillStyle=e.color+'30';c.fill();}
        else{c.beginPath();c.ellipse(0,0,r,r*.4,.4,0,Math.PI*1.6);c.stroke();c.strokeStyle='#fff5cf';c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.stroke();}
        c.restore();
      }
    }
    drawRoster(engine){
      const c=this.ctx,t=engine.time;c.save();c.shadowBlur=0;
      for(const w of engine.waves){
        c.save();c.translate(w.x,w.y);c.rotate(w.angle);c.globalAlpha=.95-.55*w.travel/w.reach;
        if(w.kind==='pressureWave'){
          const fill=c.createLinearGradient(-42,0,12,0);fill.addColorStop(0,w.color+'00');fill.addColorStop(.75,w.color+'70');fill.addColorStop(1,'#defff9cc');c.fillStyle=fill;
          c.beginPath();c.moveTo(-44,-w.width*.55);c.quadraticCurveTo(22,-w.width*1.35,18,0);c.quadraticCurveTo(22,w.width*1.35,-44,w.width*.55);c.quadraticCurveTo(-16,0,-44,-w.width*.55);c.fill();
          for(const [offset,width,color] of [[0,6,w.color],[3,2.5,'#e5fff8'],[-10,1.5,w.color+'a0']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(offset,0,16,w.width,0,-Math.PI/2,Math.PI/2);c.stroke();}
          c.strokeStyle='#c4fff4';c.lineWidth=1.4;for(let i=-3;i<=3;i++){const y=i*w.width*.22;c.beginPath();c.moveTo(-50-i%2*8,y*.7);c.lineTo(-9,y);c.stroke();}
        }else{c.strokeStyle=w.color;c.lineWidth=4;c.beginPath();c.ellipse(0,0,8,w.width,0,-Math.PI/2,Math.PI/2);c.stroke();c.strokeStyle='#fff4de';c.lineWidth=1.6;c.stroke();}
        c.restore();
      }
      for(const b of engine.balls){const r=b.role;if(b.hp<=0)continue;
        if(b.type==='vampire'){if(r.chainWarning){const enemy=G.World.targetFor(b,engine);if(enemy){c.strokeStyle=b.def.color+'80';c.lineWidth=1;c.setLineDash([2,5]);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(enemy.x,enemy.y);c.stroke();c.setLineDash([]);}}}
        if(b.type==='reflector'&&r.counterRelease>0){c.strokeStyle='#dbc8ff';c.lineWidth=1.5;for(const a of [r.counterAngle-.12,r.counterAngle+.12]){c.beginPath();c.moveTo(b.x+Math.cos(a)*26,b.y+Math.sin(a)*26);c.lineTo(b.x+Math.cos(a)*80,b.y+Math.sin(a)*80);c.stroke();}}
        if(b.type==='ranger'){if(r.calibration){c.strokeStyle='#ffd3ad';c.lineWidth=1;c.strokeRect(b.x-9,b.y-9,18,18);}}
        if(b.type==='shield'&&(r.shieldRelease>0||r.shieldReserve>0)){c.save();c.translate(b.x,b.y);c.rotate(r.shieldAngle);c.fillStyle=b.def.color+'15';c.beginPath();c.moveTo(0,0);c.arc(0,0,110,-.32,.32);c.closePath();c.fill();c.strokeStyle='#b9fff0';c.lineWidth=2;c.beginPath();c.moveTo(32,0);c.lineTo(64,0);c.moveTo(54,-7);c.lineTo(64,0);c.lineTo(54,7);c.stroke();c.restore();}
        if(b.type==='ranger'&&r.overload&&r.ammo>0&&!r.reloadUntil){c.save();c.translate(b.x,b.y);c.rotate(r.salvoAngle);const open=r.salvoFireAt>t?Math.max(0,1-(r.salvoFireAt-t)/.3):1;for(const side of [-1,1]){c.save();c.translate(6,side*(12+open*12));c.rotate(side*.22);c.fillStyle='#452e23';c.strokeStyle='#ffcc9d';c.lineWidth=2;c.fillRect(-6,-4,29,8);c.strokeRect(-6,-4,29,8);c.restore();}c.strokeStyle='#ffe6a1';c.lineWidth=1.5;c.beginPath();c.moveTo(22,-5);c.lineTo(37,0);c.lineTo(22,5);c.stroke();c.restore();}
        if(b.type==='laser'&&b.laser?.awake){c.save();const angle=b.laser.angle;c.translate(b.x,b.y);c.rotate(angle);c.globalAlpha=b.laser.locked?.65:.3;c.fillStyle=b.def.color+'18';c.beginPath();c.moveTo(0,0);c.arc(0,0,210,-.3,.3);c.closePath();c.fill();c.strokeStyle='#ffe9a8';c.lineWidth=1;c.setLineDash([5,5]);for(const edge of [-.3,.3]){c.beginPath();c.moveTo(25*Math.cos(edge),25*Math.sin(edge));c.lineTo(210*Math.cos(edge),210*Math.sin(edge));c.stroke();}c.setLineDash([]);c.beginPath();c.arc(0,0,100,-.3,.3);c.stroke();c.restore();}
        if(b.type==='laser'){c.beginPath();c.arc(b.x,b.y,b.radius+8,-Math.PI/2,-Math.PI/2+Math.PI*2*r.capacitor);c.strokeStyle=r.coolingUntil>t?'#947d49':b.def.color;c.lineWidth=2.5;c.stroke();}
      }
      if(G.Roles.netLinks)for(const link of G.Roles.netLinks(engine)){c.strokeStyle=link.hub?'#f8be75aa':link.a.color+'65';c.lineWidth=link.dynamic?2.2:link.hub?1.5:1;c.setLineDash(link.dynamic?[6,4]:[3,4]);c.lineDashOffset=-engine.time*(link.dynamic?20:0);c.beginPath();c.moveTo(link.a.x,link.a.y);c.lineTo(link.b.x,link.b.y);c.stroke();c.setLineDash([]);}
      for(const beam of engine.beams){
        const b=engine.balls.find(b=>b.id===beam.owner);if(!b)continue;const ray=G.World.ray(b,beam.angle),progress=(t-beam.started)/beam.duration;
        c.save();c.lineCap='round';c.globalAlpha=Math.min(1,(1-progress)*8);
        for(const [width,color] of [[beam.width*3.5,b.def.color+'25'],[beam.width*1.8,b.def.color+'99'],[beam.width*.7,'#fff2b9'],[2.2,'#ffffff']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(ray.x,ray.y);c.lineTo(ray.endX,ray.endY);c.stroke();}
        c.save();c.translate(b.x,b.y);c.rotate(beam.angle);c.strokeStyle='#fff2bf';c.lineWidth=2;for(const side of [-1,1]){c.beginPath();c.moveTo(16,side*10);c.lineTo(35,side*18);c.lineTo(55,side*9);c.stroke();}c.restore();
        c.save();c.translate(ray.endX,ray.endY);c.rotate(beam.angle);c.strokeStyle='#fff7d7';c.lineWidth=2;for(let i=-3;i<=3;i++){const v=Math.sin(t*42+i*3);c.beginPath();c.moveTo(-4,i*3);c.lineTo(-18-8*v,i*8);c.stroke();}c.restore();c.restore();
      }
      c.restore();
    }
    drawRosterEffects(engine){
      const c=this.ctx;
      for(const e of engine.effects){if(e.kind!=='roster'||['arcanaSonicContact','arcanaBloodContact','arcanaPierceContact'].includes(e.style))continue;const p=e.age/e.life,fade=1-p;c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=fade;c.shadowBlur=0;c.strokeStyle=e.color;c.lineWidth=2;
        if(e.style==='bloodFinish'||e.style==='bloodMark'){const radius=e.style==='bloodFinish'?35*(1-p)+4:9+p*12;for(let i=0;i<4;i++){const a=i*Math.PI/2+p;c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);c.lineTo(Math.cos(a+.25)*(radius+8),Math.sin(a+.25)*(radius+8));c.stroke();}}
        else if(e.style==='fistWave'||e.style==='pressureWave'){const width=e.style==='pressureWave'?34:23,d=p*85;c.strokeStyle=e.color;c.lineWidth=5*fade+1;c.beginPath();c.ellipse(d,0,10,width*(.6+p*.5),0,-Math.PI/2,Math.PI/2);c.stroke();c.strokeStyle='#fff5d5';c.lineWidth=2*fade;c.stroke();for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(d-26,i*width*.28);c.lineTo(d-6,i*width*.4);c.stroke();}}
        else if(e.style==='cannon'){c.fillStyle='#fff6c3';c.beginPath();c.moveTo(18,-10*fade);c.lineTo(45+20*p,0);c.lineTo(18,10*fade);c.closePath();c.fill();c.strokeStyle=e.color;c.lineWidth=2;for(const side of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.moveTo(-6-i*8,side*(8+i*5));c.lineTo(-25-p*40-i*8,side*(12+i*7));c.stroke();}}
        else if(e.style==='shieldGather'){for(let i=0;i<6;i++){const a=i*Math.PI/3,d=42*(1-p)+13;c.save();c.translate(Math.cos(a)*d,Math.sin(a)*d);c.rotate(a+p);c.fillStyle=e.color+'55';c.strokeStyle='#d1fff5';c.beginPath();c.moveTo(-5,-8);c.lineTo(7,-4);c.lineTo(4,8);c.lineTo(-5,4);c.closePath();c.fill();c.stroke();c.restore();}}
        else if(e.style==='fistHit'||e.style==='shellHit'||e.style==='pressureHit'||e.style==='largeHit'||e.style==='kineticHit'||e.style==='beamImpact'){
          const reach=20+p*55;c.fillStyle='#fff5d9';c.beginPath();c.moveTo(-16,-5*(1-p));c.lineTo(reach,0);c.lineTo(-16,5*(1-p));c.closePath();c.fill();
          c.lineWidth=3*fade+1;for(const side of [-1,1]){c.strokeStyle=e.color;c.beginPath();c.moveTo(-12,side*8);c.lineTo(12+p*28,side*(20+p*12));c.lineTo(30+p*40,side*(13+p*12));c.stroke();}
          c.strokeStyle='#fff6d0';c.lineWidth=2;c.beginPath();c.ellipse(0,0,12+p*20,28+p*12,0,-Math.PI/2,Math.PI/2);c.stroke();
        }
        else if(e.style==='bladeImpact'||e.style==='mirrorStrike'){
          const radius=25+p*45;c.lineWidth=7*fade+1;c.strokeStyle=e.color;c.beginPath();c.ellipse(0,0,radius,radius*.5,-.6,-.9,2.5);c.stroke();c.strokeStyle='#efffff';c.lineWidth=2.5;c.stroke();
          c.rotate(.65);c.beginPath();c.moveTo(-radius,-3);c.lineTo(radius,3);c.stroke();for(const side of [-1,1]){c.strokeStyle=e.color;c.beginPath();c.moveTo(side*10,side*7);c.lineTo(side*(25+p*28),side*(20+p*15));c.stroke();}
        }
        else if(e.style==='guardImpact'){c.strokeStyle='#d8fff5';c.lineWidth=4*fade+1;c.beginPath();c.arc(0,0,24+p*22,-1.2,1.2);c.stroke();for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(-6,i*7);c.lineTo(20+p*15,i*12);c.stroke();}}
        else if(e.style==='wallCrack'){c.strokeStyle='#fff4ca';c.lineWidth=3*fade+1;for(let i=-2;i<=2;i++){const y=i*13;c.beginPath();c.moveTo(0,y);c.lineTo(15+p*22,y+8);c.lineTo(30+p*30,y-5);c.stroke();}}
        else if(e.style==='toxinErupt'||e.style==='toxinRipple'||e.style==='toxinGather'){
          const gathering=e.style==='toxinGather',radius=gathering?(e.radius||32)*(1-p*.7):e.style==='toxinRipple'?(e.radius||50)*p:15+p*48;
          c.fillStyle=e.color+'25';c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();c.strokeStyle='#daffac';c.lineWidth=4*fade+1;c.stroke();
          for(let i=0;i<8;i++){const a=i*Math.PI/4,d=radius*.7;c.fillStyle=e.color;c.beginPath();c.ellipse(Math.cos(a)*d,Math.sin(a)*d,2+fade*3,4+fade*4,a,0,Math.PI*2);c.fill();}c.strokeStyle=e.color;c.lineWidth=1.5;c.beginPath();c.arc(0,0,radius*.65,0,Math.PI*2);c.stroke();
        }
        else if(e.style==='mineDeploy'){const dx=e.endX-e.x,dy=e.endY-e.y,x=dx*p,y=dy*p-Math.sin(p*Math.PI)*22;c.strokeStyle=e.color+'80';c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(dx*.5,dy*.5-40,dx,dy);c.stroke();c.setLineDash([]);c.fillStyle='#ffd6ce';c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();}
        else if(e.style==='beamContact'){c.strokeStyle='#fff8db';c.lineWidth=2;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(-25-p*12,i*8);c.lineTo(8+p*22,i*11);c.stroke();}}
        else if(e.style==='gunDeploy'){for(const side of [-1,1]){c.strokeStyle='#fff1ae';c.lineWidth=2;c.beginPath();c.moveTo(-12,side*(8+p*12));c.lineTo(18,side*(18+p*12));c.lineTo(35,side*14);c.stroke();}}
        else if(e.style==='salvoMuzzle'){for(const a of [-.22,0,.22]){c.save();c.rotate(a);c.fillStyle='#ffe3b0';c.beginPath();c.moveTo(19,-4*fade);c.lineTo(53-15*p,0);c.lineTo(19,4*fade);c.closePath();c.fill();c.restore();}}
        else if(e.style==='groundBurst'){const radius=15+p*48;c.fillStyle=e.color+'18';c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();c.strokeStyle='#ffdbc2';c.lineWidth=2.5*fade+.5;c.stroke();c.strokeStyle=e.color;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*6,Math.sin(a)*6);c.lineTo(Math.cos(a+.12)*radius*.65,Math.sin(a+.12)*radius*.65);c.lineTo(Math.cos(a-.06)*radius,Math.sin(a-.06)*radius);c.stroke();c.fillStyle='#fdd7c0';c.fillRect(Math.cos(a)*(radius+6),Math.sin(a)*(radius+6),2*fade+1,2*fade+1);}}
        else if(e.style==='muzzle'||e.style==='heavyMuzzle'){const length=(e.style==='heavyMuzzle'?36:22)*(1-p);c.fillStyle=e.style==='heavyMuzzle'?'#fff0a4':'#ffe7d0';c.beginPath();c.moveTo(18,-4);c.lineTo(18+length,0);c.lineTo(18,4);c.closePath();c.fill();}
        else if(e.style==='mirrorCatch'||e.style==='mirrorRelease'){for(let i=0;i<6;i++){const a=i*2.4,d=8+p*30;c.save();c.translate(Math.cos(a)*d,Math.sin(a)*d);c.rotate(a+p);c.strokeRect(-2,-5,4,10);c.restore();}}
        else{const radius=12+p*45;c.strokeStyle='#fff1d2';c.lineWidth=3*fade+.5;c.beginPath();c.ellipse(0,0,radius,radius*.45,0,0,Math.PI*2);c.stroke();c.strokeStyle=e.color;for(let i=0;i<6;i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(Math.cos(a)*8,Math.sin(a)*8);c.lineTo(Math.cos(a+.1)*radius,Math.sin(a+.1)*radius);c.lineTo(Math.cos(a-.05)*(radius+10),Math.sin(a-.05)*(radius+10));c.stroke();}}
        c.restore();
      }
    }
    drawBall(ball, engine) {
      if(G.VampireArcana?.hidden(ball,engine)||G.VampireHunt?.hidden(ball))return;
      if(G.Charge?.flowing(ball)||ball.stellar&&['core','rebirth'].includes(ball.stellar.phase))return;
      const c = this.ctx, { x, y, radius: r, def } = ball;
      c.save();
      if (ball.hp <= 0) c.globalAlpha = 0.3;else if(G.Ghost.phased(ball))c.globalAlpha=.36;
      if(ball.awakening.active&&ball.type!=='venom'){c.strokeStyle=def.color+'aa';c.lineWidth=1.5;c.setLineDash([7,5]);c.lineDashOffset=-engine.time*16;this.circle(x,y,r+5);c.stroke();c.setLineDash([]);}
      if(G.Awakening.dashing(ball,engine)){this.circle(x,y,r+9);c.strokeStyle='#fff7cb';c.lineWidth=3;c.stroke();}
      if(ball.temporal.rate<1){c.strokeStyle='#ddd0ff';c.lineWidth=1.7;c.setLineDash([2,5]);this.circle(x,y,r+8);c.stroke();c.setLineDash([]);}
      // Clean ball silhouette: no ambient halo. Existing motion trails remain.
      c.shadowBlur=0;
      if (ball.shield > 0) {
        const holy=!!ball.holy,amount=holy?ball.def.wardAmount:G.Awakening.shieldOptions(ball).amount;
        this.circle(x, y, r + 9); c.fillStyle = holy?'#eef6ff0d':'#61d8c30d'; c.fill(); c.strokeStyle = holy?'#eef6ffaa':'#61d8c3aa'; c.lineWidth = 2; c.stroke();
        this.circle(x, y, r + 12); c.strokeStyle = holy?'#eef6ff44':'#61d8c344'; c.setLineDash([8, 6]); c.lineDashOffset = -engine.time * 10; c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1,ball.shield/amount)); c.strokeStyle = holy?'#ffffff':'#a1ffeb'; c.lineWidth = 3; c.stroke();
      }
      c.save();
      const hit=ball.hitVisual;
      if(hit && hit.age<hit.life && !this.reducedMotion){const squash=Math.sin(Math.PI*(1-hit.age/hit.life))*.065*hit.power;c.translate(x,y);c.rotate(hit.angle);c.scale(1-squash,1+squash);c.rotate(-hit.angle);c.translate(-x,-y);}
      const fill = c.createRadialGradient(x - 7, y - 8, 2, x, y, r + 7);
      fill.addColorStop(0, ball.flash > 0 ? '#ffffff' : def.color); fill.addColorStop(1, def.color + '70');
      this.circle(x, y, r); c.fillStyle = fill; c.fill(); c.strokeStyle = ball.flash > 0 ? '#fff' : def.color; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#101721'; c.fillStyle = '#101721'; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
      if (ball.type === 'normal') { this.circle(x, y, 5); c.fill(); }
      if (ball.type === 'vampire') { const heartY=y+2; c.beginPath(); c.moveTo(x, heartY + 8); c.bezierCurveTo(x - 22, heartY - 4, x - 5, heartY - 16, x, heartY - 6); c.bezierCurveTo(x + 5, heartY - 16, x + 22, heartY - 4, x, heartY + 8); c.fill(); }
      if (ball.type === 'accelerator') { c.beginPath(); c.moveTo(x + 4, y - 12); c.lineTo(x - 7, y + 1); c.lineTo(x + 1, y + 1); c.lineTo(x - 4, y + 12); c.lineTo(x + 9, y - 3); c.lineTo(x + 1, y - 3); c.closePath(); c.fill(); }
      if (ball.type === 'reflector') { for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; c.beginPath(); c.moveTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4); c.lineTo(x + Math.cos(angle) * 11, y + Math.sin(angle) * 11); c.stroke(); } this.circle(x, y, 5); c.stroke(); }
      if (ball.type === 'shield') { c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 9, y - 7); c.lineTo(x + 8, y + 3); c.quadraticCurveTo(x + 4, y + 9, x, y + 12); c.quadraticCurveTo(x - 4, y + 9, x - 8, y + 3); c.lineTo(x - 9, y - 7); c.closePath(); c.stroke(); }
      if (ball.type === 'ranger') { this.circle(x,y,7);c.stroke();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){c.beginPath();c.moveTo(x+dx*4,y+dy*4);c.lineTo(x+dx*12,y+dy*12);c.stroke();} }
      if(ball.type==='boomerang'){if(G.BladeHuntView)G.BladeHuntView.icon(c,x,y,12,G.BladeDanceView?.pose(ball,engine)||0);else{c.save();c.translate(x,y);c.rotate(G.BladeDanceView?.pose(ball,engine)||0);c.beginPath();c.moveTo(-11,6);c.lineTo(0,-7);c.lineTo(11,6);c.stroke();c.restore();}}
      if(ball.type==='laser'){c.beginPath();c.moveTo(x-11,y);c.lineTo(x+11,y);c.moveTo(x-6,y-5);c.lineTo(x+6,y+5);c.moveTo(x-6,y+5);c.lineTo(x+6,y-5);c.stroke();}
      if(ball.type==='storm')G.CosmicView?.icon(c,x,y,ball.type);if(ball.type==='orbital')G.StellarView?.icon(c,x,y);if(ball.type==='charge')G.ChargeView?.icon(c,x,y);if(ball.type==='demon')G.DemonView?.icon(c,x,y);
      if(ball.type==='holy')G.HolyView?.icon(c,x,y);
      if(ball.type==='ghost'){c.beginPath();c.moveTo(x-10,y+10);c.lineTo(x-10,y-2);c.bezierCurveTo(x-10,y-15,x+10,y-15,x+10,y-2);c.lineTo(x+10,y+10);c.lineTo(x+5,y+6);c.lineTo(x,y+10);c.lineTo(x-5,y+6);c.closePath();c.fill();c.fillStyle='#eaffff';for(const side of [-1,1]){this.circle(x+side*4,y-2,2.2);c.fill();}}
      if(ball.type==='magnet'){c.lineWidth=4;c.beginPath();c.arc(x,y+1,8,0,Math.PI);c.moveTo(x-8,y+1);c.lineTo(x-8,y-10);c.moveTo(x+8,y+1);c.lineTo(x+8,y-10);c.stroke();c.fillStyle='#a8c8ff';c.fillRect(x-10,y-11,4,5);c.fillStyle='#ffc0cf';c.fillRect(x+6,y-11,4,5);}
      if(ball.type==='time'){this.clockFace(x,y,12,0,'#101721');}
      if(ball.type==='venom'){c.beginPath();c.moveTo(x,y-12);c.bezierCurveTo(x-15,y+2,x-8,y+11,x,y+11);c.bezierCurveTo(x+8,y+11,x+15,y+2,x,y-12);c.fill();}
      if (ball.type === 'trapper') { c.beginPath();c.moveTo(x,y-10);c.lineTo(x+10,y);c.lineTo(x,y+10);c.lineTo(x-10,y);c.closePath();c.stroke();this.circle(x,y,3);c.fill(); }
      c.restore();
      c.restore();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
(function(root){
 'use strict';const G=root.OrbDuel,TAU=Math.PI*2;
 // One read-only HUD pass: equal-size badges, shared placement and no combat mutation.
 G.OrbMarkers={size:3.5,gap:11,offset:8,
  // Optical balance: filled circles need less extent than pointed or open symbols.
  weights:{dot:.87,diamond:1.19,bloodGem:1,drop:1.07,bar:1.12,sniperRound:1.05,shield:.92,mirror:1.06,bolt:1.12,cross:1,chevron:1.12,crescentBlade:1.02,twinBlade:1.02,bladeSeal:1.12,brand:1.05,magnet:1.05},
  visible(b,e){return b.hp>0&&!G.World.absent(b,e)&&!G.VampireHunt?.hidden(b)&&!G.Charge?.flowing(b)&&!['core','rebirth'].includes(b.stellar?.phase);},
  collect(b,e){const own=[],poison=[],marks=[],t=e.time,r=b.role;
   const add=(group,key,shape,color,active=true)=>group.push({owner:b.id,key,shape,color,active,alpha:G.Ghost.phased(b)?.4:1});
   if(b.type==='normal')for(let i=0;i<3;i++)add(own,'fist'+i,'dot','#fff0a4',i<b.charges);
   if(b.type==='vampire')for(let i=0;i<4;i++)add(own,'blood'+i,'bloodGem','#f385a9',r.blood>=2*(i+1));
   if(b.type==='ranger')for(const m of G.Ranger.ammoMarkers(b,e)){add(own,m.key,m.shape,r.overload?'#fff0a4':b.def.color,m.active);Object.assign(own.at(-1),{alpha:own.at(-1).alpha*m.alpha,scale:m.scale,degrees:m.degrees});}
   if(b.type==='shield'&&(b.shield>0||b.arcana?.royalShield>0))for(let i=0;i<Math.ceil(r.pressure/2);i++)add(own,'pressure'+i,'shield','#c7fff3');
   if(b.type==='boomerang'&&b.character.catchUntil>t&&!b.character.bladeRemaining)add(own,'catch',b.character.catchPower>=1.4?'twinBlade':'crescentBlade','#d9faff');
   if(b.type==='magnet')for(let i=0;i<Math.round(b.magnetic.pullBonus/.12);i++)add(own,'pull'+i,'bar','#bcd3ff');
   const layers=G.Venom.layers(b,t);if(layers.length)for(let i=0;i<4;i++){const l=layers[i];add(poison,'poison'+i,l?.type==='paralysis'?'diamond':'dot',l?G.Venom.colors[l.type]:'#425166',!!l);if(b.venomChange)poison.at(-1).pulse=Math.max(0,1-(t-b.venomChange.at)/.35);}
   if(r.bloodMark?.until>=t)add(marks,'bloodMark','drop','#ffbad9');
   if(b.bladeMark?.until>=t)add(marks,'bladeMark','bladeSeal','#c9f7ff');
   if(b.magneticMark?.until>=t)add(marks,'magneticMark','magnet',b.magneticMark.cause==='pull'?'#9bbaff':'#ff8fa8');
   if(G.Temporal.silenced(b,e))add(marks,'silence','cross','#ede5ff');
   const alive=id=>e.balls.some(v=>v.id===id&&v.hp>0);
   for(const m of e.cosmicWorld?.marks||[])if(m.target===b.id&&m.until>t&&alive(m.owner))for(let i=0;i<m.stacks;i++)add(marks,'static'+m.owner+':'+i,'bolt','#c8ddff');
   for(const m of e.chargeWorld?.conductive||[])if(m.target===b.id&&m.until>t&&alive(m.owner))add(marks,'conductive'+m.owner,'bolt','#b1f4ff');
   for(const m of e.demonWorld?.marks||[])if(m.target===b.id&&m.until>=t&&alive(m.owner))add(marks,'demon'+m.owner,'brand','#ffc0a2');
   return {own,poison,marks};
  },
  layout(e){const result=[];for(const b of e.balls){if(!this.visible(b,e))continue;const groups=this.collect(b,e);for(const [name,items]of Object.entries(groups))for(let i=0;i<items.length;i++){
    // Stable sectors only. No wall or neighbouring-orb avoidance.
    const lane=name==='marks'?Math.floor(i/6):0,index=name==='marks'?i%6:i;
    const degrees=items[i].degrees??(name==='own'?-90+(i-(items.length-1)/2)*21:name==='poison'?147+(i-1.5)*21:-28+index*21);
    const angle=degrees*Math.PI/180,radius=b.radius+this.offset+lane*this.gap;
    result.push({...items[i],x:b.x+Math.cos(angle)*radius,y:b.y+Math.sin(angle)*radius,lane,group:name,radius:this.size,weight:this.weights[items[i].shape]||1});
   }}return result;
  },
  draw(r,e){const c=r.ctx;c.save();c.shadowBlur=0;c.lineCap='round';c.lineJoin='round';
   for(const m of this.layout(e)){c.save();c.translate(m.x,m.y);c.globalAlpha=m.alpha*(m.active?1:.3);const pulse=1+(m.pulse||0)*.12;c.scale(pulse*m.weight*(m.scale??1),pulse*m.weight*(m.scale??1));c.beginPath();
    if(m.shape==='diamond'){c.moveTo(0,-3.2);c.lineTo(3.2,0);c.lineTo(0,3.2);c.lineTo(-3.2,0);c.closePath();}
    else if(m.shape==='bloodGem'){c.moveTo(0,-3.8);c.bezierCurveTo(-1,-2.1,-3,0,-2.7,1.5);c.lineTo(-1.4,3);c.lineTo(1.4,3);c.lineTo(2.7,1.5);c.bezierCurveTo(3,0,1,-2.1,0,-3.8);c.closePath();}
    else if(m.shape==='drop'){c.moveTo(0,-3.3);c.bezierCurveTo(-3.6,.7,-2,3.2,0,3.2);c.bezierCurveTo(2,3.2,3.6,.7,0,-3.3);c.closePath();}
    else if(m.shape==='crescentBlade'){c.moveTo(-3.2,-3.2);c.bezierCurveTo(4.4,-2.2,4.4,2.2,-3.2,3.2);c.bezierCurveTo(.1,1.2,.1,-1.2,-3.2,-3.2);c.closePath();}
    else if(m.shape==='twinBlade'){c.moveTo(-3.6,-3);c.bezierCurveTo(1.6,-3,1.6,1,-3.6,1.7);c.bezierCurveTo(-1.4,.2,-1.4,-1.4,-3.6,-3);c.closePath();c.moveTo(3.6,3);c.bezierCurveTo(-1.6,3,-1.6,-1,3.6,-1.7);c.bezierCurveTo(1.4,-.2,1.4,1.4,3.6,3);c.closePath();}
    else if(m.shape==='bladeSeal'){c.moveTo(3.7,-1);c.bezierCurveTo(.9,-3.9,-3.5,-2.8,-3.4,2.9);c.bezierCurveTo(-1.7,.7,-.8,-.1,.1,.3);c.lineTo(-.4,1.7);c.quadraticCurveTo(1.3,-.2,3.7,-1);c.closePath();}
    else if(m.shape==='chevron'){c.moveTo(-2.3,-3);c.lineTo(2.3,0);c.lineTo(-2.3,3);}
    else if(m.shape==='sniperRound'){c.moveTo(0,-4.6);c.lineTo(1.6,-1.3);c.lineTo(1.6,2.5);c.lineTo(2.1,2.5);c.lineTo(2.1,3.6);c.lineTo(-2.1,3.6);c.lineTo(-2.1,2.5);c.lineTo(-1.6,2.5);c.lineTo(-1.6,-1.3);c.closePath();}
    else if(m.shape==='bar'){c.moveTo(-1.7,3);c.lineTo(-1.7,-1.2);c.quadraticCurveTo(0,-4.2,1.7,-1.2);c.lineTo(1.7,3);c.closePath();}
    else if(m.shape==='bolt'){c.moveTo(1,-3.2);c.lineTo(-2.2,.4);c.lineTo(.7,.4);c.lineTo(-1.1,3.2);}
    else if(m.shape==='cross'){c.moveTo(-2.4,-2.4);c.lineTo(2.4,2.4);c.moveTo(2.4,-2.4);c.lineTo(-2.4,2.4);}
    else if(m.shape==='brand'){c.moveTo(0,-3.2);c.lineTo(2.8,2.4);c.lineTo(-2.8,2.4);c.closePath();c.moveTo(0,-.5);c.lineTo(0,1);}
    else if(m.shape==='magnet'){c.arc(0,-.6,2.5,0,Math.PI);c.moveTo(-2.5,-.6);c.lineTo(-2.5,-2.8);c.moveTo(2.5,-.6);c.lineTo(2.5,-2.8);}
    else if(m.shape==='arc'){c.arc(0,0,3.2,-1.15,1.15);}
    else if(m.shape==='shield'){c.moveTo(-2.8,-2.5);c.lineTo(2.8,-2.5);c.lineTo(2.3,.8);c.quadraticCurveTo(1.7,2.4,0,3.3);c.quadraticCurveTo(-1.7,2.4,-2.3,.8);c.closePath();}
    else if(m.shape==='mirror'){c.moveTo(-1.8,-3.2);c.lineTo(2.9,-1.9);c.lineTo(1.8,3.2);c.lineTo(-2.9,1.9);c.closePath();}
    else{c.arc(0,0,3.1,0,TAU);}
    // Trace the actual silhouette for contrast; never wrap every icon in a circular badge.
    c.strokeStyle='#101721';c.lineWidth=2.5;c.stroke();c.strokeStyle=m.color;c.fillStyle=m.color;c.lineWidth=1.3;
    if(m.active&&['dot','diamond','bloodGem','drop','bar','sniperRound','shield','crescentBlade','twinBlade','bladeSeal'].includes(m.shape))c.fill();else c.stroke();
    if(m.shape==='bloodGem'&&m.active){c.fillStyle='#b3466e';c.beginPath();c.moveTo(0,-2.6);c.lineTo(-1.7,1.4);c.lineTo(0,2.2);c.closePath();c.fill();c.strokeStyle='#ffd3df';c.lineWidth=.75;c.beginPath();c.moveTo(.3,-1.4);c.lineTo(1.5,.8);c.stroke();}c.restore();
   }c.restore();
  }

 };
})(typeof window!=='undefined'?window:globalThis);
