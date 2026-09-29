<script setup lang="ts">
import { useProfileStore } from '@/stores/useProfileStore'

const profile = useProfileStore()
</script>

<template>
  <div class="row">
    <div class="stack">
      <div class="who">{{ profile.nameOf('them') }}</div>
      <div class="bubble">
        <i /><i /><i />
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  padding: 3px 12px;
  animation: fade-up 0.2s ease both;
}

.stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.who {
  margin: 0 4px 3px;
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  letter-spacing: 0.04em;
  color: var(--text-3);
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
