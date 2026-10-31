import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getSurah } from '../data/surahs'
import { clusterForSurah, groupForSurah } from '../data/clusters'
import EditableText from '../components/EditableText'
import Composer from '../components/Composer'
import PostCard from '../components/PostCard'

const ayahNum = (p) => (p.ayah ? parseInt(p.ayah, 10) : Infinity)

export default function Surah() {
  const number = Number(useParams().number)
  const surah = getSurah(number)
  const [posts, setPosts] = useState(null)
  const [sort, setSort] = useState('new')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, replies(*)')
      .eq('surah', number)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }, [number])

  useEffect(() => {
    setPosts(null)
    window.scrollTo(0, 0)
    if (surah) load()
  }, [surah, load])

  if (!surah) {
    return (
      <main className="wrap">
        <p>That surah doesn't exist.</p>
        <Link to="/">Back to all surahs</Link>
      </main>
    )
  }

  const cluster = clusterForSurah(number)
  const group = groupForSurah(number)
  const byAyah = (a, b) => ayahNum(a) - ayahNum(b)
  // Pinned questions without an ayah are about the whole surah, so they go first.
  const pinnedOrder = (p) => (p.ayah ? ayahNum(p) : 0)
  const pinned = (posts?.filter((p) => p.pinned) ?? []).sort((a, b) => pinnedOrder(a) - pinnedOrder(b))
  const discussion = (posts?.filter((p) => !p.pinned) ?? []).slice()
  if (sort === 'active') {
    const last = (p) => p.replies.reduce((m, r) => (r.created_at > m ? r.created_at : m), p.created_at)
    discussion.sort((a, b) => last(b).localeCompare(last(a)))
  } else if (sort === 'ayah') {
    discussion.sort(byAyah)
  }

  return (
    <main className="wrap narrow">
      <nav className="crumbs">
        <Link to="/">All surahs</Link>
        <span>/</span>
        <span>{cluster.label}</span>
      </nav>

      <header className="surah-head">
        <div>
          <p className="eyebrow">
            Surah {surah.number} · {surah.ayahs} ayat
          </p>
          <h1>{surah.name}</h1>
        </div>
        <span className="surah-ar" lang="ar">
          {surah.arabic}
        </span>
      </header>

      <section className="panel">
        <h2 className="panel-title">Theme of the surah</h2>
        <EditableText
          contentKey={`surah:${number}`}
          empty="The theme for this surah will be added when the khatm reaches it, inshallah."
        />
        <details className="cluster-context">
          <summary>
            Part of the {cluster.label.toLowerCase()}
            {group && `: ${group.label}`}
          </summary>
          <EditableText contentKey={`cluster:${cluster.id}`} />
        </details>
      </section>

      {pinned.length > 0 && (
        <section className="pinned-block">
          <h2 className="section-title">Reflection questions</h2>
          {pinned.map((p) => (
            <PostCard key={p.id} post={p} maxAyah={surah.ayahs} onChange={load} />
          ))}
        </section>
      )}

      <section>
        <h2 className="section-title">Share a reflection</h2>
        <Composer surah={number} maxAyah={surah.ayahs} onPosted={load} />
      </section>

      <section>
        <div className="discussion-head">
          <h2 className="section-title">Discussion {posts && <span className="muted">({discussion.length})</span>}</h2>
          {discussion.length > 1 && (
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort posts">
              <option value="new">Newest</option>
              <option value="active">Recently active</option>
              <option value="ayah">By ayah</option>
            </select>
          )}
        </div>
        {posts === null && <p className="muted">Loading…</p>}
        {posts && discussion.length === 0 && (
          <div className="empty">
            <p>No reflections yet. Be the first to share what stood out to you in {surah.name}.</p>
          </div>
        )}
        {discussion.map((p) => (
          <PostCard key={p.id} post={p} maxAyah={surah.ayahs} onChange={load} />
        ))}
      </section>

      <nav className="pager">
        {number > 1 ? (
          <Link to={`/surah/${number - 1}`}>← {getSurah(number - 1).name}</Link>
        ) : (
          <span />
        )}
        {number < 114 && <Link to={`/surah/${number + 1}`}>{getSurah(number + 1).name} →</Link>}
      </nav>
    </main>
  )
}
