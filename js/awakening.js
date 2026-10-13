(function(root){
  'use strict';
  const G=root.OrbDuel;
  const defs={
    normal:{name:'破阵重拳',description:'觉醒恢复最多 8 生命，碰撞攻击 +25%；满拳势重拳释放一次伤害 3.5 的短程定向拳劲。'},
    vampire:{name:'血契收束',description:'血能至少 1、敌人在 220 范围内时预警 0.25 秒连链；8.5 秒周期，持续 2.1 秒，7 次脉冲各消耗 0.25 血能、伤害 1.05 并治疗 85%。完整连接消血印收束 2.6 伤害并治疗。断链最多返还 1.2 秒。'},
    accelerator:{name:'闪电突袭',description:'周期 8.5 秒、预警 0.7 秒；900 速度起冲，速度持续衰减，最多 1.5 秒，可多次墙面反弹，全程无敌。撞敌立即结束冲撞，速度越快伤害越高；动量传给对手，首次撞墙按法向动能追加伤害。未接触敌人返还 1 秒 CD，撞盾不返还。'},
    reflector:{name:'镜裂回敬',description:'姿态延长至 3.2 秒、2 次镜片截获；即时反伤 60%，实际扣血的 25% 蓄能，上限 8（随加热增长），姿态结束沿最近来袭方向射出。截获弹以 55% 原伤折返，不能再次反射或蓄能。'},
    shield:{name:'堡垒释放',description:'19 盾 / 8.8 秒 / 持续 3.1 秒；盾被打破或到期，将剩余压力的 90% 沿运动方向释放为短程宽波。碰撞盾击与释放共用压力，不重复兑现。'},
    ranger:{name:'过载弹匣',description:'三发弹匣，每发 4.6 伤害，间隔 0.32 秒，装填 3.8 秒。满 2 校准时下一次装填消耗校准，末发重弹 8.4，过载装填 5.1 秒。子弹不追踪、落空不返还。'},
    trapper:{name:'雷网起爆',description:'强化节点 10.2 伤害、周期 3.4 秒、布防 0.4 秒、持续 11 秒、最多 4 枚，120 范围内生成最多 3 条感应线。爆炸半径 60，90 内节点每跳延迟 0.09 秒传播。同轮同目标最多两次，第二次为 55%；可拆节点断链。'}
    ,boomerang:{name:'双刃回环',description:'每 4.2 秒投出左右双弧刃，每次基础伤害 2.8，回程斩印 ×1.5；同一步同一刃印只强化一刃。两刃完整接回才获得近战强化，冷却返还每次投掷限一次。'},
    laser:{name:'贯穿重炮',description:'3.6 秒充能，瞄准 0.18 秒后锁线预警 0.55 秒。释放 0.18 秒宽炮，最多三次脉冲，总基础伤害 22.2，伤害预算按 50% / 25% / 25% 分配，命中有有限推力；散热 1.45 秒。'},
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
      G.Roles.activate(ball,engine);engine.sound('awakening',ball.x);G.Spectacle?.emit(engine,ball,'awaken',{sound:false,radius:72,life:.65});
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
      if(ball.type==='vampire')G.Roles.vampireUpdate(ball,dt,engine);
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

    },
    area(ball,engine,radius,damage,kind){
      for(const target of engine.balls)if(target.id!==ball.id && target.hp>0 && Math.hypot(target.x-ball.x,target.y-ball.y)<=radius+target.radius)engine.pendingAttacks.push({source:ball,target,raw:G.Combat.rollAttack(ball,engine,damage,kind),kind});
      engine.ring(ball.x,ball.y,ball.def.color,radius);engine.burst(ball.x,ball.y,ball.def.color,16);engine.sound('break',ball.x);G.Spectacle?.emit(engine,ball,'barrier',{radius,life:.48});engine.impact(ball.x,ball.y,ball.def.color,1.6);
      engine.log(engine.label(ball)+'释放破盾反击');
    },
    finishChain(ball,engine){G.Roles.finishChain(ball,engine);},
    finishDash(ball,engine){
      const a=ball.awakening;if(!ball.motionSpeed)return;
      ball.motionSpeed=0;a.dashUntil=engine.time;a.stopAfterContact=false;ball.inertia=0;
      if(a.dashHit){ball.speed=Math.max(ball.def.speed,ball.speed-12);ball.character.recoveryUntil=Math.max(ball.character.recoveryUntil,engine.time+.6);}
      else G.Recovery.refund(ball,engine,'nextCast',1,'冲撞落空',a);
      G.Physics.normalizeSpeed(ball);
      if(a.dashHit&&!a.dashSuccess)engine.signal(ball,'冲撞被抵消','miss');
    },
    dashMultiplier(speed){return .65+.85*Math.min(1,speed/900)**2;},
    attackMultiplier(ball){return this.active(ball) && ball.type==='normal'?1.25:ball.motionSpeed && !ball.awakening.dashHit?this.dashMultiplier(ball.motionSpeed):1;},
    shotDamage(ball){return G.Roles.rangerDamage(ball);},
    shotPeriod(ball){return this.active(ball)?.32:.42;},
    trapOptions(ball){return this.active(ball)?{damage:10.2,period:3.4,radius:15,armDelay:.4,life:11,cap:4,blastRadius:60,chainRange:90}:{damage:ball.def.trapDamage,period:ball.def.trapPeriod,radius:ball.def.trapRadius,armDelay:ball.def.trapArmDelay,life:ball.def.trapLife,cap:ball.def.maxTraps,blastRadius:45,chainRange:0};},
    shieldOptions(ball){return this.active(ball)?{amount:19,period:8.8,duration:3.1}:{amount:ball.def.shieldAmount,period:ball.def.shieldPeriod,duration:ball.def.shieldDuration};},
    status(ball,engine){
      const a=ball.awakening,t=engine.time;if(!a.active)return [{label:'觉醒',value:Math.max(0,this.time-t).toFixed(1)+'s / ≤'+Math.round(this.healthRatio*100)+'%'}];
      const stats=[{label:'觉醒',value:defs[ball.type].name}];if(['normal','vampire','shield','ranger','laser','reflector','trapper'].includes(ball.type))return stats;
      if(ball.type==='accelerator')stats.push({label:this.dashing(ball,engine)?'无敌':a.chargeUntil>t?'蓄力':'冲刺冷却',value:Math.max(0,(this.dashing(ball,engine)?a.dashUntil:a.chargeUntil>t?a.chargeUntil:a.nextCast)-t).toFixed(1)+'s'});
      return stats;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
