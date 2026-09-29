<script setup lang="ts">
import { watch } from 'vue'
import NumberField from '@/components/ui/NumberField.vue'
import Row from '@/components/ui/Row.vue'
import Switch from '@/components/ui/Switch.vue'
import { brain } from '@/engine/brain'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settings = useSettingsStore()

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
      <Row label="最大拼卡数量" hint="一句最多用几张卡拼；设为 1 就是抽到什么发什么">
        <NumberField v-model="settings.settings.draw.maxCombo" :min="1" :max="6" suffix="张" />
      </Row>
      <div class="sec-body">
        <p class="muted">
          抽卡固定为纯随机；拼卡时随机抽几张、随机顺序拼，也会把词插进句子中间。张数越少越经常只发一张卡。
        </p>
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
