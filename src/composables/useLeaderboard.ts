import { ref, computed, type Ref, watch, onBeforeUnmount } from 'vue'
import PocketBase from 'pocketbase'
import { config } from '@/config/env'

export interface LeaderboardUserInfo {
  userId: string
  firstName: string
  lastName: string
  displayName: string
  avatarUrl?: string
  avatarBase64?: string
}

export interface LeaderboardEntry {
  rank: number
  score: number
  user: LeaderboardUserInfo
}

interface CacheRecord {
  id: string
  gamekey?: string
  high_scores?: Array<{ score: number; user: string }>
  updated?: string
}

export function useLeaderboard(gameKey: Ref<string>) {
  if (!config.pocketbaseUrl) {
    console.error('[useLeaderboard] PocketBase URL not configured')
  }
  const pb = new PocketBase(config.pocketbaseUrl)

  const isLoading = ref(false)
  const hasLoaded = ref(false)
  const error = ref<string | null>(null)
  const entries = ref<LeaderboardEntry[]>([])
  let lastLoadedKey = ''
  let requestSeq = 0
  let activeRequestId = 0

  let abort = false
  onBeforeUnmount(() => { abort = true })

  async function load() {
    const key = String(gameKey.value || '').trim()
    if (!key) {
      entries.value = []
      return
    }
    if (hasLoaded.value && lastLoadedKey === key) return
    const myId = ++requestSeq
    activeRequestId = myId
    isLoading.value = true
    error.value = null
    
    const timeoutId = setTimeout(() => {
      if (activeRequestId === myId && isLoading.value) {
        isLoading.value = false
        error.value = 'Request timeout - please check your connection'
        console.error('[useLeaderboard] Request timeout')
      }
    }, 15000)
    
    try {
      if (!config.pocketbaseUrl) {
        throw new Error('PocketBase URL not configured')
      }

      console.log('[useLeaderboard] Loading leaderboard for game:', key)
      
      const list = await pb.collection('cache').getList<CacheRecord>(1, 1, {
        filter: `gamekey="${key}"`,
        sort: '-updated',
        '$autoCancel': false,
        cache: 'no-store'
      })
      
      console.log('[useLeaderboard] Cache query result:', list)

      if (myId !== activeRequestId || key !== String(gameKey.value || '').trim()) return

      const rec = list?.items?.[0]
      const rawScores = Array.isArray((rec as any)?.high_scores) ? (rec as any).high_scores as Array<{ score: number; user: string }> : []
      
      console.log('[useLeaderboard] Raw scores found:', rawScores.length)

      if (rawScores.length === 0) {
        console.log('[useLeaderboard] No scores found, setting empty leaderboard')
        if (myId === activeRequestId) {
          entries.value = []
          hasLoaded.value = true
          lastLoadedKey = key
        }
        return
      }

      const bestByUser = new Map<string, number>()
      for (const item of rawScores) {
        const uid = String(item?.user || '')
        const sc = Number(item?.score)
        if (!uid || !Number.isFinite(sc)) continue
        const prev = bestByUser.get(uid)
        if (prev == null || sc > prev) bestByUser.set(uid, sc)
      }

      const topUsers = Array.from(bestByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const userIds = topUsers.map(([uid]) => uid)
      let userMap = new Map<string, any>()
      
      console.log('[useLeaderboard] Fetching user data for:', userIds.length, 'users')
      
      try {
        const userList = await pb.collection('mis_users').getList<any>(1, 50, {
          filter: userIds.map(id => `id="${id}"`).join(' || '),
          '$autoCancel': false,
          cache: 'no-store'
        })
        
        console.log('[useLeaderboard] User fetch result:', userList.items.length, 'users found')
        
        userList.items.forEach(user => {
          userMap.set(user.id, user)
        })
      } catch (err) {
        console.warn('[useLeaderboard] Failed to batch fetch users:', err)
      }

      if (myId !== activeRequestId || key !== String(gameKey.value || '').trim()) return

      const resolved = topUsers.map(([uid, sc]) => {
        const u = userMap.get(uid)
        if (u) {
          const firstName: string = String(u?.firstName || '').trim()
          const lastName: string = String(u?.lastName || '').trim()
          const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Player'
          const avatarUrl: string | undefined = u?.avatar ? pb.files.getURL(u, u.avatar) : undefined
          const avatarBase64: string | undefined = u?.avatarbase64 || undefined
          const info: LeaderboardUserInfo = { userId: uid, firstName, lastName, displayName, avatarUrl, avatarBase64 }
          return { score: sc, user: info }
        } else {
          const info: LeaderboardUserInfo = { userId: uid, firstName: 'Player', lastName: '', displayName: 'Player' }
          return { score: sc, user: info }
        }
      })
      if (abort) return

      entries.value = resolved.map((r, i) => ({ rank: i + 1, score: r.score, user: r.user }))
      console.log('[useLeaderboard] Final entries:', entries.value.length)
      hasLoaded.value = true
      lastLoadedKey = key
    } catch (e: any) {
      if (abort) return
      console.error('[useLeaderboard] Error loading leaderboard:', e)
      if (myId === activeRequestId) {
        error.value = e?.message || 'Failed to load leaderboard'
      }
    } finally {
      clearTimeout(timeoutId)
      if (myId === activeRequestId) {
        isLoading.value = false
      }
    }
  }

  async function refresh() {
    hasLoaded.value = false
    entries.value = []
    await load()
  }

  const isEmpty = computed(() => hasLoaded.value && !isLoading.value && entries.value.length === 0 && !error.value)

  watch(gameKey, () => { hasLoaded.value = false; entries.value = []; void load() }, { flush: 'sync', immediate: true })

  return { entries, isLoading, isEmpty, error, load, refresh, hasLoaded }
}


