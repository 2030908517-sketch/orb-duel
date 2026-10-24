(function (root) {
  'use strict';
  const G = root.OrbDuel;
  // Local synth cues. No audio assets, network or combat RNG.
  const profiles = {
    arcVenomOpen:{duration:.64,cooldown:1,priority:9,cutoff:2400,layers:[['sine',120,45,.12,0,.09],['sine',94,35,.31,.24,.18],['sine',65,31,.19,.325,.16],['triangle',480,175,.12,.24,.14],['sine',310,155,.07,.24,.12]]},
    arcVenomBeat:{duration:.23,cooldown:.12,priority:5,cutoff:2400,layers:[['sine',88,36,.20,0,.12],['sine',63,30,.12,.085,.12],['triangle',430,175,.11,0,.095],['triangle',310,140,.065,.085,.10]]},
    chainTick:{duration:.09,cooldown:.25,priority:2,cutoff:2200,layers:[['triangle',340,170,.045,0,.065],['sine',180,100,.025,0,.08]]},
    periodicTick:{duration:.075,cooldown:.22,priority:1,cutoff:2400,layers:[['triangle',600,280,.035,0,.06]]},
    domainRewind:{duration:.35,cooldown:.15,priority:6,layers:[['sine',380,980,.09],['triangle',750,1700,.035]]},
    arcTimeFreeze:{duration:.85,cooldown:.5,priority:10,layers:[['sine',110,46,.24],['sine',220,92,.10],['triangle',660,220,.035]],noise:{gain:.07,decay:.25,cutoff:900}},
    arcTimeReverse:{duration:1.8,attack:.15,cooldown:.5,priority:10,layers:[['sine',95,340,.15],['triangle',330,1600,.045]],noise:{gain:.06,attack:.25,decay:1.2,cutoff:1800}},
    arcTimeRestart:{duration:.9,cooldown:.5,priority:10,layers:[['sine',160,110,.24],['sine',320,220,.13],['sine',480,330,.06]],noise:{gain:.10,decay:.025,cutoff:3000}},
    heatBladeForm:{duration:.14,cooldown:.2,priority:5,layers:[['triangle',420,1050,.055],['sine',110,160,.08]]},
    heatBladeSwing:{duration:.25,cooldown:.2,priority:6,noise:{gain:.12,decay:.08,cutoff:4200},layers:[['triangle',1400,380,.05],['sine',170,80,.1]]},
    heatBladeCut:{duration:.13,cooldown:.035,priority:5,noise:{gain:.09,decay:.025,cutoff:3800},layers:[['triangle',1800,650,.04]]},
    heatBladeHit:{duration:.23,cooldown:.1,priority:7,noise:{gain:.13,decay:.035,cutoff:2900},layers:[['sine',180,65,.14],['triangle',1150,300,.055]]},
    arcSolarOpen:{duration:.8,attack:.04,cooldown:.5,priority:8,noise:{gain:.08,attack:.15,decay:.6,cutoff:1600},layers:[['sine',70,145,.13],['triangle',300,720,.045,.12,.6]]},
    arcSolarLock:{duration:.6,cooldown:.5,priority:9,noise:{gain:.15,decay:.02,cutoff:2600},layers:[['sine',130,40,.2,0,.25],['triangle',880,260,.07,0,.08],['sine',210,1000,.07,.08,.48]]},
    arcSolarSwing:{duration:.48,cooldown:.5,priority:9,noise:{gain:.22,decay:.07,cutoff:3800},layers:[['sine',210,38,.23,0,.35],['triangle',1500,220,.07,0,.2]]},
    arcSolarShatter:{duration:.95,attack:.015,cooldown:.5,priority:8,noise:{gain:.11,decay:.2,cutoff:4400},layers:[['triangle',1800,540,.065,0,.23],['sine',1200,230,.06,.18,.6],['sine',125,62,.1,.62,.25]]},
    mechanismSwap:{duration:.35,cooldown:.2,priority:5,cutoff:2800,noise:{gain:.12,decay:.025,cutoff:2600},layers:[['triangle',1600,700,.11,0,.07],['sine',230,95,.19,.025,.18],['triangle',1200,650,.07,.11,.09]]},
    arcTrapperSubstitute:{duration:.55,cooldown:.4,priority:8,cutoff:2600,noise:{gain:.22,decay:.07,cutoff:2400},layers:[['triangle',1700,240,.17,0,.11],['sine',190,45,.27,.008,.4]]},
    arcCageOpen:{duration:.48,attack:.012,cooldown:.4,priority:7,noise:{gain:.19,decay:.18,cutoff:2100},layers:[['triangle',410,125,.10],['sine',120,60,.20]]},
    arcCageLock:{duration:.2,cooldown:.05,priority:7,cutoff:2600,noise:{gain:.15,decay:.012,cutoff:2400},layers:[['triangle',1650,680,.12,0,.045],['sine',155,80,.18]]},
    arcCageTick:{duration:.22,cooldown:.45,priority:7,layers:[['triangle',880,730,.14,0,.075],['sine',160,110,.12,.03,.16]]},
    arcHubDeploy:{duration:.4,cooldown:.3,priority:7,noise:{gain:.12,attack:.015,decay:.13,cutoff:1700},layers:[['triangle',520,230,.12],['sine',180,70,.20]]},
    arcHubOnline:{duration:.45,attack:.025,cooldown:.5,priority:7,layers:[['sine',220,330,.16],['triangle',660,990,.07,.08,.22]]},
    arcCageBlast:{duration:1.05,body:.04,cooldown:.4,priority:9,cutoff:2800,reverb:{seconds:.32,gain:.12},noise:{gain:.32,decay:.12,cutoff:2400},layers:[['triangle',1550,110,.18,0,.12],['sine',160,29,.38,.006,.65],['sine',64,32,.14,.09,.83],['triangle',480,130,.08,.14,.5]]},
    arcCageHit:{duration:.48,cooldown:.3,priority:9,noise:{gain:.16,decay:.035,cutoff:2300},layers:[['sine',140,37,.25],['triangle',1200,240,.1,0,.1]]},
    huntPrepare:{duration:.25,attack:.025,cooldown:.3,priority:3,cutoff:1100,layers:[['sine',95,50,.15,0,.16],['triangle',180,310,.055,.05,.18]]},
    huntLaunch:{duration:.58,attack:.025,cooldown:.5,priority:4,cutoff:2400,noise:{gain:.15,attack:.02,decay:.28,cutoff:1800},layers:[['triangle',540,170,.07,0,.15],['triangle',430,150,.05,.09,.16],['sine',120,70,.12]]},
    huntMark:{duration:.38,cooldown:.3,priority:4,cutoff:2000,noise:{gain:.16,decay:.045,cutoff:1700},layers:[['triangle',950,170,.12,0,.09],['sine',175,48,.26,0,.28],['sine',90,50,.07,.07,.3]]},
    huntReform:{duration:.24,attack:.025,cooldown:.3,priority:2,cutoff:1300,noise:{gain:.06,decay:.1,cutoff:1000},layers:[['triangle',340,130,.06],['sine',130,70,.10]]},
    arcFistTension:{duration:.6,attack:.12,cooldown:.4,priority:8,cutoff:1200,layers:[['sine',58,112,.17],['triangle',150,310,.075],['sine',225,440,.04,.05,.5]]},
    arcOrbit:{duration:1.32,attack:.08,cooldown:1,priority:8,cutoff:2500,noise:{gain:.18,attack:.05,decay:1.1,cutoff:2100},layers:[['triangle',180,710,.085,0,.45],['triangle',270,1080,.09,.38,.43],['triangle',380,1550,.10,.76,.46],['sine',64,130,.16,0,1.3]]},

    // Arcana voices have their own anticipation/body/tail, above ordinary skill priority.
    arcFistCharge:{duration:.8,attack:.44,cooldown:.5,priority:7,cutoff:1600,noise:{gain:.15,attack:.32,decay:.8,cutoff:1200},layers:[['sine',48,145,.22],['triangle',100,600,.12],['sine',240,960,.055,.06,.68]]},
    arcBlink:{duration:.62,cooldown:.3,priority:8,cutoff:2800,reverb:{seconds:.22,gain:.12},noise:{gain:.24,decay:.055,cutoff:2400},layers:[['triangle',1800,140,.19,0,.12],['sine',280,65,.22,0,.2],['sine',70,100,.06,.18,.4]]},
    arcFistRelease:{duration:.4,cooldown:.3,priority:8,noise:{gain:.28,decay:.065,cutoff:1800},layers:[['triangle',700,100,.20,0,.12],['sine',210,65,.25,0,.28]]},
    arcFistHit:{duration:1.5,body:.12,cooldown:.45,priority:9,cutoff:2800,reverb:{seconds:.58,gain:.20},noise:{gain:.35,decay:.12,cutoff:2400},layers:[['triangle',1600,120,.22,0,.09],['sine',185,32,.42,.008,.85],['triangle',360,65,.22,.018,.42],['sine',61,32,.20,.06,1.3],['sine',240,95,.08,.11,.95]]},
    arcSonicCharge:{duration:.8,attack:.5,cooldown:.5,priority:7,noise:{gain:.18,attack:.35,decay:.9,cutoff:2000},layers:[['sine',55,180,.20],['sawtooth',95,700,.09],['triangle',380,1600,.08,.04,.72]]},
    arcSonicRush:{duration:.5,attack:.018,cooldown:.3,priority:8,cutoff:3200,noise:{gain:.29,decay:.23,cutoff:2700},layers:[['triangle',400,2100,.14],['sine',180,55,.22],['sawtooth',240,80,.08,0,.28]]},
    arcSonicRelease:{duration:1.6,body:.18,cooldown:.45,priority:9,cutoff:2600,reverb:{seconds:.55,gain:.18},noise:{gain:.4,decay:.22,cutoff:2100},layers:[['triangle',1100,95,.20,0,.14],['sine',145,28,.38,.006,.95],['sine',72,31,.20,.09,1.25],['triangle',320,80,.16,.075,.65],['sine',230,70,.10,.22,1.1]]},
    arcSonicHit:{duration:.95,cooldown:.22,priority:9,reverb:{seconds:.35,gain:.12},noise:{gain:.27,decay:.075,cutoff:2400},layers:[['sine',180,36,.34],['triangle',1400,160,.17,0,.14],['sine',75,32,.12,.045,.8]]},
    arcBloodCharge:{duration:1.05,attack:.045,cooldown:.6,priority:7,cutoff:1500,reverb:{seconds:.4,gain:.14},noise:{gain:.10,attack:.2,decay:.85,cutoff:750},layers:[['sine',90,38,.29,0,.24],['sine',95,42,.26,.3,.26],['triangle',155,220,.11,.12,.86],['sine',233,330,.09,.18,.8],['sine',310,440,.06,.24,.75]]},
    arcBloodRelease:{duration:1.05,body:.2,attack:.06,cooldown:.45,priority:8,cutoff:2100,reverb:{seconds:.45,gain:.20},noise:{gain:.18,attack:.05,decay:.3,cutoff:1700},layers:[['sine',100,42,.27],['triangle',185,145,.16],['sine',278,220,.12,.04,.95],['sine',370,290,.08,.08,.9]]},
    arcBloodClose:{duration:.6,attack:.07,cooldown:.5,priority:8,cutoff:2300,noise:{gain:.23,attack:.045,decay:.2,cutoff:1900},layers:[['triangle',1100,220,.14],['sine',230,65,.23],['sine',460,130,.10,.02,.54]]},
    arcBloodHit:{duration:1.1,body:.12,cooldown:.24,priority:9,cutoff:2300,reverb:{seconds:.46,gain:.18},noise:{gain:.29,decay:.11,cutoff:1700},layers:[['sine',165,35,.36],['triangle',1100,120,.19,0,.14],['sine',80,37,.13,.07,.95],['sine',290,145,.11,.13,.9]]},
    chargeSpark:{duration:.1,cooldown:.24,priority:2,noise:{gain:.12,decay:.016,cutoff:3400},layers:[['triangle',1300,460,.09]]},
    chargeRelease:{duration:.3,attack:.012,cooldown:.35,priority:3,noise:{gain:.11,decay:.1,cutoff:2800},layers:[['sawtooth',180,650,.06],['sine',120,70,.17]]},
    chargeArc:{duration:.19,cooldown:.2,priority:4,noise:{gain:.16,decay:.025,cutoff:3000},layers:[['triangle',1400,220,.09],['sine',150,55,.22]]},
    chargeGround:{duration:.34,cooldown:.25,priority:5,noise:{gain:.20,decay:.035,cutoff:2000},layers:[['sine',140,38,.3],['triangle',920,130,.14]]},
    chargeTransform:{duration:.5,attack:.025,cooldown:.7,priority:4,noise:{gain:.13,decay:.32,cutoff:2600},layers:[['sawtooth',110,900,.055],['sine',75,150,.18],['triangle',450,1500,.09,.05]]},
    chargeReform:{duration:.34,cooldown:.5,priority:4,noise:{gain:.10,decay:.03,cutoff:2400},layers:[['triangle',1250,380,.12],['sine',180,65,.24],['sine',540,270,.06,.03]]},
    starPrepare:{duration:.22,attack:.015,cooldown:.25,priority:2,layers:[['sine',360,540,.1],['sine',720,1080,.06]]},
    cometLaunch:{duration:.23,cooldown:.12,priority:3,noise:{gain:.10,decay:.07,cutoff:1800},layers:[['triangle',1000,300,.1],['sine',240,100,.15]]},
    cometBounce:{duration:.14,cooldown:.12,priority:3,noise:{gain:.07,decay:.02,cutoff:2400},layers:[['sine',480,220,.12]]},
    cometImpact:{duration:.29,cooldown:.17,priority:5,noise:{gain:.15,decay:.035,cutoff:1900},layers:[['sine',170,45,.27],['triangle',980,250,.11],['sine',720,480,.045,.04]]},
    starResonate:{duration:.36,attack:.025,cooldown:.4,priority:3,layers:[['sine',220,330,.15],['sine',440,660,.10,.045],['sine',660,990,.06,.09]]},
    starResonance:{duration:.43,cooldown:.3,priority:5,noise:{gain:.13,decay:.06,cutoff:1700},layers:[['sine',140,36,.29],['triangle',880,220,.1],['sine',440,330,.07,.08]]},
    starCollapse:{duration:.95,attack:.08,cooldown:1,priority:4,noise:{gain:.065,attack:.07,decay:.7,cutoff:1000},layers:[['sine',70,150,.19],['triangle',170,540,.06],['sine',280,840,.055,.05]]},
    starCompression:{duration:.2,attack:.035,cooldown:.3,priority:4,layers:[['sine',130,260,.2],['triangle',520,1040,.075]]},
    starNova:{duration:.85,cooldown:.7,priority:5,reverb:{seconds:.24,gain:.09},noise:{gain:.23,decay:.09,cutoff:1700},layers:[['sine',130,29,.32],['triangle',650,95,.12,0,.28],['sine',55,35,.15,.03,.65],['sine',440,220,.055,.14,.55]]},
    starNovaHit:{duration:.36,cooldown:.2,priority:5,noise:{gain:.16,decay:.04,cutoff:2200},layers:[['sine',155,38,.29],['triangle',850,190,.1]]},
    starRebirth:{duration:.48,attack:.012,cooldown:.6,priority:4,noise:{gain:.09,decay:.08,cutoff:1900},layers:[['sine',330,660,.13],['sine',495,990,.08,.04],['sine',660,1320,.06,.08]]},
    starReturn:{duration:.14,cooldown:.25,priority:1,layers:[['sine',720,1080,.065],['sine',1080,1620,.035]]},
    starGuard:{duration:.24,cooldown:.25,priority:5,noise:{gain:.15,decay:.025,cutoff:2300},layers:[['triangle',1300,350,.15],['sine',200,70,.25]]},stormReady:{duration:.2,cooldown:.6,priority:2,layers:[['sine',520,760,.13],['sine',1040,1520,.07,.03]]},
    stormWarn:{duration:.42,attack:.06,cooldown:.4,priority:4,noise:{gain:.05,decay:.3,cutoff:1800},layers:[['triangle',130,480,.13],['sine',65,120,.1]]},
    stormGather:{duration:.6,attack:.06,cooldown:.7,priority:4,noise:{gain:.08,decay:.45,cutoff:2200},layers:[['triangle',110,580,.15],['sine',55,130,.13]]},
    stormCrash:{duration:.45,cooldown:.26,priority:5,noise:{gain:.21,decay:.035,cutoff:2600},layers:[['sine',110,33,.30],['triangle',780,110,.13,0,.11],['sine',55,30,.07,.04,.35]]},
    stormHit:{duration:.23,cooldown:.18,priority:5,noise:{gain:.14,decay:.025,cutoff:2100},layers:[['sine',130,45,.28],['triangle',980,240,.09]]},
    starOrbit:{duration:.32,attack:.015,cooldown:.4,priority:2,layers:[['sine',620,820,.13],['sine',930,1230,.07,.06]]},
    starLaunch:{duration:.16,cooldown:.13,priority:3,noise:{gain:.07,decay:.045,cutoff:1700},layers:[['triangle',920,360,.15],['sine',210,110,.13]]},
    starGather:{duration:.55,attack:.09,cooldown:.6,priority:4,layers:[['sine',130,260,.18],['sine',390,780,.10,.04],['triangle',780,1560,.055,.1]]},
    starCross:{duration:.34,cooldown:.4,priority:5,noise:{gain:.09,decay:.07,cutoff:1500},layers:[['sine',135,42,.29],['triangle',750,170,.12],['sine',380,190,.07,.05]]},
    starHit:{duration:.25,cooldown:.18,priority:5,noise:{gain:.1,decay:.025,cutoff:2300},layers:[['sine',150,48,.29],['triangle',960,310,.12]]},
    starTap:{duration:.13,cooldown:.16,priority:3,layers:[['sine',390,160,.16],['triangle',840,410,.08]]},
    toxinSpray:{duration:.24,cooldown:.15,priority:4,noise:{gain:.18,decay:.08,cutoff:850},layers:[['sine',210,75,.24],['triangle',430,135,.09]]},

    demonBrand:{duration:.18,cooldown:.3,priority:2,layers:[['sine',160,80,.17],['triangle',640,280,.09]]},
    demonWarn:{duration:.55,attack:.08,cooldown:.4,priority:3,noise:{gain:.07,attack:.06,decay:.4,cutoff:850},layers:[['sine',65,130,.16],['triangle',180,360,.07]]},
    demonGate:{duration:.7,attack:.035,cooldown:.7,priority:4,cutoff:1500,reverb:{seconds:.22,gain:.08},noise:{gain:.16,decay:.26,cutoff:1100},layers:[['sine',100,40,.25],['sine',200,80,.10,.08],['triangle',430,160,.10]]},
    demonClaw:{duration:.25,cooldown:.18,priority:4,noise:{gain:.17,decay:.08,cutoff:1900},layers:[['triangle',600,160,.13],['sine',180,65,.20]]},
    demonGrip:{duration:.25,cooldown:.16,priority:5,noise:{gain:.19,decay:.028,cutoff:2200},layers:[['sine',140,45,.28],['triangle',850,240,.10]]},
    demonChain:{duration:.22,cooldown:.18,priority:4,noise:{gain:.11,decay:.025,cutoff:2800},layers:[['triangle',1550,620,.14],['sine',120,90,.11]]},
    demonTension:{duration:1,attack:.06,cooldown:.7,priority:4,cutoff:1800,noise:{gain:.08,attack:.06,decay:.55,cutoff:1400},layers:[['sine',65,130,.16],['triangle',460,920,.075,.1,.75],['sine',130,260,.05,.15,.8]]},
    demonExecute:{duration:.5,cooldown:.22,priority:6,cutoff:2500,reverb:{seconds:.15,gain:.07},noise:{gain:.24,decay:.06,cutoff:2200},layers:[['sine',165,33,.38],['triangle',1100,160,.16,0,.13],['sine',80,30,.12,.04,.4]]},
    demonSoulCut:{"duration":0.43,"body":0.008,"cooldown":0.22,"priority":5,"cutoff":3400,"reverb":{"seconds":0.12,"gain":0.05},"noise":{"gain":0.17,"decay":0.019,"cutoff":2900},"layers":[["sine",240,80,0.17,0,0.2],["triangle",1810,1240,0.065,0,0.07],["sine",960,620,0.05,0.025,0.34]]},
    demonBreak:{duration:.22,cooldown:.2,priority:4,noise:{gain:.1,decay:.024,cutoff:2400},layers:[['triangle',970,230,.13],['sine',145,65,.14]]},
    wall:{duration:.065,cooldown:.065,priority:0,layers:[['triangle',780,440,.5]]},
    ball:{duration:.16,cooldown:.1,priority:2,layers:[['sine',210,65,.65],['triangle',420,140,.22]]},
    heavy:{duration:.23,cooldown:.12,priority:5,layers:[['sine',160,42,.65],['triangle',720,90,.25]]},
    shot:{duration:.11,cooldown:.09,priority:3,noise:{gain:.22,decay:.025,cutoff:2600},layers:[['triangle',1250,230,.22],['sine',180,85,.18]]},
    shotHit:{duration:.13,cooldown:.12,priority:3,layers:[['triangle',920,180,.4],['sine',220,70,.4]]},
    trap:{duration:.12,cooldown:.22,priority:1,layers:[['triangle',280,480,.34],['sine',960,960,.18,.05]]},
    explosion:{duration:.30,cooldown:.15,priority:5,layers:[['sawtooth',110,28,.4],['triangle',520,60,.30]]},
    chain:{duration:.36,cooldown:.45,priority:3,layers:[['sine',340,180,.35],['triangle',680,350,.18,.08]]},
    heal:{duration:.16,cooldown:.42,priority:1,layers:[['sine',660,880,.28],['sine',880,1100,.18,.04]]},
    shield:{duration:.28,cooldown:.25,priority:3,layers:[['sine',520,780,.30],['triangle',1040,1560,.22]]},
    break:{duration:.25,cooldown:.2,priority:4,layers:[['triangle',1800,220,.36],['sine',250,80,.32]]},
    reflect:{duration:.13,cooldown:.18,priority:2,layers:[['triangle',950,550,.30],['sine',1500,850,.18]]},
    charge:{duration:.50,cooldown:.45,priority:3,layers:[['sine',180,780,.25],['triangle',360,1560,.13]]},
    dash:{duration:.22,cooldown:.25,priority:4,layers:[['sawtooth',1000,100,.26],['sine',280,60,.4]]},
    ready:{duration:.15,cooldown:.3,priority:2,layers:[['sine',700,1050,.25]]},
    stance:{duration:.23,cooldown:.35,priority:3,layers:[['triangle',420,900,.25],['sine',840,1200,.18]]},
    counter:{duration:.21,cooldown:.25,priority:4,layers:[['triangle',1500,450,.3],['sine',250,100,.3]]},
    counterHit:{duration:.19,cooldown:.2,priority:5,layers:[['triangle',1100,280,.35],['sine',240,70,.4]]},
    shieldHit:{duration:.12,cooldown:.12,priority:3,layers:[['sine',1200,860,.27],['triangle',640,470,.17]]},
    ricochet:{duration:.07,cooldown:.09,priority:1,layers:[['triangle',1700,900,.22]]},
    disarm:{duration:.17,cooldown:.3,priority:3,layers:[['triangle',1700,500,.23],['sine',660,330,.2]]},
    combo:{duration:.31,cooldown:.4,priority:6,layers:[['sine',170,40,.5],['triangle',700,100,.26]]},
    throw:{duration:.14,cooldown:.2,priority:2,layers:[['triangle',980,350,.24]]},
    return:{duration:.12,cooldown:.2,priority:1,layers:[['sine',440,880,.2]]},
    returnHit:{duration:.18,cooldown:.2,priority:4,layers:[['triangle',850,350,.28],['sine',170,60,.35]]},
    laser:{duration:.26,cooldown:.3,priority:4,layers:[['sawtooth',1500,160,.22],['sine',300,70,.3]]},
    laserHit:{duration:.21,cooldown:.2,priority:5,layers:[['triangle',1100,90,.28],['sine',140,45,.45]]},
    poison:{duration:.20,cooldown:.4,priority:1,layers:[['sine',360,180,.22]]},
    poisonHit:{duration:.085,cooldown:.32,priority:1,cutoff:2400,noise:{gain:.025,decay:.018,cutoff:1900},layers:[['triangle',470,220,.035,0,.065]]},
    awakenHit:{duration:.32,cooldown:.16,priority:5,layers:[['sine',120,35,.58],['triangle',740,100,.22]]},
    bloodPulse:{duration:.24,cooldown:.27,priority:3,layers:[['sine',110,75,.42],['sine',660,330,.16]]},
    thunderHit:{duration:.32,cooldown:.18,priority:6,noise:{gain:.20,decay:.025,cutoff:2800},layers:[['sawtooth',1200,80,.22],['sine',130,30,.48]]},
    revengeHit:{duration:.30,cooldown:.18,priority:5,layers:[['triangle',1600,180,.26],['sine',150,38,.46]]},
    fortressBlast:{duration:.32,cooldown:.2,priority:5,layers:[['sine',180,45,.4],['triangle',1100,160,.24]]},
    volley:{duration:.17,cooldown:.13,priority:3,layers:[['triangle',1800,440,.3],['sine',160,60,.3]]},
    magnetBlast:{duration:.38,cooldown:.18,priority:5,layers:[['sawtooth',180,30,.32],['triangle',1400,110,.24]]},
    moonCut:{duration:.20,cooldown:.16,priority:4,layers:[['triangle',1300,340,.25],['sine',240,90,.28]]},
    beamAwake:{duration:.42,cooldown:.23,priority:6,layers:[['sawtooth',2200,160,.20],['sine',150,32,.48]]},
    corrosion:{duration:.16,cooldown:.4,priority:2,layers:[['sine',290,80,.23],['triangle',680,170,.12]]},
    awakening:{duration:.50,cooldown:.15,priority:6,layers:[['sine',440,440,.27],['sine',660,660,.23,.10],['triangle',880,880,.18,.20]]},
    toxinBurst:{duration:.30,cooldown:.15,priority:5,layers:[['sawtooth',680,85,.22],['sine',160,45,.4]]},
    wallSlam:{duration:.38,cooldown:.16,priority:6,noise:{gain:.24,decay:.095,cutoff:1600},layers:[['triangle',95,26,.55],['sawtooth',540,70,.2]]},
    bladeCatch:{duration:.20,cooldown:.12,priority:3,layers:[['triangle',1400,480,.25],['sine',820,1100,.14]]},
    fistRelease:{duration:.18,cooldown:.16,priority:4,noise:{gain:.18,decay:.05,cutoff:1200},layers:[['sine',170,70,.28]]},
    fistHit:{duration:.32,cooldown:.16,priority:6,noise:{gain:.22,decay:.028,cutoff:2400},layers:[['sine',150,38,.40],['triangle',520,85,.17],['triangle',1400,260,.12,.015]]},
    bloodCharge:{duration:.25,cooldown:.3,priority:3,layers:[['sine',120,75,.28],['sine',320,620,.14,.07]]},
    bloodFinish:{duration:.32,cooldown:.3,priority:5,noise:{gain:.12,decay:.08,cutoff:1000},layers:[['sine',160,45,.34],['triangle',420,1200,.17,.06]]},
    shieldBash:{duration:.26,cooldown:.17,priority:5,noise:{gain:.16,decay:.045,cutoff:1600},layers:[['sine',180,42,.42],['triangle',920,260,.18]]},
    pressureRelease:{duration:.50,cooldown:.2,priority:6,noise:{gain:.26,decay:.13,cutoff:1600},layers:[['sine',145,38,.28],['triangle',720,150,.13],['sine',70,36,.12,.06]]},
    reload:{duration:.34,cooldown:.3,priority:2,noise:{gain:.07,decay:.025,cutoff:3000},layers:[['triangle',1300,760,.13],['triangle',940,1250,.12,.19]]},
    sniperAim:{duration:.42,attack:.05,cooldown:.4,priority:3,cutoff:2200,layers:[['sine',460,850,.075],['triangle',190,260,.045]]},
    sniperLock:{duration:.12,cooldown:.25,priority:4,layers:[['triangle',1100,700,.13],['sine',1700,1700,.055,.025,.045]]},
    sniperShot:{duration:.38,cooldown:.25,priority:6,cutoff:3000,reverb:{seconds:.13,gain:.06},noise:{gain:.31,decay:.022,cutoff:3200},layers:[['triangle',1300,230,.18,0,.055],['sine',165,40,.38,.007,.31],['sine',75,32,.13,.015,.32]]},
    sniperHit:{duration:.3,cooldown:.22,priority:6,noise:{gain:.21,decay:.035,cutoff:1700},layers:[['triangle',780,120,.18,0,.09],['sine',145,38,.37,.005,.28]]},
    ghostEcho:{duration:.48,cooldown:.6,priority:4,reverb:{seconds:.2,gain:.09},layers:[['sine',260,130,.19],['sine',390,195,.10,.09,.32],['triangle',780,390,.05,.15,.24]]},
    ghostEchoHit:{duration:.22,cooldown:.2,priority:3,layers:[['sine',185,80,.24],['sine',740,290,.13,.02,.17]]},
    heavyShot:{duration:.25,cooldown:.2,priority:5,noise:{gain:.30,decay:.04,cutoff:2200},layers:[['sine',160,42,.4],['triangle',1100,180,.18]]},
    laserLock:{duration:.14,cooldown:.2,priority:3,layers:[['sine',920,920,.18],['sine',1380,1380,.12,.04]]},
    cannon:{duration:.70,cooldown:.5,priority:6,noise:{gain:.16,decay:.35,cutoff:2200},layers:[['sawtooth',230,110,.20],['sine',80,48,.20],['triangle',560,240,.10,.07]]},
    mirrorCatch:{duration:.16,cooldown:.15,priority:4,noise:{gain:.12,decay:.018,cutoff:3100},layers:[['sine',1900,1150,.16],['triangle',1200,620,.15]]},
    mirrorRelease:{duration:.30,cooldown:.25,priority:5,noise:{gain:.17,decay:.035,cutoff:2700},layers:[['triangle',1600,380,.2],['sine',210,70,.24]]},
    netArm:{duration:.12,cooldown:.25,priority:1,layers:[['triangle',630,1100,.10]]},
    netTrigger:{duration:.18,cooldown:.18,priority:4,layers:[['triangle',1300,290,.18],['sine',180,60,.24]]},
    chainBlast:{duration:.32,cooldown:.08,priority:5,noise:{gain:.25,decay:.09,cutoff:1200},layers:[['sine',155,32,.4],['triangle',680,100,.15]]},
    salvoCharge:{duration:.30,cooldown:.3,priority:4,noise:{gain:.07,decay:.025,cutoff:2700},layers:[['triangle',1500,700,.14],['triangle',800,1600,.16,.14]]},
    salvoShot:{duration:.16,cooldown:.15,priority:4,noise:{gain:.24,decay:.027,cutoff:2800},layers:[['triangle',1450,270,.18],['sine',200,75,.20]]},
    heavyShotHit:{duration:.30,cooldown:.15,priority:6,noise:{gain:.24,decay:.035,cutoff:2300},layers:[['sine',145,36,.36],['triangle',1000,130,.17,.012]]},
    pressureCharge:{duration:.22,cooldown:.2,priority:4,noise:{gain:.08,decay:.06,cutoff:2400},layers:[['triangle',1400,520,.16],['sine',180,380,.20]]},
    pressureHit:{duration:.34,cooldown:.2,priority:6,noise:{gain:.28,decay:.055,cutoff:1700},layers:[['sine',125,32,.32],['triangle',640,105,.15]]},
    beamGrind:{duration:.18,cooldown:.11,priority:4,noise:{gain:.12,decay:.07,cutoff:2400},layers:[['sawtooth',900,450,.10],['sine',110,75,.15]]},
    largeHit:{duration:.34,cooldown:.13,priority:6,noise:{gain:.23,decay:.028,cutoff:2500},layers:[['sine',165,36,.36],['triangle',780,130,.17],['sine',85,42,.11,.025]]},
    // Catch slashes: broad air shear and midrange metal bite, distinct from spinning blades.
    bladeSlashWhoosh:{duration:.16,cooldown:.16,priority:4,cutoff:2500,noise:{gain:.20,attack:.015,decay:.045,cutoff:2100},layers:[['triangle',420,125,.07,0,.12]]},
    bladeTwinWhoosh:{duration:.21,cooldown:.16,priority:4,cutoff:2900,noise:{gain:.19,attack:.01,decay:.055,cutoff:2500},layers:[['triangle',510,150,.06,0,.12],['triangle',710,190,.055,.045,.14]]},
    bladeSlashHit:{duration:.24,cooldown:.14,priority:6,cutoff:2600,noise:{gain:.26,decay:.023,cutoff:2200},layers:[['triangle',940,260,.22,0,.09],['sine',145,52,.32,0,.20],['triangle',630,420,.075,.01,.14]]},
    bladeTwinHit:{duration:.32,cooldown:.14,priority:6,cutoff:3100,noise:{gain:.23,decay:.035,cutoff:2800},layers:[['triangle',1160,380,.16,0,.085],['triangle',790,230,.24,.038,.105],['sine',165,43,.34,.025,.25],['triangle',980,640,.06,.06,.18]]},
    bladeHeavyHit:{duration:.30,cooldown:.14,priority:6,noise:{gain:.20,decay:.042,cutoff:2900},layers:[['triangle',2300,520,.16],['sine',175,48,.30],['triangle',1540,350,.11,.018]]},
    mirrorAim:{duration:.18,cooldown:.2,priority:4,layers:[['sine',1100,1450,.17],['triangle',1650,2200,.12,.04]]},
    mirrorStrike:{duration:.32,cooldown:.16,priority:6,noise:{gain:.23,decay:.025,cutoff:3100},layers:[['triangle',2450,620,.15],['sine',155,38,.30],['sine',1225,310,.12,.015]]},
    chainHit:{duration:.40,cooldown:.18,priority:6,noise:{gain:.26,decay:.09,cutoff:1450},layers:[['sine',145,30,.31],['triangle',540,90,.13],['sine',70,32,.10,.025]]},
    cannonHit:{duration:.28,cooldown:.18,priority:6,noise:{gain:.18,decay:.065,cutoff:2200},layers:[['sawtooth',680,150,.14],['sine',135,34,.32],['triangle',1100,300,.10]]},
    guardHeavy:{duration:.29,cooldown:.15,priority:6,noise:{gain:.15,decay:.035,cutoff:2200},layers:[['triangle',1550,750,.18],['sine',380,210,.21],['sine',120,48,.20]]},
    toxinCharge:{duration:.25,cooldown:.3,priority:3,layers:[['sine',180,310,.20],['sine',270,465,.12,.08]]},
    toxinSpread:{duration:.40,cooldown:.3,priority:4,noise:{gain:.18,decay:.12,cutoff:850},layers:[['sine',230,65,.23],['triangle',410,140,.11]]},
    toxinErupt:{duration:.38,cooldown:.18,priority:6,noise:{gain:.25,decay:.08,cutoff:1100},layers:[['sine',175,35,.32],['triangle',420,95,.13],['sine',270,80,.10,.025]]},
    holySeal:{duration:.55,cooldown:.4,priority:4,layers:[['sine',196,196,.18],['sine',247,247,.10,.025],['sine',392,392,.045,.04]]},
    holyWard:{duration:.4,attack:.03,cooldown:.4,priority:3,cutoff:1400,layers:[['sine',165,165,.13],['sine',220,220,.07,.02],['sine',330,330,.04,.04]]},
    // One bell for awakening charge. Light waves share a soft choir/air bed;
    // only actual impacts get a short bass transient, never a bell per pillar.
    holyCharge:{duration:1.15,cooldown:.8,priority:5,cutoff:1200,reverb:{seconds:.28,gain:.13},layers:[['sine',110,110,.26],['sine',221,221,.14,.008],['sine',296,296,.055,.012]]},
    holyWave:{duration:2.4,attack:.18,cooldown:1.2,priority:4,cutoff:1400,reverb:{seconds:.28,gain:.1},noise:{gain:.055,attack:.18,decay:1.2,cutoff:1100},layers:[['sine',110,110,.085],['sine',220,220,.055],['sine',330,330,.035],['sine',440,440,.018]]},
    holyFall:{duration:.8,attack:.1,cooldown:.65,priority:2,cutoff:1200,noise:{gain:.07,attack:.08,decay:.35,cutoff:900},layers:[['sine',110,110,.045],['sine',220,220,.035],['sine',330,330,.018]]},
    holyLand:{duration:.32,cooldown:.45,priority:5,cutoff:1900,noise:{gain:.18,decay:.06,cutoff:1600},layers:[['triangle',650,180,.10,0,.08],['sine',110,50,.32,.008,.25],['sine',55,42,.12,.015,.28]]},
    pursuit:{duration:.19,cooldown:.3,priority:3,noise:{gain:.09,decay:.045,cutoff:1600},layers:[['triangle',700,280,.12],['sine',150,90,.09]]},
    toxinSpit:{duration:.14,cooldown:.25,priority:3,noise:{gain:.09,decay:.035,cutoff:1500},layers:[['sine',530,170,.14],['triangle',290,90,.065]]},
    toxinSplash:{duration:.2,cooldown:.2,priority:3,noise:{gain:.12,decay:.07,cutoff:1000},layers:[['sine',180,80,.15],['sine',470,160,.06,.025]]},
    mineCatch:{duration:.32,cooldown:.18,priority:4,noise:{gain:.13,decay:.014,cutoff:2700},layers:[['triangle',1100,330,.18,0,.08],['sine',95,190,.13,.04,.26]]},
    mineBlast:{duration:.34,cooldown:.16,priority:5,noise:{gain:.22,decay:.075,cutoff:1300},layers:[['sine',140,35,.35],['triangle',400,100,.14]]},
    mineHit:{duration:.3,cooldown:.15,priority:6,noise:{gain:.24,decay:.035,cutoff:1900},layers:[['sine',155,38,.36],['triangle',650,160,.14]]},
    shardHit:{duration:.09,cooldown:.12,priority:1,noise:{gain:.065,decay:.018,cutoff:2500},layers:[['triangle',1200,600,.08]]},
    holyHit:{duration:.32,cooldown:.28,priority:6,cutoff:2000,noise:{gain:.23,decay:.045,cutoff:1700},layers:[['triangle',760,160,.13,0,.065],['sine',120,45,.36,.006,.28],['sine',65,36,.14,.018,.26]]},
    holyTouch:{duration:.12,cooldown:.28,priority:2,cutoff:1000,noise:{gain:.045,decay:.035,cutoff:900},layers:[['sine',160,110,.065]]},
    holyWater:{duration:.1,cooldown:.45,priority:1,layers:[['sine',880,660,.065],['sine',1760,1320,.025,.02]]},
    ghostCharge:{duration:.28,cooldown:.25,priority:3,layers:[['sine',550,900,.17],['sine',825,1350,.10,.045]]},
    ghostPhase:{duration:.42,cooldown:.3,priority:4,noise:{gain:.08,decay:.15,cutoff:1500},layers:[['sine',380,130,.22],['sine',1100,650,.12,.04]]},
    ghostReturn:{duration:.24,cooldown:.25,priority:3,layers:[['sine',240,480,.18],['triangle',720,1200,.09]]},
    ghostFear:{duration:.19,cooldown:.22,priority:2,layers:[['sine',770,260,.14],['sine',115,75,.13]]},
    ghostLunge:{duration:.26,cooldown:.2,priority:4,noise:{gain:.16,decay:.075,cutoff:2300},layers:[['triangle',950,180,.13],['sine',170,70,.17]]},
    soulBurst:{duration:.52,cooldown:.3,priority:6,noise:{gain:.16,decay:.12,cutoff:1400},layers:[['sine',260,100,.25],['sine',390,150,.15,.04],['sine',135,35,.25],['triangle',980,160,.10]]},
    soulHit:{duration:.31,cooldown:.2,priority:6,noise:{gain:.14,decay:.06,cutoff:1900},layers:[['sine',165,40,.31],['sine',660,260,.14],['triangle',1320,520,.09]]},
    magnetFocus:{duration:.20,cooldown:.25,priority:3,layers:[['sine',500,750,.16],['sine',750,1100,.10,.03]]},
    magnetGraze:{duration:.20,cooldown:.18,priority:3,noise:{gain:.10,decay:.045,cutoff:2100},layers:[['sine',230,75,.22],['triangle',1300,380,.09]]},
    magnetCharge:{duration:.30,cooldown:.2,priority:4,layers:[['sawtooth',95,330,.14],['sine',180,550,.19],['triangle',1450,2100,.09,.08]]},
    magnetPull:{duration:.48,cooldown:.25,priority:5,noise:{gain:.13,decay:.16,cutoff:1400},layers:[['sine',60,210,.28],['sawtooth',220,720,.13],['sine',480,1200,.10,.06]]},
    magnetPush:{duration:.34,cooldown:.2,priority:6,noise:{gain:.25,decay:.075,cutoff:2100},layers:[['sine',150,34,.38],['triangle',1200,150,.16],['sine',75,32,.10,.025]]},
    magnetReverse:{duration:.48,cooldown:.25,priority:6,noise:{gain:.28,decay:.10,cutoff:2400},layers:[['sine',175,28,.37],['sawtooth',1300,90,.14],['sine',85,30,.14,.04]]},
    magnetCrush:{duration:.33,cooldown:.18,priority:6,noise:{gain:.22,decay:.035,cutoff:2600},layers:[['sine',140,36,.36],['triangle',1800,180,.16]]},
    magnetWall:{duration:.42,cooldown:.2,priority:6,noise:{gain:.27,decay:.11,cutoff:1900},layers:[['sine',125,30,.36],['triangle',1050,100,.15],['sine',70,28,.10,.025]]},
    timeErode:{duration:.13,cooldown:.35,priority:1,layers:[['sine',750,330,.13],['triangle',1200,600,.07]]},
    timeField:{duration:.38,cooldown:.25,priority:3,layers:[['sine',880,440,.15],['sine',1320,660,.10,.035],['triangle',2400,1100,.08]]},
    clockCharge:{duration:.35,cooldown:.3,priority:4,layers:[['triangle',1600,1600,.13],['triangle',1100,1900,.12,.16],['sine',180,380,.13]]},
    clockThrow:{duration:.22,cooldown:.25,priority:4,noise:{gain:.13,decay:.07,cutoff:2300},layers:[['triangle',1800,700,.15],['sine',440,880,.12]]},
    clockBlast:{duration:.50,cooldown:.18,priority:6,noise:{gain:.19,decay:.04,cutoff:3400},layers:[['sine',440,370,.24],['sine',660,550,.15,.012],['triangle',1700,420,.13],['sine',135,35,.28]]},
    timeSilence:{duration:.18,cooldown:.2,priority:5,layers:[['triangle',1800,110,.17],['sine',330,70,.19]]},
    timeInterrupt:{duration:.12,cooldown:.2,priority:5,noise:{gain:.12,decay:.02,cutoff:1900},layers:[['triangle',1450,190,.18]]},
    victory:{duration:.56,cooldown:.6,priority:7,layers:[['sine',523,523,.25],['sine',659,659,.24,.12],['triangle',784,1047,.22,.24]]}
  };
  // Distinct action identities; the shared synth and mix remain authoritative.
  Object.assign(profiles,{
    demonExtract:{"duration":0.38,"attack":0.012,"cooldown":0.18,"priority":4,"cutoff":2100,"noise":{"gain":0.2,"attack":0.008,"decay":0.12,"cutoff":1700},"layers":[["sine",210,90,0.14,0,0.22],["triangle",330,710,0.06,0.035,0.25],["sine",84,125,0.07,0.1,0.23]]},
    demonNailWarn:{"duration":0.44,"attack":0.035,"cooldown":0.28,"priority":4,"cutoff":3500,"noise":{"gain":0.045,"decay":0.06,"cutoff":2800},"layers":[["triangle",920,1280,0.06,0,0.25],["sine",1860,2090,0.035,0.035,0.3],["sine",120,95,0.08,0.22,0.15]]},
    demonGateEcho:{"duration":0.46,"attack":0.018,"cooldown":0.35,"priority":4,"cutoff":1600,"reverb":{"seconds":0.12,"gain":0.04},"noise":{"gain":0.12,"decay":0.17,"cutoff":1150},"layers":[["sine",78,145,0.16],["triangle",300,170,0.06,0.08,0.2]]},
    demonNailLaunch:{"duration":0.22,"cooldown":0.16,"priority":5,"cutoff":4000,"noise":{"gain":0.22,"decay":0.035,"cutoff":3600},"layers":[["triangle",1850,520,0.055,0,0.09],["sine",210,85,0.13,0,0.16]]},
    demonNailImpact:{"duration":0.39,"body":0.012,"cooldown":0.18,"priority":6,"cutoff":3600,"reverb":{"seconds":0.1,"gain":0.035},"noise":{"gain":0.21,"decay":0.014,"cutoff":3400},"layers":[["sine",175,52,0.22,0,0.16],["triangle",2310,1760,0.075,0,0.065],["sine",1387,1270,0.055,0.015,0.26],["sine",887,790,0.045,0.02,0.32]]},
    demonRend:{"duration":0.32,"body":0.012,"cooldown":0.2,"priority":5,"cutoff":2800,"noise":{"gain":0.26,"decay":0.043,"cutoff":2400},"layers":[["sine",137,47,0.21,0,0.16],["sawtooth",390,115,0.045,0.012,0.09],["triangle",265,150,0.09,0.06,0.19]]},
    demonFireCharge:{"duration":0.48,"attack":0.1,"cooldown":0.4,"priority":4,"cutoff":1200,"noise":{"gain":0.13,"attack":0.09,"decay":0.35,"cutoff":1000},"layers":[["sine",56,100,0.09],["triangle",140,235,0.035,0.08,0.32]]},
    demonHellfire:{"duration":1.02,"attack":0.035,"cooldown":0.8,"priority":5,"cutoff":1900,"noise":{"gain":0.26,"attack":0.025,"decay":0.38,"cutoff":1450},"layers":[["sawtooth",78,53,0.055,0,0.8],["sine",145,71,0.12,0,0.48],["triangle",320,190,0.035,0.12,0.35]]},
    demonFireSever:{"duration":0.69,"body":0.025,"cooldown":0.4,"priority":8,"cutoff":2200,"reverb":{"seconds":0.16,"gain":0.065},"noise":{"gain":0.24,"decay":0.085,"cutoff":1800},"layers":[["sine",125,30,0.33,0,0.46],["triangle",760,210,0.065,0,0.13],["sine",340,98,0.08,0.075,0.24],["sine",68,41,0.09,0.16,0.4]]},
    demonAssimilate:{"duration":0.62,"attack":0.09,"cooldown":0.45,"priority":4,"cutoff":1800,"reverb":{"seconds":0.15,"gain":0.04},"noise":{"gain":0.065,"attack":0.05,"decay":0.28,"cutoff":1500},"layers":[["sine",170,76,0.12],["triangle",390,220,0.04,0.06,0.4],["sine",610,305,0.025,0.18,0.34]]},
    demonReform:{"duration":0.73,"attack":0.18,"cooldown":0.55,"priority":4,"cutoff":1700,"noise":{"gain":0.1,"attack":0.14,"decay":0.45,"cutoff":1350},"layers":[["sine",72,185,0.13],["triangle",205,460,0.045,0.1,0.45],["sine",110,220,0.04,0.16,0.4]]},
    demonReformEnd:{"duration":0.3,"body":0.02,"cooldown":0.25,"priority":4,"cutoff":2300,"noise":{"gain":0.1,"decay":0.035,"cutoff":2000},"layers":[["sine",190,92,0.16,0,0.23],["triangle",530,350,0.045,0.02,0.2]]},
    demonServantDeath:{"duration":0.48,"cooldown":0.3,"priority":5,"cutoff":2500,"noise":{"gain":0.19,"decay":0.075,"cutoff":2200},"layers":[["triangle",750,190,0.08,0,0.22],["sine",180,49,0.19,0,0.34],["sine",360,63,0.035,0.035,0.32]]},
    demonReturn:{"duration":0.3,"attack":0.035,"cooldown":0.18,"priority":3,"cutoff":1900,"noise":{"gain":0.055,"attack":0.025,"decay":0.16,"cutoff":1500},"layers":[["sine",460,240,0.075],["sine",190,310,0.06,0.04,0.2]]},
    laserCharge:{"duration":0.66,"attack":0.06,"cooldown":0.45,"priority":3,"cutoff":2600,"noise":{"gain":0.035,"attack":0.04,"decay":0.38,"cutoff":2100},"layers":[["sine",280,650,0.09],["triangle",560,1300,0.025,0.09,0.42],["sine",1120,1620,0.015,0.22,0.36]]},
    laserJet:{"duration":0.18,"body":0.008,"cooldown":0.16,"priority":4,"cutoff":3100,"noise":{"gain":0.28,"decay":0.028,"cutoff":2800},"layers":[["sine",155,68,0.19,0,0.12],["triangle",580,200,0.035,0,0.08]]},
    toxinBind:{"duration":0.3,"attack":0.008,"cooldown":0.3,"priority":4,"cutoff":1100,"noise":{"gain":0.14,"decay":0.06,"cutoff":820},"layers":[["triangle",245,85,0.11,0,0.2],["sine",120,75,0.12,0.06,0.2],["sine",390,180,0.035,0.04,0.13]]},
    toxinSwarm:{"duration":0.46,"attack":0.045,"cooldown":0.4,"priority":4,"cutoff":1800,"noise":{"gain":0.14,"attack":0.03,"decay":0.24,"cutoff":1500},"layers":[["sawtooth",130,185,0.035,0,0.31],["triangle",310,390,0.025,0.1,0.3]]},
    toxinRetract:{"duration":0.2,"attack":0.015,"cooldown":0.18,"priority":2,"cutoff":1200,"noise":{"gain":0.09,"attack":0.01,"decay":0.075,"cutoff":950},"layers":[["sine",250,100,0.08,0,0.16],["triangle",420,180,0.022,0.02,0.13]]},
    toxinBindBreak:{"duration":0.21,"cooldown":0.2,"priority":3,"cutoff":1800,"noise":{"gain":0.17,"decay":0.022,"cutoff":1550},"layers":[["triangle",460,125,0.075,0,0.08],["sine",110,58,0.1,0.025,0.16]]}
  });
  G.Audio = class Audio {
    static profiles = profiles;
    constructor(){
      G.Audio.live=this;this.enabled=true;this.available=true;this.context=null;this.master=null;this.voices=new Set();this.arcanaDuckUntil=0;
      this.lastPlayed={};this.played=Object.fromEntries(Object.keys(profiles).map(kind=>[kind,0]));this.lastCue='';
    }
    async unlock(){
      if(!this.enabled || !this.available)return;
      try{
        const Context=root.AudioContext || root.webkitAudioContext;if(!Context)throw new Error('Web Audio unavailable');
        if(!this.context){
          this.context=new Context();Object.assign(this,G.Audio.createGraph(this.context));
        }
        if(this.context.state==='suspended')await this.context.resume();
      }catch(_){this.available=false;this.enabled=false;}
    }
    setEnabled(enabled){this.enabled=enabled && this.available;if(!this.enabled)this.stop();}
    stop(force=false){
      const preserved=new Set();for(const voice of this.voices){if(!force&&this.enabled&&this.auditionOpen&&!root.document?.hidden&&voice.preview){preserved.add(voice);continue;}for(const osc of voice.oscillators){try{osc.stop();}catch(_){}}for(const node of voice.nodes){try{node.disconnect();}catch(_){}}}
      this.voices.clear();for(const voice of preserved)this.voices.add(voice);if(preserved.size)return;this.lastPlayed={};this.lastRepeatAt=-Infinity;this.arcanaDuckUntil=0;for(const key of ['ordinaryBus','cueBus','ambienceBus'])if(this[key]){this[key].gain.cancelScheduledValues(this.context.currentTime);this[key].gain.value=1;}
    }
    consume(events){
      if(!this.enabled || this.context?.state!=='running')return;
      const mix=G.AudioMix,info=k=>mix?.describe(k)||{tier:'B',gain:1,bus:'ordinaryBus',priority:profiles[k].priority,maxSame:2};
      if(this.arcanaDuckUntil&&this.context.currentTime>this.arcanaDuckUntil+.4){for(const key of ['ordinaryBus','cueBus','ambienceBus']){this[key].gain.cancelScheduledValues(this.context.currentTime);this[key].gain.setValueAtTime(1,this.context.currentTime);}this.arcanaDuckUntil=0;}
      const eventGain=event=>mix?.eventGain(event)??(Number.isFinite(event.gain)?event.gain:1);
      const latest=new Map();for(const event of events)if(profiles[event.kind]&&(!latest.has(event.kind)||eventGain(event)>eventGain(latest.get(event.kind))))latest.set(event.kind,event);
      // Strong cues lead; dense 4× events coalesce. Eight concurrent cues maximum.
      const ordered=[...latest.values()].sort((a,b)=>info(b.kind).priority-info(a.kind).priority);let started=0;
      for(const event of ordered){
        const kind=event.kind,now=this.context.currentTime;
        if(kind==='holyTouch'&&latest.has('holyHit'))continue;
        if(kind==='holyLand'&&latest.has('holyHit'))continue;
        if(kind==='mineBlast'&&latest.has('mineHit'))continue;
        if(started>=(mix?.maxPerBatch||4))break;if(kind==='heavy'&&ordered.some(e=>['largeHit','fistHit','bladeHeavyHit','bladeSlashHit','bladeTwinHit','mirrorStrike','chainHit','cannonHit','pressureHit','shieldBash','thunderHit','guardHeavy','toxinErupt','arcDanceCut','arcDanceFinale','demonRend','demonNailImpact','demonFireSever','demonSoulCut','heavyShotHit'].includes(e.kind)))continue;
        if(kind==='ball' && (latest.has('heavy') || latest.has('explosion') || latest.has('laserHit') || latest.has('counterHit') || ordered.some(e=>['awakenHit','thunderHit','revengeHit','fortressBlast','magnetBlast','beamAwake','fistHit','shieldBash','cannon','heavyShot','chainBlast','largeHit','bladeHeavyHit','bladeSlashHit','bladeTwinHit','mirrorStrike','chainHit','cannonHit','guardHeavy','toxinErupt','arcDanceCut','arcDanceFinale','demonRend','demonNailImpact','demonFireSever','demonSoulCut'].includes(e.kind))))continue;
        const policy=info(kind);if(now-(this.lastPlayed[kind]??-Infinity)<Math.max(profiles[kind].cooldown,policy.minGap||0))continue;
        if(policy.tier==='R'&&now-(this.lastRepeatAt??-Infinity)<.10)continue;
        if([...this.voices].filter(v=>v.kind===kind).length>=info(kind).maxSame)continue;
        if(this.voices.size>=(mix?.maxVoices||8)){
          const quietest=[...this.voices].sort((a,b)=>info(a.kind).priority-info(b.kind).priority)[0];
          if(info(quietest.kind).priority>=info(kind).priority)continue;
          for(const osc of quietest.oscillators){try{osc.stop();}catch(_){}}
          for(const node of quietest.nodes)node.disconnect();this.voices.delete(quietest);
        }
        this.lastPlayed[kind]=now;if(info(kind).tier==='R')this.lastRepeatAt=now;
        const settings=info(kind),bus=this[settings.bus]||this.ordinaryBus,trim=this.context.createGain(),nowGain=settings.gain*Math.max(0,Math.min(settings.maxGain||(kind==='wall'?1.5:1.4),eventGain(event)));trim.gain.value=nowGain;trim.connect(bus);
        if(settings.tier==='S'){this.arcanaDuckUntil=Math.max(this.arcanaDuckUntil,now+Math.min(.65,profiles[kind].duration+.08));for(const key of ['ordinaryBus','cueBus','ambienceBus'])if(this[key]){const gain=this[key].gain;gain.cancelScheduledValues(now);gain.setTargetAtTime(Math.pow(10,(mix?.duckDb??-4)/20),now,.012);gain.setTargetAtTime(1,this.arcanaDuckUntil,.08);}}
        const voice=G.Audio.synthesize(this.context,trim,kind,now,event.pan,()=>this.voices.delete(voice));voice.nodes.push(trim);
        voice.kind=kind;voice.preview=!!event.preview;this.voices.add(voice);this.played[kind]=(this.played[kind]||0)+1;this.lastCue=kind;started++;
        if(this.onCue)try{this.onCue({kind,presentationId:event.presentationId||null,requestedTick:event.tick,audioTime:now,tier:settings.tier,gain:nowGain,preview:!!event.preview});}catch(_){/* Diagnostics must not interrupt audio or simulation. */}
      }
    }
    snapshot(){return {enabled:this.enabled,available:this.available,contextState:this.context?.state || 'locked',activeVoices:this.voices.size,played:{...this.played},lastCue:this.lastCue};}
    static createGraph(context){
      const master=context.createGain();master.gain.value=G.AudioMix?.master??.24;
      const compressor=context.createDynamicsCompressor();compressor.threshold.value=-6;compressor.knee.value=3;compressor.ratio.value=4;compressor.attack.value=.002;compressor.release.value=.09;
      const limiter=context.createWaveShaper(),curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.7?a:.7+.2*(1-Math.exp(-(a-.7)/.2)));}limiter.curve=curve;limiter.oversample='4x';master.connect(compressor);compressor.connect(limiter);limiter.connect(context.destination);
      const graph={master,compressor,limiter};for(const key of ['ordinaryBus','arcanaBus','cueBus','ambienceBus']){graph[key]=context.createGain();graph[key].connect(master);}return graph;
    }
    static synthesize(context,destination,kind,when,pan=0,onEnded=()=>{}){
      const spec=profiles[kind];if(!spec)throw new Error('Unknown audio cue: '+kind);
      const panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));panner.connect(destination);
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=spec.cutoff||(kind==='explosion'?1200:kind==='wall'?2400:3200);filter.connect(panner);
      const voice={oscillators:[],nodes:[filter,panner]};let remaining=spec.layers.length+(spec.noise?1:0);
      const ended=()=>{if(--remaining===0){for(const node of voice.nodes)node.disconnect();onEnded();}};
      if(spec.reverb){
        const {seconds,gain:amount}=spec.reverb,convolver=context.createConvolver(),wet=context.createGain(),impulse=context.createBuffer(1,Math.ceil(context.sampleRate*seconds),context.sampleRate),data=impulse.getChannelData(0);let seed=74131;
        for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*Math.pow(1-i/data.length,3)*.4;}
        convolver.buffer=impulse;wet.gain.value=amount;filter.connect(convolver);convolver.connect(wet);wet.connect(panner);voice.nodes.push(convolver,wet);
        // Keep the bounded reverb tail alive; mute/pause still stop and disconnect every node.
        const tail=context.createBufferSource();tail.buffer=context.createBuffer(1,1,context.sampleRate);tail.connect(filter);remaining++;tail.onended=ended;tail.start(when+spec.duration+seconds+.01);voice.oscillators.push(tail);voice.nodes.push(tail);
      }
      if(spec.noise){
        const n=spec.noise,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*spec.duration),context.sampleRate),data=buffer.getChannelData(0);
        let seed=2166136261;for(const ch of kind)seed=Math.imul(seed^ch.charCodeAt(0),16777619);
        for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*Math.min(1,i/(context.sampleRate*(n.attack||.002)))*Math.exp(-i/context.sampleRate/n.decay);}
        const source=context.createBufferSource(),band=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;band.type='lowpass';band.frequency.value=n.cutoff;gain.gain.value=n.gain;source.connect(band);band.connect(gain);gain.connect(filter);source.start(when);source.stop(when+spec.duration+.008);source.onended=ended;voice.oscillators.push(source);voice.nodes.push(source,band,gain);
      }
      for(const [type,from,to,gain,delay=0,layerDuration] of spec.layers){
        const start=when+delay,end=layerDuration===undefined?when+spec.duration:start+layerDuration,osc=context.createOscillator(),envelope=context.createGain();
        osc.type=type;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,end);
        envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+Math.min(spec.attack||.004,(end-start)*.5));if(spec.body){const bodyEnd=Math.min(end-.01,start+spec.body);envelope.gain.linearRampToValueAtTime(gain*.72,Math.max(bodyEnd,start+.008));}envelope.gain.exponentialRampToValueAtTime(.0001,end);
        osc.connect(envelope);envelope.connect(filter);osc.start(start);osc.stop(end+.008);
        voice.oscillators.push(osc);voice.nodes.push(osc,envelope);
        osc.onended=ended;
      }
      return voice;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
