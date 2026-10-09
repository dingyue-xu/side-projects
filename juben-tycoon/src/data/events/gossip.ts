import type { GameEvent } from '../../types'

// 突发「瓜」类（最重要）：店内八卦/狗血/舆情上小红书，玩家做危机公关。
// 危机公关四件套：道歉补偿 / 强硬回应 / 冷处理 / 借势营销
export const GOSSIP_EVENTS: GameEvent[] = [
  // —— 演员和玩家谈恋爱，闹到店里 ——
  {
    id: 'gossip_actor_player_romance',
    category: 'gossip',
    title: '演员和常客恋爱后闹到店里了',
    speaker: '前台·豆豆',
    anchorNpc: 'reg_ak',
    description:
      '你家演员私下和常客阿K处了对象，结果今天另一个也喜欢这演员的常客堵在店门口。两人当众争风吃醋，演员夹在中间，路人已经举起手机在拍了。',
    dialogue: [
      { npcId: 'staff_front', text: '老板！不好了，阿K 和另一个常客在门口吵起来了，都是为了小北……好多人围观！', mood: 'shock' },
      { npcId: 'reg_ak', text: '我跟小北是真心的！你们少在这儿乱嚼舌根！', mood: 'angry' },
      { npcId: 'inf_yuan', text: '（路过举起手机）哟，剧本杀店里的修罗场，这素材我先拍为敬～', mood: 'smug' },
      { npcId: 'self', text: '（再不控场，今晚就要上同城热门了。）', mood: 'shock' },
    ],
    trigger: {
      weight: 6,
      conditions: [{ kind: 'hasActorTag', tag: '人气王' }],
      minDay: 10,
      cooldownDays: 14,
    },
    options: [
      {
        label: '当场控场，把人请进办公室私聊降温',
        effects: { cash: -300, reputation: 1, actor: { target: { select: 'byTag', tag: '人气王' }, morale: -3 } },
        resultText: '你眼疾手快把事态摁了下去，没让它发酵。演员有点社死，但店面体面保住了。',
      },
      {
        label: '立规矩:禁止演员和玩家私下发展',
        effects: { reputation: 2, actor: { target: { select: 'byTag', tag: '人气王' }, relationship: -8, morale: -6 } },
        resultText: '你借机立了「演员玩家不得私联」的店规。专业了，但人气王觉得你管太宽，心生芥蒂。',
        chains: [{ eventId: 'actor_quit_threat', probability: 0.3, delayDays: 5 }],
      },
      {
        label: '没控住，视频传上了小红书',
        effects: { reputation: -6, incFlags: { prCrisis: 1 } },
        resultText: '围观视频配文《剧本杀演员的修罗场》发上了小红书，开始发酵……',
        chains: [{ eventId: 'gossip_xhs_trending', probability: 0.85, delayDays: 2 }],
      },
    ],
  },

  // —— 通用「瓜上热门」危机公关大节点（四件套齐活）——
  {
    id: 'gossip_xhs_trending',
    anchorNpc: 'critic_anon',
    dialogue: [
      { npcId: 'staff_front', text: '老板！咱家的瓜挂同城热门第三了，2万+赞…评论区开始扒别的黑料了。', mood: 'shock' },
      { npcId: 'inf_yuan', text: '（来蹭热度）这流量泼天富贵啊，老板接得住吗？', mood: 'smug' },
      { npcId: 'self', text: '（道歉、硬刚、冷处理、还是借势？这一步决定生死。）', mood: 'angry' },
    ],
    category: 'gossip',
    title: '你家的瓜冲上小红书同城热门',
    speaker: '小红书·同城热门',
    description:
      '不管起因是什么，现在你家的瓜挂在同城热门第三，2万+赞。评论区一半看热闹、一半开始扒你家别的黑料。流量是泼天的，是福是祸全看你这波怎么接。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '道歉补偿:诚恳致歉 + 整改 + 老客福利',
        effects: { cash: -2500, reputation: 5, customerLoyalty: 5, setFlags: { prCrisis: false } },
        resultText: '低姿态 + 真补偿，舆论评价「至少有担当」。出血止住，口碑软着陆。',
      },
      {
        label: '强硬回应:发声明澄清，该硬刚硬刚',
        effects: { reputation: -8, customerSize: -10 },
        resultText: '你强硬表态。支持者叫好，但对线把事越闹越大，路人缘继续流失。要么封神要么翻车——这次偏翻车。',
        chains: [{ eventId: 'cust_regulars_leaving', probability: 0.5, delayDays: 3 }],
      },
      {
        label: '冷处理:不回应，关评论等它沉',
        effects: { reputation: -4, customerSize: -4 },
        resultText: '你按住不动。热度三天后退潮，但搜索结果里留了道疤。无功无过的保命选项。',
      },
      {
        label: '借势营销:把瓜做成内容，反向引流新本',
        requires: [{ kind: 'resource', key: 'reputation', op: '>=', value: 45 }],
        lockedHint: '口碑≥45 才有底气这么玩',
        effects: { cash: -1000, reputation: 6, customerSize: 14, contentHeatTop: 8 },
        resultText: '你四两拨千斤,把热度导向新本预告 + 自黑营销。泼天流量接住了，黑红也是红。教科书级公关。',
      },
    ],
  },

  // —— 店内冲突的瓜 ——
  {
    id: 'gossip_staff_conflict',
    anchorNpc: 'a_qiqi',
    dialogue: [
      { npcId: 'staff_front', text: '老板…柒柒和陌陌私下互怼、顺带吐槽店里管理的聊天记录，被发小红书了。', mood: 'sad' },
      { npcId: 'a_qiqi', text: '我就是发个牢骚！谁知道被截图挂出去…', mood: 'cry' },
      { npcId: 'self', text: '（「演员都嫌弃自己店」这观感太差，内外都得稳。）', mood: 'angry' },
    ],
    category: 'gossip',
    title: '员工内讧的聊天记录被曝',
    speaker: '小红书',
    description:
      '你家两个演员私下吐槽彼此、顺带吐槽店里管理的微信聊天记录，被截图发到了小红书《扒一扒某剧本杀店内幕》。虽然都是气话，但「演员都嫌弃自己店」这观感很差。',
    trigger: {
      weight: 4,
      conditions: [{ kind: 'flag', key: 'someActorAngry', op: '==', value: true }],
      minDay: 12,
      cooldownDays: 16,
    },
    options: [
      {
        label: '内部开诚布公谈一次 + 对外淡化',
        effects: { cash: -500, reputation: 1, actor: { target: { select: 'lowestRelationship' }, relationship: 6, morale: 4 } },
        resultText: '你把矛盾摊开聊透，团队气顺了，对外也没追着回应。内外都稳住了。',
      },
      {
        label: '公开切割，暗示要处理涉事员工',
        effects: { reputation: -2, actor: { target: { select: 'lowestRelationship' }, relationship: -10, morale: -8 } },
        resultText: '你对外撇清了，但员工感到被当枪使，团队信任受损。按下葫芦浮起瓢。',
        chains: [{ eventId: 'actor_quit_threat', probability: 0.45, delayDays: 4 }],
      },
      {
        label: '冷处理',
        effects: { reputation: -3 },
        resultText: '你不接招。瓜慢慢凉了，但内部的疙瘩没解开，留着隐患。',
      },
    ],
  },

  // —— 探店达人翻车 ——
  {
    id: 'gossip_influencer_visit',
    anchorNpc: 'inf_yuan',
    dialogue: [
      { npcId: 'inf_yuan', text: '老板你好～我可以来免费体验出条视频，正常测评不收费，但希望接待到位哦。', mood: 'smug' },
      { npcId: 'staff_front', text: '（小声）老板，话里有话…接待不到位，测评风向你懂的。', mood: 'neutral' },
      { npcId: 'self', text: '（万粉达人，一条视频能带一波客，也能阴阳你一波。机会与风险并存。）', mood: 'neutral' },
    ],
    category: 'gossip',
    title: '万粉探店达人要来「测评」',
    speaker: '私信',
    description:
      '一个本地万粉探店达人私信:可以来免费体验出条视频，「正常测评，不收费，但希望接待到位」。话里有话——接待不到位，测评的风向你懂的。机会与风险并存。',
    trigger: {
      weight: 5,
      conditions: [{ kind: 'channel', key: 'dianpingOn', value: true }],
      minDay: 9,
      cooldownDays: 12,
    },
    options: [
      {
        label: '安排最强阵容 + 隐藏福利伺候',
        effects: { cash: -1500, reputation: 4, customerSize: 12, contentHeatAll: 6 },
        resultText: '你拿出最强主演接待，达人出了条好评爆款视频，一波精准流量进店。投入回本了。',
        chains: [{ eventId: 'gossip_influencer_backfire', probability: 0.2, delayDays: 4 }],
      },
      {
        label: '正常接待，不搞特殊',
        effects: { reputation: 1, customerSize: 3 },
        resultText: '你按常规接待。达人体验中规中矩，出了条平淡测评。不功不过。',
      },
      {
        label: '婉拒:「我们不接待探店」',
        effects: { reputation: -1, actor: { target: { select: 'random' }, morale: 2 } },
        resultText: '你硬气拒绝。达人发了句阴阳怪气的动态，但你守住了「不卑不亢」的调性。',
      },
    ],
  },
  {
    id: 'gossip_influencer_backfire',
    anchorNpc: 'inf_yuan',
    dialogue: [
      { npcId: 'inf_yuan', text: '《剧本杀店家的双标接待》——伺候我半天，连个坑位费都不给，呵呵。', mood: 'angry' },
      { npcId: 'staff_front', text: '老板，TA 粉丝跑来店铺页找茬了…被白嫖还挨打。', mood: 'shock' },
      { npcId: 'self', text: '（晒记录公开打脸，还是花钱消灾？）', mood: 'angry' },
    ],
    category: 'gossip',
    title: '达人嫌「招待规格不够」阴阳你',
    speaker: '小红书',
    description:
      '伺候到位了，达人却嫌你没给坑位费，发了条《剧本杀店家的双标接待》小作文阴阳你。粉丝跑来店铺页找茬。被白嫖还挨打。',
    trigger: { weight: 0, chainedOnly: true },
    options: [
      {
        label: '甩出全程招待记录，公开打脸',
        effects: { reputation: 3, customerLoyalty: 4 },
        resultText: '你晒出消费小票和聊天记录自证，路人转而声讨达人「白嫖还碰瓷」。你赢了这局。',
      },
      {
        label: '私了，补个红包息事宁人',
        effects: { cash: -800, reputation: -2 },
        resultText: '你花钱消灾。事是压下去了，但开了「闹一闹就有钱」的坏头。',
      },
    ],
  },
]
