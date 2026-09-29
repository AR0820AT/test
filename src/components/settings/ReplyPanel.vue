<script setup lang="ts">
import { watch } from 'vue'
import NumberField from '@/components/ui/NumberField.vue'
import Row from '@/components/ui/Row.vue'
import Switch from '@/components/ui/Switch.vue'
import { brain } from '@/engine/brain'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

function patchDraw(patch: Partial<typeof settings.settings.draw>): void {
  settings.settings.draw = { ...settings.settings.draw, ...patch }
}

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
      <div class="sec-title">收到消息后的回复</div>
      <Row label="自动回复">
        <Switch v-model="settings.settings.reply.enabled" />
      </Row>
      <Row label="已读不回" hint="看到了但就是不回的概率">
        <NumberField v-model="settings.settings.reply.ignoreChance" :min="0" :max="100" :step="5" suffix="%" />
      </Row>
      <Row label="回复延迟" hint="发完消息后隔多久才回，区间内随机">
        <NumberField v-model="settings.settings.reply.minDelaySec" :min="0" :max="120" suffix="秒" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.reply.maxDelaySec" :min="0" :max="120" suffix="秒" />
      </Row>
      <Row label="「正在输入」" hint="每条消息显示多久，长句子会再久一点">
        <NumberField v-model="settings.settings.reply.typingMinSec" :min="0" :max="10" :step="0.2" suffix="秒" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.reply.typingMaxSec" :min="0" :max="10" :step="0.2" suffix="秒" />
      </Row>
      <Row label="多连发间隔" hint="连着说几句时，两句之间的停顿">
        <NumberField v-model="settings.settings.reply.lineGapMinSec" :min="0" :max="10" :step="0.2" suffix="秒" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.reply.lineGapMaxSec" :min="0" :max="10" :step="0.2" suffix="秒" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">主动找你说话</div>
      <Row label="主动发字卡">
        <Switch v-model="settings.settings.proactive.enabled" />
      </Row>
      <Row label="间隔" hint="上一句说完后再等这么久，区间内随机">
        <NumberField v-model="settings.settings.proactive.minIntervalMin" :min="1" :max="720" suffix="分" />
        <span class="dash">~</span>
        <NumberField v-model="settings.settings.proactive.maxIntervalMin" :min="1" :max="720" suffix="分" />
      </Row>
    </section>

    <section class="section">
      <div class="sec-title">抽卡方式</div>
      <Row label="拼卡成句" hint="随机抽几张卡、打乱顺序拼在一起，也会把词插进句子中间">
        <Switch :model-value="settings.draw.combo" @update:model-value="patchDraw({ combo: $event })" />
      </Row>
      <div class="sec-body">
        <p class="muted">抽卡固定为纯随机。关掉拼卡后，就是抽到什么发什么。</p>
      </div>
    </section>

    <p class="muted">改完立即生效，不需要刷新页面。</p>
  </div>
</template>

<style scoped>
.dash {
  color: var(--text-2);
}
</style>
