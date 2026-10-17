(async function(){
  'use strict';const $=id=>document.getElementById(id),team=new URLSearchParams(location.search).get('mode')==='team';document.body.classList.toggle('team',team);
  const modules=['config',...(team?['team-maps']:[]),'physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','demon','cosmic','charge','stellar','adaptive','arcana','presentation','engine','audio','spectacle','renderer','holy-render','tactics-render','ranger-render','charge-render','stellar-render','arcana-render','cosmic-render','demon-render',...(team?['team-runtime','team-engine']:[])];
  for(const name of modules)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../js/'+name+'.js?v=20261015-feel1';s.onload=resolve;s.onerror=()=>reject(Error('无法加载 '+name));document.head.append(s);});
  const G=OrbDuel,P=G.Presentation,canvas=$('arena'),renderer=new G.Renderer(canvas),audio=new G.Audio(),params={...P.defaults},urls=[],recordings=[],costs=[];let engine,clock,actions=[],running=false,last=performance.now(),lastUI=0,recorder=null,recordStream=null,tap=null,recordStop=null,recordTimer=null;
  const ranges={size:['图形大小',.25,3,.05],duration:['余效时长',.25,2,.05],particles:['粒子数量',0,48,1],shake:['镜头幅度',0,3,.1],gain:['事件音量',0,2,.05]};
  for(const [key,[label,min,max,step]]of Object.entries(ranges)){const row=document.createElement('label');row.textContent=label;const value=document.createElement('output'),input=document.createElement('input');value.id='value-'+key;value.textContent=params[key];input.type='range';input.id='param-'+key;Object.assign(input,{min,max,step,value:params[key]});input.oninput=()=>{const tick=engine.tick;params[key]=Number(input.value);value.textContent=input.value;seek(tick);};row.append(value,input);$('parameters').append(row);}
  function emit(kind,extra={}){const [b,t]=[engine.balls[0],engine.balls[team?2:1]];return engine.present(kind,{actorId:b.id,targetId:t.id,castId:'fixture:main',key:'fixture:'+kind+':'+engine.tick,x:t.x,y:t.y,angle:Math.atan2(t.y-b.y,t.x-b.x),notice:kind,...extra});}
  function hit(raw,{block=false,immune=false}={}){const b=engine.balls[0],t=engine.balls[team?2:1];if(block)t.shield=40;if(immune)t.ghost.phase='phased';const result=G.Combat.applyDamage(t,raw,engine,{silent:true});if(immune)t.ghost.phase='solid';P.note(engine,'fixture.damage',{actorId:b.id,targetId:t.id,...result});emit(result.avoided?'feedback.avoided':result.actual===0&&result.blocked?'feedback.block':raw>=15?'impact.heavy':'impact.light',{...result,outcome:result.avoided?'avoided':result.blocked&&!result.actual?'blocked':'hit',notice:result.avoided?'无敌避伤':result.blocked&&!result.actual?'护盾吸收':raw>=15?'重命中 · 受控样例':'轻命中 · 受控样例'});}
  function reset(){
    audio.stop();running=false;const seed=$('seed').value.trim()||'feel-001',scene=$('scene').value;engine=team?new G.TeamEngine(['normal','accelerator','vampire','normal'],seed,'open'):new G.Engine(['normal','vampire'],seed);clock=new G.Clock(engine);clock.speed=Number($('speed').value);engine.start();actions=[];P.capture(engine);P.configure(engine,params);
    if(scene!=='live'){engine.balls.forEach((b,i)=>{b.hp=b.maxHp=1000;b.speed=0;b.vx=b.vy=0;b.awakening.nextCast=Infinity;b.x=b.previousX=(team?(i<2?.23:.77):(i===0?.26:.74))*G.Constants.width;b.y=b.previousY=team?(i%2?.74:.26)*G.Constants.height:G.Constants.height*.5;});
      const t=engine.balls[team?2:1];if(scene==='corner'){t.x=t.previousX=G.Constants.width-t.radius;t.y=t.previousY=G.Constants.height-t.radius;}
      const at=(seconds,fn)=>actions.push({tick:Math.round(seconds/G.Constants.dt),fn});
      if(scene==='sequence'){at(.25,()=>emit('ability.prepare',{notice:'预备 · 多阶段样例'}));at(.7,()=>emit('ability.travel',{x:engine.balls[0].x,y:engine.balls[0].y,notice:'移动表现 · 未修改球体位置'}));at(1,()=>emit('ability.release',{notice:'释放 · 不等于命中'}));at(1.15,()=>hit(18));}
      else if(scene==='cancel'){at(.25,()=>emit('ability.prepare',{notice:'准备中'}));at(.65,()=>emit('feedback.cancel',{notice:'取消 · 无伤害、无重击声'}));}
      else if(scene==='dense')at(.4,()=>{for(let i=0;i<60;i++)emit(i%5?'impact.light':'impact.heavy',{key:'dense:'+i,x:30+(i*73)%(G.Constants.width-60),y:35+(i*47)%(G.Constants.height-70),notice:i===0?'密集事件 · 仅装饰预算，不结算伤害':null});});
      else at(.4,()=>hit(scene==='light'?6:18,{block:scene==='block',immune:scene==='immune'}));
    }
    const original=engine.step.bind(engine);engine.step=()=>{original();while(actions.length&&actions[0].tick<=engine.tick)actions.shift().fn();if(engine.time>=6)engine.pause();};engine.pause();$('seek').value=0;render();update();
  }
  function render(){const before=performance.now();renderer.draw(engine);costs.push(performance.now()-before);if(costs.length>240)costs.shift();}
  function seek(tick){reset();engine.resume();for(let i=0;i<Math.min(1440,Math.max(0,Math.floor(tick)));i++)engine.step();engine.pause();engine.soundEvents.length=0;render();update();}
  async function play(){await audio.unlock();audio.setEnabled($('sound').checked);engine.resume();running=engine.state==='running';last=performance.now();}
  function pause(){running=false;engine.pause();audio.stop();engine.soundEvents.length=0;update();}
  function update(){const s=P.inspect(engine);$('clock').textContent=engine.time.toFixed(2)+'s / '+engine.tick+' tick';$('seek').value=engine.tick;$('frame-label').textContent=engine.tick;$('notice').textContent=P.ui(engine).at(-1)?.text||($('scene').value==='live'?'正式机制 · 真实对局样本':'受控表现样例 · 非正式角色技能');$('stats').textContent='新通道：'+s.active+'/24 个表现 · '+s.drawnParticles+'/256 颗粒子 · 已降级 '+s.dropped+' · 音频声部 '+audio.voices.size+'/8';
    const rows=P.timeline(engine).events.slice(-36).reverse();$('events').replaceChildren(...rows.map(v=>{const tr=document.createElement('tr');for(const text of [v.simTime?.toFixed(3),v.stage||v.kind,v.parentId||v.id,v.cue?String(v.cue)+(v.audioTime!==undefined?' @audio '+v.audioTime.toFixed(3):''):v.outcome||'']){const td=document.createElement('td');td.textContent=text||'—';tr.append(td);}return tr;}));}
  function preset(){return {schema:1,presentationVersion:P.version,mode:team?'2v2':'1v1',scene:$('scene').value,seed:$('seed').value,tick:engine.tick,speed:clock.speed,parameters:{...params}};}
  function json(value){return new Blob([JSON.stringify(value,null,2)],{type:'application/json'});}
  function download(blob,name,click=true){const url=URL.createObjectURL(blob);urls.push(url);if(urls.length>24){const old=urls.shift();URL.revokeObjectURL(old);[...$('downloads').querySelectorAll('a')].find(a=>a.href===old)?.remove();}const a=document.createElement('a');a.href=url;a.download=name;a.textContent=name;$('downloads').append(a);if(click)a.click();return a;}
  async function record(video=true){
    if(recorder?.state==='recording')throw Error('请先结束当前录制');
    if(!window.MediaRecorder||!canvas.captureStream)throw Error('当前浏览器不支持媒体录制，仍可导出PNG与JSON');
    const audible=audio.enabled;audio.enabled=true;await audio.unlock();audio.enabled=audible&&audio.available;
    if(!audio.context||audio.context.state!=='running')throw Error('声音未解锁，请先点击播放');
    try{
      tap=audio.context.createMediaStreamDestination();audio.compressor.connect(tap);
      const tracks=video?[...canvas.captureStream(60).getVideoTracks(),...tap.stream.getAudioTracks()]:[...tap.stream.getAudioTracks()];
      recordStream=new MediaStream(tracks);
      const mime=(video?['video/webm;codecs=vp8,opus','video/webm']:['audio/webm;codecs=opus','audio/webm']).find(t=>MediaRecorder.isTypeSupported(t));
      const chunks=[];recorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:{});
      recordStop=new Promise(resolve=>{recorder.onstop=()=>{
        const blob=new Blob(chunks,{type:recorder.mimeType}),item={blob,video,mime:recorder.mimeType,tracks:tracks.map(t=>t.kind),bytes:blob.size};
        recordings.push(item);if(recordings.length>8)recordings.shift();clearTimeout(recordTimer);
        download(blob,'feel-'+(video?'video':'audio')+'-'+Date.now()+'.webm',false);
        audio.compressor.disconnect(tap);recordStream.getTracks().forEach(t=>t.stop());recorder=null;tap=null;
        $('record-state').textContent='录制完成，可点击下载。';resolve(item);
      };});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.start(100);recordTimer=setTimeout(()=>stopRecord().catch(handleError),12000);
      $('record-state').textContent=video?'正在录制画面与声音…':'正在录制声音…';return {tracks:tracks.map(t=>t.kind),mime:recorder.mimeType};
    }catch(error){if(tap)audio.compressor.disconnect(tap);recordStream?.getTracks().forEach(t=>t.stop());tap=recorder=null;throw error;}
  }
  async function stopRecord(){if(!recorder||recorder.state!=='recording')return null;recorder.stop();return recordStop;}
  audio.onCue=data=>P.note(engine,'audio.started',{parentId:data.presentationId,cue:data.kind,requestedTick:data.requestedTick,audioTime:data.audioTime});
  function frame(now){if(running){clock.advance((now-last)/1000);if(engine.state!=='running')running=false;}last=now;if(engine.state==='running')audio.consume(engine.soundEvents.splice(0));render();if(now-lastUI>80){update();lastUI=now;}requestAnimationFrame(frame);}
  function handleError(e){$('record-state').textContent=e.message;}
  $('play').onclick=()=>play().catch(handleError);$('pause').onclick=pause;$('reset').onclick=reset;$('scene').onchange=reset;$('seed').onchange=reset;$('speed').onchange=()=>{clock.speed=Number($('speed').value);};$('seek').oninput=()=>seek(Number($('seek').value));$('step').onclick=()=>{pause();engine.resume();engine.step();engine.pause();engine.soundEvents.length=0;render();update();};$('sound').onchange=()=>audio.setEnabled($('sound').checked);$('motion').onchange=()=>{renderer.reducedMotion=$('motion').checked;render();};$('json').onclick=()=>download(json({...P.timeline(engine),fixture:preset()}),'feel-events.json');$('preset').onclick=()=>download(json(preset()),'feel-preset.json');$('png').onclick=()=>canvas.toBlob(blob=>download(blob,'feel-'+$('scene').value+'-'+engine.tick+'.png'));$('record-video').onclick=()=>record(true).catch(handleError);$('record-audio').onclick=()=>record(false).catch(handleError);$('stop-record').onclick=()=>stopRecord().catch(handleError);
  $('capability').textContent=window.MediaRecorder&&canvas.captureStream?'支持本地媒体录制，不使用麦克风或屏幕权限。先录制，再播放场景。':'当前浏览器缺少媒体录制接口；PNG与JSON仍可用。';
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('beforeunload',()=>{audio.stop();recordStream?.getTracks().forEach(t=>t.stop());urls.forEach(u=>URL.revokeObjectURL(u));});
  $('motion').checked=renderer.reducedMotion;reset();window.feelLab=Object.freeze({ready:true,scene(name){$('scene').value=name;reset();},seed(value){$('seed').value=value;reset();},seek,play,pause,reset,record,stopRecord,tune(patch){Object.assign(params,P.configure(engine,patch));for(const key of Object.keys(ranges)){$('param-'+key).value=params[key];$('value-'+key).textContent=params[key];}seek(engine.tick);},snapshot:()=>engine.snapshot(),timeline:()=>P.timeline(engine),inspect:()=>P.inspect(engine),preset,recordings:()=>recordings.map(({video,mime,tracks,bytes})=>({video,mime,tracks,bytes})),recordData:async index=>Array.from(new Uint8Array(await recordings[index].blob.arrayBuffer())),performance(){const sorted=[...costs].sort((a,b)=>a-b);return {samples:sorted.length,drawMsMedian:sorted[Math.floor(sorted.length*.5)]||0,drawMsP95:sorted[Math.floor(sorted.length*.95)]||0,note:'render-call cost only; not sustained FPS',devicePixelRatio,viewport:[innerWidth,innerHeight],userAgent:navigator.userAgent};}});requestAnimationFrame(frame);
})().catch(e=>{document.getElementById('notice').textContent='实验室加载失败：'+e.message;console.error(e);});
