(function(root){
  'use strict';
  const G=root.OrbDuel,DT=G.Constants.dt;
  const profiles=Object.freeze({
    A:Object.freeze({name:'脆响',tag:'短促 · 硬接触',deform:.07,life:.20,body:.085,shake:0,particles:6}),
    B:Object.freeze({name:'弹压',tag:'压缩 · 弹性回收',deform:.23,life:.36,body:.24,shake:0,particles:0}),
    C:Object.freeze({name:'冲量',tag:'定向 · 压力释放',deform:.14,life:.30,body:.30,shake:1.15,particles:6})
  });
  const fixtures=Object.freeze({
    head:{name:'正面相撞',balls:[[54,170,1,0],[306,170,-1,0]]},
    oblique:{name:'斜向接触',balls:[[72,144,1,0],[288,174,-1,0]]},
    corner:{name:'靠近右下角',balls:[[238,273,1,.25],[332,294,-1,-.15]]},
    miss:{name:'错身未碰撞',balls:[[54,120,1,0],[306,212,-1,0]]}
  });
  function setup(name,seed){
    if(!fixtures[name])throw Error('Unknown fixture');
    const e=new G.Engine(['normal','normal'],seed);
    e.balls.forEach((b,i)=>{const [x,y,vx,vy]=fixtures[name].balls[i],len=Math.hypot(vx,vy);Object.assign(b,{x,y,previousX:x,previousY:y,vx:vx/len*b.speed,vy:vy/len*b.speed});});
    e.start();return e;
  }
  function frame(e){return Object.freeze({tick:e.tick,time:e.time,balls:Object.freeze(e.balls.map(b=>Object.freeze({id:b.id,x:b.x,y:b.y,vx:b.vx,vy:b.vy,radius:b.radius,hp:b.hp,maxHp:b.maxHp,trail:Object.freeze(b.trail.map(v=>Object.freeze({...v})))})))});}
  function buildClip(name='head',seed='collision-001',observe=true){
    const e=setup(name,seed),frames=[frame(e)],events=[];
    if(observe)G.Presentation.capture(e);
    for(let i=0;i<288;i++){
      const count=e.collisions;e.step();
      if(e.collisions>count){
        const [a,b]=e.balls,angle=Math.atan2(b.y-a.y,b.x-a.x);
        const hits=e.pendingAttacks.filter(h=>h.kind==='contact').map(h=>Object.freeze({sourceId:h.source.id,targetId:h.target.id,actual:h.actual||0,blocked:h.blocked||0,avoided:h.avoided||0}));
        events.push(Object.freeze({id:name+':contact:'+count,tick:e.tick,time:e.time,x:(a.x+b.x)/2,y:(a.y+b.y)/2,angle,hits:Object.freeze(hits)}));
      }
      frames.push(frame(e));
    }
    return Object.freeze({schema:1,version:'collision-study-1',fixture:name,seed,duration:e.time,dt:DT,frames:Object.freeze(frames),events:Object.freeze(events),finalSnapshot:JSON.stringify(e.snapshot()),rng:e.rng.state,fxRng:e.fxRng.state,observations:observe?G.Presentation.timeline(e).events:[]});
  }
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function tune(patch={}){return Object.freeze({deform:clamp(Number.isFinite(patch.deform)?patch.deform:1,0,1.5),strength:clamp(Number.isFinite(patch.strength)?patch.strength:1,.5,1.5),volume:clamp(Number.isFinite(patch.volume)?patch.volume:.65,0,1),camera:patch.camera!==false,effects:patch.effects!==false});}
  function stateAt(clip,time){
    const s=clamp(time,0,clip.duration)/DT,i=Math.min(clip.frames.length-1,Math.floor(s)),f=clip.frames[i],next=clip.frames[Math.min(i+1,clip.frames.length-1)],mix=s-i;
    return {time:clamp(time,0,clip.duration),tick:f.tick,balls:f.balls.map((b,j)=>({...b,x:b.x+(next.balls[j].x-b.x)*mix,y:b.y+(next.balls[j].y-b.y)*mix})),events:clip.events.filter(e=>time>=e.time&&time-e.time<.7)};
  }
  function deformation(key,age,scale=1){
    if(age<0||age>.42)return 0;
    const q=key==='A'?profiles.A.deform*Math.exp(-age*42):key==='B'?profiles.B.deform*Math.exp(-age*13)*Math.cos(age*34):profiles.C.deform*Math.exp(-age*23)*Math.cos(Math.max(0,age-.022)*32);
    return q*scale;
  }
  G.CollisionStudy=Object.freeze({profiles,fixtures,setup,buildClip,stateAt,tune,deformation,clamp});
})(typeof window!=='undefined'?window:globalThis);
