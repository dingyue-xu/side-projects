/* 启动：加载数据、探测服务端、多端同步、定时工作流 */
(function () {
  const SP = window.SP;
  SP.state = SP.load();

  SP.applyTheme = () => {
    let t = '';
    try { t = localStorage.getItem('sp.theme') || ''; } catch (_) {}
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  };
  SP.applyTheme();

  const authHeaders = () => (SP.state.settings.sync.token ? { 'x-sp-token': SP.state.settings.sync.token } : {});

  // ---------- 与 server.mjs 同步 ----------
  // base = 本机上次与服务端一致时的版本号（存在设置之外，避免改它又触发保存）
  const getBase = () => Number(localStorage.getItem('sp.syncBase') || 0);
  const setBase = (v) => localStorage.setItem('sp.syncBase', String(v || 0));

  function adopt(remote) {
    const keep = SP.state.settings.sync;
    SP.state = SP.migrate(remote);
    SP.state.settings.sync = keep;
    localStorage.setItem('selfpilot.v1', JSON.stringify(SP.state));
    setBase(remote.updatedAt);
    SP.render();
    SP.syncStatus = '已拉取其他设备的更新 ' + SP.hm(Date.now());
  }

  SP.syncPull = async (manual) => {
    if (!SP.server || !SP.state.settings.sync.enabled) return;
    try {
      const r = await fetch('api/data', { headers: authHeaders(), cache: 'no-store' });
      if (r.status === 401) throw new Error('令牌不正确');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const remote = await r.json();
      const base = getBase();
      const localChanged = SP.state.updatedAt > base;
      if (!remote || !remote.agents) await SP.syncPush(); // 服务端还没有数据
      else if (remote.updatedAt === base) { if (localChanged) await SP.syncPush(); else SP.syncStatus = '已是最新'; }
      else if (!localChanged) adopt(remote);
      else if (confirm(`本机和服务端的数据都有改动。\n\n点「确定」使用服务端数据（${new Date(remote.updatedAt).toLocaleString()}）\n点「取消」用本机数据覆盖服务端`)) adopt(remote);
      else { setBase(remote.updatedAt); await SP.syncPush(); }
      if (manual) SP.toast(SP.syncStatus || '已同步');
    } catch (e) {
      SP.syncStatus = '同步失败：' + e.message;
      if (manual) SP.toast(SP.syncStatus, 'err');
    }
  };
  SP.syncPush = async () => {
    if (!SP.server || !SP.state.settings.sync.enabled || SP.state.updatedAt === getBase()) return;
    try {
      const r = await fetch('api/data', { method: 'PUT', headers: { 'content-type': 'application/json', 'x-sp-base': String(getBase()), ...authHeaders() }, body: JSON.stringify(SP.state) });
      if (r.status === 409) return SP.syncPull(false); // 其他设备先改了：走合并流程
      if (!r.ok) throw new Error('HTTP ' + r.status);
      setBase(SP.state.updatedAt);
      SP.syncStatus = '已同步 ' + SP.hm(Date.now());
    } catch (e) { SP.syncStatus = '同步失败：' + e.message; }
  };
  SP.onSave(SP.debounce(() => SP.syncPush(), 2000));

  // ---------- 定时工作流：页面打开期间每 30 秒检查 ----------
  async function tick() {
    if (SP.busy || !SP.dueWorkflows().length) return;
    if (SP.isMockMode() && !SP._mockAuto) return; // 演示模式不自动跑，避免打扰；今日页会提示手动运行
    await SP.runDue();
  }

  async function boot() {
    try {
      const r = await fetch('api/health', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (j && j.app === 'selfpilot') { SP.server = j; SP.proxyAvailable = true; }
      }
    } catch (_) { /* 纯静态部署（GitHub Pages / 本地文件），没有服务端 */ }
    if (!SP.state.threads.length) {
      const th = SP.newThread({ title: '📥 随手记', mode: 'council' });
      th.inbox = true;
    }
    await SP.syncPull(false);
    window.addEventListener('hashchange', SP.render);
    SP.render();
    setInterval(tick, 30000);
    setTimeout(tick, 1500);
    window.addEventListener('focus', () => SP.syncPull(false));
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
})();
