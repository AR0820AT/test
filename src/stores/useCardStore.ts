import { computed } from 'vue'
import { defineStore } from 'pinia'
import type { CardGroup, CardItem } from '@/types'
import { uid } from '@/utils/id'
import { usePersisted } from '@/storage/persist'

/** 首次打开时的示例字卡，可随时在「字卡库」里删改 */
function seed(): CardGroup[] {
  return [
    {
      id: 'group_daily',
      name: '日常',
      enabled: true,
      weight: 3,
      cards: [
        { id: 'card_1', lines: ['在干嘛呀？'] },
        { id: 'card_2', lines: ['刚刚路上看到一只超大的橘猫', '可惜没来得及拍'] },
        { id: 'card_3', lines: ['今天好累啊', '不过洗完澡舒服多了'] },
        { id: 'card_4', lines: ['晚饭吃了吗'] },
      ],
    },
    {
      id: 'group_warm',
      name: '温柔',
      enabled: true,
      weight: 2,
      cards: [
        { id: 'card_5', lines: ['早点休息呀，别熬太晚'] },
        { id: 'card_6', lines: ['想你了', '（假装是字卡想你的）'] },
        { id: 'card_7', lines: ['记得喝水～'] },
      ],
    },
  ]
}

/** 把文本框内容转成多条：以换行分隔 */
export function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export const useCardStore = defineStore('cards', () => {
  const groups = usePersisted<CardGroup[]>('cardGroups', seed)

  const enabledGroups = computed(() => groups.value.filter((group) => group.enabled && group.cards.length > 0))
  const totalCards = computed(() => groups.value.reduce((sum, group) => sum + group.cards.length, 0))

  function findGroup(groupId: string): CardGroup | undefined {
    return groups.value.find((group) => group.id === groupId)
  }

  function addGroup(name = '新分组'): CardGroup {
    const group: CardGroup = { id: uid('g_'), name, enabled: true, weight: 2, cards: [] }
    groups.value.push(group)
    return group
  }

  function removeGroup(groupId: string): void {
    groups.value = groups.value.filter((group) => group.id !== groupId)
  }

  function addCard(groupId: string, lines: string[] = ['新字卡']): CardItem | undefined {
    const group = findGroup(groupId)
    if (!group) return undefined
    const card: CardItem = { id: uid('c_'), lines }
    group.cards.push(card)
    return card
  }

  function updateCard(groupId: string, cardId: string, lines: string[]): void {
    const card = findGroup(groupId)?.cards.find((item) => item.id === cardId)
    if (card) card.lines = lines
  }

  function removeCard(groupId: string, cardId: string): void {
    const group = findGroup(groupId)
    if (!group) return
    group.cards = group.cards.filter((item) => item.id !== cardId)
  }

  function moveCard(groupId: string, cardId: string, delta: number): void {
    const group = findGroup(groupId)
    if (!group) return
    const index = group.cards.findIndex((item) => item.id === cardId)
    const next = index + delta
    if (index < 0 || next < 0 || next >= group.cards.length) return
    const [item] = group.cards.splice(index, 1)
    group.cards.splice(next, 0, item)
  }

  return {
    groups,
    enabledGroups,
    totalCards,
    findGroup,
    addGroup,
    removeGroup,
    addCard,
    updateCard,
    removeCard,
    moveCard,
  }
})
