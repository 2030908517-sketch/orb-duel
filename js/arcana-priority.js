(function(root){
 'use strict';const G=root.OrbDuel;
 // Protection belongs to Arcana effects. Armor, immunity and absence remain separate facts.
 const P=G.Priority={
  current:null,
  protected(b){return !!b.arcana;},
  armored(b){if(!b||b.hp<=0)return false;return !!G.LaserBlade?.active(b)||b.type==='normal'&&['blink','punch','punchRecovery'].includes(b.arcana?.phase)||b.type==='ranger'&&b.arcana?.phase==='counterCharge';},
  attackLevel(h,e){return e.mode==='arcana'&&(h.priority==='arcana'||/^arc[A-Z]/.test(h.kind||'')||h.prison)?1:0;},
  shieldPacket(h,e){const u=h.target.arcana;if(e.mode!=='arcana'||!u?.royalActive||u.royalShield<=0)return h;const rank=h.shatterShield?2:h.bypassShield?1:0;if(!rank)return h;const reduced=this.attackLevel(h,e)?rank-1:0;return {...h,bypassShield:reduced>=1,shatterShield:false};},
  protectedEntity(v,e){return e.mode==='arcana'&&(v.priority==='arcana'||!!v.hub);},
  canRemove(v,e,cause={}){return !this.protectedEntity(v,e)||cause.priority==='arcana'||['end','reset','expiry','spent','ownerDeath','rewind'].includes(cause.reason);},
  pull(owner,target,e){if(this.armored(target)||G.World.absent(target,e))return false;e.arcanaWorld.defense.returns.push({owner:owner.id,target:target.id,started:e.time,until:e.time+1.35,wallUntil:0});return true;},
  forced(b,e=this.current){if(!e||e.state!=='running'||e.ending||this.armored(b)||G.World.absent(b,e))return null;return e.arcanaWorld?.defense?.returns.find(v=>v.target===b.id&&v.until>e.time&&e.balls.some(a=>a.id===v.owner&&a.hp>0))||null;},
  force(b,dt){const e=this.current,v=this.forced(b,e);if(!v||dt<=0)return;const owner=e.balls.find(a=>a.id===v.owner),q=b.combatBounds||{left:0,right:G.Constants.width,top:0,bottom:G.Constants.height},r=b.radius;
   if(b.x<=q.left+r+.1&&b.vx>0||b.x>=q.right-r-.1&&b.vx<0||b.y<=q.top+r+.1&&b.vy>0||b.y>=q.bottom-r-.1&&b.vy<0)v.wallUntil=e.time+.1;if(e.time<v.wallUntil){v.angle=Math.atan2(b.vy,b.vx);return;}
   const speed=v.speed??(v.speed=Math.hypot(b.vx,b.vy)/(b.temporal.rate||1)||b.speed),a=v.angle??Math.atan2(b.vy,b.vx),goal=Math.atan2(owner.y-b.y,owner.x-b.x),delta=Math.atan2(Math.sin(goal-a),Math.cos(goal-a)),turn=Math.max(-4.8*dt,Math.min(4.8*dt,delta));v.angle=a+turn;b.vx=Math.cos(v.angle)*speed;b.vy=Math.sin(v.angle)*speed;
  }
 };
 if(!G.Arcana?.health||!G.DefenseArcana||!G.RangerArcana)return;
 const copy=G.Arcana.copy;G.Arcana.copy=function(type){const extra={normal:'正式执行阶段霸体，不额外无敌。',ranger:'仅奥义瞄准阶段霸体，可受伤。',shield:'专属盾抵抗普通穿盾/破盾；敌方奥义的穿盾/破盾降低一级，本体仍可受控制。',accelerator:'本体可受减速、沉默和牵引；挡位机制保留，受控时仍可升降挡。',venom:'伤害池不属于中毒，净化和沉默不能清除或暂停；本体仍可受控制。',reflector:'清算牵引不受普通净化、沉默和运动控制覆盖，霸体目标免疫牵引。'};return copy.call(this,type)+(extra[type]?' '+extra[type]:'');};
 const commit=G.Arcana.commit;G.Arcana.commit=function(b,e){const rate=b.temporal.rate,cd=b.temporal.cooldownRate;commit.call(this,b,e);if(['accelerator','venom','shield','reflector'].includes(b.type)){const now=b.temporal.rate||1;b.vx*=rate/now;b.vy*=rate/now;b.temporal.rate=rate;b.temporal.cooldownRate=cd;}};
 G.Temporal.controlImmune=function(b,e){return G.World.absent(b,e)||P.armored(b);};
 // Arcana timers are world clocks, even when ordinary actor clocks are slowed.
 const slow=G.Arcana.slow;G.Arcana.slow=function(b,e,lost){if(P.protected(b))return;return slow.call(this,b,e,lost);};
 const interrupt=G.Arcana.interrupt;G.Arcana.interrupt=function(b,e,reason){if(P.protected(b)&&['silence','control','slow','cleanse','dispel','lock','ordinary'].includes(reason))return false;return interrupt.call(this,b,e,reason);};
 const prepare=G.DefenseArcana.prepare;G.DefenseArcana.prepare=function(e,dt){P.current=e;return prepare.call(this,e,dt);};
 const brace=G.RangerArcana.brace;G.RangerArcana.brace=function(b,t,e){const result=brace.call(this,b,t,e);G.Temporal.releaseControl(b);return result;};
 const clearCages=G.Trapper.clear;G.Trapper.clear=function(e,cause={}){if(!P.canRemove({priority:'arcana'},e,cause))return false;clearCages.call(this,e);return true;};
 const clear=G.World.clearTrap;G.World.clearTrap=function(v,b,e,options={}){if(!P.canRemove(v,e,options))return false;clear.call(this,v,b,e);return true;};
 // Prediction is an Arcana right, while ordinary reflector stance remains silence-sensitive.
 const open=G.Roles.reflectorOpen;G.Roles.reflectorOpen=function(b,e,...args){if(!G.DefenseArcana.predictionReady(b,e))return open.call(this,b,e,...args);const until=b.temporal.silenceUntil;b.temporal.silenceUntil=0;try{return open.call(this,b,e,...args);}finally{b.temporal.silenceUntil=until;}};
})(typeof window!=='undefined'?window:globalThis);
