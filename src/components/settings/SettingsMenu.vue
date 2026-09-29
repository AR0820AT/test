<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { brain } from '@/engine/brain'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useLockStore } from '@/stores/useLockStore'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore, type SettingsTab } from '@/stores/useUiStore'

const ui = useUiStore()
const chat = useChatStore()
const cardStore = useCardStore()
const stickerStore = useStickerStore()
const lock = useLockStore()

function lockScreen(): void {
  lock.lock()
  ui.closeDrawer()
  ui.toast('已锁定')
}

interface Entry {
  key: SettingsTab
  icon: string
  title: string
  desc: string
}

const entries = computed<Entry[]>(() => [
  { key: 'profile', icon: 'user', title: '人物资料', desc: '两边的昵称与头像' },
  { key: 'cards', icon: 'cards', title: '字卡库', desc: `${cardStore.totalCards} 张字卡，可分组与加权` },
  { key: 'stickers', icon: 'smile', title: '表情包', desc: `${stickerStore.stickers.length} 个自定义表情` },
  { key: 'reply', icon: 'sliders', title: '对话节奏', desc: '回复延迟、主动发言、抽卡方式' },
  { key: 'appearance', icon: 'moon', title: '外观', desc: '主题、强调色、气泡样式' },
  { key: 'data', icon: 'database', title: '数据管理', desc: `${chat.messages.length} 条消息，备份与恢复` },
])
</script>

<template>
  <div class="panel">
    <section class="section">
      <button v-for="entry in entries" :key="entry.key" class="entry" @click="ui.setTab(entry.key)">
        <span class="ico"><Icon :name="entry.icon" :size="20" /></span>
        <span class="text">
          <span class="name">{{ entry.title }}</span>
          <span class="desc">{{ entry.desc }}</span>
        </span>
        <Icon name="right" :size="18" />
      </button>
    </section>

    <button class="btn primary block" @click="brain.drawNow()">让对方立刻抽一张字卡</button>
    <button class="btn block" @click="lockScreen()">立即锁定屏幕</button>

    <p class="muted">
      所有数据只保存在这台设备的浏览器里，不会上传。清理浏览器数据前记得先去「数据管理」导出备份。
    </p>
  </div>
</template>

<style scoped>
.entry {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.entry:last-child {
  border-bottom: none;
}

.entry:active {
  background: var(--accent-soft);
}

.ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent);
  flex: none;
}

.text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 15px;
}

.desc {
  font-size: 12px;
  color: var(--text-2);
  margin-top: 1px;
}
</style>
