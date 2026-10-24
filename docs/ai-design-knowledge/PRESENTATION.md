# 战斗表现：当前实现与评审边界

本次审计的是数据与时序，不是美术/听感打分。没有本次浏览器播放、截图录像或实际试听，以下不能被引用成“已验证很帅/流畅/声音有力”。专业方法继续用已有[表现规范](../design/README.md)、[八专题知识库](../design/knowledge/README.md)、[画风锚点](../design/STYLE_ANCHORS.md)、[音频混音](../design/AUDIO_MIX.md)。

## 一次攻击怎样变成画面与声音

以激光主炮为例：角色自动充电→`laserPrepare`创建带fireAt/trackUntil的预警→Renderer画瞄准和蓄力→锁线→`laserFire`真实射线相交、清障并创建攻击包/光束对象→`Combat.resolveBatch`防御与扣血→`Roles.hit/finishImpacts`决定受击形变、推力、数字与声音请求→app帧中`Audio.consume`统一调度→回收/散热恢复下一轮。

这条链**不是由声音或动画结束回调驱动扣血**；大部分真实判定由战斗时钟。例：圣光有warningAt/at/expires，只有落地那次延长灼伤，留场触碰不延；血浪先armAt成形再发，几何相交才扣；血海待回血到显形发放，不能只提前做加血动画。

## 系统共用与角色专用

| 层 | 当前职责/限制 | 代码 |
| --- | --- | --- |
| 战斗事实 | 状态、伤害、运动、命中、技能阶段；可发effects/soundEvents/notice，不能由画图反向改规则 | engine/skills及各角色模块 |
| 旧表现队列 | `effects`、`soundEvents`、notice/log分别调用；角色可能多处请求同声音 | Engine.float/sound/signal/burst/impact |
| 通用事件层 | 只读scalar事件，profile同时建动画粒子/声音/UI/镜头；key去重、强度档、timeline捕获、临时参数 | [presentation.js](../../js/presentation.js) |
| 角色事件 | `eventId/castId/stage`将同招阶段串起来，并记录Presentation.note；新招使用程度更高 | VampireArcana.event、Trapper.event、LaserBlade.event、RangerArcana.event、Overdrive.event等 |
| 共用画面 | 等比世界映射、地面/预警/武器/球体/前景/数字/字幕顺序，震屏、球体hitVisual | [renderer.js](../../js/renderer.js) |
| 身份与演出 | 圣水/圆柱、电流周长、星核、爪链、枪械、血潮、机械囚笼、日轮、轮舞等专用geometry | 各`*-render.js`及`*-art.js` |
| 觉醒签名层 | 按觉醒与角色状态补充形状/轨迹/命中反馈，可抑制重复配音 | [spectacle.js](../../js/spectacle.js) |
| 声音 | 合成音色+混音校准+优先级/去重/避让，独立真实音频时间 | [audio.js](../../js/audio.js)、[audio-mix.js](../../js/audio-mix.js)、[arcana-audio.js](../../js/arcana-audio.js) |
| 状态/UI | 读取真实攻击、速度、醒/奥义、角色资源、状态，不自行实现战斗状态机 | [status-panel.js](../../js/status-panel.js)、app/team-app/manual-* |

**不是所有旧调用已经迁入统一Presentation.emit。** 共用事件系统可长期使用，但本报告不把设计目标说成全项目完成统一。角色phase字段、队列与局部event函数仍并存；新AI应从具体攻击请求追踪所有音画通道，避免以为一声/一个ring就是整套表现。

## 时间、停顿与反馈强度

- `Engine.hitStop`普通反馈≤0.075真实秒，通常0.22模拟秒频率限制；`Arcana.stop`可到0.8秒用于特定蓄势/高潮。都通过Clock暂停战斗推进，`Engine.step`单独快跑不会等待。
- 普通球奥义：预警→瞬身（本体逻辑瞬移，残影跨原/新位置）→0.085秒到位→0.6蓄势停顿→真正拳包→命中短停与击飞。长停是建立预期，不是任何特效都加长停。
- `Roles.heavyImpact`先在攻击包挂反馈；`finishImpacts`同目标每批选最大击退优先，防多次叠满。伤害≥15补强反馈/数值强字/停顿；有推力时最终冲量`min(480,push×1.35+actual×5)`。真实运动控制属于战斗，不能为“镜头效果”随意改它。
- 球体形变是drawBall读取hitVisual，沿受击方向压缩/拉伸，幅度随power；不改变半径判定。震屏读取impact/专用奥义冲击及Presentation相机，非世界坐标变更。
- 数字显示实际hpLoss/盾吸收，短浮字有边缘钳制；伤害≥15可高亮。状态栏固定预留，角色资源及觉醒/奥义单独显示，避免负面效果出现就推布局。
- 相同种类的旧队列声音、角色签名层、新阶段声可能重合，混音会合并；请求不等于播放。血海/陷阱/日轮等通过presented抑制重复通用击打，但不能因此断言完全没有重复通道。

## 渲染实现能力与资源

Canvas 2D直接路径、弧线、贝塞尔、填充/渐变/透明、少量shadow、粒子及轨迹缓存。画风可用代码原生几何实现，已确认血刃锚点是细刃锋线/简洁2D方向，不要求拟真贴图。图像/旧实验资产存在不代表正式页面载入。

每帧Canvas按逻辑尺寸等比缩放，devicePixelRatio最多2。`effects`裁切最近180，轨迹/魂影/卫星/标记等另有限长度；Presentation最多24活动fx、粒子绘制256、UI12、key1024、记录800条并报告丢弃。**effects180不代表全场总物体只有180**，场地对象在其他数组。

`prefers-reduced-motion`能抑制部分镜头/球体形变/阴影，不能据此称整个游戏都完整无闪烁或满足无障碍标准。Canvas画面分层与全屏比例由当前入口决定；UI缩放不能改变半径/边界。

## 音效与动态混音

当前正式入口走本地Web Audio合成，主要是多层振荡器、音高包络、确定性噪声、低通、部分混响；非下载Kenney素材替换。`blade-audio*`实验数据未在四入口加载，不能写成正式音效资产依赖。

`Audio.unlock`需要浏览器允许AudioContext，app开始/按钮用户手势解锁。暂停/静音/隐藏页停并清发声节点。实际调度路径：

1. `engine.soundEvents`最多保留32请求；app每渲染帧取走。
2. 同批每kind保留eventGain最高一声；按策略优先级排序。
3. 抑制轻球撞与强命中、holyLand/holyHit等重复；音色cooldown和policy.minGap过滤，不改技能CD。
4. 总活动声最多8、每批最多4；相同声通常1或2并发；强声可抢占弱声。
5. 经calibration增益、分组总线；S高潮压其他总线约−4dB，随后平滑恢复。
6. master当前0.332，经阈值−6dB/4:1压缩及软限幅再输出。校准db/增益不是实际扬声器响度或LUFS证据。

分档：S奥义高潮、A重要命中、B普通战斗、C提示、R高频轻伤、D背景；优先级和听觉响度不是一个维度。mix3强调整招CD/占空比/撞击强度，血契长CD多段不因高频就压成毒伤轻声。普通墙随法向速300～550平滑增强；当前eventGain低速−1.5dB到高速+3dB，再乘wall音色校准（旧文档分段文字不能直接当最终输出）。

此次只读运行调度与政策，没有重新渲染全音色波形或听音。原AUDIO_MIX.md有历史自动测量报告和“未人工试听”限制，**这些不是本次新通过的结果**。

## 可复现与评审工具

- `Presentation.capture/note/timeline`：记录tick/模拟秒、角色/目标、实际伤/吸收/回避、声音请求；声音`onCue`另记录真实播放时间，缺省关闭追踪。可分清“请求丢掉”和“没产生攻击”。参数configure只调表现，不改伤害/CD/RNG。
- `tests/collision-study`三碰撞实验、`tests/arcana-lab`角色演出场景及证据是历史隔离实验，不是正式平衡模式。需要当前演出对比可复用，但旧场景可能持有旧技能阶段。
- `AnimationReview`为最近约20秒静音画面缓存（受内存/尺寸限制），保存历史位图及面板，不恢复战斗快照；逐帧是采样画面帧，不等于每1/240秒都有图。
- F录制视图只重排面板/等比场地，不内置替玩家录屏到平台。手动页独立全屏HUD，真实CD/资源环和“自”奥义标签来自读取/可执行probe。

新表现评审至少分：代码时序和范围正确（可自动）、连续动作可读/角色辨识（需观看）、音画协调/听感（需播放与试听）、性能（需目标设备测量）。本次仅第一类的部分关键边界已验证。

## 2026-10-21 恶魔表现增量（历史，已被下方重构替换）

[DemonView](../../js/demon-render.js)绘制宿主半透明魂轮廓、同源盾薄膜、所属恶魔角印（多恶魔补编号/队色）和宿主—魂身绳。拘魂固定掌心，反扑通过魂身真实回移与掌指松开表达；第二门锁后保留路线，归魂不生成爆炸。普通处刑A档demonSoulCut与奥义S档demonExecute分离。见[设计/实看记录](../design/experiments/demon-soul-01.md)和[增量验证](DEMON_SOUL_UPDATE.md)。这不是对旧审计视听结论的重写。

## 2026-10-22 夺魂·噬魄（当前）

小型冷色魂火取代小球轮廓，赤红直索取代旧弯绳。直索高亮沿线传播，不用扭曲线段伪造命中；宿主暗红裂纹按失魂程度增加。猎身门张爪直刺，摄魂门分叉轮廓和收指钩索；锁后路线保留可见。奥义巨门、巨爪蓄势、实际斩索、红化契魂、退离再追击、溃散分阶段。复用已校准声音，不增加新音色；D.event关联声音与效果/时间线，停帧仅真实成功请求，不再叠普通爪的通用大光圈。参见[本轮方案与观察](../design/experiments/demon-devour-01.md)及[增量验证](DEMON_DEVOUR_UPDATE.md)。已查看真实页面有序帧，未人工试听，不宣称最终美术品质或全局性能通过。
