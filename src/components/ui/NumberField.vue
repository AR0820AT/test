<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: number; min?: number; max?: number; step?: number; suffix?: string }>(),
  { min: 0, max: 999, step: 1, suffix: '' },
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function commit(event: Event): void {
  const raw = Number((event.target as HTMLInputElement).value)
  if (Number.isNaN(raw)) return
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, raw)))
}
</script>

<template>
  <label class="field">
    <input type="number" :value="modelValue" :min="min" :max="max" :step="step" @change="commit" />
    <span v-if="suffix" class="suffix">{{ suffix }}</span>
  </label>
</template>

<style scoped>
.field {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

input {
  width: 62px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--input-bg);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.suffix {
  font-size: 12px;
  color: var(--text-2);
}
</style>
