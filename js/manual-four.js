/* Additional manual actors: input decisions only; native executors own combat. */
(function(root){
  'use strict';const G=root.OrbDuel,M=G.ManualControl,A=G.ManualRoles,C=G.Constants,EPS=1e-9;
  const F=G.ManualFour={
    types:['venom','laser','boomerang','time'],
    owns(b,e){return !!e?.manual&&b?.id===e.manual.playerId&&this.types.includes(b.type);},
    chord(b){return ['laser','boomerang'].includes(b.type);},
    automatic(b){return ['venom','time'].includes(b.type);},
    track(b,e,key,rate,dt=C.dt){const tracks=b.role.aimTracks??={},p=e.manual.pointer;let a=tracks[key];if(!a)a=tracks[key]={angle:Math.atan2(b.vy,b.vx),tick:-1};if(a.tick!==e.tick){const control=G.Venom?.aimControl(b,e)||{rate:1,offset:0};a.angle=G.Aim.turn(a.angle,Math.atan2(p.y-b.y,p.x-b.x)+control.offset,rate*control.rate*dt);a.tick=e.tick;}return a.angle;},
    target(b,e){return e.balls.find(t=>G.World.enemy(b,t,e)&&t.hp>0);},
    domainPoint(b,e){const p=b.role.aimTracks?.['point:domain'];return p?{x:p.x,y:p.y}:{...e.manual.pointer};},
    domainLegal(b,p){const q=b.combatBounds||{left:0,right:C.width,top:0,bottom:C.height};return Number.isFinite(p.x+p.y)&&p.x>=q.left&&p.x<=q.right&&p.y>=q.top&&p.y<=q.bottom;},
    laserReady(b,e){return !b.laser&&!b.role.jetActive&&!b.role.bladePhase&&!e.beams.some(v=>v.owner===b.id)&&e.time+EPS>=b.role.coolingUntil&&b.role.capacitor+EPS>=1;},
    bladeReady(b,e,mode){const t=G.World.targetFor(b,e),s=b.character.bladeHunt||{plan:null,swing:null};if(!t||e.time+EPS<b.nextShot||b.character.bladeRemaining||s.swing||G.BladeDance.active(b))return false;
      if(!G.Awakening.active(b))return mode==='throw';const p=G.Awakening.predict(t,.58),far=Math.hypot(p.x-b.x,p.y-b.y)>G.BladeHunt.config.awakeRange;return mode==='relay'?far:mode==='cross'&&!far;},
    chaseBlade(b,e){const s=b.character.bladeHunt||{plan:null,swing:null};if(G.Awakening.active(b)||s.plan?.mode!=='chase'||b.inertia>0||b.magnetic?.anchored||G.Priority?.forced(b,e))return null;return e.projectiles.find(p=>p.owner===b.id&&p.castId===s.plan.id&&p.bladeHunt&&p.returning&&!p.bladeDisposed&&G.BladeHunt.clear(b,p,e,b.radius))||null;},
    relayAim(b,p,e){return G.Aim.adjust(b,e,'manualRelay',Math.atan2(e.manual.pointer.y-p.y,e.manual.pointer.x-p.x));},
    jetFollow(b,e){for(const t of e.balls){if(!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||G.Arcana.immuneTarget(t,e))continue;const aim=G.LaserBlade.followAim(b,t,e);if(G.LaserBlade.canFollow(b,t,e,aim)){b.role.bladeAvailable=true;break;}}},
    arcanaReady(b,e){const u=b.arcana;if(!u||u.used||u.phase!=='idle'||!G.Awakening.active(b)||b.hp>b.maxHp*G.Arcana.ratio||!this.target(b,e))return false;
      if(b.type==='laser')return !b.laser&&!b.role.jetActive&&!b.role.bladePhase&&!e.beams.some(v=>v.owner===b.id);
      return b.type==='boomerang'&&!b.character.bladeRemaining;
    },
    primary(b,e,probe=false){const target=G.World.targetFor(b,e);if(!target)return false;
      if(b.type==='venom'){const next=b.role.nextSpit??e.time+G.Venom.config.spitFirstDelay;if(!probe)b.role.nextSpit??=next;if(e.time+EPS<next)return false;if(probe)return true;b.role.spitAim=G.Aim.track(b,target,e,'venom',b.def.spitSpeed,0,4,C.dt*b.temporal.rate);G.Flyers.poisonFire(b,target,e);return true;}
      if(b.type==='laser'){if(!this.laserReady(b,e))return false;if(probe)return true;G.Aim.track(b,target,e,'laser',Infinity,0,6.5,C.dt*b.temporal.rate);G.Roles.laserPrepare(b,target,e);return true;}
      if(b.type==='boomerang'){const awake=G.Awakening.active(b),mode=awake?'cross':'throw';if(!this.bladeReady(b,e,mode))return false;if(probe)return true;G.BladeHunt.cast(b,target,e,awake?'cross':null,M.angle(b,e,true));return true;}
      if(b.type==='time'){const s=b.temporal;if(!G.Awakening.active(b))return false;const next=Number.isFinite(s.nextClock)?s.nextClock:e.time+.6;if(!probe&&!Number.isFinite(s.nextClock))s.nextClock=next;if(s.castAt||e.time+EPS<next)return false;if(probe)return true;const angle=G.Aim.track(b,target,e,'clock',b.def.clockSpeed,.35,6,C.dt*b.temporal.rate);G.Temporal.startClock(b,e,angle);return true;}
      return false;
    },
    secondary(b,e,probe=false){
      if(b.type==='venom'){if(e.time+EPS<b.nextPool)return false;if(probe)return true;G.World.pool(b,e);b.nextPool=e.time+G.Venom.config.poolPeriod;return true;}
      if(b.type==='laser'){const r=b.role;if(!r.bladeAvailable||b.laser||r.bladePhase||r.jetActive||e.beams.some(v=>v.owner===b.id)||G.Priority?.forced(b,e))return false;if(probe)return true;G.LaserBlade.form(b,e.manual.pointer,e,M.angle(b,e,true));return true;}
      if(b.type==='boomerang'){if(G.Awakening.active(b)){if(!this.bladeReady(b,e,'relay'))return false;if(probe)return true;G.BladeHunt.cast(b,G.World.targetFor(b,e),e,'relay',M.angle(b,e,true));return true;}const p=this.chaseBlade(b,e);if(!p||e.manual.chaseCast===G.BladeHunt.state(b).plan.id)return false;if(probe)return true;e.manual.chaseCast=G.BladeHunt.state(b).plan.id;return true;}
      if(b.type==='time'){const s=b.temporal;if(e.time+EPS<s.nextDomain)return false;const t=G.World.targetFor(b,e);if(!t)return false;const actor=probe?{...b,role:{...b.role,aimTracks:Object.fromEntries(Object.entries(b.role.aimTracks||{}).map(([k,v])=>[k,{...v}]))}}:b;const p=G.Aim.point(actor,t,e,'domain',e.manual.pointer,C.dt*b.temporal.rate);if(!this.domainLegal(b,p))return false;if(probe)return true;G.Temporal.startDomain(b,e,p);return true;}return false;
    },
    middle(b,e,probe=false){
      if(b.type==='laser'){const r=b.role,next=r.jetNext??e.time+1.5;if(!probe)r.jetNext=next;if(!G.Awakening.active(b)||r.jetActive||r.bladePhase||e.time+EPS<next||e.beams.some(v=>v.owner===b.id)||G.Priority?.forced(b,e))return false;const t=G.LaserBlade.bodyThreat(b,e),route=t&&G.LaserBlade.jetRoute(b,t,e);return !!route&&(probe||G.LaserBlade.startJet(b,t,route,e));}
      if(b.type==='boomerang'){const s=probe?(b.character.bladeHunt||{}):G.BladeHunt.state(b);if(s.swing||b.character.bladeRemaining||b.character.catchUntil<=e.time)return false;if(probe)return true;return G.BladeHunt.startSwing(b,e.manual.pointer,e,false);}return false;
    },
    panel(b,e){const r=b.role,c=b.character,s=b.temporal,awake=G.Awakening.active(b),fmt=v=>Number.isFinite(v)?Math.max(0,v-e.time).toFixed(1)+'s':'未就绪',fields=[];let controls='';
      if(b.type==='venom'){const v=G.VenomArcana.state(b);fields.push({label:'毒液弹CD',value:fmt(r.nextSpit??e.time+G.Venom.config.spitFirstDelay)},{label:'毒池CD',value:fmt(b.nextPool)},{label:'毒池数量',value:e.pools.filter(p=>p.owner===b.id).length},{label:'缓蚀伤害池',value:(v?.pool||0).toFixed(1)},{label:'自动奥义',value:G.Arcana.status(b,e)?.value||'等待原条件'});controls='左键：定向毒液弹 · 右键：本体位置毒池 · 毒雾/奥义：原机制自动触发';}
      if(b.type==='laser'){fields.push({label:'电容',value:Math.round(r.capacitor*100)+'%',progress:r.capacitor},{label:'主炮',value:G.LaserBlade.active(b)?'奥义执行中':r.jetActive?'短喷中 · 暂停充能':r.bladePhase?'挥刃中 · 暂停充能':b.laser?(b.laser.locked?'锁定':'瞄准预警')+' '+fmt(b.laser.fireAt):e.beams.some(v=>v.owner===b.id)?'持续扫射':this.laserReady(b,e)?'待发 · 左键启动预警':r.coolingUntil>e.time?'散热 '+fmt(r.coolingUntil):'充能中'},{label:'光刃机会',value:r.bladePhase?'挥刃中':r.bladeAvailable?'1次 · 右键使用':'0次 · 主炮/有效反切后获得'},{label:'短喷CD',value:!awake?'未觉醒':r.jetActive?'侧移中':fmt(r.jetNext??e.time+1.5)},{label:'免费短喷',value:r.jetFree?'本次免费':'无'},{label:'奥义',value:G.Arcana.status(b,e)?.value||'等待原条件'});controls='左键：主炮预警/发射 · 右键：近身光刃 · 中键：短喷 · 左右同按：奥义';}
      if(b.type==='boomerang'){const state=b.character.bladeHunt||{plan:null,swing:null};fields.push({label:'投刃CD',value:fmt(b.nextShot)},{label:'飞刃',value:c.bladeRemaining?'在外 '+c.bladeRemaining:'手中'},{label:'已接回',value:c.caughtInCast||0},{label:'重斩机会',value:c.catchUntil>e.time?(c.catchPower>=1.4?'双刃':'单刃')+' · '+fmt(c.catchUntil):state.swing?'挥斩中':'无'},{label:'当前操作',value:awake?'左近斩 / 右极限弹射':'左投刃 / 右逐刃'},{label:'追刃',value:awake?'觉醒后不再逐刃':e.manual.chaseCast&&e.manual.chaseCast===state.plan?.id?'已启动':this.chaseBlade(b,e)?'右键可启动':'等待原返程条件'},{label:'奥义',value:G.Arcana.status(b,e)?.value||'等待原条件'});controls=awake?'左键：近距交错斩 · 右键：远距弹射 · 中键：接刃重斩 · 左右同按：奥义':'左键：投掷飞刃 · 右键：逐刃追猎 · 中键：接刃重斩 · 左右同按：奥义';}
      if(b.type==='time'){fields.push({label:'时钟CD',value:!awake?'未觉醒':s.castAt?'预警 '+fmt(s.castAt):fmt(s.nextClock)},{label:'领域CD',value:fmt(s.nextDomain)},{label:'领域中心',value:this.domainLegal(b,this.domainPoint(b,e))?'合法 · 右键确认':'位置越界'},{label:'领域数量',value:e.timeDomains.filter(d=>d.owner===b.id).length},{label:'自动奥义',value:G.Arcana.status(b,e)?.value||'首次致死自动触发'});controls='左键：定向飞行时钟（觉醒后） · 右键：鼠标位置时间领域 · 领域回溯/救命奥义自动';}
      if(M.blocked(e))fields.push({label:'输入限制',value:e.state==='ready'?'尚未开始':e.state==='paused'?'已暂停':'原有时停或动作限制'});else if(G.Temporal.silenced(b,e))fields.push({label:'输入限制',value:'沉默 · 普通技能禁用，奥义保留'});return {fields,controls};
    }
  };
  A.types.push(...F.types);const owns=A.owns;A.owns=function(b,e){return F.owns(b,e)||owns.call(this,b,e);};
  const primary=M.primary,secondary=M.secondary,ready=M.ready,ultimate=M.ultimate,panel=M.panel,arcana=A.arcanaUpdate;
  M.primary=function(e,probe=false){const b=this.player(e);if(!F.owns(b,e))return primary.call(this,e,probe);if(this.blocked(e,true))return false;return F.primary(b,e,probe);};
  M.secondary=function(e,probe=false){const b=this.player(e);if(!F.owns(b,e))return secondary.call(this,e,probe);if(this.blocked(e,true))return false;return F.secondary(b,e,probe);};
  M.middle=function(e,probe=false){if(this.blocked(e,true))return false;return F.middle(this.player(e),e,probe);};
  M.ready=function(e){const b=this.player(e);return F.owns(b,e)?F.arcanaReady(b,e):ready.call(this,e);};
  M.ultimate=function(e,probe=false){const b=this.player(e);if(!F.owns(b,e))return ultimate.call(this,e,probe);if(this.blocked(e)||!F.arcanaReady(b,e))return false;if(probe)return true;const t=F.target(b,e);if(b.type==='laser')G.LaserBlade.beginArcana(b,t,e);else if(b.type==='boomerang')G.BladeDance.begin(b,t,e);else return false;return true;};
  M.panel=function(e){const b=this.player(e);return F.owns(b,e)?F.panel(b,e):panel.call(this,e);};
  A.arcanaUpdate=function(b,t,e,dt){if(F.owns(b,e)){if(b.type==='laser'){if(G.LaserBlade.active(b))G.LaserBlade.arcanaUpdate(b,t||F.target(b,e),e,dt);return true;}if(b.type==='boomerang'&&!G.BladeDance.active(b))return true;}return arcana.call(this,b,t,e,dt);};
  const track=G.Aim.track;G.Aim.track=function(b,t,e,key,speed,delay,rate,dt,...rest){if(F.owns(b,e)&&['venom','laser','clock'].includes(key))return F.track(b,e,key,rate,dt);return track.call(this,b,t,e,key,speed,delay,rate,dt,...rest);};
  const point=G.Aim.point;G.Aim.point=function(b,t,e,key,desired,dt){return point.call(this,b,t,e,key,F.owns(b,e)&&b.type==='time'&&key==='domain'?e.manual.pointer:desired,dt);};
  const adjust=G.Aim.adjust;G.Aim.adjust=function(b,e,key,desired,dt){if(F.owns(b,e)&&b.type==='boomerang'&&!G.BladeDance.active(b)&&key==='blade')desired=Math.atan2(e.manual.pointer.y-b.y,e.manual.pointer.x-b.x);return adjust.call(this,b,e,key,desired,dt);};
  const status=G.Arcana.status;G.Arcana.status=function(b,e){if(F.owns(b,e)&&['laser','boomerang'].includes(b.type)&&b.arcana?.phase==='idle'&&!b.arcana.used&&F.arcanaReady(b,e))return {label:'奥义',value:'就绪 · 左右同按'};return status.call(this,b,e);};
})(typeof window!=='undefined'?window:globalThis);
