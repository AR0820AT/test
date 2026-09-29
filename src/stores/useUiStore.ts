import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid } from '@/utils/id'

export type SettingsTab = 'menu' | 'profile' | 'cards' | 'stickers' | 'reply' | 'appearance' | 'data'

export interface ToastItem {
  id: string
  text: string
}

export const useUiStore = defineStore('ui', () => {
  const drawerOpen = ref(false)
  const tab = ref<SettingsTab>('menu')
  const toasts = ref<ToastItem[]>([])

  function openDrawer(next: SettingsTab = 'menu'): void {
    tab.value = next
    drawerOpen.value = true
  }

  function closeDrawer(): void {
    drawerOpen.value = false
  }

  function setTab(next: SettingsTab): void {
    tab.value = next
  }

  function toast(text: string, duration = 1800): void {
    const item: ToastItem = { id: uid('t_'), text }
    toasts.value.push(item)
    setTimeout(() => {
      toasts.value = toasts.value.filter((entry) => entry.id !== item.id)
    }, duration)
  }

  return {
    drawerOpen,
    tab,
    toasts,
    openDrawer,
    closeDrawer,
    setTab,
    toast,
  }
})
