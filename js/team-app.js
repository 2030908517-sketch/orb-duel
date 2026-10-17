(function(){
  'use strict';
  const G=window.OrbDuel,T=G.Team,$=id=>document.getElementById(id),defaults=['normal','ranger','vampire','shield'],selects=[];
  const timeText=G.formatTime;
  const hpText=h=>h<=0?'0':h<1?h.toFixed(1):String(Math.ceil(h));
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  for(let i=0;i<4;i++){
    const card=node('article','team-card');card.id='fighter-'+i;
    const head=node('div','team-card-head');head.append(node('span','team-label',(i<2?'▲':'■')+(i%2+1)));
    const select=node('select');select.id='type-'+i;select.setAttribute('aria-label',T.names[i<2?0:1]+(i%2+1)+'号球种');
    for(const [id,def] of Object.entries(G.Types)){const option=node('option',null,def.name);option.value=id;select.append(option);}select.value=defaults[i];selects.push(select);
    const health=node('span','health-number');health.id='health-'+i;head.append(select,health);
    const bar=node('div','health-track');bar.id='bar-'+i;bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',select.getAttribute('aria-label')+'生命值');const fill=node('div');fill.id='fill-'+i;bar.append(fill);
    const values=node('div','team-values');values.id='fighter-meta-'+i;
    const life=node('div','team-life'),awake=node('span'),notice=node('span');awake.id='awakening-'+i;notice.id='awake-notice-'+i;notice.setAttribute('role','status');life.append(awake,notice);
    const status=node('div','team-status');status.id='status-slot-'+i;
    const details=node('details'),summary=node('summary',null,'能力详情'),copy=node('div');copy.id='skill-description-'+i;details.append(summary,copy);
    card.append(head,bar,values,life,status,details);$('squad-'+(i<2?0:1)).append(card);
  }
  for(const [id,map] of Object.entries(T.maps)){const option=node('option',null,map.name);option.value=id;$('map').append(option);}
  function randomSeed(){const v=new Uint32Array(1);crypto.getRandomValues(v);return 'team-'+v[0].toString(36);}
  $('seed').value=randomSeed();
  const engine=new G.TeamEngine(defaults,$('seed').value),clock=new G.Clock(engine),renderer=new G.TeamRenderer($('arena')),audio=new G.Audio();
  let previous=performance.now(),lastUi=-Infinity,renderedState='',seenEvents='';
  function fit(){
    const workspace=document.querySelector('.team-workspace'),field=document.querySelector('.team-field'),wide=innerWidth>1100;
    const rail=Math.max(280,Math.min(330,workspace.clientWidth*.18)),gap=innerWidth>1200?16:12;
    const width=wide?workspace.clientWidth-rail*2-gap*2:workspace.clientWidth;
    workspace.style.setProperty('--rail-width',Math.floor(rail)+'px');workspace.style.setProperty('--field-width',Math.floor(width)+'px');
    field.style.maxWidth=wide?Math.floor(width)+'px':'';
  }
  function selection(){selects.forEach((s,i)=>{const d=G.Types[s.value],a=G.Awakening.defs[s.value];$('skill-description-'+i).replaceChildren(node('p',null,d.skill+' · '+d.description+(s.value==='vampire'?' '+G.VampireHunt.copy:'')),node('p',null,'觉醒 · '+a.name+'：'+a.description));if(G.Arcana?.defs[s.value])$('skill-description-'+i).append(node('p',null,G.Arcana.copy(s.value)));});$('map-description').textContent=T.maps[$('map').value].description;}
  function reset(start=false,fresh=false){audio.stop();engine.soundEvents.length=0;if(fresh)$('seed').value=randomSeed();$('seed').value=$('seed').value.trim()||'team-001';engine.reset(selects.map(s=>s.value),$('seed').value,$('map').value);clock.reset();previous=performance.now();renderedState=seenEvents='';selection();if(start){void audio.unlock();engine.start();}update();renderer.draw(engine);}
  function toggle(){if(engine.state==='running'){engine.pause();audio.stop();engine.soundEvents.length=0;}else{void audio.unlock();if(engine.state==='ready'){if(engine.seed!==($('seed').value.trim()||'team-001'))reset();engine.start();}else if(engine.state==='paused')engine.resume();else reset(true);}clock.reset();previous=performance.now();update();}
  function chip(stat){const c=node('span','team-stat'),value=String(stat.value).replace(/ \/ /g,'/');c.append(node('span',null,stat.label),node('b',/[\u3400-\u9fff]/.test(value)?'word-value':null,value));c.title=stat.label+' '+stat.value;return c;}
  function update(){
    for(const b of engine.balls){const i=b.id,card=$('fighter-'+i);card.classList.toggle('eliminated',b.hp<=0);card.classList.toggle('awakened',b.awakening.active);
      $('health-'+i).replaceChildren(document.createTextNode(hpText(b.hp)+' '),node('small',null,'/ '+b.maxHp));$('fill-'+i).style.width=Math.max(0,b.hp/b.maxHp*100)+'%';$('fill-'+i).style.background=b.def.color;
      $('bar-'+i).setAttribute('aria-valuenow',b.hp.toFixed(1));$('bar-'+i).setAttribute('aria-valuemin','0');$('bar-'+i).setAttribute('aria-valuemax',b.maxHp);
      const awake=G.Awakening.status(b,engine),extra=[...(G.Skills[b.type]?.status?.(b,engine)||[]),...awake.filter(s=>s.label!=='觉醒')];
      const ultimate=G.Arcana?.status(b,engine);if(ultimate)extra.splice(b.type==='accelerator'?4:5,1,ultimate);
      const stats=[{label:'攻击',value:G.Combat.attackValue(b,engine).toFixed(1)},{label:'速度',value:Math.round(Math.hypot(b.vx,b.vy))},...extra.slice(0,6)];while(stats.length<8)stats.push({label:'',value:''});$('fighter-meta-'+i).replaceChildren(...stats.map(chip));
      $('awakening-'+i).textContent=b.hp<=0?'已淘汰':awake.find(s=>s.label==='觉醒')?.value||'';
      const notice=b.awakening.active&&engine.time-b.awakening.activatedAt<2.4?'✦ 觉醒！':b.notice&&engine.time-b.notice.at<1.6?b.notice.text:'';$('awake-notice-'+i).textContent=notice;$('awake-notice-'+i).title=notice;
      G.StatusPanel.render($('status-slot-'+i),b,engine);
    }
    for(let team=0;team<2;team++){const squad=engine.balls.filter(b=>b.team===team),live=squad.filter(b=>b.hp>0).length;$('team-total-'+team).textContent=live+'/2 存活 · '+hpText(squad.reduce((sum,b)=>sum+b.hp,0))+' HP';}
    $('timer').textContent=timeText(engine.time);$('round-seed').textContent='SEED '+engine.seed;$('collision-count').textContent=engine.collisions+' 次碰撞';
    $('phase-label').textContent=engine.time>=G.Constants.decayStart?'决胜阶段 · 每秒流失3HP':engine.time>=G.Constants.heatStart?'加热阶段 · 伤害×'+engine.heatMultiplier.toFixed(2):T.maps[engine.mapId].name+' · 640×440';
    const key=engine.events[0]?.tick+':'+engine.events[0]?.text;if(key!==seenEvents){seenEvents=key;$('event-log').replaceChildren(...engine.events.slice(0,4).map(e=>{const li=node('li');li.append(node('time',null,timeText(e.time).slice(0,-3)),node('span',null,e.text));return li;}));if(!engine.events.length)$('event-log').append(node('li','empty-log','开场后记录团队技能与淘汰。'));}
    if(renderedState!==engine.state){renderedState=engine.state;stateUI();}
  }
  function stateUI(){const s=engine.state,active=s==='running'||s==='paused';for(const select of [...selects,$('map')])select.disabled=active;$('seed').disabled=$('random-seed').disabled=active;
    $('config-note').textContent=active?'本局配置已锁定；重开后可调整。':'选择四个球种，搭配一场团队对决。';$('state-badge').textContent=s==='running'&&engine.ending?'收招结算中':{ready:'准备就绪',running:'团队对战中',paused:'已暂停',ended:'对战结束'}[s];$('state-badge').className='status-badge '+s;
    $('arena-status').textContent={ready:'等待开场',running:clock.speed+'× 团队模拟',paused:'模拟暂停',ended:'团队胜负已定'}[s];$('toggle-label').textContent={ready:'开始对战',running:'暂停',paused:'继续对战',ended:'再战同一局'}[s];$('overlay').hidden=s==='running';$('result-summary').hidden=s!=='ended';
    if(s==='ready'){$('overlay-kicker').textContent='TWO ORBS · ONE TEAM';$('overlay-title').textContent='搭配你的双球阵容';$('overlay-description').textContent='队友不互相伤害，一队全灭时对局结束。';$('overlay-start').textContent='开始团队对战 ▶';}
    if(s==='paused'){$('overlay-kicker').textContent='TIME STANDS STILL';$('overlay-title').textContent='团队对战已暂停';$('overlay-description').textContent='四球、技能、飞行物和领域全部暂停。';$('overlay-start').textContent='继续对战 ▶';}
    if(s==='ended'){$('overlay-kicker').textContent=engine.winnerTeam==='draw'?'DOUBLE KNOCKOUT':'TEAM VICTORY';$('overlay-title').textContent=engine.winnerTeam==='draw'?'两队同时全灭 · 平局':T.names[engine.winnerTeam]+'获胜';$('overlay-description').textContent=timeText(engine.time)+' · '+engine.collisions+' 次碰撞';$('overlay-start').textContent='再战同一局 ↺';$('result-summary').replaceChildren(...engine.balls.map(b=>node('p',null,engine.label(b)+'：伤害 '+b.stats.damage.toFixed(1)+' / 回复 '+b.stats.healing.toFixed(1)+' / '+(b.hp>0?'剩余 '+b.hp.toFixed(1)+' HP':'已淘汰'))));}fit();
  }
  $('toggle').onclick=$('overlay-start').onclick=toggle;$('restart').onclick=()=>reset();$('new-match').onclick=()=>reset(true,true);$('random-seed').onclick=()=>reset(false,true);
  for(const s of selects)s.onchange=()=>reset();$('map').onchange=()=>reset();$('seed').onchange=()=>reset();
  for(const button of document.querySelectorAll('[data-speed]'))button.onclick=()=>{clock.speed=Number(button.dataset.speed);for(const b of document.querySelectorAll('[data-speed]')){const on=b===button;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}renderedState='';update();};
  function audioUI(){const b=$('sound-toggle');b.setAttribute('aria-pressed',String(audio.enabled));b.setAttribute('aria-label',audio.enabled?'关闭音效':'开启音效');b.textContent=audio.enabled?'♪':'×';b.disabled=!audio.available;b.classList.toggle('muted',!audio.enabled);}
  $('sound-toggle').onclick=()=>{audio.setEnabled(!audio.enabled);if(audio.enabled)void audio.unlock();audioUI();};
  $('rules-button').onclick=()=>{if(engine.state==='running'){engine.pause();audio.stop();clock.reset();update();}$('rules-dialog').showModal();};$('close-rules').onclick=$('rules-done').onclick=()=>$('rules-dialog').close();
  $('rules-dialog').onclick=e=>{const r=$('rules-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('rules-dialog').close();};
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName)||$('rules-dialog').open||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.code==='KeyR'){e.preventDefault();reset();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine.state==='running'){engine.pause();audio.stop();clock.reset();update();}previous=performance.now();});window.addEventListener('resize',fit);
  const observer=new ResizeObserver(fit);observer.observe(document.querySelector('.team-header'));observer.observe(document.querySelector('.team-heading'));
  function frame(now){clock.advance((now-previous)/1000);previous=now;if(engine.state==='paused'||engine.state==='ready'){engine.soundEvents.length=0;audio.stop();}else audio.consume(engine.soundEvents.splice(0));renderer.draw(engine);if(now-lastUi>=50||engine.state!==renderedState){update();lastUi=now;}requestAnimationFrame(frame);}
  selection();update();audioUI();renderer.draw(engine);requestAnimationFrame(frame);window.orbDuel=Object.freeze({snapshot:()=>engine.snapshot(),clock:()=>({speed:clock.speed,accumulator:clock.accumulator}),audio:()=>audio.snapshot()});
})();
