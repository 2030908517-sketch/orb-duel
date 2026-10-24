(function(root){
 'use strict';const G=root.OrbDuel;
 Object.assign(G.Audio.profiles,{
  angelLanceCharge:{duration:.84,attack:.14,cooldown:.5,priority:3,layers:[['sine',220,660,.06,0,.75],['triangle',440,990,.025,.20,.56]],noise:{gain:.035,attack:.25,decay:.42,cutoff:3000}},
  angelLanceRelease:{duration:.32,cooldown:.25,priority:5,layers:[['triangle',1250,280,.08,0,.17],['sine',180,85,.11,.01,.2]],noise:{gain:.19,attack:.008,decay:.16,cutoff:5000}},
  angelLanceHit:{duration:.48,cooldown:.2,priority:6,layers:[['sine',150,55,.21,0,.21],['triangle',1600,520,.07,0,.09],['sine',1175,880,.04,.06,.36]],noise:{gain:.18,decay:.028,cutoff:3800}},
  angelSwordReady:{duration:.28,attack:.025,cooldown:.3,priority:3,layers:[['sine',440,620,.05,0,.25],['triangle',220,330,.025,.05,.2]],noise:{gain:.025,attack:.08,decay:.15,cutoff:2600}},
  angelSpearReady:{duration:.32,attack:.04,cooldown:.3,priority:3,layers:[['sine',660,990,.05,0,.27],['triangle',330,490,.02,.03,.22]],noise:{gain:.02,attack:.1,decay:.15,cutoff:3800}},
  angelSwordSwing:{duration:.25,cooldown:.2,priority:4,layers:[['triangle',760,300,.045,0,.15],['sine',320,170,.04,0,.18]],noise:{gain:.12,attack:.025,decay:.17,cutoff:4300}},
  angelSpearThrust:{duration:.19,cooldown:.2,priority:4,layers:[['triangle',1180,470,.04,0,.1],['sine',240,160,.04,.025,.1]],noise:{gain:.1,attack:.008,decay:.095,cutoff:5200}},
  angelSwordHit:{duration:.38,cooldown:.2,priority:6,layers:[['sine',180,82,.16,0,.16],['triangle',850,430,.055,0,.1],['sine',1320,880,.025,.06,.25]],noise:{gain:.14,decay:.035,cutoff:3200}},
  angelSpearHit:{duration:.32,cooldown:.2,priority:6,layers:[['sine',240,96,.14,0,.13],['triangle',1450,640,.055,0,.07],['sine',990,740,.03,.04,.22]],noise:{gain:.12,decay:.018,cutoff:4600}},
  angelGuard:{duration:.60,attack:.02,cooldown:.5,priority:6,layers:[['sine',165,110,.13,0,.30],['triangle',330,660,.06,.04,.35],['sine',880,660,.04,.12,.4]],noise:{gain:.12,attack:.08,decay:.3,cutoff:2600}},
  angelPurify:{duration:.14,cooldown:.18,priority:2,layers:[['sine',1330,730,.05,0,.1]],noise:{gain:.035,decay:.04,cutoff:4200}},
  angelExpel:{duration:.30,cooldown:.2,priority:5,layers:[['sine',230,100,.14,0,.17],['triangle',580,280,.05,0,.11]],noise:{gain:.11,decay:.06,cutoff:2900}}
 });
 Object.assign(G.AudioMix.calibration,{
  angelLanceCharge:{tier:'C',db:-3,gain:1.338759},angelLanceRelease:{tier:'B',db:0,gain:1.88213},angelLanceHit:{tier:'A',db:1.5,gain:2.621999},
  angelSwordReady:{tier:'C',db:-3,gain:3.210653},angelSpearReady:{tier:'C',db:-3,gain:2.471406},angelSwordSwing:{tier:'B',db:0,gain:3.127184},angelSpearThrust:{tier:'B',db:0,gain:4.389455},angelSwordHit:{tier:'A',db:1.5,gain:3.956594},angelSpearHit:{tier:'A',db:1.5,gain:5.017247},angelGuard:{tier:'A',db:1.5,gain:1.990807},angelPurify:{tier:'R',db:-13.5,gain:2.708057},angelExpel:{tier:'B',db:0,gain:3.384506}
 });
})(typeof window!=='undefined'?window:globalThis);
