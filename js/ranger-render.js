(function(root){
  'use strict';const G=root.OrbDuel;
  G.RangerView={
    behind(renderer,e){const c=renderer.ctx;c.save();c.shadowBlur=0;
      for(const b of e.balls){if(b.type!=='ranger'||b.hp<=0||b.role.sniperPhase==='idle')continue;const r=b.role,locked=r.sniperPhase==='locked',ray=G.World.ray(b,r.sniperAngle),color=r.sniperHurt?'#ff7484':'#ffe1b9';c.strokeStyle=color;c.globalAlpha=locked?.85:.42;c.lineWidth=locked?1.1:.65;c.setLineDash(locked?[]:[3,5]);c.beginPath();c.moveTo(ray.x,ray.y);c.lineTo(ray.endX,ray.endY);c.stroke();c.setLineDash([]);
        c.save();c.translate(b.x,b.y);c.rotate(r.sniperAngle);c.globalAlpha=.9;c.lineWidth=1.2;for(const sign of [-1,1]){c.beginPath();c.moveTo(31,sign*9);c.lineTo(42,sign*9);c.lineTo(42,sign*3);c.stroke();}c.restore();
        const duration=b.def.sniperAim+b.def.sniperLock,progress=Math.max(0,Math.min(1,1-(r.sniperFireAt-e.time)/duration));c.strokeStyle=color;c.globalAlpha=.8;c.lineWidth=1.5;c.beginPath();c.arc(b.x,b.y,b.radius+10,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);c.stroke();
      }c.restore();
    },
    flyer(renderer,p){if(!p.sniper)return false;const c=renderer.ctx;c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vy,p.vx));c.shadowBlur=0;const trail=c.createLinearGradient(-32,0,7,0);trail.addColorStop(0,p.color+'00');trail.addColorStop(.6,p.color);trail.addColorStop(1,'#fff4df');c.strokeStyle=trail;c.lineWidth=3.5;c.beginPath();c.moveTo(-32,0);c.lineTo(6,0);c.stroke();c.strokeStyle='#fff8ed';c.lineWidth=1.4;c.beginPath();c.moveTo(-11,0);c.lineTo(7,0);c.stroke();c.fillStyle=p.color;c.beginPath();c.ellipse(0,0,6,3,0,0,Math.PI*2);c.fill();c.restore();return true;}
  };
})(typeof window!=='undefined'?window:globalThis);
