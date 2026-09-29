<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import MessageBubble from './MessageBubble.vue'
import TypingBubble from './TypingBubble.vue'
import EmojiPanel from './EmojiPanel.vue'
import StickerPanel from './StickerPanel.vue'
import Icon from '@/components/ui/Icon.vue'
import { brain } from '@/engine/brain'
import { useChatStore } from '@/stores/useChatStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import { useQuoting } from '@/composables/useQuoting'
import { formatTime, needTimeDivider } from '@/utils/format'
import { putAsset } from '@/storage/assets'
import { compressImage } from '@/utils/image'
import { uid } from '@/utils/id'
import type { Message, Sticker } from '@/types'

const chat = useChatStore()
const profile = useProfileStore()
const settings = useSettingsStore()
const stickerStore = useStickerStore()
const ui = useUiStore()
const quoting = useQuoting()

const draft = ref('')
const panel = ref<'none' | 'emoji' | 'sticker'>('none')
const scroller = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
/** 用户手动往上翻时，不再自动吸底，避免打断阅读 */
const stickBottom = ref(true)

const canSend = computed(() => draft.value.trim().length > 0)
const themName = computed(() => profile.nameOf('them'))

function needDivider(index: number): boolean {
  const prev = chat.messages[index - 1]
  return !prev || needTimeDivider(prev.createdAt, chat.messages[index].createdAt)
}

function recallTip(message: Message): string {
  return message.role === 'me' ? '你撤回了一条消息' : `${profile.nameOf(message.role)} 撤回了一条消息`
}

async function scrollToBottom(smooth = false): Promise<void> {
  await nextTick()
  const el = scroller.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function onScroll(): void {
  const el = scroller.value
  if (!el) return
  stickBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 90
}

function autosize(): void {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 108)}px`
}

function togglePanel(next: 'emoji' | 'sticker'): void {
  panel.value = panel.value === next ? 'none' : next
}

function clearQuote(): void {
  quoting.set(null)
}

function sendText(): void {
  const text = draft.value.trim()
  if (!text) return
  chat.send({ role: 'me', text, quote: quoting.quoting.value ?? null })
  draft.value = ''
  quoting.set(null)
  panel.value = 'none'
  stickBottom.value = true
  void scrollToBottom(true)
  brain.notifyUserSent()
}

function pickEmoji(emoji: string): void {
  draft.value += emoji
  void nextTick(() => {
    autosize()
    inputEl.value?.focus()
  })
}

function pickSticker(sticker: Sticker): void {
  chat.send({ role: 'me', assetId: sticker.id, kind: 'sticker', quote: quoting.quoting.value ?? null })
  quoting.set(null)
  panel.value = 'none'
  stickBottom.value = true
  void scrollToBottom(true)
  brain.notifyUserSent()
}

async function uploadStickers(event: Event): Promise<void> {
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

async function sendImages(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  ui.toast('正在处理图片…', 1200)
  for (const file of files) {
    try {
      const blob = await compressImage(file, 1280, 0.85)
      const assetId = uid('img_')
      await putAsset(assetId, blob)
      chat.send({ role: 'me', assetId, kind: 'image', quote: quoting.quoting.value ?? null })
    } catch {
      ui.toast('有图片处理失败了')
    }
  }
  quoting.set(null)
  stickBottom.value = true
  void scrollToBottom(true)
  brain.notifyUserSent()
}

async function drawNow(): Promise<void> {
  stickBottom.value = true
  await brain.drawNow()
  void scrollToBottom(true)
}

watch(draft, () => void nextTick(autosize))
watch(
  () => [chat.messages.length, chat.typing] as const,
  () => {
    if (stickBottom.value) void scrollToBottom(true)
  },
)

onMounted(() => {
  void scrollToBottom()
})
</script>

<template>
  <main class="chat">
    <div ref="scroller" class="scroller no-scrollbar" @scroll.passive="onScroll">
      <div v-if="!chat.messages.length" class="empty">
        <Icon name="cards" :size="40" />
        <p class="title">还没有消息</p>
        <p class="desc">点下面的骰子让「{{ themName }}」抽一张字卡，或者自己先说点什么</p>
        <button class="primary" @click="drawNow">抽一张字卡</button>
      </div>

      <template v-else>
        <div v-for="(message, index) in chat.messages" :key="message.id">
          <div v-if="needDivider(index)" class="divider">{{ formatTime(message.createdAt) }}</div>
          <div v-if="message.recalled" class="sys-tip">{{ recallTip(message) }}</div>
          <MessageBubble v-else :message="message" />
        </div>
        <TypingBubble v-if="chat.typing" />
      </template>

      <div class="tail">
        <span v-if="settings.settings.paused">自动回复已暂停</span>
      </div>
    </div>

    <footer class="composer">
      <div v-if="quoting.quoting.value" class="quote-bar">
        <Icon name="quote" :size="14" />
        <span class="name">{{ quoting.quoting.value.name }}：</span>
        <span class="digest">{{ quoting.quoting.value.digest }}</span>
        <button aria-label="取消引用" @click="clearQuote">
          <Icon name="close" :size="14" />
        </button>
      </div>

      <div class="line">
        <button class="tool" aria-label="表情" @click="togglePanel('emoji')">
          <Icon name="smile" />
        </button>
        <button class="tool" aria-label="表情包" @click="togglePanel('sticker')">
          <Icon name="cards" />
        </button>
        <button class="tool" aria-label="发送图片" @click="imageInput?.click()">
          <Icon name="image" />
        </button>

        <textarea
          ref="inputEl"
          v-model="draft"
          class="input no-scrollbar"
          rows="1"
          placeholder="说点什么…"
          @focus="panel = 'none'"
          @keydown.enter.exact.prevent="sendText"
        />

        <button class="tool" aria-label="立即抽一张字卡" @click="drawNow">
          <Icon name="dice" />
        </button>
        <button class="send" :class="{ off: !canSend }" aria-label="发送" @click="sendText">
          <Icon name="send" :size="20" />
        </button>
      </div>

      <EmojiPanel v-if="panel === 'emoji'" @pick="pickEmoji" />
      <StickerPanel v-if="panel === 'sticker'" @pick="pickSticker" @upload="uploadStickers" />

      <input ref="imageInput" type="file" accept="image/*" multiple hidden @change="sendImages" />
    </footer>
  </main>
</template>

<style scoped>
.chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.scroller {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0 6px;
  -webkit-overflow-scrolling: touch;
}

.empty {
  padding: 60px 32px;
  text-align: center;
  color: var(--text-2);
}

.empty .title {
  margin: 12px 0 4px;
  font-size: 16px;
  color: var(--text);
}

.empty .desc {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.6;
}

.primary {
  padding: 9px 18px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 14px;
  box-shadow: var(--shadow-sm);
}

.divider {
  margin: 10px auto 6px;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}

.sys-tip {
  margin: 8px auto;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}

.tail {
  height: 8px;
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
}

.composer {
  flex: none;
  background: var(--nav-bg);
  border-top: 1px solid var(--border);
  padding-bottom: var(--safe-bottom);
}

.quote-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 12px 0;
  padding: 7px 10px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-2);
}

.quote-bar .name {
  color: var(--text);
  font-weight: 600;
  flex: none;
}

.quote-bar .digest {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 8px;
}

.tool {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--text-2);
  flex: none;
  transition: color 0.16s ease, background 0.16s ease;
}

.tool:active {
  background: var(--accent-soft);
  color: var(--accent);
}

.input {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  max-height: 108px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-strong);
  background: var(--input-bg);
  resize: none;
  overflow-y: auto;
  line-height: 1.4;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
}

.send {
  width: 40px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--accent);
  color: var(--accent-contrast);
  flex: none;
  transition: opacity 0.16s ease;
}

.send.off {
  opacity: 0.45;
}
</style>
