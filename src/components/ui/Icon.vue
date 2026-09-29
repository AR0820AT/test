<script setup lang="ts">
/** 轻量线性图标集合：避免引入图标库依赖 */
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 22 })

const ICONS: Record<string, string> = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3z"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M9 10h.01M15 10h.01M8.5 14.2c1 1.4 2.2 2.1 3.5 2.1s2.5-.7 3.5-2.1"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.4"/><path d="M4.5 17.5l4.8-4.6 3.4 3.2 3-2.8 3.8 3.6"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6"/>',
  cards: '<path d="M4 8.5l8-4 8 4-8 4-8-4z"/><path d="M4 13.5l8 4 8-4"/>',
  sliders: '<path d="M4 7h6"/><circle cx="15" cy="7" r="2.2"/><path d="M4 12h12"/><circle cx="9" cy="17" r="2.2"/><path d="M13.5 17H20"/>',
  database: '<ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11"/><path d="M19.5 12c0 1.7-3.4 3-7.5 3S4.5 13.7 4.5 12"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  trash: '<path d="M5 7h14M10 11v6M14 11v6M6.5 7l1 12.5h9L17.5 7M9.5 7V4.5h5V7"/>',
  quote: '<path d="M10 8.5l-5 4 5 4M5 12.5h8.5A5 5 0 0 0 18.5 7.5V6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.2"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/>',
  undo: '<path d="M9.5 8.5H15a5 5 0 0 1 0 10H8.5M9.5 8.5l3.2-3.2M9.5 8.5l3.2 3.2"/>',
  download: '<path d="M12 4v10.5M12 14.5l-4-4M12 14.5l4-4M5 19h14"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 15h.01M12 12h.01"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  up: '<path d="M12 19V6M12 6l-5.5 5.5M12 6l5.5 5.5"/>',
  down: '<path d="M12 5v13M12 18l-5.5-5.5M12 18l5.5-5.5"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  upload: '<path d="M12 19V8.5M12 8.5L8 12.5M12 8.5l4 4M5 4.5h14"/>',
}
</script>

<template>
  <svg
    class="icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[props.name] ?? ICONS.cards"
  />
</template>

<style scoped>
.icon {
  display: block;
  flex: none;
}
</style>
