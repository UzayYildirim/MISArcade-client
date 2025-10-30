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
        >
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-content">
              <div class="modal-icon">
                <span class="icon-emoji">🎮</span>
                <div class="icon-glow"></div>
              </div>
              <div class="header-text">
                <h2 class="modal-title">How to Play</h2>
                <p class="modal-subtitle">{{ gameName }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <div v-if="howToPlayImage" class="howto-content">
              <div class="howto-image-container">
                <img 
                  :src="howToPlayImage" 
                  :alt="`How to play ${gameName}`"
                  class="howto-image"
                  loading="lazy"
                />
              </div>
            </div>
            <div v-else class="no-howto">
              <div class="no-howto-icon">📖</div>
              <p class="no-howto-text">No how-to-play guide available for this game</p>
              <p class="no-howto-subtext">Jump in and start playing to learn the controls!</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button 
              @click="closeModal" 
              class="btn-primary"
            >
              <span class="btn-text">Okay</span>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  gameName: string
  howToPlayImage?: string
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const closeModal = () => {
  emit('close')
}

const handleBackdropClick = () => {
  closeModal()
}
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
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  overflow: visible;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px 12px 32px;
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
  border: 2px solid var(--neon-green);
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
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
  background: rgba(0, 255, 0, 0.1);
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


/* Modal Body */
.modal-body {
  padding: 32px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.howto-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.howto-image-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  overflow: hidden;
  background: var(--darker-bg);
  border: 3px solid var(--neon-green);
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
}

.howto-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.no-howto {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-howto-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.no-howto-text {
  font-size: 1.4rem;
  color: var(--text-primary);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.no-howto-subtext {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-family: 'Rajdhani', sans-serif;
  margin: 0;
  max-width: 400px;
  line-height: 1.4;
}

/* Modal Footer */
.modal-footer {
  padding: 4px 32px 6px 32px;
  border-top: 1px solid var(--panel-border);
  display: flex;
  justify-content: center;
  background: var(--panel-bg);
  position: relative;
  z-index: 5;
}

.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: 800;
  font-family: 'Rajdhani', sans-serif;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: relative;
  overflow: hidden;
  width: 100%;
  background: linear-gradient(135deg, #00ff00, #00ffff);
  color: #0a0a0a;
  border: 3px solid #00ff00;
  box-shadow: 0 6px 20px rgba(0, 255, 0, 0.3);
  display: block;
  visibility: visible;
  opacity: 1;
  z-index: 10;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Transitions */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
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
    padding: 12px 24px 8px 24px;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-footer {
    padding: 3px 24px 5px 24px;
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
  
  .howto-image-container {
    border-width: 2px;
  }
  
  .btn-primary {
    padding: 6px 12px;
    font-size: 1.2rem;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-container {
    max-width: 95vw;
    margin: 10px;
  }
  
  .modal-header {
    padding: 10px 20px 6px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 2px 20px 4px 20px;
  }
  
  .modal-title {
    font-size: 1.6rem;
  }
  
  .modal-icon {
    width: 48px;
    height: 48px;
  }
  
  .icon-emoji {
    font-size: 24px;
  }
  
  .howto-image-container {
    border-width: 2px;
  }
  
  .no-howto {
    padding: 40px 16px;
  }
  
  .no-howto-icon {
    font-size: 3rem;
  }
  
  .no-howto-text {
    font-size: 1.2rem;
  }
  
  .no-howto-subtext {
    font-size: 1rem;
  }
  
  .btn-primary {
    padding: 5px 10px;
    font-size: 1.1rem;
    width: 100%;
  }
}
</style>