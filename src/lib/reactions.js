export const REACTIONS = [
  { kind: 'love', emoji: '❤️', label: 'Love', description: 'I really appreciated this' },
  { kind: 'ameen', emoji: '🤲', label: 'Ameen', description: 'Saying ameen to a dua, or "may Allah make it so"' },
  { kind: 'think', emoji: '💡', label: 'Made me think', description: 'This gave me something to reflect on' },
]

// A random id for this browser so it can react once per reaction and undo it.
// It is never linked to posts, so it doesn't reveal who wrote anything.
const DEVICE_KEY = 'irc-khatm-device-id'
let fallbackId = null

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    // storage unavailable (private mode): reactions still work for this visit
    fallbackId ??= crypto.randomUUID()
    return fallbackId
  }
}
