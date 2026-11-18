(function(root){
 'use strict';const G=root.OrbDuel,p=G.Audio.profiles,c=G.AudioMix.calibration;
 Object.assign(p,{
  shieldResonance:{duration:.56,cooldown:.2,priority:7,layers:[['sine',156,38,.18,0,.33],['triangle',920,180,.06,.008,.12],['sine',330,94,.045,.04,.27]],noise:{gain:.15,attack:.004,decay:.11,cutoff:2600}},
  royalResonance:{duration:.69,cooldown:.16,priority:8,layers:[['sine',112,31,.23,0,.40],['triangle',660,165,.075,.015,.22],['sine',1320,880,.035,.025,.46]],noise:{gain:.19,attack:.005,decay:.13,cutoff:3100}},
  royalRingRebound:{duration:.36,cooldown:.12,priority:6,layers:[['triangle',810,240,.07,0,.14],['sine',155,62,.12,.015,.24],['sine',1110,620,.025,.035,.18]],noise:{gain:.10,decay:.055,cutoff:3500}},
  shieldRingImpact:{duration:.27,cooldown:.13,priority:6,layers:[['sine',178,49,.16,0,.19],['triangle',740,290,.07,0,.10]],noise:{gain:.12,decay:.045,cutoff:2800}}
 });
 for(const [key,tier,db,gain]of [['shieldResonance','A',1.5,1.869807],['royalResonance','S',4.5,1.892726],['royalRingRebound','A',1.5,2.585449],['shieldRingImpact','A',1.5,3.498923]])c[key]={tier,db,gain};
})(typeof window!=='undefined'?window:globalThis);
