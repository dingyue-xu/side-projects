import { useState } from 'react'
import type { Mood } from '../types'
import type { CastFace } from '../engine/cast'
import { SHEETS } from '../data/assets'

const MOOD_BADGE: Record<Mood, string> = {
  neutral: '', happy: '😊', angry: '💢', sad: '💧', smug: '😏', cry: '😭', shy: '😳', shock: '❗',
}

export function Avatar({
  face, mood, size = 44, onClick, ring,
}: {
  face: CastFace
  mood?: Mood
  size?: number
  onClick?: () => void
  ring?: boolean
}) {
  const [imgBroken, setImgBroken] = useState(false)
  const badge = mood ? MOOD_BADGE[mood] : ''
  const slot = face.portrait
  const sheet = slot ? SHEETS[slot.sheet] : null
  const usePortrait = !!sheet && !imgBroken
  const cols = sheet?.cols ?? 3
  const rows = sheet?.rows ?? 2
  const url = sheet?.url ?? ''
  const col = slot ? slot.cell % cols : 0
  const row = slot ? Math.floor(slot.cell / cols) : 0

  return (
    <div
      className="avatar"
      onClick={onClick}
      title={face.name}
      style={{
        width: size, height: size, fontSize: size * 0.5,
        background: usePortrait ? '#e9e2d6' : `radial-gradient(120% 120% at 30% 25%, ${lighten(face.color)} 0%, ${face.color} 100%)`,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: ring ? `0 0 0 3px ${face.color}44` : undefined,
        overflow: 'hidden',
      }}
    >
      {usePortrait ? (
        // 真实肖像精灵图：把整张表缩放成 cols×rows 个 size，再平移到对应格
        <img
          src={url}
          alt={face.name}
          onError={() => setImgBroken(true)}
          style={{ position: 'absolute', width: size * cols, height: size * rows, left: -col * size, top: -row * size, objectFit: 'cover', maxWidth: 'none' }}
        />
      ) : (
        <span>{face.emoji}</span>
      )}
      {badge && <span className="avatar-mood">{badge}</span>}
    </div>
  )
}

function lighten(hex: string): string {
  if (hex.startsWith('hsl')) return hex.replace(/(\d+)%\)$/, (_m, l) => `${Math.min(100, +l + 14)}%)`)
  const n = hex.replace('#', '')
  if (n.length !== 6) return hex
  const f = (i: number) => Math.min(255, parseInt(n.slice(i, i + 2), 16) + 40)
  return `rgb(${f(0)},${f(2)},${f(4)})`
}
