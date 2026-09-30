<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue'
import { brain } from '@/engine/brain'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { FONT_SCALES, useSettingsStore } from '@/stores/useSettingsStore'
import { useLockStore } from '@/stores/useLockStore'
import { useTheme } from '@/composables/useTheme'
import { loadFonts } from '@/utils/fonts'
import NavBar from '@/components/layout/NavBar.vue'
import ChatView from '@/components/chat/ChatView.vue'
import SettingsDrawer from '@/components/settings/SettingsDrawer.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import LockScreen from '@/components/lock/LockScreen.vue'
import Splash from '@/components/common/Splash.vue'

const settings = useSettingsStore()
const presence = usePresenceStore()
const lock = useLockStore()
const { isDark } = useTheme()

let started = false

function applyTheme(): void {
  const dark = isDark.value
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#0b0708' : '#eef3fb')
}

watchEffect(applyTheme)

// 解锁后才启动抽卡引擎，锁屏期间不会偷偷弹消息
watchEffect(() => {
  if (lock.unlocked && !started) {
    started = true
    presence.start()
    brain.start()
  }
})

// 对方上下线变化时，主动消息的排程跟着变（离线就不再主动找你）
watch(
  () => presence.themOnline,
  () => {
    if (started) brain.restartProactive()
  },
)

/** #rrggbb → rgba(r, g, b, alpha)：强调色要拿来做柔光 */
function withAlpha(hex: string, alpha: number): string {
  const int = Number.parseInt(hex.replace('#', ''), 16)
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

// 深色用设置里选的强调色；浅色走 tokens 里的蓝色，避免红配白太跳
// 聚焦发光也跟着强调色走，这样输入框发的光永远是同一个色系
watchEffect(() => {
  const root = document.documentElement
  const keys = ['--accent', '--focus-ring', '--focus-inner']
  if (!isDark.value) {
    keys.forEach((key) => root.style.removeProperty(key))
    return
  }
  root.style.setProperty('--accent', settings.ui.accent)
  root.style.setProperty('--focus-ring', withAlpha(settings.ui.accent, 0.42))
  root.style.setProperty('--focus-inner', withAlpha(settings.ui.accent, 0.24))
})

// 切到后台（回到桌面、切走标签页）就重新上锁，再进来要重新输一次密码
document.addEventListener('visibilitychange', () => {
  if (document.hidden) lock.lock()
})

watchEffect(() => {
  document.documentElement.dataset.anim = settings.ui.animations ? 'on' : 'off'
})

watchEffect(() => {
  document.documentElement.dataset.glass = settings.ui.glass ? 'on' : 'off'
})

// 字号档位 → 正文基准字号，其余字号都由它派生
watchEffect(() => {
  const scale = FONT_SCALES.find((item) => item.value === settings.ui.fontScale) ?? FONT_SCALES[1]
  document.documentElement.style.setProperty('--fs-base', `${scale.px}px`)
})

// 字体全部下载完毕（带进度）才放行锁屏，期间显示毛玻璃进度条
const booting = ref(true)
const progress = ref(0)
const fontFailed = ref(false)

onMounted(async () => {
  const startedAt = performance.now()
  // 最坏情况兜底：20s 内没加载完也照常进，别卡在启动页（此时用系统字体）
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 20000))
  await Promise.race([
    loadFonts((pct) => {
      progress.value = pct
    }).catch((error) => {
      fontFailed.value = true
      console.warn('[card-chat] 字体加载失败，用系统字体兜底', error)
    }),
    timeout,
  ])
  // 至少显示 1.2s：否则加载失败时会一闪而过，用户根本看不到进度条
  const elapsed = performance.now() - startedAt
  if (elapsed < 1200) {
    await new Promise((resolve) => window.setTimeout(resolve, 1200 - elapsed))
  }
  booting.value = false
})
</script>

<template>
  <div class="app">
    <!-- 背景光斑：毛玻璃需要有东西可以模糊 -->
    <div class="aurora" aria-hidden="true">
      <span class="blob blob-a" />
      <span class="blob blob-b" />
      <span class="blob blob-c" />
    </div>

    <template v-if="lock.unlocked">
      <NavBar />
      <ChatView />
      <SettingsDrawer />
    </template>

    <transition name="lock">
      <LockScreen v-if="!lock.unlocked" />
    </transition>

    <ToastHost />
    <Splash v-if="booting" :progress="progress" :failed="fontFailed" />
  </div>
</template>

<style scoped>
.app {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow: hidden;
}

.aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.55;
}

.blob-a {
  top: -14vh;
  left: -12vw;
  width: 62vw;
  height: 62vw;
  background: var(--accent);
  animation: drift-a 22s ease-in-out infinite alternate;
}

.blob-b {
  bottom: -18vh;
  right: -14vw;
  width: 58vw;
  height: 58vw;
  background: #7a1220;
  opacity: 0.5;
  animation: drift-b 26s ease-in-out infinite alternate;
}

.blob-c {
  top: 32vh;
  right: -20vw;
  width: 46vw;
  height: 46vw;
  background: #2b0a12;
  opacity: 0.6;
  animation: drift-a 30s ease-in-out infinite alternate-reverse;
}

html[data-theme='dark'] .blob {
  opacity: 0.34;
}

/* 浅色：背景光斑换成蓝调，跟白底搭 */
html[data-theme='light'] .blob {
  opacity: 0.4;
}

html[data-theme='light'] .blob-b {
  background: #7fa9e8;
}

html[data-theme='light'] .blob-c {
  background: #c3d8f7;
  opacity: 0.55;
}

html[data-glass='off'] .aurora {
  display: none;
}

@keyframes drift-a {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(8vw, 6vh, 0) scale(1.12);
  }
}

@keyframes drift-b {
  from {
    transform: translate3d(0, 0, 0) scale(1.1);
  }
  to {
    transform: translate3d(-7vw, -5vh, 0) scale(1);
  }
}

.lock-enter-active,
.lock-leave-active {
  transition: opacity 0.28s ease;
}

.lock-enter-from,
.lock-leave-to {
  opacity: 0;
}
</style>
