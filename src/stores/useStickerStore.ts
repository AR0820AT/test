import { defineStore } from 'pinia'
import type { Sticker } from '@/types'
import { uid } from '@/utils/id'
import { usePersisted } from '@/storage/persist'
import { deleteAsset, putAsset } from '@/storage/assets'
import { compressImage } from '@/utils/image'
import { invalidateAsset } from '@/composables/useAssetUrl'

/** 表情图片统一压缩到这个尺寸 */
const STICKER_MAX = 320

export const useStickerStore = defineStore('stickers', () => {
  const stickers = usePersisted<Sticker[]>('stickers', () => [])

  /** 添加表情包：自动压缩后写入 IndexedDB */
  async function add(file: File, name?: string): Promise<Sticker | undefined> {
    try {
      const blob = await compressImage(file, STICKER_MAX, 0.8)
      const id = uid('s_')
      await putAsset(id, blob)
      const sticker: Sticker = { id, name: name || file.name.replace(/\.[^.]+$/, '').slice(0, 12) || '表情', createdAt: Date.now() }
      stickers.value.push(sticker)
      return sticker
    } catch (error) {
      console.warn('[card-chat] 表情添加失败', error)
      return undefined
    }
  }

  async function remove(id: string): Promise<void> {
    stickers.value = stickers.value.filter((item) => item.id !== id)
    invalidateAsset(id)
    await deleteAsset(id).catch(() => undefined)
  }

  function rename(id: string, name: string): void {
    const target = stickers.value.find((item) => item.id === id)
    if (target) target.name = name
  }

  return { stickers, add, remove, rename }
})
