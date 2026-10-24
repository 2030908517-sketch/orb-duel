(function(root){
 'use strict';const G=root.OrbDuel;
 const p=G.Audio.profiles,c=G.AudioMix.calibration;
 for(let i=1;i<=7;i++){const f=[880,740,660,494,1046,220,146.83][i-1];p['seal'+i]={duration:i===7?.32:.50+i*.025,attack:.007,cooldown:.18,priority:i>=6?6:4,layers:[['sine',f,f*.99,.065,0,.40],['triangle',f*.5,f*.43,.035,0,.15+i*.018],['sine',f*2.01,f*2,.025,.025,.25]],noise:{gain:.035+i*.006,decay:.025+i*.005,cutoff:2300+i*170}};c['seal'+i]={tier:i===7?'S':i===6?'B':'C',db:i>=6?0:-3,gain:1};}
 Object.assign(p,{
  sealVertical:{duration:.48,cooldown:.18,priority:7,layers:[['triangle',1150,170,.085,0,.12],['sine',130,49,.20,.055,.22],['sine',880,660,.025,.1,.3]],noise:{gain:.20,attack:.015,decay:.055,cutoff:3400}},
  sealHorizontal:{duration:.38,cooldown:.18,priority:7,layers:[['triangle',1700,320,.09,0,.10],['sine',180,72,.15,.03,.18]],noise:{gain:.20,attack:.008,decay:.09,cutoff:5200}},
  sealCross:{duration:.7,cooldown:.18,priority:8,layers:[['sine',95,42,.23,0,.28],['triangle',330,165,.065,.02,.20],['sine',1318,988,.05,.025,.52]],noise:{gain:.22,attack:.006,decay:.06,cutoff:3900}},
  sealBreak:{duration:.4,cooldown:.2,priority:5,layers:[['triangle',1900,470,.065,0,.12],['sine',340,220,.035,.03,.22]],noise:{gain:.12,decay:.03,cutoff:5000}},
  sealRebound:{duration:.17,cooldown:.2,priority:3,layers:[['sine',530,260,.08,0,.12]],noise:{gain:.035,decay:.025,cutoff:3200}}
 });
 for(const name of ['Vertical','Horizontal','Cross']){const key='seal'+name,hit=key+'Hit';p[hit]=structuredClone(p[key]);c[hit]={tier:name==='Cross'?'S':'A',db:name==='Cross'?3:1.5,gain:1};p[key]={duration:.28,cooldown:.18,priority:5,layers:[['triangle',name==='Vertical'?1050:name==='Horizontal'?1600:740,280,.045,0,.16]],noise:{gain:.11,attack:.01,decay:.13,cutoff:name==='Horizontal'?5100:3700}};}
 Object.assign(c,{sealVertical:{tier:'B',db:0,gain:1},sealHorizontal:{tier:'B',db:0,gain:1},sealCross:{tier:'B',db:0,gain:1},sealBreak:{tier:'B',db:0,gain:1},sealRebound:{tier:'C',db:-3,gain:1}});

 for(const [key,gain]of Object.entries({"seal1": 2.375847, "seal2": 2.402973, "seal3": 2.387062, "seal4": 2.442209, "seal5": 2.253504, "seal6": 3.277747, "seal7": 3.371841, "sealVertical": 4.285693, "sealHorizontal": 3.773224, "sealCross": 3.845364, "sealBreak": 5.331248, "sealRebound": 6.02085, "sealVerticalHit": 1.248483, "sealHorizontalHit": 1.710258, "sealCrossHit": 1.909964}))c[key].gain=gain;
 // A short mix recess belongs to seal7, not the simulation clock. Other Arcana duck tails retain priority.
 const consume=G.Audio.prototype.consume;G.Audio.prototype.consume=function(events){const r=consume.call(this,events);if(events?.some(v=>v.kind==='seal7')&&this.context?.state==='running'){const now=this.context.currentTime,tail=Math.max(now+.17,this.arcanaDuckUntil||0);for(const key of ['ordinaryBus','cueBus','ambienceBus'])if(this[key]){const a=this[key].gain;a.cancelScheduledValues(now);a.setTargetAtTime(.18,now,.008);a.setTargetAtTime(Math.pow(10,(G.AudioMix.duckDb??-4)/20),now+.15,.025);a.setTargetAtTime(1,tail,.08);}}return r;};
})(typeof window!=='undefined'?window:globalThis);
