import { useEffect } from 'react'
import { useGame } from './store/gameStore'
import { validateEventLibrary } from './data/events'
import { TitleScreen } from './components/TitleScreen'
import { SetupFlow } from './components/SetupFlow'
import { Dashboard } from './components/Dashboard'
import { GameOver } from './components/GameOver'

export function App() {
  const phase = useGame((s) => s.phase)

  useEffect(() => {
    const problems = validateEventLibrary()
    if (problems.length) console.warn('[事件库校验]', problems)
  }, [])

  const inDashboard = phase === 'running' || phase === 'event' || phase === 'weekly'

  if (inDashboard) return <Dashboard />

  return (
    <div className="stage">
      {phase === 'title' && <TitleScreen />}
      {phase === 'setup' && <SetupFlow />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}
