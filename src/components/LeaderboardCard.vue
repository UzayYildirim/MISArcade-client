<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLeaderboard } from '@/composables/useLeaderboard'

const props = defineProps<{ gameKey: string; compact?: boolean }>()

const keyRef = computed(() => props.gameKey)
const { entries, isLoading, isEmpty, error, load, hasLoaded } = useLeaderboard(keyRef)
const loadTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const isCompact = computed(() => !!props.compact)

// Column resizing
const columnWidths = ref<number[]>([28, 200, 96])
const resizing = ref<{ index: number; startX: number; startWidth: number } | null>(null)
const tableWidth = computed(() => columnWidths.value.reduce((a, b) => a + b, 0))

function onResizeStart(index: number, ev: PointerEvent) {
  ev.preventDefault()
  resizing.value = { index, startX: ev.clientX, startWidth: columnWidths.value[index] }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
}

function onPointerMove(ev: PointerEvent) {
  if (!resizing.value) return
  const delta = ev.clientX - resizing.value.startX
  const next = Math.max(16, Math.round(resizing.value.startWidth + delta))
  columnWidths.value[resizing.value.index] = next
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  resizing.value = null
}
</script>

<template>
  <div class="leaderboard-card" :class="{ 'compact-shrink': isCompact }">
    <div class="leaderboard-title">Leaderboard</div>

    <div v-if="isLoading" class="leaderboard-loading">
      <div class="spinner"></div>
      <div class="loading-text">Loading top players…</div>
    </div>

    <div v-else-if="error" class="leaderboard-error">
      <div class="error-message">{{ error }}</div>
      <button class="retry-button" @click="load">Retry</button>
    </div>

    <div v-else-if="isEmpty" class="leaderboard-empty">
      <div class="empty-message">No scores yet</div>
      <div class="empty-subtitle">Be the first to play!</div>
    </div>

    <template v-else>
      <ol v-if="!isCompact" class="leaderboard-list">
        <li v-for="row in entries" :key="row.user.userId" class="leaderboard-row">
          <div class="rank" :data-rank="row.rank">#{{ row.rank }}</div>
          <div class="avatar">
            <img v-if="row.user.avatarUrl" :src="row.user.avatarUrl" :alt="`${row.user.displayName}'s avatar`" />
            <img v-else-if="row.user.avatarBase64" :src="row.user.avatarBase64" :alt="`${row.user.displayName}'s avatar`" />
            <div v-else class="avatar-fallback">{{ row.user.displayName.charAt(0).toUpperCase() }}</div>
          </div>
          <div class="user">
            <div class="name">{{ row.user.displayName }}</div>
          </div>
          <div class="score">
            <span class="score-value">{{ row.score }}</span>
            <span class="score-label">PTS</span>
          </div>
        </li>
      </ol>
      <div v-else class="leaderboard-compact">
        <table class="compact-table" :style="{ width: tableWidth + 'px' }">
          <colgroup>
            <col :style="{ width: columnWidths[0] + 'px' }" />
            <col :style="{ width: columnWidths[1] + 'px' }" />
            <col :style="{ width: columnWidths[2] + 'px' }" />
          </colgroup>
          <thead>
            <tr>
              <th>
                #
                <span class="col-resizer" @pointerdown="onResizeStart(0, $event)"></span>
              </th>
              <th>
                Player
                <span class="col-resizer" @pointerdown="onResizeStart(1, $event)"></span>
              </th>
              <th class="score-col">
                Score
                <span class="col-resizer" @pointerdown="onResizeStart(2, $event)"></span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in entries" :key="row.user.userId" class="compact-row">
              <td class="compact-rank">{{ row.rank }}</td>
              <td class="compact-user">
                <span class="compact-avatar">
                  <img v-if="row.user.avatarUrl" :src="row.user.avatarUrl" :alt="`${row.user.displayName}'s avatar`" />
                  <img v-else-if="row.user.avatarBase64" :src="row.user.avatarBase64" :alt="`${row.user.displayName}'s avatar`" />
                  <span v-else class="compact-avatar-fallback">{{ row.user.displayName.charAt(0).toUpperCase() }}</span>
                </span>
                <span class="compact-name">{{ row.user.displayName }}</span>
              </td>
              <td class="compact-score">
                <span class="score-value">{{ row.score }}</span>
                <span class="score-label">PTS</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div class="leaderboard-notice">
      <div class="update-notice">Leaderboard updates every 15 minutes</div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-card {
  background: rgba(26, 26, 26, 0.9);
  border: 2px solid var(--neon-cyan);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 24px rgba(0, 255, 255, 0.25);
  position: relative;
  overflow: hidden;
}
.leaderboard-card.compact-shrink { width: max-content; max-width: 100%; overflow: auto; }
.leaderboard-title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--neon-cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3);
  margin-bottom: 12px;
  position: relative;
}
.leaderboard-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--neon-cyan);
  opacity: 0.8;
}

.leaderboard-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(0, 255, 255, 0.2);
  border-top-color: var(--neon-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }
.loading-text { color: var(--text-secondary); font-size: 0.95rem; }

.leaderboard-error {
  color: #ff6b6b;
  background: rgba(255, 0, 0, 0.06);
  border: 1px solid rgba(255, 0, 0, 0.25);
  padding: 16px;
  border-radius: 10px;
  text-align: center;
}
.error-message {
  margin-bottom: 12px;
  font-weight: 600;
}
.retry-button {
  background: var(--neon-cyan);
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}
.retry-button:hover {
  background: rgba(0, 255, 255, 0.8);
  transform: translateY(-1px);
}

.leaderboard-empty {
  color: var(--text-secondary);
  padding: 20px;
  text-align: center;
}
.empty-message {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--neon-purple);
}
.empty-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
}

.leaderboard-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.leaderboard-row {
  display: grid;
  grid-template-columns: auto 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border-left: 3px solid var(--neon-cyan);
}
.rank {
  font-family: 'Orbitron', monospace;
  color: var(--neon-green);
  font-weight: 900;
  text-shadow: 0 0 8px var(--neon-green);
}
.avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid var(--neon-purple); box-shadow: 0 0 8px rgba(153, 0, 255, 0.4); }
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-fallback { width: 100%; height: 100%; background: var(--neon-purple); display: flex; align-items: center; justify-content: center; color: #111; font-weight: 800; }
.user { min-width: 0; }
.name { color: var(--text-primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.score { display: flex; align-items: baseline; gap: 6px; }
.score-value { font-family: 'Orbitron', monospace; font-weight: 900; color: #fff; text-shadow: 0 0 8px rgba(255,255,255,0.4); }
.score-label { color: var(--neon-cyan); font-size: 0.75rem; letter-spacing: 0.08em; }

.leaderboard-notice { display: flex; justify-content: center; margin-top: 12px; }
.update-notice { color: var(--text-secondary); font-size: 0.8rem; opacity: 0.8; font-style: italic; }

@media (max-width: 480px) {
  .leaderboard-row { grid-template-columns: auto 28px 1fr auto; gap: 8px; padding: 8px; }
  .avatar { width: 28px; height: 28px; }
}

.leaderboard-compact { margin-top: 4px; }
.compact-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.compact-table thead th { text-align: left; font-size: 0.8rem; color: var(--neon-cyan); padding: 2px 4px; border-bottom: 1px solid rgba(0,255,255,0.3); }
.compact-table th, .compact-table td { min-width: 0; }
.compact-table tbody td { padding: 2px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: middle; overflow: hidden; text-overflow: ellipsis; }
.compact-row:hover { background: rgba(0, 0, 0, 0.25); }
.compact-rank { font-family: 'Orbitron', monospace; color: var(--neon-green); font-weight: 900; }
.compact-user { display: flex; align-items: center; gap: 8px; min-width: 0; }
.compact-avatar { width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1px solid var(--neon-purple); display: inline-flex; align-items: center; justify-content: center; }
.compact-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.compact-avatar-fallback { background: var(--neon-purple); color: #111; font-weight: 800; width: 100%; height: 100%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; }
.compact-name { color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.compact-score { text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.score-col { text-align: right; }

/* Column resizer */
.col-resizer { position: absolute; right: 0; top: 0; width: 6px; cursor: col-resize; user-select: none; touch-action: none; height: 100%; }
.compact-table thead th { position: relative; overflow: visible; }
</style>


