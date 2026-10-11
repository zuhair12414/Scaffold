import { useEffect, useMemo, useState } from 'react'
import { Markdown } from './Markdown'
import type { ManualMeta } from '../types'

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Opens whatever the manual actually is: the text of a seeded reference, the bytes
// of a file uploaded in this session, or an honest line saying the file is not in
// this browser any more. Uploaded files are shown, never parsed.
export function ManualViewer({ manual, file, onClose }: { manual: ManualMeta; file?: File; onClose: () => void }) {
  const [text, setText] = useState<{ key: string; value: string } | null>(null)
  const textKey = file && (file.name.endsWith('.md') || file.type.startsWith('text/'))
    ? `${file.name}:${file.size}:${file.lastModified}`
    : ''
  const objectUrl = useMemo(() => (
    file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))
      ? URL.createObjectURL(file)
      : null
  ), [file])

  useEffect(() => {
    if (!objectUrl) return
    return () => URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  useEffect(() => {
    if (!file || objectUrl || !textKey) return
    let live = true
    file.text().then((value) => { if (live) setText({ key: textKey, value }) }).catch(() => { if (live) setText(null) })
    return () => { live = false }
  }, [file, objectUrl, textKey])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const body = () => {
    if (objectUrl) return <iframe className="manual-frame" src={objectUrl} title={manual.name} />
    if (text && text.key === textKey) return <Markdown text={text.value} />
    if (manual.content) return <Markdown text={manual.content} />
    if (file) {
      return (
        <p className="quiet-block">
          {manual.name} is a {manual.type.toUpperCase()} file. It is held in memory for this
          session and shown to students as an attachment; the prototype does not parse it.
        </p>
      )
    }
    return (
      <p className="quiet-block">
        This reference was attached before the page was reloaded, so its contents are no longer in
        this browser. Only the file details were saved. Upload it again from Labs &amp; Manuals to
        read it here.
      </p>
    )
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={manual.name} onClick={onClose}>
      <div className="modal manual-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="instructor-eyebrow">Reference material</p>
            <h2>{manual.name}</h2>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
          </button>
        </header>
        <p className="modal-meta">{manual.type.toUpperCase()} / {sizeLabel(manual.sizeBytes)} / attached by the instructor</p>
        <div className="modal-body" data-testid="manual-body">{body()}</div>
      </div>
    </div>
  )
}
