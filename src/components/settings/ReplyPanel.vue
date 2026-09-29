<script setup lang="ts">
import { computed, watch } from 'vue'
import NumberField from '@/components/ui/NumberField.vue'
import Row from '@/components/ui/Row.vue'
import Segmented from '@/components/ui/Segmented.vue'
import Switch from '@/components/ui/Switch.vue'
import { brain } from '@/engine/brain'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { DrawStrategy } from '@/types'

const settings = useSettingsStore()

const strategies: { label: string; value: DrawStrategy }[] = [
  { label: '随机', value: 'random' },
  { label: '顺序', value: 'sequential' },
  { label: '不重复', value: 'shuffle' },
]

const strategy = computed({
  get: () => settings.draw.strategy,
  set: (value: DrawStrategy) => {
    settings.settings.draw = { ...settings.settings.draw, strategy: value }
  },
})

// 主动消息的间隔改了要立刻重排下一次时间
watch(
  () => settings.proactive,
  () => brain.restartProactive(),
  { deep: true },
)
</script>

<template>
  <div class="panel">
    <section class="section">
      <Row label="暂停全部自动化" hint="暂停后对方不回复，也不会主动发消息">
        <Switch v-model="settings.settings.paused" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">收到消息后的回复</div>
      <Row label="自动回复">
        <Switch v-model="settings.settings.reply.enabled" />
      </Row>
      <Row label="回复延迟" hint="发完消息后多久才回">
        <NumberField v-model="settings.settings.reply.minDelaySec" :min="0" :max="120" suffix="秒" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.reply.maxDelaySec" :min="0" :max="120" suffix="秒" />
      </Row>
      <Row label="多连发间隔" hint="一张卡有多行时每行之间的停顿">
        <NumberField v-model="settings.settings.reply.lineGapSec" :min="0" :max="10" :step="0.2" suffix="秒" />
      </Row>
      <Row label="「正在输入」时长">
        <NumberField v-model="settings.settings.reply.typingSec" :min="0" :max="10" :step="0.5" suffix="秒" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">主动找你说话</div>
      <Row label="主动发字卡">
        <Switch v-model="settings.settings.proactive.enabled" />
      </Row>
      <Row label="间隔" hint="上一句说完后再等这么久">
        <NumberField v-model="settings.settings.proactive.minIntervalMin" :min="1" :max="720" suffix="分" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.proactive.maxIntervalMin" :min="1" :max="720" suffix="分" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">抽卡方式</div>
      <Row label="策略" hint="不重复＝一轮里每张都会出现一次">
        <Segmented v-model="strategy" :options="strategies" />
      </Row>
    </section>

    <p class="muted">改完立即生效，不需要刷新页面。</p>
  </div>
</template>

<style scoped>
.dash {
  color: var(--text-2);
}
</style>
