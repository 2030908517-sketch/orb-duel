(async function(){
  'use strict';const $=id=>document.getElementById(id);
  const modules=['config','physics','skills','world','aim','flyers','mines','pursuit','characters','roles','ranger','awakening','temporal','magnet','ghost','holy','demon','cosmic','charge','stellar','adaptive','arcana','presentation','engine','audio'];
  for(const file of [...modules.map(n=>'../../js/'+n+'.js'), 'core.js','sound.js','view.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=file;s.onload=resolve;s.onerror=()=>reject(Error('加载失败：'+file));document.head.append(s);});
  const G=OrbDuel,S=G.CollisionStudy,V=G.CollisionView,Audio=G.CollisionSound,canvases=Object.fromEntries(['A','B','C'].map(k=>[k,$('canvas-'+k)])),options=Object.fromEntries(['A','B','C'].map(k=>[k,S.tune()])),trace=[],costs={A:[],B:[],C:[]},intervals=[],urls=[],captures=[],painted=new Set();
  let clip,key='B',cursor=0,running=false,last=performance.now(),lastUI=0,round=0,recorder=null,recordStream=null,tap=null,stopPromise=null,recordTimer=null,renderState={};
  function note(row){trace.push({...row,wallMs:performance.now(),round});if(trace.length>600)trace.shift();}
  const sound=new Audio.Sound(note);
  function load(){pause();clip=S.buildClip($('fixture').value,$('seed').value.trim()||'collision-001');cursor=0;round=0;trace.length=0;painted.clear();for(const e of clip.events)note({kind:'combat.contact',id:e.id,simTime:e.time,hits:e.hits});draw();update();}
  function draw(){
    for(const k of ['A','B','C']){if(document.body.classList.contains('solo')&&k!==key)continue;const now=performance.now();renderState[k]=V.draw(canvases[k],k,clip,cursor,options[k],$('diagnostic').checked);costs[k].push(performance.now()-now);if(costs[k].length>1000)costs[k].shift();
      if(running&&renderState[k].drawnContact){const e=clip.events.find(e=>cursor>=e.time&&cursor-e.time<S.profiles[k].life),token=k+':'+round+':'+e?.id;if(e&&!painted.has(token)){painted.add(token);note({kind:'visual.rendered',id:e.id,variant:k,simTime:e.time,replayTime:cursor,delayMs:1000*(cursor-e.time)});}}
    }
  }
  function update(){
    $('clock').textContent=Math.min(cursor,clip.duration).toFixed(3)+'s / '+Math.min(288,Math.floor(cursor/clip.dt))+' tick';$('seek').value=cursor*1000;
    const e=clip.events.find(e=>cursor>=e.time&&cursor<e.time+.55),a=e?cursor-e.time:0;
    for(const k of ['A','B','C'])$('phase-'+k).textContent=cursor>clip.duration?'本次结束 · 等待重放':e?(a<.04?'接触确认':'释放 → 恢复')+' · 接触后 '+Math.round(a*1000)+' ms':clip.fixture==='miss'?'没有真实碰撞 → 无反馈':'同轨迹移动 · 等待接触';
    $('play').textContent=running?'Ⅱ 暂停':'▶ 播放对比';$('selected').textContent='当前听 '+key+' · '+S.profiles[key].name;
    $('events').replaceChildren(...trace.slice(-18).reverse().map(e=>{const tr=document.createElement('tr');for(const text of [e.kind,e.variant||'共用',e.simTime?.toFixed(4),e.replayTime?.toFixed(4),e.audioTime?.toFixed(4),e.hits?e.hits.map(h=>'→'+h.targetId+' −'+h.actual.toFixed(2)).join(' / '):e.id]){const td=document.createElement('td');td.textContent=text??'—';tr.append(td);}return tr;}));
    $('metrics').textContent='仅播放 '+key+' 的声音 · 真实碰撞 '+clip.events.length+' 次 · 新增物理停时 0 · 已录 '+captures.length+' 段';
  }
  function choose(k){if(!S.profiles[k])return;sound.stop();key=k;$('version').value=k;for(const a of document.querySelectorAll('article[data-key]'))a.classList.toggle('selected',a.dataset.key===k);for(const b of document.querySelectorAll('.choose'))b.setAttribute('aria-pressed',String(b.dataset.key===k));for(const p of ['deform','strength','volume']){$(p).value=options[k][p];$(p+'-value').textContent=options[k][p].toFixed(2);}for(const p of ['camera','effects'])$(p).checked=options[k][p];draw();update();}
  async function play(){if($('sound').checked){await sound.unlock();sound.audio.setEnabled(true);}if(cursor>=1.6){cursor=0;round++;painted.clear();}running=true;last=performance.now();if(!recorder)$('status').textContent=$('sound').checked?'播放中：只听 '+key+' 的碰撞音。':'静音回放中。';update();}
  function pause(){running=false;sound.stop();updateSafe();}
  function updateSafe(){if(clip)update();}
  function seek(time){pause();cursor=S.clamp(time,0,1.6);draw();update();}
  function reset(){pause();cursor=0;round=0;trace.length=0;painted.clear();for(const e of clip.events)note({kind:'combat.contact',id:e.id,simTime:e.time,hits:e.hits});draw();update();}
  function cross(from,to){for(const e of clip.events)if(e.time>from&&e.time<=to){
    for(const k of ['A','B','C'])if(options[k].effects)note({kind:'presentation.request',id:e.id,variant:k,simTime:e.time,replayTime:to,delayMs:(to-e.time)*1000});
    if($('sound').checked&&options[key].effects)sound.play(key,e,options[key],to);
  }}
  function advance(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return;
    let remaining=seconds;while(remaining>0){const d=Math.min(remaining,1.6-cursor),old=cursor;cursor+=d;cross(old,cursor);remaining-=d;if(cursor>=1.6-1e-9){if($('loop').checked){cursor=0;round++;painted.clear();note({kind:'replay.loop',simTime:0,replayTime:0});}else{running=false;remaining=0;}}}draw();
  }
  function frame(now){const delta=Math.min(.1,Math.max(0,(now-last)/1000));if(running){intervals.push((now-last));if(intervals.length>1000)intervals.shift();advance(delta*Number($('speed').value));}else draw();last=now;if(now-lastUI>100){update();lastUI=now;}requestAnimationFrame(frame);}
  function output(blob,name,auto=true){const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=name;a.textContent=name;$('downloads').append(a);if(auto)a.click();if(urls.length>16){URL.revokeObjectURL(urls.shift());$('downloads').firstChild?.remove();}}
  function report(){return {schema:1,study:'collision-study-1',fixture:clip.fixture,seed:clip.seed,selected:key,options,playhead:cursor,speed:Number($('speed').value),engine:{dt:clip.dt,duration:clip.duration,contacts:clip.events,finalSnapshot:JSON.parse(clip.finalSnapshot),rng:clip.rng,fxRng:clip.fxRng},timeline:trace.map(e=>({...e})),audioCandidates:Object.fromEntries(['A','B','C'].map(k=>[k,Audio.analyze(Audio.synth(k))])),note:'Pure replay cosmetics; no new hitstop. Audio scheduling is not measured speaker onset; no subjective listening claimed.'};}
  function perf(){const quant=x=>{const s=[...x].sort((a,b)=>a-b);return {samples:s.length,p50:s[Math.floor(s.length*.5)]||0,p95:s[Math.floor(s.length*.95)]||0,max:s.at(-1)||0};};return {drawMs:Object.fromEntries(['A','B','C'].map(k=>[k,quant(costs[k])])),rafIntervalMs:quant(intervals),dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],userAgent:navigator.userAgent,note:'Short local sample, renderer cost and RAF interval; not a general FPS guarantee.'};}
  function lockRecording(locked){for(const id of ['fixture','seed','version','layout','deform','strength','volume','camera','effects','diagnostic','speed','sound','loop','reset','record'])$(id).disabled=locked;}
  async function record(){
    if(recorder)throw Error('正在录制，请先结束');if(!window.MediaRecorder||!canvases[key].captureStream)throw Error('此浏览器不支持录制；PNG、WAV 和 JSON 仍可导出');
    await sound.unlock();const a=sound.audio;tap=a.context.createMediaStreamDestination();a.compressor.connect(tap);const canvas=canvases[key];
    try{recordStream=new MediaStream([...canvas.captureStream(60).getVideoTracks(),...tap.stream.getAudioTracks()]);const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t)),chunks=[],recordedKey=key;
      recorder=new MediaRecorder(recordStream,mime?{mimeType:mime}:{});
      stopPromise=new Promise(resolve=>{recorder.onstop=()=>{clearTimeout(recordTimer);const blob=new Blob(chunks,{type:recorder.mimeType}),item={blob,variant:recordedKey,mime:recorder.mimeType,bytes:blob.size,tracks:recordStream.getTracks().map(t=>t.kind)};captures.push(item);if(captures.length>8)captures.shift();output(blob,'collision-'+recordedKey+'-'+Date.now()+'.webm',false);a.compressor.disconnect(tap);recordStream.getTracks().forEach(t=>t.stop());tap=recorder=null;lockRecording(false);$('status').textContent='已完成录制，可下载。';resolve({variant:item.variant,bytes:item.bytes,tracks:item.tracks});};});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start(100);lockRecording(true);note({kind:'capture.start',variant:key,audioTime:a.context.currentTime,replayTime:cursor});recordTimer=setTimeout(()=>stopRecord(),12000);$('status').textContent='正在录 '+key+'；仅该画面与声音。参数暂时锁定，结束后恢复。';
    }catch(e){a.compressor.disconnect(tap);recordStream?.getTracks().forEach(t=>t.stop());tap=recorder=null;lockRecording(false);throw e;}
  }
  async function stopRecord(){if(!recorder||recorder.state!=='recording')return null;note({kind:'capture.stop',variant:key,audioTime:sound.audio.context.currentTime,replayTime:cursor});recorder.stop();return stopPromise;}
  function error(e){$('status').textContent=e.message;console.error(e);}
  $('play').onclick=()=>running?pause():play().catch(error);$('reset').onclick=reset;$('fixture').onchange=()=>{if(recorder)return error(Error('请先结束录制再换场景'));load();};$('seed').onchange=load;$('seek').oninput=()=>seek(Number($('seek').value)/1000);$('contact').onclick=()=>seek(clip.events[0]?.time||.45);$('step').onclick=()=>seek(cursor+1/60);
  $('layout').onclick=()=>{document.body.classList.toggle('solo');$('layout').textContent=document.body.classList.contains('solo')?'三路对比':'单独放大';draw();};
  $('version').onchange=()=>{if(recorder){$('version').value=key;return error(Error('请先结束录制再切版本'));}choose($('version').value);};
  for(const b of document.querySelectorAll('.choose'))b.onclick=()=>{if(recorder)return error(Error('请先结束录制再切版本'));choose(b.dataset.key);};
  for(const b of document.querySelectorAll('.audition'))b.onclick=async()=>{try{if(recorder)throw Error('请先结束录制');pause();choose(b.dataset.key);await sound.unlock();sound.audio.setEnabled(true);const e=clip.events[0];if(e)sound.play(key,e,options[key],e.time);else $('status').textContent='本场景没有碰撞；不播放命中音。';}catch(e){error(e);}};
  for(const p of ['deform','strength','volume'])$(p).oninput=()=>{options[key]=S.tune({...options[key],[p]:Number($(p).value)});$(p+'-value').textContent=options[key][p].toFixed(2);draw();};
  for(const p of ['camera','effects'])$(p).onchange=()=>{options[key]=S.tune({...options[key],[p]:$(p).checked});sound.stop();draw();};$('diagnostic').onchange=draw;$('sound').onchange=()=>sound.audio.setEnabled($('sound').checked);
  $('png').onclick=()=>canvases[key].toBlob(b=>output(b,'collision-'+key+'-'+Math.round(cursor*1000)+'.png'));$('json').onclick=()=>output(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}),'collision-study.json');$('wav').onclick=()=>output(new Blob([Audio.wav(Audio.synth(key),options[key].volume)],{type:'audio/wav'}),'collision-'+key+'.wav');$('record').onclick=()=>record().catch(error);$('stop-record').onclick=()=>stopRecord().catch(error);
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('play').click();}if(['1','2','3'].includes(e.key)&&!recorder)choose(['A','B','C'][Number(e.key)-1]);if(e.key.toLowerCase()==='r')reset();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('beforeunload',()=>{sound.stop();recordStream?.getTracks().forEach(t=>t.stop());urls.forEach(u=>URL.revokeObjectURL(u));});
  load();choose('B');$('camera').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;options.C=S.tune({...options.C,camera:$('camera').checked});$('ready').textContent='正式引擎回放已就绪 · B 为待审候选，非已采纳';
  window.collisionLab=Object.freeze({ready:true,choose,play,pause,reset,seek,advance,record,stopRecord,report,perf,fixture(name){if(!S.fixtures[name])throw Error('Unknown fixture');$('fixture').value=name;load();},clip:()=>clip,selected:()=>key,tune(patch){options[key]=S.tune({...options[key],...patch});choose(key);},recordings:()=>captures.map(({blob,...rest})=>rest),recordData:index=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.slice(reader.result.lastIndexOf(',')+1));reader.readAsDataURL(captures[index].blob);}),audio:()=>sound.audio,draw});requestAnimationFrame(frame);
})().catch(e=>{document.getElementById('ready').textContent='实验页加载失败：'+e.message;console.error(e);});
