(function (root) {
  'use strict';
  const G = root.OrbDuel;
  // Limited compensation for contact-dependent species. Never steers or adds attacks.
  G.Recovery={
    pressure(ball,engine){if(ball.def.pressureCap)ball.pressure.bonus=Math.min(ball.def.pressureCap,Math.max(0,engine.time-ball.pressure.lastHit-ball.def.pressureWait)*ball.def.pressureRate);},
    hit(ball,hit,engine){if(!ball.def.pressureCap||hit.actual<=0)return;if(ball.pressure.bonus>.01&&hit.kind==='contact')engine.signal(ball,'蓄力命中 +'+Math.round(ball.pressure.bonus*100)+'%','heavy',hit.target);ball.pressure.lastHit=engine.time;ball.pressure.bonus=0;},
    refund(ball,engine,field,amount,label,timers=ball){if(!Number.isFinite(timers[field]))return 0;const saved=Math.min(amount,Math.max(0,timers[field]-engine.time-.2));if(saved<=1e-8)return 0;timers[field]-=saved;ball.stats.cdReturned+=saved;engine.signal(ball,label+' · CD−'+saved.toFixed(1)+'s','miss');return saved;},
    pressureStatus(ball){return [{label:'蓄力',value:'+'+Math.round(ball.pressure.bonus*100)+'%'}];},
    refundStatus(ball){return [{label:'返还CD',value:ball.stats.cdReturned.toFixed(1)+'s'}];}
  };
  G.Skills = {
    normal: {
      attackMultiplier(ball){return ball.charges===3?1.35:1;},
      onHit(ball,hit,engine){if(hit.kind!=='contact'||hit.actual<=0)return;if(ball.charges===3){ball.charges=0;ball.stats.heavyHits++;engine.signal(ball,'重击命中','heavy',hit.target);}else{ball.charges++;if(ball.charges===3)engine.signal(ball,'重击就绪','ready');}},
      status(ball){return [{label:'重击',value:ball.charges+'/3'+(ball.charges===3?' ★':'')},...G.Recovery.pressureStatus(ball)];}
    },
    // Each species can add lifecycle hooks without modifying collision physics.
    accelerator: {
      update(ball, dt,engine) { if(engine.time>=ball.character.recoveryUntil)ball.speed = Math.min(ball.def.maxSpeed, ball.speed + ball.def.acceleration * dt); },
      attackMultiplier(ball) { return 1 + 0.40 * (ball.speed - ball.def.speed) / (ball.def.maxSpeed - ball.def.speed); },
      status(ball,engine) { return [{label:'动能',value:'+' + ((this.attackMultiplier(ball)-1)*100).toFixed(0)+'%'},{label:'速限',value:ball.def.maxSpeed},...G.Recovery.pressureStatus(ball),{label:'恢复',value:Math.max(0,ball.character.recoveryUntil-engine.time).toFixed(1)+'s'},...G.Recovery.refundStatus(ball)]; },
      onContact(ball, engine) { if(engine.time<ball.character.recoveryUntil)return;const old = ball.speed; ball.speed = Math.min(ball.def.maxSpeed, old + ball.def.hitBoost); G.Physics.normalizeSpeed(ball); if (old < ball.speed) engine.burst(ball.x, ball.y, ball.def.color, 8); }
    },
    vampire: { healing(ball, actualDamage) { return actualDamage * ball.def.lifesteal; }, status(ball) { return [{label:'吸血',value:(ball.def.lifesteal*100).toFixed(0)+'%'},{label:'已回复',value:ball.stats.healing.toFixed(1)}]; } },
    reflector: {
      update(ball,dt,engine){
        if(engine.state!=='running')return;const s=ball.stance,t=engine.time,awake=G.Awakening.active(ball);
        if(s.phase==='active' && t+1e-9>=s.until){
          s.phase='rest';
          if(awake && s.stored>0 && ball.hp>0){G.World.counter(ball,engine,s.stored);s.stored=0;}
        }
        if(s.phase==='warning' && t+1e-9>=s.until){s.phase='active';s.until=t+(awake?3.4:ball.def.stanceDuration);engine.signal(ball,'反击姿态','stance');}
        if(t+1e-9>=s.next && s.phase!=='active'){
          s.phase='warning';s.until=t+ball.def.stanceWarning;s.next=t+ball.def.stancePeriod;engine.sound('ready',ball.x);
        }
      },
      reflection(ball,actual,engine){return ball.stance.phase==='active'?actual*(G.Awakening.active(ball) ? .9 : ball.def.reflection):0;},
      onReceive(ball,hit,engine){if(hit.actual>0 && ball.stance.phase==='active' && G.Awakening.active(ball))ball.stance.stored=Math.min(8*engine.heatMultiplier,ball.stance.stored+hit.actual*.25);},
      status(ball,engine){const s=ball.stance;return [{label:'姿态',value:{warning:'预警',active:'反击中',rest:'空窗'}[s.phase]},{label:'反伤',value:(s.phase==='active'?(G.Awakening.active(ball)?90:ball.def.reflection*100):0)+'%'},{label:s.phase==='rest'?'下次姿态':'剩余',value:Math.max(0,(s.phase==='rest'?s.next:s.until)-engine.time).toFixed(1)+'s'},...(G.Awakening.active(ball)?[{label:'蓄能',value:s.stored.toFixed(1)+' / '+(8*engine.heatMultiplier).toFixed(1)}]:[])];}
    },
    shield: {
      update(ball, dt, engine) {
        const shield=G.Awakening.shieldOptions(ball);
        if (engine.time >= ball.shieldUntil) ball.shield = 0;
        if (engine.time + 1e-9 >= ball.nextShield) {
          ball.shield = shield.amount;
          ball.shieldUntil = engine.time + shield.duration;
          ball.nextShield += shield.period;
          engine.ring(ball.x, ball.y, ball.def.color, 48);engine.sound('shield',ball.x);
          engine.log(`${engine.label(ball)}获得 ${shield.amount} 点护盾`);
        }
      },
      status(ball, engine) { return [{label:'护盾',value:ball.shield.toFixed(1)},{label:'充能',value:Math.max(0,ball.nextShield-engine.time).toFixed(1)+'s'},{label:'盾时',value:Math.max(0,ball.shieldUntil-engine.time).toFixed(1)+'s'},...G.Recovery.pressureStatus(ball)]; }
    },
    boomerang: {
      update(ball,dt,engine){if(engine.state==='running' && engine.time+1e-9>=ball.nextShot && ball.character.bladeRemaining===0){ball.character.bladeLost=false;const awake=G.Awakening.active(ball),castId=++ball.bladeCastId;for(const offset of awake?[-.16,.16]:[0])G.World.fire(ball,engine,{mode:'boomerang',castId,angleOffset:offset,damage:awake?2.8:ball.def.shotDamage});engine.sound('throw',ball.x);ball.nextShot=engine.time+(awake?4.2:ball.def.shotPeriod);}},
      status(ball,engine){return [{label:'刃伤',value:G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?2.8:ball.def.shotDamage).toFixed(1)},{label:'投掷',value:Math.max(0,ball.nextShot-engine.time).toFixed(1)+'s'},{label:'武器',value:ball.character.bladeRemaining?'在外 '+ball.character.bladeRemaining:'手中'},{label:'接刃',value:ball.character.catchUntil>engine.time?'重击就绪':'未蓄势'},{label:'回斩',value:(G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?2.8:ball.def.shotDamage)*1.5).toFixed(1)},...G.Recovery.refundStatus(ball)];}
    },
    laser: {
      update(ball,dt,engine){if(engine.state!=='running')return;const awake=G.Awakening.active(ball);if(ball.laser && engine.time+1e-9>=ball.laser.fireAt){G.World.laser(ball,engine);ball.laser=null;}if(!ball.laser && engine.time+1e-9>=ball.nextLaser){const target=G.World.targetFor(ball,engine);if(!target)return;const delay=awake ? .55 : ball.def.laserCharge,origin=G.Awakening.predict(ball,delay),dest=G.Awakening.predict(target,delay);ball.laser={origin,angle:Math.atan2(dest.y-origin.y,dest.x-origin.x),fireAt:engine.time+delay};ball.nextLaser=engine.time+(awake?4.8:ball.def.laserPeriod);engine.sound('charge',ball.x);}},
      status(ball,engine){return [{label:'束伤',value:G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?18:ball.def.laserDamage).toFixed(1)},{label:ball.laser?'蓄力':'冷却',value:Math.max(0,(ball.laser?.fireAt??ball.nextLaser)-engine.time).toFixed(1)+'s'},{label:'命中',value:ball.stats.lasersHit+'/'+ball.stats.lasersFired},{label:'落空',value:ball.laserMisses+'/2'},...G.Recovery.refundStatus(ball)];}
    },
    venom: {
      update(ball,dt,engine){if(engine.state==='running'&&engine.time+1e-9>=ball.nextPool){G.World.pool(ball,engine);ball.nextPool+=G.Awakening.active(ball)?3.4:ball.def.poolPeriod;}},
      status(ball,engine){return [{label:'毒伤/层',value:G.Combat.attackValue(ball,engine,G.Awakening.active(ball)?ball.def.awakePoolDamage:ball.def.poolDamage).toFixed(1)},{label:'毒爆',value:(ball.def.toxinBurst*engine.heatMultiplier).toFixed(1)},{label:'引爆CD',value:Math.max(0,ball.character.burstAt-engine.time).toFixed(1)+'s'},{label:'留池',value:Math.max(0,ball.nextPool-engine.time).toFixed(1)+'s'},{label:'毒池',value:engine.pools.filter(p=>p.owner===ball.id).length+'/2'},...G.Recovery.refundStatus(ball)];}
    },
    ranger: {
      update(ball, dt, engine) { if (engine.state==='running' && engine.time+1e-9>=ball.nextShot) { for(const angleOffset of G.Awakening.active(ball)?[-.18,0,.18]:[0])G.World.fire(ball,engine,{angleOffset,damage:G.Awakening.shotDamage(ball)}); engine.sound('shot',ball.x);ball.nextShot+=G.Awakening.shotPeriod(ball); } },
      status(ball,engine) { return [{label:'弹伤',value:G.Combat.attackValue(ball,engine,G.Awakening.shotDamage(ball)).toFixed(1)},{label:'装填',value:Math.max(0,ball.nextShot-engine.time).toFixed(1)+'s'},{label:'命中',value:ball.stats.shotsHit+'/'+ball.stats.shotsFired}]; }
    },
    trapper: {
      update(ball, dt, engine) { if (engine.state==='running' && engine.time+1e-9>=ball.nextTrap) { G.World.placeTrap(ball,engine); ball.nextTrap+=G.Awakening.trapOptions(ball).period; } },
      status(ball,engine) { return [{label:'雷伤',value:G.Combat.attackValue(ball,engine,G.Awakening.trapOptions(ball).damage).toFixed(1)},{label:'布置',value:Math.max(0,ball.nextTrap-engine.time).toFixed(1)+'s'},{label:'陷阱',value:engine.traps.filter(t=>t.owner===ball.id).length+'/'+G.Awakening.trapOptions(ball).cap},...G.Recovery.refundStatus(ball)]; }
    }
  };
  G.Combat = {
    // The UI displays this value before ±20% seeded variation and shield absorption.
    attackValue(ball,engine,base=ball.def.damage,kind='contact') { return base*(G.Skills[ball.type]?.attackMultiplier?.(ball)||1)*G.Characters.attackMultiplier(ball,engine,base,kind)*(kind==='contact'&&base===ball.def.damage?1+ball.pressure.bonus:1)*G.Awakening.attackMultiplier(ball)*engine.heatMultiplier; },
    rollAttack(ball,engine,base=ball.def.damage,kind='contact') { return this.attackValue(ball,engine,base,kind)*engine.rng.between(0.8,1.2); },
    applyDamage(ball, raw, engine, options = {}) {
      if(!options.bypassInvulnerability && G.Awakening.dashing(ball,engine)){
        if(!options.silent && raw>0 && engine.time-(ball.awakening.lastEvade??-Infinity)>.12){engine.float(ball.x,ball.y-28,'无敌','#fff1a4');ball.awakening.lastEvade=engine.time;}
        return {actual:0,blocked:0,avoided:raw};
      }
      const oldShield=ball.shield;
      const blocked = options.bypassShield ? 0 : Math.min(ball.shield, raw);
      ball.shield = Math.max(0, ball.shield - blocked);
      ball.stats.absorbed += blocked;
      if(oldShield>0 && ball.shield===0 && ball.type==='shield' && G.Awakening.active(ball))ball.awakening.pendingBurst=true;
      const actual = Math.min(ball.hp, Math.max(0, raw - blocked));
      ball.hp = Math.max(0, ball.hp - actual);
      if (!options.silent) {
        ball.flash = 0.16;
        if (actual > 0) {
          const strong=actual>=15;
          ball.hitVisual={age:0,life:.14,angle:Math.atan2(ball.vy,ball.vx),power:strong?1.4:1};
          engine.float(ball.x,ball.y-25,'−'+actual.toFixed(1),strong?'#fff0a4':options.reflected?'#c7b5ff':'#f4d2d5',strong);
          if(strong){engine.impact(ball.x,ball.y,'#fff0a4',1.5);if(!options.reflected)engine.sound('heavy',ball.x);}
          if(options.reflected)engine.sound('reflect',ball.x);
        }
        if(oldShield>0 && ball.shield===0 && blocked>0){engine.signal(ball,'护盾破裂','break');engine.sound('break',ball.x);engine.burst(ball.x,ball.y,'#a1ffeb',18);engine.impact(ball.x,ball.y,'#a1ffeb',1.4);}
        if (blocked > 0) { engine.float(ball.x, ball.y + 30, '盾 −' + blocked.toFixed(1), ball.def.color); engine.ring(ball.x, ball.y, ball.def.color, 38); }
      }
      return { actual, blocked };
    },
    contactAttacks(a,b,engine,impact=G.Physics.contactInfo(a,b)) {
      const attacks=[{source:a,target:b,raw:this.rollAttack(a,engine),kind:'contact',impact:{nx:impact.nx,ny:impact.ny,closing:impact.closing,forward:impact.aForward,speed:impact.aSpeed},dash:G.Awakening.dashing(a,engine)&&!a.awakening.dashHit},{source:b,target:a,raw:this.rollAttack(b,engine),kind:'contact',impact:{nx:-impact.nx,ny:-impact.ny,closing:impact.closing,forward:impact.bForward,speed:impact.bSpeed},dash:G.Awakening.dashing(b,engine)&&!b.awakening.dashHit}];
      for(const hit of attacks)if(hit.dash)G.Characters.dashContact(hit.source,hit.target,engine);
      for(const ball of [a,b])if(G.Awakening.dashing(ball,engine)){ball.awakening.dashHit=true;ball.awakening.stopAfterContact=true;}
      attacks.push(...G.Characters.contactExtras(a,b,engine),...G.Characters.contactExtras(b,a,engine));return attacks;
    },
    contact(a,b,engine) { this.resolveBatch(this.contactAttacks(a,b,engine),engine,[[a,b]]); },
    resolveBatch(packets,engine,contacts=[]) {
      // All attacks in this fixed tick are snapshotted before any life changes.
      const hits=packets.filter(p=>p.source.hp>0 && p.target.hp>0 && p.raw>0);
      const totals=new Map(),received=new Map(),returns=new Map(),heals=new Map();
      for(const hit of hits) totals.set(hit.target,(totals.get(hit.target)||0)+hit.raw);
      for(const [target,total] of totals) received.set(target,this.applyDamage(target,total,engine));
      for(const hit of hits) {
        // Simultaneous overkill/absorption is allocated proportionally, not by iteration order.
        const share=hit.raw/totals.get(hit.target),result=received.get(hit.target);
        hit.actual=result.actual*share;hit.blocked=result.blocked*share;hit.avoided=(result.avoided||0)*share;
        hit.source.stats.damage+=hit.actual;G.Characters.hit(hit,engine);G.Spectacle?.hit(engine,hit);
        if(!hit.noReflect)G.Skills[hit.target.type]?.onReceive?.(hit.target,hit,engine);
        const reflection=hit.noReflect?0:G.Skills[hit.target.type]?.reflection?.(hit.target,hit.actual,engine)||0;
        returns.set(hit.source,(returns.get(hit.source)||0)+reflection);
        hit.reflection=reflection;
        heals.set(hit.source,(heals.get(hit.source)||0)+(hit.healRatio!==undefined?hit.actual*hit.healRatio:(G.Skills[hit.source.type]?.healing?.(hit.source,hit.actual)||0)));
        if(hit.kind==='shot'||hit.kind==='boomerang')hit.source.stats.shotsHit++;
        if(hit.kind==='laser')hit.source.stats.lasersHit++;
        if(hit.kind==='poison')hit.source.stats.poisonHits++;
        if(hit.kind==='counter')hit.source.stats.countersHit++;
        G.Recovery.hit(hit.source,hit,engine);G.Skills[hit.source.type]?.onHit?.(hit.source,hit,engine);
        if(hit.dash && hit.actual>0){hit.source.stats.dashHits++;hit.source.awakening.dashSuccess=true;engine.signal(hit.source,'冲刺命中','heavy',hit.target);}
        if(hit.kind==='poison' && hit.actual>0)engine.sound('poisonHit',hit.target.x);
        if(hit.actual>0 && ['shot','boomerang','counter','laser'].includes(hit.kind)){engine.sound(hit.kind==='laser'?'laserHit':hit.kind==='counter'?'counterHit':'shotHit',hit.target.x);engine.impact(hit.target.x,hit.target.y,hit.source.def.color,hit.kind==='laser'?1.6:.65);if(hit.kind==='laser')engine.signal(hit.source,'光束命中','laserHit',hit.target);if(hit.kind==='counter')engine.signal(hit.source,'蓄能反击命中','counterHit',hit.target);if(hit.kind==='boomerang' && hit.returning)engine.signal(hit.source,'回程命中','returnHit',hit.target);}
        if(hit.blocked>0 && !hit.actual)engine.sound('shieldHit',hit.target.x);
        if(hit.kind==='trap') hit.source.stats.trapsTriggered++;
      }
      for(const [attacker,total] of returns) if(total>0) {
        const reflected=this.applyDamage(attacker,total,engine,{reflected:true});
        for(const hit of hits.filter(p=>p.source===attacker && p.reflection>0)) {
          const share=hit.reflection/total;hit.target.stats.reflected+=reflected.actual*share;hit.target.stats.damage+=reflected.actual*share;
        }
      }
      let healed=0;
      for(const [ball,requested] of heals) if(ball.hp>0) {
        const heal=Math.min(ball.maxHp-ball.hp,requested);
        if(heal>0) {ball.hp+=heal;ball.stats.healing+=heal;healed+=heal;engine.float(ball.x,ball.y+5,'+'+heal.toFixed(1),'#88efb2');engine.burst(ball.x,ball.y,'#88efb2',10);engine.ring(ball.x,ball.y,'#88efb2',42);engine.sound('heal',ball.x);}
      }
      for(const [a,b] of contacts) { G.Skills[a.type]?.onContact?.(a,engine); G.Skills[b.type]?.onContact?.(b,engine); }
      // Keep impact-tick immunity through simultaneous damage and reflection.
      for(const ball of engine.balls)if(ball.awakening.stopAfterContact)G.Awakening.finishDash(ball,engine);
      if(contacts.length) {
        const contactHits=hits.filter(p=>p.kind==='contact');
        const lost=id=>contactHits.filter(p=>p.target.id===id).reduce((sum,p)=>sum+p.actual,0);
        let message=`碰撞 #${engine.collisions} · 左 −${lost(0).toFixed(1)} / 右 −${lost(1).toFixed(1)}`;
        if(contactHits.some(p=>p.avoided>0))message+=' · 无敌抵消';if(contactHits.some(p=>p.blocked>0))message+=' · 护盾抵消';if(contactHits.some(p=>p.reflection>0))message+=' · 反伤';if(healed>0)message+=' · 吸血 +'+healed.toFixed(1);
        engine.log(message);
      }
      for(const hit of hits.filter(p=>p.kind!=='contact' && p.kind!=='chain')) {
        let message=`${engine.label(hit.source)}${({shot:'子弹命中',trap:'陷阱触发',counter:'蓄能反击',boomerang:'飞刃命中',laser:'光束命中',poison:'腐蚀毒伤',toxinBurst:'满毒引爆',wallSlam:'撞墙追击',barrier:'破盾波命中'})[hit.kind]||'技能命中'} · ${hit.target.id===0?'左':'右'} −${hit.actual.toFixed(1)}`;
        if(hit.avoided>0)message+=' · 无敌抵消';if(hit.blocked>0)message+=' · 盾 −'+hit.blocked.toFixed(1);if(hit.reflection>0)message+=' · 反伤';engine.log(message);
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
