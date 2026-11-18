(function(root){
 'use strict';const G=root.OrbDuel;
 const recipes={
  windGather:{duration:.3,cooldown:.25,priority:3,attack:.025,cutoff:2200,layers:[['sine',180,350,.04,0,.2],['triangle',620,980,.012,.08,.16]],noise:{gain:.09,attack:.12,decay:.16,cutoff:2600}},
  windFront:{duration:.4,cooldown:.3,priority:4,attack:.006,cutoff:3900,layers:[['sine',180,48,.15,0,.22],['triangle',780,220,.026,0,.17]],noise:{gain:.15,attack:.006,decay:.27,cutoff:3800}},
  windPressureHit:{duration:.24,cooldown:.14,priority:4,attack:.003,cutoff:2900,layers:[['sine',240,65,.16,0,.14],['triangle',630,220,.04,0,.065]],noise:{gain:.1,attack:.003,decay:.1,cutoff:4100}},
  windCutHit:{duration:.16,cooldown:.16,priority:3,attack:.002,cutoff:5200,layers:[['triangle',1850,520,.027,0,.075],['sine',300,120,.055,.012,.1]],noise:{gain:.08,attack:.002,decay:.07,cutoff:5200}},
  windTwins:{duration:.6,cooldown:.8,priority:4,attack:.03,cutoff:2800,layers:[['sine',320,150,.07,0,.26],['triangle',430,850,.025,.13,.27],['sine',200,90,.07,.25,.25]],noise:{gain:.12,attack:.09,decay:.4,cutoff:2900}},
  windStormGather:{duration:.8,cooldown:1,priority:5,attack:.04,cutoff:1700,layers:[['sine',58,160,.13,0,.65],['triangle',160,500,.025,.12,.55]],noise:{gain:.14,attack:.35,decay:.4,cutoff:2200}},
  windStormDrop:{duration:.9,cooldown:.7,priority:6,attack:.008,cutoff:2600,layers:[['sine',120,38,.2,0,.6],['triangle',640,190,.04,.02,.6],['sine',210,75,.06,.12,.6]],noise:{gain:.19,attack:.03,decay:.75,cutoff:3300}},
  windStormFlow:{duration:.8,cooldown:.7,priority:3,attack:.12,cutoff:2200,layers:[['sine',140,95,.06,0,.7],['triangle',620,260,.014,.05,.6]],noise:{gain:.12,attack:.15,decay:.55,cutoff:2400}},
  windStormCollapse:{duration:.24,cooldown:.5,priority:5,attack:.02,cutoff:1500,layers:[['sine',90,380,.1,0,.19],['triangle',390,1300,.022,0,.16]],noise:{gain:.09,attack:.08,decay:.08,cutoff:1800}},
  windStormBurst:{duration:.75,cooldown:1,priority:7,attack:.003,cutoff:4100,layers:[['sine',185,35,.22,0,.45],['triangle',920,90,.04,0,.24],['sine',65,38,.1,.06,.6]],noise:{gain:.22,attack:.003,decay:.6,cutoff:4600}},
  windFinalHit:{duration:.33,cooldown:.22,priority:6,attack:.002,cutoff:3400,layers:[['sine',210,44,.17,0,.24],['triangle',530,170,.035,0,.12]],noise:{gain:.12,attack:.002,decay:.19,cutoff:3600}}
 };
 Object.assign(G.Audio.profiles,recipes);
 const specs={windGather:['D',-12],windFront:['C',0],windPressureHit:['B',0],windCutHit:['R',-8],windTwins:['C',-1],windStormGather:['C',-3],windStormDrop:['A',2],windStormFlow:['D',-12],windStormCollapse:['C',-3],windStormBurst:['S',4.5],windFinalHit:['B',0]};
 const gains={"windGather": 1.510936, "windFront": 1.920054, "windPressureHit": 3.479399, "windCutHit": 2.106434, "windTwins": 1.71867, "windStormGather": 0.82188, "windStormDrop": 1.161131, "windStormFlow": 0.420085, "windStormCollapse": 2.18933, "windStormBurst": 1.281315, "windFinalHit": 2.258922};
 for(const [key,[tier,db]]of Object.entries(specs))G.AudioMix.calibration[key]={tier,db,gain:gains[key]||1};
 const consume=G.Audio.prototype.consume;G.Audio.prototype.consume=function(events){const ctx=this.context;if(this.enabled&&ctx?.state==='running'&&events.some(v=>v.kind==='windStormCollapse')&&!(this.arcanaDuckUntil>ctx.currentTime)){const now=ctx.currentTime;for(const key of ['ordinaryBus','ambienceBus']){const g=this[key]?.gain;if(!g)continue;g.cancelScheduledValues(now);g.setValueAtTime(1,now);g.linearRampToValueAtTime(.32,now+.025);g.setValueAtTime(.32,now+.16);g.linearRampToValueAtTime(1,now+.24);}}return consume.call(this,events);};
})(typeof window!=='undefined'?window:globalThis);
