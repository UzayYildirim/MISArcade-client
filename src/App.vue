<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useSession } from './composables/useSession'
import { onMounted, ref } from 'vue'

// Initialize session tracking
const { debugSessions } = useSession()
const router = useRouter()
const isAppReady = ref(false)

// Expose debug function globally for testing
if (import.meta.env.DEV) {
  (window as any).debugSessions = debugSessions
}

// Ensure we're on a valid route after app initialization
onMounted(() => {
  // Small delay to ensure router is fully initialized
  setTimeout(() => {
    const currentRoute = router.currentRoute.value
    // If we're on an invalid route or the route doesn't exist, redirect to login
    if (!currentRoute.matched.length && currentRoute.path !== '/login') {
      console.log('[App] Redirecting to login due to invalid route:', currentRoute.path)
      router.replace('/login')
    }
    isAppReady.value = true
  }, 100)
})
</script>

<template>
  <div v-if="!isAppReady" class="loading-fallback">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading Arcade...</p>
    </div>
  </div>
  <RouterView v-else />
</template>

<style scoped>
:host { display: contents; }

.loading-fallback {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--dark-bg, #0a0a0a);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
  color: var(--neon-cyan, #00ffff);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-top: 3px solid var(--neon-cyan, #00ffff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0;
  text-shadow: 0 0 10px var(--neon-cyan, #00ffff);
}
</style>


