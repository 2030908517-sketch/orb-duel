(function(root){
  'use strict';const G=root.OrbDuel;
  const O=G.Overdrive={
    config:{speeds:[365,410,460,515,575],margin:28,cooldown:.8,minSpeed:300,minTravel:42,ramp:.24},
    state:b=>b.arcana?.overdrive,active:b=>!!b.arcana?.overdrive?.active,
    ensure(b,e){if(e.mode!=='arcana'||b.type!=='accelerator'||!b.arcana)return null;return b.arcana.overdrive??={active:false,gear:0,started:0,lastShift:-Infinity,pass:{},touch:{},pending:0,path:[],events:[]};},
    activate(b,e){const s=this.ensure(b,e);if(!s||s.active||b.arcana.used)return;G.Arcana.commit(b,e);Object.assign(s,{active:true,started:e.time,from:b.speed});e.signal(b,'超速 · 极限突破','ready');this.event(b,e,'up');},
    event(b,e,kind){const s=this.state(b);s.events.push({kind,t:e.time,x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx)});e.sound(kind==='up'?'overdriveUp':'overdriveDown',b.x);G.Presentation?.note(e,'arcana.overdrive',{actorId:b.id,stage:kind,gear:s.gear});},
    shift(b,e,delta,reason){const s=this.state(b);if(!s?.active)return;const before=s.gear,old=b.speed;s.gear=Math.max(0,Math.min(this.config.speeds.length-1,s.gear+delta));b.speed=this.config.speeds[s.gear];
      // Preserve the just-resolved impulse and direction; only consume own cruise energy.
      if(!b.motionSpeed&&reason==='contact'){const ratio=Math.min(1,b.speed/old);b.vx*=ratio;b.vy*=ratio;}else if(!b.motionSpeed)G.Physics.normalizeSpeed(b);
      if(before!==s.gear){s.lastShift=e.time;this.event(b,e,delta>0?'up':'down');}s.from=b.speed;s.started=Math.min(s.started,e.time-this.config.ramp);
    },
    update(b,e,dt){const s=this.ensure(b,e);if(!s)return;if(!s.active){if(!b.arcana.used&&b.hp>0&&b.hp<=b.maxHp*G.Arcana.ratio&&G.Awakening.active(b))this.activate(b,e);else return;}
      const p=Math.min(1,(e.time-s.started)/this.config.ramp),speed=s.from+(this.config.speeds[s.gear]-s.from)*p;if(p<1){b.speed=speed;if(!b.motionSpeed)G.Physics.normalizeSpeed(b);}else b.speed=this.config.speeds[s.gear];
      s.events=s.events.filter(v=>e.time-v.t<.28);if(e.tick%3===0){s.path.unshift({x:b.x,y:b.y});s.path.length=Math.min(s.path.length,34);}
    },
    contact(a,b,e){if(!G.World.enemy(a,b,e))return;for(const [v,t] of [[a,b],[b,a]]){const s=this.state(v);if(!s?.active)continue;const pass=s.pass[t.id];if(pass)pass.hit=true;if(s.touch[t.id])continue;s.touch[t.id]=true;if(!v.motionSpeed)s.pending++;}},
    settle(e){for(const b of e.balls){const s=this.state(b);if(!s?.active)continue;while(s.pending>0){s.pending--;this.shift(b,e,-1,'contact');}}},
    minimumSpeed(b){return this.config.minSpeed*(b.temporal?.rate??1)*(b.role?.cutSlowActive&&!G.Physics.armored(b)?G.LaserBlade.slowRate:1);},
    observe(e){if(e.state!=='running'||e.ending)return;const c=this.config;for(const b of e.balls){const s=this.state(b);if(!s?.active)continue;for(const t of e.balls){if(!G.World.enemy(b,t,e))continue;const edge=b.radius+t.radius,dx=b.x-t.x,dy=b.y-t.y,d=Math.hypot(dx,dy),band=edge+c.margin;
        if(d>edge+1)delete s.touch[t.id];if(b.motionSpeed||!G.World.targetable(t,e)||G.Ghost.phased(t)||G.Arcana.noContact(t)){delete s.pass[t.id];continue;}
        const px=b.previousX-t.previousX,py=b.previousY-t.previousY,pd=Math.hypot(px,py),rvx=dx-px,rvy=dy-py,den=rvx*rvx+rvy*rvy,u=den?Math.max(0,Math.min(1,-(px*rvx+py*rvy)/den)):0,closest=Math.hypot(px+u*rvx,py+u*rvy);let q=s.pass[t.id];
        if(!q&&pd>band&&closest<=band){const speed=Math.hypot(b.vx,b.vy);q=s.pass[t.id]={x:b.previousX,y:b.previousY,ux:b.vx/(speed||1),uy:b.vy/(speed||1),min:closest,hit:false,fast:speed>=this.minimumSpeed(b)};}
        if(!q)continue;q.min=Math.min(q.min,closest);q.fast=q.fast&&Math.hypot(b.vx,b.vy)>=this.minimumSpeed(b);if(d<=edge+.25)q.hit=true;
        if(d>band+2&&dx*rvx+dy*rvy>0){const tx=b.x-q.x,ty=b.y-q.y,travel=Math.hypot(tx,ty),forward=tx*q.ux+ty*q.uy;
          if(!q.hit&&q.fast&&q.min>edge+.25&&travel>=c.minTravel&&forward>=travel*.8&&e.time-s.lastShift>=c.cooldown)this.shift(b,e,1,'pass');delete s.pass[t.id];}
      }}
    }
  };
  if(!G.Arcana?.health)return;G.Arcana.defs.accelerator={name:'超速·极限突破',raw:0};
  const pursuit=G.Pursuit.update;G.Pursuit.update=function(e,...args){const result=pursuit.call(this,e,...args);O.observe(e);return result;};
  const batch=G.Combat.resolveBatch;G.Combat.resolveBatch=function(p,e,contacts){const result=batch.call(this,p,e,contacts);O.settle(e);return result;};
  const status=G.Arcana.status,copy=G.Arcana.copy;G.Arcana.status=function(b,e){return O.active(b)?{label:'超速挡位',value:O.state(b).gear+' / '+(O.config.speeds.length-1)+' · '+O.config.speeds[O.state(b).gear]}:status.call(this,b,e);};
  G.Arcana.copy=function(type){return type==='accelerator'?'奥义 · 超速·极限突破：觉醒后生命≤30%开启本局超速挡位。365基础挡，擦肩升至410/460/515/575；真实碰撞物理结算后降一挡。冲刺保持原速度、无敌、伤害及CD，结束只降一挡。停留、折返、冲刺不升挡；原失衡和撞墙伤害保留。':copy.call(this,type);};
  const statusSkill=G.Skills.accelerator.status;G.Skills.accelerator.status=function(b,e){if(!O.active(b))return statusSkill.call(this,b,e);return [{label:'超速挡位',value:O.state(b).gear+' / 4'},{label:'挡位移速',value:O.config.speeds[O.state(b).gear]},{label:'动能',value:'+40%'},...G.Recovery.pressureStatus(b)];};
  if(G.TimeRewind){const finish=G.TimeRewind.finish;G.TimeRewind.finish=function(e){finish.call(this,e);for(const b of e.balls){const s=O.ensure(b,e);if(s&&b.arcana.used){Object.assign(s,{active:true,started:e.time-O.config.ramp,from:O.config.speeds[0]});b.speed=O.config.speeds[0];G.Physics.normalizeSpeed(b);}}};}
  const arcSnapshot=G.Arcana.snapshot;G.Arcana.snapshot=function(v){const result=arcSnapshot.call(this,v);if(v.overdrive){const s=v.overdrive;result.overdrive={...s,pass:Object.fromEntries(Object.entries(s.pass).map(([k,p])=>[k,{...p}])),touch:{...s.touch},path:s.path.map(p=>({...p})),events:s.events.map(p=>({...p}))};}return result;};
  const snapshot=G.Engine.prototype.snapshot;G.Engine.prototype.snapshot=function(){const result=snapshot.call(this);result.overdrive=this.balls.filter(b=>O.state(b)).map(b=>({id:b.id,active:O.active(b),gear:O.state(b).gear,speed:b.speed}));return result;};
})(typeof window!=='undefined'?window:globalThis);
