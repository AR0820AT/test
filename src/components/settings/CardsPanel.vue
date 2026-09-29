<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import NumberField from '@/components/ui/NumberField.vue'
import Switch from '@/components/ui/Switch.vue'
import { useCardStore, parseLines } from '@/stores/useCardStore'
import { useUiStore } from '@/stores/useUiStore'
import { CATEGORY_NAME, LANG_NAME, classifyCard } from '@/utils/text'
import type { CardGroup, CardItem } from '@/types'

const cardStore = useCardStore()
const ui = useUiStore()

const quickText = ref('')
const open = ref<Record<string, boolean>>({})

function isOpen(id: string): boolean {
  return open.value[id] === true
}

function toggle(id: string): void {
  open.value = { ...open.value, [id]: !isOpen(id) }
}

/** 一段文本 → 若干张卡：有空行就按空行分块，否则一行一张 */
function splitCards(text: string): string[][] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => parseLines(block))
    .filter((lines) => lines.length)
  if (blocks.length) return blocks
  return text
    .split('\n')
    .map((line) => [line.trim()])
    .filter((lines) => lines[0])
}

function addQuick(): void {
  const cards = splitCards(quickText.value)
  if (!cards.length) {
    ui.toast('先写点内容')
    return
  }
  cards.forEach((lines) => cardStore.addAuto(lines))
  const last = cards[cards.length - 1]
  const meta = classifyCard(last)
  open.value = { ...open.value, [`lang_${meta.lang}_${meta.cat}`]: true }
  quickText.value = ''
  ui.toast(`已添加 ${cards.length} 张，自动归入${LANG_NAME[meta.lang]}·${CATEGORY_NAME[meta.cat]}`)
}

function onLinesChange(group: CardGroup, card: CardItem, event: Event): void {
  const text = (event.target as HTMLTextAreaElement).value
  cardStore.updateCard(group.id, card.id, parseLines(text))
}

function removeGroup(group: CardGroup): void {
  const count = cardStore.countOf(group.id)
  if (!count) {
    cardStore.removeGroup(group.id)
    return
  }
  if (window.confirm(`删除「${group.name}」及其 ${count} 张字卡？`)) {
    cardStore.removeGroup(group.id)
  }
}

function resetLibrary(): void {
  if (!window.confirm('恢复为内置字卡库？现在的自定义字卡会被覆盖。')) return
  cardStore.resetSeed()
  open.value = {}
  ui.toast('已恢复内置字卡库')
}
</script>

<template>
  <div class="panel">
    <p class="muted">
      共 {{ cardStore.totalCards }} 张字卡，{{ cardStore.enabledGroups.length }} 个分组参与抽取。
      结构是「语言 → 词语/句子 → 首字母」，添加时会自动识别归类。
    </p>

    <section class="section">
      <div class="sec-title">快速添加</div>
      <div class="sec-body">
        <textarea
          v-model="quickText"
          class="textarea"
          rows="4"
          placeholder="一行一张；空行分隔表示一张卡要连发多行。会自动识别中文/英文、词语/句子，并按首字母归档"
        />
        <button class="btn primary block" @click="addQuick">自动分组添加</button>
        <button class="btn block" @click="resetLibrary">恢复内置字卡库</button>
      </div>
    </section>

    <section v-for="lang in cardStore.topGroups" :key="lang.id" class="section">
      <div class="grp level-1">
        <button class="fold" :aria-label="isOpen(lang.id) ? '收起' : '展开'" @click="toggle(lang.id)">
          <Icon :name="isOpen(lang.id) ? 'down' : 'right'" :size="16" />
        </button>
        <Switch v-model="lang.enabled" />
        <span class="name">{{ lang.name }}</span>
        <span class="count">{{ cardStore.countOf(lang.id) }}</span>
      </div>

      <!-- 自己新建的平铺分组：直接展开看字卡 -->
      <div v-if="isOpen(lang.id) && lang.cards.length" class="cards">
        <div v-for="(card, index) in lang.cards" :key="card.id" class="card">
          <div class="card-head">
            <span class="idx">#{{ index + 1 }}</span>
            <span class="spacer" />
            <button class="icon-btn-sm danger" aria-label="删除字卡" @click="cardStore.removeCard(lang.id, card.id)">
              <Icon name="trash" :size="16" />
            </button>
          </div>
          <textarea
            class="textarea"
            rows="2"
            placeholder="一行一条，会依次发出"
            :value="card.lines.join('\n')"
            @change="onLinesChange(lang, card, $event)"
          />
        </div>
      </div>

      <template v-if="isOpen(lang.id)">
        <div v-for="cat in cardStore.childrenOf(lang.id)" :key="cat.id" class="sub">
          <div class="grp level-2">
            <button class="fold" :aria-label="isOpen(cat.id) ? '收起' : '展开'" @click="toggle(cat.id)">
              <Icon :name="isOpen(cat.id) ? 'down' : 'right'" :size="16" />
            </button>
            <Switch v-model="cat.enabled" />
            <span class="name">{{ cat.name }}</span>
            <span class="count">{{ cardStore.countOf(cat.id) }}</span>
          </div>

          <template v-if="isOpen(cat.id)">
            <div v-for="letter in cardStore.childrenOf(cat.id)" :key="letter.id" class="sub">
              <div class="grp level-3">
                <button class="fold" :aria-label="isOpen(letter.id) ? '收起' : '展开'" @click="toggle(letter.id)">
                  <Icon :name="isOpen(letter.id) ? 'down' : 'right'" :size="16" />
                </button>
                <Switch v-model="letter.enabled" />
                <span class="name letter">{{ letter.name }}</span>
                <NumberField v-model="letter.weight" :min="0" :max="20" suffix="权重" />
                <button class="icon-btn-sm danger" aria-label="删除分组" @click="removeGroup(letter)">
                  <Icon name="trash" :size="16" />
                </button>
              </div>

              <div v-if="isOpen(letter.id)" class="cards">
                <div v-for="(card, index) in letter.cards" :key="card.id" class="card">
                  <div class="card-head">
                    <span class="idx">#{{ index + 1 }}</span>
                    <span class="spacer" />
                    <button
                      class="icon-btn-sm"
                      :disabled="index === 0"
                      aria-label="上移"
                      @click="cardStore.moveCard(letter.id, card.id, -1)"
                    >
                      <Icon name="up" :size="16" />
                    </button>
                    <button
                      class="icon-btn-sm"
                      :disabled="index === letter.cards.length - 1"
                      aria-label="下移"
                      @click="cardStore.moveCard(letter.id, card.id, 1)"
                    >
                      <Icon name="down" :size="16" />
                    </button>
                    <button
                      class="icon-btn-sm danger"
                      aria-label="删除字卡"
                      @click="cardStore.removeCard(letter.id, card.id)"
                    >
                      <Icon name="trash" :size="16" />
                    </button>
                  </div>
                  <textarea
                    class="textarea"
                    rows="2"
                    placeholder="一行一条，会依次发出"
                    :value="card.lines.join('\n')"
                    @change="onLinesChange(letter, card, $event)"
                  />
                </div>

                <button class="btn block" @click="cardStore.addCard(letter.id)">+ 添加字卡</button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.sec-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grp {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
}

.level-2 {
  padding-left: 18px;
  background: var(--surface);
}

.level-3 {
  padding-left: 30px;
  background: var(--surface);
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
}

.name.letter {
  flex: none;
  min-width: 22px;
  font-weight: 500;
}

.count {
  font-size: 12px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

.fold {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: var(--text-2);
  flex: none;
}

.fold:active {
  background: var(--accent-soft);
}

.sub {
  border-bottom: 1px solid var(--border);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
  background: var(--surface);
}

.card {
  padding: 8px;
  border-radius: 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 6px;
}

.idx {
  font-size: 12px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

.spacer {
  flex: 1;
}

.icon-btn-sm:disabled {
  opacity: 0.35;
}

/* 窄屏：收窄层级缩进，保证一行放得下开关和权重 */
@media (max-width: 360px) {
  .level-2 {
    padding-left: 10px;
  }

  .level-3 {
    padding-left: 18px;
  }

  .grp {
    gap: 6px;
    padding: 8px;
  }
}
</style>
