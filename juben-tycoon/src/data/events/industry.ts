import type { GameEvent } from '../../types'

// 行业类：抄袭、盗版流出、主题过气、行业评奖
export const INDUSTRY_EVENTS: GameEvent[] = [
  // —— 友商抄袭原创本 ——
  {
    id: 'industry_rival_plagiarism',
    anchorNpc: 'rival_qian',
    dialogue: [
      { npcId: 'reg_laopao', text: '老板，隔壁谜雾馆新本，核心诡计跟你那原创本几乎一模一样，连台词都改改就用！', mood: 'angry' },
      { npcId: 'writer_lin', text: '我熬夜攒的心血，被人换个皮就端走了…老板你得管！', mood: 'cry' },
      { npcId: 'rival_qian', text: '什么抄不抄的，创意撞车很正常嘛。有本事你去告啊。', mood: 'smug' },
    ],
    category: 'industry',
    title: '友商把你的原创本抄了',
    speaker: '老玩家爆料',
    description:
      '有老玩家发现:隔壁「谜雾馆」新上的本，核心诡计、人物关系跟你的原创本几乎一模一样，连台词都改了改就用。你熬夜攒的心血，被人换个皮就端走了。',
    trigger: {
      weight: 5,
      conditions: [{ kind: 'flag', key: 'hasOriginalScript', op: '==', value: true }],
      minDay: 12,
      cooldownDays: 16,
    },
    options: [
      {
        label: '走法律 + 公开维权，晒创作时间线',
        effects: { cash: -2000, reputation: 6, contentHeatTop: 6, customerLoyalty: 5 },
        resultText: '你晒出完整创作记录硬刚维权。玩家纷纷站你，原创本反而又火了一把。钱花得有价值。',
      },
      {
        label: '私下交涉，要求下架或赔偿',
        effects: { cash: 1000, reputation: -1 },
        resultText: '对方赔了点钱了事。你拿了和解金，但「被抄」这事没能转化成口碑。',
      },
      {
        label: '算了，赶紧出下一个原创本拉开身位',
        effects: { cash: -3000, contentHeatTop: 8, reputation: 3, setFlags: { rushingNewScript: true } },
        resultText: '你不纠缠，直接用新本甩开对手。气魄够，但连续出本的现金压力是真大。',
      },
    ],
  },

  // —— 原创本盗版流出 ——
  {
    id: 'industry_piracy_leak',
    anchorNpc: 'publisher_zhou',
    dialogue: [
      { npcId: 'publisher_zhou', text: '老板，你那原创本的完整电子版，在好几个资源共享群里传开了，含真相和人物本。', mood: 'neutral' },
      { npcId: 'lawyer_he', text: '想维权可以，但盗版源头难锁定，发函下架是治标。先把店内体验做出护城河。', mood: 'neutral' },
      { npcId: 'self', text: '（外地小店随便就能开，我的独家性正在蒸发。）', mood: 'sad' },
    ],
    category: 'industry',
    title: '你的原创本电子版在群里流传',
    speaker: '同行群截图',
    description:
      '有人把你原创本的完整电子文档（含真相和人物本）打包，在好几个「资源共享群」里传。外地小店拿去随便开，你的独家性正在蒸发。',
    trigger: {
      weight: 4,
      conditions: [{ kind: 'flag', key: 'hasOriginalScript', op: '==', value: true }],
      minDay: 14,
      cooldownDays: 20,
    },
    options: [
      {
        label: '全网发函下架 + 升级店内独家机关版',
        effects: { cash: -2500, reputation: 4, contentHeatTop: 5 },
        resultText: '你一边打击盗版，一边把店内体验做成「电子版给不了的实景机关版」。护城河重新挖深。',
      },
      {
        label: '把盗版当宣发，主打「正版沉浸体验」',
        effects: { reputation: 2, customerSize: 5, contentHeatTop: 3 },
        resultText: '你反向操作:盗版越传越多人知道这个本，引流来店体验正版。四两拨千斤。',
      },
      {
        label: '不管了，反正拦不住',
        effects: { contentHeatTop: -8, reputation: -2 },
        resultText: '盗版泛滥，本子迅速烂大街，热度加速过气。独家性没了。',
      },
    ],
  },

  // —— 主题过气 ——
  {
    id: 'industry_genre_outdated',
    anchorNpc: 'reg_laopao',
    dialogue: [
      { npcId: 'staff_front', text: '老板，后台数据不太好看，招牌本预约量连着下滑。', mood: 'sad' },
      { npcId: 'reg_laopao', text: '说句实话，你这本…老套路了，玩腻了。市场风向早变了。', mood: 'neutral' },
      { npcId: 'self', text: '（再不上新本，这桌菜单就要凉透。但上新本是笔大钱。）', mood: 'shock' },
    ],
    category: 'industry',
    title: '你的招牌本明显过气了',
    speaker: '运营数据',
    description:
      '后台数据很诚实:招牌本预约量连续下滑，玩家评价从「好玩」变成「老套路了」。市场风向转了，再不上新本，这桌菜单就要凉透。',
    trigger: {
      weight: 6,
      conditions: [{ kind: 'resource', key: 'contentHeat', op: '<', value: 40 }],
      minDay: 14,
      cooldownDays: 8,
    },
    options: [
      {
        label: '大手笔上一个当红新本',
        effects: { cash: -8000, contentHeatAll: 30, reputation: 4, customerSize: 6 },
        resultText: '你咬牙引进了当红新本，菜单焕新，预约回暖。但这是笔伤筋动骨的大额支出。',
      },
      {
        label: '老本打折促销，先回点血',
        effects: { cash: 1200, contentHeatAll: -5, reputation: -2 },
        resultText: '打折短期冲了点量，但「清仓老本」的信号让品牌掉了价。治标不治本。',
      },
      {
        label: '熬一熬，把现金留着',
        effects: { contentHeatAll: -8, customerSize: -5 },
        resultText: '你选择硬熬。热度继续往下掉，客流肉眼可见地缩水。赌的是别在这期间出事。',
      },
    ],
  },

  // —— 行业评奖 / 峰会（机会型）——
  {
    id: 'industry_award_summit',
    anchorNpc: 'ops_dianping',
    dialogue: [
      { npcId: 'ops_dianping', text: '城市剧本杀峰会邀你报名「年度人气新店」评选，入围能上行业榜、引来达人和媒体。', mood: 'happy' },
      { npcId: 'ops_dianping', text: '不过嘛…报名费 + 物料要花钱，评奖这事多少也得拼点资源，你懂的。', mood: 'smug' },
      { npcId: 'self', text: '（认真冲奖能让品牌跃级，但也可能是交智商税。）', mood: 'neutral' },
    ],
    category: 'industry',
    title: '行业峰会发来评奖邀请',
    speaker: '行业协会',
    description:
      '城市剧本杀峰会邀你报名「年度人气新店」评选。入围能上行业榜、引来探店达人和媒体；但报名费 + 准备展示物料要花钱，且评奖这事多少有点拼资源。',
    trigger: {
      weight: 4,
      conditions: [{ kind: 'resource', key: 'reputation', op: '>=', value: 60 }],
      minDay: 16,
      cooldownDays: 20,
    },
    options: [
      {
        label: '认真备战，冲奖',
        effects: { cash: -3500, reputation: 8, customerSize: 10, contentHeatAll: 5 },
        resultText: '你拿了个奖，达人探店视频一波接一波，曝光暴涨。投入不小，但品牌跃了一级。',
      },
      {
        label: '报个名意思一下，重在参与',
        effects: { cash: -800, reputation: 2 },
        resultText: '你低成本露了个脸，混了点行业人脉。没出彩，但也没白花钱。',
      },
      {
        label: '不参与，把钱花在玩家身上',
        effects: { customerLoyalty: 3 },
        resultText: '你把预算让利给老客做了场回馈。务实，老客很受用。',
      },
    ],
  },
]
