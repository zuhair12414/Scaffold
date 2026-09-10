// Display formatting for the instructor console. These helpers only shorten what
// is already in the seeded dataset — they never round a value into a claim the
// data does not support, so a cell always shows the stored figure to 2 dp.
export function mastery(value: number) {
  return value.toFixed(2)
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function dayMonth(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function dayMonthTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${dayMonth(iso)} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function count(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`
}
