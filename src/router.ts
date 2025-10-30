import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { clearAllLocalStorage } from './utils/storage'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('./pages/Login.vue') },
  { path: '/leaderboards', component: () => import('./pages/Leaderboards.vue') },
  { path: '/games', component: () => import('./pages/GamesGrid.vue'), meta: { requiresAuth: true } },
  { path: '/game/:gamefile', component: () => import('./pages/GameView.vue'), props: true, meta: { requiresAuth: true } },
  // Catch-all route to handle any unmatched paths and redirect to login
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.PROD ? '/arcade-client/' : '/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

function isHardReload(): boolean {
  // Check if the page was loaded via a hard refresh
  // This works by checking if the navigation type is 'reload'
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return navigationEntry?.type === 'reload'
}

// Flag to track if we've already cleared localStorage on this page load
let hasClearedOnReload = false

router.beforeEach((to, from, next) => {
  if (isHardReload() && !hasClearedOnReload) {
    // Dispatch logout event for session tracking
    window.dispatchEvent(new CustomEvent('user-logout'))
    
    clearAllLocalStorage()
    hasClearedOnReload = true
    
    if (to.meta?.requiresAuth) {
      next({ path: '/login' })
      return
    }
  }

  const isAuthed = !!localStorage.getItem('arcadeUserId')
  if (to.meta?.requiresAuth && !isAuthed) {
    next({ path: '/login' })
    return
  }
  if (to.path === '/login' && isAuthed) {
    next({ path: '/games' })
    return
  }
  
  next()
})


