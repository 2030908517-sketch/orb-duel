(function(root){
  'use strict';
  const G=root.OrbDuel;
  const defs={storm:{name:'雷暴接力',description:'每11.5秒锁定三处落点，各预警后按0.38秒间隔接力落雷、每处3.8基础伤害，命中积导电，可触发一次有限电解。'},charge:{name:'雷化·沿壁疾行',description:'4电荷与10秒冷却就绪后，下一次有效外墙撞击雷化1.75秒，以760速度沿墙过角移动；每敌最多两次电弧，导电延长跃迁距离。本体不参与球碰撞，仍承受实体、光束等伤害，结束向内凝聚回场。'},orbital:{name:'恒星坍缩·超新星',description:'15.5秒周期，召回三颗真实卫星并急旋收缩0.9秒，压缩星核0.2秒，再释放真实扩张的10伤冲击环、强击退与顿帧，每敌限中一次；随后释放三颗2.8伤重生彗星，反弹并返回恢复星环。无额外无敌，沉默中断坍缩；普通彗星实际命中附小范围星爆。'},
    demon:{name:'地狱之门',description:'相对两侧地狱门成为攻击起点，每10秒围猎一轮，两爪各自预警、提前锁定并真实伸向预测落点，间隔0.26秒。带本源烙印的目标被同轮两爪抓获后收束1秒，触发一次双锁处刑；与普通处刑互斥，单轮每敌技能伤害上限22（随加热增长）。处刑不立即解除3.2秒物理魂锁，不追加控制时长，已处刑的锁链到期无终结伤害。门爪仍可躲开。'},
    normal:{name:'破阵重拳',description:'觉醒恢复最多 8 生命，碰撞攻击 +25%；重拳有额外击退与短顿帧，并释放一次伤害 3.5 的短程定向拳劲。'},
    vampire:{name:'血契收束',description:'220 距离获取血链，260 距离外持续 0.12 秒才断开；预警失去目标不消血能。连接保存已有血印收束资格，每次有效汲取耗0.5血能（包括护盾吸收），七次成功后收束另耗0.5并直接碎盾；血契期间无霸体；断链仍按连接时长有限返还。'},
    accelerator:{name:'闪电突袭',description:'8.5 秒周期、0.7 秒预警，末段 0.12 秒锁定，其前持续更新反弹预瞄。900 速度起冲并持续衰减，可反弹、全程无敌；撞敌结束并传动能，首次撞墙追加有限伤害与独立强反馈。冲刺结束后巡航速度回落到82%，最多285，再逐渐积速；全程无接触自然耗尽只返最多10点实际损失巡航速度，不返冲刺CD。'},
    reflector:{name:'镜鉴预判',description:'继承基础蓄能反击弹；姿态3.2秒、即时反伤60%。一次完整姿态无生命损失时，获得一次无视CD的迎撞/预警/飞行物预判开启机会；有扣血或被中断不授予补偿，沉默仍阻止开启。'},
    shield:{name:'堡垒震荡',description:'17 盾 / 9 秒 / 持续 3 秒；盾结束收拢 0.22 秒，预瞄敌人运动与传播时间，剩余盾量的 50% 加余压的 70% 化为 230 距离扩张波面，盾越完整波越强。盾击、压力波有独立强反馈，压力不重复兑现。'},
    ranger:{name:'战术切枪',description:'觉醒补满一次校准。装填结束按校准/距离选择三连发、狙击或散射，选定后不切换。满层远距狙击：0.5秒预瞄+0.15秒锁定、21伤高速实体弹；瞄准受伤不打断，本发按狙击零层±21度扰动，命中恢复3层、失手清零。满层近距散射：两轮扇形弹幕加7.8重弹，展开消耗校准，每颗命中恢复1层，结束保留恢复层数。三种模式均装填4秒，出膛不追踪。'},
    trapper:{name:'游走雷网',description:'最多七枚节点，动态线连接最远可用的已布防节点，感应线随自身反弹运动扫过场地；敌人穿线后拉索牵引0.3秒，结束时拉进爆炸命中范围才爆炸，否则保留节点；仍遵守墙面和碰撞物理。爆破有强击退与短顿帧，并释放四枚低伤破片；节点消失后自动连接下一枚，没有节点则等待布雷。基础最多五枚，觉醒最多七枚，可被拆除。'},
    boomerang:{name:'双刃回环',description:'投出4.1主刃与2.3副刃：近距从两侧交错切割后双返；远距两刃实际交汇，主刃加速直飞不返并施刃印、副刃回手。接回1/2刃获得8秒单/双刃武器重斩，挥斩一次消耗，普通射程180；主/副刃去程和回程均可施加或触发已有刃印，该次触印伤害3.6/2.2，每刃往返限一次；保留回收返CD。'},
    laser:{name:'主炮扫射',description:'3.6 秒充能，发射前更新反弹预瞄，末段 0.18 秒锁线。精准首炮基础 19.5，随后 0.65 秒扫射追加最多 6.2 余波，有限推力；0.38 弧度扫向侧方，不追踪。强首炮接触顿帧、持续冲刷声，结束后散热 1.45 秒。'},
    holy:{name:'启示圣裁',description:'觉醒后每14秒蓄势0.7秒，圣光从随机角落向对角落每0.5秒降下一整条斜排，覆盖全场；每柱有落点预警、直径35并留场0.9秒，单轮每名敌人最多3次4.2落地伤害、4次0.9触碰伤害，同来源触碰至少间隔0.35秒。整波共享降临气流，命中同步冲击、击退和短顿帧；光雨结束前不再开启下一轮。沉默打断蓄势与未落下的圣裁，已放出的圣水和三角阵保持。'},
    ghost:{name:'追魂三连穿',description:'虚化周期8秒，虚化延长为 1.9 秒，发动中三次短预瞄后以 560 速度穿行 0.23 秒，每次重新瞄准，穿行无实体碰撞；接触恐吓依然按 0.25 秒预算。虚化仍碰墙反弹；退相后魂影按真实路径与原速重走，恐吓相同、重放本轮魂爆。退相释放半径 95 的短程魂爆，基础 5 加本轮有效恐吓次数（最多 +3），命中有定向击退、短顿帧与空灵重音。'},
    magnet:{name:'极性坍缩',description:'每 11 秒过载：预警 0.35 秒后自身短暂锚定，强吸敌人和 270 范围飞行物，保持磁牵引 0.5 秒，再反转以 900 径向速度弹射（实际速度受 800 上限约束）。吸引迎撞与排斥撞墙只各结算一次有限动能伤害；飞刃先被甩离原轨迹，再恢复弧线回收，激光不受影响。'},
    time:{name:'零时禁令',description:'每 7 秒预瞄 0.35 秒后投出时钟，末段 0.08 秒锁定，出手后不追踪。触敌、到达 250 距离或撞边界会爆炸：半径 46，基础 12 伤害，实际炸中且非无敌的敌人沉默 1.2 秒；打断蓄力、持续施法和冲刺，已飞出武器继续运行。爆炸留下与普通技能相同的时间领域，领域本身不沉默，但敌人运动时间为20%、冷却和充能时间为70%（延缓30%） 并持续侵蚀；若正充能 / 等待攻击，沉默额外延后该次技能 1 秒。'},
    venom:{name:'万毒·同巢共鸣',description:'敌人携侵蚀接触液池触发活体缠缚，携麻痹进入毒雾触发限时附身追猎；保留三态自然演变，所有侵染共享施毒CD。'}

  };
  G.Awakening={
    defs,time:15,healthRatio:.5,
    fresh(){return {active:false,activatedAt:null,nextCast:Infinity,chainUntil:0,chainActive:false,chainStartedAt:0,chainConnected:0,chainRefund:0,nextPulse:Infinity,chargeUntil:0,aim:0,dashUntil:0,dashHit:false,dashStartedAt:0,dashStartSpeed:0,dashStopSpeed:0,dashSuccess:false,stopAfterContact:false,pendingBurst:false,casts:0};},
    active(ball){return !!ball.awakening?.active;},
    dashing(ball,engine){return this.active(ball) && ball.awakening.dashUntil>engine.time+1e-9;},
    predict(ball,seconds){
      const fold=(value,min,max)=>{const span=max-min,p=((value-min)%(2*span)+2*span)%(2*span);return min+(p<=span?p:2*span-p);};
      const bounds=ball.combatBounds;return {x:fold(ball.x+ball.vx*seconds,(bounds?.left||0)+ball.radius,(bounds?.right??G.Constants.width)-ball.radius),y:fold(ball.y+ball.vy*seconds,(bounds?.top||0)+ball.radius,(bounds?.bottom??G.Constants.height)-ball.radius),...(bounds?{combatBounds:{...bounds}}:{})};
    },
    activate(ball,engine){
      const a=ball.awakening;if(a.active || ball.hp<=0)return;a.active=true;a.activatedAt=engine.time;a.nextCast=engine.time;a.casts=0;
      engine.log(engine.label(ball)+'觉醒 · '+defs[ball.type].name);
      if(ball.type==='ghost'&&Number.isFinite(ball.ghost.nextPhase))ball.ghost.nextPhase+=1.6;
      if(ball.type==='holy')G.Holy.activate(ball,engine);if(ball.type==='demon')G.Demon?.activate(ball,engine);
      G.Roles.activate(ball,engine);const venomOpening=ball.type==='venom'&&G.VenomVisual?.frame(ball,engine)?.opening;if(!venomOpening){engine.sound('awakening',ball.x);G.Spectacle?.emit(engine,ball,'awaken',{sound:false,radius:72,life:.65});
      engine.ring(ball.x,ball.y,ball.def.color,95);engine.burst(ball.x,ball.y,ball.def.color,22);}
      if(ball.type==='normal'){const heal=Math.min(8,ball.maxHp-ball.hp);ball.hp+=heal;ball.stats.healing+=heal;if(heal)engine.float(ball.x,ball.y,'+'+heal.toFixed(1),ball.def.color);}
      if(ball.type==='shield'&&!G.Temporal.silenced(ball,engine)){G.Adaptive?.cancel(ball,'shield');if(engine.time<1.5){ball.shield=0;ball.nextShield=1.5;}else{const spec=this.shieldOptions(ball);ball.shield=spec.amount;ball.shieldUntil=engine.time+spec.duration+(G.Adaptive?.duration(ball,'shield')||0);ball.role.shieldAdaptiveId=G.Adaptive?.begin(ball,'shield',engine);ball.nextShield=engine.time+spec.period;}}
      if(ball.type==='ranger')ball.nextShot=Math.min(ball.nextShot,engine.time+.4);
      if(ball.type==='trapper')ball.nextTrap=Math.min(ball.nextTrap,engine.time+.4);
    },
    update(ball,dt,engine){
      if(ball.hp<=0)return;
      const a=ball.awakening,t=engine.time,target=G.World.targetFor(ball,engine);
      if(!a.active && (t+1e-9>=this.time || ball.hp<=ball.maxHp*this.healthRatio))this.activate(ball,engine);
      if(!a.active || !target || G.Temporal.silenced(ball,engine)||G.Arcana?.busy(ball)||G.VampireHunt?.busy(ball))return;
      if(ball.type==='vampire')G.Roles.vampireUpdate(ball,dt,engine);if(ball.type==='venom')G.Characters.spread(ball,engine);
      if(ball.type==='accelerator'){
        if(ball.motionSpeed){
          if(t+1e-9>=a.dashUntil)this.finishDash(ball,engine);
          else ball.motionSpeed=a.dashStartSpeed*Math.exp(-.95*(t-a.dashStartedAt));
        }
        if(a.chargeUntil&&t<a.chargeUntil-.12)a.aim=G.Aim.track(ball,target,engine,'dash',900,a.chargeUntil-t,5.2,dt);
        if(a.chargeUntil && t+1e-9>=a.chargeUntil){
          a.chargeUntil=0;a.dashStartedAt=t;a.dashStartSpeed=900;a.dashStopSpeed=Math.max(275,(G.Overdrive?.active(ball)?Math.min(ball.speed,ball.def.maxSpeed):ball.speed)+20);
          a.dashUntil=t+Math.min(1.5,Math.log(a.dashStartSpeed/a.dashStopSpeed)/.95);
          a.dashHit=false;a.dashSuccess=false;a.stopAfterContact=false;a.casts++;ball.motionSpeed=900;ball.inertia=0;
          ball.vx=Math.cos(a.aim)*900;ball.vy=Math.sin(a.aim)*900;
          engine.sound('dash',ball.x);G.Spectacle?.emit(engine,ball,'launch',{angle:a.aim,life:.35});
          engine.log(engine.label(ball)+'衰减冲撞 · 墙反弹不中断 · 撞敌截停');engine.burst(ball.x,ball.y,'#fff0a4',14);
        }
        if(!a.chargeUntil && !this.dashing(ball,engine) && t+1e-9>=a.nextCast){
          a.aim=Math.atan2(ball.vy,ball.vx);
          ball.role.aimTracks??={};ball.role.aimTracks.dash={angle:a.aim,tick:-1};a.chargeUntil=t+.7;a.nextCast=t+8.5;engine.sound('charge',ball.x);engine.log(engine.label(ball)+'锁定冲撞方向 · 蓄力 0.7s');
        }
      }

    },
    area(ball,engine,radius,damage,kind){
      for(const target of engine.balls)if(G.World.enemy(ball,target,engine) && target.hp>0 && Math.hypot(target.x-ball.x,target.y-ball.y)<=radius+target.radius)engine.pendingAttacks.push({source:ball,target,raw:G.Combat.rollAttack(ball,engine,damage,kind),kind});
      engine.ring(ball.x,ball.y,ball.def.color,radius);engine.burst(ball.x,ball.y,ball.def.color,16);engine.sound('break',ball.x);G.Spectacle?.emit(engine,ball,'barrier',{radius,life:.48});engine.impact(ball.x,ball.y,ball.def.color,1.6);
      engine.log(engine.label(ball)+'释放破盾反击');
    },
    finishChain(ball,engine){G.Roles.finishChain(ball,engine);},
    finishDash(ball,engine,interrupted=false){
      const a=ball.awakening;if(!ball.motionSpeed)return;
      ball.motionSpeed=0;a.dashUntil=engine.time;a.stopAfterContact=false;ball.inertia=0;
      const geared=G.Overdrive?.active(ball),cruiseBefore=ball.speed;if(geared)G.Overdrive.shift(ball,engine,-1,'dash');else ball.speed=Math.max(ball.def.speed,Math.min(ball.def.dashRecoveryCap??ball.def.maxSpeed,ball.speed*(ball.def.dashRecoveryRatio??1)));
      if(a.dashHit)ball.character.recoveryUntil=Math.max(ball.character.recoveryUntil,engine.time+.6);
      else if(!interrupted&&!geared){const gain=Math.min(ball.def.dashMissSpeedRefund||0,Math.max(0,cruiseBefore-ball.speed));ball.speed+=gain;ball.stats.speedReturned=(ball.stats.speedReturned||0)+gain;if(gain)engine.signal(ball,'冲撞落空 · 返速 +'+gain.toFixed(0),'miss');G.Recovery.refund(ball,engine,'nextCast',2,'冲刺落空',a);}
      G.Physics.normalizeSpeed(ball);
      if(a.dashHit&&!a.dashSuccess)engine.signal(ball,'冲撞被抵消','miss');
    },
    dashMultiplier(speed){return .65+.50*Math.min(1,speed/900)**2;},
    attackMultiplier(ball){return this.active(ball) && ball.type==='normal'?1.25:ball.motionSpeed && !ball.awakening.dashHit?this.dashMultiplier(ball.motionSpeed*(ball.temporal?.rate??1)):1;},
    shotDamage(ball){return G.Roles.rangerDamage(ball);},
    shotPeriod(ball){return this.active(ball)?.32:.42;},
    trapOptions(ball){return {damage:ball.def.trapDamage,period:this.active(ball)?1.45:ball.def.trapPeriod,radius:ball.def.trapRadius,armDelay:ball.def.trapArmDelay,life:ball.def.trapLife,cap:this.active(ball)?7:ball.def.maxTraps,blastRadius:45,chainRange:85};},
    shieldOptions(ball){return this.active(ball)?{amount:17,period:9.0,duration:3.0}:{amount:ball.def.shieldAmount,period:ball.def.shieldPeriod,duration:ball.def.shieldDuration};},
    status(ball,engine){
      const a=ball.awakening,t=engine.time;if(!a.active)return [{label:'觉醒',value:Math.max(0,this.time-t).toFixed(1)+'s / ≤'+Math.round(this.healthRatio*100)+'%'}];
      const stats=[{label:'觉醒',value:defs[ball.type].name}];if(['normal','vampire','shield','ranger','laser','reflector','trapper'].includes(ball.type))return stats;
      if(ball.type==='accelerator')stats.push({label:this.dashing(ball,engine)?'无敌':a.chargeUntil>t?'蓄力':'冲刺冷却',value:Math.max(0,(this.dashing(ball,engine)?a.dashUntil:a.chargeUntil>t?a.chargeUntil:a.nextCast)-t).toFixed(1)+'s'});
      return stats;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
