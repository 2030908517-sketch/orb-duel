(function(root){
 'use strict';const G=root.OrbDuel,S=G.HolySeals,C=G.Constants,TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);},mix=(a,b,t)=>a+(b-a)*t;
 const V=G.HolySealView={
  path(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}},
  cross(c,x,y,r,thick=2){c.beginPath();c.moveTo(x,y-r);c.lineTo(x,y+r);c.moveTo(x-r*.65,y-r*.28);c.lineTo(x+r*.65,y-r*.28);c.lineWidth=thick;c.stroke();},
  runes(c,r,time,count=16){c.save();c.rotate(time);for(let i=0;i<count;i++){c.save();c.rotate(i*TAU/count);c.translate(0,-r);c.strokeStyle=i%3?'#e4c77e':'#fff7d7';c.lineWidth=.75;c.beginPath();c.moveTo(-2,3);c.lineTo(-2,-3);c.lineTo(2,-1);c.lineTo(-1,1);if(i%2)c.lineTo(3,3);c.stroke();c.restore();}c.restore();},
  sigil(c,x,y,r,time,n,alpha=1){c.save();c.translate(x,y);c.globalAlpha*=alpha;c.strokeStyle='#d7b56b';c.lineWidth=1.1;for(const k of [1,.83]){c.beginPath();c.arc(0,0,r*k,0,TAU);c.stroke();}this.runes(c,r*.92,time,12+n*2);if(n===1){c.scale(1,.38);c.lineWidth=3;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
   else if(n===2){for(let i=0;i<3;i++){c.save();c.rotate(time*.4+i*TAU/3);c.translate(0,-r*.45);if(i===0)this.path(c,[[-7,-5],[7,-5],[5,4],[0,9],[-5,4]],null,'#fff1bb');else if(i===1)this.cross(c,0,0,7,2);else{c.beginPath();c.moveTo(-7,7);c.lineTo(0,-7);c.lineTo(7,7);c.stroke();}c.restore();}}
   else if(n===3||n===6){this.cross(c,0,0,r*.74,n===6?6:3);for(const side of [-1,1])for(let j=0;j<3;j++){c.save();c.translate(side*r*(.26+j*.2),-r*.17);c.rotate(side*.6);c.strokeRect(-4,-2.5,8,5);c.restore();}}
   else if(n===4){for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4+time*.2);c.beginPath();c.arc(0,0,r*.65,.12,.9);c.lineTo(r*.6,r*.13);c.stroke();c.restore();}this.cross(c,0,0,r*.25,1.5);}
   else if(n===5){for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);this.path(c,[[0,-r*.72],[-3,-r*.40],[0,-r*.22],[3,-r*.40]],'#f7e5af');c.restore();}}
   else{this.cross(c,0,0,r*.6,3);for(let i=0;i<7;i++){const a=i*TAU/7;this.path(c,[[Math.cos(a)*r*.7,Math.sin(a)*r*.7],[Math.cos(a+.08)*r*.83,Math.sin(a+.08)*r*.83],[Math.cos(a-.08)*r*.83,Math.sin(a-.08)*r*.83]],'#fff6d1');}}
   c.restore();
  },
  sword(c,x,y,a,alpha=1){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha*=alpha;c.lineWidth=1;
   // Continuous solid blade with a dark bevel and broad cross guard; no separate floating blade.
   this.path(c,[[0,-122],[-11,-97],[-9,50],[-6,59],[6,59],[9,50],[11,-97]],'#fff6d3','#caa95e');
   this.path(c,[[0,-122],[0,55],[6,59],[9,50],[11,-97]],'#c4d6dc');
   this.path(c,[[0,-122],[-4,-88],[-3,45],[0,54]],'#ffffff');
   this.path(c,[[-7,49],[-32,43],[-39,51],[-35,58],[-9,56],[-5,61],[5,61],[9,56],[35,58],[39,51],[32,43],[7,49]],'#d4af5b','#fff1b6');
   this.path(c,[[-4,59],[-4,86],[4,86],[4,59]],'#8c713f','#edda9d');for(let i=0;i<4;i++){c.strokeStyle='#ecce82';c.beginPath();c.moveTo(-4,64+i*5);c.lineTo(4,67+i*5);c.stroke();}
   this.path(c,[[0,83],[-8,90],[0,99],[8,90]],'#edce81','#fff4bf');c.strokeStyle='#b7984d';this.cross(c,0,25,12,1.4);c.restore();
  },
  pose(s,e,at=e.time-s.started){const a=at,c=s.center;if(!c||a<6||a>=8)return null;
   const side=c.x>C.width*.5?-1:1,vp={x:clamp(c.x+side*80,75,C.width-75),y:clamp(c.y-55,100,C.height-100)},va=-side*.5,vb=-side*2.1;
   const down=c.y<C.height*.5?1:-1,hp={x:clamp(c.x-10,112,C.width-112),y:clamp(c.y+down*55,82,C.height-82)},ha=down>0?-1.02:Math.PI+1.02,hb=down>0?1.02:Math.PI-1.02;
   if(a<6.35){const k=smooth((a-6)/.35);return{x:vp.x+side*(1-k)*18,y:vp.y+(1-k)*18,angle:mix(va-side*.25,va,k),alpha:smooth((a-6)/.18)};}
   if(a<6.72){const k=clamp((a-6.35)/.37)**2.4;return{x:vp.x,y:vp.y,angle:mix(va,vb,k),alpha:1,cut:0};}
   if(a<7){const k=smooth((a-6.72)/.28);return{x:mix(vp.x,hp.x,k),y:mix(vp.y,hp.y,k),angle:mix(vb,ha,k),alpha:1};}
   if(a<7.36){const k=clamp((a-7)/.36)**2.3;return{x:hp.x,y:hp.y,angle:mix(ha,hb,k),alpha:1,cut:1};}
   const k=smooth((a-7.36)/.45);return{x:hp.x,y:hp.y-12*k,angle:hb+(down>0?.18:-.18)*k,alpha:1-k};
  },
  edge(c,s,e,pose){if(pose.cut===undefined)return;const old=this.pose(s,e,e.time-s.started-.075);if(!old)return;const tip=p=>({x:p.x+Math.sin(p.angle)*122,y:p.y-Math.cos(p.angle)*122}),a=tip(old),b=tip(pose);c.save();c.globalAlpha*=.58;const grad=c.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,'rgba(188,142,52,0)');grad.addColorStop(.6,'#e2c16b');grad.addColorStop(1,'#fff8d1');c.fillStyle=grad;c.beginPath();c.moveTo(old.x,old.y);c.quadraticCurveTo(a.x,a.y,a.x+(b.x-a.x)*.5,a.y+(b.y-a.y)*.5);c.quadraticCurveTo(b.x,b.y,pose.x,pose.y);c.closePath();c.fill();c.strokeStyle='#fffbea';c.lineWidth=1.6;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo(a.x+(b.x-a.x)*.5,a.y+(b.y-a.y)*.5,b.x,b.y);c.stroke();c.restore();
  },
  floor(r,e){const c=r.ctx;for(const s of S.list(e)){const t=e.balls.find(b=>b.id===s.target),b=e.balls.find(b=>b.id===s.owner);if(!t||!b)continue;const a=e.time-s.started,fade=s.active?1:clamp(1-(e.time-s.finished)/.65);if(fade<=0)continue;c.save();c.globalAlpha=fade;
    this.sigil(c,b.x,b.y,b.radius+15,e.time*.12,7,.45);const strength=s.broken?.17:.6;
    if(a<6){for(let i=1;i<=Math.min(s.stage,6);i++){const age=a-(i-1),k=smooth(age/.42),r0=t.radius+13+i*3;c.save();c.translate(t.x,t.y);c.rotate(i%2?e.time*.09:-e.time*.07);c.scale(1,.55);c.strokeStyle='#d7ba71';c.lineWidth=i===s.stage?1.8: .7;c.globalAlpha*=strength*k;c.beginPath();c.arc(0,0,r0,-Math.PI/2,-Math.PI/2+TAU*k);c.stroke();c.restore();}this.runesAt(c,t.x,t.y+7,t.radius+29,e.time*.2,strength);}
    if(s.center&&a>=6.72){const p=s.center,w=S.config.halfWidth,k=clamp((a-7.48)/.66),eruption=a>=8.14?clamp(1-(a-8.14)/.5):0;
     const trace=(vertical)=>{c.save();c.translate(p.x,p.y);const length=vertical?C.height:C.width;const start=vertical?-p.y:-p.x;c.globalAlpha*=vertical?clamp((a-6.72)/.035):clamp((a-7.36)/.035);if(vertical)c.rotate(Math.PI/2);c.fillStyle='#9d762a';c.globalAlpha*=.22+k*.27;c.fillRect(start,-w,length,w*2);c.globalAlpha=fade*(.6+k*.35);c.fillStyle='#f4d990';c.fillRect(start,-1.5-k*2,length,3+k*4);for(let j=0;j<12;j++){const x=start+((j/12+e.time*.10)%1)*length;c.strokeStyle='#ffe7a2';this.cross(c,x,0,4+k*3,.8);}
      if(eruption){c.globalAlpha=fade*eruption;const light=c.createLinearGradient(0,-w,0,w);light.addColorStop(0,'rgba(218,175,78,0)');light.addColorStop(.18,'#d4ae54');light.addColorStop(.38,'#fff3bc');light.addColorStop(.5,'#ffffff');light.addColorStop(.62,'#fff3bc');light.addColorStop(.82,'#d4ae54');light.addColorStop(1,'rgba(218,175,78,0)');c.fillStyle=light;c.fillRect(start,-w,length,w*2);
       for(let j=0;j<20;j++){const x=start+j/19*length,side=j%2?1:-1,h=(13+(j*17%23))*eruption,base=side*w*.40;c.beginPath();c.moveTo(x-7,base);c.bezierCurveTo(x-8,base+side*h*.45,x+3,base+side*h*.7,x+4,base+side*h);c.bezierCurveTo(x+10,base+side*h*.35,x+5,base+side*h*.2,x+8,base);c.closePath();c.fillStyle=j%3?'#fff4c5':'#dfc16d';c.fill();}
       c.globalAlpha*=.8;for(let j=0;j<18;j++){const x=start+((j/18+e.time*.30)%1)*length;c.strokeStyle='#fffdf0';this.cross(c,x,(j%3-1)*w*.3,4,.85);}}
      c.restore();};trace(true);if(a>=7.36)trace(false);
    }
    if(a>=4&&a<4.7){const k=clamp((a-4)/S.config.purgeDuration),rad=Math.hypot(C.width,C.height)*.5*k;c.strokeStyle='#fff3ce';c.lineWidth=3*(1-k)+1;c.globalAlpha=.7*(1-k);c.beginPath();c.arc(C.width/2,C.height/2,rad,0,TAU);c.stroke();this.sigil(c,C.width/2,55,48,-e.time*.2,5,(1-k)*.8);}
    c.restore();}}
  ,runesAt(c,x,y,rad,t,alpha){c.save();c.translate(x,y);c.scale(1,.55);c.globalAlpha*=alpha;this.runes(c,rad,t);c.restore();},
  front(r,e){const c=r.ctx;for(const s of S.list(e)){const t=e.balls.find(b=>b.id===s.target),b=e.balls.find(b=>b.id===s.owner);if(!t||!b)continue;const a=e.time-s.started,fade=s.active?1:clamp(1-(e.time-s.finished)/.65);if(fade<=0)continue;c.save();c.globalAlpha=fade;
    c.strokeStyle='#d5b66e';this.cross(c,b.x,b.y-8,b.radius+22,1.1);c.globalAlpha*=.3;c.strokeStyle='#fff5d2';this.cross(c,b.x,b.y-8,b.radius+28,3);c.globalAlpha=fade;
    if(a<6.72){const age=a-(s.stage-1),k=smooth(age/.45),fall=(1-k)*48,rad=t.radius+17;this.sigil(c,t.x,t.y-fall,rad,-e.time*.13,s.stage,(s.broken?.16:.85)*(age<.7?1:clamp(1-(age-.7)/.3)));
     if(s.stage>=3&&!s.broken){c.strokeStyle='#cfac5b';this.cross(c,t.x,t.y-2,t.radius+7,1.7);}if(s.stage>=6&&!s.broken){c.save();c.globalAlpha*=.45;c.strokeStyle='#fff2c3';this.cross(c,t.x,t.y-9,51,6);c.restore();}}
    if(a>=6&&a<8.5&&s.center){const q=s.center,k=smooth((a-6)/.32),charge=clamp((a-7.48)/.66);for(let j=0;j<7;j++){const ang=-Math.PI*.9+j*Math.PI*.8/6,rad=55+charge*5,x=q.x+Math.cos(ang)*rad,y=q.y-20+Math.sin(ang)*rad;c.save();c.globalAlpha*=k*(.35+charge*.45);this.sigil(c,x,y,6.5,e.time*.1,j+1,1);c.restore();}if(charge>0&&a<8.14){c.save();c.globalAlpha*=charge*.8;c.strokeStyle='#fff2bb';for(let j=0;j<8;j++){const u=(a*1.2+j/8)%1,side=j%2?1:-1,dist=(1-u)*140;c.beginPath();c.moveTo(q.x+side*dist,q.y-2);c.lineTo(q.x+side*Math.max(0,dist-8),q.y-2);c.moveTo(q.x-2,q.y+side*dist);c.lineTo(q.x-2,q.y+side*Math.max(0,dist-8));c.stroke();}c.restore();}}
    const pose=this.pose(s,e);if(pose){this.edge(c,s,e,pose);this.sword(c,pose.x,pose.y,pose.angle,pose.alpha*fade);}c.restore();}
   for(const f of e.effects||[]){if(f.kind!=='holySeal'||f.style==='seal'||f.style==='judge')continue;const u=clamp(f.age/f.life);c.save();c.translate(f.x,f.y);c.globalAlpha=(1-u)**1.4;c.strokeStyle='#f8e2a1';if(['break','release','purify'].includes(f.style)){for(let i=0;i<10;i++){const a=i*2.399,d=(f.style==='purify'?7:24)+u*28,x=Math.cos(a)*d,y=Math.sin(a)*d-u*19;c.save();c.translate(x,y);c.rotate(a+u);this.path(c,[[-2,-5],[2,-3],[1,5],[-1,3]],i%2?'#fff6d3':'#ceab62');c.restore();}}else if(f.style==='impact'){for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);const d=8+u*(f.part===2?42:26);this.path(c,[[d,0],[d+12*(1-u),-2],[d+18*(1-u),0],[d+12*(1-u),2]],'#fff5c9');c.restore();}}else{c.lineWidth=2;c.beginPath();c.arc(0,0,20+u*19,-2.1,-1.0);c.stroke();}c.restore();}
  }
 };
 const floor=G.HolyView.floor,front=G.HolyView.front;G.HolyView.floor=function(r,e){floor.call(this,r,e);V.floor(r,e);};G.HolyView.front=function(r,e){front.call(this,r,e);V.front(r,e);};
})(typeof window!=='undefined'?window:globalThis);
