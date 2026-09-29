<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useLockStore } from '@/stores/useLockStore'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

const lock = useLockStore()
const code = ref('')
const wrong = ref(false)

const dots = computed(() => Array.from({ length: 4 }, (_, index) => index < code.value.length))

function submit(): void {
  if (lock.tryUnlock(code.value)) return
  wrong.value = true
  if (navigator.vibrate) navigator.vibrate(28)
  window.setTimeout(() => {
    code.value = ''
    wrong.value = false
  }, 420)
}

function press(key: string): void {
  if (wrong.value) return
  if (key === 'del') {
    code.value = code.value.slice(0, -1)
    return
  }
  if (!key || code.value.length >= 4) return
  code.value += key
  if (code.value.length === 4) window.setTimeout(submit, 150)
}
</script>

<template>
  <div class="lock">
    <div class="glow" />

    <div class="dots" :class="{ shake: wrong }">
      <span v-for="(filled, index) in dots" :key="index" :class="{ on: filled }" />
    </div>

    <div class="pad">
      <template v-for="(key, index) in KEYS" :key="index">
        <span v-if="!key" class="spacer" />
        <button v-else class="key" :class="{ fn: key === 'del' }" :aria-label="key === 'del' ? '删除' : key" @click="press(key)">
          <Icon v-if="key === 'del'" name="undo" :size="22" />
          <template v-else>{{ key }}</template>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.lock {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--safe-top) + 12vh) 24px calc(var(--safe-bottom) + 18px);
  background: radial-gradient(120% 80% at 50% 0%, #2a0d12 0%, #12080a 45%, #070405 100%);
  color: #fff;
  overflow: hidden;
}

.glow {
  position: absolute;
  top: 4%;
  width: 60vw;
  height: 60vw;
  max-width: 320px;
  max-height: 320px;
  border-radius: 50%;
  background: var(--accent);
  filter: blur(90px);
  opacity: 0.28;
  pointer-events: none;
}

.dots {
  display: flex;
  gap: 18px;
  height: 14px;
  margin-top: auto;
}

.dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.55);
  transition: background 0.14s ease, transform 0.14s ease;
}

.dots span.on {
  background: #fff;
  border-color: #fff;
  transform: scale(1.08);
}

.dots.shake {
  animation: shake 0.4s ease;
}

.pad {
  margin: auto auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 20px;
  width: min(320px, 84vw, 62vh);
}

.spacer {
  aspect-ratio: 1;
}

.key {
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 27px;
  font-weight: 300;
  transition: background 0.14s ease, transform 0.1s ease;
}

.key:active {
  background: rgba(255, 255, 255, 0.24);
  transform: scale(0.96);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-10px);
  }
  40% {
    transform: translateX(9px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(4px);
  }
}
</style>
