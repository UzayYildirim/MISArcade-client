<template>
  <div class="ticket-won-toast-content">
    <i class="fas fa-ticket-alt ticket-icon"></i>
    <span class="toast-text">You won</span>
    <span class="ticket-number">{{ ticketAmount }}</span>
    <span class="toast-text">ticket{{ ticketAmount === 1 ? '' : 's' }}! Total: {{ totalTickets }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  ticketAmount: number
  totalTickets: number
}

defineProps<Props>()
</script>

<style scoped>
.ticket-won-toast-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.6em;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.ticket-icon {
  color: var(--neon-green);
  font-size: 2em;
}

.ticket-number {
  font-size: 2.2em;
  font-weight: 700;
  color: var(--neon-yellow);
  display: inline-block;
  margin: 0 8px;
  padding: 4px 12px;
  background: rgba(255, 255, 0, 0.1);
  border-radius: 6px;
  border: 1px solid var(--neon-yellow);
}

.toast-text {
  font-size: 1.1em;
  font-weight: 600;
}
</style>
