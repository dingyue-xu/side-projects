import type { GameState, Effect, Actor, ActorTarget } from '../types'
import { hiredActors, topScript } from './selectors'

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

function pickActor(state: GameState, target: ActorTarget): Actor | undefined {
  const pool = hiredActors(state)
  if (pool.length === 0) return undefined
  switch (target.select) {
    case 'random':
      return pool[Math.floor(Math.random() * pool.length)]
    case 'lowestRelationship':
      return pool.reduce((a, b) => (b.relationship < a.relationship ? b : a))
    case 'lowestStability':
      return pool.reduce((a, b) => (b.stability < a.stability ? b : a))
    case 'byTag':
      return pool.find((a) => a.tags.includes(target.tag)) ?? pool[0]
    case 'id':
      return pool.find((a) => a.id === target.id)
  }
}

/** 记录本次效果造成的资源变化，用于 HUD 飘字 / 结算动画 */
export interface EffectDelta {
  cash?: number
  reputation?: number
  contentHeat?: number
  immersion?: number
  customerSize?: number
  customerLoyalty?: number
  actorRel?: number
  buzz?: number
}

/** 原地修改 state，应用一个 Effect。返回资源 delta 供 UI 展示。 */
export function applyEffect(state: GameState, eff: Effect): EffectDelta {
  const delta: EffectDelta = {}

  if (eff.cash) {
    state.resources.cash += eff.cash
    delta.cash = eff.cash
  }
  if (eff.reputation) {
    state.resources.reputation = clamp(state.resources.reputation + eff.reputation)
    delta.reputation = eff.reputation
  }
  if (eff.immersion) {
    state.shop.immersion = clamp(state.shop.immersion + eff.immersion)
    delta.immersion = eff.immersion
  }
  if (eff.contentHeatAll) {
    state.shop.scripts.forEach((s) => (s.heat = clamp(s.heat + eff.contentHeatAll!)))
    delta.contentHeat = eff.contentHeatAll
  }
  if (eff.contentHeatTop) {
    const top = topScript(state)
    if (top) top.heat = clamp(top.heat + eff.contentHeatTop)
    delta.contentHeat = (delta.contentHeat ?? 0) + eff.contentHeatTop
  }
  if (eff.buzz) {
    state.buzz = Math.max(0, state.buzz + eff.buzz)
    delta.buzz = eff.buzz
  }

  if (eff.customerLoyalty) {
    state.customers.loyalty = clamp(state.customers.loyalty + eff.customerLoyalty)
    delta.customerLoyalty = eff.customerLoyalty
  }
  if (eff.customerSize) {
    state.customers.size = Math.max(0, state.customers.size + eff.customerSize)
    delta.customerSize = eff.customerSize
  }

  if (eff.actor) {
    const a = pickActor(state, eff.actor.target)
    if (a) {
      if (eff.actor.relationship) a.relationship = clamp(a.relationship + eff.actor.relationship)
      if (eff.actor.morale) a.morale = clamp(a.morale + eff.actor.morale)
      if (eff.actor.stability) a.stability = clamp(a.stability + eff.actor.stability)
    }
    if (eff.actor.relationship) delta.actorRel = eff.actor.relationship
  }

  if (eff.setFlags) {
    for (const [k, v] of Object.entries(eff.setFlags)) state.flags[k] = v
  }
  if (eff.incFlags) {
    for (const [k, v] of Object.entries(eff.incFlags)) {
      const cur = typeof state.flags[k] === 'number' ? (state.flags[k] as number) : 0
      state.flags[k] = cur + v
    }
  }

  return delta
}
