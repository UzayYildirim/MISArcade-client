import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import Toast, { type ToastOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './styles/tokens.css'
import App from './App.vue'
import { router } from './router.ts'
import bgImageUrl from './assets/AcsPX1.png'

// Preload background image to avoid blocking content rendering
function preloadBackgroundImage() {
  const img = new Image()
  img.onload = () => {
    document.body.classList.add('loaded')
  }
  img.onerror = () => {
    // If image fails to load, still add loaded class to prevent indefinite waiting
    document.body.classList.add('loaded')
  }
  img.src = bgImageUrl
}

// Start preloading immediately
preloadBackgroundImage()

const app = createApp(App)

// Toast configuration
const toastOptions: ToastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  toastClassName: 'custom-toast',
  bodyClassName: 'custom-toast-body'
}

app.use(MotionPlugin)
app.use(Toast, toastOptions)
app.use(router)

// Global error handler to prevent blank screens
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error)
  // Don't prevent default to allow normal error handling
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Don't prevent default to allow normal error handling
})

// Ensure the app is ready before mounting
router.isReady().then(() => {
  app.mount('#app')
}).catch((error) => {
  console.error('Router initialization failed:', error)
  // Mount anyway to prevent blank screen
  app.mount('#app')
})

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use a relative path so the service worker registers under the correct scope
    const swUrl = new URL('sw.js', import.meta.env.BASE_URL).toString()
    
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service worker registered successfully:', registration.scope)
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; please refresh.')
                // You could show a toast notification here to inform users of updates
              }
            })
          }
        })
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err)
      })
  })
  
  // Handle service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service worker controller changed')
    // Reload the page to get the latest version
    window.location.reload()
  })
}


