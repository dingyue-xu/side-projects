// ============================================================================
// 核心类型定义 —— 逻辑与内容分离的「契约」
// 事件库 / 演员 / 剧本 / 地段 都按这里的结构走数据驱动配置。
// 后续往事件库塞小红书案例时，只要符合 GameEvent 结构即可，无需改引擎。
// ============================================================================

// ----------------------------------------------------------------------------
// 三大核心资源 + 衍生店铺状态
// ----------------------------------------------------------------------------

/** 三大核心资源。内容热度(contentHeat)是衍生值，由 owned scripts 的热度聚合而来。 */
export interface Resources {
  /** 现金流。归零 = 破产闭店。 */
  cash: number
  /** 口碑 0~100。获客命根子。 */
  reputation: number
}

/** 演员个体（个体 NPC，瓜事件可以指名道姓） */
export interface Actor {
  id: string
  name: string
  avatar: string // emoji 占位
  // 属性
  acting: number // 演技 0~100
  fame: number // 人气 0~100
  stability: number // 稳定性 0~100（越低越容易迟到/罢演/被挖）
  salaryExpect: number // 期望周薪基准
  // 雇佣后状态
  salaryStructure?: SalaryStructure
  /** 与店主的关系 0~100。低了会闹掰/跳槽。 */
  relationship: number
  /** 当前心气/士气 0~100 */
  morale: number
  /** 角色标签，给事件做触发条件和文案用，如 ['恋爱脑','台柱'] */
  tags: string[]
  hired: boolean
}

/** 演员薪资结构 —— 核心决策 */
export type SalaryStructure =
  | { type: 'base'; weekly: number } // 高底薪：稳但现金压力大
  | { type: 'commission'; weekly: number; perSession: number } // 高提成：旺季爽淡季留不住
  | { type: 'profitShare'; weekly: number; sharePct: number } // 分红：绑定但稀释利润

/** 拥有的剧本 */
export interface OwnedScript {
  id: string
  name: string
  genre: string // 情感本/恐怖本/硬核推理/欢乐本…
  quality: number // 剧本质量 0~100
  /** 当前热度 0~100，随时间衰减，逼玩家上新本 */
  heat: number
  original: boolean // 是否原创本（行业类事件：抄袭/盗版会盯上原创本）
  acquiredDay: number
}

/** 聚合客群（不做个体老客，用群体数值表达） */
export interface CustomerBase {
  size: number // 私域/老客规模（人）
  loyalty: number // 客群好感/忠诚 0~100
}

/** 渠道状态 */
export interface Channels {
  dianpingOn: boolean // 大众点评（公域，曝光大、抽佣、要应对差评和黄牛）
  dianpingRating: number // 点评评分 0~5
  privateDomainLevel: number // 微信私域运营等级 0~5（复购高、获客慢）
}

/** 地段 / 选址 */
export interface Location {
  id: string
  name: string
  district: string
  exposure: number // 曝光/客流基数倍率
  rentRange: [number, number] // 周租金区间（用于砍价）
  /** 房东心理底价（隐藏，砍价机制用） */
  rentReserve: number
  privateBonus: number // 私域获客加成倍率
  style: string // 风格基调，影响装修匹配
  capacityRooms: number // 房间数 → 排场容量
  desc: string
}

/** 装修方案 */
export interface DecorPlan {
  id: string
  name: string
  cost: number
  immersion: number // 带来的沉浸感数值
  desc: string
}

/** 定价 / 排场 */
export interface Pricing {
  weekday: number // 工作日每人价
  weekend: number // 周末每人价
}

// ----------------------------------------------------------------------------
// 个性化：店铺主题 + 招牌玩法身份（roguelike 身份感）
// ----------------------------------------------------------------------------

/** 店铺主题：决定实景配色基调 + 剧本风格亲和 + 文案口味 */
export interface StoreTheme {
  id: string
  name: string
  emoji: string
  /** 实景主色（CSS 用） */
  palette: { bg: string; glow: string; accent: string }
  /** 与该 genre 的剧本匹配，沉浸感加成 */
  genreAffinity: string
  desc: string
}

/** 招牌玩法身份的被动修正（经济/事件读取） */
export interface SignatureModifiers {
  demandMult: number // 上座需求倍率
  heatDecayMult: number // 剧本热度衰减倍率（<1 更耐玩）
  immersionFromDecorMult: number // 装修转沉浸感倍率
  privateMult: number // 私域获客倍率
  repCeiling: number // 口碑天花板（软上限，超过增长减半）
  riskMult: number // 负面事件权重倍率
  buzzMult: number // 声量产出倍率
}

/** 招牌玩法身份：机关实景 / NPC沉浸 / 恐怖惊吓 / 硬核推理 / 欢乐社交 */
export interface SignaturePlay {
  id: string
  name: string
  emoji: string
  tagline: string
  desc: string
  /** 客群偏好标签（flavor + 舆情口味） */
  audience: string
  modifiers: SignatureModifiers
  pros: string
  cons: string
}

// ----------------------------------------------------------------------------
// 舆情流 / 历史曲线（仪表盘 UI）
// ----------------------------------------------------------------------------

export type FeedTone = 'pos' | 'neu' | 'neg'

export interface FeedItem {
  id: string
  source: EventSource
  tone: FeedTone
  day: number
  /** 显示用的相对时间，如「28分钟前」 */
  ago: string
  who: string
  text: string
  likes: number
  comments: number
}

/** 近 N 日资源快照，画 sparkline 用 */
export interface HistoryPoint {
  day: number
  cash: number
  reputation: number
  buzz: number
}

// ----------------------------------------------------------------------------
// NPC 库 + 形象 + 交互对话
// ----------------------------------------------------------------------------

export type NpcRole =
  | 'actor' // 演员
  | 'regular' // 常客
  | 'rival' // 友商
  | 'scalper' // 黄牛
  | 'influencer' // 探店达人
  | 'landlord' // 房东
  | 'critic' // 差评人/水军
  | 'staff' // 店务/前台

/** 表情：驱动头像神态 */
export type Mood = 'neutral' | 'happy' | 'angry' | 'sad' | 'smug' | 'cry' | 'shy' | 'shock'

/** NPC 图鉴条目（具体形象） */
export interface NPC {
  id: string
  name: string
  role: NpcRole
  emoji: string // 形象主体
  color: string // 头像底色
  title: string // 短标签，如「望京头号黄牛」
  bio: string
  traits: string[]
}

/** 一句交互对话（带形象 + 神态） */
export interface DialogueLine {
  /** 说话者 NPC id；'self' = 店主自己；'narrator' = 旁白 */
  npcId: string
  text: string
  mood?: Mood
}

/** 结算动画用：一次选择造成的指标增减 */
export interface ResolutionDelta {
  cash: number
  reputation: number
  actorRel: number
  customerLoyalty: number
  buzz: number
  /** 预估营业额影响（由口碑/客群推导，给玩家直观感受） */
  revenue: number
}

// ----------------------------------------------------------------------------
// 条件 DSL —— 事件触发门控 / 选项可见性
// 数组语义为 AND；引擎里 evaluateConditions() 求值。
// ----------------------------------------------------------------------------

export type CompareOp = '<' | '<=' | '==' | '!=' | '>=' | '>'

export type Condition =
  | { kind: 'resource'; key: 'cash' | 'reputation' | 'contentHeat' | 'immersion'; op: CompareOp; value: number }
  | { kind: 'flag'; key: string; op: CompareOp; value: number | boolean }
  | { kind: 'day'; op: CompareOp; value: number }
  | { kind: 'hasActorTag'; tag: string } // 在职演员里有人带某 tag
  | { kind: 'customer'; key: 'size' | 'loyalty'; op: CompareOp; value: number }
  | { kind: 'channel'; key: 'dianpingOn'; value: boolean }
  | { kind: 'signature'; id: string } // 招牌玩法身份为某流派

// ----------------------------------------------------------------------------
// 效果 —— 选项对世界的影响
// ----------------------------------------------------------------------------

/** 演员关系/士气的作用目标 */
export type ActorTarget =
  | { select: 'random' }
  | { select: 'lowestRelationship' }
  | { select: 'lowestStability' }
  | { select: 'byTag'; tag: string }
  | { select: 'id'; id: string }

export interface Effect {
  // —— 三资源 / 店铺数值 ——
  cash?: number
  reputation?: number
  immersion?: number
  /** 给所有在售剧本的热度加减（>0 蹭热度，<0 过气加速） */
  contentHeatAll?: number
  /** 给主打剧本（热度最高那本）单独加减 */
  contentHeatTop?: number
  /** 社媒声量（内容热度，单位：阅读量/赞）增减，用于 HUD 大数显示 */
  buzz?: number

  // —— 关系 ——
  customerLoyalty?: number // 聚合客群好感
  customerSize?: number // 客群规模（老客流失/裂变）
  actor?: { target: ActorTarget; relationship?: number; morale?: number; stability?: number }

  // —— 状态机 flags（事件条件 / 连锁判断都读它） ——
  setFlags?: Record<string, number | boolean>
  /** 数值 flag 自增，如 incFlags: { badReviewCount: 1 } */
  incFlags?: Record<string, number>
}

/** 连锁：触发后续事件 */
export interface ChainSpec {
  eventId: string
  probability: number // 0~1
  /** 延迟多少天后进入强制队列。0/省略 = 下一个可触发的 tick */
  delayDays?: number
}

// ----------------------------------------------------------------------------
// 事件
// ----------------------------------------------------------------------------

export type EventCategory =
  | 'customer' // 顾客类
  | 'actor' // 演员类
  | 'channel' // 渠道类
  | 'industry' // 行业类
  | 'gossip' // 突发瓜类（舆情/危机公关）—— 灵魂

/** 事件来源渠道（UI 显示「事件来源」图标） */
export type EventSource = 'dianping' | 'wechat' | 'xhs' | 'onsite' | 'industry'
/** 影响范围（UI 显示「影响范围」） */
export type ImpactScope = 'regulars' | 'actors' | 'potential'
/** 风险等级（UI 显示「高/中/低风险」） */
export type RiskLevel = 'high' | 'mid' | 'low'

export interface EventOption {
  label: string
  /** 选项可见/可选的条件（如「借势营销」需要私域等级≥2） */
  requires?: Condition[]
  /** 选不了时给的灰显理由 */
  lockedHint?: string
  effects: Effect
  /** 选后反馈文案（让玩家看到选择的重量） */
  resultText: string
  /** 选后 NPC 的一句口头反应（带形象+神态），增强交互 */
  reply?: DialogueLine
  /** 连锁后续事件 */
  chains?: ChainSpec[]
}

export interface GameEvent {
  id: string
  category: EventCategory
  title: string
  /** 说话人/事件来源，如「差评玩家」「台柱演员·小鹿」「友商·谜雾馆」 */
  speaker?: string
  /** 情景描述。要有行业真实/狗血/有点好笑的味道。 */
  description: string
  /** 事件主角 NPC id（卡片右上展示形象，无则用 speaker 文案） */
  anchorNpc?: string
  /** 详细交互对话：进入选项前先演一段带形象的对话（可选，无则直接给选项） */
  dialogue?: DialogueLine[]
  /** 风险等级（UI 用；省略则按 category 推断） */
  risk?: RiskLevel
  /** 事件来源渠道（UI「事件来源」；省略则按 category 推断） */
  sources?: EventSource[]
  /** 影响范围（UI「影响范围」；省略则按 category 推断） */
  impact?: ImpactScope[]
  // —— 触发控制 ——
  trigger: {
    /** 基础权重，进随机池用 */
    weight: number
    /** 门控条件（AND）。不满足则不进池。 */
    conditions?: Condition[]
    minDay?: number
    /** 只触发一次 */
    once?: boolean
    /** 冷却天数：触发后多少天内不再进池 */
    cooldownDays?: number
    /** 仅能被连锁强制触发，不进随机池 */
    chainedOnly?: boolean
  }
  options: EventOption[]
}

// ----------------------------------------------------------------------------
// 运行时：队列 / 日志 / 全局状态
// ----------------------------------------------------------------------------

/** 强制队列项：连锁排进来的、到点必触发的事件 */
export interface QueuedEvent {
  eventId: string
  /** 第几天到点 */
  dueDay: number
}

export interface LogEntry {
  day: number
  text: string
  tone: 'good' | 'bad' | 'neutral' | 'money'
}

export type GamePhase =
  | 'title' // 标题
  | 'setup' // 开店流程（选址/砍价/装修/招人/出本定价）
  | 'running' // 运营中
  | 'event' // 正在处理一张事件卡
  | 'weekly' // 周结算面板
  | 'gameover' // 破产闭店 → meta 结算

export interface ShopState {
  name: string
  location: Location | null
  theme: StoreTheme | null
  signature: SignaturePlay | null
  rentPerWeek: number
  immersion: number
  pricing: Pricing
  scripts: OwnedScript[]
  channels: Channels
}

/** meta（roguelike 跨周目）成长 */
export interface MetaProgress {
  runs: number
  legacyReputation: number // 口碑遗产 → 下次开局口碑加成
  experience: number // 经验 → 解锁/数值加成
  contacts: number // 人脉 → 砍价/招人更有利
  bestDays: number // 最长存活天数
  // —— 里程碑式结算 ——
  bestScore: number // 历史最高分
  totalDaysAll: number // 累计经营天数
  totalRevenueAll: number // 累计营收
  unlockedMilestones: string[] // 已解锁里程碑 id
}

/** 里程碑：跨周目积累解锁，给「越玩越有奔头」的长期目标 */
export interface Milestone {
  id: string
  emoji: string
  name: string
  desc: string
}

export interface GameState {
  phase: GamePhase
  day: number
  week: number
  resources: Resources
  shop: ShopState
  actors: Actor[] // 在职 + 招募池（用 hired 区分）
  customers: CustomerBase
  meta: MetaProgress

  // 事件引擎运行时
  forcedQueue: QueuedEvent[]
  flags: Record<string, number | boolean>
  /** 事件触发记录：eventId -> 最近触发的 day（冷却 / once 用） */
  firedAt: Record<string, number>
  currentEventId: string | null
  /** 刚选完选项后展示的反馈文案 + NPC 反应 */
  lastResult: { text: string; option: string; reply?: DialogueLine } | null
  /** 最近一次选择造成的指标增减（驱动结算动画） */
  lastDeltas: ResolutionDelta | null
  /** 本周目统计（榜单/结算用） */
  stats: { peakReputation: number; totalRevenue: number }
  /** 闭店结算摘要（gameover 时填） */
  runSummary: RunSummary | null

  /** 本周累计营收（周结算时清零） */
  weekRevenueAcc: number

  // —— 仪表盘新增 ——
  /** 社媒声量（内容热度，HUD 显示为「万」） */
  buzz: number
  /** 行动力：每天回满，主动运营动作消耗 */
  actionPoints: number
  maxActionPoints: number
  /** 当天时段标签（flavor，如「夜场前」） */
  segment: string
  /** 实时舆情流（最新在前） */
  feed: FeedItem[]
  /** 近 N 日资源快照 */
  history: HistoryPoint[]

  log: LogEntry[]
  // 周结算预览
  weeklyReport: WeeklyReport | null
}

export interface WeeklyReport {
  week: number
  revenue: number
  rent: number
  salaries: number
  net: number
  cashAfter: number
  notes: string[]
}

/** 闭店结算摘要（GameOver / 里程碑式结算屏用） */
export interface RunSummary {
  entry: LeaderboardEntry
  rank: number // 同城榜名次
  newMilestones: Milestone[]
  title: { emoji: string; name: string; next?: { name: string; need: number } }
  isMilestone: boolean // 是否「里程碑时刻」（放大庆祝）
  metaGain: { legacyReputation: number; experience: number; contacts: number }
}

/** 玩家榜单条目（本地持久化 + 同城店主对照） */
export interface LeaderboardEntry {
  id: string
  name: string
  themeName: string
  signatureName: string
  days: number
  peakReputation: number
  totalRevenue: number
  score: number
  isPlayer: boolean
  date: string
}
