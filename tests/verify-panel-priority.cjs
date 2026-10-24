'use strict';
const assert=require('assert/strict'),{load}=require('./verify-demon-descent.cjs'),G=load();
let checks=0;const has=(rows,label)=>rows.some(v=>v.label===label);
for(const type of Object.keys(G.Types))for(const active of [false,true]){
 const e=new G.Engine([type,'normal'],'panel-priority',{mode:'arcana'}),b=e.balls[0];b.awakening.active=active;
 const rows=G.StatusPanel.stats(b,e).extra;assert(rows.length<=6);assert(rows.every(v=>v.label&&v.value!==undefined));checks++;
 if(type==='demon'){assert(has(rows,'献祭魂力'));assert(has(rows,'地狱降临'));assert(has(rows,'魔爪CD')||has(rows,'双门CD'));checks++;}
 if(type==='accelerator'&&active){assert(has(rows,'冲刺冷却'));checks++;}
 if(type==='trapper'){assert(has(rows,'节点')&&has(rows,'布置')&&has(rows,'置换'));checks++;}
}
{
 const e=new G.Engine(['demon','normal'],'resource',{mode:'arcana'}),b=e.balls[0];
 G.DemonHell.gain(b,.5,e,'touch');G.DemonHell.gain(b,1,e,'pierce');
 assert.equal(G.StatusPanel.stats(b,e).extra[0].value,'1.5 / 5');
 const h=G.DemonHell.state(b);h.phase='active';h.until=e.time+8;
 assert(has(G.StatusPanel.stats(b,e).extra,'双爪CD'));
 const native=G.Skills.demon.status(b,e),ordered=G.StatusPanel.prioritize(b,native);
 assert.equal(ordered.length,native.length);assert(has(ordered,'烙印')&&has(ordered,'魂线'));checks+=3;
}
{
 const e=new G.Engine(['venom','normal'],'evolution',{mode:'arcana'}),b=e.balls[0];b.awakening.active=true;b.venomEvolution={erosion:4,paralysis:7};b.nextPool=e.time+2;
 const rows=G.StatusPanel.stats(b,e).extra;assert.equal(rows.find(v=>v.label==='侵蚀进化').value,'+4% / 20%');assert.equal(rows.find(v=>v.label==='麻痹进化').value,'+7% / 20%');assert.equal(rows.find(v=>v.label==='毒池CD').value,'2.0s');checks++;
}
console.log('PASS '+checks+' panel resource, cooldown, slot and full-inventory checks');
