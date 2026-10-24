/* Manual-only decision adapter. Native skill executors remain authoritative. */
(function(root){
  'use strict';const G=root.OrbDuel,R=G.ManualRanger,EPS=1e-9,owners=new WeakMap(),types=['ranger','normal','vampire','trapper'];
  const A=G.ManualRoles={
    types,
    owns(b,e){const yes=!!e?.manual&&b?.id===e.manual.playerId&&['normal','vampire','trapper'].includes(b.type);if(yes)owners.set(b,e);return yes;},
    normalOwned(b){const e=owners.get(b);return b.type==='normal'&&this.owns(b,e);},
    heavyReady(b){return !!owners.get(b)?.manual.heavyReady;},
    offerPursuit(b,t,e){e.manual.pursuitOffer={target:t.id,tick:e.tick};},
    pursuitTarget(b,e){const o=e.manual.pursuitOffer,t=e.balls.find(t=>t.id===o?.target),pair=t&&e.pairs.get([b.id,t.id].sort((a,c)=>a-c).join(':'));
      if(!t||e.tick-o.tick>1||t.hp<=0||G.Ghost.phased(t)||G.World.absent(t,e)||G.Arcana.busy(b)||e.time<(b.role.nextPursuit||0)||e.time-(pair?.lastHit??-Infinity)<=.35||pair?.touching)return null;
      const d=Math.hypot(b.x-t.x,b.y-t.y),edge=b.radius+t.radius;return d>edge+.1&&d<=edge+10?t:null;},
    placement(b,e){const spec=G.Awakening.trapOptions(b);return G.Trapper.placement(b,e,spec.radius);},
    selected(b,e){return e.traps.filter(n=>n.owner===b.id&&G.Mines.valid(n,e)&&Math.hypot(n.x-e.manual.pointer.x,n.y-e.manual.pointer.y)<=n.radius+10).sort((a,c)=>Math.hypot(a.x-e.manual.pointer.x,a.y-e.manual.pointer.y)-Math.hypot(c.x-e.manual.pointer.x,c.y-e.manual.pointer.y)||a.id-c.id)[0]||null;},
    canSwap(b,n,e){return !!n&&e.time+EPS>=b.mechanism.nextSwap&&b.mechanism.lastSubstituteTick!==e.tick&&G.Trapper.legal(n,b.radius,e,b)&&G.Trapper.spaced(b,e,b,n);},
    chainReady(b,e){const t=G.World.targetFor(b,e),a=b.awakening;return !!t&&G.Awakening.active(b)&&!G.VampireHunt.busy(b)&&!a.chainActive&&!b.role.chainWarning&&e.time+EPS>=a.nextCast&&b.role.blood>=.5&&Math.hypot(t.x-b.x,t.y-b.y)<=220;},
    waveReady(b,e){const u=b.arcana;return u?.phase==='bloodTide'&&u.emitted<u.waveCount&&e.time+EPS>=u.nextWave&&e.time<=u.manualWaveDeadline+EPS;},
    arcanaUpdate(b,t,e){if(!this.owns(b,e)||!['normal','vampire'].includes(b.type))return false;const u=b.arcana;
      if(u.phase==='idle'){
        if(b.type==='normal'&&!u.used&&G.Awakening.active(b)&&b.hp<b.maxHp*.1&&b.charges<3&&t&&!G.Arcana.protected(t,e,b.type)){b.charges=3;e.signal(b,'绝境拳势 · 奥义就绪','ready');}
        return true; // Readiness never grants the AI permission to start a player skill.
      }
      if(b.type!=='normal'||u.phase!=='warning')return false;
      const target=e.balls.find(t=>t.id===u.target&&t.hp>0&&G.World.enemy(b,t,e));
      if(e.time<u.until-.12&&target&&!G.World.absent(target,e)){u.aim=G.World.aim(b,target,1050,Math.max(0,u.until-e.time)+.08);u.anchor=G.Awakening.predict(target,Math.max(0,u.until-e.time)+.13);}
      if(e.time+EPS>=u.until){
        if(!target||G.World.absent(target,e)||!G.Arcana.blink(b,target,e)){
          G.Arcana.commit(b,e);b.charges=0;e.manual.heavyReady=false;u.returnAngle=Math.atan2(b.vy,b.vx);G.Pursuit.interrupt(b);G.Arcana.punch(b,null,e);
        }else e.manual.heavyReady=false;
      }return true;
    }
  };
  const M=G.ManualControl={...R,
    attach(e,clock){const m=R.attach(e,clock);m.heavyReady=false;m.pursuitOffer=null;A.owns(this.player(e),e);return m;},
    sync(e){const m=R.sync(e);m.heavyReady??=false;m.pursuitOffer??=null;A.owns(this.player(e),e);return m;},
    blocked(e,ordinary=false,arcana=false){this.sync(e);const b=this.player(e);if(b?.type==='ranger')return R.blocked(e,ordinary,arcana);const m=e.manual;
      if(!m||!b||e.state!=='running'||e.ending||e.timeRewind?.active||b.hp<=0)return true;
      const c=m.clock;if(c&&(c.stopRemaining>EPS||c.stopSeen!==e.hitStopSerial&&e.hitStopDuration>0))return true;
      if(b.kineticCycle?.side==='target'&&!(arcana&&G.Priority?.armoredArcana(b))||G.World.absent(b,e)&&!G.VampireArcana.active(b))return true;
      return ordinary&&(G.Temporal.silenced(b,e)||G.Arcana.busy(b)||G.VampireHunt.busy(b));
    },
    point(e,x,y){if(this.blocked(e))return false;e.manual.pointer={x,y};return true;},
    ready(e){const b=this.player(e);if(b?.type==='ranger')return R.ready(e);const u=b?.arcana;if(!u||u.used||!G.Awakening.active(b)||b.hp>b.maxHp*G.Arcana.ratio)return false;
      if(b.type==='trapper')return ['idle','trapReady'].includes(u.phase);
      if(u.phase!=='idle'||G.VampireHunt.busy(b)||b.awakening.chainActive||b.role.chainWarning||b.role.pursuitUntil>e.time)return false;
      const t=e.balls.find(t=>G.World.enemy(b,t,e)&&t.hp>0);if(!t)return false;
      return b.type==='normal'?b.charges>=3:!G.Arcana.protected(t,e,b.type)&&b.role.blood>=3;
    },
    primary(e,probe=false){if(this.player(e)?.type==='ranger')return R.fire(e,probe);if(this.blocked(e))return false;const b=this.player(e);
      if(b.type==='vampire'&&G.VampireArcana.active(b)){if(!A.waveReady(b,e))return false;const t=e.balls.find(t=>G.World.enemy(b,t,e)&&t.hp>0);if(!t)return false;if(probe)return true;G.VampireArcana.spawn(b,t,e,{...e.manual.pointer});return true;}
      if(this.blocked(e,true))return false;
      if(b.type==='normal'){const t=A.pursuitTarget(b,e);if(!t)return false;if(probe)return true;G.Pursuit.perform(b,t,e);e.manual.pursuitOffer=null;return true;}
      if(b.type==='vampire'){const t=G.World.targetFor(b,e);if(!G.VampireHunt.ready(b,t,e))return false;if(probe)return true;G.VampireHunt.begin(b,t,e,this.angle(b,e,true));return true;}
      if(b.type==='trapper'){if(e.time+EPS<b.nextTrap)return false;const p=A.placement(b,e);if(!p)return false;if(probe)return true;const placed=G.World.placeTrap(b,e);if(placed===false)return false;b.nextTrap=e.time+G.Awakening.trapOptions(b).period;return true;}
      return false;
    },
    secondary(e,probe=false){if(this.player(e)?.type==='ranger')return R.switch(e,probe);if(this.blocked(e,true))return false;const b=this.player(e);
      if(b.type==='normal'){if(b.charges<3||e.manual.heavyReady)return false;if(probe)return true;e.manual.heavyReady=true;return true;}
      if(b.type==='vampire'){if(!A.chainReady(b,e))return false;if(probe)return true;G.Roles.startChain(b,e);return true;}
      if(b.type==='trapper'){const n=A.selected(b,e);if(!A.canSwap(b,n,e))return false;if(probe)return true;G.Trapper.swap(b,n,e);return true;}return false;
    },
    ultimate(e,probe=false){if(this.blocked(e,false,true))return false;const b=this.player(e);if(b.type==='ranger')return R.ultimate(e,probe);
      if(b.type==='trapper'&&e.manual.armed){if(probe)return true;e.manual.armed=false;G.Trapper.arcanaUpdate(b,e);return true;}
      if(!this.ready(e))return false;if(probe)return true;if(b.type==='trapper'){e.manual.armed=true;G.Trapper.arcanaUpdate(b,e);return true;}
      const t=e.balls.find(t=>G.World.enemy(b,t,e)&&t.hp>0);G.Arcana.start(b,t,e);return true;
    },
    fire(e,probe=false){return this.primary(e,probe);},switch(e,probe=false){return this.secondary(e,probe);},
    info(e){if(this.player(e)?.type==='ranger')return R.info(e);const b=this.player(e),u=b.arcana;return {ready:this.ready(e),used:!!u?.used,armed:e.manual.armed,phase:u?.phase,blocked:this.blocked(e),message:e.manual.message};},
    panel(e){const b=this.player(e),s=this.info(e),t=e.time,r=b.role,fmt=v=>Math.max(0,v-t).toFixed(1)+'s',fields=[];
      if(b.type==='normal')fields.push({label:'拳势',value:b.charges+'/3'},{label:'追击CD',value:fmt(r.nextPursuit||0)},{label:'追击机会',value:A.pursuitTarget(b,e)?'可按左键追击':r.pursuitUntil>t?'回身追击中':'等待真实擦肩'},{label:'重击准备',value:e.manual.heavyReady?'已准备 · 下次有效碰撞':'右键准备（需满拳势）'});
      if(b.type==='vampire'){const u=b.arcana;fields.push({label:'追猎状态',value:G.VampireHunt.status(b,e)},{label:'追猎条件',value:G.VampireHunt.ready(b,G.World.targetFor(b,e),e)?'左键可施放':'需连续3秒无自身血印等原条件'},{label:'血能',value:r.blood.toFixed(1)+'/8'},{label:'血契',value:r.chainWarning?'预警':b.awakening.chainActive?'连接中':!G.Awakening.active(b)?'未觉醒':fmt(b.awakening.nextCast)},{label:'血契条件',value:A.chainReady(b,e)?'右键可施放':'需觉醒、范围与血能等原条件'},{label:'血海阶段',value:G.VampireArcana.active(b)?({bloodLiquefy:'液化',bloodTide:'血潮猎杀',bloodReverse:'万血逆流',bloodRebirth:'猩红重生',bloodFinale:'终场回流'}[u.phase]||'执行中'):'未释放'},{label:'血浪',value:G.VampireArcana.active(b)?(u.waveCount-u.emitted)+'道未用 · '+(A.waveReady(b,e)?'左键可释放':u.phase==='bloodTide'?fmt(u.nextWave):'等待阶段'):'仅血海期间可用'});}
      if(b.type==='trapper'){const n=A.selected(b,e);fields.push({label:'机关数量',value:e.traps.filter(n=>n.owner===b.id).length+'/'+G.Awakening.trapOptions(b).cap},{label:'布置CD',value:fmt(b.nextTrap)},{label:'布置位置',value:A.placement(b,e)?'本体位置 · 可布置':'本体附近节点过密或位置受限'},{label:'置换CD',value:fmt(b.mechanism.nextSwap)},{label:'选中机关',value:n?'#'+n.id+(A.canSwap(b,n,e)?' · 可置换':' · 暂不可置换'):'无'},{label:'奥义待命',value:e.manual.armed?'开启 · 碰撞时触发':'关闭'});}
      if(s.blocked)fields.push({label:'输入限制',value:e.state==='paused'?'已暂停':e.state==='ready'?'尚未开始':'时停、收招或原有动作限制'});else if(G.Temporal.silenced(b,e))fields.push({label:'输入限制',value:'沉默 · 普通技能禁用，奥义保留'});
      fields.push({label:'奥义操作',value:s.used?'已消耗':s.armed?'待命中 · 双键取消':s.ready?'左右同时按':G.Arcana.busy(b)?'释放中':'等待原有解锁条件'});
      return {fields,controls:b.type==='normal'?'左键：擦肩追击 · 右键：准备重击 · 左右同按：奥义':b.type==='vampire'?(G.VampireArcana.active(b)?'血海期间：鼠标指定目标位置 · 左键释放血浪':'左键：定向追猎 · 右键：血契 · 左右同按：血海'):'左键：本体位置布雷 · 右键：选中节点置换 · 左右同按：奥义待命开关'};
    }
  };
  const status=G.Arcana.status;G.Arcana.status=function(b,e){if(A.owns(b,e)&&b.type==='trapper'&&!b.arcana.used&&!e.manual.armed&&M.ready(e))return {label:'奥义',value:'就绪 · 待命关闭'};return status.call(this,b,e);};
  const direct=G.Aim.direct;G.Aim.direct=function(b,t,e,key,...args){if(A.owns(b,e)&&b.type==='vampire'&&key==='hunt')return M.angle(b,e,true);return direct.call(this,b,t,e,key,...args);};
  const begin=G.VampireArcana.begin;G.VampireArcana.begin=function(b,t,e){const result=begin.call(this,b,t,e);if(A.owns(b,e))b.arcana.manualWaveDeadline=b.arcana.started+.65+.56*(b.arcana.waveCount-1);return result;};
  const substitute=G.Trapper.substitute;G.Trapper.substitute=function(b,t,d,e){const result=substitute.call(this,b,t,d,e);if(A.owns(b,e))e.manual.armed=false;return result;};
})(typeof window!=='undefined'?window:globalThis);
