const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
for(const name of ['config','physics','skills','world','characters','awakening','engine','audio','spectacle'])require(path.resolve(__dirname,'../js/'+name+'.js'));
const G=globalThis.OrbDuel;let matches=0;const cues=new Set();
for(const type of Object.keys(G.Types))for(let seed=0;seed<8;seed++){
 const types=[type,'normal'],regular=new G.Engine(types,'feedback-'+seed),silent=new G.Engine(types,'feedback-'+seed);
 for(const method of ['sound','impact','burst','ring','float'])silent[method]=()=>{};
 regular.start();silent.start();
 while(regular.state==='running'){
  regular.step();silent.step();assert.equal(regular.state,silent.state);
  assert.ok(regular.soundEvents.length<=32);for(const event of regular.soundEvents)assert.ok(G.Audio.profiles[event.kind]);
  regular.soundEvents.splice(0).forEach(e=>cues.add(e.kind));
 }
 assert.deepEqual(regular.snapshot(),silent.snapshot(),'presentation must not affect combat or RNG');assert.deepEqual(regular.events,silent.events);
 matches++;
}
for(const kind of ['wall','ball','heavy','shot','shotHit','shieldHit','reflect','stance','counter','counterHit','throw','return','returnHit','laser','laserHit','poison','poisonHit','awakening','victory'])assert.ok(cues.has(kind),'real game must emit '+kind);
const report={passed:true,matches,combatIndependent:true,cues:[...cues].sort(),queueCap:32};
fs.writeFileSync(path.join(__dirname,'feedback-results.json'),JSON.stringify(report,null,2));console.log(report);
