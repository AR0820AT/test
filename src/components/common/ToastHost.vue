<script setup lang="ts">
import { useUiStore } from '@/stores/useUiStore'

const ui = useUiStore()
</script>

<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div v-for="item in ui.toasts" :key="item.id" class="toast">{{ item.text }}</div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 0;
  right: 0;
  top: calc(var(--nav-height) + var(--safe-top) + 12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 900;
}

.toast {
  max-width: 80vw;
  padding: 9px 16px;
  border-radius: 999px;
  background: rgba(20, 20, 24, 0.86);
  color: #fff;
  font-size: 13px;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
