import type { GameState, Actor, OwnedScript, SignatureModifiers } from '../types'

/** 中性默认修正（未选招牌玩法时兜底） */
const NEUTRAL_MODS: SignatureModifiers = {
  demandMult: 1, heatDecayMult: 1, immersionFromDecorMult: 1,
  privateMult: 1, repCeiling: 100, riskMult: 1, buzzMult: 1,
}

export function sigMods(state: GameState): SignatureModifiers {
  return state.shop.signature?.modifiers ?? NEUTRAL_MODS
}

/** 主打剧本 genre 是否匹配店铺主题（匹配则有沉浸/口碑小加成） */
export function themeMatches(state: GameState): boolean {
  const aff = state.shop.theme?.genreAffinity
  if (!aff) return false
  return state.shop.scripts.some((s) => s.genre.includes(aff) || aff.includes(s.genre))
}

/** HUD 显示的「内容热度（声量）」万 字符串 */
export function buzzWan(state: GameState): string {
  const w = state.buzz / 10000
  return w >= 1 ? w.toFixed(1) : (state.buzz / 1000).toFixed(1) + 'k'
}

// 衍生值的统一出口。条件求值、HUD、经济都从这里取，避免到处算。

/** 内容热度（聚合）= 主打本（热度最高那本）的热度 */
export function contentHeat(state: GameState): number {
  if (state.shop.scripts.length === 0) return 0
  return Math.round(Math.max(...state.shop.scripts.map((s) => s.heat)))
}

/** 主打本 */
export function topScript(state: GameState): OwnedScript | null {
  if (state.shop.scripts.length === 0) return null
  return state.shop.scripts.reduce((a, b) => (b.heat > a.heat ? b : a))
}

export function hiredActors(state: GameState): Actor[] {
  return state.actors.filter((a) => a.hired)
}

/** 取 resource 类条件用的当前值 */
export function resourceValue(state: GameState, key: 'cash' | 'reputation' | 'contentHeat' | 'immersion'): number {
  switch (key) {
    case 'cash':
      return state.resources.cash
    case 'reputation':
      return state.resources.reputation
    case 'contentHeat':
      return contentHeat(state)
    case 'immersion':
      return state.shop.immersion
  }
}

/** 演员平均稳定性，给迟到/罢演类风险用 */
export function avgStability(state: GameState): number {
  const a = hiredActors(state)
  if (a.length === 0) return 100
  return a.reduce((s, x) => s + x.stability, 0) / a.length
}
