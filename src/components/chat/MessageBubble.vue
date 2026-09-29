<script setup lang="ts">
import { computed, type Ref } from 'vue'
import type { Message } from '@/types'
import { useAssetUrl } from '@/composables/useAssetUrl'
import { useQuoting } from '@/composables/useQuoting'
import { useChatStore } from '@/stores/useChatStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUiStore } from '@/stores/useUiStore'

const props = defineProps<{ message: Message }>()

const ui = useUiStore()
const chat = useChatStore()
const quoting = useQuoting()
const profile = useProfileStore()

const mine = computed(() => props.message.role === 'me')
/** 气泡上方显示昵称，用来区分双方 */
const who = computed(() => profile.nameOf(props.message.role))
const assetId = computed(() => props.message.assetId ?? '')
const url = useAssetUrl(assetId as Ref<string | null | undefined>)
const quote = computed(() => props.message.quote ?? null)

/** 双击阈值；iOS 自带的 dblclick 不可靠，触摸端自己判定 */
const DOUBLE_TAP_MS = 320
let lastTapAt = 0
let lastQuoteAt = 0

/** 双击气泡 / 右键 = 直接引用这条消息，不再弹菜单 */
function quoteThis(): void {
  const now = Date.now()
  if (now - lastQuoteAt < 600) return
  lastQuoteAt = now
  const ref = chat.quoteRefOf(props.message.id)
  if (!ref) return
  quoting.set(ref)
  ui.toast('已引用这条消息')
  if (navigator.vibrate) navigator.vibrate(8)
}

function onTouchEnd(): void {
  const now = Date.now()
  const isDoubleTap = now - lastTapAt < DOUBLE_TAP_MS
  lastTapAt = now
  if (isDoubleTap) {
    lastTapAt = 0
    quoteThis()
  }
}
</script>

<template>
  <div class="row" :class="{ mine }">
    <div class="stack">
      <div class="who">{{ who }}</div>

      <div class="bubble" @touchend="onTouchEnd" @contextmenu.prevent="quoteThis" @dblclick="quoteThis">
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
  padding: 2px 12px;
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
  margin: 0 4px 2px;
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
  padding: 7px 11px;
  border-radius: var(--bubble-radius);
  background: var(--bubble-them);
  color: var(--bubble-them-text);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
  word-break: break-word;
  white-space: pre-wrap;
  /* iOS：禁掉系统长按的选择/共享菜单，别和我们自己的长按菜单抢；复制走菜单里的按钮 */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  backdrop-filter: blur(calc(var(--glass-blur) * 0.7)) saturate(var(--glass-sat));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.7)) saturate(var(--glass-sat));
}

/* 两侧气泡完全一样的样式，只靠左右对齐和昵称区分 */

.text {
  font-size: var(--fs-base);
  line-height: 1.4;
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
  margin: -2px 0 5px;
  padding: 5px 8px;
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
