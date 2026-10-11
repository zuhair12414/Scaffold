// Output-side guardrail (AGENTS §4.2). It never sees the model's intent and never
// reads a prompt: it takes the text the assistant actually produced and measures
// how close that text is to the reference solution. The solution lives here and
// nowhere else — it is never placed in a model's context (§4.3).
//
// The measure is a token-overlap score on the code-shaped part of the reply,
// averaged over single tokens and adjacent pairs. The real system will swap this
// for a tree-sitter comparison; the seam and the decision are the same.

export type DisclosureMeasurement = {
  similarity: number
  threshold: number
  blocked: boolean
  reason: string
}

const FENCE = /```[a-zA-Z+]*\n?([\s\S]*?)```/g
const PLACEHOLDER = /\[__\]/g

function tokens(text: string) {
  return text
    .replace(PLACEHOLDER, ' ')
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean)
}

function pairs(list: string[]) {
  return list.slice(0, -1).map((token, index) => `${token} ${list[index + 1]}`)
}

function jaccard(left: string[], right: string[]) {
  const a = new Set(left)
  const b = new Set(right)
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const item of a) if (b.has(item)) shared += 1
  return shared / (a.size + b.size - shared)
}

// Only the code-shaped part of a reply is compared: fenced blocks, an explicit
// pseudocode field, or — failing both — any line that looks like source.
export function codeShaped(text: string, pseudocode?: string) {
  const fenced = [...text.matchAll(FENCE)].map((match) => match[1]).join('\n')
  if (pseudocode || fenced) return [pseudocode ?? '', fenced].join('\n').trim()
  const lines = text.split('\n').filter((line) => /[;{}()]|return |if |while |for /.test(line))
  return lines.join('\n').trim()
}

export function measureDisclosure(reply: string, pseudocode: string | undefined, solution: string) {
  const candidate = codeShaped(reply, pseudocode)
  if (!candidate) return 0
  const left = tokens(candidate)
  const right = tokens(solution)
  const unigram = jaccard(left, right)
  const bigram = jaccard(pairs(left), pairs(right))
  return Math.round(((unigram + bigram) / 2) * 100) / 100
}

export function applyGuardrail(
  reply: string,
  pseudocode: string | undefined,
  solution: string,
  threshold: number,
): DisclosureMeasurement {
  const similarity = measureDisclosure(reply, pseudocode, solution)
  const blocked = similarity > threshold
  return {
    similarity,
    threshold,
    blocked,
    reason: blocked
      ? `similarity ${similarity.toFixed(2)} > ${threshold.toFixed(2)}`
      : `similarity ${similarity.toFixed(2)} within the lab threshold of ${threshold.toFixed(2)}`,
  }
}
