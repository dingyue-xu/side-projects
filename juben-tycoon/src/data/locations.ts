import type { Location, DecorPlan } from '../types'

// 北京地段：高曝光高租金 vs 偏远低租金靠私域
export const LOCATIONS: Location[] = [
  {
    id: 'gulou',
    name: '鼓楼·胡同店',
    district: '东城',
    exposure: 1.35,
    rentRange: [11000, 17000],
    rentReserve: 12800, // 房东其实 12.8k 就肯签（月租约 5.5 万）
    privateBonus: 0.9,
    style: '复古沉浸',
    capacityRooms: 2,
    desc: '游客与年轻人都爱来，自带流量。但胡同房东精得很，租金水分大，还得防隔壁投诉扰民。',
  },
  {
    id: 'wudaokou',
    name: '五道口·学区店',
    district: '海淀',
    exposure: 1.15,
    rentRange: [8500, 13000],
    rentReserve: 9800,
    privateBonus: 1.1,
    style: '欢乐快节奏',
    capacityRooms: 2,
    desc: '学生客群庞大、复购高、价格敏感。私域一旦盘活非常稳，但旺季扎堆友商，挖角凶。',
  },
  {
    id: 'shuangjing',
    name: '双井·写字楼店',
    district: '朝阳',
    exposure: 1.05,
    rentRange: [13000, 20000],
    rentReserve: 15500,
    privateBonus: 1.0,
    style: '高端情感',
    capacityRooms: 3,
    desc: '白领下班就近消费，客单价高、肯为沉浸感买单。房租也最贵，三间房是把双刃剑。',
  },
  {
    id: 'tongzhou',
    name: '通州·社区店',
    district: '通州',
    exposure: 0.8,
    rentRange: [5000, 8500],
    rentReserve: 6000,
    privateBonus: 1.35,
    style: '邻里熟客',
    capacityRooms: 2,
    desc: '租金最低，公域曝光弱到几乎为零。这里只能靠私域和口碑滚雪球，是「慢但稳」的活法。',
  },
]

// 装修方案：租现成 vs 毛坯自改
export const DECOR_PLANS: DecorPlan[] = [
  {
    id: 'turnkey',
    name: '接手现成装修',
    cost: 55000,
    immersion: 45,
    desc: '前一家店跑路留下的场地，风格固定、能凑合用。省钱，但沉浸感一般，老玩家一眼看穿是二手。',
  },
  {
    id: 'light',
    name: '毛坯·轻改造',
    cost: 120000,
    immersion: 65,
    desc: '基础声光电 + 主题软装。性价比之选，沉浸感够用，给后续上新本留了余地。',
  },
  {
    id: 'deep',
    name: '毛坯·重度沉浸',
    cost: 220000,
    immersion: 88,
    desc: '机关、实景、定制灯光音效拉满。沉浸感顶配、口碑发动机，但这是新手破产第一杀手。',
  },
]
