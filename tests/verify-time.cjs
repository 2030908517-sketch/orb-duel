const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
for(const f of ['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','demon','cosmic','charge','stellar','adaptive','arcana','engine','audio','spectacle'])require(path.resolve(__dirname,'../js/'+f+'.js'));
const G=globalThis.OrbDuel,C=G.Constants;let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},near=(a,b,m,eps=1e-6)=>ok(Math.abs(a-b)<eps,m+' '+a+' / '+b);
const make=(type='laser')=>{const e=new G.Engine(['time',type],'time-boundary');e.start();const [a,b]=e.balls;a.x=60;a.y=40;a.speed=0;a.vx=a.vy=0;a.temporal.nextDomain=Infinity;b.x=110;b.y=240;b.speed=50;b.vx=50;b.vy=0;return e;};
function domain(e,x=180,y=170,radius=300){G.Temporal.domain(e.balls[0],e,x,y,0);e.timeDomains.at(-1).radius=radius;}
// Slow actor movement and actual cooldown/charge progress; the caster remains at normal time.
const slow=make();domain(slow);slow.balls[0].temporal.nextDomain=5;const target=slow.balls[1];target.nextShot=5;
for(let i=0;i<240;i++)slow.step();near(target.x,115,'one second moves at 10% (90% slow)');near(target.role.capacitor,.5/4.2,'capacitor uses personal elapsed time');near(target.nextShot-slow.time,4.5,'absolute skill deadlines advance only by local time');near(slow.balls[0].temporal.nextDomain-slow.time,4,'own cooldown stays normal');ok(!G.Temporal.silenced(target,slow),'ordinary field never silences');
domain(slow);slow.step();near(target.temporal.rate,.1,'overlapping fields do not multiply');
slow.timeDomains=[];slow.step();near(target.temporal.rate,1,'leaving restores time');near(Math.hypot(target.vx,target.vy),50,'leaving restores cruise speed without excessive acceleration');
const warning=make();G.Temporal.domain(warning.balls[0],warning,warning.balls[1].x,warning.balls[1].y);warning.step();near(warning.balls[1].temporal.rate,1,'field telegraph gives no early slow');
// A delayed attack truly fires later, rather than just showing a longer UI cooldown.
const shot=make('ranger');shot.balls[1].nextShot=.8;domain(shot);
while(shot.time<1.5)shot.step();ok(shot.balls[1].stats.shotsFired===0,'slow delays actual firing');while(shot.time<1.7)shot.step();ok(shot.balls[1].stats.shotsFired===1,'slow eventually releases the delayed shot once');
// Real swept projectile contact, maximum range and wall limit all explode once.
const contact=make();const [clockOwner,victim]=contact.balls;victim.x=190;victim.y=160;victim.speed=0;victim.vx=victim.vy=0;victim.laser={origin:{x:190,y:160},angle:0,fireAt:5,trackUntil:4.8};
contact.timeClocks.push({id:1,owner:0,x:150,y:160,angle:0,speed:330,radius:9,range:250,travel:0,raw:10,color:clockOwner.def.color,started:0});for(let i=0;i<8;i++)contact.step();
ok(contact.timeClocks.length===0&&contact.timeDomains.length===1,'contact explodes into one field');ok(victim.hp===95&&victim.laser===null,'actual explosion damage and interrupt');ok(G.Temporal.silenced(victim,contact),'contact applies silence');ok(clockOwner.stats.clocksHit===1,'clock counted once');
const miss=make();miss.balls[1].x=300;miss.balls[1].y=270;miss.timeClocks.push({id:1,owner:0,x:80,y:100,angle:0,speed:330,radius:9,range:20,travel:0,raw:10,color:'#c2b6ff',started:0});for(let i=0;i<20;i++)miss.step();
ok(miss.timeClocks.length===0&&miss.timeDomains.length===1,'maximum range leaves a field');ok(miss.balls[1].hp===105&&!G.Temporal.silenced(miss.balls[1],miss),'miss applies neither damage nor silence');near(miss.timeDomains[0].x,100,'range stops exactly');
const edge=make();edge.timeClocks.push({id:1,owner:0,x:349,y:100,angle:0,speed:330,radius:9,range:250,travel:0,raw:10,color:'#c2b6ff',started:0});edge.step();edge.step();ok(edge.timeClocks.length===0,'boundary explodes without escaping');near(edge.timeDomains[0].x,351,'clock radius bounds');
const area=make();area.balls[1].x=160;area.balls[1].y=160;area.balls[1].speed=0;G.Temporal.explode({x:100,y:160,raw:10},area.balls[0],area);ok(G.Temporal.silenced(area.balls[1],area),'explosion area hit can silence without direct clock contact');
const immune=make('accelerator');G.Awakening.activate(immune.balls[1],immune);immune.balls[1].awakening.dashUntil=2;G.Temporal.explode({x:immune.balls[1].x,y:immune.balls[1].y,raw:10},immune.balls[0],immune);G.Combat.resolveBatch(immune.pendingAttacks,immune);ok(immune.balls[1].hp===108&&!G.Temporal.silenced(immune.balls[1],immune),'dash immunity resists explosion damage and silence');
// Interrupt ongoing/charging abilities; marks and detached entities must survive.
const interrupted=[];
for(const type of Object.keys(G.Types)){
 const e=make(type),b=e.balls[1];G.Awakening.activate(b,e);b.laser={origin:{x:b.x,y:b.y},angle:0,fireAt:5,trackUntil:4.8};b.awakening.chainActive=true;b.awakening.chainUntil=5;b.awakening.chargeUntil=5;b.role.chainWarning=5;b.role.salvoFireAt=5;b.role.shieldRelease=3;b.role.shieldReserve=12;b.role.shieldFireAt=5;b.role.counterRelease=4;b.role.counterFireAt=5;b.character.spreadFireAt=5;b.temporal.castAt=5;b.stance.phase='active';
 b.role.bloodMark={owner:0,until:8};b.bladeMark={owner:0,until:8};b.poison={owner:0,stacks:3,until:8};b.charges=3;b.role.blood=4;b.role.calibration=2;
 e.beams.push({owner:1});e.projectiles.push({owner:1,mode:'shot'});e.traps.push({owner:1});e.pools.push({owner:1});
 G.Temporal.silence(b,e.balls[0],e);
 ok(!b.laser&&!b.awakening.chainActive&&!b.awakening.chargeUntil&&!b.role.chainWarning&&!b.role.salvoFireAt&&!b.role.shieldFireAt&&!b.role.counterRelease&&!b.character.spreadFireAt&&!b.temporal.castAt&&b.stance.phase==='rest'&&!e.beams.length,'interrupt releases and casts '+type);
 ok(b.role.bloodMark&&b.bladeMark&&b.poison.stacks===3&&b.charges===3&&b.role.blood===4&&b.role.calibration===2,'silence preserves marks and stacks '+type);
 ok(e.projectiles.length===1&&e.traps.length===1&&e.pools.length===1,'detached entities remain '+type);interrupted.push(type);
}
const passive=make('venom'),v=passive.balls[1],enemy=passive.balls[0];G.Temporal.silence(v,enemy,passive);for(let i=0;i<3;i++)G.Characters.poison(v,enemy,passive,.9);ok(enemy.poison.stacks===3,'silenced venom still stacks contact marks');ok(G.Characters.contactExtras(v,enemy,passive).length===0,'silenced venom cannot trigger an active detonation');
const stopped=make('ranger');stopped.balls[1].nextShot=.01;G.Temporal.silence(stopped.balls[1],stopped.balls[0],stopped);while(stopped.time<1.1)stopped.step();ok(stopped.balls[1].stats.shotsFired===0,'silence blocks firing throughout its window');while(stopped.time<1.3)stopped.step();ok(stopped.balls[1].stats.shotsFired===0,'silence adds a real two-second attack delay');while(stopped.time<2.1)stopped.step();ok(stopped.balls[1].stats.shotsFired===1,'firing resumes after the delay without catch-up burst');
// Shield integrity is a snapshotted consumable. More remaining shield means more actual wave damage.
const shieldSamples=[];
for(const remaining of [0,5,17]){const e=new G.Engine(['shield','normal'],'shield-integrity');e.start();const b=e.balls[0];G.Awakening.activate(b,e);b.shield=remaining;b.role.pressure=2;G.Roles.shieldEnd(b,e);b.shield=0;e.time=.22;G.Roles.shieldUpdate(b,C.dt,e);const wave=e.waves[0];shieldSamples.push(wave.raw);G.Roles.shieldUpdate(b,C.dt,e);ok(e.waves.length===1,'shield release once');}
ok(shieldSamples[0]<shieldSamples[1]&&shieldSamples[1]<shieldSamples[2],'wave damage grows with shield integrity at equal pressure');
const full=new G.Engine(['shield','normal'],'full-shield');full.start();full.time=1.5;G.Awakening.activate(full.balls[0],full);full.time=full.balls[0].shieldUntil;G.Roles.shieldUpdate(full.balls[0],C.dt,full);full.time+=.22;G.Roles.shieldUpdate(full.balls[0],C.dt,full);ok(full.waves[0]?.raw===8.5,'untouched shield expiry generates meaningful damage');
// Compare actual travel after the same heavy attack, not just assigned constants.
const distances=[];
for(const damage of [8,20,35]){const e=new G.Engine(['normal','normal'],'heavy-distance');e.start();const [a,b]=e.balls;a.charges=3;a.x=60;a.y=50;b.x=100;b.y=170;b.vx=b.speed;b.vy=0;const h={source:a,target:b,raw:damage,kind:'contact',impact:{nx:1,ny:0}};G.Combat.resolveBatch([h],e);let distance=0;for(let i=0;i<72;i++){const before=b.x;G.Physics.integrate(b,C.dt);distance+=b.x-before;}distances.push(distance);}
ok(distances[0]<distances[1]&&distances[1]<distances[2],'larger damage yields greater actual displacement');ok(distances[1]>90,'heavy attack visibly travels well beyond cruise movement');
// Full matches, reproduction, walls, overlap, lifecycle, and all eleven resource panels.
let matches=0;
for(const opponent of Object.keys(G.Types))for(let seed=0;seed<12;seed++){
 const e=new G.Engine(seed%2?['time',opponent]:[opponent,'time'],'temporal-full-'+seed);e.start();
 while(e.state==='running'&&e.time<210){e.step();if(e.tick%60===0){for(const b of e.balls){ok([b.x,b.y,b.vx,b.vy,b.hp,b.temporal.rate].every(Number.isFinite),'finite match state');ok(b.x>=23-1e-5&&b.x<=337+1e-5&&b.y>=23-1e-5&&b.y<=317+1e-5,'no escape');ok(Math.hypot(b.vx,b.vy)<=(b.motionSpeed||800)*b.temporal.rate+1e-5,'effective speed bounded');ok(G.Skills[b.type].status(b,e).length+G.Awakening.status(b,e).filter(s=>s.label!=='觉醒').length<=6,'fixed HUD slots');}ok(e.balls.some(b=>G.Ghost.phased(b)||G.Charge.flowing(b))||Math.hypot(e.balls[0].x-e.balls[1].x,e.balls[0].y-e.balls[1].y)>=46-.001,'separation');}}
 ok(e.state==='ended','time match terminates');const ended=JSON.stringify(e.snapshot());e.step();ok(JSON.stringify(e.snapshot())===ended,'ended state freezes');
 if(seed===0){const again=new G.Engine(e.balls.map(b=>b.type),e.seed);again.start();while(again.state==='running')again.step();ok(JSON.stringify(again.snapshot())===ended,'seed reproduction with fields and clocks');}
 matches++;
}
const pause=make();domain(pause);pause.step();pause.pause();const frozen=JSON.stringify({state:pause.snapshot(),fx:pause.effects});new G.Clock(pause).advance(.1);ok(JSON.stringify({state:pause.snapshot(),fx:pause.effects})===frozen,'pause freezes clock and fields');pause.reset(['time','normal'],'time-boundary');ok(!pause.timeDomains.length&&!pause.timeClocks.length&&pause.balls.every(b=>b.temporal.rate===1&&!b.temporal.silenceUntil&&!b.impactDrag),'reset clears temporal and impact state');
for(const cue of ['timeField','clockCharge','clockThrow','clockBlast','timeSilence','timeInterrupt'])ok(!!G.Audio.profiles[cue],'dedicated time audio '+cue);
const report={passed:true,checks,matches,interruptedTypes:interrupted,shieldWaveDamage:shieldSamples,heavyTravelIn03s:distances.map(n=>+n.toFixed(2))};fs.writeFileSync(path.join(__dirname,'time-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
