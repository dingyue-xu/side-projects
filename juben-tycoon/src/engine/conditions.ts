import type { Condition, CompareOp, GameState } from '../types'
import { resourceValue, hiredActors } from './selectors'

function cmp(a: number, op: CompareOp, b: number): boolean {
  switch (op) {
    case '<':
      return a < b
    case '<=':
      return a <= b
    case '==':
      return a === b
    case '!=':
      return a !== b
    case '>=':
      return a >= b
    case '>':
      return a > b
  }
}

/**
 * 派生 flags：从世界状态算出的「只读」flag，让事件条件能用统一的 flag 语义引用。
 * 在每个 tick 选事件前刷新写回 state.flags。
 */
export function refreshDerivedFlags(state: GameState): void {
  const hired = hiredActors(state)
  state.flags.someActorAngry = hired.some((a) => a.relationship < 45 || a.morale < 45)
  state.flags.hasUnstableActor = hired.some((a) => a.stability < 55)
  state.flags.hasOriginalScript = state.shop.scripts.some((s) => s.original)
}

function evalOne(c: Condition, state: GameState): boolean {
  switch (c.kind) {
    case 'resource':
      return cmp(resourceValue(state, c.key), c.op, c.value)
    case 'day':
      return cmp(state.day, c.op, c.value)
    case 'customer':
      return cmp(state.customers[c.key], c.op, c.value)
    case 'channel':
      return state.shop.channels[c.key] === c.value
    case 'signature':
      return state.shop.signature?.id === c.id
    case 'hasActorTag':
      return hiredActors(state).some((a) => a.tags.includes(c.tag))
    case 'flag': {
      const v = state.flags[c.key]
      if (typeof c.value === 'boolean') {
        // 未设置的 flag 视为 false
        const bv = v === undefined ? false : !!v
        return c.op === '!=' ? bv !== c.value : bv === c.value
      }
      const nv = typeof v === 'number' ? v : v ? 1 : 0
      return cmp(nv, c.op, c.value)
    }
  }
}

/** 数组语义 = AND；空/未定义 = 永真 */
export function evaluateConditions(conditions: Condition[] | undefined, state: GameState): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => evalOne(c, state))
}
