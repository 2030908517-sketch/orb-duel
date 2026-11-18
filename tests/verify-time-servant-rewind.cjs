const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
function load(entry){const root=path.resolve(__dirname,'..'),c=vm.createContext({console,performance,structuredClone,Math,Date,URLSearchParams,document:{},matchMedia:()=>({matches:false})});c.window=c;for(const m of fs.readFileSync(root+'/'+entry+'.html','utf8').matchAll(/<script src="js\/([^"?]+)\.js/g)){if(['app','team-app','manual-ui','manual-fullscreen','animation-review','recording-view','audio-audition'].includes(m[1]))continue;vm.runInContext(fs.readFileSync(root+'/js/'+m[1]+'.js','utf8'),c,{filename:m[1]});}return c.OrbDuel;}
function scene(entry){const G=load(entry),e=new G.Engine(['demon','time'],'rewind-servant',{mode:entry==='index'?'1v1':'arcana'});e.start();const[d,t]=e.balls,r=G.Demon.Servants.add(d,t,{x:150,y:150},e);G.Demon.Servants.spawn(r,e);return{G,e,d,t,s:e.balls.find(b=>b.id===r.actorId)};}
for(const entry of ['arcana','manual']){
 {const{G,e,t,s}=scene(entry);s.hp=0;ok(!s.arcana,'servant has no ultimate');ok(!G.TimeRewind.trigger(e),'dead servant cannot start rewind');ok(!t.arcana.used&&!e.timeRewind.spent.has(s.id),'no real or servant ultimate consumed');ok(!e.timeRewind.active,'world continues');}
 {const{G,e,t,s}=scene(entry);s.hp=t.hp=0;ok(G.TimeRewind.trigger(e),'real dead time orb can rewind');ok(e.timeRewind.active.owner===t.id,'real actor hosts rewind');ok(e.timeRewind.spent.has(t.id)&&!e.timeRewind.spent.has(s.id),'only legal real actor is spent');ok(!e.balls.some(b=>b.demonServant),'real rewind still clears servants');}
 {const{G,e,t,s}=scene(entry);t.arcana.used=true;s.hp=0;ok(!G.TimeRewind.enabled(e),'spent real time orb does not unlock servant');ok(!G.TimeRewind.trigger(e),'no second rewind');}
}
{const{G,e,s}=scene('index');s.hp=0;ok(!G.TimeRewind.enabled(e)&&!G.TimeRewind.trigger(e),'classic has no death-rewind ultimate');}
console.log(JSON.stringify({passed:true,checks}));
