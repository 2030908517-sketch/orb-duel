(function(root){
'use strict';const G=root.OrbDuel;if(!G?.Audio||!G.AudioMix)return;
const keys=['throw','return','returnHit','moonCut'],clone=v=>JSON.parse(JSON.stringify(v)),legacy={},material={},pcmCache=new Map(),buffers=new WeakMap();
for(const key of keys){legacy[key]=clone(G.Audio.profiles[key]);material[key]={...clone(legacy[key]),layers:[],noise:undefined,reverb:undefined,bladeMaterial:true,duration:({throw:.23,return:.27,returnHit:.17,moonCut:.23})[key]};}
// Material excitation is independent of the old tonal layers and of combat RNG.
const specs={
 throw:{seed:113,air:.85,metal:.065,base:840,decay:.032,center:1800,sweep:1500,pulses:[[.03,.022,.45],[.087,.018,.7],[.133,.014,1],[.168,.012,.65]]},
 return:{seed:241,air:.8,metal:.055,base:760,decay:.037,center:1300,sweep:1700,pulses:[[.027,.014,.5],[.068,.017,.75],[.121,.026,1],[.18,.029,.6]]},
 returnHit:{seed:379,air:.62,metal:.20,base:680,decay:.022,center:2400,sweep:650,pulses:[[.009,.004,1],[.032,.012,.8],[.066,.019,.37]]},
 moonCut:{seed:517,air:.88,metal:.18,base:610,decay:.03,center:2200,sweep:1050,pulses:[[.014,.006,1],[.039,.013,.9],[.075,.022,.65],[.117,.024,.24]]}
};
function pcm(key,rate){const id=key+':'+rate;if(pcmCache.has(id))return pcmCache.get(id);const s=specs[key],duration=material[key].duration,n=Math.ceil(rate*duration),out=new Float32Array(n),modes=[1,1.613,2.731,4.087],phase=[.2,1.1,2.4,.7];let seed=s.seed,low=0,previous=0,hp=0,lp=0,y1=0,y2=0,x1=0,x2=0,peak=0,b0=0,b2=0,a1=0,a2=0,grain=0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;},high=Math.exp(-2*Math.PI*210/rate),smooth=1-Math.exp(-2*Math.PI*6200/rate);
 for(let i=0;i<n;i++){const t=i/rate,u=t/duration;let contact=0,ring=0;for(const [at,width,amp]of s.pulses){const d=(t-at)/width;contact+=amp*Math.exp(-.5*d*d);if(t>=at)for(let k=0;k<modes.length;k++)ring+=amp*Math.sin(2*Math.PI*s.base*modes[k]*(t-at)+phase[k])*Math.exp(-(t-at)/(s.decay/(1+k*.3)))/(1+k*.8);}
  // Curved spectral motion follows the air envelope; there is no swept pitched oscillator.
  if(i%32===0){const f=s.center+s.sweep*Math.sin(Math.PI*Math.min(1,u*1.15)),w=2*Math.PI*f/rate,alpha=Math.sin(w)/(2*.78),norm=1/(1+alpha);b0=alpha*norm;b2=-b0;a1=-2*Math.cos(w)*norm;a2=(1-alpha)*norm;}
  const white=rand();low+=.14*(white-low);if(i%Math.max(2,Math.round(rate*(key==='returnHit'?.00065:.0012)))===0)grain=rand();const excitation=white*.65+grain*.25+low*.18,air=b0*excitation+b2*x2-a1*y1-a2*y2;x2=x1;x1=excitation;y2=y1;y1=air;
  const slip=.74+.18*Math.sin(t*2*Math.PI*71+.8)+.08*Math.sin(t*2*Math.PI*137),value=air*contact*s.air*slip+ring*s.metal,edge=Math.min(1,t/.002,(duration-t)/.018);hp=high*(hp+value-previous);previous=value;lp+=smooth*(hp-lp);out[i]=lp*Math.max(0,edge);peak=Math.max(peak,Math.abs(out[i]));
 }
 const scale=.62/(peak||1);for(let i=0;i<n;i++)out[i]*=scale;pcmCache.set(id,out);return out;
}
const B=G.BladeAudio={variant:'A',keys,legacy,material,
 // Separate B calibration; the A profiles and their historical calibration remain intact.
 calibration:{throw:{tier:'B',db:0,gain:0.43972},return:{tier:'C',db:-3,gain:0.334066},returnHit:{tier:'B',db:0,gain:0.79312},moonCut:{tier:'A',db:1.5,gain:0.525358}},
 setVariant(value,stop=true){if(value!=='A'&&value!=='B')throw Error('Unknown blade audio variant');if(stop)G.Audio.live?.stop(true);this.variant=value;for(const key of keys)G.Audio.profiles[key]=value==='B'?material[key]:legacy[key];if(value==='B'&&G.Audio.live?.context)this.prepare(G.Audio.live.context);root.document?.dispatchEvent(new Event('blade-audio-change'));},
 buffer(context,key){let cache=buffers.get(context);if(!cache){cache=new Map();buffers.set(context,cache);}if(!cache.has(key)){const samples=pcm(key,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.copyToChannel(samples,0);cache.set(key,buffer);}return cache.get(key);},
 prepare(context){for(const key of keys)this.buffer(context,key);},cacheEntries(){return pcmCache.size;}
};
const describe=G.AudioMix.describe;G.AudioMix.describe=function(key){const d=describe.call(this,key);if(B.variant!=='B'||!keys.includes(key))return d;const c=B.calibration[key],trim=Math.max(-6,Math.min(6,this.trims[key]||0));return{...d,...c,gain:c.gain*Math.pow(10,trim/20),calibrated:true};};
const synthesize=G.Audio.synthesize;G.Audio.synthesize=function(context,destination,key,when,pan=0,onEnded=()=>{}){if(B.variant!=='B'||!keys.includes(key))return synthesize.call(this,context,destination,key,when,pan,onEnded);const source=context.createBufferSource(),panner=context.createStereoPanner();source.buffer=B.buffer(context,key);panner.pan.value=Math.max(-1,Math.min(1,pan));source.connect(panner);panner.connect(destination);const voice={oscillators:[source],nodes:[source,panner]};source.onended=()=>{for(const node of voice.nodes)try{node.disconnect();}catch(_){}onEnded();};source.start(when);return voice;};
function ui(){if(!root.document.querySelector('#sound-toggle'))return;const button=document.createElement('button');button.id='blade-audio-toggle';button.type='button';button.style.cssText='width:auto;padding:0 10px;white-space:nowrap';button.className='icon-button';button.title='仅切换回旋球四种基础刀声，候选版等待试听确认';document.querySelector('#audio-audition-open')?.after(button);const sync=()=>{button.textContent=B.variant==='A'?'刀声 A·旧版':'刀声 B·候选';button.setAttribute('aria-pressed',String(B.variant==='B'));};button.onclick=()=>B.setVariant(B.variant==='A'?'B':'A');document.addEventListener('blade-audio-change',sync);sync();
 const dialog=document.getElementById('audio-audition');if(!dialog)return;const section=document.createElement('section');section.id='blade-audio-ab';section.innerHTML='<h3>回旋球四基础音效 A/B</h3><p>默认A旧版；B为候选。实战用外侧「刀声」按钮切换，仅本页生效。</p>';const labels={throw:'旋转出手',return:'弧形回收',returnHit:'回刃切入',moonCut:'强力切割'};
 for(const key of keys){const row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap';const label=document.createElement('span');label.textContent=labels[key];label.style.minWidth='90px';row.append(label);for(const variant of ['A','B']){const b=document.createElement('button');b.type='button';b.dataset.bladeCue=key;b.dataset.bladeVariant=variant;b.textContent=variant==='A'?'A 旧版':'B 候选';b.style.cssText='padding:7px 10px;color:#e4edf5;background:#25374a;border:1px solid #4b6278;border-radius:6px';b.onclick=async()=>{const a=G.Audio.live;if(!a?.enabled)return;await a.unlock();const previous=B.variant;a.stop(true);B.setVariant(variant,false);a.consume([{kind:key,pan:0,preview:true}]);B.setVariant(previous,false);document.getElementById('audio-test-status').textContent=labels[key]+' · '+variant+'（相同混音基准）';};row.append(b);}section.append(row);}dialog.insertBefore(section,dialog.querySelector('#audio-test-status'));
}
if(root.document)document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ui,{once:true}):ui();
})(typeof window!=='undefined'?window:globalThis);
