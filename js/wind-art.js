(function(root){
 'use strict';const G=root.OrbDuel,C=G.Constants,TAU=Math.PI*2,PI=Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},mix=(a,b,p)=>a+(b-a)*p;
 // Geometry is sampled from combat fronts/lanes. Cosmetic noise never reads either RNG.
 const V=G.WindView={
  line(c,pts,color,width,alpha=1){if(pts.length<2)return;c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.stroke();},
  ribbon(c,pts,width,alpha=.3,tint='#c3e8d9'){if(pts.length<3)return;const left=[],right=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],z=pts[Math.min(pts.length-1,i+1)],dx=z.x-a.x,dy=z.y-a.y,n=Math.hypot(dx,dy)||1,p=i/(pts.length-1),w=width*Math.sin(PI*p)**.65*(.72+.28*Math.sin(p*11));left.push({x:pts[i].x-dy/n*w,y:pts[i].y+dx/n*w});right.push({x:pts[i].x+dy/n*w,y:pts[i].y-dx/n*w});}
   const a=pts[0],z=pts.at(-1),g=c.createLinearGradient(a.x,a.y,z.x+.001,z.y);g.addColorStop(0,'#6d9c9b00');g.addColorStop(.32,tint+'35');g.addColorStop(.58,tint+'a0');g.addColorStop(.82,tint+'50');g.addColorStop(1,tint+'00');c.globalAlpha=alpha;c.fillStyle=g;c.beginPath();c.moveTo(left[0].x,left[0].y);for(const q of left.slice(1))c.lineTo(q.x,q.y);for(const q of right.reverse())c.lineTo(q.x,q.y);c.closePath();c.fill();
  },
  stream(c,x,y,a,length,width,t,seed,opacity=.5){const pts=[];for(let i=0;i<=20;i++){const q=i/20,l=(q-.5)*length,side=Math.sin(q*5.2+t*1.8+seed)*width*.25+Math.sin(q*10-t+seed)*width*.1;pts.push({x:x+Math.cos(a)*l-Math.sin(a)*side,y:y+Math.sin(a)*l+Math.cos(a)*side});}this.ribbon(c,pts,width*.055,opacity*.65);this.line(c,pts.slice(4,16),'#c9dfce',.42,opacity*.32);},
  surface(c,object,tag,width,height,stamp,paint,rect){
   this.materials??=new WeakMap();let record=this.materials.get(object);if(!record){record={};this.materials.set(object,record);}let cache=record[tag];if(!cache){const canvas=typeof root.OffscreenCanvas==='function'?new root.OffscreenCanvas(width,height):root.document?.createElement?.('canvas');if(!canvas)return false;canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');cache=record[tag]={canvas,ctx,data:ctx.createImageData(width,height),stamp:null};}
   if(cache.stamp!==stamp){const data=cache.data.data;data.fill(0);paint(data,width,height);cache.ctx.putImageData(cache.data,0,0);cache.stamp=stamp;}c.globalAlpha=1;c.drawImage(cache.canvas,...rect);return true;
  },
  pixel(data,k,d){if(d<.004)return;const hot=clamp((d-.1)*1.6,0,1);data[k]=mix(124,239,hot);data[k+1]=mix(156,249,hot);data[k+2]=mix(150,233,hot);data[k+3]=Math.min(230,d*360);},
  channel(c,l,e){if(l.points.length<2)return;const origin=l.points[0],ca=Math.cos(l.angle),sa=Math.sin(l.angle),last=l.points.at(-1),length=(last.x-origin.x)*ca+(last.y-origin.y)*sa;if(length<10)return;const life=smooth((l.until-e.time)/.55)*smooth((e.time-l.at)/.24),t=e.time-l.at;
   const nodes=l.points.map(q=>({x:(q.x-origin.x)*ca+(q.y-origin.y)*sa,y:-(q.x-origin.x)*sa+(q.y-origin.y)*ca})),width=172,height=64,centers=[];let index=0;
   for(let ix=0;ix<width;ix++){const x=ix/(width-1)*length;while(index<nodes.length-2&&nodes[index+1].x<x)index++;const a=nodes[index],b=nodes[index+1],q=clamp((x-a.x)/(b.x-a.x||1),0,1);centers[ix]=mix(a.y,b.y,q);}
   c.save();c.translate(origin.x,origin.y);c.rotate(l.angle);
   const drawn=this.surface(c,l,'channel',width,height,Math.floor(e.time*25)+':'+Math.round(length),data=>{for(let iy=0;iy<height;iy++)for(let ix=0;ix<width;ix++){const x=ix/(width-1)*length,dy=(iy/height-.5)*96-centers[ix],edge=Math.exp(-dy*dy/420),phase=dy*.21+.8*Math.sin(x*.034-t*3.1)+.3*Math.sin(x*.09-t*5+dy*.035),ridge=(.5+.5*Math.sin(phase))**7,patch=.4+.6*(.5+.5*Math.sin(x*.065-t*6+dy*.08)),ends=smooth(x/26)*smooth((length-x)/38),d=edge*(.055+ridge*.26*patch)*life*ends;this.pixel(data,(iy*width+ix)*4,d);}},[0,-48,length,96]);
   if(!drawn)this.ribbon(c,nodes,7,life*.25);
   // Short unequal slipstreams pass through the volume, never a full bundle of rails.
   for(let j=0;j<3;j++){const head=((t*90+j*71)%(length+55))-10,pts=[];for(let k=0;k<16;k++){const x=head-k*2.3;if(x<0||x>length)continue;const idx=clamp(Math.floor(x/length*(width-1)),0,width-1),y=centers[idx]+Math.sin(j*2.39)*18+Math.sin(x*.035-t*2+j)*4;pts.unshift({x,y});}this.ribbon(c,pts,1.5,life*.42,'#dbefe1');}c.restore();
  },
  floor(r,e){if(!e.balls.some(b=>b.type==='wind'&&b.wind))return;const c=r.ctx;c.save();c.beginPath();c.rect(0,0,C.width,C.height);c.clip();for(const b of e.balls){const s=b.wind;if(!s||b.hp<=0)continue;for(const l of s.lanes)this.channel(c,l,e);
    if(s.main&&s.main.until>e.time){const a=s.main.angle;for(let i=0;i<9;i++){const seed=i*2.399+b.id*1.7,dist=((e.time*76+i*93)%(C.width+180))-90,x=C.width/2+Math.cos(a)*(dist-C.width/2)-Math.sin(a)*Math.sin(seed)*C.height*.48,y=C.height/2+Math.sin(a)*(dist-C.width/2)+Math.cos(a)*Math.sin(seed)*C.height*.48;this.stream(c,x,y,a,30+i%4*12,11,e.time,seed,.24);}}
    if(s.vortex)this.patrol?.(c,s.vortex,e);if(s.storm)this.storm(c,b,e,false);
   }c.restore();},
  front(r,f,e){const c=r.ctx,t=e.time-f.at,fade=smooth(t/.12)*smooth((f.reach-f.travel)/45);if(!fade)return;const ca=Math.cos(f.angle),sa=Math.sin(f.angle),bend=f.bend*Math.sin(f.travel/f.reach*PI)*60;
   c.save();for(const wall of G.ArenaWalls.rectangles(e)){c.beginPath();if(f.x>=wall.left&&f.x<=wall.right&&f.y>=wall.top&&f.y<=wall.bottom){c.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);c.clip();}else{c.rect(0,0,C.width,C.height);c.rect(wall.left,wall.top,wall.right-wall.left,wall.bottom-wall.top);c.clip('evenodd');}}for(const o of e.obstacles||[]){c.beginPath();c.rect(0,0,C.width,C.height);c.moveTo(o.x+o.radius,o.y);c.arc(o.x,o.y,o.radius,0,TAU);c.clip('evenodd');}c.translate(f.x+ca*f.travel-sa*bend,f.y+sa*f.travel+ca*bend);c.rotate(f.angle);
   const drawn=this.surface(c,f,'front',132,156,Math.floor(t*30),data=>{for(let iy=0;iy<156;iy++)for(let ix=0;ix<132;ix++){const x=-100+ix/132*138,y=(iy/156-.5)*250,ny=y/f.half,dx=x+y*y/300,edge=Math.exp(-Math.pow(Math.abs(ny),6)*2),w=4.8+2*Math.sin(y*.06+t*5),nose=Math.exp(-dx*dx/(w*w))*.52,body=Math.exp(-Math.pow((dx+13)/20,2)),phase=y*.12+.6*Math.sin(dx*.09+t*6)+.25*Math.sin(y*.31-t*8),seam=(.5+.5*Math.sin(phase))**7,tail=Math.exp(-Math.pow((dx+44)/28,2))*(.5+.5*Math.sin(y*.17+.7*Math.sin(dx*.13-t*8)))**8,d=(nose+body*(.13+seam*.42)+tail*.3)*edge*fade*smooth((x+100)/16);this.pixel(data,(iy*132+ix)*4,d);}},[-100,-125,138,250]);
   // Narrow highlights describe selected compression crests, not stacked identical blades.
   for(const section of [[-.81,-.18],[.03,.66]]){const pts=[];for(let i=0;i<=24;i++){const y=mix(section[0],section[1],i/24)*f.half;pts.push({x:-y*y/300,y});}this.ribbon(c,pts,1.4,fade*.72,'#efffea');}
   if(!drawn){const ps=[];for(let i=0;i<=30;i++){const y=(i/30*2-1)*f.half;ps.push({x:-y*y/300,y});}this.ribbon(c,ps,8,fade*.65);}
   c.restore();
  },
  storm(){},
  warning(c,b,e){const s=b.wind,p=smooth(s.age/(s.warning||G.Wind.config.warning)),t=s.age;c.save();c.translate(b.x,b.y);c.rotate(s.aim);
   this.surface(c,s,'warning',96,96,Math.floor(t*45)+':'+s.serial,data=>{for(let y=0;y<96;y++)for(let x=0;x<96;x++){const xx=-20+x*.9,yy=(y/96-.5)*80,F=27+p*7,dx=xx-F+yy*yy/130,spread=25-p*7,face=Math.exp(-dx*dx/18-yy*yy/(spread*spread)),flow=Math.exp(-Math.pow(xx-F-16,2)/370-yy*yy/(spread*spread*1.7))*(.5+.5*Math.sin(yy*.24+Math.sin(xx*.12+t*15)))**8,d=(face*.55+flow*.28)*smooth((t+.03)/.1);this.pixel(data,(y*96+x)*4,d);}},[-20,-40,86.4,80]);
   for(const side of [-1,1]){const ps=[];for(let i=0;i<=18;i++){const q=i/18,x=36+(1-q)*30,y=side*(8+q*13);ps.push({x,y});}this.ribbon(c,ps,1.1,p*.65);}c.restore();
  },
  fore(r,e){const c=r.ctx;c.save();c.beginPath();c.rect(0,0,C.width,C.height);c.clip();for(const b of e.balls){const s=b.wind;if(!s||b.hp<=0)continue;for(const f of s.fronts)this.front(r,f,e);if(s.phase==='warning')this.warning(c,b,e);
    if(s.storm)this.storm(c,b,e,true);
   }
   for(const f of e.effects){if(f.kind!=='wind')continue;const p=clamp(f.age/f.life,0,1),fade=1-p;c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);
    if(['frontHit','shearHit','finalHit','press'].includes(f.style)){const power=f.style==='finalHit'?1.7:1;for(let j=0;j<3;j++){const ps=[],radius=(12+p*31+j*7)*power,start=-1.3+j*.83,span=.9+j%2*.35;for(let i=0;i<=23;i++){const q=i/23,a=start+q*span;ps.push({x:Math.cos(a)*radius-10,y:Math.sin(a)*radius*.7});}this.ribbon(c,ps,(3.3-j*.6)*fade*power,fade*.9,'#eefbe5');}for(let j=0;j<2;j++)this.stream(c,p*36,(j-.5)*15,0,34,12,p,j,fade*.55);}
    else if(f.style==='release'){for(let j=0;j<3;j++){const ps=[],r=22+p*40;for(let i=0;i<=23;i++){const a=-.9+i/23*1.7,y=Math.sin(a)*(r+j*6);ps.push({x:Math.cos(a)*r-j*9,y});}this.ribbon(c,ps,(6-j)*fade,fade*.55);}}
    else if(f.style==='twins'){for(let j=0;j<3;j++)this.stream(c,Math.sin(j*2.4)*40,Math.cos(j*2.4)*28,j*2.4+p,55,20,p,j,fade*.6);}
    c.restore();}
   c.restore();},
  badge(r,b,e){if(b.type!=='wind')return;const c=r.ctx;c.save();c.translate(b.x,b.y);c.rotate((b.wind?.main?.angle||0)*.16);for(let j=0;j<3;j++){c.beginPath();c.moveTo(-11,-7+j*7);c.bezierCurveTo(-4,-12+j*7,5,-3+j*7,12,-9+j*7);c.strokeStyle='#193d3b';c.lineWidth=2.1;c.lineCap='round';c.stroke();}c.restore();}
 };
 const world=G.Renderer.prototype.drawWorld;G.Renderer.prototype.drawWorld=function(e){V.floor(this,e);return world.call(this,e);};
 const signals=G.Renderer.prototype.drawSignals;G.Renderer.prototype.drawSignals=function(e){V.fore(this,e);return signals.call(this,e);};
 const ball=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){const result=ball.call(this,b,e);if(b.hp>0)V.badge(this,b,e);return result;};
})(typeof window!=='undefined'?window:globalThis);
