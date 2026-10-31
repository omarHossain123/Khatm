import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [content, setContent] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setIsAdmin(false)
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)))
  }, [session])

  const refreshContent = useCallback(async () => {
    const { data } = await supabase.from('content').select('key, body')
    if (data) setContent(Object.fromEntries(data.map((row) => [row.key, row.body])))
  }, [])

  useEffect(() => {
    refreshContent()
  }, [refreshContent])

  const saveContent = async (key, body) => {
    const { error } = await supabase
      .from('content')
      .upsert({ key, body, updated_at: new Date().toISOString() })
    if (error) throw error
    setContent((c) => ({ ...c, [key]: body }))
  }

  return (
    <StoreContext.Provider value={{ session, isAdmin, content, saveContent }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)

// The join code is remembered in this browser so members only enter it once.
const CODE_KEY = 'irc-khatm-join-code'

export function getJoinCode() {
  try {
    return localStorage.getItem(CODE_KEY) || ''
  } catch {
    return ''
  }
}

export function setJoinCode(code) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code)
    else localStorage.removeItem(CODE_KEY)
  } catch {
    // storage unavailable (private mode); the member will just be asked again
  }
}

export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
