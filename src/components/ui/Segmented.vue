<script setup lang="ts" generic="T extends string">
interface Option {
  label: string
  value: T
}

const props = defineProps<{ modelValue: T; options: Option[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="seg">
    <button
      v-for="option in props.options"
      :key="option.value"
      class="item"
      :class="{ active: option.value === props.modelValue }"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: flex;
  padding: 2px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.item {
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-2);
  transition: background 0.18s ease, color 0.18s ease;
}

.item.active {
  background: var(--accent);
  color: var(--accent-contrast);
}
</style>
