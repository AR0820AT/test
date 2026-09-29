<script setup lang="ts">
import Avatar from '@/components/common/Avatar.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()
</script>

<template>
  <div class="row">
    <Avatar role="them" :size="40" />
    <div class="bubble" :class="{ tail: settings.ui.bubbleTail }">
      <i /><i /><i />
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 8px;
  padding: 3px 12px;
  animation: fade-up 0.2s ease both;
}

.bubble {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
  border-radius: var(--bubble-radius);
  background: var(--bubble-them);
  box-shadow: var(--shadow-sm);
}

.bubble.tail::before {
  content: '';
  position: absolute;
  top: 14px;
  left: -5px;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: rotate(45deg);
  border-radius: 2px;
}

i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-2);
  animation: dots 1.2s infinite ease-in-out;
}

i:nth-child(2) {
  animation-delay: 0.15s;
}

i:nth-child(3) {
  animation-delay: 0.3s;
}
</style>
