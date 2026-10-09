# 《开本》— 剧本杀店主危机处理模拟器（可玩原型）

一个**事件驱动**的经营 roguelike。玩家在北京开剧本杀店，核心乐趣不在经营流程，而在**每天处理店里冒出来的瓜**：黄牛抢车、演员谈恋爱、玩家挂差评、友商挖人、舆情上小红书……读懂局势 → 权衡 → 处理 → 承担连锁后果。

> 当前是验证“处理事件核心循环爽不爽”的原型。美术从简，朴素卡片式 UI（参考 Reigns / 中国式家长）。

## 试玩 / 跑起来

**最省事**：直接打开仓库里的 `juben-tycoon/play.html`（单文件、JS/CSS 全内联，双击用浏览器打开即玩，零安装零联网）。

开发模式：

```bash
cd juben-tycoon
npm install
npm run dev               # http://localhost:5174
npm run build             # 产物到 dist/（GitHub Pages 子路径）
npm run build:standalone  # 产物到 standalone/index.html（单文件离线版，即 play.html 的来源）
```

> 线上 URL：仓库已配好 `.github/workflows/pages.yml`，会把游戏发布到
> `https://<用户名>.github.io/lightwheel-leads/juben-tycoon/`。但**私有仓库的 GitHub Pages 需要先在
> Settings → Pages 把 Source 设为“GitHub Actions”**（私有库还可能需要付费套餐），否则工作流会在
> Configure Pages 步骤报 `Resource not accessible by integration`。启用后重跑工作流即可上线。

## v2：仪表盘 UI + 个性化

- **仪表盘布局**：顶部带 sparkline 的资源条（现金/口碑/内容热度·万 + 日变化）、左侧店铺面板（店铺信息/演员团队/当前剧本/延迟事件队列）、中间店铺实景 + 事件卡（风险等级/事件来源/影响范围）、右侧实时舆情流（点评/微信群/小红书分流 + 只看负面）、底部四维行动卡（现金/口碑/演员关系/老客关系 + 二次发酵概率 + 行动力）。
- **个性化**：开店先选 **店名 + 主题**（民国/都市/恐怖/武侠/欢乐，决定实景配色与剧本亲和）和 **招牌玩法身份**（机关实景/NPC沉浸/恐怖惊吓/硬核推理/欢乐社交，给被动数值加成、改变负面事件频率、决定客群与解锁专属事件）。配置见 `data/themes.ts`。
- **店铺实景**：`SceneView` 用 CSS 渲染门头与房间，灯光/辉光随主题、沉浸感、时段变化。
- **主动运营**：每天有限“行动力”，可主动出招（私域造势/团队建设/上新本/装修升级），不只是被动接事件。
- **舆情流**：`engine/feed.ts` 按口碑 + 最近选择的基调生成社媒动态，纯展示让面板“活”起来。

## 核心设计

- **三资源拉扯**：现金流（归零=破产）/ 口碑（获客飞轮）/ 内容热度（剧本会过气，逼上新本）。
- **时间**：以“天”为 tick，每 7 天周结固定成本（租金 + 演员底薪/分红）。这个剪刀差一旦失控就破产。
- **关系网络**：演员是**个体 NPC**（有名字/属性/关系/士气，瓜事件能指名道姓），老客是**聚合客群**（规模 + 忠诚）。
- **失败=经验**：破产后沉淀口碑遗产/经验/人脉，下次开店有加成（meta 成长）。

## 代码结构（逻辑与内容分离）

```
src/
  types/index.ts          # 全部数据契约（事件/演员/剧本/地段/条件/效果）—— 先读这个
  data/
    locations.ts          # 地段、装修方案
    actors.ts             # 演员招募池
    scripts.ts            # 首发剧本
    events/               # ★ 事件库（按分类拆文件）
      customer / actor / channel / industry / gossip .ts
      index.ts            # 聚合 + 启动校验
  engine/                 # 纯逻辑，内容无关
    conditions.ts         # 条件 DSL 求值 + 派生 flags
    effects.ts            # 选项效果应用（改三资源/关系/flags）
    eventEngine.ts        # 加权随机池 + 条件门控 + 强制队列 + 连锁
    economy.ts            # 日经营结算 / 周固定成本 / 破产判定
    negotiation.ts        # 砍价机制（房东隐藏底价、多轮还价、压太狠埋雷）
    selectors.ts          # 衍生值统一出口
  store/gameStore.ts      # Zustand：单一状态源 + 所有动作
  components/             # 卡片式 UI
```

## 事件触发机制

每个 tick（天）选事件的优先级：

1. **强制队列**：连锁排进来、到点必触发的事件（`forcedQueue`，支持延迟 N 天）。
2. **加权随机池**：按 `trigger.conditions` 门控过滤，再按 `trigger.weight` 加权随机抽。
3. **平和日**：没合适事件 / 随机喘息 → 当天无事。

**连锁**：选项的 `chains: [{ eventId, probability, delayDays }]`，命中后按概率把后续事件排进强制队列。
招牌连锁示例（在 `events/customer.ts` + `gossip.ts`）：
`差评 → 公开回怼 → 发酵上小红书 → 硬刚 → 口碑暴跌 → 老客流失`。

## 怎么往里加事件（你后续从小红书扒案例填这里）

在 `src/data/events/<分类>.ts` 里 push 一个对象即可，引擎自动接住：

```ts
{
  id: 'gossip_xxx',                 // 唯一
  category: 'gossip',
  title: '标题',
  speaker: '小红书·万赞笔记',         // 可选，事件来源
  description: '情景描述（要有行业真实/狗血/有点好笑的味道）',
  trigger: {
    weight: 6,                      // 进随机池的权重；0 + chainedOnly 表示只被连锁触发
    conditions: [                   // AND；不满足不进池
      { kind: 'resource', key: 'reputation', op: '<', value: 40 },
      { kind: 'hasActorTag', tag: '台柱' },
    ],
    minDay: 8,
    cooldownDays: 10,               // 触发后冷却；once:true 表示终生一次
  },
  options: [
    {
      label: '道歉补偿',
      requires: [ /* 选项可见性条件，同 conditions */ ],
      effects: {                    // 对世界的影响
        cash: -2000, reputation: 5, customerLoyalty: 4,
        actor: { target: { select: 'byTag', tag: '台柱' }, relationship: 8 },
        setFlags: { prCrisis: false },
      },
      resultText: '选后反馈文案，让玩家看到选择的重量。',
      chains: [{ eventId: 'gossip_followup', probability: 0.6, delayDays: 3 }],
    },
    // 2~4 个选项
  ],
}
```

- 支持的**条件**类型见 `types/index.ts` 的 `Condition`；**效果**见 `Effect`。
- 连锁引用的 `eventId` 必须存在——启动时 `validateEventLibrary()` 会在 console 报错。
- 派生 flags（无需手动设）：`someActorAngry` / `hasUnstableActor` / `hasOriginalScript`。

## 当前是占位、可后续做深的支撑系统

排班（演员×房间×剧本）、私域/公域渠道运营的细颗粒、装修风格与剧本匹配度、更丰富的 meta 解锁树——原型阶段先用简化数值占位，重心放在事件循环。
