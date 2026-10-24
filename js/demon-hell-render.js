(function(root){
 'use strict';const G=root.OrbDuel,H=G.DemonHell,V=G.DemonView,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const R=G.DemonHellView={
  hand(c,x,y,a,grip,size,alpha=1){c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);c.globalAlpha*=alpha;
   // Three scythe-like digits and an opposed thumb: broad negative spaces, one living silhouette.
   for(const [ry,kx,ky,tx,ty]of [[-12,22,-31,44,-18],[-1,32,-12,51,4],[10,22,24,38,30]]){const ex=tx+(25-tx)*grip,ey=ty+(ry*.5-ty)*grip,jy=ky*(1-grip*.22);c.fillStyle='#7b2035';c.beginPath();c.moveTo(-5,ry-4);c.bezierCurveTo(8,ry-8,kx-12,jy-6,kx,jy-4);c.quadraticCurveTo(kx+9,jy-3,ex,ey);c.quadraticCurveTo(ex-3,ey+6,ex-8,ey+5);c.bezierCurveTo(kx-4,jy+3,9,ry+6,-8,ry+4);c.closePath();c.fill();
    c.fillStyle='#bc4450';c.beginPath();c.moveTo(-2,ry-3);c.quadraticCurveTo(kx-10,jy-6,kx+1,jy-2);c.quadraticCurveTo(kx-8,jy-2,2,ry);c.closePath();c.fill();
    c.fillStyle='#190e1b';c.beginPath();c.moveTo(ex-10,ey-3);c.quadraticCurveTo(ex+13,ey-8,ex+3,ey+14);c.quadraticCurveTo(ex+4,ey+3,ex-9,ey+3);c.closePath();c.fill();c.strokeStyle='#d48a78';c.lineWidth=.8;c.beginPath();c.moveTo(ex-5,ey-3);c.quadraticCurveTo(ex+9,ey-5,ex+3,ey+14);c.stroke();}
   c.fillStyle='#59162b';c.beginPath();c.moveTo(-26,-7);c.quadraticCurveTo(-18,-9,-12,-17);c.bezierCurveTo(4,-22,14,-7,7,9);c.quadraticCurveTo(0,23,-14,15);c.quadraticCurveTo(-20,8,-26,7);c.closePath();c.fill();c.fillStyle='#a12f42';c.beginPath();c.moveTo(-23,-5);c.quadraticCurveTo(-11,-16,0,-12);c.quadraticCurveTo(-1,-3,-14,4);c.lineTo(-22,3);c.closePath();c.fill();
   const ex=22-grip*11,ey=29-grip*14;c.fillStyle='#92283e';c.beginPath();c.moveTo(-14,9);c.quadraticCurveTo(-1,31,ex,ey);c.quadraticCurveTo(ex+9,ey-8,ex-2,ey-14);c.quadraticCurveTo(ex+2,ey-4,ex-6,ey-2);c.quadraticCurveTo(0,ey,-6,9);c.closePath();c.fill();c.fillStyle='#1b101c';c.beginPath();c.moveTo(ex-3,ey-12);c.quadraticCurveTo(ex+9,ey-14,ex+3,ey-1);c.quadraticCurveTo(ex+1,ey-8,ex-3,ey-7);c.fill();c.restore();
  },
  rake(c,b,s,pose){const sign=s.side?1:-1,u=pose.u,from=Math.max(0,u-.33);c.save();c.translate(b.x,b.y);for(let i=0;i<3;i++){const radius=63+i*6,a=s.angle+sign*(.85-1.7*from),z=s.angle+sign*(.85-1.7*u),mid=(a+z)/2,w=(i===1?2.4:1.6)*(1-u*.45);c.globalAlpha=.68;c.fillStyle=i===1?'#e77b77':'#a43c54';c.beginPath();c.moveTo(Math.cos(a)*radius,Math.sin(a)*radius);c.quadraticCurveTo(Math.cos(mid)*(radius+3),Math.sin(mid)*(radius+3),Math.cos(z)*radius,Math.sin(z)*radius);c.lineTo(Math.cos(z)*(radius-w),Math.sin(z)*(radius-w));c.quadraticCurveTo(Math.cos(mid)*(radius-w),Math.sin(mid)*(radius-w),Math.cos(a)*radius,Math.sin(a)*radius);c.closePath();c.fill();}c.restore();
  },
  wings(c,b,e,p){const flap=Math.sin(e.time*5)*.15;for(const side of [-1,1]){c.save();c.translate(b.x+side*12,b.y-8);c.scale(side,1);const reach=60*p,tip=-34*p+Math.sin(e.time*5)*8*p;
   c.fillStyle='#411225';c.beginPath();c.moveTo(0,1);c.bezierCurveTo(14,-22*p,reach*.72,tip-12*p,reach,tip);c.quadraticCurveTo(reach*.73,tip+12*p,reach*.97,14*p);c.quadraticCurveTo(reach*.59,-1,reach*.64,28*p);c.quadraticCurveTo(reach*.27,9*p,reach*.22,33*p);c.quadraticCurveTo(10,12,0,1);c.fill();
   c.fillStyle='#7c2338';c.beginPath();c.moveTo(1,0);c.quadraticCurveTo(19,-21*p,reach-3,tip+1);c.quadraticCurveTo(reach*.63,tip+6,reach*.64,9*p);c.quadraticCurveTo(reach*.3,0,reach*.22,18*p);c.closePath();c.fill();
   c.strokeStyle='#bb5360';c.lineWidth=1.3;c.beginPath();c.moveTo(0,1);c.quadraticCurveTo(18,-24*p,reach,tip);c.moveTo(0,1);c.quadraticCurveTo(reach*.66,-9*p,reach*.97,14*p);c.moveTo(0,1);c.quadraticCurveTo(reach*.38,-7*p,reach*.64,28*p);c.stroke();c.restore();}}
  ,horns(c,b,p){for(const side of [-1,1]){c.save();c.translate(b.x+side*14,b.y-15);c.scale(side,1);c.fillStyle='#4c1525';c.beginPath();c.moveTo(-4,4);c.bezierCurveTo(6,-1,22*p,-11*p,12*p,-34*p);c.bezierCurveTo(11*p,-15*p,4,-11*p,-5,-4);c.closePath();c.fill();c.strokeStyle='#dc8b71';c.lineWidth=1.1;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(11*p,-8*p,15*p,-20*p,12*p,-34*p);c.stroke();c.restore();}}
  ,draw(r,e,front){const c=r.ctx;for(const b of e.balls){const h=b.demon?.hell;if(!h||h.phase==='idle'||b.hp<=0)continue;const age=e.time-h.started,enter=h.phase==='enter',exit=h.phase==='exit',p=enter?clamp((age-.25)/.65):exit?1-clamp(age/b.def.hellExit):1;
    c.save();if(!front){if(enter||h.phase==='active'&&age<.45){const a=enter?1:1-age/.45;c.globalAlpha=a*.8;V.pentagram(c,b.x,b.y,43,enter?clamp(age/.55):1);c.globalAlpha=1;}
      this.wings(c,b,e,p);
      if(enter)for(let i=0;i<5;i++){const u=clamp((age-i*.045)/.65),a=i*Math.PI*2/5+age*.8,rad=78*(1-u);V.flame(c,b.x+Math.cos(a)*rad,b.y+Math.sin(a)*rad,0,.45*(1-u)+.13,e.time,true,1-u*.45);}
      if(p>.2)for(const side of [-1,1])V.flame(c,b.x+side*19,b.y+14,side*.2,.3*p,e.time,true,.65*p);
    }else{this.horns(c,b,p);if(p>.35){const target=G.World.targetFor(b,e),aim=target?Math.atan2(target.y-b.y,target.x-b.x):Math.atan2(b.vy,b.vx);for(let side=0;side<2;side++){const sign=side?1:-1,swing=h.swing?.side===side?H.pose(b,e):null,guard=h.guard?.side===side?h.guard:null;let x=b.x+Math.cos(aim)*25-Math.sin(aim)*sign*43,y=b.y+Math.sin(aim)*25+Math.cos(aim)*sign*43+Math.sin(e.time*3+side*2)*3,a=aim+sign*.18,grip=.16,size=.55,alpha=.46;
        if(swing){const action=h.swing,age=e.time-action.started,wind=b.def.hellWindup,cut=b.def.hellSweep,recover=b.def.hellRecovery,ss=action.side?1:-1,aim=action.angle,ix=b.x+Math.cos(aim)*25-Math.sin(aim)*ss*43,iy=b.y+Math.sin(aim)*25+Math.cos(aim)*ss*43;alpha=1;
          if(age<wind){const q=clamp(age/wind),end=aim+ss*.85,ex=b.x+Math.cos(end)*65,ey=b.y+Math.sin(end)*65,cx=b.x-Math.cos(aim)*5-Math.sin(aim)*ss*64,cy=b.y-Math.sin(aim)*5+Math.cos(aim)*ss*64;x=(1-q)**2*ix+2*(1-q)*q*cx+q*q*ex;y=(1-q)**2*iy+2*(1-q)*q*cy+q*q*ey;a=aim+ss*(.18+.67*q+.3*Math.sin(Math.PI*q));grip=.1*(1-q);size=.55+.25*q;}
          else if(age<=wind+cut){x=swing.x;y=swing.y;a=swing.angle+ss*.15*Math.sin(swing.u*Math.PI);grip=.08+.22*swing.u;size=.8;}
          else{const q=clamp((age-wind-cut)/recover),ease=q*q*(3-2*q),end=aim-ss*.85;x=b.x+Math.cos(end)*65*(1-ease)+(ix-b.x)*ease;y=b.y+Math.sin(end)*65*(1-ease)+(iy-b.y)*ease;a=end+(aim+ss*.18-end)*ease;grip=.3*(1-ease)+.16*ease+.32*Math.sin(Math.PI*q);size=.8-.25*ease;alpha=1-.54*ease;}
        }
        if(guard){const q=clamp((e.time-guard.started)/.28),reach=guard.spent?(e.time<guard.counterAt?35:e.time<=guard.counterAt+.12?35+37*clamp((e.time-guard.counterAt)/.12):72-37*clamp((e.time-guard.counterAt-.12)/.06)):35;x=b.x+Math.cos(guard.angle)*reach;y=b.y+Math.sin(guard.angle)*reach;a=guard.angle;grip=guard.spent?.85:.3;size=.85;alpha=1;}
        if(exit){x+=sign*age*20;for(let i=0;i<3;i++)V.flame(c,x+(i-1)*12,y-age*25-i*4,0,.55*(1-p),e.time,true,p);}
        c.save();c.beginPath();c.rect(-1000,-1000,2000,2000);c.moveTo(b.x+b.radius-2,b.y);c.arc(b.x,b.y,b.radius-2,0,Math.PI*2);c.clip('evenodd');c.globalAlpha=exit?p:1;c.translate(x-Math.cos(a)*12*size,y-Math.sin(a)*12*size);c.rotate(a);if(enter){c.beginPath();c.rect(-29*size,-45*size,100*size*clamp((p-.35)/.65),90*size);c.clip();}this.hand(c,0,0,0,grip,size,alpha);c.restore();
        if(swing?.active)this.rake(c,b,h.swing,swing);
      }}}
    c.restore();}
   if(front)for(const f of e.effects){if(f.kind!=='demonSoul'||f.style!=='hellCut')continue;const u=f.age/f.life;c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);c.globalAlpha=1-u;for(let i=-1;i<=1;i++){c.strokeStyle=i?'#b44552':'#ffd1a6';c.lineWidth=i?2:1.3;c.beginPath();c.moveTo(-18-u*10,i*7-15);c.quadraticCurveTo(8,i*7,12+u*12,i*7+15);c.stroke();}c.restore();}
  }
 };
 const behind=V.behind;V.behind=function(r,e){R.draw(r,e,false);behind.call(this,r,e);};const front=V.front;V.front=function(r,e){front.call(this,r,e);R.draw(r,e,true);};
})(typeof window!=='undefined'?window:globalThis);
