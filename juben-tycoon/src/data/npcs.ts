import type { NPC } from '../types'

// NPC 图鉴：剧本杀生态里的具体角色。事件用 anchorNpc / dialogue 引用这些 id，
// 让「瓜」有具体的脸。演员单独在 actors.ts（也会进图鉴）。
export const NPCS: NPC[] = [
  // —— 常客 ——
  {
    id: 'reg_ak',
    name: '阿K',
    role: 'regular',
    emoji: '🧑‍🦱',
    color: '#5b7aa8',
    title: '资深常客 · 演员的绯闻对象',
    bio: '每周三场不落的老玩家，最近和店里演员小北走得很近，被其他玩家说「搞特殊」。',
    traits: ['氪金大佬', '戏霸', '绯闻中心'],
  },
  {
    id: 'reg_meimei',
    name: '美美',
    role: 'regular',
    emoji: '👩‍🎓',
    color: '#c08ab0',
    title: '学生党 · 价格敏感',
    bio: '五道口的大学生，精打细算，哪家有活动去哪家。私域群里最活跃，也最爱发表情包。',
    traits: ['薅羊毛', '自来水', '社群活跃'],
  },
  {
    id: 'reg_laopao',
    name: '老炮儿',
    role: 'regular',
    emoji: '🕵️',
    color: '#7a6a55',
    title: '硬核推理死忠',
    bio: '玩过三百多个本的硬核玩家，嘴毒但识货。他的好评含金量极高，差评也能劝退一片。',
    traits: ['毒舌', '高鉴赏力', 'KOC'],
  },
  // —— 友商 ——
  {
    id: 'rival_qian',
    name: '老钱',
    role: 'rival',
    emoji: '🤵',
    color: '#9a7b3f',
    title: '隔壁「谜雾馆」老板',
    bio: '财大气粗的友商，开高薪挖你的人，还被传抄你的原创本。表面客气，背后下手。',
    traits: ['挖角狂魔', '抄袭嫌疑', '资本玩家'],
  },
  // —— 黄牛 ——
  {
    id: 'scalper_san',
    name: '三哥',
    role: 'scalper',
    emoji: '🧔',
    color: '#8a5a4a',
    title: '望京头号黄牛',
    bio: '脚本秒杀热门场再加价倒卖，表面帮你「场场满」，实则把真玩家挡在门外、暗伤口碑。',
    traits: ['脚本党', '加价倒卖', '笑面虎'],
  },
  // —— 探店达人 ——
  {
    id: 'inf_yuan',
    name: '小圆',
    role: 'influencer',
    emoji: '🤳',
    color: '#c98a3c',
    title: '本地万粉探店达人',
    bio: '一条视频能带一波客，也能阴阳你一波。要坑位费要接待规格，捧你踩你只在一念间。',
    traits: ['流量密码', '双刃剑', '要坑位费'],
  },
  // —— 房东 ——
  {
    id: 'landlord_wang',
    name: '王叔',
    role: 'landlord',
    emoji: '👴',
    color: '#6b7a5a',
    title: '胡同房东',
    bio: '精得很的老北京房东，租金水分大、记仇。砍价砍狠了，往后涨租、找茬全等着你。',
    traits: ['老江湖', '记仇', '坐地起价'],
  },
  // —— 差评人 ——
  {
    id: 'critic_anon',
    name: '匿名差评人',
    role: 'critic',
    emoji: '🥷',
    color: '#777',
    title: '神出鬼没的一星刺客',
    bio: '可能是真受了委屈，也可能是友商雇的水军。一条小作文挂在首屏，路人缘说没就没。',
    traits: ['小作文', '真假难辨', '舆论推手'],
  },
  // —— 店务 ——
  {
    id: 'staff_front',
    name: '前台·豆豆',
    role: 'staff',
    emoji: '💁',
    color: '#5fa3a0',
    title: '你的前台兼眼线',
    bio: '店里风吹草动第一个告诉你。拼场吵架、演员迟到、玩家投诉，都是她来通风报信。',
    traits: ['消息灵通', '机灵', '打工人'],
  },
  // —— 平台/行业 ——
  {
    id: 'ops_dianping',
    name: '点评·阿May',
    role: 'critic',
    emoji: '📊',
    color: '#e08a3c',
    title: '大众点评的运营对接',
    bio: '平台 BD，张口闭口「资源位」「冲榜套餐」。能帮你曝光，也能在抽佣和打榜上拿捏你。',
    traits: ['推销冲榜', '抽佣', '笑里藏刀'],
  },
  {
    id: 'writer_lin',
    name: '编剧·林老师',
    role: 'rival',
    emoji: '✍️',
    color: '#7a6fa0',
    title: '你的原创本作者',
    bio: '才华横溢但脾气大的原创编剧。本子被抄被盗版时找他，但他也随时可能被友商高价撬走。',
    traits: ['有才', '玻璃心', '抢手'],
  },
  {
    id: 'inspector_fire',
    name: '检查·老赵',
    role: 'landlord',
    emoji: '🧯',
    color: '#9a6a4a',
    title: '消防/安全检查',
    bio: '突击检查疏散通道、用电、人数超载。实景机关多的店最怕他，一句「整改」能让你停业。',
    traits: ['铁面', '突击', '一票否决'],
  },
  {
    id: 'player_emo',
    name: '玩家·糖糖',
    role: 'regular',
    emoji: '🧸',
    color: '#d98ab0',
    title: '情感沉浸型玩家',
    bio: '为哭点而来，把演员当真。体验好能成铁粉自来水，体验崩会觉得「被欺骗感情」闹得最凶。',
    traits: ['入戏深', '情绪化', '自来水'],
  },
  {
    id: 'publisher_zhou',
    name: '发行·周哥',
    role: 'rival',
    emoji: '📦',
    color: '#6a8a6a',
    title: '剧本发行商',
    bio: '手握城市限定、独家授权，也管着盗版打击。给你好本，也能因为一场纠纷断你货源。',
    traits: ['卡授权', '渠道为王', '现实'],
  },
  {
    id: 'lawyer_he',
    name: '法务·何律',
    role: 'rival',
    emoji: '⚖️',
    color: '#5a6a8a',
    title: '版权/合规顾问',
    bio: '抄袭、盗版、合同纠纷找他。能帮你维权，也会泼冷水：「证据不足，打了也白打。」',
    traits: ['理性', '泼冷水', '靠谱'],
  },
]

export const NPC_MAP: Record<string, NPC> = Object.fromEntries(NPCS.map((n) => [n.id, n]))

// 角色中文名
export const ROLE_LABEL: Record<string, string> = {
  actor: '演员', regular: '常客', rival: '友商', scalper: '黄牛',
  influencer: '探店达人', landlord: '房东', critic: '差评人', staff: '店务',
}
