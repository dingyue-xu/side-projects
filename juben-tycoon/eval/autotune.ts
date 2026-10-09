// 自动迭代 —— 用评估器当适应度，坐标下降搜索更优的 balance 参数
import { writeFileSync } from 'node:fs'
import { BALANCE, applyBalance, type BalanceKnobs } from '../src/engine/balance'
import { runEval, report } from './evaluate'

interface Knob { key: keyof BalanceKnobs; lo: number; hi: number; step: number }
const KNOBS: Knob[] = [
  { key: 'startingCapital', lo: 240000, hi: 460000, step: 20000 },
  { key: 'baseDemand', lo: 1.05, hi: 1.8, step: 0.05 },
  { key: 'heatDecayPerDay', lo: 0.3, hi: 0.95, step: 0.05 },
  { key: 'peacefulDayChance', lo: 0.15, hi: 0.72, step: 0.05 },
  { key: 'variableCostPerSession', lo: 30, hi: 75, step: 5 },
  { key: 'rentCreepPerWeek', lo: 0, hi: 0.025, step: 0.0025 },
]

const clampKnob = (k: Knob, v: number) => Math.max(k.lo, Math.min(k.hi, +v.toFixed(4)))

function fitness(vec: Record<string, number>, games: number): number {
  applyBalance(vec as Partial<BalanceKnobs>)
  return runEval(games).composite
}

function search(rounds = 4, gamesPerEval = 24): { best: Record<string, number>; score: number } {
  const cur: Record<string, number> = {}
  for (const k of KNOBS) cur[k.key] = BALANCE[k.key]
  let bestScore = fitness(cur, gamesPerEval)
  console.log(`起点 composite = ${bestScore}`)

  for (let r = 0; r < rounds; r++) {
    let improved = false
    for (const k of KNOBS) {
      for (const dir of [1, -1]) {
        const trial = { ...cur, [k.key]: clampKnob(k, cur[k.key] + dir * k.step) }
        if (trial[k.key] === cur[k.key]) continue
        const sc = fitness(trial, gamesPerEval)
        if (sc > bestScore) {
          bestScore = sc; cur[k.key] = trial[k.key]; improved = true
          console.log(`  ↑ ${k.key} → ${cur[k.key]}  composite=${sc}`)
        }
      }
    }
    console.log(`第 ${r + 1} 轮结束，best=${bestScore}`)
    if (!improved) break
  }
  return { best: cur, score: bestScore }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  console.log('自动迭代搜索 balance 参数 …（坐标下降，适应度=体验综合分）\n')
  const { best, score } = search(4, 24)
  applyBalance(best as Partial<BalanceKnobs>)
  console.log('\n=== 推荐参数 ===')
  console.log(JSON.stringify(best, null, 2))
  console.log(`搜索内估分 ${score}，下面用大样本复评：\n`)
  const r = runEval(60)
  const md = report(r)
  writeFileSync(new URL('./REPORT.md', import.meta.url), md)
  writeFileSync(new URL('./TUNED.json', import.meta.url), JSON.stringify(best, null, 2) + '\n')
  console.log(md)
  console.log('推荐参数写入 eval/TUNED.json；复评报告写入 eval/REPORT.md')
}
