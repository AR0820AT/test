<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { useChatStore } from '@/stores/useChatStore'
import { useUiStore } from '@/stores/useUiStore'
import { useQuoting } from '@/composables/useQuoting'
import type { Message } from '@/types'

interface MenuItem {
  key: 'quote' | 'copy' | 'recall' | 'delete'
  label: string
  icon: string
  danger?: boolean
}

const chat = useChatStore()
const ui = useUiStore()
const quoting = useQuoting()

const message = computed<Message | undefined>(() => {
  const id = ui.contextMenu?.messageId
  if (!id) return undefined
  return chat.messages.find((item) => item.id === id)
})

const items = computed<MenuItem[]>(() => {
  const target = message.value
  if (!target) return []
  const list: MenuItem[] = [{ key: 'quote', label: '引用', icon: 'quote' }]
  if (target.kind === 'text' && target.text) list.push({ key: 'copy', label: '复制', icon: 'copy' })
  if (!target.recalled) list.push({ key: 'recall', label: '撤回', icon: 'undo' })
  list.push({ key: 'delete', label: '删除', icon: 'trash', danger: true })
  return list
})

/** 贴着手指/鼠标弹出，并做边界收敛，避免超出屏幕 */
const style = computed(() => {
  const state = ui.contextMenu
  if (!state) return {}
  const width = 148
  const height = items.value.length * 42 + 12
  const left = Math.max(8, Math.min(state.x, window.innerWidth - width - 8))
  const top = Math.max(8, Math.min(state.y, window.innerHeight - height - 8))
  return { left: `${left}px`, top: `${top}px`, width: `${width}px` }
})

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    ui.toast('已复制')
  } catch {
    ui.toast('浏览器不允许复制，长按文字试试')
  }
}

function onPick(item: MenuItem): void {
  const target = message.value
  const id = ui.contextMenu?.messageId
  ui.closeContextMenu()
  if (!target || !id) return

  if (item.key === 'quote') {
    const ref = chat.quoteRefOf(id)
    if (ref) quoting.set(ref)
    return
  }
  if (item.key === 'copy') {
    void copyText(target.text ?? '')
    return
  }
  if (item.key === 'recall') {
    chat.recall(id)
    return
  }
  chat.remove(id)
}
</script>

<template>
  <div v-if="ui.contextMenu" class="ctx-root">
    <div class="mask" @click="ui.closeContextMenu()" @contextmenu.prevent="ui.closeContextMenu()" />
    <div class="menu" :style="style">
      <button
        v-for="item in items"
        :key="item.key"
        class="item"
        :class="{ danger: item.danger }"
        @click="onPick(item)"
      >
        <Icon :name="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ctx-root {
  position: fixed;
  inset: 0;
  z-index: 800;
}

.mask {
  position: absolute;
  inset: 0;
}

.menu {
  position: absolute;
  padding: 6px;
  border-radius: 12px;
  background: var(--surface-2);
  box-shadow: var(--shadow-lg);
  animation: pop-in 0.16s ease both;
}

.item {
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 15px;
}

.item:active {
  background: var(--accent-soft);
}

.item.danger {
  color: var(--danger);
}
</style>
