import type { GameState } from '../types'
import { NPC_MAP, ROLE_LABEL } from '../data/npcs'
import { portraitOf, type PortraitSlot } from '../data/assets'

export interface CastFace {
  id: string
  name: string
  emoji: string
  color: string
  role: string
  /** 精灵图格子（有则用真实肖像，无则用 emoji） */
  portrait?: PortraitSlot
}

// 把对话里的说话者 id 解析成一张「脸」：店主 / 旁白 / NPC 图鉴 / 在职演员。
export function faceOf(state: GameState, id: string | undefined): CastFace {
  const portrait = portraitOf(id)
  if (!id || id === 'narrator') return { id: 'narrator', name: '旁白', emoji: '🎬', color: '#9b9b9b', role: '旁白' }
  if (id === 'self') return { id: 'self', name: '你（店主）', emoji: '🧑‍💼', color: '#c0863a', role: '店主', portrait }

  const npc = NPC_MAP[id]
  if (npc) return { id, name: npc.name, emoji: npc.emoji, color: npc.color, role: ROLE_LABEL[npc.role] ?? '', portrait }

  const actor = state.actors.find((a) => a.id === id)
  if (actor) return { id, name: actor.name, emoji: actor.avatar, color: hueColor(id), role: '演员', portrait }

  return { id: 'narrator', name: '旁白', emoji: '🎬', color: '#9b9b9b', role: '旁白' }
}

// 由 id 稳定地散出一个颜色，给没有指定底色的演员用
function hueColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} 38% 48%)`
}
