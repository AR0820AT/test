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
import { useStickerStore } from '@/stores/useStickerStore'
import { useUiStore } from '@/stores/useUiStore'
import { useQuoting } from '@/composables/useQuoting'
import { useSpeechInput } from '@/composables/useSpeechInput'
import { formatTime, needTimeDivider } from '@/utils/format'
import type { Message, Sticker } from '@/types'

const chat = useChatStore()
const profile = useProfileStore()
const stickerStore = useStickerStore()
const ui = useUiStore()
const quoting = useQuoting()

const draft = ref('')
const speech = useSpeechInput()
/** 语音已经定稿的文字；中间结果另外拼在后面实时显示 */
const voiceBase = ref('')
const panel = ref<'none' | 'emoji' | 'sticker'>('none')
const scroller = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
/** 用户手动往上翻时，不再自动吸底，避免打断阅读 */
const stickBottom = ref(true)

const canSend = computed(() => draft.value.trim().length > 0)
const placeholder = computed(() => (speech.listening.value ? '正在听…' : '说点什么…'))

/** 定稿 + 中间结果拼起来的实时草稿 */
function voiceDraft(): string {
  return voiceBase.value + speech.interim.value
}

function toggleVoice(): void {
  if (speech.listening.value) {
    speech.stop()
    draft.value = voiceBase.value
    voiceBase.value = ''
    void nextTick(() => {
      autosize()
      inputEl.value?.focus()
    })
    return
  }

  voiceBase.value = draft.value
  speech.start({
    onFinal(text: string) {
      voiceBase.value = voiceBase.value ? `${voiceBase.value}${text}` : text
      draft.value = voiceDraft()
    },
    onError(message: string) {
      ui.toast(message)
    },
  })
  if (speech.listening.value) ui.toast('听着呢，说完点一下麦克风', 1600)
}

/** 手动改了输入框就以手写的为准，后面识别到的接在它后面 */
function onDraftInput(): void {
  if (speech.listening.value) voiceBase.value = draft.value
}

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
  if (speech.listening.value) {
    speech.stop()
    voiceBase.value = ''
  }
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

async function drawNow(): Promise<void> {
  stickBottom.value = true
  await brain.drawNow()
  void scrollToBottom(true)
}

watch(draft, () => void nextTick(autosize))
// 边说边把中间结果填进输入框
watch(
  () => speech.interim.value,
  () => {
    if (!speech.listening.value) return
    draft.value = voiceDraft()
  },
)
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
      <template v-if="chat.messages.length">
        <div v-for="(message, index) in chat.messages" :key="message.id">
          <div v-if="needDivider(index)" class="divider">{{ formatTime(message.createdAt) }}</div>
          <div v-if="message.recalled" class="sys-tip">{{ recallTip(message) }}</div>
          <MessageBubble v-else :message="message" />
        </div>
        <TypingBubble v-if="chat.typing" />
      </template>

      <div class="tail"></div>
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

        <textarea
          ref="inputEl"
          v-model="draft"
          class="input no-scrollbar"
          :class="{ listening: speech.listening.value }"
          rows="1"
          :placeholder="placeholder"
          @input="onDraftInput"
          @focus="panel = 'none'"
          @keydown.enter.exact.prevent="sendText"
        />

        <button
          v-if="speech.supported"
          class="tool"
          :class="{ on: speech.listening.value }"
          :aria-label="speech.listening.value ? '停止语音输入' : '语音输入'"
          @click="toggleVoice"
        >
          <Icon name="mic" />
        </button>
        <button class="tool" aria-label="戳戳对方" @click="drawNow">
          <Icon name="dice" />
        </button>
        <button class="send" :class="{ off: !canSend }" aria-label="发送" @click="sendText">
          <Icon name="send" :size="20" />
        </button>
      </div>

      <EmojiPanel v-if="panel === 'emoji'" @pick="pickEmoji" />
      <StickerPanel v-if="panel === 'sticker'" @pick="pickSticker" @upload="uploadStickers" />
    </footer>
  </main>
</template>

<style scoped>
.chat {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.scroller {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0 4px;
  -webkit-overflow-scrolling: touch;
}

.divider {
  margin: 7px auto 4px;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-3);
}

.sys-tip {
  margin: 8px auto;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-3);
}

.tail {
  height: 6px;
  text-align: center;
  font-size: calc(var(--fs-base) - 4px);
  color: var(--text-3);
}

.composer {
  flex: none;
  background: var(--nav-bg);
  border-top: 1px solid var(--glass-border);
  padding-bottom: var(--safe-bottom);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat));
}

.quote-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 12px 0;
  padding: 7px 10px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--glass-border);
  font-size: var(--fs-sm);
  color: var(--text-2);
  backdrop-filter: blur(calc(var(--glass-blur) * 0.5));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.5));
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
  border: 1px solid var(--glass-border);
  background: var(--input-bg);
  font-size: var(--fs-base);
  backdrop-filter: blur(calc(var(--glass-blur) * 0.6));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) * 0.6));
  resize: none;
  overflow-y: auto;
  line-height: 1.4;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

/* 语音输入中：跟聚焦一样的玻璃内发光，并轻轻呼吸 */
.input.listening {
  border-color: var(--focus-ring);
  background: var(--input-bg-focus);
  box-shadow:
    inset 0 0 0 1px var(--focus-ring),
    inset 0 0 15px 2px var(--focus-inner),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  animation: breathe 1.6s ease-in-out infinite;
}

.tool.on {
  color: var(--accent);
  background: var(--accent-soft);
}

/* 正在听：图标轻微呼吸，提示还在收音 */
.tool.on .icon {
  animation: breathe 1.3s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

/* 聚焦：玻璃内壁亮起来（内发光），而不是描一圈实心色边 */
.input:focus {
  outline: none;
  border-color: var(--focus-ring);
  background: var(--input-bg-focus);
  box-shadow:
    inset 0 0 0 1px var(--focus-ring),
    inset 0 0 15px 2px var(--focus-inner),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
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
