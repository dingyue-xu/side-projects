import type { GameState, GameEvent, EventOption, ChainSpec } from '../types'
import { ALL_EVENTS, EVENT_MAP } from '../data/events'
import { evaluateConditions, refreshDerivedFlags } from './conditions'
import { sigMods } from './selectors'
import { BALANCE } from './balance'

// 负面/风险类事件，受招牌玩法 riskMult 调节频率
const RISK_CATS = new Set(['gossip', 'channel', 'customer', 'actor'])

function effectiveWeight(state: GameState, ev: GameEvent): number {
  const base = ev.trigger.weight
  return RISK_CATS.has(ev.category) ? base * sigMods(state).riskMult : base
}

// 平和日概率：没合适事件、或随机给玩家喘口气

function isOnCooldown(state: GameState, ev: GameEvent): boolean {
  const last = state.firedAt[ev.id]
  if (last === undefined) return false
  if (ev.trigger.once) return true // 已触发过且 once
  const cd = ev.trigger.cooldownDays ?? 0
  return state.day - last < cd
}

function eligibleForPool(state: GameState, ev: GameEvent): boolean {
  if (ev.trigger.chainedOnly) return false
  if ((ev.trigger.weight ?? 0) <= 0) return false
  if (ev.trigger.minDay && state.day < ev.trigger.minDay) return false
  if (isOnCooldown(state, ev)) return false
  return evaluateConditions(ev.trigger.conditions, state)
}

/**
 * 选出本 tick 要触发的事件。
 * 优先级：强制队列(到点) > 加权随机池 > 平和日(null)
 * 注意：本函数会刷新派生 flags，但不修改触发记录(由 resolveOption 落)。
 */
export function pickNextEvent(state: GameState): GameEvent | null {
  refreshDerivedFlags(state)

  // 1) 强制队列：取最早到点的
  const dueIdx = state.forcedQueue
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.dueDay <= state.day)
    .sort((a, b) => a.q.dueDay - b.q.dueDay)[0]
  if (dueIdx) {
    const [item] = state.forcedQueue.splice(dueIdx.i, 1)
    const ev = EVENT_MAP[item.eventId]
    if (ev) return ev
    // 引用失效则继续往下走
  }

  // 2) 加权随机池
  if (Math.random() < BALANCE.peacefulDayChance) return null
  const pool = ALL_EVENTS.filter((e) => eligibleForPool(state, e))
  if (pool.length === 0) return null

  const weights = pool.map((e) => effectiveWeight(state, e))
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** 滚连锁：把命中的后续事件排进强制队列 */
export function enqueueChains(state: GameState, chains: ChainSpec[] | undefined): string[] {
  const queuedTitles: string[] = []
  if (!chains) return queuedTitles
  for (const c of chains) {
    if (Math.random() < c.probability) {
      const dueDay = state.day + (c.delayDays && c.delayDays > 0 ? c.delayDays : 1)
      state.forcedQueue.push({ eventId: c.eventId, dueDay })
      const ev = EVENT_MAP[c.eventId]
      if (ev) queuedTitles.push(ev.title)
    }
  }
  return queuedTitles
}

/** 可选项是否可选（requires 求值） */
export function optionAvailable(state: GameState, opt: EventOption): boolean {
  return evaluateConditions(opt.requires, state)
}

/** 选项的「二次发酵概率」= 连锁里最高的那个 */
export function optionFermentChance(opt: EventOption): number {
  if (!opt.chains?.length) return 0
  return Math.max(...opt.chains.map((c) => c.probability))
}

/** 事件风险等级（UI 用） */
export function eventRisk(ev: GameEvent): 'high' | 'mid' | 'low' {
  if (ev.risk) return ev.risk
  if (ev.category === 'gossip') return 'high'
  if (ev.category === 'channel' || ev.category === 'industry') return 'mid'
  return 'low'
}
