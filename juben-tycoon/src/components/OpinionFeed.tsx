import { useState } from 'react'
import { useGame } from '../store/gameStore'
import type { EventSource, FeedTone } from '../types'

const SRC_ICON: Record<EventSource, string> = { dianping: '🟠', wechat: '🟢', xhs: '🔴', onsite: '🏠', industry: '🏢' }
const TONE_LABEL: Record<FeedTone, string> = { pos: '正面', neu: '中性', neg: '负面' }

type Tab = 'all' | 'dianping' | 'wechat' | 'xhs'

export function OpinionFeed() {
  const feed = useGame((s) => s.feed)
  const [tab, setTab] = useState<Tab>('all')
  const [onlyNeg, setOnlyNeg] = useState(false)

  const counts = {
    dianping: feed.filter((f) => f.source === 'dianping').length,
    wechat: feed.filter((f) => f.source === 'wechat').length,
    xhs: feed.filter((f) => f.source === 'xhs').length,
  }
  const shown = feed.filter((f) => {
    if (tab !== 'all' && f.source !== tab) return false
    if (onlyNeg && f.tone !== 'neg') return false
    return true
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: `全部 ${feed.length}` },
    { id: 'dianping', label: `大众点评 ${counts.dianping}` },
    { id: 'wechat', label: `微信群 ${counts.wechat}` },
    { id: 'xhs', label: `小红书 ${counts.xhs}` },
  ]

  return (
    <div className="feed-card">
      <div className="feed-top">
        <div className="spread">
          <b style={{ fontSize: 14 }}>📡 实时舆情动态</b>
          <label style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyNeg} onChange={(e) => setOnlyNeg(e.target.checked)} /> 只看负面
          </label>
        </div>
        <div className="feed-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`feed-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="feed-list">
        {shown.length === 0 && <div className="muted" style={{ padding: 16, fontSize: 13 }}>暂无相关动态。</div>}
        {shown.map((f) => (
          <div className="feed-item" key={f.id}>
            <div className="fi-top">
              <span className="fi-src">{SRC_ICON[f.source]}</span>
              <span className="fi-who">{f.who}</span>
              <span className="fi-ago">· {f.ago}</span>
              <span className={`fi-tone tone-${f.tone}`}>{TONE_LABEL[f.tone]}</span>
            </div>
            <div className="fi-text">{f.text}</div>
            <div className="fi-foot"><span>👍 {f.likes}</span><span>💬 {f.comments}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
