(function(root){
 'use strict';const G=root.OrbDuel;
 Object.assign(G.Audio.profiles,{
  demonSacrifice:{duration:.86,attack:.07,cooldown:.8,priority:5,cutoff:2300,layers:[['sine',68,112,.13,0,.72],['triangle',210,690,.045,.12,.56],['sine',330,180,.05,.38,.3]],noise:{gain:.07,attack:.18,decay:.5,cutoff:1600}},
  demonDescent:{duration:.72,cooldown:.7,priority:8,cutoff:3000,layers:[['sine',145,39,.24,0,.4],['triangle',480,125,.11,0,.2],['sine',76,52,.13,.18,.46]],noise:{gain:.23,decay:.075,cutoff:2700}},
  demonHellSwing:{duration:.23,cooldown:.22,priority:4,cutoff:3800,layers:[['triangle',650,190,.06,0,.13],['sine',180,90,.075,0,.2]],noise:{gain:.12,attack:.02,decay:.14,cutoff:3400}},
  demonHellHit:{duration:.26,cooldown:.18,priority:6,cutoff:2800,layers:[['sine',150,63,.18,0,.16],['triangle',930,320,.06,0,.08]],noise:{gain:.18,decay:.035,cutoff:2500}},
  demonHellGuard:{duration:.27,cooldown:.25,priority:6,cutoff:2400,layers:[['sine',210,94,.20,0,.18],['triangle',510,310,.065,0,.12],['sine',107,96,.08,.04,.2]],noise:{gain:.12,decay:.018,cutoff:1900}},
  demonHellCounter:{duration:.34,cooldown:.25,priority:7,cutoff:3400,layers:[['sine',185,48,.22,0,.2],['triangle',740,170,.09,.015,.15]],noise:{gain:.23,decay:.055,cutoff:3200}},
  demonHellFade:{duration:.52,attack:.035,cooldown:.5,priority:3,cutoff:2100,layers:[['sine',280,85,.10,0,.46],['triangle',530,170,.035,.07,.32]],noise:{gain:.09,attack:.06,decay:.36,cutoff:1800}}
 });
 Object.assign(G.AudioMix.calibration,{
  demonSacrifice:{tier:'C',db:-3,gain:0.687973},demonDescent:{tier:'A',db:3,gain:1.539451},demonHellSwing:{tier:'B',db:0,gain:3.079592},demonHellHit:{tier:'A',db:1.5,gain:3.455632},demonHellGuard:{tier:'A',db:1.5,gain:2.526141},demonHellCounter:{tier:'A',db:1.5,gain:2.154523},demonHellFade:{tier:'C',db:-3,gain:1.212853}
 });
})(typeof window!=='undefined'?window:globalThis);
