import { computed } from 'vue'
import { defineStore } from 'pinia'
import type { Settings } from '@/types'
import { usePersisted, withDefaults } from '@/storage/persist'

export interface AccentOption {
  name: string
  value: string
}

/** 可选强调色：切换即可整体换肤 */
export const ACCENTS: AccentOption[] = [
  { name: '暗红', value: '#a01f2c' },
  { name: '酒红', value: '#7b1723' },
  { name: '砖红', value: '#b8492f' },
  { name: '绯红', value: '#d9293c' },
  { name: '紫檀', value: '#7a2148' },
  { name: '玄黑', value: '#2b2b30' },
]

export function defaultSettings(): Settings {
  return {
    paused: false,
    reply: {
      enabled: true,
      minDelaySec: 2,
      maxDelaySec: 8,
      lineGapSec: 1.2,
      typingSec: 1.5,
    },
    proactive: {
      enabled: true,
      minIntervalMin: 20,
      maxIntervalMin: 60,
    },
    draw: {
      strategy: 'shuffle',
      combo: true,
      comboChance: 45,
      wordMode: 'sentence',
    },
    ui: {
      theme: 'auto',
      accent: ACCENTS[0].value,
      animations: true,
      bubbleTail: true,
      glass: true,
    },
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = usePersisted<Settings>('settings', defaultSettings)

  // 补齐旧版本备份中缺失的字段，保证后续升级不报错
  settings.value = withDefaults(
    settings.value as unknown as Record<string, unknown>,
    defaultSettings() as unknown as Record<string, unknown>,
  ) as unknown as Settings

  // 主题换成暗红黑后，旧配色（已不在色板里）自动回落到默认色
  if (!ACCENTS.some((item) => item.value === settings.value.ui.accent)) {
    settings.value.ui.accent = ACCENTS[0].value
  }

  const reply = computed(() => settings.value.reply)
  const proactive = computed(() => settings.value.proactive)
  const ui = computed(() => settings.value.ui)
  const draw = computed(() => settings.value.draw)

  function update(patch: Partial<Settings>): void {
    settings.value = { ...settings.value, ...patch }
  }

  function updateReply(patch: Partial<Settings['reply']>): void {
    settings.value.reply = { ...settings.value.reply, ...patch }
  }

  function updateProactive(patch: Partial<Settings['proactive']>): void {
    settings.value.proactive = { ...settings.value.proactive, ...patch }
  }

  function updateUi(patch: Partial<Settings['ui']>): void {
    settings.value.ui = { ...settings.value.ui, ...patch }
  }

  return { settings, reply, proactive, ui, draw, update, updateReply, updateProactive, updateUi }
})
