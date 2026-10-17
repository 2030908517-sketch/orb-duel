const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),study=path.join(__dirname,'collision-study'),out=path.join(study,'evidence');fs.mkdirSync(out,{recursive:true});
const context=vm.createContext({}),modules=['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','demon','cosmic','charge','stellar','adaptive','arcana','presentation','engine'];
for(const n of modules)vm.runInContext(fs.readFileSync(path.join(root,'js',n+'.js'),'utf8'),context);
for(const n of ['core','sound'])vm.runInContext(fs.readFileSync(path.join(study,n+'.js'),'utf8'),context);
const G=context.OrbDuel,S=G.CollisionStudy,A=G.CollisionSound;let checks=0;const ok=(condition,message)=>{checks++;assert(condition,message);},runs=[];
for(const fixture of Object.keys(S.fixtures))for(const seed of ['collision-001','comparison-002','edge-003']){
 const observed=S.buildClip(fixture,seed,true),off=S.buildClip(fixture,seed,false),again=S.buildClip(fixture,seed,true);
 ok(observed.finalSnapshot===off.finalSnapshot,'Observer preserves full combat state');ok(observed.rng===off.rng&&observed.fxRng===off.fxRng,'Neither RNG stream changes');ok(JSON.stringify(observed.frames)===JSON.stringify(off.frames),'All trajectories unchanged by observation');ok(JSON.stringify(observed.events)===JSON.stringify(again.events),'Deterministic contact results');
 ok(observed.events.length===(fixture==='miss'?0:1),'One basic contact, or no miss contact');
 for(const e of observed.events){ok(e.hits.length===2&&e.hits.every(h=>h.actual>0&&h.blocked===0),'Simultaneous real bilateral damage');ok(observed.observations.filter(h=>h.kind==='combat.hit'&&h.tick===e.tick).length===2,'Contact linked to existing combat observer');}
 const original=JSON.stringify(observed);
 for(const k of ['A','B','C'])for(let i=0;i<=320;i++){
  const f=S.stateAt(observed,i/240);for(const b of f.balls)ok([b.x,b.y,b.hp].every(Number.isFinite)&&b.x>=b.radius-.001&&b.x<=360-b.radius+.001&&b.y>=b.radius-.001&&b.y<=340-b.radius+.001,'Finite, constrained replay positions');
  const q=S.deformation(k,i/1000);ok(Number.isFinite(q)&&q<.5&&q>-.25,'Bounded shape envelope');
 }
 ok(JSON.stringify(observed)===original,'Sampling all styles cannot mutate immutable replay');
 runs.push({fixture,seed,contacts:observed.events.length,contactTime:observed.events[0]?.time,damage:observed.events[0]?.hits.map(h=>h.actual),sha256:crypto.createHash('sha256').update(JSON.stringify(observed.frames)).digest('hex')});
}
const audio={};for(const k of ['A','B','C']){
 const pcm=A.synth(k),m=A.analyze(pcm),again=A.synth(k);audio[k]=m;
 ok(m.peak<.83&&m.rms>.01&&m.onsetMs<3&&m.energy90Ms<200,'Finite, non-clipping, promptly audible candidate envelope');
 ok(Buffer.from(pcm.data.buffer).equals(Buffer.from(again.data.buffer)),'Repeatable PCM');
 const wave=Buffer.from(A.wav(pcm));ok(wave.toString('ascii',0,4)==='RIFF'&&wave.length===44+pcm.data.length*2,'Valid PCM WAV encoding');
 fs.writeFileSync(path.join(out,'sound-'+k+'.wav'),wave);
}
ok(Math.max(...Object.values(audio).map(m=>m.energy))-Math.min(...Object.values(audio).map(m=>m.energy))<1e-7,'Equal integrated energy for initial comparison, not loudness proof');
ok(S.tune({damage:999,deform:100,volume:-8}).deform===1.5&&!('damage' in S.tune({damage:999})),'Only cosmetic bounded controls');
const hashes=Object.fromEntries(modules.map(n=>[n+'.js',crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'js',n+'.js'))).digest('hex')]));
const result={passed:true,checks,runs,audio,sourceHashes:hashes,subjectiveListening:'not-performed',scope:'Basic two-normal-orb collision fixtures; no balance test.'};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,checks,runs,audio},null,2));
