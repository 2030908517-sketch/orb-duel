/* Fullscreen presentation only. Windowed UI and all combat implementations stay intact. */
(() => {
  'use strict';const G=window.OrbDuel,M=G.ManualControl||G.ManualRanger,Base=G.ManualUI;
  const timerNames={nextShot:'射击 / 投掷间隔',nextTrap:'布雷冷却',nextPool:'毒池冷却',nextShield:'护盾充能',reloadUntil:'装填剩余',nextPursuit:'追击冷却',nextSpit:'喷吐冷却',nextSpread:'催化间隔',nextSwap:'机关置换冷却',nextDischarge:'沿墙放电冷却',nextForm:'雷化冷却',nextNova:'超新星冷却',nextLaunch:'彗星投射间隔',nextStrike:'落雷冷却',nextAwake:'连雷冷却',nextGate:'地狱之门冷却',nextClaw:'魔爪冷却',next:'反伤姿态冷却',nextDomain:'时间领域冷却',nextClock:'飞钟冷却',nextPulse:'磁力冷却',nextOverload:'过载冷却',nextJudgement:'圣裁冷却',nextWard:'神圣庇护冷却',nextPhase:'虚化冷却',coolingUntil:'主炮散热'};
  class FullscreenView {
    constructor(e,renderer){this.engine=e;this.root=document.documentElement;this.stage=document.querySelector('.battle-stage');this.enemy=document.getElementById('fighter-1');
      this.anchor=document.createComment('enemy windowed position');this.enemy.before(this.anchor);
      this.playerView=document.createElement('section');this.playerView.className='manual-fullscreen-player manual-fs-only';this.playerView.setAttribute('aria-label','全屏玩家技能状态');
      this.playerView.innerHTML='<div><span>攻击模式</span><b data-fs="weapon"></b></div><div><span>普通技能</span><b data-fs="cooldown"></b><progress data-fs="reload" max="1" value="0" aria-label="装填进度"></progress></div><div><span>校准</span><b data-fs="calibration"></b></div><div><span>奥义操作</span><b data-fs="standby"></b></div><div class="manual-fs-window"><span>侧闪后 · 穿甲射击窗口</span><b data-fs="window"></b><progress data-fs="window-progress" max="1" value="0" aria-label="穿甲窗口剩余时间"></progress></div>';
      this.rangerView=this.playerView.innerHTML;this.hint=document.createElement('div');this.hint.className='manual-fs-operations manual-fs-only';document.querySelector('.arena-column').append(this.hint);
      document.getElementById('fighter-0').insertBefore(this.playerView,document.getElementById('fighter-meta-0'));
      this.enemyView=document.createElement('section');this.enemyView.className='manual-fullscreen-enemy manual-fs-only';this.enemyView.setAttribute('aria-label','敌方全部冷却与角色机制');this.enemy.append(this.enemyView);
      const draw=renderer.draw.bind(renderer);renderer.draw=engine=>{draw(engine);if(this.active())this.update();};
      window.addEventListener('resize',()=>this.fit());
      document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)this.leave();else this.fit();});
      document.addEventListener('keydown',event=>{
        if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.target.closest?.('input,select,textarea,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
        if(event.key.toLowerCase()==='f'){event.preventDefault();void this.toggle();}
        if(event.key==='Escape'&&this.active()&&!document.fullscreenElement)this.leave();
      });
    }
    active(){return this.root.classList.contains('manual-battle-fullscreen');}
    enter(){this.root.classList.add('manual-battle-fullscreen');document.querySelector('.rail-right').prepend(this.enemy);this.update();window.dispatchEvent(new Event('resize'));}
    leave(){if(!this.active())return;this.root.classList.remove('manual-battle-fullscreen');this.anchor.after(this.enemy);window.dispatchEvent(new Event('resize'));}
    async toggle(){if(this.busy)return;this.busy=true;try{
      if(this.active()){if(document.fullscreenElement)await document.exitFullscreen();this.leave();}
      else{document.activeElement?.blur();this.enter();try{await this.root.requestFullscreen?.({navigationUI:'hide'});}catch(_){/* clean viewport fallback */}this.fit();}
    }finally{this.busy=false;}}
    fit(){if(!this.active())return;const aspect=G.Constants.width/G.Constants.height,w=this.stage.clientWidth,h=innerHeight-56,compact=innerWidth<980,panels=compact?Math.min(240,h*.4):0;
      const field=Math.max(120,Math.floor(Math.min(compact?w:w-512,(h-panels-(compact?12:0))*aspect)));
      this.stage.style.setProperty('--manual-fs-field',field+'px');this.stage.style.setProperty('--manual-fs-height',h+'px');this.stage.style.setProperty('--manual-fs-panel',panels+'px');
    }
    rows(container,title,fields){const heading=document.createElement('h3');heading.textContent=title;container.append(heading);
      for(const field of fields){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('b');row.className='manual-fs-row';label.textContent=field.label;value.textContent=String(field.value);row.append(label,value);container.append(row);}
    }
    update(){const e=this.engine,b=M.player(e),s=M.info(e),r=b.role,names={burst:'三连发',sniper:'狙击',scatter:'散射'},blocked=M.blocked(e,true);
      const panel=b.type!=='ranger'?M.panel(e):null;
      this.hint.textContent=panel?panel.controls:'左键：射击 · 右键：切换武器 · E：奥义待命 · WASD：待命期间侧闪 · F：退出全屏';
      if(panel){const key=b.type+JSON.stringify(panel.fields);if(this.playerKey!==key){this.playerKey=key;this.playerView.replaceChildren();this.rows(this.playerView,'玩家主动能力',panel.fields);}}
      else{if(this.playerKey){this.playerView.innerHTML=this.rangerView;this.playerKey=null;}
      const values={weapon:names[s.weapon]+(s.weapon==='burst'&&G.Awakening.active(b)?' · 已选'+names[s.selected]+'（需满校准）':''),
        cooldown:(G.Temporal.silenced(b,e)?'沉默 · ':'')+(s.executing?'执行中':r.sniperPending!==null?'等待狙击弹结果':s.cooldown>0?s.cooldown.toFixed(1)+'s':blocked?'当前状态禁止施放':'可以射击'),
        calibration:s.calibration+' / '+s.cap,standby:s.armed?'待命中 · E取消 / WASD侧闪':s.ready?'按E开启待命':s.used?'本局已消耗':'等待原有解锁与释放条件',
        window:s.phase==='counterCharge'?s.window.toFixed(2)+'s · 左键发射':'侧闪结束后开启'};
      for(const [key,text]of Object.entries(values)){const el=this.playerView.querySelector('[data-fs="'+key+'"]');if(el.textContent!==text)el.textContent=text;}
      const duration=r.reloadDuration||(G.Awakening.active(b)?b.def.reloadTime:b.def.baseReloadTime);
      this.playerView.querySelector('[data-fs="reload"]').value=r.reloadUntil>e.time?Math.max(0,Math.min(1,1-(r.reloadUntil-e.time)/duration)):s.cooldown>0&&!s.executing?Math.max(0,Math.min(1,1-s.cooldown/(b.def.shotPeriod||s.cooldown))):!blocked&&!s.executing?1:0;
      this.playerView.querySelector('[data-fs="window-progress"]').value=s.window;this.playerView.classList.toggle('pierce-ready',s.phase==='counterCharge');}
      const t=e.balls.find(v=>v.id!==b.id);if(t){
        // Preserve every native field, with no six-slot truncation. Do not infer skill readiness from a zero timer.
        const native=[...(G.Skills[t.type]?.status?.(t,e)||[]),...G.Awakening.status(t,e).filter(v=>v.label!=='觉醒')];
        const cooldown=[],other=[];for(const field of native)((/CD|冷却|装填|充能|间隔|投掷|追猎|血契|雷化|喷吐|短喷/.test(field.label)||/^[0-9.]+s$/.test(String(field.value)))?cooldown:other).push(field);
        // The original silence/slow system identifies actual pending attack clocks; read those same timer references.
        const clocks=G.Temporal.waitingAttacks(t,e).flatMap(([state,key])=>{
          const label=key==='nextCast'?(state===t.hunt?'追猎冷却':t.type==='vampire'?'血契冷却':'冲刺冷却'):timerNames[key];
          return label?[{label,value:Math.max(0,state[key]-e.time).toFixed(1)+'s'}]:[];
        });
        const fields=[...cooldown,...clocks.filter(c=>!cooldown.some(n=>n.label===c.label)),...other],key=t.type+JSON.stringify(fields);
        if(key!==this.enemyKey){this.enemyKey=key;this.enemyView.replaceChildren();this.rows(this.enemyView,'技能冷却与角色机制',fields);}
      }
      this.fit();
    }
  }
  G.ManualUI=class extends Base{constructor(e,clock,renderer){super(e,clock,renderer);this.fullscreenView=new FullscreenView(e,renderer);}};
})();
