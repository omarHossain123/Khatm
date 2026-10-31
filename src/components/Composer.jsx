import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getJoinCode, setJoinCode, useStore } from '../lib/store'

// Form for a new post (when `surah` is given) or a reply (when `postId` is given).
// Members post anonymously through a join-code-checked function; admins write directly.
export default function Composer({ surah, postId, maxAyah, onPosted, onCancel }) {
  const { isAdmin } = useStore()
  const isReply = Boolean(postId)
  const [body, setBody] = useState('')
  const [ayah, setAyah] = useState('')
  const [pinned, setPinned] = useState(false)
  const [code, setCode] = useState(getJoinCode())
  const [needsCode, setNeedsCode] = useState(!getJoinCode())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    if (!isReply && ayah && !validAyah(ayah, maxAyah)) {
      setError(`Ayah should be a number from 1 to ${maxAyah}, or a range like 30-39.`)
      return
    }
    setBusy(true)
    setError('')

    let result
    if (isAdmin) {
      result = isReply
        ? await supabase.from('replies').insert({ post_id: postId, body: body.trim(), is_admin: true })
        : await supabase
            .from('posts')
            .insert({ surah, ayah: ayah.trim() || null, body: body.trim(), is_admin: true, pinned })
    } else {
      result = isReply
        ? await supabase.rpc('create_reply', { p_code: code.trim(), p_post_id: postId, p_body: body })
        : await supabase.rpc('create_post', { p_code: code.trim(), p_surah: surah, p_ayah: ayah, p_body: body })
    }

    setBusy(false)
    if (result.error) {
      if (result.error.message.includes('invalid join code')) {
        setJoinCode('')
        setNeedsCode(true)
        setError("That join code didn't work. Check the group chat for the current one.")
      } else {
        setError('Something went wrong posting that. Please try again.')
      }
      return
    }
    if (!isAdmin) {
      setJoinCode(code.trim())
      setNeedsCode(false)
    }
    setBody('')
    setAyah('')
    setPinned(false)
    onPosted?.()
  }

  return (
    <form className={isReply ? 'composer reply' : 'composer'} onSubmit={submit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          isReply
            ? 'Write a reply…'
            : 'Share a reflection, a question, or an ayah that stood out to you…'
        }
        rows={isReply ? 2 : 4}
        maxLength={4000}
      />
      <div className="composer-bar">
        {!isReply && (
          <label className="field inline">
            <span>Ayah</span>
            <input
              value={ayah}
              onChange={(e) => setAyah(e.target.value)}
              placeholder="optional"
              maxLength={20}
              inputMode="numeric"
            />
          </label>
        )}
        {!isAdmin && needsCode && (
          <label className="field inline">
            <span>Join code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="from the group chat" required />
          </label>
        )}
        {isAdmin && !isReply && (
          <label className="check">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin as a reflection question
          </label>
        )}
        <div className="spacer" />
        {onCancel && (
          <button type="button" className="btn ghost small" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn primary small" disabled={busy || !body.trim()}>
          {busy ? 'Posting…' : isReply ? 'Reply' : 'Post anonymously'}
        </button>
      </div>
      {isAdmin && <p className="hint">Posting as admin. This will show a “Khatm team” badge.</p>}
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function validAyah(value, max) {
  const m = value.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/)
  if (!m) return false
  const a = Number(m[1])
  const b = m[2] ? Number(m[2]) : a
  return a >= 1 && b >= a && b <= max
}
