import { useGame } from '../store/gameStore'

export function WeeklyPanel() {
  const { weeklyReport, closeWeekly } = useGame()
  if (!weeklyReport) return null
  const r = weeklyReport
  return (
    <div className="card">
      <span className="card-cat">周结算</span>
      <div className="card-title">第 {r.week} 周账单</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 15 }}>
        <Row label="本周营收" value={`+¥${r.revenue.toLocaleString()}`} color="var(--money)" />
        <Row label="房租" value={`-¥${r.rent.toLocaleString()}`} color="var(--bad)" />
        <Row label="演员底薪/分红" value={`-¥${r.salaries.toLocaleString()}`} color="var(--bad)" />
        <div style={{ borderTop: '1px dashed var(--line)', margin: '4px 0' }} />
        <Row label="本周净利" value={`${r.net >= 0 ? '+' : ''}¥${r.net.toLocaleString()}`} color={r.net >= 0 ? 'var(--good)' : 'var(--bad)'} big />
        <Row label="账上现金" value={`¥${r.cashAfter.toLocaleString()}`} color="var(--text)" />
      </div>
      {r.notes.map((n, i) => (
        <div key={i} className="result-text" style={{ marginTop: 10 }}>{n}</div>
      ))}
      <button className="btn block" style={{ marginTop: 16 }} onClick={closeWeekly}>
        继续经营 ›
      </button>
    </div>
  )
}

function Row({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <div className="spread">
      <span className="muted">{label}</span>
      <span style={{ color, fontWeight: big ? 800 : 600, fontSize: big ? 20 : 15 }}>{value}</span>
    </div>
  )
}
