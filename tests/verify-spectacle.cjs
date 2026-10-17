const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
for(const n of ['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','cosmic','engine','audio','spectacle'])require(path.resolve(__dirname,'../js/'+n+'.js'));
const G=globalThis.OrbDuel,spectacle=G.Spectacle;
const signatureTypes=new Set(),cues=new Set();let matches=0,peak=0;
for(const a of Object.keys(G.Types))for(const b of Object.keys(G.Types))for(let seed=0;seed<3;seed++){
 const e=new G.Engine([a,b],'glory-reference-'+seed);e.start();
 while(e.state==='running'){
  e.step();peak=Math.max(peak,e.effects.length);assert.ok(e.effects.length<320,'effect budget');
  for(const f of e.effects)if(f.kind==='signature'){signatureTypes.add(e.balls[f.owner].type);assert.ok([f.x,f.y,f.age,f.life,f.angle].every(Number.isFinite));}
  for(const sound of e.soundEvents){assert.ok(G.Audio.profiles[sound.kind],sound.kind);cues.add(sound.kind);}e.soundEvents=[];
 }
 // Compare this version with its presentation module disabled, so balance changes
 // are validated independently of the historical pre-upgrade fixture.
 G.Spectacle=undefined;const plain=new G.Engine([a,b],'glory-reference-'+seed);plain.start();while(plain.state==='running')plain.step();G.Spectacle=spectacle;
 assert.deepEqual(e.snapshot(),plain.snapshot(),'identical combat with and without awakening presentation');
 const end=JSON.stringify({snapshot:e.snapshot(),fx:e.effects});for(let n=0;n<200;n++)e.step();assert.equal(JSON.stringify({snapshot:e.snapshot(),fx:e.effects}),end,'ending remains frozen');matches++;
}
assert.equal(signatureTypes.size,Object.keys(G.Types).length);for(const kind of ['fistHit','bloodPulse','thunderHit','mirrorRelease','pressureRelease','shot','chainBlast','moonCut','cannon','corrosion','clockBlast'])assert.ok(cues.has(kind),kind);
for(const type of Object.keys(G.Types)){
 const e=new G.Engine([type,'normal'],'signature-freeze'),fresh=new G.Engine([type,'normal'],'signature-freeze');e.start();G.Awakening.activate(e.balls[0],e);G.Spectacle.emit(e,e.balls[0],'strike');e.pause();const frozen=JSON.stringify({state:e.snapshot(),fx:e.effects,fxTimers:e.fxCooldowns});for(let i=0;i<50;i++)e.step();assert.equal(JSON.stringify({state:e.snapshot(),fx:e.effects,fxTimers:e.fxCooldowns}),frozen);e.reset([type,'normal'],'signature-freeze');assert.deepEqual(e.effects,fresh.effects);assert.equal(Object.keys(e.fxCooldowns).length,0);
}
const report={passed:true,matches,combatIndependentOfSpectacle:true,species:[...signatureTypes],newCues:10,totalAudioProfiles:Object.keys(G.Audio.profiles).length,peakEffects:peak,pauseResetEndPassed:true};
fs.writeFileSync(path.join(__dirname,'spectacle-results.json'),JSON.stringify(report,null,2));console.log(report);
