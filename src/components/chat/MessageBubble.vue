<script setup lang="ts">
import { computed, type Ref } from 'vue'
import type { Message } from '@/types'
import { useAssetUrl } from '@/composables/useAssetUrl'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUiStore } from '@/stores/useUiStore'

const props = defineProps<{ message: Message }>()

const ui = useUiStore()
const profile = useProfileStore()

const mine = computed(() => props.message.role === 'me')
/** 气泡上方显示昵称，用来区分双方 */
const who = computed(() => profile.nameOf(props.message.role))
const assetId = computed(() => props.message.assetId ?? '')
const url = useAssetUrl(assetId as Ref<string | null | undefined>)
const quote = computed(() => props.message.quote ?? null)

/** 长按 450ms 弹出菜单（桌面端右键同效） */
let pressTimer: ReturnType<typeof setTimeout> | undefined
let moved = false

function pointOf(event: TouchEvent | MouseEvent): { x: number; y: number } {
  const touch = (event as TouchEvent).touches?.[0]
  if (touch) return { x: touch.clientX, y: touch.clientY }
  const mouse = event as MouseEvent
  return { x: mouse.clientX, y: mouse.clientY }
}

function startPress(event: TouchEvent | MouseEvent): void {
  moved = false
  pressTimer = setTimeout(() => {
    const { x, y } = pointOf(event)
    ui.openContextMenu({ messageId: props.message.id, x, y })
    if (navigator.vibrate) navigator.vibrate(12)
  }, 450)
}

function cancelPress(): void {
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = undefined
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault()
  ui.openContextMenu({ messageId: props.message.id, x: event.clientX, y: event.clientY })
}
</script>

<template>
  <div class="row" :class="{ mine }">
    <div class="stack">
      <div class="who">{{ who }}</div>

      <div class="bubble" @touchstart.passive="startPress" @touchend="cancelPress" @touchmove="moved = true; cancelPress()" @touchcancel="cancelPress" @mousedown="startPress" @mouseup="cancelPress" @mouseleave="cancelPress" @contextmenu="onContextMenu">
        <div v-if="quote" class="quote">
          <span class="quote-name">{{ quote.name }}：</span>
          <span class="quote-text">{{ quote.digest }}</span>
        </div>

        <span v-if="message.kind === 'text'" class="text">{{ message.text }}</span>

        <img
          v-else-if="url"
          class="pic"
          :class="{ sticker: message.kind === 'sticker' }"
          :src="url"
          alt="图片"
        />
        <span v-else class="text muted">[图片已丢失]</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-start;
  padding: 3px 12px;
  animation: pop-in 0.22s ease both;
}

.row.mine {
  flex-direction: row-reverse;
}

.stack {
  max-width: 82%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.row.mine .stack {
  align-items: flex-end;
}

.who {
  margin: 0 4px 3px;
  font-family: var(--font-display);
  font-size: var(--fs-sm);
  letter-spacing: 0.04em;
  color: var(--text-3);
}

.row.mine .stack {
  align-items: flex-end;
}

.bubble {
  position: relative;
  max-width: 100%;
  padding: 9px 12px;
  border-radius: var(--bubble-radius);
  background: var(--bubble-them);
  color: var(--bubble-them-text);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
  word-break: break-word;
  white-space: pre-wrap;
  backdrop-filter: blur(calc(var(--glass-blur) * 0.7)) saturate(var(--glass-sat));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.7)) saturate(var(--glass-sat));
}

/* 两侧气泡完全一样的样式，只靠左右对齐和昵称区分 */

.text {
  font-size: var(--fs-base);
  line-height: 1.5;
}

.muted {
  color: var(--text-2);
}

.pic {
  display: block;
  max-width: 62vw;
  border-radius: 10px;
  background: var(--surface);
}

.pic.sticker {
  width: 108px;
  height: 108px;
  object-fit: contain;
  background: transparent;
  max-width: none;
}

.quote {
  margin: -2px 0 6px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  font-size: var(--fs-sm);
  line-height: 1.35;
  color: inherit;
  opacity: 0.85;
  border-left: 3px solid rgba(0, 0, 0, 0.18);
}

.quote-name {
  font-weight: 600;
}

.quote-text {
  opacity: 0.9;
}
</style>
