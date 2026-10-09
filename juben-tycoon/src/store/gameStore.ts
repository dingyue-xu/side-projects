import { create } from 'zustand'
import type {
  GameState,
  MetaProgress,
  Location,
  DecorPlan,
  SalaryStructure,
  OwnedScript,
  Pricing,
  StoreTheme,
  SignaturePlay,
  Effect,
} from '../types'
import { EVENT_MAP } from '../data/events'
import { ACTOR_POOL } from '../data/actors'
import { pickNextEvent, enqueueChains } from '../engine/eventEngine'
import { applyEffect } from '../engine/effects'
import { refreshDerivedFlags } from '../engine/conditions'
import { runDayEconomy, settleWeek, bankruptCheck, logLine, DAYS_PER_WEEK } from '../engine/economy'
import { sigMods } from '../engine/selectors'
import { pushEventFeed, ambientFeed, seedFeed } from '../engine/feed'
import { recordRun, leaderboard } from '../engine/leaderboard'
import { newlyUnlocked, titleFor, rankOf, isMilestoneMoment } from '../engine/milestones'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
function segmentLabel(day: number): string {
  const wd = WEEKDAYS[(day - 1 + 7) % 7]
  const seg = day % 2 === 0 ? '午场前 14:00' : '夜场前 19:30'
  return `${wd} · ${seg}`
}

import { BALANCE } from '../engine/balance'

const emptyMeta: MetaProgress = {
  runs: 0,
  legacyReputation: 0,
  experience: 0,
  contacts: 0,
  bestDays: 0,
  bestScore: 0,
  totalDaysAll: 0,
  totalRevenueAll: 0,
  unlockedMilestones: [],
}

function createInitialState(meta: MetaProgress): GameState {
  return {
    phase: 'title',
    day: 0,
    week: 0,
    resources: {
      cash: BALANCE.startingCapital + meta.experience * 8000,
      reputation: 50 + Math.min(20, meta.legacyReputation),
    },
    lastDeltas: null,
    runSummary: null,
    shop: {
      name: '雾隐剧场',
      location: null,
      theme: null,
      signature: null,
      rentPerWeek: 0,
      immersion: 0,
      pricing: { weekday: 238, weekend: 318 },
      scripts: [],
      channels: { dianpingOn: true, dianpingRating: 4.6, privateDomainLevel: 1 },
    },
    actors: ACTOR_POOL.map((a) => ({ ...a })),
    customers: { size: 30, loyalty: 55 },
    meta,
    forcedQueue: [],
    flags: {},
    firedAt: {},
    currentEventId: null,
    lastResult: null,
    weekRevenueAcc: 0,
    stats: { peakReputation: 50 + Math.min(20, meta.legacyReputation), totalRevenue: 0 },
    buzz: 30000,
    actionPoints: 2,
    maxActionPoints: 2,
    segment: segmentLabel(1),
    feed: [],
    history: [],
    log: [],
    weeklyReport: null,
  }
}

// 只深拷贝「数据字段」，配合引擎的原地修改。
// 注意：store 里数据和 action 函数混在同一个对象上，直接 structuredClone 整个 store 会因
// 无法克隆函数而抛 DataCloneError；所以这里只挑数据字段克隆，action 由 zustand 的浅合并保留。
const DATA_KEYS = [
  'phase', 'day', 'week', 'resources', 'shop', 'actors', 'customers', 'meta',
  'forcedQueue', 'flags', 'firedAt', 'currentEventId', 'lastResult', 'lastDeltas', 'stats', 'runSummary', 'weekRevenueAcc',
  'buzz', 'actionPoints', 'maxActionPoints', 'segment', 'feed', 'history',
  'log', 'weeklyReport',
] as const

const clone = (s: GameState): GameState => {
  const out = {} as Record<string, unknown>
  for (const k of DATA_KEYS) out[k] = structuredClone((s as unknown as Record<string, unknown>)[k])
  return out as unknown as GameState
}

interface GameStore extends GameState {
  // —— 流程 ——
  startSetup: () => void
  // —— 开店设置 ——
  setName: (name: string) => void
  setTheme: (theme: StoreTheme) => void
  setSignature: (sig: SignaturePlay) => void
  setLocation: (loc: Location) => void
  commitRent: (rent: number, grudge: boolean) => void
  setDecor: (plan: DecorPlan) => void
  hireActor: (actorId: string, salary: SalaryStructure) => void
  fireActor: (actorId: string) => void
  addStarterScript: (script: Omit<OwnedScript, 'acquiredDay'>) => void
  setPricing: (p: Pricing) => void
  beginRun: () => void
  // —— 运营循环 ——
  nextDay: () => void
  fastForward: () => void
  resolveOption: (optionIndex: number) => void
  continueFromResult: () => void
  closeWeekly: () => void
  // —— 主动运营动作（消耗行动力）——
  proAction: (id: ProActionId) => void
  // —— meta ——
  restart: () => void
}

export const useGame = create<GameStore>((set, get) => ({
  ...createInitialState(emptyMeta),

  startSetup: () => set({ phase: 'setup' }),

  setName: (name) =>
    set((st) => {
      const s = clone(st)
      s.shop.name = name
      return s
    }),

  setTheme: (theme) =>
    set((st) => {
      const s = clone(st)
      s.shop.theme = theme
      return s
    }),

  setSignature: (sig) =>
    set((st) => {
      const s = clone(st)
      s.shop.signature = sig
      return s
    }),

  setLocation: (loc) =>
    set((st) => {
      const s = clone(st)
      s.shop.location = loc
      s.shop.rentPerWeek = 0
      return s
    }),

  commitRent: (rent, grudge) =>
    set((st) => {
      const s = clone(st)
      s.shop.rentPerWeek = rent
      if (grudge) s.flags.landlordGrudge = true
      s.log.unshift(logLine(0, `谈下房租 ¥${rent}/周${grudge ? '（房东不太爽，记着仇了）' : ''}`, 'money'))
      return s
    }),

  setDecor: (plan) =>
    set((st) => {
      const s = clone(st)
      s.resources.cash -= plan.cost
      // 招牌玩法影响「装修→沉浸感」转化率（机关流更划算，社交流偏低）
      const imm = Math.min(100, Math.round(plan.immersion * sigMods(s).immersionFromDecorMult))
      s.shop.immersion = imm
      s.log.unshift(logLine(0, `${plan.name}，花了 ¥${plan.cost}，沉浸感 ${imm}`, 'money'))
      return s
    }),

  hireActor: (actorId, salary) =>
    set((st) => {
      const s = clone(st)
      const a = s.actors.find((x) => x.id === actorId)
      if (a && !a.hired) {
        a.hired = true
        a.salaryStructure = salary
      }
      return s
    }),

  fireActor: (actorId) =>
    set((st) => {
      const s = clone(st)
      const a = s.actors.find((x) => x.id === actorId)
      if (a) {
        a.hired = false
        a.salaryStructure = undefined
      }
      return s
    }),

  addStarterScript: (script) =>
    set((st) => {
      const s = clone(st)
      if (!s.shop.scripts.find((x) => x.id === script.id)) {
        s.shop.scripts.push({ ...script, acquiredDay: 0 })
      }
      return s
    }),

  setPricing: (p) =>
    set((st) => {
      const s = clone(st)
      s.shop.pricing = p
      return s
    }),

  beginRun: () =>
    set((st) => {
      const s = clone(st)
      s.phase = 'running'
      s.day = 1
      s.week = 1
      s.segment = segmentLabel(1)
      s.actionPoints = s.maxActionPoints
      s.history = [{ day: 1, cash: s.resources.cash, reputation: s.resources.reputation, buzz: s.buzz }]
      seedFeed(s)
      s.log.unshift(logLine(1, `开业大吉！「${s.shop.name}」正式营业。`, 'good'))
      return s
    }),

  nextDay: () => {
    const st = get()
    if (st.phase !== 'running') return
    const s = clone(st)
    stepOneDay(s)
    set(s)
  },

  // 快进：连续推进，遇到「事件 / 周结算 / 破产」自动停下（跳过平静日的逐天点击）
  fastForward: () => {
    const st = get()
    if (st.phase !== 'running') return
    const s = clone(st)
    let guard = 0
    while (s.phase === 'running' && guard < 60) {
      const status = stepOneDay(s)
      if (status !== 'continue') break
      guard++
    }
    set(s)
  },

  resolveOption: (optionIndex) => {
    const st = get()
    if (st.phase !== 'event' || !st.currentEventId) return
    const ev = EVENT_MAP[st.currentEventId]
    const opt = ev?.options[optionIndex]
    if (!ev || !opt) return

    const s = clone(st)
    const d = applyEffect(s, opt.effects)
    if (s.resources.reputation > s.stats.peakReputation) s.stats.peakReputation = s.resources.reputation
    // 预估营业额影响：口碑/客群是营业额的驱动，折算成直观的「营业额」数字
    const revenue = Math.round((d.reputation ?? 0) * 900 + (d.customerLoyalty ?? 0) * 320 + (d.customerSize ?? 0) * 260)
    s.lastDeltas = {
      cash: d.cash ?? 0, reputation: d.reputation ?? 0, actorRel: d.actorRel ?? 0,
      customerLoyalty: d.customerLoyalty ?? 0, buzz: d.buzz ?? 0, revenue,
    }
    s.firedAt[ev.id] = s.day
    refreshDerivedFlags(s)
    pushEventFeed(s, ev, opt)

    const chained = enqueueChains(s, opt.chains)
    s.lastResult = { text: opt.resultText, option: opt.label, reply: opt.reply }
    s.log.unshift(logLine(s.day, `【${ev.title}】你选择：${opt.label}`, toneFor(ev.category)))
    if (chained.length) {
      s.log.unshift(logLine(s.day, `…埋下后续：${chained.join('、')}`, 'bad'))
    }

    if (bankruptCheck(s)) {
      endRun(s)
    }
    set(s)
  },

  continueFromResult: () =>
    set((st) => {
      const s = clone(st)
      s.lastDeltas = null
      if (s.phase === 'gameover') return s
      s.currentEventId = null
      s.lastResult = null
      s.phase = 'running'
      return s
    }),

  closeWeekly: () =>
    set((st) => {
      const s = clone(st)
      s.weeklyReport = null
      s.phase = s.phase === 'gameover' ? 'gameover' : 'running'
      return s
    }),

  proAction: (id) =>
    set((st) => {
      if (st.phase !== 'running') return st
      const def = PRO_ACTIONS[id]
      if (!def) return st
      if (st.actionPoints < def.ap) return st
      if (st.resources.cash < def.cost) return st
      const s = clone(st)
      s.actionPoints -= def.ap
      s.resources.cash -= def.cost
      const r = def.apply(s)
      ambientFeed(s)
      s.log.unshift(logLine(s.day, `主动行动·${def.name}：花 ¥${def.cost}，${r}`, 'money'))
      return s
    }),

  // meta 遗产已在 endRun 结算，这里只重置局面（保留 meta），回到开店流程
  restart: () =>
    set((st) => ({ ...createInitialState(st.meta), phase: 'setup' })),
}))

function toneFor(cat: string): 'good' | 'bad' | 'neutral' {
  return cat === 'gossip' || cat === 'channel' ? 'bad' : 'neutral'
}

/**
 * 推进一天（原地修改 s）。返回本步结果：
 * 'event' 触发事件 / 'weekly' 周结算 / 'gameover' 破产 / 'continue' 平静日（可继续快进）。
 */
function stepOneDay(s: GameState): 'event' | 'weekly' | 'gameover' | 'continue' {
  s.day += 1
  s.segment = segmentLabel(s.day)
  s.actionPoints = s.maxActionPoints // 行动力每天回满

  const eco = runDayEconomy(s)
  s.weekRevenueAcc += eco.revenue
  if (eco.sessions > 0) {
    s.log.unshift(
      logLine(s.day, `今日开 ${eco.sessions} 场，营收 ¥${eco.revenue}，净 ${eco.net >= 0 ? '+' : ''}${eco.net}`, eco.net >= 0 ? 'money' : 'bad')
    )
  } else {
    s.log.unshift(logLine(s.day, '今日冷清，一场没开。', 'bad'))
  }

  // 周结算（每满 7 天）
  if (s.day > 1 && (s.day - 1) % DAYS_PER_WEEK === 0) {
    s.week += 1
    const report = settleWeek(s, s.weekRevenueAcc)
    s.weekRevenueAcc = 0
    s.weeklyReport = report
    s.log.unshift(logLine(s.day, `📅 第${report.week}周结算：营收 ¥${report.revenue}，固定成本 ¥${report.rent + report.salaries}，净 ${report.net}`, report.net >= 0 ? 'money' : 'bad'))
    if (bankruptCheck(s)) {
      endRun(s)
      return 'gameover'
    }
    s.phase = 'weekly'
    return 'weekly'
  }

  if (bankruptCheck(s)) {
    endRun(s)
    return 'gameover'
  }

  // 抽事件
  const ev = pickNextEvent(s)
  if (ev) {
    s.currentEventId = ev.id
    s.lastResult = null
    s.phase = 'event'
    return 'event'
  }
  ambientFeed(s)
  s.log.unshift(logLine(s.day, '平静的一天，没出什么幺蛾子。', 'neutral'))
  return 'continue'
}

// 破产 → 结束本周目 + 里程碑式结算
function endRun(s: GameState) {
  s.phase = 'gameover'
  s.currentEventId = null
  s.lastResult = null
  s.lastDeltas = null
  s.log.unshift(logLine(s.day, '💀 现金断流，剧本杀店黯然闭店。', 'bad'))

  const run = { days: s.day, peakReputation: s.stats.peakReputation, totalRevenue: s.stats.totalRevenue }

  // —— meta 遗产结算 ——
  const metaGain = {
    legacyReputation: Math.round(run.peakReputation / 10),
    experience: Math.floor(run.days / 7),
    contacts: s.shop.scripts.length,
  }
  s.meta.runs += 1
  s.meta.bestDays = Math.max(s.meta.bestDays, run.days)
  s.meta.totalDaysAll += run.days
  s.meta.totalRevenueAll += run.totalRevenue
  s.meta.legacyReputation += metaGain.legacyReputation
  s.meta.experience += metaGain.experience
  s.meta.contacts += metaGain.contacts

  // —— 榜单 + 名次 ——
  const entry = recordRun(s)
  s.meta.bestScore = Math.max(s.meta.bestScore, entry.score)
  const rank = rankOf(leaderboard(), entry.id)

  // —— 里程碑 ——
  const unlocked = newlyUnlocked({ meta: s.meta, run, rank })
  s.meta.unlockedMilestones.push(...unlocked.map((m) => m.id))

  s.runSummary = {
    entry,
    rank,
    newMilestones: unlocked,
    title: titleFor(s.meta.bestScore),
    isMilestone: isMilestoneMoment(unlocked, s.meta),
    metaGain,
  }
}

// ============================================================================
// 主动运营动作：每天有限的行动力，让玩家不只是被动接事件，也能主动出招
// ============================================================================
export type ProActionId = 'marketing' | 'teambuild' | 'newScript' | 'upgradeDecor'

interface ProActionDef {
  id: ProActionId
  name: string
  emoji: string
  desc: string
  cost: number
  ap: number
  apply: (s: GameState) => string // 返回日志描述
}

export const PRO_ACTIONS: Record<ProActionId, ProActionDef> = {
  marketing: {
    id: 'marketing', name: '私域造势', emoji: '📣', cost: 3000, ap: 1,
    desc: '砸钱做内容/投流，拉声量和新客，口碑略升。',
    apply: (s) => {
      applyEffect(s, { buzz: 18000, customerSize: 10, reputation: 1 } as Effect)
      return '声量↑ 新客↑'
    },
  },
  teambuild: {
    id: 'teambuild', name: '团队建设', emoji: '🍻', cost: 2500, ap: 1,
    desc: '聚餐团建，全员心情和关系回血，稳住团队。',
    apply: (s) => {
      for (const a of s.actors.filter((x) => x.hired)) {
        a.morale = Math.min(100, a.morale + 8)
        a.relationship = Math.min(100, a.relationship + 6)
      }
      return '全员士气/关系↑'
    },
  },
  newScript: {
    id: 'newScript', name: '上新本', emoji: '📜', cost: 9000, ap: 2,
    desc: '引进一个当红新本，给最旧的本换血，热度与声量大涨。',
    apply: (s) => {
      // 把热度最低的本换成一个新鲜高热本
      if (s.shop.scripts.length) {
        const oldest = s.shop.scripts.reduce((a, b) => (b.heat < a.heat ? b : a))
        oldest.heat = 88
        oldest.acquiredDay = s.day
      }
      applyEffect(s, { buzz: 25000, reputation: 2, customerSize: 6 } as Effect)
      return '招牌本焕新，热度↑'
    },
  },
  upgradeDecor: {
    id: 'upgradeDecor', name: '装修升级', emoji: '🔨', cost: 12000, ap: 2,
    desc: '加机关/声光电，沉浸感上一个台阶（受招牌玩法加成）。',
    apply: (s) => {
      const gain = Math.round(8 * sigMods(s).immersionFromDecorMult)
      s.shop.immersion = Math.min(100, s.shop.immersion + gain)
      applyEffect(s, { reputation: 1 } as Effect)
      return `沉浸感 +${gain}`
    },
  },
}
