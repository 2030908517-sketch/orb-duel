(function(root){
 'use strict';const G=root.OrbDuel,H=G.Holy,A=G.HolyAngel,P=G.HolyAngelMotion,M=P.math;
 const T=G.HolyThrow={
  config:Object.freeze({brandLife:7,wind:.82,lock:.15,release:.14,detach:.09,recovery:.42,damage:15,speed:1050,push:110,radius:6}),
  world(e){return e.holyWorld;},
  brands(e){return e.holyWorld?.brands||[];},
  brand(b,t,e,group){const w=this.world(e);w.brands??=[];w.brandGroups??={};const key=b.id+':'+t.id;if(w.brandGroups[key]===group)return;w.brandGroups[key]=group;let m=w.brands.find(v=>v.owner===b.id&&v.target===t.id);if(!m){m={id:e.nextWorldId++,owner:b.id,target:t.id};w.brands.push(m);}Object.assign(m,{until:e.time+this.config.brandLife,group});A.event(b,{id:0},e,'brand',null,t,{life:.42});},
  target(b,z,e){return this.brands(e).filter(m=>m.owner===b.id&&m.until>e.time).map(m=>({m,t:e.balls.find(t=>t.id===m.target)})).filter(v=>v.t&&G.World.enemy(b,v.t,e)&&G.World.targetable(v.t,e)&&!G.Ghost.phased(v.t)&&A.clear(z,v.t,e)).sort((a,c)=>Math.hypot(a.t.x-z.x,a.t.y-z.y)-Math.hypot(c.t.x-z.x,c.t.y-z.y))[0];},
  begin(b,z,p,e){const s=A.state(z);if(!A.formed(z,e)||s.attackSpent)return false;const from=P.motion(z,s.facing??0);Object.assign(s,{throwFrom:from});Object.assign(s,{phase:'holyThrow',elapsed:0,target:p.t.id,brandId:p.m.id,castId:e.nextWorldId++,locked:false,thrown:false,angle:Math.atan2(p.t.y-z.y,p.t.x-z.x),previousPose:null});A.event(b,z,e,'throwPrepare','angelLanceCharge',z,{life:this.config.wind,castId:s.castId});},
  release(b,z,e){const s=z.angel;if(s.thrown||s.attackSpent||!A.formed(z,e))return false;const q=this.config,rig=P.sample(z,e),arm=rig.arms.spear,length=P.weaponLength(z,arm,'spear'),a=s.angle,grip={x:z.x+rig.offset.x+arm.grip.x*rig.size,y:z.y+rig.offset.y+arm.grip.y*rig.size},tip={x:grip.x+Math.cos(a)*length*A.config.spearTip,y:grip.y+Math.sin(a)*length*A.config.spearTip};
   e.holyWorld.brands=this.brands(e).filter(m=>m.id!==s.brandId);s.thrown=true;s.attackSpent=true;s.spearAbsent=true;s.spearReturn=0;
   // The flying hit shape starts exactly at the physical spearhead, not at the angel centre.
   if(A.clear(grip,tip,e)&&tip.x>=q.radius&&tip.x<=G.Constants.width-q.radius&&tip.y>=q.radius&&tip.y<=G.Constants.height-q.radius)e.projectiles.push({id:e.nextWorldId++,owner:b.id,mode:'holyLance',x:tip.x,y:tip.y,originX:tip.x,originY:tip.y,vx:Math.cos(a)*q.speed,vy:Math.sin(a)*q.speed,speed:q.speed,radius:q.radius,angle:a,range:Math.hypot(G.Constants.width,G.Constants.height)+60,travel:0,raw:q.damage*e.heatMultiplier,heat:e.heatMultiplier,color:b.def.color,bounces:0,maxBounces:0,expires:e.time+1.1,lanceLength:length,history:[]});
   A.event(b,z,e,'throwRelease','angelLanceRelease',grip,{life:.24,angle:a,castId:s.castId});},
  update(b,z,e,dt){const s=A.state(z),q=this.config;if(G.Demon?.frozen(b,e))return;const motion=dt*(b.temporal.rate??1);s.blessPending=0;s.cooldown=Math.max(0,s.cooldown-dt*(b.temporal.cooldownRate??1));
   if(G.Temporal.silenced(b,e)||G.World.absent(b,e)){s.phase='idle';s.elapsed=0;s.cooldown=Math.max(s.cooldown,.2);return;}
   if(A.danger(b,e)&&A.guard(b,e))return;
   s.elapsed+=motion;const target=e.balls.find(t=>t.id===s.target),mark=this.brands(e).find(m=>m.id===s.brandId&&m.until>e.time);
   if(!s.thrown&&(!mark||!target||target.hp<=0||G.World.absent(target,e))){s.phase='idle';s.cooldown=A.config.gap;return;}
   if(!s.locked&&s.elapsed<q.wind-q.lock&&target){const pose=P.sample({...z,angel:{...s,elapsed:q.wind+q.detach}},e),hand=pose.arms.spear.grip,origin={x:z.x+pose.offset.x+hand.x*pose.size,y:z.y+pose.offset.y+hand.y*pose.size};A.aim(b,{...z,x:origin.x,y:origin.y,angel:s},target,e,Math.hypot(target.x-origin.x,target.y-origin.y)/q.speed+q.lock,motion);}
   if(s.elapsed>=q.wind-q.lock)s.locked=true;
   const desired=.36*Math.cos(s.angle);s.facing=(s.facing??0)+M.clamp(desired-(s.facing??0),-2*motion,2*motion);
   if(!s.thrown&&s.elapsed>=q.wind+q.detach)this.release(b,z,e);
   if(s.thrown&&s.elapsed>q.wind+q.release+.08)s.spearReturn=Math.min(1,(s.spearReturn||0)+motion/.30);
   if(s.elapsed>=q.wind+q.release+q.recovery){s.phase='idle';s.cooldown=A.config.gap;s.spearAbsent=false;s.spearReturn=1;}
  },
  hit(h,e){const b=h.source;if(!b?.holy)return;const light=h.kind==='holyJudgement'||h.kind==='holyTouch'&&(e.holyWorld?.lights||[]).some(l=>l.kind==='judgement'&&l.group===h.holyGroup);if(light&&G.Awakening.active(b)&&h.actual+h.blocked>0&&!h.avoided)this.brand(b,h.target,e,h.holyGroup??'step:'+e.tick);
   if(h.kind!=='holyLance')return;const t=h.target,solid=h.actual>0,blocked=h.blocked>0;if(!solid&&!blocked)return;
   b.holy.lightHits++;for(const burn of e.holyWorld.burns||[])if(burn.target===t.id&&burn.until>e.time)burn.until+=2;
   if(solid){A.event(b,{id:0},e,'lanceHit','angelLanceHit',t,{life:.42,angle:h.angle});G.Roles.shove(t,h.angle,this.config.push,.6);if(b.holy.lanceStopTick!==e.tick){b.holy.lanceStopTick=e.tick;e.hitStop(.045);}}else A.event(b,{id:0},e,'blocked',null,t,{life:.24,angle:h.angle});if(solid){const number=e.effects.findLast(f=>f.kind==='text'&&f.damageTarget===t.id);if(number){number.strong=true;number.color='#fff0b4';}}
  },
  motion(z,face,rest){const s=z.angel,q=this.config,t=s.elapsed,wind=M.ease(t/q.wind),release=M.ease((t-q.wind)/q.release),back=M.ease((t-q.wind-q.release)/q.recovery),raised={x:.22,y:-.61,z:-.10},shoulder={x:.25,y:-.015,z:0},end=M.add(shoulder,M.mul(P.direction(s.angle,.15,face),.56));
   const from=s.throwFrom;if(from){const u=M.ease(t/.24),shoulder={x:-.25,y:-.015,z:0},upper=M.norm(M.mix(M.norm(M.sub(from.elbows.sword,shoulder)),M.norm(M.sub(rest.elbows.sword,shoulder)),u)),fore=M.norm(M.mix(M.norm(M.sub(from.hands.sword,from.elbows.sword)),M.norm(M.sub(rest.hands.sword,rest.elbows.sword)),u));rest.elbows.sword=M.add(shoulder,M.mul(upper,.305));rest.hands.sword=M.add(rest.elbows.sword,M.mul(fore,.305));}
   rest.hands.spear=t<q.wind?M.mix(from?.hands.spear??rest.hands.spear,raised,wind):t<q.wind+q.release?M.mix(raised,end,release):M.mix(end,rest.hands.spear,back);
   const raisedAngle=Math.cos(s.angle)>=0?-.18:-Math.PI+.18;rest.angles.spear=t<q.wind?M.angleMix(from?.angles.spear??rest.angles.spear,raisedAngle,wind):t<q.wind+q.release?M.angleMix(raisedAngle,s.angle,M.ease((t-q.wind)/.06)):M.angleMix(s.angle,rest.angles.spear,back);
   rest.twist=t<q.wind?(from?.twist||0)*(1-wind)-.28*wind:t<q.wind+q.release?-.28+.55*release:.27*(1-back);rest.lean=t<q.wind?(from?.lean||0)*(1-wind)-.025*wind:t<q.wind+q.release?-.025+.145*release:.12*(1-back);return rest;
  }
 };
 const update=A.updateZone;A.updateZone=function(b,z,e,dt){const s=this.state(z);if(e.state!=='running'||e.ending)return;if(!this.formed(z,e)){s.blessPending=0;return;}if(s.spearAbsent&&(s.phase!=='holyThrow'||!s.thrown)&&!G.Demon?.frozen(b,e)){s.spearReturn=Math.min(1,(s.spearReturn||0)+dt*(b.temporal.rate??1)/.30);if(s.spearReturn>=1)s.spearAbsent=false;}if(s.phase==='holyThrow')return T.update(b,z,e,dt);
  if(!s.attackSpent&&(['idle','bless'].includes(s.phase)||['sword','spear'].includes(s.phase)&&!s.locked)&&s.cooldown<=1e-8&&G.Awakening.active(b)&&!G.Temporal.silenced(b,e)&&!G.Demon?.frozen(b,e)&&!G.World.absent(b,e)&&!A.danger(b,e)){const p=T.target(b,z,e);if(p){T.begin(b,z,p,e);return;}}return update.call(this,b,z,e,dt);};
 const target=A.target;A.target=function(b,z,e){return this.state(z).attackSpent?null:target.call(this,b,z,e);};
 const motion=P.motion;P.motion=function(z,face){const rest=motion.call(this,z,face);return z.angel.phase==='holyThrow'?T.motion(z,face,rest):rest;};
 const interrupt=H.interrupt;H.interrupt=function(b,e,...rest){const casting=e.holyWorld?.zones.some(z=>z.owner===b.id&&z.angel?.phase==='holyThrow');return interrupt.call(this,b,e,...rest)||casting;};
 const reset=H.reset;H.reset=function(e){reset.call(this,e);if(e.holyWorld){e.holyWorld.brands=[];e.holyWorld.brandGroups={};}};
 const hit=H.hit;H.hit=function(h,e){hit.call(this,h,e);T.hit(h,e);};
 const world=H.updateWorld;H.updateWorld=function(e,dt){world.call(this,e,dt);if(!e.holyWorld||e.state!=='running'||e.ending)return;e.holyWorld.brands=T.brands(e).filter(m=>m.until>e.time&&e.balls.some(b=>b.id===m.owner&&b.hp>0)&&e.balls.some(b=>b.id===m.target&&b.hp>0&&!G.World.absent(b,e)));};
 const retire=H.retire;H.retire=function(b,e){retire.call(this,b,e);if(e.holyWorld)e.holyWorld.brands=T.brands(e).filter(m=>m.owner!==b.id);};
 const cleanse=G.Roles.cleanse;G.Roles.cleanse=function(b,e,...rest){if(e.holyWorld)e.holyWorld.brands=T.brands(e).filter(m=>m.target!==b.id);return cleanse.call(this,b,e,...rest);};
 const snapshot=H.snapshotWorld;H.snapshotWorld=function(w){return {...snapshot.call(this,w),brands:(w.brands||[]).map(m=>({...m})),brandGroups:{...w.brandGroups}};};
 const collect=G.OrbMarkers.collect;G.OrbMarkers.collect=function(b,e){const rows=collect.call(this,b,e);for(const m of T.brands(e))if(m.target===b.id&&m.until>e.time)rows.marks.push({owner:b.id,key:'holyBrand'+m.owner,shape:'holyBrand',color:'#fff1bd',active:true,alpha:G.Ghost.phased(b)?.4:1});return rows;};
 const skillStatus=H.status;H.status=function(b,e){const rows=skillStatus.call(this,b,e),s=e.holyWorld?.zones.find(z=>z.owner===b.id)?.angel;const row=rows.find(r=>r.label==='天使');if(row&&s?.phase==='holyThrow')row.value=s.thrown?'投枪收招':'举枪蓄势';else if(row&&s?.attackSpent&&!['guard','bless'].includes(s.phase))row.value='守望（已投枪）';return rows;};
 const status=G.StatusPanel.collect;G.StatusPanel.collect=function(b,e){const rows=status.call(this,b,e);for(const m of T.brands(e))if(m.target===b.id&&m.until>e.time)rows.push('神圣烙印 '+(m.until-e.time).toFixed(1)+'s');if(b.holy&&e.holyWorld?.zones.some(z=>z.owner===b.id&&z.angel?.phase==='holyThrow'))rows.push('天使 · 圣枪投掷');return rows;};
})(typeof window!=='undefined'?window:globalThis);
