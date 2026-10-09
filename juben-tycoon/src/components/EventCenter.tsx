import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { EVENT_MAP } from '../data/events'
import { optionAvailable, optionFermentChance, eventRisk } from '../engine/eventEngine'
import { defaultSources, defaultImpact } from '../engine/feed'
import { faceOf } from '../engine/cast'
import { Avatar } from './Avatar'
import type { EventSource, ImpactScope, Effect, EventOption, ResolutionDelta } from '../types'

const SRC_LABEL: Record<EventSource, string> = { dianping: '🟠大众点评', wechat: '🟢微信群', xhs: '🔴小红书', onsite: '🏠到店', industry: '🏢同行' }
const IMPACT_LABEL: Record<ImpactScope, string> = { regulars: '👥老客圈层', actors: '🎭演员团队', potential: '🧍潜在客群' }
const RISK_TXT = { high: '高风险', mid: '中风险', low: '低风险' }

function optIcon(label: string): string {
  if (/(道歉|补偿|调解|私下|安抚)/.test(label)) return '🤝'
  if (/(暂停|拆|放|开除|辞)/.test(label)) return '🚫'
  if (/(公开|澄清|回应|声明|回怼|硬刚|挂)/.test(label)) return '📣'
  if (/(冷处理|不回|不理|沉|忍)/.test(label)) return '😶'
  if (/(借势|营销|自黑)/.test(label)) return '🎬'
  if (/(加薪|花钱|红包|退款|免单)/.test(label)) return '💰'
  return '⚖️'
}

function useCountdown(key: string) {
  const [t, setT] = useState(9000)
  useEffect(() => {
    setT(8000 + Math.floor(Math.random() * 2000))
    const id = window.setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [key])
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`
}

export function EventCenter() {
  const s = useGame()
  const { currentEventId, lastResult, resolveOption } = s
  const ev = currentEventId ? EVENT_MAP[currentEventId] : null
  const cd = useCountdown(currentEventId ?? '')
  const [dlg, setDlg] = useState(0)
  useEffect(() => { setDlg(0) }, [currentEventId])
  if (!ev) return null

  if (lastResult) return <ResultView />

  const risk = eventRisk(ev)
  const sources = ev.sources?.length ? ev.sources : defaultSources(ev.category)
  const impact = ev.impact?.length ? ev.impact : (defaultImpact(ev.category) as ImpactScope[])
  const anchor = ev.anchorNpc ? faceOf(s, ev.anchorNpc) : null
  const dialogue = ev.dialogue ?? []
  const inDialogue = dlg < dialogue.length

  return (
    <>
      <div className="maincard">
        <div className="ev-head">
          <span className="badge evt">突发事件</span>
          <span className={`risk-pill risk-${risk}`}>{RISK_TXT[risk]}</span>
          <span className="ev-timer">⏳ 建议处理时限 {cd}</span>
        </div>
        <div className="ev-body">
          <div className="ev-titlerow">
            {anchor && <Avatar face={anchor} size={46} ring />}
            <div>
              <div className="ev-title">{ev.title}</div>
              {ev.speaker && <div className="ev-speaker">{anchor ? `${anchor.name} · ${anchor.role}` : ev.speaker}</div>}
            </div>
          </div>
          <div className="ev-desc">{ev.description}</div>
          <div className="ev-meta">
            <div><span className="lbl">事件来源</span>{sources.map((x) => <span className="chip" key={x}>{SRC_LABEL[x]}</span>)}</div>
            <div><span className="lbl">影响范围</span>{impact.map((x) => <span className="chip" key={x}>{IMPACT_LABEL[x]}</span>)}</div>
          </div>
        </div>
      </div>

      {inDialogue ? (
        <DialogueBox
          line={dialogue[dlg]}
          idx={dlg}
          total={dialogue.length}
          onNext={() => setDlg((x) => x + 1)}
          onSkip={() => setDlg(dialogue.length)}
        />
      ) : (
        <div>
          <div className="deck-h">
            <span className="t">你的选择</span>
            <span className="muted" style={{ fontSize: 12 }}>（数值为预估影响）</span>
            <span className="ap">选择后消耗 ⚡1 行动力</span>
          </div>
          <div className="deck">
            {ev.options.map((opt, i) => (
              <OptionCard key={i} opt={opt} avail={optionAvailable(s, opt)} onPick={() => resolveOption(i)} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function DialogueBox({ line, idx, total, onNext, onSkip }: {
  line: { npcId: string; text: string; mood?: import('../types').Mood }
  idx: number; total: number; onNext: () => void; onSkip: () => void
}) {
  const s = useGame()
  const face = faceOf(s, line.npcId)
  const last = idx === total - 1
  return (
    <div className="dialogue">
      <div className="dlg-row">
        <Avatar face={face} mood={line.mood} size={56} ring />
        <div className="dlg-bubble">
          <div className="dlg-name">{face.name} <span className="muted">· {face.role}</span></div>
          <div className="dlg-text">{line.text}</div>
        </div>
      </div>
      <div className="dlg-ctrl">
        <span className="muted" style={{ fontSize: 12 }}>{idx + 1} / {total}</span>
        <div className="row" style={{ gap: 8 }}>
          {!last && <button className="btn secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onSkip}>跳过对话</button>}
          <button className="btn" style={{ padding: '8px 16px', fontSize: 14 }} onClick={onNext}>{last ? '进入决策 ›' : '继续 ›'}</button>
        </div>
      </div>
    </div>
  )
}

function OptionCard({ opt, avail, onPick }: { opt: EventOption; avail: boolean; onPick: () => void }) {
  const e: Effect = opt.effects
  const ferment = optionFermentChance(opt)
  return (
    <button className="opt-card" disabled={!avail} onClick={onPick}>
      <div className="oc-h"><span className="oc-ico">{optIcon(opt.label)}</span><span className="oc-title">{opt.label}</span></div>
      <div className="delta-grid">
        <DeltaRow label="现金流" val={e.cash} />
        <DeltaRow label="口碑" val={e.reputation} />
        <DeltaRow label="演员关系" val={e.actor?.relationship} />
        <DeltaRow label="老客关系" val={e.customerLoyalty} />
      </div>
      <div className="oc-foot">
        {ferment > 0 ? <>后续：<span className="ferment">二次发酵 {Math.round(ferment * 100)}%</span></> : '后续：无明显连锁'}
        {!avail && opt.lockedHint && <div className="locked">🔒 {opt.lockedHint}</div>}
      </div>
    </button>
  )
}

function DeltaRow({ label, val }: { label: string; val?: number }) {
  const v = val ?? 0
  const cls = v > 0 ? 'pos-n' : v < 0 ? 'neg-n' : 'zero-n'
  return <div className="delta"><span className="dk">{label}</span><span className={cls}>{v > 0 ? '+' : ''}{v || 0}</span></div>
}

// —— 结算：NPC 反应 + 指标增减动画 ——
function ResultView() {
  const s = useGame()
  const { currentEventId, lastResult, lastDeltas, continueFromResult } = s
  const ev = currentEventId ? EVENT_MAP[currentEventId] : null
  if (!ev || !lastResult) return null
  const replyFace = lastResult.reply ? faceOf(s, lastResult.reply.npcId) : null

  return (
    <div className="maincard" style={{ padding: 18 }}>
      <span className="badge evt">事件结果</span>
      <div className="ev-title" style={{ fontSize: 20, marginTop: 8 }}>{ev.title}</div>
      <div className="result-text">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>你选择：{lastResult.option}</div>
        {lastResult.text}
      </div>
      {lastResult.reply && replyFace && (
        <div className="dlg-row" style={{ marginBottom: 12 }}>
          <Avatar face={replyFace} mood={lastResult.reply.mood} size={48} ring />
          <div className="dlg-bubble">
            <div className="dlg-name">{replyFace.name} <span className="muted">· {replyFace.role}</span></div>
            <div className="dlg-text">{lastResult.reply.text}</div>
          </div>
        </div>
      )}
      {lastDeltas && <ResolutionAnim d={lastDeltas} />}
      <button className="btn block" style={{ marginTop: 14 }} onClick={continueFromResult}>继续经营 ›</button>
    </div>
  )
}

function useCountUp(to: number, ms = 650) {
  const [v, setV] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      setV(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, ms])
  return v
}

function AnimNum({ value, money }: { value: number; money?: boolean }) {
  const v = useCountUp(value)
  const r = money ? Math.round(v) : Math.round(v * 10) / 10
  const cls = value > 0 ? 'pos-n' : value < 0 ? 'neg-n' : 'zero-n'
  const txt = money ? `${value > 0 ? '+' : ''}¥${Math.round(r).toLocaleString()}` : `${value > 0 ? '+' : ''}${r}`
  return <span className={`anim-num ${cls}`}>{value === 0 ? '—' : txt}</span>
}

function ResolutionAnim({ d }: { d: ResolutionDelta }) {
  const rows: { label: string; value: number; money?: boolean; big?: boolean }[] = [
    { label: '📈 预估营业额', value: d.revenue, money: true, big: true },
    { label: '💵 现金流', value: d.cash, money: true },
    { label: '⭐ 口碑', value: d.reputation },
    { label: '🎭 演员关系', value: d.actorRel },
    { label: '👥 老客关系', value: d.customerLoyalty },
    { label: '🔥 内容热度', value: d.buzz, money: false },
  ].filter((r) => r.value !== 0 || r.big)
  return (
    <div className="reso">
      <div className="reso-h">本次选择的影响</div>
      <div className="reso-grid">
        {rows.map((r, i) => (
          <div className={`reso-row ${r.big ? 'big' : ''}`} key={r.label} style={{ animationDelay: `${i * 80}ms` }}>
            <span className="reso-k">{r.label}</span>
            <AnimNum value={r.label === '🔥 内容热度' ? Math.round(r.value / 1000) : r.value} money={r.money} />
            {r.label === '🔥 内容热度' && <span className="reso-u">k</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
