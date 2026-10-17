const assert = require('node:assert/strict');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
for (const file of ['config', 'physics', 'skills', 'world','aim','flyers','mines','pursuit', 'characters', 'roles','ranger', 'awakening', 'temporal', 'magnet', 'ghost', 'holy', 'demon', 'cosmic', 'charge', 'stellar', 'adaptive','arcana','engine', 'spectacle']) require(path.join(base, 'js', file + '.js'));
const G = globalThis.OrbDuel, C = G.Constants;
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function state(e) { return JSON.stringify({ snapshot: e.snapshot(), events: e.events, effects: e.effects, soundEvents: e.soundEvents, nextShield: e.balls.map(b => b.nextShield) }); }
function valid(e) {
  for (const b of e.balls) {
    ok([b.x, b.y, b.vx, b.vy, b.hp, b.speed].every(Number.isFinite), 'nonfinite state');
    ok(b.x >= b.radius - 1e-6 && b.x <= C.width - b.radius + 1e-6 && b.y >= b.radius - 1e-6 && b.y <= C.height - b.radius + 1e-6, 'wall penetration');
    ok(b.hp >= 0 && b.hp <= b.maxHp + 1e-6, 'hp bounds');
    ok(b.speed >= b.def.speed - 1e-6 && b.speed <= b.def.maxSpeed + 1e-6, 'speed cap');
    ok(Math.hypot(b.vx,b.vy)<=(b.motionSpeed||800)*b.temporal.rate+1e-6,'bounded momentum speed');if(!b.inertia)ok(Math.abs(Math.hypot(b.vx,b.vy)-(b.magnetic.anchored?0:(b.ghost.lungeSpeed||b.motionSpeed||b.speed)*b.temporal.rate))<1e-4,'effective cruise speed after recovery '+e.balls.map(b=>b.type).join('/')+' '+e.time+' '+JSON.stringify({type:b.type,vx:b.vx,vy:b.vy,speed:b.speed,motion:b.motionSpeed,inertia:b.inertia}));
  }
  for(const shot of e.projectiles) ok([shot.x,shot.y,shot.vx,shot.vy].every(Number.isFinite) && shot.x>=shot.radius && shot.x<=C.width-shot.radius && shot.y>=shot.radius && shot.y<=C.height-shot.radius && shot.bounces<=(shot.maxBounces??1),'bounded projectile '+e.balls.map(b=>b.type).join('/')+' at '+e.time+' '+JSON.stringify(shot));
  for(const b of e.balls) if(b.type==='trapper')ok(e.traps.filter(t=>t.owner===b.id).length<=G.Awakening.trapOptions(b).cap,'trap cap');
  ok(e.balls.some(b=>G.Ghost.phased(b)||G.Charge.flowing(b))||Math.hypot(e.balls[0].x - e.balls[1].x, e.balls[0].y - e.balls[1].y) >= C.radius * 2 - 0.03, 'unresolved overlap');
}
// All ordered pairings, including mirrors; many seeds and each step's invariants.
const results = {};
let matches = 0, maxTime = 0, minTime = Infinity;
const species = Object.keys(G.Types);
const seedsPerPair=process.argv.includes('--quick')?1:40;
for (const a of species) for (const b of species) {
  const r = results[a + '/' + b] = { left: 0, right: 0, draw: 0, totalTime: 0 };
  for (let i = 0; i < seedsPerPair; i++) {
    const e = new G.Engine([a, b], 'acceptance-' + i); e.start();
    while (e.state === 'running' && e.time < 205) { e.step(); valid(e); }
    ok(e.state === 'ended', 'match must terminate before 205 simulated seconds');
    ok(e.collisions > 0 || e.balls.some(b=>b.stats.shotsHit>0 || b.stats.trapsTriggered>0 || b.stats.lasersHit>0 || b.stats.poisonHits>0 || b.stats.cosmicHits>0 || b.stats.cometsHit>0 || b.stats.chargeHits>0), 'effective attacks must occur');
    const before = state(e); for (let n = 0; n < 200; n++) e.step(); ok(state(e) === before, 'post-end simulation changed');
    r[e.winner === 'draw' ? 'draw' : e.winner === 0 ? 'left' : 'right']++;
    r.totalTime += e.time; maxTime = Math.max(maxTime, e.time); minTime = Math.min(minTime, e.time); matches++;
  }
}
// Fixed-step determinism across frame rates, speeds and pauses.
function paced(fps, speed, types) {
  const e = new G.Engine(types, 'replay-42'); const c = new G.Clock(e); c.speed = speed; e.start();
  let n = 0;
  while (e.state === 'running' && n++ < 100000) {
    c.advance(1 / fps);
    if (n === 101) { e.pause(); const before = state(e); for (let i = 0; i < 20; i++) c.advance(0.08); ok(state(e) === before, 'pause must freeze entire state'); e.resume(); }
  }
  return e.snapshot();
}
for(const types of [['accelerator','shield'],['ranger','trapper'],['ranger','reflector'],['boomerang','laser'],['venom','reflector'],['normal','vampire'],['shield','normal'],['time','ranger'],['time','time'],['magnet','boomerang'],['magnet','time'],['ghost','time'],['ghost','ghost']]) { const baseline=paced(60,1,types);for(const fps of [30,60,144])for(const speed of [1,2,4])assert.deepEqual(paced(fps,speed,types),baseline,'frame-rate/speed determinism'); }
const paceEngine = new G.Engine(), paceClock = new G.Clock(paceEngine); paceEngine.start();
paceClock.advance(1 / 60); assert.equal(paceEngine.tick, 4); paceClock.speed = 4; paceClock.advance(1 / 60); assert.equal(paceEngine.tick, 20);
// Coincident balls, wall corners, high-speed opposing balls.
for (const point of [[23, 23], [C.width - 23, C.height - 23], [23, C.height / 2], [C.width / 2, C.height / 2]]) {
  const e = new G.Engine(['accelerator', 'reflector'], 'edge');
  for (const b of e.balls) { b.x = point[0]; b.y = point[1]; b.speed = b.def.maxSpeed; b.vx = -b.speed; b.vy = 0; }
  e.start(); e.step(); valid(e); for (let i = 0; i < 200; i++) { e.step(); valid(e); }
}
const fast = new G.Engine(['accelerator', 'accelerator'], 'fast');
fast.balls.forEach((b, i) => { b.x = C.width / 2 + (i ? 26 : -26); b.y = C.height / 2; b.speed = 365; b.vx = i ? -365 : 365; b.vy = 0; }); fast.start();
for (let i = 0; i < 20; i++) fast.step(); ok(fast.collisions === 1, 'one approach must cause one attack'); valid(fast);
ok(fast.soundEvents.filter(e=>e.kind==='ball').length===1,'one contact creates one ball sound');
const wallSound=new G.Engine(['normal','normal'],'wall-sound');wallSound.balls[0].x=C.radius+.01;wallSound.balls[0].vx=-wallSound.balls[0].speed;wallSound.balls[0].vy=0;wallSound.start();wallSound.step();ok(wallSound.soundEvents.some(e=>e.kind==='wall'),'wall bounce creates wall sound');wallSound.reset(['normal','normal'],'wall-sound');ok(wallSound.soundEvents.length===0,'reset clears pending audio');
// Draw, frozen ending, reflections do not recurse; dead vampire cannot revive.
const tie = new G.Engine(['normal', 'normal'], 'tie'); tie.balls.forEach((b, i) => { b.hp = 1; b.x = C.width / 2 - 22 + i * 45; b.y = C.height / 2; b.vx = i ? -235 : 235; b.vy = 0; }); tie.start(); tie.step(); assert.equal(tie.winner, 'draw');
const deadVamp = new G.Engine(['vampire', 'reflector'], 'dead'); deadVamp.balls[0].hp = 1; G.Combat.contact(...deadVamp.balls, deadVamp); ok(deadVamp.balls[0].hp === 0, 'no resurrection');
const reflect = new G.Engine(['reflector', 'reflector'], 'reflect'); reflect.balls.forEach(b=>b.stance.phase='active');G.Combat.contact(...reflect.balls, reflect); ok(reflect.balls.every(b => b.stats.reflected > 0 && b.stats.reflected <= b.def.damage * 1.2 * b.def.reflection), 'one reflection only');
const shield = new G.Engine(['vampire', 'shield'], 'shield'); shield.balls[0].hp = 90; shield.balls[1].shield=13; G.Combat.contact(...shield.balls, shield); ok(shield.balls[0].stats.healing === 0, 'no vamp heal from absorbed damage'); ok(shield.balls[1].hp === shield.balls[1].maxHp, 'explicit active shield should block attack');
const cycle=new G.Engine(['shield','normal'],'shield-cycle');cycle.balls.forEach(b=>{b.speed=0;b.vx=b.vy=0;});cycle.start();for(let i=0;i<4.2*240;i++)cycle.step();ok(cycle.balls[0].shield===0,'first shield ends after delayed opening');while(cycle.time<11.5)cycle.step();ok(Math.abs(cycle.balls[0].nextShield-21.5)<1e-8&&cycle.balls[0].shield>0,'shield recharge keeps ten-second cycle from actual opening');
const reset = new G.Engine(['shield', 'accelerator'], 'reset'); const fresh = state(reset); reset.start(); for (let i = 0; i < 5000; i++) reset.step(); reset.reset(['shield', 'accelerator'], 'reset'); assert.equal(state(reset), fresh, 'complete reset');
// Force late stage to verify drain bypasses shields and produces draw without skills.
const late = new G.Engine(['shield', 'shield'], 'late'); late.tick = 150 * 240; late.balls.forEach(b => { b.hp = 0.01; b.shield = 18; b.shieldUntil = 999; b.nextShield = 999; }); late.start(); late.step(); assert.equal(late.winner, 'draw');
// Ball impulses conserve normal momentum and kinetic energy; walls stay mirrors.
const momentum=new G.Engine(['normal','reflector'],'momentum');momentum.balls[0].x=250;momentum.balls[0].y=180;momentum.balls[1].x=277;momentum.balls[1].y=216;
momentum.balls[0].vx=220;momentum.balls[0].vy=120;momentum.balls[1].vx=-90;momentum.balls[1].vy=-200;
const velocities=momentum.balls.map(b=>({vx:b.vx,vy:b.vy}));const energy=momentum.balls.reduce((sum,b)=>sum+b.mass*(b.vx*b.vx+b.vy*b.vy),0);const normalP=momentum.balls.reduce((sum,b)=>sum+b.mass*(b.vx*.6+b.vy*.8),0);G.Physics.resolve(...momentum.balls);
ok(Math.abs(momentum.balls.reduce((sum,b)=>sum+b.mass*(b.vx*.6+b.vy*.8),0)-normalP)<1e-8,'normal momentum conserved');ok(Math.abs(momentum.balls.reduce((sum,b)=>sum+b.mass*(b.vx*b.vx+b.vy*b.vy),0)-energy)<1e-7,'elastic energy conserved below safety cap');
momentum.balls.forEach((b,i)=>ok(Math.abs((-b.vx*.8+b.vy*.6)-(-velocities[i].vx*.8+velocities[i].vy*.6))<1e-8,'tangent component preserved'));
const straight = new G.Engine(['normal','normal'],'parallel'); straight.balls.forEach(b => {b.y=180;b.vx=0;b.vy=b.speed;});const xPositions=straight.balls.map(b=>b.x);straight.start();for(let i=0;i<240*20;i++)straight.step();ok(straight.collisions===0,'parallel setup must not collide');straight.balls.forEach((b,i)=>ok(b.x===xPositions[i]&&b.vx===0,'no trajectory drift after long dry spell'));
const oldWidth=960,oldHeight=540;ok(C.width<=oldWidth*2/3&&C.height<=oldHeight*2/3,'both dimensions reduced by at least a third');
const summary = { matches, checks, seedsPerPair, minTime, maxTime, fixedStepDeterminism: '30/60/144 fps × 1/2/4 speed passed', results };
require('node:fs').writeFileSync(path.resolve(__dirname, 'results.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

