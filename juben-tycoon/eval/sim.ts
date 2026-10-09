// 体验评估器 —— 快速无头模拟（引擎直驱，原地修改单个 state，不走 store/clone，所以很快）
import type { GameState, GameEvent, SalaryStructure } from '../src/types'
import { BALANCE } from '../src/engine/balance'
import { runDayEconomy, settleWeek, bankruptCheck, DAYS_PER_WEEK } from '../src/engine/economy'
import { pickNextEvent, enqueueChains, optionAvailable } from '../src/engine/eventEngine'
import { applyEffect } from '../src/engine/effects'
import { refreshDerivedFlags } from '../src/engine/conditions'
import { sigMods } from '../src/engine/selectors'
import { ALL_EVENTS } from '../src/data/events'
import { SIGNATURES, THEMES } from '../src/data/themes'
import { LOCATIONS, DECOR_PLANS } from '../src/data/locations'
import { ACTOR_POOL } from '../src/data/actors'
import { STARTER_SCRIPTS } from '../src/data/scripts'

export const MAX_DAYS = 760 // ~25 个月封顶

// 可随机抽到的事件（连锁专属不算入覆盖率分母）
export const POOLABLE = ALL_EVENTS.filter((e) => !e.trigger.chainedOnly && e.trigger.weight > 0)

export interface RunResult {
  signature: string
  persona: string
  days: number
  bankrupt: boolean
  peakRep: number
  totalRev: number
  seen: Set<string>
  chains: number
  crises: number
  weeks: number
  weeklyNetStd: number
}

function makeState(sigId: string): GameState {
  const sig = SIGNATURES.find((s) => s.id === sigId)!
  const theme = THEMES[0]
  const loc = LOCATIONS[1]
  const decor = DECOR_PLANS[1]
  const imm = Math.min(100, Math.round(decor.immersion * sig.modifiers.immersionFromDecorMult))
  const base = (a: typeof ACTOR_POOL[number]): SalaryStructure => ({ type: 'base', weekly: a.salaryExpect })
  const hiredIds = ['a_xiaolu', 'a_acheng', 'a_dali']
  const actors = ACTOR_POOL.map((a) => ({ ...a, hired: hiredIds.includes(a.id), salaryStructure: hiredIds.includes(a.id) ? base(a) : undefined }))
  const rep0 = 50
  return {
    phase: 'running', day: 1, week: 1,
    resources: { cash: BALANCE.startingCapital - decor.cost, reputation: rep0 },
    lastDeltas: null, runSummary: null,
    shop: {
      name: 'sim', location: loc, theme, signature: sig, rentPerWeek: 10000, immersion: imm,
      pricing: { weekday: 238, weekend: 318 },
      scripts: [STARTER_SCRIPTS[1], STARTER_SCRIPTS[0]].map((x) => ({ ...x, acquiredDay: 0 })),
      channels: { dianpingOn: true, dianpingRating: 4.6, privateDomainLevel: 1 },
    },
    actors,
    customers: { size: 30, loyalty: 55 },
    meta: { runs: 0, legacyReputation: 0, experience: 0, contacts: 0, bestDays: 0, bestScore: 0, totalDaysAll: 0, totalRevenueAll: 0, unlockedMilestones: [] },
    forcedQueue: [], flags: {}, firedAt: {}, currentEventId: null, lastResult: null,
    stats: { peakReputation: rep0, totalRevenue: 0 },
    weekRevenueAcc: 0, buzz: 30000, actionPoints: 2, maxActionPoints: 2, segment: '', feed: [], history: [],
    log: [], weeklyReport: null,
  }
}

// —— 决策人格 ——
export type ChooseFn = (s: GameState, ev: GameEvent) => number
export interface Persona { id: string; choose: ChooseFn; proact: (s: GameState) => void }

const optScore = {
  good: (e: GameEvent['options'][number]) => {
    const f = e.effects
    return (f.reputation ?? 0) * 2 + (f.customerLoyalty ?? 0) + (f.customerSize ?? 0) * 0.4 +
      (f.contentHeatTop ?? 0) + (f.contentHeatAll ?? 0) + (f.actor?.relationship ?? 0) * 0.4 - Math.max(0, -(f.cash ?? 0)) / 4000
  },
  greedyCash: (e: GameEvent['options'][number]) => (e.effects.cash ?? 0) - (e.effects.reputation ?? 0) * 0.1,
  cautious: (e: GameEvent['options'][number]) => {
    const f = e.effects
    const ferment = Math.max(0, ...(e.chains ?? []).map((c) => c.probability))
    return (f.reputation ?? 0) * 1.5 + (f.customerLoyalty ?? 0) - ferment * 8 - Math.max(0, -(f.cash ?? 0)) / 3000
  },
}

function bestIdx(s: GameState, ev: GameEvent, score: (o: GameEvent['options'][number]) => number): number {
  let bi = 0, bs = -Infinity
  ev.options.forEach((o, i) => { if (!optionAvailable(s, o)) return; const sc = score(o); if (sc > bs) { bs = sc; bi = i } })
  return bi
}

export const PERSONAS: Persona[] = [
  {
    id: 'good', choose: (s, ev) => bestIdx(s, ev, optScore.good),
    proact: (s) => {
      if (s.actionPoints <= 0) return
      const heat = Math.max(...s.shop.scripts.map((x) => x.heat))
      if (heat < 45 && s.resources.cash > 30000 && s.actionPoints >= 2) doNewScript(s)
      else if (s.resources.cash > 20000) doMarketing(s)
    },
  },
  {
    id: 'avg', choose: (s, ev) => { const av = ev.options.map((_, i) => i).filter((i) => optionAvailable(s, ev.options[i])); return av[Math.floor(Math.random() * av.length)] },
    proact: (s) => { if (s.actionPoints > 0 && s.resources.cash > 40000 && Math.random() < 0.4) doMarketing(s) },
  },
  {
    id: 'bad', choose: (s, ev) => bestIdx(s, ev, optScore.greedyCash),
    proact: () => { /* 经营不善：短视抓现金、几乎不主动投入（既不作死也不经营） */ },
  },
  {
    id: 'cautious', choose: (s, ev) => bestIdx(s, ev, optScore.cautious),
    proact: (s) => { if (s.actionPoints > 0 && s.resources.cash > 50000 && Math.random() < 0.5) doMarketing(s) },
  },
]

// 主动动作（精简版，避免耦合 store）
function doMarketing(s: GameState) { if (s.resources.cash < 3000) return; s.actionPoints -= 1; s.resources.cash -= 3000; applyEffect(s, { buzz: 18000, customerSize: 10, reputation: 1 }) }
function doUpgradeDecor(s: GameState) { if (s.resources.cash < 12000) return; s.actionPoints -= 2; s.resources.cash -= 12000; s.shop.immersion = Math.min(100, s.shop.immersion + Math.round(8 * sigMods(s).immersionFromDecorMult)) }
function doNewScript(s: GameState) { if (s.resources.cash < 9000) return; s.actionPoints -= 2; s.resources.cash -= 9000; const o = s.shop.scripts.reduce((a, b) => (b.heat < a.heat ? b : a)); o.heat = 88; applyEffect(s, { buzz: 25000, reputation: 2, customerSize: 6 }) }

export function playGame(sigId: string, persona: Persona): RunResult {
  const s = makeState(sigId)
  let weekRev = 0
  const seen = new Set<string>()
  let chains = 0, crises = 0, weeks = 0
  let netSum = 0, netSq = 0

  while (s.day < MAX_DAYS) {
    s.day += 1
    s.actionPoints = s.maxActionPoints
    const eco = runDayEconomy(s)
    weekRev += eco.revenue

    if (s.day > 1 && (s.day - 1) % DAYS_PER_WEEK === 0) {
      const r = settleWeek(s, weekRev); weeks++; netSum += r.net; netSq += r.net * r.net; weekRev = 0; s.week++
      if (bankruptCheck(s)) break
      persona.proact(s)
      continue
    }
    if (bankruptCheck(s)) break

    const ev = pickNextEvent(s)
    if (ev) {
      crises++; seen.add(ev.id); refreshDerivedFlags(s)
      const i = persona.choose(s, ev); const opt = ev.options[i]
      applyEffect(s, opt.effects); s.firedAt[ev.id] = s.day
      chains += enqueueChains(s, opt.chains).length
      if (bankruptCheck(s)) break
    } else {
      persona.proact(s)
    }
  }

  const mean = weeks ? netSum / weeks : 0
  const variance = weeks ? Math.max(0, netSq / weeks - mean * mean) : 0
  return {
    signature: sigId, persona: persona.id, days: s.day, bankrupt: bankruptCheck(s),
    peakRep: s.stats.peakReputation, totalRev: s.stats.totalRevenue, seen, chains, crises, weeks,
    weeklyNetStd: Math.sqrt(variance),
  }
}
