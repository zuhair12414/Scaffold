// Demo rails: a fixed, known-good state for the defence, plus projector mode.
// Both are frontend-only and live in localStorage; nothing here touches the
// seeded dataset, which is regenerated identically on every load.
const COURSE_KEY = 'scaffold:course-state'
const ROUTE_KEY = 'scaffold:lastRoute'
const PROJECTOR_KEY = 'scaffold:projector'
const OVERVIEW_KEY = 'scaffold:overview-mode'

export type OverviewMode = 'easy' | 'complex'

function readMode(): OverviewMode {
  try {
    return localStorage.getItem(OVERVIEW_KEY) === 'complex' ? 'complex' : 'easy'
  } catch {
    return 'easy'
  }
}

// The Overview opens where it was left, except on the demo rails: ?demo=1 always
// comes back to easy, so a walkthrough starts on the same screen every time. The
// mode is held here rather than in the screen so the reset can move it while the
// screen is already mounted.
let mode: OverviewMode = readMode()
const modeListeners = new Set<() => void>()

export function overviewMode(): OverviewMode {
  return mode
}

export function subscribeOverviewMode(listener: () => void) {
  modeListeners.add(listener)
  return () => {
    modeListeners.delete(listener)
  }
}

export function setOverviewMode(next: OverviewMode) {
  if (mode === next) return
  mode = next
  try {
    localStorage.setItem(OVERVIEW_KEY, next)
  } catch {
    // a display preference; losing it costs nothing
  }
  for (const listener of modeListeners) listener()
}

export function clearDemoStorage() {
  setOverviewMode('easy')
  for (const key of [COURSE_KEY, ROUTE_KEY, OVERVIEW_KEY]) {
    try {
      localStorage.removeItem(key)
    } catch {
      // a private window can refuse storage; the seeded state is the default anyway
    }
  }
}

export function projectorOn() {
  try {
    return localStorage.getItem(PROJECTOR_KEY) === 'on'
  } catch {
    return false
  }
}

export function applyProjector(on: boolean) {
  document.documentElement.dataset.projector = on ? 'on' : 'off'
  try {
    localStorage.setItem(PROJECTOR_KEY, on ? 'on' : 'off')
  } catch {
    // display preference only; losing it costs nothing
  }
}
