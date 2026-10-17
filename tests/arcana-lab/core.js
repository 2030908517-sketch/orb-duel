(function(root){
  'use strict';const G=root.OrbDuel,STEP=1/120,types=['normal','accelerator','vampire','ranger','shield','reflector','trapper','laser'];
  const freeze=(o,seen=new WeakSet())=>{if(!o||typeof o!=='object'||seen.has(o))return o;seen.add(o);for(const v of Object.values(o))freeze(v,seen);return Object.freeze(o);};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function setup(type,scene='hit',seed='arcana-stage-01'){
    if(!types.includes(type)||!['hit','shield','immune','cancel','moving','corner','miss','lateShield','bodyThreat','laserThreat','chargeCancel','crossfire','lethal','cornerEvade','bladeEvade','hunt','huntMiss','scarGrowth','swap','waitContact','noNodes','marked','lowEnergy','silenced','bladeThreat'].includes(scene))throw Error('Unknown fixture');
    const e=new G.Engine([type,type==='ranger'&&scene==='laserThreat'?'laser':'normal'],seed,{mode:'arcana'});e.start();const [b,t]=e.balls;
    for(const v of e.balls){v.speed=0;v.vx=v.vy=0;v.awakening.nextCast=Infinity;}
    Object.assign(b,{x:65,y:170,previousX:65,previousY:170});Object.assign(t,{x:235,y:170,previousX:235,previousY:170});
    G.Awakening.activate(b,e);b.awakening.nextCast=Infinity;b.hp=b.maxHp*.25;b.charges=3;b.role.blood=8;if(type==='vampire')t.role.bloodMark={owner:b.id,until:60};if(t.arcana)t.arcana.used=true;
    if(type==='shield'){for(const v of e.balls){v.maxHp=1000;v.hp=v===b?250:1000;v.speed=v.def.speed;v.vx=v.speed*.8;v.vy=v.speed*.6;}t.vx=-t.speed*.7;t.vy=t.speed*.714;b.nextShield=99;b.shield=0;}
    if(type==='reflector'){b.arcana.debts[t.id]=36;b.arcana.debt=36;b.arcana.scarDebt=36;b.stance.phase='rest';b.stance.next=99;b.role.mirrors=0;Object.assign(b,{speed:120,vx:120,vy:0});Object.assign(t,{speed:100,vx:40,vy:Math.sqrt(8400)});}
    if(type==='vampire'&&!scene.startsWith('hunt')){b.maxHp=t.maxHp=1000;b.hp=250;t.hp=1000;Object.assign(b,{x:125,y:170,previousX:125,previousY:170});t.role.bloodMark=scene==='marked'?{owner:b.id,until:60}:null;if(scene==='lowEnergy')b.role.blood=3;}
    if(scene==='silenced')b.temporal.silenceUntil=30;
    if(type==='trapper'){
      b.maxHp=1000;b.hp=250;t.maxHp=t.hp=1000;b.nextTrap=Infinity;b.mechanism.nextSwap=Infinity;
      Object.assign(b,{x:105,y:170,previousX:105,previousY:170});Object.assign(t,{x:238,y:170,previousX:238,previousY:170,speed:150,vx:-150,vy:0});
      for(const [x,y]of [[40,40],[180,40],[320,40],[40,300],[320,300]])e.traps.push({id:e.nextWorldId++,owner:b.id,x,y,radius:12,blastRadius:45,chainRange:85,armedAt:0,expires:20,raw:4.2,color:b.def.color});
      if(scene==='noNodes')e.traps=[];
      if(scene==='waitContact')t.speed=t.vx=t.vy=0;
      if(scene==='swap'){b.arcana.used=true;b.mechanism.nextSwap=.6;t.speed=t.vx=t.vy=0;}
      if(scene==='corner'){Object.assign(b,{x:23,y:80,previousX:23,previousY:80});Object.assign(t,{x:23,y:126,previousX:23,previousY:126,speed:150,vx:0,vy:-150});}
      if(scene==='cancel'){Object.assign(t,{x:300,previousX:300});}
    }
    if(type==='laser'){b.maxHp=1000;b.hp=250;t.maxHp=t.hp=1000;b.nextLaser=99;b.role.coolingUntil=99;Object.assign(b,{x:70,y:220,previousX:70,previousY:220});Object.assign(t,{x:250,y:150,previousX:250,previousY:150});
      e.projectiles.push({id:e.nextWorldId++,owner:t.id,mode:'counter',x:225,y:95,vx:-16,vy:0,speed:16,radius:5,raw:4,maxBounces:0,bounces:0,expires:8,color:t.def.color});e.traps.push({id:e.nextWorldId++,owner:t.id,x:235,y:245,radius:12,blastRadius:45,chainRange:85,armedAt:0,expires:12,raw:4.2,color:t.def.color});
      if(scene==='bladeThreat'){b.arcana.used=true;b.role.bladeAvailable=true;b.stats.lasersFired=1;b.role.capacitor=.55;t.x=t.previousX=140;t.y=t.previousY=220;}
    }
    if(type==='accelerator'){b.speed=300;b.vx=0;b.vy=-300;}
    if(type==='ranger'){b.role.ammo=0;b.role.reloadUntil=99;b.nextShot=99;e.projectiles.push({id:e.nextWorldId++,owner:t.id,mode:'counter',x:162,y:170,vx:-440,vy:0,speed:440,radius:5,raw:4,maxBounces:0,bounces:0,expires:2,color:t.def.color});}
    if(scene==='moving'){t.speed=110;t.vx=0;t.vy=110;}
    if(scene==='corner'&&type!=='trapper')Object.assign(t,{x:277,y:77,previousX:277,previousY:77});
    if(type==='ranger'&&scene==='cancel')e.projectiles[0].x=300;
    if(type==='ranger'&&scene==='bodyThreat'){e.projectiles=[];Object.assign(t,{x:172,previousX:172,vx:-440,vy:0,speed:440});}
    if(type==='ranger'&&scene==='laserThreat'){e.projectiles=[];t.laser={origin:{x:t.x,y:t.y},angle:Math.PI,trackUntil:0,fireAt:.16,locked:true,awake:false};t.role.capacitor=0;t.role.coolingUntil=99;}
    if(type==='ranger'&&scene==='cornerEvade'){e.projectiles=[];Object.assign(b,{x:26,y:26,previousX:26,previousY:26});Object.assign(t,{x:86,y:26,previousX:86,previousY:26,vx:-360,vy:0,speed:360});}
    if(type==='ranger'&&scene==='bladeEvade'){
      e.projectiles=[{id:e.nextWorldId++,owner:t.id,mode:'arcBlood',noMirror:true,noMagnet:true,launched:true,x:178,y:170,vx:-300,vy:0,speed:300,radius:15,raw:10,expires:3,range:400,travel:0,history:[],maxBounces:0,bounces:0,color:'#ed668a'}];
      // Fixed forward route isolates the immunity/phasing behavior; the normal
      // game still chooses among all legal, danger-scored routes.
      G.RangerArcana.begin(b,t,G.RangerArcana.threats(b,e)[0],{x:157,y:170,angle:0,distance:92},e);
    }
    if(scene==='hunt'||scene==='huntMiss'){b.arcana.used=true;b.role.blood=0;t.role.bloodMark=null;b.hunt.awake=true;b.hunt.missing[t.id]=-6;b.speed=b.def.speed;b.vx=0;b.vy=0;}
    if(scene==='scarGrowth'){b.arcana.used=true;b.arcana.debt=0;b.arcana.debts={};b.arcana.scarDebt=0;b.speed=b.vx=b.vy=t.speed=t.vx=t.vy=0;b.hp=1000;}
    // The fixture begins already awakened, not in the middle of an unrelated awaken animation.
    e.effects=[];e.soundEvents=[];
    if(scene==='lethal')t.hp=6;
    if(scene==='shield'){t.shield=25;t.shieldUntil=60;}
    return e;
  }
  function build(type='normal',scene='hit',seed='arcana-stage-01',observe=true){
    const e=setup(type,scene,seed),clock=new G.Clock(e),frames=[],events=[],seenEffects=new WeakSet(),seenHits=new Set();let prevPhase='idle',prevStop=0,immuneApplied=false,cancelApplied=false,shieldRemoved=false,healed=0,displaced=false,lateShield=false,crossfire=false,biteDisplaced=false;
    const add=(kind,data={})=>events.push(freeze({id:type+':'+events.length,kind,frame:frames.length,rawTime:frames.length*STEP,simTime:e.time,tick:e.tick,...data}));
    if(observe)G.Presentation.capture(e);
    for(let i=0;i<(type==='shield'||scene==='scarGrowth'?1200:type==='trapper'?900:type==='vampire'&&!scene.startsWith('hunt')?1260:600);i++){
      if((scene==='cancel'||scene==='chargeCancel')&&!cancelApplied&&e.time>=(scene==='chargeCancel'?.65:type==='ranger'?.55:.35)){G.Temporal.silence(e.balls[0],e.balls[1],e,8);cancelApplied=true;add('fixture.silence');}
      if(scene==='shield'&&!['accelerator','ranger'].includes(type)&&!shieldRemoved&&e.time>=1){e.balls[1].shield=0;shieldRemoved=true;add('fixture.shieldEnds');}
      if(scene==='crossfire'&&!crossfire&&e.time>=.04){const t=e.balls[1];e.projectiles.push({id:e.nextWorldId++,owner:t.id,mode:'counter',x:65,y:70,vx:0,vy:440,speed:440,radius:5,raw:4,maxBounces:0,bounces:0,expires:2,color:t.def.color});crossfire=true;add('fixture.secondThreat');}
      if(scene==='scarGrowth'&&i%120===0){G.Combat.resolveBatch([{source:e.balls[1],target:e.balls[0],kind:'shot',raw:8}],e);}
      if(scene==='huntMiss'&&!displaced&&e.balls[0].hunt.phase==='flight'){Object.assign(e.balls[1],{x:48,y:300,previousX:48,previousY:300});displaced=true;}
      clock.advance(STEP);const b=e.balls[0],t=e.balls[1],u=b.arcana;
      if(scene==='immune'&&u.used&&!immuneApplied){Object.assign(t.ghost,{phase:'phased',until:60});immuneApplied=true;add('fixture.lateImmunity');}
      if(scene==='lateShield'&&u.used&&!lateShield){t.shield=80;t.shieldUntil=60;lateShield=true;add('fixture.lateShield');}
      if(scene==='miss'&&type==='reflector'&&!displaced&&e.arcanaWorld.defense.bolts.length){Object.assign(t,{x:45,y:300,previousX:45,previousY:300});displaced=true;add('fixture.targetMoved');}
      if(scene==='miss'&&!displaced&&e.projectiles.some(p=>p.mode==='arcBlood'&&p.launched||p.mode==='arcPierce')){Object.assign(t,{x:45,y:300,previousX:45,previousY:300,vx:0,vy:0,speed:0});displaced=true;add('fixture.targetMoved');}
      if(scene==='miss'&&type==='laser'&&!displaced&&u.phase==='laserSweep'){Object.assign(t,{x:26,y:30,previousX:26,previousY:30,speed:0,vx:0,vy:0});displaced=true;add('fixture.evadeSolar');}
      if(scene==='miss'&&type==='vampire'&&!biteDisplaced&&u.phase==='bloodBite'){const far=[[23,23],[337,23],[23,317],[337,317]].sort((a,c)=>Math.hypot(c[0]-b.x,c[1]-b.y)-Math.hypot(a[0]-b.x,a[1]-b.y))[0];Object.assign(t,{x:far[0],y:far[1],previousX:far[0],previousY:far[1],vx:0,vy:0,speed:0});biteDisplaced=true;add('fixture.evadeBite');}
      if(scene==='miss'&&type==='accelerator'&&!displaced&&u.phase==='sonicRecovery'){const far=[[23,23],[337,23],[23,317],[337,317]].sort((a,b)=>Math.hypot(b[0]-u.center.x,b[1]-u.center.y)-Math.hypot(a[0]-u.center.x,a[1]-u.center.y))[0];Object.assign(t,{x:far[0],y:far[1],previousX:far[0],previousY:far[1],vx:0,vy:0,speed:0});displaced=true;add('fixture.targetMoved');}
      const phase=scene.startsWith('hunt')?b.hunt.phase:u.phase;if(phase!==prevPhase){add('phase',{phase,previous:prevPhase,used:u.used});prevPhase=phase;}
      for(const f of e.effects)if(['arcana','hunt','mechanism','laserBlade'].includes(f.kind)&&!seenEffects.has(f)){seenEffects.add(f);add('effect',{style:f.style,x:f.x,y:f.y,angle:f.angle??u.aim,...(f.style==='blink'?{endX:f.endX,endY:f.endY}:{})});}
      if(e.hitStopSerial!==prevStop){prevStop=e.hitStopSerial;add('hold',{seconds:e.hitStopDuration,reason:scene.startsWith('hunt')?'mark-contact':u.phase==='punch'?'anticipation':e.effects.some(f=>f.kind==='arcana'&&['fistImpact','sonicImpact','bloodRupture','bloodBiteHit'].includes(f.style)&&f.age===0)?'impact':'release'});}
      for(const s of e.soundEvents)if(s.kind.startsWith('arc')||s.kind.startsWith('hunt')||s.kind.startsWith('heatBlade')||s.kind==='mechanismSwap')add('cue',{cue:s.kind,x:(s.pan/1.2+.5)*360});
      if(observe)for(const h of G.Presentation.timeline(e).events)if(h.kind==='combat.hit'&&!seenHits.has(h.id)){seenHits.add(h.id);if(h.attack.startsWith('arc'))add('hit',{attack:h.attack,actual:h.actual,blocked:h.blocked,avoided:h.avoided,targetId:h.targetId});}
      if(b.stats.healing>healed){add('heal',{amount:b.stats.healing-healed,x:t.x,y:t.y,endX:b.x,endY:b.y});healed=b.stats.healing;}
      const state=root.structuredClone(e);state.soundEvents=[];frames.push(freeze({rawTime:i*STEP,simTime:e.time,tick:e.tick,hold:clock.stopRemaining,holdDuration:e.hitStopDuration,phase:u.phase,source:freeze(state)}));e.soundEvents.length=0;
    }
    return freeze({schema:1,type,scene,seed,step:STEP,frames,events,finalSnapshot:JSON.stringify(e.snapshot()),rng:e.rng.state,fxRng:e.fxRng.state});
  }
  function tune(p={}){const v=(k,d,a,b)=>clamp(Number.isFinite(p[k])?p[k]:d,a,b);return Object.freeze({strength:v('strength',1,.5,1.5),shake:v('shake',1,0,1.5),volume:v('volume',.8,0,1),hitHold:v('hitHold',.09,0,.34),bloodFlight:v('bloodFlight',1,1,2)});}
  function timeline(clip,options={},original=false){
    const o=tune(options),times=[],weights=[];let time=0;
    for(let i=0;i<clip.frames.length;i++){
      const f=clip.frames[i],still=i>0&&f.tick===clip.frames[i-1].tick;let weight=1;
      if(!original&&still&&clip.type==='vampire'){
        if(clip.type==='normal'&&f.phase==='punch')weight=1;
        else if(clip.type==='accelerator'&&Math.abs(f.holdDuration-.26)<.001)weight=.035/f.holdDuration;
        else if(clip.type==='vampire'&&Math.abs(f.holdDuration-.36)<.001)weight=.12/f.holdDuration;
        else if(f.holdDuration>=.2&&f.holdDuration<=.35)weight=o.hitHold/f.holdDuration;
      }
      if(!original&&!still&&clip.type==='accelerator'&&f.phase==='rush')weight=1.6;
      if(!original&&!still&&clip.type==='vampire'&&f.source.projectiles.some(p=>p.mode==='arcBlood'&&p.launched))weight=o.bloodFlight;
      times.push(time);weights.push(weight);time+=clip.step*weight;
    }
    const mapped=clip.events.map(e=>({...e,time:times[e.frame],...(e.cue==='arcBloodHit'?{blockedOnly:clip.events.some(h=>h.kind==='hit'&&h.frame===e.frame&&h.blocked>0)&&!clip.events.some(h=>h.kind==='hit'&&h.frame===e.frame&&h.actual>0)}:{})}));
    if(!original&&clip.type==='vampire')for(const h of clip.events.filter(e=>e.kind==='hit'&&e.blocked>0&&e.actual===0&&!e.avoided)){if(!clip.events.some(e=>e.cue==='arcBloodHit'&&e.frame===h.frame)){const target=clip.frames[h.frame].source.balls.find(b=>b.id===h.targetId);mapped.push({...h,id:'director:block:'+h.id,kind:'cue',cue:'labBloodBlock',time:times[h.frame],x:target?.x,blockedOnly:true});}}
    
    mapped.sort((a,b)=>a.time-b.time);return {times,weights,duration:time,events:mapped,original};
  }
  function sample(clip,map,time){let lo=0,hi=map.times.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(map.times[mid]<=time)lo=mid;else hi=mid-1;}return {frame:clip.frames[lo],index:lo,events:map.events.filter(e=>e.time<=time),time};}
  G.ArcanaLab=Object.freeze({types,setup,build,tune,timeline,sample,freeze,clamp});
})(typeof window!=='undefined'?window:globalThis);
