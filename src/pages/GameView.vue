<script setup lang="ts">
import TopStickyBar from '@/components/TopStickyBar.vue'
import GameTopBar from '@/components/GameTopBar.vue'
import CodeGalleryModal from '@/components/CodeGalleryModal.vue'
import LinkModal from '@/components/LinkModal.vue'
import HowToPlayModal from '@/components/HowToPlayModal.vue'
import TicketWonToast from '@/components/TicketWonToast.vue'
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import PocketBase from 'pocketbase'
import { config } from '@/config/env'
import { useToast } from '@/composables/useToast'
import { useRoute, useRouter } from 'vue-router'
import { useModal } from '@/composables/useModal'
import { playTicketWonSound } from '@/utils/audio'
import LeaderboardCard from '@/components/LeaderboardCard.vue'

const route = useRoute()
const router = useRouter()
const base = route.params.gamefile as string
const baseUrl = import.meta.env.BASE_URL

interface Developer { name: string; url?: string }
interface License { text: string; url?: string }
interface StageSize { width: number; height: number }
interface Manifest {
  gameName: string
  description: string
  developer: Developer
  license: License
  codeGalleryImages: string[]
  musicCredits: string
  assetsCredits: string
  misArcadeRemixer: string
  stageSize?: StageSize
  howToPlayImage?: string
}

const manifest = ref<Manifest | null>(null)
const isCodeGalleryOpen = ref(false)
const isHowToPlayOpen = ref(false)
const isIframeLoaded = ref(false)
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isGamePaused = ref(false)
const isProcessingTokenCheck = ref(false)
const unlimitedPlay = ref(false)
const isIngame = ref(false)

const lastObservedScore = ref<number | null>(null)
const isSubmittingScore = ref(false)
const isProcessingTicketsUpdate = ref(false)
const hasActiveRun = ref(false)
const maxScoreThisRun = ref<number | null>(null)

// TurboWarp unified LocalStorage namespace
const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'
const pb = new PocketBase(config.pocketbaseUrl)
const { info, warning, success, toast } = useToast()

function parseNamespaceValue(raw: string | null): any {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function readNamespace(): any {
  return parseNamespaceValue(localStorage.getItem(NAMESPACE_KEY))
}

function writeNamespace(mutator: (obj: any) => void) {
  const nowSec = Math.floor(Date.now() / 1000)
  const obj = readNamespace()
  if (!obj || typeof obj !== 'object') return
  if (typeof obj.data !== 'object' || obj.data == null) obj.data = {}
  mutator(obj)
  obj.time = nowSec
  try { localStorage.setItem(NAMESPACE_KEY, JSON.stringify(obj)) } catch {}
}

function getTokens(): number {
  const obj = readNamespace()
  const t = parseInt(obj?.data?.tokens ?? '', 10)
  return Number.isNaN(t) || t < 0 ? 0 : t
}

function setTokens(next: number) {
  writeNamespace((obj) => { obj.data.tokens = String(Math.max(0, next)) })
}

function getTokenStatus(): string | undefined {
  const obj = readNamespace()
  const status = obj?.data?.tokenstatus
  return typeof status === 'string' ? status : undefined
}

function setTokenStatus(status: string) {
  writeNamespace((obj) => { obj.data.tokenstatus = status })
}

function getIngameStatus(): number {
  const obj = readNamespace()
  const ingame = parseInt(obj?.data?.ingame ?? '', 10)
  return Number.isNaN(ingame) ? 0 : ingame
}

function getTicketsUpdateFlag(): number {
  const obj = readNamespace()
  const flag = parseInt(obj?.data?.ticketsUpdate ?? '', 10)
  return Number.isNaN(flag) ? 0 : flag
}

function getTicketsWonAmount(): number {
  const obj = readNamespace()
  const won = parseInt(obj?.data?.ticketsWon ?? '', 10)
  return Number.isNaN(won) || won < 0 ? 0 : won * 2
}

function setTicketsUpdateFlag(value: number) {
  writeNamespace((obj) => { obj.data.ticketsUpdate = String(value) })
}

function setNamespaceTickets(nextTotal: number) {
  writeNamespace((obj) => { obj.data.tickets = String(Math.max(0, nextTotal)) })
}

function pauseGame() {
  if (isGamePaused.value) return
  isGamePaused.value = true
}

function resumeGame() {
  if (!isGamePaused.value) return
  isGamePaused.value = false
}

async function fetchUnlimitedPlayFlag() {
  try {
    const userId = localStorage.getItem('arcadeUserId')
    if (!userId) return
    
    if (userId.startsWith('guest-')) {
      unlimitedPlay.value = true
      return
    }
    
    const user = await pb.collection('mis_users').getOne(userId)
    unlimitedPlay.value = !!(user as any)?.unlimitedPlay
  } catch {
    // ignore; default false
  }
}

async function handleTokenStatusCheck() {
  if (isProcessingTokenCheck.value) return
  const status = getTokenStatus()
  if (status !== 'check') return

  isProcessingTokenCheck.value = true

  try {
    let shouldCallDeduct = false
    const userId = localStorage.getItem('arcadeUserId')

    if (!userId) {
      // Not logged in: do nothing token-wise (no TurboWarp tokens)
      warning('You are not logged in; play allowed without prize tickets.', { timeout: 3000, position: 'top-center' })
    } else if (userId.startsWith('guest-')) {
      unlimitedPlay.value = true
      info('Guest mode: unlimited play enabled. You will not earn tickets, but can play freely.', { timeout: 3000, position: 'top-center' })
    } else {
      try {
        const user = await pb.collection('mis_users').getOne(userId, { '$autoCancel': false, 'cache': 'no-store' })
        const userUnlimited = !!(user as any)?.unlimitedPlay
        const userTokens = Number((user as any)?.tokens ?? 0)
        unlimitedPlay.value = userUnlimited

        if (userUnlimited) {
          info('Unlimited play: you will not earn tickets, but can play freely.', { timeout: 2500, position: 'top-center' })
        } else if (!Number.isFinite(userTokens) || userTokens <= 0) {
          warning("You're out of tokens: play allowed, but no prize tickets. High scores still count!", { timeout: 3500, position: 'top-center' })
        } else {
          shouldCallDeduct = true
        }
      } catch (err) {
        console.error('[GameView] Failed to fetch user for token check:', err)
        warning('Token verification failed; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
      }

      if (shouldCallDeduct) {
        if (!config.pocketbaseUrl) {
          console.warn('[GameView] PocketBase URL not configured, skipping token deduction')
          warning('Guest mode: no backend configuration. Play allowed without prize tickets.', { timeout: 3000, position: 'top-center' })
        } else {
          try {
            const clientTokenToSend = String(config.deductClientToken || '')
            const url = `${config.pocketbaseUrl}/deduct-token?userId=${encodeURIComponent(userId)}&clientToken=${encodeURIComponent(clientTokenToSend)}`
            console.log('[GameView] Calling deduct-token API:', { url, userId, isDev: config.isDev })

            const res = await fetch(url, { method: 'GET', cache: 'no-store' as RequestCache })
            console.log('[GameView] Deduct API response:', res.status, res.statusText)

            if (!res.ok) {
              try { console.log('[GameView] API error response:', await res.text()) } catch {}

              if (res.status === 400) {
                warning("You're out of tokens: play allowed, but no prize tickets. High scores still count!", { timeout: 3500, position: 'top-center' })
              } else if (res.status === 401) {
                warning('Token auth failed; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
              } else if (res.status === 404) {
                warning('User not found; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
              } else if (res.status === 500) {
                warning('Server error during token verification; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
              } else {
                warning('Token verification failed; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
              }
            } else {
              const payload = await res.json().catch(() => null)
              console.log('[GameView] Deduct API success payload:', payload)

              const remaining = Number(payload?.newTokens)
              if (Number.isFinite(remaining)) {
                console.log('[GameView] Dispatching tokens-updated event with remaining:', remaining)
                window.dispatchEvent(new CustomEvent('tokens-updated', { detail: { remaining_tokens: remaining } }))
              } else {
                console.log('[GameView] No valid newTokens found in payload')
              }
            }
          } catch (error) {
            // Network or server error: allow play without prize tickets
            console.error('[GameView] Deduct API error:', error)
            warning('Token verification failed; allowing play without prize tickets.', { timeout: 3000, position: 'top-center' })
          }
        }
      }
    }

    // Acknowledge to the game and resume
    setTokenStatus('ok')
  } finally {
    // Small microtask delay to ensure storage event flush
    setTimeout(() => { isProcessingTokenCheck.value = false }, 0)
  }
}

function handleStorage(e: StorageEvent) {
  if (e.key !== NAMESPACE_KEY) return
  try { handleTokenStatusCheck() } catch { /* noop */ }
  try { handleScoreChange() } catch { /* noop */ }
  try { handleIngameChange() } catch { /* noop */ }
  try { handleTicketsUpdate() } catch { /* noop */ }
}

function getScoreFromNamespace(): number | null {
  const obj = readNamespace()
  const raw = obj?.data?.score
  const num = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  return Number.isFinite(num) ? (num as number) : null
}

async function submitScore(scoreValue: number) {
  if (isSubmittingScore.value) return
  const userId = localStorage.getItem('arcadeUserId')
  if (!userId) return
  const gameKey = manifest.value?.gameName || base
  const ticketsEarned = getTicketsWonAmount()
  try {
    isSubmittingScore.value = true
    await pb.collection('scores').create({ 
      user: userId, 
      gamekey: gameKey, 
      score: scoreValue,
      tickets_earned: ticketsEarned
    }, { '$autoCancel': false, 'cache': 'no-store' })
  } catch (err) {
    console.error('[GameView] Failed to submit score:', err)
  } finally {
    isSubmittingScore.value = false
  }
}

function handleScoreChange() {
  const current = getScoreFromNamespace()
  if (current == null) return
  if (lastObservedScore.value == null) {
    lastObservedScore.value = current
    // If a run is active, seed max score for this run
    if (hasActiveRun.value) {
      maxScoreThisRun.value = typeof current === 'number' ? current : 0
    }
    return
  }
  if (current !== lastObservedScore.value) {
    lastObservedScore.value = current
    // During an active run, track the highest score seen; do not submit here
    if (hasActiveRun.value) {
      const prevMax = typeof maxScoreThisRun.value === 'number' ? maxScoreThisRun.value : Number.NEGATIVE_INFINITY
      if (typeof current === 'number' && current > prevMax) {
        maxScoreThisRun.value = current
      }
    }
  }
}

function handleIngameChange() {
  const ingameStatus = getIngameStatus()
  const wasIngame = isIngame.value
  isIngame.value = ingameStatus === 1

  // When a new run starts, mark active and seed max score from current value
  if (!wasIngame && isIngame.value) {
    hasActiveRun.value = true
    const current = getScoreFromNamespace()
    maxScoreThisRun.value = typeof current === 'number' ? current : 0
    if (iframeRef.value) {
      scrollToGameIframe()
    }
    return
  }

  if (wasIngame && !isIngame.value) {
    const finalScore = getScoreFromNamespace()
    const best = Math.max(
      typeof maxScoreThisRun.value === 'number' ? maxScoreThisRun.value : 0,
      typeof finalScore === 'number' ? finalScore : 0
    )
    if (Number.isFinite(best) && best > 0) {
      void submitScore(best)
    }
    hasActiveRun.value = false
    maxScoreThisRun.value = null
    return
  }
}

function scrollToGameIframe() {
  if (!iframeRef.value) return
  
  iframeRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  })
}

async function handleTicketsUpdate() {
  if (isProcessingTicketsUpdate.value) return
  const flag = getTicketsUpdateFlag()
  if (flag !== 1) return

  isProcessingTicketsUpdate.value = true
  try {
    // Immediately acknowledge to the game
    setTicketsUpdateFlag(0)

    // Do not award tickets in unlimited play mode
    if (unlimitedPlay.value) return

    const userId = localStorage.getItem('arcadeUserId')
    if (!userId) return

    const won = getTicketsWonAmount()
    if (!Number.isFinite(won) || won <= 0) return

    // Fetch, increment, persist, then sync UI
    const user = await pb.collection('mis_users').getOne(userId, { '$autoCancel': false, cache: 'no-store' })
    const currentTicketsRaw = (user as any)?.tickets
    const currentTickets = typeof currentTicketsRaw === 'number' ? currentTicketsRaw : parseInt(String(currentTicketsRaw ?? ''), 10)
    const safeCurrent = Number.isFinite(currentTickets) && currentTickets >= 0 ? currentTickets : 0
    const nextTotal = safeCurrent + won

    await pb.collection('mis_users').update(userId, { tickets: nextTotal })

    // Show success toast and play sound for ticket award
    toast({
      component: TicketWonToast,
      props: {
        ticketAmount: won,
        totalTickets: nextTotal
      }
    }, {
      timeout: 5000,
      position: 'top-center' as any,
      icon: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false
    })
    playTicketWonSound()

    setNamespaceTickets(nextTotal)
    try { window.dispatchEvent(new CustomEvent('tickets-updated', { detail: { total_tickets: nextTotal } })) } catch {}

    setTicketsUpdateFlag(0)
  } catch (err) {
    console.error('[GameView] Failed to process tickets update:', err)
    setTicketsUpdateFlag(0)
  } finally {
    isProcessingTicketsUpdate.value = false
  }
}

const { isVisible: isLinkModalVisible, modalData, openLinkModal, closeModal } = useModal()

const isGuestMode = computed(() => {
  const userId = localStorage.getItem('arcadeUserId')
  return userId ? userId.startsWith('guest-') : false
})

const aspectRatio = computed(() => {
  if (!manifest.value?.stageSize) return '16/9' // fallback to 16:9
  const { width, height } = manifest.value.stageSize
  return `${width}/${height}`
})

const availableHeight = computed(() => {
  const topBarHeight = windowWidth.value <= 480 ? 45 : windowWidth.value <= 768 ? 54 : 63
  return Math.max(240, windowHeight.value - topBarHeight - 32)
})

// Layout width helpers here
const contentWidth = computed(() => windowWidth.value - 16)
const isStacked = computed(() => windowWidth.value <= 900)
const leftPaneMaxWidth = computed(() => {
  if (isStacked.value) return contentWidth.value
  return Math.max(280, Math.floor(contentWidth.value * (3/4)) - 6)
})

const viewportDimensions = computed(() => {
  if (!manifest.value?.stageSize) {
    // Fallback to 16:9 with available height
    const maxWidth = leftPaneMaxWidth.value
    const maxHeight = availableHeight.value
    const aspectRatioValue = 16/9
    
    let width = maxWidth
    let height = width / aspectRatioValue
    
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatioValue
    }
    
    return { width: `${width}px`, height: `${height}px` }
  }
  
  const { width: stageWidth, height: stageHeight } = manifest.value.stageSize
  const stageAspectRatio = stageWidth / stageHeight
  
  const maxWidth = leftPaneMaxWidth.value
  const maxHeight = availableHeight.value
  
  let width = maxWidth
  let height = width / stageAspectRatio
  
    if (height > maxHeight) {
      height = maxHeight
      width = height * stageAspectRatio
    }
  
    return { 
    width: `${width}px`, 
    height: `${height}px` 
  }
})

const credits = computed(() => {
  if (!manifest.value) return []
  const list: Array<{label: string; value: string; url?: string}> = []
  if (manifest.value.developer?.name) list.push({ label: 'Developer', value: manifest.value.developer.name, url: manifest.value.developer.url })
  if (manifest.value.license?.text) list.push({ label: 'License', value: manifest.value.license.text, url: manifest.value.license.url })
  if (manifest.value.musicCredits) list.push({ label: 'Music Credits', value: manifest.value.musicCredits })
  if (manifest.value.assetsCredits) list.push({ label: 'Assets Credits', value: manifest.value.assetsCredits })
  if (manifest.value.misArcadeRemixer) list.push({ label: 'MIS Arcade Remixer', value: manifest.value.misArcadeRemixer })
  return list
})

function handleResize() {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(async () => {
  try {
    const m = await fetch(`${baseUrl}games/${base}.json`).then(r => r.ok ? r.json() : null)
    manifest.value = m ?? {
      gameName: base,
      description: 'No metadata available',
      developer: { name: '' , url: ''},
      license: { text: '', url: '' },
      codeGalleryImages: [],
      musicCredits: '',
      assetsCredits: '',
      misArcadeRemixer: '',
      howToPlayImage: ''
    }
  } catch {
    manifest.value = {
      gameName: base,
      description: 'No metadata available',
      developer: { name: '' , url: ''},
      license: { text: '', url: '' },
      codeGalleryImages: [],
      musicCredits: '',
      assetsCredits: '',
      misArcadeRemixer: '',
      howToPlayImage: ''
    }
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('storage', handleStorage)
  await fetchUnlimitedPlayFlag()
  void handleTokenStatusCheck()
  try { handleScoreChange() } catch { /* noop */ }
  try { handleIngameChange() } catch { /* noop */ }
  try { await handleTicketsUpdate() } catch { /* noop */ }
  
  isHowToPlayOpen.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('storage', handleStorage)
})

function goBack() { router.back() }

function openCodeGallery() {
  isCodeGalleryOpen.value = true
}

function closeCodeGallery() {
  isCodeGalleryOpen.value = false
}

function closeHowToPlay() {
  isHowToPlayOpen.value = false
  isIframeLoaded.value = true
}

function openLink(url: string, title?: string) {
  openLinkModal(url, title)
}

function closeLinkModal() {
  closeModal()
}
</script>

<template>
  <div class="page game-view">
    <TopStickyBar />
    <div v-if="isIngame" class="dim-overlay"></div>
    <GameTopBar 
      :code-gallery-images="manifest?.codeGalleryImages || []"
      :game-name="manifest?.gameName || base"
      @open-code-gallery="openCodeGallery"
    />
    <div class="frame">
      <div class="left-pane">
        <div class="viewport" :style="viewportDimensions">
          <iframe ref="iframeRef" :src="isIframeLoaded ? `${baseUrl}games/${base}.html` : undefined" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" @error="goBack" />
        </div>
      </div>
      <aside class="right-pane">
        <div class="back-to-games-card">
          <button 
            @click="goBack" 
            class="back-to-games-button"
            title="Back to Games"
          >
            <span class="back-icon">←</span>
            <span class="back-text">BACK TO GAMES</span>
          </button>
        </div>
        
        <div v-if="manifest?.howToPlayImage" class="howto-card">
          <div class="howto-title">How to Play</div>
          <div class="howto-media">
            <img :src="manifest!.howToPlayImage" alt="How to play" />
          </div>
        </div>
        <div v-if="credits.length" class="credits-card">
          <div class="credits-title">Credits</div>
          <ul class="credits-list">
            <li v-for="(c, i) in credits" :key="i">
              <span class="credit-label">{{ c.label }}:</span>
              <template v-if="c.url">
                <button class="link-button" @click="openLink(c.url!, c.value)">{{ c.value }}</button>
              </template>
              <template v-else>
                <span class="credit-value">{{ c.value }}</span>
              </template>
            </li>
          </ul>
        </div>
      </aside>
    </div>
    
    <!-- Leaderboard Section -->
    <div v-if="manifest?.gameName" class="leaderboard-section">
      <LeaderboardCard
        v-if="!isGuestMode"
        :game-key="manifest?.gameName"
      />
      <div v-else class="leaderboard-guest-message">
        <div class="guest-message-title">Leaderboard</div>
        <div class="guest-message-text">Leaderboard is not available in Guest mode</div>
      </div>
    </div>
    
    <!-- Code Gallery Modal -->
    <CodeGalleryModal
      :is-visible="isCodeGalleryOpen"
      :game-name="manifest?.gameName || base"
      :code-gallery-images="manifest?.codeGalleryImages || []"
      @close="closeCodeGallery"
    />
    
    <!-- Link Modal -->
    <LinkModal
      :is-visible="isLinkModalVisible"
      :url="modalData.url || ''"
      :link-title="modalData.linkTitle"
      @close="closeLinkModal"
    />
    
    <!-- How to Play Modal -->
    <HowToPlayModal
      :is-visible="isHowToPlayOpen"
      :game-name="manifest?.gameName || base"
      :how-to-play-image="manifest?.howToPlayImage"
      @close="closeHowToPlay"
    />
  </div>
</template>

<style scoped>
.page { 
  padding-top: 67px; /* Only account for TopStickyBar height */
  padding-bottom: 24px; 
  margin: 0; 
  padding-left: 8px; 
  padding-right: 8px; 
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Arcade ambient lighting effect */
.page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.02);
  pointer-events: none;
  z-index: -1;
  opacity: 0.4;
}
.frame { 
  background: #1a1a1a;
  border: 3px solid var(--neon-cyan);
  border-radius: 20px; 
  padding: 12px; 
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
  flex: 1;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 12px;
  align-items: start;
  position: relative;
  overflow: hidden;
}

/* Arcade cabinet corner decorations */
.frame::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: transparent;
  border-radius: 22px;
  z-index: -1;
  opacity: 0.6;
}

.frame::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  border-radius: 20px;
  pointer-events: none;
  z-index: 1;
}
.left-pane { 
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}
.right-pane {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.viewport { 
  position: relative; 
  background: #000; 
  border-radius: 16px; 
  overflow: hidden; 
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  border: 4px solid var(--neon-green);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
}

/* Arcade screen bezel effect */
.viewport::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(45deg, 
    var(--neon-green) 0%, 
    transparent 20%, 
    transparent 80%, 
    var(--neon-cyan) 100%);
  border-radius: 20px;
  z-index: -1;
  opacity: 0.8;
}

iframe { 
  width: 100%; 
  height: 100%; 
  border: 0; 
  background: #000; 
  transform: translateZ(0);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
.link-button { 
  background: none; 
  border: none; 
  color: var(--neon-cyan); 
  cursor: pointer; 
  text-decoration: underline; 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  font-size: inherit; 
  padding: 0; 
  transition: color 0.3s ease;
}

/* Dim overlay styles */
.dim-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Ensure only iframe stays above the dim overlay */
.viewport {
  position: relative;
  z-index: 1001;
}

/* Right column cards */
.back-to-games-card, .howto-card, .credits-card {
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid var(--neon-purple);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 24px rgba(153, 0, 255, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Back to Games Button Card - Special styling */
.back-to-games-card {
  border-color: var(--neon-cyan);
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
}

.back-to-games-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    var(--neon-cyan) 0%, 
    transparent 20%, 
    transparent 80%, 
    var(--neon-green) 100%);
  border-radius: 18px;
  z-index: -1;
  opacity: 0.8;
}


/* Back to Games Button Styles */
.back-to-games-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-green));
  border: 3px solid var(--neon-cyan);
  border-radius: 12px;
  color: var(--dark-bg);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.back-to-games-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(0, 255, 255, 0.3);
}

.back-icon {
  font-size: 1.4rem;
  font-weight: 900;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.7));
}

.back-text {
  font-weight: 800;
  letter-spacing: 0.1em;
}

/* Arcade card corner accents */
.howto-card::before, .credits-card::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: transparent;
  border-radius: 17px;
  z-index: -1;
  opacity: 0.6;
}
.howto-title, .credits-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--neon-cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 
    0 0 10px rgba(0, 255, 255, 0.5),
    0 0 20px rgba(0, 255, 255, 0.3);
  margin-bottom: 12px;
  position: relative;
}

.howto-title::after, .credits-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--neon-cyan);
  opacity: 0.8;
}
.howto-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0a0a;
  border: 2px solid var(--neon-green);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.howto-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.credits-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.credits-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border-left: 3px solid var(--neon-purple);
  transition: all 0.3s ease;
}


.credit-label {
  color: var(--neon-cyan);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.credit-value {
  color: var(--text-primary);
  font-weight: 500;
}

/* Leaderboard Section */
.leaderboard-section {
  margin-top: 24px;
  width: 100%;
}

.leaderboard-guest-message {
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid var(--neon-cyan);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 6px 24px rgba(0, 255, 255, 0.25);
  text-align: center;
}

.guest-message-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--neon-cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3);
  margin-bottom: 16px;
}

.guest-message-text {
  color: var(--text-secondary);
  font-size: 1rem;
  opacity: 0.9;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .page { 
    padding-top: 58px; /* Only account for mobile TopStickyBar height */
    padding-left: 6px;
    padding-right: 6px;
  }
  .frame {
    grid-template-columns: 1fr;
    padding: 8px;
    gap: 8px;
  }
  .right-pane {
    order: 2;
  }
  .left-pane {
    order: 1;
  }
  
  .back-to-games-card, .howto-card, .credits-card {
    padding: 10px;
  }
  
  .back-to-games-button {
    padding: 12px 16px;
    font-size: 0.95rem;
    gap: 8px;
  }
  
  .back-icon {
    font-size: 1.2rem;
  }
  
  .howto-title, .credits-title {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .page { 
    padding-top: 49px; /* Only account for mobile TopStickyBar height */
    padding-left: 6px;
    padding-right: 6px;
  }
  
  .frame {
    padding: 6px;
    gap: 6px;
  }
  
  .viewport {
    border-width: 3px;
  }
  
  .back-to-games-card, .howto-card, .credits-card {
    padding: 8px;
    border-width: 1px;
  }
  
  .back-to-games-button {
    padding: 10px 12px;
    font-size: 0.85rem;
    gap: 6px;
  }
  
  .back-icon {
    font-size: 1.1rem;
  }
  
  .howto-title, .credits-title {
    font-size: 0.9rem;
  }
  
  .credits-list li {
    padding: 6px;
    font-size: 0.9rem;
  }
}
</style>



