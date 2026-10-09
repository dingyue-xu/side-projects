import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { titleFor } from '../engine/milestones'
import { Leaderboard } from './Leaderboard'
import { Codex } from './Codex'

export function TitleScreen() {
  const { startSetup, meta } = useGame()
  const [modal, setModal] = useState<'board' | 'codex' | null>(null)
  const title = titleFor(meta.bestScore)

  return (
    <div className="card">
      <div className="title-hero">
        <h1>《开本》</h1>
        <p>
          剧本杀店主危机处理模拟器
          <br />
          <span className="muted">选址、砍价、招演员、上新本——然后，每天处理店里冒出来的瓜。</span>
        </p>
      </div>
      <p className="muted center" style={{ lineHeight: 1.8 }}>
        黄牛抢车、演员谈恋爱、玩家挂差评、友商挖人、瓜上小红书……
        <br />
        三个资源在拉扯：<b style={{ color: 'var(--cash)' }}>现金流</b> ·{' '}
        <b style={{ color: 'var(--rep)' }}>口碑</b> ·{' '}
        <b style={{ color: 'var(--heat)' }}>内容热度</b>。
      </p>

      {meta.runs > 0 && (
        <div className="title-badge" style={{ marginTop: 6 }}>
          <div className="tb-emoji">{title.emoji}</div>
          <div>
            <div className="tb-name">{title.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              第 {meta.runs} 次开店 · 最高分 {meta.bestScore.toLocaleString()} · 最长存活 {meta.bestDays} 天
            </div>
          </div>
        </div>
      )}

      <button className="btn block" style={{ marginTop: 16 }} onClick={startSetup}>
        {meta.runs > 0 ? '东山再起，再开一家' : '开始开店'}
      </button>
      <div className="row" style={{ gap: 10, marginTop: 10 }}>
        <button className="btn secondary" style={{ flex: 1 }} onClick={() => setModal('codex')}>📇 NPC 图鉴</button>
        <button className="btn secondary" style={{ flex: 1 }} onClick={() => setModal('board')}>🏆 同城店主榜</button>
      </div>

      {modal === 'board' && <Leaderboard onClose={() => setModal(null)} />}
      {modal === 'codex' && <Codex onClose={() => setModal(null)} />}
    </div>
  )
}
