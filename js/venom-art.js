(function(root){
 'use strict';const G=root.OrbDuel,V=G.Venom,TAU=Math.PI*2,cache=new WeakMap(),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,k)=>a+(b-a)*k,fract=x=>x-Math.floor(x);
 const A=G.VenomArt={
  state(e){let s=cache.get(e);if(!s||s.epoch!==e.presentationEpoch){s={epoch:e.presentationEpoch,targets:new Map(),pools:new Map()};cache.set(e,s);}return s;},
  target(b,e){const s=this.state(e);let v=s.targets.get(b.id);if(!v){v={erosion:-Infinity,paralysis:-Infinity,damage:-Infinity,mistEnter:-Infinity};s.targets.set(b.id,v);}return v;},
  flash(at,t,life=.32){return clamp(1-(t-at)/life);},
  contour(c,x,y,r,t,seed,flat=1){c.beginPath();for(let i=0;i<=48;i++){const a=i*TAU/48,d=r*(1+.065*Math.sin(a*5-t*1.55+seed)+.027*Math.sin(a*9+t*.9));const xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*flat;if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);}c.closePath();},
  clip(c,p,e,r){c.beginPath();for(let i=0;i<=64;i++){const a=i*TAU/64,nx=Math.cos(a),ny=Math.sin(a),wall=G.ArenaWalls?.hit(p.x,p.y,nx,ny,0,e).distance??Infinity,team=e.mode==='2v2'?G.Team.rayLimit(p.x,p.y,nx,ny,0,e.obstacles):Infinity,shape=.86+.085*Math.sin(a*3+p.id*.8)+.045*Math.sin(a*7-p.id*.5),d=Math.min(r*shape,wall,team);if(i)c.lineTo(p.x+nx*d,p.y+ny*d);else c.moveTo(p.x+nx*d,p.y+ny*d);}c.closePath();c.clip();},
  pool(r,p,e){if(!p.venomV2)return;const c=r.ctx,t=e.time,stage=V.stage(p,t),fog=stage==='mist',dense=stage==='concentrated',actualRadius=V.radius(p,t),s=this.state(e);let view=s.pools.get(p.id);if(!view){view={inside:new Map()};s.pools.set(p.id,view);}const validIds=new Set(e.pools.map(v=>v.id));for(const id of s.pools.keys())if(!validIds.has(id))s.pools.delete(id);
   const phaseAt=fog?p.mistAt:dense?p.concentrateAt:p.armedAt,k=clamp((t-phaseAt)/(fog?.8:.65)),fade=clamp((p.expires-t)/.65),armed=t>=p.armedAt,blend=k*k*(3-2*k),previousRadius=(fog?V.config.concentratedRadius:V.config.normalRadius)*p.scale,radius=stage==='normal'?actualRadius:mix(previousRadius,actualRadius,blend);
   c.save();this.clip(c,p,e,radius);c.translate(p.x,p.y);c.globalAlpha=fade*(armed?1:.35);

   if(fog){this.fog(c,p,radius,t,k);if(k<1){c.save();c.globalAlpha*=1-k;this.liquid(c,p,V.config.concentratedRadius*p.scale*(1-k*.72),t,true,1);c.restore();}}
   else this.liquid(c,p,radius,t,dense,k);
   const inside=new Map();for(const b of e.balls){if(!G.World.enemy(p.owner,b,e)||!G.World.targetable(b,e)||!V.contains(p,b,e))continue;const entry=view.inside.get(b.id)??t;inside.set(b.id,entry);if(fog&&(!view.inside.has(b.id)||view.stage!=='mist'))this.target(b,e).mistEnter=t;this.react(c,p,b,e,stage,entry,radius);}
   view.inside=inside;view.stage=stage;c.restore();
  },
  liquidPhase(p,t,dense){const age=Math.max(0,t-p.concentrateAt);return t*1.2+(dense?1.3*(age<.65?age*age/1.3:age-.325):0);},
  liquid(c,p,radius,t,dense,k){const seed=p.id*.73,phaseTime=this.liquidPhase(p,t,dense),core=radius*(dense?mix(.91,.85,k):.91);
   // A dark undercut and selective filled wet edge give the liquid thickness.
   this.contour(c,0,2,core,phaseTime,seed);c.fillStyle='#162e20dd';c.fill();
   this.contour(c,0,-1,core*.97,phaseTime,seed);c.fillStyle=dense?'rgba('+Math.round(mix(85,114,k))+','+Math.round(mix(147,175,k))+','+Math.round(mix(51,53,k))+','+mix(.82,.94,k)+')':'#559333d0';c.fill();
   for(let j=0;j<5;j++){const a=j*2.1+seed,d=core*.36,x=Math.cos(a)*d+Math.sin(t*.8+j)*core*.045,y=Math.sin(a)*d+Math.sin(t*.65+j*1.7)*core*.04;this.contour(c,x,y,core*(.41+.08*Math.sin(t+j)),phaseTime,seed+j,.56);c.fillStyle=j%2?'#a0d64b75':'#214b28a5';c.fill();}
   // Broken, uneven highlight islands: no rotating stroked arcs.
   for(let j=0;j<6;j++){const a=seed+j*1.05+.13*Math.sin(t*.9+j),x=Math.cos(a)*core*.83,y=Math.sin(a)*core*.83;c.save();c.translate(x,y);c.rotate(a+1.57);this.contour(c,0,0,3+Math.sin(t+j),t,seed+j,.28);c.fillStyle=j%2?'#c5ef7390':'#92cd51c0';c.fill();c.restore();}
   const count=dense?3:5;for(let i=0;i<count;i++){const phase=fract(t*.50+(dense?Math.max(0,t-p.concentrateAt)*.36*k:0)+i*.381+seed),a=i*2.399+seed,d=core*(.22+.48*fract(i*.613)),x=Math.cos(a)*d,y=Math.sin(a)*d,max=(dense?4.7:4.3)*p.scale;
    if(phase<.79){const q=phase/.79,rr=max*Math.sin(q*Math.PI*.75),rise=rr*(.5+q),yy=y-rise;
     c.beginPath();c.moveTo(x-rr*.8,y+1);c.bezierCurveTo(x-rr*.3,y-rise*.4,x-rr*.65,yy,x-rr*.5,yy);c.lineTo(x+rr*.5,yy);c.bezierCurveTo(x+rr*.6,yy,x+rr*.2,y-rise*.4,x+rr*.8,y+1);c.fillStyle='#67ab37dd';c.fill();
     c.beginPath();c.ellipse(x,yy,rr,rr*.9,0,0,TAU);c.fillStyle='#244c28';c.fill();c.beginPath();c.ellipse(x-.3,yy-.7,rr*.83,rr*.74,0,0,TAU);c.fillStyle=dense?'#8ccc3d':'#78bc43';c.fill();c.beginPath();c.ellipse(x-rr*.26,yy-rr*.48,rr*.4,rr*.19,-.35,0,TAU);c.fillStyle='#e6ffb7cf';c.fill();
    }else{const q=(phase-.79)/.21;for(let j=0;j<3;j++){const side=j-1;c.beginPath();c.ellipse(x+side*(3+7*q),y-2-10*Math.sin(q*Math.PI)*(1-Math.abs(side)*.25),(.6+1.0*(1-q))*p.scale,(1+1.4*(1-q))*p.scale,side*.6,0,TAU);c.fillStyle='rgba(174,228,90,'+((1-q)*.8)+')';c.fill();}}
   }
  },
  noise(x,y){const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v);},
  fogLayers:new WeakMap(),
  // Marching contours keep the gas continuous while matching the game's crisp filled shapes.
  fogFrame(p,t){const frame=Math.floor(t*24);let cached=this.fogLayers.get(p);if(cached?.frame===frame)return cached;const N=36,grid=new Float32Array((N+1)*(N+1)),clock=frame/24,seed=(p.id||0)*.37;
   for(let y=0;y<=N;y++)for(let x=0;x<=N;x++){const u=x/N*2-1,v=y/N*2-1,r=Math.hypot(u,v),a=Math.atan2(v,u),edge=clamp((.88+.055*Math.sin(a*3+seed)+.035*Math.sin(a*7-seed)-r)*5),wx=u+.10*Math.sin(v*4+clock*.5),wy=v-clock*.055+.08*Math.sin(u*4-clock*.4);let xx=wx,yy=wy;for(const core of [[-.30,-.12,1.5],[.34,.25,-1.7]]){const dx=xx-core[0],dy=yy-core[1],r2=dx*dx+dy*dy,angle=core[2]*Math.exp(-r2*4)*(1+.18*Math.sin(clock*.55)),cs=Math.cos(angle),sn=Math.sin(angle);xx=core[0]+dx*cs-dy*sn;yy=core[1]+dx*sn+dy*cs;}const n=this.noise(xx*4.2+seed,yy*4.2)*.72+this.noise(xx*7.5+seed-clock*.04,yy*7.5)*.28;grid[y*(N+1)+x]=edge*(.12+.92*n);}
   const table=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],[[3,0],[1,2]],[[0,2]],[[3,2]],[[2,3]],[[0,2]],[[0,1],[2,3]],[[1,2]],[[3,1]],[[0,1]],[[3,0]],[]],layers=[];
   for(const level of [.12,.34,.51,.65]){const nodes=new Map(),segments=[];const vertex=(key,x,y)=>{if(!nodes.has(key))nodes.set(key,{x:x/N*2-1,y:y/N*2-1,edges:[]});return key;};
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const values=[grid[y*(N+1)+x],grid[y*(N+1)+x+1],grid[(y+1)*(N+1)+x+1],grid[(y+1)*(N+1)+x]],bits=values.reduce((m,v,i)=>m|(v>=level?1<<i:0),0);if(!table[bits].length)continue;const pairs=bits===5&&(values.reduce((a,b)=>a+b,0)/4>level)?[[0,1],[2,3]]:bits===10&&(values.reduce((a,b)=>a+b,0)/4>level)?[[3,0],[1,2]]:table[bits];const point=edge=>{const ends=[[0,1],[1,2],[3,2],[0,3]][edge],a=values[ends[0]],b=values[ends[1]],q=clamp((level-a)/(b-a||1));return edge===0?vertex('h'+x+':'+y,x+q,y):edge===1?vertex('v'+(x+1)+':'+y,x+1,y+q):edge===2?vertex('h'+x+':'+(y+1),x+q,y+1):vertex('v'+x+':'+y,x,y+q);};for(const pair of pairs){const a=point(pair[0]),b=point(pair[1]),id=segments.length;segments.push({a,b,used:false});nodes.get(a).edges.push(id);nodes.get(b).edges.push(id);}}
    const paths=[];for(const first of segments){if(first.used)continue;const path=[],begin=first.a;let key=begin,guard=0;do{const node=nodes.get(key);path.push({x:node.x,y:node.y});const id=node.edges.find(i=>!segments[i].used);if(id===undefined)break;const edge=segments[id];edge.used=true;key=edge.a===key?edge.b:edge.a;}while(key!==begin&&++guard<6000);if(path.length>6)paths.push(path);}layers.push(paths);
   }cached={frame,layers};this.fogLayers.set(p,cached);return cached;
  },
  fog(c,p,radius,t,k){const{layers}=this.fogFrame(p,t),colors=['#3d6836','#5c9646','#8dc867','#b7de89'],opacity=[.10,.22,.32,.24];c.save();c.globalAlpha*=clamp(k*2);for(let j=0;j<layers.length;j++){c.save();c.globalAlpha*=opacity[j];c.fillStyle=colors[j];c.beginPath();for(const points of layers[j]){const end=points.at(-1),first=points[0];c.moveTo((end.x+first.x)*radius*.5,(end.y+first.y)*radius*.5);for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];c.quadraticCurveTo(a.x*radius,a.y*radius,(a.x+b.x)*radius*.5,(a.y+b.y)*radius*.5);}c.closePath();}c.fill('evenodd');c.restore();}c.restore();
  },
  react(c,p,b,e,stage,entry,radius){const t=e.time,dx=b.x-p.x,dy=b.y-p.y,a=Math.atan2(dy,dx),initial=this.flash(entry,t,.65),dense=stage==='concentrated',fog=stage==='mist';if(fog){const birth=this.flash(this.target(b,e).mistEnter,t,.8),power=Math.max(initial,birth);for(let i=0;i<5;i++){const side=i%2?1:-1,u=fract(t*.65+i*.23),x=dx+side*(b.radius+2)*Math.sin(u*Math.PI),y=dy+b.radius*(1-2*u);c.beginPath();c.moveTo(x-4,y+4);c.bezierCurveTo(x+side*7,y,x-side*6,y-5,x+3,y-8);c.strokeStyle='rgba(181,237,113,'+((.14+power*.40)*Math.sin(u*Math.PI))+')';c.lineWidth=2+power*2;c.stroke();}return;}const strength=initial*(dense?1.6:1.3)+.24*(.5+.5*Math.sin((t-entry)*5)),x=dx-Math.cos(a)*b.radius*.88,y=dy-Math.sin(a)*b.radius*.88;
   for(const side of [-1,1]){const sa=a+side*.4,sx=Math.cos(sa)*radius*.43,sy=Math.sin(sa)*radius*.43;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo((sx+x)*.5-side*dy*.10,(sy+y)*.5+side*dx*.10,x,y);c.quadraticCurveTo((sx+x)*.5-side*dy*.10+side*3.3,(sy+y)*.5+side*dx*.10,sx+side*3.3,sy);c.closePath();c.fillStyle='rgba(171,225,104,'+(strength*(dense?.65:.55))+')';c.fill();}
   const purple=dense?this.flash(this.target(b,e).paralysis,t,.4):0;if(purple>0){c.beginPath();c.moveTo(x-3,y+1);c.quadraticCurveTo(x,y-3,x+3,y+1);c.strokeStyle='rgba(181,237,113,'+(purple*.5)+')';c.lineWidth=1.3;c.stroke();}
   if(initial>0){for(let i=0;i<(dense?4:2);i++){const q=1-initial,s=i%2?1:-1;c.beginPath();c.ellipse(x+s*(2+i)*q,y-15*Math.sin(q*Math.PI)*(1+i*.13),.8+initial*.4,1.6*initial+.35,a+s*.4,0,TAU);c.fillStyle='rgba(194,239,123,'+(initial*.65)+')';c.fill();}}
  },
  skin(r,b,e){if(b.hp<=0||G.World.absent(b,e)||G.VampireHunt?.hidden(b)||G.Charge?.flowing(b)||['core','rebirth'].includes(b.stellar?.phase))return;const layers=V.layers(b,e.time),green=layers.filter(v=>v.type==='erosion').length,purple=layers.filter(v=>v.type==='paralysis').length;if(!green&&!purple&&!V.inMist(b,e))return;
   const c=r.ctx,t=e.time,v=this.target(b,e),tick=this.flash(v.damage,t,.28),ge=this.flash(v.erosion,t,.35),pa=this.flash(v.paralysis,t,.4),mist=V.inMist(b,e),rad=b.radius;c.save();if(G.Ghost.phased(b))c.globalAlpha=.35;c.translate(b.x,b.y);
   if(mist){const entry=this.flash(v.mistEnter,t,.75),u=t*.8+b.id;for(const side of [-1,1]){c.beginPath();c.moveTo(side*rad*.68,-rad*.8);c.bezierCurveTo(side*(rad+3),-rad*.35,side*(rad+3),rad*.55,side*rad*.58,rad*.85);c.strokeStyle='rgba(181,237,113,'+(.17+entry*.35)+')';c.lineWidth=2.2+Math.sin(u+side)*.6;c.stroke();}}
   // Keep the central character emblem clear. Surface stains cannot cover the face.
   c.beginPath();c.arc(0,0,rad*.96,0,TAU);c.arc(0,0,rad*.55,0,TAU,true);c.clip('evenodd');
   if(green){for(let i=0;i<green+3;i++){const a=b.id*.7+i*2.399,x=Math.cos(a)*rad*.78,y=Math.sin(a)*rad*.78,w=2.2+green*.45+ge*.5;this.contour(c,x,y,w,t*.3+i,b.id+i,.7+tick*.2);c.fillStyle='rgba(143,205,76,'+(.10+green*.045+tick*.18+ge*.14)+')';c.fill();c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x*.9-y*.15,y*.9+x*.15,x*.75,y*.75);c.strokeStyle='rgba(182,234,113,'+(.12+tick*.35+ge*.22)+')';c.lineWidth=.8+green*.15;c.stroke();}}
   if(purple){const beat=Math.pow(Math.max(0,Math.sin(t*(4+purple*.6)+b.id)),6);for(let i=0;i<purple+2;i++){const a=i*2.07+b.id*.8,x=Math.cos(a)*rad*.83,y=Math.sin(a)*rad*.83,shift=Math.sin(t*12+i)*.28*purple;c.save();c.translate(x,y);c.rotate(a+Math.PI/2);c.beginPath();c.moveTo(-4,-.5+shift);c.bezierCurveTo(-1.5,-2.3,1.5,2.3,4,.5-shift);c.strokeStyle='rgba(181,237,113,'+(.12+purple*.035+beat*.13+pa*.30)+')';c.lineWidth=1+pa*.6;c.stroke();c.restore();}}
   if(ge>0||pa>0){const amount=Math.max(ge,pa),color=pa>ge?'181,237,113':'182,235,119';for(let i=0;i<3;i++){const a=b.id+i*2.2,rr=rad*(.87-.05*(1-amount));c.beginPath();c.arc(0,0,rr,a,a+.35);c.strokeStyle='rgba('+color+','+(amount*.42)+')';c.lineWidth=1.3;c.stroke();}}
   c.restore();
  },
  inspect(e){const s=this.state(e);return {targets:[...s.targets].map(([id,v])=>({id,...v})),pools:[...s.pools].map(([id,v])=>({id,inside:[...v.inside.keys()]}))};}
 };
 const add=V.add;V.add=function(b,t,e,type,options){const result=add.call(this,b,t,e,type,options);if(['add','refresh','replace'].includes(result))A.target(t,e)[type==='erosion'?'erosion':'paralysis']=e.time;return result;};
 const observe=G.Presentation.observeHits;G.Presentation.observeHits=function(hits,e){observe.call(this,hits,e);for(const h of hits)if(h.kind==='poison'&&h.actual>0)A.target(h.target,e).damage=e.time;};
 V.drawPool=function(r,p,e){A.pool(r,p,e);};
 const draw=G.Renderer.prototype.drawBall;G.Renderer.prototype.drawBall=function(b,e){draw.call(this,b,e);A.skin(this,b,e);};
})(typeof window!=='undefined'?window:globalThis);
