import type { GameEvent } from '../../types'

// 演员类：恋爱、罢演、迟到、被挖
export const ACTOR_EVENTS: GameEvent[] = [
  // —— 演员谈恋爱（可能提升默契，也可能闹掰集体跳槽）——
  {
    id: 'actor_office_romance',
    anchorNpc: 'a_xiaolu',
    dialogue: [
      { npcId: 'staff_front', text: '老板，悄悄说…小鹿和陌陌最近黏得不行，下了戏还在排练厅腻歪。', mood: 'shy' },
      { npcId: 'a_xiaolu', text: '哎呀被看出来了…老板你别声张嘛。', mood: 'shy' },
      { npcId: 'a_momo', text: '处得好是神仙CP，处不好…你懂的。看你怎么排了。', mood: 'smug' },
    ],
    category: 'actor',
    title: '店里两个演员好上了',
    speaker: '后台',
    description:
      '你发现两个恋爱脑演员最近眉来眼去，下了戏还在排练厅黏着。同事们有的磕到了、有的翻白眼。处得好是「神仙CP默契拉满」，处不好就是「分手现场全店遭殃」。',
    trigger: {
      weight: 6,
      conditions: [{ kind: 'hasActorTag', tag: '恋爱脑' }],
      minDay: 5,
      cooldownDays: 12,
    },
    options: [
      {
        label: '祝福并排成固定CP档，主推情感本',
        effects: {
          actor: { target: { select: 'byTag', tag: '恋爱脑' }, relationship: 6, morale: 8 },
          contentHeatTop: 4,
          reputation: 2,
        },
        resultText: '你顺水推舟把他俩排成CP档，默契肉眼可见，情感本口碑起飞。当然，也押了注。',
        chains: [{ eventId: 'actor_couple_breakup', probability: 0.35, delayDays: 9 }],
      },
      {
        label: '约法三章：不准影响排班和演出',
        effects: { actor: { target: { select: 'byTag', tag: '恋爱脑' }, relationship: -3, morale: -2 } },
        resultText: '你提前打了预防针。情绪风险降低，但俩人觉得老板有点扫兴。',
      },
      {
        label: '拆档：把俩人排到不同班次',
        effects: { actor: { target: { select: 'byTag', tag: '恋爱脑' }, relationship: -8, morale: -6 } },
        resultText: '你强行拆开。恋爱脑很受伤，干活没了心气，稳定性堪忧。',
        chains: [{ eventId: 'actor_quit_threat', probability: 0.3, delayDays: 6 }],
      },
    ],
  },

  // —— CP分手现场（连锁）——
  {
    id: 'actor_couple_breakup',
    anchorNpc: 'a_momo',
    dialogue: [
      { npcId: 'a_momo', text: '我不干了！谁爱演谁演！（摔剧本）', mood: 'cry' },
      { npcId: 'a_xiaolu', text: '走就走！（黑脸甩门）', mood: 'angry' },
      { npcId: 'staff_front', text: '老板…今晚还有满场的情感本，这俩是主演啊，怎么办？', mood: 'shock' },
    ],
    category: 'actor',
    title: 'CP当众分手了',
    speaker: '后台',
    description:
      '说好的神仙CP，今天在排练厅摔了剧本。一个哭着说不干了，另一个黑脸甩门。今晚还有满场的情感本等着这俩主演……',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '连夜调度，自己顶 + 请外援救场',
        effects: { cash: -1200, reputation: 1, actor: { target: { select: 'lowestStability' }, morale: -2 } },
        resultText: '你花钱请了外援、自己也上阵，场子保住了。钱包和嗓子都很受伤。',
      },
      {
        label: '当和事佬，劝他俩以工作为重',
        effects: { actor: { target: { select: 'byTag', tag: '恋爱脑' }, morale: -4, stability: -6 } },
        resultText: '勉强劝住上了台，但俩人全程貌合神离，玩家明显感觉到尬。',
        chains: [{ eventId: 'cust_bad_review', probability: 0.45, delayDays: 1 }],
      },
      {
        label: '取消今晚的场，全额退款致歉',
        effects: { cash: -2400, reputation: -3, customerLoyalty: -2 },
        resultText: '你壮士断腕取消演出。退款 + 口碑双输，但避免了一场车祸现场。',
      },
    ],
  },

  // —— 罢演 / 撂挑子（连锁产物，也可独立触发）——
  {
    id: 'actor_quit_threat',
    anchorNpc: 'a_xiaolu',
    dialogue: [
      { npcId: 'a_xiaolu', text: '老板，我有点累了，想休息一阵…', mood: 'sad' },
      { npcId: 'staff_front', text: '（小声）翻译一下：要么加钱，要么走人。这周排班全指着 TA 呢。', mood: 'neutral' },
      { npcId: 'self', text: '（招牌演员一走，冲 TA 来的粉丝也带走一半。得权衡。）', mood: 'neutral' },
    ],
    category: 'actor',
    title: '演员撂挑子要辞职',
    speaker: '台柱演员',
    description:
      '一个核心演员甩来微信:「老板我有点累了，想休息一阵。」——翻译过来就是:要么涨钱要么走人。偏偏这周排班全指着TA。',
    trigger: {
      weight: 5,
      conditions: [{ kind: 'flag', key: 'someActorAngry', op: '==', value: true }],
      cooldownDays: 10,
    },
    options: [
      {
        label: '加薪挽留',
        effects: { cash: -1500, actor: { target: { select: 'lowestRelationship' }, relationship: 10, morale: 10 } },
        resultText: '钱到位，心气顺了。但你的薪资盘子又重了一截。',
      },
      {
        label: '动之以情 + 画饼（分红/挑大梁）',
        effects: { actor: { target: { select: 'lowestRelationship' }, relationship: 5, morale: 4 } },
        resultText: '你掏心窝聊了两小时，暂时稳住。饼能撑多久看后续。',
      },
      {
        label: '放人，趁机招新',
        effects: { reputation: -2, customerLoyalty: -3 },
        resultText: '你放了TA走。短期排班吃紧、熟客有点失落，但甩掉了一个不稳定因素。',
        chains: [{ eventId: 'channel_competitor_poach', probability: 0.4, delayDays: 3 }],
      },
    ],
  },

  // —— 迟到 ——
  {
    id: 'actor_late',
    anchorNpc: 'staff_front',
    dialogue: [
      { npcId: 'staff_front', text: '老板，满场的本，主演还没到！玩家都在看表了。', mood: 'shock' },
      { npcId: 'a_qiqi', text: '（电话里）堵在三环了…再有半小时！真的对不起对不起。', mood: 'cry' },
      { npcId: 'self', text: '（换人顶替还是硬等？玩家的耐心正在一秒秒耗光。）', mood: 'angry' },
    ],
    category: 'actor',
    title: '开场前20分钟，主演还没到',
    speaker: '前台',
    description:
      '满座的场子，DM在催，玩家在等，主演的电话一直占线。终于接通:「堵在三环了，再有半小时……」玩家已经开始看表了。',
    trigger: {
      weight: 6,
      conditions: [{ kind: 'flag', key: 'hasUnstableActor', op: '==', value: true }],
      cooldownDays: 5,
    },
    options: [
      {
        label: '换人顶替 + 给玩家送饮料安抚',
        effects: { cash: -150, reputation: -1, actor: { target: { select: 'lowestStability' }, morale: -2 } },
        resultText: '你临时换了多面手顶上，送了饮料。玩家体谅，平稳度过。',
      },
      {
        label: '硬等，全场陪聊撑时间',
        effects: { reputation: -3, customerLoyalty: -2 },
        resultText: '你尬聊了半小时等人。玩家体验打折，但好歹原班人马上了。',
        chains: [{ eventId: 'cust_bad_review', probability: 0.35, delayDays: 1 }],
      },
      {
        label: '回头重罚迟到演员',
        effects: { actor: { target: { select: 'lowestStability' }, relationship: -6, morale: -5, stability: 4 } },
        resultText: '你罚了款立了规矩。以后是准时了，但演员心里记了一笔。',
      },
    ],
  },
]
