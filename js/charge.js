(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants,mod=(n,d)=>(n%d+d)%d;
  // One perimeter coordinate is shared by body motion, wall currents and their drawings.
  G.Charge={
    length(r=0){return 2*(C.width+C.height-4*r);},
    point(s,r=0){const w=C.width-2*r,h=C.height-2*r;s=mod(s,2*(w+h));
      if(s<w)return {x:r+s,y:r,tx:1,ty:0,nx:0,ny:1};s-=w;
      if(s<h)return {x:C.width-r,y:r+s,tx:0,ty:1,nx:-1,ny:0};s-=h;
      if(s<w)return {x:C.width-r-s,y:C.height-r,tx:-1,ty:0,nx:0,ny:-1};s-=w;
      return {x:r,y:C.height-r-s,tx:0,ty:-1,nx:1,ny:0};
    },
    coordinate(b){const r=b.radius,w=C.width-2*r,h=C.height-2*r,n=b.wallContact;
      if(!n)return null;
      if(n.ny===1&&b.y<=r+.1)return b.x-r;
      if(n.nx===-1&&b.x>=C.width-r-.1)return w+b.y-r;
      if(n.ny===-1&&b.y>=C.height-r-.1)return w+h+C.width-r-b.x;
      if(n.nx===1&&b.x<=r+.1)return 2*w+h+C.height-r-b.y;return null;
    },
    wallPoint(s){const q=this.point(s,C.radius),w=C.width-2*C.radius,h=C.height-2*C.radius;
      return q.ty===0?{x:(q.x-C.radius)*C.width/w,y:q.ny===1?0:C.height}: {x:q.nx===1?0:C.width,y:(q.y-C.radius)*C.height/h};
    },
    fresh(){return {value:0,nextGain:0,nextDischarge:3.8,nextForm:0,phase:'body',until:0,s:0,direction:1,nextArc:0,hits:{},history:[],wallTick:-1};},
    reset(e){e.chargeWorld={points:[],currents:[],segments:[],conductive:[],arcClocks:{}};for(const b of e.balls)if(b.type==='charge')b.charge=this.fresh();},
    flowing(b){return b.charge?.phase==='flow'&&b.hp>0;},
    effect(e,b,style,p,extra={}){e.effects.push({kind:'charge',style,owner:b.id,color:b.def.color,x:p.x,y:p.y,age:0,life:.28,...extra});},
    pointAdd(b,s,e,life=6){const w=e.chargeWorld,old=w.points.find(p=>p.owner===b.id&&Math.abs(mod(p.s-s+this.length(C.radius)/2,this.length(C.radius))-this.length(C.radius)/2)<12);
      if(old){old.until=e.time+life;return old;}const p={id:e.nextWorldId++,owner:b.id,s,until:e.time+life};w.points.push(p);const owned=w.points.filter(p=>p.owner===b.id);if(owned.length>10)w.points=w.points.filter(p=>p!==owned[0]);return p;
    },
    wall(b,e){if(e.state!=='running'||b.hp<=0)return;const s=this.coordinate(b);if(s===null)return;
      const w=e.chargeWorld;
      for(const m of w.conductive.filter(m=>m.target===b.id&&m.until>e.time)){
        const owner=e.balls.find(v=>v.id===m.owner&&v.hp>0);if(!owner||G.Ghost.phased(b)||G.Awakening.dashing(b,e))continue;
        m.until=0;this.pointAdd(owner,s,e,4);const p=this.wallPoint(s);
        e.pendingAttacks.push({source:owner,target:b,kind:'grounding',raw:owner.def.groundDamage*e.heatMultiplier,point:p});this.effect(e,owner,'ground',p,{endX:b.x,endY:b.y,life:.4});e.sound('chargeGround',p.x);
      }
      if(b.type!=='charge'||this.flowing(b)||G.Temporal.silenced(b,e)||b.charge.wallTick===e.tick)return;
      const a=b.charge;a.wallTick=e.tick;if(e.time<a.nextGain)return;a.nextGain=e.time+.45;a.value=Math.min(b.def.chargeCap,a.value+1);this.pointAdd(b,s,e);
      const p=this.wallPoint(s);this.effect(e,b,'spark',p);e.sound('chargeSpark',p.x);
      if(G.Awakening.active(b)&&a.value>=4&&e.time>=a.nextForm){a.value-=4;a.phase='flow';a.until=e.time+b.def.formLife;a.s=s;const q=this.point(s,b.radius);a.direction=b.vx*q.tx+b.vy*q.ty>=0?1:-1;a.history=[];a.hits={};a.nextArc=e.time+.12;a.nextForm=e.time+b.def.formPeriod;a.adaptiveId=G.Adaptive?.begin(b,'chargeForm',e);G.Adaptive?.close(b,a.adaptiveId);b.inertia=0;b.motionSpeed=b.def.formSpeed;b.x=q.x;b.y=q.y;b.vx=q.tx*a.direction*b.motionSpeed*b.temporal.rate;b.vy=q.ty*a.direction*b.motionSpeed*b.temporal.rate;this.effect(e,b,'transform',b,{life:.45});e.signal(b,'雷化 · 沿壁疾行','chargeTransform');}
    },
    end(b,e,interrupted=false){const a=b.charge;if(!this.flowing(b))return;const q=this.point(a.s,b.radius);a.phase='body';b.motionSpeed=0;b.inertia=0;b.x=q.x+q.nx*2;b.y=q.y+q.ny*2;b.vx=q.nx*b.speed*.86+q.tx*a.direction*b.speed*.5;b.vy=q.ny*b.speed*.86+q.ty*a.direction*b.speed*.5;G.Physics.normalizeSpeed(b);a.history=[];if(interrupted)G.Adaptive?.cancel(b,'chargeForm');this.effect(e,b,'reform',b,{life:.45});e.sound('chargeReform',b.x);},
    move(b,dt,e){const a=b.charge;if(e.state!=='running'||!this.flowing(b))return false;
      if(e.time>=a.until||G.Temporal.silenced(b,e)){this.end(b,e,G.Temporal.silenced(b,e));return false;}
      a.s=mod(a.s+a.direction*b.def.formSpeed*dt*b.temporal.rate,this.length(b.radius));const q=this.point(a.s,b.radius);b.x=q.x;b.y=q.y;b.motionSpeed=b.def.formSpeed;b.vx=q.tx*a.direction*b.motionSpeed*b.temporal.rate;b.vy=q.ty*a.direction*b.motionSpeed*b.temporal.rate;
      if(e.tick%2===0){a.history.unshift({x:b.x,y:b.y,s:a.s});a.history.length=Math.min(60,a.history.length);}
      if(e.time>=a.nextArc){a.nextArc=e.time+.16;this.arc(b,b,e,a.hits,2,b.def.formDamage,a.adaptiveId);}return false;
    },
    arc(b,p,e,hits,limit,raw,id){const w=e.chargeWorld;
      for(const t of e.balls){if(!G.World.enemy(b,t,e)||t.hp<=0||G.Ghost.phased(t)||G.Awakening.dashing(t,e)||(hits[t.id]||0)>=limit)continue;
        const mark=w.conductive.some(m=>m.owner===b.id&&m.target===t.id&&m.until>e.time),reach=mark?b.def.arcRange+28:b.def.arcRange,key=b.id+':'+t.id;
        if(Math.hypot(t.x-p.x,t.y-p.y)>reach+t.radius||e.time<(w.arcClocks[key]||0)||!G.Mines.freeLine(p,t,e))continue;
        hits[t.id]=(hits[t.id]||0)+1;w.arcClocks[key]=e.time+.65;e.pendingAttacks.push({source:b,target:t,kind:'wallArc',raw:raw*e.heatMultiplier,adaptiveId:id,point:{x:p.x,y:p.y},angle:Math.atan2(t.y-p.y,t.x-p.x)});this.effect(e,b,'arc',p,{endX:t.x,endY:t.y,life:.22});e.sound('chargeArc',t.x);
      }
    },
    update(b,dt,e){if(e.state!=='running'||G.Temporal.silenced(b,e)||this.flowing(b))return;const a=b.charge,points=e.chargeWorld.points.filter(p=>p.owner===b.id&&p.until>e.time);
      if(e.time<a.nextDischarge||a.value<2||!points.length)return;const target=G.World.targetFor(b,e);if(G.Adaptive?.wait(b,target,e,'chargeCast'))return;
      a.value-=2;a.nextDischarge=e.time+b.def.dischargePeriod;const p=points[points.length-1],id=G.Adaptive?.begin(b,'chargeCast',e);G.Adaptive?.close(b,id);
      for(const direction of [-1,1])e.chargeWorld.currents.push({id:e.nextWorldId++,owner:b.id,s:p.s,direction,until:e.time+2.3,hits:{},history:[],adaptiveId:id});e.sound('chargeRelease',this.wallPoint(p.s).x);
    },
    world(e,dt){if(e.state!=='running')return;const w=e.chargeWorld,alive=id=>e.balls.find(b=>b.id===id&&b.hp>0);
      w.points=w.points.filter(p=>p.until>e.time&&alive(p.owner));w.segments=w.segments.filter(p=>p.until>e.time&&alive(p.owner));w.conductive=w.conductive.filter(m=>m.until>e.time&&alive(m.owner)&&alive(m.target));
      w.currents=w.currents.filter(p=>{const b=alive(p.owner);if(!b||e.time>=p.until)return false;p.s=mod(p.s+p.direction*b.def.currentSpeed*dt,this.length(C.radius));const q=this.wallPoint(p.s);
        if(e.tick%4===0){p.history.unshift({...q,s:p.s});p.history.length=Math.min(30,p.history.length);w.segments.push({owner:b.id,s:p.s,until:e.time+.7});}
        this.arc(b,q,e,p.hits,1,b.def.arcDamage,p.adaptiveId);return true;});
      // A wall patch only discharges on a scheduled contact; overlapping patches never multiply damage.
      for(const p of w.points){const b=alive(p.owner);if(!b)continue;this.arc(b,this.wallPoint(p.s),e,{},Infinity,b.def.patchDamage);}
      for(const p of w.segments){const b=alive(p.owner);if(b)this.arc(b,this.wallPoint(p.s),e,{},Infinity,b.def.patchDamage);}
    },
    hit(h,e){const b=h.source;if(!b.charge||h.actual<=0)return;if(h.kind==='contact'){let m=e.chargeWorld.conductive.find(m=>m.owner===b.id&&m.target===h.target.id);if(!m){m={owner:b.id,target:h.target.id,until:0};e.chargeWorld.conductive.push(m);}m.until=e.time+5;e.float(h.target.x,h.target.y-30,'导电',b.def.color);}
      if(['wallArc','grounding'].includes(h.kind)){b.stats.chargeHits=(b.stats.chargeHits||0)+1;e.impact(h.target.x,h.target.y,b.def.color,1.3);if(h.kind==='grounding')G.Roles.heavyImpact(b,h,e,'kineticHit','chargeGround',55,.035);}
    },
    cleanup(e){const w=e.chargeWorld;if(!w)return;for(const k of ['points','currents','segments','conductive'])w[k]=w[k].filter(v=>e.balls.some(b=>b.id===v.owner&&b.hp>0));},
    snapshot(v){return JSON.parse(JSON.stringify(v));},
    status(b,e){const a=b.charge,cd=v=>Math.max(0,v-e.time).toFixed(1)+'s';return [{label:'电荷',value:a.value+'/6'},{label:'放电CD',value:cd(a.nextDischarge)},{label:'电弧伤',value:(b.def.arcDamage*e.heatMultiplier).toFixed(1)},{label:'短路伤',value:(b.def.groundDamage*e.heatMultiplier).toFixed(1)},{label:'带电点',value:e.chargeWorld.points.filter(p=>p.owner===b.id).length},{label:'雷化',value:this.flowing(b)?cd(a.until):G.Awakening.active(b)?cd(a.nextForm):'未觉醒'}];}
  };
  G.Skills.charge={update:(b,dt,e)=>G.Charge.update(b,dt,e),status:(b,e)=>G.Charge.status(b,e)};
})(typeof window!=='undefined'?window:globalThis);
