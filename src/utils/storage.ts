// Centralized storage utilities

// Unified TurboWarp namespace key used across the app
export const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'

// Known localStorage keys we might set
const KNOWN_KEYS = [
  'arcadeUserId',
  'arcadeUserName',
  'arcadeUserAvatarBase64',
  'arcadeUserAvatarURL',
  'pb_auth', // PocketBase auth store default key
  NAMESPACE_KEY,
]

export function clearAllLocalStorage(): void {
  try {
    // Clear origin storage for all keys
    localStorage.clear()
  } catch {
    // Fallback: best-effort remove known keys
    for (const key of KNOWN_KEYS) {
      try { localStorage.removeItem(key) } catch { /* noop */ }
    }
  }

  // Also clear sessionStorage if available (defensive; not strictly needed)
  try { sessionStorage.clear() } catch { /* noop */ }

  // As a belt-and-suspenders approach, remove known keys explicitly
  for (const key of KNOWN_KEYS) {
    try { localStorage.removeItem(key) } catch { /* noop */ }
  }

  // Log once for diagnostics
  try { console.log('[Storage] Cleared all storage for origin') } catch { /* noop */ }
}


