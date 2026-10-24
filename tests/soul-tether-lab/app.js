(function(){
  'use strict';
  const $=id=>document.getElementById(id),api=window.SoulLab,model=window.soulLab=new api.Model();
  const canvas=$('arena'),ctx=canvas.getContext('2d'),chart=$('chart'),g=chart.getContext('2d');
  const fields=[['bodySpeed','肉身运动速度',0,350,5],['demonSpeed','恶魔运动速度',0,450,5],['soulSpeed','灵魂巡航速度',0,350,5],['soulCap','灵魂速度上限',50,700,10],['recovery','持续回收 / 秒',0,100,1],['pull','触线拉扯 / 秒',0,150,1],['stiffness','超长回拉强度',0,60,1],['tolerance','触线额外容差',0,20,1],['initial','初始抽取长度',10,280,5],['cap','抽取长度上限',20,400,10]];
  for(const [key,label,min,max,step] of fields){const row=document.createElement('div');row.className='param';row.innerHTML=`<label for="p-${key}">${label}</label><output id="v-${key}"></output><input id="p-${key}" type="range" min="${min}" max="${max}" step="${step}">`;$('params').append(row);$('p-'+key).addEventListener('input',e=>{model.set(key,+e.target.value);sync();});}
  function sync(){for(const [key] of fields){$('p-'+key).value=model.params[key];$('v-'+key).textContent=model.params[key];}$('pause').textContent=model.paused?'继续 · Space':'暂停 · Space';$('follow').checked=model.follow;$('fixed').checked=model.fixedBody;$('recover').checked=model.noRecovery;}
  function reset(){model.seed=$('seed').value||'soul-001';model.reset();acc=0;sync();render();}
  $('pause').onclick=()=>{model.paused=!model.paused;acc=0;sync();};$('step').onclick=()=>{model.paused=true;model.step(1/60,true);sync();render();};$('reset').onclick=reset;
  $('extract').onclick=()=>{model.extract();render();};$('seed').onchange=reset;
  for(const [id,key] of [['follow','follow'],['fixed','fixedBody'],['recover','noRecovery']])$(id).onchange=e=>{model[key]=e.target.checked;model.event('flag',{key,value:model[key]});};
  $('preset').onchange=()=>{model.params={...api.defaults};model.noRecovery=false;model.fixedBody=false;model.follow=false;
    if($('preset').value==='reclaim')Object.assign(model.params,{recovery:35,pull:50});
    if($('preset').value==='contact')Object.assign(model.params,{tolerance:14,recovery:8,pull:65,soulSpeed:85});
    if($('preset').value==='persist')Object.assign(model.params,{recovery:0,initial:180,stiffness:4});reset();};
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify(model.export(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='soul-tether-experiment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);};
  document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('pause').click();}else if(e.code==='KeyN')$('step').click();else if(e.code==='KeyR')reset();});
  let dragging=false;
  function point(e){const r=canvas.getBoundingClientRect();return {x:Math.max(23,Math.min(337,(e.clientX-r.left)/r.width*360)),y:Math.max(23,Math.min(317,(e.clientY-r.top)/r.height*340))};}
  canvas.onpointerdown=e=>{const p=point(e);model.pointer=p;if(Math.hypot(p.x-model.demon.x,p.y-model.demon.y)<32){dragging=true;canvas.setPointerCapture(e.pointerId);model.event('placement-start');}};
  canvas.onpointermove=e=>{const p=point(e);model.pointer=p;if(dragging){model.demon.x=p.x;model.demon.y=p.y;render();}};
  canvas.onpointerup=canvas.onpointercancel=()=>{if(dragging)model.event('placement-end',{x:model.demon.x,y:model.demon.y});dragging=false;};
  function ball(b,color,soul=false){ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=soul?.65:1;ctx.fillStyle=soul?'#9cd6ef33':'#172c46';ctx.strokeStyle=color;ctx.lineWidth=soul?1.5:2;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=soul?'#e6f6ff55':color+'33';ctx.beginPath();ctx.arc(-b.radius*.22,-b.radius*.24,b.radius*.58,Math.PI,Math.PI*1.8);ctx.quadraticCurveTo(4,1,-4,b.radius*.5);ctx.closePath();ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,soul?3:4,0,Math.PI*2);ctx.fill();ctx.restore();}
  let lastUi=-1;
  function render(){ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,360,340);ctx.fillStyle='#23344a';for(let x=20;x<360;x+=20)for(let y=20;y<340;y+=20){ctx.beginPath();ctx.arc(x,y,.65,0,7);ctx.fill();}
    const s=model.soul;
    if(s){const pts=api.path(model.body,s,model.length);ctx.lineCap='round';for(const [width,color] of [[4,'#253047'],[1.4,model.inside?'#ff9b9e':'#c4d9f0']]){ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))ctx.lineTo(p.x,p.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
      // Endpoint exclusion is visible only as a subtle change of hue, not another status ring.
      ball(s,'#d6e9f4',true);}
    ball(model.body,'#70b5ff');ball(model.demon,'#ff8d99');
    ctx.strokeStyle='#ffabb6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(model.demon.x-9,model.demon.y-6);ctx.lineTo(model.demon.x-7,model.demon.y-13);ctx.lineTo(model.demon.x,model.demon.y-7);ctx.lineTo(model.demon.x+7,model.demon.y-13);ctx.lineTo(model.demon.x+9,model.demon.y-6);ctx.stroke();
    ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillStyle='#b6c9de';ctx.fillText('肉身',model.body.x,model.body.y+36);if(s)ctx.fillText('灵魂',s.x,s.y-23);ctx.fillStyle='#ffabb6';ctx.fillText('恶魔',model.demon.x,model.demon.y+36);
    ctx.textAlign='left';ctx.fillStyle='#9fb1c9';ctx.fillText(`${model.time.toFixed(2)}s · ${model.paused?'暂停':s?'魂身独立运动':'已归魂 · 可重新抽离'}`,12,18);
    if(Math.floor(model.time*10)!==lastUi||model.paused){lastUi=Math.floor(model.time*10);updateUI();}
  }
  function updateUI(){const d=model.spaceDistance,items=[['抽取长度 L',model.length.toFixed(1)],['实际距离 d',d.toFixed(1)],['瞬时净变化 / 秒',(model.net||0).toFixed(1)],['超长量 max(d−L,0)',Math.max(0,d-model.length).toFixed(1)],['有效触线累计',model.contactTime.toFixed(2)+'s'],['触线占比',Math.round(100*model.contactTime/(model.time||1))+'%']];$('metrics').innerHTML=items.map(([k,v])=>`<div class="metric ${model.inside?'active':''}">${k}<strong>${v}</strong></div>`).join('');
    const names={'reset':'重置','extract':'抽离','return':'回收完成 / 归魂','contact-start':'触线开始','contact-end':'触线结束','parameter':'参数调整','flag':'观察开关','placement-start':'拖动摆放','placement-end':'摆放结束'};
    $('events').replaceChildren(...model.events.slice(-12).reverse().map(e=>{const div=document.createElement('div');div.textContent=`${e.time.toFixed(2)} · ${names[e.type]||e.type}${e.key?' / '+e.key+' = '+e.value:''}`;return div;}));
    g.clearRect(0,0,720,140);const max=Math.max(300,model.params.cap,...model.history.map(p=>p.distance));g.font='12px system-ui';g.fillStyle='#9fb1c9';g.fillText('最近12世界秒',10,16);g.fillText('0',10,131);g.fillText(max.toFixed(0),10,34);
    for(const [field,color] of [['length','#ff9b9e'],['distance','#70b5ff']]){g.strokeStyle=color;g.lineWidth=2;g.beginPath();model.history.forEach((p,i)=>{const x=40+(p.time-Math.max(0,model.time-12))/12*670,y=128-p[field]/max*95;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}}
  let last=performance.now(),acc=0;
  function frame(now){const elapsed=Math.min(.1,(now-last)/1000);last=now;if(!model.paused&&!dragging){acc+=elapsed;while(acc>=1/240){model.step();acc-=1/240;}}else acc=0;render();requestAnimationFrame(frame);}
  window.soulLabRender=()=>{lastUi=-1;render();};sync();render();requestAnimationFrame(frame);
})();
