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
</script>

<template>
  <div class="app">
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

.lock-enter-active,
.lock-leave-active {
  transition: opacity 0.28s ease;
}

.lock-enter-from,
.lock-leave-to {
  opacity: 0;
}
</style>
