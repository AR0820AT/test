<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLockStore } from '@/stores/useLockStore'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
const WEEKS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const lock = useLockStore()
const code = ref('')
const wrong = ref(false)
const now = ref(new Date())

let ticker: ReturnType<typeof setInterval> | undefined

const timeText = computed(() => {
  const d = now.value
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
})

const dateText = computed(() => {
  const d = now.value
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKS[d.getDay()]}`
})

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

onMounted(() => {
  ticker = setInterval(() => {
    now.value = new Date()
  }, 15_000)
})

onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
})
</script>

<template>
  <div class="lock">
    <div class="glow" />

    <div class="top">
      <div class="time">{{ timeText }}</div>
      <div class="date">{{ dateText }}</div>
    </div>

    <div class="dots" :class="{ shake: wrong }">
      <span v-for="(filled, index) in dots" :key="index" :class="{ on: filled }" />
    </div>

    <p class="hint">{{ wrong ? '密码不对，再试一次' : '输入 4 位密码' }}</p>

    <div class="pad">
      <template v-for="(key, index) in KEYS" :key="index">
        <span v-if="!key" class="spacer" />
        <button v-else class="key" :class="{ fn: key === 'del' }" @click="press(key)">
          {{ key === 'del' ? '删除' : key }}
        </button>
      </template>
    </div>

    <p class="foot">锁屏只是挡住旁人，数据本身仍在本机浏览器里</p>
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
  padding: calc(var(--safe-top) + 56px) 24px calc(var(--safe-bottom) + 18px);
  background: linear-gradient(170deg, #12151d 0%, #1c2434 46%, #0c0f15 100%);
  color: #fff;
  overflow: hidden;
}

.glow {
  position: absolute;
  top: 6%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: var(--accent);
  filter: blur(90px);
  opacity: 0.3;
  pointer-events: none;
}

.top {
  text-align: center;
  margin-bottom: 42px;
}

.time {
  font-size: 62px;
  font-weight: 250;
  letter-spacing: 1px;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}

.date {
  margin-top: 4px;
  font-size: 14px;
  opacity: 0.75;
}

.dots {
  display: flex;
  gap: 18px;
  height: 14px;
}

.dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.65);
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

.hint {
  margin: 16px 0 0;
  font-size: 13px;
  min-height: 18px;
  color: rgba(255, 255, 255, 0.72);
}

.pad {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 20px;
  width: min(320px, 84vw);
}

.spacer {
  aspect-ratio: 1;
}

.key {
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 27px;
  font-weight: 300;
  transition: background 0.14s ease, transform 0.1s ease;
}

.key:active {
  background: rgba(255, 255, 255, 0.32);
  transform: scale(0.96);
}

.key.fn {
  font-size: 16px;
}

.foot {
  margin: 18px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
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
