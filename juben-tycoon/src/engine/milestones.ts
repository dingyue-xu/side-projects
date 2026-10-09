import type { Milestone, MetaProgress, LeaderboardEntry } from '../types'

// 里程碑：跨周目积累的长期目标。每次闭店结算时检查新解锁的，做成「里程碑式结算」。
export const MILESTONES: (Milestone & { test: (ctx: MilestoneCtx) => boolean })[] = [
  { id: 'first_blood', emoji: '🩸', name: '初尝闭店', desc: '完成第一次经营（破产也是经验）', test: (c) => c.meta.runs >= 1 },
  { id: 'survive_quarter', emoji: '📅', name: '熬过一季', desc: '单次经营存活满 90 天', test: (c) => c.run.days >= 90 },
  { id: 'survive_year', emoji: '🗓️', name: '开门满一年', desc: '单次经营存活满 365 天', test: (c) => c.run.days >= 365 },
  { id: 'rep_star', emoji: '⭐', name: '口碑封神', desc: '口碑峰值突破 90', test: (c) => c.run.peakReputation >= 90 },
  { id: 'million', emoji: '💰', name: '百万营收', desc: '单次经营累计营收破 100 万', test: (c) => c.run.totalRevenue >= 1_000_000 },
  { id: 'veteran', emoji: '🎖️', name: '连开三店', desc: '累计开店 3 次', test: (c) => c.meta.runs >= 3 },
  { id: 'mogul', emoji: '🏙️', name: '连锁雏形', desc: '累计开店 5 次', test: (c) => c.meta.runs >= 5 },
  { id: 'top3', emoji: '🏆', name: '杀进前三', desc: '同城店主榜冲进前三', test: (c) => c.rank > 0 && c.rank <= 3 },
  { id: 'rich_legacy', emoji: '📈', name: '富甲一方', desc: '累计营收（所有周目）破 300 万', test: (c) => c.meta.totalRevenueAll >= 3_000_000 },
]

export interface MilestoneCtx {
  meta: MetaProgress
  run: { days: number; peakReputation: number; totalRevenue: number }
  rank: number // 本局在同城榜的名次（1-based），0=未知
}

/** 返回本次新解锁的里程碑 id（不含已解锁的） */
export function newlyUnlocked(ctx: MilestoneCtx): Milestone[] {
  const have = new Set(ctx.meta.unlockedMilestones)
  return MILESTONES.filter((m) => !have.has(m.id) && m.test(ctx))
}

// —— 称号阶梯：按历史最高分给一个「身份」，越玩越高 ——
const TITLES: { min: number; emoji: string; name: string }[] = [
  { min: 0, emoji: '🐣', name: '剧本杀萌新店主' },
  { min: 20000, emoji: '🧑‍💼', name: '小有名气的店长' },
  { min: 45000, emoji: '🎩', name: '望京一方诸侯' },
  { min: 80000, emoji: '🌆', name: '北京剧本杀名店' },
  { min: 130000, emoji: '👑', name: '行业传奇·开本宗师' },
]

export function titleFor(bestScore: number): { emoji: string; name: string; next?: { name: string; need: number } } {
  let cur = TITLES[0]
  let next: { name: string; need: number } | undefined
  for (let i = 0; i < TITLES.length; i++) {
    if (bestScore >= TITLES[i].min) cur = TITLES[i]
  }
  const idx = TITLES.indexOf(cur)
  if (idx < TITLES.length - 1) next = { name: TITLES[idx + 1].name, need: TITLES[idx + 1].min }
  return { emoji: cur.emoji, name: cur.name, next }
}

/** 找出玩家本局在榜单里的名次 */
export function rankOf(board: LeaderboardEntry[], entryId: string): number {
  const i = board.findIndex((e) => e.id === entryId)
  return i < 0 ? 0 : i + 1
}

/** 是否到了「里程碑式结算」时刻（解锁了新里程碑，或满 3/5/10 周目整） */
export function isMilestoneMoment(unlocked: Milestone[], meta: MetaProgress): boolean {
  if (unlocked.length > 0) return true
  return [3, 5, 10, 20].includes(meta.runs)
}
