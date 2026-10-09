把视觉素材放在这里（与 ASSET_LIBRARY.md / src/data/assets.ts 对齐）：

  public/assets/npc-portraits.png                 ← 6 格 NPC 肖像精灵图（3 列 × 2 行）
  public/assets/reference/ui-concept-1-crisis-desk.png
  public/assets/reference/ui-concept-2-drama-feed.png   ← 主视觉方向
  public/assets/reference/ui-concept-3-decision-table.png

说明：
- 代码已接好真实肖像（src/components/Avatar.tsx 用 src/data/assets.ts 的 cell 映射裁剪精灵图）。
- 没有 npc-portraits.png 时，头像自动回退到 emoji，不会报错。
- 放入 PNG 后，dev / 普通构建 / GitHub Pages 都会显示真实肖像。
- 单文件离线版(play.html)不会内联 public 图片，会显示 emoji 回退；要看肖像请用 npm run dev 或部署版。
