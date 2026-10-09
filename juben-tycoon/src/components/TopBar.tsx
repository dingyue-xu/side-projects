import { useGame } from '../store/gameStore'
import { buzzWan } from '../engine/selectors'

function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <svg width="70" height="24" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const w = 70
  const h = 24
  const step = w / (data.length - 1)
  const pts = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={w} height={h} className="metric-spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Change({ delta, pct }: { delta: number; pct?: boolean }) {
  if (delta === 0) return <span className="muted">日变化 0</span>
  const up = delta > 0
  const txt = pct ? `${up ? '+' : ''}${delta.toFixed(1)}%` : `${up ? '+' : ''}${Math.round(delta).toLocaleString()}`
  return (
    <>
      <span className="muted">日变化</span>
      <span className={up ? 'chg-up' : 'chg-dn'}>{txt} {up ? '↑' : '↓'}</span>
    </>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const s = useGame()
  const h = s.history
  const last = h[h.length - 1]
  const prev = h[h.length - 2]
  const cashChg = last && prev ? last.cash - prev.cash : 0
  const repChg = last && prev ? last.reputation - prev.reputation : 0
  const buzzPct = last && prev && prev.buzz > 0 ? ((last.buzz - prev.buzz) / prev.buzz) * 100 : 0

  return (
    <div className="topbar">
      <div className="metric cash">
        <div className="metric-top"><span className="metric-ico">💵</span><span className="metric-label">现金流</span></div>
        <div className="metric-mid">
          <span className="metric-val">¥{Math.round(s.resources.cash).toLocaleString()}</span>
          <Spark data={h.map((x) => x.cash)} color="#3f9d5a" />
        </div>
        <div className="metric-foot"><Change delta={cashChg} /></div>
      </div>

      <div className="metric rep">
        <div className="metric-top"><span className="metric-ico">⭐</span><span className="metric-label">口碑</span></div>
        <div className="metric-mid">
          <span className="metric-val">{Math.round(s.resources.reputation)}<span className="u"> /100</span></span>
          <Spark data={h.map((x) => x.reputation)} color="#d9614c" />
        </div>
        <div className="metric-foot"><Change delta={repChg} /></div>
      </div>

      <div className="metric heat">
        <div className="metric-top"><span className="metric-ico">🔥</span><span className="metric-label">内容热度</span></div>
        <div className="metric-mid">
          <span className="metric-val">{buzzWan(s)}<span className="u"> 万</span></span>
          <Spark data={h.map((x) => x.buzz)} color="#df8a3a" />
        </div>
        <div className="metric-foot"><Change delta={buzzPct} pct /></div>
      </div>

      <div className="daybox">
        <button className="menu-btn" onClick={onMenu}>☰ 菜单</button>
        <div className="d-day">第 {s.day} 天</div>
        <div className="d-seg">{s.segment}</div>
      </div>
    </div>
  )
}
