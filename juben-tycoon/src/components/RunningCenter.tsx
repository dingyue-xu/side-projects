import { useGame } from '../store/gameStore'
import { SceneView } from './SceneView'
import { PRO_ACTIONS, type ProActionId } from '../store/gameStore'

export function RunningCenter() {
  const s = useGame()
  const { nextDay, fastForward, proAction } = s
  const pending = s.forcedQueue.length

  return (
    <>
      <div className="maincard">
        <SceneView variant="full" />
        <div style={{ padding: 14 }}>
          {pending > 0 && (
            <div className="result-text" style={{ borderColor: 'var(--neg)', marginTop: 0 }}>
              ⏳ 有 {pending} 件事正在发酵，迟早找上门——看左侧「延迟事件队列」。
            </div>
          )}
          <div className="row" style={{ gap: 10 }}>
            <button className="btn secondary" style={{ flex: 1 }} onClick={nextDay}>下一天 ›</button>
            <button className="btn" style={{ flex: 1.5 }} onClick={fastForward}>⏩ 快进到下一个状况</button>
          </div>
          <div className="muted center" style={{ fontSize: 12, marginTop: 8 }}>
            每天经营进账/烧钱；「快进」跳过平静日，遇事件或周结自动停。每 7 天周结固定成本。
          </div>
        </div>
      </div>

      <div>
        <div className="deck-h">
          <span className="t">主动运营</span>
          <span className="muted" style={{ fontSize: 12 }}>（主动出招，不只是被动接事件）</span>
          <span className="ap">⚡ 行动力 {s.actionPoints}/{s.maxActionPoints}</span>
        </div>
        <div className="deck">
          {(Object.keys(PRO_ACTIONS) as ProActionId[]).map((id) => {
            const a = PRO_ACTIONS[id]
            const afford = s.resources.cash >= a.cost && s.actionPoints >= a.ap
            return (
              <button key={id} className="opt-card" disabled={!afford} onClick={() => proAction(id)}>
                <div className="oc-h"><span className="oc-ico">{a.emoji}</span><span className="oc-title">{a.name}</span></div>
                <div className="oc-desc">{a.desc}</div>
                <div className="oc-foot">
                  花费 <b style={{ color: 'var(--neg)' }}>¥{a.cost.toLocaleString()}</b> · 消耗 ⚡{a.ap}
                  {!afford && <div className="locked">{s.actionPoints < a.ap ? '行动力不足' : '现金不足'}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
