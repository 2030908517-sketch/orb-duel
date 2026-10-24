(function(root){
 'use strict';const G=root.OrbDuel,A=G.HolyAngel;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);},v=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,n)=>v(a.x*n,a.y*n,a.z*n),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,len=a=>Math.hypot(a.x,a.y,a.z),norm=a=>mul(a,1/(len(a)||1)),mix=(a,b,t)=>add(a,mul(sub(b,a),t)),angleMix=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
 const P=G.HolyAngelMotion={
  size(z){return z.radius*A.config.figureScale;},
  project(p,face){const x=p.x*Math.cos(face)+p.z*Math.sin(face),z=-p.x*Math.sin(face)+p.z*Math.cos(face);return{x,y:p.y+z*.40,depth:z};},
  unprojectFlat(p,face){const x=p.x/Math.cos(face);return{x,y:p.y+x*Math.sin(face)*.40};},
  direction(a,depth,face){const x=Math.cos(a),z=depth;return norm(v(x*Math.cos(face)-z*Math.sin(face),Math.sin(a)-z*.4,x*Math.sin(face)+z*Math.cos(face)));},
  targetAngle(z,e){const s=z.angel;if(['sword','spear'].includes(s.phase))return s.angle;const b=e.balls.find(b=>b.id===z.owner),target=e.balls.filter(t=>b&&G.World.enemy(b,t,e)&&G.World.targetable(t,e)).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];return target?Math.atan2(target.y-z.y,target.x-z.x):s.angle;},
  motion(z,face){const s=z.angel,q=A.config,rest={sword:v(-.45,.50,0),spear:v(.46,.50,0)},angles={sword:2.16+face*.2,spear:-1.19+face*.2},o={hands:{...rest},elbows:{sword:this.solve(v(-.25,-.015,0),rest.sword,-1).elbow},angles:{...angles},twist:0,lean:0};if(!['sword','spear'].includes(s.phase))return o;
   const sword=s.phase==='sword',wind=sword?q.swordWind:q.spearWind,travel=sword?q.swordSwing:q.spearThrust,t=s.elapsed,u=ease(t/wind),p=clamp((t-wind)/travel),r=ease((t-wind-travel)/q.recovery),f=this.direction(s.angle,.45*Math.sin(s.angle),face),tangent=this.direction(s.angle+Math.PI/2,.10,face);
   if(sword){const shoulder=v(-.25,-.015,0),restElbow=o.elbows.sword,restUpper=norm(sub(restElbow,shoulder)),restFore=norm(sub(rest.sword,restElbow)),startAngle=s.angle-q.swordArc/2,endAngle=s.angle+q.swordArc/2,dirs=a=>({upper:this.direction(a-q.swordWrist+1.15,.02,face),fore:this.direction(a-q.swordWrist,.22,face)}),start=dirs(startAngle),end=dirs(endAngle);let upper,fore;
    if(t<wind){upper=norm(mix(restUpper,start.upper,u));fore=norm(mix(restFore,start.fore,u));o.twist=-.26*u;}
    else if(t<=wind+travel){const k=1-(1-p)**2,dir=dirs(startAngle+q.swordArc*k);upper=dir.upper;fore=dir.fore;o.twist=-.26+.54*k;o.lean=.035*Math.sin(k*Math.PI);}
    else{upper=norm(mix(end.upper,restUpper,r));fore=norm(mix(end.fore,restFore,r));o.twist=.28*(1-r);}
    o.elbows.sword=add(shoulder,mul(upper,.305));o.hands.sword=add(o.elbows.sword,mul(fore,.305));
   }else{const shoulder=v(.25,-.015,0),start=add(shoulder,add(mul(f,-.34),v(.16,.23,-.12))),full=add(start,mul(f,.86));
    // Keep the same figure/weapon ratio. Stop the thrust when its real head reaches the circle.
    const reach=k=>{const twist=.13-.23*k,lean=-.035+.415*k,turn=face+twist*.70,arm=this.solve(shoulder,mix(start,full,k),1),grip=this.project(arm.hand,turn),d=this.project(this.direction(s.angle,.30,turn),turn),factor=clamp(Math.hypot(d.x,d.y),.40,1.05),a=Math.atan2(d.y,d.x),tip=q.spearLength/q.figureScale*q.spearTip*factor;return Math.hypot(Math.cos(s.angle)*lean+grip.x+Math.cos(a)*tip,-.12+Math.sin(s.angle)*lean+grip.y+Math.sin(a)*tip);};
    const goal=.97/A.config.figureScale;let cap=1;if(reach(1)>goal){let lo=0,hi=1;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(reach(mid)<goal)lo=mid;else hi=mid;}cap=(lo+hi)/2;}const end=mix(start,full,cap),endTwist=.13-.23*cap,endLean=-.035+.415*cap;
    if(t<wind){o.hands.spear=mix(rest.spear,start,u);o.angles.spear=angleMix(angles.spear,s.angle,u);o.twist=.13*u;o.lean=-.035*u;}
    else if(t<=wind+travel){const k=Math.sin(p*Math.PI/2);o.hands.spear=mix(start,end,k);o.angles.spear=s.angle;o.twist=.13+(endTwist-.13)*k;o.lean=-.035+(endLean+.035)*k;}
    else{const k=clamp((t-wind-travel)/q.recovery),back=ease(k/.62),home=ease((k-.62)/.38);o.hands.spear=k<.62?mix(end,start,back):mix(start,rest.spear,home);o.angles.spear=k<.62?s.angle:angleMix(s.angle,angles.spear,home);o.twist=k<.62?endTwist+(.13-endTwist)*back:.13*(1-home);o.lean=k<.62?endLean+(-.035-endLean)*back:-.035*(1-home);}

   }return o;
  },
  solve(shoulder,hand,side){const d=clamp(len(sub(hand,shoulder)),.27,.59);hand=add(shoulder,mul(norm(sub(hand,shoulder)),d));const axis=norm(sub(hand,shoulder)),pole=v(side*.65,.75,-.30),normal=norm(sub(pole,mul(axis,dot(pole,axis)))),bend=Math.sqrt(Math.max(0,.305**2-d*d*.25));return{shoulder,elbow:add(mix(shoulder,hand,.5),mul(normal,bend)),hand};},
  swordAxis(fore){const a=A.config.swordWrist,tangent=norm(v(-fore.y,fore.x,0));return add(mul(fore,Math.cos(a)),mul(tangent,Math.sin(a)));},
  sample(z,e,motionOverride=null){const face=z.angel.facing??0,motion=motionOverride||this.motion(z,face),turn=face+motion.twist*.70,arms={},size=this.size(z);for(const [key,side]of [['sword',-1],['spear',1]]){const a=key==='sword'&&motion.elbows?.sword?{shoulder:v(-.25,-.015,0),elbow:motion.elbows.sword,hand:motion.hands.sword}:this.solve(v(side*.25,-.015,0),motion.hands[key],side),axis=key==='sword'?this.swordAxis(norm(sub(a.hand,a.elbow))):this.direction(motion.angles.spear,.30,turn),dir=this.project(axis,turn),grip=this.project(a.hand,turn);arms[key]={...a,grip,axis,angle:Math.atan2(dir.y,dir.x),foreshorten:clamp(Math.hypot(dir.x,dir.y),.40,1.05),local:{...this.unprojectFlat(grip,turn),joint:{shoulder:this.unprojectFlat(this.project(a.shoulder,turn),turn),elbow:this.unprojectFlat(this.project(a.elbow,turn),turn)}}};}return{face,turn,motion,arms,size,offset:{x:Math.cos(this.targetAngle(z,e))*motion.lean*size,y:(-.12+Math.sin(e.time*2.2)*.035+Math.sin(this.targetAngle(z,e))*motion.lean)*size}};},
  weaponLength(z,arm,key){return z.radius*A.config[key+'Length']*arm.foreshorten;},
  weapon(z,e){const key=z.angel.phase;if(!['sword','spear'].includes(key))return null;const pose=this.sample(z,e),a=pose.arms[key];if(!a)return null;const size=pose.size,length=this.weaponLength(z,a,key),origin={x:z.x+pose.offset.x+a.grip.x*size,y:z.y+pose.offset.y+a.grip.y*size},point=d=>({x:origin.x+Math.cos(a.angle)*d,y:origin.y+Math.sin(a.angle)*d}),wind=key==='sword'?A.config.swordWind:A.config.spearWind,travel=key==='sword'?A.config.swordSwing:A.config.spearThrust;return {a:point(length*(key==='sword'?.04:A.config.spearTip-.27)),b:point(length*(key==='sword'?1:A.config.spearTip)),width:length*(key==='sword'?.055:.046),active:z.angel.elapsed>=wind&&z.angel.elapsed<=wind+travel,key};},
  math:{clamp,ease,v,add,sub,mul,dot,len,norm,mix,angleMix}
 };
})(typeof window!=='undefined'?window:globalThis);
