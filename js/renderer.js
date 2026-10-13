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
      const impulses=engine.effects.filter(e=>e.kind==='impact');
      const impulse=impulses.reduce((best,e)=>e.power*(1-e.age/e.life)>(best?.power||0)*(1-(best?.age||0)/(best?.life||1))?e:best,null);
      if(impulse && !this.reducedMotion){const strength=impulse.power*(1-impulse.age/impulse.life)*.9;c.translate(Math.sin(impulse.age*115)*strength,Math.cos(impulse.age*95)*strength);}
      this.drawWorld(engine);G.Spectacle?.behind(this,engine);
      this.drawAbilities(engine);
      this.drawSignals(engine);
      for (const ball of engine.balls) {
        for (let i = ball.trail.length - 1; i >= 0; i--) { const point = ball.trail[i]; c.globalAlpha = (1 - i / ball.trail.length) * (ball.type === 'accelerator' ? 0.19 : 0.10); c.fillStyle = ball.def.color; this.circle(point.x, point.y, ball.radius * (1 - i / (ball.trail.length + 3)) * 0.8); c.fill(); }
        c.globalAlpha = 1;
      }
      for (const effect of engine.effects.filter(e => e.kind === 'ring' || e.kind === 'particle')) {
        const t = effect.age / effect.life; c.globalAlpha = Math.max(0, 1 - t);
        if (effect.kind === 'ring') { this.circle(effect.x, effect.y, 12 + effect.size * t); c.strokeStyle = effect.color; c.lineWidth = 2 * (1 - t) + 0.4; c.stroke(); }
        else { this.circle(effect.x, effect.y, 1.5 + (1 - t)); c.fillStyle = effect.color; c.fill(); }
      }
      c.globalAlpha = 1;
      for (const ball of engine.balls) this.drawBall(ball, engine);G.Spectacle?.front(this,engine);this.drawRoleEffects(engine);
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
      c.restore();
    }
    lightning(x,y,endX,endY,time,color,width=2){
      const c=this.ctx,dx=endX-x,dy=endY-y,length=Math.hypot(dx,dy)||1;
      c.save();c.strokeStyle=color;c.lineWidth=width;c.shadowColor=color;c.shadowBlur=8;c.beginPath();c.moveTo(x,y);
      for(let i=1;i<12;i++){const t=i/12,wave=Math.sin(i*7.1+time*26)*5;c.lineTo(x+dx*t-dy/length*wave,y+dy*t+dx/length*wave);}c.lineTo(endX,endY);c.stroke();c.restore();
    }
    drawAbilities(engine){
      const c=this.ctx,t=engine.time;
      for(const ball of engine.balls){
        const a=ball.awakening;if(!a.active || ball.hp<=0)continue;
        const target=G.World.targetFor(ball,engine);
        if(ball.type==='vampire' && a.chainUntil>t && target){
          this.lightning(ball.x,ball.y,target.x,target.y,t,'#ef86baaa',2.4);
          for(let i=0;i<6;i++){const u=(t*1.2+i/6)%1;this.circle(target.x+(ball.x-target.x)*u,target.y+(ball.y-target.y)*u,2.5);c.fillStyle='#a6ffc9';c.fill();}
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
        if(ball.type==='normal')for(let i=0;i<3;i++){const angle=-Math.PI/2+(i-1)*.45;this.circle(ball.x+Math.cos(angle)*(ball.radius+8),ball.y+Math.sin(angle)*(ball.radius+8),2.2);c.fillStyle=i<ball.charges?'#fff0a4':'#53657d';c.fill();}
        if(ball.poison && ball.poison.until>=t){for(let i=0;i<3;i++){const a=t*2+i*Math.PI*2/3;this.circle(ball.x+Math.cos(a)*(ball.radius+6),ball.y+Math.sin(a)*(ball.radius+6),1.8);c.fillStyle='#a4d568';c.fill();}}
        if(ball.laser){const ray=G.World.ray(ball,ball.laser.angle);c.save();c.strokeStyle=ball.def.color+'99';c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.moveTo(ray.x,ray.y);c.lineTo(ray.endX,ray.endY);c.stroke();c.restore();}
      }
      for(const e of engine.effects.filter(e=>e.kind==='beam'||e.kind==='link')){
        c.save();c.globalAlpha=Math.max(0,1-e.age/e.life);c.strokeStyle=e.color;c.lineWidth=e.kind==='beam'?e.width*2:1.5;c.lineCap='round';c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.endX,e.endY);c.stroke();
        if(e.kind==='beam'){c.strokeStyle='#fffce4';c.lineWidth=2;c.stroke();}c.restore();
      }
    }
    drawWorld(engine) {
      const c=this.ctx;
      for(const pool of engine.pools){
        c.save();const armed=engine.time>=pool.armedAt;c.globalAlpha=armed?1:.4;
        this.circle(pool.x,pool.y,pool.radius);c.fillStyle=pool.color+'16';c.fill();c.strokeStyle=pool.color+'66';c.lineWidth=1;c.setLineDash([3,4]);c.stroke();c.setLineDash([]);
        for(let i=0;i<4;i++){const a=i*2.4+pool.id;this.circle(pool.x+Math.cos(a)*pool.radius*.5,pool.y+Math.sin(a)*pool.radius*.5,2+Math.sin(engine.time*3+i)*.7);c.strokeStyle=pool.color+'88';c.stroke();}c.restore();
      }
      for(const trap of engine.traps) {
        c.save(); const armed=engine.time>=trap.armedAt;
        c.globalAlpha=armed?0.9:0.4;c.strokeStyle=trap.color;c.fillStyle=trap.color+'20';c.lineWidth=1.5;
        this.circle(trap.x,trap.y,trap.radius);c.fill();c.setLineDash(armed?[]:[3,3]);c.stroke();c.setLineDash([]);
        if(trap.chainRange){this.circle(trap.x,trap.y,trap.radius+4);c.strokeStyle=trap.color+'50';c.stroke();}
        c.beginPath();c.moveTo(trap.x,trap.y-6);c.lineTo(trap.x+6,trap.y);c.lineTo(trap.x,trap.y+6);c.lineTo(trap.x-6,trap.y);c.closePath();c.stroke();
        this.circle(trap.x,trap.y,2);c.fillStyle=armed?'#ffe4e6':trap.color;c.fill();c.restore();
      }
      for(const shot of engine.projectiles) {
        if(shot.mode==='boomerang'){
          c.save();if(shot.history?.length){c.beginPath();c.moveTo(shot.x,shot.y);for(const p of shot.history)c.lineTo(p.x,p.y);c.strokeStyle=shot.returning?'#fff5b470':shot.color+'70';c.lineWidth=1.6;c.stroke();}c.translate(shot.x,shot.y);c.rotate(engine.time*20);c.strokeStyle=shot.returning?'#fff5b4':shot.color;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-7,4);c.lineTo(0,-4);c.lineTo(7,4);c.stroke();c.restore();continue;
        }
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
    drawBall(ball, engine) {
      const c = this.ctx, { x, y, radius: r, def } = ball;
      c.save();
      if (ball.hp <= 0) c.globalAlpha = 0.3;
      if(ball.awakening.active){c.strokeStyle=def.color+'aa';c.lineWidth=1.5;c.setLineDash([7,5]);c.lineDashOffset=-engine.time*16;this.circle(x,y,r+5);c.stroke();c.setLineDash([]);}
      if(G.Awakening.dashing(ball,engine)){this.circle(x,y,r+9);c.strokeStyle='#fff7cb';c.lineWidth=3;c.stroke();}
      // Clean ball silhouette: no ambient halo. Existing motion trails remain.
      c.shadowBlur=0;
      if(ball.poison&&ball.poison.until>=engine.time){for(let i=0;i<(ball.poison.stacks||1);i++){this.circle(x-8+i*8,y-r-8,2.5);c.fillStyle='#b2e776';c.fill();}if(ball.poison.stacks===3){c.strokeStyle='#d9ffad';c.lineWidth=1;this.circle(x,y,r+3);c.stroke();}}
      if(ball.bladeMark&&ball.bladeMark.until>=engine.time){c.strokeStyle='#c9f7ff';c.lineWidth=2;c.beginPath();c.moveTo(x+r+4,y-5);c.lineTo(x+r+10,y);c.lineTo(x+r+4,y+5);c.stroke();}
      if (ball.shield > 0) {
        this.circle(x, y, r + 9); c.fillStyle = '#61d8c30d'; c.fill(); c.strokeStyle = '#61d8c3aa'; c.lineWidth = 2; c.stroke();
        this.circle(x, y, r + 12); c.strokeStyle = '#61d8c344'; c.setLineDash([8, 6]); c.lineDashOffset = -engine.time * 10; c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ball.shield / G.Awakening.shieldOptions(ball).amount); c.strokeStyle = '#a1ffeb'; c.lineWidth = 3; c.stroke();
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
      if(ball.type==='boomerang'){c.beginPath();c.moveTo(x-11,y+6);c.lineTo(x,y-7);c.lineTo(x+11,y+6);c.stroke();}
      if(ball.type==='laser'){c.beginPath();c.moveTo(x-11,y);c.lineTo(x+11,y);c.moveTo(x-6,y-5);c.lineTo(x+6,y+5);c.moveTo(x-6,y+5);c.lineTo(x+6,y-5);c.stroke();}
      if(ball.type==='venom'){c.beginPath();c.moveTo(x,y-12);c.bezierCurveTo(x-15,y+2,x-8,y+11,x,y+11);c.bezierCurveTo(x+8,y+11,x+15,y+2,x,y-12);c.fill();}
      if (ball.type === 'trapper') { c.beginPath();c.moveTo(x,y-10);c.lineTo(x+10,y);c.lineTo(x,y+10);c.lineTo(x-10,y);c.closePath();c.stroke();this.circle(x,y,3);c.fill(); }
      c.restore();
      c.restore();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
