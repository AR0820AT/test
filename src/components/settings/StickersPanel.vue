<script setup lang="ts">
import { ref } from 'vue'
import AssetImage from '@/components/common/AssetImage.vue'
import Icon from '@/components/ui/Icon.vue'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import type { Sticker } from '@/types'

const stickerStore = useStickerStore()
const ui = useUiStore()
const fileInput = ref<HTMLInputElement | null>(null)

async function onFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  let ok = 0
  for (const file of files) {
    const added = await stickerStore.add(file)
    if (added) ok += 1
  }
  ui.toast(ok ? `已添加 ${ok} 个表情` : '添加失败，换张图片试试')
}

function remove(sticker: Sticker): void {
  void stickerStore.remove(sticker.id)
  ui.toast('已删除')
}

function rename(sticker: Sticker, event: Event): void {
  stickerStore.rename(sticker.id, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="panel">
    <button class="btn primary block" @click="fileInput?.click()">+ 添加表情包</button>
    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFiles" />

    <p v-if="!stickerStore.stickers.length" class="muted">
      还没有表情包。添加后在聊天输入栏的「字卡」按钮里就能直接发送。
    </p>

    <section v-else class="section">
      <div class="grid">
        <div v-for="sticker in stickerStore.stickers" :key="sticker.id" class="cell">
          <div class="thumb">
            <AssetImage :asset-id="sticker.id" :alt="sticker.name" />
          </div>
          <input class="input name" :value="sticker.name" maxlength="12" @change="rename(sticker, $event)" />
          <button class="del" aria-label="删除表情" @click="remove(sticker)">
            <Icon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </section>

    <p class="muted">图片会自动压缩到 320px 后存入本机，透明背景会保留。</p>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.thumb {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.thumb :deep(img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.name {
  padding: 4px 6px;
  font-size: 12px;
  text-align: center;
}

.del {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}
</style>
