(function(root){
 'use strict';const G=root.OrbDuel,V=G.WindView,X=G.WindTempest;if(!V||!X)return;const C=G.Constants,TAU=Math.PI*2,PI=Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
 const A=G.WindTempestView={
  path(c,ps,width,alpha,color='#e3f1db'){V.ribbon(c,ps,width,alpha,color);},
  patrol(c,v,e){if(v.kind!=='patrol')return;const age=e.time-v.at,fade=ease((age+.08)/.3)*ease((v.until-e.time)/.35),boost=v.boostUntil>e.time,hot=v.energizedUntil>e.time,spin=v.angle;
   if(v.trail.length>2){const pts=v.trail.slice().reverse();this.path(c,pts,boost?9:3,fade*(boost?.43:.2));for(let i=0;i<2;i++)this.path(c,pts.map((p,k)=>({x:p.x+Math.sin(k*.3+i)*3,y:p.y+Math.cos(k*.3+i)*3})),1,fade*.3);}
   c.save();c.translate(v.x,v.y+20);c.scale(1.28,1.12);const lean=Math.cos(v.heading)*(boost?.22:.07);c.transform(1,0,lean,1,0,0);
   // Uneven sheets circulate through a soft volume; no solid cone outline or uniform coil stack.
   V.surface(c,v,'patrol',112,120,Math.floor(age*30),data=>{for(let y=0;y<120;y++)for(let x=0;x<112;x++){const xx=(x/112-.5)*116,yy=-66+y/120*94,q=clamp((14-yy)/75,0,1),r=13+25*q,curl=Math.sin(q*5+spin*.23)*4,u=(xx-curl)/r;if(Math.abs(u)>1.25||q>.99||yy>18)continue;const theta=Math.acos(clamp(u,-1,1)),envelope=Math.exp(-Math.pow(Math.abs(u),6)*1.4)*ease(q/.13)*ease((1-q)/.12);let d=0;
    for(const side of [-1,1]){const h=q+Math.sin(theta)*side*.08,phase=theta*side-h*10-spin*.8,fold=(.5+.5*Math.sin(phase*1.75+.28*Math.sin(h*14-spin*.21)))**5,fiber=(.5+.5*Math.sin(phase*6+h*9))**14;d+=(.075+fold*.55+fiber*.055)*(side>0?1:.37);}
    d*=envelope*fade*ease((age*4-q+.2)*3)*(hot?1.2:1);V.pixel(data,(y*112+x)*4,d);}},[-58,-66,116,94]);
   for(let j=0;j<4;j++){const ps=[];for(let i=0;i<=30;i++){const q=i/30,a=spin*.8+j*2.399+q*(3.8+j*.23),r=12+q*(21+j*1.2);ps.push({x:Math.cos(a)*r+Math.sin(q*5+spin*.2)*4,y:12-q*64+Math.sin(a)*r*.27});}this.path(c,ps,j===0?1.25:.55,fade*(hot?.8:.5));}
   for(let j=0;j<7;j++){const q=(age*(boost?1.7:1)+j*.173)%1,a=spin*.65+j*2.399,r=45-q*31,ps=[];for(let k=0;k<13;k++){const t=k/12,aa=a+t*.6;ps.push({x:Math.cos(aa)*(r+t*8),y:8+Math.sin(aa)*(r+t*8)*.33-q*8});}this.path(c,ps,.5+Math.sin(q*PI),fade*Math.sin(q*PI)*.55);}
   // Crown is an open, tilted eye. Separate moving lips establish volume instead of another ground circle.
   for(let j=0;j<3;j++){const ps=[];for(let i=0;i<29;i++){const q=i/28,a=spin*.46+j*2.18+q*2.45,r=33+Math.sin(a*2+spin*.12)*2;ps.push({x:Math.cos(a)*r-2,y:-48+Math.sin(a)*r*.28});}this.path(c,ps,2.4-j*.55,fade*(.62-j*.1),'#e5fff5');}
   c.restore();
   if(v.hold?.path?.length>2){const ps=v.hold.path;this.path(c,ps,4.5,fade*.6);this.path(c,ps.slice(-12),1.2,fade*.8,'#effbe7');const t=e.balls.find(b=>b.id===v.hold.target);if(t){const ps=[];for(let i=0;i<18;i++){const q=i/17,x=v.x+(t.x-v.x)*q,y=v.y+(t.y-v.y)*q;ps.push({x:x+Math.sin(q*PI)*4,y:y-Math.sin(q*PI)*6});}this.path(c,ps,3,fade*.5);}}
  },
  wall(c,b,e,front){const u=b.wind.storm;if(u?.kind!=='tide')return;const age=e.time-u.at,warning=X.config.warning,form=ease(age/warning),fade=ease((b.arcana.until-e.time)/.6),p=X.frontPoint(u,0),dx=u.dx,dy=u.dy;
   c.save();c.translate(p.x,p.y);c.rotate(u.angle);
   if(!front){
    // Broad turbulent cloud shelf: several folded depths travel with the true advancing wall.
    V.surface(c,u,'cloud',144,256,Math.floor(age*24),data=>{for(let y=0;y<256;y++)for(let x=0;x<144;x++){const side=(y/256-.5)*u.half*2,xx=-152+x/144*180,curve=-side*side/(u.half*6),n=xx-curve,warp=11*Math.sin(side*.034-age*1.3)+5*Math.sin(side*.091+age*2.1),f=n-warp+45,phase=side*.065+Math.sin(f*.055-age*1.7)*1.6,roll=.5+.5*Math.sin(phase),fold=(.5+.5*Math.cos(f*.12+1.4*Math.sin(side*.052-age*2.6)))**4,envelope=Math.exp(-Math.pow(f/53,2))*ease((xx+152)/24)*ease((28-xx)/15)*ease((u.half-Math.abs(side))/25),d=(.10+roll*.25+fold*.19)*envelope*form*fade,k=(y*144+x)*4;data[k]=60+d*70;data[k+1]=84+d*92;data[k+2]=100+d*104;data[k+3]=Math.min(210,d*440);}},[-152,-u.half,180,u.half*2]);
   }
   if(front){
    V.surface(c,u,'wall',164,280,Math.floor(age*30),data=>{for(let y=0;y<280;y++)for(let x=0;x<164;x++){const xx=-136+x/164*188,side=(y/280-.5)*u.half*2,curve=-side*side/(u.half*6),bend=2.5*Math.sin(side*.043-age*2)+1.3*Math.sin(side*.12+age*3),dx=xx-curve-bend,warp=side+12*Math.sin(dx*.043-age*2.5)+5*Math.sin(side*.038+age),phase=warp*.041+1.9*Math.sin(warp*.017-age*.7)+.6*Math.sin(warp*.067+age)+Math.sin(dx*.065-age*3.5)*1.4+.25*Math.sin(warp*.19+age),fold=(.5+.5*Math.sin(phase))**5,body=Math.exp(-Math.pow((dx+27)/39,2)),nose=Math.exp(-dx*dx/26)*(.22+.16*Math.sin(side*.041+age*2)**2),tail=Math.exp(-Math.pow((dx+76)/34,2))*(.5+.5*Math.sin(warp*.113+dx*.045-age*4))**7,edge=ease((u.half-Math.abs(side))/22),d=(nose+body*(.13+fold*.53)+tail*.22)*form*fade*edge*ease((xx+136)/22)*ease((52-xx)/15);const k=(y*164+x)*4,hot=clamp(d*1.3,0,1);data[k]=110+hot*140;data[k+1]=145+hot*107;data[k+2]=158+hot*97;data[k+3]=Math.min(225,d*355);}},[-136,-u.half,188,u.half*2]);
    // Broken crest fragments expose the direction without drawing a continuous luminous fence.
    for(let j=0;j<7;j++){const ps=[],center=Math.sin(j*2.399)*u.half*.88,span=19+(j*17%29);for(let i=0;i<=24;i++){const q=i/24,y=center+(q-.5)*span,x=-y*y/(u.half*6)+2.5*Math.sin(y*.043-age*2)+1.3*Math.sin(y*.12+age*3);ps.push({x,y});}this.path(c,ps,j%3===0?1.5:.65,form*fade*(.43+j%3*.1),'#f2ffe6');}
    for(let j=0;j<15;j++){const side=Math.sin(j*2.399+age*.13)*u.half,offset=((age*99+j*37)%158)-135,curve=-side*side/(u.half*6),ps=[];for(let i=0;i<16;i++){const q=i/15;ps.push({x:curve+offset-q*(18+j%4*7),y:side+Math.sin(q*3+j+age)*4+q*q*(j%2?7:-7)});}this.path(c,ps,j%4===0?1.1:.5,form*fade*.46,'#dce8cf');}
   }
   c.restore();
  },
  jet(c,j,e){const after=j.finished?ease(1-(e.time-j.ended)/.5):1,age=e.time-j.at,head=X.pathAt(j,j.travel),trail=[];for(let d=Math.max(0,j.travel-145);d<=j.travel+.1;d+=4)trail.push(X.pathAt(j,d));if(trail.length<2)trail.push(head);
   if(j.style==='lane'){
    // Narrow split streams retain straight-ahead speed; no crescent or cyclone rim.
    for(const side of [-1,1]){const ps=trail.map((p,i)=>{const q=i/Math.max(1,trail.length-1),d=side*(2.5+5*(1-q));return{x:p.x-Math.sin(p.angle)*d,y:p.y+Math.cos(p.angle)*d};});this.path(c,ps,1.8,after*.85,'#c5f8ff');}
    this.path(c,trail,4,after*.37,'#e8ffff');
   }else if(j.style==='pivot'){
    // A swept, feathered pressure ribbon visibly turns with the real bent path.
    this.path(c,trail,13,after*.55,'#89d8ba');for(let n=0;n<3;n++){const ps=trail.slice(-25).map((p,i)=>({x:p.x-Math.sin(p.angle)*(n-1)*3,y:p.y+Math.cos(p.angle)*(n-1)*3}));this.path(c,ps,n===1?2:1,after*.8,'#e8ffda');}
   }else{
    // Broad fan jet with separating curtains, distinct from lane needles and hooked pivot.
    this.path(c,trail,27,after*.42,'#fff1c5');for(const side of [-1,1]){const ps=trail.map((p,i)=>{const q=i/Math.max(1,trail.length-1),d=side*(5+(1-q)*20);return{x:p.x-Math.sin(p.angle)*d,y:p.y+Math.cos(p.angle)*d};});this.path(c,ps,4,after*.75,'#fffbea');}
   }
   c.save();c.translate(head.x,head.y);c.rotate(head.angle);const width=j.width;
   if(j.style==='lane'){
    V.surface(c,j,'needle',112,72,Math.floor(age*40),data=>{for(let y=0;y<72;y++)for(let x=0;x<112;x++){const xx=-106+x/112*128,yy=(y/72-.5)*52,spread=3+Math.max(0,-xx)*.052,filament=Math.exp(-Math.pow((Math.abs(yy)-spread)/2.5,2)),nose=Math.exp(-xx*xx/25-yy*yy/13),envelope=Math.exp(-Math.pow((xx+29)/51,2))*ease((xx+106)/15),d=(filament*.62+nose*.6)*envelope*after,k=(y*112+x)*4;data[k]=188;data[k+1]=238;data[k+2]=255;data[k+3]=Math.min(230,d*350);}},[-106,-26,128,52]);
   }else if(j.style==='gate'){
    // A broad pressure bow and longitudinal fan fingers; never a second funnel silhouette.
    V.surface(c,j,'fan',112,112,Math.floor(age*40),data=>{for(let y=0;y<112;y++)for(let x=0;x<112;x++){const xx=-82+x/112*109,yy=(y/112-.5)*166,dx=xx+yy*yy/185,edge=Math.exp(-Math.pow(yy/54,4)*1.5),nose=Math.exp(-dx*dx/38),spread=11+clamp((xx+82)/98,0,1)*39,fold=Math.exp(-Math.pow((Math.abs(yy)-spread*.38)/3.7,2))+.7*Math.exp(-Math.pow((Math.abs(yy)-spread*.83)/5.2,2)),tail=Math.exp(-Math.pow((xx+30)/40,2)),d=(nose*.64+fold*tail*.39)*edge*after*ease((xx+82)/16),k=(y*112+x)*4;data[k]=246;data[k+1]=239;data[k+2]=207;data[k+3]=Math.min(230,d*350);}},[-82,-83,109,166]);
    for(let j=0;j<5;j++){const side=(j-2)*.5,ps=[];for(let i=0;i<22;i++){const q=i/21,x=-85+q*86,y=side*(13+q*40)+Math.sin(q*3+age*9+j)*2;ps.push({x,y});}this.path(c,ps,j===2?1.8:.8,after*.65,'#fff9df');}
   }else{
    V.surface(c,j,'hook',112,112,Math.floor(age*40),data=>{for(let y=0;y<112;y++)for(let x=0;x<112;x++){const xx=-82+x/112*109,yy=(y/112-.5)*118,dx=xx+yy*yy/145,edge=Math.exp(-Math.pow(yy/35,4)*1.5),nose=Math.exp(-dx*dx/24),phase=yy*.18+Math.sin(xx*.09-age*8),tail=Math.exp(-Math.pow((dx+25)/29,2))*(.5+.5*Math.sin(phase))**5,d=(nose*.5+tail*.55)*edge*after*ease((xx+82)/16);V.pixel(data,(y*112+x)*4,d);}},[-82,-59,109,118]);
   }c.restore();
  },
  fling(c,f,e,p){const fade=(1-p)**1.3,ca=Math.cos(f.angle),sa=Math.sin(f.angle),local=q=>({x:(q.x-f.x)*ca+(q.y-f.y)*sa,y:-(q.x-f.x)*sa+(q.y-f.y)*ca}),orbit=(f.orbit||[]).map(local);
   // Tear the actual preceding orbit open before the straight flight trail takes over.
   if(orbit.length>2){this.path(c,orbit,6*(1-p),fade*.75,'#b4eed9');this.path(c,orbit.slice(-15),1.5,fade*.9,'#f2fff7');}
   const origin=local({x:f.fromX,y:f.fromY});for(let j=0;j<3;j++){const ps=[];for(let i=0;i<25;i++){const q=i/24,a=(-1.2+q*2.2)*(f.spin||1)+j*.54,r=20+p*36+j*5;ps.push({x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r*.65});}this.path(c,ps,(3.7-j*.9)*fade,fade*.7,'#d8ffe9');}
   V.surface(c,f,'release',124,112,Math.floor(f.age*45),data=>{for(let y=0;y<112;y++)for(let x=0;x<124;x++){const xx=-49+x/124*161,yy=(y/112-.5)*120,front=xx-6-p*52+yy*yy/210,skin=Math.exp(-front*front/45),sheet=Math.exp(-Math.pow((front+20)/23,2))*(.5+.5*Math.sin(yy*.14+Math.sin(xx*.09-p*6)))**5,edge=Math.exp(-Math.pow(yy/41,4)*1.8),d=(skin*.72+sheet*.45)*edge*fade*ease((xx+49)/13);V.pixel(data,(y*124+x)*4,d);}},[-49,-60,161,120]);
   const t=e.balls.find(t=>t.id===f.target),count=Math.min(10,Math.max(0,Math.floor(f.age/(G.Constants.dt*5))-1));if(t&&count>1){const trail=[...t.trail.slice(0,count).reverse(),{x:t.x,y:t.y}].map(local);this.path(c,trail,8*fade,fade*.55,'#99dac8');this.path(c,trail,2.2*fade,fade*.95,'#effff3');for(const side of [-1,1]){const ps=trail.map((p,i)=>{const a=trail[Math.max(0,i-1)],z=trail[Math.min(trail.length-1,i+1)],dx=z.x-a.x,dy=z.y-a.y,n=Math.hypot(dx,dy)||1,k=side*(6+2*Math.sin(i*.5-f.age*12));return{x:p.x-dy/n*k,y:p.y+dx/n*k};});this.path(c,ps,1.2*fade,fade*.65,'#d1f8ed');}}
   // Few directional, tapered air fragments, grouped around the release rather than dirty scatter.
   for(let j=0;j<9;j++){const a=Math.sin(j*2.399)*.9,travel=(18+j*5)*(1-Math.exp(-p*5)),x=Math.cos(a)*travel,y=Math.sin(a)*travel*.8,ps=[];for(let k=0;k<11;k++){const q=k/10;ps.push({x:x-q*(8+j%3*5),y:y+Math.sin(q*PI)*((j%2?1:-1)*3)});}this.path(c,ps,(.6+j%3*.25)*fade,fade*.8,'#edfff2');}
  },
  flingHit(c,f,p){const fade=(1-p)**1.5,damp=f.blocked?.58:1;
   V.surface(c,f,'cut',128,128,Math.floor(f.age*50),data=>{for(let y=0;y<128;y++)for(let x=0;x<128;x++){const xx=-76+x/128*152,yy=(y/128-.5)*152,curve=-8+yy*yy/190+p*19,w=4.8*(1-p)+1.2,cut=Math.exp(-Math.pow((xx-curve)/w,2)),lip=Math.exp(-Math.pow((xx-curve+8)/11,2))*(.5+.5*Math.sin(yy*.12+xx*.025-p*5))**4,edge=Math.exp(-Math.pow(yy/(54+p*18),4)*1.6),d=(cut*.95+lip*.42)*edge*fade*damp;V.pixel(data,(y*128+x)*4,d);}},[-76,-76,152,152]);
   for(let j=0;j<2;j++){const ps=[];for(let i=0;i<35;i++){const q=i/34,y=(q-.5)*(94+p*49),x=-8+y*y/190+p*19-j*9;ps.push({x,y});}this.path(c,ps,(2.2-j)*fade,fade*.9*damp,'#f5fff0');}
   if(p<.23){const k=(1-p/.23)*damp;c.globalAlpha=k;c.strokeStyle='#faffee';c.lineWidth=2.2*k;c.beginPath();c.moveTo(-12,-7);c.lineTo(13,8);c.moveTo(-4,-13);c.lineTo(5,13);c.stroke();}
  },
  front(r,e){const c=r.ctx;c.save();c.beginPath();c.rect(0,0,C.width,C.height);c.clip();for(const b of e.balls){const u=b.wind?.storm;if(u?.kind==='tide'){for(const j of u.jets)this.jet(c,j,e);}}
   for(const f of e.effects){if(f.kind!=='wind'||!['patrolBirth','patrolEnd','capture','fling','patrolKick','channelWake','pivot','gateOpen','tideStart','tideEnd','flingHit','tideHit','jetHit'].includes(f.style))continue;const p=clamp(f.age/f.life,0,1),fade=1-p;c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);
    if(f.style==='fling')this.fling(c,f,e,p);
    else if(f.style==='gateOpen'){
     V.surface(c,f,'vent',104,104,Math.floor(f.age*40),data=>{for(let y=0;y<104;y++)for(let x=0;x<104;x++){const xx=-34+x/104*146,yy=(y/104-.5)*146,spread=14+Math.max(0,xx)*.27,shift=xx-18-p*40,skin=Math.exp(-Math.pow((Math.abs(yy)-spread)/8,2)),core=Math.exp(-yy*yy/(spread*spread*1.7))*(.5+.5*Math.sin(yy*.17+Math.sin(xx*.06-p*9)*1.3))**5,envelope=Math.exp(-shift*shift/2200)*ease((xx+34)/15),d=(skin*.36+core*.48)*envelope*Math.sin(PI*p)**.6;V.pixel(data,(y*104+x)*4,d);}},[-34,-73,146,146]);
     for(let j=0;j<3;j++){const ps=[];for(let i=0;i<=26;i++){const q=i/26,a=(q*2-1)*(.7+j*.17),r=(18+p*(63+j*15));ps.push({x:Math.cos(a)*r-19,y:Math.sin(a)*r*(.66+j*.09)});}this.path(c,ps,(3.8-j*.8)*fade,fade*.8);}
    }
    else if(f.style==='patrolKick'){const power=f.style==='patrolKick'?1:1.7;for(let j=0;j<4;j++){const ps=[];for(let i=0;i<=25;i++){const q=i/25,a=(q*2-1)*.85,r=(20+p*65+j*6)*power;ps.push({x:Math.cos(a)*r-20,y:Math.sin(a)*r*.6});}this.path(c,ps,(4.5-j*.7)*fade,fade*.8);} }
    else if(['capture','patrolBirth','patrolEnd'].includes(f.style)){for(let j=0;j<3;j++){const ps=[];for(let i=0;i<22;i++){const q=i/21,a=j*2.399+q*2.5+p*2,r=(f.style==='patrolEnd'?16+p*24:36-p*16)*(1-q*.3);ps.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.6});}this.path(c,ps,2.4,fade*.6);}}
    else if(f.style==='tideHit'){for(let j=0;j<6;j++){const a=j*1.02+.22,ps=[];for(let i=0;i<15;i++){const q=i/14,r=9+q*(24+p*45);ps.push({x:Math.cos(a)*r*(1+p*.35),y:Math.sin(a)*r*.62});}this.path(c,ps,3.5*fade,fade*.72,'#ebf5ff');}}
    else if(f.style==='jetHit'){for(let j=0;j<3;j++){const ps=[];for(let i=0;i<18;i++){const q=i/17;ps.push({x:(q-.35)*(45+p*66),y:(j-1)*(3+Math.sin(q*PI)*6)});}this.path(c,ps,1.5*fade,fade*.85,'#d9faff');}}
    else if(f.style==='flingHit'){}
    else if(f.style==='pivot'){for(let j=0;j<2;j++){const ps=[];for(let i=0;i<=30;i++){const q=i/30,a=-1.7+q*2.6+j*.6,r=14+p*37+j*6;ps.push({x:Math.cos(a)*r,y:Math.sin(a)*r*.68});}this.path(c,ps,(3.3-j)*fade,fade*.85,'#e8ffda');}}
    else if(f.style==='channelWake'){for(let j=0;j<3;j++)V.stream(c,p*28,(j-1)*8,0,45,13,p,j,fade*.6);}
    c.restore();
   }c.restore();}
 };
 // Impact lip belongs above the victim; air volume and true trail remain behind it.
 const roles=G.Renderer.prototype.drawRoleEffects;G.Renderer.prototype.drawRoleEffects=function(e){roles.call(this,e);const c=this.ctx;c.save();c.beginPath();c.rect(0,0,C.width,C.height);c.clip();for(const f of e.effects){if(f.kind!=='wind'||f.style!=='flingHit')continue;c.save();c.translate(f.x,f.y);c.rotate((f.angle||0)+.22);A.flingHit(c,f,clamp(f.age/f.life,0,1));c.restore();}c.restore();};
 V.patrol=(c,v,e)=>A.patrol(c,v,e);V.storm=(c,b,e,front)=>A.wall(c,b,e,front);
 const fore=V.fore;V.fore=function(r,e){fore.call(this,r,e);A.front(r,e);};
})(typeof window!=='undefined'?window:globalThis);
