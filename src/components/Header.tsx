type Props = {
  lab: string
  title: string
  hintLabel: string
  onRun: () => void
  onHint: () => void
  onSubmit?: () => void
  submitState?: 'idle' | 'saved'
  submitLabel?: string
  shareData?: boolean
  onToggleShareData?: (share: boolean) => void
}

export function Header({
  lab,
  title,
  hintLabel,
  onRun,
  onHint,
  onSubmit,
  submitState = 'idle',
  submitLabel = 'Submit',
  shareData = true,
  onToggleShareData,
}: Props) {
  return (
    <header className="hdr">
      <div className="brand">
        <b>Scaffold</b>
        <span className="crumb"><span>{lab}</span><span>{title}</span></span>
      </div>
      <div className="actions" style={{ alignItems: 'center' }}>
        {onToggleShareData && (
          <div className="telemetry-opt-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 8, lineHeight: 1.2 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                role="switch"
                aria-label="Share behaviour data"
                checked={shareData}
                onChange={(e) => onToggleShareData(e.target.checked)}
                style={{ cursor: 'pointer', margin: 0 }}
              />
              <span>Share behaviour data</span>
            </label>
            <span style={{ fontSize: 10, color: 'var(--faint)' }}>
              Stops new edit, paste, cursor, focus and idle capture. Data already queued may still be sent. Hints still work.
            </span>
          </div>
        )}
        <button className="btn" onClick={onRun} title="Compile and run">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
          Run <kbd>⌘↵</kbd>
        </button>
        {onSubmit && (
          <button className="btn" onClick={onSubmit} title="Submit this attempt to your instructor" data-testid="submit-attempt">
            {submitState === 'saved' ? 'Submitted' : submitLabel}
          </button>
        )}
        <button className="btn accent" onClick={onHint} title="Open the tutor">
          {hintLabel} <kbd>⌘I</kbd>
        </button>
      </div>
    </header>
  )
}
