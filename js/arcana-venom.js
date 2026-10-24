(function(root){
  'use strict';const G=root.OrbDuel;
  // This passive never owns movement or ordinary casts. The ledger is already-committed HP damage.
  const V=G.VenomArcana={
    state(b){return b.arcana?.venom;},
    eligible(b,e){return e.mode==='arcana'&&b.type==='venom'&&!!b.arcana;},
    fresh(){return {active:false,pool:0,received:0,paid:0,nextTick:Infinity,started:-Infinity,lastPulse:-Infinity};},
    ensure(b,e){if(!this.eligible(b,e))return null;return b.arcana.venom??=this.fresh();},
    amount(pool){return Math.min(pool,Math.max(1,pool*.2));},
    activate(b,e){const s=this.ensure(b,e);if(!s||s.active||b.arcana.used||b.hp<=0)return false;G.Arcana.commit(b,e);s.active=true;s.started=e.time;s.nextTick=e.time+.5;e.hitStop(.05);this.event(b,e,'activate');e.sound('arcVenomOpen',b.x);e.signal(b,'腐生 · 伤害缓蚀','ready');return true;},
    event(b,e,stage,amount=0){const s=this.state(b),eventId=b.arcana.castId+':venom:'+stage+':'+e.tick;G.Presentation?.note(e,'arcana.venom',{eventId,stage,actorId:b.id,pool:s.pool,amount});},
    receive(b,raw,e,options={}){const s=this.ensure(b,e);if(!s||raw<=0)return null;let immediate=raw;
      if(s.active)immediate=0;else if(!b.arcana.used&&G.HolySeals?.canStart(b,e)!==false&&b.hp-raw<=b.maxHp*.3+1e-9){immediate=Math.max(0,b.hp-b.maxHp*.3);this.activate(b,e);}
      const deferred=s.active?Math.max(0,raw-immediate):0;
      if(deferred>0){s.pool+=deferred;s.received+=deferred;G.VenomVisual?.hurt(b,e,deferred);if(!options.silent){if(deferred>=.1)e.float(b.x,b.y+29,'缓蚀 +'+deferred.toFixed(1),'#c1dd82');this.event(b,e,'bank',deferred);}}
      return {immediate,deferred};
    },
    tick(e){if(e.state!=='running'||e.ending||e.timeRewind?.active)return;G.VenomVisual?.update(e);for(const b of e.balls){const s=this.ensure(b,e);if(!s||b.hp<=0)continue;
        if(!s.active&&!b.arcana.used&&b.hp<=b.maxHp*.3+1e-9)this.activate(b,e);
        if(!Number.isFinite(s.nextTick))continue;
        // World time, never the actor's slowed clock; at most one pulse per half-second fixed tick.
        while(e.time+1e-9>=s.nextTick&&b.hp>0){s.nextTick+=.5;if(s.pool<=0)continue;const due=this.amount(s.pool),actual=Math.min(b.hp,due);s.pool=Math.max(0,s.pool-due);s.paid+=due;b.hp=Math.max(0,b.hp-actual);s.lastPulse=e.time;b.flash=.07;
          e.float(b.x,b.y-29,'−'+actual.toFixed(1),'#cbe99a');this.event(b,e,'pay',actual);
          if(!s.active&&!b.arcana.used&&b.hp>0&&b.hp<=b.maxHp*.3+1e-9)this.activate(b,e);
        }
      }},
    updateBar(b,bar){let layer=bar.querySelector('.debt-layer');const s=this.state(b),pool=s?.pool||0;
      if(pool>0&&!layer){layer=bar.ownerDocument.createElement('i');layer.className='debt-layer';bar.append(layer);}
      if(layer){layer.style.left=(Math.max(0,b.hp-pool)/b.maxHp*100)+'%';layer.style.width=(Math.min(b.hp,pool)/b.maxHp*100)+'%';layer.hidden=pool<=0;}
      bar.classList.toggle('debt-fatal',pool>=b.hp&&b.hp>0);if(s?.active||pool>0){const text='生命 '+b.hp.toFixed(1)+'，待结算 '+pool.toFixed(1)+'，下次扣血 '+this.amount(pool).toFixed(1)+(pool>=b.hp?'，存在致死风险':'');bar.setAttribute('aria-valuetext',text);bar.title=text;}else{bar.removeAttribute('aria-valuetext');bar.removeAttribute('title');}
    }
  };
  if(!G.Arcana?.health)return;
  G.Arcana.health.venom=220;G.Arcana.defs.venom={name:'腐生·万毒缓蚀',raw:0};
  const reset=G.Arcana.reset;G.Arcana.reset=function(e){reset.call(this,e);for(const b of e.balls)V.ensure(b,e);};
  const update=G.Arcana.update;G.Arcana.update=function(e,dt){for(const b of e.balls){const s=V.ensure(b,e);if(s&&!s.active&&!b.arcana.used&&b.hp>0&&b.hp<=b.maxHp*.3+1e-9)V.activate(b,e);}return update.call(this,e,dt);};
  const end=G.Engine.prototype.checkEnd;G.Engine.prototype.checkEnd=function(){V.tick(this);return end.call(this);};
  // Rewind restores HP but cannot erase unpaid damage. Historical Arcana qualification still applies.
  if(G.TimeRewind){const finish=G.TimeRewind.finish;G.TimeRewind.finish=function(e){const debts=e.balls.filter(b=>V.state(b)).map(b=>({id:b.id,castId:b.arcana.castId,state:{...V.state(b)}}));finish.call(this,e);for(const old of debts){const b=e.balls.find(v=>v.id===old.id),s=V.ensure(b,e);if(!s)continue;Object.assign(s,old.state,{active:!!b.arcana.used});if(s.active)b.arcana.castId=old.castId;if(s.active&& !Number.isFinite(s.nextTick))s.nextTick=e.time+.5;}};}
  const snapshot=G.Engine.prototype.snapshot;G.Engine.prototype.snapshot=function(){const s=snapshot.call(this);s.venomDebt=this.balls.filter(b=>V.state(b)).map(b=>({id:b.id,...V.state(b)}));return s;};
  const copy=G.Arcana.copy,status=G.Arcana.status;G.Arcana.copy=function(type){return type==='venom'?'奥义 · 腐生·万毒缓蚀：首次生命降至30%自动激活，无需觉醒、每局一次。跨阈值伤害只立即扣到30%，溢出及此后伤害全部入池。每0.5秒结算剩余池20%，最低1且不超过余量；空池后仍永久转化，不回血、不无敌。护盾先按原规则吸收，已入池伤害不可再挡或减免；原有施毒机制不变。':copy.call(this,type);};G.Arcana.status=function(b,e){const s=V.state(b);return s?{label:'待结算',value:s.active||s.pool>0?s.pool.toFixed(1):'30%自动触发'}:status.call(this,b,e);};
})(typeof window!=='undefined'?window:globalThis);
