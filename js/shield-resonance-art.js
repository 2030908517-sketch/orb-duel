(function(root){
 'use strict';const G=root.OrbDuel,R=G.ShieldResonance,TAU=Math.PI*2;
 const camera=G.Presentation.camera;G.Presentation.camera=function(r,e){camera.call(this,r,e);const f=e.shieldCamera;if(!f||r.reducedMotion)return;const age=e.time-f.at;if(age<0||age>.28)return;const power=f.power*Math.exp(-age*16);r.ctx.translate(Math.sin(age*123)*power,Math.cos(age*97)*power);};
 const line=(c,pts,color,width)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 const clamp=v=>Math.max(0,Math.min(1,v));
 G.ShieldDirectionalView={
  wave(r,w,e){const c=r.ctx,birth=clamp(w.travel/22),fade=clamp((w.reach-w.travel)/18),h=w.width,phase=w.travel*.075;
   c.save();c.translate(w.x,w.y);c.rotate(w.angle);c.globalAlpha=Math.min(birth,fade);c.lineJoin='round';c.lineCap='round';
   // A bowed pressure sheet: its illuminated front compresses a flowing, tapered wake.
   for(const [depth,alpha]of[[36,.18],[24,.44],[12,.88]]){const front=[],rear=[];
    for(let i=0;i<=40;i++){const u=i/20-1,taper=Math.sqrt(Math.max(0,1-u*u)),x=11-27*u*u+Math.sin(u*7+phase)*1.1*taper;
     front.push({x,y:u*h});rear.push({x:x-depth*taper*(1+.12*Math.sin(u*11-phase)),y:u*h});}
    c.beginPath();[...front,...rear.reverse()].forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
    const fill=c.createLinearGradient(-depth-15,0,14,0);fill.addColorStop(0,'#235d7800');fill.addColorStop(.42,w.color+'80');fill.addColorStop(.84,'#87f1e2');fill.addColorStop(1,'#ecfff8');c.fillStyle=fill;c.globalAlpha=Math.min(birth,fade)*alpha;c.fill();
   }
   const front=[];for(let i=0;i<=40;i++){const u=i/20-1;front.push({x:11-27*u*u,y:u*h});}
   c.globalAlpha=Math.min(birth,fade);line(c,front,w.color+'44',9);line(c,front,'#a7fff0',3);line(c,front,'#f0fff9',1.1);
   for(let j=0;j<5;j++){const u=(j-2)*.33,y=u*h,taper=1-u*u,len=(26+8*Math.sin(phase+j*2))*taper;
    c.globalAlpha=Math.min(birth,fade)*.45;c.strokeStyle=j%2?w.color:'#d1fff5';c.lineWidth=j%2?1.4:.8;c.beginPath();c.moveTo(-len-14,y*.65);c.bezierCurveTo(-len*.65,y*.73-3*Math.sin(phase+j),-10,y*.96,5-27*u*u,y);c.stroke();}
   c.restore();
  },
  effect(r,f){if(f.kind!=='roster'||!['pressureWave','pressureHit'].includes(f.style))return false;const c=r.ctx,p=clamp(f.age/f.life),hit=f.style==='pressureHit',fade=(1-p)**2;
   c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.globalAlpha=fade;c.lineCap='round';
   for(const side of [-1,1]){c.beginPath();c.moveTo(hit?-6:9,side*3);c.bezierCurveTo(6+p*14,side*(12+p*12),-8-p*18,side*(22+p*16),-21-p*26,side*(17+p*12));c.strokeStyle=f.color+'80';c.lineWidth=5*(1-p)+1;c.stroke();c.strokeStyle='#d9fff6';c.lineWidth=1.2*(1-p);c.stroke();}
   c.restore();return true;
  }
 };
 function shell(c,f){const p=f.age/f.life,royal=f.style==='royalBreak',r=26+Math.min(1,p*3)*14;c.save();c.translate(f.x,f.y);c.globalAlpha=(1-p)**1.6;
  const glow=c.createRadialGradient(0,0,5,0,0,80);glow.addColorStop(0,royal?'#ffe6a36b':'#91ddff74');glow.addColorStop(.35,'#377cbd52');glow.addColorStop(1,'#1b528500');c.fillStyle=glow;c.fillRect(-80,-80,160,160);
  for(let i=0;i<9;i++){const a=i*TAU/9+.12,spread=Math.max(0,p-.09)*75,size=1-p;c.save();c.translate(Math.cos(a)*spread,Math.sin(a)*spread);c.rotate(a+p*(i%2?1:-1)*.8);c.beginPath();c.moveTo(r,-5*size);c.lineTo(r+7*size,-2*size);c.lineTo(r+5*size,8*size);c.lineTo(r-2*size,10*size);c.closePath();const facet=c.createLinearGradient(r-2,0,r+7,0);facet.addColorStop(0,'#244e80');facet.addColorStop(.55,royal?'#d8b872':'#8cd5ef');facet.addColorStop(1,'#f4f5dd');c.fillStyle=facet;c.fill();c.strokeStyle=royal?'#fff0bd':'#dcfbff';c.lineWidth=.9;c.stroke();c.restore();}
  if(p<.24){c.globalAlpha=1-p/.24;for(let i=0;i<5;i++){const a=i*2.4;c.save();c.rotate(a);line(c,[{x:9,y:0},{x:19,y:3},{x:24,y:-2},{x:31,y:1}],'#f2fdff',1.5);c.restore();}}c.restore();
 }
 function wave(c,w,e){const age=e.time-w.started;c.save();c.lineJoin='round';c.lineCap='round';const appear=Math.min(1,age/.06);
  // The bright moving edge and trailing membrane share the actual ray fronts.
  for(const phase of [0,1]){const groups=[];let run=[];for(let i=0;i<=w.rays.length;i++){const r=w.rays[i%w.rays.length];if(r.alive&&r.phase===phase){run.push(r);}else{if(run.length>1)groups.push(run);run=[];}}if(run.length>1)groups.push(run);
   for(const pts of groups){c.globalAlpha=appear*(phase?.9:1);line(c,pts,w.royal?'#63b8f02b':'#4bc7ff24',27);line(c,pts,w.royal?'#7bc3f86b':'#79d8ff62',13);line(c,pts,w.royal?'#f0cf84':'#9aeaff',5.5);line(c,pts,phase?'#f7f0d7':'#edfcff',1.5);
    const rear=pts.map(r=>({x:r.x-r.nx*(14+4*Math.sin(age*15+r.nx*5)),y:r.y-r.ny*(14+4*Math.sin(age*15+r.ny*5))})).reverse();c.beginPath();[...pts,...rear].forEach((r,i)=>i?c.lineTo(r.x,r.y):c.moveTo(r.x,r.y));c.closePath();c.fillStyle=w.royal?'#9cb9e525':'#61b5db23';c.fill();
    for(let i=2;i<pts.length-2;i+=7){const r=pts[i],p=pts[i+1],shine=.45+.2*Math.sin(i*1.7+age*19);c.globalAlpha=appear*shine;line(c,[{x:r.x-r.nx*7,y:r.y-r.ny*7},{x:p.x-p.nx*8,y:p.y-p.ny*8}],w.royal?'#ffe4a3':'#c0f4ff',1);}
   }
  }c.restore();
 }
 const draw=G.Renderer.prototype.draw;G.Renderer.prototype.draw=function(e){draw.call(this,e);const c=this.ctx;c.save();const scale=this.canvas.width/G.Constants.width;c.setTransform(scale,0,0,this.canvas.height/G.Constants.height,0,0);G.Presentation.camera(this,e);
  for(const w of e.shieldRings||[])wave(c,w,e);
  const f=e.arcanaWorld?.defense?.fortress;if(f){const q=Math.max(0,1-(e.time-(f.resonanceAt??-10))/.3);if(q>0){c.globalAlpha=q;c.strokeStyle='#fff1bc';c.lineWidth=3+q*4;c.strokeRect(f.bounds.left,f.bounds.top,f.bounds.right-f.bounds.left,f.bounds.bottom-f.bounds.top);}}
  for(const f of e.effects){if(f.kind!=='shieldResonance')continue;if(['break','royalBreak'].includes(f.style)){shell(c,f);continue;}const p=f.age/f.life;c.save();c.translate(f.x,f.y);c.globalAlpha=(1-p)**1.2;
   if(f.style==='rebound'){const a={left:0,right:Math.PI,top:Math.PI/2,bottom:-Math.PI/2}[f.side];c.rotate(a);for(const s of [-1,1]){c.beginPath();c.moveTo(0,0);c.bezierCurveTo(9+p*25,s*(5+p*8),15+p*45,s*(9+p*23),8+p*35,s*(15+p*32));c.strokeStyle=s<0?'#ffdf98':'#8edcff';c.lineWidth=3*(1-p)+.5;c.stroke();}line(c,[{x:0,y:-19-p*18},{x:0,y:19+p*18}],'#f5faff',2*(1-p));}
   else if(f.style==='hit'){c.rotate(f.angle);for(let i=0;i<5;i++){const a=(i-2)*.43,d=8+p*(25+i*5);line(c,[{x:Math.cos(a)*d*.5,y:Math.sin(a)*d*.5},{x:Math.cos(a)*d,y:Math.sin(a)*d}],f.royal?'#ffe3a3':'#bcf5ff',1.5*(1-p));}}
   else if(f.style==='suspend'){c.strokeStyle='#b6eaff';c.lineWidth=1.1;c.beginPath();c.arc(0,0,8+Math.sin(p*Math.PI)*3,0,TAU);c.stroke();line(c,[{x:-2,y:-4},{x:-2,y:4}],'#f1fbff',1.3);line(c,[{x:2,y:-4},{x:2,y:4}],'#f1fbff',1.3);}
   else{for(let i=0;i<6;i++){c.save();c.rotate(i*2.4);const x=5+p*22;c.fillStyle=i%2?'#abcfff':'#ffe5ac';c.fillRect(x,-1.4,5*(1-p),2.8);c.restore();}}c.restore();
  }c.restore();
 };
})(typeof window!=='undefined'?window:globalThis);
