type Props = {
  lab: string
  title: string
  hintLabel: string
  onRun: () => void
  onHint: () => void
  onSubmit?: () => void
  submitState?: 'idle' | 'saved'
  submitLabel?: string
}

export function Header({ lab, title, hintLabel, onRun, onHint, onSubmit, submitState = 'idle', submitLabel = 'Submit' }: Props) {
  return (
    <header className="hdr">
      <div className="brand">
        <b>Scaffold</b>
        <span className="crumb"><span>{lab}</span><span>{title}</span></span>
      </div>
      <div className="actions">
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
