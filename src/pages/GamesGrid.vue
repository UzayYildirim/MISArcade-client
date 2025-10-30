<script setup lang="ts">
import TopStickyBar from '@/components/TopStickyBar.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

interface GameItem { file: string; name: string; desc: string; }

const router = useRouter()
const userName = ref(localStorage.getItem('arcadeUserName') || '')
const games = ref<GameItem[]>([])
const baseUrl = import.meta.env.BASE_URL


// Welcome message for logged in user
const welcomeMessage = computed(() => {
  if (!userName.value) return ''
  const firstName = userName.value.split(' ')[0] || userName.value
  const messages = [
    `Welcome back, ${firstName}! 🎮`,
    `Ready to play, ${firstName}? 🚀`,
    `Let's have some fun, ${firstName}! 🎯`,
    `Game time, ${firstName}! ⚡`,
    `Adventure awaits, ${firstName}! 🌟`
  ]
  return messages[Math.floor(Math.random() * messages.length)]
})

async function loadGames() {
  try {
    const listRes = await fetch(`${baseUrl}games/index.json`)
    const files: string[] = await listRes.json()
    const items: GameItem[] = []
    for (const base of files) {
      const manifestUrl = `${baseUrl}games/${base}.json`
      try {
        const m = await fetch(manifestUrl).then(r => r.json())
        items.push({ file: base, name: m.gameName || base, desc: m.description || '' })
      } catch {
        items.push({ file: base, name: base, desc: 'No metadata available' })
      }
    }
    games.value = items
  } catch {
    games.value = []
  }
}

function openGame(file: string) { router.push(`/game/${file}`) }

// Animation helper functions
function getParticleStyle(index: number) {
  const colors = ['var(--neon-cyan)', 'var(--neon-pink)', 'var(--neon-green)', 'var(--neon-yellow)', 'var(--neon-purple)']
  const color = colors[index % colors.length]
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const animationDelay = Math.random() * 20
  const animationDuration = Math.random() * 10 + 15
  
  return {
    '--particle-color': color,
    '--particle-size': `${size}px`,
    '--particle-left': `${left}%`,
    '--animation-delay': `${animationDelay}s`,
    '--animation-duration': `${animationDuration}s`
  }
}

function getGridLineStyle(direction: 'horizontal' | 'vertical', index: number) {
  const colors = ['var(--neon-cyan)', 'var(--neon-pink)', 'var(--neon-green)']
  const color = colors[index % colors.length]
  const opacity = Math.random() * 0.4 + 0.2
  const animationDelay = Math.random() * 5
  const animationDuration = Math.random() * 8 + 12
  
  if (direction === 'horizontal') {
    const top = (index / 8) * 100
    return {
      '--line-color': color,
      '--line-opacity': opacity.toString(),
      '--line-top': `${top}%`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    }
  } else {
    const left = (index / 12) * 100
    return {
      '--line-color': color,
      '--line-opacity': opacity.toString(),
      '--line-left': `${left}%`,
      '--animation-delay': `${animationDelay}s`,
      '--animation-duration': `${animationDuration}s`
    }
  }
}

// Emoji animation functions
function getRandomEmoji(index: number) {
  const emojis = ['🎮', '🕹️', '🎯', '🎲', '🎪', '🎨', '⭐', '🌟', '💫', '✨', '🎊', '🎉', '🎈', '🎁', '🏆', '🥇']
  return emojis[index % emojis.length]
}

function getEmojiStyle(index: number) {
  const startX = Math.random() * 100
  const startY = Math.random() * 100
  const endX = Math.random() * 100
  const endY = Math.random() * 100
  const animationDelay = Math.random() * 10
  const animationDuration = Math.random() * 8 + 12
  const size = Math.random() * 40 + 60
  
  return {
    '--emoji-start-x': `${startX}%`,
    '--emoji-start-y': `${startY}%`,
    '--emoji-end-x': `${endX}%`,
    '--emoji-end-y': `${endY}%`,
    '--emoji-size': `${size}px`,
    '--animation-delay': `${animationDelay}s`,
    '--animation-duration': `${animationDuration}s`
  }
}

onMounted(loadGames)
</script>

<template>
  <div class="page games-grid">
    <!-- Arcade Background Animations -->
    <div class="arcade-bg">
      <!-- Floating Particles -->
      <div class="particles">
        <div v-for="i in 12" :key="`particle-${i}`" class="particle" :style="getParticleStyle(i)"></div>
      </div>
      
      <!-- Floating Arcade Emojis -->
      <div class="arcade-emojis">
        <div v-for="i in 5" :key="`emoji-${i}`" class="arcade-emoji" :style="getEmojiStyle(i)">{{ getRandomEmoji(i) }}</div>
      </div>
      
      <!-- Animated Grid Lines -->
      <div class="grid-lines">
        <div class="grid-line horizontal" v-for="i in 6" :key="`h-${i}`" :style="getGridLineStyle('horizontal', i)"></div>
        <div class="grid-line vertical" v-for="i in 8" :key="`v-${i}`" :style="getGridLineStyle('vertical', i)"></div>
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
    
    <TopStickyBar />
    
    <!-- Welcome Message Section -->
    <div v-if="userName" class="welcome-section">
      <div class="welcome-message">{{ welcomeMessage }}</div>
      <div class="welcome-subtitle">Choose your adventure below</div>
    </div>
    
    <div class="grid">
      <button v-for="g in games" :key="g.file" class="tile" @click="openGame(g.file)" @keydown.enter.prevent="openGame(g.file)" tabindex="0" role="button" :aria-label="`Open ${g.name}`">
        <img :src="`${baseUrl}games/${g.file}.jpg`" :alt="g.name" @error="(e:any)=>{ e.target.src = baseUrl + 'games/placeholder.svg' }" />
        <div class="meta">
          <div class="name">{{ g.name }}</div>
          <div class="desc">{{ g.desc }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { 
  padding-top: 80px; 
  max-width: 1200px; 
  margin: 0 auto; 
  padding-left: 16px; 
  padding-right: 16px; 
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.welcome-section {
  text-align: center;
  margin: 24px 0 0 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.9));
  border: 2px solid var(--neon-cyan);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(0, 255, 255, 0.1), transparent);
  animation: arcadeScan 4s linear infinite;
  pointer-events: none;
}

.welcome-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 255, 0.03) 2px,
    rgba(0, 255, 255, 0.03) 4px
  );
  pointer-events: none;
}

.welcome-message {
  font-size: 2rem;
  font-weight: 900;
  color: white;
  text-shadow: 
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 15px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 35px var(--neon-cyan),
    0 0 40px var(--neon-cyan);
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: var(--neon-cyan);
  font-weight: 600;
  opacity: 0.9;
  position: relative;
  z-index: 1;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
}



@keyframes arcadeScan {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}



@media (max-width: 768px) {
  .welcome-message {
    font-size: 1.6rem;
  }
  .welcome-subtitle {
    font-size: 1rem;
  }
}

.grid { 
  display: grid; 
  grid-template-columns: repeat(3, minmax(0,1fr)); 
  gap: 32px; 
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
  flex: 1;
  align-content: start;
  padding: 40px 0;
}
@media (max-width: 1024px){ 
  .grid { 
    grid-template-columns: repeat(3, minmax(0,1fr)); 
    gap: 28px;
    max-width: 1200px;
  } 
}
@media (max-width: 768px){ 
  .grid { 
    grid-template-columns: repeat(3, minmax(0,1fr)); 
    gap: 24px;
    max-width: 1000px;
  } 
}
@media (max-width: 640px){ 
  .grid { 
    grid-template-columns: 1fr; 
    gap: 32px;
    max-width: 500px;
  } 
}
.tile { 
  background: linear-gradient(145deg, var(--panel-bg), var(--darker-bg)); 
  border: 3px solid var(--panel-border); 
  border-radius: 20px; 
  overflow: hidden; 
  cursor: pointer; 
  outline: none; 
  display: flex;
  flex-direction: column;
  padding: 0; 
  text-align: left; 
  transition: all 0.3s ease;
  position: relative;
  height: 600px;
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.tile:hover {
  transform: translateY(-8px) scale(1.05);
  border-color: var(--neon-cyan);
  box-shadow: 
    0 20px 60px rgba(0, 255, 255, 0.3),
    0 0 0 2px var(--neon-cyan),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.tile:focus { 
  box-shadow: 
    0 0 0 3px var(--neon-cyan),
    0 8px 32px rgba(0, 255, 255, 0.3);
}
.tile img { 
  display: block; 
  width: 100%; 
  aspect-ratio: 1 / 1;
  object-fit: cover; 
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.tile:hover img {
  transform: scale(0.92);
}
.meta { 
  padding: 24px; 
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4));
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.name { 
  font-weight: 900; 
  font-size: 1.4rem;
  color: var(--text-primary);
  margin-bottom: 12px;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  font-family: 'Orbitron', 'Exo 2', 'Rajdhani', 'Arial Black', sans-serif;
}
.desc { 
  color: var(--text-secondary); 
  font-size: 1rem; 
  overflow: hidden; 
  display: -webkit-box; 
  -webkit-line-clamp: 3; 
  -webkit-box-orient: vertical;
  line-height: 1.5;
  font-weight: 500;
  flex: 1;
  font-family: 'Exo 2', 'Rajdhani', 'Segoe UI', sans-serif;
}
</style>


