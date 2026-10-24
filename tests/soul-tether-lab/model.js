(function (root) {
  'use strict';
  const G = root.OrbDuel, C = G.Constants, P = G.Physics;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const defaults = Object.freeze({bodySpeed:160, demonSpeed:185, soulSpeed:120, soulCap:400, recovery:12, pull:42, stiffness:12, tolerance:3, initial:105, cap:280});
  function random(seed) {
    let s = 2166136261;
    for (const ch of String(seed)) s = Math.imul(s ^ ch.charCodeAt(0), 16777619);
    return () => {s += 0x6D2B79F5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296;};
  }
  function actor(x,y,radius,speed,angle,mass=1) {return {x,y,radius,speed,mass,hp:1,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,inertia:0};}
  // Geometry is shared by drawing and contact. Slack is a visual approximation, not a rope solver.
  function path(body,soul,length) {
    const dx=soul.x-body.x,dy=soul.y-body.y,d=Math.hypot(dx,dy),sag=Math.min(42,Math.max(0,length-d)*.35);
    const cx=(body.x+soul.x)/2-(d?dy/d:0)*sag,cy=(body.y+soul.y)/2+(d?dx/d:1)*sag;
    return Array.from({length:25},(_,i)=>{const t=i/24,u=1-t;return {x:u*u*body.x+2*u*t*cx+t*t*soul.x,y:u*u*body.y+2*u*t*cy+t*t*soul.y};});
  }
  function distance(p,a,b) {
    const dx=b.x-a.x,dy=b.y-a.y,k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy);
  }
  function touches(demon,body,soul,length,tolerance) {
    const pts=path(body,soul,length);
    // Exclude the endpoint neighborhoods in world distance, not a fraction of the line.
    return pts.slice(1).some((b,i)=>{
      const a=pts[i],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      return Math.hypot(mid.x-body.x,mid.y-body.y)>14 && Math.hypot(mid.x-soul.x,mid.y-soul.y)>14 && distance(demon,a,b)<=demon.radius+tolerance;
    });
  }
  class Model {
    constructor(params={},seed='soul-001') {this.params={...defaults,...params};this.seed=seed;this.follow=false;this.fixedBody=false;this.noRecovery=false;this.paused=false;this.pointer={x:180,y:170};this.reset();}
    event(type,detail={}) {this.events.push({time:+this.time.toFixed(4),type,...detail});if(this.events.length>3000)this.events.shift();}
    reset() {
      const rng=random(this.seed);this.time=0;this.tick=0;this.length=0;this.soul=null;this.inside=false;this.armed=false;this.lastContact=false;this.net=0;this.contactTime=0;this.gained=0;this.recovered=0;this.entries=0;this.history=[];this.events=[];
      this.body=actor(245,170,23,this.params.bodySpeed,rng()*Math.PI*2);
      this.demon=actor(80,90,23,this.params.demonSpeed,rng()*Math.PI*2,1.1);
      this.soulAngle=rng()*Math.PI*2;this.event('reset',{seed:this.seed,params:{...this.params}});this.extract();
    }
    extract() {
      this.length=clamp(this.params.initial,0,this.params.cap);
      this.soul=this.length>0?actor(this.body.x,this.body.y,14,this.params.soulSpeed,this.soulAngle):null;
      this.armed=false;this.inside=false;this.lastContact=false;this.net=0;this.event('extract',{length:this.length});
    }
    set(key,value) {if(!(key in defaults)||!Number.isFinite(value)||value<0)return;this.params[key]=value;this.length=Math.min(this.length,this.params.cap);this.event('parameter',{key,value});}
    returnSoul() {this.soul=null;this.length=0;this.inside=false;this.armed=false;this.event('return');}
    step(dt=C.dt,force=false) {
      if(this.paused&&!force)return;
      // Always use fixed substeps, including exported single-frame stepping.
      const count=Math.max(1,Math.round(dt/C.dt));
      for(let i=0;i<count;i++)this.fixedStep(C.dt);
    }
    fixedStep(dt) {
      const oldB={...this.body},oldD={...this.demon},oldS=this.soul?{...this.soul}:null,oldL=this.length;
      this.time+=dt;this.tick++;
      this.body.speed=this.params.bodySpeed;this.demon.speed=this.params.demonSpeed;
      if(!this.fixedBody)P.integrate(this.body,dt);
      if(this.follow) {
        const dx=this.pointer.x-this.demon.x,dy=this.pointer.y-this.demon.y,d=Math.hypot(dx,dy);
        if(d>1e-5){const travel=Math.min(d,this.params.demonSpeed*dt);this.demon.x+=dx/d*travel;this.demon.y+=dy/d*travel;this.demon.vx=dx/d*this.params.demonSpeed;this.demon.vy=dy/d*this.params.demonSpeed;}
        P.constrain(this.demon);
      } else P.integrate(this.demon,dt);
      if(!this.fixedBody)P.resolve(this.body,this.demon);
      // Collision positional correction can push a body through an outer wall; repair via native bounds.
      P.constrain(this.body);P.constrain(this.demon);
      this.inside=false;this.net=0;
      if(this.soul) {
        const s=this.soul,dx=this.body.x-s.x,dy=this.body.y-s.y,d=Math.hypot(dx,dy),excess=Math.max(0,d-this.length);
        // Independent cruise velocity with a soft, one-way spring to the host.
        const speed=Math.hypot(s.vx,s.vy),target=this.params.soulSpeed,k=1-Math.exp(-2*dt);
        if(speed>1e-6){const next=speed+(target-speed)*k;s.vx*=next/speed;s.vy*=next/speed;}
        else {s.vx=Math.cos(this.soulAngle)*target;s.vy=Math.sin(this.soulAngle)*target;}
        if(d>1e-6){s.vx+=dx/d*excess*this.params.stiffness*dt;s.vy+=dy/d*excess*this.params.stiffness*dt;}
        const v=Math.hypot(s.vx,s.vy),limit=this.params.soulCap;if(v>limit){s.vx*=limit/v;s.vy*=limit/v;}
        s.x+=s.vx*dt;s.y+=s.vy*dt;P.constrain(s);
        // Interpolate moving rope and demon, not just endpoints at the end of a step.
        let hit=false;
        for(let i=0;i<=4;i++) {const t=i/4,lerp=(a,b)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
          if(touches({...lerp(oldD,this.demon),radius:this.demon.radius},lerp(oldB,this.body),lerp(oldS,s),oldL,this.params.tolerance)){hit=true;break;}}
        if(!hit)this.armed=true;
        const effective=hit&&this.armed;
        if(effective!==this.lastContact){if(effective){this.entries++;this.event('contact-start');}else if(this.lastContact)this.event('contact-end');}
        this.lastContact=effective;this.inside=effective;
        const gain=effective?this.params.pull*dt:0,recover=this.noRecovery?0:this.params.recovery*dt;
        const before=this.length;this.length=clamp(before+gain-recover,0,this.params.cap);
        this.gained+=gain;this.recovered+=recover;this.contactTime+=effective?dt:0;this.net=(this.length-before)/dt;
        if(this.length<=0)this.returnSoul();
      } else this.lastContact=false;
      if(this.tick%12===0){this.history.push({time:this.time,length:this.length,distance:this.spaceDistance,contact:this.inside});while(this.history.length&&this.history[0].time<this.time-12)this.history.shift();}
    }
    get spaceDistance(){return this.soul?Math.hypot(this.soul.x-this.body.x,this.soul.y-this.body.y):0;}
    export(){return {experiment:'soul-tether-lab / provisional',seed:this.seed,time:this.time,params:{...this.params},flags:{follow:this.follow,fixedBody:this.fixedBody,noRecovery:this.noRecovery},state:{body:{...this.body},demon:{...this.demon},soul:this.soul?{...this.soul}:null,length:this.length},metrics:{contactTime:this.contactTime,entries:this.entries,attemptedExtraction:this.gained,attemptedRecovery:this.recovered},history:this.history,events:this.events};}
  }
  root.SoulLab={Model,defaults,path,touches,distance};
})(typeof window!=='undefined'?window:globalThis);
