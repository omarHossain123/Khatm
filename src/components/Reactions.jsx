import { useEffect, useRef, useState } from 'react'
import { REACTIONS } from '../lib/reactions'

// Reaction counts for one post or reply, plus a picker that explains each reaction.
// `state` is { [kind]: { count, mine } }.
export default function Reactions({ state = {}, onToggle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const active = REACTIONS.filter((r) => state[r.kind]?.count > 0)

  return (
    <div className="reactions" ref={ref}>
      {active.map((r) => (
        <button
          key={r.kind}
          className={state[r.kind].mine ? 'reaction-chip mine' : 'reaction-chip'}
          onClick={() => onToggle(r.kind)}
          title={`${r.label}: ${r.description}`}
          aria-pressed={state[r.kind].mine}
          aria-label={`${r.label}, ${state[r.kind].count}`}
        >
          <span aria-hidden="true">{r.emoji}</span> {state[r.kind].count}
        </button>
      ))}
      <button
        className="reaction-add"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Add a reaction"
        title="React"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="12" r="8" />
          <path d="M8 14s1.2 1.8 3 1.8 3-1.8 3-1.8M8.5 9.5h.01M13.5 9.5h.01" />
          <path d="M20 3v4M18 5h4" />
        </svg>
      </button>
      {open && (
        <div className="reaction-picker" role="menu">
          {REACTIONS.map((r) => {
            const mine = state[r.kind]?.mine
            return (
              <button
                key={r.kind}
                role="menuitemcheckbox"
                aria-checked={Boolean(mine)}
                className={mine ? 'picker-item mine' : 'picker-item'}
                onClick={() => {
                  onToggle(r.kind)
                  setOpen(false)
                }}
              >
                <span className="picker-emoji" aria-hidden="true">
                  {r.emoji}
                </span>
                <span>
                  <span className="picker-label">
                    {r.label}
                    {mine && <span className="picker-mine"> · tap to remove</span>}
                  </span>
                  <span className="picker-desc">{r.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
