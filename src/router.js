import { createRouter, createWebHistory } from 'vue-router';

// Clear all localStorage items
function clearAllLocalStorage() {
  // Clear all localStorage items
  localStorage.clear();
  console.log('[Router] Cleared all localStorage items');
}
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('./pages/Login.vue') },
    { path: '/games', component: () => import('./pages/GamesGrid.vue'), meta: { requiresAuth: true } },
    { path: '/game/:gamefile', component: () => import('./pages/GameView.vue'), props: true, meta: { requiresAuth: true } },
];
export const router = createRouter({
    // Use subpath base for Cloudflare Pages deployment under /arcade-client
    // Use root path for local development
    history: createWebHistory(import.meta.env.PROD ? '/arcade-client/' : '/'),
    routes,
});
// Check if this is a hard reload (page refresh) vs normal navigation
function isHardReload() {
    // Check if the page was loaded via a hard refresh
    // This works by checking if the navigation type is 'reload'
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    return navigationEntry?.type === 'reload';
}
// Flag to track if we've already cleared localStorage on this page load
let hasClearedOnReload = false;
router.beforeEach((to) => {
    // Only clear localStorage on the first navigation after a hard reload
    if (isHardReload() && !hasClearedOnReload) {
        // Dispatch logout event for session tracking
        window.dispatchEvent(new CustomEvent('user-logout'));
        
        // Clear all localStorage items using the comprehensive function
        clearAllLocalStorage();
        hasClearedOnReload = true;
    }
    const isAuthed = !!localStorage.getItem('arcadeUserId');
    if (to.meta?.requiresAuth && !isAuthed) {
        return { path: '/login' };
    }
    if (to.path === '/login' && isAuthed) {
        return { path: '/games' };
    }
});
