import type { Problem } from '../data/problems'

export function ProblemPane({ p, collapsed, lite = false }: { p: Problem; collapsed: boolean; lite?: boolean }) {
  return (
    <aside className={'pane problem' + (collapsed ? ' collapsed' : '')} aria-label="Problem">
      <div className="rail">{p.id} · {p.title}</div>
      <h1>{p.title}</h1>
      <p>{p.statement}</p>
      <div className="sec">Examples</div>
      {p.examples.map((e) => <div className="ex" key={e}>{e}</div>)}
      <div className="sec">Constraints</div>
      <ul>{p.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
      {!lite && <div className="concepts">
        <div className="sec">Concepts here</div>
        {p.concepts.map((c) => (
          <div className="row" key={c.name}>
            <span>{c.name}</span>
            <div className="segs" aria-label={`${c.name} mastery`}>
              {[0, 1, 2, 3].map((i) => <i key={i} className={c.mastery > i / 4 + 0.05 ? 'on' : ''} />)}
            </div>
          </div>
        ))}
      </div>}
    </aside>
  )
}
