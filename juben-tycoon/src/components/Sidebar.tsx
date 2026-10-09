import { useGame } from '../store/gameStore'
import { SceneView } from './SceneView'
import { EVENT_MAP } from '../data/events'
import { eventRisk } from '../engine/eventEngine'
import { hiredActors } from '../engine/selectors'

const GENRE_COLOR: Record<string, string> = {
  情感本: '#c77', 原创情感: '#c77', 恐怖本: '#955', 硬核推理: '#678', 欢乐本: '#aa7', 阵营机制: '#697',
}

export function Sidebar() {
  const s = useGame()
  const hired = hiredActors(s)
  const teamMood = hired.length ? Math.round(hired.reduce((a, b) => a + b.morale, 0) / hired.length) : 0
  const onShift = Math.min(hired.length, (s.shop.location?.capacityRooms ?? 2) * 2)

  return (
    <div className="side">
      <SceneView variant="banner" />

      <div className="side-card">
        <div className="side-h">店铺信息</div>
        <div className="kv"><span className="k">📍 位置</span><span className="v">{s.shop.location?.name ?? '—'}</span></div>
        <div className="kv"><span className="k">💰 周租</span><span className="v">¥{s.shop.rentPerWeek.toLocaleString()}</span></div>
        <div className="kv"><span className="k">🎯 招牌玩法</span><span className="v">{s.shop.signature?.name ?? '—'}</span></div>
        <div className="kv">
          <span className="k">🛋️ 装修沉浸度</span>
          <span className="v">{Math.round(s.shop.immersion)}/100</span>
        </div>
        <div className="bar" style={{ marginTop: 4 }}><span style={{ width: `${s.shop.immersion}%`, background: 'var(--imm)' }} /></div>
      </div>

      <div className="side-card">
        <div className="side-h">演员团队</div>
        <div className="kv">
          <span className="k">😊 团队心情</span>
          <span className="v">{teamMood}/100</span>
        </div>
        <div className="bar" style={{ marginTop: 2, marginBottom: 8 }}>
          <span style={{ width: `${teamMood}%`, background: teamMood >= 55 ? 'var(--cash)' : 'var(--rep)' }} />
        </div>
        <div className="kv"><span className="k">🎭 演员人数</span><span className="v">{hired.length} 人</span></div>
        <div className="kv"><span className="k">📋 今日排班</span><span className="v">{onShift} 人</span></div>
      </div>

      <div className="side-card">
        <div className="side-h">当前剧本（{s.shop.scripts.length}）</div>
        {s.shop.scripts.map((sc) => (
          <div className="script-row" key={sc.id}>
            <div className="script-cover" style={{ background: GENRE_COLOR[sc.genre] ?? '#888' }}>🎬</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.name}</span>
                {sc.heat >= 70 && <span className="hot">热</span>}
                {sc.original && <span className="tag">原创</span>}
              </div>
              <div className="script-meta">评分 {(sc.quality / 10).toFixed(1)} · 热度 {Math.round(sc.heat)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="side-card">
        <div className="side-h">延迟事件队列</div>
        {s.forcedQueue.length === 0 && <div className="muted" style={{ fontSize: 12 }}>暂无埋雷，风平浪静。</div>}
        {s.forcedQueue
          .slice()
          .sort((a, b) => a.dueDay - b.dueDay)
          .map((q, i) => {
            const ev = EVENT_MAP[q.eventId]
            if (!ev) return null
            const inDays = q.dueDay - s.day
            const when = inDays <= 0 ? '即将' : inDays === 1 ? '明天' : `${inDays}天后`
            const risk = eventRisk(ev)
            return (
              <div className="q-item" key={i}>
                <span className={`risk-pill risk-${risk}`}>{risk === 'high' ? '高风险' : risk === 'mid' ? '中风险' : '低风险'}</span>
                <span style={{ flex: 1 }}>
                  <b>{when}</b> · {ev.title}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
