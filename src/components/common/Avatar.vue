<script setup lang="ts">
import { computed } from 'vue'
import { useAssetUrl } from '@/composables/useAssetUrl'
import { useProfileStore } from '@/stores/useProfileStore'
import type { Role } from '@/types'

const props = withDefaults(defineProps<{ role: Role; size?: number }>(), { size: 40 })

const profile = useProfileStore()
const info = computed(() => profile.side(props.role))
const assetId = computed(() => info.value.avatarId ?? '')
const url = useAssetUrl(assetId)

const initial = computed(() => (info.value.nickname || '?').trim().slice(0, 1).toUpperCase())

/** 用昵称生成一个稳定的头像底色 */
const hue = computed(() => {
  const text = info.value.nickname || 'x'
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360
  return hash
})
</script>

<template>
  <div class="avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img v-if="url" :src="url" alt="头像" />
    <span
      v-else
      class="fallback"
      :style="{
        background: `linear-gradient(135deg, hsl(${hue} 62% 62%), hsl(${hue + 28} 66% 48%))`,
        fontSize: Math.round(size * 0.46) + 'px',
      }"
    >
      {{ initial }}
    </span>
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 12%;
  overflow: hidden;
  background: var(--surface-2);
  flex: none;
  box-shadow: var(--shadow-sm);
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 0.52em;
}
</style>
