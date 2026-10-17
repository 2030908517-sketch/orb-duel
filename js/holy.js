(function(root){
  'use strict';
  const G=root.OrbDuel,C=G.Constants,EPS=1e-9;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  G.Holy={
    fresh(){return {path:[],last:null,triangleReady:0,nextJudgement:Infinity,chargeUntil:0,casts:0,triangles:0,lightHits:0,touchHits:0,waterDamage:0,outsideTime:0,nextWard:0,wards:0,burnDamage:0,nextImpact:{}};},
    reset(e){e.holyWorld=e.balls.some(b=>b.type==='holy')?{water:[],zones:[],lights:[],burns:[],waterHits:{},zoneHits:{},judgementHits:{},judgementCounts:{},touchHits:{},judgementTouches:{},nextLandSound:0}:null;},
    activate(b,e){b.holy.nextJudgement=e.time+1;},
    update(b,dt,e){
      if(e.state!=='running'||G.Temporal.silenced(b,e)||!G.Awakening.active(b))return;
      const s=b.holy,t=e.time;
      if(s.chargeUntil&&t+EPS>=s.chargeUntil){s.chargeUntil=0;this.judgement(b,e);}
      else if(!s.chargeUntil&&t+EPS>=s.nextJudgement&&!e.holyWorld.lights.some(l=>l.owner===b.id&&l.kind==='judgement')){if(G.Adaptive?.wait(b,G.World.targetFor(b,e),e,'holyJudgement'))return;s.judgementAdaptiveId=G.Adaptive?.begin(b,'holyJudgement',e);s.chargeUntil=t+.7;s.nextJudgement=t+b.def.judgementPeriod;engineSignal(b,e,'启示圣裁 · 圣光将至','holyCharge');}
    },
    interrupt(b,e){if(!b.holy)return;const cast=!!b.holy.chargeUntil||e.holyWorld?.lights.some(l=>l.owner===b.id&&l.kind==='judgement'&&!l.landed);b.holy.chargeUntil=0;
      if(e.holyWorld)e.holyWorld.lights=e.holyWorld.lights.filter(l=>l.owner!==b.id||l.kind!=='judgement'||l.landed);return cast;
    },
    retire(b,e){if(!b.holy||!e.holyWorld)return;b.holy.path=[];b.holy.last=null;b.holy.chargeUntil=0;for(const key of ['water','zones','lights','burns'])e.holyWorld[key]=e.holyWorld[key].filter(v=>v.owner!==b.id);},
    ward(b,e,dt){
      const s=b.holy,t=e.time,inside=e.holyWorld.zones.some(z=>z.owner===b.id&&z.expires>t&&dist(b,z)<=z.radius);
      s.outsideTime=inside?0:Math.min(b.def.wardDelay,s.outsideTime+dt*b.temporal.rate);
      if(b.shield>0&&t+EPS>=b.shieldUntil)b.shield=0;
      if(inside||s.outsideTime+EPS<b.def.wardDelay||t+EPS<s.nextWard||b.shield>0||G.Temporal.silenced(b,e))return;
      b.shield=b.def.wardAmount;b.shieldUntil=t+b.def.wardLife;s.nextWard=t+b.def.wardPeriod;s.outsideTime=0;s.wards++;
      engineSignal(b,e,'神圣庇护 · 5盾','holyWard');e.ring(b.x,b.y,b.def.color,42);
    },
    contact(a,b,e){
      if(e.state!=='running'||!e.holyWorld)return;
      for(const [source,target] of [[a,b],[b,a]]){
        if(!source.holy||source.hp<=0||target.hp<=0||source.shield<=0||source.shieldUntil<=e.time||!G.World.enemy(source,target,e)||G.Ghost.phased(target)||G.Awakening.dashing(target,e))continue;
        let burn=e.holyWorld.burns.find(v=>v.owner===source.id&&v.target===target.id&&v.until>e.time);
        if(burn)burn.until=Math.max(burn.until,e.time+source.def.burnLife);
        else{burn={owner:source.id,target:target.id,until:e.time+source.def.burnLife,nextTick:e.time+source.def.burnInterval,nextExtendFx:0};e.holyWorld.burns.push(burn);e.float(target.x,target.y-target.radius-12,'神圣灼伤',source.def.color);e.sound('holyTouch',target.x);}
      }
    },
    burnStatus(b,e){const burns=e.holyWorld?.burns?.filter(v=>v.target===b.id&&v.until>e.time&&e.balls.some(source=>source.id===v.owner&&source.hp>0))||[];return burns.length?'神圣灼伤 '+Math.max(...burns.map(v=>v.until-e.time)).toFixed(1)+'s':'';},
    distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,u=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-dx*u,p.y-a.y-dy*u);},
    intersection(a,b,c,d){
      const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;
      if(Math.abs(den)<1e-7)return null;
      const qx=c.x-a.x,qy=c.y-a.y,u=(qx*sy-qy*sx)/den,v=(qx*ry-qy*rx)/den;
      return u>=-EPS&&u<=1+EPS&&v>=-EPS&&v<=1+EPS?{x:a.x+u*rx,y:a.y+u*ry}:null;
    },
    circumcircle(a,b,c){
      const den=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(den)<1e-5)return null;
      const aa=a.x*a.x+a.y*a.y,bb=b.x*b.x+b.y*b.y,cc=c.x*c.x+c.y*c.y;
      const x=(aa*(b.y-c.y)+bb*(c.y-a.y)+cc*(a.y-b.y))/den,y=(aa*(c.x-b.x)+bb*(a.x-c.x)+cc*(b.x-a.x))/den;
      return {x,y,radius:Math.hypot(x-a.x,y-a.y),area:Math.abs(den)/4};
    },
    triangle(a,points){
      if(points.length<3)return null;
      const candidates=points.filter((p,i)=>i%Math.max(1,Math.ceil(points.length/18))===0||i===points.length-1);let best=null;
      for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
        const b=candidates[i],c=candidates[j],circle=this.circumcircle(a,b,c);
        if(!circle||circle.area<600||circle.radius<35||circle.radius>Math.hypot(C.width,C.height)*.62)continue;
        if(!best||circle.area>best.area)best={...circle,vertices:[{...a},{x:b.x,y:b.y},{x:c.x,y:c.y}]};
      }return best;
    },
    trace(b,e){
      const s=b.holy,t=e.time,w=e.holyWorld;
      if(G.Temporal.silenced(b,e)){s.last=null;s.path=[];return;}
      s.path=s.path.filter(p=>p.at>t-b.def.waterLife).slice(-b.def.waterCap);
      if(!s.last){s.last={x:b.x,y:b.y,at:t};s.path=[{...s.last}];return;}
      if(dist(b,s.last)<10)return;
      const a={...s.last},end={x:b.x,y:b.y,at:t};
      // Physics projection may jump across cover; never connect through a pillar.
      const d=dist(a,end),blocked=e.mode==='2v2'&&G.Team.rayLimit(a.x,a.y,(end.x-a.x)/d,(end.y-a.y)/d,0,e.obstacles)<d-EPS;
      if(blocked){s.path=[end];s.last=end;return;}
      let circle=null;
      if(t+EPS>=s.triangleReady&&!w.zones.some(z=>z.owner===b.id&&z.expires>t)){for(let i=0;i<s.path.length-3;i++){
        const c=s.path[i],next=s.path[i+1];if(c.at>t-1.4||next.at>t-1.2)continue;
        // Crossing, or stepping onto an older edge, both count as a revisit.
        const cross=this.intersection(a,end,c,next);
        if(!cross&&this.distanceToSegment(end,c,next)>6)continue;
        circle=this.triangle(cross||end,s.path.slice(i+1));if(circle)break;
      }}
      const water={id:e.nextWorldId++,owner:b.id,ax:a.x,ay:a.y,x:end.x,y:end.y,radius:7,born:t,expires:t+b.def.waterLife,color:b.def.color};w.water.push(water);
      const owned=w.water.filter(p=>p.owner===b.id);if(owned.length>b.def.waterCap){const removed=new Set(owned.slice(0,owned.length-b.def.waterCap).map(p=>p.id));w.water=w.water.filter(p=>!removed.has(p.id));}
      s.path.push(end);s.last=end;
      if(circle){this.seal(b,e,circle);s.path=[end];s.triangleReady=t+4.2;}
    },
    seal(b,e,circle){
      const w=e.holyWorld;if(w.zones.some(z=>z.owner===b.id&&z.expires>e.time))return false;w.zones=w.zones.filter(z=>z.owner!==b.id||z.expires>e.time);
      const adaptiveId=G.Adaptive?.begin(b,'holyZone',e);G.Adaptive?.close(b,adaptiveId);const zone={id:e.nextWorldId++,owner:b.id,adaptiveId,adaptiveBias:G.Adaptive?.level(b,'holyZone')||0,...circle,started:e.time,expires:e.time+b.def.zoneLife,nextLight:e.time+.28,color:b.def.color};w.zones.push(zone);b.holy.triangles++;
      engineSignal(b,e,'圣水闭环 · 三角圣阵','holySeal');e.effects.push({kind:'holySeal',owner:b.id,x:circle.x,y:circle.y,radius:circle.radius,vertices:circle.vertices,age:0,life:.7,color:b.def.color});
    },
    randomPoint(z,e){
      for(let i=0;i<32;i++){const angle=e.rng.between(0,Math.PI*2),r=Math.sqrt(e.rng.next())*z.radius,x=z.x+Math.cos(angle)*r,y=z.y+Math.sin(angle)*r;if(x>=12&&x<=C.width-12&&y>=12&&y<=C.height-12)return {x,y};}
      let u=e.rng.next(),v=e.rng.next();if(u+v>1){u=1-u;v=1-v;}const [a,b,c]=z.vertices;return {x:a.x+u*(b.x-a.x)+v*(c.x-a.x),y:a.y+u*(b.y-a.y)+v*(c.y-a.y)};
    },
    lightFits(point,e,at,kind){
      const gap=G.Types.holy.lightRadius*2+16,warning=kind==='judgement'?.42:.28,end=at+G.Types.holy.lightLife;
      return !e.holyWorld.lights.some(l=>{
        if(at<l.expires-EPS&&end>l.at+EPS&&Math.abs(point.x-l.x)<gap-EPS)return true;
        return at-warning<l.expires-EPS&&end>l.warningAt+EPS&&dist(point,l)<gap-EPS;
      });
    },
    spacedPoint(z,e,at){
      for(let attempt=0;attempt<48;attempt++){
        let point=this.randomPoint(z,e);const owner=e.balls.find(b=>b.id===z.owner),target=owner&&G.World.targetFor(owner,e);if(target)for(let j=0;j<(z.adaptiveBias||0);j++){const candidate=this.randomPoint(z,e);if(dist(candidate,target)<dist(point,target))point=candidate;}if(this.lightFits(point,e,at,'zone'))return {point,at};
      }return null;
    },
    light(b,e,point,kind,group,at,raw,synchronized=false){
      // Bound reservations: retry later rather than overlap or build a match-long backlog.
      let when=synchronized?at:null;for(let delay=0;when===null&&delay<=(kind==='judgement'?24:8);delay++){const candidate=at+delay*.08;if(this.lightFits(point,e,candidate,kind)){when=candidate;break;}}
      if(when===null)return null;
      const l={id:e.nextWorldId++,owner:b.id,adaptiveId:kind==='zone'?e.holyWorld.zones.find(z=>z.id===group)?.adaptiveId:b.holy.judgementAdaptiveId,x:point.x,y:point.y,kind,group,at:when,warningAt:when-(kind==='judgement'?.42:.28),expires:when+b.def.lightLife,radius:b.def.lightRadius,raw,touchRaw:(kind==='judgement'?b.def.judgementTouchDamage:b.def.lightTouchDamage)*e.heatMultiplier,color:b.def.color,landed:false};e.holyWorld.lights.push(l);return l;
    },
    judgement(b,e){
      const s=b.holy,w=e.holyWorld;if(!w)return;const corner=Math.floor(e.rng.next()*4),grid=b.def.lightRadius*2+20,cols=Math.ceil(C.width/grid),rows=Math.ceil(C.height/grid),group=e.nextWorldId++;
      G.Adaptive?.close(b,s.judgementAdaptiveId);s.casts++;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const ix=corner&1?cols-1-x:x,iy=corner&2?rows-1-y:y,point={x:(ix+.5)*C.width/cols,y:(iy+.5)*C.height/rows};
        // Reserve complete diagonal bands atomically: every column in a band lands together.
        const l=this.light(b,e,point,'judgement',group,e.time+.42+(x+y)*b.def.judgementBand,b.def.judgementDamage*e.heatMultiplier,true);if(l){l.band=x+y;l.corner=corner;}
      }
      engineSignal(b,e,'启示圣裁 · 对角光雨','holyWave');e.effects.push({kind:'holySweep',owner:b.id,corner,age:0,life:.6,color:b.def.color});
    },
    updateWorld(e,dt){
      if(e.state!=='running')return;
      const w=e.holyWorld;if(!w)return;const t=e.time,alive=id=>e.balls.find(b=>b.id===id&&b.hp>0);
      w.water=w.water.filter(p=>p.expires>t&&alive(p.owner));w.zones=w.zones.filter(z=>z.expires>t&&alive(z.owner));w.lights=w.lights.filter(l=>l.expires>t&&alive(l.owner));
      // Released burns follow world time, including their final half-second tick.
      w.burns=w.burns.filter(v=>v.until+EPS>=t&&alive(v.owner)&&alive(v.target));
      for(const burn of w.burns){if(t+EPS<burn.nextTick)continue;const source=alive(burn.owner),target=alive(burn.target);burn.nextTick=t+source.def.burnInterval;
        if(!G.Ghost.phased(target))e.pendingAttacks.push({source,target,raw:source.def.burnDamage*e.heatMultiplier,kind:'holyBurn'});
      }
      for(const b of e.balls)if(b.type==='holy'&&b.hp>0)this.trace(b,e);
      for(const b of e.balls)if(b.holy&&b.hp>0)this.ward(b,e,dt);
      for(const b of e.balls){if(b.type!=='holy'||b.hp<=0)continue;
        for(const target of e.balls){if(!G.World.enemy(b,target,e)||target.hp<=0||G.Ghost.phased(target))continue;
          const key=b.id+':'+target.id;if(t+EPS<(w.waterHits[key]||0))continue;
          if(w.water.some(p=>p.owner===b.id&&this.distanceToSegment(target,{x:p.ax,y:p.ay},p)<=p.radius+target.radius*.55)){
            w.waterHits[key]=t+.5;e.pendingAttacks.push({source:b,target,raw:b.def.waterDamage*e.heatMultiplier,kind:'holyWater'});
          }
        }
      }
      for(const z of w.zones)if(t+EPS>=z.nextLight){z.nextLight=t+1.1;const b=alive(z.owner),count=Math.max(3,Math.min(12,Math.ceil(Math.PI*z.radius*z.radius/14000)));let emitted=0;
        // A wave shares one warning and landing instant; crowded slots are omitted, never staggered.
        for(let i=0;i<count;i++){const drop=this.spacedPoint(z,e,t+.28);if(drop&&this.light(b,e,drop.point,'zone',z.id,drop.at,b.def.lightDamage*e.heatMultiplier,true))emitted++;}
        if(emitted)e.sound('holyFall',z.x);
      }
      for(const l of w.lights){if(t+EPS<l.at)continue;const landing=!l.landed;l.landed=true;const b=alive(l.owner);if(!b)continue;
        if(landing){e.effects.push({kind:'holyLanding',id:l.id,x:l.x,y:l.y,radius:l.radius,age:0,life:.28});if(t+EPS>=w.nextLandSound){w.nextLandSound=t+.45;e.sound('holyLand',l.x);}}
        for(const target of e.balls){if(!G.World.enemy(b,target,e)||target.hp<=0||G.Ghost.phased(target)||dist(l,target)>l.radius+target.radius)continue;
          const touchKey=b.id+':'+target.id,groupKey=l.group+':'+target.id;
          if(!landing){
            if(t+EPS<(w.touchHits[touchKey]||0)||l.kind==='judgement'&&(w.judgementTouches[groupKey]||0)>=4)continue;
            w.touchHits[touchKey]=t+b.def.lightTouchInterval;
            if(l.kind==='judgement')w.judgementTouches[groupKey]=(w.judgementTouches[groupKey]||0)+1;
            e.pendingAttacks.push({source:b,target,raw:l.touchRaw,kind:'holyTouch',adaptiveId:l.adaptiveId,point:{x:l.x,y:l.y},holyGroup:l.group});continue;
          }
          if(l.kind==='zone'){const key=l.group+':'+target.id;if(t+EPS<(w.zoneHits[key]||0))continue;w.zoneHits[key]=t+.45;}
          else{const key=l.group+':'+target.id,count=w.judgementCounts[key]||0;if(count>=3||t+EPS<(w.judgementHits[key]||0))continue;w.judgementCounts[key]=count+1;w.judgementHits[key]=t+.35;}
          w.touchHits[touchKey]=t+b.def.lightTouchInterval;
          e.pendingAttacks.push({source:b,target,raw:l.raw,adaptiveId:l.adaptiveId,kind:l.kind==='zone'?'holyLight':'holyJudgement',point:{x:l.x,y:l.y},holyGroup:l.group});
        }
      }
      // Bound per-field clocks by living, unexpired groups rather than a match-long history.
      const groups=new Set([...w.zones.map(z=>z.id),...w.lights.map(l=>l.group)]);
      for(const key of ['zoneHits','judgementHits','judgementCounts','judgementTouches'])for(const id of Object.keys(w[key]))if(!groups.has(Number(id.split(':')[0])))delete w[key][id];
    },
    hit(hit,e){
      if(!hit.source.holy||!['holyWater','holyLight','holyJudgement','holyTouch','holyBurn'].includes(hit.kind))return;
      const s=hit.source.holy;if(hit.kind==='holyWater'){s.waterDamage+=hit.actual;if(hit.actual>0)e.sound('holyWater',hit.target.x);return;}
      if(hit.kind==='holyBurn'){s.burnDamage+=hit.actual;if(hit.actual>0)e.sound('holyTouch',hit.target.x);return;}
      if(hit.actual+hit.blocked<=0||hit.avoided)return;
      if(hit.kind==='holyTouch'){s.touchHits++;e.sound('holyTouch',hit.target.x);e.ring(hit.point.x,hit.point.y,hit.source.def.color,20);return;}
      for(const burn of e.holyWorld.burns){if(burn.target!==hit.target.id||burn.until<=e.time)continue;burn.until+=2;
        if(e.time+EPS>=burn.nextExtendFx){burn.nextExtendFx=e.time+.8;e.float(hit.target.x,hit.target.y-hit.target.radius-12,'灼伤 +2s',hit.source.def.color);}
      }
      s.lightHits++;
      const key=hit.target.id;if(e.time+EPS>=(s.nextImpact[key]||0)){
        s.nextImpact[key]=e.time+.65;const dx=hit.target.x-(hit.point?.x??hit.source.x),dy=hit.target.y-(hit.point?.y??hit.source.y);
        hit.angle=Math.hypot(dx,dy)>.1?Math.atan2(dy,dx):Math.atan2(hit.target.y-hit.source.y,hit.target.x-hit.source.x);
        G.Roles.heavyImpact(hit.source,hit,e,'holyImpact','holyHit',hit.kind==='holyJudgement'?125:100,hit.kind==='holyJudgement'?.055:.04);
      }else e.sound('holyHit',hit.target.x);

    },
    status(b,e){const s=b.holy,w=e.holyWorld,z=w?.zones.filter(z=>z.owner===b.id).at(-1);return [
      {label:'庇护盾',value:b.shield.toFixed(1)+'/'+b.def.wardAmount},
      {label:'庇护CD',value:Math.max(0,s.nextWard-e.time).toFixed(1)+'s'},
      {label:'离圈计时',value:s.outsideTime.toFixed(1)+'/'+b.def.wardDelay+'s'},
      {label:'阵径/余时',value:z?Math.round(z.radius)+'/'+Math.max(0,z.expires-e.time).toFixed(1)+'s':'未成阵'},
      {label:G.Awakening.active(b)?'阵/裁伤':'圣光伤',value:(b.def.lightDamage*e.heatMultiplier).toFixed(1)+(G.Awakening.active(b)?'/'+(b.def.judgementDamage*e.heatMultiplier).toFixed(1):'')},
      {label:'裁决CD',value:G.Awakening.active(b)?s.chargeUntil?'蓄势':w?.lights.some(l=>l.owner===b.id&&l.kind==='judgement')?'光雨中':Math.max(0,s.nextJudgement-e.time).toFixed(1)+'s':'未觉醒'}
    ];},
    snapshot(s){return {...s,nextImpact:{...s.nextImpact},path:s.path.map(p=>({...p})),last:s.last?{...s.last}:null};},
    snapshotWorld(w){return {water:w.water.map(p=>({...p})),zones:w.zones.map(z=>({...z,vertices:z.vertices.map(p=>({...p}))})),lights:w.lights.map(l=>({...l})),burns:w.burns.map(v=>({...v})),waterHits:{...w.waterHits},zoneHits:{...w.zoneHits},judgementHits:{...w.judgementHits},judgementCounts:{...w.judgementCounts},touchHits:{...w.touchHits},judgementTouches:{...w.judgementTouches},nextLandSound:w.nextLandSound};}
  };
  function engineSignal(b,e,text,cue){e.signal(b,text,cue);}
})(typeof window!=='undefined'?window:globalThis);
