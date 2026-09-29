<script setup lang="ts">
import { computed } from 'vue'
import AssetImage from '@/components/common/AssetImage.vue'
import Icon from '@/components/ui/Icon.vue'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import type { Sticker } from '@/types'

const emit = defineEmits<{ pick: [sticker: Sticker]; upload: [event: Event] }>()
const stickerStore = useStickerStore()
const ui = useUiStore()

const stickers = computed(() => stickerStore.stickers)
</script>

<template>
  <div class="sticker-panel">
    <div class="grid no-scrollbar">
      <button v-for="sticker in stickers" :key="sticker.id" class="cell" @click="emit('pick', sticker)">
        <AssetImage :asset-id="sticker.id" :alt="sticker.name" />
      </button>

      <label class="cell add">
        <Icon name="plus" :size="26" />
        <input type="file" accept="image/*" multiple hidden @change="emit('upload', $event)" />
      </label>
    </div>

    <div class="foot">
      <span v-if="!stickers.length">还没有表情包，点「+」从手机里选图添加</span>
      <button v-else class="link" @click="ui.openDrawer('stickers')">管理表情包</button>
    </div>
  </div>
</template>

<style scoped>
.sticker-panel {
  display: flex;
  flex-direction: column;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  max-height: min(220px, 32vh);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.cell {
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--surface);
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--border);
  transition: transform 0.16s ease;
}

.cell:active {
  transform: scale(0.96);
}

.cell :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cell.add {
  color: var(--text-2);
  border-style: dashed;
}

.foot {
  padding: 0 12px 10px;
  font-size: 12px;
  color: var(--text-2);
  display: flex;
  justify-content: center;
}

.link {
  color: var(--accent);
  font-size: 12px;
}
</style>
