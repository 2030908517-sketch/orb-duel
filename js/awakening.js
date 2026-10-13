(function(root){
  'use strict';
  const G=root.OrbDuel;
  const defs={
    normal:{name:'破限重击',description:'觉醒时恢复 8 生命，碰撞攻击永久提升 35%。'},
    vampire:{name:'血月锁链',description:'8 秒周期、连接 2.4 秒，链距 240，每 0.3 秒汲取 1.2 伤害并按实际扣血治疗。未连接时返还 1.5 秒 CD，提前断链按缺失连接时长比例返还；完整连接不返还，盾和无敌仍有效。'},
    accelerator:{name:'闪电突袭',description:'周期 8.5 秒、预警 0.7 秒；900 速度起冲，速度持续衰减，最多 1.5 秒，可多次墙面反弹，全程无敌。撞敌立即结束冲撞，速度越快伤害越高；动量传给对手，首次撞墙按法向动能追加伤害。未接触敌人返还 1 秒 CD，撞盾不返还。'},
    reflector:{name:'蓄能返还',description:'反击姿态延长至 3.4 秒、返还提升到 90%；姿态中实际扣血的 25% 积为反击弹，最多 8 点（随加热增长）。姿态结束时射出，不触发二次反伤。'},
    shield:{name:'堡垒脉冲',description:'护盾升级为每 8 秒获得 20 点、持续 3.6 秒；护盾被打破后，下一步向半径 90 内敌人反击 4 伤害。'},
    ranger:{name:'交叉齐射',description:'每 2.4 秒向预判方向发射扇形三发子弹，每发基础伤害 3.7，仍最多反弹一次。'},
    trapper:{name:'磁暴雷区',description:'每 3.2 秒布置强化陷阱：伤害 11、0.4 秒布防、持续 12 秒、最多 4 枚；触发后爆炸半径 65，连锁引爆 90 范围内已布防的己方强化陷阱。'}
    ,boomerang:{name:'双刃回环',description:'每 4.2 秒投出左右双弧刃，每次基础伤害 2.8，回程斩印 ×1.5；同一步同一刃印只强化一刃。两刃完整接回才获得近战强化，冷却返还每次投掷限一次。'},
    laser:{name:'聚焦贯穿',description:'光束基础伤害提升到 18、宽度增大，周期缩短至 4.8 秒，预警 0.55 秒；释放后仍有空窗。'},
    venom:{name:'剧毒扩散',description:'毒池扩大至 36、持续 5.5 秒，每层毒伤提升到 1.05；满毒敌人踩池也可引爆，与碰撞共享 2.5 秒引爆冷却。仍最多 2 池，不额外叠加毒层上限。'}
  };
  G.Awakening={
    defs,time:15,healthRatio:.5,
    fresh(){return {active:false,activatedAt:null,nextCast:Infinity,chainUntil:0,chainActive:false,chainStartedAt:0,chainConnected:0,chainRefund:0,nextPulse:Infinity,chargeUntil:0,aim:0,dashUntil:0,dashHit:false,dashStartedAt:0,dashStartSpeed:0,dashStopSpeed:0,dashSuccess:false,stopAfterContact:false,pendingBurst:false,casts:0};},
    active(ball){return !!ball.awakening?.active;},
    dashing(ball,engine){return this.active(ball) && ball.awakening.dashUntil>engine.time+1e-9;},
    predict(ball,seconds){
      const fold=(value,min,max)=>{const span=max-min,p=((value-min)%(2*span)+2*span)%(2*span);return min+(p<=span?p:2*span-p);};
      return {x:fold(ball.x+ball.vx*seconds,ball.radius,G.Constants.width-ball.radius),y:fold(ball.y+ball.vy*seconds,ball.radius,G.Constants.height-ball.radius)};
    },
    activate(ball,engine){
      const a=ball.awakening;if(a.active || ball.hp<=0)return;a.active=true;a.activatedAt=engine.time;a.nextCast=engine.time;a.casts=0;
      engine.log(engine.label(ball)+'觉醒 · '+defs[ball.type].name);
      engine.sound('awakening',ball.x);G.Spectacle?.emit(engine,ball,'awaken',{sound:false,radius:72,life:.65});
      engine.ring(ball.x,ball.y,ball.def.color,95);engine.burst(ball.x,ball.y,ball.def.color,22);
      if(ball.type==='normal'){const heal=Math.min(8,ball.maxHp-ball.hp);ball.hp+=heal;ball.stats.healing+=heal;if(heal)engine.float(ball.x,ball.y,'+'+heal.toFixed(1),ball.def.color);}
      if(ball.type==='shield'){const spec=this.shieldOptions(ball);ball.shield=spec.amount;ball.shieldUntil=engine.time+spec.duration;ball.nextShield=engine.time+spec.period;}
      if(ball.type==='ranger')ball.nextShot=Math.min(ball.nextShot,engine.time+.4);
      if(ball.type==='trapper')ball.nextTrap=Math.min(ball.nextTrap,engine.time+.4);
    },
    update(ball,dt,engine){
      if(ball.hp<=0)return;
      const a=ball.awakening,t=engine.time,target=G.World.targetFor(ball,engine);
      if(!a.active && (t+1e-9>=this.time || ball.hp<=ball.maxHp*this.healthRatio))this.activate(ball,engine);
      if(!a.active || !target)return;
      if(ball.type==='vampire'){
        if(!a.chainActive && t+1e-9>=a.nextCast){a.chainActive=true;a.chainStartedAt=t;a.chainConnected=0;a.chainRefund=0;a.chainUntil=t+2.4;a.nextPulse=t+.3;a.nextCast=t+8;a.casts++;engine.sound('chain',ball.x);G.Spectacle?.emit(engine,ball,'ritual',{radius:56,life:.65});engine.log(engine.label(ball)+'释放血月锁链');}
        if(a.chainActive){
          a.chainConnected=Math.min(2.4,Math.max(0,t-a.chainStartedAt));
          if(Math.hypot(target.x-ball.x,target.y-ball.y)>240)this.finishChain(ball,engine);
          else{
            if(t<=a.chainUntil+1e-9 && t+1e-9>=a.nextPulse){a.nextPulse+=.3;engine.pendingAttacks.push({source:ball,target,raw:1.2*engine.heatMultiplier,kind:'chain',healRatio:1});}
            if(t+1e-9>=a.chainUntil)this.finishChain(ball,engine);
          }
        }
      }
      if(ball.type==='accelerator'){
        if(ball.motionSpeed){
          if(t+1e-9>=a.dashUntil)this.finishDash(ball,engine);
          else ball.motionSpeed=a.dashStartSpeed*Math.exp(-.95*(t-a.dashStartedAt));
        }
        if(a.chargeUntil && t+1e-9>=a.chargeUntil){
          a.chargeUntil=0;a.dashStartedAt=t;a.dashStartSpeed=900;a.dashStopSpeed=Math.max(275,ball.speed+20);
          a.dashUntil=t+Math.min(1.5,Math.log(a.dashStartSpeed/a.dashStopSpeed)/.95);
          a.dashHit=false;a.dashSuccess=false;a.stopAfterContact=false;a.casts++;ball.motionSpeed=900;ball.inertia=0;
          ball.vx=Math.cos(a.aim)*900;ball.vy=Math.sin(a.aim)*900;
          engine.sound('dash',ball.x);G.Spectacle?.emit(engine,ball,'launch',{angle:a.aim,life:.35});
          engine.log(engine.label(ball)+'衰减冲撞 · 墙反弹不中断 · 撞敌截停');engine.burst(ball.x,ball.y,'#fff0a4',14);
        }
        if(!a.chargeUntil && !this.dashing(ball,engine) && t+1e-9>=a.nextCast){
          const origin=this.predict(ball,.7),destination=this.predict(target,.82);a.aim=Math.atan2(destination.y-origin.y,destination.x-origin.x);
          a.chargeUntil=t+.7;a.nextCast=t+8.5;engine.sound('charge',ball.x);engine.log(engine.label(ball)+'锁定冲撞方向 · 蓄力 0.7s');
        }
      }
      if(ball.type==='shield' && a.pendingBurst){a.pendingBurst=false;a.casts++;this.area(ball,engine,90,4,'barrier');}
    },
    area(ball,engine,radius,damage,kind){
      for(const target of engine.balls)if(target.id!==ball.id && target.hp>0 && Math.hypot(target.x-ball.x,target.y-ball.y)<=radius+target.radius)engine.pendingAttacks.push({source:ball,target,raw:G.Combat.rollAttack(ball,engine,damage,kind),kind});
      engine.ring(ball.x,ball.y,ball.def.color,radius);engine.burst(ball.x,ball.y,ball.def.color,16);engine.sound('break',ball.x);G.Spectacle?.emit(engine,ball,'barrier',{radius,life:.48});engine.impact(ball.x,ball.y,ball.def.color,1.6);
      engine.log(engine.label(ball)+'释放破盾反击');
    },
    finishChain(ball,engine){const a=ball.awakening;if(!a.chainActive)return;a.chainActive=false;a.chainUntil=0;a.nextPulse=Infinity;const refund=1.5*Math.max(0,1-a.chainConnected/2.4);a.chainRefund=G.Recovery.refund(ball,engine,'nextCast',refund,a.chainConnected<1e-8?'血链未连接':'血链提前断开',a);},
    finishDash(ball,engine){
      const a=ball.awakening;if(!ball.motionSpeed)return;
      ball.motionSpeed=0;a.dashUntil=engine.time;a.stopAfterContact=false;ball.inertia=0;
      if(a.dashHit){ball.speed=Math.max(ball.def.speed,ball.speed-12);ball.character.recoveryUntil=Math.max(ball.character.recoveryUntil,engine.time+.6);}
      else G.Recovery.refund(ball,engine,'nextCast',1,'冲撞落空',a);
      G.Physics.normalizeSpeed(ball);
      if(a.dashHit&&!a.dashSuccess)engine.signal(ball,'冲撞被抵消','miss');
    },
    dashMultiplier(speed){return .65+.85*Math.min(1,speed/900)**2;},
    attackMultiplier(ball){return this.active(ball) && ball.type==='normal'?1.35:ball.motionSpeed && !ball.awakening.dashHit?this.dashMultiplier(ball.motionSpeed):1;},
    shotDamage(ball){return this.active(ball)?3.7:ball.def.shotDamage;},
    shotPeriod(ball){return this.active(ball)?2.4:ball.def.shotPeriod;},
    trapOptions(ball){return this.active(ball)?{damage:11,period:3.2,radius:16,armDelay:.4,life:12,cap:4,blastRadius:65,chainRange:90}:{damage:ball.def.trapDamage,period:ball.def.trapPeriod,radius:ball.def.trapRadius,armDelay:ball.def.trapArmDelay,life:ball.def.trapLife,cap:ball.def.maxTraps,blastRadius:0,chainRange:0};},
    shieldOptions(ball){return this.active(ball)?{amount:20,period:8,duration:3.6}:{amount:ball.def.shieldAmount,period:ball.def.shieldPeriod,duration:ball.def.shieldDuration};},
    status(ball,engine){
      const a=ball.awakening,t=engine.time;if(!a.active)return [{label:'觉醒',value:Math.max(0,this.time-t).toFixed(1)+'s / ≤'+Math.round(this.healthRatio*100)+'%'}];
      const stats=[{label:'觉醒',value:defs[ball.type].name}];
      if(ball.type==='vampire')stats.push({label:a.chainActive?'血链':'链冷却',value:Math.max(0,(a.chainActive?a.chainUntil:a.nextCast)-t).toFixed(1)+'s'},{label:'汲取',value:(4*engine.heatMultiplier).toFixed(1)+'/s'},{label:'链距',value:240},...G.Recovery.refundStatus(ball));
      if(ball.type==='accelerator')stats.push({label:this.dashing(ball,engine)?'无敌':a.chargeUntil>t?'蓄力':'冲刺冷却',value:Math.max(0,(this.dashing(ball,engine)?a.dashUntil:a.chargeUntil>t?a.chargeUntil:a.nextCast)-t).toFixed(1)+'s'});
      if(ball.type==='shield')stats.push({label:'破盾波',value:(4*engine.heatMultiplier).toFixed(1)});
      if(ball.type==='ranger')stats.push({label:'齐射',value:'3 发'});
      if(ball.type==='trapper')stats.push({label:'连锁',value:'90 范围'});
      return stats;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
