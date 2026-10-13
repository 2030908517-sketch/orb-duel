(function (root) {
  'use strict';
  const Game = root.OrbDuel;
  const C = Game.Constants;
  Game.Physics = {
    limit(ball) {
      const length=Math.hypot(ball.vx,ball.vy),cap=ball.motionSpeed||800;
      if(length>cap){ball.vx*=cap/length;ball.vy*=cap/length;}
    },
    normalizeSpeed(ball,dt=0) {
      const length = Math.hypot(ball.vx, ball.vy);
      const speed=ball.motionSpeed || ball.speed;
      if (!Number.isFinite(length) || length < 1e-6) { ball.vx = speed; ball.vy = 0; }
      else {
        const target=ball.inertia>dt&&!ball.motionSpeed?Math.max(100,speed+(length-speed)*Math.exp(-dt*4)):speed;
        ball.vx*=target/length;ball.vy*=target/length;this.limit(ball);
      }
      if(ball.inertia>0)ball.inertia=Math.max(0,ball.inertia-dt);
    },
    constrain(ball) {
      const r = ball.radius;
      let bounced = false;
      ball.wallContact=null;
      const wall=(speed,nx,ny)=>{if(!ball.wallContact||speed>ball.wallContact.speed)ball.wallContact={speed,nx,ny};bounced=true;};
      if (ball.x < r) { ball.x = r; if (ball.vx < 0) {wall(-ball.vx,1,0);ball.vx=-ball.vx;} }
      if (ball.x > C.width - r) { ball.x = C.width - r; if (ball.vx > 0) {wall(ball.vx,-1,0);ball.vx=-ball.vx;} }
      if (ball.y < r) { ball.y = r; if (ball.vy < 0) {wall(-ball.vy,0,1);ball.vy=-ball.vy;} }
      if (ball.y > C.height - r) { ball.y = C.height - r; if (ball.vy > 0) {wall(ball.vy,0,-1);ball.vy=-ball.vy;} }
      return bounced;
    },
    integrate(ball, dt) {
      this.normalizeSpeed(ball,dt);
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      return this.constrain(ball);
    },
    contactInfo(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=d===1&&dx===0&&dy===0?1:dx/d,ny=dy/d;return {nx,ny,aSpeed:Math.hypot(a.vx,a.vy),bSpeed:Math.hypot(b.vx,b.vy),closing:Math.max(0,(a.vx-b.vx)*nx+(a.vy-b.vy)*ny),aForward:Math.max(0,a.vx*nx+a.vy*ny),bForward:Math.max(0,-b.vx*nx-b.vy*ny)};},
    resolve(a, b) {
      let dx = b.x - a.x, dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      const minDistance = a.radius + b.radius;
      if (distance > minDistance) return false;
      // A deterministic normal also resolves exactly coincident centers.
      if (distance < 1e-8) { dx = 1; dy = 0; distance = 1; }
      const nx = dx / distance, ny = dy / distance;
      const inverseA = 1 / a.mass, inverseB = 1 / b.mass;
      const correction = minDistance - Math.hypot(b.x - a.x, b.y - a.y) + 0.02;
      a.x -= nx * correction * inverseA / (inverseA + inverseB);
      a.y -= ny * correction * inverseA / (inverseA + inverseB);
      b.x += nx * correction * inverseB / (inverseA + inverseB);
      b.y += ny * correction * inverseB / (inverseA + inverseB);
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative < 0) {
        // Elastic normal impulse exchanges momentum; tangent velocities remain.
        const impulse=-2*relative/(inverseA+inverseB);
        a.vx-=impulse*inverseA*nx;a.vy-=impulse*inverseA*ny;
        b.vx+=impulse*inverseB*nx;b.vy+=impulse*inverseB*ny;
        a.inertia=.8;b.inertia=.8;
      }
      this.limit(a); this.limit(b);
      return true;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
