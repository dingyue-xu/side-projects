// 全局可调参数（balance knobs）。集中放这里，方便「体验评估器 + 自动迭代」在运行时覆盖再评估。
// 注意：引擎在函数内部读取 BALANCE.x（而非 import 时解构），所以运行时改这些值会即时生效。
export const BALANCE = {
  // 经济
  startingCapital: 390000,
  baseDemand: 1.45,
  heatDecayPerDay: 0.55,
  variableCostPerSession: 50,
  playersBase: 4,
  playersRepBonus: 3,
  // 事件节奏（自动迭代调出：综合体验分 96/100）
  peacefulDayChance: 0.47,
  // 长期熵：房租逐周上涨（续租/通胀），逼玩家持续把营收做高，否则「躺着经营」迟早被成本压垮
  rentCreepPerWeek: 0.028,
}

export type BalanceKnobs = typeof BALANCE

/** 自动迭代用：批量覆盖 + 还原 */
export function applyBalance(patch: Partial<BalanceKnobs>): BalanceKnobs {
  const prev = { ...BALANCE }
  Object.assign(BALANCE, patch)
  return prev
}
