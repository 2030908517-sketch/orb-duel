(function (root) {
  'use strict';
  const Game = root.OrbDuel = root.OrbDuel || {};
  Game.Constants = Object.freeze({ width: 360, height: 340, dt: 1 / 240, radius: 23, collisionCooldown: 0.22, heatStart: 60, decayStart: 150, decayPerSecond: 3 });
  Game.Types = Object.freeze({
    normal: Object.freeze({ name: '普通球', color: '#70b5ff', symbol: '●', hp: 120, damage: 11.5, speed: 235, maxSpeed: 235, mass: 1, pressureWait:6, pressureRate:.03, pressureCap:.3, skill: '稳进重击', description: '三次实际扣血积满重击，下次有效碰撞 +35%。6 秒未造成伤害后，每秒蓄力 +3%，最多 +30%；造成伤害后清空，盾完全抵消时保留。', advantage: '蓄力重击', weakness: '依赖接触' }),
    vampire: Object.freeze({ name: '吸血球', color: '#ef86ba', symbol: '♥', hp: 108, damage: 10, speed: 225, maxSpeed: 225, mass: 1, lifesteal: 0.44, skill: '生命汲取', description: '攻击实际扣血的 44% 转化为治疗。擅长持久战，但生命较低，无法吸取护盾。', advantage: '持续回复', weakness: '怕高爆发' }),
    accelerator: Object.freeze({ name: '加速球', color: '#f8c56c', symbol: 'ϟ', hp: 110, damage: 10, speed: 205, maxSpeed: 365, mass: 0.9, acceleration: 2.4, hitBoost: 12, pressureWait:6, pressureRate:.02, pressureCap:.2, skill: '动能突击', description: '积累速度，速度增伤最高 +40%。法向接近速度 ≥430、自身迎撞速度 ≥250 时，实伤命中造成击退和 0.7 秒失衡；失衡首次撞墙按法向动能追加一次伤害（上限 12）；觉醒冲撞逐渐减速、反弹不中断，撞敌结束。强撞后降速 20、恢复 0.8 秒。久未命中可蓄力。', advantage: '后期爆发', weakness: '前期较弱' }),
    reflector: Object.freeze({ name: '反伤球', color: '#b39cff', symbol: '✦', hp: 120, damage: 9, speed: 210, maxSpeed: 210, mass: 1.2, reflection: 0.75, stancePeriod: 6.5, stanceDuration: 3, stanceWarning: 0.45, skill: '荆棘姿态', description: '每 6.5 秒预警 0.45 秒后进入 3 秒反击姿态，返还实际扣血的 75%。其余时间不反伤；返还不递归。', advantage: '反制强攻', weakness: '姿态空窗' }),
    shield: Object.freeze({ name: '护盾球', color: '#61d8c3', symbol: '⬡', hp: 114, damage: 10, speed: 225, maxSpeed: 225, mass: 1.1, shieldAmount: 14, shieldPeriod: 10, shieldDuration: 2.8, pressureWait:8, pressureRate:.02, pressureCap:.16, skill: '脉冲屏障', description: '每 10 秒获得 14 盾，持续 2.8 秒。8 秒未造成伤害后，每秒碰撞蓄力 +2%，最多 +16%；实际造成伤害清空，破盾波不享受蓄力。', advantage: '周期防御', weakness: '护盾空窗' }),
    ranger: Object.freeze({ name: '射手球', color: '#ff9a70', hp: 108, damage: 5, speed: 215, maxSpeed: 215, mass: 1, shotDamage: 6.5, shotPeriod: 3, shotSpeed: 440, shotRadius: 4, shotLife: 1.6, skill: '弹道射击', description: '每 3 秒预判射出一枚 6.5 伤害子弹，撞墙一次后增伤 15%。子弹可清除敌方已布防陷阱，但子弹也会消耗。擅长远程消耗，但碰撞攻击和生命偏低。', advantage: '远程消耗', weakness: '近战偏弱' }),
    trapper: Object.freeze({ name: '陷阱球', color: '#f0717c', hp: 114, damage: 8, speed: 210, maxSpeed: 210, mass: 1.1, trapDamage: 9, trapPeriod: 3.6, trapRadius: 12, trapArmDelay: 0.55, trapLife: 10, maxTraps: 3, skill: '沿途布防', description: '每 3.6 秒放置 9 伤害陷阱，0.55 秒后布防，只伤敌人。陷阱持续 10 秒，最多 3 枚；对手绕开时无效，也可被子弹或光束拆除。未触发自然过期返还 0.4 秒布雷冷却；拆除和超上限替换不返还。', advantage: '封锁路线', weakness: '可被绕开' }),
    boomerang: Object.freeze({ name:'回旋球',color:'#65cee9',hp:112,damage:7.5,speed:220,maxSpeed:220,mass:1,shotSpeed:340,shotRadius:5,shotLife:2.8,shotDamage:4.1,shotPeriod:4.6,skill:'弧刃连携',description:'弧线飞刃去程实伤留刃印，回程斩印伤害 ×1.5，各程限命中一次。武器在外时近战为 80%；完整接回获得一次 3 秒内可用的 +40% 近战，并返还 0.35 秒冷却。飞刃不撞墙弹跳，回程追随主人。',advantage:'往返双击',weakness:'回程会落空' }),
    laser: Object.freeze({ name:'激光球',color:'#e5dd78',hp:105,damage:6,speed:210,maxSpeed:210,mass:1,laserDamage:15,laserPeriod:5.5,laserCharge:.65,laserWidth:4,skill:'锁线光束',description:'每 5.5 秒锁定预判方向，细线预警 0.65 秒后释放 15 伤害光束。方向不追踪，释放后进入冷却；可清除光路上的敌方陷阱。连续两次完全落空返还 0.6 秒冷却，命中或拆雷会清空落空计数。',advantage:'集中爆发',weakness:'蓄力可落空' }),
    venom: Object.freeze({ name:'毒液球',color:'#a4d568',hp:112,damage:8,speed:215,maxSpeed:215,mass:1,poolDamage:.9,awakePoolDamage:1.05,toxinBurst:5.5,poolPeriod:3.2,poolRadius:32,poolLife:5,poolCap:2,skill:'腐蚀循环',description:'碰撞实伤上 1 层毒、持续 3 秒；毒池每 0.9 秒帮助叠 1 层，离池持续至少 1.5 秒。最多 3 层，每 0.5 秒每层 0.9 毒伤，不重置跳伤计时。满毒后再碰撞消耗毒层，引爆 5.5 伤害，独立冷却 2.5 秒；无人踩过的池自然过期返还 0.35 秒留池 CD。',advantage:'区域消耗',weakness:'依赖毒池接触' })
  });
  Game.RNG = class RNG {
    constructor(seed) {
      let h = 2166136261;
      for (const char of String(seed)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
      this.state = h >>> 0;
    }
    next() { let t = this.state += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    between(a, b) { return a + (b - a) * this.next(); }
  };
  Game.makeBall = function (id, type, x, y, rng) {
    const def = Game.Types[type];
    if (!def) throw new Error('Unknown ball type: ' + type);
    const angle = rng.between(0, Math.PI * 2);
    return { id, type, def, x, y, previousX: x, previousY: y, vx: Math.cos(angle) * def.speed, vy: Math.sin(angle) * def.speed, radius: Game.Constants.radius, mass: def.mass, hp: def.hp, maxHp: def.hp, speed: def.speed, shield: 0, shieldUntil: 0, nextShield: 0, nextShot: def.shotPeriod || Infinity, nextTrap: def.trapPeriod || Infinity, flash: 0, trail: [], charges:0, pressure:{lastHit:0,bonus:0},inertia:0,stagger:null,bladeMark:null,character:Game.Characters.fresh(),laserMisses:0,bladeCastId:0,lastRecallCast:0,notice:null, stance:{phase:'rest',until:0,next:0,stored:0}, nextLaser:def.laserPeriod||Infinity, laser:null, nextPool:def.poolPeriod||Infinity, poison:null, motionSpeed: 0, awakening: Game.Awakening.fresh(), stats: { damage: 0, healing: 0, absorbed: 0, reflected: 0, cdReturned:0, shotsFired: 0, shotsHit: 0, trapsPlaced: 0, trapsTriggered: 0, trapsCleared:0, heavyHits:0, dashHits:0, lasersFired:0, lasersHit:0, poolsPlaced:0, poisonHits:0,toxinBursts:0,strongHits:0,wallSlams:0,bladesCaught:0,bladeFinishers:0, countersFired:0, countersHit:0 } };
  };
})(typeof window !== 'undefined' ? window : globalThis);

