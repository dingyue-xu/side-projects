import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { LOCATIONS, DECOR_PLANS } from '../data/locations'
import { THEMES, SIGNATURES } from '../data/themes'
import { STARTER_SCRIPTS } from '../data/scripts'
import type { Actor, SalaryStructure } from '../types'
import {
  startNegotiation,
  offerPresets,
  respondToOffer,
  acceptCurrent,
  type NegotiationState,
} from '../engine/negotiation'

const STEP_LABELS = ['立店', '招牌玩法', '选址', '谈租金', '装修', '招演员', '出本', '定价开业']

export function SetupFlow() {
  const game = useGame()
  const [step, setStep] = useState(0)
  const go = (n: number) => setStep(n)

  return (
    <div className="card">
      <div className="steps">
        {STEP_LABELS.map((l, i) => (
          <span key={l} className={i === step ? 'on' : ''}>
            {i + 1}.{l}
            {i < STEP_LABELS.length - 1 ? ' ›' : ''}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        {step === 0 && <BrandStep onNext={() => go(1)} />}
        {step === 1 && <SignatureStep onNext={() => go(2)} />}
        {step === 2 && <LocationStep onNext={() => go(3)} />}
        {step === 3 && <NegotiationStep onNext={() => go(4)} />}
        {step === 4 && <DecorStep onNext={() => go(5)} />}
        {step === 5 && <ActorsStep onNext={() => go(6)} />}
        {step === 6 && <ScriptsStep onNext={() => go(7)} />}
        {step === 7 && <PricingStep />}
      </div>
      <p className="muted center" style={{ marginTop: 14 }}>
        启动资金 ¥{game.resources.cash.toLocaleString()}
      </p>
    </div>
  )
}

// —— 0. 立店：店名 + 主题 ——
function BrandStep({ onNext }: { onNext: () => void }) {
  const { shop, setName, setTheme } = useGame()
  return (
    <>
      <h3>给店起个名，定个主题</h3>
      <p className="muted">主题决定实景配色基调、剧本风格亲和与店铺调性。</p>
      <input
        className="txtin"
        style={{ marginTop: 12 }}
        value={shop.name}
        maxLength={12}
        onChange={(e) => setName(e.target.value)}
        placeholder="店名，如：雾隐剧场"
      />
      <div className="grid" style={{ marginTop: 12 }}>
        {THEMES.map((t) => (
          <div key={t.id} className={`choice ${shop.theme?.id === t.id ? 'sel' : ''}`} onClick={() => setTheme(t)}>
            <div className="spread">
              <h4>{t.emoji} {t.name}</h4>
              <span className="tag">亲和 {t.genreAffinity}</span>
            </div>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={!shop.theme || !shop.name.trim()} onClick={onNext}>
        定好了，选招牌玩法 ›
      </button>
    </>
  )
}

// —— 1. 招牌玩法身份 ——
function SignatureStep({ onNext }: { onNext: () => void }) {
  const { shop, setSignature } = useGame()
  return (
    <>
      <h3>你的招牌玩法是?</h3>
      <p className="muted">这是店铺的身份与命脉——给被动加成、改变事件走向、决定客群。开局就要想清怎么活。</p>
      <div className="grid" style={{ marginTop: 12 }}>
        {SIGNATURES.map((sig) => (
          <div key={sig.id} className={`choice ${shop.signature?.id === sig.id ? 'sel' : ''}`} onClick={() => setSignature(sig)}>
            <div className="spread">
              <h4>{sig.emoji} {sig.name}</h4>
              <span className="tag">{sig.audience}</span>
            </div>
            <p>{sig.desc}</p>
            <div className="pro">＋ {sig.pros}</div>
            <div className="con">－ {sig.cons}</div>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={!shop.signature} onClick={onNext}>
        就走这条路，去选址 ›
      </button>
    </>
  )
}

// —— 1. 选址 ——
function LocationStep({ onNext }: { onNext: () => void }) {
  const { shop, setLocation } = useGame()
  return (
    <>
      <h3>在北京哪开店?</h3>
      <p className="muted">高曝光高租金靠公域，偏远低租金靠私域。地段定基调。</p>
      <div className="grid" style={{ marginTop: 12 }}>
        {LOCATIONS.map((loc) => (
          <div
            key={loc.id}
            className={`choice ${shop.location?.id === loc.id ? 'sel' : ''}`}
            onClick={() => setLocation(loc)}
          >
            <div className="spread">
              <h4>{loc.name}</h4>
              <span className="tag">{loc.style}</span>
            </div>
            <p>{loc.desc}</p>
            <div className="meta">
              曝光 ×{loc.exposure} · 私域 ×{loc.privateBonus} · 房间 {loc.capacityRooms} · 房东要价 ¥{loc.rentRange[0]}~{loc.rentRange[1]}/周
            </div>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={!shop.location} onClick={onNext}>
        看中这儿，去谈租金 ›
      </button>
    </>
  )
}

// —— 2. 谈租金（真·砍价）——
function NegotiationStep({ onNext }: { onNext: () => void }) {
  const { shop, meta, commitRent } = useGame()
  const [ns, setNs] = useState<NegotiationState>(() => startNegotiation(shop.location!, meta.contacts))
  const [committed, setCommitted] = useState(false)

  const presets = offerPresets(ns)

  function offer(amount: number) {
    const { next } = respondToOffer(ns, amount)
    setNs(next)
  }
  function takeIt() {
    setNs(acceptCurrent(ns))
  }
  function confirm() {
    commitRent(ns.finalRent!, ns.grudge)
    setCommitted(true)
  }

  const forcedFinal = ns.round > ns.maxRounds && !ns.closed

  return (
    <>
      <h3>和房东砍价 · {shop.location!.name}</h3>
      <p className="muted">房东有个心里底价，压太狠会谈崩或结仇。第 {Math.min(ns.round, ns.maxRounds)}/{ns.maxRounds} 轮 · 房东心情 {ns.rapport}</p>
      <div className="nego-log">
        {ns.history.map((h, i) => (
          <div key={i} className={`bubble ${h.who}`}>
            {h.who === 'landlord' ? '🧔 房东：' : h.who === 'you' ? '🧑 你：' : ''}
            {h.text}
          </div>
        ))}
      </div>

      {!ns.closed && !forcedFinal && (
        <div className="options">
          {presets.map((p) => (
            <button key={p.tone} className="opt" onClick={() => offer(p.amount)}>
              {p.label}
              {p.tone === 'hard' && <span className="opt-hint">压得狠，房东可能不爽</span>}
            </button>
          ))}
        </div>
      )}

      {!ns.closed && forcedFinal && (
        <div className="options">
          <button className="opt" onClick={takeIt}>就按房东底价 ¥{ns.ask} 签了</button>
        </div>
      )}

      {ns.closed && !committed && (
        <>
          <div className="result-text">
            谈定：<b style={{ color: 'var(--money)' }}>¥{ns.finalRent}/周</b>
            {ns.grudge && <span style={{ color: 'var(--bad)' }}>。房东对你这通砍价记了仇，往后小心点。</span>}
          </div>
          <button className="btn block" onClick={confirm}>签约，继续 ›</button>
        </>
      )}

      {committed && (
        <button className="btn block" onClick={onNext}>
          去装修 ›
        </button>
      )}
    </>
  )
}

// —— 3. 装修 ——
function DecorStep({ onNext }: { onNext: () => void }) {
  const { shop, resources, setDecor } = useGame()
  const done = shop.immersion > 0
  return (
    <>
      <h3>装修 / 声光电</h3>
      <p className="muted">投入换沉浸感。但过度投入是破产第一杀手——量力而行。当前现金 ¥{resources.cash.toLocaleString()}</p>
      <div className="grid" style={{ marginTop: 12 }}>
        {DECOR_PLANS.map((d) => (
          <div
            key={d.id}
            className={`choice ${shop.immersion === d.immersion ? 'sel' : ''}`}
            onClick={() => setDecor(d)}
          >
            <div className="spread">
              <h4>{d.name}</h4>
              <span className="tag">沉浸感 {d.immersion}</span>
            </div>
            <p>{d.desc}</p>
            <div className="meta">花费 ¥{d.cost.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={!done} onClick={onNext}>
        装修搞定，去招人 ›
      </button>
    </>
  )
}

// —— 4. 招演员 ——
function ActorsStep({ onNext }: { onNext: () => void }) {
  const { actors, hireActor, fireActor } = useGame()
  const hiredCount = actors.filter((a) => a.hired).length
  return (
    <>
      <h3>招演员（至少 1 个）</h3>
      <p className="muted">薪资结构是核心决策：高底薪稳但烧钱；高提成旺季爽淡季留不住；分红绑定但稀释利润。</p>
      <div className="grid" style={{ marginTop: 12 }}>
        {actors.map((a) => (
          <ActorChoice key={a.id} actor={a} onHire={hireActor} onFire={fireActor} />
        ))}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={hiredCount < 1} onClick={onNext}>
        班子搭好了（{hiredCount}人），去出本 ›
      </button>
    </>
  )
}

function ActorChoice({
  actor,
  onHire,
  onFire,
}: {
  actor: Actor
  onHire: (id: string, s: SalaryStructure) => void
  onFire: (id: string) => void
}) {
  const base = actor.salaryExpect
  const salaryOptions: { label: string; s: SalaryStructure }[] = [
    { label: `高底薪 ¥${base}/周`, s: { type: 'base', weekly: base } },
    { label: `低底薪+提成 ¥${Math.round(base * 0.5)}/周 +¥80/场`, s: { type: 'commission', weekly: Math.round(base * 0.5), perSession: 80 } },
    { label: `底薪+分红 ¥${Math.round(base * 0.6)}/周 +6%营收`, s: { type: 'profitShare', weekly: Math.round(base * 0.6), sharePct: 6 } },
  ]
  return (
    <div className={`choice ${actor.hired ? 'sel' : ''}`}>
      <div className="actor-row">
        <span className="actor-av">{actor.avatar}</span>
        <div style={{ flex: 1 }}>
          <div className="spread">
            <h4 style={{ margin: 0 }}>{actor.name}</h4>
            <span>{actor.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
          </div>
          <div className="attrs">
            演技 {actor.acting} · 人气 {actor.fame} · 稳定 {actor.stability} · 期望薪资 ¥{base}/周
          </div>
        </div>
      </div>
      {!actor.hired ? (
        <div className="options" style={{ marginTop: 10 }}>
          {salaryOptions.map((o) => (
            <button key={o.label} className="opt" onClick={() => onHire(actor.id, o.s)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="row" style={{ marginTop: 10 }}>
          <span className="meta" style={{ color: 'var(--good)' }}>✓ 已签约（{salaryLabel(actor.salaryStructure!)}）</span>
          <button className="btn secondary" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 13 }} onClick={() => onFire(actor.id)}>
            撤销
          </button>
        </div>
      )}
    </div>
  )
}

function salaryLabel(s: SalaryStructure): string {
  if (s.type === 'base') return `底薪¥${s.weekly}`
  if (s.type === 'commission') return `提成¥${s.weekly}+¥${s.perSession}/场`
  return `分红¥${s.weekly}+${s.sharePct}%`
}

// —— 5. 出本 ——
function ScriptsStep({ onNext }: { onNext: () => void }) {
  const { shop, addStarterScript } = useGame()
  return (
    <>
      <h3>进首发本（至少 1 个）</h3>
      <p className="muted">剧本会过气，逼你像换菜单一样持续上新本。原创本独一份，但会被友商盯上。</p>
      <div className="grid" style={{ marginTop: 12 }}>
        {STARTER_SCRIPTS.map((s) => {
          const owned = shop.scripts.some((x) => x.id === s.id)
          return (
            <div key={s.id} className={`choice ${owned ? 'sel' : ''}`} onClick={() => !owned && addStarterScript(s)}>
              <div className="spread">
                <h4>{s.name}</h4>
                <span className="tag">{s.genre}</span>
              </div>
              <div className="meta">
                质量 {s.quality} · 当前热度 {s.heat}
                {s.original ? ' · ⭐原创本' : ''}
                {owned ? ' · ✓已进' : ''}
              </div>
            </div>
          )
        })}
      </div>
      <button className="btn block" style={{ marginTop: 14 }} disabled={shop.scripts.length < 1} onClick={onNext}>
        本子齐了（{shop.scripts.length}个），去定价 ›
      </button>
    </>
  )
}

// —— 6. 定价 + 开业 ——
function PricingStep() {
  const { shop, setPricing, beginRun } = useGame()
  const [wd, setWd] = useState(shop.pricing.weekday)
  const [we, setWe] = useState(shop.pricing.weekend)
  return (
    <>
      <h3>定价 · 准备开业</h3>
      <p className="muted">高价高毛利低上座 vs 低价走量。工作日 / 周末差异定价。</p>
      <div className="grid" style={{ marginTop: 12 }}>
        <label className="choice">
          工作日票价：<b style={{ color: 'var(--money)' }}>¥{wd}</b>/人
          <input type="range" min={138} max={498} step={10} value={wd} style={{ width: '100%', marginTop: 8 }}
            onChange={(e) => { const v = +e.target.value; setWd(v); setPricing({ weekday: v, weekend: we }) }} />
        </label>
        <label className="choice">
          周末票价：<b style={{ color: 'var(--money)' }}>¥{we}</b>/人
          <input type="range" min={168} max={598} step={10} value={we} style={{ width: '100%', marginTop: 8 }}
            onChange={(e) => { const v = +e.target.value; setWe(v); setPricing({ weekday: wd, weekend: v }) }} />
        </label>
      </div>
      <button className="btn block" style={{ marginTop: 16 }} onClick={beginRun}>
        🎬 开业！
      </button>
    </>
  )
}
