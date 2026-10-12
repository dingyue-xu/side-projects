# 个人小项目

工作之外自己动手做的几个小项目，都是纯前端，可以直接在浏览器里打开。

**在线浏览：** https://dingyue-xu.github.io/side-projects/

| 项目 | 说明 | 入口 |
|---|---|---|
| Équipe 多 Agent 管理平台 | 个人学习与生活的多 Agent 管理工具：通告单式今日看板、可自定义的 Agent 团队、任务、习惯、圆桌讨论与周复盘。公开版数据存浏览器本地，AI 功能在 Claude 内运行的版本可用 | `equipe/`（单文件，无依赖） |
| 剧本杀店经营模拟器 | 事件驱动的经营模拟游戏：24 个事件、15 个 NPC，房东砍价、招演员、舆情流。写了蒙特卡洛体验评估器和自动调参，把综合体验分从 63 调到 96 | `juben-tycoon/play.html`（单文件，可离线玩）；源码 React 18 + TypeScript + Zustand |
| MVP 验证池 | 零运行成本的落地页组合，用来低成本验证付费意愿：冷邮件检查器、主题行测试器、电商 listing、房源文案、投标清单。附市场调研与推广文案 | `mvp-landing-pages/` |
| 《上瘾》读书笔记 | Hooked 模型 8 章精要与交互式思维导图 | `hooked/mindmap.html` |

## 本地运行剧本杀模拟器源码

```bash
cd juben-tycoon
npm install
npm run dev        # 开发
npm run eval       # 体验评估
```
