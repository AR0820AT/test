<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCardStore } from '@/stores/useCardStore'
import { useChatStore } from '@/stores/useChatStore'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import { clearAssets } from '@/storage/assets'
import { estimateSize } from '@/storage/persist'
import { chineseFontStatus, type FontStatus } from '@/utils/fonts'

const chat = useChatStore()
const cardStore = useCardStore()
const stickerStore = useStickerStore()
const ui = useUiStore()

const confirmWipe = ref(false)

const sizeKb = computed(() => Math.max(1, Math.round(estimateSize() / 1024)))

/** 中文有没有真的用上思源宋体：显示出来方便排查手机上的字体问题 */
const fontStatus = ref<FontStatus>('loading')
onMounted(async () => {
  fontStatus.value = await chineseFontStatus()
})

/** 清空聊天与表情：字卡库、双方昵称和所有设置都保留 */
async function wipe(): Promise<void> {
  if (!confirmWipe.value) {
    confirmWipe.value = true
    ui.toast('再点一次「确认清空」就真的没了')
    return
  }
  chat.clear()
  await stickerStore.clear()
  await clearAssets()
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
      <div class="sec-title">清理</div>
      <div class="sec-body">
        <button class="btn block" @click="clearChat">只清空聊天记录</button>
        <button class="btn block danger" @click="wipe">
          {{ confirmWipe ? '确认清空聊天与表情包' : '清空聊天与表情包' }}
        </button>
        <p class="muted">字卡库、双方昵称和全部设置都会保留。清空后无法恢复。</p>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">字体</div>
      <div class="sec-body">
        <p class="muted">
          中文字体：{{
            fontStatus === 'loaded'
              ? '思源宋体（自托管，正常）'
              : fontStatus === 'loading'
                ? '还在下载…'
                : '没加载到，当前显示的是系统字体'
          }}
        </p>
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
  font-size: var(--fs-lg);
  font-variant-numeric: tabular-nums;
}

.stat span {
  font-size: var(--fs-sm);
  color: var(--text-2);
}
</style>
