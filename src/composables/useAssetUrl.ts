import { ref, watch, type Ref } from 'vue'
import { getAsset } from '@/storage/assets'

const cache = new Map<string, string>()

/**
 * 把 IndexedDB 中的图片 id 转成可直接用于 <img src> 的地址
 */
export function useAssetUrl(source: Ref<string | null | undefined>): Ref<string> {
  const url = ref('')

  watch(
    source,
    async (id) => {
      url.value = ''
      if (!id) return
      const cached = cache.get(id)
      if (cached) {
        url.value = cached
        return
      }
      const blob = await getAsset(id)
      if (!blob) return
      const objectUrl = URL.createObjectURL(blob)
      cache.set(id, objectUrl)
      url.value = objectUrl
    },
    { immediate: true },
  )

  return url
}

/** 让外部（如删除表情）可以失效掉缓存 */
export function invalidateAsset(id: string): void {
  const old = cache.get(id)
  if (old) URL.revokeObjectURL(old)
  cache.delete(id)
}
