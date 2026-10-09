import type { GameState, WeeklyReport, LogEntry } from '../types'
import { contentHeat, hiredActors, sigMods, themeMatches } from './selectors'
import { BALANCE } from './balance'

// ============================================================================
// 经济模型 —— 按北京剧本杀真实量级标定
// 目标：经营不善的店 ~6 个月闭店；经营得当能撑 1.5 年以上。
// 参考量级：客单 ¥200~350/人、演员月薪 ¥6k~12k、店租月 ¥2万~9万、启动资金 ~¥30万。
// 调参就改下面这几个常量。
// ============================================================================

export const DAYS_PER_WEEK = 7

export const isWeekend = (day: number) => day % 7 === 5 || day % 7 === 6

/** 当天经营结算（不含周固定成本），原地修改 state，返回当天净现金变化与场次。 */
export function runDayEconomy(state: GameState): { revenue: number; sessions: number; net: number } {
  const loc = state.shop.location
  if (!loc) return { revenue: 0, sessions: 0, net: 0 }

  const rep = state.resources.reputation
  const heat = contentHeat(state)
  const imm = state.shop.immersion
  const weekend = isWeekend(state.day)
  const mods = sigMods(state)
  const themeBonus = themeMatches(state) ? 1.08 : 1.0

  // —— 需求（决定上座率）——
  const repFactor = 0.45 + 0.9 * (rep / 100)
  const heatFactor = 0.55 + 0.55 * (heat / 100)
  const immFactor = (0.75 + 0.35 * (imm / 100)) * themeBonus
  const publicExposure = state.shop.channels.dianpingOn ? loc.exposure : 0.4
  const privateDemand =
    (state.customers.size / 90) * (0.4 + 0.6 * (state.customers.loyalty / 100)) * loc.privateBonus * mods.privateMult
  const weekendFactor = weekend ? 1.45 : 0.92

  const demand =
    BALANCE.baseDemand * publicExposure * repFactor * heatFactor * immFactor * weekendFactor * mods.demandMult + privateDemand

  const capacity = loc.capacityRooms * (weekend ? 3 : 2)
  const sessions = Math.max(0, Math.min(capacity, Math.round(demand)))

  // —— 收入 ——
  const price = weekend ? state.shop.pricing.weekend : state.shop.pricing.weekday
  const playersPerSession = Math.max(3, Math.min(8, Math.round(BALANCE.playersBase + BALANCE.playersRepBonus * (rep / 100))))
  const revenue = sessions * playersPerSession * price

  // —— 当天变动成本（含提成演员）——
  let variable = sessions * BALANCE.variableCostPerSession
  for (const a of hiredActors(state)) {
    if (a.salaryStructure?.type === 'commission') {
      variable += sessions * a.salaryStructure.perSession
    }
  }

  const net = revenue - variable
  state.resources.cash += net
  state.stats.totalRevenue += revenue
  if (state.resources.reputation > state.stats.peakReputation) state.stats.peakReputation = state.resources.reputation

  // —— 客群自然漂移（口碑高于 58 涨、低于则跌）——
  const repDrift = (rep - 58) / 100
  state.customers.size = Math.max(0, Math.round(state.customers.size + sessions * 0.5 + repDrift * 3))
  state.customers.loyalty = clampPct(state.customers.loyalty + (sessions > 0 ? 0.25 : -0.4))

  // —— 口碑软天花板（招牌玩法决定上限，超过则受重力下拉）——
  if (rep > mods.repCeiling) {
    state.resources.reputation = clampPct(rep - (rep - mods.repCeiling) * 0.12)
  }

  // —— 声量（内容热度）：每日衰减 + 当日产出 ——
  const buzzGain = sessions * playersPerSession * 22 * (0.5 + rep / 100) * mods.buzzMult
  state.buzz = Math.max(0, Math.round(state.buzz * 0.9 + buzzGain))

  // —— 剧本热度衰减（招牌玩法影响耐玩度）——
  const decay = BALANCE.heatDecayPerDay * mods.heatDecayMult
  for (const s of state.shop.scripts) {
    s.heat = Math.max(0, +(s.heat - decay).toFixed(2))
  }

  // —— 记录近 N 日快照 ——
  state.history.push({ day: state.day, cash: state.resources.cash, reputation: state.resources.reputation, buzz: state.buzz })
  if (state.history.length > 10) state.history.shift()

  return { revenue, sessions, net }
}

/** 周固定成本结算（租金 + 底薪/分红）。原地修改 state，返回 report。 */
export function settleWeek(state: GameState, weekRevenue: number): WeeklyReport {
  const rent = state.shop.rentPerWeek
  let salaries = 0
  for (const a of hiredActors(state)) {
    const s = a.salaryStructure
    if (!s) continue
    if (s.type === 'base') salaries += s.weekly
    else if (s.type === 'commission') salaries += s.weekly // 提成按日扣，这里只扣底薪
    else if (s.type === 'profitShare')
      salaries += s.weekly + Math.max(0, Math.round((weekRevenue * s.sharePct) / 100))
  }

  const fixed = rent + salaries
  state.resources.cash -= fixed

  // 长期熵：房租逐周上涨。营收不跟着涨，迟早被成本压垮（区分「主动经营」与「躺平」）。
  const newRent = Math.round(rent * (1 + BALANCE.rentCreepPerWeek))
  const rentUp = newRent - rent
  state.shop.rentPerWeek = newRent

  const notes: string[] = []
  if (rentUp > 0 && state.week % 4 === 0) notes.push(`🏠 房东续租涨价，周租已涨到 ¥${newRent.toLocaleString()}`)
  if (state.resources.cash < rent + salaries) notes.push('⚠️ 账上现金已不够下周固定开销，再不开源就要闭店了')
  if (contentHeat(state) < 35) notes.push('📉 招牌本热度偏低，该考虑上新本了')

  return {
    week: state.week,
    revenue: weekRevenue,
    rent,
    salaries,
    net: weekRevenue - fixed,
    cashAfter: state.resources.cash,
    notes,
  }
}

export function bankruptCheck(state: GameState): boolean {
  return state.resources.cash < 0
}

const clampPct = (v: number) => Math.max(0, Math.min(100, v))

export function logLine(day: number, text: string, tone: LogEntry['tone'] = 'neutral'): LogEntry {
  return { day, text, tone }
}
