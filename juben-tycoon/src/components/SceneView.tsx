import { useGame } from '../store/gameStore'

const ROOM_ICON = ['🪑', '🛋️', '🚪', '🕰️']

/** 店铺实景：配色随主题，房间灯光随沉浸感 + 时段变化 */
export function SceneView({ variant }: { variant: 'banner' | 'full' }) {
  const s = useGame()
  const theme = s.shop.theme
  const palette = theme?.palette ?? { bg: '#262019', glow: '#c0863a', accent: '#c0863a' }
  const night = s.segment.includes('夜场')
  const rooms = s.shop.location?.capacityRooms ?? 2
  // 沉浸感越高，点亮的房间越多、辉光越强
  const litCount = Math.max(1, Math.round((s.shop.immersion / 100) * rooms + 0.4))

  const bgGrad = `radial-gradient(120% 140% at 50% 0%, ${mix(palette.bg, night ? -18 : 10)} 0%, ${mix(palette.bg, -30)} 100%)`

  if (variant === 'banner') {
    return (
      <div className="storefront" style={{ background: bgGrad }}>
        <div className="sf-emoji">{theme?.emoji ?? '🎭'}</div>
        <div className="sf-name">{s.shop.name}</div>
        <div className="sf-sub">{theme?.name ?? '沉浸式剧场'} · {s.shop.signature?.name ?? ''}</div>
        <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 -40px 60px -20px ${palette.glow}55`, pointerEvents: 'none' }} />
      </div>
    )
  }

  return (
    <div className="scene" style={{ background: bgGrad }}>
      <div className="scene-rooms">
        {Array.from({ length: rooms }).map((_, i) => {
          const lit = i < litCount
          return (
            <div
              key={i}
              className={`room ${lit ? 'lit' : 'dim'}`}
              style={{ ['--room-glow' as string]: `${palette.glow}${night ? '88' : '55'}` }}
            >
              {ROOM_ICON[i % ROOM_ICON.length]}
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 -60px 80px -20px ${palette.glow}44`, pointerEvents: 'none' }} />
      <div className="scene-title">{theme?.emoji} {s.shop.name}</div>
      <div className="scene-caption">
        {night ? '🌙 夜场前·灯光已暗下' : '☀️ 午场前·光线明亮'} ·
        沉浸感 {Math.round(s.shop.immersion)} · {litCount}/{rooms} 间房就绪 · {s.shop.location?.name}
      </div>
    </div>
  )
}

// 简单的颜色明暗调整（hex +/- 百分比）
function mix(hex: string, pct: number): string {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  const adj = (c: number) => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * 255)))
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`
}
