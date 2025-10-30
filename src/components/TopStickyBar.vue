<template>
  <div class="top-sticky-bar" :class="{ 
    'token-flash': isTokenFlashAnimation, 
    'out-of-tokens': isOutOfTokens 
  }">
    <div class="top-sticky-bar__container">
      <!-- Column 1: Back Button, User Info or Logo -->
      <div class="top-sticky-bar__column top-sticky-bar__logo">
        <div class="logo-column-content">
          <!-- Show back to games button when on game page -->
          <button 
            v-if="isGamePage" 
            @click.stop="handleBackToGames" 
            class="back-to-games-button"
            title="Back to Games"
          >
            <span class="back-icon">←</span>
            <span class="back-text">BACK TO GAMES</span>
          </button>
          
          <!-- Show user info when logged in -->
          <div v-if="isLoggedIn" class="user-info-container">
            <div class="user-avatar">
              <img 
                v-if="userAvatar" 
                :src="userAvatar" 
                :alt="`${userFirstName}'s avatar`" 
                class="avatar-image"
              />
              <div v-else class="avatar-placeholder">
                {{ userFirstName?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
            </div>
            <div class="user-name">
              <span class="user-first-name">{{ userFirstName || 'User' }}</span>
            </div>
          </div>
          
          <!-- Show MIS logo when not logged in -->
          <div v-else class="logo-container">
            <img 
              :src="logoUrl" 
              alt="MIS Club Logo" 
              class="logo-image"
            />
          </div>
        </div>
      </div>
      
      <!-- Column 2: Title -->
      <div class="top-sticky-bar__column top-sticky-bar__title">
        <h1 class="arcade-title-small">
          <span class="title-glow">MIS</span>
          <span class="title-accent">ARCADE</span>
        </h1>
      </div>
      
      <!-- Column 3: Centered Tokens and Tickets -->
      <div class="top-sticky-bar__column top-sticky-bar__tokens">
        <div v-if="isLoggedIn" class="tokens-badge" :class="{ drop: isTokenDropAnimation, 'low-tokens': isLowOnTokens }" title="Available tokens">
          <i class="fas fa-coins token-icon"></i>
          <span class="token-label">TOKENS</span>
          <span class="token-count">
            <i v-if="unlimitedPlay" class="fas fa-infinity infinity-symbol"></i>
            <span v-else>{{ tokens }}</span>
          </span>
        </div>
        <!-- Show tickets counter only when unlimited play is disabled -->
        <div v-if="isLoggedIn && !unlimitedPlay" class="tickets-badge" title="Available tickets">
          <i class="fas fa-ticket tickets-icon"></i>
          <span class="tickets-label">TICKETS</span>
          <span class="tickets-count">{{ tickets }}</span>
        </div>
        <!-- Show unlimited play text when unlimited play is enabled -->
        <div v-if="isLoggedIn && unlimitedPlay" class="tickets-badge" title="Unlimited play enabled">
          <i class="fas fa-infinity tickets-icon"></i>
          <span class="tickets-label">UNLIMITED PLAY</span>
        </div>
      </div>
      
      <!-- Column 4: Logout Button -->
      <div class="top-sticky-bar__column top-sticky-bar__logout">
        <button 
          v-if="isLoggedIn" 
          @click="handleLogout" 
          class="logout-button"
          title="Logout"
        >
          <span class="logout-icon">🚪</span>
          <span class="logout-text">LOGOUT</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PocketBase from 'pocketbase'
import { config } from '../config/env'
import { useSession } from '../composables/useSession'
import { clearAllLocalStorage } from '../utils/storage'
import { useToast } from '../composables/useToast'
import logoUrl from '../assets/MISLogo.png'

const router = useRouter()
const route = useRoute()
// Use centralized clearer instead of per-composable copy
const { warning } = useToast()

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('arcadeUserId')
})

// Check if we're on a game page
const isGamePage = computed(() => {
  return route.path.startsWith('/game/')
})

// Get user data from localStorage
const userFirstName = computed(() => {
  const fullName = localStorage.getItem('arcadeUserName') || ''
  return fullName.split(' ')[0] || ''
})

const userAvatar = computed(() => {
  // Prefer avatarURL over base64 for better performance
  const avatarURL = localStorage.getItem('arcadeUserAvatarURL')
  if (avatarURL) return avatarURL
  
  // Fallback to base64 if URL not available
  return localStorage.getItem('arcadeUserAvatarBase64') || null
})

// TurboWarp namespace remains for tickets/aux data only; tokens are fetched from backend
const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'

function parseNamespaceValue(raw: string | null): { time: number; data: Record<string, string> } {
  const fallback = { time: Math.floor(Date.now() / 1000), data: {} as Record<string, string> }
  if (!raw) return fallback
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && typeof obj.data === 'object' && typeof obj.time === 'number') {
      return { time: obj.time, data: { ...obj.data } }
    }
    return fallback
  } catch {
    return fallback
  }
}

// Tokens are no longer sourced from TurboWarp storage
function readTokensFromStorage(): number { return tokens.value || 0 }

function readTicketsFromStorage(): number {
  // Prefer unified namespace
  const unified = parseNamespaceValue(localStorage.getItem(NAMESPACE_KEY))
  const unifiedTickets = parseInt(unified.data?.tickets ?? '', 10)
  if (!Number.isNaN(unifiedTickets) && unifiedTickets >= 0) return unifiedTickets
  return 0
}

function writeNamespaceFields(fields: Record<string, string>) {
  const obj = parseNamespaceValue(localStorage.getItem(NAMESPACE_KEY))
  obj.data = { ...obj.data, ...fields }
  obj.time = Math.floor(Date.now() / 1000)
  try {
    localStorage.setItem(NAMESPACE_KEY, JSON.stringify(obj))
  } catch {
    // ignore
  }
}

const tokens = ref<number>(0)
const tickets = ref<number>(readTicketsFromStorage())
const unlimitedPlay = ref<boolean>(false)

// Computed property to check if user is low on tokens (1 or 0)
const isLowOnTokens = computed(() => {
  return tokens.value <= 1
})

// Computed property to check if user has any tokens
const hasTokens = computed(() => {
  return tokens.value > 0
})

// Computed property to check if user is completely out of tokens (only when logged in)
const isOutOfTokens = computed(() => {
  return isLoggedIn.value && tokens.value === 0
})

const pb = new PocketBase(config.pocketbaseUrl)
let isUpdatingBackend = false
let lastSentTokens: number | null = null
let pollId: number | null = null
const isTokenDropAnimation = ref(false)
let tokenDropAnimationTimeout: number | null = null
const isTokenFlashAnimation = ref(false)
let tokenFlashAnimationTimeout: number | null = null
let lastLoginTime = 0 // Track when user last logged in to prevent race conditions

// Throttle backend updates to at most once per 10s, while debouncing rapid changes
const BACKEND_UPDATE_WINDOW_MS = 10000
let backendUpdateTimeout: number | null = null
let backendUpdateLastAt = 0
let pendingTokensToSend: number | null = null
let tokensUpdatedHandler: ((e: Event) => void) | null = null
let ticketsUpdatedHandler: ((e: Event) => void) | null = null

// Handle login events to fetch fresh tokens/tickets from backend
const handleLoginEvent = async () => {
  lastLoginTime = Date.now()
  
  // Small delay to ensure localStorage is updated by Login component first
  setTimeout(async () => {
    // Always fetch fresh token and tickets count from database
    try {
      const userId = localStorage.getItem('arcadeUserId')
      if (userId) {
        if (userId.startsWith('guest-')) {
          unlimitedPlay.value = true
          tokens.value = 0
          tickets.value = 0
        } else {
          const userData = await pb.collection('mis_users').getOne(userId, {
            '$autoCancel': false,
            'cache': 'no-store'
          })
          const freshTokens = userData.tokens ?? 0
          const freshTickets = userData.tickets ?? 0
          const freshUnlimitedPlay = !!(userData as any)?.unlimitedPlay
          tokens.value = Number(freshTokens) || 0
          tickets.value = Number(freshTickets) || 0
          unlimitedPlay.value = freshUnlimitedPlay
        }
      }
    } catch (error) {
      // Failed to fetch fresh user data on login
    }
  }, 100) // Small delay to ensure localStorage is updated first
}

function triggerTokenDropAnimation() {
  if (tokenDropAnimationTimeout) {
    clearTimeout(tokenDropAnimationTimeout)
    tokenDropAnimationTimeout = null
  }
  isTokenDropAnimation.value = true
  tokenDropAnimationTimeout = window.setTimeout(() => {
    isTokenDropAnimation.value = false
    tokenDropAnimationTimeout = null
  }, 900)
}

function triggerTokenFlashAnimation() {
  if (tokenFlashAnimationTimeout) {
    clearTimeout(tokenFlashAnimationTimeout)
    tokenFlashAnimationTimeout = null
  }
  isTokenFlashAnimation.value = true
  tokenFlashAnimationTimeout = window.setTimeout(() => {
    isTokenFlashAnimation.value = false
    tokenFlashAnimationTimeout = null
  }, 500)
}

function applyExternalTokenUpdate(nextTokens: number) {
  const previous = tokens.value
  tokens.value = nextTokens
  if (nextTokens < previous) {
    triggerTokenDropAnimation()
    triggerTokenFlashAnimation()
    
    // Show warning toast if user has less than 10 tokens left
    if (nextTokens < 10 && nextTokens > 0) {
      warning(`⚠️ Low tokens warning: You have ${nextTokens} tokens remaining!`, {
        timeout: 3000,
        position: 'top-center'
      })
    }
  }
}

// Safely sync backend: only update if the new value is LOWER than server's current value
async function syncBackendTokensIfLower(nextTokens: number) {
  if (!isLoggedIn.value) return
  if (nextTokens < 0) return
  const userId = localStorage.getItem('arcadeUserId')
  if (!userId) return
  try {
    const fresh = await pb.collection('mis_users').getOne(userId)
    const raw = (fresh as any)?.tokens
    const serverTokens = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10)
    if (!Number.isFinite(serverTokens)) return
    if (nextTokens < serverTokens) {
      await pb.collection('mis_users').update(userId, { tokens: nextTokens })
      lastSentTokens = nextTokens
    }
  } catch {
    // ignore; UI remains responsive
  }
}

async function performBackendTokensUpdate(nextTokens: number) {
  if (!isLoggedIn.value) return
  if (nextTokens < 0) return
  if (lastSentTokens === nextTokens) return
  if (isUpdatingBackend) return

  // Prevent updating backend immediately after login to avoid race conditions
  const timeSinceLogin = Date.now() - lastLoginTime
  if (timeSinceLogin < 2000) {
    return
  }

  const userId = localStorage.getItem('arcadeUserId')
  if (!userId) return
  try {
    isUpdatingBackend = true
    await pb.collection('mis_users').update(userId, { tokens: nextTokens })
    lastSentTokens = nextTokens
  } catch {
    // ignore errors for now; UI remains responsive
  } finally {
    isUpdatingBackend = false
  }
}

function updateBackendTokens(nextTokens: number) {
  if (!isLoggedIn.value) return
  if (nextTokens < 0) return

  // Coalesce rapid changes; only the latest value is sent
  pendingTokensToSend = nextTokens

  const now = Date.now()
  const elapsed = now - backendUpdateLastAt
  const delay = Math.max(0, BACKEND_UPDATE_WINDOW_MS - elapsed)

  // If an update is already scheduled, let it send the latest pending value
  if (backendUpdateTimeout != null) return

  backendUpdateTimeout = window.setTimeout(async () => {
    const toSend = pendingTokensToSend
    backendUpdateTimeout = null
    if (toSend == null) return
    await performBackendTokensUpdate(toSend)
    backendUpdateLastAt = Date.now()
  }, delay)
}

function handleStorage(e: StorageEvent) {
  if (!e.key) return
  if (e.key === NAMESPACE_KEY) {
    const obj = parseNamespaceValue(e.newValue ?? null)
    const nextTickets = parseInt(obj.data?.tickets ?? '', 10)
    
    if (!Number.isNaN(nextTickets) && nextTickets >= 0 && nextTickets !== tickets.value) {
      tickets.value = nextTickets
    }
    return
  }
}

onMounted(() => {
  // Initialize tickets from storage; tokens will be fetched on login or remain 0 if logged out
  tickets.value = readTicketsFromStorage()
  
  // If user is logged in but tokens are 0, try to fetch fresh data
  if (isLoggedIn.value && tokens.value === 0) {
    // Use a small delay to ensure the component is fully mounted
    setTimeout(() => {
      handleLoginEvent()
    }, 200)
  }
  
  window.addEventListener('storage', handleStorage)
  
  // Listen for login events to track when user logs in
  window.addEventListener('user-login', handleLoginEvent)
  
  // Immediate tokens UI sync when diminish endpoint returns remaining_tokens
  tokensUpdatedHandler = (e: Event) => {
    const detail = (e as CustomEvent).detail as any
    const remaining = Number(detail?.remaining_tokens)
    if (Number.isFinite(remaining)) {
      applyExternalTokenUpdate(remaining)
    }
  }
  window.addEventListener('tokens-updated', tokensUpdatedHandler)
  
  // Immediate tickets UI sync when tickets are awarded in-game
  ticketsUpdatedHandler = (e: Event) => {
    const detail = (e as CustomEvent).detail as any
    const total = Number(detail?.total_tickets)
    if (Number.isFinite(total)) {
      tickets.value = total
    }
  }
  window.addEventListener('tickets-updated', ticketsUpdatedHandler)
  
  // Periodically refresh tokens from backend when logged in
  pollId = window.setInterval(async () => {
    try {
      if (!isLoggedIn.value) return
      const userId = localStorage.getItem('arcadeUserId')
      if (!userId) return
      
      if (userId.startsWith('guest-')) {
        unlimitedPlay.value = true
        tokens.value = 0
        tickets.value = 0
        return
      }
      
      const fresh = await pb.collection('mis_users').getOne(userId, { '$autoCancel': false, cache: 'no-store' })
      const rawT = (fresh as any)?.tokens
      const rawP = (fresh as any)?.tickets
      const rawUP = (fresh as any)?.unlimitedPlay
      const nextTokens = typeof rawT === 'number' ? rawT : parseInt(String(rawT ?? ''), 10)
      const nextTickets = typeof rawP === 'number' ? rawP : parseInt(String(rawP ?? ''), 10)
      const nextUnlimitedPlay = !!rawUP
      if (Number.isFinite(nextTokens) && nextTokens !== tokens.value) {
        applyExternalTokenUpdate(nextTokens)
      }
      if (Number.isFinite(nextTickets) && nextTickets !== tickets.value) {
        tickets.value = nextTickets
      }
      if (nextUnlimitedPlay !== unlimitedPlay.value) {
        unlimitedPlay.value = nextUnlimitedPlay
      }
    } catch {}
  }, 20000)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage)
  window.removeEventListener('user-login', handleLoginEvent)
  if (tokensUpdatedHandler) {
    window.removeEventListener('tokens-updated', tokensUpdatedHandler)
    tokensUpdatedHandler = null
  }
  if (ticketsUpdatedHandler) {
    window.removeEventListener('tickets-updated', ticketsUpdatedHandler)
    ticketsUpdatedHandler = null
  }
  if (pollId) {
    clearInterval(pollId)
    pollId = null
  }
  if (tokenDropAnimationTimeout) {
    clearTimeout(tokenDropAnimationTimeout)
    tokenDropAnimationTimeout = null
  }
  if (tokenFlashAnimationTimeout) {
    clearTimeout(tokenFlashAnimationTimeout)
    tokenFlashAnimationTimeout = null
  }
  if (backendUpdateTimeout) {
    clearTimeout(backendUpdateTimeout)
    backendUpdateTimeout = null
  }
})

// Back to games function
function handleBackToGames() {
  router.push('/games')
}

// Logout function
function handleLogout() {
  // Dispatch logout event for session tracking
  window.dispatchEvent(new CustomEvent('user-logout'))
  
  // Clear all localStorage items using the comprehensive function
  clearAllLocalStorage()
  
  // Redirect to login page
  router.push('/login')
}
</script>

<style scoped>
/* 4-column top bar layout */
.top-sticky-bar { 
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  z-index: 1001; 
  background: var(--panel-bg); 
  border-bottom: 2px solid var(--panel-border); 
  box-shadow: 0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1); 
  transition: all 0.3s ease;
}

/* Yellow flash animation when tokens diminish */
.top-sticky-bar.token-flash {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-bottom-color: #ffd700;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.6);
  animation: tokenFlashPulse 0.5s ease-out;
  will-change: transform, background-color, box-shadow;
  transform: translateZ(0);
}

/* Dark red color when out of tokens */
.top-sticky-bar.out-of-tokens {
  background: linear-gradient(135deg, #8b0000, #660000);
  border-bottom-color: #8b0000;
  box-shadow: 0 4px 20px rgba(139, 0, 0, 0.6);
}

@keyframes tokenFlashPulse {
  0% { 
    background: #ffd700;
    border-bottom-color: #ffd700;
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.8);
    transform: translateZ(0) scale(1.02);
  }
  50% {
    background: #ffed4e;
    border-bottom-color: #ffed4e;
    box-shadow: 0 6px 25px rgba(255, 215, 0, 0.9);
    transform: translateZ(0) scale(1.03);
  }
  100% { 
    background: var(--panel-bg);
    border-bottom-color: var(--panel-border);
    box-shadow: 0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1);
    transform: translateZ(0) scale(1);
  }
}

.top-sticky-bar__container { 
  display: grid; 
  grid-template-columns: max-content 1fr auto auto; 
  align-items: center; 
  margin: 0; 
  padding: 8px 24px; 
  min-height: 45px; 
  gap: 20px; 
}

.top-sticky-bar__column { 
  display: flex; 
  align-items: center; 
}

.top-sticky-bar__logo { 
  justify-content: flex-start; 
}

.logo-column-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  overflow: visible;
}

.top-sticky-bar__title { 
  justify-content: flex-start; 
}

.top-sticky-bar__tokens { 
  justify-content: center; 
}

.top-sticky-bar__logout { 
  justify-content: flex-end; 
}

.logo-image { 
  height: 40px; 
  width: auto; 
  object-fit: contain; 
  filter: drop-shadow(0 0 8px rgba(0,255,255,.3)); 
}

/* User Info Styles */
.user-info-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--panel-bg);
  border: 2px solid var(--panel-border);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  flex-shrink: 0;
  min-width: 0;
}

.user-info-container:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 6px 20px rgba(0, 255, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--neon-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--dark-bg);
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.user-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-first-name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--neon-green);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px var(--neon-green);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.arcade-title-small { 
  font-family: 'Orbitron', monospace; 
  font-size: 1.5rem; 
  font-weight: 900; 
  text-transform: uppercase; 
  letter-spacing: .1em; 
  margin: 0; 
  line-height: 1; 
  display: flex; 
  align-items: baseline; 
  gap: 8px; 
}

.title-glow { 
  color: var(--neon-cyan); 
  text-shadow: 0 0 8px var(--neon-cyan), 0 0 16px var(--neon-cyan), 0 0 24px var(--neon-cyan); 
}

.title-accent { 
  color: var(--neon-pink); 
  text-shadow: 0 0 8px var(--neon-pink), 0 0 16px var(--neon-pink), 0 0 24px var(--neon-pink); 
}

/* Tokens badge */
.tokens-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid var(--neon-cyan);
  border-radius: 999px;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transform: scale(1.05);
}

.token-icon { 
  font-size: 1.2rem;
  color: #ffd700;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
}

.token-label {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: var(--neon-green);
  text-shadow: 0 0 12px var(--neon-green);
}

.token-count {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--text-primary);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  min-width: 2ch;
  text-align: center;
}

.infinity-symbol {
  font-size: 1.4rem;
  color: var(--neon-green);
  text-shadow: 0 0 12px var(--neon-green);
  filter: drop-shadow(0 0 6px rgba(0, 255, 0, 0.6));
}

/* Tickets badge */
.tickets-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 165, 0, 0.1);
  border: 2px solid var(--neon-pink);
  border-radius: 999px;
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.3);
  transform: scale(1.05);
  margin-left: 12px;
}


.tickets-icon { 
  font-size: 1.2rem;
  color: #ffd700;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
}

.tickets-label {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: var(--neon-pink);
  text-shadow: 0 0 12px var(--neon-pink);
}

.tickets-count {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--text-primary);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  min-width: 2ch;
  text-align: center;
}


/* Token drop animation */
.tokens-badge.drop {
  animation: tokenDropPulse 0.9s ease both;
  will-change: transform, box-shadow, border-color;
  transform: translateZ(0);
}

@keyframes tokenDropPulse {
  0% { 
    transform: translate3d(0, 0, 0) scale(1.15); 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
    border-color: var(--neon-cyan);
  }
  20% { 
    transform: translate3d(0, -10px, 0) scale(1.25); 
    box-shadow: 0 0 30px rgba(255, 68, 68, 0.8);
    border-color: #ff4444;
  }
  40% { 
    transform: translate3d(0, 5px, 0) scale(1.2); 
    box-shadow: 0 0 25px rgba(255, 68, 68, 0.6);
    border-color: #ff6666;
  }
  60% { 
    transform: translate3d(0, -3px, 0) scale(1.18); 
    box-shadow: 0 0 22px rgba(255, 68, 68, 0.5);
    border-color: #ff8888;
  }
  80% { 
    transform: translate3d(0, 1px, 0) scale(1.16); 
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);
    border-color: #ffaaaa;
  }
  100% { 
    transform: translate3d(0, 0, 0) scale(1.15); 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
    border-color: var(--neon-cyan);
  }
}

/* Low tokens warning animation */
.tokens-badge.low-tokens {
  animation: lowTokensFlash 2s ease-in-out infinite;
  border-color: var(--neon-red);
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
}

@keyframes lowTokensFlash {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.6);
  }
  50% { 
    box-shadow: 0 0 30px rgba(255, 68, 68, 0.8);
  }
}

/* Back to Games Button Styles */
.back-to-games-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--neon-cyan);
  border: 2px solid var(--neon-cyan);
  border-radius: 8px;
  color: var(--dark-bg);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.back-to-games-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 255, 255, 0.5);
  background: #00e6e6;
}

.back-to-games-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 255, 255, 0.4);
}

.back-icon {
  font-size: 1.2rem;
  font-weight: 900;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
}

.back-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Logout Button Styles */
.logout-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--neon-red);
  border: 2px solid var(--neon-red);
  border-radius: 8px;
  color: var(--dark-bg);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
}

.logout-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 68, 68, 0.5);
  background: #ff3333;
}

.logout-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 68, 68, 0.4);
}

.logout-icon {
  font-size: 1rem;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
}

.logout-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) { 
  .top-sticky-bar__container { 
    padding: 6px 16px; 
    min-height: 40px; 
    gap: 12px; 
    grid-template-columns: max-content 1fr auto; 
  } 
  
  .top-sticky-bar__tokens {
    display: none;
  }
  
  .logo-image { 
    height: 28px; 
  } 
  
  .arcade-title-small { 
    font-size: 1.1rem; 
  }
  
  .back-to-games-button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .back-text {
    display: none;
  }
  
  .logout-button {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .logout-text {
    display: none;
  }
  
  .logo-column-content {
    gap: 8px;
  }
  
  .user-info-container {
    gap: 6px;
    padding: 4px 8px;
  }
  
  .user-avatar {
    width: 24px;
    height: 24px;
  }
  
  .user-first-name {
    font-size: 0.8rem;
    max-width: 80px;
  }
}

@media (max-width: 480px) { 
  .top-sticky-bar__container { 
    padding: 4px 12px; 
    min-height: 35px; 
    gap: 8px;
  } 
  
  .logo-image { 
    height: 24px; 
  } 
  
  .arcade-title-small { 
    font-size: 1rem; 
  }
  
  .back-to-games-button {
    padding: 4px 8px;
    font-size: 0.75rem;
  }
  
  .logout-button {
    padding: 4px 8px;
    font-size: 0.75rem;
  }
  
  .logo-column-content {
    gap: 6px;
  }
  
  .user-info-container {
    gap: 4px;
    padding: 2px 6px;
  }
  
  .user-avatar {
    width: 20px;
    height: 20px;
  }
  
  .user-first-name {
    font-size: 0.7rem;
    max-width: 60px;
  }
}
</style>


