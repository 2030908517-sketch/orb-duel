(function (root) {
  'use strict';
  const G = root.OrbDuel;
  // Local synth cues. No audio assets, network or combat RNG.
  const profiles = {
    wall:{duration:.065,cooldown:.065,priority:0,layers:[['triangle',780,440,.5]]},
    ball:{duration:.16,cooldown:.1,priority:2,layers:[['sine',210,65,.65],['triangle',420,140,.22]]},
    heavy:{duration:.23,cooldown:.12,priority:5,layers:[['sine',160,42,.65],['triangle',720,90,.25]]},
    shot:{duration:.10,cooldown:.16,priority:2,layers:[['triangle',1400,450,.40],['sine',720,260,.22]]},
    shotHit:{duration:.13,cooldown:.12,priority:3,layers:[['triangle',920,180,.4],['sine',220,70,.4]]},
    trap:{duration:.12,cooldown:.22,priority:1,layers:[['triangle',280,480,.34],['sine',960,960,.18,.05]]},
    explosion:{duration:.30,cooldown:.15,priority:5,layers:[['sawtooth',110,28,.4],['triangle',520,60,.30]]},
    chain:{duration:.36,cooldown:.45,priority:3,layers:[['sine',340,180,.35],['triangle',680,350,.18,.08]]},
    heal:{duration:.16,cooldown:.42,priority:1,layers:[['sine',660,880,.28],['sine',880,1100,.18,.04]]},
    shield:{duration:.28,cooldown:.25,priority:3,layers:[['sine',520,780,.30],['triangle',1040,1560,.22]]},
    break:{duration:.25,cooldown:.2,priority:4,layers:[['triangle',1800,220,.36],['sine',250,80,.32]]},
    reflect:{duration:.13,cooldown:.18,priority:2,layers:[['triangle',950,550,.30],['sine',1500,850,.18]]},
    charge:{duration:.50,cooldown:.45,priority:3,layers:[['sine',180,780,.25],['triangle',360,1560,.13]]},
    dash:{duration:.22,cooldown:.25,priority:4,layers:[['sawtooth',1000,100,.26],['sine',280,60,.4]]},
    ready:{duration:.15,cooldown:.3,priority:2,layers:[['sine',700,1050,.25]]},
    stance:{duration:.23,cooldown:.35,priority:3,layers:[['triangle',420,900,.25],['sine',840,1200,.18]]},
    counter:{duration:.21,cooldown:.25,priority:4,layers:[['triangle',1500,450,.3],['sine',250,100,.3]]},
    counterHit:{duration:.19,cooldown:.2,priority:5,layers:[['triangle',1100,280,.35],['sine',240,70,.4]]},
    shieldHit:{duration:.12,cooldown:.12,priority:3,layers:[['sine',1200,860,.27],['triangle',640,470,.17]]},
    ricochet:{duration:.07,cooldown:.09,priority:1,layers:[['triangle',1700,900,.22]]},
    disarm:{duration:.17,cooldown:.3,priority:3,layers:[['triangle',1700,500,.23],['sine',660,330,.2]]},
    combo:{duration:.31,cooldown:.4,priority:6,layers:[['sine',170,40,.5],['triangle',700,100,.26]]},
    throw:{duration:.14,cooldown:.2,priority:2,layers:[['triangle',980,350,.24]]},
    return:{duration:.12,cooldown:.2,priority:1,layers:[['sine',440,880,.2]]},
    returnHit:{duration:.18,cooldown:.2,priority:4,layers:[['triangle',850,350,.28],['sine',170,60,.35]]},
    laser:{duration:.26,cooldown:.3,priority:4,layers:[['sawtooth',1500,160,.22],['sine',300,70,.3]]},
    laserHit:{duration:.21,cooldown:.2,priority:5,layers:[['triangle',1100,90,.28],['sine',140,45,.45]]},
    poison:{duration:.20,cooldown:.4,priority:1,layers:[['sine',360,180,.22]]},
    poisonHit:{duration:.08,cooldown:.35,priority:1,layers:[['sine',490,320,.17]]},
    awakenHit:{duration:.32,cooldown:.16,priority:5,layers:[['sine',120,35,.58],['triangle',740,100,.22]]},
    bloodPulse:{duration:.24,cooldown:.27,priority:3,layers:[['sine',110,75,.42],['sine',660,330,.16]]},
    thunderHit:{duration:.30,cooldown:.18,priority:5,layers:[['sawtooth',1200,80,.22],['sine',130,30,.48]]},
    revengeHit:{duration:.30,cooldown:.18,priority:5,layers:[['triangle',1600,180,.26],['sine',150,38,.46]]},
    fortressBlast:{duration:.32,cooldown:.2,priority:5,layers:[['sine',180,45,.4],['triangle',1100,160,.24]]},
    volley:{duration:.17,cooldown:.13,priority:3,layers:[['triangle',1800,440,.3],['sine',160,60,.3]]},
    magnetBlast:{duration:.38,cooldown:.18,priority:5,layers:[['sawtooth',180,30,.32],['triangle',1400,110,.24]]},
    moonCut:{duration:.20,cooldown:.16,priority:4,layers:[['triangle',1300,340,.25],['sine',240,90,.28]]},
    beamAwake:{duration:.42,cooldown:.23,priority:6,layers:[['sawtooth',2200,160,.20],['sine',150,32,.48]]},
    corrosion:{duration:.16,cooldown:.4,priority:2,layers:[['sine',290,80,.23],['triangle',680,170,.12]]},
    awakening:{duration:.50,cooldown:.15,priority:6,layers:[['sine',440,440,.27],['sine',660,660,.23,.10],['triangle',880,880,.18,.20]]},
    toxinBurst:{duration:.30,cooldown:.15,priority:5,layers:[['sawtooth',680,85,.22],['sine',160,45,.4]]},
    wallSlam:{duration:.30,cooldown:.16,priority:6,layers:[['triangle',95,26,.55],['sawtooth',540,70,.2]]},
    bladeCatch:{duration:.20,cooldown:.12,priority:3,layers:[['triangle',1400,480,.25],['sine',820,1100,.14]]},
    victory:{duration:.56,cooldown:.6,priority:7,layers:[['sine',523,523,.25],['sine',659,659,.24,.12],['triangle',784,1047,.22,.24]]}
  };
  G.Audio = class Audio {
    static profiles = profiles;
    constructor(){
      this.enabled=true;this.available=true;this.context=null;this.master=null;this.voices=new Set();
      this.lastPlayed={};this.played=Object.fromEntries(Object.keys(profiles).map(kind=>[kind,0]));this.lastCue='';
    }
    async unlock(){
      if(!this.enabled || !this.available)return;
      try{
        const Context=root.AudioContext || root.webkitAudioContext;if(!Context)throw new Error('Web Audio unavailable');
        if(!this.context){
          this.context=new Context();this.master=this.context.createGain();this.master.gain.value=.24;
          this.compressor=this.context.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.knee.value=6;this.compressor.ratio.value=8;this.compressor.attack.value=.003;this.compressor.release.value=.12;
          this.master.connect(this.compressor);this.compressor.connect(this.context.destination);
        }
        if(this.context.state==='suspended')await this.context.resume();
      }catch(_){this.available=false;this.enabled=false;}
    }
    setEnabled(enabled){this.enabled=enabled && this.available;if(!this.enabled)this.stop();}
    stop(){
      for(const voice of this.voices){for(const osc of voice.oscillators){try{osc.stop();}catch(_){}}for(const node of voice.nodes){try{node.disconnect();}catch(_){}}}
      this.voices.clear();this.lastPlayed={};
    }
    consume(events){
      if(!this.enabled || this.context?.state!=='running')return;
      const latest=new Map();for(const event of events)if(profiles[event.kind])latest.set(event.kind,event);
      // Strong cues lead; dense 4× events coalesce. Eight concurrent cues maximum.
      const ordered=[...latest.values()].sort((a,b)=>profiles[b.kind].priority-profiles[a.kind].priority);let started=0;
      for(const event of ordered){
        const kind=event.kind,now=this.context.currentTime;
        if(started>=3)break;
        if(kind==='ball' && (latest.has('heavy') || latest.has('explosion') || latest.has('laserHit') || latest.has('counterHit') || ordered.some(e=>['awakenHit','thunderHit','revengeHit','fortressBlast','magnetBlast','beamAwake'].includes(e.kind))))continue;
        if(now-(this.lastPlayed[kind]??-Infinity)<profiles[kind].cooldown)continue;
        if(this.voices.size>=8){
          const quietest=[...this.voices].sort((a,b)=>profiles[a.kind].priority-profiles[b.kind].priority)[0];
          if(profiles[kind].priority<4 || profiles[quietest.kind].priority>=profiles[kind].priority)continue;
          for(const osc of quietest.oscillators){try{osc.stop();}catch(_){}}
          for(const node of quietest.nodes)node.disconnect();this.voices.delete(quietest);
        }
        this.lastPlayed[kind]=now;
        const voice=G.Audio.synthesize(this.context,this.master,kind,now,event.pan,()=>this.voices.delete(voice));
        voice.kind=kind;this.voices.add(voice);this.played[kind]++;this.lastCue=kind;started++;
      }
    }
    snapshot(){return {enabled:this.enabled,available:this.available,contextState:this.context?.state || 'locked',activeVoices:this.voices.size,played:{...this.played},lastCue:this.lastCue};}
    static synthesize(context,destination,kind,when,pan=0,onEnded=()=>{}){
      const spec=profiles[kind];if(!spec)throw new Error('Unknown audio cue: '+kind);
      const panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));panner.connect(destination);
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='explosion'?1200:kind==='wall'?2400:3200;filter.connect(panner);
      const voice={oscillators:[],nodes:[filter,panner]};let remaining=spec.layers.length;
      for(const [type,from,to,gain,delay=0] of spec.layers){
        const start=when+delay,end=when+spec.duration,osc=context.createOscillator(),envelope=context.createGain();
        osc.type=type;osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,end);
        envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(gain,start+.004);envelope.gain.exponentialRampToValueAtTime(.0001,end);
        osc.connect(envelope);envelope.connect(filter);osc.start(start);osc.stop(end+.008);
        voice.oscillators.push(osc);voice.nodes.push(osc,envelope);
        osc.onended=()=>{if(--remaining===0){for(const node of voice.nodes)node.disconnect();onEnded();}};
      }
      return voice;
    }
  };
})(typeof window!=='undefined'?window:globalThis);
