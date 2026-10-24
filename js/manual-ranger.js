(function(root){
  'use strict';
  const G=root.OrbDuel,EPS=1e-9;
  const select=G.Ranger.select,update=G.Ranger.update,track=G.Aim.track,ammoMarkers=G.Ranger.ammoMarkers;
  const arcUpdate=G.RangerArcana.update,brace=G.RangerArcana.brace;
  const M=G.ManualRanger={
    attach(e,clock){e.manual={playerId:0,clock,role:e.balls[0].role,epoch:e.presentationEpoch,selected:'sniper',executing:false,armed:false,pointer:{x:G.Constants.width*.75,y:G.Constants.height*.5},message:'鼠标瞄准 · 左键三连发'};return e.manual;},
    state(b,e){return e.manual&&b.id===e.manual.playerId&&b.type==='ranger'?e.manual:null;},
    player(e){return e.balls.find(b=>b.id===e.manual?.playerId);},
    sync(e){const m=e.manual;if(m&&(m.epoch!==e.presentationEpoch||m.role!==this.player(e)?.role)){const sameRound=m.epoch===e.presentationEpoch;this.attach(e,m.clock);if(sameRound){e.manual.pointer=m.pointer;e.manual.selected=m.selected;e.manual.message='命运重启 · 手动待命与未发指令已清空';}}return e.manual;},
    blocked(e,ordinary=false,arcana=false){const m=this.sync(e),b=this.player(e);if(!m||!b||e.state!=='running'||e.ending||e.timeRewind?.active||b.hp<=0)return true;
      const clock=m.clock;if(clock&&(clock.stopRemaining>EPS||clock.stopSeen!==e.hitStopSerial&&e.hitStopDuration>0))return true;
      if(G.World.absent(b,e)||b.kineticCycle?.side==='target'&&!(arcana&&G.Priority?.armoredArcana(b)))return true;
      return ordinary&&(G.Temporal.silenced(b,e)||G.Arcana.busy(b));
    },
    angle(b,e,ordinary=true,dt=G.Constants.dt){const m=e.manual,a=Math.atan2(m.pointer.y-b.y,m.pointer.x-b.x);return ordinary?G.Aim.adjust(b,e,'manualMouse',a,dt):a;},
    point(e,x,y){if(this.blocked(e))return false;e.manual.pointer={x,y};return true;},
    weapon(e){const b=this.player(e);return G.Awakening.active(b)&&b.role.calibration>=b.def.calibrationCap?e.manual.selected:'burst';},
    switch(e,probe=false){if(this.blocked(e,true))return false;const b=this.player(e);if(!G.Awakening.active(b)){if(!probe)e.manual.message='觉醒前固定三连发';return false;}if(probe)return true;e.manual.selected=e.manual.selected==='sniper'?'scatter':'sniper';return true;},
    ready(e){const b=this.player(e),u=b?.arcana;if(!u||u.used||u.phase!=='idle'||!G.Awakening.active(b)||b.hp>b.maxHp*G.Arcana.ratio)return false;
      const t=G.World.targetFor(b,e);if(t?.type==='normal'&&['warning','blink','punch','punchRecovery'].includes(t.arcana?.phase))return false;return !!t&&!G.Arcana.protected(t,e,'ranger')&&b.role.sniperPhase==='idle'&&b.role.sniperPending===null&&!b.magnetic.anchored;},
    ultimate(e,probe=false){if(this.blocked(e,false,true)||!this.ready(e))return false;const b=this.player(e),t=G.World.targetFor(b,e),angle=this.angle(b,e,false);
      const threat={kind:'manual',id:-1,owner:t.id,angle,at:0},route=G.RangerArcana.route(b,threat,e,angle);
      if(!route){if(!probe)e.manual.message='光标方向没有合法侧闪落点';return false;}if(probe)return true;
      G.RangerArcana.begin(b,t,threat,route,e);e.manual.armed=false;e.manual.executing=false;return true;
    },
    fire(e,probe=false){if(this.blocked(e))return false;const m=e.manual,b=this.player(e),r=b.role,u=b.arcana;
      if(u?.phase==='counterCharge'){
        const target=G.World.targetFor(b,e);if(u.manualCounter==='charging'||e.time+EPS>=u.until||!target||G.Arcana.immuneTarget(target,e))return false;
        if(probe)return true;G.RangerArcana.prepareCharge(b,target,e);u.manualCounter='charging';u.aim=this.angle(b,e,false);G.RangerArcana.event(b,e,'charge','arcRangerCharge');return true;
      }
      if(this.blocked(e,true)||m.executing||r.reloadUntil>e.time+EPS||r.sniperPending!==null||e.time+EPS<b.nextShot)return false;
      if(probe)return true;
      if(r.reloadUntil){r.reloadUntil=0;} // Finished reload; selection is deferred until this click.
      r.barrelAngle=this.angle(b,e,true);m.launching=true;
      try{select.call(G.Ranger,b,e,this.weapon(e));}finally{m.launching=false;}
      m.executing=true;return true;
    },
    info(e){const m=this.sync(e),b=this.player(e),r=b.role,u=b.arcana;return {weapon:m.executing?r.fireMode:this.weapon(e),selected:m.selected,executing:m.executing,calibration:r.calibration,cap:b.def.calibrationCap,
      cooldown:Math.max(0,r.reloadUntil-e.time,b.nextShot-e.time),armed:m.armed,used:!!u?.used,ready:this.ultimate(e,true),phase:u?.phase,
      window:u?.phase==='counterCharge'&&u.manualCounter!=='charging'?Math.max(0,u.until-e.time):0,charging:u?.phase==='counterCharge'&&u.manualCounter==='charging',blocked:this.blocked(e),message:m.message};}
  };
  const arcStatus=G.Arcana.status;G.Arcana.status=function(b,e){if(M.state(b,e)&&b.arcana?.phase==='counterCharge'&&b.arcana.manualCounter==='window')return {label:'奥义',value:'穿甲待发 '+Math.max(0,b.arcana.until-e.time).toFixed(1)+'s'};return arcStatus.call(this,b,e);};
  // Adapter is loaded exclusively by manual.html; every non-player actor delegates unchanged.
  G.Aim.track=function(b,t,e,key,...args){if(M.state(b,e)){if(key==='arcPierce'&&b.arcana?.manualCounter==='charging')return M.angle(b,e,false);if(['barrel','sniper'].includes(key))return M.angle(b,e,true,args[3]??G.Constants.dt);}return track.call(this,b,t,e,key,...args);};
  G.Ranger.ammoMarkers=function(b,e){const m=M.state(b,e);if(!m)return ammoMarkers.call(this,b,e);
    // Preview the selected gun without changing the current volley, ammo, or reload timer.
    const mode=G.Awakening.active(b)?m.selected:'burst',cap=mode==='sniper'?1:3,r=b.role;
    let count=Math.min(cap,r.ammo);
    if(r.reloadUntil){const duration=r.reloadDuration||(G.Awakening.active(b)?b.def.reloadTime:b.def.baseReloadTime),progress=1-Math.max(0,r.reloadUntil-e.time)/duration;count=Math.max(0,Math.min(cap,Math.floor(progress/this.visual.reloadFill*cap+EPS)));}
    if((m.iconMode||'burst')!==mode)m.iconSwap={from:m.iconMode||'burst',fromAmmo:m.iconAmmo??Math.min(3,r.ammo),at:e.time};
    m.iconMode=mode;m.iconAmmo=count;
    const view={...b,role:{...r,fireMode:mode,ammo:count,ammoTransition:m.iconSwap||null}};
    return ammoMarkers.call(this,view,e);
  };
  G.Ranger.select=function(b,e,...args){const m=M.state(b,e);if(!m)return select.call(this,b,e,...args);
    // No AI weapon selection or attack on reload completion. The next click calls the real select.
    b.role.fireMode='burst';b.role.overload=false;b.role.round=0;b.role.ammo=3;b.nextShot=Infinity;
  };
  G.Ranger.update=function(b,dt,e){let m=M.state(b,e);if(!m)return update.call(this,b,dt,e);m=M.sync(e);
    if(m.executing){update.call(this,b,dt,e);if(b.role.reloadUntil||b.role.ammo<=0)m.executing=false;return;}
    const saved=b.nextShot;b.nextShot=Infinity;
    try{update.call(this,b,dt,e);}finally{b.nextShot=saved;}
  };
  G.RangerArcana.brace=function(b,t,e){if(!M.state(b,e))return brace.call(this,b,t,e);this.prepareCharge(b,t,e);const u=b.arcana;u.manualCounter='window';u.until=e.time+1;u.lockAt=Infinity;u.aim=M.angle(b,e,false);this.event(b,e,'brace','arcRangerBreech',b,{style:'counterWake',history:[...u.history],life:.42});};
  G.RangerArcana.update=function(b,t,e,dt){if(!M.state(b,e))return arcUpdate.call(this,b,t,e,dt);M.sync(e);const u=b.arcana;
    if(u.phase==='idle'){u.waiting='左右同按 · 沿光标侧闪';return;}
    if(u.phase==='counterCharge'&&u.manualCounter!=='charging'){u.aim=M.angle(b,e,false);if(e.time+EPS>=u.until){u.phase='counterRecovery';u.manualCounter='';u.until=e.time+.2;G.Arcana.effect(e,b,'counterFizzle',b,{angle:u.aim,life:.32});e.manual.message='穿甲窗口结束 · 奥义已消耗';}return;}
    return arcUpdate.call(this,b,t,e,dt);
  };
})(typeof window!=='undefined'?window:globalThis);
