<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import NumberField from '@/components/ui/NumberField.vue'
import Switch from '@/components/ui/Switch.vue'
import { useCardStore, parseLines } from '@/stores/useCardStore'
import { useUiStore } from '@/stores/useUiStore'
import type { CardGroup, CardItem } from '@/types'

const cardStore = useCardStore()
const ui = useUiStore()

const bulkTarget = ref('')
const bulkText = ref('')

const bulkGroupId = computed(() => bulkTarget.value || cardStore.groups[0]?.id || '')

function onLinesChange(group: CardGroup, card: CardItem, event: Event): void {
  const text = (event.target as HTMLTextAreaElement).value
  cardStore.updateCard(group.id, card.id, parseLines(text))
}

function removeGroup(group: CardGroup): void {
  if (!group.cards.length) {
    cardStore.removeGroup(group.id)
    return
  }
  if (window.confirm(`删除分组「${group.name}」及其 ${group.cards.length} 张字卡？`)) {
    cardStore.removeGroup(group.id)
  }
}

function importBulk(): void {
  const groupId = bulkGroupId.value
  if (!groupId) {
    ui.toast('先新建一个分组')
    return
  }
  const cards = bulkText.value
    .split(/\n\s*\n/)
    .map((block) => parseLines(block))
    .filter((lines) => lines.length)

  if (!cards.length) {
    ui.toast('还没填内容')
    return
  }
  cards.forEach((lines) => cardStore.addCard(groupId, lines))
  bulkText.value = ''
  ui.toast(`已导入 ${cards.length} 张字卡`)
}
</script>

<template>
  <div class="panel">
    <p class="muted">
      共 {{ cardStore.totalCards }} 张字卡，{{ cardStore.enabledGroups.length }} 个分组参与抽取。
      每张字卡可以写多行，发送时会像真人一样一条条连发。
    </p>

    <button class="btn block" @click="cardStore.addGroup()">+ 新建分组</button>

    <section v-for="group in cardStore.groups" :key="group.id" class="section">
      <div class="grp">
        <Switch v-model="group.enabled" />
        <input v-model="group.name" class="input name" maxlength="12" placeholder="分组名" />
        <NumberField v-model="group.weight" :min="0" :max="20" suffix="权重" />
        <button class="icon-btn-sm danger" aria-label="删除分组" @click="removeGroup(group)">
          <Icon name="trash" :size="18" />
        </button>
      </div>

      <div class="cards">
        <div v-for="(card, index) in group.cards" :key="card.id" class="card">
          <div class="card-head">
            <span class="idx">#{{ index + 1 }}</span>
            <span class="spacer" />
            <button
              class="icon-btn-sm"
              :disabled="index === 0"
              aria-label="上移"
              @click="cardStore.moveCard(group.id, card.id, -1)"
            >
              <Icon name="up" :size="16" />
            </button>
            <button
              class="icon-btn-sm"
              :disabled="index === group.cards.length - 1"
              aria-label="下移"
              @click="cardStore.moveCard(group.id, card.id, 1)"
            >
              <Icon name="down" :size="16" />
            </button>
            <button
              class="icon-btn-sm danger"
              aria-label="删除字卡"
              @click="cardStore.removeCard(group.id, card.id)"
            >
              <Icon name="trash" :size="16" />
            </button>
          </div>
          <textarea
            class="textarea"
            rows="2"
            placeholder="一行一条，会依次发出"
            :value="card.lines.join('\n')"
            @change="onLinesChange(group, card, $event)"
          />
        </div>

        <button class="btn block" @click="cardStore.addCard(group.id)">+ 添加字卡</button>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">批量导入</div>
      <div class="sec-body">
        <select v-model="bulkTarget" class="input">
          <option value="">选择分组（默认第一个）</option>
          <option v-for="group in cardStore.groups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
        <textarea
          v-model="bulkText"
          class="textarea"
          rows="5"
          placeholder="空行分隔多张字卡；同一张里换行表示连发。例如：&#10;今天好累啊&#10;不过洗完澡舒服多了&#10;&#10;记得喝水～"
        />
        <button class="btn primary block" @click="importBulk">导入</button>
        <p class="muted">权重越大越容易被抽中，设为 0 表示暂时不参与。</p>
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

.grp {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.name {
  flex: 1;
  min-width: 0;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
}

.card {
  padding: 8px;
  border-radius: 12px;
  background: var(--surface);
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
</style>
