<script setup lang="ts">
import { computed } from 'vue'
import Row from '@/components/ui/Row.vue'
import Segmented from '@/components/ui/Segmented.vue'
import Switch from '@/components/ui/Switch.vue'
import { ACCENTS, useSettingsStore } from '@/stores/useSettingsStore'
import type { ThemeMode } from '@/types'

const settings = useSettingsStore()

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' },
]

const theme = computed({
  get: () => settings.ui.theme,
  set: (value: ThemeMode) => settings.updateUi({ theme: value }),
})

const animations = computed({
  get: () => settings.ui.animations,
  set: (value: boolean) => settings.updateUi({ animations: value }),
})

const bubbleTail = computed({
  get: () => settings.ui.bubbleTail,
  set: (value: boolean) => settings.updateUi({ bubbleTail: value }),
})
</script>

<template>
  <div class="panel">
    <section class="section">
      <Row label="主题">
        <Segmented v-model="theme" :options="themeOptions" />
      </Row>
      <Row label="动效">
        <Switch v-model="animations" />
      </Row>
      <Row label="气泡小尖角">
        <Switch v-model="bubbleTail" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">强调色</div>
      <div class="swatches">
        <button
          v-for="accent in ACCENTS"
          :key="accent.value"
          class="swatch"
          :class="{ active: settings.ui.accent === accent.value }"
          :style="{ background: accent.value }"
          :aria-label="accent.name"
          @click="settings.updateUi({ accent: accent.value })"
        >
          <span class="dot">{{ settings.ui.accent === accent.value ? '✓' : '' }}</span>
        </button>
      </div>
      <div class="sec-body names">
        <span v-for="accent in ACCENTS" :key="accent.value" class="muted">{{ accent.name }}</span>
      </div>
    </section>

    <p class="muted">强调色会同时用在自己的气泡、按钮和开关上。</p>
  </div>
</template>

<style scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 12px 12px 4px;
}

.swatch {
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.16s ease;
}

.swatch:active {
  transform: scale(0.92);
}

.swatch.active {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.dot {
  color: #fff;
  font-size: 14px;
}

.names {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  text-align: center;
}

.names .muted {
  font-size: 10px;
}
</style>
