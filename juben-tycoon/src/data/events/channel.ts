import type { GameEvent } from '../../types'

// 渠道类：黄牛抢场、点评打榜、恶意刷差评、友商挖人
export const CHANNEL_EVENTS: GameEvent[] = [
  // —— 黄牛用脚本抢光热门场（表面满座、真玩家约不到、口碑暗伤）——
  {
    id: 'channel_scalper',
    category: 'channel',
    title: '黄牛脚本抢光了周末场',
    speaker: '黄牛·三哥',
    anchorNpc: 'scalper_san',
    description:
      '你家热门本周末两天的场，开放预约3秒被抢空。一查全是黄牛号，转手加价倒卖。表面满座一片繁荣，可真玩家根本约不到，私域群里已经在骂「这店是不是饥饿营销」。',
    dialogue: [
      { npcId: 'staff_front', text: '老板，周末两天的场又是 3 秒清空，全是那几个眼熟的号……三哥的脚本。', mood: 'sad' },
      { npcId: 'scalper_san', text: '哎老板，咱俩谁跟谁。你家场场满，我赚个辛苦钱，双赢嘛～要不要合作?', mood: 'smug' },
      { npcId: 'reg_ak', text: '（私域群里）这店是搞饥饿营销吧?真玩家根本约不到，呵呵。', mood: 'angry' },
    ],
    trigger: {
      weight: 7,
      conditions: [
        { kind: 'channel', key: 'dianpingOn', value: true },
        { kind: 'resource', key: 'reputation', op: '>=', value: 55 },
      ],
      minDay: 8,
      cooldownDays: 10,
    },
    options: [
      {
        label: '上实名预约 + 人工审核，封黄牛号',
        effects: { cash: -500, reputation: 4, customerLoyalty: 5, customerSize: 4 },
        resultText: '你加了实名核验，黄牛号被一锅端。真玩家约上了，私域口碑回正。麻烦但正确。',
      },
      {
        label: '睁只眼闭只眼，反正场场满',
        effects: { cash: 800, reputation: -8, customerLoyalty: -6, setFlags: { scalperIgnored: true } },
        resultText: '短期营收好看，但「黄牛店」的标签贴上了。真爱粉正在流失……',
        chains: [{ eventId: 'cust_xhs_ferment', probability: 0.4, delayDays: 4 }],
      },
      {
        label: '干脆自己跟黄牛合作分成',
        effects: { cash: 1500, reputation: -12, customerSize: -8, incFlags: { prCrisis: 1 } },
        resultText: '黑钱真香，但纸包不住火。一旦被扒，这就是社死级别的瓜。',
        chains: [{ eventId: 'channel_scalper_exposed', probability: 0.6, delayDays: 6 }],
      },
    ],
  },
  {
    id: 'channel_scalper_exposed',
    anchorNpc: 'critic_anon',
    dialogue: [
      { npcId: 'reg_laopao', text: '我扒到了——这店家自己跟黄牛分成的聊天记录，发帖了。', mood: 'angry' },
      { npcId: 'rival_qian', text: '（路过）哎哟，自己养黄牛？这瓜可不小啊。', mood: 'smug' },
      { npcId: 'self', text: '（聊天记录怎么漏的…现在同城圈都在看，同行也来踩。）', mood: 'shock' },
    ],
    category: 'gossip',
    title: '「店家勾结黄牛」被扒了',
    speaker: '小红书·维权帖',
    description:
      '有玩家扒出你和黄牛的分成聊天记录（不知道哪个环节漏的），发帖《剧本杀店家自己养黄牛》。同城圈炸了，同行也来踩一脚。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '认账整改 + 老客补偿',
        effects: { cash: -3000, reputation: -6, customerLoyalty: 3 },
        resultText: '你认了、赔了、立整改。元气大伤但保住了底线，没有彻底社死。',
      },
      {
        label: '矢口否认，说是同行陷害',
        effects: { reputation: -15, customerSize: -15 },
        resultText: '没人信。口碑塌方，老客大批退群。这一跤摔得很重。',
      },
    ],
  },

  // —— 被恶意刷差评 ——
  {
    id: 'channel_review_bomb',
    anchorNpc: 'ops_dianping',
    dialogue: [
      { npcId: 'staff_front', text: '老板！一夜涌进十几条一星，措辞跟复制粘贴似的，评分从4.8掉到4.3了。', mood: 'shock' },
      { npcId: 'ops_dianping', text: '我们核查过了，证据不足，不予删除哦。要不…上个推广套餐对冲一下？', mood: 'smug' },
      { npcId: 'self', text: '（八成是友商雇的水军。申诉、刷真实好评、还是公开撕？）', mood: 'angry' },
    ],
    category: 'channel',
    title: '一夜之间多了十几条一星',
    speaker: '运营后台',
    description:
      '昨晚到今早，店铺页突然涌入十几条内容雷同的一星差评，措辞像复制粘贴。评分从4.8掉到4.3。八成是友商雇的水军，但平台说「证据不足不予删除」。',
    trigger: {
      weight: 5,
      conditions: [{ kind: 'channel', key: 'dianpingOn', value: true }],
      minDay: 10,
      cooldownDays: 12,
    },
    options: [
      {
        label: '向平台申诉 + 发动真老客刷真实好评',
        effects: { cash: -300, reputation: 3, customerLoyalty: 4 },
        resultText: '你两手抓:申诉留证据，同时请老客写真实体验。评分慢慢爬回来。',
      },
      {
        label: '花钱找「公关」对冲刷好评',
        effects: { cash: -2000, reputation: 1, setFlags: { boughtFakeReviews: true } },
        resultText: '评分是拉回来了，但你也下了水。要是哪天平台查刷分……',
        chains: [{ eventId: 'channel_review_bomb_backfire', probability: 0.3, delayDays: 7 }],
      },
      {
        label: '截图挂出来，公开声讨友商',
        effects: { reputation: -2, customerLoyalty: 2, incFlags: { feudWithRival: 1 } },
        resultText: '你把矛头公开指向友商。粉丝声援你，但也彻底撕破脸，结了梁子。',
        chains: [{ eventId: 'industry_rival_plagiarism', probability: 0.35, delayDays: 8 }],
      },
    ],
  },
  {
    id: 'channel_review_bomb_backfire',
    anchorNpc: 'ops_dianping',
    dialogue: [
      { npcId: 'ops_dianping', text: '通知一下：平台搞刷分专项清查，你买的那批好评判违规了，店铺降权处理。', mood: 'neutral' },
      { npcId: 'self', text: '（搜索排名暴跌…当初不该走这步。认罚老实做吧。）', mood: 'sad' },
    ],
    category: 'channel',
    title: '平台清查刷分，殃及池鱼',
    speaker: '平台通知',
    description:
      '平台搞了波刷分专项清查，你买的那批好评被判违规，店铺被降权处理，搜索排名暴跌。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '认罚 + 申请恢复，老老实实做',
        effects: { cash: -1000, reputation: -4 },
        resultText: '降权要熬一阵子才能恢复。学费交了，以后不碰刷分。',
      },
    ],
  },

  // —— 点评打榜 ——
  {
    id: 'channel_ranking_push',
    anchorNpc: 'ops_dianping',
    dialogue: [
      { npcId: 'ops_dianping', text: '老板！同城剧本杀热门榜活动来了，冲进前十吃一大波公域曝光，机会难得～', mood: 'happy' },
      { npcId: 'ops_dianping', text: '当然得配合买推广位 + 做点限时让利。接得住接不住，看你家底了。', mood: 'smug' },
      { npcId: 'self', text: '（梭哈冲榜很爽，但回不回得来得算明白账。）', mood: 'neutral' },
    ],
    category: 'channel',
    title: '冲一波同城热门榜?',
    speaker: '运营',
    description:
      '平台搞「同城剧本杀热门榜」活动，冲进前十能吃一大波公域曝光。但要砸钱买推广位 + 做活动让利，回不回得来全看你家接得住接不住。',
    trigger: {
      weight: 5,
      conditions: [{ kind: 'channel', key: 'dianpingOn', value: true }],
      minDay: 12,
      cooldownDays: 14,
    },
    options: [
      {
        label: '梭哈冲榜：买推广位 + 限时五折',
        effects: { cash: -4000, reputation: 5, customerSize: 12, contentHeatAll: 6 },
        resultText: '一波猛冲挤进榜单，新客哗哗来。短期肉疼，但流量是真的。',
      },
      {
        label: '小成本试水，只买基础推广',
        effects: { cash: -1200, reputation: 1, customerSize: 4 },
        resultText: '稳健投放，涨了一点曝光。没冲上榜，但也没伤筋动骨。',
      },
      {
        label: '不参与，靠口碑自然增长',
        effects: { reputation: 1 },
        resultText: '你不跟风烧钱。这一波热度没蹭到，省下的钱留给上新本。',
      },
    ],
  },

  // —— 友商挖人 ——
  {
    id: 'channel_competitor_poach',
    anchorNpc: 'rival_qian',
    dialogue: [
      { npcId: 'a_xiaolu', text: '老板…隔壁谜雾馆开了高我30%的薪水，还给分红。我念旧情先来问问你。', mood: 'shy' },
      { npcId: 'rival_qian', text: '（私下）小鹿这样的台柱，跟着我才有前途。老板，你接得住吗？', mood: 'smug' },
      { npcId: 'self', text: '（台柱是招牌，加薪留人现金压力陡增；放走又带走一批粉。）', mood: 'sad' },
    ],
    category: 'channel',
    title: '友商来挖你的台柱',
    speaker: '台柱演员',
    description:
      '台柱犹豫着告诉你:隔壁新开的「谜雾馆」开了高你30%的薪水来挖TA，还承诺给分红。TA念旧情先来问你，但语气里全是「你接不接得住」。',
    trigger: {
      weight: 6,
      conditions: [{ kind: 'hasActorTag', tag: '台柱' }],
      minDay: 9,
      cooldownDays: 10,
    },
    options: [
      {
        label: '咬牙加薪 + 给分红留人',
        effects: { cash: -1000, actor: { target: { select: 'byTag', tag: '台柱' }, relationship: 12, morale: 10 } },
        resultText: '你拿出诚意把人留住了。现金压力陡增，但台柱是你的招牌，值。',
      },
      {
        label: '打感情牌，谈理想谈情怀',
        effects: { actor: { target: { select: 'byTag', tag: '台柱' }, relationship: 4 } },
        resultText: '你聊了情怀。TA感动了一下，但「房贷不会因为情怀变少」——悬着。',
        chains: [{ eventId: 'actor_quit_threat', probability: 0.4, delayDays: 5 }],
      },
      {
        label: '放手祝福，绝不加价',
        effects: { reputation: -3, customerLoyalty: -5, customerSize: -6 },
        resultText: '台柱走了，带走了一批冲着TA来的粉丝。你得赶紧捧个新人。',
      },
    ],
  },
]
