export type MasteryBarItem = {
  id: string
  label: string
  value: number
  low: number
  high: number
}

// One bar per concept: the estimate as a filled track, the uncertainty band as a
// hatched region over it. Shared by the instructor's student detail and the
// student's own sidebar so both read the same picture of the same estimate.
export function MasteryBars({ items, compact = false }: { items: MasteryBarItem[]; compact?: boolean }) {
  return (
    <div className={compact ? 'concept-bar-list is-compact' : 'concept-bar-list'}>
      {items.map((item) => (
        <div key={item.id} className="concept-bar">
          <div>
            <span>{item.label}</span>
            <strong>{item.value.toFixed(2)}</strong>
          </div>
          <div className="bar-track">
            <i className="bar-fill" style={{ width: `${item.value * 100}%` }} />
            <i
              className="bar-band"
              style={{ left: `${item.low * 100}%`, width: `${(item.high - item.low) * 100}%` }}
              title={`uncertainty ${item.low.toFixed(2)} to ${item.high.toFixed(2)}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
