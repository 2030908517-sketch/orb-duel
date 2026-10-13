const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
for(const n of ['config','physics','skills','world','characters','roles','awakening','engine'])require(path.resolve(__dirname,'../js/'+n+'.js'));
const G=globalThis.OrbDuel;let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},near=(a,b,m)=>ok(Math.abs(a-b)<1e-8,m);
function make(types){const e=new G.Engine(types,'mechanics-test');e.start();for(const [i,b]of e.balls.entries()){b.x=80+i*160;b.y=170;b.vx=0;b.vy=0;b.previousX=b.x;b.previousY=b.y;}return e;}
function hit(e,source,target,raw,kind='contact',extra={}){G.Combat.resolveBatch([{source,target,raw,kind,...extra}],e);}
function drain(e){G.Combat.resolveBatch(e.pendingAttacks,e);e.pendingAttacks=[];}
// Reflection has a real warning, uptime and downtime. Damage, not attempted hits, fills storage.
const r=make(['reflector','normal']),[thorn,enemy]=r.balls;
G.Skills.reflector.update(thorn,0,r);ok(thorn.stance.phase==='warning','opening warning');
hit(r,enemy,thorn,10);near(enemy.hp,120,'warning does not reflect');
r.time=.45;G.Skills.reflector.update(thorn,0,r);ok(thorn.stance.phase==='active','warning transitions');
hit(r,enemy,thorn,10);near(enemy.hp,112.5,'active reflects actual damage');
r.time=3.45;G.Skills.reflector.update(thorn,0,r);ok(thorn.stance.phase==='rest','stance has downtime');
hit(r,enemy,thorn,10);near(enemy.hp,112.5,'downtime does not reflect');
r.time=6.5;G.Skills.reflector.update(thorn,0,r);ok(thorn.stance.phase==='warning','fixed periodic warning');
const c=make(['reflector','reflector']);G.Awakening.activate(c.balls[0],c);G.Awakening.activate(c.balls[1],c);c.balls.forEach(b=>{b.stance.phase='active';b.stance.until=1;b.stance.next=6.5;});
hit(c,c.balls[1],c.balls[0],40,'laser');near(c.balls[0].stance.stored,8,'storage capped');near(c.balls[1].stance.stored,0,'reflection never recharges');
c.time=1;G.Skills.reflector.update(c.balls[0],0,c);ok(c.projectiles.length===1 && c.projectiles[0].mode==='counter','stance end fires counter');near(c.projectiles[0].raw,8,'counter uses stored actual damage exactly');near(c.balls[0].stance.stored,0,'storage consumed');
const before=c.balls[0].hp;hit(c,c.balls[0],c.balls[1],8,'counter',{noReflect:true});near(c.balls[0].hp,before,'counter does not reflect');near(c.balls[1].stance.stored,0,'counter does not charge enemy');
const absorbed=make(['reflector','normal']);G.Awakening.activate(absorbed.balls[0],absorbed);absorbed.balls[0].stance.phase='active';absorbed.balls[0].shield=20;hit(absorbed,absorbed.balls[1],absorbed.balls[0],10);near(absorbed.balls[0].stance.stored,0,'absorbed damage gives no storage');near(absorbed.balls[1].hp,120,'no reflection on absorbed damage');
// Three actual contacts arm a heavy strike; immune and shielded targets preserve the charge.
const n=make(['normal','shield']),[normal,shield]=n.balls;shield.shield=0;
for(let i=0;i<3;i++)hit(n,normal,shield,1);
ok(normal.charges===3,'three hits arm heavy');near(G.Combat.attackValue(normal,n),11.8*1.3,'heavy multiplier displayed');
shield.shield=20;hit(n,normal,shield,10);ok(normal.charges===0&&normal.stats.heavyHits===1,'shield contact consumes heavy once');shield.shield=0;hit(n,normal,shield,1);ok(normal.charges===1&&normal.stats.heavyHits===1,'next contact rebuilds fist');
// Chronological collision priority: a nearer mine consumes the bullet, no explosion.
function projectile(e,x,y,mode='shot'){return {id:90,mode,owner:0,x,y,vx:440,vy:0,speed:440,radius:4,bounces:0,maxBounces:1,expires:10,raw:7,color:'#fff'};}
const clear=make(['ranger','trapper']);clear.balls[1].x=250;clear.balls[1].previousX=250;clear.traps=[{id:8,owner:1,x:170,y:170,radius:12,armedAt:0,expires:10,raw:9}];clear.projectiles=[projectile(clear,100,170)];G.World.update(clear,.35);
ok(clear.traps.length===0 && clear.projectiles.length===0 && clear.pendingAttacks.length===0,'nearer trap blocks shot without explosion');ok(clear.balls[0].stats.trapsCleared===1,'disarm counted');
const first=make(['ranger','trapper']);first.balls[1].x=170;first.balls[1].previousX=170;first.traps=[{id:8,owner:1,x:260,y:170,radius:12,armedAt:0,expires:10,raw:9}];first.projectiles=[projectile(first,100,170)];G.World.update(first,.35);ok(first.traps.length===1 && first.pendingAttacks.length===1,'nearer enemy wins over farther trap');
const bounce=make(['ranger','normal']);bounce.projectiles=[projectile(bounce,355,280)];G.World.update(bounce,.01);near(bounce.projectiles[0].raw,8.05,'first ricochet increases raw by 15 percent once');G.World.ricochet(bounce.projectiles[0],bounce);near(bounce.projectiles[0].raw,8.05,'ricochet does not stack');
// Boomerang damages once on each leg and can be caught, never damages its owner.
const b=make(['boomerang','normal']);b.balls[1].x=180;b.balls[1].previousX=180;
const blade=G.World.fire(b.balls[0],b,{mode:'boomerang',castId:1});blade.x=175;blade.y=170;blade.turnAt=1;blade.curve={start:{x:175,y:170},control:{x:175,y:170},end:{x:175,y:170},started:0,duration:1};
G.World.update(b,0);ok(b.pendingAttacks.length===1,'outgoing blade hits');drain(b);G.World.update(b,0);ok(b.pendingAttacks.length===0,'same outgoing leg cannot hit twice');
b.time=1;G.World.update(b,0);ok(blade.returning && b.pendingAttacks.length===1,'return leg can hit again');drain(b);G.World.update(b,0);ok(!b.pendingAttacks.length,'same return leg cannot hit twice');
blade.x=b.balls[0].x;blade.y=170;blade.curve={start:{x:blade.x,y:170},control:{x:blade.x,y:170},end:{x:blade.x,y:170},started:b.time,duration:1};G.World.update(b,0);ok(!b.projectiles.length && b.balls[0].hp===b.balls[0].maxHp,'owner catches without injury');
// Laser prediction locks direction; firing checks geometry and clears only armed enemy traps.
const l=make(['laser','normal']);l.balls[0].role.capacitor=1;G.Skills.laser.update(l.balls[0],0,l);l.time=.18;G.Skills.laser.update(l.balls[0],0,l);const locked=l.balls[0].laser.angle;l.balls[1].y=50;l.time=.3;G.Skills.laser.update(l.balls[0],0,l);near(l.balls[0].laser.angle,locked,'laser direction locked through charge');
l.time=.83;G.Skills.laser.update(l.balls[0],0,l);ok(!l.pendingAttacks.length&&l.balls[0].laserMisses===1,'locked beam can miss');
l.balls[1].y=170;l.balls[0].laser={angle:0,fireAt:6.15};l.traps=[{id:1,owner:1,x:140,y:170,radius:12,armedAt:0,expires:20},{id:2,owner:1,x:200,y:170,radius:12,armedAt:20,expires:25},{id:3,owner:0,x:250,y:170,radius:12,armedAt:0,expires:25}];G.World.laser(l.balls[0],l);
ok(l.pendingAttacks.length===1 && l.traps.length===2,'beam hits enemy and clears armed enemy mine');drain(l);ok(l.balls[0].hp===105 && l.balls[0].stats.lasersHit===1,'laser owner immune');
// Poison overlap refreshes duration, does not multiply or restart the pulse clock.
const p=make(['venom','normal']);p.balls[0].x=240;G.World.pool(p.balls[0],p);p.pools.push({...p.pools[0],id:99});p.time=.49;G.World.update(p,0);ok(!p.balls[1].poison,'pool has arm delay');p.time=.5;G.World.update(p,0);ok(p.balls[1].poison && !p.balls[0].poison,'pool poisons only enemy');
const next=p.balls[1].poison.nextPulse;p.time=.7;G.World.update(p,0);near(p.balls[1].poison.nextPulse,next,'refresh preserves pulse clock');near(p.balls[1].poison.until,2.2,'refresh duration');
p.balls[1].x=80;p.balls[1].previousX=80;p.time=1;G.World.update(p,0);ok(p.pendingAttacks.length===1,'overlapping pools produce one poison tick');drain(p);near(p.balls[1].hp,p.balls[1].maxHp-p.balls[0].def.poolDamage,'poison retains fixed snapshot damage after exit');p.time=2.3;G.World.update(p,0);ok(!p.balls[1].poison,'poison expires');
// Blood chain has a meaningful range limit. Timers, entities and storage reset completely.
const chain=make(['vampire','normal']);G.Awakening.activate(chain.balls[0],chain);chain.balls[0].x=23;chain.balls[0].y=23;chain.balls[1].x=337;chain.balls[1].y=317;G.Awakening.update(chain.balls[0],0,chain);ok(chain.balls[0].awakening.chainUntil===0,'out-of-range blood chain breaks');
for(const types of [['reflector','venom'],['boomerang','laser']]){
 const e=new G.Engine(types,'freeze-new');const fresh=JSON.stringify(e.snapshot());e.start();for(let i=0;i<4000;i++)e.step();e.pause();const saved=JSON.stringify({state:e.snapshot(),effects:e.effects,sound:e.soundEvents});for(let i=0;i<100;i++)e.step();ok(JSON.stringify({state:e.snapshot(),effects:e.effects,sound:e.soundEvents})===saved,'pause all new mechanics');e.reset(types,'freeze-new');ok(JSON.stringify(e.snapshot())===fresh,'reset all new mechanics');
}
const report={passed:true,checks,coverage:['stance windows / damage storage / capped nonrecursive counter','heavy hit charge and absorption','bullet and mine sweep priority / ricochet','boomerang one hit per leg / catch','laser locked aim / miss / disarm','poison no overlap stacking / expiry','blood chain range / pause / reset']};fs.writeFileSync(path.join(__dirname,'mechanics-results.json'),JSON.stringify(report,null,2));console.log(report);
