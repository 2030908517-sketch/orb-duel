(function(root){
  'use strict';const G=root.OrbDuel,C=G.Constants;
  const labels={ranger:'重新定位',reflector:'镜面延长',shield:'屏障延长',vampire:'择机血契',laser:'重炮择机',venom:'喷吐校正',timeDomain:'领域择机',timeClock:'时钟择机',ghost:'虚化错拍',holyZone:'落点调整',holyJudgement:'圣裁错拍',demon:'择机抓捕',magnetPush:'排斥择机',blade:'回刃补偿',storm:'引雷择机',stormAwake:'雷暴择机',stellarVolley:'彗星择机',supernova:'星核择机',chargeCast:'放电择机',chargeForm:'雷化择机'};
  G.Adaptive={
    fresh(){return {sequence:0,levels:{},rounds:[],waiting:{},completed:0,misses:0};},
    reset(e){for(const b of e.balls)b.adaptive=this.fresh();},
    state(b){return b.adaptive??=this.fresh();},
    level(b,key){return this.state(b).levels[key]||0;},
    begin(b,key,e){const s=this.state(b),id=b.id+':'+(++s.sequence);s.rounds.push({id,key,good:false,closed:false,at:e.time,bonus:this.level(b,key)});return id;},
    round(b,id){return this.state(b).rounds.find(r=>r.id===id);},
    close(b,id){const r=this.round(b,id);if(r)r.closed=true;},
    good(b,id){const r=id&&this.round(b,id);if(r)r.good=true;},
    goodKey(b,key){for(const r of this.state(b).rounds)if(r.key===key)r.good=true;},
    cancel(b,key,openOnly=false){const s=this.state(b);s.rounds=s.rounds.filter(r=>r.key!==key||openOnly&&r.closed);delete s.waiting[key];},
    duration(b,key){return this.level(b,key)*(key==='reflector'?.2:key==='shield'?.25:0);},
    wait(b,target,e,key){const s=this.state(b);if(!this.level(b,key)||!target||!G.Ghost.phased(target)&&!G.Awakening.dashing(target,e)){delete s.waiting[key];return false;}
      let w=s.waiting[key];if(!w)w=s.waiting[key]={elapsed:0,tick:-1};if(w.tick!==e.tick){w.elapsed+=C.dt*(b.temporal?.rate??1);w.tick=e.tick;}
      return w.elapsed<1.2-1e-9;
    },
    hit(h,e){if(h.actual+h.blocked<=0||h.avoided)return;const b=h.source;
      this.good(b,h.adaptiveId??h.calibrationShot?.adaptiveId);
      if(b.type==='vampire'&&['chain','bloodFinish'].includes(h.kind))this.goodKey(b,'vampire');
      if(b.type==='ghost'&&['fear','soulBurst'].includes(h.kind))this.good(b,h.adaptiveId??b.ghost.adaptiveId);
      if(b.type==='holy'&&['holyWater','holyBurn'].includes(h.kind))this.goodKey(b,'holyZone');
      if(h.reflection>0)this.goodKey(h.target,'reflector');
    },
    interrupt(b,e){const keys={ranger:['ranger'],reflector:['reflector'],shield:['shield'],vampire:['vampire'],laser:['laser'],demon:['demon']};
      for(const key of keys[b.type]||[])this.cancel(b,key,['ranger','shield','vampire'].includes(b.type));
      // Released independent objects remain eligible; only unlaunched casts are canceled.
      if(b.type==='time'&&b.temporal.castAt)this.cancel(b,'timeClock');
      if(b.type==='holy'&&(b.holy.chargeUntil||e.holyWorld?.lights.some(l=>l.owner===b.id&&l.kind==='judgement'&&!l.landed)))this.cancel(b,'holyJudgement');
    },
    failure(b,r,e){const s=this.state(b);s.misses++;if(r.key==='blade'&&!r.caught)return;const level=s.levels[r.key]=Math.min(2,this.level(b,r.key)+1);e.signal(b,labels[r.key]+' · 补偿 '+level+'/2','miss');
      if(r.key==='blade'&&r.caught)G.Recovery.refund(b,e,'nextShot',.2*level,'全程落空回收');
      if(r.key==='ghost')b.ghost.nextPhase+=.35*level;
      if(r.key==='holyJudgement')G.Recovery.refund(b,e,'nextJudgement',.5*level,'圣裁全空',b.holy);
    },
    snapshot(s){return {...s,levels:{...s.levels},rounds:s.rounds.map(r=>({...r})),waiting:Object.fromEntries(Object.entries(s.waiting).map(([k,v])=>[k,{...v}]))};},
    observe(e){if(e.state!=='running')return;
      const objects=[...(e.cosmicWorld?.strikes||[]),...(e.cosmicWorld?.binary||[]),...(e.chargeWorld?.currents||[]),...(e.stellarWorld?.waves||[]),...e.projectiles,...e.waves,...e.beams,...e.pools,...e.timeClocks,...e.timeDomains,...e.ghostEchoes,...(e.holyWorld?.zones||[]),...(e.holyWorld?.lights||[]),...(e.demonWorld?.claws||[]),...(e.demonWorld?.souls||[])],live=new Set(objects.map(v=>v.adaptiveId).filter(Boolean));
      for(const b of e.balls){if(G.Charge?.flowing(b))live.add(b.charge.adaptiveId);if(b.stellar?.volley)live.add(b.stellar.volley.adaptiveId);const s=this.state(b);if(b.hp<=0){s.rounds=[];s.waiting={};continue;}
        // Credit actually occupied immune geometry, without consuming incoming weapons.
        if(G.Ghost.phased(b)){const close=o=>Math.hypot(b.x-o.x,b.y-o.y)<=b.radius+(o.radius||13);
          if(e.balls.some(t=>t.hp>0&&G.World.enemy(b,t,e)&&close(t))||objects.some(o=>G.World.enemy(b,o.owner,e)&&close(o)&&
            (e.projectiles.includes(o)||e.timeClocks.includes(o)||e.timeDomains.includes(o)&&o.armedAt<=e.time||e.pools.includes(o)&&o.armedAt<=e.time||e.holyWorld?.lights.includes(o)&&o.landed||e.demonWorld?.claws.includes(o)&&e.time>=o.at&&e.time<=o.at+o.flight+.1)))this.goodKey(b,'ghost');
        }
        const keep=[];for(const r of s.rounds){if(!r.closed||live.has(r.id)||(r.deferUntil||0)>e.time){keep.push(r);continue;}s.completed++;if(r.good)s.levels[r.key]=0;else this.failure(b,r,e);delete s.waiting[r.key];}s.rounds=keep;
      }
    },
    status(b,e){const s=b.adaptive,items=[];if(!s)return '';if(b.type==='trapper'&&e){const n=Math.max(0,...e.traps.filter(m=>m.owner===b.id).map(m=>m.captureMisses||0));if(n)items.push('拉索延长 +'+Math.min(.1,n*.05).toFixed(2)+'s');}for(const [key,w] of Object.entries(s.waiting))if(w.elapsed<1.2)items.push(labels[key]+' '+(1.2-w.elapsed).toFixed(1)+'s');
      for(const [key,n] of Object.entries(s.levels)){if(!n)continue;if(key==='reflector'||key==='shield')items.push(labels[key]+' +'+this.duration(b,key).toFixed(2)+'s');else if(key==='ranger')items.push('跟随 +'+n*10+'%');else if(key==='venom')items.push('喷吐散布 −'+n*10+'%');else if(!s.waiting[key])items.push(labels[key]+' '+n+'/2');}return items.join(' · ');
    }
  };
})(typeof window!=='undefined'?window:globalThis);
