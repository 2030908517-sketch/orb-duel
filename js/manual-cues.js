/* Manual-only, read-only cursor cues. No UI timer advances a combat clock. */
(function(root){
  'use strict';
  const G=root.OrbDuel,M=G.ManualControl,A=G.ManualRoles,F=G.ManualFour,EPS=1e-9;
  const clamp=v=>Math.max(0,Math.min(1,v)),models=new WeakMap();
  const timers=b=>({pursuit:b.role.nextPursuit||0,hunt:b.hunt?.nextCast||0,chain:b.awakening.nextCast,
    wave:b.arcana?.nextWave,trap:b.nextTrap,swap:b.mechanism?.nextSwap,spit:b.role.nextSpit,pool:b.nextPool,
    cooling:b.role.coolingUntil,jet:b.role.jetNext,blade:b.nextShot,shot:b.nextShot,reload:b.role.reloadUntil,
    domain:b.temporal.nextDomain,clock:b.temporal.nextClock});
  class CueState {
    constructor(e){this.engine=e;this.periods={};this.epoch=-1;this.observe();}
    observe(before=null){const e=this.engine,b=M.player(e);if(!b)return;
      const fresh=this.epoch!==e.presentationEpoch||this.actor!==b||this.role!==b.role;
      if(fresh){this.epoch=e.presentationEpoch;this.actor=b;this.role=b.role;this.periods={};}
      for(const [key,end]of Object.entries(timers(b))){
        // Capture the interval at the real assignment, not the next rendered frame.
        if(Number.isFinite(end)&&end>e.time+EPS&&(fresh||before&&end!==before[key]))this.periods[key]=end-e.time;
      }
    }
    cooldown(key){const e=this.engine,b=M.player(e),end=timers(b)[key];
      if(!Number.isFinite(end))return null;
      const remaining=Math.max(0,end-e.time),duration=key==='reload'&&b.role.reloadDuration?b.role.reloadDuration:this.periods[key];
      return {remaining,duration:duration||null,progress:remaining<=EPS?1:duration>0?clamp(1-remaining/duration):null};
    }
    read(){this.observe();const e=this.engine,b=M.player(e),r=b.role,c=b.character,u=b.arcana,awake=G.Awakening.active(b),out=[];
      const add=(key,name,cd=null,badge='',meter=null)=>{const cooldown=cd?this.cooldown(cd):null;out.push({key,name,cooldown,meter:meter||{kind:cooldown?'cooldown':'none',progress:cooldown?cooldown.progress:1},ready:!!({L:M.primary,R:M.secondary,M:M.middle}[key]?.call(M,e,true)),badge});};
      if(b.type==='normal'){add('L','擦肩追击','pursuit');add('R','重击准备',null,e.manual.heavyReady?'重':'',{kind:'stacks',progress:clamp(b.charges/3)});}
      if(b.type==='ranger'){
        const mode=e.manual.executing?r.fireMode:M.weapon(e),names={burst:'三连发',sniper:'狙击',scatter:'散射'};
        // The counter window is an opportunity, not a second reload cooldown.
        add('L',u?.phase==='counterCharge'?'穿甲反击':names[mode],u?.phase==='counterCharge'?null:r.reloadUntil>0?'reload':Number.isFinite(b.nextShot)?'shot':null);
        add('R','切换武器',null,e.manual.selected==='scatter'?'散':'狙');
      }
      if(b.type==='vampire'){const sea=G.VampireArcana.active(b);add('L',sea?'血浪':'血影追猎',sea&&u.phase==='bloodTide'?'wave':sea?null:'hunt');add('R','血契','chain');}
      if(b.type==='trapper'){add('L','布置机关','trap');add('R','机关置换','swap');}
      if(b.type==='venom'){add('L','毒液弹','spit');add('R','毒池','pool');}
      if(b.type==='laser'){add('L','电容主炮',null,'',{kind:'resource',name:'电容',progress:clamp(r.capacitor)});add('R','近身光刃');add('M','短喷侧移','jet');}
      if(b.type==='boomerang'){
        add('L',awake?'近距交错斩':'投掷飞刃','blade');add('R',awake?'极限弹射':'逐刃追猎',awake?'blade':null);
        add('M','接刃重斩',null,c.catchUntil>e.time?(c.catchPower>=1.4?'双':'单'):'');
      }
      if(b.type==='time'){add('L','飞行时钟','clock');add('R','时间领域','domain');}
      const automatic=F.automatic(b),active=b.type==='venom'?!!u?.venom?.active:b.type==='time'?e.timeRewind?.active?.owner===b.id:G.Arcana.busy(b),ready=!automatic&&M.ultimate(e,true);
      const status=G.Arcana.status(b,e),unlocked=automatic?(b.type==='time'?!u?.used:!!u?.venom?.active):!!u&&!u.used&&(e.manual.armed||awake&&b.hp<=b.maxHp*G.Arcana.ratio);
      out.push({key:'ULT',label:automatic?'自':'ULT',name:(G.Arcana.defs[b.type]?.name||'奥义')+' · '+(status?.value||''),cooldown:null,meter:b.type==='normal'?{kind:'stacks',progress:clamp(b.charges/3)}:b.type==='vampire'?{kind:'resource',name:'血能',progress:clamp(r.blood/8)}:{kind:'none',progress:1},ready:!!ready,badge:b.type==='trapper'&&e.manual.armed&&!u?.used?'待':'',
        automatic,stage:active?'active':u?.used?'used':unlocked?'unlocked':'locked'});
      return out;
    }
  }
  const C=G.ManualCues={
    state(e){let s=models.get(e);if(!s){s=new CueState(e);models.set(e,s);}return s;},
    read(e){return this.state(e).read();}
  };
  // Observe actual native cooldown assignments. These wrappers forward all calls unchanged.
  function watch(object,key,index){const old=object[key];object[key]=function(...args){const e=args[index],s=e&&models.get(e),b=e?.manual&&M.player(e),before=s&&b?timers(b):null;
      const value=old.apply(this,args);if(before&&s.actor===M.player(e))s.observe(before);return value;};}
  for(const key of ['primary','secondary','middle','ultimate'])watch(M,key,0);
  watch(G.Ranger,'update',2);watch(G.Roles,'laserFire',1);watch(G.Temporal,'update',2);
  watch(G.LaserBlade,'ordinary',2);watch(G.Flyers,'poisonUpdate',1);

  G.ManualCueView=class {
    constructor(e,canvas){this.engine=e;this.canvas=canvas;this.state=C.state(e);this.cells=new Map();this.root=document.createElement('div');this.root.className='manual-cursor-cues';this.root.setAttribute('aria-label','准星附近技能就绪提示');this.root.hidden=true;document.body.append(this.root);}
    cell(item){let el=this.cells.get(item.key);if(!el){el=document.createElement('div');el.className='manual-cursor-skill';el.dataset.key=item.key;
        el.innerHTML='<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="cue-track" cx="18" cy="18" r="15.5"/><circle class="cue-progress" cx="18" cy="18" r="15.5" pathLength="100"/></svg><span class="cue-key"></span><span class="cue-badge"></span>';
        this.root.append(el);this.cells.set(item.key,el);}return el;}
    update(){const e=this.engine,b=M.player(e);this.root.hidden=!b||!['running','paused'].includes(e.state)||b.hp<=0&&!e.timeRewind?.active||document.body.classList.contains('review-mode');if(this.root.hidden)return;
      const items=this.state.read(),stamp=e.presentationTime??e.time;this.root.style.setProperty('--cue-color',b.def.color);
      for(const [index,item]of items.entries()){const el=this.cell(item);if(this.root.children[index]!==el)this.root.insertBefore(el,this.root.children[index]||null);const changed=el.dataset.skill!==item.name;
        if(changed){el.wasReady=undefined;el.brightAt=-Infinity;el.dataset.skill=item.name;}
        if(el.wasReady===false&&item.ready)el.brightAt=stamp;el.wasReady=item.ready;
        const pulse=!M.blocked(e)&&stamp-el.brightAt>=0&&stamp-el.brightAt<.15?1-(stamp-el.brightAt)/.15:0;
        el.style.setProperty('--cue-pulse',pulse.toFixed(3));el.classList.toggle('is-ready',item.ready);el.classList.toggle('is-auto',!!item.automatic);el.classList.toggle('is-ult',item.key==='ULT');el.classList.toggle('is-active',item.stage==='active');el.classList.toggle('is-used',item.stage==='used');
        const progress=item.meter.progress;el.dataset.meter=item.meter.kind;el.classList.toggle('has-cooldown',progress!==null&&progress!==undefined);el.classList.toggle('is-locked',item.stage==='locked');
        el.querySelector('.cue-progress').style.strokeDasharray=progress!==null&&progress!==undefined?(progress*100)+' 100':'0 100';
        el.querySelector('.cue-key').textContent=item.label||item.key;const badge=el.querySelector('.cue-badge');badge.textContent=item.badge;badge.hidden=!item.badge;
        el.dataset.ready=String(item.ready);el.dataset.stage=item.stage||'';
        el.title=item.name+' · '+(item.automatic?'自动触发（不可按键释放）':item.ready?'按键可执行':'当前不可执行')+({cooldown:' · 真实冷却',resource:' · '+(item.meter.name||'资源'),stacks:' · 拳势层数',none:' · 无独立CD'}[item.meter.kind]);
        el.setAttribute('aria-label',el.title+(item.badge?' · '+item.badge:''));
      }
      for(const [key,el]of this.cells)el.hidden=!items.some(i=>i.key===key);
      const rect=this.canvas.getBoundingClientRect(),p=e.manual.pointer,x=rect.left+p.x/G.Constants.width*rect.width,y=rect.top+p.y/G.Constants.height*rect.height;
      const width=this.root.offsetWidth,height=this.root.offsetHeight,spacing=24;
      const boxes=[[x+spacing,y+spacing],[x-width-spacing,y+spacing],[x+spacing,y-height-spacing],[x-width-spacing,y-height-spacing]].map(([left,top])=>({left,top}));
      const crossesAim=q=>{if(b.type==='normal')return false;let lo=0,hi=1;const sx=rect.left+b.x/G.Constants.width*rect.width,sy=rect.top+b.y/G.Constants.height*rect.height;
        for(const [start,delta,min,max]of [[sx,x-sx,q.left-4,q.left+width+4],[sy,y-sy,q.top-4,q.top+height+4]]){if(Math.abs(delta)<1e-8){if(start<min||start>max)return false;}else{const a=(min-start)/delta,z=(max-start)/delta;lo=Math.max(lo,Math.min(a,z));hi=Math.min(hi,Math.max(a,z));if(lo>hi)return false;}}return true;};
      const penalty=q=>crossesAim(q)?500:0;
      const best=boxes.map((q,i)=>({...q,score:penalty(q)+i*.01})).sort((a,z)=>a.score-z.score)[0];this.root.style.left=best.left+'px';this.root.style.top=best.top+'px';
    }
  };
})(typeof window!=='undefined'?window:globalThis);
