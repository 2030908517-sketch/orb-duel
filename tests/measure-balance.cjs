const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const source=path.resolve(process.argv[4]||path.join(__dirname,'..')),files=['config','physics','skills','world','characters','awakening','engine'];
for(const name of files)require(path.join(source,'js/'+name+'.js'));
const G=globalThis.OrbDuel,types=Object.keys(G.Types),seeds=Number(process.argv[2]||40),prefix=process.argv[3]||'holdout',results={},start=Date.now(),refunds=Object.fromEntries(types.map(t=>[t,0]));let matches=0,minTime=Infinity,maxTime=0;
for(const a of types)for(const b of types){
 const row=results[a+'/'+b]={left:0,right:0,draw:0,totalTime:0};
 for(let i=0;i<seeds;i++){
  const e=new G.Engine([a,b],prefix+'-'+i);for(const method of ['sound','impact','burst','ring','float','log','updateEffects'])e[method]=()=>{};
  e.start();while(e.state==='running'&&e.time<210)e.step();if(e.state!=='ended')throw Error('nontermination '+a+'/'+b);
  row[e.winner==='draw'?'draw':e.winner===0?'left':'right']++;row.totalTime+=e.time;for(const ball of e.balls)refunds[ball.type]+=ball.stats.cdReturned||0;
  minTime=Math.min(minTime,e.time);maxTime=Math.max(maxTime,e.time);matches++;
 }
}
const aggregate={};for(const a of types){let wins=0,draws=0,n=0;const opponents={};for(const b of types)if(a!==b){const ab=results[a+'/'+b],ba=results[b+'/'+a],w=ab.left+ba.right,d=ab.draw+ba.draw;wins+=w;draws+=d;n+=2*seeds;opponents[b]=+(100*(w+d*.5)/(2*seeds)).toFixed(1);}aggregate[a]={score:+(100*(wins+draws*.5)/n).toFixed(1),wins,draws,matches:n,opponents};}
const ruleHash=crypto.createHash('sha256');for(const name of files)ruleHash.update(name).update(fs.readFileSync(path.join(source,'js/'+name+'.js')));
const report={rulesVersion:'decay-dash-v1',rulesSha256:ruleHash.digest('hex'),configSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(source,'js/config.js'))).digest('hex'),seedPrefix:prefix,seeds,matches,minTime,maxTime,elapsedSeconds:(Date.now()-start)/1000,aggregate,results,refunds};
fs.writeFileSync(process.argv[5]||path.join(__dirname,'balance-'+prefix+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({matches,minTime,maxTime,aggregate:Object.fromEntries(types.map(t=>[t,aggregate[t].score]))},null,2));
