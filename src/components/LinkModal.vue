<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div 
        v-if="isVisible" 
        class="modal-backdrop"
        @click="handleBackdropClick"
      >
        <div 
          class="modal-container"
          @click.stop
          v-motion
          :initial="{ 
            opacity: 0, 
            scale: 0.8, 
            y: 50,
            rotateX: -15
          }"
          :enter="{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            rotateX: 0,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }
          }"
          :leave="{ 
            opacity: 0, 
            scale: 0.8, 
            y: 50,
            rotateX: -15,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 40
            }
          }"
        >
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-content">
              <div class="modal-icon">
                <span class="icon-emoji">🔗</span>
                <div class="icon-glow"></div>
              </div>
              <div class="header-text">
                <h2 class="modal-title">External Link</h2>
                <p class="modal-subtitle">{{ linkTitle || 'Opening external website' }}</p>
              </div>
            </div>
            <button 
              @click="closeModal" 
              class="close-button"
              v-motion
              :initial="{ scale: 0, rotate: -90 }"
              :enter="{ 
                scale: 1, 
                rotate: 0,
                transition: { delay: 200, type: 'spring', stiffness: 400 }
              }"
            >
              <span class="close-icon">✕</span>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <div class="link-content">
              <div class="link-info">
                <p class="link-description">
                  You are about to open an external link:
                </p>
                <div class="link-url">
                  <span class="url-label">URL:</span>
                  <span class="url-text">{{ url }}</span>
                </div>
                <div v-if="linkTitle" class="link-title">
                  <span class="title-label">Title:</span>
                  <span class="title-text">{{ linkTitle }}</span>
                </div>
              </div>
              
              <!-- Embedded iframe for the link -->
              <div class="link-preview">
                <div v-if="!shouldLoadIframe" class="preview-placeholder">
                  <div class="preview-icon">🌐</div>
                  <p class="preview-text">Click "Load Website" to preview the content</p>
                  <p class="preview-subtext">This will load the external website in a secure preview</p>
                </div>
                <div v-else-if="iframeError || !iframeWorking" class="iframe-error-state">
                  <div class="error-icon">⚠️</div>
                  <p class="error-text">Unable to load content in preview</p>
                  <p class="error-subtext">This site may block embedding due to security policies</p>
                </div>
                <iframe 
                  v-else
                  ref="iframeRef"
                  :src="url" 
                  class="link-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  referrerpolicy="no-referrer"
                  @load="onIframeLoad"
                  @error="onIframeError"
                />
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="button-group">
              <button 
                @click="closeModal" 
                class="btn-primary"
                v-motion
                :initial="{ x: 0, opacity: 0 }"
                :enter="{ 
                  x: 0, 
                  opacity: 1,
                  transition: { delay: 300, type: 'spring', stiffness: 300 }
                }"
              >
                <span class="btn-text">Close</span>
              </button>
              <button 
                v-if="!shouldLoadIframe"
                @click="loadWebsite" 
                class="btn-secondary"
                v-motion
                :initial="{ x: 20, opacity: 0 }"
                :enter="{ 
                  x: 0, 
                  opacity: 1,
                  transition: { delay: 400, type: 'spring', stiffness: 300 }
                }"
              >
                <span class="btn-text">Load Website</span>
              </button>
              <button 
                v-if="shouldLoadIframe && (iframeError || !iframeWorking)"
                @click="openInNewTab" 
                class="btn-secondary"
                v-motion
                :initial="{ x: 20, opacity: 0 }"
                :enter="{ 
                  x: 0, 
                  opacity: 1,
                  transition: { delay: 400, type: 'spring', stiffness: 300 }
                }"
              >
                <span class="btn-text">Open in New Tab</span>
              </button>
            </div>
          </div>

          <!-- Animated Border -->
          <div class="modal-border">
            <div class="border-line border-top"></div>
            <div class="border-line border-right"></div>
            <div class="border-line border-bottom"></div>
            <div class="border-line border-left"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'

interface Props {
  isVisible: boolean
  url: string
  linkTitle?: string
  closeOnBackdrop?: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true
})

const emit = defineEmits<Emits>()

const iframeError = ref(false)
const iframeLoaded = ref(false)
const iframeWorking = ref(false)
const loadTimeout = ref<number | null>(null)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const shouldLoadIframe = ref(false)

const closeModal = () => {
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    closeModal()
  }
}

const loadWebsite = () => {
  shouldLoadIframe.value = true
  startLoadTimeout()
}

const openInNewTab = () => {
  window.open(props.url, '_blank', 'noopener,noreferrer')
  closeModal()
}

const onIframeLoad = () => {
  iframeLoaded.value = true
  
  // Check if the iframe is actually working
  setTimeout(() => {
    if (checkIframeBlocked()) {
      iframeError.value = true
      iframeWorking.value = false
    } else {
      iframeError.value = false
      iframeWorking.value = true
    }
  }, 500) // Give it more time to load
  
  if (loadTimeout.value) {
    clearTimeout(loadTimeout.value)
    loadTimeout.value = null
  }
}

const onIframeError = () => {
  iframeError.value = true
  iframeLoaded.value = false
  iframeWorking.value = false
  if (loadTimeout.value) {
    clearTimeout(loadTimeout.value)
    loadTimeout.value = null
  }
}

const checkIframeBlocked = () => {
  if (!iframeRef.value) return false
  
  try {
    // Try to access iframe content - this will throw if blocked by X-Frame-Options
    const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow?.document
    if (!iframeDoc) {
      return true // Blocked
    }
    
    // Check if document is accessible and has content
    if (iframeDoc.readyState === 'uninitialized' || iframeDoc.body === null) {
      return true // Blocked or not loaded
    }
    
    // Try to access the body - this will throw if blocked
    const bodyContent = iframeDoc.body.innerHTML
    return false // Not blocked
  } catch (e) {
    return true // Blocked by X-Frame-Options or CORS
  }
}

const startLoadTimeout = () => {
  if (loadTimeout.value) {
    clearTimeout(loadTimeout.value)
  }
  
  // Set a timeout to detect blocked iframes
  loadTimeout.value = window.setTimeout(() => {
    if (!iframeLoaded.value || checkIframeBlocked()) {
      iframeError.value = true
      iframeWorking.value = false
    }
  }, 3000) // 3 second timeout
}

// Reset error state when modal opens or URL changes
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    iframeError.value = false
    iframeLoaded.value = false
    iframeWorking.value = false
    shouldLoadIframe.value = false
  } else {
    if (loadTimeout.value) {
      clearTimeout(loadTimeout.value)
      loadTimeout.value = null
    }
  }
})

watch(() => props.url, () => {
  iframeError.value = false
  iframeLoaded.value = false
  iframeWorking.value = false
  shouldLoadIframe.value = false
})

// Cleanup timeout on component unmount
onBeforeUnmount(() => {
  if (loadTimeout.value) {
    clearTimeout(loadTimeout.value)
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: var(--panel-bg);
  border: 2px solid var(--panel-border);
  border-radius: 20px;
  width: 100%;
  max-width: 95vw;
  height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--panel-border);
  position: relative;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.modal-icon {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--darker-bg);
  border: 2px solid var(--neon-cyan);
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.icon-emoji {
  font-size: 24px;
  z-index: 2;
  position: relative;
}

.icon-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(0, 255, 255, 0.1);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.header-text {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  font-family: 'Rajdhani', sans-serif;
  word-break: break-word;
}

.close-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--darker-bg);
  border: 2px solid var(--panel-border);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.close-button:hover {
  border-color: var(--neon-pink);
  color: var(--neon-pink);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
  transform: scale(1.1);
}

.close-icon {
  font-size: 16px;
  font-weight: 700;
}

/* Modal Body */
.modal-body {
  flex: 1;
  padding: 16px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.link-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.link-info {
  flex-shrink: 0;
}

.link-description {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  font-family: 'Rajdhani', sans-serif;
}

.link-url, .link-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.url-label, .title-label {
  font-weight: 700;
  color: var(--neon-cyan);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 60px;
}

.url-text, .title-text {
  color: var(--text-secondary);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  word-break: break-all;
  flex: 1;
}

.link-preview {
  flex: 1;
  background: var(--darker-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.link-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Preview Placeholder */
.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  background: var(--darker-bg);
  border-radius: 8px;
}

.preview-icon {
  font-size: 48px;
  opacity: 0.7;
}

.preview-text {
  color: var(--neon-cyan);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.preview-subtext {
  color: var(--text-secondary);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  margin: 0;
  max-width: 300px;
  line-height: 1.4;
}

/* Iframe Error State */
.iframe-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  background: var(--darker-bg);
  border-radius: 8px;
}

.error-icon {
  font-size: 48px;
  opacity: 0.7;
}

.error-text {
  color: var(--neon-pink);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.error-subtext {
  color: var(--text-secondary);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  margin: 0;
  max-width: 300px;
  line-height: 1.4;
}

/* Modal Footer */
.modal-footer {
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--panel-border);
  flex-shrink: 0;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Rajdhani', sans-serif;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
  min-width: 120px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  color: var(--dark-bg);
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 255, 255, 0.5);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--panel-bg), var(--panel-border));
  color: var(--text-primary);
  border: 2px solid var(--panel-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  border-color: var(--neon-pink);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.btn-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Animated Border */
.modal-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: 20px;
  overflow: hidden;
}

.border-line {
  position: absolute;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-pink), var(--neon-green));
  animation: borderFlow 3s linear infinite;
}

.border-top {
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateX(-100%);
  animation-delay: 0s;
}

.border-right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  transform: translateY(-100%);
  animation-delay: 0.75s;
}

.border-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateX(100%);
  animation-delay: 1.5s;
}

.border-left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 2px;
  transform: translateY(100%);
  animation-delay: 2.25s;
}

@keyframes borderFlow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.border-right {
  animation-name: borderFlowVertical;
}

.border-bottom {
  animation-name: borderFlowHorizontal;
}

.border-left {
  animation-name: borderFlowVerticalReverse;
}

@keyframes borderFlowVertical {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes borderFlowHorizontal {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes borderFlowVerticalReverse {
  0% { transform: translateY(100%); }
  100% { transform: translateY(-100%); }
}

/* Transitions */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    max-width: 95vw;
    height: 95vh;
    margin: 10px;
  }
  
  .modal-header {
    padding: 20px 20px 12px 20px;
  }
  
  .modal-body {
    padding: 12px 20px;
  }
  
  .modal-footer {
    padding: 12px 20px 20px 20px;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .modal-icon {
    width: 40px;
    height: 40px;
  }
  
  .icon-emoji {
    font-size: 20px;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-subtitle {
    font-size: 0.9rem;
  }
  
  .link-url, .link-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .url-label, .title-label {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .modal-container {
    max-width: 95vw;
    height: 95vh;
    margin: 5px;
  }
  
  .modal-header {
    padding: 16px 16px 8px 16px;
  }
  
  .modal-body {
    padding: 8px 16px;
  }
  
  .modal-footer {
    padding: 8px 16px 16px 16px;
  }
  
  .modal-title {
    font-size: 1.3rem;
  }
  
  .modal-subtitle {
    font-size: 0.8rem;
  }
  
  .modal-icon {
    width: 36px;
    height: 36px;
  }
  
  .icon-emoji {
    font-size: 18px;
  }
  
  .close-button {
    width: 36px;
    height: 36px;
  }
  
  .close-icon {
    font-size: 14px;
  }
}
</style>
