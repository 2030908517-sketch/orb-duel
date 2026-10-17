const assert=require('node:assert/strict'),path=require('node:path');
for(const name of ['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','cosmic','engine','audio','spectacle'])require(path.resolve(__dirname,'../js/'+name+'.js'));
const G=globalThis.OrbDuel,C=G.Constants;let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;},near=(a,b,m)=>ok(Math.abs(a-b)<1e-7,m);
const make=(types)=>{const e=new G.Engine(types,'power-boundaries');e.start();return e;};
const attack=(e,packet)=>G.Combat.resolveBatch([packet],e);
{
 const e=make(['normal','normal']),[b,t]=e.balls;b.charges=3;t.vx=0;t.vy=235;
 attack(e,{source:b,target:t,raw:5,kind:'contact',impact:{nx:1,ny:0}});
 ok(t.vx>=190,'heavy fist transfers extra directional impulse');ok(e.hitStopSerial===1,'heavy fist requests impact stop');
 ok(t.hitVisual.age>0,'contact compression is visible during stop');
 const plain=make(['normal','normal']);attack(plain,{source:plain.balls[0],target:plain.balls[1],raw:5,kind:'contact',impact:{nx:1,ny:0}});ok(plain.hitStopSerial===0,'ordinary hit never stops time');
}
{
 const e=make(['ranger','normal']),[b,t]=e.balls;G.Awakening.activate(b,e);b.role.calibration=b.def.calibrationCap;b.role.calibrationUntil=100;b.role.reloadUntil=.1;t.x=b.x+100;e.time=.1;
 G.Roles.rangerUpdate(b,C.dt,e);const locked=b.role.salvoAngle,initial={vx:b.vx,vy:b.vy};
 ok(e.projectiles.length===0&&b.role.salvoFireAt>e.time,'assault has a visible deployment window');
 t.x=30;t.y=300;e.time=.4;G.Roles.rangerUpdate(b,C.dt,e);
 ok(e.projectiles.length===3,'first salvo fans into three projectiles');
 const refreshed=b.role.salvoAngle;ok(Math.abs(refreshed-locked)>.1,'moving target changes pre-aim at release');const angles=e.projectiles.map(p=>Math.atan2(p.vy,p.vx));near(Math.atan2(Math.sin(angles[1]-refreshed),Math.cos(angles[1]-refreshed)),0,'salvo follows refreshed release aim');
 ok((b.vx-initial.vx)*Math.cos(refreshed)+(b.vy-initial.vy)*Math.sin(refreshed)<0,'firing has real backwards recoil');ok(b.vx*Math.cos(refreshed)+b.vy*Math.sin(refreshed)<0,'assault visibly slides backwards even when cruising forwards');
 e.time=.62;G.Roles.rangerUpdate(b,C.dt,e);e.time=.84;G.Roles.rangerUpdate(b,C.dt,e);
 ok(e.projectiles.length===7&&e.projectiles.at(-1).heavy,'two fan salvos followed by a distinct heavy shell');
 ok(b.role.ammo===0&&b.role.reloadUntil>e.time,'burst ends in reload downtime');
 const impact=make(['ranger','normal']),[gun,target]=impact.balls;gun.x=70;gun.y=170;target.x=135;target.y=170;target.vx=0;target.vy=235;
 G.World.fire(gun,impact,{angle:0,damage:7.8,heavy:true,speed:520,radius:6.5});G.World.update(impact,.1);G.Combat.resolveBatch(impact.pendingAttacks,impact);
 ok(target.vx>=180&&impact.hitStopSerial===1,'world projectile preserves heavy metadata into damage and shove');
 ok(impact.soundEvents.some(s=>s.kind==='heavyShotHit'),'heavy shell has dedicated contact audio');
 const immune=make(['ranger','accelerator']);G.Awakening.activate(immune.balls[1],immune);immune.balls[1].awakening.dashUntil=2;const before=[immune.balls[1].vx,immune.balls[1].vy];
 attack(immune,{source:immune.balls[0],target:immune.balls[1],raw:7,kind:'shot',heavyShot:true,angle:0});ok(JSON.stringify(before)===JSON.stringify([immune.balls[1].vx,immune.balls[1].vy])&&immune.hitStopSerial===0,'invulnerability suppresses strong-contact rewards');
}
{
 const e=make(['shield','normal']),[b,t]=e.balls;G.Awakening.activate(b,e);b.x=80;b.y=170;b.vx=0;b.vy=-225;t.x=160;t.y=170;
 G.Combat.applyDamage(b,8,e);e.time=b.shieldUntil;G.Roles.shieldUpdate(b,C.dt,e);
 ok(Number.isFinite(b.role.shieldAngle)&&Math.abs(b.role.shieldAngle-Math.atan2(b.vy,b.vx))>.5,'shield release predicts enemy rather than cruise direction');ok(!e.waves.length,'shield release waits for windup');
 const locked=b.role.shieldAngle;t.y=240;e.time+=.22;G.Roles.shieldUpdate(b,C.dt,e);near(e.waves[0].angle,locked,'warning locks direction rather than homing');
 t.x=b.x+Math.cos(locked)*80;t.y=b.y+Math.sin(locked)*80;t.vx=0;t.vy=0;G.Roles.updateWaves(e,.25);G.Combat.resolveBatch(e.pendingAttacks,e);e.pendingAttacks=[];
 ok(e.waves[0].width>e.waves[0].baseWidth,'pressure wave expands visibly and physically');ok(t.vx*Math.cos(locked)+t.vy*Math.sin(locked)>=189&&e.hitStopSerial===1,'pressure-wave hit has real shove and stop');
 const hp=t.hp;G.Roles.updateWaves(e,.02);G.Combat.resolveBatch(e.pendingAttacks,e);near(t.hp,hp,'pressure wave cannot repeatedly hurt same target');
}
{
 const e=make(['laser','normal']),[b,t]=e.balls;G.Awakening.activate(b,e);b.x=70;b.y=170;t.x=115;t.y=170;t.vx=0;t.vy=235;b.laser={angle:0,awake:true};G.Roles.laserFire(b,e);
 const beam=e.beams[0],raw=beam.raw*(1+.88/.28);G.Roles.updateBeams(e);const start=beam.angle;G.Combat.resolveBatch(e.pendingAttacks,e);e.pendingAttacks=[];
 for(const time of [.12,.24,.36,.48,.6]){e.time=time;G.Roles.updateBeams(e);G.Combat.resolveBatch(e.pendingAttacks,e);e.pendingAttacks=[];}
 ok(Math.abs(beam.angle-start)>.3,'cannon sweeps a predetermined sector');near(t.maxHp-t.hp,raw,'six contacts cannot exceed the cast damage budget');ok(t.vx>=270,'sustained contact produces visible cumulative push');ok(e.hitStopSerial===1,'sustained beam stops only on initial contact');
 e.time=.66;G.Roles.updateBeams(e);ok(e.beams.length===0,'cannon ends before its cooling window');
 const dormant=make(['laser','normal']);G.Awakening.activate(dormant.balls[0],dormant);dormant.balls[0].x=60;dormant.balls[0].y=60;dormant.balls[1].x=60;dormant.balls[1].y=300;dormant.balls[0].laser={angle:0,awake:true};G.Roles.laserFire(dormant.balls[0],dormant);for(const time of [0,.12,.24,.36,.48,.6]){dormant.time=time;G.Roles.updateBeams(dormant);G.Combat.resolveBatch(dormant.pendingAttacks,dormant);dormant.pendingAttacks=[];}near(dormant.balls[1].hp,dormant.balls[1].maxHp,'sweep can miss outside the telegraphed sector');
}
{
 for(const speed of [1,2,4]){
  const e=make(['normal','normal']),clock=new G.Clock(e);clock.speed=speed;const step=e.step.bind(e);let fired=false;
  e.step=()=>{step();if(!fired){fired=true;e.hitStop(.06);}};
  clock.advance(C.dt/speed);const frozen=JSON.stringify(e.snapshot()),frozenEffects=JSON.stringify(e.effects);clock.advance(.03);ok(JSON.stringify(e.effects)===frozenEffects,'impact stop also freezes effect ages');ok(JSON.stringify(e.snapshot())===frozen,'impact stop freezes whole simulation at '+speed+'x');
  e.pause();const remaining=clock.stopRemaining;clock.advance(.1);near(clock.stopRemaining,remaining,'pause freezes remaining stop');e.resume();clock.advance(.03);ok(JSON.stringify(e.snapshot())===frozen,'stop duration uses real time at '+speed+'x');clock.advance(.01);ok(e.tick>1,'simulation resumes without catch-up');
  e.reset(['normal','normal'],'power-boundaries');e.start();clock.advance(.01);ok(clock.stopRemaining===0,'reset clears pending stop');
 }
 function paced(fps,speed){const e=make(['ranger','laser']),clock=new G.Clock(e);clock.speed=speed;while(e.state==='running')clock.advance(1/fps);return e.snapshot();}
 const base=paced(60,1);for(const [fps,speed] of [[30,1],[144,1],[60,2],[60,4]])assert.deepEqual(paced(fps,speed),base,'visual stops preserve seeded simulation result');checks+=4;
}
console.log({passed:true,checks,scope:'new mechanics, impact stops, immunity, pause/reset, deterministic replay; no balance evaluation'});
