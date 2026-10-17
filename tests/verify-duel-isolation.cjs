const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ctx=vm.createContext({});for(const f of ['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','engine','audio','spectacle'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f+'.js'),'utf8'),ctx);
const G=ctx.OrbDuel,fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'duel-baseline.json'),'utf8'));
assert.equal(G.Constants.width,360);assert.equal(G.Constants.height,340);assert.equal(G.Team,undefined);
// Historical hashes only apply to roles whose mechanics have not been explicitly upgraded.
const changed=['ghost','normal','ranger','venom','reflector','trapper'];
const preserved=fixture.records.filter(r=>!r.types.some(t=>changed.includes(t)));
for(const r of preserved){const e=new G.Engine(r.types,r.seed);e.start();while(e.state==='running'&&e.time<(r.seconds??Infinity))e.step();assert.equal(crypto.createHash('sha256').update(JSON.stringify(e.snapshot())).digest('hex'),r.hash,r.types.join('/'));}
const report={passed:true,originalVersion:fixture.version,exactSnapshotComparisons:preserved.length,excludedChangedCases:fixture.records.length-preserved.length,excludedTypes:changed,exclusionReason:'Explicit character upgrades change these historical hashes; current behavior is checked by verify-tactics.cjs and the individual role suites.',dimensions:[360,340],teamAdaptersLoaded:false};fs.writeFileSync(path.join(__dirname,'duel-isolation-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
