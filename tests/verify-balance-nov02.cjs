'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');let checks=0;const cases=[];
function ok(value,label){checks++;assert.ok(value,label);}
function near(value,wanted,label){checks++;assert.ok(Math.abs(value-wanted)<1e-7,`${label}: ${value} != ${wanted}`);}
function load(entry){const c=vm.createContext({console,performance,structuredClone,Math,Date,URLSearchParams,document:{},matchMedia:()=>({matches:false})});c.window=c;for(const m of fs.readFileSync(path.join(root,entry+'.html'),'utf8').matchAll(/<script src="js\/([^"?]+)\.js/g)){if(['app','team-app','manual-ui','manual-fullscreen','animation-review','recording-view','audio-audition'].includes(m[1]))continue;vm.runInContext(fs.readFileSync(path.join(root,'js',m[1]+'.js'),'utf8'),c,{filename:m[1]});}return c.OrbDuel;}
function scene(entry,a,b){const G=load(entry),e=entry==='team'?new G.TeamEngine([a,'normal',b,'ranger'],'nov02','open'):new G.Engine([a,b],'nov02',{mode:entry==='index'?'1v1':'arcana'});e.start();e.time=20;e.tick=4800;if(e.obstacles)e.obstacles=[];const owner=e.balls[0],target=e.balls[entry==='team'?2:1];for(const actor of e.balls){actor.hp=actor.maxHp=1000;actor.vx=actor.vy=0;if(actor.arcana)actor.arcana.used=true;}Object.assign(owner,{x:100,y:170,previousX:100,previousY:170});Object.assign(target,{x:170,y:170,previousX:170,previousY:170});if(G.ArenaWalls)G.ArenaWalls.current=e;if(G.Priority)G.Priority.current=e;return{G,e,b:owner,t:target};}
function hit(f,raw=10,extra={}){f.G.Combat.resolveBatch([{source:f.t,target:f.b,kind:'shot',raw,point:{x:f.b.x,y:f.b.y},...extra}],f.e);}
function test(name,fn){try{fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false,error:e.stack});}}
for(const entry of ['index','arcana','team','manual']){
 test(entry+': silence cannot stop descent, ordinary gates remain silenced, gate cooldown 8s',()=>{
  const f=scene(entry,'demon','time'),{G,e,b,t}=f,H=G.DemonHell;H.state(b).souls=5;t.temporal.nextDelete=Infinity;
  ok(G.Temporal.silence(b,t,e,20),'real silence applies');ok(H.begin(b,e),'form starts even while silenced');
  e.time+=b.def.hellEnter+.001;H.tick(b,e,G.Constants.dt);ok(H.active(b,e),'transformation completes');
  e.time+=.13;H.tick(b,e,G.Constants.dt);const swing=H.state(b).swing;ok(swing,'active claws still attack');
  G.Temporal.silence(b,t,e,20);ok(H.state(b).swing===swing,'renewed silence preserves the current swing');
  e.time+=b.def.hellWindup+b.def.hellSweep*.5;H.world(e);ok(e.pendingAttacks.some(p=>p.kind==='demonHellSlash'),'silenced swing makes a real attack');
  const hp=t.hp;G.Combat.resolveBatch(e.pendingAttacks.splice(0),e);ok(t.hp<hp,'silenced claws really damage');
  b.demon.nextGate=b.demon.nextClaw=e.time;b.awakening.active=true;const n=e.demonWorld.claws.length;G.Demon.update(b,G.Constants.dt,e);near(e.demonWorld.claws.length,n,'ordinary gates blocked by silence');
  b.temporal.silenceUntil=0;G.Demon.update(b,G.Constants.dt,e);near(b.demon.nextGate,e.time+8,'native gate cycle now 8s');
 });
 test(entry+': marked nodes resist ordinary cannon, awakened beam and short blade',()=>{
  const {G,e,b,t}=scene(entry,'trapper','laser');Object.assign(t,{x:35,y:170,previousX:35,previousY:170});G.World.placeTrap(b,e);b.x=b.previousX=240;G.World.placeTrap(b,e);e.time+=.6;b.x=b.previousX=70;b.awakening.active=true;G.Mines.update(e);const marked=e.traps.find(n=>n.bodyLinked),unmarked=e.traps.find(n=>!n.bodyLinked);ok(marked&&unmarked,'both node classes');b.y=b.previousY=280;
  t.laser={angle:0,awake:false};G.Roles.laserFire(t,e);ok(e.traps.includes(marked),'ordinary cannon cannot clear marked node');ok(!e.traps.includes(unmarked),'ordinary cannon still clears unmarked node');near(t.stats.trapsCleared,1,'no fake clear statistic');
  b.x=b.previousX=100;b.y=b.previousY=170;G.World.placeTrap(b,e);const fresh=e.traps.find(n=>n!==marked);ok(fresh,'new unmarked node placed');e.time+=.6;b.y=b.previousY=280;t.laser={angle:0,awake:true};G.Roles.laserFire(t,e);G.Roles.updateBeams(e,.01);ok(e.traps.includes(marked),'awakened beam cannot clear marked node');ok(!e.traps.includes(fresh),'awakened beam still clears unmarked node');
  t.x=t.previousX=210;t.role.bladePrevious=-.4;t.role.bladeAngle=.4;t.role.bladeHitMask=0;G.LaserBlade.sweep(t,e,G.Constants.dt,false);ok(e.traps.includes(marked),'ordinary short blade cannot clear marked node');
 });
 test(entry+': angel guard purification respects marked nodes',()=>{
  const {G,e,b,t}=scene(entry,'trapper','holy');Object.assign(t,{x:300,y:40,previousX:300,previousY:40});G.World.placeTrap(b,e);b.x=b.previousX=240;G.World.placeTrap(b,e);e.time+=.6;b.x=b.previousX=70;b.awakening.active=true;G.Mines.update(e);const marked=e.traps.find(n=>n.bodyLinked),unmarked=e.traps.find(n=>!n.bodyLinked);ok(marked&&unmarked,'both node classes');ok(G.Holy.seal(t,e,{x:180,y:170,radius:125,vertices:[]}), 'holy zone forms');const z=e.holyWorld.zones.at(-1);G.HolyAngel.wave(e,{owner:t.id,zone:z.id,x:180,y:170,radius:0,hitIds:[],maxRadius:125},.3);ok(e.traps.includes(marked),'guard wave preserves marked node');ok(!e.traps.includes(unmarked),'guard wave still removes ordinary node');
 });
 test(entry+': descent claws execute through the native silenced combat loop',()=>{
  const {G,e,b,t}=scene(entry,'demon','normal');b.speed=t.speed=0;t.role.nextPursuit=Infinity;t.def={...t.def,damage:0};G.DemonHell.state(b).souls=5;G.Temporal.silence(b,t,e,20);for(let i=0;i<720;i++)e.step();ok(G.DemonHell.active(b,e),'native form stays active');ok(G.Temporal.silenced(b,e),'ordinary silence is not cleansed');ok(t.hp<1000,'native form attacks deal damage during silence');
 });
 test(entry+': time skip cooldown starts after skip, clock cycle and domain CD scaling',()=>{
  const f=scene(entry,'time','normal'),{G,e,b,t}=f;b.temporal.nextDelete=0;
  ok(G.TimeDelete.request(b,e,{kind:'controlled-fixture'}),'request skip');const start=e.time;e.step();near(e.time,start+1,'240 native steps advance one second');near(b.temporal.nextDelete,e.time+13,'full 13s after the skip');
  G.Temporal.startClock(b,e,0);near(b.temporal.nextClock,e.time+8,'clock gets 8s cycle');near(b.temporal.castAt,e.time+.35,'clock warning unchanged');
  G.Temporal.domain(b,e,t.x,t.y,0);t.role.nextPursuit=e.time+5;G.Temporal.begin(e,.1);near(t.temporal.rate,.2,'movement slowdown unchanged');near(t.temporal.cooldownRate,.8,'CD runs at 80%');near(t.role.nextPursuit,e.time+5.02,'actual cooldown loses only 20% of elapsed time');
 });
 test(entry+': vampire ordinary and native seven-pulse/finisher healing',()=>{
  const {G,e,b,t}=scene(entry,'vampire','normal');b.hp=500;
  G.Combat.resolveBatch([{source:b,target:t,kind:'shot',raw:10}],e);near(b.hp,503.2,'32% native ordinary lifesteal');
  b.hp=500;b.stats.healing=0;b.awakening.active=true;b.role.blood=8;t.role.bloodMark={owner:b.id,until:e.time+3};G.Roles.startChain(b,e);e.time+=.25;G.Roles.vampireUpdate(b,0,e);const start=e.time;
  for(let i=1;i<=7;i++){e.time=start+i*.3;G.Roles.vampireUpdate(b,.3,e);G.Combat.resolveBatch(e.pendingAttacks.splice(0),e);}
  e.time+=.001;G.Roles.vampireUpdate(b,.001,e);G.Combat.resolveBatch(e.pendingAttacks.splice(0),e);
  near(b.hp,500+7*1.05*.76+2.6*.9,'76% pulse / 90% finish healing');near(b.role.blood,4,'same blood cost');ok(!b.awakening.chainActive,'chain ends normally');
 });
 test(entry+': only real body links mark traps, marks persist after disconnect',()=>{
  const {G,e,b,t}=scene(entry,'trapper','holy');Object.assign(t,{x:300,y:40,previousX:300,previousY:40});
  G.World.placeTrap(b,e);b.x=b.previousX=240;G.World.placeTrap(b,e);e.time+=.6;
  b.x=b.previousX=70;G.Mines.update(e);ok(e.traps.every(n=>!n.bodyLinked),'static node links do not mark');
  b.awakening.active=true;G.Mines.update(e);const marked=e.traps.find(n=>n.bodyLinked),unmarked=e.traps.find(n=>!n.bodyLinked);ok(marked&&unmarked,'only body-connected far node is marked');
  b.awakening.active=false;G.Mines.update(e);ok(marked.bodyLinked,'mark persists without a current link');
  ok(!G.Mines.canRemove(marked,{reason:'ordinaryShot'}),'ordinary shots cannot clear marked nodes');
  ok(G.World.clearTrap(marked,t,e)===false,'shared ordinary removal is rejected in every mode');ok(e.traps.includes(marked),'node is really preserved');
  if(G.Priority){ok(!G.Priority.canRemove(marked,e,{reason:'holyPurify',priority:'arcana'}),'holy ultimate blocked');ok(!G.Priority.canRemove(marked,e,{reason:'laserArcanaCut',priority:'arcana'}),'laser ultimate blocked');
   ok(!G.Priority.canRemove(marked,e,{reason:'holyGuard'}),'ordinary angel cleaning blocked');ok(!G.Priority.canRemove(marked,e,{reason:'laserCut'}),'ordinary blade blocked');ok(G.Priority.canRemove(marked,e,{reason:'reset'}),'reset still clears');}
  marked.expires=e.time-.01;G.Mines.update(e);ok(!e.traps.includes(marked),'marked nodes still expire normally');
 });
}
for(const entry of ['arcana','manual']){
 test(entry+': dance reduces ordinary, DOT, reflected and true damage once; cleanup restores normal damage',()=>{
  const f=scene(entry,'boomerang','normal'),{G,e,b,t}=f;b.awakening.active=true;G.BladeDance.begin(b,t,e);ok(G.BladeDance.active(b),'dance starts');
  for(const extra of [{kind:'contact'},{kind:'poison'},{kind:'shot'},{kind:'demonTug',trueDamage:true,bypassShield:true}]){const hp=b.hp;hit(f,20,extra);near(hp-b.hp,14,'30% reduction '+extra.kind);}
  let hp=b.hp;G.Combat.applyDamage(b,20,e,{reflected:true});near(hp-b.hp,14,'reflection reduction');
  hp=b.hp;G.Combat.resolveBatch([{source:t,target:b,kind:'shot',raw:8},{source:t,target:b,kind:'demonTug',raw:12,trueDamage:true,bypassShield:true}],e);near(hp-b.hp,14,'mixed packet batch is not reduced twice');
  b.shield=20;hit(f,10);near(b.shield,13,'shield consumes reduced ordinary damage');b.shield=0;G.BladeDance.finish(b,e);hp=b.hp;hit(f,20);near(hp-b.hp,20,'no reduction after finish');
  G.BladeDance.begin(b,t,e);e.reset(['boomerang','normal'],'reset',{mode:'arcana'});near(G.Combat.reduction(e.balls[0],e),0,'reset leaves no reduction');
 });
 test(entry+': holy ultimate resolves 6 + 6 + 12 at unchanged native hit times',()=>{
  const {G,e,b,t}=scene(entry,'holy','normal');b.awakening.active=true;b.arcana.used=false;ok(G.HolySeals.begin(b,t,e),'ritual starts');const s=e.holySeals[0],start=e.time;
  for(const [i,wanted]of [6,6,12].entries()){e.time=start+G.HolySeals.config.hitAt[i];const hp=t.hp;G.HolySeals.prepare(e);G.Combat.resolveBatch(e.pendingAttacks.splice(0),e);near(hp-t.hp,wanted,'independent judgment '+i);}
  near(t.hp,976,'total base judgment damage 24');
 });
 test(entry+': actual holy purge and giant laser preserve marked traps only',()=>{
  for(const attacker of ['holy','laser']){
   const {G,e,b,t}=scene(entry,'trapper',attacker);b.awakening.active=true;Object.assign(t,{x:35,y:170,previousX:35,previousY:170});G.World.placeTrap(b,e);b.x=b.previousX=240;G.World.placeTrap(b,e);e.time+=.6;b.x=b.previousX=70;G.Mines.update(e);const marked=e.traps.find(n=>n.bodyLinked),unmarked=e.traps.find(n=>!n.bodyLinked);ok(marked&&unmarked,'both trap classes exist');
   if(attacker==='holy')G.HolySeals.purge({id:99,owner:t.id,target:b.id,purged:0},e,1);
   else{Object.assign(t.arcana,{laserPrevious:-.4,laserAngle:.4,laserReach:500,laserHitMask:0});G.LaserBlade.sweep(t,e,G.Constants.dt,true);}
   ok(e.traps.includes(marked),attacker+' ultimate preserves marked trap');ok(!e.traps.includes(unmarked),attacker+' ultimate still clears unmarked trap');
   ok(G.World.clearTrap(marked,t,e,{reason:'ordinaryShot'})===false,'ordinary removal also blocked');ok(e.traps.includes(marked),'ordinary attack cannot remove the mark');
   G.Mines.burst(marked,b,e);ok(!e.traps.includes(marked),'normal trap detonation still consumes it');
  }
 });
 test(entry+': bloodsea banks 78% and still pays only on rebirth',()=>{
  const {G,e,b,t}=scene(entry,'vampire','normal');b.hp=500;Object.assign(b.arcana,{phase:'bloodTide',hits:0,healBudget:20,pendingHeal:0,healSettled:false});G.Combat.resolveBatch([{source:b,target:t,kind:'arcTide',raw:2,healRatio:0,angle:0,point:{x:t.x,y:t.y}}],e);near(b.hp,500,'no early heal');near(b.arcana.pendingHeal,1.56,'78% banked');G.VampireArcana.settleHeal(b,e);near(b.hp,501.56,'rebirth pays real bank');G.VampireArcana.settleHeal(b,e);near(b.hp,501.56,'no double payment');
 });
}
for(const entry of ['index','team'])test(entry+': ordinary boomerang gains no new reduction',()=>{const f=scene(entry,'boomerang','normal'),hp=f.b.hp;hit(f,20);near(hp-f.b.hp,20,'ordinary damage unchanged');});
test('team: legacy vampire ultimate uses the current 78% ratio',()=>{const {G,e,b,t}=scene('team','vampire','normal');b.hp=500;Object.assign(b.arcana,{phase:'bloodRecovery',healBudget:20});G.Combat.resolveBatch([{source:b,target:t,kind:'arcBlood',raw:2,arcanaHeal:true,healRatio:0,angle:0,point:{x:t.x,y:t.y}}],e);near(b.hp,501.56,'legacy team heal updated');});
test('team: marked nodes still detonate with enemy-only damage',()=>{const {G,e,b,t}=scene('team','trapper','normal');Object.assign(t,{x:300,y:40});G.World.placeTrap(b,e);b.x=b.previousX=240;G.World.placeTrap(b,e);e.time+=.6;b.x=b.previousX=70;b.awakening.active=true;G.Mines.update(e);const m=e.traps.find(n=>n.bodyLinked),ally=e.balls[1];ok(m,'real connected node is marked');Object.assign(t,{x:m.x,y:m.y});Object.assign(ally,{x:m.x,y:m.y});G.Mines.burst(m,b,e);G.Combat.resolveBatch(e.pendingAttacks.splice(0),e);ok(t.hp<1000,'enemy hit by the real explosion');near(ally.hp,1000,'ally does not take damage');ok(!e.traps.includes(m),'marked node consumed normally');});
test('angel: native recovery waits for the longer gap before the next weapon',()=>{const {G,e,b,t}=scene('arcana','holy','normal');Object.assign(b,{x:170,previousX:170});Object.assign(t,{x:240,previousX:240});ok(G.Holy.seal(b,e,{x:170,y:170,radius:125,vertices:[]}), 'zone forms');const z=e.holyWorld.zones.at(-1);z.started=e.time-.7;z.expires=e.time+10;const A=G.HolyAngel,s=A.state(z);A.begin(b,z,t,e);s.elapsed=A.config.swordWind+A.config.swordSwing+A.config.recovery;A.updateZone(b,z,e,.001);near(s.cooldown,.44,'native attack recovery sets 0.44s gap');A.updateZone(b,z,e,.40);ok(s.phase==='idle','not attacking after only .40s');A.updateZone(b,z,e,.05);ok(s.phase==='spear','spear follows after gap');});
for(const c of cases)console.log((c.passed?'PASS ':'FAIL ')+c.name+(c.passed?'':'\n'+c.error));console.log(JSON.stringify({passed:cases.filter(c=>c.passed).length,total:cases.length,checks}));if(cases.some(c=>!c.passed))process.exitCode=1;
