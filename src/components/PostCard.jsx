import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { timeAgo, useStore } from '../lib/store'
import Composer from './Composer'

function Author({ isAdmin, createdAt }) {
  return (
    <div className="meta">
      {isAdmin ? <span className="badge team">Khatm team</span> : <span className="anon">Anonymous</span>}
      <span className="dot">·</span>
      <span>{timeAgo(createdAt)}</span>
    </div>
  )
}

function ReportButton({ postId, replyId }) {
  const [done, setDone] = useState(false)
  if (done) return <span className="muted small">Reported, thank you</span>
  const report = async () => {
    if (!confirm('Report this to the admins?')) return
    await supabase.rpc('report_content', { p_post_id: postId ?? null, p_reply_id: replyId ?? null })
    setDone(true)
  }
  return (
    <button className="link-btn subtle" onClick={report}>
      Report
    </button>
  )
}

export default function PostCard({ post, maxAyah, onChange }) {
  const { isAdmin } = useStore()
  const [replying, setReplying] = useState(false)
  // Pinned questions collect many answers, so keep them folded to keep the page scannable.
  const [open, setOpen] = useState(!post.pinned && post.replies.length <= 3)
  const replies = [...post.replies].sort((a, b) => a.created_at.localeCompare(b.created_at))

  const remove = async (table, id) => {
    if (!confirm('Delete this permanently?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) alert(error.message)
    onChange()
  }

  const togglePin = async () => {
    const { error } = await supabase.from('posts').update({ pinned: !post.pinned }).eq('id', post.id)
    if (error) alert(error.message)
    onChange()
  }

  return (
    <article className={post.pinned ? 'post pinned' : 'post'}>
      <div className="post-head">
        <Author isAdmin={post.is_admin} createdAt={post.created_at} />
        {post.ayah && <span className="badge ayah">Ayah {post.ayah}</span>}
      </div>
      <p className="prose">{post.body}</p>

      <div className="actions">
        <button className="link-btn" onClick={() => setReplying(!replying)}>
          Reply
        </button>
        {replies.length > 0 && (
          <button className="link-btn subtle" onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
        <div className="spacer" />
        {!isAdmin && <ReportButton postId={post.id} />}
        {isAdmin && (
          <>
            <button className="link-btn admin" onClick={togglePin}>
              {post.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button className="link-btn danger" onClick={() => remove('posts', post.id)}>
              Delete
            </button>
          </>
        )}
      </div>

      {open && replies.length > 0 && (
        <div className="replies">
          {replies.map((r) => (
            <div className="reply" key={r.id}>
              <Author isAdmin={r.is_admin} createdAt={r.created_at} />
              <p className="prose">{r.body}</p>
              <div className="actions">
                <div className="spacer" />
                {!isAdmin && <ReportButton replyId={r.id} />}
                {isAdmin && (
                  <button className="link-btn danger" onClick={() => remove('replies', r.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <Composer
          postId={post.id}
          maxAyah={maxAyah}
          onCancel={() => setReplying(false)}
          onPosted={() => {
            setReplying(false)
            setOpen(true)
            onChange()
          }}
        />
      )}
    </article>
  )
}
