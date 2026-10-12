/* 通用工具：id、日期、转义、Markdown 渲染 */
(function () {
  const SP = (window.SP = window.SP || {});

  SP.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const pad = (n) => String(n).padStart(2, '0');
  SP.dstr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  SP.today = () => SP.dstr(new Date());
  SP.addDays = (s, n) => {
    const d = new Date(s + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return SP.dstr(d);
  };
  SP.hm = (ts) => {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  SP.fmtTime = (ts) => {
    const d = new Date(ts);
    const t = SP.dstr(d);
    return (t === SP.today() ? '今天 ' : t.slice(5) + ' ') + SP.hm(ts);
  };
  SP.weekday = (s) => '日一二三四五六'[new Date((s || SP.today()) + 'T00:00:00').getDay()];

  SP.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  SP.money = (n) => (Math.round(Number(n || 0) * 100) / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 });

  // 轻量 Markdown：标题、列表、粗斜体、行内代码、代码块、引用、表格、链接、分割线
  SP.md = function (src) {
    const esc = SP.esc;
    const inline = (s) =>
      esc(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let out = '', i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (/^```/.test(l)) {
        let code = '';
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) code += lines[i++] + '\n';
        i++;
        out += `<pre><code>${esc(code)}</code></pre>`;
        continue;
      }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { out += `<h${m[1].length + 2}>${inline(m[2])}</h${m[1].length + 2}>`; i++; continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(l)) { out += '<hr>'; i++; continue; }
      if (/^>\s?/.test(l)) {
        let q = '';
        while (i < lines.length && /^>\s?/.test(lines[i])) q += lines[i++].replace(/^>\s?/, '') + '\n';
        out += `<blockquote>${SP.md(q)}</blockquote>`;
        continue;
      }
      if (/^\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
        let t = '<div class="tbl"><table><thead><tr>' + cells(l).map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        i += 2;
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) t += '<tr>' + cells(lines[i++]).map((c) => `<td>${c}</td>`).join('') + '</tr>';
        out += t + '</tbody></table></div>';
        continue;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        const ordered = /^\s*\d/.test(l);
        let items = '';
        while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
          let it = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
          it = it.replace(/^\[( |x)\]\s*/i, (_, x) => (x.trim() ? '☑ ' : '☐ '));
          items += `<li>${inline(it)}</li>`;
        }
        out += ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
        continue;
      }
      if (!l.trim()) { i++; continue; }
      let p = '';
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*([-*+]|\d+[.)])\s+|\|)/.test(lines[i])) p += (p ? '<br>' : '') + inline(lines[i++]);
      if (!p) { p = inline(l); i++; }
      out += `<p>${p}</p>`;
    }
    return out;
  };

  SP.debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  SP.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  SP.download = (name, text, type = 'application/json') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
})();
