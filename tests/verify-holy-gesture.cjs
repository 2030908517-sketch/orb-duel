'use strict';const assert=require('assert/strict'),{load}=require('./verify-demon-descent.cjs'),G=load(),R=G.HolyAngelRig,Q=G.HolyAngel.config,M=R.math;let count=0;
function setup(){const e=new G.Engine(['holy','normal'],'rig25-fixed',{mode:'arcana'});e.start();e.time=1;G.Holy.seal(e.balls[0],e,{x:180,y:170,radius:125,vertices:[]});e.holyWorld.zones[0].started=e.time-.66;return{e,z:e.holyWorld.zones[0]};}
function near(a,b,t=1e-5){assert(Math.abs(a-b)<t,`${a} != ${b}`);}function same(a,b,t=1e-4){assert(M.len(M.sub(a,b))<t);}
{
 const {z}=setup(),s=z.angel;for(const phase of ['sword','spear']){s.phase=phase;s.angle=.7;const wind=phase==='sword'?Q.swordWind:Q.spearWind,travel=phase==='sword'?Q.swordSwing:Q.spearThrust;for(const at of [wind,wind+travel,wind+travel+Q.recovery]){s.elapsed=at-1e-7;const a=R.motion(z,.2);s.elapsed=at+1e-7;const b=R.motion(z,.2);for(const key of ['sword','spear']){same(a.hands[key],b.hands[key]);near(Math.atan2(Math.sin(a.angles[key]-b.angles[key]),Math.cos(a.angles[key]-b.angles[key])),0);}near(a.twist,b.twist);}}count++;console.log('PASS continuous pullback, strike and recovery without weapon replacement');
}
{
 const {z,e}=setup(),s=z.angel;for(const phase of ['idle','guard','sword','spear'])for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8)for(let i=0;i<=80;i++){e.time+=.01;Object.assign(s,{phase,angle,elapsed:i*.01});const a=R.sample(z,e);for(const key of ['sword','spear']){const j=a.arms[key];near(M.len(M.sub(j.shoulder,j.elbow)),.305);near(M.len(M.sub(j.hand,j.elbow)),.305);assert(Number.isFinite(j.grip.x+j.grip.y+j.angle+j.foreshorten));const x=j.local.joint.shoulder.x*Math.cos(a.turn),y=j.local.joint.shoulder.y-j.local.joint.shoulder.x*Math.sin(a.turn)*.40,p=R.project(j.shoulder,a.turn);near(x,p.x);near(y,p.y);}}count++;console.log('PASS fixed bones, connected projected shoulders and finite grip at 16 headings');
}
{
 const {z}=setup(),s=z.angel;s.phase='sword';s.angle=.5;s.elapsed=Q.swordWind;const a=R.motion(z,0);s.elapsed+=Q.swordSwing;const b=R.motion(z,0);assert(M.len(M.sub(a.hands.sword,b.hands.sword))>.35);assert(Math.abs(b.twist-a.twist)>.4);s.phase='spear';s.elapsed=Q.spearWind;const c=R.motion(z,0);s.elapsed+=Q.spearThrust;const d=R.motion(z,0);const axis=R.direction(s.angle,.45*Math.sin(s.angle),0);assert(M.dot(M.sub(d.hands.spear,c.hands.spear),axis)>.12);s.elapsed=Q.spearWind+Q.spearThrust+Q.recovery*.62;same(R.motion(z,0).hands.spear,c.hands.spear);count++;console.log('PASS sword wrist travels with torso release; spear extends then retracts along its axis');
}
{
 const {z,e}=setup(),b=e.balls[0];Object.assign(z.angel,{phase:'sword',angle:0});G.HolyAngel.updateZone(b,z,e,.10);const a=R.facing(z,e);assert(a>0);z.angel.angle=Math.PI;G.HolyAngel.updateZone(b,z,e,.10);const c=R.facing(z,e);assert(Math.abs(c-a)<=.200001);const paused=JSON.stringify(R.sample(z,e));for(let i=0;i<20;i++)assert.equal(JSON.stringify(R.sample(z,e)),paused);count++;console.log('PASS combat-owned shallow turn is rate limited and rendering does not advance it');
}
{
 const {z,e}=setup();Object.assign(z.angel,{phase:'sword',angle:0,elapsed:.35});const before=R.sample(z,e);e.time+=G.Constants.dt;z.angel.phase='guard';z.angel.elapsed=0;const after=R.sample(z,e);same(before.motion.hands.sword,after.motion.hands.sword);e.time+=.12;const home=R.sample(z,e);same(home.motion.hands.sword,R.motion(z,home.face).hands.sword);count++;console.log('PASS guard interruption returns the complete held pose smoothly');
}
{
 const {z,e}=setup(),before=JSON.stringify(e.snapshot());for(let i=0;i<20;i++)R.sample(z,e);assert.equal(JSON.stringify(e.snapshot()),before);for(const entry of ['index.html','arcana.html','manual.html','team.html'])assert(load(entry).HolyAngelRig);count++;console.log('PASS renderer is combat read only and all four production entries load the rig');
}
{
 const {z,e}=setup();for(let a=0;a<Math.PI*2;a+=Math.PI/8)for(let i=0;i<90;i++){e.time+=.01;Object.assign(z.angel,{phase:'sword',angle:a,elapsed:i*.008});const rig=R.sample(z,e),arm=rig.arms.sword,forearm=M.norm(M.sub(arm.hand,arm.elbow));const expected=G.HolyAngelMotion.swordAxis(forearm);same(arm.axis,expected);assert(M.dot(arm.axis,forearm)<.91);const screen=R.project(expected,rig.turn);near(Math.atan2(Math.sin(arm.angle-Math.atan2(screen.y,screen.x)),Math.cos(arm.angle-Math.atan2(screen.y,screen.x))),0);assert(arm.foreshorten>=.4);}count++;console.log('PASS sword keeps a fixed natural wrist angle throughout the arm swing, without independent spinning');
}
console.log(JSON.stringify({passed:count,total:7}));
