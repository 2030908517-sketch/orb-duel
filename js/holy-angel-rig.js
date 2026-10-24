(function(root){
 'use strict';const G=root.OrbDuel,A=G.HolyAngel,P=G.HolyAngelMotion,TAU=Math.PI*2,facings=new WeakMap(),gestures=new WeakMap();
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);},v=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,n)=>v(a.x*n,a.y*n,a.z*n),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,len=a=>Math.hypot(a.x,a.y,a.z),norm=a=>mul(a,1/(len(a)||1)),mix=(a,b,t)=>add(a,mul(sub(b,a),t)),angleMix=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
 const R=G.HolyAngelRig={
  project(...args){return P.project(...args);},
  unprojectFlat(...args){return P.unprojectFlat(...args);},
  direction(...args){return P.direction(...args);},
  targetAngle(...args){return P.targetAngle(...args);},
  facing(z,e){return z.angel.facing??0;},
  motion(...args){return P.motion(...args);},
  visualMotion(z,e,face){const desired=this.motion(z,face),s=z.angel;let c=gestures.get(z);if(!c||e.time<c.time||e.time===c.time&&s.phase!==c.phase){c={time:e.time,phase:s.phase,elapsed:s.elapsed,last:desired};gestures.set(z,c);return desired;}const duration=c.phase==='holyThrow'?G.HolyThrow.config.wind+G.HolyThrow.config.release+G.HolyThrow.config.recovery:c.phase==='sword'?A.config.swordWind+A.config.swordSwing+A.config.recovery:A.config.spearWind+A.config.spearThrust+A.config.recovery;
   if(['sword','spear','holyThrow'].includes(c.phase)&&!['sword','spear','holyThrow'].includes(s.phase)&&c.elapsed<duration-.02)c.transition={time:e.time,from:c.last};let result=desired;if(c.transition){const u=ease((e.time-c.transition.time)/.12),old=c.transition.from;result={elbows:{sword:mix(old.elbows.sword,desired.elbows.sword,u)},hands:{sword:mix(old.hands.sword,desired.hands.sword,u),spear:mix(old.hands.spear,desired.hands.spear,u)},angles:{sword:angleMix(old.angles.sword,desired.angles.sword,u),spear:angleMix(old.angles.spear,desired.angles.spear,u)},twist:old.twist+(desired.twist-old.twist)*u,lean:old.lean+(desired.lean-old.lean)*u};const shoulder=v(-.25,-.015,0),upper=norm(sub(result.elbows.sword,shoulder)),fore=norm(mix(norm(sub(old.hands.sword,old.elbows.sword)),norm(sub(desired.hands.sword,desired.elbows.sword)),u));result.elbows.sword=add(shoulder,mul(upper,.305));result.hands.sword=add(result.elbows.sword,mul(fore,.305));if(u>=1)c.transition=null;}Object.assign(c,{time:e.time,phase:s.phase,elapsed:s.elapsed,last:result});return result;
  },
  solve(...args){return P.solve(...args);},
  sample(z,e){return P.sample(z,e,this.visualMotion(z,e,z.angel.facing??0));},
  draw(r,e,z){const V=G.HolyAngelView,c=r.ctx,s=z.angel,rig=this.sample(z,e),size=rig.size,fade=clamp((z.expires-e.time)/.5),form=ease((e.time-z.started)/A.config.formation),near=s.phase==='holyThrow'?'spear':rig.arms.sword.grip.depth>rig.arms.spear.grip.depth?'sword':'spear',far=near==='sword'?'spear':'sword',hands={near,turn:rig.turn};
   for(const key of ['sword','spear']){const p=rig.arms[key].local;hands[key]={x:p.x*size,y:p.y*size,angle:rig.arms[key].angle,joint:{shoulder:{x:p.joint.shoulder.x*size,y:p.joint.shoulder.y*size},elbow:{x:p.joint.elbow.x*size,y:p.joint.elbow.y*size}}};}
   const weapon=key=>{const a=rig.arms[key],h={x:a.grip.x*size,y:a.grip.y*size,angle:a.angle},length=P.weaponLength(z,a,key),bodyScale=A.config.figureScale/.43,weaponScale=A.config[key+'Length']/((key==='sword'?.90:1.45)*.43);c.save();c.translate(z.x+rig.offset.x,z.y+rig.offset.y);c.globalAlpha=fade;
    c.save();c.scale(weaponScale,weaponScale);if(key==='sword')V.sword(c,h.x/weaponScale,h.y/weaponScale,h.angle,length/weaponScale);else if(s.spearAbsent){const p=clamp(s.spearReturn||0),l=length/weaponScale;c.translate(h.x/weaponScale,h.y/weaponScale);c.rotate(h.angle);c.beginPath();c.rect(-l*(1-A.config.spearTip)*p,-l*.12,l*p,l*.24);c.clip();V.spear(c,0,0,0,l,0);}else V.spear(c,h.x/weaponScale,h.y/weaponScale,h.angle,length/weaponScale,s.phase==='spear'&&s.elapsed<A.config.spearWind?clamp(s.elapsed/A.config.spearWind):0);c.restore();
    c.scale(bodyScale,bodyScale);const fore=P.project(sub(a.hand,a.elbow),rig.turn);V.hand(c,{x:h.x/bodyScale,y:h.y/bodyScale,angle:h.angle,foreAngle:Math.atan2(fore.y,fore.x)},size/bodyScale,key==='sword'?-1:1);c.restore();return{x:z.x+rig.offset.x+h.x+Math.cos(h.angle)*length*(key==='sword'?1:A.config.spearTip),y:z.y+rig.offset.y+h.y+Math.sin(h.angle)*length*(key==='sword'?1:A.config.spearTip)};};
   const tips={};tips[far]=weapon(far);c.save();c.translate(z.x+rig.offset.x,z.y+rig.offset.y);c.transform(Math.cos(rig.turn),-Math.sin(rig.turn)*.40,0,1,0,0);c.globalAlpha=fade;c.beginPath();c.rect(-size*2,-size*1.4+size*2.6*(1-form),size*4,size*3);c.clip();V.body(c,size,e.time,['sword','spear','guard','holyThrow'].includes(s.phase)?1:0,form,hands);c.restore();tips[near]=weapon(near);
  },
  math:{v,add,sub,mul,dot,len,norm,mix,angleMix}
 };
})(typeof window!=='undefined'?window:globalThis);
