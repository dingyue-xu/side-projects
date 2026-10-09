import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { RunningCenter } from './RunningCenter'
import { EventCenter } from './EventCenter'
import { OpinionFeed } from './OpinionFeed'
import { WeeklyPanel } from './WeeklyPanel'
import { Codex } from './Codex'
import { Leaderboard } from './Leaderboard'

export function Dashboard() {
  const phase = useGame((s) => s.phase)
  const log = useGame((s) => s.log)
  const restart = useGame((s) => s.restart)
  const [menu, setMenu] = useState(false)
  const [overlay, setOverlay] = useState<'codex' | 'board' | null>(null)

  return (
    <div className="dash">
      <TopBar onMenu={() => setMenu(true)} />
      <div className="dash-body">
        <Sidebar />
        <div className="center-col">
          {phase === 'event' ? <EventCenter /> : <RunningCenter />}
          <div className="logbar">
            <div className="muted" style={{ fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>店铺日志</div>
            <div className="log">
              {log.slice(0, 30).map((e, i) => (
                <div key={i} className={`log-item ${e.tone}`}>
                  <span className="d">D{e.day}</span>{e.text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <OpinionFeed />
      </div>

      {phase === 'weekly' && (
        <div className="overlay">
          <div style={{ maxWidth: 460, width: '100%' }}>
            <WeeklyPanel />
          </div>
        </div>
      )}

      {menu && (
        <div className="overlay" onClick={() => setMenu(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>游戏菜单</h3>
            <button className="btn block secondary" style={{ marginBottom: 8 }} onClick={() => { setMenu(false); setOverlay('codex') }}>📇 NPC 图鉴</button>
            <button className="btn block secondary" style={{ marginBottom: 8 }} onClick={() => { setMenu(false); setOverlay('board') }}>🏆 同城店主榜</button>
            <button className="btn block secondary" style={{ marginBottom: 8 }} onClick={() => setMenu(false)}>继续游戏</button>
            <button className="btn block" onClick={() => { if (confirm('确定放弃本店、重新开店？')) restart() }}>放弃并重开 ›</button>
          </div>
        </div>
      )}

      {overlay === 'codex' && <Codex onClose={() => setOverlay(null)} />}
      {overlay === 'board' && <Leaderboard onClose={() => setOverlay(null)} />}
    </div>
  )
}
