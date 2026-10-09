// 体验评估器 —— 跑模拟矩阵，按设计目标打分，产出报告
import { writeFileSync } from 'node:fs'
import { playGame, PERSONAS, POOLABLE, MAX_DAYS, type RunResult } from './sim'
import { SIGNATURES } from '../src/data/themes'
import { BALANCE } from '../src/engine/balance'

const MONTH = 30

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)] }
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export interface EvalResult {
  composite: number
  sub: Record<string, number>
  lifeByPersona: Record<string, { medMonths: number; p10: number; p90: number; survivedPct: number }>
  lifeBySig: Record<string, number> // good 人格的中位寿命（月）
  balanceSpread: number
  coverage: number
  unseen: string[]
  chainPct: number
  crisisPerWeek: number
}

export function runEval(gamesPerCell = 50): EvalResult {
  const all: RunResult[] = []
  for (const sig of SIGNATURES) for (const p of PERSONAS) for (let i = 0; i < gamesPerCell; i++) all.push(playGame(sig.id, p))

  // 寿命分布（按人格）
  const lifeByPersona: EvalResult['lifeByPersona'] = {}
  for (const p of PERSONAS) {
    const g = all.filter((r) => r.persona === p.id)
    const days = g.map((r) => r.days)
    lifeByPersona[p.id] = {
      medMonths: +(median(days) / MONTH).toFixed(1),
      p10: +(pct(days, 0.1) / MONTH).toFixed(1),
      p90: +(pct(days, 0.9) / MONTH).toFixed(1),
      survivedPct: Math.round((g.filter((r) => r.days >= MAX_DAYS).length / g.length) * 100),
    }
  }
  // 招牌玩法平衡（good 人格）
  const lifeBySig: Record<string, number> = {}
  for (const sig of SIGNATURES) {
    const days = all.filter((r) => r.persona === 'good' && r.signature === sig.id).map((r) => r.days)
    lifeBySig[sig.id] = +(median(days) / MONTH).toFixed(1)
  }
  const sigMeds = Object.values(lifeBySig)
  const balanceSpread = +((Math.max(...sigMeds) - Math.min(...sigMeds)) / (mean(sigMeds) || 1)).toFixed(2)

  // 事件覆盖
  const seen = new Set<string>()
  all.forEach((r) => r.seen.forEach((id) => seen.add(id)))
  const poolableIds = POOLABLE.map((e) => e.id)
  const coveredPoolable = poolableIds.filter((id) => seen.has(id))
  const coverage = +(coveredPoolable.length / poolableIds.length).toFixed(2)
  const unseen = poolableIds.filter((id) => !seen.has(id))

  // 连锁 + 危机密度
  const chainPct = Math.round((all.filter((r) => r.chains > 0).length / all.length) * 100)
  const crisisPerWeek = +mean(all.map((r) => (r.weeks ? r.crises / r.weeks : 0))).toFixed(2)

  // —— 打分（每项 0~100）——
  const bad = lifeByPersona.bad.medMonths
  const good = lifeByPersona.good.medMonths
  const avg = lifeByPersona.avg.medMonths
  const sub = {
    经营不善半年闭店: score100(1 - Math.abs(bad - 6) / 6),
    经营得当撑过一年半: good >= 18 ? 100 : score100(good / 18),
    普通玩家落在区间: avg >= 7 && avg <= 18 ? 100 : score100(1 - Math.min(Math.abs(avg - 7), Math.abs(avg - 18)) / 7),
    招牌玩法平衡: score100(1 - balanceSpread / 0.5),
    事件覆盖度: score100((coverage - 0.5) / 0.45),
    连锁触发: chainPct >= 25 ? 100 : score100(chainPct / 25),
    危机密度: crisisPerWeek >= 1.3 && crisisPerWeek <= 3.6 ? 100 : score100(1 - Math.min(Math.abs(crisisPerWeek - 1.3), Math.abs(crisisPerWeek - 3.6)) / 2),
  }
  const composite = Math.round(mean(Object.values(sub)))

  return { composite, sub, lifeByPersona, lifeBySig, balanceSpread, coverage, unseen, chainPct, crisisPerWeek }
}

function score100(x: number) { return Math.round(clamp01(x) * 100) }
const flag = (v: number) => (v >= 80 ? '✅ PASS' : v >= 60 ? '⚠️ WARN' : '❌ FAIL')

export function report(r: EvalResult): string {
  const L: string[] = []
  L.push(`# 体验评估报告\n`)
  L.push(`生成于 ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · 当前 balance: ${JSON.stringify(BALANCE)}\n`)
  L.push(`## 体验综合分：**${r.composite} / 100** ${flag(r.composite)}\n`)
  L.push(`| 维度 | 分数 | 状态 |`)
  L.push(`|---|---|---|`)
  for (const [k, v] of Object.entries(r.sub)) L.push(`| ${k} | ${v} | ${flag(v)} |`)
  L.push(`\n## 寿命分布（按玩家人格，单位：月）`)
  L.push(`| 人格 | 中位 | p10 | p90 | 撑满25月% |`)
  L.push(`|---|---|---|---|---|`)
  for (const [k, v] of Object.entries(r.lifeByPersona)) L.push(`| ${k} | ${v.medMonths} | ${v.p10} | ${v.p90} | ${v.survivedPct}% |`)
  L.push(`\n## 招牌玩法平衡（good 人格中位寿命/月，离散度 ${r.balanceSpread}）`)
  L.push(`| 招牌玩法 | 中位寿命(月) |`)
  L.push(`|---|---|`)
  for (const sig of SIGNATURES) L.push(`| ${sig.name} | ${r.lifeBySig[sig.id]} |`)
  L.push(`\n## 内容与节奏`)
  L.push(`- 事件覆盖度：**${Math.round(r.coverage * 100)}%**（未触发：${r.unseen.length ? r.unseen.join(', ') : '无'}）`)
  L.push(`- 连锁触发率：**${r.chainPct}%** 的对局至少发生一次连锁`)
  L.push(`- 危机密度：平均 **${r.crisisPerWeek}** 起事件/周`)
  return L.join('\n') + '\n'
}

// 直接运行：评估 + 写报告
const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const games = Number(process.argv[2] ?? 50)
  console.log(`跑评估：每格 ${games} 局 × ${SIGNATURES.length} 招牌 × ${PERSONAS.length} 人格 …`)
  const r = runEval(games)
  const md = report(r)
  writeFileSync(new URL('./REPORT.md', import.meta.url), md)
  console.log(md)
  console.log('报告已写入 eval/REPORT.md')
}
