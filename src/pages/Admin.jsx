import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { timeAgo, useStore } from '../lib/store'
import { getSurah } from '../data/surahs'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <form className="panel login" onSubmit={submit}>
      <h1>Admin login</h1>
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function JoinCode() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('join_code')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setCode(data.join_code))
  }, [])

  const save = async () => {
    const { error } = await supabase.from('settings').update({ join_code: code.trim() }).eq('id', 1)
    setStatus(error ? error.message : 'Saved. Share the new code in the group chat.')
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Join code</h2>
      <p className="muted">
        Members need this code to post. Changing it stops anyone with the old code from posting.
      </p>
      <div className="row">
        <input value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn primary small" onClick={save} disabled={!code.trim()}>
          Save
        </button>
      </div>
      {status && <p className="hint">{status}</p>}
    </section>
  )
}

function Reports() {
  const [reports, setReports] = useState(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, created_at, post:posts(id, surah, body), reply:replies(id, body, post:posts(surah))')
      .order('created_at', { ascending: false })
    setReports(data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dismiss = async (id) => {
    await supabase.from('reports').delete().eq('id', id)
    load()
  }

  const removeContent = async (r) => {
    if (!confirm('Delete this content permanently?')) return
    if (r.post) await supabase.from('posts').delete().eq('id', r.post.id)
    else await supabase.from('replies').delete().eq('id', r.reply.id)
    load()
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Reports {reports && <span className="muted">({reports.length})</span>}</h2>
      {reports === null && <p className="muted">Loading…</p>}
      {reports?.length === 0 && <p className="muted">Nothing reported. Alhamdulillah.</p>}
      {reports?.map((r) => {
        const item = r.post || r.reply
        const surah = r.post?.surah ?? r.reply?.post?.surah
        return (
          <div className="report" key={r.id}>
            <div className="meta">
              <span className="badge">{r.post ? 'Post' : 'Reply'}</span>
              {surah && <Link to={`/surah/${surah}`}>{getSurah(surah).name}</Link>}
              <span className="dot">·</span>
              <span>reported {timeAgo(r.created_at)}</span>
            </div>
            <p className="prose">{item?.body}</p>
            <div className="row">
              <button className="btn danger small" onClick={() => removeContent(r)}>
                Delete content
              </button>
              <button className="btn ghost small" onClick={() => dismiss(r.id)}>
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function Admin() {
  const { session, isAdmin } = useStore()

  if (!session) {
    return (
      <main className="wrap narrow">
        <Login />
      </main>
    )
  }

  return (
    <main className="wrap narrow">
      <div className="admin-head">
        <h1>Admin</h1>
        <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
      {!isAdmin ? (
        <p className="panel">
          You're signed in, but this account isn't an admin yet. Add it to the <code>admins</code> table (see README).
        </p>
      ) : (
        <>
          <section className="panel">
            <h2 className="panel-title">How editing works</h2>
            <p className="prose muted">
              While you're signed in, every theme on the site has an <strong>Edit</strong> button: the welcome text and
              cluster themes on the home page, and each surah's theme on its page. On a surah page you can also post as
              the Khatm team, pin a post as a reflection question, and delete any post or reply.
            </p>
          </section>
          <Reports />
          <JoinCode />
        </>
      )}
    </main>
  )
}
