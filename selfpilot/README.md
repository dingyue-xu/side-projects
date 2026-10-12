# 🧭 自驱舱 SelfPilot

给自己用的**学习与生活多智能体管理平台**。总管、学习教练、时间管家、健康管家、财务管家、复盘导师组成一支小队。它们共享你的任务、目标、习惯、日记、笔记、记忆卡和账本，可以直接帮你记账、建任务、打卡、出卡片。每个智能体的角色、模型和数据权限都可以自己定义。

产品介绍见 [PRODUCT.md](PRODUCT.md)。

- 零依赖、零构建：纯 HTML/JS，双击 `index.html` 就能用（演示模式）
- 本地优先：数据存浏览器本地，API Key 只存本机
- 模型随便换：Claude、DeepSeek、通义千问、Kimi、智谱、OpenAI、Ollama 本地模型，或任何 OpenAI 兼容接口
- 可选服务端 `server.mjs`（零依赖，约 150 行）：转发模型请求绕过跨域，多设备同步

## 三种部署方式

| 方式 | 命令 | 适合 | 跨域转发 | 多端同步 |
|---|---|---|---|---|
| 纯静态 | 打开 `index.html`，或部署到 GitHub Pages | 先体验 / 只用 Claude | ✗（Claude 支持浏览器直连） | ✗（可导出/导入备份） |
| 本机服务 | `node server.mjs` → http://localhost:8787 | 日常在电脑上用，国内模型 | ✓ | 同一台电脑 |
| 服务器 / Docker | 见下 | 手机 + 电脑一起用 | ✓ | ✓ |

需要 Node.js 18+（服务端用到内置 `fetch`）。

### 本机

```bash
cd selfpilot
node server.mjs
# 打开 http://localhost:8787 ，在「设置 → 模型服务商」填 API Key，并设为默认
```

### 服务器（手机电脑多端同步）

```bash
HOST=0.0.0.0 PORT=8787 SP_TOKEN=换成一串长随机字符 node server.mjs
```

或者用 Docker：

```bash
cd selfpilot
docker build -t selfpilot .
docker run -d --name selfpilot -p 8787:8787 -e SP_TOKEN=换成一串长随机字符 -v $PWD/data:/data selfpilot
```

然后在每台设备上：打开地址 → 设置 → 「代理与多端同步」→ 填访问令牌，勾选同步。

> 对外暴露时务必设置 `SP_TOKEN`，并在前面挂 HTTPS（Caddy / Nginx）。没有令牌的话，任何人都能读写你的数据、借用转发代理。
> 服务端数据在 `DATA_DIR`（默认 `./data`）下，每天自动保存一份 `backup-日期.json` 快照。

| 环境变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | 8787 | 端口 |
| `HOST` | 127.0.0.1 | 对外服务时设为 `0.0.0.0` |
| `SP_TOKEN` | 空 | 访问令牌，保护 `/api/*` 与 `/proxy` |
| `DATA_DIR` | `./data` | 同步数据存放目录 |

## 接入模型

「设置 → 模型服务商」里已经预置：

| 服务商 | 类型 | 默认模型 | 浏览器直连 |
|---|---|---|---|
| Claude（Anthropic） | Anthropic Messages API | `claude-opus-5-5` | ✓ |
| DeepSeek / 通义千问 / Kimi / 智谱 / OpenAI | OpenAI 兼容 | 可改 | 视服务商而定，不行就用 `server.mjs` 转发 |
| Ollama / LM Studio | OpenAI 兼容（本地） | `qwen2.5:7b` | 需设置 `OLLAMA_ORIGINS=*`，或走转发 |
| 自定义 | OpenAI 兼容 | — | 填 Base URL 即可（硅基流动、OpenRouter、公司内网模型…） |

每个智能体可以单独指定服务商和模型。比如总管用强模型，记账用便宜模型。Claude 型号默认 `medium` 思考强度，并开启服务端兜底（请求被拒时自动换模型重试）。

## 目录结构

```
selfpilot/
├── index.html          界面与样式
├── js/
│   ├── util.js         工具函数、Markdown 渲染
│   ├── store.js        数据模型、默认智能体/工作流、动作执行与权限
│   ├── llm.js          模型调用（Anthropic / OpenAI 兼容 / 离线模拟），SSE 流式
│   ├── engine.js       多智能体编排：上下文、路由、协作、工作流、调度
│   ├── ui.js           各页面视图与交互
│   └── app.js          启动、服务端探测、多端同步、定时触发
├── server.mjs          可选服务端：静态托管 + 转发代理 + 同步
├── sw.js / manifest    PWA，可“添加到主屏幕”
├── Dockerfile
└── PRODUCT.md          产品介绍
```

## 扩展：给智能体加一种新能力

动作定义在 `js/store.js` 的 `SP.ACTIONS`：

```js
add_reading: { tool: 'notes', label: '记录阅读', schema: '{"book":"","pages":数字}',
  run(p) { /* 修改 SP.state */ return '已记录'; } },
```

`tool` 决定哪些智能体有权使用它（智能体编辑页勾选的数据权限），`schema` 会自动写进系统提示词。不用改别处。
