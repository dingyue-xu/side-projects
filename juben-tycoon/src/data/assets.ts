// 视觉素材清单 —— 对齐 ASSET_LIBRARY.md，作为头像/视觉的事实来源。
// 支持多张精灵图（每张 3×2，6 格），可扩到 18+ NPC。缺图各组件自动回退 emoji。
const BASE = ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL) ?? '/'

export interface PortraitSheet { url: string; cols: number; rows: number }

// 精灵表：s1=现有 npc-portraits.png；s2/s3 待补（放 public/assets/npcs/）
export const SHEETS: Record<string, PortraitSheet> = {
  s1: { url: `${BASE}assets/npc-portraits.png`, cols: 3, rows: 2 },
  s2: { url: `${BASE}assets/npcs/npc-sheet-02.png`, cols: 3, rows: 2 },
  s3: { url: `${BASE}assets/npcs/npc-sheet-03.png`, cols: 3, rows: 2 },
}

export interface PortraitSlot { sheet: keyof typeof SHEETS; cell: number }

// id（店主/NPC/演员）→ 精灵表格子。s1 与 ASSET_LIBRARY 的 cell map 对齐。
export const PORTRAIT: Record<string, PortraitSlot> = {
  // —— s1（现有 6 格，已交付）——
  self: { sheet: 's1', cell: 0 }, // 你·店主
  a_xiaolu: { sheet: 's1', cell: 1 }, // 人气 DM/演员
  reg_ak: { sheet: 's1', cell: 2 }, // 老客车头
  reg_laopao: { sheet: 's1', cell: 3 }, // 挑剔/硬核玩家
  rival_qian: { sheet: 's1', cell: 4 }, // 友商老板
  landlord_wang: { sheet: 's1', cell: 5 }, // 房东
  // —— s2（待补：npc-sheet-02.png）——
  scalper_san: { sheet: 's2', cell: 0 }, // 黄牛
  inf_yuan: { sheet: 's2', cell: 1 }, // 探店达人
  critic_anon: { sheet: 's2', cell: 2 }, // 差评/水军
  staff_front: { sheet: 's2', cell: 3 }, // 前台
  reg_meimei: { sheet: 's2', cell: 4 }, // 学生常客
  a_qiqi: { sheet: 's2', cell: 5 }, // 人气王演员
  // —— s3（待补：npc-sheet-03.png，扩充角色）——
  ops_dianping: { sheet: 's3', cell: 0 }, // 平台运营对接
  writer_lin: { sheet: 's3', cell: 1 }, // 原创编剧
  inspector_fire: { sheet: 's3', cell: 2 }, // 消防检查
  player_emo: { sheet: 's3', cell: 3 }, // 情感沉浸玩家
  publisher_zhou: { sheet: 's3', cell: 4 }, // 剧本发行
  lawyer_he: { sheet: 's3', cell: 5 }, // 版权法务
}

export const portraitOf = (id: string | undefined): PortraitSlot | undefined =>
  id == null ? undefined : PORTRAIT[id]
