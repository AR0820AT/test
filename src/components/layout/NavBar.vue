<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
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

</script>

<template>
  <header class="nav frost">
    <button class="icon-btn" aria-label="打开设置" @click="ui.openDrawer('menu')">
      <Icon name="menu" />
    </button>

    <div class="title">
      <h1>{{ themName }}</h1>
    </div>

    <button class="icon-btn" aria-label="切换主题" @click="toggleTheme">
      <Icon :name="isDark ? 'sun' : 'moon'" />
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
  font-family: var(--font-display);
  font-size: calc(var(--fs-base) + 4px);
  font-weight: 500;
  letter-spacing: 0.4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
