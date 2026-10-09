import { useState } from 'react'
import { useGame } from '../store/gameStore'
import { NPCS, ROLE_LABEL } from '../data/npcs'
import { portraitOf } from '../data/assets'
import { Avatar } from './Avatar'
import type { CastFace } from '../engine/cast'

export function Codex({ onClose }: { onClose: () => void }) {
  const actors = useGame((s) => s.actors)
  const [open, setOpen] = useState<string | null>(null)

  const actorCards = actors.map((a) => ({
    face: { id: a.id, name: a.name, emoji: a.avatar, color: '#8a6a4a', role: a.hired ? '在职演员' : '招募池', portrait: portraitOf(a.id) } as CastFace,
    title: `演技${a.acting} · 人气${a.fame} · 稳定${a.stability}`,
    bio: `期望周薪 ¥${a.salaryExpect} · 关系${a.relationship}/士气${a.morale}`,
    traits: a.tags,
    hired: a.hired,
  }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>📇 NPC 图鉴</h3>
          <button className="menu-btn" onClick={onClose}>关闭 ✕</button>
        </div>

        <div className="codex-sec">演员团队</div>
        <div className="codex-grid">
          {actorCards.map((c) => (
            <CodexCard key={c.face.id} face={c.face} title={c.title} bio={c.bio} traits={c.traits}
              open={open === c.face.id} onToggle={() => setOpen(open === c.face.id ? null : c.face.id)} dim={!c.hired} />
          ))}
        </div>

        <div className="codex-sec" style={{ marginTop: 14 }}>剧本杀生态</div>
        <div className="codex-grid">
          {NPCS.map((n) => (
            <CodexCard
              key={n.id}
              face={{ id: n.id, name: n.name, emoji: n.emoji, color: n.color, role: ROLE_LABEL[n.role], portrait: portraitOf(n.id) }}
              title={n.title} bio={n.bio} traits={n.traits}
              open={open === n.id} onToggle={() => setOpen(open === n.id ? null : n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CodexCard({ face, title, bio, traits, open, onToggle, dim }: {
  face: CastFace; title: string; bio: string; traits: string[]; open: boolean; onToggle: () => void; dim?: boolean
}) {
  return (
    <div className={`codex-card ${open ? 'open' : ''}`} onClick={onToggle} style={{ opacity: dim ? 0.55 : 1 }}>
      <div className="row" style={{ gap: 10 }}>
        <Avatar face={face} size={46} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{face.name} <span className="tag">{face.role}</span></div>
          <div className="muted" style={{ fontSize: 11 }}>{title}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#46423c' }}>{bio}</div>
          <div style={{ marginTop: 6 }}>{traits.map((t) => <span className="tag" key={t} style={{ marginRight: 4 }}>{t}</span>)}</div>
        </div>
      )}
    </div>
  )
}
