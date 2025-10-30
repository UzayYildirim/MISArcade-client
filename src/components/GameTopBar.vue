<template>
  <div class="game-top-bar">
    <div class="game-top-bar__container">
      <!-- Left side: Game Name -->
      <div class="game-top-bar__left">
        <h2 class="game-name">{{ gameName || 'Game' }}</h2>
      </div>
      
      <!-- Center: Empty for balance -->
      <div class="game-top-bar__center">
      </div>
      
      <!-- Right side: Code Gallery button -->
      <div class="game-top-bar__right">
        <button 
          @click="openCodeGallery" 
          class="code-gallery-button"
          :disabled="!hasCodeImages"
          title="See game code"
        >
          <span class="code-icon">💻</span>
          <span class="code-text">See Game Code</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  codeGalleryImages: string[]
  gameName?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openCodeGallery: []
}>()

const hasCodeImages = computed(() => {
  return props.codeGalleryImages && props.codeGalleryImages.length > 0
})

function openCodeGallery() {
  if (hasCodeImages.value) {
    emit('openCodeGallery')
  }
}
</script>

<style scoped>
.game-top-bar {
  position: static;
  width: 100%;
  margin-top: 16px;
  background: var(--panel-bg);
  border-bottom: 2px solid var(--panel-border);
  box-shadow: 0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1);
}

.game-top-bar__container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  margin: 0;
  padding: 8px 24px;
  min-height: 40px;
  gap: 20px;
}

.game-top-bar__left,
.game-top-bar__center,
.game-top-bar__right {
  display: flex;
  align-items: center;
}

.game-top-bar__left {
  justify-content: flex-start;
}

.game-top-bar__center {
  justify-content: center;
}

/* Game Name Styles */
.game-name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 1.4rem;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  margin: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}


/* Code Gallery Button Styles */
.code-gallery-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--neon-green), var(--neon-cyan));
  border: 2px solid var(--neon-green);
  border-radius: 8px;
  color: var(--dark-bg);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 255, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.code-gallery-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  transition: left 0.6s ease;
}

.code-gallery-button:hover::before {
  left: 100%;
}

.code-gallery-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 255, 0, 0.5);
  background: linear-gradient(135deg, #00ff00, var(--neon-cyan));
}

.code-gallery-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 255, 0, 0.4);
}

.code-gallery-button:disabled {
  background: linear-gradient(135deg, var(--darker-bg), var(--panel-bg));
  border-color: var(--panel-border);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.code-gallery-button:disabled::before {
  display: none;
}

.code-icon {
  font-size: 1.2rem;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
}

.code-text {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Responsive Design */
@media (max-width: 768px) {
  
  .game-top-bar__container {
    padding: 6px 16px;
    min-height: 35px;
    gap: 12px;
  }
  
  .code-gallery-button {
    padding: 6px 12px;
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .code-text {
    display: none;
  }
  
  .code-icon {
    font-size: 1.2rem;
  }
  
  .game-name {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  
  .game-top-bar__container {
    padding: 4px 12px;
    min-height: 30px;
    gap: 8px;
  }
  
  .code-gallery-button {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
  
  .code-icon {
    font-size: 1rem;
  }
  
  .game-name {
    font-size: 0.9rem;
  }
}
</style>
