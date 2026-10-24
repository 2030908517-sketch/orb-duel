(function(root){
 'use strict';const G=root.OrbDuel;
 // Shared, read-only inventory of actor effects. Skill cooldowns stay in their existing slots.
 G.StatusPanel={
  // Limited card space: actionable resources and timers precede visible world counts.
  priority:{
   normal:['拳势','蓄力','追击CD','追击','拳劲'],
   vampire:['血能','血契','追猎','汲取','链伤','返还CD','已回复'],
   accelerator:['动能','冲刺冷却','无敌','蓄力','速限','撞墙/敌','累计返速'],
   storm:['电荷','引雷CD','雷暴CD','导电','雷伤','电解伤'],
   charge:['电荷','放电CD','雷化','电弧伤','短路伤','带电点'],
   orbital:['轨道能','超新星CD','星核','卫星','彗星伤','爆发伤'],
   demon:['献祭魂力','地狱降临','双爪CD','魔爪CD','双门CD','钉刑','扯魂伤','魔爪伤','契魂','烙印','魂线'],
   reflector:['蓄能','姿态CD','姿态','即时返还','反击命中'],
   shield:['压力','护盾','充能','盾时','蓄力','波伤'],
   ranger:['校准','弹匣','装填','模式','散布','狙/重伤'],
   trapper:['节点','布置','置换','雷伤','捕获','扫线','返还CD'],
   boomerang:['接刃','投掷','武器','招式','刃伤','返还CD'],
   laser:['电容','散热','短喷','热刃','阶段','主炮'],
   ghost:['虚化CD','虚化余时','魂影','形态','恐吓/跳','魂爆'],
   holy:['守护CD','裁决CD','阵径/余时','天使'],
   magnet:['吸力','脉冲CD','过载CD','极性','牵引命中','墙撞命中'],
   time:['领域CD','时钟CD','沉默时','移/CD缓','侵蚀/跳','爆炸伤'],
   venom:['侵蚀进化','麻痹进化','喷吐CD','毒池CD','双毒上限','侵蚀/跳','施毒间隔','同巢共鸣','毒液三态']
  },
  prioritize(b,rows,limit=Infinity){const order=this.priority[b.type]||[],rank=label=>{const i=order.indexOf(label);return i<0?order.length:i;};return rows.map((row,i)=>({row,i})).sort((a,c)=>rank(a.row.label)-rank(c.row.label)||a.i-c.i).slice(0,limit).map(v=>v.row);},
  resourceFields(b,e){if(b.type!=='venom')return [];const rows=[{label:'毒池CD',value:Math.max(0,b.nextPool-e.time).toFixed(1)+'s'}];if(G.VenomEvolution&&(G.Awakening.active(b)||b.venomEvolution)){const cap=Math.round(G.VenomEvolution.config.cap*100);for(const [type,label] of [['erosion','侵蚀进化'],['paralysis','麻痹进化']])rows.push({label,value:'+'+G.VenomEvolution.percent(b,type)+'% / '+cap+'%'});}return rows;},
  stats(b,e){const awake=G.Awakening.status(b,e);return {core:[{label:'攻击',value:G.Combat.attackValue(b,e).toFixed(1)},{label:'速度',value:Math.round(Math.hypot(b.vx,b.vy))}],awake:awake.find(s=>s.label==='觉醒'),ultimate:e.mode==='arcana'?G.Arcana?.status(b,e):null,arcana:e.mode==='arcana',extra:this.prioritize(b,[...(G.Skills[b.type]?.status?.(b,e)||[]),...this.resourceFields(b,e),...awake.filter(s=>s.label!=='觉醒')],6)};},
  fillStats(meta,b,e,make){const s=this.stats(b,e);meta.style.setProperty('--orb-color',b.def.color);const core=document.createElement('div');core.className='stats-core';const stages=document.createElement('div');stages.className='stats-stages'+(s.arcana?' has-arcana':'');const skills=document.createElement('div');skills.className='stats-skills';core.append(...s.core.map(make));const awake=make(s.awake);awake.classList.add('awakening-stat');stages.append(awake);if(s.arcana){const ult=make(s.ultimate||{label:'奥义',value:''});ult.classList.add('arcana-stat');stages.append(ult);}for(let i=0;i<6;i++){const chip=make(s.extra[i]||{label:'',value:''});if(!s.extra[i])chip.classList.add('empty-slot');skills.append(chip);}meta.replaceChildren(core,stages,skills);},
  collect(b,e){if(b.hp<=0)return ['停止行动'];const out=[],t=e.time,r=b.role,a=b.awakening,c=b.character,active=until=>Number.isFinite(until)&&until>t+1e-8;
   const add=s=>{if(s&&!out.includes(s))out.push(s)},timed=(name,until)=>{if(active(until))add(name+' '+(until-t).toFixed(1)+'s')};
   const effects=(items)=>items.filter(v=>v.target===b.id&&active(v.until)&&e.balls.some(o=>o.id===v.owner&&o.hp>0));
   if(G.World.absent(b,e))add('离场');if(G.Physics.armored(b))add('霸体');
   if(G.Ghost.phased(b))timed('虚化无敌',b.ghost.until);
   if(G.Awakening.dashing(b,e))timed('冲刺无敌',a.dashUntil);
   if(G.Arcana?.immune(b))add('奥义无敌');
   if(G.Combat.reduction(b,e)>0)add('免伤 30%');if(G.DemonHell?.active(b,e))add('硬体 50%');
   if(b.role.jetActive)add('激光短喷');if(b.role.jetFree)add('免费短喷就绪');
   if(b.shield>0)add('护盾 '+b.shield.toFixed(1)+(active(b.shieldUntil)?' · '+(b.shieldUntil-t).toFixed(1)+'s':''));
   if(b.arcana?.royalActive&&b.arcana.royalShield>0)add('王城专属盾 '+b.arcana.royalShield.toFixed(1)+(active(b.arcana.royalUntil)?' · '+(b.arcana.royalUntil-t).toFixed(1)+'s':''));
   if(b.cageBounds)add('机械囚禁');const pulls=effects(e.arcanaWorld?.defense?.returns||[]);if(pulls.length&&!G.Physics.armored(b))timed('逆命牵返',Math.max(...pulls.map(v=>v.until)));
   const captures=(e.traps||[]).filter(v=>v.captureTarget===b.id&&active(v.captureUntil));if(captures.length&&!G.Physics.armored(b))timed('陷阱牵制',Math.max(...captures.map(v=>v.captureUntil)));
   if(G.Temporal.silenced(b,e))timed('沉默',b.temporal.silenceUntil);
   if(b.temporal.rate<.999)add('时间减速 '+Math.round((1-b.temporal.rate)*100)+'%');if((b.temporal.cooldownRate??1)<.999)add('技能延缓 '+Math.round((1-b.temporal.cooldownRate)*100)+'%');
   if(r.cutSlowActive&&active(r.cutSlowUntil)&&!G.Physics.armored(b))timed('热切减速55%',r.cutSlowUntil);
   if(b.kineticCycle)add(b.kineticCycle.side==='target'?'动能失衡':'动能轮回');if(b.stagger)timed('失衡',b.stagger.until);if(b.bladeMark)timed('刃印',b.bladeMark.until);if(r.bloodMark)timed('血印',r.bloodMark.until);
   if(b.magneticMark)timed(b.magneticMark.cause==='pull'?'磁牵引印记':'磁排斥印记',b.magneticMark.until);
   const toxins=G.Venom?.layers(b,t)||[];if(toxins.some(v=>v.type==='erosion'))timed('侵蚀中毒',Math.max(...toxins.filter(v=>v.type==='erosion').map(v=>v.until)));
   const n=toxins.filter(v=>v.type==='paralysis').length,weight=G.VenomEvolution?.paralysisWeight(b,e)??n;if(n){timed('麻痹中毒',Math.max(...toxins.filter(v=>v.type==='paralysis').map(v=>v.until)));if(!G.Physics.armored(b)){add('麻痹减速 '+Math.round(weight*G.Venom.config.slowPerLayer*100)+'%');add('瞄准转速降低 '+Math.round(weight*G.Venom.config.aimReductionPerLayer*100)+'%');}add('普通碰撞削弱 '+Math.round(weight*G.Venom.config.contactReductionPerLayer*100)+'%');}
   const living=e.livingVenom;if(living){const binds=living.binds.filter(v=>v.target===b.id&&v.until>t&&e.balls.some(o=>o.id===v.owner&&o.hp>0));if(binds.length)timed('活体缠缚',Math.max(...binds.map(v=>v.until)));const swarms=living.swarms.filter(v=>v.target===b.id&&v.until>t&&e.balls.some(o=>o.id===v.owner&&o.hp>0));if(swarms.length)timed('附身毒群',Math.max(...swarms.map(v=>v.until)));if(living.attacks.some(v=>v.target===b.id&&v.phase==='cling'))add('毒液附着侵入');}
   if(G.Venom?.inMist(b,e)&&!G.Physics.armored(b)&&!G.World.absent(b,e))add('毒雾瞄准扰动');
   const conductive=effects(e.chargeWorld?.conductive||[]);if(conductive.length)timed('导电',Math.max(...conductive.map(v=>v.until)));
   const staticMarks=effects(e.cosmicWorld?.marks||[]).filter(v=>v.stacks>0);if(staticMarks.length)add('电解印记 '+staticMarks.reduce((sum,v)=>sum+v.stacks,0)+' · '+(Math.max(...staticMarks.map(v=>v.until))-t).toFixed(1)+'s');
   const brands=effects(e.demonWorld?.marks||[]);if(brands.length)timed('地狱烙印',Math.max(...brands.map(v=>v.until)));const souls=(e.demonWorld?.souls||[]).filter(s=>s.target===b.id&&e.balls.some(o=>o.id===s.owner&&o.hp>0));for(const soul of souls){if(soul.loss>0)add('失魂 '+Math.round(soul.loss*100)+'% · 伤害−'+Math.round((1-G.Demon.outputFactor(b,e))*100)+'%');if(soul.state==='servant')timed('契魂追猎',soul.until);}
   add(G.Holy?.burnStatus(b,e));add(G.Adaptive?.status(b,e));
   const debt=G.VenomArcana?.state(b);if(debt?.active||debt?.pool>0){add('万毒缓蚀');add('伤害池 '+debt.pool.toFixed(1)+' · 下跳'+G.VenomArcana.amount(debt.pool).toFixed(1));if(debt.pool>=b.hp)add('缓蚀致死风险');}
   const gear=G.Overdrive?.state(b);if(gear?.active)add('动能轮回');
   if(G.Arcana?.busy(b)){const name=G.Arcana.defs[b.type]?.name||'奥义';const phases={blink:'瞬身',punch:'出拳',punchRecovery:'收势',warning:'蓄势',orbit:'高速环绕',sonicRecovery:'收势',bloodLiquefy:'液化',bloodTide:'血海围猎',bloodReverse:'漩涡回流',bloodFinale:'血柱重生',bloodRebirth:'展翼重生',bloodRecovery:'重生收势',counterStep:'闪避',counterCharge:'瞄准蓄能',counterRecovery:'收枪',debtCharge:'清算蓄势',debtRecovery:'清算收势',royalRise:'城墙升起',shrink:'王城收缩',hold:'王城封锁',release:'王城释放',trapReady:'替身待触发',trapAftermath:'囚笼爆破',laserFocus:'日轮展开',laserForge:'光铸天刃',laserSweep:'断界裁切',laserReturn:'万光归零'};add(name+(phases[b.arcana.phase]?' · '+phases[b.arcana.phase]:''));}
   if(e.timeRewind?.active)add('全场时间回溯');
   if(b.type==='normal'){if(b.charges>=3)add('重击就绪');else if(b.charges>0)add('拳势 '+b.charges+'/3');if(r.pursuitUntil>t)timed('回身追击加速',r.pursuitUntil);}
   if(b.pressure?.bonus>0)add('攻击蓄力 +'+Math.round(b.pressure.bonus*100)+'%');
   if(b.type==='vampire'){if(r.chainWarning)timed('血契预备',r.chainWarning);if(a.chainActive)timed('血契汲取',a.chainUntil);if(G.VampireHunt?.busy(b))add('血影追猎 · '+G.VampireHunt.status(b,e));}
   if(b.type==='reflector'){if(b.stance.phase==='warning')timed('反伤预备',b.stance.until);if(b.stance.phase==='active')timed(r.predictiveActive?'预判反伤':'反伤姿态',b.stance.until);if(r.predictReady)add('预判反伤就绪');if(G.DefenseArcana?.predictionReady(b,e))timed('奥义预测反伤资格',b.arcana.predictUntil);if(G.DefenseArcana?.guardActive(b,e))add('奥义预测反伤');if(r.counterRelease>0)add('蓄能反击待发');}
   if(b.type==='shield'&&(r.shieldRelease>0||r.shieldReserve>0))add('盾压震荡蓄势');
   if(b.type==='ranger'){if(r.calibration>0&&active(r.calibrationUntil))add('校准 '+r.calibration+'/'+b.def.calibrationCap);if(active(r.reloadUntil))timed('装填',r.reloadUntil);if(['aim','locked'].includes(r.sniperPhase))add(r.sniperPhase==='locked'?'狙击锁定':'狙击预瞄');if(r.sniperHurt&&['aim','locked'].includes(r.sniperPhase))add('狙击受创偏移');if(r.fireMode==='scatter'&&!r.reloadUntil&&r.ammo>0)add('枪阵强化');}
   if(b.type==='boomerang'&&G.BladeHunt){const h=c.bladeHunt;if(h?.swing)timed(h.swing.count>=2?'双刃挥斩':'单刃挥斩',h.swing.at+G.BladeHunt.config.slashLife);if(h?.plan?.mode==='chase'&&(e.projectiles||[]).some(p=>p.owner===b.id&&p.castId===h.plan.id&&p.returning))add('逐刃追猎');}
   if(b.type==='boomerang'&&active(c.catchUntil)&&!c.bladeRemaining)timed(G.BladeHunt?(c.catchPower>=1.4?'双刃重斩':'单刃重斩'):'接刃重击强化',c.catchUntil);
   if(b.type==='laser'){if(b.laser)add(b.laser.locked?'主炮锁定':'主炮预瞄');if(r.bladePhase)add('高温刃 · '+({warmup:'凝刃',sweep:'切割',return:'回收'}[r.bladePhase]||'准备'));if(active(r.coolingUntil))timed('主炮散热',r.coolingUntil);if(active(r.disruptedUntil))timed('电容防连震',r.disruptedUntil);}
   if(b.type==='venom'&&active(c.spreadFireAt))timed('腐蚀共鸣催化',c.spreadFireAt);
   if(b.type==='accelerator'&&active(a.chargeUntil))timed('冲刺蓄势',a.chargeUntil);
   if(b.type==='ghost'){if(b.ghost.phase==='warning')timed('虚化预备',b.ghost.until);if(active(b.ghost.lungeUntil))timed('幽魂突进',b.ghost.lungeUntil);if(active(b.ghost.chargeUntil))timed('幽魂突进蓄势',b.ghost.chargeUntil);}
   if(b.type==='magnet'){if(b.magnetic.anchored)add('磁力锚定');if(b.magnetic.pullBonus>0)add('吸引动能强化');const label={warning:'磁力蓄势',overloadWarning:'过载蓄势',pull:'磁力吸引',push:'磁力排斥',overload:'磁力过载'}[b.magnetic.phase];if(label)add(label);}
   if(G.Charge?.flowing(b))timed('电流化',b.charge.until);
   if(b.stellar&&b.stellar.phase!=='orbit')add({collapse:'恒星塌缩',core:'恒星核心',rebirth:'星体重生',recall:'群星回收'}[b.stellar.phase]||'星体变相');
   if(b.holy&&active(b.holy.chargeUntil))timed('圣裁蓄势',b.holy.chargeUntil);
   return out;
  },
  render(el,b,e,previousScroll){const states=this.collect(b,e),scroll=previousScroll??el.querySelector('.status-items')?.scrollTop??0;
   let label=el.querySelector('.status-heading'),list=el.querySelector('.status-items');if(!label){if(!list)el.replaceChildren();label=document.createElement('span');label.className='status-heading';label.textContent='状态';el.append(label);}if(!list){list=document.createElement('div');list.className='status-items';list.tabIndex=0;list.setAttribute('aria-label','当前全部状态，可滚动查看');el.append(list);}
   const texts=states.length?states:['正常'];for(let i=0;i<texts.length;i++){let tag=list.children[i];if(!tag){tag=document.createElement('span');tag.className='status-tag';list.append(tag);}if(tag.textContent!==texts[i])tag.textContent=texts[i];}while(list.children.length>texts.length)list.lastElementChild.remove();
   el.title=states.join(' · ')||'正常';el.classList.toggle('affected',states.length>0);list.scrollTop=scroll;
  }

 };
})(typeof window!=='undefined'?window:globalThis);
