import type { StoreTheme, SignaturePlay } from '../types'

// 店铺主题：实景配色 + 剧本风格亲和 + 口味
export const THEMES: StoreTheme[] = [
  {
    id: 'republic',
    name: '民国谍影',
    emoji: '🎩',
    palette: { bg: '#2a2118', glow: '#caa15a', accent: '#caa15a' },
    genreAffinity: '硬核推理',
    desc: '旧上海滩、留声机、长衫旗袍。烧脑谍战与情报暗战，吃氛围也吃智商。',
  },
  {
    id: 'urban',
    name: '都市情感',
    emoji: '🌆',
    palette: { bg: '#241a22', glow: '#d97a9a', accent: '#d97a9a' },
    genreAffinity: '情感本',
    desc: '霓虹、酒馆、深夜电台。眼泪收割机，靠演员的演技和共情。',
  },
  {
    id: 'horror',
    name: '恐怖惊悚',
    emoji: '🕯️',
    palette: { bg: '#1c1414', glow: '#c0533f', accent: '#c0533f' },
    genreAffinity: '恐怖本',
    desc: '废弃医院、闪烁灯管、贴脸 jump scare。心跳与尖叫，靠机关与声光电。',
  },
  {
    id: 'wuxia',
    name: '江湖武侠',
    emoji: '⚔️',
    palette: { bg: '#1b2420', glow: '#6fae84', accent: '#6fae84' },
    genreAffinity: '阵营机制',
    desc: '客栈、刀光、恩怨情仇。大阵营厮杀，人多热闹、社交属性拉满。',
  },
  {
    id: 'comedy',
    name: '欢乐阵营',
    emoji: '🎉',
    palette: { bg: '#26221a', glow: '#e0b34d', accent: '#e0b34d' },
    genreAffinity: '欢乐本',
    desc: '整蛊、撕名牌、笑到缺氧。门槛低、获客快，适合朋友局和团建。',
  },
]

// 招牌玩法身份：被动加成 + 解锁专属事件
export const SIGNATURES: SignaturePlay[] = [
  {
    id: 'mechanism',
    name: '机关实景流',
    emoji: '🔧',
    tagline: '把钱砸进实景，让人一进门就出不了戏',
    desc: '主打实景机关、暗门、声光电。装修每一分都换更高沉浸感，体验党的心头好。',
    audience: '体验党 / 打卡党',
    modifiers: {
      demandMult: 1.0, heatDecayMult: 0.85, immersionFromDecorMult: 1.25,
      privateMult: 1.0, repCeiling: 95, riskMult: 1.0, buzzMult: 1.15,
    },
    pros: '沉浸感成长快、本子更耐玩、易出圈',
    cons: '装修是无底洞，过度投入易破产',
  },
  {
    id: 'npc',
    name: 'NPC沉浸流',
    emoji: '🎭',
    tagline: '演员就是核心竞争力，靠人留客',
    desc: '重演员、重即兴、重情绪价值。演员状态直接决定口碑，团队稳则封神、乱则崩盘。',
    audience: '回头客 / 演技粉',
    modifiers: {
      demandMult: 1.08, heatDecayMult: 1.0, immersionFromDecorMult: 0.95,
      privateMult: 1.15, repCeiling: 98, riskMult: 1.1, buzzMult: 1.0,
    },
    pros: '口碑天花板高、私域复购强',
    cons: '演员事件更频繁，团队一乱就连锁翻车',
  },
  {
    id: 'horror',
    name: '恐怖惊吓流',
    emoji: '👻',
    tagline: '主打一个吓到报警，黑红也是红',
    desc: '极致恐怖体验。话题度高、本子过气慢，但吓哭吓退的差评/退本风险也高。',
    audience: '刺激党 / 胆大党',
    modifiers: {
      demandMult: 1.05, heatDecayMult: 0.7, immersionFromDecorMult: 1.1,
      privateMult: 0.95, repCeiling: 90, riskMult: 1.3, buzzMult: 1.3,
    },
    pros: '声量爆炸、本子超耐玩、自带传播',
    cons: '差评/退本/投诉风险最高',
  },
  {
    id: 'hardcore',
    name: '硬核推理流',
    emoji: '🔍',
    tagline: '只服逻辑，劝退小白但留住真爱',
    desc: '高难度盒装硬核本。受众窄、获客慢，但留下的都是死忠，口碑与复购极稳。',
    audience: '推理硬核玩家',
    modifiers: {
      demandMult: 0.85, heatDecayMult: 0.8, immersionFromDecorMult: 0.9,
      privateMult: 1.25, repCeiling: 100, riskMult: 0.8, buzzMult: 0.9,
    },
    pros: '口碑/复购最稳，负面事件少',
    cons: '获客慢、上座低，淡季难熬',
  },
  {
    id: 'social',
    name: '欢乐社交流',
    emoji: '🥳',
    tagline: '人多就是正义，主打团建和朋友局',
    desc: '低门槛欢乐本 + 社交属性。获客快、私域裂变猛，但口碑天花板低、易被嫌「低质」。',
    audience: '朋友局 / 团建 / 萌新',
    modifiers: {
      demandMult: 1.2, heatDecayMult: 1.1, immersionFromDecorMult: 0.85,
      privateMult: 1.3, repCeiling: 82, riskMult: 1.0, buzzMult: 1.1,
    },
    pros: '获客最快、私域裂变强、回本快',
    cons: '口碑天花板低，易被吐槽缺深度',
  },
]
