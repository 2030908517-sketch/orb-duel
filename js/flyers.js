(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants;
  G.Flyers={
    physical(p){return ['shot','counter','boomerang','blade','venom','shard','comet','arcBlood','arcPierce'].includes(p.mode)||p.range!==undefined&&p.angle!==undefined;},
    poisonUpdate(b,e){const enemy=G.World.targetFor(b,e);if(enemy)b.role.spitAim=G.Aim.track(b,enemy,e,'venom',b.def.spitSpeed,0,4,G.Constants.dt*b.temporal.rate);b.role.nextSpit??=e.time+G.Venom.config.spitFirstDelay;if(G.ManualRoles?.owns(b,e)||e.state!=='running'||e.time+1e-9<(b.role.nextSpit||0))return;const target=G.World.targetFor(b,e);if(!target)return;
      this.poisonFire(b,target,e);
    },

    poisonFire(b,target,e){
      const adaptiveId=G.Adaptive?.begin(b,'venom',e),angle=b.role.spitAim+G.Aim.offset(b,target,e,'venom')*(1-.1*(G.Adaptive?.level(b,'venom')||0)),nx=Math.cos(angle),ny=Math.sin(angle),radius=5;
      const unit=(G.Awakening.active(b)?G.Venom.config.awakeErosionDamage:G.Venom.config.erosionDamage)*e.heatMultiplier;
      e.projectiles.push({id:e.nextWorldId++,mode:'venom',owner:b.id,adaptiveId,x:Math.max(radius,Math.min(C.width-radius,b.x+nx*30)),y:Math.max(radius,Math.min(C.height-radius,b.y+ny*30)),vx:nx*b.def.spitSpeed,vy:ny*b.def.spitSpeed,speed:b.def.spitSpeed,radius,range:b.def.spitRange,travel:0,bounces:0,maxBounces:0,expires:e.time+2,raw:G.Combat.rollAttack(b,e,G.Venom.config.spitDamage,'poisonShot'),poisonUnit:unit,poisonLife:1,poolSpec:{radius:G.Venom.config.shotPoolRadius,refund:false},color:b.def.color});
      G.Adaptive?.close(b,adaptiveId);b.role.nextSpit=e.time+G.Venom.config.spitPeriod;e.sound('toxinSpit',b.x);e.burst(b.x+nx*25,b.y+ny*25,b.def.color,4);
    },
    spill(p,owner,e){if(!p.poolSpec)return;G.World.pool(owner,e,{x:p.x,y:p.y},{...p.poolSpec,adaptiveId:p.adaptiveId});e.effects.push({kind:'tactic',style:'spill',x:p.x,y:p.y,color:p.color,age:0,life:.32});e.sound('toxinSplash',p.x);},
    move(p,e,dt){const oldX=p.x,oldY=p.y,length=Math.hypot(p.vx,p.vy)||1,nx=p.vx/length,ny=p.vy/length;
      p.speed=length;let distance=length*dt;if(p.range!==undefined)distance=Math.min(distance,Math.max(0,p.range-(p.travel||0)));
      const bounds=e.arcanaWorld?.defense?.fortress?.bounds;
      if(bounds&&(oldX<bounds.left+p.radius||oldX>bounds.right-p.radius||oldY<bounds.top+p.radius||oldY>bounds.bottom-p.radius)){p.x=Math.max(bounds.left+p.radius,Math.min(bounds.right-p.radius,p.x));p.y=Math.max(bounds.top+p.radius,Math.min(bounds.bottom-p.radius,p.y));return {oldX,oldY,ended:true};}
      const wx=nx>1e-9?((bounds?.right??C.width)-p.radius-oldX)/nx:nx< -1e-9?((bounds?.left||0)+p.radius-oldX)/nx:Infinity,wy=ny>1e-9?((bounds?.bottom??C.height)-p.radius-oldY)/ny:ny< -1e-9?((bounds?.top||0)+p.radius-oldY)/ny:Infinity;
      const cover=e.mode==='2v2'?G.Team.rayLimit(oldX,oldY,nx,ny,p.radius,e.obstacles):Infinity,travel=Math.max(0,Math.min(distance,wx,wy,cover));
      p.x+=nx*travel;p.y+=ny*travel;p.travel=(p.travel||0)+travel;return {oldX,oldY,ended:travel<length*dt-1e-9||p.range!==undefined&&p.travel>=p.range-1e-9};
    },
    reflect(p,target,e){return null; // Mirror interception has been removed; normal hit settlement continues.
    }
  };
})(typeof window!=='undefined'?window:globalThis);

