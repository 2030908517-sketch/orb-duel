(function(root){
  'use strict';const G=root.OrbDuel,clamp=v=>Math.max(0,Math.min(1,v));
  // Wing joints articulate; the silhouette is not a uniformly scaled icon.
  function bat(c,x,y,size,flap,angle,alpha){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.globalAlpha*=alpha;
    for(const side of [-1,1]){c.save();c.scale(side,1);const tipX=27-flap*6,tipY=-11-flap*12,elbowY=-5-flap*5;
      c.beginPath();c.moveTo(2,-1);c.quadraticCurveTo(8,elbowY,13,elbowY-2);c.lineTo(tipX,tipY);c.lineTo(tipX-6,tipY+8);c.quadraticCurveTo(16,-2,18,5);c.quadraticCurveTo(11,-1,11,10);c.quadraticCurveTo(7,4,3,10);c.lineTo(0,5);c.closePath();c.fillStyle='#711a33';c.fill();
      // A single leading bone and two inner fingers preserve large concave membranes.
      c.beginPath();c.moveTo(3,-1);c.quadraticCurveTo(8,elbowY,13,elbowY-2);c.lineTo(tipX,tipY);c.strokeStyle='#dc6875';c.lineWidth=1.05;c.stroke();
      c.beginPath();c.moveTo(13,elbowY-2);c.quadraticCurveTo(14,-1,18,5);c.moveTo(11,elbowY);c.quadraticCurveTo(9,2,11,10);c.strokeStyle='#3c1024';c.lineWidth=1.2;c.stroke();
      c.beginPath();c.moveTo(4,0);c.lineTo(13,elbowY);c.lineTo(10,5);c.lineTo(5,3);c.closePath();c.fillStyle='#a82b48';c.fill();c.restore();}
    // Prominent ears, head, short mammal torso and central tail; no four petal lobes.
    c.beginPath();c.moveTo(-3,-6);c.lineTo(-5,-14);c.lineTo(-.7,-9);c.lineTo(.7,-9);c.lineTo(5,-14);c.lineTo(3,-6);c.quadraticCurveTo(5,-1,3,5);c.lineTo(0,9);c.lineTo(-3,5);c.quadraticCurveTo(-5,-1,-3,-6);c.closePath();c.fillStyle='#290e20';c.fill();
    c.beginPath();c.moveTo(-4,-5);c.lineTo(-6,-13);c.lineTo(-1,-8);c.lineTo(1,-8);c.lineTo(6,-13);c.lineTo(4,-5);c.quadraticCurveTo(5,0,0,2);c.quadraticCurveTo(-5,0,-4,-5);c.fillStyle='#a43750';c.fill();c.beginPath();c.moveTo(-1,-1);c.lineTo(2,0);c.lineTo(0,6);c.lineTo(-2,2);c.closePath();c.fillStyle='#7d263e';c.fill();c.fillStyle='#ffc6b7';c.fillRect(-2.7,-6,1.4,1);c.fillRect(1.3,-6,1.4,1);c.restore();
  }
  G.VampireHuntView={bat};
  function swarm(c,b,e){const h=b.hunt,age=e.time-h.started,p=h.phase==='warning'?clamp(age/.24):h.phase==='reform'?1-clamp(age/.22):1;
    c.save();c.translate(b.x,b.y);const heading=(h.phase==='warning'?h.aim:h.flightAim??h.aim)+Math.PI/2;c.rotate(heading);const spread=h.phase==='warning'?28*p:10+21*p;
    const formation=[[0,-18,.67],[-18,-3,.55],[20,0,.6],[-30,18,.5],[0,15,.66],[28,20,.5],[-18,37,.57],[16,40,.54],[0,57,.52]];
    for(let i=formation.length-1;i>=0;i--){const [xx,yy,size]=formation[i],side=xx<0?-1:1,local=(i+1)*2.4,flap=(Math.sin(age*35+i*2.1)+1)/2,x=xx*p*.96,y=yy*p*.88;
      // Short tapered wake makes direction readable without replacing the body's trail.
      if(h.phase==='flight'){c.beginPath();c.moveTo(x-2,y+1);c.quadraticCurveTo(x+side*4,y+spread,x,y+spread+local);c.lineTo(x+2,y+1);c.fillStyle='#7e1f3938';c.fill();}
      bat(c,x,y,size,flap,-heading+Math.sin(i*3.1)*.14,p*(h.phase==='warning'?.75:1));
    }c.restore();
  }
  function contact(c,e){for(const f of e.effects){if(f.kind!=='hunt'||f.style!=='mark'||f.age>.35)continue;const p=clamp(f.age/.35),squeeze=1-Math.exp(-p*10);c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=(1-p)**1.3;
    for(const side of [-1,1]){c.save();c.scale(1,side);const reach=42-squeeze*16;c.beginPath();c.moveTo(-reach,-23);c.quadraticCurveTo(2,-33,22,-7);c.quadraticCurveTo(2,-15,-reach,-23);c.fillStyle='#b32c4c';c.fill();c.strokeStyle='#ff9b9d';c.lineWidth=1.2;c.stroke();c.restore();}
    if(f.age<.065){c.fillStyle='#ffddd2';c.beginPath();c.moveTo(-7,0);c.lineTo(-1,-13);c.lineTo(4,-3);c.lineTo(14,0);c.lineTo(3,4);c.lineTo(-2,12);c.closePath();c.fill();}c.restore();}}
  const draw=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){const h=b.hunt,active=b.hp>0&&h&&h.phase!=='idle';this.ctx.save();if(active&&h.phase==='reform')this.ctx.globalAlpha*=clamp((e.time-h.started)/.22);draw.call(this,b,e);this.ctx.restore();if(active)swarm(this.ctx,b,e);};
  const frame=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e,...args){const result=frame.call(this,e,...args);this.ctx.save();contact(this.ctx,e);this.ctx.restore();return result;};
})(typeof window!=='undefined'?window:globalThis);
