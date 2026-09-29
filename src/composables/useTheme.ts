import { computed, ref } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null
const systemDark = ref(media ? media.matches : false)

if (media) {
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches
  })
}

/**
 * 主题统一判定：light / dark / auto
 * App 负责把结果写到 <html data-theme>，NavBar 用它决定图标状态
 */
export function useTheme() {
  const settings = useSettingsStore()
  const isDark = computed(
    () => settings.ui.theme === 'dark' || (settings.ui.theme === 'auto' && systemDark.value),
  )
  return { isDark }
}
