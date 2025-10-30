<script setup lang="ts">
import TopStickyBar from '@/components/TopStickyBar.vue'
import LeaderboardCard from '@/components/LeaderboardCard.vue'
import { ref, onMounted } from 'vue'

interface GameItem { file: string; name: string; key: string }

const baseUrl = import.meta.env.BASE_URL
const games = ref<GameItem[]>([])
const viewMode = ref<'card' | 'compact'>('card')

async function loadGames() {
  try {
    const listRes = await fetch(`${baseUrl}games/index.json`)
    const files: string[] = await listRes.json()
    const items: GameItem[] = []
    for (const base of files) {
      const manifestUrl = `${baseUrl}games/${base}.json`
      try {
        const m = await fetch(manifestUrl).then(r => r.json())
        items.push({ file: base, name: m.gameName || base, key: m.gameName || base })
      } catch {
        items.push({ file: base, name: base, key: base })
      }
    }
    games.value = items
  } catch {
    games.value = []
  }
}

onMounted(loadGames)
</script>

<template>
  <div class="page leaderboards">
    <TopStickyBar />

    <div class="header">
      <div class="title">Leaderboards</div>
      <div class="subtitle">Top players across all games</div>
      <div class="view-toggle" role="tablist" aria-label="Leaderboard view">
        <button
          role="tab"
          :aria-selected="viewMode === 'card'"
          class="toggle-btn"
          :class="{ active: viewMode === 'card' }"
          @click="viewMode = 'card'"
        >Card</button>
        <button
          role="tab"
          :aria-selected="viewMode === 'compact'"
          class="toggle-btn"
          :class="{ active: viewMode === 'compact' }"
          @click="viewMode = 'compact'"
        >Table</button>
      </div>
    </div>

    <div class="grid">
      <div v-for="g in games" :key="g.file" class="item">
        <div class="game-title">{{ g.name }}</div>
        <LeaderboardCard :gameKey="g.key" :compact="viewMode === 'compact'" />
      </div>
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
}
.header {
  text-align: center;
  margin: 16px 0 8px 0;
}
.title {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-primary);
  text-shadow: 0 0 12px rgba(255,255,255,0.2);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.subtitle {
  font-size: 1rem;
  color: var(--neon-cyan);
  opacity: 0.9;
  margin-top: 6px;
}
.view-toggle {
  display: inline-flex;
  gap: 8px;
  margin-top: 12px;
}
.toggle-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--neon-cyan);
  color: var(--text-primary);
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.toggle-btn.active {
  background: var(--neon-cyan);
  color: #000;
}
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px 0 40px 0;
}
@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
}
.item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.game-title {
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>


