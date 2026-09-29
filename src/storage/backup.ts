import type { BackupFile } from '@/types'
import { allAssets, putAsset, clearAssets } from './assets'
import { clearPersisted, dumpAll, replaceAll } from './persist'
import { blobToDataUrl, dataUrlToBlob } from '@/utils/image'

/** 导出全部数据为可下载 JSON */
export async function exportBackup(): Promise<string> {
  const pairs = await allAssets()
  const images: Record<string, string> = {}
  for (const [id, blob] of pairs) {
    images[id] = await blobToDataUrl(blob)
  }
  const payload: BackupFile = {
    app: 'card-chat',
    version: 1,
    createdAt: Date.now(),
    data: dumpAll(),
    images,
  }
  return JSON.stringify(payload)
}

/** 导入备份：先写配置再写图片，最后提示刷新 */
export async function importBackup(text: string): Promise<void> {
  const payload = JSON.parse(text) as BackupFile
  if (!payload || payload.app !== 'card-chat') throw new Error('不是有效的备份文件')
  replaceAll(payload.data ?? {})
  await clearAssets()
  for (const [id, dataUrl] of Object.entries(payload.images ?? {})) {
    await putAsset(id, dataUrlToBlob(dataUrl))
  }
}

/** 清空全部数据（不可恢复，调用前需二次确认） */
export async function wipeAll(): Promise<void> {
  clearPersisted()
  await clearAssets()
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
