<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import { estimateSize } from '@/storage/persist'
import { downloadText, exportBackup, importBackup, wipeAll } from '@/storage/backup'

const chat = useChatStore()
const cardStore = useCardStore()
const stickerStore = useStickerStore()
const ui = useUiStore()

const fileInput = ref<HTMLInputElement | null>(null)
const confirmWipe = ref(false)

const sizeKb = computed(() => Math.max(1, Math.round(estimateSize() / 1024)))

async function exportData(): Promise<void> {
  const text = await exportBackup()
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`card-chat-${stamp}.json`, text)
  ui.toast('备份已导出')
}

async function importData(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    await importBackup(await file.text())
    ui.toast('导入成功，正在刷新…')
    setTimeout(() => window.location.reload(), 700)
  } catch {
    ui.toast('读不出来，确认是本应用导出的备份')
  }
}

async function wipe(): Promise<void> {
  if (!confirmWipe.value) {
    confirmWipe.value = true
    ui.toast('再点一次「确认清空」就真的没了')
    return
  }
  await wipeAll()
  window.location.reload()
}

function clearChat(): void {
  if (!chat.messages.length) {
    ui.toast('聊天已经是空的')
    return
  }
  if (window.confirm(`清空 ${chat.messages.length} 条聊天记录？`)) {
    chat.clear()
    ui.toast('聊天记录已清空')
  }
}
</script>

<template>
  <div class="panel">
    <section class="section">
      <div class="sec-title">当前数据</div>
      <div class="stats">
        <div class="stat">
          <strong>{{ chat.messages.length }}</strong>
          <span>条消息</span>
        </div>
        <div class="stat">
          <strong>{{ cardStore.totalCards }}</strong>
          <span>张字卡</span>
        </div>
        <div class="stat">
          <strong>{{ stickerStore.stickers.length }}</strong>
          <span>个表情</span>
        </div>
        <div class="stat">
          <strong>{{ sizeKb }} KB</strong>
          <span>配置占用</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">备份与恢复</div>
      <div class="sec-body">
        <button class="btn block" @click="exportData">导出备份（含图片）</button>
        <button class="btn block" @click="fileInput?.click()">从备份导入</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="importData" />
        <p class="muted">导入会覆盖当前全部数据，导入后会自动刷新页面。</p>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">清理</div>
      <div class="sec-body">
        <button class="btn block" @click="clearChat">只清空聊天记录</button>
        <button class="btn block danger" @click="wipe">
          {{ confirmWipe ? '确认清空全部数据' : '清空全部数据' }}
        </button>
        <p class="muted">清空后无法恢复，建议先导出备份。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sec-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 12px 8px 14px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat strong {
  font-size: 17px;
  font-variant-numeric: tabular-nums;
}

.stat span {
  font-size: 11px;
  color: var(--text-2);
}
</style>
