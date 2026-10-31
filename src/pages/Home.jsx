import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clusters } from '../data/clusters'
import { surahs } from '../data/surahs'
import EditableText from '../components/EditableText'

function SurahTile({ surah, count }) {
  return (
    <Link to={`/surah/${surah.number}`} className="tile">
      <span className="tile-num">{surah.number}</span>
      <span className="tile-names">
        <span className="tile-name">{surah.name}</span>
        <span className="tile-sub">
          {surah.ayahs} ayat
          {count > 0 && (
            <>
              {' · '}
              <span className="tile-count">
                {count} {count === 1 ? 'post' : 'posts'}
              </span>
            </>
          )}
        </span>
      </span>
      <span className="tile-ar" lang="ar">
        {surah.arabic}
      </span>
    </Link>
  )
}

const inRange = ([a, b]) => surahs.slice(a - 1, b)

export default function Home() {
  const [counts, setCounts] = useState({})
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabase
      .from('surah_counts')
      .select('surah, posts')
      .then(({ data }) => data && setCounts(Object.fromEntries(data.map((r) => [r.surah, r.posts]))))
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, '')
    if (!q) return null
    return surahs.filter(
      (s) =>
        String(s.number) === q ||
        s.name.toLowerCase().replace(/[^a-z]/g, '').includes(q) ||
        s.arabic.includes(query.trim()),
    )
  }, [query])

  return (
    <main className="wrap">
      <section className="hero">
        <p className="eyebrow">Western Islamic Relief Club</p>
        <h1>Reflecting on the Quran, together.</h1>
        <EditableText contentKey="intro" className="lead" />
      </section>

      <div className="search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a surah by name or number…"
          aria-label="Find a surah"
        />
      </div>

      {matches ? (
        <section className="cluster">
          <div className="tiles">
            {matches.map((s) => (
              <SurahTile key={s.number} surah={s} count={counts[s.number]} />
            ))}
          </div>
          {matches.length === 0 && <p className="muted">No surah matches “{query}”.</p>}
        </section>
      ) : (
        clusters.map((c) => (
          <div key={c.id}>
            {c.id === 9 && (
              <section className="mufassal">
                <h2>
                  Al-Mufassal <span lang="ar">المفصل</span>
                </h2>
                <EditableText contentKey="mufassal" />
              </section>
            )}
            <section className={c.mufassal ? 'cluster in-mufassal' : 'cluster'}>
              <div className="cluster-head">
                <span className="cluster-label">{c.label}</span>
                <h2>
                  {surahs[c.range[0] - 1].name}
                  {c.range[0] !== c.range[1] && <> – {surahs[c.range[1] - 1].name}</>}
                </h2>
              </div>
              <EditableText contentKey={`cluster:${c.id}`} clamp className="theme" />
              {c.groups ? (
                c.groups.map((g) => (
                  <div className="group" key={g.label}>
                    <h3>{g.label}</h3>
                    <div className="tiles">
                      {inRange(g.range).map((s) => (
                        <SurahTile key={s.number} surah={s} count={counts[s.number]} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="tiles">
                  {inRange(c.range).map((s) => (
                    <SurahTile key={s.number} surah={s} count={counts[s.number]} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ))
      )}
    </main>
  )
}
