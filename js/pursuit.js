(function(root){
  'use strict';const G=root.OrbDuel;
  G.Pursuit={
    interrupt(b){if(!b.role.pursuitUntil)return;b.role.pursuitUntil=0;b.inertia=0;G.Physics.normalizeSpeed(b);},
    update(e){for(const b of e.balls){if(b.type!=='normal'||b.hp<=0||G.Arcana?.busy(b))continue;const s=b.role,t=e.time;
      if(s.pursuitUntil&&t>=s.pursuitUntil){s.pursuitUntil=0;b.inertia=0;G.Physics.normalizeSpeed(b);}
      for(const target of e.balls){if(!G.World.enemy(b,target,e)||target.hp<=0||G.Ghost.phased(target)){if(s.nearMisses)delete s.nearMisses[target.id];continue;}
        s.nearMisses||={};const old=s.nearMisses[target.id],dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy),edge=b.radius+target.radius,key=b.id<target.id?b.id+':'+target.id:target.id+':'+b.id,pair=e.pairs.get(key);
        if(d<=edge+.1||pair?.touching){delete s.nearMisses[target.id];if(s.pursuitTarget===target.id)s.pursuitUntil=0;continue;}
        if(d>edge+10){delete s.nearMisses[target.id];continue;}
        if(old&&d>old.distance+.02&&old.approached&&t>=(s.nextPursuit||0)&&!G.Temporal.silenced(b,e)&&t-(pair?.lastHit??-Infinity)>.35){
          const point=G.Awakening.predict(target,.12),angle=Math.atan2(point.y-b.y,point.x-b.x),speed=b.speed*1.3*b.temporal.rate;
          b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;b.inertia=.3;s.pursuitUntil=t+.28;s.pursuitTarget=target.id;s.nextPursuit=t+7;s.pursuits=(s.pursuits||0)+1;delete s.nearMisses[target.id];
          e.signal(b,'擦肩回身 · 追击','pursuit');e.effects.push({kind:'tactic',style:'pursuit',x:b.x,y:b.y,angle,color:b.def.color,age:0,life:.28});break;
        }
        s.nearMisses[target.id]={distance:d,approached:old?old.approached||d<old.distance-.02:(target.vx-b.vx)*dx+(target.vy-b.vy)*dy<0};
      }
    }}
  };
})(typeof window!=='undefined'?window:globalThis);
