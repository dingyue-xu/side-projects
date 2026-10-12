/* 状态、默认智能体/工作流、持久化、动作执行 */
(function () {
  const SP = window.SP;
  const KEY = 'selfpilot.v1';

  // 智能体可被授予的“工具”= 可读写的数据域
  SP.TOOLS = {
    tasks: '任务',
    goals: '目标',
    habits: '习惯',
    journal: '日记',
    notes: '笔记',
    cards: '记忆卡',
    money: '账本',
    memory: '长期记忆',
  };

  SP.PROVIDER_PRESETS = [
    { id: 'mock', name: '演示模式（离线模拟）', type: 'mock', baseUrl: '', model: 'mock' },
    { id: 'anthropic', name: 'Claude（Anthropic）', type: 'anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-opus-5-5' },
    { id: 'deepseek', name: 'DeepSeek', type: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { id: 'qwen', name: '通义千问（DashScope）', type: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
    { id: 'moonshot', name: 'Kimi（Moonshot）', type: 'openai', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
    { id: 'zhipu', name: '智谱 GLM', type: 'openai', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
    { id: 'openai', name: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
    { id: 'ollama', name: 'Ollama（本地模型）', type: 'openai', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5:7b' },
  ];

  const ALL_TOOLS = Object.keys(SP.TOOLS);

  SP.defaultAgents = () => [
    {
      id: 'chief', name: '总管', emoji: '🧭', color: '#3b6fd8', builtin: true, enabled: true,
      role: '理解你的意图，分派给合适的智能体，最后汇总成一份可执行的结论。',
      tools: ALL_TOOLS.slice(),
      prompt:
        '你是我的个人“总管”，负责统筹我的学习与生活。你了解团队里每位智能体的专长。\n' +
        '- 先抓住我真正想要的，再给出清晰、可执行的下一步（最多 3 条）。\n' +
        '- 能直接记录的事（任务、开销、灵感）就直接用动作记录，不要只停留在建议。\n' +
        '- 需要专业意见时用 ask_agent 请教对应智能体。\n- 语气简洁、温和、务实，中文回答。',
    },
    {
      id: 'coach', name: '学习教练', emoji: '📚', color: '#7b4fd8', builtin: true, enabled: true,
      role: '制定学习计划、拆解知识点、出记忆卡、费曼式讲解与检测。',
      tools: ['tasks', 'goals', 'notes', 'cards', 'memory'],
      prompt:
        '你是我的学习教练，熟悉刻意练习、费曼学习法与间隔重复。\n' +
        '- 把大目标拆成每周/每天可完成的学习任务（单次 25~50 分钟）。\n' +
        '- 讲解知识时先给直觉，再给要点，最后出 1~3 道自测题。\n' +
        '- 关键概念主动生成记忆卡（add_card），正面是问题，背面是简洁答案。\n- 重要的学习结论写入笔记（add_note）。',
    },
    {
      id: 'planner', name: '时间管家', emoji: '⏱️', color: '#d8833b', builtin: true, enabled: true,
      role: '排优先级、做日/周计划、时间块安排，防止拖延。',
      tools: ['tasks', 'goals', 'memory'],
      prompt:
        '你是我的时间管家，用“重要-紧急”矩阵和时间块方法帮我安排。\n' +
        '- 每天最多 3 件最重要的事（MIT），给出建议的时间块。\n' +
        '- 发现任务过大就拆分，过期就帮我重新排期（update_task）。\n- 保持现实：留缓冲，别排满。',
    },
    {
      id: 'health', name: '健康管家', emoji: '🌿', color: '#2f9e6b', builtin: true, enabled: true,
      role: '睡眠、运动、饮食与习惯养成，关注精力状态。',
      tools: ['habits', 'journal', 'memory'],
      prompt:
        '你是我的健康管家，关注睡眠、运动、饮食和精力。\n' +
        '- 用微习惯思路：从小处开始，强调连续性而不是强度。\n' +
        '- 我说做了某件事（跑步、早睡、喝水）就帮我打卡（check_habit）。\n' +
        '- 不做医疗诊断；出现明显健康问题时建议就医。',
    },
    {
      id: 'finance', name: '财务管家', emoji: '💰', color: '#c2a12a', builtin: true, enabled: true,
      role: '记账、预算、消费分析与储蓄目标。',
      tools: ['money', 'goals', 'memory'],
      prompt:
        '你是我的财务管家。\n- 我提到花钱/收入时，直接记账（add_expense），分类尽量统一：餐饮、交通、购物、学习、娱乐、居住、医疗、其他、收入。\n' +
        '- 定期指出最大的开销类别与可优化点，给出具体可执行的建议。\n- 不提供具体投资标的推荐。',
    },
    {
      id: 'mentor', name: '复盘导师', emoji: '🪞', color: '#c24f7a', builtin: true, enabled: true,
      role: '日记、情绪觉察、每日/每周复盘，帮你看见进步与模式。',
      tools: ['journal', 'goals', 'tasks', 'habits', 'memory'],
      prompt:
        '你是我的复盘导师，温和但不讨好。\n- 复盘结构：做成了什么 → 卡在哪里 → 学到什么 → 明天改一件事。\n' +
        '- 我分享感受时先共情再引导，必要时帮我写成日记（add_journal）。\n' +
        '- 发现我反复出现的模式时，把它写入长期记忆（remember）。',
    },
  ];

  SP.defaultWorkflows = () => [
    {
      id: 'morning', name: '晨间启动', emoji: '🌅', enabled: true,
      desc: '时间管家排今天的重点，学习教练和健康管家补充，总管汇总成晨间简报。',
      trigger: { type: 'daily', time: '07:30', day: 0 },
      steps: [
        { agentId: 'planner', prompt: '根据我的任务和目标，选出今天最重要的 1~3 件事，并给出时间块建议。如有过期任务，帮我重新排期。' },
        { agentId: 'coach', prompt: '今天的学习安排是什么？结合待复习的记忆卡数量，给一个 30~60 分钟的学习计划。' },
        { agentId: 'health', prompt: '看看我最近的习惯打卡，给今天一个具体的小提醒（一句话）。' },
      ],
      synthAgentId: 'chief',
      synthPrompt: '把上面各位的建议整合成一份不超过 250 字的「晨间简报」：今日重点、学习、健康提醒、一句鼓励。',
      lastRun: '',
    },
    {
      id: 'evening', name: '晚间复盘', emoji: '🌙', enabled: true,
      desc: '复盘导师根据今天完成情况做复盘，并留下明天要改进的一件事。',
      trigger: { type: 'daily', time: '21:30', day: 0 },
      steps: [
        { agentId: 'mentor', prompt: '根据今天的任务完成、习惯打卡和日记，帮我做今日复盘（做成了什么/卡点/收获/明天改一件事），并把复盘摘要写入日记。' },
      ],
      synthAgentId: '',
      synthPrompt: '',
      lastRun: '',
    },
    {
      id: 'weekly', name: '周复盘', emoji: '📊', enabled: true,
      desc: '每周日晚，各管家汇报本周数据，复盘导师给出下周方向。',
      trigger: { type: 'weekly', time: '20:00', day: 0 },
      steps: [
        { agentId: 'planner', prompt: '总结本周任务完成情况，指出拖延最多的事项。' },
        { agentId: 'health', prompt: '总结本周习惯打卡情况和精力变化。' },
        { agentId: 'finance', prompt: '总结本周与本月的收支，指出最大开销类别。' },
        { agentId: 'coach', prompt: '总结本周学习进展（笔记、记忆卡），建议下周学习重点。' },
      ],
      synthAgentId: 'mentor',
      synthPrompt: '基于以上汇报写一份周复盘：本周亮点、问题模式、下周 3 个重点，并把下周重点加为任务。',
      lastRun: '',
    },
  ];

  function seed(s) {
    const t = SP.today();
    const g1 = SP.uid();
    s.goals = [
      { id: g1, title: '三个月读完 6 本书并输出笔记', area: '学习', deadline: SP.addDays(t, 90), progress: 15, krs: [{ text: '每天阅读 30 分钟', done: false }, { text: '每本书写一篇读书笔记', done: false }] },
      { id: SP.uid(), title: '体脂降到 20% 以下', area: '健康', deadline: SP.addDays(t, 120), progress: 10, krs: [{ text: '每周运动 3 次', done: false }] },
    ];
    s.tasks = [
      { id: SP.uid(), title: '读《原子习惯》第 3 章', notes: '', due: t, priority: 'high', status: 'todo', goalId: g1, created: Date.now(), doneAt: 0 },
      { id: SP.uid(), title: '整理本周学习笔记', notes: '', due: SP.addDays(t, 1), priority: 'mid', status: 'todo', goalId: '', created: Date.now(), doneAt: 0 },
      { id: SP.uid(), title: '预约体检', notes: '', due: SP.addDays(t, -1), priority: 'mid', status: 'todo', goalId: '', created: Date.now(), doneAt: 0 },
    ];
    const log = {};
    for (let i = 1; i <= 5; i++) log[SP.addDays(t, -i)] = 1;
    s.habits = [
      { id: SP.uid(), name: '阅读 30 分钟', emoji: '📖', log },
      { id: SP.uid(), name: '运动', emoji: '🏃', log: { [SP.addDays(t, -1)]: 1, [SP.addDays(t, -3)]: 1 } },
      { id: SP.uid(), name: '23:30 前睡觉', emoji: '😴', log: { [SP.addDays(t, -2)]: 1 } },
    ];
    s.cards = [
      { id: SP.uid(), front: '原子习惯的“四大定律”是什么？', back: '让它显而易见、有吸引力、简便易行、令人愉悦', deck: '读书', ease: 2.5, interval: 0, reps: 0, due: t },
      { id: SP.uid(), front: '费曼学习法的核心步骤？', back: '选概念 → 讲给外行听 → 找卡壳处回炉 → 简化与类比', deck: '方法论', ease: 2.5, interval: 0, reps: 0, due: t },
    ];
    s.money = [
      { id: SP.uid(), date: t, amount: 32, category: '餐饮', note: '午饭', type: 'out' },
      { id: SP.uid(), date: SP.addDays(t, -1), amount: 89, category: '学习', note: '买书', type: 'out' },
    ];
    s.journal = [
      { id: SP.uid(), date: SP.addDays(t, -1), mood: 4, energy: 3, content: '读书状态不错，但晚上刷手机拖到很晚才睡。', tags: ['睡眠'] },
    ];
    s.notes = [{ id: SP.uid(), title: '欢迎使用自驱舱', content: '这是一条示例笔记。你可以让学习教练把学到的东西写成笔记，或在这里手动记录。', tags: ['示例'], created: Date.now(), updated: Date.now() }];
    s.memory = [{ id: SP.uid(), text: '我更喜欢早上学习，晚上精力较差。', agentId: '', ts: Date.now() }];
  }

  SP.defaultState = () => {
    const s = {
      version: 1,
      updatedAt: Date.now(),
      settings: {
        userName: '',
        about: '',
        providers: SP.PROVIDER_PRESETS.map((p) => ({ ...p, apiKey: '' })),
        defaultProviderId: 'mock',
        autoApply: true,
        proxy: 'auto', // auto | on | off
        sync: { enabled: false, token: '' },
        notify: false,
      },
      agents: SP.defaultAgents(),
      workflows: SP.defaultWorkflows(),
      threads: [],
      tasks: [], goals: [], habits: [], journal: [], notes: [], cards: [], money: [], memory: [],
      activity: [],
    };
    seed(s);
    return s;
  };

  // ---------- 持久化 ----------
  SP.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return SP.migrate(JSON.parse(raw));
    } catch (e) { console.warn('load failed', e); }
    return SP.defaultState();
  };

  SP.migrate = (s) => {
    const d = SP.defaultState();
    for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
    s.settings = { ...d.settings, ...s.settings };
    // 新增的内置服务商补进去
    for (const p of d.settings.providers) if (!s.settings.providers.find((x) => x.id === p.id)) s.settings.providers.push(p);
    return s;
  };

  const listeners = [];
  SP.onSave = (fn) => listeners.push(fn);
  const writeLocal = SP.debounce(() => {
    try { localStorage.setItem(KEY, JSON.stringify(SP.state)); } catch (e) { SP.toast && SP.toast('本地存储写入失败：' + e.message, 'err'); }
    listeners.forEach((f) => f());
  }, 300);
  SP.save = () => { SP.state.updatedAt = Date.now(); writeLocal(); };

  SP.log = (agentId, text) => {
    SP.state.activity.unshift({ ts: Date.now(), agentId, text });
    SP.state.activity.length = Math.min(SP.state.activity.length, 300);
  };

  // ---------- 查询助手 ----------
  SP.agent = (id) => SP.state.agents.find((a) => a.id === id);
  SP.agentByName = (name) => {
    const n = String(name || '').replace(/^@/, '').trim();
    return SP.state.agents.find((a) => a.id === n || a.name === n) || SP.state.agents.find((a) => n && (a.name.includes(n) || n.includes(a.name)));
  };
  SP.provider = (id) => SP.state.settings.providers.find((p) => p.id === id) || SP.state.settings.providers.find((p) => p.id === SP.state.settings.defaultProviderId);
  SP.habitDone = (h, d) => !!(h.log && h.log[d || SP.today()]);
  SP.streak = (h) => {
    let n = 0, d = SP.today();
    if (!SP.habitDone(h, d)) d = SP.addDays(d, -1);
    while (SP.habitDone(h, d)) { n++; d = SP.addDays(d, -1); }
    return n;
  };
  SP.cardsDue = () => SP.state.cards.filter((c) => c.due <= SP.today());
  SP.monthMoney = (ym) => {
    ym = ym || SP.today().slice(0, 7);
    const rows = SP.state.money.filter((m) => m.date.startsWith(ym));
    const out = rows.filter((r) => r.type !== 'in').reduce((a, r) => a + Number(r.amount), 0);
    const inc = rows.filter((r) => r.type === 'in').reduce((a, r) => a + Number(r.amount), 0);
    const byCat = {};
    rows.filter((r) => r.type !== 'in').forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + Number(r.amount)));
    return { out, inc, byCat, rows };
  };

  // 间隔重复 SM-2：q = 0 忘了 / 3 模糊 / 4 记得 / 5 很熟
  SP.reviewCard = (c, q) => {
    if (q < 3) { c.reps = 0; c.interval = 1; }
    else {
      c.reps = (c.reps || 0) + 1;
      c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.round((c.interval || 1) * c.ease);
      if (q === 5) c.interval = Math.round(c.interval * 1.3);
    }
    c.ease = Math.max(1.3, (c.ease || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    c.due = SP.addDays(SP.today(), c.interval);
  };

  // ---------- 动作：智能体对数据的读写 ----------
  const findBy = (list, ref, field) => {
    if (!ref) return null;
    const r = String(ref).trim();
    return list.find((x) => x.id === r) || list.find((x) => x[field] === r) || list.find((x) => String(x[field]).includes(r) || r.includes(String(x[field])));
  };

  SP.ACTIONS = {
    add_task: { tool: 'tasks', label: '新建任务', schema: '{"title":"","due":"YYYY-MM-DD 可选","priority":"high|mid|low 可选","notes":"可选"}',
      run(p) {
        if (!p.title) throw new Error('缺少 title');
        const t = { id: SP.uid(), title: p.title, notes: p.notes || '', due: p.due || '', priority: p.priority || 'mid', status: 'todo', goalId: '', created: Date.now(), doneAt: 0 };
        if (p.goal) { const g = findBy(SP.state.goals, p.goal, 'title'); if (g) t.goalId = g.id; }
        SP.state.tasks.push(t);
        return `任务「${t.title}」${t.due ? '（' + t.due + '）' : ''}`;
      } },
    update_task: { tool: 'tasks', label: '更新任务', schema: '{"task":"任务id或标题","status":"todo|doing|done 可选","due":"可选","priority":"可选","title":"可选"}',
      run(p) {
        const t = findBy(SP.state.tasks, p.task || p.id || p.title_ref, 'title');
        if (!t) throw new Error('找不到任务：' + (p.task || p.id));
        ['due', 'priority', 'notes'].forEach((k) => p[k] !== undefined && (t[k] = p[k]));
        if (p.title && p.task) t.title = p.title;
        if (p.status) { t.status = p.status; t.doneAt = p.status === 'done' ? Date.now() : 0; }
        return `任务「${t.title}」→ ${p.status === 'done' ? '已完成' : '已更新'}`;
      } },
    add_goal: { tool: 'goals', label: '新建目标', schema: '{"title":"","area":"学习|健康|事业|财务|生活","deadline":"YYYY-MM-DD","krs":["关键结果1"]}',
      run(p) {
        if (!p.title) throw new Error('缺少 title');
        SP.state.goals.push({ id: SP.uid(), title: p.title, area: p.area || '生活', deadline: p.deadline || '', progress: 0, krs: (p.krs || []).map((k) => ({ text: String(k), done: false })) });
        return `目标「${p.title}」`;
      } },
    update_goal: { tool: 'goals', label: '更新目标', schema: '{"goal":"目标id或标题","progress":0-100}',
      run(p) {
        const g = findBy(SP.state.goals, p.goal || p.id, 'title');
        if (!g) throw new Error('找不到目标');
        if (p.progress !== undefined) g.progress = Math.max(0, Math.min(100, Number(p.progress)));
        return `目标「${g.title}」进度 ${g.progress}%`;
      } },
    add_habit: { tool: 'habits', label: '新建习惯', schema: '{"name":"","emoji":"可选"}',
      run(p) {
        if (!p.name) throw new Error('缺少 name');
        SP.state.habits.push({ id: SP.uid(), name: p.name, emoji: p.emoji || '✅', log: {} });
        return `习惯「${p.name}」`;
      } },
    check_habit: { tool: 'habits', label: '习惯打卡', schema: '{"habit":"习惯名称","date":"YYYY-MM-DD 可选"}',
      run(p) {
        const h = findBy(SP.state.habits, p.habit || p.name, 'name');
        if (!h) throw new Error('找不到习惯：' + (p.habit || p.name));
        h.log[p.date || SP.today()] = 1;
        return `「${h.name}」打卡 ✓（连续 ${SP.streak(h)} 天）`;
      } },
    add_journal: { tool: 'journal', label: '写日记', schema: '{"content":"","mood":1-5,"energy":1-5,"tags":["可选"]}',
      run(p) {
        if (!p.content) throw new Error('缺少 content');
        SP.state.journal.push({ id: SP.uid(), date: p.date || SP.today(), mood: Number(p.mood) || 3, energy: Number(p.energy) || 3, content: p.content, tags: p.tags || [] });
        return '日记一篇';
      } },
    add_note: { tool: 'notes', label: '写笔记', schema: '{"title":"","content":"markdown","tags":["可选"]}',
      run(p) {
        if (!p.title) throw new Error('缺少 title');
        SP.state.notes.push({ id: SP.uid(), title: p.title, content: p.content || '', tags: p.tags || [], created: Date.now(), updated: Date.now() });
        return `笔记「${p.title}」`;
      } },
    add_card: { tool: 'cards', label: '记忆卡', schema: '{"front":"问题","back":"答案","deck":"卡组 可选"}',
      run(p) {
        if (!p.front || !p.back) throw new Error('缺少 front/back');
        SP.state.cards.push({ id: SP.uid(), front: p.front, back: p.back, deck: p.deck || '默认', ease: 2.5, interval: 0, reps: 0, due: SP.today() });
        return `记忆卡「${p.front.slice(0, 18)}」`;
      } },
    add_expense: { tool: 'money', label: '记账', schema: '{"amount":数字,"category":"餐饮|交通|购物|学习|娱乐|居住|医疗|其他|收入","note":"","type":"out|in","date":"可选"}',
      run(p) {
        const amt = Number(p.amount);
        if (!amt) throw new Error('金额无效');
        const type = p.type === 'in' || p.category === '收入' ? 'in' : 'out';
        SP.state.money.push({ id: SP.uid(), date: p.date || SP.today(), amount: Math.abs(amt), category: p.category || (type === 'in' ? '收入' : '其他'), note: p.note || '', type });
        return `${type === 'in' ? '收入' : '支出'} ¥${SP.money(amt)} · ${p.category || '其他'}`;
      } },
    remember: { tool: 'memory', label: '记住', schema: '{"text":"关于我的长期事实/偏好"}',
      run(p, agentId) {
        if (!p.text) throw new Error('缺少 text');
        SP.state.memory.push({ id: SP.uid(), text: p.text, agentId: agentId || '', ts: Date.now() });
        return `记住：${p.text}`;
      } },
    ask_agent: { tool: null, label: '请教', schema: '{"agent":"智能体名称","question":"要请教的问题"}', run() { return ''; } },
  };

  SP.canUse = (agent, type) => {
    const a = SP.ACTIONS[type];
    if (!a) return false;
    return a.tool === null || (agent.tools || []).includes(a.tool);
  };

  // 多个智能体并行时可能重复记录同一件事：短时间内的相同新增直接跳过
  SP.isDuplicate = (act) => {
    const p = act.payload || {}, recent = Date.now() - 10 * 60e3;
    if (act.type === 'add_task' && SP.state.tasks.some((t) => t.status !== 'done' && t.title === p.title)) return `任务「${p.title}」已存在，跳过`;
    if (act.type === 'add_expense' && SP.state.activity.some((x) => x.ts > recent && x.text.includes(`¥${SP.money(Math.abs(Number(p.amount)))} · ${p.category || '其他'}`))) return '相同的账目刚记过，跳过';
    if (act.type === 'add_card' && SP.state.cards.some((c) => c.front === p.front)) return '相同的卡片已存在，跳过';
    if (act.type === 'add_habit' && SP.state.habits.some((h) => h.name === p.name)) return `习惯「${p.name}」已存在，跳过`;
    if (act.type === 'remember' && SP.state.memory.some((m) => m.text === p.text)) return '已记住过，跳过';
    return '';
  };

  SP.applyAction = (act, agentId) => {
    const agent = SP.agent(agentId) || { tools: [] };
    const def = SP.ACTIONS[act.type];
    try {
      if (!def) throw new Error('未知动作');
      if (!SP.canUse(agent, act.type)) throw new Error(`${agent.name || '该智能体'} 没有「${SP.TOOLS[def.tool]}」权限`);
      const dup = SP.isDuplicate(act);
      if (dup) { act.status = 'done'; act.result = dup; SP.save(); return act; }
      const msg = def.run(act.payload || {}, agentId);
      act.status = 'done';
      act.result = msg;
      SP.log(agentId, `${def.label}：${msg}`);
    } catch (e) {
      act.status = 'error';
      act.result = e.message;
    }
    SP.save();
    return act;
  };
})();
