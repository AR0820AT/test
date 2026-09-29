<script setup lang="ts">
import { watchEffect } from 'vue'
import { brain } from '@/engine/brain'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLockStore } from '@/stores/useLockStore'
import { useTheme } from '@/composables/useTheme'
import NavBar from '@/components/layout/NavBar.vue'
import ChatView from '@/components/chat/ChatView.vue'
import SettingsDrawer from '@/components/settings/SettingsDrawer.vue'
import CtxMenu from '@/components/common/CtxMenu.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import LockScreen from '@/components/lock/LockScreen.vue'

const settings = useSettingsStore()
const lock = useLockStore()
const { isDark } = useTheme()

let started = false

function applyTheme(): void {
  const dark = isDark.value
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17181b' : '#ededed')
}

watchEffect(applyTheme)

// 解锁后才启动抽卡引擎，锁屏期间不会偷偷弹消息
watchEffect(() => {
  if (lock.unlocked && !started) {
    started = true
    brain.start()
  }
})

watchEffect(() => {
  document.documentElement.style.setProperty('--accent', settings.ui.accent)
})

watchEffect(() => {
  document.documentElement.dataset.anim = settings.ui.animations ? 'on' : 'off'
})

watchEffect(() => {
  document.documentElement.dataset.glass = settings.ui.glass ? 'on' : 'off'
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
      <CtxMenu />
    </template>

    <transition name="lock">
      <LockScreen v-if="!lock.unlocked" />
    </transition>

    <ToastHost />
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
  background: #7c5cff;
  opacity: 0.42;
  animation: drift-b 26s ease-in-out infinite alternate;
}

.blob-c {
  top: 32vh;
  right: -20vw;
  width: 46vw;
  height: 46vw;
  background: #23b3d8;
  opacity: 0.35;
  animation: drift-a 30s ease-in-out infinite alternate-reverse;
}

html[data-theme='dark'] .blob {
  opacity: 0.34;
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
