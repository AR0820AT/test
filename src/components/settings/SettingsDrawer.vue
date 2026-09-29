<script setup lang="ts">
import { computed, type Component } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useUiStore, type SettingsTab } from '@/stores/useUiStore'
import SettingsMenu from './SettingsMenu.vue'
import ProfilePanel from './ProfilePanel.vue'
import CardsPanel from './CardsPanel.vue'
import StickersPanel from './StickersPanel.vue'
import ReplyPanel from './ReplyPanel.vue'
import AppearancePanel from './AppearancePanel.vue'
import DataPanel from './DataPanel.vue'

interface PanelDef {
  title: string
  comp: Component
}

const ui = useUiStore()

const PANELS: Record<SettingsTab, PanelDef> = {
  menu: { title: '设置', comp: SettingsMenu },
  profile: { title: '人物资料', comp: ProfilePanel },
  cards: { title: '字卡库', comp: CardsPanel },
  stickers: { title: '表情包', comp: StickersPanel },
  reply: { title: '对话节奏', comp: ReplyPanel },
  appearance: { title: '外观', comp: AppearancePanel },
  data: { title: '数据管理', comp: DataPanel },
}

const current = computed(() => PANELS[ui.tab])
</script>

<template>
  <div v-if="ui.drawerOpen" class="root">
    <div class="mask" @click="ui.closeDrawer()" />

    <aside class="drawer">
      <header class="head">
        <button v-if="ui.tab !== 'menu'" class="icon-btn-sm" aria-label="返回" @click="ui.setTab('menu')">
          <Icon name="back" :size="20" />
        </button>
        <h2>{{ current.title }}</h2>
        <button class="icon-btn-sm" aria-label="关闭" @click="ui.closeDrawer()">
          <Icon name="close" :size="20" />
        </button>
      </header>

      <div class="body no-scrollbar">
        <component :is="current.comp" />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.root {
  position: fixed;
  inset: 0;
  z-index: 700;
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  animation: fade-in 0.2s ease both;
}

.drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(92vw, 420px);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  animation: slide-in-right 0.24s ease both;
}

.head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  height: calc(var(--nav-height) + var(--safe-top));
  padding: var(--safe-top) 8px 0;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--border);
}

h2 {
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
