(function(root){
  'use strict';const G=root.OrbDuel,TAU=Math.PI*2,states=new WeakMap(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const defaults=Object.freeze({size:1,duration:1,particles:12,shake:1,gain:1});
  const profiles=Object.freeze(Object.fromEntries(Object.entries({
    'impact.light':{stage:'hit',shape:'impact',radius:22,life:.3,cue:'ball',shake:.4,tier:1},
    'impact.heavy':{stage:'hit',shape:'impact',radius:55,life:.6,cue:'largeHit',shake:2.2,tier:3},
    'ability.prepare':{stage:'prepare',shape:'prepare',radius:45,life:.45,cue:'charge',shake:0,tier:2},
    'ability.travel':{stage:'travel',shape:'trail',radius:23,life:.25,cue:null,shake:0,tier:2},
    'ability.release':{stage:'release',shape:'ring',radius:75,life:.65,cue:'fistRelease',shake:.8,tier:3},
    'feedback.block':{stage:'hit',shape:'ring',radius:30,life:.35,cue:'shieldHit',shake:.25,tier:1},
    'feedback.avoided':{stage:'hit',shape:'fade',radius:26,life:.35,cue:null,shake:0,tier:1},
    'feedback.cancel':{stage:'cancel',shape:'fade',radius:32,life:.35,cue:null,shake:0,tier:1},
    'feedback.resource':{stage:'recovery',shape:'ring',radius:24,life:.45,cue:'heal',shake:0,tier:1}
  }).map(([k,v])=>[k,Object.freeze(v)])));
  const fresh=()=>({params:{...defaults},fx:[],ui:[],seen:new Set(),sequence:0,observed:0,recording:false,timeline:[],dropped:0,droppedTrace:0,drawnParticles:0});
  const state=e=>{if(!states.has(e))states.set(e,fresh());return states.get(e);};
  const number=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
  const text=v=>typeof v==='string'?v.slice(0,100):null;
  function hash(value){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
  function trace(e,event){const s=state(e);if(!s.recording)return;if(s.timeline.length===800){s.timeline.shift();s.droppedTrace++;}s.timeline.push(Object.freeze({...event}));}
  G.Presentation={
    version:'20261015-feel1',defaults,profiles,
    reset(e){states.set(e,fresh());},
    configure(e,patch){const s=state(e),ranges={size:[.25,3],duration:[.25,2],particles:[0,48],shake:[0,3],gain:[0,2]};for(const [k,v]of Object.entries(patch||{}))if(ranges[k]&&Number.isFinite(v))s.params[k]=clamp(k==='particles'?Math.round(v):v,...ranges[k]);return {...s.params};},
    capture(e,enabled=true){state(e).recording=!!enabled;},
    note(e,kind,data={}){const s=state(e);if(!s.recording)return;const safe={};for(const [key,value]of Object.entries(data)){if(['id','kind','tick','simTime'].includes(key))continue;if(typeof value==='string')safe[key]=value.slice(0,100);else if(typeof value==='boolean'||value===null||Number.isFinite(value))safe[key]=value;}trace(e,{...safe,id:'observe:'+s.observed++,kind:text(kind)||'diagnostic',tick:e.tick,simTime:e.time});},
    observeHits(hits,e){if(!state(e).recording)return;for(const h of hits)this.note(e,'combat.hit',{actorId:h.source.id,targetId:h.target.id,attack:h.kind,actual:number(h.actual),blocked:number(h.blocked),avoided:number(h.avoided),outcome:h.actual>0?'hit':h.blocked>0?'blocked':h.avoided>0?'avoided':'miss'});},
    observeSound(e,event){this.note(e,'audio.request',{cue:event.kind,parentId:event.presentationId||null,pan:event.pan});},
    emit(e,kind,data={}){
      if(e.state!=='running'||!profiles[kind])return null;const s=state(e),profile=profiles[kind],key=text(data.key);if(key&&s.seen.has(key))return null;
      if(key&&s.seen.size>=1024){s.dropped++;return null;}if(key)s.seen.add(key);
      const id='present:'+s.sequence++,actor=e.balls.find(b=>b.id===data.actorId),target=e.balls.find(b=>b.id===data.targetId);
      const event=Object.freeze({id,castId:text(data.castId)||id,key,kind,stage:profile.stage,tick:e.tick,simTime:e.time,actorId:actor?.id??null,targetId:target?.id??null,x:number(data.x,target?.x??actor?.x??G.Constants.width/2),y:number(data.y,target?.y??actor?.y??G.Constants.height/2),angle:number(data.angle),color:typeof data.color==='string'&&/^#[0-9a-f]{6}$/i.test(data.color)?data.color:actor?.def.color||'#dceaff',actual:number(data.actual),blocked:number(data.blocked),avoided:number(data.avoided),outcome:text(data.outcome)||'unspecified',notice:text(data.notice),channels:'animation,particles,audio,ui,camera'});
      // Data-only profiles and scalar copies: no listener receives the mutable engine.
      const fx={event,profile,age:0,seed:hash(e.seed+':'+id)};let visible=true;if(s.fx.length===24){let lowest=0;for(let i=1;i<s.fx.length;i++)if(s.fx[i].profile.tier<s.fx[lowest].profile.tier)lowest=i;if(s.fx[lowest].profile.tier<=profile.tier){s.fx.splice(lowest,1);s.dropped++;}else{s.dropped++;visible=false;}}if(visible)s.fx.push(fx);
      if(profile.cue){const sound={kind:profile.cue,pan:clamp((event.x/G.Constants.width-.5)*1.2,-1,1),tick:e.tick,presentationId:id,gain:s.params.gain};e.soundEvents.push(sound);if(e.soundEvents.length>32)e.soundEvents.shift();this.observeSound(e,sound);}
      if(event.notice){s.ui.push({id,text:event.notice,until:e.time+profile.life*s.params.duration});if(s.ui.length>12)s.ui.shift();if(actor)actor.notice={text:event.notice,at:e.time};}
      trace(e,event);return event;
    },
    advance(e,dt){const s=state(e);if(e.state!=='running')return;for(const f of s.fx)f.age+=dt;s.fx=s.fx.filter(f=>f.age<f.profile.life*s.params.duration);s.ui=s.ui.filter(v=>v.until>e.time);},
    ui(e){return state(e).ui.map(v=>({...v}));},
    inspect(e){const s=state(e);return {params:{...s.params},active:s.fx.length,drawnParticles:s.drawnParticles,dropped:s.dropped,droppedTrace:s.droppedTrace,recording:s.recording};},
    timeline(e){return {schema:1,presentationVersion:this.version,seed:e.seed,mode:e.mode||'1v1',map:e.mapId||null,types:e.balls.map(b=>b.type),parameters:{...state(e).params},dropped:state(e).droppedTrace,events:state(e).timeline.map(v=>({...v}))};},
    camera(r,e){if(r.reducedMotion)return;const s=state(e),f=s.fx.reduce((best,f)=>f.profile.shake*Math.exp(-f.age*16)>(best?best.profile.shake*Math.exp(-best.age*16):0)?f:best,null);if(!f)return;const a=Math.min(5,f.profile.shake*s.params.shake)*Math.exp(-f.age*16);r.ctx.translate(Math.sin(f.age*123)*a,Math.cos(f.age*97)*a);},
    draw(r,e){const c=r.ctx,s=state(e);let particles=0;c.save();c.lineCap='round';
      for(const f of s.fx){const v=f.event,p=clamp(f.age/(f.profile.life*s.params.duration),0,1),fade=1-p,radius=f.profile.radius*s.params.size,grow=1-Math.exp(-p*5);c.save();c.translate(v.x,v.y);c.rotate(v.angle);c.globalAlpha=fade;c.strokeStyle=v.color;c.fillStyle=v.color;
        if(f.profile.shape==='trail'){for(let i=1;i<=5;i++){c.globalAlpha=fade*(1-i/6)*.5;c.beginPath();c.ellipse(-i*17,0,19,13,0,0,TAU);c.fill();}}
        else{const d=f.profile.shape==='prepare'?radius*(1-p*.55):8+radius*grow;c.lineWidth=f.profile.shape==='impact'?4*fade+1:2;c.beginPath();c.ellipse(0,0,d,f.profile.shape==='impact'?d*.7:d,0,0,TAU);c.stroke();if(f.profile.shape==='impact')for(let i=0;i<9;i++){const a=i*TAU/9;c.beginPath();c.moveTo(Math.cos(a)*d*.55,Math.sin(a)*d*.55);c.lineTo(Math.cos(a)*d*1.25,Math.sin(a)*d*1.25);c.stroke();}}
        if(f.profile.shape==='impact'||f.profile.shape==='ring')for(let i=0;i<s.params.particles&&particles<256;i++,particles++){const seed=(i*97+f.seed)%193,a=seed/193*TAU,d=(12+p*(40+seed*.3))*s.params.size;c.globalAlpha=fade*.8;c.beginPath();c.arc(Math.cos(a)*d,Math.sin(a)*d,1.5+fade,0,TAU);c.fill();}c.restore();
      }c.restore();s.drawnParticles=particles;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
