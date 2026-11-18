(function(root){
  'use strict';const G=root.OrbDuel,clamp=v=>Math.max(0,Math.min(1,v));
  // Wing joints articulate; the silhouette is not a uniformly scaled icon.
  function bat(c,x,y,size,flap,angle,alpha){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.globalAlpha*=alpha;
    for(const side of [-1,1]){c.save();c.scale(side,1);const tipX=30-flap*14,tipY=-9-flap*16,elbowY=-4-flap*7;
      c.beginPath();c.moveTo(2,-1);c.quadraticCurveTo(8,elbowY,13,elbowY-2);c.lineTo(tipX,tipY);c.lineTo(tipX-6,tipY+8);c.quadraticCurveTo(16,-2,18,5);c.quadraticCurveTo(11,-1,11,10);c.quadraticCurveTo(7,4,3,10);c.lineTo(0,5);c.closePath();c.fillStyle='#61182f';c.fill();c.strokeStyle='#321023';c.lineWidth=1.1;c.stroke();
      c.beginPath();c.moveTo(13,elbowY-2);c.lineTo(tipX,tipY);c.lineTo(tipX-6,tipY+8);c.quadraticCurveTo(16,-2,18,5);c.closePath();c.fillStyle='#a53850';c.fill();
      c.beginPath();c.moveTo(13,elbowY-2);c.quadraticCurveTo(14,-1,18,5);c.quadraticCurveTo(11,-1,11,10);c.closePath();c.fillStyle='#7b203d';c.fill();
      // A single leading bone and two inner fingers preserve large concave membranes.
      c.beginPath();c.moveTo(3,-1);c.quadraticCurveTo(8,elbowY,13,elbowY-2);c.lineTo(tipX,tipY);c.strokeStyle='#f09191';c.lineWidth=1.05;c.stroke();
      c.beginPath();c.moveTo(13,elbowY-2);c.quadraticCurveTo(14,-1,18,5);c.moveTo(11,elbowY);c.quadraticCurveTo(9,2,11,10);c.strokeStyle='#3c1024';c.lineWidth=1.2;c.stroke();
      c.beginPath();c.moveTo(4,0);c.lineTo(13,elbowY);c.lineTo(10,5);c.lineTo(5,3);c.closePath();c.fillStyle='#a82b48';c.fill();c.restore();}
    // Prominent ears, head, short mammal torso and central tail; no four petal lobes.
    c.beginPath();c.moveTo(-3,-6);c.lineTo(-5,-14);c.lineTo(-.7,-9);c.lineTo(.7,-9);c.lineTo(5,-14);c.lineTo(3,-6);c.quadraticCurveTo(5,-1,3,5);c.lineTo(0,9);c.lineTo(-3,5);c.quadraticCurveTo(-5,-1,-3,-6);c.closePath();c.fillStyle='#290e20';c.fill();
    c.beginPath();c.moveTo(-4,-5);c.lineTo(-6,-13);c.lineTo(-1,-8);c.lineTo(1,-8);c.lineTo(6,-13);c.lineTo(4,-5);c.quadraticCurveTo(5,0,0,2);c.quadraticCurveTo(-5,0,-4,-5);c.fillStyle='#a43750';c.fill();c.beginPath();c.moveTo(-1,-1);c.lineTo(2,0);c.lineTo(0,6);c.lineTo(-2,2);c.closePath();c.fillStyle='#7d263e';c.fill();c.fillStyle='#ffc6b7';c.fillRect(-2.7,-6,1.4,1);c.fillRect(1.3,-6,1.4,1);c.restore();
  }
  G.VampireHuntView={bat};
  function swarm(c,b,e){const h=b.hunt,age=Math.max(0,e.time-h.started),warning=h.phase==='warning',reform=h.phase==='reform';
    c.save();c.translate(b.x,b.y);const heading=(warning?h.aim:h.flightAim??h.aim)+Math.PI/2;c.rotate(heading);
    const formation=[[-8,-16,.68],[11,5,.56],[-24,0,.61],[21,27,.51],[-4,31,.66],[-19,21,.51],[6,51,.57],[24,-4,.55],[-10,48,.52]];
    for(let i=formation.length-1;i>=0;i--){const [xx,yy,size]=formation[i],delay=(i%4)*.012,raw=warning?clamp((age-delay)/(.24-delay)):reform?1-clamp((age-delay)/(.22-delay)):1,p=raw*raw*(3-2*raw),side=xx<0?-1:1,beat=age*(24+i%3)+i*2.1,flap=(Math.sin(beat)+1)/2,x=xx*p+Math.sin(age*(4.1+i*.19)+i*2.7)*4.8*p+Math.sin((1-p)*Math.PI)*side*7,y=yy*p+Math.cos(age*(3.5+i*.23)+i*1.9)*6.2*p+(warning?-8:reform?8:0)*Math.sin((1-p)*Math.PI),bank=side*(1-p)*.55+Math.sin(i*3.8)*.22+Math.sin(beat*.47)*.11;
      if(h.phase==='flight'){c.beginPath();c.moveTo(x-2,y+3);c.bezierCurveTo(x+side*9,y+13,x+side*7,y+28,x+side*3,y+38+i*1.4);c.quadraticCurveTo(x+side*5,y+16,x+2,y+3);c.fillStyle='#7e1f3945';c.fill();}
      bat(c,x,y,size*.84,warning?flap*p:reform?flap*p:flap,bank,Math.min(1,p*2)*(warning?.88:1));
    }c.restore();
  }
  function contact(c,e){for(const f of e.effects){if(f.kind!=='hunt'||f.style!=='mark'||f.age>.35)continue;const p=clamp(f.age/.35),squeeze=1-Math.exp(-p*10);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-p)**1.3;
    for(const side of [-1,1]){c.save();c.scale(1,side);const reach=42-squeeze*16;c.beginPath();c.moveTo(-reach,-23);c.quadraticCurveTo(2,-33,22,-7);c.quadraticCurveTo(2,-15,-reach,-23);c.fillStyle='#b32c4c';c.fill();c.strokeStyle='#ff9b9d';c.lineWidth=1.2;c.stroke();c.restore();}
    if(f.age<.065){c.fillStyle='#ffddd2';c.beginPath();c.moveTo(-7,0);c.lineTo(-1,-13);c.lineTo(4,-3);c.lineTo(14,0);c.lineTo(3,4);c.lineTo(-2,12);c.closePath();c.fill();}c.restore();}}
  const draw=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){const h=b.hunt,active=b.hp>0&&h&&h.phase!=='idle';this.ctx.save();if(active&&h.phase==='reform')this.ctx.globalAlpha*=clamp((e.time-h.started)/.22);if(active&&h.phase==='warning')this.ctx.globalAlpha*=1-.75*clamp((e.time-h.started)/.24);draw.call(this,b,e);this.ctx.restore();if(active)swarm(this.ctx,b,e);};
  const frame=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e,...args){const result=frame.call(this,e,...args);this.ctx.save();contact(this.ctx,e);this.ctx.restore();return result;};
})(typeof window!=='undefined'?window:globalThis);
