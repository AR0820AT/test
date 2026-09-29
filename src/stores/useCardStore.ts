import { computed } from 'vue'
import { defineStore } from 'pinia'
import type { CardGroup, CardItem, CardMeta } from '@/types'
import { uid } from '@/utils/id'
import { loadJson, saveJson, usePersisted } from '@/storage/persist'
import { buildSeedGroups, groupIdOf, letterGroupName } from '@/data/seedCards'
import { CATEGORY_NAME, LANG_NAME, classifyCard } from '@/utils/text'

/** 内置字卡库版本号：结构升级时会自动替换未改动过的内置库 */
const SEED_VERSION_KEY = 'cardSeedVersion'
const SEED_VERSION = 2
/** 老版本内置分组 id */
const LEGACY_IDS = new Set(['group_daily', 'group_warm'])

/** 内置字卡：英文 500 高频词 + 常用句子，中文辅助 */
function seed(): CardGroup[] {
  return buildSeedGroups()
}

/** 只替换「还是老内置库、没被改过」的数据，用户自己加的字卡不受影响 */
function migrate(groups: CardGroup[]): CardGroup[] {
  const version = loadJson<number>(SEED_VERSION_KEY, 0)
  if (version >= SEED_VERSION) return groups
  saveJson(SEED_VERSION_KEY, SEED_VERSION)
  const untouched = groups.length > 0 && groups.every((group) => LEGACY_IDS.has(group.id))
  return untouched ? seed() : groups
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
  groups.value = migrate(groups.value)

  const totalCards = computed(() => groups.value.reduce((sum, group) => sum + group.cards.length, 0))

  function findGroup(groupId: string): CardGroup | undefined {
    return groups.value.find((group) => group.id === groupId)
  }

  function childrenOf(groupId: string): CardGroup[] {
    return groups.value.filter((group) => group.parentId === groupId)
  }

  /** 顶层分组（语言层）以及没有父级的历史分组 */
  const topGroups = computed(() => groups.value.filter((group) => !group.parentId))

  /** 最底层分组：真正装着字卡、参与抽取的那一层 */
  const leafGroups = computed(() => groups.value.filter((group) => !childrenOf(group.id).length))

  /** 自己与所有上级都开启，才算真正启用 */
  function branchEnabled(group: CardGroup): boolean {
    let current: CardGroup | undefined = group
    while (current) {
      if (!current.enabled) return false
      current = current.parentId ? findGroup(current.parentId) : undefined
    }
    return true
  }

  /** 参与抽取的分组 */
  const enabledGroups = computed(() => leafGroups.value.filter((group) => group.cards.length > 0 && branchEnabled(group)))

  /** 只装着单词的分组：拼卡成句时优先从这里抽 */
  const wordGroups = computed(() => enabledGroups.value.filter((group) => group.meta?.cat === 'word'))

  /** 含所有子孙分组的字卡总数 */
  function countOf(groupId: string): number {
    const group = findGroup(groupId)
    if (!group) return 0
    return group.cards.length + childrenOf(groupId).reduce((sum, child) => sum + countOf(child.id), 0)
  }

  /** 按「语言 → 词语/句子 → 首字母」找到或新建分组 */
  function ensurePath(meta: CardMeta): CardGroup {
    const langId = groupIdOf(meta, 'lang')
    let langGroup = findGroup(langId)
    if (!langGroup) {
      langGroup = { id: langId, name: LANG_NAME[meta.lang], enabled: true, weight: 0, cards: [], parentId: null }
      groups.value.push(langGroup)
    }

    const catId = groupIdOf(meta, 'cat')
    let catGroup = findGroup(catId)
    if (!catGroup) {
      catGroup = { id: catId, name: CATEGORY_NAME[meta.cat], enabled: true, weight: 0, cards: [], parentId: langId }
      groups.value.push(catGroup)
    }

    const letterId = groupIdOf(meta, 'letter')
    let letterGroup = findGroup(letterId)
    if (!letterGroup) {
      letterGroup = {
        id: letterId,
        name: letterGroupName(meta.letter),
        enabled: true,
        weight: 2,
        cards: [],
        parentId: catId,
        meta,
      }
      groups.value.push(letterGroup)
    }
    return letterGroup
  }

  function addGroup(name = '新分组'): CardGroup {
    const group: CardGroup = { id: uid('g_'), name, enabled: true, weight: 2, cards: [] }
    groups.value.push(group)
    return group
  }

  function removeGroup(groupId: string): void {
    const ids = new Set<string>([groupId])
    // 连子分组一起删
    let added = true
    while (added) {
      added = false
      groups.value.forEach((group) => {
        if (group.parentId && ids.has(group.parentId) && !ids.has(group.id)) {
          ids.add(group.id)
          added = true
        }
      })
    }
    groups.value = groups.value.filter((group) => !ids.has(group.id))
  }

  function addCard(groupId: string, lines: string[] = ['新字卡']): CardItem | undefined {
    const group = findGroup(groupId)
    if (!group) return undefined
    const card: CardItem = { id: uid('c_'), lines }
    group.cards.push(card)
    return card
  }

  /** 自动识别语言 / 词语或句子 / 首字母后归入对应分组 */
  function addAuto(lines: string[]): CardItem | undefined {
    if (!lines.length) return undefined
    return addCard(ensurePath(classifyCard(lines)).id, lines)
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

  /** 恢复成内置字卡库（会覆盖现有字卡） */
  function resetSeed(): void {
    groups.value = buildSeedGroups()
    saveJson(SEED_VERSION_KEY, SEED_VERSION)
  }

  return {
    groups,
    topGroups,
    leafGroups,
    enabledGroups,
    wordGroups,
    totalCards,
    findGroup,
    childrenOf,
    countOf,
    ensurePath,
    addGroup,
    removeGroup,
    addCard,
    addAuto,
    updateCard,
    removeCard,
    moveCard,
    resetSeed,
  }
})
