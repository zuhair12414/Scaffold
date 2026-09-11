import type { DemoStage, LabQuestion } from '../mock/labQuestions'

type Props = {
  question: LabQuestion
  stage: DemoStage
  onFill: (stage: DemoStage) => void
  onAsk: (text: string) => void
}

const FILLS: { stage: Exclude<DemoStage, 'empty'>; label: string; note: string }[] = [
  { stage: 'partial', label: 'Partial', note: 'started, one case handled' },
  { stage: 'struggling', label: 'Struggling', note: 'plausible but wrong' },
  { stage: 'full', label: 'Working', note: 'passes the tests' },
]

// DEMO ONLY. None of this ships: it exists so a walkthrough can put the editor in
// a known state instead of typing C++ in front of a panel. The banner says so on
// screen, because a panel that spots undeclared help doubts everything else.
export function DemoPanel({ question, stage, onFill, onAsk }: Props) {
  const queries = question.demo.queries.filter((query) => query.stage === stage)
  const shown = queries.length ? queries : question.demo.queries.slice(0, 1)

  return (
    <section className="demo-panel" data-testid="demo-panel">
      <header>
        <strong>Demo controls</strong>
        <em>not part of the product</em>
      </header>
      <p>Put the editor in a known state:</p>
      <div className="demo-fills">
        <button onClick={() => onFill('empty')} data-testid="fill-empty">Starter</button>
        {FILLS.map((fill) => (
          <button
            key={fill.stage}
            className={stage === fill.stage ? 'on' : undefined}
            onClick={() => onFill(fill.stage)}
            title={fill.note}
            data-testid={`fill-${fill.stage}`}
          >
            {fill.label}
          </button>
        ))}
      </div>
      <p>Ask the tutor something a student would ask here:</p>
      <div className="demo-queries">
        {shown.map((query) => (
          <button key={query.text} onClick={() => onAsk(query.text)} data-testid="demo-query">
            {query.text}
          </button>
        ))}
      </div>
    </section>
  )
}
