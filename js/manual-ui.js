/* PC input and a read-only HUD. Combat commands are validated again by ManualRanger. */
(() => {
  'use strict';const G=window.OrbDuel,M=G.ManualControl||G.ManualRanger;
  G.ManualUI=class {
    constructor(e,clock,renderer){this.engine=e;this.buttons=new Set();this.mouseTimer=null;M.attach(e,clock);
      const canvas=renderer.canvas;this.canvas=canvas;this.skillCues=new G.ManualCueView(e,canvas);
      this.hud=document.createElement('section');this.hud.className='manual-hud';this.hud.setAttribute('aria-label','玩家技能与操作');
      this.hud.innerHTML='<div><b>玩家 · 射手球</b><span data-manual="weapon"></span><span data-manual="cooldown"></span><span data-manual="calibration"></span></div><div><span data-manual="ultimate"></span><b data-manual="window"></b></div><small>鼠标瞄准 · 左键整轮射击 · 觉醒后右键选狙击/散射 · 左右同按沿光标侧闪 · 侧闪后一秒内左键蓄力反击</small><p data-manual="message"></p>';
      this.rangerHud=this.hud.innerHTML;document.querySelector('.rail-right').prepend(this.hud);
      const oldDraw=renderer.draw.bind(renderer);renderer.draw=engine=>{oldDraw(engine);this.draw(renderer);this.update();this.skillCues.update();};
      const engaged=()=>['running','paused'].includes(e.state);
      const interactive=event=>event.target.closest?.('button,input,select,textarea,a,[contenteditable="true"],dialog[open]');
      const point=event=>{const rect=canvas.getBoundingClientRect();if(rect.width&&rect.height)M.point(e,(event.clientX-rect.left)/rect.width*G.Constants.width,(event.clientY-rect.top)/rect.height*G.Constants.height);};
      // Page coordinates remain valid outside the arena: aim along that same ray.
      document.addEventListener('pointermove',event=>{if(engaged()||event.target===canvas)point(event);},true);
      document.addEventListener('mousedown',event=>{
        if(![0,1,2].includes(event.button)||(!engaged()&&event.target!==canvas))return;
        if(event.button===0&&interactive(event))return;
        event.preventDefault();point(event);this.mouseCommand(event.button);
      },true);
      document.addEventListener('mouseup',event=>{this.buttons.delete(event.button);if(!this.buttons.size)this.chordConsumed=false;},true);
      document.addEventListener('pointercancel',()=>this.clear(),true);
      const suppress=event=>{if(!engaged()&&event.target!==canvas)return;event.preventDefault();event.stopImmediatePropagation();};
      document.addEventListener('contextmenu',suppress,true);
      document.addEventListener('auxclick',event=>{if(event.button===1&&engaged())suppress(event);},true);
      document.addEventListener('selectstart',event=>{if(engaged()&&!interactive(event))suppress(event);},true);
      document.addEventListener('dragstart',event=>{if(engaged()&&!interactive(event))suppress(event);},true);
      // Block page-level right-drag gesture handlers as well as the native menu.
      for(const name of ['mousedown','mouseup','mousemove'])document.addEventListener(name,event=>{
        if(engaged()&&(event.button===2&&name!=='mousemove'||event.buttons&2))suppress(event);
        else if(engaged()&&name==='mousedown'&&event.button===0&&!interactive(event))event.preventDefault();
      },true);
      window.addEventListener('blur',()=>this.clear());
      document.addEventListener('visibilitychange',()=>this.clear());
    }
    clear(){clearTimeout(this.mouseTimer);this.mouseTimer=null;this.mousePending=null;this.buttons.clear();this.chordConsumed=false;}
    mouseCommand(button){const e=this.engine;if(M.blocked(e,false,true))return;if(button===1){M.middle?.(e);return;}if(G.ManualFour?.automatic(M.player(e))){button===0?M.fire(e):M.switch(e);return;}
      this.buttons.add(button);if(this.chordConsumed)return;
      if(this.mousePending&&this.mousePending.button!==button&&this.buttons.size===2){clearTimeout(this.mouseTimer);this.mouseTimer=null;this.mousePending=null;this.chordConsumed=true;M.ultimate(e);return;}
      if(this.mousePending)return;const epoch=e.presentationEpoch;this.mousePending={button};
      this.mouseTimer=setTimeout(()=>{this.mouseTimer=null;this.mousePending=null;if(epoch===e.presentationEpoch&&!M.blocked(e))button===0?M.fire(e):M.switch(e);},35);
    }
    update(){const e=this.engine,m=M.sync(e),s=M.info(e);document.body.classList.toggle('manual-input-active',['running','paused'].includes(e.state));if(s.blocked&&M.blocked(e,false,true))this.clear();
      if(e.state==='ready'){document.getElementById('overlay-description').textContent='选择玩家角色和敌人后开始；身体移动全自动。';document.getElementById('config-note').textContent='玩家可选八个已接入角色；敌方保持原有自动AI。';}
      for(const actor of e.balls)document.getElementById('fighter-'+actor.id)?.style.setProperty('--manual-role-color',actor.def.color);
      const note=document.querySelector('.arena-note span');if(note)note.textContent='自动运动 · 鼠标瞄准与施放技能';
      const player=M.player(e);
      if(player.type!=='ranger'){
        const panel=M.panel(e),key=player.type+JSON.stringify(panel)+s.blocked;
        if(this.panelKey!==key){this.panelKey=key;this.hud.replaceChildren();const title=document.createElement('b');title.textContent='玩家 · '+player.def.name;this.hud.append(title);
          for(const f of panel.fields){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('b');row.className='manual-role-row';label.textContent=f.label;value.textContent=f.value;row.append(label,value);if(f.progress!==undefined){const progress=document.createElement('progress');progress.className='manual-role-progress';progress.max=1;progress.value=f.progress;progress.setAttribute('aria-label',f.label+'进度');row.append(progress);}this.hud.append(row);}
          const hint=document.createElement('small');hint.textContent=panel.controls;this.hud.append(hint);if(s.blocked){const message=document.createElement('p');message.textContent='当前状态禁止输入';this.hud.append(message);}
        }this.hud.classList.remove('pierce-ready');return;
      }
      if(this.panelKey){this.hud.innerHTML=this.rangerHud;this.panelKey=null;}
      const names={burst:'三连发',sniper:'狙击',scatter:'散射'};
      const values={weapon:'武器 '+names[s.weapon]+(s.weapon==='burst'&&G.Awakening.active(M.player(e))?' · 已选'+names[s.selected]+'（需满校准）':''),
        cooldown:s.executing?'正在执行整轮射击':s.cooldown>0?'装填 / 间隔 '+s.cooldown.toFixed(1)+'s':'射击就绪',calibration:'校准 '+s.calibration+'/'+s.cap,
        ultimate:s.charging?'穿甲蓄力中':s.window>0?'等待左键蓄力':s.phase==='counterStep'?'侧闪中':s.used?'奥义已消耗':s.ready?'奥义就绪 · 左右同按沿光标侧闪':'奥义未就绪 · 觉醒且生命≤30%',
        window:s.window>0?'穿甲待发 '+s.window.toFixed(2)+'s · 左键开始蓄力':'',message:e.state==='ready'?'选择敌人后开始；WASD不控制日常运动。':s.blocked?'当前状态禁止输入（暂停、时停或动作限制）':m.message};
      for(const [key,text]of Object.entries(values)){const el=this.hud.querySelector('[data-manual="'+key+'"]');if(el.textContent!==text)el.textContent=text;}
      this.hud.classList.toggle('pierce-ready',s.window>0);
    }
    draw(r){const e=this.engine,b=M.player(e);if(!b||b.hp<=0||e.state==='ready'||b.type==='normal')return;const m=e.manual,c=r.ctx,p=m.pointer,pierce=b.arcana?.phase==='counterCharge'&&b.arcana.manualCounter!=='charging';
      if(b.type==='ranger'&&b.arcana?.phase==='counterCharge'&&b.arcana.manualCounter==='charging')return;
      if(b.type==='time'){const q=G.ManualFour.domainPoint(b,e),legal=G.ManualFour.domainLegal(b,q);c.save();c.strokeStyle=legal?'#b6a0ff':'#f28a8a';c.fillStyle=legal?'#a68bff18':'#f28a8a18';c.lineWidth=1;c.setLineDash([4,4]);c.beginPath();c.arc(q.x,q.y,b.def.domainRadius,0,Math.PI*2);c.fill();c.stroke();c.restore();}
      if(b.type==='laser'&&(b.laser||G.LaserBlade.active(b))||b.type==='boomerang'&&G.BladeDance.active(b))return;
      if(b.type==='trapper'){
        const n=G.ManualRoles.selected(b,e),legal=G.ManualRoles.placement(b,e);c.save();c.shadowBlur=0;c.lineWidth=1.3;c.strokeStyle=legal?'#b6eb91':'#df8c8c';c.setLineDash([3,3]);c.beginPath();c.arc(b.x,b.y,G.Awakening.trapOptions(b).radius+4,0,Math.PI*2);c.stroke();
        if(n){c.strokeStyle='#ffe2a4';c.setLineDash([]);c.lineWidth=2;c.beginPath();c.arc(n.x,n.y,n.radius+6,0,Math.PI*2);c.stroke();c.setLineDash([4,4]);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(n.x,n.y);c.stroke();}c.restore();return;
      }
      c.save();c.shadowBlur=0;c.strokeStyle=pierce?'#fff0b7':'#ffbf83';c.lineWidth=pierce?1.7:.8;c.globalAlpha=pierce?.95:.7;
      c.setLineDash(pierce?[7,2]:[3,4]);c.beginPath();c.moveTo(b.x,b.y);c.lineTo(p.x,p.y);c.stroke();c.setLineDash([]);
      c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,pierce?7:4,0,Math.PI*2);c.moveTo(p.x-9,p.y);c.lineTo(p.x+9,p.y);c.moveTo(p.x,p.y-9);c.lineTo(p.x,p.y+9);c.stroke();c.restore();
    }
  };
})();
