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
                <span class="icon-emoji">💻</span>
                <div class="icon-glow"></div>
              </div>
              <div class="header-text">
                <h2 class="modal-title">Game Code Gallery</h2>
                <p class="modal-subtitle">{{ gameName }}</p>
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
            <div v-if="codeGalleryImages.length === 0" class="no-images">
              <div class="no-images-icon">📷</div>
              <p class="no-images-text">No code images available for this game</p>
            </div>
            <div v-else class="gallery-grid">
              <div 
                v-for="(image, index) in codeGalleryImages" 
                :key="index"
                class="gallery-item"
                @click="openImageModal(image, index)"
                v-motion
                :initial="{ opacity: 0, y: 20 }"
                :enter="{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 100, type: 'spring', stiffness: 300 }
                }"
              >
                <img 
                  :src="image" 
                  :alt="`Code image ${index + 1}`"
                  class="gallery-image"
                  loading="lazy"
                />
                <div class="gallery-overlay">
                  <span class="overlay-icon">🔍</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button 
              @click="closeModal" 
              class="btn-primary"
              v-motion
              :initial="{ x: 20, opacity: 0 }"
              :enter="{ 
                x: 0, 
                opacity: 1,
                transition: { delay: 300, type: 'spring', stiffness: 300 }
              }"
            >
              <span class="btn-text">Close</span>
            </button>
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
     
     <!-- Full-screen Photo Viewer -->
     <Transition name="fullscreen-backdrop">
       <div 
         v-if="isFullscreenViewerOpen" 
         class="fullscreen-viewer"
         @click="closeFullscreenViewer"
       >
         <div 
           class="fullscreen-container"
           @click.stop
           @touchstart="handleTouchStart"
           @touchend="handleTouchEnd"
         >
           <!-- Close Button -->
           <button 
             @click="closeFullscreenViewer" 
             class="fullscreen-close-button"
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
           
           <!-- Navigation Arrows -->
           <button 
             v-if="codeGalleryImages.length > 1"
             @click="goToPreviousImage" 
             class="nav-button nav-button-left"
             v-motion
             :initial="{ x: -50, opacity: 0 }"
             :enter="{ 
               x: 0, 
               opacity: 1,
               transition: { delay: 300, type: 'spring', stiffness: 300 }
             }"
           >
             <span class="nav-icon">‹</span>
           </button>
           
           <button 
             v-if="codeGalleryImages.length > 1"
             @click="goToNextImage" 
             class="nav-button nav-button-right"
             v-motion
             :initial="{ x: 50, opacity: 0 }"
             :enter="{ 
               x: 0, 
               opacity: 1,
               transition: { delay: 400, type: 'spring', stiffness: 300 }
             }"
           >
             <span class="nav-icon">›</span>
           </button>
           
           <!-- Image Display -->
           <div class="image-container">
             <img 
               :src="codeGalleryImages[currentImageIndex]" 
               :alt="`Code image ${currentImageIndex + 1}`"
               class="fullscreen-image"
               v-motion
               :key="currentImageIndex"
               :initial="{ opacity: 0, scale: 0.8 }"
               :enter="{ 
                 opacity: 1, 
                 scale: 1,
                 transition: { type: 'spring', stiffness: 300, damping: 30 }
               }"
             />
           </div>
           
           <!-- Image Counter -->
           <div 
             v-if="codeGalleryImages.length > 1"
             class="image-counter"
             v-motion
             :initial="{ y: 20, opacity: 0 }"
             :enter="{ 
               y: 0, 
               opacity: 1,
               transition: { delay: 500, type: 'spring', stiffness: 300 }
             }"
           >
             {{ currentImageIndex + 1 }} / {{ codeGalleryImages.length }}
           </div>
         </div>
       </div>
     </Transition>
   </Teleport>
 </template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  isVisible: boolean
  gameName: string
  codeGalleryImages: string[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentImageIndex = ref(0)
const isFullscreenViewerOpen = ref(false)
const touchStartX = ref(0)
const touchEndX = ref(0)

const closeModal = () => {
  emit('close')
  isFullscreenViewerOpen.value = false
}

const handleBackdropClick = () => {
  if (isFullscreenViewerOpen.value) {
    isFullscreenViewerOpen.value = false
  } else {
    closeModal()
  }
}

const openImageModal = (image: string, index: number) => {
  currentImageIndex.value = index
  isFullscreenViewerOpen.value = true
}

const closeFullscreenViewer = () => {
  isFullscreenViewerOpen.value = false
}

const goToPreviousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  } else {
    currentImageIndex.value = props.codeGalleryImages.length - 1
  }
}

const goToNextImage = () => {
  if (currentImageIndex.value < props.codeGalleryImages.length - 1) {
    currentImageIndex.value++
  } else {
    currentImageIndex.value = 0
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isFullscreenViewerOpen.value) return
  
  switch (event.key) {
    case 'Escape':
      closeFullscreenViewer()
      break
    case 'ArrowLeft':
      goToPreviousImage()
      break
    case 'ArrowRight':
      goToNextImage()
      break
  }
}

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
}

const handleTouchEnd = (event: TouchEvent) => {
  touchEndX.value = event.changedTouches[0].clientX
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartX.value - touchEndX.value
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - go to next image
      goToNextImage()
    } else {
      // Swipe right - go to previous image
      goToPreviousImage()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
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
  max-width: 95vw;
  max-height: 95vh;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 32px 32px 20px 32px;
  border-bottom: 1px solid var(--panel-border);
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.modal-icon {
  position: relative;
  width: 64px;
  height: 64px;
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
  font-size: 32px;
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
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0;
  font-family: 'Rajdhani', sans-serif;
}

.close-button {
  width: 48px;
  height: 48px;
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
  font-size: 20px;
  font-weight: 700;
}

/* Modal Body */
.modal-body {
  padding: 32px;
  max-height: 60vh;
  overflow-y: auto;
}

.no-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-images-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.no-images-text {
  font-size: 1.4rem;
  color: var(--text-secondary);
  font-family: 'Rajdhani', sans-serif;
  margin: 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.gallery-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--darker-bg);
  border: 2px solid var(--panel-border);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.gallery-item:hover {
  transform: translateY(-4px);
  border-color: var(--neon-cyan);
  box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
}

.gallery-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.05);
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.overlay-icon {
  font-size: 2rem;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px var(--neon-cyan);
}

/* Modal Footer */
.modal-footer {
  padding: 20px 32px 32px 32px;
  border-top: 1px solid var(--panel-border);
  display: flex;
  justify-content: center;
}

.btn-primary {
  padding: 16px 32px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Rajdhani', sans-serif;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  color: var(--dark-bg);
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 255, 255, 0.5);
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
    margin: 20px;
  }
  
  .modal-header {
    padding: 24px 24px 16px 24px;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-footer {
    padding: 16px 24px 24px 24px;
  }
  
  .header-content {
    gap: 16px;
  }
  
  .modal-icon {
    width: 56px;
    height: 56px;
  }
  
  .icon-emoji {
    font-size: 28px;
  }
  
  .modal-title {
    font-size: 1.8rem;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .gallery-image {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .modal-container {
    max-width: 95vw;
    margin: 10px;
  }
  
  .modal-header {
    padding: 20px 20px 12px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 12px 20px 20px 20px;
  }
  
  .modal-title {
    font-size: 1.6rem;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .gallery-image {
    height: 120px;
  }
  
  .modal-icon {
    width: 48px;
    height: 48px;
  }
  
  .icon-emoji {
    font-size: 24px;
  }
}

/* Full-screen Photo Viewer Styles */
.fullscreen-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.fullscreen-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100vw;
  max-height: 100vh;
}

.fullscreen-close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid var(--neon-pink);
  color: var(--neon-pink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;
}

.fullscreen-close-button:hover {
  background: rgba(255, 0, 255, 0.2);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
  transform: scale(1.1);
}

.fullscreen-close-button .close-icon {
  font-size: 24px;
  font-weight: 700;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid var(--neon-cyan);
  color: var(--neon-cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10001;
}

.nav-button:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.nav-button-left {
  left: 20px;
}

.nav-button-right {
  right: 20px;
}

.nav-icon {
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}

.image-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.image-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: var(--neon-cyan);
  padding: 12px 24px;
  border-radius: 25px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

/* Full-screen Transitions */
.fullscreen-backdrop-enter-active,
.fullscreen-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.fullscreen-backdrop-enter-from,
.fullscreen-backdrop-leave-to {
  opacity: 0;
}

/* Responsive Design for Full-screen Viewer */
@media (max-width: 768px) {
  .fullscreen-viewer {
    padding: 10px;
  }
  
  .fullscreen-close-button {
    top: 10px;
    right: 10px;
    width: 48px;
    height: 48px;
  }
  
  .fullscreen-close-button .close-icon {
    font-size: 20px;
  }
  
  .nav-button {
    width: 50px;
    height: 50px;
  }
  
  .nav-button-left {
    left: 10px;
  }
  
  .nav-button-right {
    right: 10px;
  }
  
  .nav-icon {
    font-size: 28px;
  }
  
  .image-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .image-counter {
    bottom: 10px;
    padding: 10px 20px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .fullscreen-viewer {
    padding: 5px;
  }
  
  .fullscreen-close-button {
    top: 5px;
    right: 5px;
    width: 44px;
    height: 44px;
  }
  
  .fullscreen-close-button .close-icon {
    font-size: 18px;
  }
  
  .nav-button {
    width: 44px;
    height: 44px;
  }
  
  .nav-button-left {
    left: 5px;
  }
  
  .nav-button-right {
    right: 5px;
  }
  
  .nav-icon {
    font-size: 24px;
  }
  
  .image-container {
    max-width: 98vw;
    max-height: 98vh;
  }
  
  .image-counter {
    bottom: 5px;
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}
</style>
