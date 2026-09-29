<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useTheme } from '@/composables/useTheme'
import { usePresenceStore } from '@/stores/usePresenceStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUiStore } from '@/stores/useUiStore'

const profile = useProfileStore()
const presence = usePresenceStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { isDark } = useTheme()

const themName = computed(() => profile.side('them').nickname || 'S')

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
      <h1>
        <i
          class="dot"
          :class="{ on: presence.themOnline }"
          :title="presence.themOnline ? '在线' : '离线'"
          :aria-label="presence.themOnline ? '在线' : '离线'"
        />
        <span class="nick">{{ themName }}</span>
      </h1>
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

/* 在线状态：名字左边一个呼吸的小圆点，不写字 */
.dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-3);
  opacity: 0.6;
}

/* 在线：芯色 + 外发光，带一次很轻的呼吸 */
.dot.on {
  background: var(--online);
  opacity: 1;
  box-shadow:
    0 0 0 2px var(--online-glow),
    0 0 7px 1px var(--online-glow);
  animation: online-breathe 2.6s ease-in-out infinite;
}

@keyframes online-breathe {
  0%,
  100% {
    box-shadow:
      0 0 0 2px var(--online-glow),
      0 0 6px 1px var(--online-glow);
  }
  50% {
    box-shadow:
      0 0 0 3px var(--online-glow),
      0 0 12px 2px var(--online-glow);
  }
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-display);
  font-size: calc(var(--fs-base) + 4px);
  font-weight: 500;
  letter-spacing: 0.4px;
}

.nick {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
