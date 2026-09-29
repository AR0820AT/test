<script setup lang="ts">
import { computed } from 'vue'
import { useAssetUrl } from '@/composables/useAssetUrl'

/**
 * 把 IndexedDB 里的图片 id 渲染成 <img>
 * 单独抽成组件，这样列表里每条都能各自持有自己的 URL 状态
 */
const props = withDefaults(defineProps<{ assetId?: string | null; alt?: string }>(), {
  assetId: '',
  alt: '',
})

const id = computed(() => props.assetId ?? '')
const url = useAssetUrl(id)
</script>

<template>
  <img v-if="url" :src="url" :alt="alt" />
</template>
