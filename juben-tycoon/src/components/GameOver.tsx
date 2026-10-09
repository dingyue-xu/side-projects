import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { Leaderboard } from './Leaderboard'

export function GameOver() {
  const { day, restart, runSummary, meta } = useGame()
  const [board, setBoard] = useState(false)
  const rs = runSummary

  if (!rs) {
    return (
      <div className="card">
        <div className="title-hero"><h1>💀 闭店了</h1><p className="muted">第 {day} 天，资金链断裂。</p></div>
        <button className="btn block" onClick={restart}>重新开店 ›</button>
      </div>
    )
  }

  const e = rs.entry
  const milestone = rs.isMilestone

  return (
    <div className="card">
      <div className="title-hero" style={{ paddingBottom: 8 }}>
        {milestone ? <h1>🎉 里程碑时刻</h1> : <h1>💀 闭店结算</h1>}
        <p className="muted">「{e.name}」经营了 {e.days} 天 · {e.themeName} / {e.signatureName}</p>
      </div>

      {/* 称号 */}
      <div className="title-badge">
        <div className="tb-emoji">{rs.title.emoji}</div>
        <div>
          <div className="tb-name">{rs.title.name}</div>
          {rs.title.next && <div className="muted" style={{ fontSize: 12 }}>距「{rs.title.next.name}」还需 {Math.max(0, rs.title.next.need - meta.bestScore).toLocaleString()} 分</div>}
        </div>
        <div className="tb-score"><div className="muted" style={{ fontSize: 11 }}>本局得分</div><b>{e.score.toLocaleString()}</b></div>
      </div>

      {/* 本局战绩 */}
      <div className="ro-grid">
        <Stat label="存活天数" v={`${e.days} 天`} />
        <Stat label="峰值口碑" v={`${e.peakReputation}`} />
        <Stat label="累计营收" v={`¥${(e.totalRevenue / 10000).toFixed(1)}万`} />
        <Stat label="同城排名" v={rs.rank > 0 ? `第 ${rs.rank}` : '未上榜'} hot={rs.rank > 0 && rs.rank <= 3} />
      </div>

      {/* 新解锁里程碑 */}
      {rs.newMilestones.length > 0 && (
        <div className="ms-box">
          <div className="ms-h">🏅 解锁里程碑 ×{rs.newMilestones.length}</div>
          {rs.newMilestones.map((m, i) => (
            <div className="ms-item" key={m.id} style={{ animationDelay: `${i * 120}ms` }}>
              <span className="ms-emoji">{m.emoji}</span>
              <span><b>{m.name}</b><span className="muted"> — {m.desc}</span></span>
            </div>
          ))}
        </div>
      )}

      {/* meta 遗产 */}
      <div className="result-text" style={{ marginTop: 12 }}>
        失败不是终点 —— 本局沉淀进下一次开店：
        口碑遗产 <b style={{ color: 'var(--rep)' }}>+{rs.metaGain.legacyReputation}</b> ·
        经验 <b style={{ color: 'var(--pos)' }}>+{rs.metaGain.experience}</b> ·
        人脉 <b style={{ color: 'var(--brand)' }}>+{rs.metaGain.contacts}</b>。
        这是你的第 <b>{meta.runs}</b> 次开店，累计经营 <b>{meta.totalDaysAll}</b> 天。
      </div>

      <div className="row" style={{ gap: 10, marginTop: 16 }}>
        <button className="btn secondary" style={{ flex: 1 }} onClick={() => setBoard(true)}>🏆 看榜单</button>
        <button className="btn" style={{ flex: 1.4 }} onClick={restart}>带着底子，再开一家 ›</button>
      </div>

      {board && <Leaderboard onClose={() => setBoard(false)} highlightId={e.id} />}
    </div>
  )
}

function Stat({ label, v, hot }: { label: string; v: string; hot?: boolean }) {
  return (
    <div className="ro-stat">
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: hot ? 'var(--brand)' : 'var(--ink)' }}>{v}</div>
    </div>
  )
}
