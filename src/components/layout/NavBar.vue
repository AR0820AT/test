<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { brain } from '@/engine/brain'
import { useTheme } from '@/composables/useTheme'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

const profile = useProfileStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { isDark } = useTheme()

const themName = computed(() => profile.side('them').nickname || '对方')

function toggleTheme(): void {
  settings.updateUi({ theme: isDark.value ? 'light' : 'dark' })
  ui.toast(isDark.value ? '已切换到浅色' : '已切换到深色')
}

function togglePause(): void {
  const next = !settings.settings.paused
  settings.update({ paused: next })
  ui.toast(next ? '已暂停自动回复' : '已恢复自动回复')
  // 恢复时重新计算主动消息时间
  if (!next) brain.restartProactive()
}
</script>

<template>
  <header class="nav frost">
    <button class="icon-btn" aria-label="打开设置" @click="ui.openDrawer('menu')">
      <Icon name="menu" />
    </button>

    <div class="title">
      <h1>{{ themName }}</h1>
      <span v-if="settings.settings.paused" class="status paused">已暂停</span>
    </div>

    <button class="icon-btn" aria-label="切换主题" @click="toggleTheme">
      <Icon :name="isDark ? 'sun' : 'moon'" />
    </button>
    <button class="icon-btn" aria-label="暂停或恢复自动回复" @click="togglePause">
      <Icon :name="settings.settings.paused ? 'play' : 'pause'" />
    </button>
  </header>
</template>

<style scoped>
.nav {
  flex: none;
  height: calc(var(--nav-height) + var(--safe-top));
  padding: var(--safe-top) 6px 0;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--glass-border);
  z-index: 20;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--text);
  transition: background 0.18s ease;
}

.icon-btn:active {
  background: var(--accent-soft);
  color: var(--accent);
}

.title {
  flex: 1;
  text-align: center;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  display: block;
  font-size: 11px;
  color: var(--text-2);
  margin-top: -1px;
}

.status.paused {
  color: var(--danger);
}
</style>
