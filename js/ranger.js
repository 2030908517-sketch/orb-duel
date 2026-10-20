(function(root){
  'use strict';const G=root.OrbDuel,EPS=1e-9;
  G.Ranger={
    visual:{reloadFill:.9,ammoSwap:.28,ammoPop:.16},
    init(b){const r=b.role;if(r.fireMode!==undefined)return;Object.assign(r,{fireMode:'burst',sniperPhase:'idle',sniperPending:null,sniperFireAt:0,sniperLockAt:0,sniperAngle:0,sniperHurt:false,sniperTarget:null,sniperLocked:false,sniperSpread:0});},
    reload(b,e){G.Adaptive?.close(b,b.role.adaptiveId);b.role.reloadDuration=G.Awakening.active(b)?b.def.reloadTime:b.def.baseReloadTime;b.role.reloadUntil=e.time+b.role.reloadDuration;b.role.ammo=0;b.nextShot=b.role.reloadUntil;e.sound('reload',b.x);},
    loadedAmmo(b,e){const r=b.role,cap=r.fireMode==='sniper'?1:3;if(!r.reloadUntil)return r.ammo;const duration=r.reloadDuration||(G.Awakening.active(b)?b.def.reloadTime:b.def.baseReloadTime),progress=1-Math.max(0,r.reloadUntil-e.time)/duration;return Math.max(0,Math.min(cap,Math.floor(progress/this.visual.reloadFill*cap+EPS)));},
    displayAmmo(b){return b.role.ammo;},
    ammoMarkers(b,e){const r=b.role,sniper=r.fireMode==='sniper',swap=r.ammoTransition,elapsed=swap?(e.time-swap.at)/this.visual.ammoSwap:1,u=Math.max(0,Math.min(1,elapsed)),blend=u*u*(3-2*u),out=[];
      const add=(isSniper,ammo,alpha,spread,scale,old=false)=>{const cap=isSniper?1:3;for(let i=0;i<cap;i++){let pop=1;if(!old&&r.reloadUntil&&i<ammo){const duration=r.reloadDuration||(G.Awakening.active(b)?b.def.reloadTime:b.def.baseReloadTime),at=r.reloadUntil-duration+duration*this.visual.reloadFill*(i+1)/cap,age=(e.time-at)/this.visual.ammoPop;if(age>=0&&age<1)pop+=.18*Math.sin(age*Math.PI);}out.push({key:(old?'oldAmmo':'ammo')+i,shape:isSniper?'sniperRound':'bar',active:i<ammo,alpha,scale:scale*pop,degrees:-90+(i-(cap-1)/2)*21*spread});}};
      if(swap&&u<1){add(swap.from==='sniper',swap.fromAmmo,1-blend,1-blend,1-.4*blend,true);add(sniper,r.ammo,blend,blend,.6+.4*blend);}else add(sniper,r.ammo,1,1,1);return out;
    },
    select(b,e,requestedMode=null){b.role.adaptiveSuppressed=false;b.role.adaptiveId=G.Adaptive?.begin(b,'ranger',e);const r=b.role,target=G.World.targetFor(b,e),oldMode=r.fireMode,oldAmmo=r.ammo;r.round=0;r.overload=false;r.sniperPhase='idle';r.sniperHurt=false;r.sniperLocked=false;r.sniperFireAt=r.sniperLockAt=0;
      r.fireMode=G.Awakening.active(b)&&r.calibration>=b.def.calibrationCap&&target?(['sniper','scatter'].includes(requestedMode)?requestedMode:(Math.hypot(target.x-b.x,target.y-b.y)>=b.def.sniperThreshold?'sniper':'scatter')):'burst';r.overload=r.fireMode==='scatter';r.ammo=r.fireMode==='sniper'?1:3;if((oldMode==='sniper')!==(r.fireMode==='sniper'))r.ammoTransition={from:oldMode,to:r.fireMode,fromAmmo:oldAmmo,at:e.time};b.nextShot=e.time;
      if(r.fireMode==='sniper'){r.sniperPhase='aim';r.sniperTarget=target.id;r.sniperLockAt=e.time+b.def.sniperAim;r.sniperFireAt=r.sniperLockAt+b.def.sniperLock;r.sniperAngle=r.barrelAngle??Math.atan2(target.y-b.y,target.x-b.x);r.aimTracks??={};r.aimTracks.sniper={angle:r.sniperAngle,tick:-1};b.nextShot=r.sniperFireAt;e.signal(b,'狙击预瞄 · 单发决胜','sniperAim');}
      if(r.fireMode==='scatter'){r.calibration=0;r.salvoFireAt=e.time+.3;r.salvoAngle=r.barrelAngle??Math.atan2(target.y-b.y,target.x-b.x);b.nextShot=r.salvoFireAt;e.signal(b,'枪阵展开 · 近距散射','salvoCharge');G.Roles.effect(b,e,'gunDeploy',b,r.salvoAngle,.3);}
    },
    update(b,dt,e){this.init(b);if(e.state==='running'&&b.role.reloadUntil)b.role.ammo=this.loadedAmmo(b,e);if(e.state!=='running'||G.Temporal.silenced(b,e)||G.Arcana?.busy(b))return;const r=b.role,t=e.time,awake=G.Awakening.active(b),enemy=G.World.targetFor(b,e);
      if(!r.reloadUntil&&r.ammo>0&&!r.adaptiveSuppressed)r.adaptiveId??=G.Adaptive?.begin(b,'ranger',e);if(enemy)r.barrelAngle=G.Aim.track(b,enemy,e,'barrel',b.def.shotSpeed,0,(3.2+r.calibration*.8)*(1+.1*(G.Adaptive?.level(b,'ranger')||0)),dt);
      if(t>r.calibrationUntil)r.calibration=0;
      if(r.reloadUntil){if(t+EPS<r.reloadUntil||r.sniperPending!==null)return;r.reloadUntil=0;this.select(b,e);}
      if(r.fireMode==='sniper'&&r.sniperPhase!=='idle'){
        const target=e.balls.find(v=>v.id===r.sniperTarget&&G.World.targetable(v,e)&&G.World.enemy(b,v,e))||G.World.targetFor(b,e);if(!target)return;
        if(t<r.sniperLockAt-EPS){r.sniperTarget=target.id;r.sniperAngle=G.Aim.track(b,target,e,'sniper',b.def.sniperSpeed,Math.max(0,r.sniperFireAt-t),7.5,dt);}
        else if(!r.sniperLocked){r.sniperLocked=true;r.sniperPhase='locked';e.sound('sniperLock',b.x);}
        if(t+EPS<r.sniperFireAt)return;
        const error=G.Aim.offset(b,target,e,'sniper',r.sniperHurt?0:r.calibration),angle=r.sniperAngle+error,shot=G.World.fire(b,e,{angle,speed:b.def.sniperSpeed,damage:b.def.sniperDamage,radius:5,heavy:true,life:1.2,maxBounces:0,sniper:true});if(!shot)return;
        shot.adaptiveId=r.adaptiveId;shot.calibrationEligible=true;shot.sniper=true;shot.aimError=error;shot.hurtDuringAim=r.sniperHurt;r.sniperSpread=G.Aim.spread(b,target,'sniper',r.sniperHurt?0:r.calibration);r.sniperPending=shot.id;r.sniperPhase='idle';r.sniperFireAt=r.sniperLockAt=0;r.ammo=0;r.round=1;
        G.Roles.shove(b,angle+Math.PI,105,.45);G.Roles.effect(b,e,'heavyMuzzle',b,angle,.2);e.sound('sniperShot',b.x);e.signal(b,r.sniperHurt?'偏移狙击 · 等待弹丸':'狙击出膛 · 等待弹丸','miss');this.reload(b,e);return;
      }
      if(r.sniperPending!==null||t+EPS<b.nextShot||r.ammo<=0)return;const target=G.World.targetFor(b,e);if(!target)return;
      if(r.salvoFireAt>t){r.salvoAngle=r.barrelAngle;return;}
      const scatter=r.fireMode==='scatter',heavy=scatter&&r.round===2,speed=heavy?520:b.def.shotSpeed,angle=r.barrelAngle??Math.atan2(target.y-b.y,target.x-b.x),error=scatter?0:G.Aim.offset(b,target,e,'ranger');r.salvoAngle=angle;
      for(const offset of scatter&&!heavy?[-.22,0,.22]:[0]){const shot=G.World.fire(b,e,{angle:angle+offset+error,damage:offset?1.25:G.Roles.rangerDamage(b),heavy,speed,radius:heavy?6.5:b.def.shotRadius});if(shot){shot.adaptiveId=r.adaptiveId;shot.calibrationEligible=true;shot.calibrationIgnored=false;shot.scatter=scatter;shot.aimError=error;}}
      e.sound(heavy?'heavyShot':scatter?'salvoShot':'shot',b.x);G.Roles.effect(b,e,heavy?'heavyMuzzle':scatter?'salvoMuzzle':'muzzle',b,angle,heavy?.22:.16);
      b.hitVisual={age:0,life:.16,angle,power:heavy?1.5:.5};if(scatter){const forward=Math.max(0,b.vx*Math.cos(angle)+b.vy*Math.sin(angle));G.Roles.shove(b,angle+Math.PI,forward+(heavy?125:70),.5);if(heavy){r.heavyRounds++;e.signal(b,'终结重弹','miss');}}
      r.salvoFireAt=0;r.ammo--;r.round++;
      if(!r.ammo)this.reload(b,e);else b.nextShot=t+(scatter?.22:awake?.32:.42);
    },
    receiveDamage(b,e){this.init(b);const r=b.role;if(r.sniperPhase==='idle')return;r.sniperHurt=true;r.calibration=0;e.signal(b,'瞄准受创 · 本发偏移','miss');},
    hit(b,hit,e){if(hit.kind!=='shot')return;if(hit.calibrationShot){G.Aim.result(hit.calibrationShot,e,true);return;}if(!hit.calibrationIgnored&&hit.actual+hit.blocked>0){b.role.calibration=Math.min(b.def.calibrationCap,b.role.calibration+1);b.role.calibrationUntil=e.time+6;}},
    interrupt(b,e){G.Adaptive?.cancel(b,'ranger',true);this.init(b);const r=b.role,active=r.sniperPhase!=='idle'||r.fireMode==='scatter'&&r.ammo>0&&!r.reloadUntil;if(r.ammo>0){r.adaptiveId=undefined;r.adaptiveSuppressed=true;}if(!active)return;r.sniperPhase='idle';r.sniperFireAt=r.sniperLockAt=0;r.sniperLocked=false;r.salvoFireAt=0;r.overload=false;r.ammo=0;this.reload(b,e);},
    status(b,e){this.init(b);const r=b.role,t=e.time,mode=r.fireMode==='sniper'?(r.sniperPhase==='aim'?'预瞄':r.sniperPhase==='locked'?'锁定':r.sniperPending!==null?'弹在途':'狙击'):r.fireMode==='scatter'?'散射':'三连发';return [
      {label:'模式',value:mode+(r.sniperHurt&&r.sniperPhase!=='idle'?'·偏移':'')},{label:'弹匣',value:r.ammo+'/'+(r.fireMode==='sniper'?1:3)},{label:'校准',value:r.calibration+'/'+b.def.calibrationCap},
      {label:'装填',value:r.sniperPending!==null&&r.reloadUntil<=t?'待弹结果':r.sniperPhase!=='idle'?Math.max(0,r.sniperFireAt-t).toFixed(1)+'s':Math.max(0,r.reloadUntil-t).toFixed(1)+'s'},
      {label:'散布',value:((r.sniperPending!==null?r.sniperSpread:r.fireMode==='scatter'?0:G.Aim.spread(b,b,r.fireMode==='sniper'?'sniper':'ranger',r.sniperHurt&&r.sniperPhase!=='idle'?0:r.calibration))*180/Math.PI).toFixed(0)+'°'},
      {label:'狙/重伤',value:(b.def.sniperDamage*e.heatMultiplier).toFixed(1)+'/'+(7.8*e.heatMultiplier).toFixed(1)}
    ];}
  };
})(typeof window!=='undefined'?window:globalThis);
