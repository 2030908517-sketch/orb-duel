'use strict';
// Historical command retained for regressions of the retired standalone ward.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),base=path.resolve(__dirname,'..');
function load(entry){const c=vm.createContext({console,performance,structuredClone,URLSearchParams,Math,Date,document:{},matchMedia:()=>({matches:false})});c.window=c;const skip=new Set(['app','team-app','manual-cues','manual-ui','manual-fullscreen','animation-review','recording-view','audio-audition']);for(const m of fs.readFileSync(path.join(base,entry),'utf8').matchAll(/<script src="js\/([^"?]+)\.js/g))if(!skip.has(m[1]))vm.runInContext(fs.readFileSync(path.join(base,'js',m[1]+'.js'),'utf8'),c,{filename:m[1]});return c.OrbDuel;}
let checks=0;function ok(value,message){checks++;assert.ok(value,message);}
for(const entry of ['index.html','arcana.html','manual.html','team.html']){
 const G=load(entry),types=entry==='team.html'?['holy','normal','normal','normal']:['holy','normal'];
 const e=entry==='team.html'?new G.TeamEngine(types,'no-legacy-ward','open'):new G.Engine(types,'no-legacy-ward',{mode:entry==='index.html'?'1v1':'arcana'});e.start();
 for(const b of e.balls){b.vx=b.vy=b.speed=0;if(b.arcana)b.arcana.used=true;}
 for(let i=0;i<Math.ceil(3.1/G.Constants.dt);i++)e.step();
 const b=e.balls[0];ok(b.shield===0,entry+' does not regenerate the retired standalone ward');ok(!Object.hasOwn(b.holy,'nextWard'),entry+' does not create the retired ward clock');
 e.reset(types,'no-legacy-ward');ok(!Object.hasOwn(e.balls[0].holy,'nextWard')&&e.balls[0].shield===0,entry+' resets without old ward state');
}
const G=load('arcana.html');
for(const awake of [false,true]){
 const e=new G.Engine(['time','holy'],'angel-rewind-'+awake,{mode:'arcana'});e.start();const [clock,holy]=e.balls;
 holy.awakening.active=awake;holy.holy.angelGuardCD=.25;clock.hp=0;e.checkEnd();ok(!!e.timeRewind.active,'native lethal hit starts rewind');G.TimeRewind.finish(e);
 const restored=e.balls[1];ok(restored.holy.angelGuardCD===G.HolyAngel.config.guardCD,'current angel defense returns at full cooldown');ok(!Object.hasOwn(restored.holy,'nextWard'),'rewind never reconstructs old ward');
 const before=restored.holy.angelGuardCD;for(let i=0;i<60;i++)e.step();ok(restored.holy.angelGuardCD<before&&restored.holy.angelGuardCD>0,'current angel cooldown runs after rewind');
}
console.log(JSON.stringify({passed:true,checks,note:'Retired ward absence and current angel defense rewind cooldown; no balance batches'}));
