const assert=require('node:assert/strict'),path=require('node:path');
for(const file of ['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','cosmic','engine'])require(path.resolve(__dirname,'../js',file+'.js'));
const G=globalThis.OrbDuel;let checks=0;
function ok(v,message){assert.ok(v,message);checks++;}
function setup(types=['ranger','normal']){
  const e=new G.Engine(types,'world-test');e.start();
  e.balls.forEach((b,i)=>{b.x=80+i*160;b.y=170;b.previousX=b.x;b.previousY=b.y;b.vx=0;b.vy=0;});
  return e;
}
// Fire along a known ray; owner immune and swept target detection.
const ray=setup();G.World.fire(ray.balls[0],ray);ok(ray.projectiles.length===1,'shot created');
for(let i=0;i<100 && ray.projectiles.length;i++){ray.time+=1/240;G.World.update(ray,1/240);}
ok(ray.pendingAttacks.length===1 && ray.pendingAttacks[0].target===ray.balls[1],'projectile hits enemy once');
G.Combat.resolveBatch(ray.pendingAttacks,ray);ok(ray.balls[0].hp===ray.balls[0].maxHp && ray.balls[1].hp<ray.balls[1].maxHp,'owner immune');
ok(ray.balls[0].stats.shotsFired===1 && ray.balls[0].stats.shotsHit===1,'shot counters');
ok(G.World.intersects({x:260,y:170,radius:4},50,170,{previousX:240,previousY:140,x:240,y:200,radius:23}),'swept moving target');
const bounce=setup();bounce.balls[1].y=60;bounce.balls[1].previousY=60;
bounce.projectiles=[{id:0,owner:0,x:355,y:280,vx:440,vy:0,speed:440,radius:4,bounces:0,expires:10,raw:8,color:'#ff9a70'}];
G.World.update(bounce,.01);ok(bounce.projectiles.length===1 && bounce.projectiles[0].bounces===1 && bounce.projectiles[0].vx<0,'first wall reflection');
for(let i=0;i<240 && bounce.projectiles.length;i++){bounce.time+=1/240;G.World.update(bounce,1/240);}
ok(bounce.projectiles.length===0,'second wall removes shot');
const expired=setup();G.World.fire(expired.balls[0],expired);expired.time=2;G.World.update(expired,0);ok(expired.projectiles.length===0,'projectile expiry');
// Traps have a real arm delay, ignore the owner and can trigger only once.
const mine=setup(['trapper','normal']);G.World.placeTrap(mine.balls[0],mine);
mine.balls[1].x=80;G.World.update(mine,0);ok(mine.pendingAttacks.length===0 && mine.traps.length===1,'unarmed trap harmless');
mine.balls[1].x=240;mine.time=.55;G.World.update(mine,0);ok(mine.pendingAttacks.length===0 && mine.traps.length===1,'armed trap ignores owner');
mine.balls[1].x=80;G.World.update(mine,0);ok(mine.pendingAttacks.length===1 && mine.traps.length===0,'enemy triggers');
G.Combat.resolveBatch(mine.pendingAttacks,mine);ok(mine.balls[0].stats.trapsTriggered===1,'trap hit counter');
mine.pendingAttacks=[];G.World.update(mine,0);ok(!mine.pendingAttacks.some(h=>h.kind==='trap'),'node is single use; released fragments remain independent');
const cap=setup(['trapper','normal']);for(let i=0;i<6;i++)G.World.placeTrap(cap.balls[0],cap);
ok(cap.traps.length===3 && cap.traps[0].id===3,'oldest trap replaced');cap.time=11;G.World.update(cap,0);ok(cap.traps.length===0,'trap expiry');
// All primary attack kinds use shield and one-generation reflection.
for(const kind of ['shot','trap']){
 const shield=setup(['ranger','shield']);shield.time=1.5;G.Skills.shield.update(shield.balls[1],G.Constants.dt,shield);G.Combat.resolveBatch([{source:shield.balls[0],target:shield.balls[1],raw:8,kind}],shield);
 ok(shield.balls[1].hp===shield.balls[1].maxHp && shield.balls[1].shield===shield.balls[1].def.shieldAmount-8,'shield absorbs '+kind);
 const reflect=setup(['ranger','reflector']);G.Combat.resolveBatch([{source:reflect.balls[0],target:reflect.balls[1],raw:10,kind}],(reflect.balls[1].stance.phase='active',reflect));
 ok(reflect.balls[1].hp===reflect.balls[1].maxHp-10 && reflect.balls[0].hp===reflect.balls[0].maxHp-7.5 && reflect.balls[1].stats.reflected===7.5,'reflects '+kind+' once');
}
// Opposing projectiles kill on the same step, regardless of packet ordering.
for(const reverse of [false,true]){
 const tie=setup(['ranger','ranger']);tie.balls.forEach(b=>{b.hp=1;});
 tie.projectiles=tie.balls.map((owner,i)=>({id:i,owner:owner.id,x:tie.balls[1-i].x,y:170,vx:0,vy:0,speed:440,radius:4,bounces:0,expires:2,raw:8,color:owner.def.color}));
 if(reverse)tie.projectiles.reverse();tie.step();ok(tie.winner==='draw','simultaneous ranged draw');const saved=JSON.stringify(tie.snapshot());tie.step();ok(saved===JSON.stringify(tie.snapshot()),'ending frozen');
}
const frozen=setup(['ranger','trapper']);G.World.fire(frozen.balls[0],frozen);G.World.placeTrap(frozen.balls[1],frozen);frozen.pause();const state=JSON.stringify(frozen.snapshot());for(let i=0;i<1000;i++)frozen.step();ok(state===JSON.stringify(frozen.snapshot()),'pause freezes entities and skill timers');
frozen.reset(['ranger','trapper'],'world-test');ok(frozen.projectiles.length===0 && frozen.traps.length===0 && frozen.nextWorldId===0 && frozen.balls.every(b=>b.stats.shotsFired===0 && b.stats.trapsPlaced===0),'complete world reset');
const boost=new G.Engine(['accelerator','normal'],'boost');boost.balls[0].speed=365;boost.heatMultiplier=2.5;ok(Math.abs(G.Combat.attackValue(boost.balls[0],boost)-9.6*1.4*2.5)<1e-10,'UI attack includes both multipliers');
const results={checks,passed:true,coverage:['projectile sweep / owner immunity / wall bounce / lifetime','trap arm / single use / capacity / lifetime','shield / reflection / same-tick draw','pause / full reset / dynamic attack display']};
require('node:fs').writeFileSync(path.join(__dirname,'world-results.json'),JSON.stringify(results,null,2));console.log(results);
