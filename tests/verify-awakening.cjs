const assert=require('node:assert/strict'),path=require('node:path');
for(const file of ['config','physics','skills','world','characters','roles','awakening','engine'])require(path.resolve(__dirname,'../js',file+'.js'));
const G=globalThis.OrbDuel,C=G.Constants;let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}function near(a,b,m){ok(Math.abs(a-b)<1e-8,m);}
function make(types){const e=new G.Engine(types,'awaken-test');e.start();return e;}
function awaken(e,id){G.Awakening.activate(e.balls[id],e);}
function resolve(e){G.Combat.resolveBatch(e.pendingAttacks,e);e.pendingAttacks=[];}
// Both triggers, no ready/pause progression; no repeated healing on retrigger.
for(const type of Object.keys(G.Types)){
 const e=make([type,'normal']);e.tick=15*240-2;e.step();ok(e.balls.every(b=>!b.awakening.active),'no early time trigger '+type);e.step();ok(e.balls.every(b=>b.awakening.active),'time trigger '+type);
 const above=make([type,'normal']);above.balls[0].hp=above.balls[0].maxHp*.5+.01;above.step();ok(!above.balls[0].awakening.active,'no trigger above 50 percent '+type);
 const low=make([type,'normal']);low.balls[0].hp=low.balls[0].maxHp*.5;low.step();ok(low.balls[0].awakening.active && !low.balls[1].awakening.active,'low hp trigger '+type);
 const fresh=JSON.stringify(new G.Engine([type,'normal'],'awaken-test').snapshot());e.pause();const saved=JSON.stringify(e.snapshot());for(let i=0;i<100;i++)e.step();ok(JSON.stringify(e.snapshot())===saved,'pause '+type);
 e.reset([type,'normal'],'awaken-test');ok(JSON.stringify(e.snapshot())===fresh,'reset '+type);
}
const normal=make(['normal','normal']);normal.balls[0].hp=50;awaken(normal,0);near(normal.balls[0].hp,58,'once-only heal');near(G.Combat.attackValue(normal.balls[0],normal),14.75,'normal damage boost');normal.step();near(normal.balls[0].hp,58,'no reactivation heal');
// Blood chain does not heal absorbed / evaded damage, does not resurrect, reflects once.
const chain=make(['vampire','normal']);chain.balls[0].hp=50;awaken(chain,0);G.Awakening.update(chain.balls[0],C.dt,chain);chain.time=.25;G.Awakening.update(chain.balls[0],C.dt,chain);chain.time=.55;G.Awakening.update(chain.balls[0],C.dt,chain);resolve(chain);near(chain.balls[1].hp,118.95,'chain pulse');near(chain.balls[0].hp,50.8925,'chain heals only actual pulse damage');
const shieldChain=make(['vampire','shield']);shieldChain.balls[0].hp=50;G.Combat.resolveBatch([{source:shieldChain.balls[0],target:shieldChain.balls[1],raw:1.2,kind:'chain',healRatio:1}],shieldChain);near(shieldChain.balls[0].hp,50,'no shield drain heal');
const reflectedChain=make(['vampire','reflector']);reflectedChain.balls[0].hp=50;G.Combat.resolveBatch([{source:reflectedChain.balls[0],target:reflectedChain.balls[1],raw:5,kind:'chain',healRatio:1}],(reflectedChain.balls[1].stance.phase='active',reflectedChain));near(reflectedChain.balls[0].hp,51.25,'chain heal after one reflection');
const dead=make(['vampire','normal']);dead.balls[0].hp=1;G.Combat.resolveBatch([{source:dead.balls[0],target:dead.balls[1],raw:5,kind:'chain',healRatio:1},{source:dead.balls[1],target:dead.balls[0],raw:5,kind:'contact'}],dead);near(dead.balls[0].hp,0,'chain cannot resurrect');
// Dash is locked, telegraphed, bounded; first strike only, every attack type respects immunity.
const dash=make(['accelerator','reflector']);awaken(dash,0);G.Awakening.update(dash.balls[0],C.dt,dash);ok(dash.balls[0].awakening.chargeUntil===.7 && !dash.balls[0].motionSpeed,'telegraph before dash');const aim=dash.balls[0].awakening.aim;dash.time=.7;G.Awakening.update(dash.balls[0],C.dt,dash);ok(dash.balls[0].motionSpeed===900,'dash speed');near(Math.atan2(dash.balls[0].vy,dash.balls[0].vx),aim,'locked aim');
for(const kind of ['contact','shot','trap','chain','counter','boomerang','laser','poison','barrier']){const hp=dash.balls[0].hp;G.Combat.resolveBatch([{source:dash.balls[1],target:dash.balls[0],raw:50,kind}],dash);near(dash.balls[0].hp,hp,'immune to '+kind);}
const base=G.Combat.attackValue(dash.balls[0],dash)/G.Awakening.dashMultiplier(900);G.Combat.contactAttacks(...dash.balls,dash);near(G.Combat.attackValue(dash.balls[0],dash),base,'first enhanced contact consumed');const hpDash=dash.balls[0].hp;G.Combat.applyDamage(dash.balls[0],10,dash,{bypassShield:true,bypassInvulnerability:true});near(dash.balls[0].hp,hpDash-10,'late drain bypass');
dash.balls[0].x=C.width-24;dash.balls[0].vx=900;dash.balls[0].vy=0;G.Physics.integrate(dash.balls[0],C.dt);ok(dash.balls[0].x<=C.width-C.radius && dash.balls[0].vx<0,'dash wall reflection');dash.time=dash.balls[0].awakening.dashUntil;G.Awakening.update(dash.balls[0],C.dt,dash);ok(!dash.balls[0].motionSpeed && !G.Awakening.dashing(dash.balls[0],dash),'dash expires');near(Math.hypot(dash.balls[0].vx,dash.balls[0].vy),dash.balls[0].speed,'speed restored');
// Reworked characters keep their awakening resources within explicit bounds.
for(const type of ['normal','vampire','shield','ranger','laser','reflector','trapper']){const e=make([type,'normal']);awaken(e,0);const b=e.balls[0];ok(b.awakening.active&&b.hp<=b.maxHp,'awakening is finite '+type);if(type==='shield')ok(b.shield===G.Awakening.shieldOptions(b).amount&&b.role.pressure===0,'shield awakening resets pressure');if(type==='vampire')ok(b.role.blood>=3&&b.role.blood<=8,'vampire receives finite start blood');}
// The seven redesigned ability boundaries are exercised in verify-roster.cjs.
const summary={checks,passed:true,trigger:'15s or <=50% HP',skills:Object.keys(G.Awakening.defs)};require('node:fs').writeFileSync(path.join(__dirname,'awakening-results.json'),JSON.stringify(summary,null,2));console.log(summary);
