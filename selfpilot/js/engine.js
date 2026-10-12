/* 多智能体编排：上下文构建、动作协议、路由（圆桌）、互相请教、工作流、定时调度 */
(function () {
  const SP = window.SP;
  const MAX_HISTORY = 24;

  // ---------- 上下文：每个智能体只看得到被授权的数据 ----------
  SP.buildContext = (agent) => {
    const S = SP.state, t = SP.today(), has = (k) => (agent.tools || []).includes(k);
    const now = new Date();
    const out = [`## 现在\n${t} 星期${SP.weekday(t)} ${SP.hm(now)}`];
    const me = [S.settings.userName && `称呼：${S.settings.userName}`, S.settings.about].filter(Boolean).join('\n');
    if (me) out.push('## 关于我\n' + me);
    if (S.memory.length) out.push('## 长期记忆\n' + S.memory.slice(-30).map((m) => '- ' + m.text).join('\n'));
    if (has('goals') && S.goals.length)
      out.push('## 目标\n' + S.goals.map((g) => `- [${g.id}] ${g.title}（${g.area}，进度 ${g.progress}%${g.deadline ? '，截止 ' + g.deadline : ''}）${g.krs.length ? ' KR：' + g.krs.map((k) => (k.done ? '✓' : '○') + k.text).join('；') : ''}`).join('\n'));
    if (has('tasks')) {
      const open = S.tasks.filter((x) => x.status !== 'done').sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1).slice(0, 40);
      const done = S.tasks.filter((x) => x.status === 'done' && x.doneAt > Date.now() - 7 * 864e5).slice(-15);
      out.push('## 待办任务\n' + (open.map((x) => `- [${x.id}] ${x.title} | 截止:${x.due || '无'} | 优先级:${x.priority} | ${x.status}${x.due && x.due < t ? ' ⚠️已过期' : ''}`).join('\n') || '（无）'));
      if (done.length) out.push('## 近 7 天完成\n' + done.map((x) => `- ${x.title}（${SP.dstr(new Date(x.doneAt))}）`).join('\n'));
    }
    if (has('habits') && S.habits.length) {
      const days = [...Array(7)].map((_, i) => SP.addDays(t, i - 6));
      out.push('## 习惯（近 7 天，最右是今天）\n' + S.habits.map((h) => `- ${h.name}：${days.map((d) => (SP.habitDone(h, d) ? '✓' : '·')).join('')} 连续${SP.streak(h)}天`).join('\n'));
    }
    if (has('journal') && S.journal.length)
      out.push('## 最近日记\n' + S.journal.slice(-5).map((j) => `- ${j.date} 心情${j.mood}/5 精力${j.energy}/5：${j.content.slice(0, 200)}`).join('\n'));
    if (has('notes') && S.notes.length) out.push('## 笔记标题\n' + S.notes.slice(-15).map((n) => `- ${n.title}`).join('\n'));
    if (has('cards')) {
      const decks = [...new Set(S.cards.map((c) => c.deck))];
      out.push(`## 记忆卡\n共 ${S.cards.length} 张，今日到期 ${SP.cardsDue().length} 张；卡组：${decks.join('、') || '无'}`);
    }
    if (has('money')) {
      const mm = SP.monthMoney();
      out.push(`## 本月账本\n支出 ¥${SP.money(mm.out)}，收入 ¥${SP.money(mm.inc)}\n分类：${Object.entries(mm.byCat).map(([k, v]) => `${k} ¥${SP.money(v)}`).join('，') || '无'}\n最近：\n` +
        S.money.slice(-10).map((r) => `- ${r.date} ${r.type === 'in' ? '+' : '-'}¥${r.amount} ${r.category} ${r.note}`).join('\n'));
    }
    return out.join('\n\n');
  };

  SP.buildSystem = (agent, extra) => {
    const acts = Object.entries(SP.ACTIONS).filter(([k]) => SP.canUse(agent, k));
    const team = SP.state.agents.filter((a) => a.enabled && a.id !== agent.id);
    return [
      `你是「${agent.name}」。${agent.role || ''}`,
      agent.prompt || '',
      '# 平台规则\n你是用户个人「自驱舱」多智能体平台中的一员。下面是你有权限看到的用户数据，回答要基于这些真实数据，不要编造。',
      '# 动作协议\n需要修改用户数据时，在回复**末尾**附一个语言标记为 actions 的代码块，内容是 JSON 数组，每项含 type 及参数。例如：\n```actions\n[{"type":"add_task","title":"复习第三章","due":"' + SP.addDays(SP.today(), 1) + '"}]\n```\n可用动作：\n' +
        acts.map(([k, d]) => `- ${k}：${d.label} ${d.schema}`).join('\n') +
        '\n规则：只在确有必要时使用；引用已有条目用方括号里的 id；正文不要复述 JSON；不需要动作就不要输出代码块。',
      team.length ? '# 你的同事（可用 ask_agent 请教）\n' + team.map((a) => `- ${a.name}：${a.role}`).join('\n') : '',
      '# 用户数据\n' + SP.buildContext(agent),
      extra || '',
    ].filter(Boolean).join('\n\n');
  };

  // ---------- 解析 actions 代码块 ----------
  SP.parseActions = (text) => {
    const actions = [];
    const clean = String(text).replace(/```actions\s*([\s\S]*?)(```|$)/g, (_, body) => {
      try {
        let arr = JSON.parse(body.trim());
        if (!Array.isArray(arr)) arr = [arr];
        for (const a of arr) if (a && a.type) { const { type, ...payload } = a; actions.push({ type, payload, status: 'pending' }); }
      } catch (_) { /* 流式未完成或格式错误时忽略 */ }
      return '';
    }).trim();
    return { clean, actions };
  };

  // 线程消息 → 某个智能体视角的 API 消息
  function historyFor(thread, agentId) {
    return thread.messages.filter((m) => !m.error && m.content).slice(-MAX_HISTORY).map((m) => {
      if (m.role === 'user') return { role: 'user', content: m.content };
      // 让后发言的智能体知道前面已经执行过哪些操作，避免重复
      const done = (m.actions || []).filter((x) => x.status === 'done' && x.type !== 'ask_agent').map((x) => x.result);
      const content = m.content + (done.length ? `\n（已执行：${done.join('；')}）` : '');
      if (m.agentId === agentId) return { role: 'assistant', content };
      const a = SP.agent(m.agentId);
      return { role: 'user', content: `【${a ? a.name : '同事'}的发言】\n${content}` };
    });
  }

  SP.newThread = (opts) => {
    const th = { id: SP.uid(), title: opts.title || '新对话', mode: opts.mode || 'council', agentId: opts.agentId || '', messages: [], updated: Date.now() };
    SP.state.threads.unshift(th);
    SP.save();
    return th;
  };

  let aborter = null;
  SP.busy = false;
  SP.stop = () => aborter && aborter.abort();

  // 运行单个智能体并把结果写入线程
  async function runAgentInThread(thread, agent, opts = {}) {
    const msg = { id: SP.uid(), role: 'assistant', agentId: agent.id, content: '', ts: Date.now(), actions: [], streaming: true, note: opts.note || '' };
    thread.messages.push(msg);
    const ui = opts.ui || {};
    ui.onUpdate && ui.onUpdate(thread, msg);
    const messages = historyFor(thread, agent.id);
    if (opts.instruction) messages.push({ role: 'user', content: opts.instruction });
    try {
      const raw = await SP.chat({
        providerId: agent.providerId || SP.state.settings.defaultProviderId,
        model: agent.model,
        temperature: agent.temperature,
        effort: agent.effort,
        system: SP.buildSystem(agent),
        messages,
        signal: aborter && aborter.signal,
        mock: { agent, user: opts.mockUser || lastUserText(thread), kind: opts.kind },
        onDelta: (txt) => { msg.content = SP.parseActions(txt).clean; ui.onUpdate && ui.onUpdate(thread, msg); },
      });
      const { clean, actions } = SP.parseActions(raw);
      msg.content = clean || (actions.length ? '（已执行操作）' : '');
      msg.actions = actions;
    } catch (e) {
      msg.error = true;
      msg.content = e.name === 'AbortError' ? '（已停止）' : '⚠️ ' + e.message;
    }
    msg.streaming = false;
    // 执行动作；ask_agent 触发智能体间协作
    const asks = [];
    for (const act of msg.actions) {
      if (act.type === 'ask_agent') { asks.push(act); continue; }
      if (SP.state.settings.autoApply) SP.applyAction(act, agent.id);
    }
    thread.updated = Date.now();
    SP.save();
    ui.onUpdate && ui.onUpdate(thread, msg);
    const depth = opts.depth || 0;
    for (const act of asks.slice(0, 2)) {
      const target = SP.agentByName(act.payload.agent);
      if (!target || target.id === agent.id || depth >= 2 || (aborter && aborter.signal.aborted)) {
        act.status = 'error'; act.result = target ? '协作层级过深，已跳过' : '找不到智能体：' + act.payload.agent;
        continue;
      }
      act.status = 'done'; act.result = `已请教 ${target.name}`;
      await runAgentInThread(thread, target, {
        ui, depth: depth + 1, note: `应 ${agent.name} 的请求`,
        instruction: `【${agent.name} 请教你】${act.payload.question || ''}`, mockUser: act.payload.question,
      });
    }
    return msg;
  }

  function lastUserText(thread) {
    for (let i = thread.messages.length - 1; i >= 0; i--) if (thread.messages[i].role === 'user') return thread.messages[i].content;
    return '';
  }

  // 圆桌路由：总管判断该由谁回答
  async function route(thread, text) {
    const chief = SP.agent('chief') || SP.state.agents[0];
    const cands = SP.state.agents.filter((a) => a.enabled && a.id !== chief.id);
    const sys = `你是一个路由器。根据用户的话，从下列智能体中选出最合适回答的 0~3 个（只选真正相关的；闲聊或综合问题返回空数组，由总管自己回答）。\n` +
      cands.map((a) => `- id=${a.id}：${a.name}，${a.role}`).join('\n') +
      '\n只输出 JSON，格式：{"agents":["id"],"reason":"一句话"}';
    try {
      const raw = await SP.chat({
        providerId: chief.providerId || SP.state.settings.defaultProviderId, model: chief.model, effort: 'low', maxTokens: 2000,
        system: sys, messages: [{ role: 'user', content: text }], signal: aborter && aborter.signal,
        mock: { kind: 'route', user: text, agent: chief },
      });
      const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      const ids = (j.agents || []).map((x) => SP.agentByName(x)).filter((a) => a && a.enabled && a.id !== chief.id).map((a) => a.id);
      return { ids: [...new Set(ids)].slice(0, 3), reason: j.reason || '' };
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      return { ids: [], reason: '' };
    }
  }

  /** 在线程中发送一条用户消息，按模式/@提及 调度智能体 */
  SP.send = async (thread, text, ui = {}) => {
    if (SP.busy) return;
    SP.busy = true;
    aborter = new AbortController();
    ui.onBusy && ui.onBusy(true);
    try {
      thread.messages.push({ id: SP.uid(), role: 'user', content: text, ts: Date.now() });
      if (thread.title === '新对话') thread.title = text.slice(0, 18);
      thread.updated = Date.now();
      SP.save();
      ui.onUpdate && ui.onUpdate(thread, null);

      const mentioned = [...text.matchAll(/@([一-龥A-Za-z0-9_]+)/g)].map((m) => SP.agentByName(m[1])).filter((a) => a && a.enabled);
      let targets, note = '';
      if (mentioned.length) targets = [...new Set(mentioned)];
      else if (thread.mode === 'agent') targets = [SP.agent(thread.agentId)].filter(Boolean);
      else {
        const r = await route(thread, text);
        targets = r.ids.map(SP.agent);
        note = r.reason;
      }
      const chief = SP.agent('chief') || SP.state.agents[0];
      if (!targets.length) targets = [chief];

      if (targets.length === 1) {
        await runAgentInThread(thread, targets[0], { ui, note: thread.mode === 'council' && targets[0] !== chief ? `总管分派：${note}` : '' });
      } else {
        // 多位专家并行发言，再由总管综合
        await Promise.all(targets.map((a) => runAgentInThread(thread, a, { ui, note: thread.mode === 'council' ? '圆桌发言' : '' })));
        if (thread.mode === 'council' && !aborter.signal.aborted && !targets.includes(chief)) {
          await runAgentInThread(thread, chief, {
            ui, kind: 'synth', note: '综合结论',
            instruction: '以上是各位同事的意见。请综合成一份简洁的最终建议（去重、排优先级、给出下一步），必要时执行动作。不要重复已由同事执行过的动作。',
          });
        }
      }
    } finally {
      SP.busy = false;
      aborter = null;
      ui.onBusy && ui.onBusy(false);
      SP.save();
    }
  };

  // ---------- 工作流 ----------
  SP.runWorkflow = async (wf, ui = {}) => {
    if (SP.busy) throw new Error('有任务正在运行，请稍候');
    SP.busy = true;
    aborter = new AbortController();
    ui.onBusy && ui.onBusy(true);
    const thread = SP.newThread({ title: `${wf.emoji || '⚙️'} ${wf.name} · ${SP.today().slice(5)}`, mode: 'workflow' });
    thread.workflowId = wf.id;
    ui.onStart && ui.onStart(thread);
    try {
      for (const st of wf.steps) {
        const a = SP.agent(st.agentId);
        if (!a || !a.enabled || aborter.signal.aborted) continue;
        thread.messages.push({ id: SP.uid(), role: 'user', step: true, content: `@${a.name} ${st.prompt}`, ts: Date.now() });
        await runAgentInThread(thread, a, { ui, mockUser: st.prompt, kind: 'step' });
      }
      const s = SP.agent(wf.synthAgentId);
      if (s && s.enabled && wf.synthPrompt && !aborter.signal.aborted) {
        thread.messages.push({ id: SP.uid(), role: 'user', step: true, content: `@${s.name} ${wf.synthPrompt}`, ts: Date.now() });
        await runAgentInThread(thread, s, { ui, kind: 'synth', note: '汇总' });
      }
      wf.lastRun = SP.today();
      wf.lastThreadId = thread.id;
      SP.log('', `运行工作流「${wf.name}」`);
      if (SP.state.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
        const last = thread.messages[thread.messages.length - 1];
        new Notification(`自驱舱 · ${wf.name}`, { body: (last && last.content || '').slice(0, 120) });
      }
    } finally {
      SP.busy = false;
      aborter = null;
      SP.save();
      ui.onBusy && ui.onBusy(false);
    }
    return thread;
  };

  // 页面打开期间按时间触发；错过的当天补跑一次
  SP.dueWorkflows = () => {
    const now = new Date(), t = SP.today(), hm = SP.hm(now);
    return SP.state.workflows.filter((w) => {
      if (!w.enabled || w.trigger.type === 'manual' || w.lastRun === t) return false;
      if (w.trigger.type === 'weekly' && now.getDay() !== Number(w.trigger.day)) return false;
      return hm >= (w.trigger.time || '00:00');
    });
  };
})();
