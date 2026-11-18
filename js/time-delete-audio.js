(function(root){
 'use strict';const G=root.OrbDuel;
 // One short temporal cut: rising intake, dry tick-fracture, then a restrained restart body.
 G.Audio.profiles.timeDelete={duration:.42,cooldown:.22,priority:6,attack:.003,cutoff:4200,
  layers:[['sine',170,740,.07,0,.065],['triangle',2360,680,.055,.038,.065],['sine',137,54,.13,.062,.19],['sine',1060,820,.024,.085,.23],['triangle',480,1120,.02,.11,.16]],
  noise:{gain:.065,attack:.018,decay:.065,cutoff:3700}};
 G.AudioMix.calibration.timeDelete={tier:'C',db:0,gain:1.562142};
})(typeof window!=='undefined'?window:globalThis);
