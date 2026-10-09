import type { LeaderboardEntry, GameState } from '../types'

const KEY = 'juben_leaderboard_v1'

// 同城店主对照组（让榜单不孤单，给玩家一个「混到第几」的参照）
const SEEDS: LeaderboardEntry[] = [
  seed('谜雾馆·老钱', '民国谍影', '硬核推理流', 540, 96, 2_180_000, true),
  seed('惊魂屋·阿飘', '恐怖惊悚', '恐怖惊吓流', 388, 88, 1_240_000, true),
  seed('江湖客栈·风四娘', '江湖武侠', '欢乐社交流', 301, 84, 980_000, true),
  seed('深夜电台·林姐', '都市情感', 'NPC沉浸流', 256, 90, 870_000, true),
  seed('机关盒子·老周', '民国谍影', '机关实景流', 198, 79, 560_000, true),
  seed('欢乐谷·胖虎', '欢乐阵营', '欢乐社交流', 142, 71, 360_000, true),
  seed('新手村·小白', '都市情感', 'NPC沉浸流', 63, 58, 110_000, true),
]

function seed(name: string, themeName: string, signatureName: string, days: number, peak: number, rev: number, isNpc: boolean): LeaderboardEntry {
  return {
    id: 'seed_' + name,
    name,
    themeName,
    signatureName,
    days,
    peakReputation: peak,
    totalRevenue: rev,
    score: scoreOf(days, peak, rev),
    isPlayer: !isNpc,
    date: '',
  }
}

export function scoreOf(days: number, peakRep: number, totalRevenue: number): number {
  return Math.round(days * 120 + peakRep * 60 + totalRevenue / 800)
}

function safeLoad(): LeaderboardEntry[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch {
    return []
  }
}

function safeSave(list: LeaderboardEntry[]) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* 隐私模式/SSR：忽略 */
  }
}

/** 把本次经营结果计入榜单 */
export function recordRun(state: GameState): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: 'run_' + Date.now(),
    name: state.shop.name || '无名小店',
    themeName: state.shop.theme?.name ?? '—',
    signatureName: state.shop.signature?.name ?? '—',
    days: state.day,
    peakReputation: Math.round(state.stats.peakReputation),
    totalRevenue: Math.round(state.stats.totalRevenue),
    score: scoreOf(state.day, state.stats.peakReputation, state.stats.totalRevenue),
    isPlayer: true,
    date: new Date().toISOString().slice(0, 10),
  }
  const mine = safeLoad()
  mine.unshift(entry)
  safeSave(mine.slice(0, 50))
  return entry
}

/** 玩家历史 + 同城对照，按分数排序 */
export function leaderboard(): LeaderboardEntry[] {
  const mine = safeLoad()
  return [...SEEDS, ...mine].sort((a, b) => b.score - a.score)
}

/** 玩家自己的历史最佳 */
export function myRuns(): LeaderboardEntry[] {
  return safeLoad().sort((a, b) => b.score - a.score)
}
