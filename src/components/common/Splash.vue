<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ progress: number; failed?: boolean }>(), { failed: false })

const pct = computed(() => Math.max(0, Math.min(100, Math.round(props.progress))))
</script>

<template>
  <div class="splash">
    <div class="card">
      <div class="title">Card Chat</div>
      <div class="sub">{{ failed ? '字体没加载出来，先用系统字体显示' : '正在加载字体…' }}</div>
      <div class="bar">
        <div class="fill" :style="{ width: pct + '%' }">
          <span class="sheen" />
        </div>
      </div>
      <div class="pct">{{ pct }}%</div>
    </div>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.card {
  width: min(78vw, 320px);
  padding: 26px 24px 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat));
  border: 1px solid var(--glass-border);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  text-align: center;
}

.title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text);
}

.sub {
  margin-top: 6px;
  font-size: var(--fs-sm);
  color: var(--text-2);
}

.bar {
  margin: 18px 0 10px;
  height: 8px;
  border-radius: 99px;
  background: rgba(127, 127, 127, 0.22);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}

.fill {
  position: relative;
  height: 100%;
  border-radius: 99px;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
  transition: width 0.2s ease;
  overflow: hidden;
}

.sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: translateX(-100%);
  animation: sheen 1.4s ease-in-out infinite;
}

.pct {
  font-family: var(--font-en);
  font-size: var(--fs-sm);
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

@keyframes sheen {
  to {
    transform: translateX(100%);
  }
}
</style>
