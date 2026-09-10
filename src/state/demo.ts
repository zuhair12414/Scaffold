// Demo rails: a fixed, known-good state for the defence, plus projector mode.
// Both are frontend-only and live in localStorage; nothing here touches the
// seeded dataset, which is regenerated identically on every load.
const COURSE_KEY = 'scaffold:course-state'
const ROUTE_KEY = 'scaffold:lastRoute'
const PROJECTOR_KEY = 'scaffold:projector'

export function clearDemoStorage() {
  for (const key of [COURSE_KEY, ROUTE_KEY]) {
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
