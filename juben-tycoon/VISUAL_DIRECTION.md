# 视觉方向 & 素材（先读这个再改 UI）

> 来源：用户的 `ASSET_LIBRARY.md` / `CLAUDE_HANDOFF.md`。本文件把其要点对齐到**本仓库实际的代码结构**。
> ⚠️ 注意：那两份 handoff 描述的是另一套 Codex 版代码（单体 `src/App.tsx` + `gameData.ts` + `gameEngine.ts`，React 19）。
> **本仓库的可玩应用是 `juben-tycoon/`（模块化 + Zustand + React 18）**，文件结构不同，但**视觉方向与素材通用**。改 UI/头像前先读本文件，别脱离既有方向重做。

## 主视觉方向：Drama Feed

像一个“剧本杀店主的危机指挥台”：老板在盯着小红书 / 大众点评 / 微信群 / 店内八卦，一边做决策。
不要做成电子表格、tycoon 仪表盘或通用管理模拟。

- 暖米白面板（`--panel #fff` / `--bg #efece6`）、墨黑文字（`--ink`）
- 危机红（`--rep/--neg`）、现金绿（`--cash`）、热度橙（`--heat`）
- 克制但紧张；社群运营工具 + 叙事卡牌的混合气质
- **避免**：奇幻 RPG 美术、紫/蓝渐变、装饰性光斑、巨型营销首屏、过度可爱的卡通头像、满屏裸露公式数字

参考图（放 `public/assets/reference/`）：`ui-concept-2-drama-feed.png` 为主，`-1-crisis-desk` 偏仪表盘，`-3-decision-table` 偏档案/里程碑结算。

## 头像（真实肖像，不要 emoji 漂移）

- 素材：`public/assets/npc-portraits.png` —— 3 列 × 2 行、6 格半写实北京沉浸式娱乐圈肖像。
- 接线：`src/data/assets.ts`（精灵图 + cell 映射）→ `src/engine/cast.ts`（`faceOf` 带 `cell`）→ `src/components/Avatar.tsx`（裁剪精灵图，缺图自动回退 emoji）。
- cell 映射（对齐 ASSET_LIBRARY）：0 你·店主 / 1 人气DM(`a_xiaolu`) / 2 老客车头(`reg_ak`) / 3 挑剔玩家(`reg_laopao`) / 4 友商老板(`rival_qian`) / 5 房东(`landlord_wang`)。
- 其余 NPC（黄牛/达人/前台等）暂用 emoji，等扩充精灵图后再补 `PORTRAIT_CELL`。

### 加新肖像表
扩到 18+ 张时（事件对话需要），按 ASSET_LIBRARY 的命名：`public/assets/npcs/npc-sheet-01.png` + `npc-manifest.json`，并在 `assets.ts` 里加 `sheet/cols/rows/cell`。生成 prompt 见 ASSET_LIBRARY.md。

## 重要约束（无图也要守住）
暖米白危机室 UI、克制的舆情红、具体的 NPC 身份、真实北京剧本杀细节、用“定性后果反馈 + 预估数值”而非纯公式。

## 把图放进来
本仓库未携带二进制素材。把 `npc-portraits.png` 和三张 `ui-concept-*.png` 放到：
```
juben-tycoon/public/assets/npc-portraits.png
juben-tycoon/public/assets/reference/ui-concept-*.png
```
dev / 普通构建 / Pages 都会自动显示肖像；单文件 `play.html` 不内联 public 图片，会显示 emoji 回退。
