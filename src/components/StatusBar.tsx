export type Nudge = 'idle' | 'nudge' | 'snoozed'

type Props = { ln: number; col: number; nudge: Nudge; onNudgeClick: () => void; onSnooze: () => void; lite?: boolean }

export function StatusBar({ ln, col, nudge, onNudgeClick, onSnooze, lite = false }: Props) {
  const label = nudge === 'nudge' ? 'You may be stuck. Hint?' : nudge === 'snoozed' ? 'Nudges paused 10 min' : 'Scaffold'
  return (
    <footer className="status">
      <div className="l"><span>main.cpp</span><span>C++17</span><span>Ln {ln}, Col {col}</span></div>
      {lite ? <span style={{ color: 'var(--faint)' }}>prototype</span> : <button
        className={'nudge' + (nudge === 'nudge' ? ' on' : '')}
        onClick={onNudgeClick}
        onContextMenu={(e) => { e.preventDefault(); onSnooze() }}
        title={nudge === 'nudge' ? 'Open the tutor. Right click to snooze ⌘⇧S' : 'Scaffold is watching for struggle'}
      >
        {label}
      </button>}
    </footer>
  )
}
