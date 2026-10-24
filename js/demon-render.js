(function(root){
  'use strict';const G=root.OrbDuel,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  G.DemonView={
    nailScale:.85,soulNailScale:.60,
    arm(c,x,y,tx,ty,angle,size=1){const length=(tx-x)*Math.cos(angle)+(ty-y)*Math.sin(angle)-24*size;if(length<=0)return;
      c.save();c.translate(x,y);c.rotate(angle);const w=8*size,bend=Math.min(10,length*.08),bulge=Math.min(22*size,12*size+length*.04);
      c.fillStyle='#39101e';c.beginPath();c.moveTo(-6,-16*size);c.bezierCurveTo(length*.23,-bulge-bend,length*.48,-bulge,length*.67,-12*size);c.quadraticCurveTo(length*.86,-w,length,-w);c.lineTo(length,w);c.bezierCurveTo(length*.7,w+2,length*.6,bulge+bend,length*.34,bulge);c.quadraticCurveTo(length*.12,bulge-2,-6,16*size);c.closePath();c.fill();
      c.fillStyle='#8d2836';c.beginPath();c.moveTo(-5,-13*size);c.bezierCurveTo(length*.22,-bulge+1,length*.47,-bulge+3,length*.66,-9*size);c.quadraticCurveTo(length*.83,-4,length,-6*size);c.lineTo(length,-1);c.bezierCurveTo(length*.66,-3,length*.48,-8,length*.29,-9*size);c.quadraticCurveTo(length*.13,-10*size,-5,-5*size);c.closePath();c.fill();
      c.fillStyle='#651b2c';c.beginPath();c.moveTo(-5,13*size);c.quadraticCurveTo(length*.32,bulge+1,length*.55,10*size);c.quadraticCurveTo(length*.77,3,length,5*size);c.lineTo(length,w);c.bezierCurveTo(length*.62,w+3,length*.45,bulge+2,-5,16*size);c.closePath();c.fill();
      c.strokeStyle='#b8474b';c.lineWidth=1.2;c.beginPath();c.moveTo(length*.18,-12*size);c.bezierCurveTo(length*.37,-15*size,length*.6,-5*size,length-3,-4*size);c.moveTo(length*.51,11*size);c.quadraticCurveTo(length*.76,2,length-2,4*size);c.stroke();
      c.strokeStyle='#240f1b';c.lineWidth=1.7;for(let i=0;i<3;i++){const k=.3+i*.12,xx=length*k;c.beginPath();c.moveTo(xx,-bulge+4+i);c.quadraticCurveTo(xx+4,-bulge+9,xx+1,-bulge+12);c.stroke();}c.restore();
    },
    icon(c,x,y){c.beginPath();c.moveTo(x-11,y-12);c.quadraticCurveTo(x-13,y+2,x-7,y+4);c.lineTo(x-5,y-3);c.moveTo(x+11,y-12);c.quadraticCurveTo(x+13,y+2,x+7,y+4);c.lineTo(x+5,y-3);c.stroke();c.beginPath();c.moveTo(x-6,y+5);c.lineTo(x,y+11);c.lineTo(x+6,y+5);c.stroke();},
    chain(c,x,y,tx,ty,alpha=1,hot=false){const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;c.save();c.globalAlpha*=alpha;c.strokeStyle='#482127';c.lineWidth=5;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.strokeStyle=hot?'#ff896c':'#f39b82';c.lineWidth=hot?1.5:1.15;const count=Math.ceil(d/10);for(let i=0;i<count;i++){const u=(i+.5)/count;c.save();c.translate(x+dx*u,y+dy*u);c.rotate(Math.atan2(ny,nx));c.beginPath();c.ellipse(0,0,4.1,i%2?1.2:2.4,0,0,Math.PI*2);c.stroke();c.restore();}c.restore();},
    portal(c,x,y,angle,scale,color,gate){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);const g=c.createRadialGradient(0,0,3,0,0,31);g.addColorStop(0,'#0b060d');g.addColorStop(.6,'#672231');g.addColorStop(1,color+'00');c.fillStyle=g;c.beginPath();c.ellipse(0,0,gate?16:25,gate?31:12,0,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(0,0,gate?9:20,gate?25:7,0,0,Math.PI*2);c.stroke();c.strokeStyle='#ffd1a6';c.lineWidth=1;c.beginPath();c.moveTo(-5,-12);c.lineTo(4,-6);c.lineTo(-3,2);c.lineTo(5,12);c.stroke();c.restore();},
    claw(c,x,y,angle,closed,color,layer='all'){c.save();c.translate(x,y);c.rotate(angle);const grip=clamp(closed,0,1);
      // Living palm, sinews and curved skin folds; no plate outlines or polygon knuckles.
      if(layer!=='front'){c.fillStyle='#4b1527';c.beginPath();c.moveTo(-28,-8);c.bezierCurveTo(-20,-9,-20,-18,-7,-18);c.bezierCurveTo(6,-20,15,-10,13,1);c.bezierCurveTo(15,14,1,21,-11,15);c.quadraticCurveTo(-20,8,-28,8);c.closePath();c.fill();
        c.fillStyle='#a0303d';c.beginPath();c.moveTo(-26,-6);c.bezierCurveTo(-16,-6,-14,-15,-7,-14);c.quadraticCurveTo(3,-15,7,-7);c.bezierCurveTo(-2,-9,-3,1,-12,5);c.quadraticCurveTo(-18,2,-26,4);c.closePath();c.fill();
        c.strokeStyle='#ce5b59';c.lineWidth=1;c.beginPath();c.moveTo(-21,-4);c.quadraticCurveTo(-8,-6,-4,-12);c.moveTo(-17,3);c.quadraticCurveTo(-6,3,0,-3);c.stroke();}
      if(layer!=='back'){
        const fingers=[[-6,-13,18,-33,41,-24,23,-8],[2,-7,30,-23,47,-6,24,-2],[4,3,29,13,42,19,24,6],[-4,11,16,27,30,31,17,15]];
        for(let i=3;i>=0;i--){const[rx,ry,kx,ky,tx,ty,cx,cy]=fingers[i],ex=tx+(cx-tx)*grip,ey=ty+(cy-ty)*grip,jx=kx*(1-grip*.18),jy=ky*(1-grip*.36),w=i===3?3.1:4;
          c.fillStyle=i%2?'#701e30':'#8c2837';c.beginPath();c.moveTo(rx-3,ry-w);c.bezierCurveTo(rx+8,ry-w-2,jx-8,jy-w-1,jx,jy-w);c.quadraticCurveTo(jx+7,jy-w,ex,ey);c.quadraticCurveTo(ex-3,ey+5,ex-7,ey+5);c.bezierCurveTo(jx+1,jy+w,jx-4,jy+w+2,rx-4,ry+w);c.quadraticCurveTo(rx-8,ry,rx-3,ry-w);c.fill();
          c.strokeStyle='#bc4b4c';c.lineWidth=1.2;c.beginPath();c.moveTo(rx+1,ry-w+1);c.quadraticCurveTo(jx-7,jy-w,jx,jy-w+1);c.stroke();
          c.strokeStyle='#3b1424';c.lineWidth=1.5;c.beginPath();c.moveTo(jx-3,jy+1);c.quadraticCurveTo(jx+1,jy-3,jx+4,jy);c.moveTo(jx-5,jy+4);c.quadraticCurveTo(jx,jy+1,jx+3,jy+3);c.stroke();
          c.fillStyle='#1e101c';c.beginPath();c.moveTo(ex-9,ey-4);c.quadraticCurveTo(ex+8,ey-7,ex+3,ey+9);c.quadraticCurveTo(ex+1,ey+2,ex-8,ey+2);c.closePath();c.fill();c.strokeStyle='#df9676';c.lineWidth=.9;c.beginPath();c.moveTo(ex-6,ey-3);c.quadraticCurveTo(ex+5,ey-5,ex+3,ey+9);c.stroke();
        }
        const xx=27-grip*11,yy=26-grip*13;c.fillStyle='#922c3a';c.beginPath();c.moveTo(-15,10);c.bezierCurveTo(-9,23,8,30,xx,yy);c.quadraticCurveTo(xx+9,yy-9,xx-3,yy-16);c.quadraticCurveTo(xx+2,yy-5,xx-5,yy-3);c.quadraticCurveTo(2,yy+1,-6,8);c.closePath();c.fill();c.fillStyle='#21101c';c.beginPath();c.moveTo(xx-4,yy-12);c.quadraticCurveTo(xx+7,yy-14,xx+4,yy-3);c.quadraticCurveTo(xx+1,yy-8,xx-4,yy-8);c.fill();c.strokeStyle='#d36e5f';c.lineWidth=1;c.beginPath();c.moveTo(-10,13);c.quadraticCurveTo(2,23,xx-3,yy-1);c.stroke();
      }c.restore();
    },
    rope(c,s,t,e){const cinema=e.demonCinematic?.soul===s.id?e.demonCinematic:null;
      if(cinema&&cinema.age>.6){const k=clamp((cinema.age-.6)/.52,0,1),dx=s.x-t.x,dy=s.y-t.y;c.save();for(const [a,b]of [[0,.5*(1-k)],[.5+.5*k,1]]){if(b-a<.001)continue;c.strokeStyle='#9b314c';c.lineWidth=2.5;c.beginPath();c.moveTo(t.x+dx*a,t.y+dy*a);c.lineTo(t.x+dx*b,t.y+dy*b);c.stroke();const f=a===0?b:a;c.fillStyle='#ffdd9e';c.beginPath();c.arc(t.x+dx*f,t.y+dy*f,2.2*(1-k)+.5,0,Math.PI*2);c.fill();}c.restore();return;}
      const pulse=Math.max(0,1-(e.time-(s.pulseAt??-9))/.4),dx=s.x-t.x,dy=s.y-t.y,d=Math.hypot(dx,dy)||1;c.lineCap='round';
      for(const [width,color]of [[4,'#321724'],[1.5,'#d05f70'],[.5,'#ffc1ac']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(t.x,t.y);c.lineTo(s.x,s.y);c.stroke();}
      // Highlights move ALONG the straight segment; neither collision nor rope geometry wobbles.
      if(pulse>0){const u=1-pulse;c.strokeStyle='#ffe7ce';c.lineWidth=2.5;c.beginPath();c.moveTo(t.x+dx*Math.max(0,u-.12),t.y+dy*Math.max(0,u-.12));c.lineTo(t.x+dx*Math.min(1,u+.12),t.y+dy*Math.min(1,u+.12));c.stroke();}
      c.strokeStyle='#c56473';c.lineWidth=1;for(let i=1;i<d/12;i++){const u=i*12/d,x=t.x+dx*u,y=t.y+dy*u;c.beginPath();c.moveTo(x-dy/d*2,y+dx/d*2);c.lineTo(x+dy/d*2,y-dx/d*2);c.stroke();}
    },
    flame(c,x,y,angle,size,time,red=false,alpha=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);c.globalAlpha*=alpha;
      const bend=Math.sin(time*8)*2;c.fillStyle=red?'#501727':'#20394a';c.beginPath();c.moveTo(0,10);c.bezierCurveTo(-12,8,-12,-1,-7,-6);c.quadraticCurveTo(-7,-1,-4,-3);c.quadraticCurveTo(-9,-14,bend-2,-22);c.quadraticCurveTo(-1,-11,4,-11);c.quadraticCurveTo(3,-4,8,-7);c.bezierCurveTo(12,1,9,10,0,10);c.fill();
      c.fillStyle=red?'#e45c68':'#87cddc';c.beginPath();c.moveTo(0,8);c.bezierCurveTo(-8,7,-9,1,-5,-3);c.quadraticCurveTo(-3,1,-1,-1);c.quadraticCurveTo(-4,-9,bend,-15);c.quadraticCurveTo(0,-7,4,-6);c.bezierCurveTo(3,-1,9,4,0,8);c.fill();
      c.fillStyle=red?'#ffd0a9':'#def7ed';c.beginPath();c.moveTo(0,6);c.quadraticCurveTo(-5,3,0,-5);c.quadraticCurveTo(1,0,4,0);c.quadraticCurveTo(4,4,0,6);c.fill();
      for(let i=0;i<3;i++){const q=(time*(.7+i*.1)+i*.37)%1;c.globalAlpha=alpha*(1-q)*.55;c.fillStyle=red?'#ee8c86':'#9edce4';c.beginPath();c.moveTo(bend+(i-1)*6,-10-q*13);c.lineTo(bend+(i-1)*6-1.5,-14-q*13);c.lineTo(bend+(i-1)*6+2,-12-q*13);c.fill();}c.restore();
    },
    seal(c,x,y,r,time,alpha=1){c.save();c.translate(x,y);c.rotate(time*.22);c.globalAlpha*=alpha;c.lineWidth=1.3;c.strokeStyle='#b95a68';
      for(let i=0;i<8;i++){const a=i*Math.PI/4;c.save();c.rotate(a);c.beginPath();c.moveTo(r-4,-3);c.lineTo(r+2,0);c.lineTo(r-3,5);c.moveTo(r-1,-7);c.lineTo(r+5,-4);c.stroke();c.restore();}c.restore();
    },
    gate(c,x,y,angle,progress,time,second=false,large=false,infernal=false){c.save();c.translate(x,y);c.rotate(angle);const h=(large?55:32)*(infernal?1.12:1),w=(large?22:12)*(infernal?1.1:1)*Math.sin(clamp(progress,0,1)*Math.PI/2),edge=infernal?'#ff9b79':second?'#f1ba9d':'#e57a80';
      c.fillStyle=infernal?'#2c0c1b':'#100b17';c.beginPath();c.moveTo(-w,-h*.75);c.quadraticCurveTo(-w*1.3,-h,0,-h-5);c.quadraticCurveTo(w*1.3,-h,w,-h*.75);c.lineTo(w,h*.7);c.lineTo(0,h+6);c.lineTo(-w,h*.7);c.closePath();c.fill();c.strokeStyle='#632b40';c.lineWidth=6;c.stroke();c.strokeStyle=edge;c.lineWidth=1.3;c.stroke();
      for(const side of [-1,1]){c.fillStyle='#5f253b';c.beginPath();c.moveTo(side*w,-h*.65);c.lineTo(side*(w+10),-h-14);c.lineTo(side*(w+7),-h*.35);c.lineTo(side*(w+3),h*.7);c.lineTo(side*w,h*.4);c.closePath();c.fill();c.strokeStyle=edge;c.lineWidth=1;c.beginPath();c.moveTo(side*(w+10),-h-14);c.lineTo(side*(w+7),-h*.35);c.lineTo(side*(w+3),h*.7);c.stroke();for(let i=0;i<4;i++){const yy=-h*.4+i*h*.28;c.strokeStyle=i%2?'#e39a8e':'#a9536a';c.beginPath();c.moveTo(side*(w+2),yy);c.lineTo(side*(w+5),yy+3);c.lineTo(side*(w+2),yy+7);c.stroke();}}
      c.globalAlpha*=.5;for(let i=0;i<3;i++){const yy=(time*.7+i*.33)%1*h*1.2-h*.6;c.strokeStyle='#d46278';c.lineWidth=1;c.beginPath();c.moveTo(-w*.5,yy+5);c.lineTo(0,yy-4);c.lineTo(w*.4,yy);c.stroke();}c.restore();
    },
    orb(r,t,x,y,size,e,red=false,alpha=.68){const c=r.ctx,q=typeof red==='number'?clamp(red,0,1):red?1:0,mix=(a,b)=>{const v=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-q)+parseInt(b.slice(i,i+2),16)*q).toString(16).padStart(2,'0'));return '#'+v.join('');};c.save();c.translate(x,y);c.scale(size/23,size/23);c.globalAlpha*=alpha;
      const body={...t,x:0,y:0,radius:23,hp:1,shield:0,flash:0,hitVisual:null,def:{...t.def,color:mix(t.def.color,'#e86a65')},awakening:{...t.awakening,active:false,dashUntil:0},ghost:{...t.ghost,phase:'solid'},temporal:{...t.temporal,rate:1},hunt:null,arcana:null,stellar:null,charge:null};r.drawBall(body,e);c.restore();
    },
    soul(r,s,t,e){const c=r.ctx,pulse=Math.max(0,1-(e.time-(s.pulseAt??-10))/.4),pull=s.extraction,age=pull?e.time-pull.started:Infinity,holding=pull&&age<pull.duration+.12;let hand;
      if(holding){const a=Math.atan2(s.y-pull.portalY,s.x-pull.portalX),fade=clamp((pull.duration+.12-age)/.12,0,1),grip=clamp(age/.065,0,1)*(1-clamp((age-pull.duration)/.12,0,1));hand={x:s.x-Math.cos(a)*12,y:s.y-Math.sin(a)*12,a,fade,grip};c.save();c.globalAlpha*=fade;this.arm(c,pull.portalX,pull.portalY,hand.x,hand.y,a);this.claw(c,hand.x,hand.y,a,grip,'#e86a65','back');c.restore();}
      c.save();c.translate(s.x,s.y);if(holding){const a=Math.atan2(pull.dy,pull.dx);c.rotate(a);c.scale(1+Math.sin(clamp(age/pull.duration,0,1)*Math.PI)*.3,1-Math.sin(clamp(age/pull.duration,0,1)*Math.PI)*.18);c.rotate(-a);}c.scale(1+pulse*.25,1-pulse*.18);const film=e.demonCinematic?.soul===s.id?clamp((e.demonCinematic.age-1.12)/.88,0,1):0;if(!e.effects.some(f=>f.kind==='demonSoul'&&f.style==='tug'&&f.soulId===s.id&&f.age<f.life))this.orb(r,t,0,0,s.radius+film*4,e,film,.43+film*.5);c.restore();
      if(hand){c.save();c.globalAlpha*=hand.fade;this.claw(c,hand.x,hand.y,hand.a,hand.grip,'#e86a65','front');this.gate(c,pull.portalX,pull.portalY,pull.portalAngle??hand.a,1,e.time,false,false);c.restore();}
      c.save();
      if(s.bound&&s.binding){const hot=!!G.DemonHell?.active(e.balls.find(b=>b.id===s.owner),e);for(const sign of [-1,1])this.chain(c,s.anchorX+sign*25,s.anchorY-20,s.x+sign*6,s.y+9,hot?1:.8,hot);c.strokeStyle=hot?'#ff896c':'#e4a2a6';c.lineWidth=1.5;c.beginPath();c.ellipse(s.x,s.y,19,7,-.35,0,Math.PI*2);c.stroke();this.seal(c,s.anchorX,s.anchorY,25,e.time,.6);}c.restore();
    },
    pentagram(c,x,y,r,p){c.save();c.translate(x,y);c.strokeStyle='#9f3a52';c.lineWidth=3;c.beginPath();c.arc(0,0,r,0,Math.PI*2*p);c.stroke();c.strokeStyle='#ffb19e';c.lineWidth=1.2;c.beginPath();for(let i=0;i<=5;i++){const a=Math.PI/2+(i*2%5)*Math.PI*2/5,xx=Math.cos(a)*r*.83,yy=Math.sin(a)*r*.83;if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.stroke();c.strokeStyle='#6b2b3d';c.lineWidth=1;c.beginPath();c.arc(0,0,r+7,.3,Math.PI*1.8);c.stroke();for(let i=0;i<5;i++){const a=Math.PI/2+i*Math.PI*2/5;c.save();c.translate(Math.cos(a)*(r+15),Math.sin(a)*(r+15));c.rotate(a-Math.PI/2);c.beginPath();c.moveTo(-2,-4);c.lineTo(2,0);c.lineTo(-1,4);c.moveTo(2,0);c.lineTo(4,-2);c.stroke();c.restore();}c.restore();
    },
    spike(c,x,y,a,size){c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);
      // Forged execution nail: a broad hammer head, straight shank and short penetrating point.
      c.fillStyle='#21121e';c.strokeStyle='#bb6571';c.lineWidth=1.2;c.lineJoin='miter';
      c.beginPath();c.moveTo(-31,-5);c.lineTo(23,-3);c.lineTo(38,0);c.lineTo(23,3);c.lineTo(-31,5);c.closePath();c.fill();c.stroke();
      c.fillStyle='#8f4658';c.beginPath();c.moveTo(-31,-5);c.lineTo(23,-3);c.lineTo(38,0);c.lineTo(-31,0);c.closePath();c.fill();
      c.fillStyle='#3d2431';c.beginPath();c.moveTo(-43,-11);c.lineTo(-35,-16);c.lineTo(-27,-11);c.lineTo(-27,11);c.lineTo(-35,16);c.lineTo(-43,11);c.closePath();c.fill();c.stroke();
      c.fillStyle='#a96570';c.beginPath();c.moveTo(-43,-11);c.lineTo(-35,-16);c.lineTo(-27,-11);c.lineTo(-35,-7);c.closePath();c.fill();
      c.strokeStyle='#ffd2b0';c.lineWidth=.9;c.beginPath();c.moveTo(-42,-10);c.lineTo(-35,-14);c.lineTo(-28,-10);c.moveTo(-25,-4);c.lineTo(23,-2);c.lineTo(38,0);c.stroke();
      c.strokeStyle='#df8282';c.lineWidth=1;c.beginPath();c.moveTo(-11,-3);c.lineTo(-8,0);c.lineTo(-11,3);c.moveTo(-3,-3);c.lineTo(0,0);c.lineTo(-3,3);c.stroke();c.restore();
    },
    jet(c,a,b,age,power){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);if(d<1||power<=0)return;c.save();c.translate(a.x,a.y);c.rotate(angle);const length=d*clamp((age-.32)/.22,0,1)+12,w=18*power;
      for(const [shade,factor]of [['#51152c',1.3],['#cd344d',1],['#ff875b',.55],['#ffdeb0',.23]]){const ww=w*factor;c.fillStyle=shade;c.beginPath();c.moveTo(0,-2*factor);c.bezierCurveTo(length*.25,-ww*.5,length*.5,-ww,length*.72,-ww*.6);for(let i=0;i<6;i++){const x=length*(.72+i*.055),yy=-ww*(.65+.22*Math.sin(age*23+i*2));c.quadraticCurveTo(x-5,yy-4,x,yy);}c.lineTo(length+8,0);for(let i=5;i>=0;i--){const x=length*(.72+i*.055),yy=ww*(.65+.22*Math.sin(age*21+i*2+1));c.quadraticCurveTo(x+2,yy+3,x-3,yy);}c.bezierCurveTo(length*.5,ww,length*.22,ww*.5,0,2*factor);c.closePath();c.fill();}
      for(let i=0;i<6;i++){const q=(age*2.7+i*.17)%1,x=length*(.45+q*.65),y=Math.sin(i*2.4+age*9)*w*(.5+q);c.fillStyle=i%2?'#e7564b':'#ffb278';c.beginPath();c.moveTo(x-5,y);c.quadraticCurveTo(x+4,y-5,x+12,y-2);c.lineTo(x+3,y+2);c.closePath();c.fill();}c.restore();
    },
    hellfire(r,e){const f=e.demonCinematic;if(!f)return;const c=r.ctx,b=e.balls.find(b=>b.id===f.owner),s=e.demonWorld.souls.find(s=>s.id===f.soul);if(!b||!s)return;const age=f.age,mid={x:(f.hostPoint.x+s.x)/2,y:(f.hostPoint.y+s.y)/2};
      if(age<.25){for(let i=0;i<6;i++){const q=i/5;c.save();c.globalAlpha=(1-age/.25)*(.12+q*.18);this.orb(r,b,f.from.x+(f.to.x-f.from.x)*q,f.from.y+(f.to.y-f.from.y)*q,23,e,1,.7);c.restore();}}
      if(age>.16){const q=clamp((age-.16)/.65,0,1);c.save();c.globalAlpha=clamp((age-.16)/.25,0,1);this.pentagram(c,s.x,s.y,32,q);c.restore();}
      if(age>.32&&age<1.42){const dx=mid.x-b.x,dy=mid.y-b.y,d=Math.hypot(dx,dy)||1,power=clamp((age-.32)/.18,0,1)*clamp((1.42-age)/.3,0,1);this.jet(c,{x:b.x+dx/d*19,y:b.y+dy/d*19},mid,age,power);}
      if(age>.6&&age<1.6){const q=clamp((age-.6)/.52,0,1),dx=s.x-f.hostPoint.x,dy=s.y-f.hostPoint.y;for(let i=0;i<10;i++){const u=(age*2.1+i*.11)%1,side=i%2?1:-1,x=mid.x+dx*q*side*.35+Math.cos(i*2.4)*u*15,y=mid.y+dy*q*side*.35-u*17;c.fillStyle=i%3?'#df665b':'#ffe0ab';c.globalAlpha=(1-u)*clamp((1.6-age)/.25,0,1);c.fillRect(x,y,1.5+i%2,2+i%3);}c.globalAlpha=1;}
      if(age>1.12){const q=clamp((age-1.12)/.88,0,1);for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2,x=s.x+Math.cos(a)*32,y=s.y+Math.sin(a)*32;c.strokeStyle='#e47679';c.lineWidth=1.3;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(s.x+Math.cos(a+.4)*18,s.y+Math.sin(a+.4)*18,s.x+Math.cos(a)*14,s.y+Math.sin(a)*14);c.stroke();this.flame(c,x+(s.x-x)*q,y+(s.y-y)*q,0,.35*(1-q),age,true,.7);}}
    },
    behind(r,e){const w=e.demonWorld;if(!w)return;const c=r.ctx;c.save();for(const f of e.effects)if(f.kind==='demonSoul'&&f.style==='hellfireSeal'){c.save();c.globalAlpha=1-f.age/f.life;this.pentagram(c,f.x,f.y,32,1);c.restore();}this.hellfire(r,e);
      for(const s of w.souls){const t=e.balls.find(b=>b.id===s.target);if(t)this.rope(c,s,t,e);}
      for(const claw of w.claws){const b=e.balls.find(b=>b.id===claw.owner);if(!b)continue;const angle=Math.atan2(claw.endY-claw.startY,claw.endX-claw.startX),warning=e.time<claw.at,p=clamp((e.time-claw.warningAt)/(claw.at-claw.warningAt),0,1),age=e.time-claw.at,fade=clamp((claw.expires-e.time)/.18,0,1);c.save();c.globalAlpha=fade;
        if(warning){c.strokeStyle=claw.locked?'#ffdeb8':claw.second?'#e9a6c5':b.def.color;c.lineWidth=claw.cut?2:1;c.setLineDash(claw.locked?[]:[4,5]);c.beginPath();c.moveTo(claw.startX,claw.startY);c.lineTo(claw.endX,claw.endY);c.stroke();c.setLineDash([]);
        }else{const nail=claw.pierce||claw.bodyNail||claw.arcStage==='pin',size=(claw.cut?2.2:claw.second?1.15:1)*(claw.attackRadius/13||1);
          // Clip at the mouth: the limb/weapon is revealed by travel, never by scaling a finished icon.
          c.save();c.translate(claw.startX,claw.startY);c.rotate(angle);c.beginPath();c.rect(0,-160,1800,320);c.clip();c.rotate(-angle);c.translate(-claw.startX,-claw.startY);
          if(nail){if(!claw.hit)this.spike(c,claw.x,claw.y,angle,(claw.pierce?this.soulNailScale:this.nailScale)*(claw.attackRadius/13||1));}
          else if(!w.souls.some(s=>s.extraction?.clawId===claw.id&&e.time-s.extraction.started<s.extraction.duration+.12)){this.arm(c,claw.startX,claw.startY,claw.x,claw.y,angle,size);c.save();c.translate(claw.x,claw.y);c.scale(size,size);this.claw(c,0,0,angle+(claw.cut?Math.max(-.5,-.5+age*3):0),claw.second?clamp(age/.15,0,1):clamp((age-claw.flight*.6)/.16,0,1),claw.second?'#f2bd9f':b.def.color);c.restore();}c.restore();}
        // Finish opening early in the existing warning, leaving a clear gate-only anticipation beat.
        this.gate(c,claw.startX,claw.startY,claw.portalAngle??angle,warning?clamp(p/.6,0,1):1,e.time,claw.second,claw.cut,!!G.DemonHell?.active(b,e));
        c.restore();
      }c.restore();
    },
    front(r,e){const w=e.demonWorld;if(!w)return;const c=r.ctx;c.save();for(const s of w.souls){const t=e.balls.find(b=>b.id===s.target);if(t)this.soul(r,s,t,e);}
      for(const b of e.balls){if(G.Demon?.frozen?.(b,e)){this.seal(c,b.x,b.y,b.radius+5,0,.65);if(Number.isFinite(b.demonStasis.pinAngle)){c.save();c.globalAlpha=.5;const pin=b.demonStasis,at=pin.pinSoul?w.souls.find(s=>s.id===pin.pinSoul)||{x:pin.pinX,y:pin.pinY}:b;this.spike(c,at.x,at.y,pin.pinAngle,pin.pinSoul?this.soulNailScale:this.nailScale);c.restore();}}if(b.demonServant){c.fillStyle='#24101c';c.fillRect(b.x-18,b.y+26,36,3);c.fillStyle='#df6a6e';c.fillRect(b.x-18,b.y+26,36*Math.max(0,b.hp/b.maxHp),3);this.seal(c,b.x,b.y,b.radius+3,e.time,.45);}}
      for(const rcd of w.servants||[]){if(rcd.phase!=='forming')continue;const t=e.balls.find(b=>b.id===rcd.host);if(!t)continue;const q=clamp((e.time-rcd.started)/(rcd.at-rcd.started),0,1);this.pentagram(c,rcd.x,rcd.y,27,1);this.orb(r,t,rcd.x,rcd.y,18,e,true,q);for(let i=0;i<6;i++){const a=i*Math.PI/3+q*2,rad=35*(1-q);this.flame(c,rcd.x+Math.cos(a)*rad,rcd.y+Math.sin(a)*rad,0,.3,e.time,true,1-q);}}
      for(const f of e.effects.filter(f=>f.kind==='demonSoul')){const u=clamp(f.age/f.life,0,1);c.save();c.globalAlpha=1-u;
        if(f.style==='blink'){for(let i=0;i<5;i++){const q=i/4;c.globalAlpha=(1-u)*(.15+q*.2);c.strokeStyle='#ee8b85';c.lineWidth=2;c.beginPath();c.arc(f.x+(f.endX-f.x)*q,f.y+(f.endY-f.y)*q,23,0,Math.PI*2);c.stroke();}}
        else if(f.style==='bind'){this.chain(c,f.x-30,f.y-25,f.x+10,f.y+15,1-u);this.chain(c,f.x+30,f.y-25,f.x-10,f.y+15,1-u);}
        else if(f.style==='pierce'){const pinned=e.balls.find(b=>b.id===f.host&&G.Demon.frozen(b,e)&&Number.isFinite(b.demonStasis.pinAngle));if(!pinned)this.spike(c,f.x,f.y,f.angle||0,f.soulId?this.soulNailScale:this.nailScale);c.strokeStyle='#ffc9ad';c.lineWidth=2*(1-u);for(let i=0;i<5;i++){const a=i*2.4;c.beginPath();c.moveTo(f.x+Math.cos(a)*8,f.y+Math.sin(a)*8);c.lineTo(f.x+Math.cos(a)*(15+u*30),f.y+Math.sin(a)*(15+u*30));c.stroke();}}
        else if(['assimilate','regather','reborn'].includes(f.style)){this.pentagram(c,f.x,f.y,25,u);}
        else if(f.style==='peel'){/* The actual soul is held between palm and fingers in soul(); no duplicate ghost. */}
        else if(f.style==='tug'){
          const host=e.balls.find(b=>b.id===f.host),s=w.souls.find(s=>s.id===f.soulId),x=s?.x??f.endX,y=s?.y??f.endY,angle=Math.atan2(f.endY-f.startY,f.endX-f.startX),gap=u<.24?13*(1-(1-u/.24)**3):13*(1-(u-.24)/.76)**2;
          c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=1;
          if(host)for(const side of [-1,1]){c.save();c.beginPath();c.moveTo(side*65,-55);c.lineTo(0,-55);c.lineTo(3,-14);c.lineTo(-2,-8);c.lineTo(3,-1);c.lineTo(-3,5);c.lineTo(2,12);c.lineTo(0,55);c.lineTo(side*65,55);c.closePath();c.clip();this.orb(r,host,side*gap,0,16,e,false,.65*(1-u*.4));c.restore();}
          // A torn void and two sharp rims, with directional soul chips rather than a grabbing hand.
          const length=19+9*Math.sin(Math.PI*u);c.fillStyle='#170b1d';c.beginPath();c.moveTo(-gap*.4,-length);c.lineTo(4-gap*.15,-8);c.lineTo(-3,-2);c.lineTo(gap*.45,5);c.lineTo(-gap*.2,length);c.lineTo(-6-gap*.25,7);c.lineTo(-1,-1);c.lineTo(-7,-7);c.closePath();c.fill();
          c.strokeStyle='#ffe3c6';c.lineWidth=1.6*(1-u);c.beginPath();c.moveTo(0,-length);c.lineTo(5,-8);c.lineTo(-2,-1);c.lineTo(4,6);c.lineTo(0,length);c.stroke();
          for(const side of [-1,1]){c.fillStyle=side<0?'#c15f80':'#f3b1aa';c.beginPath();c.moveTo(side*(9+u*28),-9+u*8);c.lineTo(side*(16+u*31),-13+u*3);c.lineTo(side*(11+u*27),-3+u*7);c.closePath();c.fill();c.strokeStyle='#9e3559';c.lineWidth=2*(1-u);c.beginPath();c.moveTo(side*(5+u*15),14-u*13);c.quadraticCurveTo(side*(24+u*15),8,side*(28+u*19),-5);c.stroke();}
          c.restore();}
        else if(f.style==='sever'){const a=Math.atan2(f.endY-f.startY,f.endX-f.startX)+Math.PI/2;c.save();c.translate(f.x,f.y);c.rotate(a);c.fillStyle='#8b3047';c.beginPath();c.moveTo(-38-u*14,-8);c.quadraticCurveTo(4,14,40+u*12,-9);c.quadraticCurveTo(2,25,-38-u*14,-8);c.fill();c.strokeStyle='#ffe0bb';c.lineWidth=2*(1-u);c.beginPath();c.moveTo(-35-u*14,-6);c.quadraticCurveTo(4,15,38+u*12,-7);c.stroke();c.restore();for(const sign of [-1,1])this.chain(c,f.x,f.y,f.x+sign*(12+u*25),f.y+u*12,(1-u)*.5);}
        else if(f.style==='return'){const host=e.balls.find(b=>b.id===f.host);if(host)this.orb(r,host,f.x,f.y,12,e,false,.65);}
        else if(f.style==='dissolve'){for(let i=0;i<5;i++){const a=i*2.4;this.flame(c,f.x+Math.cos(a)*u*20,f.y+Math.sin(a)*u*20,0,.55*(1-u),e.time,true,.8);}}
        else if(['strike','servantHit','block'].includes(f.style)){c.translate(f.x,f.y);c.rotate(f.angle||0);c.strokeStyle=f.style==='block'?'#a1ffeb':'#fbc2ac';c.lineWidth=2*(1-u);for(const sign of [-1,1]){c.beginPath();c.moveTo(-10-u*7,sign*(10+u*9));c.quadraticCurveTo(13-u*6,0,-10-u*7,-sign*(10+u*9));c.stroke();}}
        else if(f.style==='miss'){c.strokeStyle='#9f6877';c.lineWidth=1;c.beginPath();c.moveTo(f.x-7,f.y-3);c.lineTo(f.x+7,f.y+3);c.stroke();}
        c.restore();}c.restore();
    }
  };
})(typeof window!=='undefined'?window:globalThis);
