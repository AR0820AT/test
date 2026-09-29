<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle(): void {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="switch"
    :class="{ on: modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="toggle"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.switch {
  width: 46px;
  height: 28px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  padding: 2px;
  display: flex;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.switch.on {
  background: var(--accent);
  border-color: transparent;
}

.knob {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.switch.on .knob {
  transform: translateX(18px);
}
</style>
