import { leaderboard } from '../engine/leaderboard'

export function Leaderboard({ onClose, highlightId }: { onClose: () => void; highlightId?: string }) {
  const board = leaderboard()
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>🏆 同城店主榜</h3>
          <button className="menu-btn" onClick={onClose}>关闭 ✕</button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
          你历次经营的成绩 + 同城其他店主（本地存档，分数 = 存活天数·120 + 峰值口碑·60 + 累计营收/800）。
        </p>
        <div className="lb">
          <div className="lb-row lb-head">
            <span className="lb-rank">#</span>
            <span className="lb-name">店铺 / 店主</span>
            <span className="lb-num">存活</span>
            <span className="lb-num">峰值口碑</span>
            <span className="lb-num">累计营收</span>
            <span className="lb-num">分数</span>
          </div>
          {board.map((e, i) => (
            <div key={e.id} className={`lb-row ${e.id === highlightId ? 'me' : ''} ${e.isPlayer ? 'player' : ''}`}>
              <span className="lb-rank">{i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="lb-name">
                {e.name}
                <span className="muted" style={{ fontSize: 11 }}> · {e.themeName}/{e.signatureName}</span>
                {e.isPlayer && <span className="tag" style={{ marginLeft: 6 }}>{e.date ? '我' : '我'}</span>}
              </span>
              <span className="lb-num">{e.days}天</span>
              <span className="lb-num">{e.peakReputation}</span>
              <span className="lb-num">¥{(e.totalRevenue / 10000).toFixed(0)}万</span>
              <span className="lb-num"><b>{e.score.toLocaleString()}</b></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
