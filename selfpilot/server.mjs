#!/usr/bin/env node
// 自驱舱服务端（可选，零依赖，Node 18+）
// 作用：1) 托管前端  2) 转发模型请求，绕过浏览器跨域限制  3) 多端数据同步（存为 JSON 文件）
//
//   node server.mjs                       # 本机使用 http://localhost:8787
//   HOST=0.0.0.0 SP_TOKEN=换成长随机串 node server.mjs   # 部署到服务器，务必设置令牌
//
// 环境变量：PORT(8787) HOST(127.0.0.1) SP_TOKEN(访问令牌) DATA_DIR(./data)
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.SP_TOKEN || '';
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const DATA_FILE = path.join(DATA_DIR, 'selfpilot.json');
const MAX_BODY = 20 * 1024 * 1024;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png' };
const FORWARD_HEADERS = ['content-type', 'authorization', 'x-api-key', 'anthropic-version', 'anthropic-beta'];

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const authed = (req) => !TOKEN || req.headers['x-sp-token'] === TOKEN;

function allowedTarget(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol === 'https:') return u;
  // 明文 http 只允许本机（如 Ollama / LM Studio）
  if (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal'].includes(u.hostname)) return u;
  return null;
}

async function proxy(req, res) {
  const target = allowedTarget(req.headers['x-sp-target'] || '');
  if (!target) return send(res, 400, { error: { message: '目标地址无效（只允许 https，或本机 http）' } });
  const headers = {};
  for (const h of FORWARD_HEADERS) if (req.headers[h]) headers[h] = req.headers[h];
  const body = await readBody(req);
  const ac = new AbortController();
  res.on('close', () => ac.abort());
  let up;
  try {
    up = await fetch(target, { method: 'POST', headers, body, signal: ac.signal });
  } catch (e) {
    return send(res, 502, { error: { message: '转发失败：' + e.message } });
  }
  res.writeHead(up.status, { 'content-type': up.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' });
  if (!up.body) return res.end();
  Readable.fromWeb(up.body).on('error', () => res.end()).pipe(res);
}

async function data(req, res) {
  if (req.method === 'GET') {
    try { return send(res, 200, await fs.readFile(DATA_FILE, 'utf8')); }
    catch { return send(res, 200, '{}'); }
  }
  if (req.method === 'PUT') {
    const body = (await readBody(req)).toString('utf8');
    const parsed = JSON.parse(body);
    if (!parsed || !parsed.agents) return send(res, 400, { error: { message: '数据格式不正确' } });
    // 乐观锁：客户端声明它基于哪个版本修改，服务端版本已变则拒绝，交给客户端合并
    const cur = await fs.readFile(DATA_FILE, 'utf8').then((t) => JSON.parse(t).updatedAt || 0).catch(() => 0);
    if (cur && String(cur) !== String(req.headers['x-sp-base'] || '')) return send(res, 409, { error: { message: '服务端数据已被其他设备更新' }, updatedAt: cur });
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    await fs.writeFile(tmp, body);
    await fs.rename(tmp, DATA_FILE);
    // 每天保留一份快照，误操作可回滚
    const day = new Date().toISOString().slice(0, 10);
    await fs.writeFile(path.join(DATA_DIR, `backup-${day}.json`), body).catch(() => {});
    return send(res, 200, { ok: true, updatedAt: parsed.updatedAt });
  }
  send(res, 405, { error: { message: 'method not allowed' } });
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT) || file.startsWith(DATA_DIR) || /(^|[\\/])\./.test(path.relative(ROOT, file)) || file.endsWith('.mjs'))
    return send(res, 404, 'not found', 'text/plain');
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const buf = await fs.readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(buf);
  } catch {
    send(res, 404, 'not found', 'text/plain');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const p = new URL(req.url, 'http://x').pathname;
    if (p.endsWith('/api/health')) return send(res, 200, { app: 'selfpilot', version: 1, auth: !!TOKEN });
    if (p.endsWith('/api/data')) return authed(req) ? data(req, res) : send(res, 401, { error: { message: '令牌错误' } });
    if (p.endsWith('/proxy') && req.method === 'POST') return authed(req) ? proxy(req, res) : send(res, 401, { error: { message: '访问令牌错误，请在「设置 → 代理与多端同步」填写' } });
    if (req.method === 'GET') return serveStatic(req, res);
    send(res, 405, 'method not allowed', 'text/plain');
  } catch (e) {
    if (!res.headersSent) send(res, 500, { error: { message: e.message } });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🧭 自驱舱已启动：http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`   数据目录：${DATA_DIR}`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost' && !TOKEN) console.warn('⚠️  正在对外监听但没有设置 SP_TOKEN，任何人都能读写你的数据并使用转发代理！');
});
