(function (root) {
  'use strict';
  const G = root.OrbDuel;
  // Limited compensation for contact-dependent species. Never steers or adds attacks.
  G.Recovery={
    pressure(ball,engine){if(ball.def.pressureCap)ball.pressure.bonus=Math.min(ball.def.pressureCap,Math.max(0,engine.time-ball.pressure.lastHit-ball.def.pressureWait)*ball.def.pressureRate);},
    hit(ball,hit,engine){if(!ball.def.pressureCap||hit.actual<=0)return;if(ball.pressure.bonus>.01&&hit.kind==='contact')engine.signal(ball,'蓄力命中 +'+Math.round(ball.pressure.bonus*100)+'%','miss',hit.target);ball.pressure.lastHit=engine.time;ball.pressure.bonus=0;},
    refund(ball,engine,field,amount,label,timers=ball){if(!Number.isFinite(timers[field]))return 0;const saved=Math.min(amount,Math.max(0,timers[field]-engine.time-.2));if(saved<=1e-8)return 0;timers[field]-=saved;ball.stats.cdReturned+=saved;engine.signal(ball,label+' · CD−'+saved.toFixed(1)+'s','miss');return saved;},
    pressureStatus(ball){return [{label:'蓄力',value:'+'+Math.round(ball.pressure.bonus*100)+'%'}];},
    refundStatus(ball){return [{label:'返还CD',value:ball.stats.cdReturned.toFixed(1)+'s'}];}
  };
  G.Skills = {
    demon:{update:(b,dt,e)=>G.Demon?.update(b,dt,e),status:(b,e)=>G.Demon?.status(b,e)||[]},
    holy:{update:(b,dt,e)=>G.Holy.update(b,dt,e),status:(b,e)=>G.Holy.status(b,e)},
    ghost:{update:(b,dt,e)=>G.Ghost.update(b,dt,e),status:(b,e)=>G.Ghost.status(b,e)},
    magnet:{update:(b,dt,e)=>G.Magnet.update(b,dt,e),status:(b,e)=>G.Magnet.status(b,e)},
    time:{update:(b,dt,e)=>G.Temporal.update(b,dt,e),status:(b,e)=>G.Temporal.status(b,e)},
    normal: {attackMultiplier:b=>b.charges>=3&&!G.Arcana?.busy(b)&&(!G.ManualRoles?.normalOwned(b)||G.ManualRoles.heavyReady(b))?1.3:1,onHit:(b,h,e)=>G.Roles.normalHit(b,h,e),status:(b,e)=>G.Roles.status(b,e)},
    accelerator: {
      update(ball, dt,engine) { if(!G.Overdrive?.active(ball))ball.speed = Math.min(ball.def.maxSpeed, ball.speed + ball.def.acceleration * dt); },
      attackMultiplier(ball) { return 1 + 0.40 * ((G.Overdrive?.active(ball)?Math.min(ball.speed,ball.def.maxSpeed):ball.speed) - ball.def.speed) / (ball.def.maxSpeed - ball.def.speed); },
      status(ball,engine) { return [{label:'动能',value:'+' + ((this.attackMultiplier(ball)-1)*100).toFixed(0)+'%'},{label:'速限',value:ball.def.maxSpeed},...G.Recovery.pressureStatus(ball),{label:'撞墙/敌',value:'+'+ball.def.wallBoost+'/+'+ball.def.hitBoost},{label:'累计返速',value:'+'+(ball.stats.speedReturned||0).toFixed(0)}]; },
      onContact(ball, engine) { if(G.Overdrive?.active(ball))return;const old = ball.speed; ball.speed = Math.min(ball.def.maxSpeed, old + ball.def.hitBoost); G.Physics.normalizeSpeed(ball); if (old < ball.speed) engine.burst(ball.x, ball.y, ball.def.color, 8); }
    },
    vampire: {onContact:(b,e)=>{b.role.blood=Math.min(8,b.role.blood+2);},healing:(b,damage)=>damage*b.def.lifesteal,status:(b,e)=>G.Roles.status(b,e)},
    reflector: {update:(b,dt,e)=>G.Roles.reflectorUpdate(b,dt,e),reflection:(b,actual)=>b.stance.phase==='active'?actual*(G.Awakening.active(b)?.6:b.def.reflection):0,onReceive:(b,h,e)=>G.Roles.reflectorReceive(b,h,e),status:(b,e)=>G.Roles.status(b,e)},
    shield: {update:(b,dt,e)=>G.Roles.shieldUpdate(b,dt,e),status:(b,e)=>G.Roles.status(b,e)},
    boomerang: {
      update(ball,dt,engine){if(G.BladeHunt)return G.BladeHunt.update(ball,dt,engine);const enemy=G.World.targetFor(ball,engine);if(enemy)G.Aim.direct(ball,enemy,engine,'blade',ball.def.shotSpeed);if(engine.state==='running' && engine.time+1e-9>=ball.nextShot && ball.character.bladeRemaining===0 && G.World.targetFor(ball,engine)){ball.character.bladeAdaptiveId=G.Adaptive?.begin(ball,'blade',engine);ball.character.bladeLost=false;ball.character.caughtInCast=0;const awake=G.Awakening.active(ball),castId=++ball.bladeCastId;for(const offset of awake?[-.16,.16]:[0])G.World.fire(ball,engine,{mode:'boomerang',castId,angleOffset:offset,damage:awake&&offset>0?2.3:ball.def.shotDamage});G.Adaptive?.close(ball,ball.character.bladeAdaptiveId);engine.sound('throw',ball.x);ball.nextShot=engine.time+(awake?4.2:ball.def.shotPeriod);}},
      status(ball,engine){if(G.BladeHunt)return G.BladeHunt.status(ball,engine);return [{label:'刃伤',value:G.Combat.attackValue(ball,engine,ball.def.shotDamage).toFixed(1)},{label:'投掷',value:Math.max(0,ball.nextShot-engine.time).toFixed(1)+'s'},{label:'武器',value:ball.character.bladeRemaining?'在外 '+ball.character.bladeRemaining:'手中'},{label:'接刃',value:ball.character.catchUntil>engine.time?'重击就绪':'未蓄势'},{label:'回斩',value:(G.Combat.attackValue(ball,engine,ball.def.shotDamage)*1.5).toFixed(1)},...G.Recovery.refundStatus(ball)];}
    },
    laser: {update:(b,dt,e)=>G.Roles.laserUpdate(b,dt,e),status:(b,e)=>G.Roles.status(b,e)},
    venom: {
      update(ball,dt,engine){G.Flyers?.poisonUpdate(ball,engine);if(!G.ManualRoles?.owns(ball,engine)&&engine.state==='running'&&engine.time+1e-9>=ball.nextPool){G.World.pool(ball,engine);ball.nextPool=engine.time+G.Venom.config.poolPeriod;}},
      status(ball,engine){return G.Venom.status(ball,engine);}
    },
    ranger: {update:(b,dt,e)=>G.Roles.rangerUpdate(b,dt,e),status:(b,e)=>G.Roles.status(b,e)},
    trapper: {
      update(ball, dt, engine) { if (!G.ManualRoles?.owns(ball,engine) && engine.state==='running' && engine.time+1e-9>=ball.nextTrap) { if(G.World.placeTrap(ball,engine)!==false)ball.nextTrap=engine.time+G.Awakening.trapOptions(ball).period; } },
      status(ball,engine) { return G.Roles.status(ball,engine); }
    }
  };
  G.Combat = {
    // The UI displays this value before ±20% seeded variation and shield absorption.
    attackValue(ball,engine,base=ball.def.damage,kind='contact') { if(ball.type==='accelerator'&&kind==='contact'&&base===ball.def.damage&&G.Awakening.dashing(ball,engine)&&!ball.awakening.dashHit)return 18*engine.heatMultiplier;return base*(G.Skills[ball.type]?.attackMultiplier?.(ball)||1)*G.Characters.attackMultiplier(ball,engine,base,kind)*(kind==='contact'?G.Roles.multiplier(ball):1)*(kind==='contact'&&base===ball.def.damage?1+ball.pressure.bonus:1)*G.Awakening.attackMultiplier(ball)*engine.heatMultiplier; },
    rollAttack(ball,engine,base=ball.def.damage,kind='contact') { return this.attackValue(ball,engine,base,kind)*engine.rng.between(0.8,1.2); },
    grantReduction(ball,engine,duration){ball.role.damageReductionUntil=Math.max(ball.role.damageReductionUntil||0,engine.time+Math.max(0,duration));},
    reduction(ball,engine){return (ball.role.damageReductionUntil>engine.time||G.LaserBlade?.active(ball)) ? 0.3 : 0;},
    applyDamage(ball, raw, engine, options = {}) {
      if(engine.ending||engine.state==='ended')return {actual:0,blocked:0,avoided:raw};
      if(G.World.absent(ball,engine)||G.VampireArcana?.immune(ball)||!options.bypassInvulnerability&&G.Arcana?.immune(ball))return {actual:0,blocked:0,avoided:raw};
      if(G.Ghost.phased(ball)){if(raw>0&&!options.silent)G.Adaptive?.goodKey(ball,'ghost');if(!options.silent&&raw>0&&engine.time-(ball.ghost.lastEvade??-Infinity)>.3){engine.float(ball.x,ball.y-30,'虚化','#d8f5f8');ball.ghost.lastEvade=engine.time;}return {actual:0,blocked:0,avoided:raw};}
      if(!options.bypassInvulnerability && G.Awakening.dashing(ball,engine)){
        if(!options.silent && raw>0 && engine.time-(ball.awakening.lastEvade??-Infinity)>.12){engine.float(ball.x,ball.y-28,'无敌','#fff1a4');ball.awakening.lastEvade=engine.time;}
        return {actual:0,blocked:0,avoided:raw};
      }
      if(!options.damageReduced)raw*=1-this.reduction(ball,engine);
      const oldShield=ball.shield;
      const royal=options.bypassShield?0:G.DefenseArcana?.absorbRoyal(ball,raw,engine)||0;
      const normalBlocked=options.bypassShield?0:Math.min(ball.shield,Math.max(0,raw-royal)),blocked=royal+normalBlocked;
      ball.shield = Math.max(0, ball.shield - normalBlocked);
      ball.stats.absorbed += blocked;G.Roles.absorb(ball,blocked,engine);
      G.DefenseArcana?.afterAbsorb(ball,engine);
      if(oldShield>0 && ball.shield===0 && ball.type==='shield' && G.Awakening.active(ball)){ball.awakening.pendingBurst=true;G.Roles.shieldEnd(ball,engine);}
      const healthRaw=Math.max(0,raw-blocked),actual=Math.min(ball.hp,healthRaw);
      const converted=G.VenomArcana?.receive(ball,healthRaw,engine,options),hpLoss=Math.min(ball.hp,converted?.immediate??healthRaw);
      ball.hp=Math.max(0,ball.hp-hpLoss);
      if(ball.type==='ranger'&&actual>0)G.Ranger?.receiveDamage(ball,engine);
      if(ball.type==='reflector'&&ball.stance.phase==='active'&&actual>0)ball.role.stanceDamage=(ball.role.stanceDamage||0)+actual;
      if (!options.silent) {
        ball.flash = 0.16;
        if (actual > 0) {
          const strong=options.strong===true;
          ball.hitVisual={age:0,life:.14,angle:Math.atan2(ball.vy,ball.vx),power:strong?1.4:1};
          if(hpLoss>0){engine.float(ball.x,ball.y-25,'−'+hpLoss.toFixed(1),options.reflected?'#c7b5ff':'#f4d2d5',strong);const number=engine.effects.at(-1);if(number?.kind==='text')number.damageTarget=ball.id;}

          if(options.reflected)engine.sound('reflect',ball.x);
        }
        if(oldShield>0 && ball.shield===0 && blocked>0){engine.signal(ball,'护盾破裂','break');engine.sound('break',ball.x);engine.burst(ball.x,ball.y,ball.holy?ball.def.color:'#a1ffeb',18);engine.impact(ball.x,ball.y,ball.holy?ball.def.color:'#a1ffeb',1.4);}
        if (blocked > 0) { engine.float(ball.x, ball.y + 30, '盾 −' + blocked.toFixed(1), ball.def.color); engine.ring(ball.x, ball.y, ball.def.color, 38); }
      }
      return {actual,blocked,hpLoss,deferred:converted?.deferred||0};
    },
    contactAttacks(a,b,engine,impact=G.Physics.contactInfo(a,b)) {
      if(G.Ghost.phased(a)||G.Ghost.phased(b)||G.Arcana?.noContact(a)||G.Arcana?.noContact(b)||(engine.mode==='2v2'&&!G.World.enemy(a,b,engine)))return [];
      const attacks=[{source:a,target:b,raw:this.rollAttack(a,engine),kind:'contact',impact:{nx:impact.nx,ny:impact.ny,closing:impact.closing,forward:impact.aForward,speed:impact.aSpeed},dash:G.Awakening.dashing(a,engine)&&!a.awakening.dashHit},{source:b,target:a,raw:this.rollAttack(b,engine),kind:'contact',impact:{nx:-impact.nx,ny:-impact.ny,closing:impact.closing,forward:impact.bForward,speed:impact.bSpeed},dash:G.Awakening.dashing(b,engine)&&!b.awakening.dashHit}];
      G.Roles.prepareContacts(attacks,engine);for(const hit of attacks)if(hit.dash)G.Characters.dashContact(hit.source,hit.target,engine);
      for(const ball of [a,b])if(G.Awakening.dashing(ball,engine)){ball.awakening.dashHit=true;ball.awakening.stopAfterContact=true;}
      attacks.push(...G.Magnet.contactPackets(a,b,engine,impact));
      attacks.push(...G.Characters.contactExtras(a,b,engine),...G.Characters.contactExtras(b,a,engine));return attacks;
    },
    contact(a,b,engine) { this.resolveBatch(this.contactAttacks(a,b,engine),engine,[[a,b]]); },
    resolveBatch(packets,engine,contacts=[]) {
      if(engine.ending||engine.state==='ended')return;
      packets=packets.filter(p=>!G.World.absent(p.target,engine));
      packets=packets.map(p=>G.Priority?.shieldPacket(p,engine)||p).map(p=>G.Venom.contactPacket(p,engine));
      G.DefenseArcana?.preempt(packets,engine);
      // Sample protective contact before simultaneous attacks consume the shield.
      for(const [a,b] of contacts)G.Holy?.contact(a,b,engine);
      // All attacks in this fixed tick are snapshotted before any life changes.
      const hits=packets.filter(p=>p.source.hp>0 && p.target.hp>0 && p.raw>0 && (engine.mode!=='2v2'||G.World.enemy(p.source,p.target,engine)));
      const totals=new Map(),received=new Map(),returns=new Map(),heals=new Map();
      for(const hit of hits) totals.set(hit.target,(totals.get(hit.target)||0)+hit.raw);
      for(const [target,total] of totals){const group=hits.filter(h=>h.target===target),piercing=group.filter(h=>h.bypassShield).reduce((n,h)=>n+h.raw,0);
        received.set(target,piercing||group.some(h=>h.shatterShield)?G.Arcana.mixedDamage(target,total,total-piercing,piercing,group.some(h=>h.shatterShield),engine):this.applyDamage(target,total,engine));}
      for(const hit of hits) {
        // Simultaneous overkill/absorption is allocated proportionally, not by iteration order.
        const share=hit.raw/totals.get(hit.target),result=received.get(hit.target);
        if(result.piercingRaw!==undefined){const n=hit.bypassShield?result.piercingRaw:result.ordinaryRaw;hit.actual=(hit.bypassShield?result.piercingActual:result.ordinaryActual)*hit.raw/n;hit.blocked=hit.bypassShield?0:result.blocked*hit.raw/n;}else{hit.actual=result.actual*share;hit.blocked=result.blocked*share;}hit.avoided=(result.avoided||0)*share;
        hit.source.stats.damage+=hit.actual;G.Magnet.hit(hit,engine);G.Ghost.hit(hit,engine);G.Holy?.hit(hit,engine);G.Roles.hit(hit,engine);G.Characters.hit(hit,engine);G.Demon?.hit(hit,engine);G.Cosmic?.hit(hit,engine);G.Charge?.hit(hit,engine);G.Stellar?.hit(hit,engine);G.Arcana?.hit(hit,engine);
        const canReturn=!hit.noReflect&&hit.damageOrigin!=='wall'&&hit.kind!=='wallSlam'&&!(hit.kind==='magneticWall'&&hit.pullWall);
        if(canReturn)G.Skills[hit.target.type]?.onReceive?.(hit.target,hit,engine);
        const reflection=canReturn?G.Skills[hit.target.type]?.reflection?.(hit.target,hit.actual,engine)||0:0;
        returns.set(hit.source,(returns.get(hit.source)||0)+reflection);
        hit.reflection=reflection;G.Adaptive?.hit(hit,engine);
        heals.set(hit.source,(heals.get(hit.source)||0)+(hit.healRatio!==undefined?hit.actual*hit.healRatio:(G.Skills[hit.source.type]?.healing?.(hit.source,hit.actual)||0)));
        if(hit.kind==='shot'||hit.kind==='boomerang')hit.source.stats.shotsHit++;
        if(hit.kind==='laser'&&(hit.beamId===undefined||hit.source.role.lastBeamHit!==hit.beamId)){hit.source.stats.lasersHit++;hit.source.role.lastBeamHit=hit.beamId;}
        if(hit.kind==='poison')hit.source.stats.poisonHits++;
        if(hit.kind==='counter'||hit.mirrorReturn&&hit.actual+hit.blocked>0)hit.source.stats.countersHit++;
        G.Recovery.hit(hit.source,hit,engine);G.Skills[hit.source.type]?.onHit?.(hit.source,hit,engine);
        if(hit.dash && hit.actual>0){hit.source.stats.dashHits++;hit.source.awakening.dashSuccess=true;engine.signal(hit.source,'冲刺命中','heavy',hit.target);}
        if(hit.kind==='poisonShot'&&hit.actual>0){engine.sound('toxinSplash',hit.target.x);engine.burst(hit.target.x,hit.target.y,hit.source.def.color,5);}if(hit.kind==='shard'&&hit.actual>0)engine.sound('shardHit',hit.target.x);if(hit.kind==='poison' && hit.actual>0)engine.sound('poisonHit',hit.target.x);
        if(hit.actual>0 && hit.actual<15 && !hit.feedback && !hit.dance && !hit.heavyShot && hit.beamId===undefined && ['shot','boomerang','counter','laser'].includes(hit.kind)){engine.sound(hit.kind==='laser'?'laserHit':hit.kind==='counter'?'counterHit':'shotHit',hit.target.x);engine.impact(hit.target.x,hit.target.y,hit.source.def.color,hit.kind==='laser'?1.6:.65);if(hit.kind==='laser')engine.signal(hit.source,'光束命中','laserHit',hit.target);if(hit.kind==='counter')engine.signal(hit.source,'蓄能反击命中','counterHit',hit.target);if(hit.kind==='boomerang' && hit.returning)engine.signal(hit.source,'回程命中','returnHit',hit.target);}
        if(hit.blocked>0 && !hit.actual)engine.sound('shieldHit',hit.target.x);
        if(hit.kind==='trap') hit.source.stats.trapsTriggered++;
      }
      for(const [attacker,total] of returns) if(total>0) {
        const reflected=this.applyDamage(attacker,total,engine,{reflected:true});
        for(const hit of hits.filter(p=>p.source===attacker && p.reflection>0)) {
          const share=hit.reflection/total;hit.reflectedActual=reflected.actual*share;if(reflected.actual*share>=15)hits.push({source:hit.target,target:attacker,kind:'reflection',actual:reflected.actual*share,blocked:reflected.blocked*share,avoided:0,raw:hit.reflection});hit.target.stats.reflected+=reflected.actual*share;hit.target.stats.damage+=reflected.actual*share;
        }
      }
      G.Roles.finishImpacts(hits,engine);G.Arcana?.afterImpacts(hits,engine);
      for(const hit of hits)if(hit.source.type==='vampire'&&hit.kind==='bloodFinish'&&!hit.avoided&&hit.actual+hit.blocked>0)G.Roles.cleanse(hit.source,engine);
      let healed=0;
      for(const [ball,requested] of heals) if(ball.hp>0) {
        const heal=Math.min(ball.maxHp-ball.hp,requested);
        if(heal>0) {ball.hp+=heal;ball.stats.healing+=heal;healed+=heal;if(!(G.VampireArcana?.active(ball)&&hits.some(h=>h.source===ball&&h.kind==='arcTide'&&h.actual>0&&h.healRatio>0))){engine.float(ball.x,ball.y+5,'+'+heal.toFixed(1),'#88efb2');engine.burst(ball.x,ball.y,'#88efb2',10);engine.ring(ball.x,ball.y,'#88efb2',42);engine.sound('heal',ball.x);}G.Arcana?.healed?.(ball,heal,requested,hits,engine);}
      }
      for(const [a,b] of contacts) { G.Skills[a.type]?.onContact?.(a,engine); G.Skills[b.type]?.onContact?.(b,engine); }
      // Keep impact-tick immunity through simultaneous damage and reflection.
      for(const ball of engine.balls)if(ball.awakening.stopAfterContact)G.Awakening.finishDash(ball,engine);
      if(contacts.length) {
        const contactHits=hits.filter(p=>p.kind==='contact');
        const lost=id=>contactHits.filter(p=>p.target.id===id).reduce((sum,p)=>sum+p.actual,0);
        let message=`碰撞 #${engine.collisions} · 左 −${lost(0).toFixed(1)} / 右 −${lost(1).toFixed(1)}`;
        if(contactHits.some(p=>p.avoided>0))message+=' · 无敌抵消';if(contactHits.some(p=>p.blocked>0))message+=' · 护盾抵消';if(contactHits.some(p=>p.reflection>0))message+=' · 反伤';if(healed>0)message+=' · 吸血 +'+healed.toFixed(1);
        if(engine.mode==='2v2')message=`碰撞 #${engine.collisions} · `+contactHits.map(h=>engine.label(h.target)+' −'+h.actual.toFixed(1)).join(' / ');engine.log(message);
      }
      // Keep combat-owned metadata for the lethal attack's bounded recovery.
      (engine.resolvedThisTick??=[]).push(...hits.filter(h=>h.actual>0).map(h=>({source:h.source.id,target:h.target.id,kind:h.kind,heavy:!!h.feedback,actual:h.actual})));
      G.Demon?.afterBatch(engine);G.Cosmic?.afterBatch(engine);G.Stellar?.afterBatch(engine);G.DefenseArcana?.afterBatch(hits,engine);
      G.Presentation?.observeHits(hits,engine);
      for(const hit of hits.filter(p=>p.kind!=='contact' && p.kind!=='chain')) {
        let message=`${engine.label(hit.source)}${({shot:'子弹命中',trap:'陷阱触发',counter:'蓄能反击',boomerang:'飞刃命中',bladeSlash:'接刃斩击',laser:'光束命中',poison:'腐蚀毒伤',poisonShot:'毒液直击',shard:'破片命中',toxinBurst:'满毒引爆',wallSlam:'撞墙追击',barrier:'破盾波命中',timeBlast:'时钟爆炸',holyWater:'圣水灼烧',holyBurn:'神圣灼伤',holyTouch:'圣光触碰',holyLight:'圣阵落光',holyJudgement:'圣裁命中',fear:hit.echo?'魂影恐吓':'虚化恐吓',soulBurst:hit.echo?'魂影回爆':'退相魂爆',demonClaw:'魔爪命中',demonExecution:'灵魂处刑',demonDual:'双锁处刑',demonTerminal:'断链终结',timeErode:'时间侵蚀',magneticContact:'吸引动能撞击',magneticWall:'排斥动能墙撞',stormBolt:'落雷命中',staticShock:'导电电解',arcFist:'奥义轰拳',arcSonic:engine.mode==='arcana'?'压力环穿盾':'音爆破盾',arcPierce:'穿甲反击',arcBlood:engine.mode==='arcana'?'血刃绞杀':'血刃噬心',arcBite:'贴身噬心',arcCage:'收监爆破',arcTide:'血潮夺血',hunt:'蝙蝠追猎',comet:'彗星命中',orbitTouch:'卫星擦击',starSplash:'星爆波及',starResonance:'三星共振',supernova:'超新星命中',wallArc:'沿墙电击',grounding:'接地短路'})[hit.kind]||'技能命中'} · ${engine.mode==='2v2'?engine.label(hit.target):hit.target.id===0?'左':'右'} −${hit.actual.toFixed(1)}`;
        if(hit.avoided>0)message+=' · 无敌抵消';if(hit.blocked>0)message+=' · 盾 −'+hit.blocked.toFixed(1);if(hit.reflection>0)message+=' · 反伤';engine.log(message);
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
