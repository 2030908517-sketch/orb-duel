(function(root){
  'use strict';const G=root.OrbDuel;
  const profiles={
    labFistWarn:{duration:.65,attack:.15,cooldown:.5,priority:6,cutoff:1100,layers:[['sine',62,83,.13],['triangle',130,170,.06]]},
    labFistBlink:{duration:.16,cooldown:.1,priority:7,noise:{gain:.19,decay:.035,cutoff:2600},layers:[['triangle',1250,250,.12],['sine',200,80,.12]]},
    labFistTension:{duration:.52,attack:.12,cooldown:.5,priority:6,cutoff:1400,layers:[['sine',55,115,.19],['triangle',165,345,.07],['sine',220,460,.045,.06,.42]]},
    labFistRelease:{duration:.17,cooldown:.1,priority:7,noise:{gain:.18,decay:.05,cutoff:1700},layers:[['triangle',720,120,.14]]},
    labFistHit:{duration:1.05,body:.055,cooldown:.25,priority:9,reverb:{seconds:.25,gain:.10},noise:{gain:.36,decay:.055,cutoff:2200},layers:[['sine',150,35,.42,0,.6],['triangle',560,95,.21,0,.26],['sine',68,32,.16,.025,.8]]},
    labSonicWarn:{duration:.8,attack:.12,cooldown:.5,priority:6,cutoff:1900,noise:{gain:.08,attack:.1,decay:.65,cutoff:1500},layers:[['triangle',105,750,.12],['sine',65,170,.15]]},
    labSonicRush:{duration:.3,cooldown:.1,priority:7,noise:{gain:.2,decay:.11,cutoff:2600},layers:[['triangle',350,1200,.12],['sine',170,65,.15]]},
    labSonicRelease:{duration:1.15,body:.08,cooldown:.4,priority:9,reverb:{seconds:.27,gain:.1},noise:{gain:.42,decay:.10,cutoff:2100},layers:[['sine',125,30,.4,0,.7],['triangle',800,95,.16,0,.22],['sine',60,32,.14,.045,.85]]},
    labSonicHit:{duration:.38,cooldown:.2,priority:8,noise:{gain:.18,decay:.04,cutoff:2600},layers:[['triangle',1200,180,.12],['sine',160,43,.22]]},
    labBloodWarn:{duration:1.05,attack:.006,cooldown:.5,priority:6,cutoff:1000,layers:[['sine',78,37,.24,0,.18],['sine',83,40,.20,.34,.18],['sine',89,43,.22,.68,.2],['triangle',137,170,.035,.15,.83]]},
    labBloodRelease:{duration:.38,attack:.025,cooldown:.35,priority:7,cutoff:1700,noise:{gain:.11,attack:.015,decay:.12,cutoff:1100},layers:[['sine',130,67,.18],['triangle',390,150,.065,0,.25]]},
    labBloodClose:{duration:.32,attack:.008,cooldown:.1,priority:7,noise:{gain:.28,attack:.005,decay:.075,cutoff:2200},layers:[['triangle',1100,190,.10,0,.14],['sine',210,75,.12,0,.24]]},
    labBloodHit:{duration:.62,body:.035,cooldown:.045,priority:9,cutoff:2500,reverb:{seconds:.17,gain:.075},noise:{gain:.29,decay:.032,cutoff:2100},layers:[['triangle',1150,180,.15,0,.13],['sine',155,38,.33,.006,.46],['sine',72,34,.09,.028,.55]]},
    labBloodBlock:{duration:.25,cooldown:.045,priority:9,cutoff:2300,noise:{gain:.15,decay:.025,cutoff:1800},layers:[['triangle',620,220,.13],['sine',240,90,.12]]},
    labBloodReturn:{duration:.58,attack:.055,cooldown:.08,priority:6,cutoff:1100,layers:[['sine',115,165,.08],['sine',172,247,.045,.035,.48]]}
  };
  // Only this lab's page context gains these keys. Existing profile objects stay unchanged.
  Object.assign(G.Audio.profiles,profiles);
  const map={arcFistCharge:'labFistWarn',arcBlink:'labFistBlink',arcFistRelease:'labFistRelease',arcFistHit:'labFistHit',arcSonicCharge:'labSonicWarn',arcSonicRush:'labSonicRush',arcSonicRelease:'labSonicRelease',arcSonicHit:'labSonicHit',arcBloodCharge:'labBloodWarn',arcBloodRelease:'labBloodRelease',arcBloodClose:'labBloodClose',arcBloodHit:'labBloodHit'};
  G.ArcanaLabAudio=Object.freeze({profiles,map,cue(event,original=false){if(event.kind==='heal')return original?null:'labBloodReturn';if(event.kind!=='cue')return null;if(!original&&event.cue==='arcBloodHit'&&event.blockedOnly)return 'labBloodBlock';return original?event.cue:map[event.cue]||event.cue;}});
})(typeof window!=='undefined'?window:globalThis);
