const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const scripts=[...fs.readFileSync(root+'/manual.html','utf8').matchAll(/<script src="js\/([^"?]+)\.js/g)].map(m=>m[1]).filter(n=>!['app','manual-ranger','manual-roles','manual-four','manual-cues','manual-ui','manual-fullscreen','audio-audition','recording-view','animation-review'].includes(n));
function load(adapter=true,baseline=null){const c=vm.createContext({console,performance,structuredClone,URLSearchParams,Math,Date,document:{},matchMedia:()=>({matches:false})});c.window=c;
  for(const name of [...scripts,'team-maps','team-engine','team-runtime'])vm.runInContext(fs.readFileSync(path.join(baseline||root+'/js',name+'.js'),'utf8'),c,{filename:name+'.js'});
  if(adapter)for(const name of ['manual-ranger','manual-roles','manual-four'])vm.runInContext(fs.readFileSync(root+'/js/'+name+'.js','utf8'),c);return c.OrbDuel;
}
const G=load(),M=G.ManualRanger;let checks=0;
function ok(v,message){checks++;assert.ok(v,message);}function near(a,b,message){ok(Math.abs(a-b)<1e-7,message+': '+a+' / '+b);}
function scene(enemy='normal'){const e=new G.Engine(['ranger',enemy],'manual-fixture',{mode:'arcana'});e.start();const clock=new G.Clock(e);M.attach(e,clock);const b=e.balls[0],t=e.balls[1];
  for(const v of e.balls){v.hp=v.maxHp=1000;v.vx=v.vy=v.speed=0;v.awakening.nextCast=999;v.nextShot=0;if(v.arcana)v.arcana.used=true;}
  b.x=100;b.y=170;t.x=270;t.y=170;b.arcana.used=false;b.nextShot=0;return{e,b,t,clock};
}
function steps(e,n){for(let i=0;i<n;i++)e.step();}
// Idle manual actors cannot auto-fire; enemies still use their real AI.
{const{e,b}=scene('ranger');steps(e,240);near(b.stats.shotsFired,0,'manual idle');ok(e.balls[1].stats.shotsFired>0,'enemy AI fires');}
// Real burst follows successive mouse positions; existing spread stays inside its normal bounds.
{const{e,b}=scene();M.point(e,300,170);ok(M.fire(e),'burst command accepted');steps(e,1);let p=e.projectiles.find(p=>p.owner===b.id);ok(Math.abs(Math.atan2(p.vy,p.vx))<.2,'first round points right');
  M.point(e,b.x,b.y+150);steps(e,105);p=e.projectiles.filter(p=>p.owner===b.id).at(-1);ok(p&&Math.abs(Math.atan2(p.vy,p.vx)-Math.PI/2)<.2,'second round follows new pointer');
  M.point(e,b.x-100,b.y);steps(e,105);near(b.stats.shotsFired,3,'one click is exactly three shots');ok(b.role.reloadUntil>e.time,'native reload starts');ok(!M.fire(e),'cannot bypass reload');
  steps(e,Math.ceil((b.role.reloadUntil-e.time)/G.Constants.dt)+240);near(b.stats.shotsFired,3,'completed reload plus idle second does not auto-fire');}
for(const mode of ['sniper','scatter']){const{e,b}=scene();b.awakening.active=true;b.role.calibration=3;b.role.calibrationUntil=999;e.manual.selected=mode;ok(M.fire(e),'advanced '+mode);ok(b.role.fireMode===mode,'requested weapon chosen');if(mode==='scatter'){near(b.role.calibration,0,'scatter consumes calibration on selection');ok(b.role.salvoFireAt>e.time,'native deployment delay');}else{ok(b.role.sniperFireAt>e.time,'native sniper aim time');G.Ranger.receiveDamage(b,e);ok(b.role.sniperHurt&&b.role.calibration===0,'native hurt spread');}}
{const{e,b}=scene();b.awakening.active=true;e.manual.selected='sniper';ok(M.fire(e));ok(b.role.fireMode==='burst','low calibration cannot use advanced weapon');}
{const{e,b}=scene();b.awakening.active=true;b.role.calibration=3;b.role.calibrationUntil=999;
  G.Ranger.ammoMarkers(b,e);ok(G.Ranger.ammoMarkers(b,e).some(m=>m.shape==='sniperRound'),'selected sniper has sniper icon');
  const before=JSON.stringify(b.role);ok(M.switch(e));G.Ranger.ammoMarkers(b,e);e.time+=.3;
  let markers=G.Ranger.ammoMarkers(b,e);ok(markers.length===3&&markers.every(m=>m.shape==='bar'),'right-click scatter shows three rounds');near(markers.filter(m=>m.active).length,3,'full scatter preview');
  ok(JSON.stringify(b.role)===before,'cosmetic preview does not alter combat role');G.Ranger.reload(b,e);e.manual.executing=false;e.time+=b.role.reloadDuration*.45;
  const until=b.role.reloadUntil,ammo=b.role.ammo;ok(M.switch(e));G.Ranger.ammoMarkers(b,e);e.time+=.3;markers=G.Ranger.ammoMarkers(b,e);
  ok(markers.length===1&&markers[0].shape==='sniperRound','switching during reload updates selected icon');near(b.role.reloadUntil,until,'switch preserves reload deadline');near(b.role.ammo,ammo,'preview preserves actual ammo');
  steps(e,Math.ceil((until-e.time)/G.Constants.dt)+240);near(b.stats.shotsFired,0,'switch during reload cannot cause a shot');}
// Read-only availability is free. Cursor directions use the existing route and begin.
for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,-Math.PI*3/4,-Math.PI/2,-Math.PI/4]){
  const{e,b,t}=scene();b.x=180;b.y=170;t.x=320;t.y=285;b.hp=300;b.awakening.active=true;
  M.point(e,b.x+Math.cos(angle)*100,b.y+Math.sin(angle)*100);ok(M.ultimate(e,true),'read-only legal directional dodge');ok(!b.arcana.used,'query is free');
  ok(M.ultimate(e),'mouse-direction ultimate');near(b.arcana.evadeAngle,angle,'screen-space direction');ok(b.arcana.used&&b.arcana.phase==='counterStep','dodge consumes');ok(G.Arcana.immune(b)&&G.Arcana.noContact(b),'native dodge protection');
  steps(e,40);ok(b.arcana.phase==='counterCharge','window starts after dodge');near(b.arcana.until-e.time,1-G.Constants.dt,'one-second window');
  const time=e.time;e.pause();steps(e,300);near(e.time,time,'pause freezes window');e.resume();steps(e,241);ok(b.arcana.phase==='counterRecovery'||b.arcana.phase==='idle','window times out');ok(!e.projectiles.some(p=>p.mode==='arcPierce'),'never auto-fire');ok(b.arcana.used,'no refund');
}
{const{e,b,t}=scene();b.hp=300;b.awakening.active=true;b.temporal.silenceUntil=999;ok(!M.fire(e),'silence blocks normal shots');M.point(e,b.x,b.y-100);ok(M.ultimate(e),'silenced cursor dodge');steps(e,40);ok(M.fire(e),'silenced manual counter charge');ok(!e.projectiles.some(p=>p.mode==='arcPierce'),'click does not skip charge');steps(e,260);const p=e.projectiles.find(p=>p.mode==='arcPierce');ok(p&&p.noMirror&&p.noMagnet,'original entity flags');near(p.speed,G.RangerArcana.bulletSpeed,'native speed');near(p.raw,G.Arcana.defs.ranger.raw,'native damage');}
{const{e,b,t,clock}=scene();b.hp=300;b.awakening.active=true;clock.stopRemaining=.5;ok(!M.fire(e)&&!M.ultimate(e),'hitstop blocks all commands');clock.stopRemaining=0;t.arcana={phase:'warning'};ok(!M.ultimate(e),'cannot pre-dodge unavoidable normal arcana');t.arcana.phase='idle';ok(!e.manual.armed,'blocked E was not buffered');ok(!b.arcana.used,'blocked inputs consume nothing');e.pause();ok(!M.fire(e));}
{const{e,b,t,clock}=scene();b.hp=300;b.awakening.active=true;M.point(e,b.x,b.y-100);ok(M.ultimate(e));steps(e,40);
  const remaining=M.info(e).window,shots=b.stats.shotsFired;clock.stopRemaining=.5;clock.stopSeen=e.hitStopSerial;clock.advance(.1);clock.advance(.1);
  near(M.info(e).window,remaining,'real clock hitstop does not consume the one-second window');ok(!M.fire(e),'window input blocked in real clock hold');clock.stopRemaining=0;
  near(b.stats.shotsFired,shots,'blocked shot not emitted');steps(e,10);near(b.stats.shotsFired,shots,'blocked shot not queued after release');}
// Clicking within the window starts the original charge; aiming then locks normally.
{const{e,b}=scene();b.hp=300;b.awakening.active=true;M.point(e,b.x+100,b.y);ok(M.ultimate(e),'cursor chord executor');steps(e,40);
  ok(b.arcana.manualCounter==='window','explicit click window');near(e.soundEvents.filter(s=>s.kind==='arcRangerCharge').length,0,'no charging sound before click');
  steps(e,100);ok(!e.projectiles.some(p=>p.mode==='arcPierce'),'waiting does not shoot');ok(M.fire(e),'click starts charge');const until=b.arcana.until;
  near(until-e.time,G.RangerArcana.chargeTime,'original full charge after click');ok(!M.fire(e),'second click cannot restart charge');near(b.arcana.until,until,'duplicate click preserves deadline');
  near(e.soundEvents.filter(s=>s.kind==='arcRangerCharge').length,1,'one native charge sound');steps(e,100);M.point(e,b.x,b.y-100);steps(e,1);near(b.arcana.aim,-Math.PI/2,'mouse controls prelock aim');
  while(e.time<b.arcana.lockAt+G.Constants.dt)steps(e,1);ok(b.arcana.locked,'original late lock');const aim=b.arcana.aim;M.point(e,b.x+100,b.y);steps(e,1);near(b.arcana.aim,aim,'locked aim ignores later mouse');
  while(b.arcana.phase==='counterCharge')steps(e,1);const p=e.projectiles.find(p=>p.mode==='arcPierce');ok(p,'native fire follows completed charge');near(Math.atan2(p.vy,p.vx),aim,'projectile follows locked mouse direction');}
{const{e,b}=scene();b.hp=300;b.awakening.active=true;b.x=b.radius+3;M.point(e,-100,b.y);ok(!M.ultimate(e),'blocked cursor route rejected');ok(!b.arcana.used,'no illegal route consumption');}
// Loading the adapter without a controlled player must be a transparent pass-through.
{const{e,b,t}=scene('time');b.hp=300;b.awakening.active=true;t.arcana.used=false;G.TimeRewind.record(e);t.hp=0;ok(G.TimeRewind.trigger(e),'real time rewind starts');
  ok(!M.fire(e)&&!M.ultimate(e),'rewind freeze rejects inputs');e.manual.executing=true;e.manual.armed=true;
  for(let i=0;i<800&&e.timeRewind.active;i++)e.step();ok(!e.timeRewind.active,'real rewind finishes');M.sync(e);
  ok(!e.manual.executing&&!e.manual.armed,'rewind drops pending manual actions');ok(b.role.reloadUntil>e.time,'native rewind cooldown preserved');ok(!M.fire(e),'cannot bypass rewound cooldown');}
const original=load(false,process.env.ORB_BASELINE_DIR||null);
for(const mode of ['1v1','arcana','2v2']){
  function duel(N){const e=mode==='2v2'?new N.TeamEngine(['ranger','normal','ranger','reflector'],'manual-regression','open'):new N.Engine(['ranger','normal'],'manual-regression',{mode});e.start();for(let i=0;i<4000&&e.state==='running';i++)e.step();return JSON.stringify(e.snapshot());}
  ok(duel(original)===duel(G),'unchanged automatic deterministic result '+mode);
}
console.log(JSON.stringify({passed:true,checks,baseline:process.env.ORB_BASELINE_DIR?'pre-change Git snapshot':'uncontrolled engine',note:'targeted fixtures; no balance batch'}));
