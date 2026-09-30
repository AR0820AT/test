<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useLockStore } from '@/stores/useLockStore'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

const lock = useLockStore()
const code = ref('')
const wrong = ref(false)

const dots = computed(() => Array.from({ length: 4 }, (_, index) => index < code.value.length))

let wrongTimer = 0

/** 清空并结束「错误抖动」状态 */
function resetWrong(): void {
  window.clearTimeout(wrongTimer)
  code.value = ''
  wrong.value = false
}

function submit(): void {
  if (lock.tryUnlock(code.value)) return
  wrong.value = true
  if (navigator.vibrate) navigator.vibrate(28)
  wrongTimer = window.setTimeout(resetWrong, 420)
}

function press(key: string): void {
  // 上一组错了正在抖动：直接开始新的一组，不把手上这一下丢掉
  if (wrong.value) resetWrong()
  if (key === 'del') {
    code.value = code.value.slice(0, -1)
    return
  }
  if (!key || code.value.length >= 4) return
  code.value += key
  if (code.value.length === 4) {
    // 让第 4 个圆点先画出来再校验：两帧约 33ms，原来的 150ms 会明显拖慢手感
    requestAnimationFrame(() => requestAnimationFrame(submit))
  }
}

/** 最近一次由按下指针触发的输入时间，用来避免同一次点按被 click 再算一遍 */
let lastPointerAt = 0

/** 手指按下的瞬间就响应；click 在 iOS 上要多等一拍，还可能被缩放逻辑吞掉 */
function onPointerDown(key: string): void {
  lastPointerAt = Date.now()
  press(key)
}

/** 键盘操作（Enter/空格）和不支持指针事件的浏览器兜底 */
function onClick(key: string): void {
  if (Date.now() - lastPointerAt < 700) return
  press(key)
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
        <button
          v-else
          type="button"
          class="key"
          :class="{ fn: key === 'del' }"
          :aria-label="key === 'del' ? '删除' : key"
          @pointerdown="onPointerDown(key)"
          @click="onClick(key)"
        >
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
  color: #fff;
  /* 数字用宋体字形，避免花体导致认错键 */
  font-family: var(--font-zh);
  font-size: 28px;
  font-weight: 500;
  /* 数字键不加毛玻璃：12 层 backdrop-filter 在手机上很吃合成，点按会明显发钝 */
  transition: background 0.14s ease, transform 0.1s ease;
  /* 连点不选中、不弹长按菜单，也不用等浏览器的双击判定 */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}

.key:active {
  background: rgba(255, 255, 255, 0.24);
  transform: scale(0.96);
}

/* 浅色主题：锁屏跟着换成白蓝，不再一直是深色 */
html[data-theme='light'] .lock {
  background: radial-gradient(120% 80% at 50% 0%, #ffffff 0%, #eaf1fb 45%, #dce7f8 100%);
  color: #16233a;
}

html[data-theme='light'] .dots span {
  border-color: rgba(20, 45, 90, 0.35);
}

html[data-theme='light'] .dots span.on {
  background: var(--accent);
  border-color: var(--accent);
}

html[data-theme='light'] .key {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(20, 45, 90, 0.12);
  color: #16233a;
}

html[data-theme='light'] .key:active {
  background: rgba(47, 111, 208, 0.16);
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
