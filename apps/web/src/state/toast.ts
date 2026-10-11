// Smallest possible confirmation channel: an action calls notify(), the host in
// the role shell shows one line for a few seconds. No context, no library — the
// point is that a click that changes something says so.
type Listener = (message: string) => void

const listeners = new Set<Listener>()

export function notify(message: string) {
  for (const listener of listeners) listener(message)
}

export function onNotify(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
