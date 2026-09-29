<script setup lang="ts">
withDefaults(defineProps<{ label: string; hint?: string }>(), { hint: '' })
</script>

<template>
  <div class="row">
    <div class="text">
      <div class="label">{{ label }}</div>
      <div v-if="hint" class="hint">{{ hint }}</div>
    </div>
    <div class="control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.row:last-child {
  border-bottom: none;
}

.text {
  flex: 1;
  min-width: 0;
}

.label {
  font-size: 15px;
}

.hint {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.35;
}

.control {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>
