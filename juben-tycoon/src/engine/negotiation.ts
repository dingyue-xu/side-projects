import type { Location } from '../types'

// 砍价机制：房东有隐藏底价，多轮还价；压太狠会掉好感、谈崩或埋雷。
// contacts(人脉 meta) 让你拿到更低的实际底价。

export interface NegotiationState {
  locationId: string
  ask: number // 房东当前要价
  reserve: number // 隐藏底价（玩家不可见）
  round: number // 当前第几轮（1-based）
  maxRounds: number
  rapport: number // 与房东好感 0~100
  closed: boolean
  finalRent?: number
  grudge: boolean // 谈崩/压太狠 → 埋雷
  history: { who: 'you' | 'landlord' | 'sys'; text: string }[]
}

export function startNegotiation(loc: Location, contacts: number): NegotiationState {
  const [, high] = loc.rentRange
  // 人脉降低实际底价，最多降 8%
  const reserve = Math.round(loc.rentReserve * (1 - Math.min(0.08, contacts * 0.01)))
  return {
    locationId: loc.id,
    ask: high,
    reserve,
    round: 1,
    maxRounds: 3,
    rapport: 62,
    closed: false,
    grudge: false,
    history: [{ who: 'landlord', text: `这地段你是识货的。${high} 一周，押二付一，不二价。` }],
  }
}

/** 根据当前要价生成三档还价选项 */
export function offerPresets(ns: NegotiationState): { label: string; amount: number; tone: 'hard' | 'mid' | 'soft' }[] {
  const a = ns.ask
  return [
    { label: `拍桌狠砍到 ${a - 4000}`, amount: a - 4000, tone: 'hard' },
    { label: `还价到 ${a - 2000}`, amount: a - 2000, tone: 'mid' },
    { label: `就 ${a} 签了`, amount: a, tone: 'soft' },
  ]
}

export interface OfferResult {
  next: NegotiationState
  outcome: 'accepted' | 'countered' | 'forcedFinal'
}

export function respondToOffer(ns: NegotiationState, offer: number): OfferResult {
  const s: NegotiationState = { ...ns, history: [...ns.history] }
  s.history.push({ who: 'you', text: `“${offer}，行不行?一口价。”` })

  // 接受：报价不低于底价
  if (offer >= s.reserve) {
    s.closed = true
    s.finalRent = offer
    s.history.push({ who: 'landlord', text: `${offer} 就 ${offer}，爽快！钥匙拿去。` })
    if (s.rapport < 35) s.grudge = true
    return { next: s, outcome: 'accepted' }
  }

  // 低于底价 → 掉好感 + 还盘
  const gap = s.reserve - offer
  const span = Math.max(2000, s.ask - s.reserve)
  const rapportHit = Math.min(35, Math.round((gap / span) * 30))
  s.rapport = Math.max(0, s.rapport - rapportHit)

  // 最后一轮：房东甩底价，take it or leave it
  if (s.round >= s.maxRounds) {
    s.ask = s.reserve
    s.round += 1
    s.history.push({
      who: 'landlord',
      text: `别磨叽了，${s.reserve}，这是底了。签不签?`,
    })
    if (s.rapport < 35) s.grudge = true
    return { next: s, outcome: 'forcedFinal' }
  }

  // 中间轮：要价向底价靠拢一部分
  const newAsk = Math.max(s.reserve, Math.round(s.ask - (s.ask - offer) * 0.45))
  s.ask = newAsk
  s.round += 1
  const mood = rapportHit > 18 ? '房东脸沉了下来:' : '房东摆摆手:'
  s.history.push({ who: 'landlord', text: `${mood}“${newAsk}，再低我可就不租了。”` })
  return { next: s, outcome: 'countered' }
}

/** 直接接受房东当前要价（最后一轮 take it） */
export function acceptCurrent(ns: NegotiationState): NegotiationState {
  const s: NegotiationState = { ...ns, history: [...ns.history] }
  s.closed = true
  s.finalRent = s.ask
  s.history.push({ who: 'you', text: `“……成交。”` })
  if (s.rapport < 35) s.grudge = true
  return s
}
