(function(root){
 'use strict';const G=root.OrbDuel,C=G.Constants,PI=Math.PI,TAU=PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
 const W=G.Wind={
  config:{hp:118,arcHp:238,damage:8.5,speed:218,first:1.2,period:3.8,warning:.38,lock:.12,frontSpeed:510,frontReach:440,frontHalf:108,frontWidth:12,frontDamage:7,frontPush:115,laneLife:4.8,laneWidth:34,windForce:225,laneForce:150,bodyCap:1.18,shotForce:650,shotTurn:2.0,shearDamage:1.8,crossDamage:2.6,shearCD:.8,crossSpeed:260,pressDamage:1.5,pressPush:80,vortexFirst:.7,vortexPeriod:8.5,vortexDamage:2.1,},
  fresh(){return {nextFront:this.config.first,nextVortex:this.config.vortexFirst,phase:'idle',aim:0,age:0,serial:0,main:null,lanes:[],fronts:[],vortex:null,shearReady:{},storm:null,stats:{fronts:0,frontHits:0,shearHits:0,windDamage:0,bent:0,press:0}};},
  state(b){return b.wind||(b.wind=this.fresh());},
  clear(a,b,e,r=0){return G.ArenaWalls.clear(a,b,e,r)&&G.Mines.freeLine(a,b,e);},
  owners(e){return e.balls.filter(b=>b.type==='wind'&&b.hp>0&&b.wind&&!G.World.absent(b,e));},
  canMove(b,e){return b.hp>0&&!G.World.absent(b,e)&&!G.Ghost.phased(b)&&!G.Physics.armored(b)&&!G.Priority?.forced(b,e)&&!G.Demon?.frozen(b,e)&&!G.Awakening.dashing(b,e)&&!b.motionSpeed&&!b.magnetic.anchored&&!G.Charge?.flowing(b)&&!G.HolySeals?.casting(b,e)&&!G.HolySeals?.rooted(b,e);},
  segment(p,a,z){const dx=z.x-a.x,dy=z.y-a.y,d=dx*dx+dy*dy||1,q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1),x=a.x+q*dx,y=a.y+q*dy;return {x,y,d:Math.hypot(p.x-x,p.y-y),nx:dx/Math.sqrt(d),ny:dy/Math.sqrt(d)};},
  laneAt(p,l){let best={d:Infinity,nx:Math.cos(l.angle),ny:Math.sin(l.angle),x:l.points[0].x,y:l.points[0].y};for(let i=1;i<l.points.length;i++){const v=this.segment(p,l.points[i-1],l.points[i]);if(v.d<best.d)best=v;}return best;},
  choose(b,t,e){const s=this.state(b);let reason='导流进攻',angle=G.World.aim(b,t,this.config.frontSpeed,.2),threat=null;
   for(const p of e.projectiles){if(!this.flyer(p)||!G.World.enemy(p.owner,b,e))continue;const dx=b.x-p.x,dy=b.y-p.y,vx=p.vx-b.vx,vy=p.vy-b.vy,v2=vx*vx+vy*vy;if(!v2)continue;const at=clamp((dx*vx+dy*vy)/v2,0,.75),gap=Math.hypot(dx-vx*at,dy-vy*at);if(gap<b.radius+(p.radius||4)+14&&(!threat||at<threat.at))threat={p,at};}
   if(threat){const p=threat.p,a=Math.atan2(p.vy,p.vx),cross=(b.x-p.x)*(-Math.sin(a))+(b.y-p.y)*Math.cos(a);angle=a+(cross>=0?-PI/2:PI/2);reason='横风截弹';}
   else {const dx=t.x-b.x,dy=t.y-b.y,d=Math.hypot(dx,dy)||1,closing=-(t.vx*dx+t.vy*dy)/d;if(closing>220&&d<190){angle=Math.atan2(dy,dx);reason='逆风迎击';}}
   return {angle,reason};
  },
  fx(b,e,style,p=b,extra={}){e.effects.push({kind:'wind',style,owner:b.id,x:p.x,y:p.y,angle:b.wind?.aim||0,age:0,life:.4,...extra});},
  begin(b,t,e){const s=this.state(b),choice=this.choose(b,t,e);s.phase='warning';s.age=0;s.aim=choice.angle;s.reason=choice.reason;s.warning=choice.reason==='横风截弹'?.22:this.config.warning;s.serial++;e.sound('windGather',b.x);},
  release(b,e){const s=b.wind,c=this.config;s.phase='idle';s.nextFront=c.period;s.main={angle:s.aim,started:e.time,until:e.time+c.period+c.warning+.2};s.stats.fronts++;
   const front={id:e.nextWorldId++,x:b.x,y:b.y,angle:s.aim,at:e.time,travel:0,previous:0,hit:[],half:c.frontHalf,reach:c.frontReach,width:c.frontWidth,raw:c.frontDamage*e.heatMultiplier,bend:G.Awakening.active(b)&&s.vortex?.until>e.time?(s.serial%2?1:-1)*.24:0};
   front.reach=Math.min(front.reach,G.ArenaWalls.hit(b.x,b.y,Math.cos(s.aim),Math.sin(s.aim),0,e).distance,e.mode==='2v2'?G.Team.rayLimit(b.x,b.y,Math.cos(s.aim),Math.sin(s.aim),0,e.obstacles):Infinity);front.points=[{x:b.x,y:b.y}];s.fronts.push(front);const lane={id:front.id,angle:s.aim,points:front.points,at:e.time,until:e.time+c.laneLife};s.lanes.push(lane);s.lanes=s.lanes.slice(-3);e.sound('windFront',b.x);this.fx(b,e,'release',b,{angle:s.aim,life:.45});
  },
  update(b,dt,e){const s=this.state(b);if(!dt||e.state!=='running'||e.ending)return;if(G.Temporal.silenced(b,e))return;if(G.Arcana.busy(b))return;
   const cd=G.Constants.dt*(b.temporal.cooldownRate??b.temporal.rate??1);if(G.HolySeals?.ordinary(b,e))return;s.nextFront=Math.max(0,s.nextFront-cd);if(G.Awakening.active(b)&&!s.vortex)s.nextVortex=Math.max(0,s.nextVortex-cd);
   const t=G.World.targetFor(b,e);if(!t)return;
   if(s.phase==='warning'){s.age+=dt;if(s.age<(s.warning||this.config.warning)-Math.min(this.config.lock,(s.warning||this.config.warning)*.33)){const desired=this.choose(b,t,e);s.aim+=clamp(turn(s.aim,desired.angle),-4.6*dt,4.6*dt);s.reason=desired.reason;}if(s.age>=(s.warning||this.config.warning))this.release(b,e);}
   else if(s.nextFront<=1e-8)this.begin(b,t,e);
   if(G.Awakening.active(b)&&!s.vortex&&s.nextVortex<=1e-8)this.spawnVortex?.(b,t,e);
  },
  vector(owner,p,e,ordinaryOnly=false){const s=owner.wind,c=this.config;let x=0,y=0;const friendly=p===owner||p.team!==undefined&&e.mode==='2v2'&&p.team===owner.team;
   if(s.main&&s.main.until>e.time&&this.clear(owner,p,e)){const a=s.main.angle,f=friendly?.22:1;x+=Math.cos(a)*c.windForce*f;y+=Math.sin(a)*c.windForce*f;}
   for(const l of s.lanes){const q=this.laneAt(p,l);if(q.d<c.laneWidth&&this.clear(q,p,e)){const f=(1-q.d/c.laneWidth)*c.laneForce*(friendly?.3:1);x+=q.nx*f;y+=q.ny*f;}}
   if(!ordinaryOnly&&this.extraVector){const v=this.extraVector(owner,p,e);x+=v.x;y+=v.y;}
   return {x,y};
  },
  applyBall(b,dt,e){if(this.drive?.(b,dt,e))return;if(!e||!this.canMove(b,e))return;const owners=this.owners(e);if(!owners.length)return;let ax=0,ay=0;for(const o of owners){const v=this.vector(o,b,e);ax+=v.x;ay+=v.y;}const a=Math.hypot(ax,ay);if(!a)return;const k=Math.min(1,1000/a)*dt*(b.temporal?.rate??1),old=Math.hypot(b.vx,b.vy);b.vx+=ax*k;b.vy+=ay*k;const n=Math.hypot(b.vx,b.vy),cap=Math.min(800,Math.max(old,b.speed*this.config.bodyCap*(b.temporal?.rate??1)));if(n>cap){b.vx*=cap/n;b.vy*=cap/n;}b.inertia=Math.max(b.inertia,.12);},
  flyer(p){return !p.noWind&&!p.noMagnet&&p.priority!=='arcana'&&!p.arcanaOwner&&!['arcBlood','arcPierce','boomerang','blade','comet'].includes(p.mode)&&['shot','counter','venom','shard','timeClock'].includes(p.mode||'timeClock')&&Number.isFinite(p.vx)&&Number.isFinite(p.vy);},
  flyers(e,dt){const os=this.owners(e);if(!os.length)return;for(const p of [...e.projectiles,...e.timeClocks]){if(!p.mode&&Number.isFinite(p.angle)&&Number.isFinite(p.speed)){p.vx=Math.cos(p.angle)*p.speed;p.vy=Math.sin(p.angle)*p.speed;}if(!this.flyer(p)||p.expires<=e.time||p.windTick===e.tick||p.stoppedUntil>e.time||p.windStoppedUntil>e.time||p.shieldPauseUntil>e.time)continue;p.windTick=e.tick;let ax=0,ay=0;for(const o of os){if(!G.World.enemy(o,p.owner,e))continue;const v=this.vector(o,p,e);ax+=v.x;ay+=v.y;if(v.x||v.y){p.windOwners??=[];if(!p.windOwners.includes(o.id)){p.windOwners.push(o.id);o.wind.stats.bent++;}}}const v=Math.hypot(p.vx,p.vy);if(v<1)continue;const limit=this.config.shotForce/this.config.windForce,a=Math.atan2(p.vy+ay*dt*limit,p.vx+ax*dt*limit),old=Math.atan2(p.vy,p.vx),next=old+clamp(turn(old,a),-this.config.shotTurn*dt,this.config.shotTurn*dt),speed=clamp(Math.hypot(p.vx+ax*dt*limit,p.vy+ay*dt*limit),v*.995,Math.max(v,(p.windBaseSpeed??(p.windBaseSpeed=v))*1.18));p.vx=Math.cos(next)*speed;p.vy=Math.sin(next)*speed;p.speed=speed;if(p.angle!==undefined)p.angle=next;}}
  ,packet(b,t,e,kind,raw,p,extra={}){e.pendingAttacks.push({source:b,target:t,kind,raw,point:{x:p.x,y:p.y},...extra});},
  frontPoint(f,y,d=f.travel){const bend=f.bend*Math.sin(d/f.reach*PI)*60;return {x:f.x+Math.cos(f.angle)*(d-y*y/300)-Math.sin(f.angle)*(y+bend),y:f.y+Math.sin(f.angle)*(d-y*y/300)+Math.cos(f.angle)*(y+bend)};},
  world(e,dt){for(const b of e.balls.filter(v=>v.type==='wind')){const s=this.state(b);if(b.hp<=0||G.World.absent(b,e)||e.ending||e.state==='ended'){s.fronts=[];s.lanes=[];s.vortex=s.storm=s.main=null;continue;}
    this.beforeWorld?.(b,e,dt);s.lanes=s.lanes.filter(l=>l.until>e.time);if(s.main?.until<=e.time)s.main=null;if(s.vortex?.until<=e.time)s.vortex=null;
    for(const f of s.fronts){f.previous=f.travel;f.travel=Math.min(f.reach,f.travel+this.config.frontSpeed*dt);const center=this.frontPoint(f,0);if(f.points.length<2||Math.hypot(center.x-f.points.at(-1).x,center.y-f.points.at(-1).y)>12)f.points.push(center);
     for(const t of e.balls){if(!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||f.hit.includes(t.id))continue;const dx=t.x-f.x,dy=t.y-f.y,lateral=-dx*Math.sin(f.angle)+dy*Math.cos(f.angle)-f.bend*Math.sin(f.travel/f.reach*PI)*60,forward=dx*Math.cos(f.angle)+dy*Math.sin(f.angle)+lateral*lateral/300;
      if(Math.abs(lateral)>f.half+t.radius||forward<f.previous-f.width-t.radius||forward>f.travel+f.width+t.radius)continue;const q=this.frontPoint(f,clamp(lateral,-f.half,f.half));if(!this.clear({x:f.x,y:f.y},q,e)||!this.clear(q,t,e))continue;f.hit.push(t.id);this.packet(b,t,e,'windFront',f.raw,q,{angle:f.angle,windPush:this.config.frontPush});}
    }s.fronts=s.fronts.filter(f=>f.travel<f.reach);
    const v=s.vortex;
    for(const t of e.balls){if(!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||G.Ghost.phased(t))continue;let cut=false,strong=false,point=t;
     for(const l of s.lanes){const q=this.laneAt(t,l);if(q.d>this.config.laneWidth+t.radius*.35||!this.clear(q,t,e))continue;const cross=Math.abs(t.vx*q.ny-t.vy*q.nx),different=s.main&&Math.abs(turn(l.angle,s.main.angle))>.5;if(different||cross>this.config.crossSpeed){cut=true;strong=cross>this.config.crossSpeed;point=q;break;}}
     if(cut&&e.time>=(s.shearReady[t.id]||0)){s.shearReady[t.id]=e.time+this.config.shearCD;this.packet(b,t,e,'windShear',(strong?this.config.crossDamage:v?this.config.vortexDamage:this.config.shearDamage)*e.heatMultiplier,point,{angle:s.main?.angle||v?.angle||0});}
    }
    this.stormWorld(b,e,dt);
   }this.flyers(e,dt);},
  hit(b,h,e){if(h.actual+h.blocked<=0||h.avoided||!h.kind.startsWith('wind'))return;const s=this.state(b);s.stats.windDamage+=h.actual;if(h.kind==='windFront')s.stats.frontHits++;if(h.kind==='windShear'||h.kind==='windStorm')s.stats.shearHits++;
   if(h.windPush&&!G.Physics.armored(h.target)&&this.canMove(h.target,e)){h.target.vx+=Math.cos(h.angle)*h.windPush;h.target.vy+=Math.sin(h.angle)*h.windPush;h.target.inertia=.55;G.Physics.limit(h.target);}
   this.fx(b,e,h.kind==='windFinal'?'finalHit':h.kind==='windShear'||h.kind==='windStorm'?'shearHit':'frontHit',h.point||h.target,{angle:h.angle||0,life:.34});e.sound(h.kind==='windFinal'?'windFinalHit':h.kind==='windShear'||h.kind==='windStorm'?'windCutHit':'windPressureHit',h.target.x);if(h.kind==='windFront'||h.kind==='windFinal')e.hitStop(h.kind==='windFinal'?.065:.03);
  },
  press(b,h,e){if(h.kind!=='contact'||h.actual+h.blocked<=0||h.avoided||G.Temporal.silenced(b,e))return;const v=this.vector(b,h.target,e),n=Math.hypot(v.x,v.y);if(n<150)return;const a=Math.atan2(v.y,v.x),s=this.state(b);s.stats.press++;this.fx(b,e,'press',h.target,{angle:a,life:.4});if(this.canMove(h.target,e)){h.target.vx+=Math.cos(a)*this.config.pressPush;h.target.vy+=Math.sin(a)*this.config.pressPush;h.target.inertia=.35;G.Physics.limit(h.target);}if(h.impact&&(v.x*h.impact.nx+v.y*h.impact.ny)>80)G.Combat.resolveBatch([{source:b,target:h.target,kind:'windPress',raw:this.config.pressDamage*e.heatMultiplier,angle:a,point:{x:h.target.x,y:h.target.y}}],e);},
  startStorm(b,t,e){return G.WindTempest?.start(b,t,e);},
  arcana(b,t,e,dt){const u=b.arcana;if(!u)return;const s=this.state(b);if(u.phase==='idle'){if(!u.used&&G.Awakening.active(b)&&b.hp<=b.maxHp*.3&&t&&G.HolySeals?.canStart(b,e)!==false&&!G.Demon?.frozen(b,e)&&!G.World.absent(b,e)){this.startStorm(b,t,e);}return;}
   if(u.phase==='windTide'){if(!s.storm||b.hp<=0||e.ending||e.time>=u.until){G.Arcana.finish(b,e);}return;}
  },
  stormWorld(b,e,dt){return G.WindTempest?.world(b,e,dt);},
  status(b,e){const s=this.state(b),a=s.main?.angle||s.aim;return [{label:'锋面CD',value:s.phase==='warning'?'预警 '+Math.max(0,(s.warning||this.config.warning)-s.age).toFixed(2)+'s':s.nextFront.toFixed(1)+'s'},{label:'主风向',value:s.main?Math.round((a*180/PI+360)%360)+'°':'待导流'},{label:'决策',value:s.reason||'待观察'},{label:'巡风CD',value:G.Awakening.active(b)?s.vortex?'常驻':s.nextVortex.toFixed(1)+'s':'未觉醒'},{label:'气流伤',value:s.stats.windDamage.toFixed(1)},{label:'锋面命中',value:s.stats.frontHits+'/'+s.stats.fronts}];}
 };
 G.Types=Object.freeze({...G.Types,wind:Object.freeze({name:'驭风球',color:'#9ee7ce',symbol:'≋',hp:W.config.hp,damage:W.config.damage,speed:W.config.speed,maxSpeed:W.config.speed,mass:1,skill:'主风向·导流锋面',description:'宽弧锋面真实扫击，留下强化风道并改变主风向。气流持续偏转小球与普通实体弹，不吹动激光、固定机关或受保护奥义弹。交汇风向与高速横穿触发风切；碰撞顺势压风。自身受风影响较轻。',advantage:'轨迹干预与风切',weakness:'有预警，激光不受偏转'})});
 G.Awakening.defs.wind={name:'巡风·游走气旋',description:'唯一常驻气旋游走、卷持并切线甩敌，本体经过可弹射；锋面与风道继续原规则。'};
 G.Skills.wind={update:(b,dt,e)=>W.update(b,dt,e),onHit:(b,h,e)=>{W.hit(b,h,e);W.press(b,h,e);},status:(b,e)=>W.status(b,e)};
 if(G.Arcana.health){G.Arcana.health.wind=W.config.arcHp;G.Arcana.defs.wind={name:'风暴天灾·万流归潮',raw:11};}
 G.StatusPanel.priority.wind=['锋面CD','主风向','巡风CD','决策','气流伤','锋面命中'];
 const reset=G.Engine.prototype.reset;G.Engine.prototype.reset=function(...args){const result=reset.apply(this,args);for(const b of this.balls)if(b.type==='wind')b.wind=W.fresh();return result;};
 const world=G.World.update;G.World.update=function(e,dt){W.world(e,dt);return world.call(this,e,dt);};
 const copy=G.Arcana.copy;G.Arcana.copy=function(type){return type==='wind'?'奥义 · 风暴天灾·万流归潮：觉醒后生命≤30%，每局一次。巨型风墙过境，旧风道喷流，气旋折流与本体开闸；无新增无敌，沉默不影响奥义。':copy.call(this,type);};
 const status=G.Arcana.status;G.Arcana.status=function(b,e){if(b.type!=='wind')return status.call(this,b,e);const u=b.arcana;if(!u)return null;return {label:'奥义',value:u.phase==='windTide'?['风暴酝酿','万流过境','余流重构'][b.wind.storm?.stage||0]+' '+Math.max(0,u.until-e.time).toFixed(1)+'s':u.used?'已使用':!G.Awakening.active(b)?'待觉醒':b.hp>b.maxHp*.3?'≤30%解锁':'就绪'};};
 // The shared delay API expects absolute timestamps. Adapt remaining actor clocks without duplicating its rules.
 const waiting=G.Temporal.waitingAttacks;G.Temporal.waitingAttacks=function(b,e){const rows=waiting.call(this,b,e);if(b.type!=='wind')return rows;const s=W.state(b),proxy={};for(const key of ['nextFront','nextVortex'])Object.defineProperty(proxy,key,{get(){return e.time+s[key];},set(value){s[key]=Math.max(0,value-e.time);}});if(s.nextFront>1e-8||s.phase==='warning')rows.push([proxy,'nextFront']);if(G.Awakening.active(b)&&s.nextVortex>1e-8)rows.push([proxy,'nextVortex']);return rows;};
 const interrupt=G.Temporal.interrupt;G.Temporal.interrupt=function(b,e,...args){if(b.type==='wind'){b.wind.phase='idle';b.wind.age=0;}return interrupt.call(this,b,e,...args);};
 const finish=G.Arcana.finish;G.Arcana.finish=function(b,e){if(b.type==='wind'&&b.wind)b.wind.storm=null;return finish.call(this,b,e);};
 if(G.TimeRewind){const cooldowns=G.TimeRewind.cooldowns;G.TimeRewind.cooldowns=function(b,e){const r=cooldowns.call(this,b,e);if(b.type==='wind'){b.wind=W.fresh();b.wind.nextFront=W.config.period;b.wind.nextVortex=W.config.vortexFirst;}return r;};
 const rewind=G.TimeRewind.trigger;G.TimeRewind.trigger=function(e){const r=rewind.call(this,e);if(r)for(const b of e.balls)if(b.wind){b.wind.fronts=[];b.wind.lanes=[];b.wind.vortex=b.wind.storm=b.wind.main=null;}return r;};}
 const end=G.Engine.prototype.checkEnd;G.Engine.prototype.checkEnd=function(...args){const r=end.apply(this,args);if(this.ending||this.state==='ended')for(const b of this.balls)if(b.wind){b.wind.fronts=[];b.wind.lanes=[];b.wind.vortex=b.wind.storm=b.wind.main=null;}return r;};
 if(G.TimeDelete){const threat=G.TimeDelete.threat;G.TimeDelete.threat=function(b,e){const native=threat.call(this,b,e);if(native)return native;for(const o of W.owners(e)){if(!G.World.enemy(o,b,e))continue;for(const f of o.wind.fronts){if(f.hit.includes(b.id))continue;const t=G.Awakening.predict(b,.05),dx=t.x-f.x,dy=t.y-f.y,side=-dx*Math.sin(f.angle)+dy*Math.cos(f.angle),forward=dx*Math.cos(f.angle)+dy*Math.sin(f.angle)+side*side/300;if(Math.abs(side)<f.half+b.radius&&forward>=f.travel-f.width-b.radius&&forward<=Math.min(f.reach,f.travel+W.config.frontSpeed*.1)+f.width+b.radius&&W.clear({x:f.x,y:f.y},t,e))return {kind:'windFront',at:.05,x:t.x,y:t.y};}}return null;};}
 if(G.TeamEngine){const endTeam=G.TeamEngine.prototype.checkEnd;G.TeamEngine.prototype.checkEnd=function(...args){const r=endTeam.apply(this,args);if(this.ending||this.state==='ended')for(const b of this.balls)if(b.wind){b.wind.fronts=[];b.wind.lanes=[];b.wind.vortex=b.wind.storm=b.wind.main=null;}return r;};}
 const snapshot=G.Engine.prototype.snapshot;G.Engine.prototype.snapshot=function(){const s=snapshot.call(this);for(const b of this.balls)if(b.wind){const row=s.balls.find(v=>v.id===b.id);if(row)row.wind=structuredClone(b.wind);}return s;};
})(typeof window!=='undefined'?window:globalThis);
