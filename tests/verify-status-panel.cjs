const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),root=path.resolve(__dirname,'..');const files=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'verify-laser-blade.cjs'),'utf8').match(/const files=(\[[^;]*\]);/)[1]);for(const f of [...files,'renderer','arena-walls','time-rewind','arcana-venom','accelerator-overdrive','arcana-priority','status-panel'])require(path.join(root,'js',f+'.js'));const G=OrbDuel,P=G.StatusPanel;let checks=0;const ok=(v,m)=>{checks++;assert.ok(v,m)};function fixture(type='normal'){const e=new G.Engine([type,'venom'],'status',{mode:'arcana'});e.start();e.time=1;const[b,t]=e.balls;return{e,b,t}}function has(f,text){return P.collect(f.b,f.e).some(s=>s.includes(text))}
{const f=fixture(),{e,b,t}=f;e.chargeWorld.conductive=[{owner:t.id,target:b.id,until:2}];ok(has(f,'导电'),'conductive shown');e.time=2;ok(!has(f,'导电'),'expired conductive hidden');e.time=1;t.hp=0;ok(!has(f,'导电'),'dead source hidden');}
{const f=fixture(),{e,b,t}=f;e.cosmicWorld.marks=[{owner:t.id,target:b.id,until:3,stacks:2}];e.demonWorld={marks:[{owner:t.id,target:b.id,until:3}],chains:[{owner:t.id,target:b.id,until:3}],claws:[],casts:[],queued:[]};e.chargeWorld.conductive=[{owner:t.id,target:b.id,until:3}];b.role.bloodMark={until:3};b.bladeMark={until:3};b.magneticMark={until:3,cause:'pull'};b.stagger={until:3};for(const s of ['电解印记 2','地狱烙印','魂锁','导电','血印','刃印','磁牵引','失衡'])ok(has(f,s),s+' present simultaneously');e.time=3;for(const s of ['电解印记','地狱烙印','魂锁','导电','血印','刃印','磁牵引','失衡'])ok(!has(f,s),s+' expires');}
{const f=fixture(),{e,b,t}=f;for(const[type,time]of [['erosion',0],['erosion',1.1],['paralysis',2.2],['paralysis',3.3]]){e.time=time;G.Venom.apply(t,b,e,type);}for(const s of ['侵蚀中毒','麻痹中毒','麻痹减速 8%','普通碰撞削弱 16%','瞄准转速降低 28%'])ok(has(f,s),s);ok(!P.collect(b,e).some(s=>s.includes('/3')),'no legacy poison capacity');}
{const f=fixture('ranger'),{b,e}=f;b.arcana.phase='counterCharge';G.Venom.add(f.t,b,e,'paralysis');G.Venom.sync(b,e);ok(has(f,'霸体'));ok(!has(f,'麻痹减速'));ok(!has(f,'瞄准转速降低'));}
{const f=fixture('shield'),{b,e}=f;b.shield=10;b.shieldUntil=5;Object.assign(b.arcana,{royalActive:true,royalShield:20,royalUntil:5});ok(has(f,'护盾 10'));ok(has(f,'王城专属盾 20'));e.traps=[{captureTarget:b.id,captureUntil:4}];b.cageBounds={left:0,right:100,top:0,bottom:100};ok(has(f,'陷阱牵制'));ok(has(f,'机械囚禁'));}
{const f=fixture('boomerang');f.b.character.catchUntil=4;ok(has(f,'接刃重击'));f.e.time=4;ok(!has(f,'接刃重击'));}
{const f=fixture('reflector');f.b.stance.phase='active';f.b.stance.until=4;f.b.role.predictiveActive=true;ok(has(f,'预判反伤'));f.b.role.counterRelease=10;ok(has(f,'蓄能反击'));}
{const f=fixture('venom');G.Combat.applyDamage(f.b,f.b.hp*.8,f.e);ok(has(f,'万毒缓蚀'));ok(has(f,'伤害池'));}
for(const[type,setup,names]of [
 ['normal',b=>{b.charges=3;b.pressure.bonus=.2;b.role.pursuitUntil=4},['重击就绪','攻击蓄力','回身追击']],
 ['vampire',b=>{b.awakening.chainActive=true;b.awakening.chainUntil=4},['血契汲取']],
 ['ranger',b=>{b.role.calibration=2;b.role.calibrationUntil=4;b.role.sniperPhase='locked';b.role.sniperHurt=true},['校准 2','狙击锁定','狙击受创偏移']],
 ['laser',b=>{b.role.bladePhase='sweep';b.role.coolingUntil=4;b.role.disruptedUntil=3},['高温刃','主炮散热','电容防连震']],
 ['magnet',b=>{b.magnetic.anchored=true;b.magnetic.pullBonus=.2;b.magnetic.phase='warning'},['磁力锚定','吸引动能强化','磁力蓄势']],
 ['ghost',b=>{b.ghost.phase='phased';b.ghost.until=4;b.ghost.lungeUntil=3},['虚化无敌','幽魂突进']],
 ['charge',b=>{b.charge.phase='flow';b.charge.until=4},['电流化']],
 ['orbital',b=>{b.stellar.phase='core'},['恒星核心']],
 ['holy',b=>{b.holy.chargeUntil=4},['圣裁蓄势']],
 ['accelerator',b=>{b.awakening.chargeUntil=4},['冲刺蓄势']]
]){const f=fixture(type);setup(f.b);for(const name of names)ok(has(f,name),type+' '+name);}
{const f=fixture('reflector');f.b.arcana.predictUntil=4;ok(has(f,'奥义预测反伤资格'));f.e.time=4;ok(!has(f,'奥义预测反伤资格'));}
{const f=fixture('ranger');f.b.role.calibration=3;f.b.role.calibrationUntil=.5;ok(!has(f,'校准'),'expired calibration not shown');}
for(const type of Object.keys(G.Types)){const f=fixture(type);f.b.awakening.active=true;const before=JSON.stringify(f.e.snapshot());const items=P.collect(f.b,f.e);ok(Array.isArray(items),type+' inventory available');ok(before===JSON.stringify(f.e.snapshot()),type+' collection never mutates battle');f.b.hp=0;ok(P.collect(f.b,f.e).join('')==='停止行动',type+' retired state does not show stale buffs');}
console.log(JSON.stringify({passed:true,checks,roles:Object.keys(G.Types).length,note:'Real state visibility, expiry, source death, simultaneous marks, armor and read-only collection'}));
