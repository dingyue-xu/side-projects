/* 模型调用层：Anthropic Messages API、OpenAI 兼容 Chat Completions、离线模拟 */
(function () {
  const SP = window.SP;

  SP.proxyAvailable = false; // 由 app 启动时探测 server.mjs 是否在
  const useProxy = () => {
    const m = SP.state.settings.proxy;
    return m === 'on' || (m === 'auto' && SP.proxyAvailable);
  };

  async function send(url, headers, body, signal) {
    let res;
    try {
      if (useProxy()) {
        const h = { ...headers, 'x-sp-target': url };
        if (SP.state.settings.sync.token) h['x-sp-token'] = SP.state.settings.sync.token;
        res = await fetch('proxy', { method: 'POST', headers: h, body: JSON.stringify(body), signal });
      } else {
        res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new Error(
        `网络请求失败（${e.message}）。可能是浏览器跨域限制：请用 \`node server.mjs\` 启动自驱舱（自带转发代理），或换用支持浏览器直连的服务商。`
      );
    }
    if (!res.ok) {
      let t = await res.text().catch(() => '');
      try { const j = JSON.parse(t); t = (j.error && (j.error.message || j.error)) || j.message || t; } catch (_) {}
      throw new Error(`模型接口返回 ${res.status}：${String(t).slice(0, 300)}`);
    }
    return res;
  }

  // 逐行读取 SSE，回调每个 data: 负载
  async function readSSE(res, onData) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line.startsWith('data:')) onData(line.slice(5).trim());
      }
    }
    if (buf.trim().startsWith('data:')) onData(buf.trim().slice(5).trim());
  }

  // 合并相邻同角色消息，保证首条为 user、末条为 user
  function normalize(messages) {
    const out = [];
    for (const m of messages) {
      if (!m.content) continue;
      const last = out[out.length - 1];
      if (last && last.role === m.role) last.content += '\n\n' + m.content;
      else out.push({ role: m.role, content: m.content });
    }
    while (out.length && out[0].role !== 'user') out.shift();
    if (!out.length || out[out.length - 1].role !== 'user') out.push({ role: 'user', content: '请继续。' });
    return out;
  }

  // 支持服务端兜底的 Claude 型号：被安全分类器拒绝时自动换模型重试
  const FALLBACK_MODELS = /^claude-(opus-5|fable-5-1|sonnet-5-5)/;

  async function anthropic(p, o) {
    const model = o.model || p.model;
    const body = { model, max_tokens: o.maxTokens || 16000, system: o.system, messages: normalize(o.messages), stream: true };
    if (!/haiku-4|claude-3/.test(model)) body.output_config = { effort: o.effort || 'medium' };
    const headers = {
      'content-type': 'application/json',
      'x-api-key': p.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (FALLBACK_MODELS.test(model)) {
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
      body.fallbacks = 'default';
    }
    const res = await send(p.baseUrl.replace(/\/$/, '') + '/v1/messages', headers, body, o.signal);
    let text = '', stop = '';
    await readSSE(res, (d) => {
      let ev;
      try { ev = JSON.parse(d); } catch (_) { return; }
      if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
        text += ev.delta.text;
        o.onDelta && o.onDelta(text);
      } else if (ev.type === 'message_delta' && ev.delta) stop = ev.delta.stop_reason || stop;
      else if (ev.type === 'error') throw new Error((ev.error && ev.error.message) || '流式响应出错');
    });
    if (stop === 'refusal') text += '\n\n> ⚠️ 模型拒绝了这次请求，换个说法试试。';
    if (stop === 'max_tokens') text += '\n\n> （回复过长被截断）';
    return text;
  }

  async function openai(p, o) {
    const body = {
      model: o.model || p.model,
      messages: [{ role: 'system', content: o.system }, ...normalize(o.messages)],
      stream: true,
    };
    if (o.temperature !== undefined && o.temperature !== '') body.temperature = Number(o.temperature);
    const headers = { 'content-type': 'application/json' };
    if (p.apiKey) headers.authorization = 'Bearer ' + p.apiKey;
    const res = await send(p.baseUrl.replace(/\/$/, '') + '/chat/completions', headers, body, o.signal);
    let text = '';
    await readSSE(res, (d) => {
      if (d === '[DONE]') return;
      let ev;
      try { ev = JSON.parse(d); } catch (_) { return; }
      if (ev.error) throw new Error(ev.error.message || '流式响应出错');
      const c = ev.choices && ev.choices[0] && ev.choices[0].delta && ev.choices[0].delta.content;
      if (c) { text += c; o.onDelta && o.onDelta(text); }
    });
    return text;
  }

  async function mock(p, o) {
    const text = SP.mockReply(o.mock || {});
    let shown = '';
    const step = Math.max(2, Math.ceil(text.length / 60));
    for (let i = 0; i < text.length; i += step) {
      if (o.signal && o.signal.aborted) throw new DOMException('aborted', 'AbortError');
      shown = text.slice(0, i + step);
      o.onDelta && o.onDelta(shown);
      await SP.sleep(12);
    }
    return text;
  }

  /**
   * o: { providerId, model, system, messages:[{role,content}], temperature, effort, onDelta, signal, mock }
   */
  SP.chat = async (o) => {
    const p = SP.provider(o.providerId);
    if (!p) throw new Error('没有可用的模型服务商，请到「设置」中配置。');
    if (p.type === 'mock') return mock(p, o);
    if (!p.apiKey && !/localhost|127\.0\.0\.1/.test(p.baseUrl)) throw new Error(`「${p.name}」还没有填写 API Key，请到「设置 → 模型服务商」填写。`);
    if (p.type === 'anthropic') return anthropic(p, o);
    return openai(p, o);
  };

  SP.isMockMode = () => {
    const p = SP.provider(SP.state.settings.defaultProviderId);
    return !p || p.type === 'mock';
  };

  // ---------------- 离线模拟（无需 Key 即可体验完整流程） ----------------
  SP.mockReply = (m) => {
    const a = m.agent || { name: '助手', id: '' };
    const u = String(m.user || '');
    const S = SP.state;
    if (m.kind === 'route') {
      const kw = {
        coach: /学|书|课|考|背|单词|知识|笔记|复习|英语|编程/,
        planner: /计划|安排|任务|待办|提醒|拖延|时间|日程|deadline|截止|今天做/,
        health: /睡|运动|跑|健身|饮食|喝水|累|精力|体重|习惯|打卡/,
        finance: /钱|花|元|块|买|工资|预算|存|账|消费/,
        mentor: /复盘|心情|焦虑|难过|开心|感受|日记|反思|迷茫/,
      };
      const ids = Object.keys(kw).filter((k) => kw[k].test(u) && SP.agent(k) && SP.agent(k).enabled);
      return JSON.stringify({ agents: ids.slice(0, 3), reason: ids.length ? '按关键词分派' : '总管直接处理' });
    }
    const acts = [];
    // 按分句识别意图：一句话里可以同时记账、建任务、打卡
    if (!m.kind) for (const c of u.split(/[，。,;；!！\n]|另外|还有|然后/).map((x) => x.trim()).filter(Boolean)) {
      const num = c.match(/(\d+(?:\.\d+)?)\s*(元|块|rmb|¥)?/i);
      if (/花|买|付|元|块/.test(c) && num && SP.canUse(a, 'add_expense')) {
        const cat = /饭|餐|咖啡|奶茶|吃/.test(c) ? '餐饮' : /车|地铁|打车|油/.test(c) ? '交通' : /书|课/.test(c) ? '学习' : '其他';
        acts.push({ type: 'add_expense', amount: Number(num[1]), category: cat, note: c.slice(0, 20) });
        continue;
      }
      const tm = c.match(/(?:提醒我|记得|待办[:：]?|我要|要)\s*(?:明天|今天|后天)?\s*(.{2,24})$/);
      if (tm && SP.canUse(a, 'add_task')) {
        acts.push({ type: 'add_task', title: tm[1], due: /明天/.test(c) ? SP.addDays(SP.today(), 1) : /后天/.test(c) ? SP.addDays(SP.today(), 2) : SP.today() });
        continue;
      }
      for (const h of S.habits) {
        const key = h.name.replace(/\d+.*$/, '').slice(0, 2);
        if (key && c.includes(key) && /了|完|打卡/.test(c) && SP.canUse(a, 'check_habit')) acts.push({ type: 'check_habit', habit: h.name });
      }
      if (/什么是|怎么理解|概念/.test(c) && SP.canUse(a, 'add_card'))
        acts.push({ type: 'add_card', front: c.replace(/[?？。]/g, '').slice(0, 30) + '？', back: '（演示模式下的示例答案，接入真实模型后会生成真正的讲解）', deck: '演示' });
      if (/心情|感觉/.test(c) && /累|开心|难过|焦虑|不错/.test(c) && SP.canUse(a, 'add_journal'))
        acts.push({ type: 'add_journal', content: c, mood: /开心|不错/.test(c) ? 4 : 2, energy: /累/.test(c) ? 2 : 3 });
    }

    const open = S.tasks.filter((t) => t.status !== 'done');
    const overdue = open.filter((t) => t.due && t.due < SP.today());
    const mm = SP.monthMoney();
    const lines = [];
    if (m.kind === 'synth') {
      lines.push(`**${a.emoji || ''} ${a.name}汇总**`, '');
      lines.push(`- 今日重点：${open.slice(0, 3).map((t) => t.title).join('、') || '暂无待办，适合推进长期目标'}`);
      lines.push(`- 学习：${SP.cardsDue().length} 张记忆卡待复习，建议先花 15 分钟清掉。`);
      lines.push(`- 健康：${S.habits.map((h) => `${h.emoji}${h.name} 连续${SP.streak(h)}天`).join('，') || '还没有习惯'}`);
      lines.push(`- 本月支出 ¥${SP.money(mm.out)}。`, '', '小步快跑，今天也只需要比昨天好一点点 💪');
    } else {
      const byAgent = {
        chief: () => [`收到。${u ? '我理解你想要：「' + u.slice(0, 40) + '」。' : ''}`, `当前有 ${open.length} 个待办${overdue.length ? `（${overdue.length} 个已过期）` : ''}，建议下一步：`, `1. 先处理最小的一件事，建立势能`, `2. 有专业问题可以 @学习教练 / @健康管家 等直接找对应管家`],
        coach: () => [`📚 学习建议：`, `- 先用 5 分钟说清楚“这个知识点要解决什么问题”`, `- 用自己的话讲一遍，卡壳的地方就是要复习的地方`, `- 目前有 **${SP.cardsDue().length}** 张卡片到期，建议今天复习完`],
        planner: () => [`⏱️ 今日安排建议：`, ...open.slice(0, 3).map((t, i) => `${i + 1}. ${t.title}${t.due ? `（${t.due}）` : ''}`), overdue.length ? `> ${overdue.length} 个任务已过期，建议重新排期或直接删掉。` : `> 时间块：上午深度工作 90 分钟，下午处理杂事。`],
        health: () => [`🌿 习惯状态：`, ...S.habits.map((h) => `- ${h.emoji} ${h.name}：连续 ${SP.streak(h)} 天${SP.habitDone(h) ? ' ✓' : ''}`), `今天的小提醒：睡前 30 分钟放下手机。`],
        finance: () => [`💰 本月支出 ¥${SP.money(mm.out)}，收入 ¥${SP.money(mm.inc)}。`, ...Object.entries(mm.byCat).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `- ${k}：¥${SP.money(v)}`)],
        mentor: () => [`🪞 复盘一下：`, `- 做成了什么：完成了 ${S.tasks.filter((t) => t.status === 'done').length} 个任务`, `- 卡在哪里：${overdue[0] ? '「' + overdue[0].title + '」一直没动' : '暂时没有明显卡点'}`, `- 明天改一件事：把最难的事放到精力最好的时段。`],
      };
      const f = byAgent[a.id] || (() => [`${a.emoji || '🤖'} ${a.name}：我已了解情况。`, `（演示模式回复。配置真实模型后，我会按你定义的角色设定来回答。）`]);
      lines.push(...f());
    }
    if (acts.length) lines.push('', '```actions', JSON.stringify(acts, null, 0), '```');
    return lines.join('\n');
  };
})();
