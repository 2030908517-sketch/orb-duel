'use strict';
const assert=require('assert/strict'),{load}=require('./verify-demon-descent.cjs');let checks=0;
function scene(entry='arcana.html'){const G=load(entry),team=entry==='team.html',e=team?new G.TeamEngine(['holy','normal','normal','normal'],'guard03','open'):new G.Engine(['holy','normal'],'guard03',{mode:entry==='index.html'?'classic':'arcana'});e.start();e.time=1;e.tick=240;const b=e.balls[0],t=e.balls[team?2:1];for(const v of e.balls)Object.assign(v,{x:325,y:300,vx:0,vy:0,hp:1000,maxHp:1000});Object.assign(b,{x:150,y:170});Object.assign(t,{x:225,y:170,vx:-300});G.Holy.seal(b,e,{x:150,y:170,radius:125,vertices:[]});const z=e.holyWorld.zones[0];z.started=e.time-.66;z.expires=30;return {G,e,b,t,z,A:G.HolyAngel};}
function hit(f,extra={}){return f.G.Combat.resolveBatch([{source:f.t,target:f.b,kind:'shot',raw:10,...extra}],f.e);}
function step(f,seconds){for(let n=0;n<Math.round(seconds/f.G.Constants.dt);n++){f.e.time+=f.G.Constants.dt;f.e.tick++;f.G.Holy.updateWorld(f.e,f.G.Constants.dt);}}
for(const entry of ['index.html','arcana.html','manual.html','team.html']){const f=scene(entry);f.G.Holy.updateWorld(f.e,f.G.Constants.dt);assert.equal(f.z.angel.phase,'guard');assert.equal(f.b.hp,1000);hit(f);assert.equal(f.b.hp,993);checks++;}
{
 const f=scene();f.t.vx=300;assert(!f.A.danger(f.b,f.e));f.e.projectiles.push({id:99,owner:f.t.id,x:220,y:170,vx:-500,vy:0,radius:5,expires:10,mode:'shot'});assert(f.A.danger(f.b,f.e));f.e.trapperWorld={cages:[{bounds:{left:180,right:290,top:100,bottom:250}}]};assert(!f.A.danger(f.b,f.e));checks++;
}
{
 const f=scene();f.b.shield=10;f.b.shieldUntil=20;hit(f);assert.equal(f.b.shield,3);assert.equal(f.b.hp,1000);f.b.role.damageReductionUntil=20;hit(f);assert.equal(f.b.hp,996);checks++;
}
{
 const f=scene();hit(f,{bypassShield:true,trueDamage:true});assert.equal(f.b.hp,990);checks++;
}
{
 const f=scene();f.G.Ghost.enter(f.b,f.e);hit(f);assert.equal(f.b.hp,1000);assert.notEqual(f.z.angel.phase,'guard');checks++;
}
{
 const f=scene();f.b.temporal.silenceUntil=10;hit(f);assert.equal(f.b.hp,990);assert.notEqual(f.z.angel.phase,'guard');checks++;
}
{
 const f=scene();f.A.guard(f.b,f.e);assert.equal(f.e.holyWorld.sanctuaryWaves.length,0);step(f,.08);assert.equal(f.e.holyWorld.sanctuaryWaves.length,0);step(f,.06);assert.equal(f.e.holyWorld.sanctuaryWaves.length,1);step(f,.55);assert.equal(f.z.angel.phase,'guard');assert.equal(f.e.holyWorld.sanctuaryWaves.length,0);assert.equal(f.G.HolyAngelView.guardFold(f.z.angel.elapsed,f.z.angel.guardOpenAt,f.z.angel.guardLife),1);step(f,.6);assert.notEqual(f.z.angel.phase,'guard');assert.equal(f.G.Combat.reduction(f.b,f.e),0);checks++;
}
{
 const f=scene();f.A.guard(f.b,f.e);f.b.x=330;assert.equal(f.G.Combat.reduction(f.b,f.e),0);f.G.Holy.retire(f.b,f.e);assert.equal(f.e.holyWorld.sanctuaryWaves.length,0);checks++;
}
console.log(JSON.stringify({passed:checks,total:11}));
