<script setup lang="ts">
import TopStickyBar from '../components/TopStickyBar.vue'
import ArcadeModal from '../components/ArcadeModal.vue'
import PocketBase from 'pocketbase'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { config } from '../config/env'
import RoboDoughAvatar from '../avatars/RoboDough.png'
import { useToast } from '../composables/useToast'

const { warning } = useToast()

const pb = new PocketBase(config.pocketbaseUrl)
const router = useRouter()

const email = ref('')
const isSubmitting = ref(false)
const isConfirming = ref(false)
const user = ref<any>(null)
const showConfirm = ref(false)
const showNotFound = ref(false)
const showSessionConflict = ref(false)
const showNotVerified = ref(false)

// Login timeout fallback
const showTimeoutFallback = ref(false)
let loginTimeoutId: number | null = null

const showConnectionCheck = ref(false)
const isPocketBaseAvailable = ref(false)

onMounted(() => {
  checkPocketBaseConnection()
})

// Check if user has an active session (last_seen within 30 seconds)
async function checkActiveSession(userId: string): Promise<boolean> {
  try {
    const sessions = await pb.collection('sessions').getList(1, 1, {
      filter: `user="${userId}"`,
      '$autoCancel': false,
      'cache': 'no-store'
    })
    
    if (!sessions.items || sessions.items.length === 0) {
      return false
    }
    
    const session = sessions.items[0]
    if (!session || !session.last_seen) {
      return false
    }
    
    const lastSeen = new Date(session.last_seen)
    const now = new Date()
    const timeDiff = now.getTime() - lastSeen.getTime()
    const thirtySeconds = 30 * 1000 // 30 seconds in milliseconds
    
    return timeDiff < thirtySeconds
  } catch (error) {
    return false
  }
}

async function submit() {
  let e = email.value.trim()
  if (!e) return
  
  if (/^2\d+$/.test(e)) {
    e = e + '@myasm.ca'
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(e)) {
    showNotFound.value = true
    return
  }
  
  isSubmitting.value = true
  // Login timeout fallback
  if (loginTimeoutId) { clearTimeout(loginTimeoutId); loginTimeoutId = null }
  loginTimeoutId = window.setTimeout(() => {
    isSubmitting.value = false
    showTimeoutFallback.value = true
  }, 20000)
  try {
    const found = await pb.collection('mis_users').getFirstListItem(`email="${e}"`, {
      '$autoCancel': false,
      'cache': 'no-store'
    })
    user.value = found
    
    // Gate by verification status when enabled
    if (config.requireVerified && !(found as any)?.verified) {
      showNotVerified.value = true
      isSubmitting.value = false
      return
    }
    
    // Check for active session before showing confirmation modal
    const hasActiveSession = await checkActiveSession(found.id)
    if (hasActiveSession) {
      showSessionConflict.value = true
      isSubmitting.value = false
      return
    }
    
      localStorage.setItem('arcadeUserName', [found.firstName, found.lastName].filter(Boolean).join(' '))
    localStorage.setItem('arcadeUserId', found.id)
    localStorage.setItem('arcadeUserAvatarBase64', (found as any).avatarbase64 || '')
    const avatarURL = (found as any).avatar ? pb.files.getURL(found, (found as any).avatar) : ''
    localStorage.setItem('arcadeUserAvatarURL', avatarURL)
    showConfirm.value = true
  } catch (error: any) {
    user.value = null
    showConfirm.value = false
    showNotFound.value = true
  } finally {
    isSubmitting.value = false
    if (loginTimeoutId) { clearTimeout(loginTimeoutId); loginTimeoutId = null }
  }
}

async function confirmYes() {
  showConfirm.value = false
  isConfirming.value = true
  
  const userId = (user.value as any)?.id
  if (!userId) {
    isConfirming.value = false
    return
  }
  
  try {
    if (config.requireVerified && !(user.value as any)?.verified) {
      showNotVerified.value = true
      isConfirming.value = false
      return
    }

    try {
      const freshUserData = await pb.collection('mis_users').getOne(userId, {
        '$autoCancel': false,
        'cache': 'no-store'
      })
      user.value = freshUserData
    } catch (error) {
    }
    
    // Initialize TurboWarp unified LocalStorage key for namespace "misarcade"
    const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'
    const nowSec = Math.floor(Date.now() / 1000)
    let obj: any
    try {
      obj = JSON.parse(localStorage.getItem(NAMESPACE_KEY) || '{}')
    } catch {
      obj = {}
    }
    if (!obj || typeof obj !== 'object') obj = {}
    if (typeof obj.data !== 'object' || obj.data == null) obj.data = {}
    
    const p = (user.value as any)?.tickets ?? 0
    obj.data.tickets = String(p)
    const avatar64 = (user.value as any)?.avatarbase64 || ''
    obj.data.avatar64 = avatar64
    // Add avatarURL to TurboWarp localStorage
    const avatarURL = (user.value as any)?.avatar ? pb.files.getURL(user.value, (user.value as any).avatar) : ''
    obj.data.avatarURL = avatarURL
    obj.time = nowSec
    
    try {
      localStorage.setItem(NAMESPACE_KEY, JSON.stringify(obj))
    } catch (error) {
    }
    
    window.dispatchEvent(new CustomEvent('user-login'))
    
    router.push('/games')
  } finally {
    isConfirming.value = false
  }
}

function confirmNo() {
  showConfirm.value = false
}

// Login timeout fallback
async function continueAsGuest() {
  const guestId = `guest-${Date.now()}`
  
  let avatarBase64 = ''
  try {
    const response = await fetch(RoboDoughAvatar)
    const blob = await response.blob()
    avatarBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert avatar to base64:', error)
  }
  
  localStorage.setItem('arcadeUserId', guestId)
  localStorage.setItem('arcadeUserName', 'Guest')
  localStorage.setItem('arcadeUserAvatarBase64', avatarBase64)
  localStorage.setItem('arcadeUserAvatarURL', RoboDoughAvatar)
  try {
    const NAMESPACE_KEY = 'extensions.turbowarp.org/local-storage:misarcade'
    let obj: any
    try { obj = JSON.parse(localStorage.getItem(NAMESPACE_KEY) || '{}') } catch { obj = {} }
    if (!obj || typeof obj !== 'object') obj = {}
    if (typeof obj.data !== 'object' || obj.data == null) obj.data = {}
    obj.data.tickets = '0'
    obj.data.avatar64 = avatarBase64
    obj.data.avatarURL = RoboDoughAvatar
    obj.time = Math.floor(Date.now() / 1000)
    try { localStorage.setItem(NAMESPACE_KEY, JSON.stringify(obj)) } catch {}
  } catch {}
  try { window.dispatchEvent(new CustomEvent('user-login')) } catch {}
  showTimeoutFallback.value = false
  router.push('/games')
}

function cancelGuestContinue() {
  showTimeoutFallback.value = false
}

async function checkPocketBaseConnection() {
  showConnectionCheck.value = true
  isPocketBaseAvailable.value = false
  
  try {
    const checkPromise = pb.collection('mis_users').getList(1, 1, {
      '$autoCancel': false,
      'cache': 'no-store'
    })
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 7000)
    )
    
    await Promise.race([checkPromise, timeoutPromise])
    isPocketBaseAvailable.value = true
    setTimeout(() => {
      showConnectionCheck.value = false
    }, 1000)
  } catch (error) {
    isPocketBaseAvailable.value = false
    showConnectionCheck.value = false
    warning('Server is unavailable. You have been logged in as a guest and can play games, but no rewards will be earned.', {
      timeout: 12000,
      position: 'top-center'
    })
    await continueAsGuest()
  }
}

onBeforeUnmount(() => {
  if (loginTimeoutId) { clearTimeout(loginTimeoutId); loginTimeoutId = null }
})

const displayName = computed(() => {
  if (!user.value) return ''
  return [user.value.firstName, user.value.lastName].filter(Boolean).join(' ')
})

const userAvatar = computed(() => {
  if (!user.value) return ''
  const avatarURL = (user.value as any)?.avatar ? pb.files.getURL(user.value, (user.value as any).avatar) : ''
  if (avatarURL) return avatarURL
  
  // Fallback to base64 if URL not available
  return (user.value as any)?.avatarbase64 || ''
})

const particleStyles = ref<Array<Record<string, string>>>([])
const gridLineStyles = ref<{
  horizontal: Array<Record<string, string>>,
  vertical: Array<Record<string, string>>
}>({ horizontal: [], vertical: [] })
const emojiStyles = ref<Array<Record<string, string>>>([])
const emojis = ref<string[]>([])

// Initialize animation data once on mount
onMounted(() => {
  const colors = ['var(--neon-cyan)', 'var(--neon-pink)', 'var(--neon-green)', 'var(--neon-yellow)', 'var(--neon-purple)']
  for (let i = 0; i < 12; i++) {
    const color = colors[i % colors.length]
    const size = Math.random() * 4 + 2
    const left = Math.random() * 100
    const animationDelay = Math.random() * 20
    const animationDuration = Math.random() * 10 + 15
    
    particleStyles.value.push({
      '--particle-color': color,
      '--particle-size': `${size}px`,
      '--particle-left': `${left}%`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    })
  }

  // Generate grid line styles
  const gridColors = ['var(--neon-cyan)', 'var(--neon-pink)', 'var(--neon-green)']
  for (let i = 0; i < 6; i++) {
    const color = gridColors[i % gridColors.length]
    const opacity = Math.random() * 0.4 + 0.2
    const animationDelay = Math.random() * 5
    const animationDuration = Math.random() * 8 + 12
    const top = (i / 6) * 100
    
    gridLineStyles.value.horizontal.push({
      '--line-color': color,
      '--line-opacity': opacity.toString(),
      '--line-top': `${top}%`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    })
  }

  for (let i = 0; i < 8; i++) {
    const color = gridColors[i % gridColors.length]
    const opacity = Math.random() * 0.4 + 0.2
    const animationDelay = Math.random() * 5
    const animationDuration = Math.random() * 8 + 12
    const left = (i / 8) * 100
    
    gridLineStyles.value.vertical.push({
      '--line-color': color,
      '--line-opacity': opacity.toString(),
      '--line-left': `${left}%`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    })
  }

  const emojiList = ['🎮', '🕹️', '🎯', '🎲', '🎪', '🎨', '⭐', '🌟', '💫', '✨', '🎊', '🎉', '🎈', '🎁', '🏆', '🥇']
  for (let i = 0; i < 5; i++) {
    const startX = Math.random() * 100
    const startY = Math.random() * 100
    const endX = Math.random() * 100
    const endY = Math.random() * 100
    const animationDelay = Math.random() * 10
    const animationDuration = Math.random() * 8 + 12
    const size = Math.random() * 40 + 60
    
    emojiStyles.value.push({
      '--emoji-start-x': `${startX}%`,
      '--emoji-start-y': `${startY}%`,
      '--emoji-end-x': `${endX}%`,
      '--emoji-end-y': `${endY}%`,
      '--emoji-size': `${size}px`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    })
    
    emojis.value.push(emojiList[i % emojiList.length])
  }
})
</script>

<template>
  <!-- Loading Overlay -->
  <div v-if="isSubmitting || isConfirming" class="loading-overlay">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>{{ isSubmitting ? 'Checking credentials...' : 'Finalizing login...' }}</p>
    </div>
  </div>

  <div class="arcade-container">
    <!-- Arcade Background Animations -->
    <div class="arcade-bg">
      <!-- Floating Particles -->
      <div class="particles">
        <div v-for="(style, i) in particleStyles" :key="`particle-${i}`" class="particle" :style="style"></div>
      </div>
      
      <!-- Floating Arcade Emojis -->
      <div class="arcade-emojis">
        <div v-for="(style, i) in emojiStyles" :key="`emoji-${i}`" class="arcade-emoji" :style="style">{{ emojis[i] }}</div>
      </div>
      
      <!-- Animated Grid Lines -->
      <div class="grid-lines">
        <div class="grid-line horizontal" v-for="(style, i) in gridLineStyles.horizontal" :key="`h-${i}`" :style="style"></div>
        <div class="grid-line vertical" v-for="(style, i) in gridLineStyles.vertical" :key="`v-${i}`" :style="style"></div>
      </div>
      
      <!-- Scan Lines Effect -->
      <div class="scan-lines"></div>
      
      <!-- Pulsing Border Effects -->
      <div class="border-effects">
        <div class="border-pulse top"></div>
        <div class="border-pulse right"></div>
        <div class="border-pulse bottom"></div>
        <div class="border-pulse left"></div>
      </div>
    </div>
    
    <!-- Top Sticky Bar -->
    <TopStickyBar />
    
    <!-- Top Bar: Title + Progress inline -->
    <div class="top-bar">
      <div class="title-container">
        <h1 class="arcade-title arcade-title-inline">
          <span class="title-glow">MIS</span>
          <span class="title-accent">ARCADE</span>
          <span class="title-divider">/</span>
          <span class="subtitle-inline">LOGIN</span>
        </h1>
      </div>
    </div>

    <!-- Login Form -->
    <div class="step-content">
      <div class="step-header">
        <h2 class="step-title">LOGIN</h2>
        <p class="step-description">Enter your registered email or student number to continue</p>
        <div class="registration-notice">
          <i class="fas fa-info-circle"></i>
          <span>You need to register before logging in. If you haven't registered yet, please go to the MIS booth.</span>
        </div>
      </div>
      
      <div class="form-container">
        <form @submit.prevent="submit" class="form" autocomplete="on">
          <div class="form-group full-width">
            <label class="input-label">
              <span class="label-text">EMAIL ADDRESS OR STUDENT NUMBER</span>
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input 
                  id="email-input" 
                  v-model="email" 
                  type="text" 
                  placeholder="Enter email address or student number"
                  :disabled="isSubmitting" 
                  class="arcade-input"
                  required 
                />
                <div class="input-glow"></div>
              </div>
            </label>
          </div>
          
          <div class="form-group full-width">
            <button type="submit" :disabled="isSubmitting" class="btn-primary">
              <i class="fas fa-sign-in-alt btn-icon"></i>
              <span class="btn-text">{{ isSubmitting ? 'Checking…' : 'Continue' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    <ArcadeModal
      :is-visible="showConfirm"
      type="confirm"
      title="Is this you?"
      :message="displayName"
      :user-avatar="userAvatar"
      :show-profile-card="true"
      :show-cancel-button="true"
      confirm-text="Yes"
      cancel-text="No"
      @confirm="confirmYes"
      @cancel="confirmNo"
      @close="confirmNo"
    />
    <ArcadeModal
      :is-visible="showNotFound"
      type="error"
      title="User Not Found"
      message="We couldn't find a registration for that email. Please try again."
      confirm-text="OK"
      @confirm="() => (showNotFound = false)"
      @close="() => (showNotFound = false)"
    />
    <ArcadeModal
      :is-visible="showSessionConflict"
      type="error"
      title="Session Conflict"
      message="You have another session. You can only play at one device at a time. Please exit on your other device, wait a couple minutes and try again."
      confirm-text="OK"
      @confirm="() => (showSessionConflict = false)"
      @close="() => (showSessionConflict = false)"
    />
    <ArcadeModal
      :is-visible="showNotVerified"
      type="error"
      title="BETA Verification"
      message="Arcade BETA: Your account is not verified yet. Please wait for verification."
      confirm-text="OK"
      @confirm="() => (showNotVerified = false)"
      @close="() => (showNotVerified = false)"
    />
    <ArcadeModal
      :is-visible="showTimeoutFallback"
      type="warning"
      title="Login Timeout"
      message="The login service is taking too long. You can continue now. You'll be able to play, but tickets and tokens may not sync until login succeeds."
      :show-cancel-button="true"
      confirm-text="Continue"
      cancel-text="Stay"
      @confirm="continueAsGuest"
      @cancel="cancelGuestContinue"
      @close="cancelGuestContinue"
    />
    <ArcadeModal
      :is-visible="showConnectionCheck"
      type="info"
      title="Checking Connection"
      message="Connecting to server..."
      :close-on-backdrop="false"
      :show-close-button="false"
    />
  </div>
  </template>

<style scoped>
.arcade-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
	padding-top: 120px;
	padding-bottom: 120px; 
	display: flex;
	flex-direction: column;
	gap: 32px;
	min-height: 100vh;
	position: relative;
	overflow: hidden;
}

/* Arcade Background Animations */
.arcade-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
  contain: layout style paint;
}

/* Floating Particles */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: var(--particle-size);
  height: var(--particle-size);
  background: var(--particle-color);
  border-radius: 50%;
  left: var(--particle-left);
  top: 100%;
  box-shadow: 0 0 8px var(--particle-color);
  animation: floatUp var(--animation-duration) linear infinite;
  animation-delay: var(--animation-delay);
  opacity: 0.8;
  will-change: transform, opacity;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
    transform: scale(1);
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100vh) scale(0);
    opacity: 0;
  }
}

/* Floating Arcade Emojis */
.arcade-emojis {
  position: absolute;
  width: 100%;
  height: 100%;
}

.arcade-emoji {
  position: absolute;
  font-size: var(--emoji-size);
  left: var(--emoji-start-x);
  top: var(--emoji-start-y);
  opacity: 0.7;
  animation: emojiFloat var(--animation-duration) ease-in-out infinite;
  animation-delay: var(--animation-delay);
  pointer-events: none;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
  transform-origin: center;
  will-change: transform, opacity;
}

@keyframes emojiFloat {
  0% {
    transform: translate(0%, 0%) scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: translate(50%, 50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(100%, 100%) scale(0.8);
    opacity: 0.3;
  }
}

/* Animated Grid Lines */
.grid-lines {
  position: absolute;
  width: 100%;
  height: 100%;
}

.grid-line {
  position: absolute;
  background: var(--line-color);
  opacity: var(--line-opacity);
  box-shadow: 0 0 8px var(--line-color);
  will-change: transform, opacity;
}

.grid-line.horizontal {
  width: 100%;
  height: 2px;
  top: var(--line-top);
  animation: gridPulseHorizontal var(--animation-duration) ease-in-out infinite;
  animation-delay: var(--animation-delay);
}

.grid-line.vertical {
  height: 100%;
  width: 2px;
  left: var(--line-left);
  animation: gridPulseVertical var(--animation-duration) ease-in-out infinite;
  animation-delay: var(--animation-delay);
}

@keyframes gridPulseHorizontal {
  0%, 100% {
    opacity: var(--line-opacity);
    transform: scaleX(0.3);
  }
  50% {
    opacity: calc(var(--line-opacity) * 2);
    transform: scaleX(1);
  }
}

@keyframes gridPulseVertical {
  0%, 100% {
    opacity: var(--line-opacity);
    transform: scaleY(0.3);
  }
  50% {
    opacity: calc(var(--line-opacity) * 2);
    transform: scaleY(1);
  }
}

/* Scan Lines Effect */
.scan-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 0px,
    rgba(0, 255, 255, 0.08) 0px,
    rgba(0, 255, 255, 0.12) 1px,
    rgba(0, 255, 255, 0.08) 2px,
    transparent 2px,
    transparent 4px
  );
  animation: scanMove 3s linear infinite;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 255, 0.1),
    inset 0 0 40px rgba(0, 255, 255, 0.05);
}

@keyframes scanMove {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

/* Pulsing Border Effects */
.border-effects {
  position: absolute;
  width: 100%;
  height: 100%;
}

.border-pulse {
  position: absolute;
  background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
  opacity: 0.8;
  box-shadow: 
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan);
}

.border-pulse.top {
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  animation: borderPulseHorizontal 3s ease-in-out infinite;
}

.border-pulse.bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  animation: borderPulseHorizontal 3s ease-in-out infinite 1.5s;
}

.border-pulse.left {
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  animation: borderPulseVertical 3s ease-in-out infinite 0.5s;
}

.border-pulse.right {
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  animation: borderPulseVertical 3s ease-in-out infinite 2s;
}

@keyframes borderPulseHorizontal {
  0%, 100% {
    opacity: 0;
    transform: scaleX(0);
  }
  50% {
    opacity: 0.8;
    transform: scaleX(1);
  }
}

@keyframes borderPulseVertical {
  0%, 100% {
    opacity: 0;
    transform: scaleY(0);
  }
  50% {
    opacity: 0.8;
    transform: scaleY(1);
  }
}

/* Top Bar */
.top-bar {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: 24px;
	margin-bottom: 24px;
}
@media (max-width: 768px) {
	.top-bar {
		grid-template-columns: 1fr;
		gap: 16px;
	}
}

.title-container {
	position: relative;
}

.arcade-title {
	font-family: 'Orbitron', monospace;
	font-size: 4rem;
	font-weight: 900;
	text-transform: uppercase;
	letter-spacing: 0.2em;
	margin: 0;
	line-height: 1;
	position: relative;
}

.title-glow {
	color: var(--neon-cyan);
	text-shadow: 
		0 0 10px var(--neon-cyan),
		0 0 20px var(--neon-cyan),
		0 0 30px var(--neon-cyan);
	animation: titlePulse 2s ease-in-out infinite;
}

.title-accent {
	color: var(--neon-pink);
	text-shadow: 
		0 0 10px var(--neon-pink),
		0 0 20px var(--neon-pink),
		0 0 30px var(--neon-pink);
	animation: titlePulse 2s ease-in-out infinite 0.5s;
}

@keyframes titlePulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.8; }
}

.subtitle {
	display: none;
}

.arcade-title-inline {
	display: flex;
	align-items: baseline;
	gap: 12px;
	flex-wrap: wrap;
}

.subtitle-inline {
	font-family: 'Rajdhani', sans-serif;
	font-size: 1rem;
	font-weight: 700;
	color: var(--neon-green);
	text-transform: uppercase;
	letter-spacing: 0.15em;
	text-shadow: 0 0 10px var(--neon-green);
}

.title-divider {
	color: var(--text-secondary);
	opacity: 0.6;
}

/* Step Content */
.step-content {
	background: var(--panel-bg);
	border: 2px solid var(--panel-border);
	border-radius: 16px;
	padding: 40px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	position: relative;
	overflow: hidden;
}

.step-content::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink), var(--neon-green));
	animation: borderFlow 3s linear infinite;
}

@keyframes borderFlow {
	0% { transform: translateX(-100%); }
	100% { transform: translateX(100%); }
}

.step-header {
	text-align: center;
	margin-bottom: 40px;
}

.step-title {
	font-family: 'Orbitron', monospace;
	font-size: 2rem;
	font-weight: 700;
	color: var(--neon-cyan);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin: 0 0 12px 0;
	text-shadow: 0 0 20px var(--neon-cyan);
}

.step-description {
	font-size: 1.1rem;
	color: var(--text-secondary);
	font-weight: 500;
	margin: 0;
}

/* Form Styles */
.form-container {
	max-width: 800px;
	margin: 0 auto;
	width: 100%;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.form-group {
	margin-bottom: 24px;
	min-width: 0;
}

.form-group.full-width {
	width: 100%;
}

.input-label {
	display: block;
	width: 100%;
}

.label-text {
	font-weight: 700;
	color: var(--neon-green);
	margin-bottom: 12px;
	font-size: 1rem;
	font-family: 'Rajdhani', sans-serif;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	text-shadow: 0 0 10px var(--neon-green);
}

.input-wrapper {
	position: relative;
	overflow: hidden;
	border-radius: 8px;
	width: 100%;
	display: block;
}

.input-icon {
	position: absolute;
	left: 16px;
	top: 50%;
	transform: translateY(-50%);
	color: var(--neon-cyan);
	font-size: 1.1rem;
	z-index: 3;
	pointer-events: none;
}

.arcade-input {
	width: 100%;
	padding: 16px 20px 16px 50px;
	background: var(--darker-bg);
	border: 2px solid var(--panel-border);
	border-radius: 8px;
	color: var(--text-primary);
	font-size: 1.1rem;
	font-family: 'Rajdhani', sans-serif;
	font-weight: 500;
	transition: all 0.3s ease;
	position: relative;
	z-index: 2;
	box-sizing: border-box;
	min-width: 0;
	max-width: 100%;
	display: block;
}

.arcade-input:focus {
	outline: none;
	border-color: var(--neon-cyan);
	box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.arcade-input::placeholder {
	color: var(--text-muted);
	font-style: italic;
}

.arcade-input:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.input-glow {
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: rgba(0, 255, 255, 0.1);
	transition: left 0.5s ease;
	pointer-events: none;
}

.arcade-input:focus + .input-glow {
	left: 100%;
}

/* Button Styles */
button {
	padding: 14px 24px;
	border: none;
	border-radius: 12px;
	cursor: pointer;
	font-size: 1rem;
	font-weight: 700;
	font-family: 'Rajdhani', sans-serif;
	transition: all 0.3s ease;
	min-width: 180px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	width: 100%;
}

.btn-primary {
	background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
	color: var(--dark-bg);
	border: 2px solid var(--neon-cyan);
	box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 8px 30px rgba(0, 255, 255, 0.5);
}

.btn-primary:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none !important;
	box-shadow: none !important;
}

.btn-icon {
	font-size: 1rem;
	color: var(--dark-bg);
	filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
}

.btn-text {
	font-weight: 700;
	letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) {
	.arcade-container {
		padding: 16px;
		padding-top: 100px; /* Increased top padding for better spacing on mobile */
		gap: 24px;
	}
	
	.arcade-title {
		font-size: 2.5rem;
	}
	
	.step-content {
		padding: 24px;
	}
	
	button {
		min-width: 160px;
		padding: 14px 24px;
		font-size: 0.9rem;
	}
}

@media (max-width: 480px) {
	.arcade-container {
		padding-top: 90px;
	}
	
	.arcade-title {
		font-size: 2rem;
	}
}

/* Loading Overlay */
.loading-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(10, 10, 10, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.loading-spinner {
	text-align: center;
	color: var(--neon-cyan);
}

.loading-spinner .spinner {
	width: 50px;
	height: 50px;
	border: 4px solid rgba(0, 255, 255, 0.3);
	border-top: 4px solid var(--neon-cyan);
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 20px;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.loading-spinner p {
	font-family: 'Rajdhani', sans-serif;
	font-weight: 600;
	font-size: 1.2rem;
	margin: 0;
	text-shadow: 0 0 15px var(--neon-cyan);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

/* Registration Notice */
.registration-notice {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: 20px;
	padding: 16px 20px;
	background: rgba(255, 193, 7, 0.1);
	border: 2px solid var(--neon-yellow);
	border-radius: 8px;
	color: var(--neon-yellow);
	font-family: 'Rajdhani', sans-serif;
	font-weight: 600;
	font-size: 1rem;
	text-shadow: 0 0 10px var(--neon-yellow);
	box-shadow: 0 0 20px rgba(255, 193, 7, 0.2);
	animation: noticeGlow 2s ease-in-out infinite alternate;
}

.registration-notice i {
	font-size: 1.2rem;
	color: var(--neon-yellow);
	text-shadow: 0 0 10px var(--neon-yellow);
	flex-shrink: 0;
}

@keyframes noticeGlow {
	0% {
		box-shadow: 0 0 20px rgba(255, 193, 7, 0.2);
		text-shadow: 0 0 10px var(--neon-yellow);
	}
	100% {
		box-shadow: 0 0 30px rgba(255, 193, 7, 0.4);
		text-shadow: 0 0 15px var(--neon-yellow);
	}
}

@media (max-width: 768px) {
	.registration-notice {
		font-size: 0.9rem;
		padding: 14px 16px;
		gap: 10px;
	}
	
	.registration-notice i {
		font-size: 1.1rem;
	}
}
</style>


