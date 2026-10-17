const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context=vm.createContext({structuredClone}),modules=['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','demon','cosmic','charge','stellar','adaptive','arcana','presentation','engine','audio'];
for(const n of modules)vm.runInContext(fs.readFileSync(path.join(root,'js',n+'.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'arcana-lab/core.js'),'utf8'),context);
const G=context.OrbDuel,S=G.ArcanaLab,runs=[];let checks=0;function ok(value,msg){checks++;assert(value,msg);}
const originalProfiles=Object.fromEntries(Object.entries(G.Audio.profiles).map(([k,v])=>[k,JSON.stringify(v)]));vm.runInContext(fs.readFileSync(path.join(__dirname,'arcana-lab/sound.js'),'utf8'),context);ok(Object.entries(originalProfiles).every(([k,v])=>JSON.stringify(G.Audio.profiles[k])===v),'Original sound profiles unchanged');
for(const type of S.types)for(const scene of ['hit','moving','shield','immune','cancel']){
 const clip=S.build(type,scene),off=S.build(type,scene,'arcana-stage-01',false),hits=clip.events.filter(e=>e.kind==='hit'&&e.actual>0);
 ok(clip.finalSnapshot===off.finalSnapshot,'Observation preserves combat state');ok(clip.rng===off.rng&&clip.fxRng===off.fxRng,'RNG unchanged');
 ok(JSON.stringify(clip.frames)===JSON.stringify(off.frames),'Every sampled source state unchanged');
 const snap=JSON.stringify(clip),map=S.timeline(clip),original=S.timeline(clip,{},true);
 ok(original.duration>4.99&&original.duration<5.01,'Source replay duration');ok(map.times.every((v,i)=>!i||v>=map.times[i-1]),'Monotonic replay mapping');
 for(let i=0;i<100;i++)S.sample(clip,map,i*map.duration/100);
 ok(JSON.stringify(clip)===snap,'Sampling and remapping do not mutate source');
 if(scene==='cancel'){ok(!clip.frames.at(-1).source.balls[0].arcana.used&&hits.length===0,'Interrupted warning does not commit or damage');}
 else if(scene==='immune'){ok(hits.length===0,'Late invulnerability prevents real damage');ok(!clip.events.some(e=>e.kind==='heal'),'No invented healing on immunity');}
 else if(scene==='hit'||scene==='shield'){ok(hits.length>0,'Successful fixture really hits');}
 if(type==='normal'&&scene==='hit'){const h=clip.events.find(e=>e.kind==='hold'&&e.reason==='anticipation');ok(h?.seconds===.68,'Formal anticipation retained');}
 if(type==='accelerator'&&scene==='shield')ok(clip.events.some(e=>e.style==='shatter'),'Real sonic shield shatter');
 runs.push({type,scene,hits:hits.length,damage:hits.reduce((n,e)=>n+e.actual,0),healing:clip.events.filter(e=>e.kind==='heal').reduce((n,e)=>n+e.amount,0),sourceSeconds:original.duration,displaySeconds:map.duration,phases:clip.events.filter(e=>e.kind==='phase').map(e=>e.phase)});
}
ok(!('damage'in S.tune({damage:999}))&&S.tune({hitHold:999}).hitHold===.34,'Bounded cosmetic allowlist');
const out=path.join(__dirname,'arcana-lab/evidence');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,checks,runs},null,2));console.log(JSON.stringify({passed:true,checks,runs},null,2));
