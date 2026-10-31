import { useState } from 'react'
import { useStore } from '../lib/store'

// Shows a piece of editable content. Admins get an Edit button.
export default function EditableText({ contentKey, empty, className = '', clamp = false }) {
  const { content, isAdmin, saveContent } = useStore()
  const value = content[contentKey] || ''
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')

  if (editing) {
    const save = async () => {
      setSaving(true)
      setError('')
      try {
        await saveContent(contentKey, draft.trim())
        setEditing(false)
      } catch (e) {
        setError(e.message)
      } finally {
        setSaving(false)
      }
    }
    return (
      <div className="editable editing">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} autoFocus />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="btn primary small" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn ghost small" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (!value && !isAdmin) return empty ? <p className={`muted ${className}`}>{empty}</p> : null

  const long = clamp && value.length > 280
  return (
    <div className="editable">
      {value ? (
        <p className={`prose ${className} ${long && !expanded ? 'clamped' : ''}`}>{value}</p>
      ) : (
        <p className="muted">{empty || 'Nothing here yet.'}</p>
      )}
      <div className="row">
        {long && (
          <button className="link-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        {isAdmin && (
          <button
            className="link-btn admin"
            onClick={() => {
              setDraft(value)
              setEditing(true)
            }}
          >
            {value ? 'Edit' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  )
}
