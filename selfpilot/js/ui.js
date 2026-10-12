/* 视图层：hash 路由 + 字符串模板 + 事件委托 */
(function () {
  const SP = window.SP;
  const e = SP.esc;
  const S = () => SP.state;
  const $ = (s) => document.querySelector(s);

  SP.toast = (msg, cls = '') => {
    const t = document.createElement('div');
    t.className = 'toast ' + cls;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), cls === 'err' ? 4500 : 2200);
  };

  const route = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  SP.go = (h) => { if (location.hash === '#/' + h) SP.render(); else location.hash = '#/' + h; };

  const NAV = [
    ['工作台', [['today', '☀️', '今日'], ['chat', '💬', '对话']]],
    ['团队', [['agents', '🤖', '智能体'], ['workflows', '⚙️', '工作流']]],
    ['数据', [['tasks', '✅', '任务'], ['goals', '🎯', '目标'], ['habits', '🔁', '习惯'], ['journal', '📔', '日记'], ['notes', '📝', '笔记'], ['cards', '🃏', '记忆卡'], ['money', '💰', '账本'], ['memory', '🧠', '长期记忆']]],
    ['', [['settings', '🛠️', '设置']]],
  ];

  function renderSide() {
    const cur = route()[0];
    const counts = {
      tasks: S().tasks.filter((t) => t.status !== 'done' && t.due && t.due <= SP.today()).length,
      cards: SP.cardsDue().length,
      habits: S().habits.filter((h) => !SP.habitDone(h)).length,
    };
    $('#side').innerHTML =
      `<div class="brand"><span style="font-size:22px">🧭</span><div>自驱舱<small>SelfPilot · 个人多智能体</small></div></div>` +
      NAV.map(([g, items]) => (g ? `<div class="navg">${g}</div>` : '<div style="height:10px"></div>') +
        `<nav class="nav">${items.map(([id, ic, name]) => `<a href="#/${id}" class="${cur === id || (cur === 'agent' && id === 'agents') || (cur === 'wf' && id === 'workflows') ? 'on' : ''}">${ic} ${name}${counts[id] ? `<span class="cnt">${counts[id]}</span>` : ''}</a>`).join('')}</nav>`).join('') +
      `<div class="foot">${SP.isMockMode() ? '⚪ 演示模式' : '🟢 ' + e(SP.provider(S().settings.defaultProviderId).name)}${SP.server ? ' · 服务端' : ' · 本地'}</div>`;
  }

  // ---------------- 通用片段 ----------------
  const av = (a) => `<span class="av" style="background:${e(a.color || '#888')}22">${e(a.emoji || '🤖')}</span>`;
  const agentOpts = (sel, withEmpty) => (withEmpty ? `<option value="">（无）</option>` : '') + S().agents.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${e(a.emoji)} ${e(a.name)}</option>`).join('');
  const prioTag = (p) => `<span class="tag ${p}">${{ high: '高', mid: '中', low: '低' }[p] || '中'}</span>`;
  const dueTag = (d) => (d ? `<span class="tag ${d < SP.today() ? 'over' : ''}">${d === SP.today() ? '今天' : d === SP.addDays(SP.today(), 1) ? '明天' : d.slice(5)}</span>` : '');
  const taskItem = (t) => `<div class="item ${t.status === 'done' ? 'done' : ''}"><button class="box ${t.status === 'done' ? 'on' : ''}" data-a="toggleTask" data-id="${t.id}">${t.status === 'done' ? '✓' : ''}</button><span class="t" data-a="editTask" data-id="${t.id}" style="cursor:text">${e(t.title)}</span>${prioTag(t.priority)}${dueTag(t.due)}</div>`;
  const page = (title, sub, body, right = '') => `<div class="page"><div class="row between"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${right}</div>${body}</div>`;
  const opt = (v, cur, label) => `<option value="${e(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${e(label || v)}</option>`;
  const CATS = ['餐饮', '交通', '购物', '学习', '娱乐', '居住', '医疗', '人情', '其他'];

  // ---------------- 今日 ----------------
  function vToday() {
    const s = S(), t = SP.today(), h = new Date().getHours();
    const hi = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    const open = s.tasks.filter((x) => x.status !== 'done');
    const todays = open.filter((x) => x.due && x.due <= t).concat(open.filter((x) => !x.due).slice(0, 3));
    const doneToday = s.tasks.filter((x) => x.status === 'done' && x.doneAt && SP.dstr(new Date(x.doneAt)) === t);
    const mm = SP.monthMoney();
    const brief = s.threads.find((th) => th.mode === 'workflow');
    const briefMsg = brief && [...brief.messages].reverse().find((m) => m.role === 'assistant' && !m.error);
    const due = SP.dueWorkflows();
    const maxCat = Math.max(1, ...Object.values(mm.byCat));
    return page(`${hi}${s.settings.userName ? '，' + e(s.settings.userName) : ''}`, `${t} 星期${SP.weekday(t)} · 今天完成 ${doneToday.length} 件事，${s.habits.filter((x) => SP.habitDone(x)).length}/${s.habits.length} 个习惯已打卡`,
      (SP.isMockMode() ? `<div class="banner">⚪ <span class="grow">当前是<b>演示模式</b>：智能体用离线模拟回复，所有功能都能试。接入真实模型（Claude / DeepSeek / 通义 / Kimi / 本地 Ollama…）后才会真正思考。</span><a class="btn pri sm" href="#/settings">去配置模型</a></div>` : '') +
      (due.length ? `<div class="banner">⏰ <span class="grow">有 ${due.length} 个工作流到点未运行：${due.map((w) => e(w.name)).join('、')}</span><button class="btn pri sm" data-a="runDue">现在运行</button></div>` : '') +
      `<div class="card" style="margin-bottom:14px"><form data-f="capture" class="row"><input type="text" name="text" class="grow" placeholder="随手告诉团队：「午饭花了 35」「提醒我明天交报告」「今天跑步了」「帮我规划这周学习」…" autocomplete="off"><button class="btn pri">发送</button></form>
       <div class="faint" style="margin-top:6px">总管会自动分派给合适的智能体，并直接记账、建任务、打卡。可以用 @学习教练 指定。</div></div>
      <div class="grid">
        <div class="card"><h2>✅ 今日任务<a class="more" href="#/tasks">全部 →</a></h2><div class="list">${todays.map(taskItem).join('') || '<div class="empty">今天没有到期任务 🎉</div>'}</div>
          <form data-f="addTask" class="row" style="margin-top:8px"><input type="text" name="title" class="grow" placeholder="添加今天的任务"><input type="hidden" name="due" value="${t}"><button class="btn sm">添加</button></form></div>
        <div class="card"><h2>🔁 习惯打卡<a class="more" href="#/habits">管理 →</a></h2><div class="list">${s.habits.map((x) => `<div class="item"><button class="box ${SP.habitDone(x) ? 'on' : ''}" data-a="toggleHabit" data-id="${x.id}" data-d="${t}">${SP.habitDone(x) ? '✓' : ''}</button><span class="t">${e(x.emoji)} ${e(x.name)}</span><span class="faint">🔥 ${SP.streak(x)} 天</span></div>`).join('') || '<div class="empty">还没有习惯</div>'}</div></div>
        <div class="card"><h2>📰 最新简报${brief ? `<a class="more" href="#/chat/${brief.id}">查看 →</a>` : ''}</h2>${briefMsg ? `<div class="md" style="max-height:260px;overflow:auto">${SP.md(briefMsg.content)}</div><div class="faint">${e(brief.title)}</div>` : '<div class="empty">还没有简报</div>'}
          <div class="row" style="margin-top:10px">${s.workflows.filter((w) => w.enabled).map((w) => `<button class="btn sm" data-a="runWf" data-id="${w.id}">${e(w.emoji)} ${e(w.name)}</button>`).join('')}</div></div>
        <div class="card"><h2>🃏 记忆卡</h2><div class="row between"><div><div class="stat">${SP.cardsDue().length}</div><div class="faint">张今日待复习 · 共 ${s.cards.length} 张</div></div><a class="btn ${SP.cardsDue().length ? 'pri' : ''}" href="#/cards/review">开始复习</a></div></div>
        <div class="card"><h2>💰 本月账本<a class="more" href="#/money">明细 →</a></h2><div class="row" style="gap:24px"><div><div class="stat">¥${SP.money(mm.out)}</div><div class="faint">支出</div></div><div><div class="stat" style="color:var(--ok)">¥${SP.money(mm.inc)}</div><div class="faint">收入</div></div></div>
          ${Object.entries(mm.byCat).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `<div class="row" style="margin-top:6px"><span style="width:40px" class="faint">${e(k)}</span><div class="bar grow"><i style="width:${(v / maxCat) * 100}%"></i></div><span class="faint">¥${SP.money(v)}</span></div>`).join('')}</div>
        <div class="card"><h2>🎯 目标<a class="more" href="#/goals">管理 →</a></h2>${s.goals.map((g) => `<div style="margin-bottom:10px"><div class="row between"><span>${e(g.title)}</span><span class="faint">${g.progress}%</span></div><div class="bar"><i style="width:${g.progress}%"></i></div></div>`).join('') || '<div class="empty">还没有目标</div>'}</div>
        <div class="card"><h2>🛰️ 团队动态</h2><div class="list">${s.activity.slice(0, 8).map((x) => { const a = SP.agent(x.agentId); return `<div class="item"><span>${a ? e(a.emoji) : '⚙️'}</span><span class="t">${e(x.text)}</span><span class="faint">${SP.fmtTime(x.ts)}</span></div>`; }).join('') || '<div class="empty">智能体做的每一次操作都会记录在这里</div>'}</div></div>
      </div>`);
  }

  // ---------------- 对话 ----------------
  function msgHtml(m) {
    if (m.role === 'user') return `<div class="msg ${m.step ? 'step' : 'user'}" id="m-${m.id}"><div class="bub md">${m.step ? '⚙️ ' + e(m.content) : SP.md(m.content)}</div></div>`;
    const a = SP.agent(m.agentId) || { name: '已删除的智能体', emoji: '❔' };
    const acts = (m.actions || []).map((x, i) => {
      const d = SP.ACTIONS[x.type] || { label: x.type };
      const p = x.payload || {};
      const desc = x.result || p.title || p.name || p.habit || p.front || p.text || p.question || (p.amount ? '¥' + p.amount : '') || '';
      return `<div class="act ${x.status}">${x.status === 'done' ? '✓' : x.status === 'error' ? '✗' : '○'} <b>${e(d.label)}</b><span class="grow">${e(desc)}</span>${x.status === 'pending' ? `<button class="btn sm" data-a="applyAct" data-m="${m.id}" data-i="${i}">执行</button>` : ''}</div>`;
    }).join('');
    return `<div class="msg" id="m-${m.id}">${av(a)}<div class="grow" style="min-width:0"><div class="who"><b>${e(a.name)}</b>${m.note ? `<span class="tag">${e(m.note)}</span>` : ''}<span class="faint">${SP.hm(m.ts)}</span></div>
      <div class="bub md ${m.error ? 'err' : ''} ${m.streaming ? 'cursor' : ''}">${m.content ? SP.md(m.content) : m.streaming ? '<span class="faint">思考中…</span>' : ''}${acts ? `<div class="acts">${acts}</div>` : ''}</div></div></div>`;
  }

  function vChat(id) {
    const s = S();
    let th = s.threads.find((x) => x.id === id);
    if (!th && !id) th = s.threads.find((x) => x.mode !== 'workflow') || s.threads[0];
    const list = s.threads.slice().sort((a, b) => b.updated - a.updated).map((x) => {
      const ag = x.mode === 'agent' ? SP.agent(x.agentId) : null;
      const ic = x.mode === 'council' ? '🪑' : x.mode === 'workflow' ? '' : ag ? ag.emoji : '💬';
      return `<a href="#/chat/${x.id}" class="${th && th.id === x.id ? 'on' : ''}">${ic} ${e(x.title)}<span class="faint">${SP.fmtTime(x.updated)}</span></a>`;
    }).join('');
    const side = `<div class="threads"><div class="row" style="padding:0 4px 10px"><button class="btn pri sm grow" data-a="newCouncil">🪑 圆桌会议</button><button class="btn sm" data-a="pickAgent">单聊</button></div>${list || '<div class="empty">还没有对话</div>'}</div>`;
    if (!th) return `<div class="chat list">${side}<div class="conv"><div class="page"><div class="empty">新建一个对话开始吧</div></div></div></div>`;
    const ag = SP.agent(th.agentId);
    const head = th.mode === 'agent' && ag ? `${av(ag)}<div class="grow"><b>${e(ag.name)}</b><div class="faint">${e(ag.role)}</div></div>`
      : th.mode === 'workflow' ? `<div class="grow"><b>${e(th.title)}</b><div class="faint">工作流运行记录 · 可继续追问</div></div>`
      : `<span class="av">🪑</span><div class="grow"><b>${e(th.title)}</b><div class="faint">圆桌模式：总管自动分派，多位专家发言后综合结论</div></div>`;
    const mentions = s.agents.filter((a) => a.enabled).map((a) => `<button type="button" data-a="mention" data-n="${e(a.name)}">${e(a.emoji)} ${e(a.name)}</button>`).join('');
    return `<div class="chat" id="chatwrap">${side}<div class="conv" data-th="${th.id}">
      <div class="convh"><button class="btn sm ghost" data-a="chatList" title="对话列表">‹</button>${head}<button class="btn sm ghost" data-a="renameThread" data-id="${th.id}">改名</button><button class="btn sm ghost danger" data-a="delThread" data-id="${th.id}">删除</button></div>
      <div class="msgs" id="msgs">${th.messages.map(msgHtml).join('') || `<div class="empty">${th.mode === 'council' ? '说出你的问题，总管会召集合适的智能体一起讨论。<br>例如：「这周想学完 Python 基础，同时保证每天运动，帮我安排一下」' : '开始聊天吧'}</div>`}</div>
      <form class="composer" data-f="send"><div class="mentions">${mentions}</div><div class="row" style="align-items:flex-end"><textarea name="text" id="composer" class="grow" placeholder="输入消息，Enter 发送，Shift+Enter 换行；@名字 可点名" rows="1"></textarea>
      <button class="btn pri" id="sendbtn" ${SP.busy ? 'style="display:none"' : ''}>发送</button><button type="button" class="btn danger" id="stopbtn" data-a="stop" ${SP.busy ? '' : 'style="display:none"'}>停止</button></div></form></div></div>`;
  }

  const chatUI = {
    onUpdate(th, m) {
      const box = $('#msgs');
      const conv = document.querySelector('.conv');
      if (!box || !conv || conv.dataset.th !== th.id) return;
      const near = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
      if (!m) box.innerHTML = th.messages.map(msgHtml).join('');
      else {
        const el = document.getElementById('m-' + m.id);
        if (el) el.outerHTML = msgHtml(m);
        else box.insertAdjacentHTML('beforeend', msgHtml(m));
        const emp = box.querySelector(':scope > .empty');
        if (emp) emp.remove();
      }
      if (near || !m) box.scrollTop = box.scrollHeight;
    },
    onBusy(b) {
      const sb = $('#sendbtn'), st = $('#stopbtn');
      if (sb) sb.style.display = b ? 'none' : '';
      if (st) st.style.display = b ? '' : 'none';
      if (!b) renderSide();
    },
  };

  // ---------------- 智能体 ----------------
  const TEMPLATES = [
    { emoji: '🗣️', name: '英语陪练', color: '#2a8fd8', role: '用英语和我日常对话，纠正语法并积累表达。', tools: ['cards', 'notes', 'memory'], prompt: 'You are my English speaking partner. Reply mainly in English, keep it conversational. After each reply, list 1-2 corrections of my mistakes in Chinese, and turn useful expressions into flashcards (add_card).' },
    { emoji: '📖', name: '读书搭子', color: '#8a5a2b', role: '陪我读书：提问、讨论、整理读书笔记。', tools: ['notes', 'cards', 'tasks', 'goals'], prompt: '你是我的读书搭子。我告诉你在读什么、读到哪，你用苏格拉底式提问帮我思考，并把我的理解整理成读书笔记（add_note）和关键卡片。' },
    { emoji: '💼', name: '求职顾问', color: '#4a5a7a', role: '简历、面试准备、求职进度管理。', tools: ['tasks', 'notes', 'goals', 'memory'], prompt: '你是我的求职顾问。帮我梳理经历的 STAR 故事、模拟面试提问、追踪投递进度（用任务管理）。反馈直接、具体。' },
    { emoji: '🍳', name: '饮食规划师', color: '#d85a3b', role: '根据目标规划一周餐单与采购清单。', tools: ['habits', 'tasks', 'money', 'memory'], prompt: '你是我的饮食规划师，按我的健康目标和预算，规划简单易做的家常餐单，并把采购清单加成任务。' },
  ];

  function vAgents() {
    return page('智能体', '每个智能体有自己的角色设定、模型和数据权限。可以随时新建、修改、停用。',
      `<div class="grid">${S().agents.map((a) => `<div class="card" style="${a.enabled ? '' : 'opacity:.55'}"><div class="row">${av(a)}<div class="grow"><b>${e(a.name)}</b>${a.enabled ? '' : ' <span class="tag">已停用</span>'}<div class="faint">${e((SP.provider(a.providerId || S().settings.defaultProviderId) || {}).name || '')} · ${e(a.model || '默认模型')}</div></div></div>
        <p class="muted" style="margin:10px 0">${e(a.role)}</p><div class="row" style="gap:4px;margin-bottom:12px">${(a.tools || []).map((t) => `<span class="tag">${SP.TOOLS[t]}</span>`).join('')}</div>
        <div class="row"><button class="btn sm pri" data-a="chatWith" data-id="${a.id}">💬 单聊</button><a class="btn sm" href="#/agent/${a.id}">编辑</a><button class="btn sm ghost" data-a="toggleAgent" data-id="${a.id}">${a.enabled ? '停用' : '启用'}</button></div></div>`).join('')}
        <div class="card"><h2>➕ 新建智能体</h2><p class="muted">从空白开始，或用模板快速创建：</p><div class="row"><button class="btn sm pri" data-a="newAgent">空白智能体</button>${TEMPLATES.map((t, i) => `<button class="btn sm" data-a="newAgent" data-t="${i}">${t.emoji} ${t.name}</button>`).join('')}</div></div></div>`);
  }

  function vAgent(id) {
    const a = SP.agent(id);
    if (!a) return page('找不到智能体', '', '<a href="#/agents">返回</a>');
    const provs = S().settings.providers;
    return page(`${e(a.emoji)} 编辑智能体`, '改完点保存，下一次对话立即生效。',
      `<form class="card form" data-f="saveAgent" data-id="${a.id}">
        <div class="form2"><label class="f">名称<input type="text" name="name" value="${e(a.name)}" required></label>
        <div class="row"><label class="f" style="width:80px">图标<input type="text" name="emoji" value="${e(a.emoji)}"></label><label class="f">颜色<input type="color" name="color" value="${e(a.color || '#3b6fd8')}" style="height:36px;width:60px;padding:2px"></label></div></div>
        <label class="f">一句话角色（会出现在团队名册里，总管据此分派）<input type="text" name="role" value="${e(a.role)}"></label>
        <label class="f">角色设定 / 系统提示词<textarea name="prompt" rows="9">${e(a.prompt)}</textarea></label>
        <div class="form2"><label class="f">模型服务商<select name="providerId"><option value="">跟随默认（${e(SP.provider(S().settings.defaultProviderId).name)}）</option>${provs.map((p) => opt(p.id, a.providerId, p.name)).join('')}</select></label>
        <label class="f">模型名（留空用服务商默认）<input type="text" name="model" value="${e(a.model || '')}" placeholder="如 claude-opus-5-5 / deepseek-chat"></label>
        <label class="f">思考强度（Claude）<select name="effort">${['', 'low', 'medium', 'high', 'xhigh'].map((x) => opt(x, a.effort || '', x || '默认（medium）')).join('')}</select></label>
        <label class="f">温度（OpenAI 兼容，留空为默认）<input type="number" name="temperature" step="0.1" min="0" max="2" value="${e(a.temperature ?? '')}"></label></div>
        <div><div class="faint" style="margin-bottom:6px">数据权限：勾选的数据该智能体可以读取并修改</div><div class="row">${Object.entries(SP.TOOLS).map(([k, v]) => `<label class="chk"><input type="checkbox" name="tools" value="${k}" ${(a.tools || []).includes(k) ? 'checked' : ''}>${v}</label>`).join('')}</div></div>
        <label class="chk"><input type="checkbox" name="enabled" ${a.enabled ? 'checked' : ''}> 启用</label>
        <div class="row"><button class="btn pri">保存</button><a class="btn" href="#/agents">返回</a>${a.builtin ? `<button type="button" class="btn ghost" data-a="resetAgent" data-id="${a.id}">恢复默认设定</button>` : ''}${a.id !== 'chief' ? `<button type="button" class="btn ghost danger" data-a="delAgent" data-id="${a.id}">删除</button>` : ''}</div>
      </form>
      <details class="card" style="margin-top:14px"><summary>预览：该智能体实际收到的系统提示词</summary><pre style="white-space:pre-wrap;font-size:12px">${e(SP.buildSystem(a))}</pre></details>`);
  }

  // ---------------- 工作流 ----------------
  const trigText = (t) => t.type === 'manual' ? '手动运行' : t.type === 'daily' ? `每天 ${t.time}` : `每周${'日一二三四五六'[t.day]} ${t.time}`;
  function vWorkflows() {
    return page('工作流', '把多个智能体串成固定流程，到点自动运行（页面打开时触发，错过当天会补跑）。',
      `<div class="grid">${S().workflows.map((w) => `<div class="card" style="${w.enabled ? '' : 'opacity:.55'}"><h2>${e(w.emoji)} ${e(w.name)}</h2><p class="muted" style="margin:0 0 8px">${e(w.desc)}</p>
        <div class="row" style="gap:4px;margin-bottom:8px">${w.steps.map((s) => { const a = SP.agent(s.agentId); return a ? `<span class="tag">${e(a.emoji)} ${e(a.name)}</span>` : ''; }).join('<span class="faint">→</span>')}${SP.agent(w.synthAgentId) ? `<span class="faint">⇒</span><span class="tag">${e(SP.agent(w.synthAgentId).emoji)} 汇总</span>` : ''}</div>
        <div class="faint">⏰ ${trigText(w.trigger)} · 上次运行：${w.lastRun || '从未'}</div>
        <div class="row" style="margin-top:10px"><button class="btn sm pri" data-a="runWf" data-id="${w.id}">▶ 运行</button><a class="btn sm" href="#/wf/${w.id}">编辑</a>${w.lastThreadId ? `<a class="btn sm ghost" href="#/chat/${w.lastThreadId}">上次结果</a>` : ''}</div></div>`).join('')}
      <div class="card"><h2>➕ 新建工作流</h2><p class="muted">例如：「考前冲刺」— 学习教练出题 → 时间管家排复习计划；「月度财务体检」— 财务管家分析 → 总管给建议。</p><button class="btn pri sm" data-a="newWf">新建</button></div></div>`);
  }

  function vWf(id) {
    const w = S().workflows.find((x) => x.id === id);
    if (!w) return page('找不到工作流', '', '<a href="#/workflows">返回</a>');
    return page(`${e(w.emoji)} 编辑工作流`, '步骤按顺序执行，后面的智能体能看到前面所有人的输出。',
      `<form class="card form" data-f="saveWf" data-id="${w.id}">
        <div class="form2"><label class="f">名称<input type="text" name="name" value="${e(w.name)}"></label><label class="f">图标<input type="text" name="emoji" value="${e(w.emoji)}"></label></div>
        <label class="f">说明<input type="text" name="desc" value="${e(w.desc)}"></label>
        <div class="row"><label class="f">触发方式<select name="ttype">${opt('manual', w.trigger.type, '手动')}${opt('daily', w.trigger.type, '每天')}${opt('weekly', w.trigger.type, '每周')}</select></label>
          <label class="f">时间<input type="time" name="ttime" value="${e(w.trigger.time || '08:00')}"></label>
          <label class="f">星期（每周时）<select name="tday">${[0, 1, 2, 3, 4, 5, 6].map((d) => opt(d, w.trigger.day, '周' + '日一二三四五六'[d])).join('')}</select></label>
          <label class="chk" style="margin-top:16px"><input type="checkbox" name="enabled" ${w.enabled ? 'checked' : ''}> 启用</label></div>
        <div id="steps" class="form">${w.steps.map((s, i) => stepRow(s, i)).join('')}</div>
        <div><button type="button" class="btn sm" data-a="addStep">➕ 添加步骤</button></div>
        <div class="form2"><label class="f">汇总智能体（可选）<select name="synthAgentId">${agentOpts(w.synthAgentId, true)}</select></label><label class="f">汇总指令<input type="text" name="synthPrompt" value="${e(w.synthPrompt)}"></label></div>
        <div class="row"><button class="btn pri">保存</button><a class="btn" href="#/workflows">返回</a><button type="button" class="btn ghost danger" data-a="delWf" data-id="${w.id}">删除</button></div></form>`);
  }
  const stepRow = (s, i) => `<div class="card step" style="padding:12px;background:var(--panel2)"><div class="row"><b>步骤 ${i + 1}</b><select name="sa">${agentOpts(s.agentId)}</select><span class="grow"></span><button type="button" class="btn sm ghost danger" data-a="delStep">移除</button></div><textarea name="sp" rows="2" style="margin-top:8px">${e(s.prompt)}</textarea></div>`;

  // ---------------- 任务 ----------------
  function vTasks(tab = 'open') {
    let ts = S().tasks.slice();
    if (tab === 'open') ts = ts.filter((t) => t.status !== 'done').sort((a, b) => (a.due || '9999') < (b.due || '9999') ? -1 : 1);
    else if (tab === 'done') ts = ts.filter((t) => t.status === 'done').sort((a, b) => b.doneAt - a.doneAt);
    return page('任务', '点标题可修改；智能体也会帮你新建、排期、完成任务。',
      `<div class="card"><form data-f="addTask" class="row" style="margin-bottom:12px"><input type="text" name="title" class="grow" placeholder="新任务" required><input type="date" name="due"><select name="priority">${opt('mid', 'mid', '中')}${opt('high', '', '高')}${opt('low', '', '低')}</select><button class="btn pri">添加</button></form>
       <div class="tabs">${[['open', '待办'], ['done', '已完成'], ['all', '全部']].map(([k, v]) => `<a href="#/tasks/${k}" class="${tab === k ? 'on' : ''}">${v}</a>`).join('')}</div>
       <div class="list">${ts.map((t) => taskItem(t).replace('</div>', `<button class="btn sm ghost" data-a="delTask" data-id="${t.id}">✕</button></div>`)).join('') || '<div class="empty">空空如也</div>'}</div></div>`);
  }

  // ---------------- 目标 ----------------
  function vGoals() {
    return page('目标', '长期目标 + 关键结果（KR）。智能体做计划时会参考这里。',
      `<form class="card row" data-f="addGoal" style="margin-bottom:14px"><input type="text" name="title" class="grow" placeholder="新目标，例如：年底前雅思 7 分" required><select name="area">${['学习', '健康', '事业', '财务', '生活'].map((x) => opt(x, '', x)).join('')}</select><input type="date" name="deadline"><button class="btn pri">添加</button></form>
      <div class="grid">${S().goals.map((g) => `<div class="card"><div class="row between"><h2>${e(g.title)}</h2><button class="btn sm ghost danger" data-a="delGoal" data-id="${g.id}">✕</button></div>
        <div class="faint">${e(g.area)}${g.deadline ? ' · 截止 ' + g.deadline : ''}</div>
        <div class="row" style="margin:10px 0"><input type="range" min="0" max="100" value="${g.progress}" class="grow" data-ch="goalProg" data-id="${g.id}"><b>${g.progress}%</b></div>
        <div class="list">${g.krs.map((k, i) => `<div class="item ${k.done ? 'done' : ''}"><button class="box ${k.done ? 'on' : ''}" data-a="toggleKr" data-id="${g.id}" data-i="${i}">${k.done ? '✓' : ''}</button><span class="t">${e(k.text)}</span></div>`).join('')}</div>
        <form data-f="addKr" data-id="${g.id}" class="row" style="margin-top:8px"><input type="text" name="text" class="grow" placeholder="添加关键结果"><button class="btn sm">添加</button></form></div>`).join('') || '<div class="empty">还没有目标</div>'}</div>`);
  }

  // ---------------- 习惯 ----------------
  function vHabits() {
    const days = [...Array(14)].map((_, i) => SP.addDays(SP.today(), i - 13));
    return page('习惯', '近 14 天打卡记录，点格子补打卡或取消。',
      `<form class="card row" data-f="addHabit" style="margin-bottom:14px"><input type="text" name="emoji" style="width:56px" value="✅"><input type="text" name="name" class="grow" placeholder="新习惯，例如：冥想 10 分钟" required><button class="btn pri">添加</button></form>
      <div class="card" style="overflow-x:auto"><div class="hgrid" style="grid-template-columns:minmax(120px,1fr) repeat(14,22px) 60px 30px">
        <span></span>${days.map((d) => `<span class="faint" style="text-align:center;font-size:10px">${d.slice(8)}</span>`).join('')}<span></span><span></span>
        ${S().habits.map((h) => `<span>${e(h.emoji)} ${e(h.name)}</span>${days.map((d) => `<button class="habit-cell ${SP.habitDone(h, d) ? 'on' : ''} ${d === SP.today() ? 'today' : ''}" data-a="toggleHabit" data-id="${h.id}" data-d="${d}" title="${d}"></button>`).join('')}<span class="faint">🔥${SP.streak(h)}</span><button class="btn sm ghost" data-a="delHabit" data-id="${h.id}">✕</button>`).join('')}
      </div>${S().habits.length ? '' : '<div class="empty">还没有习惯</div>'}</div>`);
  }

  // ---------------- 日记 ----------------
  function vJournal() {
    const mood = ['', '😞', '😕', '😐', '🙂', '😄'];
    return page('日记', '记录感受与想法。复盘导师会读最近的日记来理解你的状态。',
      `<form class="card form" data-f="addJournal" style="margin-bottom:14px"><div class="row"><input type="date" name="date" value="${SP.today()}"><label class="chk">心情<select name="mood">${[5, 4, 3, 2, 1].map((x) => opt(x, 3, mood[x] + ' ' + x)).join('')}</select></label><label class="chk">精力<select name="energy">${[5, 4, 3, 2, 1].map((x) => opt(x, 3, x)).join('')}</select></label></div>
        <textarea name="content" placeholder="今天发生了什么？有什么感受？" required></textarea><div><button class="btn pri">保存日记</button> <button type="button" class="btn" data-a="askMentor">🪞 请复盘导师陪我聊</button></div></form>
      <div class="list">${S().journal.slice().reverse().map((j) => `<div class="card" style="margin-bottom:10px"><div class="row between"><b>${j.date} ${mood[j.mood] || ''}</b><span class="faint">精力 ${j.energy}/5 <button class="btn sm ghost" data-a="delJournal" data-id="${j.id}">✕</button></span></div><div class="md">${SP.md(j.content)}</div>${(j.tags || []).map((t) => `<span class="tag">${e(t)}</span>`).join(' ')}</div>`).join('') || '<div class="empty">还没有日记</div>'}</div>`);
  }

  // ---------------- 笔记 ----------------
  function vNotes(id) {
    const notes = S().notes.slice().sort((a, b) => b.updated - a.updated);
    const n = id && S().notes.find((x) => x.id === id);
    if (n) return page('笔记', '', `<form class="card form" data-f="saveNote" data-id="${n.id}"><input type="text" name="title" value="${e(n.title)}" style="font-size:18px;font-weight:600"><input type="text" name="tags" value="${e((n.tags || []).join(' '))}" placeholder="标签，空格分隔"><textarea name="content" rows="16">${e(n.content)}</textarea><div class="row"><button class="btn pri">保存</button><a class="btn" href="#/notes">返回</a><button type="button" class="btn ghost danger" data-a="delNote" data-id="${n.id}">删除</button></div></form>
      <div class="card md" style="margin-top:14px"><div class="faint">预览</div>${SP.md(n.content)}</div>`);
    return page('笔记', '你的知识库。学习教练会把学到的东西整理到这里。', `<div class="row" style="margin-bottom:14px"><button class="btn pri" data-a="newNote">➕ 新笔记</button></div>
      <div class="grid">${notes.map((x) => `<a class="card" href="#/notes/${x.id}" style="color:inherit"><h2>${e(x.title)}</h2><p class="muted" style="margin:6px 0">${e(x.content.slice(0, 90))}</p>${(x.tags || []).map((t) => `<span class="tag">${e(t)}</span>`).join(' ')} <span class="faint">${SP.fmtTime(x.updated)}</span></a>`).join('') || '<div class="empty">还没有笔记</div>'}</div>`);
  }

  // ---------------- 记忆卡 ----------------
  let reveal = false;
  function vCards(sub) {
    if (sub === 'review') {
      const due = SP.cardsDue();
      const c = due[0];
      if (!c) return page('复习', '', `<div class="card empty">🎉 今天的卡片都复习完了！<br><br><a class="btn" href="#/cards">返回</a></div>`);
      return page('复习', `剩余 ${due.length} 张 · 卡组：${e(c.deck)}`, `<div class="card"><div class="flash">${e(c.front)}</div>
        ${reveal ? `<div class="flash md" style="margin-top:10px;font-size:15px">${SP.md(c.back)}</div><div class="row" style="justify-content:center;margin-top:14px">${[[0, '😵 忘了'], [3, '🤔 模糊'], [4, '🙂 记得'], [5, '😎 很熟']].map(([q, l]) => `<button class="btn ${q === 4 ? 'pri' : ''}" data-a="grade" data-id="${c.id}" data-q="${q}">${l}</button>`).join('')}</div>`
        : `<div class="row" style="justify-content:center;margin-top:14px"><button class="btn pri" data-a="reveal">显示答案</button></div>`}</div>`);
    }
    const decks = {};
    S().cards.forEach((c) => (decks[c.deck] = decks[c.deck] || []).push(c));
    return page('记忆卡', '基于 SM-2 间隔重复。学习教练会从对话里自动生成卡片。',
      `<div class="row" style="margin-bottom:14px"><a class="btn pri" href="#/cards/review">开始复习（${SP.cardsDue().length}）</a></div>
      <form class="card form" data-f="addCard" style="margin-bottom:14px"><div class="form2"><input type="text" name="front" placeholder="正面：问题" required><input type="text" name="back" placeholder="背面：答案" required></div><div class="row"><input type="text" name="deck" placeholder="卡组" value="默认"><button class="btn">添加卡片</button></div></form>
      ${Object.entries(decks).map(([d, cs]) => `<div class="card" style="margin-bottom:12px"><h2>${e(d)} <span class="faint">${cs.length} 张</span></h2><div class="list">${cs.map((c) => `<div class="item"><span class="t">${e(c.front)}<div class="faint">${e(c.back)}</div></span><span class="faint">${c.due <= SP.today() ? '待复习' : '下次 ' + c.due.slice(5)}</span><button class="btn sm ghost" data-a="delCard" data-id="${c.id}">✕</button></div>`).join('')}</div></div>`).join('') || '<div class="empty">还没有卡片</div>'}`);
  }

  // ---------------- 账本 ----------------
  function vMoney(ym) {
    ym = ym || SP.today().slice(0, 7);
    const mm = SP.monthMoney(ym);
    const [y, m] = ym.split('-').map(Number);
    const prev = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
    const next = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
    const max = Math.max(1, ...Object.values(mm.byCat));
    return page('账本', '直接对任何智能体说「打车花了 28」也会自动记账。',
      `<form class="card row" data-f="addMoney" style="margin-bottom:14px"><select name="type">${opt('out', 'out', '支出')}${opt('in', '', '收入')}</select><input type="number" name="amount" step="0.01" placeholder="金额" style="width:110px" required><select name="category">${CATS.concat('收入').map((c) => opt(c, '', c)).join('')}</select><input type="text" name="note" class="grow" placeholder="备注"><input type="date" name="date" value="${SP.today()}"><button class="btn pri">记一笔</button></form>
      <div class="row" style="margin-bottom:12px"><a class="btn sm" href="#/money/${prev}">‹</a><b>${ym}</b><a class="btn sm" href="#/money/${next}">›</a></div>
      <div class="grid"><div class="card"><h2>概览</h2><div class="row" style="gap:28px"><div><div class="stat">¥${SP.money(mm.out)}</div><div class="faint">支出</div></div><div><div class="stat" style="color:var(--ok)">¥${SP.money(mm.inc)}</div><div class="faint">收入</div></div><div><div class="stat">¥${SP.money(mm.inc - mm.out)}</div><div class="faint">结余</div></div></div>
        <div style="margin-top:12px">${Object.entries(mm.byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="row" style="margin-top:6px"><span style="width:44px">${e(k)}</span><div class="bar grow"><i style="width:${(v / max) * 100}%"></i></div><span class="faint" style="width:90px;text-align:right">¥${SP.money(v)} · ${Math.round((v / (mm.out || 1)) * 100)}%</span></div>`).join('')}</div></div>
      <div class="card"><h2>明细</h2><div class="list">${mm.rows.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => `<div class="item"><span class="faint">${r.date.slice(5)}</span><span class="tag">${e(r.category)}</span><span class="t">${e(r.note)}</span><b style="color:${r.type === 'in' ? 'var(--ok)' : 'inherit'}">${r.type === 'in' ? '+' : '-'}¥${SP.money(r.amount)}</b><button class="btn sm ghost" data-a="delMoney" data-id="${r.id}">✕</button></div>`).join('') || '<div class="empty">本月还没有记录</div>'}</div></div></div>`);
  }

  // ---------------- 长期记忆 ----------------
  function vMemory() {
    return page('长期记忆', '关于你的稳定事实与偏好。所有智能体都会读取，帮它们越来越懂你。',
      `<form class="card row" data-f="addMemory" style="margin-bottom:14px"><input type="text" name="text" class="grow" placeholder="例如：我是产品经理，工作日晚上只有 1 小时学习时间" required><button class="btn pri">添加</button></form>
      <div class="card"><div class="list">${S().memory.slice().reverse().map((m) => { const a = SP.agent(m.agentId); return `<div class="item"><span class="t">${e(m.text)}</span><span class="faint">${a ? e(a.emoji + ' ' + a.name) : '我'} · ${SP.fmtTime(m.ts)}</span><button class="btn sm ghost" data-a="delMemory" data-id="${m.id}">✕</button></div>`; }).join('') || '<div class="empty">暂无</div>'}</div></div>`);
  }

  // ---------------- 设置 ----------------
  function vSettings() {
    const st = S().settings;
    return page('设置', '所有数据默认只保存在本机浏览器里。API Key 也只存本地，直接发给你选的模型服务商。',
      `<form class="card form" data-f="saveProfile" style="margin-bottom:14px"><h2>👤 关于我</h2><div class="form2"><label class="f">怎么称呼你<input type="text" name="userName" value="${e(st.userName)}"></label>
        <label class="f">默认模型服务商<select name="defaultProviderId">${st.providers.map((p) => opt(p.id, st.defaultProviderId, p.name + (p.type !== 'mock' && !p.apiKey && !/localhost/.test(p.baseUrl) ? '（未填 Key）' : ''))).join('')}</select></label></div>
        <label class="f">自我介绍（所有智能体都会看到：职业、作息、当前阶段重点…）<textarea name="about" rows="3">${e(st.about)}</textarea></label>
        <div class="row"><label class="chk"><input type="checkbox" name="autoApply" ${st.autoApply ? 'checked' : ''}> 智能体的操作自动执行（关闭后需手动点「执行」确认）</label>
        <label class="chk"><input type="checkbox" name="notify" ${st.notify ? 'checked' : ''}> 工作流完成时发系统通知</label>
        <label class="chk">主题<select name="theme">${opt('', localStorage.getItem('sp.theme') || '', '跟随系统')}${opt('light', localStorage.getItem('sp.theme') || '', '浅色')}${opt('dark', localStorage.getItem('sp.theme') || '', '深色')}</select></label></div>
        <div><button class="btn pri">保存</button></div></form>

      <div class="card" style="margin-bottom:14px"><h2>🔌 模型服务商</h2><p class="faint" style="margin-top:0">Claude 支持浏览器直连；国内服务商若遇跨域限制，请用 <code>node server.mjs</code> 启动（自带转发代理，当前：${SP.proxyAvailable ? '✅ 已检测到' : '未检测到'}）。</p>
        ${st.providers.map((p) => `<form class="form" data-f="saveProvider" data-id="${p.id}" style="border-top:1px solid var(--line);padding:12px 0"><div class="row"><b class="grow">${e(p.name)} ${p.id === st.defaultProviderId ? '<span class="tag">默认</span>' : ''}</b><span class="tag">${p.type === 'anthropic' ? 'Anthropic API' : p.type === 'mock' ? '离线' : 'OpenAI 兼容'}</span></div>
          ${p.type === 'mock' ? '<div class="faint">无需配置，用于体验与测试。</div>' : `<div class="form2"><label class="f">Base URL<input type="url" name="baseUrl" value="${e(p.baseUrl)}"></label><label class="f">默认模型<input type="text" name="model" value="${e(p.model)}"></label>
          <label class="f">API Key<input type="password" name="apiKey" value="${e(p.apiKey)}" placeholder="${/localhost/.test(p.baseUrl) ? '本地模型可留空' : 'sk-...'}" autocomplete="off"></label><div class="row" style="align-items:flex-end"><button class="btn sm pri">保存</button><button type="button" class="btn sm" data-a="testProvider" data-id="${p.id}">测试连接</button><button type="button" class="btn sm ghost" data-a="setDefault" data-id="${p.id}">设为默认</button>${p.custom ? `<button type="button" class="btn sm ghost danger" data-a="delProvider" data-id="${p.id}">删除</button>` : ''}</div></div>`}</form>`).join('')}
        <button class="btn sm" data-a="addProvider">➕ 添加自定义 OpenAI 兼容服务</button></div>

      <form class="card form" data-f="saveNet" style="margin-bottom:14px"><h2>🌐 代理与多端同步</h2>
        <div class="form2"><label class="f">请求转发<select name="proxy">${opt('auto', st.proxy, '自动（检测到服务端就走转发）')}${opt('on', st.proxy, '总是走服务端转发')}${opt('off', st.proxy, '浏览器直连')}</select></label>
        <label class="f">服务端访问令牌（server.mjs 设置了 SP_TOKEN 时填写）<input type="password" name="token" value="${e(st.sync.token)}"></label></div>
        <label class="chk"><input type="checkbox" name="sync" ${st.sync.enabled ? 'checked' : ''} ${SP.server ? '' : 'disabled'}> 把数据同步到服务端（手机、电脑打开同一地址即可共享）${SP.server ? '' : '<span class="faint">— 需用 server.mjs 部署</span>'}</label>
        <div class="row"><button class="btn pri">保存</button>${SP.server && st.sync.enabled ? '<button type="button" class="btn" data-a="syncNow">立即同步</button>' : ''}<span class="faint">${SP.syncStatus || ''}</span></div></form>

      <div class="card"><h2>💾 数据</h2><div class="row"><button class="btn" data-a="export">导出备份（JSON）</button><label class="btn">导入备份<input type="file" accept=".json" data-ch="import" hidden></label>
        <button class="btn" data-a="clearDemo">清空示例数据</button><button class="btn danger" data-a="resetAll">全部重置</button></div>
        <p class="faint">导出文件包含 API Key，请妥善保管。</p></div>`);
  }

  // ---------------- 渲染入口 ----------------
  const VIEWS = { today: vToday, chat: vChat, agents: vAgents, agent: vAgent, workflows: vWorkflows, wf: vWf, tasks: vTasks, goals: vGoals, habits: vHabits, journal: vJournal, notes: vNotes, cards: vCards, money: vMoney, memory: vMemory, settings: vSettings };

  SP.render = () => {
    const [v, arg] = route();
    const fn = VIEWS[v] || vToday;
    $('#main').innerHTML = fn(arg);
    $('#app').classList.remove('open');
    renderSide();
    const nav = NAV.flatMap((g) => g[1]).find((x) => x[0] === v);
    $('#toptitle').textContent = nav ? nav[2] : '自驱舱';
    if (v === 'chat') {
      const box = $('#msgs');
      if (box) box.scrollTop = box.scrollHeight;
      if (!arg && window.innerWidth <= 820) { const w = $('#chatwrap'); if (w) w.classList.add('list'); }
    }
  };
  SP.renderSide = renderSide;

  // ---------------- 交互 ----------------
  const after = (h) => { SP.save(); h ? SP.go(h) : SP.render(); };
  const find = (k, id) => S()[k].find((x) => x.id === id);
  const remove = (k, id) => { S()[k] = S()[k].filter((x) => x.id !== id); };

  async function openThreadAndSend(text, opts) {
    const th = opts.thread || SP.newThread(opts);
    location.hash = '#/chat/' + th.id;
    await SP.sleep(30);
    if (text) await SP.send(th, text, chatUI);
  }

  function inbox() {
    let th = S().threads.find((t) => t.inbox);
    if (!th) { th = SP.newThread({ title: '📥 随手记', mode: 'council' }); th.inbox = true; }
    return th;
  }

  async function runWf(w) {
    try {
      await SP.runWorkflow(w, { ...chatUI, onStart: (th) => (location.hash = '#/chat/' + th.id) });
    } catch (err) { SP.toast(err.message, 'err'); }
  }
  SP.runDue = async () => { for (const w of SP.dueWorkflows()) if (!SP.busy) await runWf(w); };

  const A = {
    menu: () => $('#app').classList.toggle('open'),
    toggleTask: ({ id }) => { const t = find('tasks', id); t.status = t.status === 'done' ? 'todo' : 'done'; t.doneAt = t.status === 'done' ? Date.now() : 0; after(); },
    editTask: ({ id }) => { const t = find('tasks', id); const v = prompt('修改任务（标题 | 截止日期 YYYY-MM-DD）', `${t.title} | ${t.due || ''}`); if (v == null) return; const [a, b] = v.split('|').map((x) => x.trim()); if (a) t.title = a; t.due = b || ''; after(); },
    delTask: ({ id }) => { remove('tasks', id); after(); },
    toggleHabit: ({ id, d }) => { const h = find('habits', id); if (h.log[d]) delete h.log[d]; else h.log[d] = 1; after(); },
    delHabit: ({ id }) => confirm('删除这个习惯及其打卡记录？') && (remove('habits', id), after()),
    toggleKr: ({ id, i }) => { const g = find('goals', id); g.krs[i].done = !g.krs[i].done; after(); },
    delGoal: ({ id }) => confirm('删除目标？') && (remove('goals', id), after()),
    delJournal: ({ id }) => confirm('删除这篇日记？') && (remove('journal', id), after()),
    delCard: ({ id }) => { remove('cards', id); after(); },
    delMoney: ({ id }) => { remove('money', id); after(); },
    delMemory: ({ id }) => { remove('memory', id); after(); },
    newNote: () => { const n = { id: SP.uid(), title: '未命名笔记', content: '', tags: [], created: Date.now(), updated: Date.now() }; S().notes.push(n); after('notes/' + n.id); },
    delNote: ({ id }) => confirm('删除笔记？') && (remove('notes', id), after('notes')),
    reveal: () => { reveal = true; SP.render(); },
    grade: ({ id, q }) => { SP.reviewCard(find('cards', id), Number(q)); reveal = false; after(); },
    runWf: ({ id }) => runWf(S().workflows.find((w) => w.id === id)),
    runDue: () => SP.runDue(),
    newCouncil: () => SP.go('chat/' + SP.newThread({ title: '新对话', mode: 'council' }).id),
    pickAgent: () => SP.go('agents'),
    chatWith: ({ id }) => { const a = SP.agent(id); SP.go('chat/' + SP.newThread({ title: `${a.emoji} ${a.name}`, mode: 'agent', agentId: id }).id); },
    chatList: () => { const w = $('#chatwrap'); if (w) w.classList.add('list'); },
    renameThread: ({ id }) => { const t = find('threads', id); const v = prompt('对话名称', t.title); if (v) { t.title = v; after(); } },
    delThread: ({ id }) => confirm('删除这个对话？') && (remove('threads', id), after('chat')),
    mention: ({ n }) => { const c = $('#composer'); c.value = (c.value ? c.value.trimEnd() + ' ' : '') + '@' + n + ' '; c.focus(); },
    stop: () => SP.stop(),
    applyAct: ({ m, i }) => {
      for (const th of S().threads) { const msg = th.messages.find((x) => x.id === m); if (msg) { SP.applyAction(msg.actions[i], msg.agentId); chatUI.onUpdate(th, msg); renderSide(); return; } }
    },
    askMentor: () => { const t = document.querySelector('[data-f=addJournal] textarea').value.trim(); openThreadAndSend(t ? '这是我今天的日记，陪我聊聊：\n' + t : '我想聊聊今天的状态。', { title: '🪞 复盘', mode: 'agent', agentId: 'mentor' }); },
    toggleAgent: ({ id }) => { const a = SP.agent(id); a.enabled = !a.enabled; after(); },
    newAgent: ({ t }) => {
      const tpl = t !== undefined ? TEMPLATES[t] : { emoji: '🤖', name: '新智能体', color: '#5a6b7d', role: '描述它负责什么', tools: ['memory'], prompt: '你是……\n- 你的职责：\n- 回答风格：' };
      const a = { id: SP.uid(), enabled: true, builtin: false, providerId: '', model: '', ...JSON.parse(JSON.stringify(tpl)) };
      S().agents.push(a); after('agent/' + a.id);
    },
    delAgent: ({ id }) => confirm('删除这个智能体？') && ((S().agents = S().agents.filter((a) => a.id !== id)), after('agents')),
    resetAgent: ({ id }) => { const d = SP.defaultAgents().find((a) => a.id === id); const a = SP.agent(id); if (d && confirm('恢复为默认设定？')) { Object.assign(a, d); after(); } },
    newWf: () => { const w = { id: SP.uid(), name: '新工作流', emoji: '⚙️', desc: '', enabled: true, trigger: { type: 'manual', time: '08:00', day: 0 }, steps: [{ agentId: 'chief', prompt: '' }], synthAgentId: '', synthPrompt: '', lastRun: '' }; S().workflows.push(w); after('wf/' + w.id); },
    delWf: ({ id }) => confirm('删除工作流？') && ((S().workflows = S().workflows.filter((w) => w.id !== id)), after('workflows')),
    addStep: () => { const box = $('#steps'); box.insertAdjacentHTML('beforeend', stepRow({ agentId: 'chief', prompt: '' }, box.children.length)); },
    delStep: (_, el) => el.closest('.step').remove(),
    setDefault: ({ id }) => { S().settings.defaultProviderId = id; after(); SP.toast('已设为默认'); },
    addProvider: () => { const name = prompt('服务名称（如：硅基流动、OpenRouter、公司内网模型）'); if (!name) return; S().settings.providers.push({ id: SP.uid(), name, type: 'openai', baseUrl: 'https://', model: '', apiKey: '', custom: true }); after(); },
    delProvider: ({ id }) => { S().settings.providers = S().settings.providers.filter((p) => p.id !== id); if (S().settings.defaultProviderId === id) S().settings.defaultProviderId = 'mock'; after(); },
    testProvider: async ({ id }, el) => {
      el.disabled = true; el.textContent = '测试中…';
      try {
        const r = await SP.chat({ providerId: id, system: '你是连通性测试。', messages: [{ role: 'user', content: '只回复两个字：成功' }], maxTokens: 200, effort: 'low' });
        SP.toast('✅ 连接成功：' + r.slice(0, 30));
      } catch (err) { SP.toast(err.message, 'err'); }
      el.disabled = false; el.textContent = '测试连接';
    },
    export: () => SP.download(`selfpilot-backup-${SP.today()}.json`, JSON.stringify(S(), null, 1)),
    clearDemo: () => { if (!confirm('清空任务、目标、习惯、日记、笔记、卡片、账本、记忆和对话？（保留智能体、工作流和设置）')) return; ['tasks', 'goals', 'habits', 'journal', 'notes', 'cards', 'money', 'memory', 'threads', 'activity'].forEach((k) => (S()[k] = [])); after('today'); },
    resetAll: () => { if (!confirm('确定全部重置？所有数据和设置都会恢复初始状态。')) return; SP.state = SP.defaultState(); after('today'); },
    syncNow: () => SP.syncPull(true),
  };

  const F = {
    capture: (d) => d.text && openThreadAndSend(d.text, { thread: inbox() }),
    send: (d, f) => {
      if (!d.text.trim() || SP.busy) return;
      const th = find('threads', f.closest('.conv').dataset.th);
      f.querySelector('textarea').value = '';
      SP.send(th, d.text.trim(), chatUI).then(renderSide);
    },
    addTask: (d) => { S().tasks.push({ id: SP.uid(), title: d.title, notes: '', due: d.due || '', priority: d.priority || 'mid', status: 'todo', goalId: '', created: Date.now(), doneAt: 0 }); after(); },
    addGoal: (d) => { S().goals.push({ id: SP.uid(), title: d.title, area: d.area, deadline: d.deadline, progress: 0, krs: [] }); after(); },
    addKr: (d, f) => { if (d.text) { find('goals', f.dataset.id).krs.push({ text: d.text, done: false }); after(); } },
    addHabit: (d) => { S().habits.push({ id: SP.uid(), name: d.name, emoji: d.emoji || '✅', log: {} }); after(); },
    addJournal: (d) => { S().journal.push({ id: SP.uid(), date: d.date || SP.today(), mood: +d.mood, energy: +d.energy, content: d.content, tags: [] }); after(); },
    saveNote: (d, f) => { const n = find('notes', f.dataset.id); Object.assign(n, { title: d.title || '未命名笔记', content: d.content, tags: d.tags.split(/\s+/).filter(Boolean), updated: Date.now() }); after(); SP.toast('已保存'); },
    addCard: (d) => { S().cards.push({ id: SP.uid(), front: d.front, back: d.back, deck: d.deck || '默认', ease: 2.5, interval: 0, reps: 0, due: SP.today() }); after(); },
    addMoney: (d) => { S().money.push({ id: SP.uid(), date: d.date || SP.today(), amount: Math.abs(+d.amount), category: d.type === 'in' ? '收入' : d.category, note: d.note, type: d.type }); after(); },
    addMemory: (d) => { S().memory.push({ id: SP.uid(), text: d.text, agentId: '', ts: Date.now() }); after(); },
    saveAgent: (d, f, fd) => {
      const a = SP.agent(f.dataset.id);
      Object.assign(a, { name: d.name.trim(), emoji: d.emoji, color: d.color, role: d.role, prompt: d.prompt, providerId: d.providerId, model: d.model.trim(), effort: d.effort, temperature: d.temperature, tools: fd.getAll('tools'), enabled: !!d.enabled });
      after(); SP.toast('已保存');
    },
    saveWf: (d, f) => {
      const w = S().workflows.find((x) => x.id === f.dataset.id);
      const steps = [...f.querySelectorAll('.step')].map((el) => ({ agentId: el.querySelector('[name=sa]').value, prompt: el.querySelector('[name=sp]').value.trim() })).filter((s) => s.prompt);
      Object.assign(w, { name: d.name, emoji: d.emoji, desc: d.desc, enabled: !!d.enabled, trigger: { type: d.ttype, time: d.ttime, day: +d.tday }, steps, synthAgentId: d.synthAgentId, synthPrompt: d.synthPrompt });
      after('workflows'); SP.toast('已保存');
    },
    saveProfile: (d) => {
      Object.assign(S().settings, { userName: d.userName, about: d.about, defaultProviderId: d.defaultProviderId, autoApply: !!d.autoApply, notify: !!d.notify });
      try { d.theme ? localStorage.setItem('sp.theme', d.theme) : localStorage.removeItem('sp.theme'); } catch (_) {}
      SP.applyTheme();
      if (d.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      after(); SP.toast('已保存');
    },
    saveProvider: (d, f) => { const p = S().settings.providers.find((x) => x.id === f.dataset.id); Object.assign(p, { baseUrl: d.baseUrl.trim(), model: d.model.trim(), apiKey: d.apiKey.trim() }); after(); SP.toast('已保存'); },
    saveNet: (d) => { const st = S().settings; st.proxy = d.proxy; st.sync = { enabled: !!d.sync, token: d.token }; after(); if (st.sync.enabled) SP.syncPull(true); else SP.toast('已保存'); },
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || !A[el.dataset.a]) return;
    ev.preventDefault();
    A[el.dataset.a](el.dataset, el);
  });
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('form[data-f]');
    if (!f || !F[f.dataset.f]) return;
    ev.preventDefault();
    const fd = new FormData(f);
    const d = Object.fromEntries(fd.entries());
    F[f.dataset.f](d, f, fd);
    if (['capture', 'addKr'].includes(f.dataset.f)) f.reset();
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.ch === 'goalProg') { find('goals', el.dataset.id).progress = +el.value; after(); }
    if (el.dataset.ch === 'import' && el.files[0]) {
      el.files[0].text().then((txt) => {
        try { const s = JSON.parse(txt); if (!s.agents || !s.settings) throw new Error('不是自驱舱备份文件'); SP.state = SP.migrate(s); after('today'); SP.toast('导入成功'); }
        catch (err) { SP.toast('导入失败：' + err.message, 'err'); }
      });
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'composer' && ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      ev.target.form.requestSubmit();
    }
  });
  document.addEventListener('input', (ev) => {
    if (ev.target.id === 'composer') { ev.target.style.height = 'auto'; ev.target.style.height = Math.min(200, ev.target.scrollHeight) + 'px'; }
  });
})();
