(function(root){
  'use strict';const S=root.OrbDuel.CollisionStudy,TAU=Math.PI*2;
  // Three deterministic PCM candidates. No combat RNG, assets or network.
  function synth(key,sampleRate=48000){
    if(!S.profiles[key])throw Error('Unknown sound');
    const life={A:.19,B:.33,C:.39}[key],data=new Float32Array(Math.ceil(sampleRate*life));
    let rng=73991,low=0,phase=0,phase2=0;
    for(let i=0;i<data.length;i++){
      const t=i/sampleRate;rng=(Math.imul(rng,1664525)+1013904223)>>>0;const noise=rng/4294967296*2-1;
      low+=.14*(noise-low);const high=noise-low,attack=1-Math.exp(-t/({A:.0008,B:.0025,C:.0012}[key]));
      const f=key==='A'?300+550*Math.exp(-t*90):key==='B'?125+210*Math.exp(-t*38):65+160*Math.exp(-t*30);
      phase+=TAU*f/sampleRate;phase2+=TAU*(key==='C'?330:600)/sampleRate;
      let v;
      if(key==='A')v=.50*high*Math.exp(-t*90)+.38*Math.sin(phase)*Math.exp(-t*35)+.08*Math.sin(phase2)*Math.exp(-t*50);
      else if(key==='B')v=.16*low*Math.exp(-t*48)+.60*Math.sin(phase)*Math.exp(-t*19)+.09*Math.sin(phase2)*Math.exp(-t*38);
      else v=.34*high*Math.exp(-t*80)+.65*Math.sin(phase)*Math.exp(-t*19)+.15*Math.sin(phase2)*Math.exp(-t*32)+.28*low*Math.exp(-t*25);
      data[i]=v*attack*Math.min(1,(life-t)/.016);
    }
    // Equal integrated energy is a controlled starting point, NOT perceptual loudness matching.
    let sum=0,peak=0;for(const v of data){sum+=v*v;peak=Math.max(peak,Math.abs(v));}
    const gain=Math.min(Math.sqrt(.002/(sum/sampleRate)),.82/peak);
    for(let i=0;i<data.length;i++)data[i]*=gain;
    return {data,sampleRate};
  }
  function analyze({data,sampleRate}){
    let sum=0,peak=0,first=-1,peakIndex=0,dc=0;for(let i=0;i<data.length;i++){const v=data[i];if(!Number.isFinite(v))throw Error('Nonfinite audio');sum+=v*v;dc+=v;if(Math.abs(v)>peak){peak=Math.abs(v);peakIndex=i;}if(first<0&&Math.abs(v)>.001)first=i;}
    let cumulative=0,end90=0;for(let i=0;i<data.length;i++){cumulative+=data[i]*data[i];if(cumulative>=sum*.9){end90=i/sampleRate;break;}}
    return {seconds:data.length/sampleRate,sampleRate,peak,rms:Math.sqrt(sum/data.length),energy:sum/sampleRate,dc:dc/data.length,onsetMs:1000*first/sampleRate,peakMs:1000*peakIndex/sampleRate,energy90Ms:1000*end90};
  }
  function wav(pcm,volume=1){
    const n=pcm.data.length,bytes=new ArrayBuffer(44+n*2),v=new DataView(bytes),s=(at,t)=>[...t].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
    s(0,'RIFF');v.setUint32(4,36+n*2,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,pcm.sampleRate,true);v.setUint32(28,pcm.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);s(36,'data');v.setUint32(40,n*2,true);for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.round(S.clamp(pcm.data[i]*volume,-1,1)*32767),true);return bytes;
  }
  class Sound{
    constructor(note){this.audio=new root.OrbDuel.Audio();this.note=note;this.cache={};}
    async unlock(){const wanted=this.audio.enabled;this.audio.enabled=true;await this.audio.unlock();this.audio.enabled=wanted&&this.audio.available;if(!this.audio.context||this.audio.context.state!=='running')throw Error('当前浏览器未能启用声音');}
    stop(){this.audio.stop();}
    play(key,event,options,playhead){
      const a=this.audio,ctx=a.context;if(!ctx||!a.enabled||options.volume===0)return;
      if(a.voices.size>=8){this.note({kind:'audio.dropped',id:event.id,variant:key});return;}
      const pcm=this.cache[key]||(this.cache[key]=synth(key,ctx.sampleRate)),buffer=ctx.createBuffer(1,pcm.data.length,ctx.sampleRate);buffer.copyToChannel(pcm.data,0);
      const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),when=ctx.currentTime+.006;
      source.buffer=buffer;gain.gain.value=options.volume*2;pan.pan.value=(event.x/360-.5)*.8;
      source.connect(gain);gain.connect(pan);pan.connect(a.master);
      const voice={oscillators:[source],nodes:[source,gain,pan]};a.voices.add(voice);
      source.onended=()=>{a.voices.delete(voice);for(const node of voice.nodes)node.disconnect();};source.start(when);
      this.note({kind:'audio.scheduled',id:event.id,variant:key,simTime:event.time,replayTime:playhead,audioTime:when,renderDelayMs:1000*(playhead-event.time),scheduledLeadMs:6,outputLatency:ctx.outputLatency??null});
    }
  }
  root.OrbDuel.CollisionSound=Object.freeze({synth,analyze,wav,Sound});
})(typeof window!=='undefined'?window:globalThis);
