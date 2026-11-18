(function(root){
'use strict';
const G=root.OrbDuel,C=G.Constants,T=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const caches=new WeakMap();
const V=G.TimeRewindView={
 orb(c,x,y,b,alpha=1){const r=b.radius||C.radius;c.save();c.globalAlpha*=alpha;c.translate(x,y);const fill=c.createRadialGradient(-r*.3,-r*.35,1,0,0,r);fill.addColorStop(0,'#efffff');fill.addColorStop(.36,b.def?.color||'#92ddff');fill.addColorStop(1,'#162d51');c.fillStyle=fill;c.beginPath();c.arc(0,0,r,0,T);c.fill();c.strokeStyle='#d5f7ff';c.lineWidth=1;c.stroke();c.fillStyle='#10162d';c.font='bold 19px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(b.def?.symbol||(b.type==='time'?'◷':'•'),0,1);c.restore();},
 // Canvas pixels are presentation-only: never attach them to combat snapshots.
 cache(r,e){let v=caches.get(e);if(!v||v.session!==e.timeRewind){v={session:e.timeRewind,frames:[],last:-Infinity,active:null,saved:null};caches.set(e,v);}
  if(e.ending||e.state==='ended'){v.frames=[];v.saved=null;v.mesh=null;v.active=null;v.last=-Infinity;return v;}
  const active=e.timeRewind?.active;
  if(active){if(v.active!==active){v.active=active;v.saved=v.frames.slice();v.mesh=this.mesh(active,e);}return v;}
  if(v.active||e.time<v.last){v.frames=[];v.saved=null;v.mesh=null;v.active=null;v.last=-Infinity;}
  if(!e.timeRewind||!G.TimeRewind.enabled(e)||e.ending||e.state==='ended'){v.frames=[];v.last=-Infinity;return v;}
  if(e.state!=='running'||e.time-v.last<.18)return v;
  v.last=e.time;const canvas=document.createElement('canvas');canvas.width=360;canvas.height=Math.round(360*C.height/C.width);canvas.getContext('2d').drawImage(r.canvas||r.ctx.canvas,0,0,canvas.width,canvas.height);
  v.frames.push({time:e.time,canvas});while(v.frames.length>58||v.frames[0].time<e.time-10.5)v.frames.shift();return v;
 },
 inspect(e){const v=caches.get(e),f=v?.saved||v?.frames||[];return{count:f.length,first:f[0]?.time,last:f.at(-1)?.time,bytes:f.reduce((n,x)=>n+x.canvas.width*x.canvas.height*4,0),active:!!v?.active};},
 history(v,time){const frames=v.saved||[];if(!frames.length)return null;let chosen=frames[0];for(const f of frames){if(f.time>time)break;chosen=f;}return chosen;},
 mesh(s,e){const owner=e.balls.find(b=>b.id===s.owner)||{x:180,y:170},seeds=[];
  for(let j=0;j<4;j++)for(let i=0;i<5;i++)seeds.push({x:(i+.18+((i*7+j*3)%9)/16)*C.width/5,y:(j+.16+((i*3+j*11)%8)/13)*C.height/4});
  seeds.push({x:owner.x,y:owner.y});
  // Voronoi clipping makes shared, irregular panes, with no regular grid overlay.
  return seeds.map((a,n)=>{let poly=[[0,0],[C.width,0],[C.width,C.height],[0,C.height]];
   for(const b of seeds){if(b===a)continue;const nx=b.x-a.x,ny=b.y-a.y,k=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2,next=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=p[0]*nx+p[1]*ny-k,v=q[0]*nx+q[1]*ny-k;if(u<=0)next.push(p);if((u<=0)!==(v<=0)){const t=u/(u-v);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}poly=next;if(!poly.length)break;}
   const x=poly.reduce((v,p)=>v+p[0],0)/(poly.length||1),y=poly.reduce((v,p)=>v+p[1],0)/(poly.length||1);
   return{poly,x,y,n,depth:(n*7%11)/10,spin:((n*13%17)-8)/8,delay:Math.hypot(x-owner.x,y-owner.y)/650};
  });
 },
 pane(c,poly){c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();},
 shards(c,e,s,v){const t=s.elapsed,split=smooth((t-.28)/.42),gather=smooth((t-2.14)/.25),rebuild=smooth((t-2.40)/.25),amount=split*(1-rebuild),restart=smooth((t-2.64)/.15),cx=C.width*.5,cy=C.height*.5;
  const panes=[...(v.mesh||[])].sort((a,b)=>a.depth-b.depth);
  for(const f of panes){if(!f.poly.length)continue;const {x,y,n,depth}=f,unfold=smooth((t-.22-f.delay*.35)/.30),force=amount*unfold,scale=1+force*(depth-.4)*.23,dx=(x-cx)*force*(.10+depth*.09),dy=(y-cy)*force*(.08+depth*.08),rotation=f.spin*force*.16;
   const pull=gather*(1-rebuild)*.38;
   const cursor=s.cursor??s.deathTime,at=clamp(cursor-((n*7%9)-3)*.16*(1-rebuild),s.target.time,s.deathTime),frame=this.history(v,s.phase==='freeze'?s.deathTime:at);
   c.save();c.translate(x+dx+(cx-x)*pull,y+dy+(cy-y)*pull);c.rotate(rotation);c.scale(scale*(1-pull*.64),scale*(1-pull*.64));c.translate(-x,-y);
   // Offset dark thickness and a small soft shadow separate foreground panes.
   if(force>.01){c.save();c.translate(1.2*force,2*force);this.pane(c,f.poly);c.fillStyle='#01060d';c.shadowColor='#0006';c.shadowBlur=force*4;c.fill();c.restore();}
   c.save();this.pane(c,f.poly);c.clip();c.globalAlpha=(s.phase==='freeze'?smooth((t-.25)/.20):1)*(1-restart);if(frame){c.filter='saturate('+(1-smooth(t/.6)*.78*(1-rebuild))+')';c.drawImage(frame.canvas,0,0,C.width,C.height);c.filter='none';}
   const glass=c.createLinearGradient(x-65,y-50,x+65,y+70);glass.addColorStop(0,'#c2f0ff24');glass.addColorStop(.27,'#aadfff05');glass.addColorStop(.72,'#05172912');glass.addColorStop(1,'#07132660');c.fillStyle=glass;c.fillRect(0,0,C.width,C.height);
   // A narrow travelling reflection glances across the pane, below scene contrast.
   const glint=x+Math.sin(t*1.5+n)*90;c.globalAlpha*=force*.45;c.fillStyle='#c7f2ff12';c.beginPath();c.moveTo(glint-8,0);c.lineTo(glint+5,0);c.lineTo(glint+105,C.height);c.lineTo(glint+75,C.height);c.fill();c.restore();
   c.globalAlpha=unfold*(.055+force*.12)*(1-restart);this.pane(c,f.poly);c.strokeStyle=depth>.6?'#94bccb':'#365968';c.lineWidth=.55;c.stroke();
   // Only the light-facing edge catches light; do not outline every cell twice.
   if(force>.1){c.save();c.globalAlpha=unfold*force*(.10+depth*.13)*(1-restart);c.strokeStyle='#d3eef1';c.lineWidth=.6;c.beginPath();let lit=false;for(let i=0;i<f.poly.length;i++){const p=f.poly[i],q=f.poly[(i+1)%f.poly.length],dx=q[0]-p[0],dy=q[1]-p[1];if(dy-dx*.35>8){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);lit=true;}}if(lit)c.stroke();c.restore();}c.restore();
  }
 },
 clock(c,s){const t=s.elapsed,q=smooth((t-.60)/.20)*(1-smooth((t-2.18)/.36));if(q<=0)return;const cx=-210,cy=C.height*.70,rad=460,rotation=-clamp((t-.6)/1.8)*2.8;c.save();c.globalAlpha=q*.48;
  for(const [r,w,color]of [[rad+17,3,'#284f68'],[rad,1.7,'#b0dae5'],[rad-9,.7,'#d4bd7c'],[rad-42,1,'#42748c']]){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(cx,cy,r,-1.0,1.1);c.stroke();}
  for(let i=-40;i<=40;i++){const a=i*Math.PI/60+rotation,major=i%5===0;c.save();c.translate(cx,cy);c.rotate(a);c.fillStyle=major?'#ead3a1':'#8bbac9';c.fillRect(rad-(major?37:24),major?-1.2:-.5,major?22:8,major?2.4:1);if(major){c.strokeStyle='#b4d5de';c.lineWidth=.7;c.strokeRect(rad-56,-4,9,8);}c.restore();}
  // A bevelled giant hand crosses the frame from an invisible spindle.
  const angle=1.2-clamp((t-.6)/1.8)*5.0;c.translate(cx,cy);c.rotate(angle);const metal=c.createLinearGradient(0,-9,0,9);metal.addColorStop(0,'#4a7188');metal.addColorStop(.4,'#d0e9ed');metal.addColorStop(.52,'#ffffdf');metal.addColorStop(1,'#61899b');c.fillStyle=metal;c.beginPath();c.moveTo(0,-6);c.lineTo(rad*.93,-9);c.lineTo(rad*1.38,0);c.lineTo(rad*.93,9);c.lineTo(0,6);c.closePath();c.fill();c.strokeStyle='#f1e1b4';c.lineWidth=.75;c.beginPath();c.moveTo(80,0);c.lineTo(rad*1.31,0);c.stroke();c.restore();
 },
 paths(c,e,s){if(s.phase!=='reverse')return;const now=s.cursor??s.deathTime,span=Math.min(.72,s.deathTime-s.target.time),fade=1-smooth((s.elapsed-2.15)/.25);
  for(const b of e.balls){c.save();c.lineCap='round';c.lineJoin='round';
   // Sample true history, with gaps at relocations. The short tail follows the orb.
   let prior=G.TimeRewind.at(s,now,b.id);for(let i=1;i<=20;i++){const p=G.TimeRewind.at(s,clamp(now+i*span/20,s.target.time,s.deathTime),b.id);c.globalAlpha=fade*.24*(1-i/21);c.strokeStyle='#a8d9e7';c.lineWidth=1.5*(1-i/24);if(Math.hypot(p.x-prior.x,p.y-prior.y)<24){c.beginPath();c.moveTo(prior.x,prior.y);c.lineTo(p.x,p.y);c.stroke();}prior=p;}
   let last=b;for(let i=1;i<=5;i++){const p=G.TimeRewind.at(s,clamp(now+i*span/6,s.target.time,s.deathTime),b.id);if(Math.hypot(p.x-last.x,p.y-last.y)<9)continue;this.orb(c,p.x,p.y,b,fade*(.22-i*.033));last=p;}c.restore();
  }
 },
 cracks(c,owner,t){const q=smooth(t/.55);c.save();c.translate(owner.x,owner.y);c.beginPath();c.arc(0,0,owner.radius,0,T);c.clip();c.fillStyle='#a9e9ff';c.globalAlpha=.12*q;c.fillRect(-25,-25,50,50);c.strokeStyle='#ecffff';c.shadowColor='#71cdff';c.shadowBlur=5;c.globalAlpha=.95*q;c.lineWidth=1.35;
  for(let i=0;i<6;i++){const a=i*T/6+.22;c.beginPath();c.moveTo(Math.cos(a)*3,Math.sin(a)*3);for(let j=1;j<=4;j++){const d=owner.radius*j/4,k=a+(j%2?.13:-.11);c.lineTo(Math.cos(k)*d,Math.sin(k)*d);}c.stroke();}c.restore();
 },
 court(c,t){const q=smooth((t-2.40)/.25);c.save();c.globalAlpha=q;c.fillStyle='#111721';c.fillRect(0,0,C.width,C.height);c.fillStyle='#273246';for(let x=40;x<C.width;x+=40)for(let y=40;y<C.height;y+=40){c.beginPath();c.arc(x,y,.7,0,T);c.fill();}c.strokeStyle='#263244';c.lineWidth=1;c.setLineDash([4,10]);c.beginPath();c.moveTo(C.width/2,48);c.lineTo(C.width/2,C.height-48);c.stroke();c.setLineDash([]);c.strokeStyle='#253042';c.beginPath();c.arc(C.width/2,C.height/2,57,0,T);c.stroke();c.strokeStyle='#46516a';c.lineWidth=1.5;for(const[x,y,sx,sy]of[[12,12,1,1],[C.width-12,12,-1,1],[12,C.height-12,1,-1],[C.width-12,C.height-12,-1,-1]]){c.beginPath();c.moveTo(x,y+12*sy);c.lineTo(x,y);c.lineTo(x+12*sx,y);c.stroke();}c.restore();},
 restart(c,e,s,owner){const q=clamp((s.elapsed-2.4)/.4),open=smooth((q-.10)/.24);c.save();c.globalAlpha=(1-smooth(q/.22))*.90;c.fillStyle='#01040a';c.fillRect(0,0,C.width,C.height);c.restore();
  c.save();c.translate(owner.x,owner.y);const radius=owner.radius+open*138,fade=1-smooth((q-.4)/.6);c.globalAlpha=fade*open;const halo=c.createRadialGradient(0,0,radius*.65,0,0,radius+9);halo.addColorStop(0,'#8ee1ff00');halo.addColorStop(.82,'#78d8f13a');halo.addColorStop(.96,'#e5ffffab');halo.addColorStop(1,'#a0e4ff00');c.fillStyle=halo;c.beginPath();c.arc(0,0,radius+9,0,T);c.fill();
  c.strokeStyle='#ddfaff';c.lineWidth=1.8*fade+.2;c.beginPath();c.arc(0,0,radius,0,T);c.stroke();for(let i=0;i<12;i++){const a=i*2.399,length=(8+i%4*4)*fade;c.save();c.rotate(a);c.strokeStyle=i%3?'#a0dfea':'#e5d5a2';c.lineWidth=.8;c.beginPath();c.moveTo(radius+3,0);c.lineTo(radius+3+length,0);c.stroke();c.restore();}c.restore();
  for(const b of e.balls)if(b.id!==owner.id){c.save();c.translate(b.x,b.y);c.globalAlpha=fade*open;c.strokeStyle='#b7e6f4';c.lineWidth=1.2;const r=b.radius+7;for(let j=0;j<4;j++){c.beginPath();c.arc(0,0,r,j*T/4+.08,j*T/4+1.05);c.stroke();}c.beginPath();c.moveTo(-6,-6);c.lineTo(6,6);c.moveTo(-6,6);c.lineTo(6,-6);c.stroke();c.strokeStyle='#e3d5ac';c.strokeRect(-8,-8,16,16);c.restore();}
 },
 overlay(r,e,v){const s=e.timeRewind?.active;if(!s||e.ending||e.state==='ended')return;const c=r.ctx,t=s.elapsed,owner=e.balls.find(b=>b.id===s.owner);c.save();c.filter='none';
  // Clear the current world's stale projectiles beneath the historical panes.
  // No historical entity is simulated: only pixels of already rendered frames.
  c.globalAlpha=smooth((t-.26)/.25);c.fillStyle='#030c16';c.fillRect(0,0,C.width,C.height);c.globalAlpha=1;
  if(s.phase==='restart')this.court(c,t);this.shards(c,e,s,v);this.clock(c,s);this.paths(c,e,s);
  if(s.phase==='freeze'&&owner)this.cracks(c,owner,t);
  if(s.phase!=='freeze'){for(const b of e.balls){c.save();c.globalAlpha=s.phase==='restart'?smooth((t-2.43)/.10):1;c.filter='saturate('+(s.phase==='restart'?(.22+.78*smooth((t-2.4)/.25)):.22)+')';r.drawBall(b,e);c.restore();}}
  if(s.phase==='restart'&&owner)this.restart(c,e,s,owner);c.restore();
 },
 front(r,e){const c=r.ctx;for(const f of e.effects)if(f.kind==='timeRecall'){const b=e.balls.find(v=>v.id===f.actor);if(!b||!f.path.length)continue;const q=clamp(f.age/f.life),start=Math.floor((1-q)*(f.path.length-1));for(let i=0;i<11;i++){const n=Math.min(f.path.length-1,start+Math.floor(i*(f.path.length-start)/11)),p=f.path[n];this.orb(c,p.x,p.y,b,(1-q)*(.27-i*.018));}}}
};
const draw=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e){const old=this.ctx.filter,s=e.timeRewind?.active;this.ctx.filter=s?'saturate('+(s.phase==='restart'?clamp((s.elapsed-2.4)/.4):1-clamp(s.elapsed/.6)*.92)+')':'none';draw.call(this,e);this.ctx.filter='none';const v=V.cache(this,e);V.overlay(this,e,v);V.front(this,e);this.ctx.filter=old;};
})(typeof window!=='undefined'?window:globalThis);
