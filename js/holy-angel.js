(function(root){
 'use strict';const G=root.OrbDuel,H=G.Holy,C=G.Constants,TAU=Math.PI*2,EPS=1e-8;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const A=G.HolyAngel={
  config:Object.freeze({formation:.65,figureScale:.52,swordLength:.56,spearLength:.95,swordWrist:.55,spearTip:.65,minInside:.5,areaSamples:256,swordDamage:3,spearDamage:4.2,swordWind:.26,swordSwing:.16,spearWind:.30,spearLock:.08,spearThrust:.11,recovery:.22,gap:.32,swordArc:2.6,guardCD:6.5,guardLife:1.15,guardRelease:.12,guardOpen:.75,guardLead:.12,guardReduction:.30,waveSpeed:440,waveWidth:9,push:175,healPerSecond:1.1}),
  formed(z,e){return e.time+EPS>=z.started+this.config.formation;},
  size(z){return G.HolyAngelMotion.size(z);},
  state(z){return z.angel||(z.angel={phase:'idle',next:'sword',elapsed:0,cooldown:0,guardCD:0,angle:0,hitIds:[],blessed:0,swings:0,thrusts:0,hits:0,facing:0});},
  clear(a,b,e){return G.Mines.freeLine(a,b,e);},
  inside(z,b){return distance(z,b)<=z.radius+EPS;},
  insideArea(z){const n=this.config.areaSamples,left=Math.max(0,z.x-z.radius),right=Math.min(C.width,z.x+z.radius);if(right<=left||z.radius<=0)return 0;let sum=0;for(let i=0;i<n;i++){const x=left+(i+.5)*(right-left)/n,h=Math.sqrt(Math.max(0,z.radius*z.radius-(x-z.x)**2));sum+=Math.max(0,Math.min(C.height,z.y+h)-Math.max(0,z.y-h));}return sum*(right-left)/n/(Math.PI*z.radius*z.radius);},
  event(b,z,e,style,cue,p=z,extra={}){const id=e.nextWorldId++;e.effects.push({kind:'holyAngel',style,id,owner:b.id,x:p.x,y:p.y,color:b.def.color,age:0,life:.36,...extra});if(cue){e.sound(cue,p.x);const s=e.soundEvents.at(-1);if(s)s.presentationId='angel:'+id;}G.Presentation?.note(e,'holy.angel.'+style,{castId:extra.castId??id,actorId:b.id,zone:z.id,x:p.x,y:p.y});},
  burn(b,t,e){const w=e.holyWorld;let burn=w.burns.find(v=>v.owner===b.id&&v.target===t.id&&v.until>e.time);if(burn)burn.until=Math.max(burn.until,e.time+b.def.burnLife);else w.burns.push({owner:b.id,target:t.id,until:e.time+b.def.burnLife,nextTick:e.time+b.def.burnInterval,nextExtendFx:0});},
  guard(b,e){if(G.HolySeals?.defense(b,e))return false;if(!b?.holy||b.hp<=0||e.ending||e.state!=='running'||G.World.absent(b,e)||G.Demon?.frozen(b,e)||G.Temporal.silenced(b,e))return false;
   const z=e.holyWorld?.zones.find(v=>v.owner===b.id&&v.expires>e.time&&this.inside(v,b)&&this.clear(v,b,e));if(!z||!this.formed(z,e))return false;const s=this.state(z);if((b.holy.angelGuardCD||0)>EPS||s.phase==='guard')return false;
   b.holy.angelGuardCD=this.config.guardCD;
   Object.assign(s,{phase:'guard',elapsed:0,guardCD:this.config.guardCD,hitIds:[],target:null});
   s.waveReleased=false;s.guardX=b.x;s.guardY=b.y;s.guardOpenAt=Math.max(this.config.guardOpen,this.config.guardRelease+(z.radius+distance(b,z)+this.config.waveWidth)/this.config.waveSpeed);s.guardLife=Math.max(this.config.guardLife,s.guardOpenAt+.4);
   this.event(b,z,e,'guard','angelGuard',b,{life:this.config.guardLife,scale:this.size(z)});return true;
  },
  guarded(b,e){return !!b?.holy&&!G.World.absent(b,e)&&(e.holyWorld?.zones||[]).some(z=>z.owner===b.id&&z.expires>e.time&&z.angel?.phase==='guard'&&z.angel.elapsed<(z.angel.guardOpenAt??this.config.guardOpen)&&this.inside(z,b)&&this.clear(z,b,e));},
  vulnerable(b,e){return b.hp>0&&!G.World.absent(b,e)&&!G.Ghost.phased(b)&&!G.Arcana?.immune(b)&&!G.VampireArcana?.immune(b)&&!G.Awakening.dashing(b,e);},
  approaching(b,p){const x=p.x-b.x,y=p.y-b.y,vx=(p.vx??Math.cos(p.angle||0)*(p.speed||0))-(b.vx||0),vy=(p.vy??Math.sin(p.angle||0)*(p.speed||0))-(b.vy||0),a=vx*vx+vy*vy,dot=x*vx+y*vy,r=b.radius+(p.radius||5)+2,disc=dot*dot-a*(x*x+y*y-r*r);return a>1&&dot<0&&disc>=0&&Math.max(0,(-dot-Math.sqrt(disc))/a)<=this.config.guardLead;},
  danger(b,e){if(!this.vulnerable(b,e))return false;
   for(const t of e.balls)if(G.World.enemy(b,t,e)&&G.World.targetable(t,e)&&!G.Ghost.phased(t)&&!G.Arcana?.noContact(t)&&!G.Charge?.flowing(t)&&this.clear(b,t,e)&&this.approaching(b,t))return true;
   for(const p of [...e.projectiles,...e.timeClocks])if(G.World.enemy(b,p.owner,e)&&p.expires>=e.time&&G.Flyers.physical(p)&&!(p.mode==='arcBlood'&&!p.launched)&&this.clear(b,p,e)&&this.approaching(b,p))return true;
   for(const h of e.pendingAttacks)if(h.target===b&&h.raw>0&&h.source?.hp>0&&G.World.enemy(b,h.source,e))return true;
   return false;
  },
  target(b,z,e){const preferred=G.World.targetFor(b,e);return e.balls.filter(t=>G.World.enemy(b,t,e)&&G.World.targetable(t,e)&&!G.Ghost.phased(t)&&this.inside(z,t)&&this.clear(z,t,e)).sort((a,c)=>(a===preferred?-1:c===preferred?1:distance(z,a)-distance(z,c)))[0];},
  aim(b,z,t,e,lead,dt){const p=G.Awakening.predict(t,lead),desired=Math.atan2(p.y-z.y,p.x-z.x),control=G.Venom?.aimControl(b,e)||{rate:1,offset:0};const s=this.state(z);s.angle=G.Aim.turn(s.angle,desired+control.offset,12*control.rate*dt);},
  begin(b,z,t,e){const s=this.state(z);if(!this.formed(z,e)||s.attackSpent)return false;Object.assign(s,{phase:s.next,elapsed:0,target:t.id,hitIds:[],locked:false,castId:e.nextWorldId++,previousPose:null});s.angle=Math.atan2(t.y-z.y,t.x-z.x);if(s.phase==='sword')s.swings++;else s.thrusts++;this.event(b,z,e,'prepare',s.phase==='sword'?'angelSwordReady':'angelSpearReady',z,{castId:s.castId,life:.3,weapon:s.phase});},
  pose(z,e){return G.HolyAngelMotion.weapon(z,e||{time:0});},
  sweep(b,z,e){if(!this.formed(z,e)||this.state(z).attackSpent)return;const s=this.state(z),q=this.config,p=this.pose(z,e);if(!p)return;const old=s.previousPose?.active?s.previousPose:p;s.previousPose=p;if(!p.active)return;
   for(const t of e.balls){if(s.hitIds.includes(t.id)||!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||G.Ghost.phased(t))continue;let hit=false;
    for(let i=0;i<=6&&!hit;i++){const u=i/6,point={x:(t.previousX??t.x)+(t.x-(t.previousX??t.x))*u,y:(t.previousY??t.y)+(t.y-(t.previousY??t.y))*u},a={x:old.a.x+(p.a.x-old.a.x)*u,y:old.a.y+(p.a.y-old.a.y)*u},end={x:old.b.x+(p.b.x-old.b.x)*u,y:old.b.y+(p.b.y-old.b.y)*u};if(distance(z,point)>z.radius+t.radius||!this.clear(z,point,e)||!this.clear(a,point,e))continue;hit=H.distanceToSegment(point,a,end)<=t.radius+Math.max(old.width,p.width);}
    if(hit){s.hitIds.push(t.id);e.pendingAttacks.push({source:b,target:t,kind:s.phase==='sword'?'holySword':'holySpear',raw:(s.phase==='sword'?q.swordDamage:q.spearDamage)*e.heatMultiplier,angle:s.angle,point:{x:t.x,y:t.y},angelZone:z.id,angelCast:s.castId,adaptiveId:z.adaptiveId});}
   }
  },
  updateZone(b,z,e,dt){const s=this.state(z),q=this.config;s.blessPending=0;s.guardCD=b.holy.angelGuardCD||0;if(G.Demon?.frozen(b,e))return;const motion=dt*(b.temporal.rate??1),cooldown=dt*(b.temporal.cooldownRate??1);s.cooldown=Math.max(0,s.cooldown-cooldown);const target=this.target(b,z,e),angle=['sword','spear'].includes(s.phase)?s.angle:target?Math.atan2(target.y-z.y,target.x-z.x):s.angle,desired=.36*Math.cos(angle);s.facing=(s.facing??0)+clamp(desired-(s.facing??0),-2*motion,2*motion);
   if(G.Temporal.silenced(b,e)||G.World.absent(b,e)){s.phase='idle';s.elapsed=0;s.cooldown=Math.max(s.cooldown,.2);return;}
   if(s.phase!=='guard'&&this.danger(b,e))this.guard(b,e);
   if(s.phase==='guard'){s.elapsed+=motion;if(!s.waveReleased&&s.elapsed>=q.guardRelease){s.waveReleased=true;(e.holyWorld.sanctuaryWaves||=[]).push({id:e.nextWorldId++,zone:z.id,owner:b.id,x:b.x,y:b.y,radius:0,previousRadius:0,hitIds:[],started:e.time,maxRadius:z.radius+distance(b,z)});this.event(b,z,e,'fire',null,b,{life:.3});}if(s.elapsed>=(s.guardLife??q.guardLife)){s.phase='idle';s.cooldown=Math.max(s.cooldown,.16);}return;}
   if(s.phase==='sword'||s.phase==='spear'){const wind=s.phase==='sword'?q.swordWind:q.spearWind,travel=s.phase==='sword'?q.swordSwing:q.spearThrust,old=s.elapsed;s.elapsed+=motion;const t=e.balls.find(t=>t.id===s.target);
    if(old<wind&&(s.phase==='sword'||old<wind-q.spearLock)&&t&&G.World.targetable(t,e))this.aim(b,z,t,e,s.phase==='sword'?.15:.11,motion);
    if(s.elapsed>=wind&&!s.locked){s.locked=true;this.event(b,z,e,'release',s.phase==='sword'?'angelSwordSwing':'angelSpearThrust',z,{castId:s.castId,angle:s.angle,life:travel+.15,weapon:s.phase});}
    this.sweep(b,z,e);if(s.elapsed>=wind+travel+q.recovery){s.next=s.phase==='sword'?'spear':'sword';s.phase='idle';s.cooldown=q.gap;s.previousPose=null;}return;
   }
   if(target){s.phase='idle';if(s.cooldown<=EPS)this.begin(b,z,target,e);return;}
   s.phase='idle';if(this.inside(z,b)&&this.clear(z,b,e)&&b.hp<b.maxHp){s.phase='bless';s.blessPending=q.healPerSecond*motion;s.blessTick=e.tick;}
  },
  wave(e,w,dt){const b=e.balls.find(b=>b.id===w.owner&&b.hp>0),z=e.holyWorld.zones.find(z=>z.id===w.zone);if(!b||!z)return false;w.previousRadius=w.radius;w.radius+=this.config.waveSpeed*dt;
   const touches=(p,r=0)=>{const d=distance(w,p);return d+r>=w.previousRadius-this.config.waveWidth&&d-r<=w.radius+this.config.waveWidth&&distance(z,p)<=z.radius+r&&this.clear(w,p,e);};
   for(const field of ['projectiles','timeClocks','traps']){const removed=[];e[field]=e[field].filter(p=>{if(!G.World.enemy(b,p.owner,e)||!touches(p,p.radius||5)||G.Priority&&!G.Priority.canRemove(p,e,{reason:'holyGuard'}))return true;removed.push(p);return false;});for(const p of removed){if(field==='traps')b.stats.trapsCleared++;else{G.Aim?.result(p,e,false);G.Stellar?.detach(p,e);if(p.mode==='boomerang')G.Characters.bladeRemoved(p,e.balls.find(v=>v.id===p.owner),e,false);}this.event(b,z,e,'purify','angelPurify',p,{life:.24});}}
   for(const t of e.balls){if(w.hitIds.includes(t.id)||!G.World.enemy(b,t,e)||!G.World.targetable(t,e)||G.Ghost.phased(t)||G.Awakening.dashing(t,e)||G.Arcana?.immune(t)||G.VampireArcana?.immune(t)||!touches(t,t.radius))continue;w.hitIds.push(t.id);this.burn(b,t,e);G.Roles.shove(t,Math.atan2(t.y-w.y,t.x-w.x),this.config.push,.6);this.event(b,z,e,'expel','angelExpel',t,{angle:Math.atan2(t.y-w.y,t.x-w.x),life:.28});}
   return w.radius<w.maxRadius+this.config.waveWidth;
  },
  hit(h,e){if(!['holySword','holySpear'].includes(h.kind)||h.actual+h.blocked<=0||h.avoided)return;const b=h.source,z=e.holyWorld?.zones.find(z=>z.id===h.angelZone);if(!z)return;this.state(z).hits++;b.holy.lightHits++;
   for(const burn of e.holyWorld.burns)if(burn.target===h.target.id&&burn.until>e.time){burn.until+=2;if(e.time>=burn.nextExtendFx){burn.nextExtendFx=e.time+.8;e.float(h.target.x,h.target.y-35,'灼伤 +2s',b.def.color);}}
   const solid=h.actual>0;this.event(b,z,e,solid?'hit':'blocked',solid?(h.kind==='holySword'?'angelSwordHit':'angelSpearHit'):null,h.point,{angle:h.angle,weapon:h.kind,life:.34,castId:h.angelCast});if(solid){if(b.holy.angelStopTick!==e.tick){e.hitStop(h.kind==='holySpear'?.035:.025);b.holy.angelStopTick=e.tick;}e.impact(h.point.x,h.point.y,b.def.color,h.kind==='holySpear'?1.05:.8);G.Roles.shove(h.target,h.angle,h.kind==='holySpear'?58:38,.25);}
  }
 };
 const triangle=H.triangle;H.triangle=function(a,points){const valid=triangle.call(this,a,points);if(!valid)return null;const path=[a,...points],outside=(c,p)=>distance(c,p)>c.radius+1e-6,pair=(p,q)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2,radius:distance(p,q)/2});let circle={...a,radius:0};
  for(let i=0;i<path.length;i++)if(outside(circle,path[i])){circle={...path[i],radius:0};for(let j=0;j<i;j++)if(outside(circle,path[j])){circle=pair(path[i],path[j]);for(let k=0;k<j;k++)if(outside(circle,path[k])){const c=H.circumcircle(path[i],path[j],path[k]);circle=c||[pair(path[i],path[j]),pair(path[i],path[k]),pair(path[j],path[k])].sort((a,b)=>b.radius-a.radius)[0];}}}
  circle.radius=Math.max(35,circle.radius,...path.map(p=>distance(circle,p)));return circle.radius<=Math.hypot(C.width,C.height)*.62?{...valid,...circle}:null;};
 const seal=H.seal;H.seal=function(b,e,circle){if(!circle||A.insideArea(circle)+EPS<A.config.minInside)return false;const next=e.nextWorldId;seal.call(this,b,e,circle);const z=e.holyWorld.zones.find(z=>z.owner===b.id&&z.id>=next);if(z)A.state(z);return !!z;};
 const fresh=H.fresh;H.fresh=function(){return {...fresh.call(this),angelGuardCD:0};};
 const reset=H.reset;H.reset=function(e){reset.call(this,e);if(e.holyWorld)e.holyWorld.sanctuaryWaves=[];};
 const world=H.updateWorld;H.updateWorld=function(e,dt){world.call(this,e,dt);if(e.state!=='running'||!e.holyWorld||e.ending)return;for(const b of e.balls)if(b.holy&&b.hp>0&&!G.Demon?.frozen(b,e))b.holy.angelGuardCD=Math.max(0,(b.holy.angelGuardCD||0)-dt*(b.temporal.cooldownRate??1));for(const z of e.holyWorld.zones){const b=e.balls.find(b=>b.id===z.owner&&b.hp>0);if(b)A.updateZone(b,z,e,dt);}e.holyWorld.sanctuaryWaves=(e.holyWorld.sanctuaryWaves||[]).filter(w=>A.wave(e,w,dt));};
 const hit=H.hit;H.hit=function(h,e){hit.call(this,h,e);A.hit(h,e);};
 const interrupt=H.interrupt;H.interrupt=function(b,e){let casting=interrupt.call(this,b,e);for(const z of e.holyWorld?.zones||[]){if(z.owner!==b.id||!z.angel)continue;const s=z.angel;if(['sword','spear','guard'].includes(s.phase))casting=true;s.phase='idle';s.elapsed=0;s.previousPose=null;s.cooldown=Math.max(s.cooldown,A.config.gap);}return casting;};
 // Adapt remaining-time field clocks to the existing absolute-deadline interruption API.
 const waiting=G.Temporal.waitingAttacks;G.Temporal.waitingAttacks=function(b,e){const rows=waiting.call(this,b,e);if(b.type!=='holy')return rows;const clocks=[[b.holy,'angelGuardCD'],...(e.holyWorld?.zones||[]).filter(z=>z.owner===b.id&&z.angel).map(z=>[z.angel,'cooldown'])];for(const [s,key]of clocks){if((s[key]||0)<=EPS)continue;const adapter={};Object.defineProperty(adapter,'readyAt',{get:()=>e.time+s[key],set:value=>{s[key]=Math.max(0,value-e.time);if(key==='angelGuardCD')for(const z of e.holyWorld?.zones||[])if(z.owner===b.id&&z.angel)z.angel.guardCD=s[key];}});rows.push([adapter,'readyAt']);}return rows;};
 const reduction=G.Combat.reduction;G.Combat.reduction=function(b,e){return Math.max(reduction.call(this,b,e),A.guarded(b,e)?A.config.guardReduction:0);};
 const damage=G.Combat.applyDamage;G.Combat.applyDamage=function(b,raw,e,options={}){if(b.holy&&raw>0&&!options.silent&&!options.damageReduced&&A.vulnerable(b,e))A.guard(b,e);return damage.call(this,b,raw,e,options);};
 // Commit tiny blessing after this tick's attacks: a same-tick guard cancels it.
 const resolve=G.Combat.resolveBatch;G.Combat.resolveBatch=function(packets,e,...rest){if(e.state==='running'&&!e.ending)for(const h of packets)if(h.target?.holy&&h.raw>0&&h.source?.hp>0&&G.World.enemy(h.source,h.target,e)&&A.vulnerable(h.target,e))A.guard(h.target,e);const result=resolve.call(this,packets,e,...rest);if(e.state!=='running'||e.ending)return result;for(const z of e.holyWorld?.zones||[]){const s=z.angel;if(!s?.blessPending||s.blessTick!==e.tick)continue;const b=e.balls.find(b=>b.id===z.owner&&b.hp>0),amount=s.blessPending;s.blessPending=0;if(!b||s.phase!=='bless')continue;const heal=G.HolySeals?.canHeal(b,e)===false?0:Math.min(b.maxHp-b.hp,amount);b.hp+=heal;b.stats.healing+=heal;s.blessed+=heal;}return result;};
 const retire=H.retire;H.retire=function(b,e){retire.call(this,b,e);if(b.holy)b.holy.angelGuardCD=0;if(e.holyWorld)e.holyWorld.sanctuaryWaves=(e.holyWorld.sanctuaryWaves||[]).filter(w=>w.owner!==b.id);};
 const snap=H.snapshotWorld;H.snapshotWorld=function(w){const s=snap.call(this,w);s.zones=s.zones.map(z=>({...z,angel:z.angel?JSON.parse(JSON.stringify(z.angel)):null}));s.sanctuaryWaves=(w.sanctuaryWaves||[]).map(v=>({...v,hitIds:[...v.hitIds]}));return s;};
 const status=H.status;H.status=function(b,e){const z=e.holyWorld?.zones.find(z=>z.owner===b.id),s=z&&A.state(z);return [{label:'天使',value:s?({idle:'待机',bless:'赐福',sword:'圣剑审判',spear:'圣枪审判',guard:'羽翼守护'}[s.phase]):'未成阵'},{label:'守护CD',value:(b.holy.angelGuardCD||0).toFixed(1)+'s'},...status.call(this,b,e).filter(v=>!['圣光伤','阵/裁伤'].includes(v.label))];};
 const collect=G.StatusPanel.collect;G.StatusPanel.collect=function(b,e){const rows=collect.call(this,b,e);if(b.type==='holy'&&b.hp>0){const s=e.holyWorld?.zones.find(z=>z.owner===b.id)?.angel,label=s&&{sword:'天使 · 圣剑审判',spear:'天使 · 圣枪审判',guard:'天使 · 羽翼守护',bless:'天使 · 持续赐福'}[s.phase];if(label)rows.push(label);}return rows;};
})(typeof window!=='undefined'?window:globalThis);
