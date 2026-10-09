import type { GameState, FeedItem, FeedTone, EventSource, GameEvent, EventOption } from '../types'

// 舆情流生成：模板池，按口碑 + 最近选择决定正负基调。纯展示，给仪表盘「活起来」。

let seq = 0
const uid = () => `f${Date.now().toString(36)}_${seq++}`

const AGOS = ['刚刚', '8分钟前', '23分钟前', '41分钟前', '1小时前', '2小时前', '今天下午']
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

const WHO: Record<EventSource, string[]> = {
  dianping: ['大众点评·匿名用户', '大众点评·Lv5老饕', '大众点评·新晋探店'],
  wechat: ['微信群·望京剧本爱好者', '微信群·剧本玩家联盟', '微信群·本周拼场'],
  xhs: ['小红书·避雷博主', '小红书·探店达人', '小红书·剧本杀日记'],
  onsite: ['到店玩家', '前台反馈'],
  industry: ['同行群', '行业号'],
}

const TEXTS: Record<FeedTone, string[]> = {
  pos: [
    '环境绝了，DM超专业，演员演技在线，这次体验拉满！',
    '沉浸感真的好，机关和灯光都用心了，朋友都说还想再来。',
    '老板服务到位，散场还贴心送了周边，下次带闺蜜来。',
    '本子质量高，演员情绪给得足，哭得稀里哗啦，好评！',
    '复购第三次了，依旧稳，这家是望京天花板没错了。',
  ],
  neu: [
    '中规中矩吧，本子还行，看个人喜好。',
    '体验一般偏上，价格稍贵，胜在演员不划水。',
    '理性吃瓜，不实锤别带节奏，可能只是误会。',
    '周末人有点多，建议错峰，整体能玩。',
  ],
  neg: [
    '最近体验感下降了…感觉有的玩家有特权，DM 还疯狂 cue，失望。',
    '演员明显赶场，氛围全无，这价格不值，避雷。',
    '约不到场、客服爱答不理，这家以后不来了。',
    '剧透 + 念稿，沉浸感为零，劝退新手。',
    '这家最近瓜不断，先观望，别踩雷。',
  ],
}

function makeItem(source: EventSource, tone: FeedTone, day: number): FeedItem {
  const base = tone === 'pos' ? 4 : tone === 'neg' ? 9 : 2
  return {
    id: uid(),
    source,
    tone,
    day,
    ago: pick(AGOS),
    who: pick(WHO[source]),
    text: pick(TEXTS[tone]),
    likes: base + Math.floor(Math.random() * (tone === 'neg' ? 120 : 12)),
    comments: Math.floor(Math.random() * (tone === 'neg' ? 90 : 10)),
  }
}

/** 按当前口碑给出基调分布 → 抽 tone */
function toneByReputation(rep: number): FeedTone {
  const r = Math.random() * 100
  if (rep >= 70) return r < 62 ? 'pos' : r < 88 ? 'neu' : 'neg'
  if (rep >= 50) return r < 38 ? 'pos' : r < 72 ? 'neu' : 'neg'
  return r < 18 ? 'pos' : r < 45 ? 'neu' : 'neg'
}

/** 处理完一个事件后，按选项的口碑影响灌入 1~3 条 */
export function pushEventFeed(state: GameState, ev: GameEvent, opt: EventOption): void {
  const repEff = opt.effects.reputation ?? 0
  let tone: FeedTone = repEff >= 3 ? 'pos' : repEff <= -3 ? 'neg' : 'neu'
  const sources: EventSource[] = ev.sources?.length ? ev.sources : defaultSources(ev.category)
  const n = ev.category === 'gossip' ? 3 : 2
  const items: FeedItem[] = []
  for (let i = 0; i < n; i++) {
    // 大瓜首条强制对应基调，其余按口碑漂移
    const t: FeedTone = i === 0 ? tone : toneByReputation(state.resources.reputation)
    items.push(makeItem(pick(sources), t, state.day))
  }
  prepend(state, items)
}

/** 平静日偶发 1 条 */
export function ambientFeed(state: GameState): void {
  if (Math.random() < 0.55) {
    const src = pick(['dianping', 'wechat', 'xhs'] as EventSource[])
    prepend(state, [makeItem(src, toneByReputation(state.resources.reputation), state.day)])
  }
}

/** 开局垫几条，别让面板空着 */
export function seedFeed(state: GameState): void {
  const items: FeedItem[] = []
  for (let i = 0; i < 5; i++) {
    items.push(makeItem(pick(['dianping', 'wechat', 'xhs'] as EventSource[]), toneByReputation(state.resources.reputation), state.day))
  }
  prepend(state, items)
}

function prepend(state: GameState, items: FeedItem[]) {
  state.feed = [...items, ...state.feed].slice(0, 40)
}

export function defaultSources(category: string): EventSource[] {
  switch (category) {
    case 'gossip':
      return ['xhs', 'wechat']
    case 'channel':
      return ['dianping']
    case 'customer':
      return ['dianping', 'onsite']
    case 'actor':
      return ['onsite', 'wechat']
    case 'industry':
      return ['industry']
    default:
      return ['dianping']
  }
}

export function defaultImpact(category: string): ('regulars' | 'actors' | 'potential')[] {
  switch (category) {
    case 'gossip':
      return ['regulars', 'potential']
    case 'actor':
      return ['actors']
    case 'channel':
      return ['potential']
    case 'customer':
      return ['regulars']
    default:
      return ['potential']
  }
}
