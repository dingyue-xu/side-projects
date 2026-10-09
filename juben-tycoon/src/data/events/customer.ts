import type { GameEvent } from '../../types'

// 顾客类：差评、退本、拼场纠纷、公开吐槽、演员玩家恋爱闹店
export const CUSTOMER_EVENTS: GameEvent[] = [
  // —— 招牌连锁的起点：一条差评 ——
  {
    id: 'cust_bad_review',
    category: 'customer',
    title: '一条三星差评',
    speaker: '差评玩家·匿名',
    anchorNpc: 'critic_anon',
    description:
      '「DM全程念稿、演员明显赶场，最后凶手还剧透了，氛围全无。」——一桌散客在点评上挂了三星，配图是你家有点空的还原区。这条正挂在店铺页第一屏。',
    dialogue: [
      { npcId: 'staff_front', text: '老板，刚出本那桌走的时候脸就不太好看……我刷点评看到了，三星，还配了图。', mood: 'sad' },
      { npcId: 'critic_anon', text: '不是我矫情，298 一位玩成这样？DM 念稿念得我尴尬癌都犯了。', mood: 'angry' },
      { npcId: 'self', text: '（第一屏挂着这条，今晚的客怕是要被劝退。得赶紧处理。）', mood: 'neutral' },
    ],
    trigger: { weight: 10, conditions: [{ kind: 'channel', key: 'dianpingOn', value: true }], cooldownDays: 6 },
    options: [
      {
        label: '逐条回复 + 私信补偿一张体验券',
        effects: { cash: -200, reputation: 4, customerLoyalty: 3, setFlags: { reviewHandledWell: true } },
        resultText: '你诚恳回复并送了补偿券。对方追评「老板态度不错」，路人缘拉回来一点。',
        reply: { npcId: 'critic_anon', text: '……行吧，老板态度还可以，我加一星。下次别念稿了啊。', mood: 'neutral' },
      },
      {
        label: '公开回怼：「散客不懂还原本就别玩硬核」',
        effects: { reputation: -6, incFlags: { badReviewCount: 1 }, setFlags: { reviewHandledBadly: true } },
        resultText: '你怼得很爽。但截图已经被人保存……',
        reply: { npcId: 'critic_anon', text: '哦？店家亲自下场教育消费者了是吧。截图我收好了，等着。', mood: 'smug' },
        // 处理不当 → 大概率发酵上小红书
        chains: [{ eventId: 'cust_xhs_ferment', probability: 0.8, delayDays: 2 }],
      },
      {
        label: '冷处理，不回复',
        effects: { reputation: -2 },
        resultText: '你选择不理会。差评继续挂着，慢慢沉下去——但也可能有人盯上。',
        chains: [{ eventId: 'cust_xhs_ferment', probability: 0.25, delayDays: 3 }],
      },
    ],
  },

  // —— 连锁第二环：发酵上小红书（仅连锁触发）——
  {
    id: 'cust_xhs_ferment',
    anchorNpc: 'critic_anon',
    dialogue: [
      { npcId: 'staff_front', text: '老板，那条差评被人搬到小红书了…现在标题是《花298被老板教育做人》，正在涨赞。', mood: 'shock' },
      { npcId: 'critic_anon', text: '截图我可留着呢。评论区已经有人对号入座了哦，老板还硬气吗？', mood: 'smug' },
      { npcId: 'self', text: '（一条差评发酵成万赞笔记…这波接不好，真要伤筋动骨。）', mood: 'sad' },
    ],
    category: 'gossip',
    title: '上小红书了：#北京这家剧本杀别去',
    speaker: '小红书·万赞笔记',
    description:
      '那位玩家把你回怼的截图发了小红书，标题《花298被老板教育做人》。评论区开始有人对号入座:「我上次也觉得演员敷衍」。笔记还在涨。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '正式道歉长文 + 全单退款 + 邀请回访',
        effects: { cash: -1500, reputation: 6, customerLoyalty: 4, setFlags: { reviewHandledBadly: false } },
        resultText: '低头认错 + 真金白银退款，舆论转向「至少敢担责」。出血止住了。',
      },
      {
        label: '硬刚到底，发小作文逐条反驳',
        effects: { reputation: -12, customerSize: -8, incFlags: { prCrisis: 1 } },
        resultText: '你越解释对线越多，笔记冲上同城热门。口碑暴跌，老客开始观望。',
        // 口碑暴跌 → 老客流失
        chains: [{ eventId: 'cust_regulars_leaving', probability: 0.7, delayDays: 4 }],
      },
      {
        label: '冷处理，等它自己沉',
        effects: { reputation: -5, customerSize: -3 },
        resultText: '你忍住没回。一周后热度确实退了，但「服务差」的印象留在了搜索结果里。',
        chains: [{ eventId: 'cust_regulars_leaving', probability: 0.3, delayDays: 5 }],
      },
      {
        label: '借势营销：自黑做个「老板挨骂」短视频',
        requires: [{ kind: 'channel', key: 'dianpingOn', value: true }],
        effects: { cash: -800, reputation: 8, customerSize: 6, contentHeatTop: 5 },
        resultText: '你把危机做成段子，自黑认错还顺手宣传新本。一波路人转粉，反而涨了。高风险高回报。',
      },
    ],
  },

  // —— 连锁第三环：老客流失 ——
  {
    id: 'cust_regulars_leaving',
    anchorNpc: 'reg_ak',
    dialogue: [
      { npcId: 'staff_front', text: '老板…私域群里气氛不对，刚又默默退了俩老客。', mood: 'sad' },
      { npcId: 'reg_ak', text: '最近口碑不太行啊，我先观望观望，不太敢约了。', mood: 'neutral' },
      { npcId: 'self', text: '（私域是命根子，老客这一松动，复购就要塌。得赶紧稳住。）', mood: 'shock' },
    ],
    category: 'customer',
    title: '老客群里在「跑路」',
    speaker: '私域社群',
    description:
      '几个常来的老玩家在群里发「最近口碑不太行，先观望」，有人默默退了群。私域是你的命根子，这波要是稳不住，复购就塌了。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '老客专场 + 五折回馈 + 老板亲自陪玩',
        effects: { cash: -2000, customerLoyalty: 8, customerSize: 5, reputation: 3 },
        resultText: '你拉下脸亲自陪了两场，老客被诚意打动，群里气氛回暖。钱花得值。',
      },
      {
        label: '发个红包雨敷衍一下',
        effects: { cash: -600, customerLoyalty: 2, customerSize: -4 },
        resultText: '红包是抢了，但没人觉得问题解决了。又走了一小批。',
      },
      {
        label: '不挽留，专注拉新',
        effects: { customerSize: -12, reputation: -2 },
        resultText: '你赌新客能补上。老客寒了心，私域规模明显缩水——这是慢性失血。',
      },
    ],
  },

  // —— 拼场纠纷 ——
  {
    id: 'cust_pinchang_dispute',
    anchorNpc: 'staff_front',
    dialogue: [
      { npcId: 'staff_front', text: '老板快来！拼场那桌闹起来了，三人队和一对情侣，都要退款。', mood: 'shock' },
      { npcId: 'reg_laopao', text: '我们是来玩本的，不是来看你俩秀恩爱出戏的！这场不值。', mood: 'angry' },
      { npcId: 'player_emo', text: '我们怎么了…正常玩游戏啊，凭什么说我们？', mood: 'sad' },
    ],
    category: 'customer',
    title: '拼场两桌吵起来了',
    speaker: '前台',
    description:
      '周末满场，一个三人小队和一对情侣拼了同一场恐怖本。情侣全程搂搂抱抱出戏，三人队当场黑脸:「我们是来玩本的不是来看你俩的。」现在两边都要求退款。',
    trigger: { weight: 7, minDay: 3, cooldownDays: 5 },
    options: [
      {
        label: '给三人队免单，情侣照常收费',
        effects: { cash: -450, reputation: 2, customerLoyalty: 2 },
        resultText: '你判了「谁出戏谁担责」。三人队满意，情侣悻悻离开，大体服众。',
      },
      {
        label: '各退一半，和稀泥',
        effects: { cash: -600, reputation: -1 },
        resultText: '两边都不太满意，但没闹大。下次得想想拼场规则了。',
      },
      {
        label: '坚持不退，按规则办',
        effects: { reputation: -4, incFlags: { badReviewCount: 1 } },
        resultText: '你搬出「拼场须知」。三人队当场就要去写差评……',
        chains: [{ eventId: 'cust_bad_review', probability: 0.5, delayDays: 1 }],
      },
    ],
  },

  // —— 玩家公开吐槽演员 ——
  {
    id: 'cust_roast_actor',
    anchorNpc: 'reg_laopao',
    dialogue: [
      { npcId: 'reg_laopao', text: '点评说一句：那个演恶人的，油得不行，全程抢戏，建议回炉。', mood: 'smug' },
      { npcId: 'a_xiaolu', text: '老板…我那是入戏好吧，怎么就成抢戏了。你怎么看？', mood: 'sad' },
      { npcId: 'self', text: '（护短伤路人缘，压演员又寒了台柱的心。两头不讨好。）', mood: 'neutral' },
    ],
    category: 'customer',
    title: '玩家公开点名吐槽演员',
    speaker: '玩家',
    description:
      '一桌玩家在点评里点名:「那个演恶人的演员油得不行，一直抢戏。」被点的正是你的台柱。台柱看到后心气有点不顺，在问你「老板你怎么看」。',
    trigger: { weight: 6, conditions: [{ kind: 'hasActorTag', tag: '台柱' }], cooldownDays: 8 },
    options: [
      {
        label: '护短：公开力挺演员',
        effects: { reputation: -2, actor: { target: { select: 'byTag', tag: '台柱' }, relationship: 8, morale: 6 } },
        resultText: '你公开站演员。台柱很感动、更卖力，但少数玩家觉得你「护短不听劝」。',
      },
      {
        label: '私下沟通，让演员收着点',
        effects: { reputation: 2, actor: { target: { select: 'byTag', tag: '台柱' }, relationship: -3, morale: -4 } },
        resultText: '你私下提了意见。演出确实收敛了，但台柱有点憋屈。',
      },
      {
        label: '甩锅给玩家「不懂表演」',
        effects: { reputation: -5, actor: { target: { select: 'byTag', tag: '台柱' }, relationship: 4 } },
        resultText: '演员爽了，但你又树了个会写小作文的敌人。',
        chains: [{ eventId: 'cust_bad_review', probability: 0.4, delayDays: 2 }],
      },
    ],
  },
]
