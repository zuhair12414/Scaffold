// Small block renderer: headings, lists, fenced code, paragraphs, inline bold and
// code. Enough for a lab statement or an attached manual, and small enough to
// explain — no markdown library is pulled in for it.
function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    return <span key={key}>{part}</span>
  })
}

export function Markdown({ text, empty }: { text: string; empty?: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)
  if (!blocks.length) return <p className="sentence-empty">{empty ?? 'Nothing to show yet.'}</p>

  return (
    <div className="markdown">
      {blocks.map((block, index) => {
        const key = `block-${index}`
        if (block.startsWith('```')) {
          return <pre key={key}>{block.replace(/^```[a-zA-Z+]*\n?/, '').replace(/```$/, '').trimEnd()}</pre>
        }
        if (block.startsWith('### ')) return <h4 key={key}>{inline(block.slice(4), key)}</h4>
        if (block.startsWith('## ')) return <h3 key={key}>{inline(block.slice(3), key)}</h3>
        if (block.startsWith('# ')) return <h2 key={key}>{inline(block.slice(2), key)}</h2>
        if (/^(-|\d+\.)\s/.test(block)) {
          // A wrapped source line belongs to the item above it, not to a new one.
          const items = block.split('\n').reduce<string[]>((list, line) => {
            const text = line.trim()
            if (!text) return list
            if (/^(-|\d+\.)\s/.test(text)) list.push(text.replace(/^(-|\d+\.)\s*/, ''))
            else if (list.length) list[list.length - 1] = `${list[list.length - 1]} ${text}`
            return list
          }, [])
          const ordered = /^\d+\.\s/.test(block)
          const list = items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{inline(item, `${key}-${itemIndex}`)}</li>
          ))
          return ordered ? <ol key={key}>{list}</ol> : <ul key={key}>{list}</ul>
        }
        return <p key={key}>{inline(block, key)}</p>
      })}
    </div>
  )
}
