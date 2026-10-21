# 源码审计与覆盖清单

日期2026-10-21；身份见 [源码快照](SOURCE_SNAPSHOT.json)。下列层级表示本次实际阅读/追踪深度，不表示每一分支都经运行验证。

## 分阶段清单

- [x] 确认正式目录、四个入口、脚本加载顺序。
- [x] 核对18角色注册/初始化、模式血量、11个独立奥义及团队旧三个。
- [x] 物理、时钟、伤害/防御、状态、AI与结算顺序。
- [x] 18份角色常规/觉醒/独立奥义或明确未实装、资源与手动差异。
- [x] 角色交互按条件记录，不转换成未经统计的胜率。
- [x] 表现、UI、音频、历史回看、录制布局的职责边界。
- [x] 区分旧分支、历史设计、执行事实和待验证。
- [x] 14组受控运行（含18个8秒冒烟），未扩跑平衡。
- [x] 内部链接、角色覆盖、源指纹与既有文件保护核对。

## 阅读层级与代码索引

### 入口与公共战斗主路径（逐函数规则核对）

- [config.js](../../js/config.js)
- [physics.js](../../js/physics.js)
- [skills.js](../../js/skills.js)
- [engine.js](../../js/engine.js)
- [world.js](../../js/world.js)
- [aim.js](../../js/aim.js)
- [awakening.js](../../js/awakening.js)
- [characters.js](../../js/characters.js)
- [roles.js](../../js/roles.js)
- [adaptive.js](../../js/adaptive.js)
- [flyers.js](../../js/flyers.js)
- [mines.js](../../js/mines.js)
- [pursuit.js](../../js/pursuit.js)
- [temporal.js](../../js/temporal.js)
- [arena-walls.js](../../js/arena-walls.js)

### 角色执行与新奥义主路径（逐阶段规则核对）

- [ranger.js](../../js/ranger.js)
- [boomerang-hunt.js](../../js/boomerang-hunt.js)
- [magnet.js](../../js/magnet.js)
- [ghost.js](../../js/ghost.js)
- [holy.js](../../js/holy.js)
- [demon.js](../../js/demon.js)
- [cosmic.js](../../js/cosmic.js)
- [charge.js](../../js/charge.js)
- [stellar.js](../../js/stellar.js)
- [vampire-hunt.js](../../js/vampire-hunt.js)
- [trapper.js](../../js/trapper.js)
- [laser-blade.js](../../js/laser-blade.js)
- [living-venom.js](../../js/living-venom.js)
- [venom-evolution.js](../../js/venom-evolution.js)
- [arcana.js](../../js/arcana.js)
- [arcana-priority.js](../../js/arcana-priority.js)
- [accelerator-overdrive.js](../../js/accelerator-overdrive.js)
- [arcana-vampire.js](../../js/arcana-vampire.js)
- [arcana-defense.js](../../js/arcana-defense.js)
- [arcana-ranger.js](../../js/arcana-ranger.js)
- [arcana-dance.js](../../js/arcana-dance.js)
- [arcana-venom.js](../../js/arcana-venom.js)
- [time-rewind.js](../../js/time-rewind.js)

### 团队/手动决策与状态边界（运行路径核对）

- [team-maps.js](../../js/team-maps.js)
- [team-runtime.js](../../js/team-runtime.js)
- [team-engine.js](../../js/team-engine.js)
- [team-arcana-legacy.js](../../js/team-arcana-legacy.js)
- [manual-ranger.js](../../js/manual-ranger.js)
- [manual-roles.js](../../js/manual-roles.js)
- [manual-four.js](../../js/manual-four.js)
- [manual-cues.js](../../js/manual-cues.js)
- [manual-ui.js](../../js/manual-ui.js)
- [manual-fullscreen.js](../../js/manual-fullscreen.js)
- [status-panel.js](../../js/status-panel.js)

### 表现/页面调度（接口、阶段与关键分支核对，不是逐像素/试听审查）

- [presentation.js](../../js/presentation.js)
- [renderer.js](../../js/renderer.js)
- [spectacle.js](../../js/spectacle.js)
- [audio.js](../../js/audio.js)
- [audio-mix.js](../../js/audio-mix.js)
- [arcana-audio.js](../../js/arcana-audio.js)
- [app.js](../../js/app.js)
- [team-app.js](../../js/team-app.js)
- [recording-view.js](../../js/recording-view.js)
- [animation-review.js](../../js/animation-review.js)
- [audio-audition.js](../../js/audio-audition.js)

### 专用画图/资源（加载归属、调用与阶段字段核对）

这些模块的原生加载已执行，画图由Renderer/对应View调度；本次未对每个几何点、渐变、粒子包络或音色逐项主观审查。不能据函数名评价帅/打击感，也未把art中的历史分支提升为现行技能。

- [holy-render.js](../../js/holy-render.js)
- [tactics-render.js](../../js/tactics-render.js)
- [ranger-render.js](../../js/ranger-render.js)
- [charge-render.js](../../js/charge-render.js)
- [stellar-render.js](../../js/stellar-render.js)
- [blood-blade-shape.js](../../js/blood-blade-shape.js)
- [arcana-art.js](../../js/arcana-art.js)
- [cosmic-render.js](../../js/cosmic-render.js)
- [demon-render.js](../../js/demon-render.js)
- [vampire-hunt-art.js](../../js/vampire-hunt-art.js)
- [trapper-art.js](../../js/trapper-art.js)
- [laser-blade-art.js](../../js/laser-blade-art.js)
- [time-rewind-art.js](../../js/time-rewind-art.js)
- [arcana-venom-art.js](../../js/arcana-venom-art.js)
- [accelerator-overdrive-art.js](../../js/accelerator-overdrive-art.js)
- [venom-art.js](../../js/venom-art.js)
- [boomerang-hunt-art.js](../../js/boomerang-hunt-art.js)
- [living-venom-art.js](../../js/living-venom-art.js)
- [pact-toxin-art.js](../../js/pact-toxin-art.js)
- [arcana-vampire-art.js](../../js/arcana-vampire-art.js)
- [arcana-ranger-art.js](../../js/arcana-ranger-art.js)
- [arcana-defense-art.js](../../js/arcana-defense-art.js)
- [arcana-dance-art.js](../../js/arcana-dance-art.js)
- [arcana-render.js](../../js/arcana-render.js)

## 当前入口构成

### index.html

360×340；脚本按HTML顺序，63个。完整有序数组在SOURCE_SNAPSHOT。

`config → physics → skills → world → aim → flyers → mines → pursuit → characters → roles → ranger → awakening → temporal → magnet → ghost → holy → demon → cosmic → charge → stellar → adaptive → arcana → vampire-hunt → trapper → laser-blade → presentation → engine → audio → audio-mix → spectacle → renderer → holy-render → tactics-render → ranger-render → charge-render → stellar-render → blood-blade-shape → arcana-art → cosmic-render → demon-render → vampire-hunt-art → trapper-art → laser-blade-art → arena-walls → time-rewind → time-rewind-art → arcana-venom → arcana-venom-art → accelerator-overdrive → accelerator-overdrive-art → arcana-priority → venom-art → boomerang-hunt → boomerang-hunt-art → living-venom → living-venom-art → status-panel → venom-evolution → pact-toxin-art → animation-review → app → audio-audition → recording-view`

### arcana.html

360×340；脚本按HTML顺序，72个。完整有序数组在SOURCE_SNAPSHOT。

`config → physics → skills → world → aim → flyers → mines → pursuit → characters → roles → ranger → awakening → temporal → magnet → ghost → holy → demon → cosmic → charge → stellar → adaptive → arcana → arcana-vampire → arcana-ranger → arcana-defense → vampire-hunt → trapper → laser-blade → presentation → engine → audio → audio-mix → arcana-audio → spectacle → renderer → holy-render → tactics-render → ranger-render → charge-render → stellar-render → blood-blade-shape → arcana-art → arcana-vampire-art → arcana-ranger-art → arcana-defense-art → cosmic-render → demon-render → vampire-hunt-art → trapper-art → laser-blade-art → arena-walls → time-rewind → time-rewind-art → arcana-venom → arcana-venom-art → accelerator-overdrive → accelerator-overdrive-art → arcana-priority → venom-art → arcana-dance → arcana-dance-art → boomerang-hunt → boomerang-hunt-art → living-venom → living-venom-art → status-panel → venom-evolution → pact-toxin-art → animation-review → app → audio-audition → recording-view`

### manual.html

360×340；脚本按HTML顺序，77个。完整有序数组在SOURCE_SNAPSHOT。

`config → physics → skills → world → aim → flyers → mines → pursuit → characters → roles → ranger → awakening → temporal → magnet → ghost → holy → demon → cosmic → charge → stellar → adaptive → arcana → arcana-vampire → arcana-ranger → arcana-defense → vampire-hunt → trapper → laser-blade → presentation → engine → audio → audio-mix → arcana-audio → spectacle → renderer → holy-render → tactics-render → ranger-render → charge-render → stellar-render → blood-blade-shape → arcana-art → arcana-vampire-art → arcana-ranger-art → arcana-defense-art → cosmic-render → demon-render → vampire-hunt-art → trapper-art → laser-blade-art → arena-walls → time-rewind → time-rewind-art → arcana-venom → arcana-venom-art → accelerator-overdrive → accelerator-overdrive-art → arcana-priority → venom-art → arcana-dance → arcana-dance-art → boomerang-hunt → boomerang-hunt-art → living-venom → living-venom-art → status-panel → venom-evolution → pact-toxin-art → animation-review → manual-ranger → manual-roles → manual-four → manual-cues → manual-ui → manual-fullscreen → app → audio-audition`

### team.html

640×440；脚本按HTML顺序，60个。完整有序数组在SOURCE_SNAPSHOT。

`config → team-maps → physics → skills → world → aim → flyers → mines → pursuit → characters → roles → ranger → awakening → temporal → magnet → ghost → holy → demon → cosmic → charge → stellar → adaptive → team-arcana-legacy → vampire-hunt → trapper → laser-blade → presentation → engine → audio → audio-mix → spectacle → renderer → holy-render → tactics-render → ranger-render → charge-render → stellar-render → arcana-render → cosmic-render → demon-render → team-runtime → team-engine → vampire-hunt-art → trapper-art → laser-blade-art → arena-walls → time-rewind → time-rewind-art → venom-art → boomerang-hunt → boomerang-hunt-art → living-venom → living-venom-art → status-panel → venom-evolution → pact-toxin-art → animation-review → team-app → audio-audition → recording-view`

## 已识别的历史/后置覆盖

| 位置 | 当前事实 |
| --- | --- |
| Roles.rangerUpdate/rangerHit | G.Ranger存在即委托ranger.js，函数后旧弹匣逻辑不作为当前规则 |
| Skills.boomerang/Characters接刃fallback | BladeHunt存在即新曲线/追猎/独立斩；Dance另接奥义 |
| Roles.netLinks/updateTraps | Mines存在即新网络，不用旧生成树/旧连锁fallback |
| Arcana.rush/sonic旧环行；旧blood三刃 | 正式独立页分派Overdrive/VampireArcana；Classic无actor.arcana；团队另加载legacy而非这些新实现 |
| Arcana旧bloodMist/bloodBite状态/绘制 | 新血海不进入，不代表同时拥有旧处刑 |
| Cosmic.binary/旧卫星结构 | Cosmic只调storm；orbital由Stellar注册/更新；无旧挡弹双星技能 |
| Venom.resonate/advance | resonate被活毒设无操作；advance仍可见但正式觉醒不再定时调用；不能据残余toxinBurst图层说有毒爆 |
| mirrors/reflect/intercept | 当前实际折返入口返回null，存反击弹仍有效 |
| js/blade-audio*.js | 四正式HTML均未加载，实验音频数据不作为正式依赖 |
| tests、历史结果、docs/design/experiments | 用于研究工具或历史意图，不是现行战斗调度，也不当本次新测试证据 |

## 文档与非运行文件边界

README与原设计入口/音频规范用于验证方式、设计意图和工作约束；本库机制结论来自上述执行模块。大量历史截图、素材、实验JSON、工作脚本没有逐件人工重审，这些不进入四正式战斗主路径。未检视全部截图/音频质量不等于遗漏一种正式角色；如未来启用这些文件，需要重新确认入口和版本。

## 运行证据

[audit-probes.cjs](audit-probes.cjs)按HTML原顺序加载原生JS，在无DOM夹具中跳过页面初始化/采集UI，保留战斗与角色包装。14组全通过，详见[AUDIT_RESULTS.json](AUDIT_RESULTS.json)。实际覆盖是初始化、关键防御/资源边界与短样本，不声称完整技能阶段/跨浏览器/视听验收。原有历史专项未重跑，避免它们写既有结果或附带大批平衡对局。

## 修改范围核对

修改前后对1129个既有非Git文件逐个SHA-256比对：**0个变化、0个本目录外新增**。88个入口/脚本相对SOURCE_SNAPSHOT均未变。27份Markdown的内部相对链接均存在，18角色文件与运行注册表一一对应。见[保护核对记录](INTEGRITY.json)。Git原本存在的改动及未跟踪生产模块没有被覆盖或提交。

## 源文件哈希

以下88个文件为分析快照；对比代码变化时用JSON中的完整值。

| 文件 | SHA-256 |
| --- | --- |
| [arcana.html](../../arcana.html) | `1d7d259394c2435672b7e19d2879cbde55550fb38e4cc1fdff9267d45b11835f` |
| [index.html](../../index.html) | `dbe061d544d7e846ea7ba534183cea8472f0d11fc9facc4de8d4981dea7c4abe` |
| [js/accelerator-overdrive-art.js](../../js/accelerator-overdrive-art.js) | `a962b4f0659ed634346af92acc1ad229045c73607f22e9efe0e8a603a0a50630` |
| [js/accelerator-overdrive.js](../../js/accelerator-overdrive.js) | `b4d76bcc2cfd1f211b80cf78e72322d807d543b7ef60486cc7fede92019d7706` |
| [js/adaptive.js](../../js/adaptive.js) | `e6912f54882a5f024b0e7f193e7bed9b7c39ebc09d701d90248ece037a3060c9` |
| [js/aim.js](../../js/aim.js) | `ab5e2bf97f186f0aacdd817fd96045d7fa178c37527e2d9d6a7c75d85a0ef20d` |
| [js/animation-review.js](../../js/animation-review.js) | `02b38ab37de1751798ff6ca36ec640398587eb58f90c26b30720bcbd78418724` |
| [js/app.js](../../js/app.js) | `6c65fc1e3de360f594706dc35649482b0e7b07e86729b60f1f8bd576f2ce9c24` |
| [js/arcana-art.js](../../js/arcana-art.js) | `6022ff55da485ffda2573b4b303d615b1bb21ae05db4a14feaf1ab06b7a2e36c` |
| [js/arcana-audio.js](../../js/arcana-audio.js) | `180798e8d35157fb51f23bde356c1523959d826ac35b1e593e051b7a3bdb1711` |
| [js/arcana-dance-art.js](../../js/arcana-dance-art.js) | `cce50d9ef49615495a0a10f38e8782eda985f84da47f8579817a6d552f3bda98` |
| [js/arcana-dance.js](../../js/arcana-dance.js) | `0779bcdefbf84182fac587b05ad056de14c5c2993953f9ad913e4b2c21fb86a1` |
| [js/arcana-defense-art.js](../../js/arcana-defense-art.js) | `3257512a566580e7926f860210d2b7f68956c7ae22e9af3f5151fecb7c38c877` |
| [js/arcana-defense.js](../../js/arcana-defense.js) | `891e7bca4b6b210dcc2ba7cc420083ea6bea1019a6148185eca8d07e67995e6d` |
| [js/arcana-priority.js](../../js/arcana-priority.js) | `78d04e5c62f554b5a11cb6e649f8c6f6edc3ae88aaf946f13d8bc517b0e4790f` |
| [js/arcana-ranger-art.js](../../js/arcana-ranger-art.js) | `ace9951c96a0100bf14b114fa11c5f70069fcd180aed455e8a7aca0c9b1697fa` |
| [js/arcana-ranger.js](../../js/arcana-ranger.js) | `3f74306e9c8e5e81cfc08d396a1f7b5c4d49dadab5b88a7f6ecf93a64b3567d6` |
| [js/arcana-render.js](../../js/arcana-render.js) | `923fbbf1c33e0a9463fb85b03786a4d4f86192eefdda4036521c86d7e64d8115` |
| [js/arcana-vampire-art.js](../../js/arcana-vampire-art.js) | `073e40c2c231353a5d638259b330225434245b4f6e6586fcc24c6ac3ad831feb` |
| [js/arcana-vampire.js](../../js/arcana-vampire.js) | `2f5cbe9b237ca01ce95987cc424a590b32e2ac3f03b3d33954fff1c92314894e` |
| [js/arcana-venom-art.js](../../js/arcana-venom-art.js) | `14b0c93e7f08601f311e888944bbc70004b3ac0c373a947e9fdbe338c811acac` |
| [js/arcana-venom.js](../../js/arcana-venom.js) | `07b8b6aa4bc71b3302759c3e8434377b01c319f99c2abb2008e1b307318f4148` |
| [js/arcana.js](../../js/arcana.js) | `a5ae5c8da48f377e52b95b214120e3086d142ea2500d671e0140d4ed5fb3ff71` |
| [js/arena-walls.js](../../js/arena-walls.js) | `cea655cea2899c1eafe13b2443ae0e53a9102edad5282e4967e286279d0ab0bd` |
| [js/audio-audition.js](../../js/audio-audition.js) | `e454732feb6029186c3e47c98a52cdf19af260efd409d54498648cb42ac5c5ee` |
| [js/audio-mix.js](../../js/audio-mix.js) | `8347767b67c3b6a4777dcdae31d4688d0172fa12bbf331ac7e96154dd4eab0b4` |
| [js/audio.js](../../js/audio.js) | `ce8fcc3bf1ca21c332fdfbe83975851f9d6fa020bdc25a2781ee6ed8ab841310` |
| [js/awakening.js](../../js/awakening.js) | `cdd3a60fa6ea82d2768d58f1360c8c540b5a3d13ca3a05ec528ad0eabf879e53` |
| [js/blood-blade-shape.js](../../js/blood-blade-shape.js) | `e6c015705beb161cc07c7f59bd5971adcbe8cffccf972c924c2fd499c5aae8e0` |
| [js/boomerang-hunt-art.js](../../js/boomerang-hunt-art.js) | `37fadf640b88583d3260ea9171003b76987afd0046d7b5be01bfcb4ddb1e2718` |
| [js/boomerang-hunt.js](../../js/boomerang-hunt.js) | `48c8a846edfc4eff19d126ee90d2cdfacd5dcbe1e975d519da15cf65e39fdd90` |
| [js/characters.js](../../js/characters.js) | `79b35897b91e606c24bc2e76512d56b9e5e9b65c3077e889c02492cf3e8cb09f` |
| [js/charge-render.js](../../js/charge-render.js) | `e69a4afa910cb5a3d99ee3afa632f2cbf305c3b3cb8ec2713a267dabcb2b3586` |
| [js/charge.js](../../js/charge.js) | `28fd3504e65becf1b247666df3790bf9aa152e8831c3ae8f412c45bdeb066b25` |
| [js/config.js](../../js/config.js) | `6b17245d9e558d0038ce2bede8e68299dfa18ef6ca261228e064ca198b5e43f8` |
| [js/cosmic-render.js](../../js/cosmic-render.js) | `7bfb2f0bc348cda70e301ebc8376fd11b534fc2aa502db19965572b2575f180d` |
| [js/cosmic.js](../../js/cosmic.js) | `b6ddb2df7d8bb81ecd3a748fc0d6ea2b789a4cbfc4e43d92d55528d9581597ef` |
| [js/demon-render.js](../../js/demon-render.js) | `4b1add3455f3159d6dc0fb2854ee16c1eeed6925c38b8d67661f809ef74b88c1` |
| [js/demon.js](../../js/demon.js) | `40746bfdd83d0d966aab039bdbfc032e8fdde5d7ccca824e156ee671a37c8290` |
| [js/engine.js](../../js/engine.js) | `c37cd06833318cc6eb94379b839dccda83bfa1c072d06fbe59fc4d2c22aa2316` |
| [js/flyers.js](../../js/flyers.js) | `530e62ca565db1145a1b93242a54a4f6727b967f6f58b87d78277c41fda26b8e` |
| [js/ghost.js](../../js/ghost.js) | `15f960b3ccfd3b0dceb94d9c9d98deb91a5290871dd1fdc85ef5dc95e71e9455` |
| [js/holy-render.js](../../js/holy-render.js) | `1a86d77c9b6cce6d530089d679a468f4fe3d69756d5dffb5a4c00b768cab9311` |
| [js/holy.js](../../js/holy.js) | `0254cc21c5c117241ff60207c407d2c5f34bc7f0ea66ef351569fbe99d690a92` |
| [js/laser-blade-art.js](../../js/laser-blade-art.js) | `af3f0023c34ac451a76a375e207881d40a7faf1c1cc44a200b58cb4d4c8f3bec` |
| [js/laser-blade.js](../../js/laser-blade.js) | `f5b47985f61a8c3a63a77d1719f5b042421b1c5f77fc07a663137748bbcec655` |
| [js/living-venom-art.js](../../js/living-venom-art.js) | `043df8f95b427ea978a2a1becae7785ad4754c6c3179aa6f7183d7b10062fb76` |
| [js/living-venom.js](../../js/living-venom.js) | `fd699441777ac7a0055227c88d66dfa48d468e5afbfcdd1ca3c7719bd9d13204` |
| [js/magnet.js](../../js/magnet.js) | `886104c5353ee9820d0d909712178c33f0ec955325e748f85c915624245b3ff6` |
| [js/manual-cues.js](../../js/manual-cues.js) | `574025bb8d960d382d876bedd12c654cf453bcd13ff348ae5ba9114dda12634d` |
| [js/manual-four.js](../../js/manual-four.js) | `79d5779fdd04f3e24b5fac2ede731a0090e8193664a38ff3241e423337f2b7a9` |
| [js/manual-fullscreen.js](../../js/manual-fullscreen.js) | `24c0aae00e9c400bdb8bfcab55329212b269ae741949d4c025a5539c0ba347f2` |
| [js/manual-ranger.js](../../js/manual-ranger.js) | `f45ba215f0279fbf5376e23141ed1f0da6e97a3c2838e3a801cbf4120ab295d3` |
| [js/manual-roles.js](../../js/manual-roles.js) | `222bd0aae66afef4487a7bdfc303611199fc972054f32df260d283db7226193f` |
| [js/manual-ui.js](../../js/manual-ui.js) | `5bc703186ae454a52f97b56cdc4dc85ddaf8ad5303ba881f9de5e49f4f3e2d1a` |
| [js/mines.js](../../js/mines.js) | `2f3f7d8a578a35b34154dfdea91ac867247d7c3c5144be2e1b91efa5fc918cc4` |
| [js/pact-toxin-art.js](../../js/pact-toxin-art.js) | `bf10f410d65b74152d1c48dcd402e843a49ff9b36ec4a8579236e455f2977268` |
| [js/physics.js](../../js/physics.js) | `cbd75beb4579cd8c731987ecc10490f283f3b5684d654547a51bab8f1bd2335b` |
| [js/presentation.js](../../js/presentation.js) | `48d8218cd8a6ffcb994d8eb60fdc57fd44dfad5196306158369a0336b1bba097` |
| [js/pursuit.js](../../js/pursuit.js) | `afd0d8574ca104151f99beb728b9ede99f93bc425da5b07d218ea9170adea9f4` |
| [js/ranger-render.js](../../js/ranger-render.js) | `eb34e84aaabb05e61e7b2a74eb020176db6f26bf0d3b7b6a19b08833b1a922db` |
| [js/ranger.js](../../js/ranger.js) | `bb166817ee4cb85be09a38a67fe33e2b322c978cc625b11d4f2a52ef6b885c6e` |
| [js/recording-view.js](../../js/recording-view.js) | `e1f43e994face6831fd539a9bbcfe0e79887ff1690780eb0095f29d2ebc65889` |
| [js/renderer.js](../../js/renderer.js) | `032e5e86e590aecd4550d0d1ef2664b20663fb997c8d4196afc75c53f6c2c1af` |
| [js/roles.js](../../js/roles.js) | `5574e19701d467a3faf113c5d51e877e69eea16b28761e2c44dd4df6258366ca` |
| [js/skills.js](../../js/skills.js) | `290d4474d285f3e029ec0763eced95329f7a09db15580f2467a08aa41d0ffd32` |
| [js/spectacle.js](../../js/spectacle.js) | `92c03780cad0aadd28f053ac1edc6b5f30634474a3440cb3198ce0fedce4f328` |
| [js/status-panel.js](../../js/status-panel.js) | `d55277e1a693f82d42fb7f8af25ad83eb772f6383b74d69a6effbe10520d106f` |
| [js/stellar-render.js](../../js/stellar-render.js) | `ff4ea53ed3b47d5f83bfda7ff901162ed7d6cb4031f85542a175f5c2094b0700` |
| [js/stellar.js](../../js/stellar.js) | `44d08dddd4649346160a24f5a4a560aadf2f1b6d97f50d9354d3ead9ae90b71a` |
| [js/tactics-render.js](../../js/tactics-render.js) | `ea8f548f0c72c3206392c20f3c8954c567753924782541755184fa799d8c8a1a` |
| [js/team-app.js](../../js/team-app.js) | `a2a746f23393a6b06a0ed84ae8ba2e5e2280c50c525bd7f7981feff392536801` |
| [js/team-arcana-legacy.js](../../js/team-arcana-legacy.js) | `034c753d3b650a0dd846df53a6e297b63ffe5f37a43c50d52a82eea9e67d8c0f` |
| [js/team-engine.js](../../js/team-engine.js) | `92f4a9d2a2866daab3964c25717b9146b664cd301a2742dfc92b86a18ac70752` |
| [js/team-maps.js](../../js/team-maps.js) | `b1ed00ee3d727e23ac1b767e7b57f0f3324361e2896e27ce2021de51883c5604` |
| [js/team-runtime.js](../../js/team-runtime.js) | `82fc212224aede6f83b4862e90171f4abbbd3b68960e8f202f9bb6c5cd64cbb1` |
| [js/temporal.js](../../js/temporal.js) | `f83d99802a62ed51644bbba2d0563176cf92af697badc2866ace20877bfd2221` |
| [js/time-rewind-art.js](../../js/time-rewind-art.js) | `31b6ba6fff7fd1f99bec145de9410981ea400db22dfb8c72cb1b7a013e6cee47` |
| [js/time-rewind.js](../../js/time-rewind.js) | `4fe57bfd41259ab0f8e29229710aa4a0a3b8f7bb692c0539ab5350e7bd82dd6e` |
| [js/trapper-art.js](../../js/trapper-art.js) | `11074cb2590ae9f2c5ba11aace3755d2b60f5314c818f2877bd8ff4afc8d4a93` |
| [js/trapper.js](../../js/trapper.js) | `2ff098e292680b6f4a8f752ebbfa7692d6d16c9a19ca186964c19c240b99195e` |
| [js/vampire-hunt-art.js](../../js/vampire-hunt-art.js) | `cc8a43fc3d57e1cd52f6c401d4c700d732e0946e12610af774ff420b1d078ee9` |
| [js/vampire-hunt.js](../../js/vampire-hunt.js) | `d5c97bdc3e1679be9eafc9d60c22597150e96bb5719ab8c634f101e742f0ed0a` |
| [js/venom-art.js](../../js/venom-art.js) | `415209c9984b8382947c281c337e0b69a2c95db13c67d43068f9d1bc726846f6` |
| [js/venom-evolution.js](../../js/venom-evolution.js) | `303e2e07f06a9d2cf830f4ed4d3532cc8d69d9b07c0fec49af046c80e1fd9987` |
| [js/world.js](../../js/world.js) | `ea96fbabb4e88ec579ecae338069efa5070bf8698c3347152b2e58ed6019dcb4` |
| [manual.html](../../manual.html) | `14f9dc34f30aac94923c15fdcc5fcf7f4526230ca0eb0ba1aacfaa0e46a05854` |
| [team.html](../../team.html) | `7fc736c13e3e10b93b23f8a29f809c9ff263055a2cebbaf18e2dc02b1a61caea` |
