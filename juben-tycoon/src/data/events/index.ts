import type { GameEvent } from '../../types'
import { CUSTOMER_EVENTS } from './customer'
import { ACTOR_EVENTS } from './actor'
import { CHANNEL_EVENTS } from './channel'
import { INDUSTRY_EVENTS } from './industry'
import { GOSSIP_EVENTS } from './gossip'

// 全量事件库。往里加新文件 → 在这里 concat 即可，引擎无需改动。
export const ALL_EVENTS: GameEvent[] = [
  ...CUSTOMER_EVENTS,
  ...ACTOR_EVENTS,
  ...CHANNEL_EVENTS,
  ...INDUSTRY_EVENTS,
  ...GOSSIP_EVENTS,
]

// id → event 索引，连锁/强制队列按 id 取
export const EVENT_MAP: Record<string, GameEvent> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e])
)

// 启动时校验：连锁引用的 eventId 都存在、id 不重复
export function validateEventLibrary(): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const e of ALL_EVENTS) {
    if (ids.has(e.id)) problems.push(`重复事件 id: ${e.id}`)
    ids.add(e.id)
  }
  for (const e of ALL_EVENTS) {
    for (const opt of e.options) {
      for (const chain of opt.chains ?? []) {
        if (!EVENT_MAP[chain.eventId]) {
          problems.push(`事件 ${e.id} 选项「${opt.label}」连锁到不存在的 ${chain.eventId}`)
        }
      }
    }
  }
  return problems
}
