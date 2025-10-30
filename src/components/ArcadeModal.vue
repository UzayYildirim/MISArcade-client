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
              <div class="modal-icon" :class="type">
                <span class="icon-emoji">{{ iconEmoji }}</span>
                <div class="icon-glow"></div>
              </div>
              <div class="header-text">
                <h2 class="modal-title">{{ title }}</h2>
                <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
              </div>
            </div>
            <button 
              v-if="showCloseButton"
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
            <div class="message-content">
              <!-- Profile Card Layout -->
              <div v-if="showProfileCard" class="profile-card">
                <div class="profile-avatar">
                  <img 
                    v-if="userAvatar" 
                    :src="userAvatar" 
                    :alt="message || 'User Avatar'"
                    class="avatar-image"
                  />
                  <div v-else class="avatar-placeholder">
                    <span class="placeholder-icon">👤</span>
                  </div>
                  <div class="avatar-glow"></div>
                </div>
                <div class="profile-info">
                  <h3 class="profile-name">{{ message }}</h3>
                  <p class="profile-subtitle">Arcade Player</p>
                </div>
              </div>
              <!-- Regular Message Layout -->
              <p v-else-if="message" class="modal-message">{{ message }}</p>
              <div v-if="details" class="modal-details">
                <pre>{{ details }}</pre>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="button-group">
              <button 
                v-if="showCancelButton"
                @click="handleCancel" 
                class="btn-secondary"
                v-motion
                :initial="{ x: -20, opacity: 0 }"
                :enter="{ 
                  x: 0, 
                  opacity: 1,
                  transition: { delay: 300, type: 'spring', stiffness: 300 }
                }"
              >
                <span class="btn-text">{{ cancelText }}</span>
              </button>
              <button 
                @click="handleConfirm" 
                class="btn-primary"
                :class="type"
                v-motion
                :initial="{ x: 20, opacity: 0 }"
                :enter="{ 
                  x: 0, 
                  opacity: 1,
                  transition: { delay: 400, type: 'spring', stiffness: 300 }
                }"
              >
                <span class="btn-text">{{ confirmText }}</span>
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
import { computed } from 'vue'

interface Props {
  isVisible: boolean
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  subtitle?: string
  message?: string
  details?: string
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  userAvatar?: string
  showProfileCard?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancelButton: false,
  closeOnBackdrop: true,
  showCloseButton: true,
  showProfileCard: false
})

const emit = defineEmits<Emits>()

const iconEmoji = computed(() => {
  switch (props.type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'confirm': return '❓'
    default: return 'ℹ️'
  }
})

const closeModal = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  closeModal()
}

const handleCancel = () => {
  emit('cancel')
  closeModal()
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    closeModal()
  }
}
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
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
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
  border: 2px solid var(--panel-border);
  flex-shrink: 0;
}

.modal-icon.success {
  border-color: var(--neon-green);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
}

.modal-icon.error {
  border-color: var(--neon-pink);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}

.modal-icon.warning {
  border-color: var(--neon-yellow);
  box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
}

.modal-icon.confirm {
  border-color: var(--neon-orange);
  box-shadow: 0 0 20px rgba(255, 102, 0, 0.3);
}

.modal-icon.info {
  border-color: var(--neon-cyan);
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
  background: rgba(255, 255, 255, 0.1);
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
  padding: 32px 32px;
  max-height: 400px;
  overflow-y: auto;
}

.message-content {
  text-align: left;
}

.modal-message {
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.7;
  font-family: 'Rajdhani', sans-serif;
}

.modal-details {
  background: var(--darker-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.modal-details pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 1.1rem;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* Profile Card Styles */
.profile-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--darker-bg);
  border: 2px solid var(--panel-border);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(0, 255, 255, 0.1);
  transition: left 0.6s ease;
}

.profile-card:hover::before {
  left: 100%;
}

.profile-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 3px solid var(--neon-cyan);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--darker-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.placeholder-icon {
  font-size: 32px;
  color: var(--text-muted);
}

.avatar-glow {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--neon-cyan), var(--neon-purple), var(--neon-cyan));
  background-size: 400% 400%;
  animation: avatarGlow 3s ease-in-out infinite;
  z-index: -1;
}

@keyframes avatarGlow {
  0%, 100% { 
    background-position: 0% 50%;
    opacity: 0.6;
  }
  50% { 
    background-position: 100% 50%;
    opacity: 0.8;
  }
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-family: 'Orbitron', monospace;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--neon-cyan);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px var(--neon-cyan);
  background: linear-gradient(45deg, var(--neon-cyan), var(--neon-purple), var(--neon-green));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: profileNameGlow 3s ease-in-out infinite;
}

@keyframes profileNameGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.profile-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 32px 32px 32px;
  border-top: 1px solid var(--panel-border);
}

.button-group {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
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
}

.btn-primary {
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  color: var(--dark-bg);
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

/* Eye-catching animation for primary button */
.btn-primary {
  animation: modalPrimaryPulse 2.5s ease-in-out infinite;
}

.btn-primary::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    var(--neon-cyan), 
    var(--neon-purple), 
    var(--neon-cyan), 
    var(--neon-purple)
  );
  background-size: 400% 400%;
  border-radius: 12px;
  z-index: -1;
  animation: modalPrimaryGlow 3.5s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes modalPrimaryPulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
  }
  50% { 
    transform: scale(1.03);
    box-shadow: 0 6px 25px rgba(0, 255, 255, 0.5);
  }
}

@keyframes modalPrimaryGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary.success {
  background: linear-gradient(135deg, var(--neon-green), var(--neon-cyan));
  border-color: var(--neon-green);
  box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
}

.btn-primary.success {
  animation: modalSuccessFloat 3s ease-in-out infinite;
}

.btn-primary.success::after {
  background: linear-gradient(45deg, 
    var(--neon-green), 
    var(--neon-cyan), 
    var(--neon-green), 
    var(--neon-cyan)
  );
  animation: modalSuccessGlow 4s ease-in-out infinite;
}

@keyframes modalSuccessFloat {
  0%, 100% { 
    transform: translateY(0);
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
  }
  50% { 
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 0, 0.5);
  }
}

@keyframes modalSuccessGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary.error {
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-purple));
  border-color: var(--neon-pink);
  box-shadow: 0 4px 20px rgba(255, 0, 255, 0.3);
}

.btn-primary.error {
  animation: modalErrorShake 2s ease-in-out infinite;
}

.btn-primary.error::after {
  background: linear-gradient(45deg, 
    var(--neon-pink), 
    var(--neon-purple), 
    var(--neon-pink), 
    var(--neon-purple)
  );
  animation: modalErrorGlow 3s ease-in-out infinite;
}

@keyframes modalErrorShake {
  0%, 100% { 
    transform: translateX(0);
    box-shadow: 0 4px 20px rgba(255, 0, 255, 0.3);
  }
  25% { 
    transform: translateX(-1px);
    box-shadow: 0 5px 22px rgba(255, 0, 255, 0.4);
  }
  50% { 
    transform: translateX(1px);
    box-shadow: 0 6px 25px rgba(255, 0, 255, 0.5);
  }
  75% { 
    transform: translateX(-1px);
    box-shadow: 0 5px 22px rgba(255, 0, 255, 0.4);
  }
}

@keyframes modalErrorGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary.warning {
  background: linear-gradient(135deg, var(--neon-yellow), var(--neon-orange));
  border-color: var(--neon-yellow);
  box-shadow: 0 4px 20px rgba(255, 255, 0, 0.3);
}

.btn-primary.warning {
  animation: modalWarningBounce 2.5s ease-in-out infinite;
}

.btn-primary.warning::after {
  background: linear-gradient(45deg, 
    var(--neon-yellow), 
    var(--neon-orange), 
    var(--neon-yellow), 
    var(--neon-orange)
  );
  animation: modalWarningGlow 3.5s ease-in-out infinite;
}

@keyframes modalWarningBounce {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(255, 255, 0, 0.3);
  }
  50% { 
    transform: scale(1.02);
    box-shadow: 0 6px 25px rgba(255, 255, 0, 0.5);
  }
}

@keyframes modalWarningGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary.confirm {
  background: linear-gradient(135deg, var(--neon-orange), var(--neon-yellow));
  border-color: var(--neon-orange);
  box-shadow: 0 4px 20px rgba(255, 102, 0, 0.3);
}

.btn-primary.confirm {
  animation: modalConfirmPulse 2s ease-in-out infinite;
}

.btn-primary.confirm::after {
  background: linear-gradient(45deg, 
    var(--neon-orange), 
    var(--neon-yellow), 
    var(--neon-orange), 
    var(--neon-yellow)
  );
  animation: modalConfirmGlow 3s ease-in-out infinite;
}

@keyframes modalConfirmPulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(255, 102, 0, 0.3);
  }
  50% { 
    transform: scale(1.04);
    box-shadow: 0 8px 30px rgba(255, 102, 0, 0.5);
  }
}

@keyframes modalConfirmGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 255, 255, 0.5);
}

.btn-primary.success:hover {
  box-shadow: 0 8px 30px rgba(0, 255, 0, 0.5);
}

.btn-primary.error:hover {
  box-shadow: 0 8px 30px rgba(255, 0, 255, 0.5);
}

.btn-primary.warning:hover {
  box-shadow: 0 8px 30px rgba(255, 255, 0, 0.5);
}

.btn-primary.confirm:hover {
  box-shadow: 0 8px 30px rgba(255, 102, 0, 0.5);
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
    margin: 20px;
  }
  
  .modal-header {
    padding: 24px 24px 16px 24px;
  }
  
  .modal-body {
    padding: 24px 24px;
  }
  
  .modal-footer {
    padding: 16px 24px 24px 24px;
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
  
  .modal-message {
    font-size: 1.2rem;
  }
  
  .profile-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 20px;
  }
  
  .profile-avatar {
    width: 70px;
    height: 70px;
  }
  
  .profile-name {
    font-size: 1.5rem;
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
    padding: 20px 20px;
  }
  
  .modal-footer {
    padding: 12px 20px 20px 20px;
  }
  
  .modal-title {
    font-size: 1.6rem;
  }
  
  .modal-message {
    font-size: 1.1rem;
  }
  
  .modal-icon {
    width: 48px;
    height: 48px;
  }
  
  .icon-emoji {
    font-size: 24px;
  }
  
  .profile-card {
    padding: 16px;
    gap: 12px;
  }
  
  .profile-avatar {
    width: 60px;
    height: 60px;
  }
  
  .profile-name {
    font-size: 1.3rem;
  }
  
  .profile-subtitle {
    font-size: 1rem;
  }
}
</style>