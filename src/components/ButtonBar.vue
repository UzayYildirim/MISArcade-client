<template>
  <div class="button-bar" :class="{ 'button-bar--visible': isVisible }">
    <div class="button-bar__container">
      <button
        v-for="button in buttons"
        :key="button.id"
        @click="button.onClick"
        :disabled="button.disabled"
        :class="[
          'button-bar__button',
          `button-bar__button--${button.variant || 'default'}`,
          { 'button-bar__button--disabled': button.disabled }
        ]"
      >
        <span v-if="button.icon" class="button-bar__icon">{{ button.icon }}</span>
        <span class="button-bar__text">{{ button.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ButtonBarButton {
  id: string
  text: string
  icon?: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'
}

interface Props {
  buttons: ButtonBarButton[]
  isVisible?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.button-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--panel-bg); border-top: 2px solid var(--panel-border); z-index: 1000; transform: translateY(100%); transition: transform .3s ease; }
.button-bar--visible { transform: translateY(0); }
.button-bar__container { display: flex; width: 100%; max-width: 1200px; margin: 0 auto; padding: 16px 24px; gap: 12px; }
.button-bar__button { flex: 1; padding: 12px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; }
.button-bar__button--default { background: linear-gradient(135deg, var(--panel-bg), var(--panel-border)); color: var(--text-primary); border: 2px solid var(--panel-border); }
.button-bar__button--primary { background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple)); color: var(--dark-bg); border: 2px solid var(--neon-cyan); }
.button-bar__button--disabled { opacity: .5; cursor: not-allowed; }
</style>


