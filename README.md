# 个人小项目

工作之外自己动手做的几个小项目，都是纯前端，可以直接在浏览器里打开。

**在线浏览：** https://dingyue-xu.github.io/side-projects/

| 项目 | 说明 | 入口 |
|---|---|---|
| 自驱舱 SelfPilot | 自用的学习与生活多智能体平台：6 位可自定义的智能体（总管、学习教练、时间管家、健康管家、财务管家、复盘导师）共享任务、习惯、笔记、记忆卡和账本。支持圆桌路由、互相请教、定时工作流，可接 Claude、DeepSeek、通义、Kimi、Ollama 等模型；零依赖，可选 Node 服务端做转发和多端同步 | `selfpilot/`（[产品介绍](selfpilot/PRODUCT.md)） |
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
